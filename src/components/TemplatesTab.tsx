import {
    Box,
    Table,
    TableContainer,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    TablePagination,
    IconButton,
    Menu,
    MenuItem,
    Button,
    CircularProgress,
    Chip,
    Stack,
    Typography,
    Paper,
    Skeleton,
    Tooltip,
    Divider,
    InputAdornment,
    TextField,
    ListItemIcon,
    ListItemText,
} from "@mui/material";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import AddIcon from "@mui/icons-material/Add";
import SyncIcon from "@mui/icons-material/Sync";
import SendIcon from "@mui/icons-material/Send";
import SearchIcon from "@mui/icons-material/Search";
import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import HighlightOffIcon from "@mui/icons-material/HighlightOff";
import PauseCircleOutlineIcon from "@mui/icons-material/PauseCircleOutline";
import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CreateTemplatePayload, templateService } from "service/template.service";
import { useSnackbar } from "notistack";
import TemplateModal from "./TemplatePopup";
import BulkFlowModal from "./BulkFlowModal";

// ── visual maps ────────────────────────────────────────────────────────────
const STATUS_STYLE: Record<
    string,
    { color: string; bg: string; border: string; icon: any }
> = {
    APPROVED: {
        color: "#16a34a",
        bg: "#f0fdf4",
        border: "#bbf7d0",
        icon: <CheckCircleOutlineIcon sx={{ fontSize: 12, color: "#16a34a !important" }} />,
    },
    PENDING: {
        color: "#d97706",
        bg: "#fffbeb",
        border: "#fde68a",
        icon: <HourglassEmptyIcon sx={{ fontSize: 12, color: "#d97706 !important" }} />,
    },
    REJECTED: {
        color: "#dc2626",
        bg: "#fef2f2",
        border: "#fecaca",
        icon: <HighlightOffIcon sx={{ fontSize: 12, color: "#dc2626 !important" }} />,
    },
    PAUSED: {
        color: "#6b7280",
        bg: "#f3f4f6",
        border: "#e5e7eb",
        icon: <PauseCircleOutlineIcon sx={{ fontSize: 12, color: "#6b7280 !important" }} />,
    },
    DISABLED: {
        color: "#6b7280",
        bg: "#f3f4f6",
        border: "#e5e7eb",
        icon: <PauseCircleOutlineIcon sx={{ fontSize: 12, color: "#6b7280 !important" }} />,
    },
};

const CATEGORY_STYLE: Record<string, { color: string; bg: string }> = {
    UTILITY: { color: "#3b82f6", bg: "#eff6ff" },
    MARKETING: { color: "#8b5cf6", bg: "#f5f3ff" },
    AUTHENTICATION: { color: "#f59e0b", bg: "#fffbeb" },
};

const TemplatesTab = () => {
    const { id: channelId } = useParams();
    const { enqueueSnackbar } = useSnackbar();

    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(20);
    const [cursors, setCursors] = useState<string[]>([]);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState("");

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedRow, setSelectedRow] = useState<any>(null);
    const [bulkFlowOpen, setBulkFlowOpen] = useState(false);

    const [openModal, setOpenModal] = useState(false);
    const [editData, setEditData] = useState<any>(null);

    const queryClient = useQueryClient();

    const createMutation = useMutation({
        mutationFn: (payload: any) => templateService.createTemplate(channelId!, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["templates", channelId] });
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, payload }: any) =>
            templateService.updateTemplate(channelId!, id, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["templates", channelId] });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (templateName: string) =>
            templateService.deleteTemplate(channelId!, templateName),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["templates", channelId] });
        },
    });

    const syncMutation = useMutation({
        mutationFn: () => templateService.syncTemplates(channelId!),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["templates", channelId] });
            enqueueSnackbar("Templates synced from Meta", { variant: "success" });
        },
    });

    const { data = [], isLoading } = useQuery({
        queryKey: ["templates", channelId, page, rowsPerPage],
        queryFn: async () => {
            const after = cursors[page - 1];
            const res = await templateService.getTemplates(channelId!, {
                limit: rowsPerPage,
                after: page === 0 ? undefined : after,
                page: page + 1,
            });
            setTotal(res.total || 0);
            const nextCursor = res?.paging?.cursors?.after;
            setCursors((prev) => {
                const updated = [...prev];
                updated[page] = nextCursor;
                return updated;
            });
            return res.data;
        },
        enabled: !!channelId,
    });

    const filtered = useMemo(() => {
        if (!search) return data;
        const q = search.toLowerCase();
        return (data as any[]).filter(
            (r) =>
                r.name?.toLowerCase().includes(q) ||
                r.category?.toLowerCase().includes(q) ||
                r.status?.toLowerCase().includes(q)
        );
    }, [data, search]);

    const handleMenuClick = (event: any, row: any) => {
        setAnchorEl(event.currentTarget);
        setSelectedRow(row);
    };

    const handleCloseMenu = () => {
        setAnchorEl(null);
        setSelectedRow(null);
    };

    const handleDelete = async () => {
        if (!selectedRow?.name) return;
        try {
            await deleteMutation.mutateAsync(selectedRow.name);
            enqueueSnackbar("Template deleted successfully", { variant: "success" });
            handleCloseMenu();
        } catch (err: any) {
            enqueueSnackbar(
                err?.response?.data?.message || "Failed to delete template",
                { variant: "error" }
            );
        }
    };

    return (
        <Box>
            {/* ── HEADER ── */}
            <Stack
                direction={{ xs: "column", md: "row" }}
                alignItems={{ md: "center" }}
                justifyContent="space-between"
                spacing={2}
                mb={2.5}
            >
                <Box>
                    <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
                        <ArticleOutlinedIcon sx={{ fontSize: 18, color: "#064e3b" }} />
                        <Typography fontSize={17} fontWeight={800} color="#111827">
                            Templates
                        </Typography>
                        {!isLoading && (
                            <Chip
                                label={total}
                                size="small"
                                sx={{
                                    height: 20,
                                    fontSize: 11,
                                    fontWeight: 700,
                                    bgcolor: "#f0fdf4",
                                    color: "#16a34a",
                                    border: "1px solid #bbf7d0",
                                    borderRadius: "6px",
                                }}
                            />
                        )}
                    </Stack>
                    <Typography fontSize={12.5} color="#6b7280">
                        Manage WhatsApp message templates approved by Meta.
                    </Typography>
                </Box>

                <Stack direction="row" spacing={1} flexWrap="wrap">
                    <TextField
                        size="small"
                        placeholder="Search templates…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon sx={{ fontSize: 17, color: "#9ca3af" }} />
                                </InputAdornment>
                            ),
                        }}
                        sx={{
                            width: { xs: "100%", sm: 220 },
                            "& .MuiOutlinedInput-root": {
                                borderRadius: "10px",
                                fontSize: 13,
                                bgcolor: "#fafafa",
                            },
                        }}
                    />
                    <Tooltip title="Sync templates from Meta">
                        <span>
                            <IconButton
                                onClick={() => syncMutation.mutate()}
                                disabled={syncMutation.isPending}
                                sx={{
                                    border: "1px solid #e5e7eb",
                                    borderRadius: "10px",
                                    color: "#374151",
                                    "&:hover": { bgcolor: "#f9fafb", borderColor: "#d1d5db" },
                                }}
                            >
                                {syncMutation.isPending ? (
                                    <CircularProgress size={18} sx={{ color: "#064e3b" }} />
                                ) : (
                                    <SyncIcon sx={{ fontSize: 18 }} />
                                )}
                            </IconButton>
                        </span>
                    </Tooltip>
                    <Button
                        variant="outlined"
                        startIcon={<SendIcon sx={{ fontSize: 16 }} />}
                        onClick={() => setBulkFlowOpen(true)}
                        sx={{
                            borderRadius: "10px",
                            textTransform: "none",
                            fontWeight: 700,
                            fontSize: 13,
                            borderColor: "#bbf7d0",
                            color: "#064e3b",
                            bgcolor: "#f0fdf4",
                            "&:hover": { bgcolor: "#dcfce7", borderColor: "#86efac" },
                        }}
                    >
                        Send Bulk
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon sx={{ fontSize: 17 }} />}
                        onClick={() => {
                            setEditData(null);
                            setOpenModal(true);
                        }}
                        sx={{
                            borderRadius: "10px",
                            textTransform: "none",
                            fontWeight: 700,
                            fontSize: 13,
                            bgcolor: "#064e3b",
                            "&:hover": { bgcolor: "#065f46" },
                            boxShadow: "none",
                        }}
                    >
                        New Template
                    </Button>
                </Stack>
            </Stack>

            {/* ── TABLE CARD ── */}
            <Paper
                variant="outlined"
                sx={{
                    borderRadius: "14px",
                    borderColor: "#e5e7eb",
                    overflow: "hidden",
                }}
            >
                <TableContainer
                    sx={{
                        maxHeight: 620,
                        "&::-webkit-scrollbar": { width: 6, height: 6 },
                        "&::-webkit-scrollbar-thumb": {
                            bgcolor: "#e5e7eb",
                            borderRadius: 4,
                        },
                    }}
                >
                    <Table stickyHeader>
                        <TableHead>
                            <TableRow>
                                {[
                                    { id: "name", label: "Name", align: "left" },
                                    { id: "status", label: "Status", align: "left" },
                                    { id: "category", label: "Category", align: "left" },
                                    { id: "language", label: "Language", align: "left" },
                                    { id: "actions", label: "", align: "right" },
                                ].map((col) => (
                                    <TableCell
                                        key={col.id}
                                        align={col.align as any}
                                        sx={{
                                            bgcolor: "#fafafa",
                                            color: "#6b7280",
                                            fontSize: 11,
                                            fontWeight: 700,
                                            textTransform: "uppercase",
                                            letterSpacing: 0.5,
                                            borderBottom: "1px solid #f3f4f6",
                                            py: 1.25,
                                        }}
                                    >
                                        {col.label}
                                    </TableCell>
                                ))}
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {isLoading
                                ? Array.from(new Array(5)).map((_, index) => (
                                    <TableRow key={index}>
                                        {Array.from({ length: 5 }).map((__, j) => (
                                            <TableCell key={j} sx={{ py: 1.5 }}>
                                                <Skeleton variant="rounded" height={20} />
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                                : filtered.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} sx={{ borderBottom: "none" }}>
                                            <Box sx={{ textAlign: "center", py: 7 }}>
                                                <Typography fontSize={36} mb={1}>
                                                    📭
                                                </Typography>
                                                <Typography
                                                    fontSize={14}
                                                    fontWeight={700}
                                                    color="#374151"
                                                    mb={0.5}
                                                >
                                                    {search
                                                        ? "No templates match your search"
                                                        : "No templates yet"}
                                                </Typography>
                                                <Typography fontSize={12} color="#9ca3af">
                                                    {search
                                                        ? "Try a different keyword."
                                                        : "Click 'New Template' to create your first template."}
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filtered.map((row: any) => {
                                        const sStyle =
                                            STATUS_STYLE[row.status?.toUpperCase()] ||
                                            STATUS_STYLE.PAUSED;
                                        const cStyle =
                                            CATEGORY_STYLE[row.category?.toUpperCase()] ||
                                            CATEGORY_STYLE.UTILITY;
                                        return (
                                            <TableRow
                                                key={row.id || row.name}
                                                sx={{
                                                    transition: "background 0.12s",
                                                    "&:hover": { bgcolor: "#f9fafb" },
                                                    "& > .MuiTableCell-root": {
                                                        borderBottom: "1px solid #f3f4f6",
                                                    },
                                                }}
                                            >
                                                <TableCell sx={{ py: 1.4 }}>
                                                    <Stack
                                                        direction="row"
                                                        alignItems="center"
                                                        spacing={1.25}
                                                    >
                                                        <Box
                                                            sx={{
                                                                width: 32,
                                                                height: 32,
                                                                borderRadius: "8px",
                                                                bgcolor: "#f0fdf4",
                                                                color: "#16a34a",
                                                                border: "1px solid #bbf7d0",
                                                                display: "flex",
                                                                alignItems: "center",
                                                                justifyContent: "center",
                                                                flexShrink: 0,
                                                            }}
                                                        >
                                                            <ArticleOutlinedIcon
                                                                sx={{ fontSize: 16 }}
                                                            />
                                                        </Box>
                                                        <Box sx={{ minWidth: 0 }}>
                                                            <Typography
                                                                fontSize={13}
                                                                fontWeight={700}
                                                                color="#111827"
                                                                lineHeight={1.3}
                                                                noWrap
                                                            >
                                                                {row.name}
                                                            </Typography>
                                                            {row.id && (
                                                                <Typography
                                                                    fontSize={10.5}
                                                                    color="#9ca3af"
                                                                    fontFamily="monospace"
                                                                    noWrap
                                                                >
                                                                    {row.id}
                                                                </Typography>
                                                            )}
                                                        </Box>
                                                    </Stack>
                                                </TableCell>

                                                <TableCell sx={{ py: 1.4 }}>
                                                    <Chip
                                                        icon={sStyle.icon}
                                                        label={row.status || "—"}
                                                        size="small"
                                                        sx={{
                                                            height: 22,
                                                            fontSize: 11,
                                                            fontWeight: 700,
                                                            bgcolor: sStyle.bg,
                                                            color: sStyle.color,
                                                            border: `1px solid ${sStyle.border}`,
                                                            borderRadius: "6px",
                                                            px: 0.25,
                                                        }}
                                                    />
                                                </TableCell>

                                                <TableCell sx={{ py: 1.4 }}>
                                                    <Stack
                                                        direction="row"
                                                        alignItems="center"
                                                        spacing={0.75}
                                                    >
                                                        <Box
                                                            sx={{
                                                                width: 7,
                                                                height: 7,
                                                                borderRadius: "50%",
                                                                bgcolor: cStyle.color,
                                                                flexShrink: 0,
                                                            }}
                                                        />
                                                        <Typography
                                                            fontSize={12.5}
                                                            fontWeight={600}
                                                            color="#374151"
                                                        >
                                                            {row.category || "—"}
                                                        </Typography>
                                                    </Stack>
                                                </TableCell>

                                                <TableCell sx={{ py: 1.4 }}>
                                                    <Chip
                                                        label={row.language || "—"}
                                                        size="small"
                                                        sx={{
                                                            height: 20,
                                                            fontSize: 11,
                                                            fontWeight: 600,
                                                            bgcolor: "#f3f4f6",
                                                            color: "#374151",
                                                            borderRadius: "5px",
                                                            fontFamily: "monospace",
                                                        }}
                                                    />
                                                </TableCell>

                                                <TableCell align="right" sx={{ py: 1.4 }}>
                                                    <IconButton
                                                        size="small"
                                                        onClick={(e) => handleMenuClick(e, row)}
                                                        sx={{
                                                            color: "#6b7280",
                                                            "&:hover": {
                                                                bgcolor: "#f3f4f6",
                                                                color: "#111827",
                                                            },
                                                        }}
                                                    >
                                                        <MoreHorizIcon sx={{ fontSize: 18 }} />
                                                    </IconButton>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                        </TableBody>
                    </Table>
                </TableContainer>

                <Divider sx={{ borderColor: "#f3f4f6" }} />

                <TablePagination
                    rowsPerPageOptions={[20, 50, 100]}
                    component="div"
                    count={total}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={(_, newPage) => setPage(newPage)}
                    onRowsPerPageChange={(e) => {
                        setRowsPerPage(+e.target.value);
                        setPage(0);
                        setCursors([]);
                    }}
                    sx={{
                        borderTop: "none",
                        "& .MuiTablePagination-toolbar": {
                            minHeight: 48,
                            fontSize: 12,
                        },
                        "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": {
                            fontSize: 12,
                            color: "#6b7280",
                        },
                    }}
                />
            </Paper>

            {/* ── ACTION MENU ── */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleCloseMenu}
                PaperProps={{
                    sx: {
                        borderRadius: "12px",
                        boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
                        border: "1px solid #f3f4f6",
                        minWidth: 180,
                        mt: 0.5,
                    },
                }}
            >
                <MenuItem
                    onClick={() => {
                        setEditData(selectedRow);
                        setOpenModal(true);
                        handleCloseMenu();
                    }}
                    sx={{ fontSize: 13, py: 1, "&:hover": { bgcolor: "#f9fafb" } }}
                >
                    <ListItemIcon sx={{ minWidth: 30 }}>
                        <EditOutlinedIcon sx={{ fontSize: 16, color: "#374151" }} />
                    </ListItemIcon>
                    <ListItemText
                        primary="Edit"
                        primaryTypographyProps={{ fontSize: 13, fontWeight: 600 }}
                    />
                </MenuItem>
                <Divider sx={{ my: 0.25, borderColor: "#f3f4f6" }} />
                <MenuItem
                    onClick={handleDelete}
                    disabled={deleteMutation.isPending}
                    sx={{
                        fontSize: 13,
                        py: 1,
                        color: "#dc2626",
                        "&:hover": { bgcolor: "#fef2f2" },
                    }}
                >
                    <ListItemIcon sx={{ minWidth: 30 }}>
                        {deleteMutation.isPending ? (
                            <CircularProgress size={14} sx={{ color: "#dc2626" }} />
                        ) : (
                            <DeleteOutlineIcon sx={{ fontSize: 16, color: "#dc2626" }} />
                        )}
                    </ListItemIcon>
                    <ListItemText
                        primary={deleteMutation.isPending ? "Deleting…" : "Delete"}
                        primaryTypographyProps={{ fontSize: 13, fontWeight: 600 }}
                    />
                </MenuItem>
            </Menu>

            {/* ── CREATE / EDIT TEMPLATE POPUP ── */}
            <TemplateModal
                open={openModal}
                onClose={() => setOpenModal(false)}
                initialData={editData}
                onSubmit={(payload: CreateTemplatePayload) => {
                    if (editData) {
                        return updateMutation.mutateAsync({
                            id: editData.id,
                            payload,
                        });
                    }
                    return createMutation.mutateAsync(payload);
                }}
            />

            <BulkFlowModal
                open={bulkFlowOpen}
                onClose={() => setBulkFlowOpen(false)}
                channelId={channelId!}
            />
        </Box>
    );
};

export default TemplatesTab;
