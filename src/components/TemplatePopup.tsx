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
import { whatsapp_language } from "config";
import axiosServices from "utils/axios";
import { useSnackbar } from "notistack";


interface Props {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: CreateTemplatePayload) => void;
    initialData?: any;
}


const TemplateModal = ({ open, onClose, onSubmit, initialData }: Props) => {
    const [loading, setLoading] = useState(false);
    const { enqueueSnackbar } = useSnackbar();
    const { id: channelId } = useParams();
    const [buttons, setButtons] = useState<any[]>([]);
    const [bodyExamples, setBodyExamples] = useState<string[]>([]);
    type Category = "UTILITY" | "MARKETING" | "AUTHENTICATION";
    const quickReplyCount = buttons.filter(b => b.type === "QUICK_REPLY").length;
    const ctaCount = buttons.filter(b => b.type !== "QUICK_REPLY").length;
    const [form, setForm] = useState<{
        name: string;
        language: string;
        category: Category;
        body: string;
        headerType: string;
        media: string;
        headerText: string;
        footer: string;
    }>({
        name: "",
        language: "en_US",
        category: "UTILITY",
        body: "",
        headerType: "NONE",
        media: "",
        headerText: "",
        footer: ""
    });
    const [uploading, setUploading] = useState(false);

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

    const handleSubmit = async () => {
        if (loading) return;
        try {
            const components: any[] = [];

            // HEADER VALIDATION
            if (
                form.headerType !== "NONE" &&
                form.headerType !== "TEXT" &&
                !form.media
            ) {
                enqueueSnackbar("Please upload media for header", { variant: "error" });
                return;
            }

            // EXTRA CHECK (VERY IMPORTANT)
            if (
                form.headerType !== "NONE" &&
                form.headerType !== "TEXT" &&
                form.media &&
                !form.media.includes(".")
            ) {
                enqueueSnackbar("Invalid media URL (missing file extension like .jpg/.png)", { variant: "error" });
                return;
            }

            // BUTTONS
            if (buttons.length > 0) {
                components.push({
                    type: "BUTTONS",
                    buttons: buttons.map((b) => ({
                        type:
                            b.type === "QUICK_REPLY"
                                ? "QUICK_REPLY"
                                : b.type === "URL"
                                    ? "URL"
                                    : b.type === "PHONE"
                                        ? "PHONE_NUMBER"
                                        : "FLOW",
                        text: b.text,
                        url: b.url,
                        phone_number: b.phone,
                    })),
                });
            }

            // HEADER FIX (STRICT META FORMAT 🔥)
            if (form.headerType !== "NONE") {
                const headerComponent: any = {
                    type: "HEADER",
                    format: form.headerType,
                };

                if (form.headerType === "TEXT") {
                    if (!form.headerText) {
                        enqueueSnackbar("Header text is required", { variant: "error" });
                        return;
                    }
                    headerComponent.text = form.headerText;
                } else {
                    // IMAGE / VIDEO / DOCUMENT
                    headerComponent.example = {
                        header_handle: [form.media],
                    };
                }

                components.push(headerComponent);
            }

            const variables = getVariables();

            if (variables.length > 0) {
                const hasEmpty = bodyExamples.some((v) => !v);

                if (hasEmpty) {
                    enqueueSnackbar("Please fill all example values", { variant: "error" });
                    return;
                }
            }

            // BODY
            if (!form.body) {
                enqueueSnackbar("Body is required", { variant: "error" });
                return;
            }


            let bodyComponent: any = {
                type: "BODY",
                text: form.body,
            };

            if (variables.length > 0) {
                bodyComponent.example = {
                    body_text: [bodyExamples],
                };
            }

            components.push(bodyComponent);

            // NAME FORMAT FIX (Meta requirement)
            const formattedName = form.name
                .toLowerCase()
                .replace(/[^a-z0-9_]/g, "_");

            const payload = {
                name: formattedName,
                language: form.language,
                category: form.category,
                components,
            };

            console.log("FINAL PAYLOAD:", payload);
            setLoading(true);

            await onSubmit(payload);


            enqueueSnackbar(
                initialData ? "Template updated successfully" : "Template created successfully",
                { variant: "success" }
            );
            onClose(); // sirf ek baar

        } catch (err: any) {
            console.error("Submit error:", err);
            enqueueSnackbar(
                err?.response?.data?.error_user_msg ||
                err?.message ||
                "Something went wrong",
                { variant: "error" }
            );
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (file: File) => {
        try {
            const formData = new FormData();
            formData.append("file", file);

            setUploading(true);
            const res = await axiosServices.post(
                `/templates/upload-media/${channelId}`,
                formData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                }
            );

            setUploading(false);

            const url = res.data.url;

            // S3 URL set karo
            handleChange("media", url);

        } catch (err) {
            console.error("Upload failed", err);
        }
    };

    useEffect(() => {
        if (templateData) {
            const bodyComp = templateData.components?.find((c: any) => c.type === "BODY");
            const headerComp = templateData.components?.find((c: any) => c.type === "HEADER");
            const buttonsComp = templateData.components?.find((c: any) => c.type === "BUTTONS");

            // BODY EXAMPLES
            if (bodyComp?.example?.body_text?.[0]) {
                setBodyExamples(bodyComp.example.body_text[0]);
            }

            // HEADER MEDIA
            let mediaUrl = "";
            if (headerComp?.example?.header_handle?.[0]) {
                mediaUrl = headerComp.example.header_handle[0];
            }

            // BUTTONS
            if (buttonsComp?.buttons) {
                const formattedButtons = buttonsComp.buttons.map((btn: any) => ({
                    id: Date.now() + Math.random(),
                    type: btn.type === "PHONE_NUMBER" ? "PHONE" : btn.type,
                    text: btn.text,
                    url: btn.url,
                    phone: btn.phone_number,
                }));

                setButtons(formattedButtons);
            }

            // FORM SET
            setForm({
                name: templateData.name,
                language: templateData.language,
                category: templateData.category,
                body: bodyComp?.text || "",
                headerType: headerComp?.format || "NONE",
                media: mediaUrl,
                headerText: headerComp?.text || "",
                footer: templateData.footer || "",
            });
        }
    }, [templateData]);

    useEffect(() => {
        const variables = getVariables();

        if (variables.length > 0) {
            setBodyExamples((prev) => {
                const newArr = [...prev];
                while (newArr.length < variables.length) {
                    newArr.push("");
                }
                return newArr.slice(0, variables.length);
            });
        } else {
            setBodyExamples([]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [form.body]);
    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
            <DialogTitle>
                {initialData ? "Edit Template" : "Create Template"}
            </DialogTitle>

            <DialogContent
                sx={{
                    height: "80vh",
                    overflow: "hidden"
                }}
            >
                {isLoading && <CircularProgress />}
                <Grid
                    container
                    spacing={3}
                    sx={{ height: "100%" }}
                >
                    {/* LEFT FORM */}
                    <Grid
                        item
                        xs={12}
                        md={6}
                        sx={{
                            height: "100%",
                            overflowY: "auto",
                            pr: 2,
                            display: "flex",
                            flexDirection: "column"
                        }}
                    >
                        <Stack
                            spacing={2}
                            sx={{
                                pb: 4,
                                flexGrow: 1
                            }}
                        >
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
                                {whatsapp_language.map((lang) => (
                                    <MenuItem key={lang.value} value={lang.value}>
                                        {lang.label} ({lang.value})
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
                                    <Button variant="outlined" component="label">
                                        {uploading ? "Uploading..." : "Upload Media"}
                                        Upload Media (Image / Video / PDF)
                                        <input
                                            type="file"
                                            hidden
                                            accept="image/*,video/*,application/pdf"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    handleFileUpload(file); // 👈 THIS
                                                }
                                            }}
                                        />
                                    </Button>
                                )}

                            {form.headerType === "TEXT" && (
                                <TextField
                                    label="Header Text"
                                    value={form.headerText}
                                    onChange={(e) => handleChange("headerText", e.target.value)}
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

                            {getVariables().length > 0 && (
                                <Box>
                                    <Typography variant="caption">Provide example values:</Typography>

                                    <Stack spacing={1} mt={1}>
                                        {getVariables().map((v: string, i: number) => (
                                            <TextField
                                                key={i}
                                                size="small"
                                                label={`Example for ${v}`}
                                                value={bodyExamples[i] || ""}
                                                onChange={(e) => {
                                                    const updated = [...bodyExamples];
                                                    updated[i] = e.target.value;
                                                    setBodyExamples(updated);
                                                }}
                                            />
                                        ))}
                                    </Stack>
                                </Box>
                            )}

                            <TextField
                                label="Footer (Optional)"
                                value={form.footer}
                                onChange={(e) => handleChange("footer", e.target.value)}
                            />

                            <Box>
                                <TextField
                                    select
                                    fullWidth
                                    label="Add Button"
                                    value=""
                                >
                                    <MenuItem
                                        disabled={quickReplyCount >= 3}
                                        onClick={() => setButtons([...buttons, {
                                            id: Date.now() + Math.random(),
                                            type: "QUICK_REPLY",
                                            text: ""
                                        }])}
                                    >
                                        Quick Reply
                                    </MenuItem>

                                    <MenuItem
                                        disabled={ctaCount >= 2}
                                        onClick={() => setButtons([
                                            ...buttons,
                                            {
                                                id: Date.now() + Math.random(),
                                                type: "URL",
                                                text: "",
                                                url: ""
                                            }
                                        ])}
                                    >
                                        Visit Website
                                    </MenuItem>

                                    <MenuItem
                                        disabled={ctaCount >= 2}
                                        onClick={() => setButtons([...buttons, {
                                            id: Date.now() + Math.random(),
                                            type: "PHONE",
                                            text: "",
                                            phone: ""
                                        }])}
                                    >
                                        Call Phone Number
                                    </MenuItem>

                                    <MenuItem
                                        disabled={ctaCount >= 2}
                                        onClick={() => setButtons([...buttons, {
                                            id: Date.now() + Math.random(),
                                            type: "FLOW",
                                            text: ""
                                        }])}
                                    >
                                        Flow
                                    </MenuItem>
                                </TextField>
                            </Box>

                            {buttons.filter(b => b.type === "QUICK_REPLY").length > 0 && (
                                <Stack spacing={2} mt={2}>
                                    <Typography fontWeight="bold">Quick Reply</Typography>

                                    {buttons
                                        .filter(b => b.type === "QUICK_REPLY")
                                        .map((btn) => (
                                            <Stack direction="row" spacing={1} key={btn.id}>
                                                <TextField
                                                    fullWidth
                                                    size="small"
                                                    placeholder="Quick Reply Text"
                                                    value={btn.text}
                                                    onChange={(e) => {
                                                        setButtons(prev =>
                                                            prev.map(b =>
                                                                b.id === btn.id ? { ...b, text: e.target.value } : b
                                                            )
                                                        );
                                                    }}
                                                />

                                                <Button
                                                    color="error"
                                                    onClick={() => {
                                                        setButtons(prev => prev.filter(b => b.id !== btn.id));
                                                    }}
                                                >
                                                    Delete
                                                </Button>
                                            </Stack>
                                        ))}
                                </Stack>
                            )}

                            <Stack spacing={2} mt={2}>
                                {buttons
                                    .filter(b => b.type !== "QUICK_REPLY")
                                    .map((btn) => (
                                        <Box key={btn.id}>
                                            <Stack spacing={1}>
                                                <TextField
                                                    fullWidth
                                                    size="small"
                                                    placeholder="Button Text"
                                                    value={btn.text}
                                                    onChange={(e) => {
                                                        setButtons(prev =>
                                                            prev.map(b =>
                                                                b.id === btn.id ? { ...b, text: e.target.value } : b
                                                            )
                                                        );
                                                    }}
                                                />

                                                {btn.type === "URL" && (
                                                    <TextField
                                                        fullWidth
                                                        size="small"
                                                        placeholder="Website URL"
                                                        value={btn.url || ""}
                                                        onChange={(e) => {
                                                            setButtons(prev =>
                                                                prev.map(b =>
                                                                    b.id === btn.id ? { ...b, url: e.target.value } : b
                                                                )
                                                            );
                                                        }}
                                                    />
                                                )}

                                                {btn.type === "PHONE" && (
                                                    <TextField
                                                        fullWidth
                                                        size="small"
                                                        placeholder="Phone Number"
                                                        value={btn.phone || ""}
                                                        onChange={(e) => {
                                                            setButtons(prev =>
                                                                prev.map(b =>
                                                                    b.id === btn.id ? { ...b, phone: e.target.value } : b
                                                                )
                                                            );
                                                        }}
                                                    />
                                                )}

                                                <Button
                                                    color="error"
                                                    size="small"
                                                    onClick={() => {
                                                        setButtons(prev => prev.filter(b => b.id !== btn.id));
                                                    }}
                                                >
                                                    Delete
                                                </Button>
                                            </Stack>
                                        </Box>
                                    ))}
                            </Stack>

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
                        <Box>
                            <Typography align="center" mb={1}>
                                Preview
                            </Typography>

                            <Box
                                sx={{
                                    width: 300,
                                    height: 600,
                                    mx: "auto",
                                    borderRadius: "40px",
                                    background: "#111",
                                    p: "10px",
                                    boxShadow: "0 10px 30px rgba(0,0,0,0.3)"
                                }}
                            >
                                {/* SCREEN */}
                                <Box
                                    sx={{
                                        height: "100%",
                                        borderRadius: "30px",
                                        overflow: "hidden",
                                        background: "#e5ddd5",
                                        display: "flex",
                                        flexDirection: "column"
                                    }}
                                >
                                    {/* TOP BAR */}
                                    <Box sx={{ background: "#075E54", height: 60 }} />

                                    {/* CHAT */}
                                    <Box sx={{ flex: 1, p: 2, overflowY: "auto" }}>
                                        {/* META INFO */}
                                        <Box
                                            sx={{
                                                background: "#d9fdd3",
                                                p: 1,
                                                borderRadius: 2,
                                                mb: 2,
                                                fontSize: 12
                                            }}
                                        >
                                            This business uses a secure service from Meta to manage this chat.
                                        </Box>

                                        {/* MESSAGE */}
                                        <Box
                                            sx={{
                                                background: "#fff",
                                                borderRadius: 3,
                                                p: 2,
                                                maxWidth: "100%",
                                                display: "flex",
                                                flexDirection: "column",
                                                gap: 1
                                            }}
                                        >
                                            {/* HEADER */}
                                            {form.headerType === "TEXT" && (
                                                <Typography fontWeight="bold">
                                                    {form.headerText || "Header"}
                                                </Typography>
                                            )}

                                            {form.headerType === "IMAGE" && form.media && (
                                                // eslint-disable-next-line jsx-a11y/alt-text
                                                <img src={form.media} style={{ width: "100%", borderRadius: 8 }} />
                                            )}

                                            {form.headerType === "VIDEO" && form.media && (
                                                <video src={form.media} controls style={{ width: "100%" }} />
                                            )}

                                            {form.headerType === "DOCUMENT" && form.media && (
                                                // eslint-disable-next-line react/jsx-no-target-blank
                                                <a href={form.media} target="_blank">
                                                    📄 View Document
                                                </a>
                                            )}

                                            {/* BODY */}
                                            <Typography>
                                                {form.body.replace(/{{(\d+)}}/g, (_, i) => bodyExamples[i - 1] || `{{${i}}}`)}
                                            </Typography>

                                            {/* FOOTER */}
                                            {form.footer && (
                                                <Typography sx={{ fontSize: 12, color: "gray" }}>
                                                    {form.footer}
                                                </Typography>
                                            )}

                                            {/* TIME */}
                                            <Typography sx={{ fontSize: 10, textAlign: "right" }}>
                                                22:21
                                            </Typography>
                                            {buttons.length > 0 && (
                                                <>
                                                    <Box sx={{ borderTop: "1px solid #eee", mt: 1 }} />

                                                    {buttons.map((btn, i) => (
                                                        <Box
                                                            key={btn.id}
                                                            sx={{
                                                                textAlign: "center",
                                                                py: 1,
                                                                color: "#00a884",
                                                                borderBottom: "1px solid #eee",
                                                                cursor: "pointer"
                                                            }}
                                                        >
                                                            {btn.type === "URL" && "🔗 "}
                                                            {btn.type === "PHONE" && "📞 "}
                                                            {btn.type === "FLOW" && "⚡ "}
                                                            {btn.text || "Button"}
                                                        </Box>
                                                    ))}
                                                </>
                                            )}
                                        </Box>
                                    </Box>
                                </Box>
                            </Box>
                        </Box>
                    </Grid>
                </Grid>
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button variant="contained" onClick={handleSubmit} disabled={loading}>
                    {loading ? (
                        <>
                            <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
                            {initialData ? "Updating..." : "Creating..."}
                        </>
                    ) : (
                        initialData ? "Update" : "Create"
                    )}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default TemplateModal;