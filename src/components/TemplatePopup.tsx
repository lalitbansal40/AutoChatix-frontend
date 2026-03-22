import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    MenuItem,
    Stack,
    Grid,
    Box,
    Typography,
} from "@mui/material";
import { useState, useEffect } from "react";
import { CreateTemplatePayload, templateService } from "service/template.service";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { CircularProgress } from "@mui/material";

interface Props {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: CreateTemplatePayload) => void;
    initialData?: any;
}

const languages = ["en_US", "hi_IN"];


const TemplateModal = ({ open, onClose, onSubmit, initialData }: Props) => {
    const { id: channelId } = useParams();

    type Category = "UTILITY" | "MARKETING" | "AUTHENTICATION";

    const [form, setForm] = useState<{
        name: string;
        language: string;
        category: Category;
        body: string;
        headerType: string;
        media: string;
    }>({
        name: "",
        language: "en_US",
        category: "UTILITY",
        body: "",
        headerType: "NONE",
        media: "",
    });

    // 🔥 EDIT MODE → API CALL
    const { data: templateData, isLoading } = useQuery({
        queryKey: ["template", initialData?.id],
        queryFn: () =>
            templateService.getTemplateById(channelId!, initialData.id),
        enabled: !!initialData?.id && open, // 👈 important
        select: (res) => res.data,
    });

    const handleChange = (key: string, value: any) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    // 🔥 Extract variables
    const getVariables = () => {
        const matches = form.body.match(/{{\d+}}/g);
        return matches || [];
    };

    const handleSubmit = () => {
        const components: any[] = [];

        // HEADER
        if (form.headerType !== "NONE") {
            components.push({
                type: "HEADER",
                format: form.headerType,
                example:
                    form.media && form.headerType !== "TEXT"
                        ? {
                            header_handle: [form.media],
                        }
                        : undefined,
            });
        }

        // BODY
        components.push({
            type: "BODY",
            text: form.body,
        });

        const payload = {
            name: form.name,
            language: form.language,
            category: form.category,
            components,
        };

        onSubmit(payload);
        onClose();
    };

    useEffect(() => {
        if (templateData) {
            setForm({
                name: templateData.name,
                language: templateData.language,
                category: templateData.category,
                body:
                    templateData.components?.find((c: any) => c.type === "BODY")?.text || "",
                headerType:
                    templateData.components?.find((c: any) => c.type === "HEADER")
                        ?.format || "NONE",
                media: "",
            });
        }
    }, [templateData]);
    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
            <DialogTitle>
                {initialData ? "Edit Template" : "Create Template"}
            </DialogTitle>

            <DialogContent>
                {isLoading && <CircularProgress />}
                <Grid container spacing={3}>
                    {/* LEFT FORM */}
                    <Grid item xs={12} md={6}>
                        <Stack spacing={2}>
                            <TextField
                                label="Template Name"
                                value={form.name}
                                onChange={(e) => handleChange("name", e.target.value)}
                            />

                            <TextField
                                select
                                label="Category"
                                value={form.category}
                                onChange={(e) => handleChange("category", e.target.value)}
                            >
                                <MenuItem value="UTILITY">UTILITY</MenuItem>
                                <MenuItem value="MARKETING">MARKETING</MenuItem>
                                <MenuItem value="AUTHENTICATION">
                                    AUTHENTICATION
                                </MenuItem>
                            </TextField>

                            <TextField
                                select
                                label="Language"
                                value={form.language}
                                onChange={(e) => handleChange("language", e.target.value)}
                            >
                                {languages.map((lang) => (
                                    <MenuItem key={lang} value={lang}>
                                        {lang}
                                    </MenuItem>
                                ))}
                            </TextField>

                            {/* HEADER TYPE */}
                            <TextField
                                select
                                label="Header Type"
                                value={form.headerType}
                                onChange={(e) => handleChange("headerType", e.target.value)}
                            >
                                <MenuItem value="NONE">NONE</MenuItem>
                                <MenuItem value="TEXT">TEXT</MenuItem>
                                <MenuItem value="IMAGE">IMAGE</MenuItem>
                                <MenuItem value="VIDEO">VIDEO</MenuItem>
                                <MenuItem value="DOCUMENT">DOCUMENT</MenuItem>
                            </TextField>

                            {/* MEDIA INPUT */}
                            {form.headerType !== "NONE" &&
                                form.headerType !== "TEXT" && (
                                    <TextField
                                        label="Media URL"
                                        value={form.media}
                                        onChange={(e) =>
                                            handleChange("media", e.target.value)
                                        }
                                    />
                                )}

                            {/* BODY */}
                            <TextField
                                label="Body"
                                multiline
                                rows={4}
                                value={form.body}
                                onChange={(e) => handleChange("body", e.target.value)}
                                helperText="Use {{1}}, {{2}} for variables"
                            />

                            {/* VARIABLES */}
                            {getVariables().length > 0 && (
                                <Box>
                                    <Typography variant="caption">
                                        Variables detected:
                                    </Typography>
                                    <Stack direction="row" spacing={1}>
                                        {getVariables().map((v: string, i: number) => (
                                            <Box
                                                key={i}
                                                sx={{
                                                    px: 1,
                                                    py: 0.5,
                                                    bgcolor: "#eee",
                                                    borderRadius: 1,
                                                }}
                                            >
                                                {v}
                                            </Box>
                                        ))}
                                    </Stack>
                                </Box>
                            )}
                        </Stack>
                    </Grid>

                    {/* RIGHT PREVIEW */}
                    <Grid item xs={12} md={6}>
                        <Box
                            sx={{
                                border: "1px solid #ccc",
                                borderRadius: 3,
                                p: 2,
                                height: "100%",
                                background: "#f5f5f5",
                            }}
                        >
                            <Typography variant="h6" mb={2}>
                                WhatsApp Preview 📱
                            </Typography>

                            <Box
                                sx={{
                                    background: "#fff",
                                    p: 2,
                                    borderRadius: 2,
                                }}
                            >
                                {form.headerType !== "NONE" && (
                                    <Typography variant="subtitle2">
                                        [{form.headerType}]
                                    </Typography>
                                )}

                                <Typography>{form.body}</Typography>
                            </Box>
                        </Box>
                    </Grid>
                </Grid>
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button variant="contained" onClick={handleSubmit}>
                    {initialData ? "Update" : "Create"}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default TemplateModal;