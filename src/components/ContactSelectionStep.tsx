import {
    Box,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    Checkbox,
    Typography,
    TextField,
    InputAdornment,
    Chip,
    Stack,
    CircularProgress,
    Paper,
    IconButton,
    Button,
    Tooltip,
    Alert,
} from "@mui/material";
import {
    SearchOutlined,
    CloudUploadOutlined,
    CloseCircleOutlined,
    FileTextOutlined,
    WifiOutlined,
    AppstoreOutlined,
} from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { contactService } from "service/contact.service";
import { channelService } from "service/channel.service";
import { campaignService, CampaignFilter } from "service/campaign.service";
import { useEffect, useRef, useState } from "react";
import { useSnackbar } from "notistack";
import { parseFileToPhones } from "utils/fileParser";

/*
  SelectionState describes HOW contacts are selected, not individual IDs.
  - mode "manual"      → explicit _id array (small counts, fine to keep)
  - mode "channel"     → all contacts in the current channel
  - mode "all_channels"→ contacts across all channels, deduplicated by phone
*/
export interface SelectionState {
    mode: "manual" | "channel" | "all_channels";
    ids?: string[];           // only for "manual"
    channelIds?: string[];    // only for "all_channels"
    count: number;            // resolved contact count (for display)
}

interface ContactSelectionStepProps {
    channelId: string;
    templateData: any;
    /** Parent calls this to execute the send. Returns the new campaign ID. */
    onSend: React.MutableRefObject<(() => Promise<string | null>) | null>;
}

const ContactSelectionStep = ({ channelId, templateData, onSend }: ContactSelectionStepProps) => {
    const { enqueueSnackbar } = useSnackbar();

    // ── Visible contact table (manual selection, paginated 20 rows) ──
    const [search, setSearch] = useState("");
    const [manualIds, setManualIds] = useState<string[]>([]);

    // ── Bulk selection state ──
    const [selection, setSelection] = useState<SelectionState>({ mode: "manual", ids: [], count: 0 });
    const [bulkLoading, setBulkLoading] = useState<"channel" | "all_channels" | null>(null);

    // ── File upload ──
    const [file, setFile] = useState<File | null>(null);
    const [parsedPhones, setParsedPhones] = useState<string[]>([]);
    const [parsing, setParsing] = useState(false);
    const [dragging, setDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Parse file in the browser — no upload needed
    useEffect(() => {
        if (!file) { setParsedPhones([]); return; }
        setParsing(true);
        parseFileToPhones(file)
            .then((phones) => {
                const unique = [...new Set(phones.filter(Boolean))];
                setParsedPhones(unique);
                if (!unique.length) enqueueSnackbar("No phone numbers found in file", { variant: "warning" });
            })
            .catch(() => enqueueSnackbar("Could not parse file", { variant: "error" }))
            .finally(() => setParsing(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [file]);

    const { data: contacts = [], isLoading } = useQuery({
        queryKey: ["contacts", channelId, search],
        queryFn: () => contactService.getContacts(channelId, search),
        select: (res: any) => res.data || [],
    });

    /* ── manual checkbox helpers ── */
    const toggle = (id: string) => {
        setManualIds((prev) =>
            prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
        );
        // switch back to manual mode if we start ticking checkboxes
        setSelection((prev) =>
            prev.mode !== "manual"
                ? { mode: "manual", ids: manualIds, count: manualIds.length }
                : prev
        );
    };

    const allPageSelected =
        contacts.length > 0 && contacts.every((c: any) => manualIds.includes(c._id));
    const somePageSelected =
        contacts.some((c: any) => manualIds.includes(c._id)) && !allPageSelected;

    const togglePageAll = () => {
        if (allPageSelected) {
            setManualIds((prev) => prev.filter((id) => !contacts.some((c: any) => c._id === id)));
        } else {
            const newIds = contacts
                .map((c: any) => c._id)
                .filter((id: string) => !manualIds.includes(id));
            setManualIds((prev) => [...prev, ...newIds]);
        }
        setSelection({ mode: "manual", ids: manualIds, count: manualIds.length });
    };

    // Sync manual selection count when manualIds change
    useEffect(() => {
        if (selection.mode === "manual") {
            setSelection({ mode: "manual", ids: manualIds, count: manualIds.length });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [manualIds]);

    /* ── Select All (This Channel) — only fetches COUNT, no IDs ── */
    const handleSelectAllChannel = async () => {
        setBulkLoading("channel");
        try {
            const count = await campaignService.getContactCount(channelId);
            setSelection({ mode: "channel", count });
            setManualIds([]);
            enqueueSnackbar(`All ${count} contacts in this channel selected`, { variant: "success" });
        } catch {
            enqueueSnackbar("Failed to count channel contacts", { variant: "error" });
        } finally {
            setBulkLoading(null);
        }
    };

    /* ── Select All Channels — fetch channels + sum counts, no IDs ── */
    const handleSelectAllChannels = async () => {
        setBulkLoading("all_channels");
        try {
            const res = await channelService.getChannels();
            const channels: any[] = res.data || [];
            const channelIds = channels.map((ch: any) => ch._id as string);

            // Fetch counts in parallel
            const counts = await Promise.all(
                channelIds.map((id) => campaignService.getContactCount(id))
            );
            // We show sum of counts but actual dedup happens server-side — inform user
            const totalCount = counts.reduce((a, b) => a + b, 0);

            setSelection({ mode: "all_channels", channelIds, count: totalCount });
            setManualIds([]);
            enqueueSnackbar(
                `All contacts across ${channels.length} channel${channels.length !== 1 ? "s" : ""} selected (duplicates will be removed on send)`,
                { variant: "success" }
            );
        } catch {
            enqueueSnackbar("Failed to count contacts across channels", { variant: "error" });
        } finally {
            setBulkLoading(null);
        }
    };

    /* ── Clear bulk selection ── */
    const clearSelection = () => {
        setSelection({ mode: "manual", ids: [], count: 0 });
        setManualIds([]);
    };

    /* ── File drag-and-drop ── */
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragging(false);
        const dropped = e.dataTransfer.files[0];
        const allowed = [".csv", ".xlsx", ".xls", ".vcf", ".vcard"];
        if (dropped && allowed.some((ext) => dropped.name.toLowerCase().endsWith(ext))) {
            setFile(dropped);
        } else {
            enqueueSnackbar("Supported formats: .csv, .xlsx, .vcf", { variant: "error" });
        }
    };

    /* ── Build CampaignFilter from current selection state ── */
    const buildFilter = (): CampaignFilter | null => {
        if (file) {
            if (!parsedPhones.length) return null;
            return { type: "phone_list", phones: parsedPhones };
        }
        if (selection.mode === "manual") {
            if (!manualIds.length) return null;
            return { type: "selected_ids", ids: manualIds };
        }
        if (selection.mode === "channel") {
            return { type: "channel" };
        }
        if (selection.mode === "all_channels") {
            return { type: "all_channels", channel_ids: selection.channelIds };
        }
        return null;
    };

    const hasSelection =
        (file !== null && parsedPhones.length > 0) ||
        (selection.mode === "manual" && manualIds.length > 0) ||
        (selection.mode !== "manual" && selection.count > 0);

    /* ── Send handler — returns campaignId string ── */
    const handleSend = async (): Promise<string | null> => {
        if (!hasSelection) {
            enqueueSnackbar(
                file && !parsedPhones.length
                    ? "No phone numbers found in the uploaded file"
                    : "Please select contacts or upload a file",
                { variant: "error" }
            );
            return null;
        }
        if (templateData.bodyParams?.some((v: string) => !v)) {
            enqueueSnackbar("Please fill all template values", { variant: "error" });
            return null;
        }

        const filter = buildFilter();
        if (!filter) {
            enqueueSnackbar("No contacts selected", { variant: "error" });
            return null;
        }

        try {
            const { campaignId } = await campaignService.create(channelId, {
                templateName: templateData.templateName,
                bodyParams: templateData.bodyParams || [],
                language: templateData.language,
                filter,
                headerImageUrl: templateData.headerImageUrl || undefined,
            });
            return campaignId;
        } catch (err: any) {
            enqueueSnackbar(
                err?.response?.data?.message || "Failed to start campaign",
                { variant: "error" }
            );
            return null;
        }
    };

    useEffect(() => {
        if (onSend) onSend.current = handleSend;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selection, manualIds, file, parsedPhones, templateData]);

    /* ── Selection summary chip ── */
    const selectionLabel =
        selection.mode === "manual" && manualIds.length > 0
            ? `${manualIds.length} selected`
            : selection.mode === "channel" && selection.count > 0
            ? `All ${selection.count} (this channel)`
            : selection.mode === "all_channels" && selection.count > 0
            ? `All ${selection.count} (all channels)`
            : null;

    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, height: "100%" }}>

            {/* ── FILE UPLOAD ── */}
            <Box>
                <Typography variant="subtitle2" mb={1}>
                    Upload Contacts File{" "}
                    <Typography component="span" variant="caption" color="text.secondary">
                        (CSV / XLSX / VCF · max 10 MB)
                    </Typography>
                </Typography>

                {file ? (
                    <Stack
                        direction="row" alignItems="center" spacing={1.5}
                        sx={{ px: 2, py: 1.5, border: "1px solid", borderColor: "success.main", borderRadius: 2, bgcolor: "success.lighter" }}
                    >
                        <FileTextOutlined style={{ fontSize: 20, color: "#52c41a" }} />
                        <Typography variant="body2" fontWeight={500} sx={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {file.name}
                        </Typography>
                        {parsing ? (
                            <CircularProgress size={16} />
                        ) : parsedPhones.length > 0 ? (
                            <Chip label={`${parsedPhones.length} contacts`} size="small" color="success" />
                        ) : (
                            <Chip label="No phones found" size="small" color="warning" variant="outlined" />
                        )}
                        <IconButton size="small" onClick={() => { setFile(null); setParsedPhones([]); }} sx={{ color: "error.main" }}>
                            <CloseCircleOutlined />
                        </IconButton>
                    </Stack>
                ) : (
                    <Paper
                        variant="outlined"
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                        onDragLeave={() => setDragging(false)}
                        onDrop={handleDrop}
                        sx={{
                            display: "flex", flexDirection: "column", alignItems: "center",
                            justifyContent: "center", gap: 1, py: 3, cursor: "pointer",
                            borderRadius: 2, borderStyle: "dashed",
                            borderColor: dragging ? "primary.main" : "divider",
                            bgcolor: dragging ? "primary.lighter" : "background.paper",
                            transition: "all 0.2s",
                            "&:hover": { borderColor: "primary.main", bgcolor: "action.hover" },
                        }}
                    >
                        <CloudUploadOutlined style={{ fontSize: 32, color: "#1890ff" }} />
                        <Typography variant="body2" color="text.secondary">
                            Drag & drop or{" "}
                            <Typography component="span" color="primary" fontWeight={600}>browse</Typography>{" "}
                            to upload
                        </Typography>
                        <Typography variant="caption" color="text.disabled">
                            Supports .csv, .xlsx, .vcf · Max 10 MB
                        </Typography>
                        <input
                            ref={fileInputRef} hidden type="file"
                            accept=".csv,.xlsx,.xls,.vcf,.vcard"
                            onChange={(e) => { setFile(e.target.files?.[0] || null); if (e.target) e.target.value = ""; }}
                        />
                    </Paper>
                )}
            </Box>

            {/* ── OR DIVIDER ── */}
            <Stack direction="row" alignItems="center" spacing={1}>
                <Box sx={{ flex: 1, height: "1px", bgcolor: "divider" }} />
                <Typography variant="caption" color="text.disabled" fontWeight={600}>OR SELECT MANUALLY</Typography>
                <Box sx={{ flex: 1, height: "1px", bgcolor: "divider" }} />
            </Stack>

            {/* ── BULK SELECTION BANNER ── */}
            {selection.mode !== "manual" && selection.count > 0 && (
                <Alert
                    severity="info"
                    sx={{ py: 0.75, "& .MuiAlert-message": { display: "flex", alignItems: "center", gap: 1, width: "100%" } }}
                    action={
                        <Button size="small" color="inherit" onClick={clearSelection} sx={{ fontWeight: 700, fontSize: 11 }}>
                            Clear
                        </Button>
                    }
                >
                    <strong>{selection.count.toLocaleString()}</strong> contacts selected
                    {selection.mode === "all_channels" && " across all channels — duplicates auto-removed on send"}
                </Alert>
            )}

            {/* ── CONTACTS TABLE ── */}
            <Box sx={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
                {/* TOOLBAR */}
                <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1.5} spacing={1} flexWrap="wrap" gap={1}>
                    <TextField
                        size="small"
                        placeholder="Search contacts..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start"><SearchOutlined /></InputAdornment>
                            ),
                        }}
                        sx={{ width: 200 }}
                    />

                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                        {/* Select All This Channel */}
                        <Tooltip title="Select all contacts from this channel (runs in background, no ID download)">
                            <Button
                                size="small" variant="outlined"
                                startIcon={bulkLoading === "channel" ? <CircularProgress size={12} /> : <WifiOutlined />}
                                disabled={!!bulkLoading}
                                onClick={handleSelectAllChannel}
                                sx={{
                                    borderRadius: "8px", fontSize: 12, fontWeight: 600, textTransform: "none",
                                    borderColor: "#065f46", color: "#065f46",
                                    "&:hover": { bgcolor: "#ecfdf5", borderColor: "#065f46" },
                                }}
                            >
                                {bulkLoading === "channel" ? "Loading…" : "This Channel"}
                            </Button>
                        </Tooltip>

                        {/* Select All Channels */}
                        <Tooltip title="Select contacts from all your channels (duplicates removed on send)">
                            <Button
                                size="small" variant="outlined"
                                startIcon={bulkLoading === "all_channels" ? <CircularProgress size={12} /> : <AppstoreOutlined />}
                                disabled={!!bulkLoading}
                                onClick={handleSelectAllChannels}
                                sx={{
                                    borderRadius: "8px", fontSize: 12, fontWeight: 600, textTransform: "none",
                                    borderColor: "#1d4ed8", color: "#1d4ed8",
                                    "&:hover": { bgcolor: "#eff6ff", borderColor: "#1d4ed8" },
                                }}
                            >
                                {bulkLoading === "all_channels" ? "Loading…" : "All Channels"}
                            </Button>
                        </Tooltip>

                        {selectionLabel && (
                            <Chip
                                label={selectionLabel}
                                color="primary" size="small"
                                onDelete={clearSelection}
                            />
                        )}
                    </Stack>
                </Stack>

                {/* TABLE — shows 20 contacts for manual picking */}
                <Box sx={{ flex: 1, overflow: "auto", border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
                    {isLoading ? (
                        <Box display="flex" justifyContent="center" alignItems="center" height={200}>
                            <CircularProgress size={28} />
                        </Box>
                    ) : contacts.length === 0 ? (
                        <Box display="flex" justifyContent="center" alignItems="center" height={200}>
                            <Typography variant="body2" color="text.secondary">
                                {search ? "No contacts match your search" : "No contacts found"}
                            </Typography>
                        </Box>
                    ) : (
                        <Table stickyHeader size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell padding="checkbox" sx={{ bgcolor: "background.paper" }}>
                                        <Checkbox
                                            checked={allPageSelected}
                                            indeterminate={somePageSelected}
                                            onChange={togglePageAll}
                                            size="small"
                                            disabled={selection.mode !== "manual"}
                                        />
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Phone</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {contacts.map((c: any) => {
                                    const isSelected =
                                        selection.mode === "manual" && manualIds.includes(c._id);
                                    return (
                                        <TableRow
                                            key={c._id}
                                            hover
                                            selected={isSelected}
                                            onClick={() => {
                                                if (selection.mode !== "manual") {
                                                    clearSelection();
                                                }
                                                toggle(c._id);
                                            }}
                                            sx={{ cursor: "pointer" }}
                                        >
                                            <TableCell padding="checkbox">
                                                <Checkbox
                                                    checked={isSelected}
                                                    size="small"
                                                    disabled={selection.mode !== "manual"}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" fontWeight={isSelected ? 600 : 400}>
                                                    {c.name || "—"}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" color="text.secondary">
                                                    {c.phone}
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    )}
                </Box>
            </Box>
        </Box>
    );
};

export default ContactSelectionStep;
