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


const TemplatesTab = () => {
    const { id: channelId } = useParams();

    // pagination
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    // menu state
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedRow, setSelectedRow] = useState<any>(null);


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

    // ✅ API call
    const { data = [], isLoading } = useQuery({
        queryKey: ["templates", channelId],
        queryFn: () => templateService.getTemplates(channelId!),
        select: (res) => res.data,
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

    // handlers
    const handleChangePage = (_: any, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: any) => {
        setRowsPerPage(+event.target.value);
        setPage(0);
    };

    const handleMenuClick = (event: any, row: any) => {
        setAnchorEl(event.currentTarget);
        setSelectedRow(row);
    };

    const handleCloseMenu = () => {
        setAnchorEl(null);
        setSelectedRow(null);
    };

    return (
        <MainCard
            content={false}
            title="Templates"
            secondary={
                <Button
                    variant="contained"
                    onClick={() => {
                        setEditData(null);
                        setOpenModal(true);
                    }}
                >
                    Create New Template
                </Button>
            }
        >
            {/* TABLE */}
            <TableContainer sx={{ maxHeight: 430 }}>
                <Table stickyHeader>
                    <TableHead>
                        <TableRow>
                            {columns.map((col) => (
                                <TableCell key={col.id}>{col.label}</TableCell>
                            ))}
                        </TableRow>
                    </TableHead>

                    <TableBody>
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
                            : data
                                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                .map((row: any) => (
                                    <TableRow key={row.id} hover>
                                        <TableCell>{row.name}</TableCell>
                                        <TableCell>{row.status}</TableCell>
                                        <TableCell>{row.category}</TableCell>
                                        <TableCell>{row.language}</TableCell>
                                        <TableCell>
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
                rowsPerPageOptions={[10, 25, 50]}
                component="div"
                count={data.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
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
                    onClick={() => {
                        console.log("More options future");
                        handleCloseMenu();
                    }}
                >
                    More Actions
                </MenuItem>
            </Menu>

            {/* 🔥 CREATE TEMPLATE POPUP */}
            <TemplateModal
                open={openModal}
                onClose={() => setOpenModal(false)}
                initialData={editData}
                onSubmit={(payload: CreateTemplatePayload) => {
                    if (editData) {
                        updateMutation.mutate({
                            id: editData.id,
                            payload,
                        });
                    } else {
                        createMutation.mutate(payload);
                    }
                }}
            />
        </MainCard>
    );
};

export default TemplatesTab;