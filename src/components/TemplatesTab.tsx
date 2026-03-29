import {
    Table,
    TableContainer,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    TablePagination,
    Divider,
    IconButton,
    Menu,
    MenuItem,
    Button,
    CircularProgress,
} from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import MainCard from "./MainCard";
import { CreateTemplatePayload, templateService } from "service/template.service";
import { Skeleton } from "@mui/material";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import TemplateModal from "./TemplatePopup";
import { Stack } from "@mui/material";
import BulkFlowModal from "./BulkFlowModal";
import { useSnackbar } from "notistack";


const TemplatesTab = () => {
    const { id: channelId } = useParams();
    const { enqueueSnackbar } = useSnackbar();

    // pagination
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(20);
    const [cursors, setCursors] = useState<string[]>([]);
    const [total, setTotal] = useState(0);

    // menu state
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedRow, setSelectedRow] = useState<any>(null);
    const [bulkFlowOpen, setBulkFlowOpen] = useState(false);

    const [openModal, setOpenModal] = useState(false);
    const [editData, setEditData] = useState<any>(null);

    const queryClient = useQueryClient();

    const createMutation = useMutation({
        mutationFn: (payload: any) =>
            templateService.createTemplate(channelId!, payload),

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

    //   API call
    const { data = [], isLoading } = useQuery({
        queryKey: ["templates", channelId, page, rowsPerPage],
        queryFn: async () => {
            const after = cursors[page - 1]; // previous page cursor

            const res = await templateService.getTemplates(channelId!, {
                limit: rowsPerPage,
                after: page === 0 ? undefined : after,
                page: page + 1, // 🔥 important
            });

            // ✅ total set karo
            setTotal(res.total || 0);

            // 🔥 cursor save
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

    // columns
    const columns = [
        { id: "name", label: "Name" },
        { id: "status", label: "Status" },
        { id: "category", label: "Category" },
        { id: "language", label: "Language" },
        { id: "actions", label: "Actions" },
    ];

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

            enqueueSnackbar("Template deleted successfully", {
                variant: "success",
            });

            handleCloseMenu();
        } catch (err: any) {
            enqueueSnackbar(
                err?.response?.data?.message || "Failed to delete template",
                { variant: "error" }
            );
        }
    };

    const handleSyncTemplates = () => {
        syncMutation.mutate();
    };

    const syncMutation = useMutation({
        mutationFn: () => templateService.syncTemplates(channelId!),

        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["templates", channelId],
            });
        },
    });

    return (
        <MainCard
            content={false}
            title="Templates"
            secondary={
                <Stack direction="row" spacing={2}>

                    <Button
                        variant="contained"
                        onClick={() => {
                            setEditData(null);
                            setOpenModal(true);
                        }}
                    >
                        Create New Template
                    </Button>
                    <Button
                        variant="contained"
                        onClick={() => setBulkFlowOpen(true)}
                    >
                        Send Bulk Template
                    </Button>

                    <Button
                        variant="contained"
                        onClick={handleSyncTemplates}
                        disabled={syncMutation.isPending}
                        startIcon={
                            syncMutation.isPending ? (
                                <CircularProgress size={18} color="inherit" />
                            ) : null
                        }
                    >
                        {syncMutation.isPending ? "Syncing..." : "Sync Templates"}
                    </Button>
                </Stack>
            }
        >
            {/* TABLE */}
            <TableContainer
                sx={{
                    height: 630,
                    overflow: "auto"
                }}
            >
                <Table stickyHeader>
                    <TableHead
                        sx={{
                            position: "sticky",
                            top: 0,
                            zIndex: 2,
                            backgroundColor: "#fff"
                        }}
                    >
                        <TableRow>
                            {columns.map((col) => (
                                <TableCell
                                    key={col.id}
                                    sx={{ backgroundColor: "#fff" }}
                                    align={col.id === "actions" ? "center" : "left"}
                                >
                                    {col.label}
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>

                    <TableBody sx={{ height: "100%" }}>
                        {isLoading
                            ? Array.from(new Array(5)).map((_, index) => (
                                <TableRow key={index}>
                                    {columns.map((col) => (
                                        <TableCell key={col.id}>
                                            <Skeleton />
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                            : data.map((row: any) => (
                                <TableRow key={row.id || row.name} hover>
                                    <TableCell>{row.name}</TableCell>
                                    <TableCell>{row.status}</TableCell>
                                    <TableCell>{row.category}</TableCell>
                                    <TableCell>{row.language}</TableCell>
                                    <TableCell align="center">
                                        <IconButton onClick={(e) => handleMenuClick(e, row)}>
                                            <MoreVertIcon />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Divider />

            {/* PAGINATION */}
            <TablePagination
                rowsPerPageOptions={[20, 50, 100]}
                component="div"
                count={total} // ✅ FIXED
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={(_, newPage) => {
                    setPage(newPage);
                }}
                onRowsPerPageChange={(e) => {
                    setRowsPerPage(+e.target.value);
                    setPage(0);
                    setCursors([]);
                }}
            />

            {/* 🔥 ACTION MENU */}
            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleCloseMenu}>
                <MenuItem
                    onClick={() => {
                        setEditData(selectedRow);
                        setOpenModal(true);
                        handleCloseMenu();
                    }}
                >
                    Edit Template
                </MenuItem>
                <MenuItem
                    onClick={handleDelete}
                    disabled={deleteMutation.isPending}
                    sx={{ color: "error.main" }}
                >
                    {deleteMutation.isPending ? (
                        <>
                            <CircularProgress size={18} sx={{ mr: 1 }} />
                            Deleting...
                        </>
                    ) : (
                        "Delete Template"
                    )}
                </MenuItem>
            </Menu>

            {/* 🔥 CREATE TEMPLATE POPUP */}
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
                    } else {
                        return createMutation.mutateAsync(payload);
                    }
                }}
            />

            <BulkFlowModal
                open={bulkFlowOpen}
                onClose={() => setBulkFlowOpen(false)}
                channelId={channelId!}
            />
        </MainCard>
    );
};

export default TemplatesTab;