import {
    Dialog,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    MenuItem,
    Stack,
    Grid,
    Box,
    Typography,
    Chip,
    Paper,
    IconButton,
    CircularProgress,
    Divider,
} from "@mui/material";
import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";
import CloseIcon from "@mui/icons-material/Close";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { useState, useEffect } from "react";
import { CreateTemplatePayload, templateService } from "service/template.service";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { whatsapp_language } from "config";
import axiosServices from "utils/axios";
import { useSnackbar } from "notistack";

interface Props {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: CreateTemplatePayload) => void;
    initialData?: any;
}

const SectionLabel = ({ children }: { children: string }) => (
    <Typography sx={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.6, mb: 1.5 }}>
        {children}
    </Typography>
);

const HEADER_TYPES = ["NONE", "TEXT", "IMAGE", "VIDEO", "DOCUMENT"];

const BUTTON_TYPES = [
    { label: "+ Quick Reply", type: "QUICK_REPLY", color: "#3b82f6" },
    { label: "+ Visit Website", type: "URL", color: "#8b5cf6" },
    { label: "+ Call Phone", type: "PHONE", color: "#10b981" },
    { label: "+ Flow", type: "FLOW", color: "#f59e0b" },
];

const BTN_STYLE: Record<string, { border: string; bg: string; text: string }> = {
    QUICK_REPLY: { border: "#bfdbfe", bg: "#eff6ff", text: "#3b82f6" },
    URL: { border: "#ddd6fe", bg: "#f5f3ff", text: "#8b5cf6" },
    PHONE: { border: "#a7f3d0", bg: "#f0fdf4", text: "#10b981" },
    FLOW: { border: "#fde68a", bg: "#fffbeb", text: "#f59e0b" },
};

const BTN_LABEL: Record<string, string> = {
    URL: "Website",
    PHONE: "Call",
    FLOW: "Flow",
    QUICK_REPLY: "Quick Reply",
};

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

    const { data: templateData, isLoading } = useQuery({
        queryKey: ["template", initialData?.id],
        queryFn: () => templateService.getTemplateById(channelId!, initialData.id),
        enabled: !!initialData?.id && open,
        select: (res) => res.data,
    });

    const handleChange = (key: string, value: any) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    const getVariables = () => {
        const matches = form.body.match(/{{\d+}}/g);
        return matches || [];
    };

    const handleSubmit = async () => {
        if (loading) return;
        try {
            const components: any[] = [];

            if (form.headerType !== "NONE" && form.headerType !== "TEXT" && !form.media) {
                enqueueSnackbar("Please upload media for header", { variant: "error" });
                return;
            }

            if (form.headerType !== "NONE" && form.headerType !== "TEXT" && form.media && !form.media.includes(".")) {
                enqueueSnackbar("Invalid media URL (missing file extension like .jpg/.png)", { variant: "error" });
                return;
            }

            if (buttons.length > 0) {
                components.push({
                    type: "BUTTONS",
                    buttons: buttons.map((b) => ({
                        type: b.type === "QUICK_REPLY" ? "QUICK_REPLY" : b.type === "URL" ? "URL" : b.type === "PHONE" ? "PHONE_NUMBER" : "FLOW",
                        text: b.text,
                        url: b.url,
                        phone_number: b.phone,
                    })),
                });
            }

            if (form.headerType !== "NONE") {
                const headerComponent: any = { type: "HEADER", format: form.headerType };
                if (form.headerType === "TEXT") {
                    if (!form.headerText) { enqueueSnackbar("Header text is required", { variant: "error" }); return; }
                    headerComponent.text = form.headerText;
                } else {
                    headerComponent.example = { header_handle: [form.media] };
                }
                components.push(headerComponent);
            }

            const variables = getVariables();
            if (variables.length > 0 && bodyExamples.some((v) => !v)) {
                enqueueSnackbar("Please fill all example values", { variant: "error" });
                return;
            }

            if (!form.body) { enqueueSnackbar("Body is required", { variant: "error" }); return; }

            let bodyComponent: any = { type: "BODY", text: form.body };
            if (variables.length > 0) {
                bodyComponent.example = { body_text: [bodyExamples] };
            }
            components.push(bodyComponent);

            const formattedName = form.name.toLowerCase().replace(/[^a-z0-9_]/g, "_");
            const payload = { name: formattedName, language: form.language, category: form.category, components };

            setLoading(true);
            await onSubmit(payload);
            enqueueSnackbar(initialData ? "Template updated successfully" : "Template created successfully", { variant: "success" });
            onClose();
        } catch (err: any) {
            console.error("Submit error:", err);
            enqueueSnackbar(err?.response?.data?.error_user_msg || err?.message || "Something went wrong", { variant: "error" });
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (file: File) => {
        try {
            const formData = new FormData();
            formData.append("file", file);
            setUploading(true);
            const res = await axiosServices.post(`/templates/upload-media/${channelId}`, formData, { headers: { "Content-Type": "multipart/form-data" } });
            setUploading(false);
            handleChange("media", res.data.url);
        } catch (err) {
            console.error("Upload failed", err);
            setUploading(false);
        }
    };

    useEffect(() => {
        if (templateData) {
            const bodyComp = templateData.components?.find((c: any) => c.type === "BODY");
            const headerComp = templateData.components?.find((c: any) => c.type === "HEADER");
            const buttonsComp = templateData.components?.find((c: any) => c.type === "BUTTONS");
            if (bodyComp?.example?.body_text?.[0]) setBodyExamples(bodyComp.example.body_text[0]);
            let mediaUrl = "";
            if (headerComp?.example?.header_handle?.[0]) mediaUrl = headerComp.example.header_handle[0];
            if (buttonsComp?.buttons) {
                setButtons(buttonsComp.buttons.map((btn: any) => ({
                    id: Date.now() + Math.random(),
                    type: btn.type === "PHONE_NUMBER" ? "PHONE" : btn.type,
                    text: btn.text, url: btn.url, phone: btn.phone_number,
                })));
            }
            setForm({
                name: templateData.name, language: templateData.language, category: templateData.category,
                body: bodyComp?.text || "", headerType: headerComp?.format || "NONE",
                media: mediaUrl, headerText: headerComp?.text || "", footer: templateData.footer || "",
            });
        }
    }, [templateData]);

    useEffect(() => {
        const variables = getVariables();
        if (variables.length > 0) {
            setBodyExamples((prev) => {
                const newArr = [...prev];
                while (newArr.length < variables.length) newArr.push("");
                return newArr.slice(0, variables.length);
            });
        } else {
            setBodyExamples([]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [form.body]);

    const addButton = (type: string) => {
        const base = { id: Date.now() + Math.random(), type, text: "" };
        const extra = type === "URL" ? { url: "" } : type === "PHONE" ? { phone: "" } : {};
        setButtons(prev => [...prev, { ...base, ...extra }]);
    };

    const updateButton = (id: any, patch: any) => setButtons(prev => prev.map(b => b.id === id ? { ...b, ...patch } : b));
    const removeButton = (id: any) => setButtons(prev => prev.filter(b => b.id !== id));

    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullWidth
            maxWidth="lg"
            PaperProps={{ sx: { borderRadius: "20px", overflow: "hidden", maxHeight: "92vh" } }}
        >
            {/* ── GRADIENT HEADER ── */}
            <Box
                sx={{
                    background: "linear-gradient(135deg, #064e3b 0%, #065f46 60%, #047857 100%)",
                    px: 3, py: 2.5,
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    flexShrink: 0,
                }}
            >
                <Stack direction="row" alignItems="center" spacing={1.5}>
                    <Box
                        sx={{
                            width: 38, height: 38, borderRadius: "10px",
                            bgcolor: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                        }}
                    >
                        <ArticleOutlinedIcon sx={{ color: "#6ee7b7", fontSize: 20 }} />
                    </Box>
                    <Box>
                        <Typography fontSize={17} fontWeight={800} color="#fff" lineHeight={1.2}>
                            {initialData ? "Edit Template" : "Create Template"}
                        </Typography>
                        <Typography fontSize={12} color="#a7f3d0">
                            {initialData ? "Update your WhatsApp message template" : "Build a new approved WhatsApp template"}
                        </Typography>
                    </Box>
                </Stack>
                <IconButton
                    size="small"
                    onClick={onClose}
                    sx={{ color: "#a7f3d0", bgcolor: "rgba(255,255,255,0.08)", borderRadius: "8px", "&:hover": { bgcolor: "rgba(255,255,255,0.15)" } }}
                >
                    <CloseIcon sx={{ fontSize: 17 }} />
                </IconButton>
            </Box>

            {/* ── CONTENT ── */}
            <DialogContent sx={{ height: "75vh", overflow: "hidden", p: 0 }}>
                {isLoading && (
                    <Box sx={{ display: "flex", justifyContent: "center", pt: 4 }}>
                        <CircularProgress sx={{ color: "#25D366" }} />
                    </Box>
                )}

                <Grid container sx={{ height: "100%" }}>
                    {/* ── LEFT FORM ── */}
                    <Grid
                        item xs={12} md={6}
                        sx={{
                            height: "100%",
                            overflowY: "auto",
                            p: 3,
                            borderRight: "1px solid #f3f4f6",
                            "&::-webkit-scrollbar": { width: 4 },
                            "&::-webkit-scrollbar-thumb": { bgcolor: "#e5e7eb", borderRadius: 4 },
                        }}
                    >
                        <Stack spacing={3}>

                            {/* ── BASIC INFO ── */}
                            <Box>
                                <SectionLabel>Basic Info</SectionLabel>
                                <Stack spacing={2}>
                                    <TextField
                                        fullWidth size="small"
                                        label="Template Name"
                                        value={form.name}
                                        onChange={(e) => handleChange("name", e.target.value)}
                                        sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
                                    />
                                    <Stack direction="row" spacing={1.5}>
                                        <TextField
                                            select fullWidth size="small" label="Category"
                                            value={form.category}
                                            onChange={(e) => handleChange("category", e.target.value)}
                                            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
                                        >
                                            {[
                                                { value: "UTILITY", color: "#3b82f6" },
                                                { value: "MARKETING", color: "#8b5cf6" },
                                                { value: "AUTHENTICATION", color: "#f59e0b" },
                                            ].map(c => (
                                                <MenuItem key={c.value} value={c.value}>
                                                    <Stack direction="row" alignItems="center" spacing={1}>
                                                        <Box sx={{ width: 7, height: 7, borderRadius: "50%", bgcolor: c.color, flexShrink: 0 }} />
                                                        <Typography fontSize={13}>{c.value}</Typography>
                                                    </Stack>
                                                </MenuItem>
                                            ))}
                                        </TextField>
                                        <TextField
                                            select fullWidth size="small" label="Language"
                                            value={form.language}
                                            onChange={(e) => handleChange("language", e.target.value)}
                                            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
                                        >
                                            {whatsapp_language.map((lang) => (
                                                <MenuItem key={lang.value} value={lang.value}>
                                                    {lang.label} ({lang.value})
                                                </MenuItem>
                                            ))}
                                        </TextField>
                                    </Stack>
                                </Stack>
                            </Box>

                            <Divider sx={{ borderColor: "#f3f4f6" }} />

                            {/* ── HEADER ── */}
                            <Box>
                                <SectionLabel>Header</SectionLabel>
                                <Stack spacing={1.5}>
                                    <Stack direction="row" flexWrap="wrap" gap={0.75}>
                                        {HEADER_TYPES.map(t => (
                                            <Chip
                                                key={t} label={t} clickable size="small"
                                                onClick={() => handleChange("headerType", t)}
                                                sx={{
                                                    fontWeight: 700, fontSize: 11, height: 28, borderRadius: "8px",
                                                    bgcolor: form.headerType === t ? "#064e3b" : "#f3f4f6",
                                                    color: form.headerType === t ? "#fff" : "#374151",
                                                    border: `1px solid ${form.headerType === t ? "#064e3b" : "#e5e7eb"}`,
                                                    "&:hover": { bgcolor: form.headerType === t ? "#065f46" : "#e5e7eb" },
                                                }}
                                            />
                                        ))}
                                    </Stack>

                                    {form.headerType !== "NONE" && form.headerType !== "TEXT" && (
                                        <Box>
                                            <Button
                                                variant="outlined" component="label" size="small"
                                                disabled={uploading}
                                                startIcon={uploading ? <CircularProgress size={13} /> : undefined}
                                                sx={{
                                                    borderRadius: "10px", textTransform: "none", fontSize: 13,
                                                    borderColor: "#e5e7eb", color: "#374151",
                                                    "&:hover": { borderColor: "#d1d5db", bgcolor: "#f9fafb" },
                                                }}
                                            >
                                                {uploading ? "Uploading…" : "Upload Media (Image / Video / PDF)"}
                                                <input type="file" hidden accept="image/*,video/*,application/pdf"
                                                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); }}
                                                />
                                            </Button>
                                            {form.media && (
                                                <Typography fontSize={11.5} color="#10b981" mt={0.75} fontWeight={600}>
                                                    ✓ Media uploaded successfully
                                                </Typography>
                                            )}
                                        </Box>
                                    )}

                                    {form.headerType === "TEXT" && (
                                        <TextField
                                            fullWidth size="small" label="Header Text"
                                            value={form.headerText}
                                            onChange={(e) => handleChange("headerText", e.target.value)}
                                            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
                                        />
                                    )}
                                </Stack>
                            </Box>

                            <Divider sx={{ borderColor: "#f3f4f6" }} />

                            {/* ── MESSAGE ── */}
                            <Box>
                                <SectionLabel>Message</SectionLabel>
                                <Stack spacing={2}>
                                    <TextField
                                        fullWidth multiline rows={4} label="Body"
                                        value={form.body}
                                        onChange={(e) => handleChange("body", e.target.value)}
                                        helperText="Use {{1}}, {{2}}, … for dynamic variables"
                                        sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
                                    />

                                    {getVariables().length > 0 && (
                                        <Box sx={{ borderRadius: "12px", border: "1px solid #dbeafe", bgcolor: "#eff6ff", p: 2 }}>
                                            <Typography fontSize={12} fontWeight={700} color="#1d4ed8" mb={1.5}>
                                                Example values for variables
                                            </Typography>
                                            <Stack spacing={1.5}>
                                                {getVariables().map((v: string, i: number) => (
                                                    <TextField
                                                        key={i} size="small" label={`Example for ${v}`}
                                                        value={bodyExamples[i] || ""}
                                                        onChange={(e) => {
                                                            const updated = [...bodyExamples];
                                                            updated[i] = e.target.value;
                                                            setBodyExamples(updated);
                                                        }}
                                                        sx={{ bgcolor: "#fff", "& .MuiOutlinedInput-root": { borderRadius: "8px" } }}
                                                    />
                                                ))}
                                            </Stack>
                                        </Box>
                                    )}

                                    <TextField
                                        fullWidth size="small" label="Footer (Optional)"
                                        placeholder="e.g. Reply STOP to unsubscribe"
                                        value={form.footer}
                                        onChange={(e) => handleChange("footer", e.target.value)}
                                        sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
                                    />
                                </Stack>
                            </Box>

                            <Divider sx={{ borderColor: "#f3f4f6" }} />

                            {/* ── BUTTONS ── */}
                            <Box>
                                <SectionLabel>Buttons</SectionLabel>
                                <Stack spacing={1.5}>
                                    {/* Add button chips */}
                                    <Stack direction="row" flexWrap="wrap" gap={0.75}>
                                        {BUTTON_TYPES.map(btn => {
                                            const isDisabled = btn.type === "QUICK_REPLY" ? quickReplyCount >= 3 : ctaCount >= 2;
                                            return (
                                                <Chip
                                                    key={btn.type} label={btn.label} clickable size="small"
                                                    disabled={isDisabled}
                                                    onClick={() => addButton(btn.type)}
                                                    sx={{
                                                        fontWeight: 700, fontSize: 11, height: 28, borderRadius: "8px",
                                                        bgcolor: `${btn.color}12`,
                                                        color: btn.color,
                                                        border: `1px solid ${btn.color}35`,
                                                        "&:hover": { bgcolor: `${btn.color}22` },
                                                        "&.Mui-disabled": { opacity: 0.4 },
                                                    }}
                                                />
                                            );
                                        })}
                                    </Stack>

                                    {/* Button cards */}
                                    {buttons.map(btn => {
                                        const s = BTN_STYLE[btn.type] || BTN_STYLE.QUICK_REPLY;
                                        return (
                                            <Paper
                                                key={btn.id} variant="outlined"
                                                sx={{
                                                    borderRadius: "10px",
                                                    borderColor: s.border,
                                                    borderLeft: `3px solid ${s.text}`,
                                                    bgcolor: s.bg, p: 1.5,
                                                }}
                                            >
                                                <Stack spacing={1}>
                                                    <Stack direction="row" spacing={1} alignItems="center">
                                                        <Typography fontSize={10.5} fontWeight={700} color={s.text} sx={{ width: 72, flexShrink: 0 }}>
                                                            {BTN_LABEL[btn.type]}
                                                        </Typography>
                                                        <TextField
                                                            fullWidth size="small" placeholder="Button text"
                                                            value={btn.text}
                                                            onChange={(e) => updateButton(btn.id, { text: e.target.value })}
                                                            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px", bgcolor: "#fff" } }}
                                                        />
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => removeButton(btn.id)}
                                                            sx={{ color: "#ef4444", flexShrink: 0, "&:hover": { bgcolor: "#fef2f2" } }}
                                                        >
                                                            <DeleteOutlineIcon sx={{ fontSize: 17 }} />
                                                        </IconButton>
                                                    </Stack>
                                                    {btn.type === "URL" && (
                                                        <TextField
                                                            fullWidth size="small" placeholder="https://example.com"
                                                            value={btn.url || ""}
                                                            onChange={(e) => updateButton(btn.id, { url: e.target.value })}
                                                            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px", bgcolor: "#fff" } }}
                                                        />
                                                    )}
                                                    {btn.type === "PHONE" && (
                                                        <TextField
                                                            fullWidth size="small" placeholder="+91 98765 43210"
                                                            value={btn.phone || ""}
                                                            onChange={(e) => updateButton(btn.id, { phone: e.target.value })}
                                                            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px", bgcolor: "#fff" } }}
                                                        />
                                                    )}
                                                </Stack>
                                            </Paper>
                                        );
                                    })}
                                </Stack>
                            </Box>
                        </Stack>
                    </Grid>

                    {/* ── RIGHT PREVIEW ── */}
                    <Grid
                        item xs={12} md={6}
                        sx={{
                            height: "100%",
                            overflowY: "auto",
                            p: 3,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            bgcolor: "#f8fafc",
                            "&::-webkit-scrollbar": { width: 4 },
                            "&::-webkit-scrollbar-thumb": { bgcolor: "#e5e7eb", borderRadius: 4 },
                        }}
                    >
                        <SectionLabel>Live Preview</SectionLabel>

                        {/* Phone shell */}
                        <Box
                            sx={{
                                width: 280,
                                borderRadius: "38px",
                                background: "linear-gradient(145deg, #1f2937, #111827)",
                                p: "11px",
                                boxShadow: "0 24px 60px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.06)",
                                flexShrink: 0,
                            }}
                        >
                            <Box sx={{
                                borderRadius: "28px",
                                overflow: "hidden",
                                background: "#e5ddd5",
                                display: "flex",
                                flexDirection: "column",
                                height: 540,
                            }}>
                                {/* WhatsApp top bar */}
                                <Box sx={{
                                    background: "linear-gradient(135deg, #075E54, #128C7E)",
                                    height: 58,
                                    display: "flex", alignItems: "flex-end",
                                    px: 1.5, pb: 1, gap: 1,
                                }}>
                                    <Box sx={{ width: 30, height: 30, borderRadius: "50%", bgcolor: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>
                                        🏢
                                    </Box>
                                    <Box>
                                        <Typography fontSize={13} fontWeight={700} color="#fff" lineHeight={1.1}>Business</Typography>
                                        <Typography fontSize={9.5} color="rgba(255,255,255,0.75)">online</Typography>
                                    </Box>
                                </Box>

                                {/* Chat messages area */}
                                <Box sx={{ flex: 1, p: 1.5, overflowY: "auto", display: "flex", flexDirection: "column", gap: 1 }}>
                                    <Box sx={{ bgcolor: "#d9fdd3", p: 0.75, borderRadius: 1.5, fontSize: 9.5, color: "#374151", textAlign: "center", mx: 2, lineHeight: 1.4 }}>
                                        🔒 Messages are end-to-end encrypted
                                    </Box>

                                    {/* Message bubble */}
                                    <Box sx={{
                                        background: "#fff",
                                        borderRadius: "8px 8px 8px 2px",
                                        p: 1.5, maxWidth: "90%",
                                        display: "flex", flexDirection: "column", gap: 0.6,
                                        boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                                    }}>
                                        {form.headerType === "TEXT" && (
                                            <Typography fontWeight={700} fontSize={13} color="#111827">
                                                {form.headerText || "Header text…"}
                                            </Typography>
                                        )}
                                        {form.headerType === "IMAGE" && form.media && (
                                            <img src={form.media} alt="" style={{ width: "100%", borderRadius: 6, maxHeight: 120, objectFit: "cover" }} />
                                        )}
                                        {form.headerType === "VIDEO" && form.media && (
                                            <video src={form.media} controls style={{ width: "100%", maxHeight: 100, borderRadius: 6 }} />
                                        )}
                                        {form.headerType === "DOCUMENT" && form.media && (
                                            <Box sx={{ bgcolor: "#f3f4f6", borderRadius: 1, p: 1, fontSize: 11, color: "#374151" }}>
                                                📄 View Document
                                            </Box>
                                        )}

                                        <Typography fontSize={12.5} color={form.body ? "#111827" : "#9ca3af"} lineHeight={1.55}>
                                            {form.body
                                                ? form.body.replace(/{{(\d+)}}/g, (_, i) => bodyExamples[i - 1] || `{{${i}}}`)
                                                : "Body text will appear here…"
                                            }
                                        </Typography>

                                        {form.footer && (
                                            <Typography fontSize={10.5} color="#9ca3af">{form.footer}</Typography>
                                        )}

                                        <Typography fontSize={9.5} color="#9ca3af" textAlign="right">22:21 ✓✓</Typography>
                                    </Box>

                                    {/* Button previews */}
                                    {buttons.map(btn => (
                                        <Box
                                            key={btn.id}
                                            sx={{
                                                bgcolor: "#fff", borderRadius: "6px", maxWidth: "90%",
                                                py: 0.85, textAlign: "center",
                                                color: "#00a884", fontSize: 12.5, fontWeight: 600,
                                                boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
                                            }}
                                        >
                                            {btn.type === "URL" && "🔗 "}
                                            {btn.type === "PHONE" && "📞 "}
                                            {btn.type === "FLOW" && "⚡ "}
                                            {btn.text || "Button text"}
                                        </Box>
                                    ))}
                                </Box>
                            </Box>
                        </Box>
                    </Grid>
                </Grid>
            </DialogContent>

            {/* ── FOOTER ── */}
            <DialogActions sx={{ px: 3, py: 2, borderTop: "1px solid #f3f4f6", gap: 1, flexShrink: 0 }}>
                <Button
                    onClick={onClose}
                    sx={{ borderRadius: "10px", color: "#6b7280", fontWeight: 600, "&:hover": { bgcolor: "#f9fafb" } }}
                >
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    onClick={handleSubmit}
                    disabled={loading}
                    sx={{
                        borderRadius: "10px", fontWeight: 700, px: 3,
                        bgcolor: "#064e3b", "&:hover": { bgcolor: "#065f46" }, boxShadow: "none",
                    }}
                >
                    {loading
                        ? <><CircularProgress size={15} color="inherit" sx={{ mr: 1 }} />{initialData ? "Updating…" : "Creating…"}</>
                        : initialData ? "Update Template" : "Create Template"
                    }
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default TemplateModal;
