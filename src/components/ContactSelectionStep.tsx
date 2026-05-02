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
} from "@mui/material";
import {
    SearchOutlined,
    CloudUploadOutlined,
    CloseCircleOutlined,
    FileTextOutlined,
} from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { contactService } from "service/contact.service";
import { useEffect, useRef, useState } from "react";
import { templateService } from "service/template.service";
import { useSnackbar } from "notistack";

const ContactSelectionStep = ({ channelId, templateData, onSend }: any) => {
    const { enqueueSnackbar } = useSnackbar();
    const [selected, setSelected] = useState<string[]>([]);
    const [file, setFile] = useState<File | null>(null);
    const [search, setSearch] = useState("");
    const [dragging, setDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { data: contacts = [], isLoading } = useQuery({
        queryKey: ["contacts", channelId, search],
        queryFn: () => contactService.getContacts(channelId, search),
        select: (res: any) => res.data || [],
    });

    /* ---- selection helpers ---- */
    const toggle = (id: string) =>
        setSelected((prev) =>
            prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
        );

    const allSelected = contacts.length > 0 && contacts.every((c: any) => selected.includes(c._id));
    const someSelected = contacts.some((c: any) => selected.includes(c._id)) && !allSelected;

    const toggleAll = () => {
        if (allSelected) {
            setSelected((prev) => prev.filter((id) => !contacts.some((c: any) => c._id === id)));
        } else {
            const newIds = contacts.map((c: any) => c._id).filter((id: string) => !selected.includes(id));
            setSelected((prev) => [...prev, ...newIds]);
        }
    };

    /* ---- file drag-and-drop ---- */
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragging(false);
        const dropped = e.dataTransfer.files[0];
        if (dropped && (dropped.name.endsWith(".csv") || dropped.name.endsWith(".xlsx"))) {
            setFile(dropped);
        } else {
            enqueueSnackbar("Only .csv or .xlsx files are supported", { variant: "error" });
        }
    };

    /* ---- send handler ---- */
    const handleSend = async () => {
        try {
            if (!selected.length && !file) {
                enqueueSnackbar("Please select contacts or upload a file", { variant: "error" });
                return;
            }
            if (templateData.bodyParams?.some((v: string) => !v)) {
                enqueueSnackbar("Please fill all template values", { variant: "error" });
                return;
            }

            const formData = new FormData();
            formData.append("templateName", templateData.templateName);
            formData.append("bodyParams", JSON.stringify(templateData.bodyParams || []));
            if (selected.length) formData.append("contacts", JSON.stringify(selected));
            if (file) formData.append("file", file);

            await templateService.sendBulkTemplate(channelId, formData);
            enqueueSnackbar("Bulk sent successfully!", { variant: "success" });
        } catch (err) {
            console.error(err);
            enqueueSnackbar("Error sending bulk", { variant: "error" });
        }
    };

    useEffect(() => {
        if (onSend) onSend.current = handleSend;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selected, file, templateData]);

    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, height: "100%" }}>

            {/* ===== FILE UPLOAD ZONE ===== */}
            <Box>
                <Typography variant="subtitle2" mb={1}>
                    Upload Contacts File <Typography component="span" variant="caption" color="text.secondary">(CSV / XLSX)</Typography>
                </Typography>

                {file ? (
                    /* File selected — show pill */
                    <Stack
                        direction="row"
                        alignItems="center"
                        spacing={1.5}
                        sx={{
                            px: 2,
                            py: 1.5,
                            border: "1px solid",
                            borderColor: "success.main",
                            borderRadius: 2,
                            bgcolor: "success.lighter",
                        }}
                    >
                        <FileTextOutlined style={{ fontSize: 20, color: "#52c41a" }} />
                        <Typography variant="body2" fontWeight={500} sx={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {file.name}
                        </Typography>
                        <Chip
                            label={`${(file.size / 1024).toFixed(1)} KB`}
                            size="small"
                            color="success"
                            variant="outlined"
                        />
                        <IconButton
                            size="small"
                            onClick={() => setFile(null)}
                            sx={{ color: "error.main" }}
                        >
                            <CloseCircleOutlined />
                        </IconButton>
                    </Stack>
                ) : (
                    /* Drop zone */
                    <Paper
                        variant="outlined"
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                        onDragLeave={() => setDragging(false)}
                        onDrop={handleDrop}
                        sx={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 1,
                            py: 3,
                            cursor: "pointer",
                            borderRadius: 2,
                            borderStyle: "dashed",
                            borderColor: dragging ? "primary.main" : "divider",
                            bgcolor: dragging ? "primary.lighter" : "background.paper",
                            transition: "all 0.2s",
                            "&:hover": { borderColor: "primary.main", bgcolor: "action.hover" },
                        }}
                    >
                        <CloudUploadOutlined style={{ fontSize: 32, color: "#1890ff" }} />
                        <Typography variant="body2" color="text.secondary">
                            Drag & drop or <Typography component="span" color="primary" fontWeight={600}>browse</Typography> to upload
                        </Typography>
                        <Typography variant="caption" color="text.disabled">Supports .csv, .xlsx</Typography>
                        <input
                            ref={fileInputRef}
                            hidden
                            type="file"
                            accept=".csv,.xlsx"
                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                        />
                    </Paper>
                )}
            </Box>

            {/* ===== DIVIDER WITH OR ===== */}
            <Stack direction="row" alignItems="center" spacing={1}>
                <Box sx={{ flex: 1, height: "1px", bgcolor: "divider" }} />
                <Typography variant="caption" color="text.disabled" fontWeight={600}>OR SELECT MANUALLY</Typography>
                <Box sx={{ flex: 1, height: "1px", bgcolor: "divider" }} />
            </Stack>

            {/* ===== CONTACTS TABLE ===== */}
            <Box sx={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
                {/* TOOLBAR */}
                <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1.5} spacing={2}>
                    <TextField
                        size="small"
                        placeholder="Search contacts..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchOutlined />
                                </InputAdornment>
                            ),
                        }}
                        sx={{ width: 280 }}
                    />

                    {selected.length > 0 && (
                        <Chip
                            label={`${selected.length} selected`}
                            color="primary"
                            size="small"
                            onDelete={() => setSelected([])}
                        />
                    )}
                </Stack>

                {/* TABLE */}
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
                                            checked={allSelected}
                                            indeterminate={someSelected}
                                            onChange={toggleAll}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Phone</TableCell>
                                </TableRow>
                            </TableHead>

                            <TableBody>
                                {contacts.map((c: any) => {
                                    const isSelected = selected.includes(c._id);
                                    return (
                                        <TableRow
                                            key={c._id}
                                            hover
                                            selected={isSelected}
                                            onClick={() => toggle(c._id)}
                                            sx={{ cursor: "pointer" }}
                                        >
                                            <TableCell padding="checkbox">
                                                <Checkbox checked={isSelected} size="small" />
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
