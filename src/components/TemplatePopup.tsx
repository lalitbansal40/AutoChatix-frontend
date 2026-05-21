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
    Switch,
    FormControlLabel,
    Tooltip,
    Alert,
} from "@mui/material";
import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";
import CloseIcon from "@mui/icons-material/Close";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";
import LinkOutlinedIcon from "@mui/icons-material/LinkOutlined";
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
    onSubmit: (data: CreateTemplatePayload) => Promise<void> | void;
    initialData?: any;
}

type Category = "UTILITY" | "MARKETING" | "AUTHENTICATION";
type HeaderType = "NONE" | "TEXT" | "IMAGE" | "VIDEO" | "DOCUMENT";
type MediaMode = "upload" | "dynamic";
type OtpType = "COPY_CODE" | "ONE_TAP" | "ZERO_TAP";

const SectionLabel = ({ children }: { children: string }) => (
    <Typography sx={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.6, mb: 1.5 }}>
        {children}
    </Typography>
);

const HEADER_TYPES: HeaderType[] = ["NONE", "TEXT", "IMAGE", "VIDEO", "DOCUMENT"];

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
    URL: "Website", PHONE: "Call", FLOW: "Flow", QUICK_REPLY: "Quick Reply",
};

const CATEGORY_META: Record<Category, { color: string; bg: string; tip: string }> = {
    MARKETING: {
        color: "#8b5cf6", bg: "#f5f3ff",
        tip: "Promotional messages, offers, announcements. Requires opt-in. Higher delivery costs.",
    },
    UTILITY: {
        color: "#3b82f6", bg: "#eff6ff",
        tip: "Transactional messages like order confirmations, alerts, and account updates.",
    },
    AUTHENTICATION: {
        color: "#f59e0b", bg: "#fffbeb",
        tip: "OTP / verification code templates. Meta auto-generates the body. Only OTP buttons allowed.",
    },
};

const OTP_TYPES: { value: OtpType; label: string; desc: string }[] = [
    { value: "COPY_CODE", label: "Copy Code", desc: "User taps to copy the OTP code" },
    { value: "ONE_TAP", label: "One-Tap (Android)", desc: "Auto-fills on Android using SMS Retriever API" },
    { value: "ZERO_TAP", label: "Zero-Tap", desc: "Fully automatic — requires user consent" },
];

// ── Component ────────────────────────────────────────────────────────────────

const TemplateModal = ({ open, onClose, onSubmit, initialData }: Props) => {
    const [loading, setLoading] = useState(false);
    const { enqueueSnackbar } = useSnackbar();
    const { id: channelId } = useParams();
    const [buttons, setButtons] = useState<any[]>([]);
    const [bodyExamples, setBodyExamples] = useState<string[]>([]);
    const [uploading, setUploading] = useState(false);
    const [exampleUploading, setExampleUploading] = useState(false);

    // Core form
    const [form, setForm] = useState<{
        name: string;
        language: string;
        category: Category;
        body: string;
        headerType: HeaderType;
        media: string;
        mediaMode: MediaMode;
        mediaExampleUrl: string;
        headerText: string;
        footer: string;
        // Auth-specific
        addSecurityRec: boolean;
        otpExpiry: number | "";
        otpType: OtpType;
        otpButtonText: string;
        packageName: string;
        signatureHash: string;
    }>({
        name: "", language: "en_US", category: "UTILITY",
        body: "", headerType: "NONE",
        media: "", mediaMode: "upload", mediaExampleUrl: "",
        headerText: "", footer: "",
        addSecurityRec: false, otpExpiry: 10,
        otpType: "COPY_CODE", otpButtonText: "Copy Code",
        packageName: "", signatureHash: "",
    });

    const isAuth = form.category === "AUTHENTICATION";
    const quickReplyCount = buttons.filter(b => b.type === "QUICK_REPLY").length;
    const ctaCount = buttons.filter(b => b.type !== "QUICK_REPLY").length;

    const handleChange = (key: string, value: any) =>
        setForm((prev) => ({ ...prev, [key]: value }));

    // ── Load existing template ────────────────────────────────────────────────

    const { data: templateData, isLoading } = useQuery({
        queryKey: ["template", initialData?.id],
        queryFn: () => templateService.getTemplateById(channelId!, initialData.id),
        enabled: !!initialData?.id && open,
        select: (res) => res.data,
    });

    useEffect(() => {
        if (!templateData) return;
        const bodyComp = templateData.components?.find((c: any) => c.type === "BODY");
        const headerComp = templateData.components?.find((c: any) => c.type === "HEADER");
        const buttonsComp = templateData.components?.find((c: any) => c.type === "BUTTONS");
        const footerComp = templateData.components?.find((c: any) => c.type === "FOOTER");

        let mediaUrl = "";
        let mediaExUrl = "";
        let mediaMode: MediaMode = "upload";
        if (headerComp?.example?.header_handle?.[0]) {
            mediaUrl = headerComp.example.header_handle[0];
            // If URL ends with a known extension it was uploaded; otherwise treat as dynamic example
            mediaMode = "upload";
        }

        if (buttonsComp?.buttons) {
            setButtons(buttonsComp.buttons.map((btn: any) => ({
                id: Date.now() + Math.random(),
                type: btn.type === "PHONE_NUMBER" ? "PHONE" : btn.type,
                text: btn.text, url: btn.url, phone: btn.phone_number,
                otp_type: btn.otp_type,
            })));
        }
        if (bodyComp?.example?.body_text?.[0]) setBodyExamples(bodyComp.example.body_text[0]);

        const otpBtn = buttonsComp?.buttons?.find((b: any) => b.type === "OTP");

        setForm((prev) => ({
            ...prev,
            name: templateData.name, language: templateData.language,
            category: templateData.category as Category,
            body: bodyComp?.text || "",
            headerType: (headerComp?.format as HeaderType) || "NONE",
            media: mediaUrl, mediaMode, mediaExampleUrl: mediaExUrl,
            headerText: headerComp?.text || "",
            footer: footerComp?.text || templateData.footer || "",
            addSecurityRec: bodyComp?.add_security_recommendation || false,
            otpExpiry: footerComp?.code_expiration_minutes ?? 10,
            otpType: otpBtn?.otp_type || "COPY_CODE",
            otpButtonText: otpBtn?.text || "Copy Code",
            packageName: otpBtn?.package_name || "",
            signatureHash: otpBtn?.signature_hash || "",
        }));
    }, [templateData]);

    // ── Sync body examples with variables ────────────────────────────────────

    const getVariables = () => form.body.match(/{{\d+}}/g) || [];

    useEffect(() => {
        const vars = getVariables();
        if (vars.length > 0) {
            setBodyExamples((prev) => {
                const arr = [...prev];
                while (arr.length < vars.length) arr.push("");
                return arr.slice(0, vars.length);
            });
        } else {
            setBodyExamples([]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [form.body]);

    // ── File upload ───────────────────────────────────────────────────────────

    const handleFileUpload = async (file: File) => {
        try {
            const fd = new FormData();
            fd.append("file", file);
            setUploading(true);
            const res = await axiosServices.post(`/templates/upload-media/${channelId}`, fd, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            handleChange("media", res.data.url);
        } catch {
            enqueueSnackbar("Upload failed", { variant: "error" });
        } finally {
            setUploading(false);
        }
    };

    // Upload example image to S3 and auto-fill the example URL field (dynamic mode)
    const handleExampleFileUpload = async (file: File) => {
        try {
            const fd = new FormData();
            fd.append("file", file);
            setExampleUploading(true);
            const res = await axiosServices.post(`/templates/upload-media/${channelId}`, fd, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            handleChange("mediaExampleUrl", res.data.url);
            enqueueSnackbar("Example image uploaded to S3", { variant: "success" });
        } catch {
            enqueueSnackbar("Upload failed", { variant: "error" });
        } finally {
            setExampleUploading(false);
        }
    };

    // ── Buttons ───────────────────────────────────────────────────────────────

    const addButton = (type: string) => {
        const base = { id: Date.now() + Math.random(), type, text: "" };
        const extra = type === "URL" ? { url: "" } : type === "PHONE" ? { phone: "" } : {};
        setButtons((prev) => [...prev, { ...base, ...extra }]);
    };
    const updateButton = (id: any, patch: any) =>
        setButtons((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));
    const removeButton = (id: any) => setButtons((prev) => prev.filter((b) => b.id !== id));

    // ── Submit ────────────────────────────────────────────────────────────────

    const handleSubmit = async () => {
        if (loading) return;
        try {
            const components: any[] = [];

            if (isAuth) {
                // AUTHENTICATION template
                const bodyComp: any = { type: "BODY" };
                if (form.addSecurityRec) bodyComp.add_security_recommendation = true;
                components.push(bodyComp);

                if (form.otpExpiry !== "" && Number(form.otpExpiry) > 0) {
                    components.push({ type: "FOOTER", code_expiration_minutes: Number(form.otpExpiry) });
                }

                const otpBtn: any = { type: "OTP", otp_type: form.otpType, text: form.otpButtonText || "Copy Code" };
                if (form.otpType === "ONE_TAP" || form.otpType === "ZERO_TAP") {
                    if (!form.packageName || !form.signatureHash) {
                        enqueueSnackbar("Package name and signature hash are required for One-Tap / Zero-Tap", { variant: "error" });
                        return;
                    }
                    otpBtn.package_name = form.packageName;
                    otpBtn.signature_hash = form.signatureHash;
                }
                components.push({ type: "BUTTONS", buttons: [otpBtn] });
            } else {
                // MARKETING / UTILITY

                // Header
                if (form.headerType !== "NONE") {
                    const headerComp: any = { type: "HEADER", format: form.headerType };
                    if (form.headerType === "TEXT") {
                        if (!form.headerText) { enqueueSnackbar("Header text is required", { variant: "error" }); return; }
                        headerComp.text = form.headerText;
                    } else {
                        // media header
                        const exampleUrl = form.mediaMode === "dynamic"
                            ? form.mediaExampleUrl
                            : form.media;

                        if (!exampleUrl) {
                            enqueueSnackbar(
                                form.mediaMode === "dynamic"
                                    ? "Please enter an example URL for the dynamic header"
                                    : "Please upload media for header",
                                { variant: "error" }
                            );
                            return;
                        }
                        headerComp.example = { header_handle: [exampleUrl] };
                        if (form.mediaMode === "dynamic") {
                            headerComp.dynamic = true; // custom flag so send-modal knows URL is variable
                        }
                    }
                    components.push(headerComp);
                }

                // Body
                if (!form.body) { enqueueSnackbar("Body is required", { variant: "error" }); return; }
                const vars = getVariables();
                if (vars.length > 0 && bodyExamples.some((v) => !v)) {
                    enqueueSnackbar("Please fill all example values for body variables", { variant: "error" });
                    return;
                }
                const bodyComp: any = { type: "BODY", text: form.body };
                if (vars.length > 0) bodyComp.example = { body_text: [bodyExamples] };
                components.push(bodyComp);

                // Footer
                if (form.footer) components.push({ type: "FOOTER", text: form.footer });

                // Buttons
                if (buttons.length > 0) {
                    components.push({
                        type: "BUTTONS",
                        buttons: buttons.map((b) => ({
                            type: b.type === "QUICK_REPLY" ? "QUICK_REPLY"
                                : b.type === "URL" ? "URL"
                                : b.type === "PHONE" ? "PHONE_NUMBER"
                                : "FLOW",
                            text: b.text,
                            url: b.url,
                            phone_number: b.phone,
                        })),
                    });
                }
            }

            const formattedName = form.name.toLowerCase().replace(/[^a-z0-9_]/g, "_");
            const payload: CreateTemplatePayload = {
                name: formattedName,
                language: form.language,
                category: form.category,
                components,
            };

            setLoading(true);
            await onSubmit(payload);
            enqueueSnackbar(initialData ? "Template updated" : "Template created successfully", { variant: "success" });
            onClose();
        } catch (err: any) {
            enqueueSnackbar(err?.response?.data?.error_user_msg || err?.message || "Something went wrong", { variant: "error" });
        } finally {
            setLoading(false);
        }
    };

    // ── Helpers ───────────────────────────────────────────────────────────────

    const catMeta = CATEGORY_META[form.category];

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <Dialog
            open={open} onClose={onClose} fullWidth maxWidth="lg"
            PaperProps={{ sx: { borderRadius: "20px", overflow: "hidden", maxHeight: "92vh" } }}
        >
            {/* ── GRADIENT HEADER ── */}
            <Box sx={{
                background: "linear-gradient(135deg, #064e3b 0%, #065f46 60%, #047857 100%)",
                px: 3, py: 2.5,
                display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0,
            }}>
                <Stack direction="row" alignItems="center" spacing={1.5}>
                    <Box sx={{
                        width: 38, height: 38, borderRadius: "10px",
                        bgcolor: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
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
                <IconButton size="small" onClick={onClose}
                    sx={{ color: "#a7f3d0", bgcolor: "rgba(255,255,255,0.08)", borderRadius: "8px", "&:hover": { bgcolor: "rgba(255,255,255,0.15)" } }}>
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
                    <Grid item xs={12} md={6} sx={{
                        height: "100%", overflowY: "auto", p: 3,
                        borderRight: "1px solid #f3f4f6",
                        "&::-webkit-scrollbar": { width: 4 },
                        "&::-webkit-scrollbar-thumb": { bgcolor: "#e5e7eb", borderRadius: 4 },
                    }}>
                        <Stack spacing={3}>

                            {/* ── BASIC INFO ── */}
                            <Box>
                                <SectionLabel>Basic Info</SectionLabel>
                                <Stack spacing={2}>
                                    <TextField
                                        fullWidth size="small" label="Template Name"
                                        value={form.name}
                                        onChange={(e) => handleChange("name", e.target.value)}
                                        helperText="Lowercase, underscores only (auto-formatted)"
                                        sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
                                    />
                                    <Stack direction="row" spacing={1.5}>
                                        <TextField
                                            select fullWidth size="small" label="Category"
                                            value={form.category}
                                            onChange={(e) => handleChange("category", e.target.value as Category)}
                                            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
                                        >
                                            {(["UTILITY", "MARKETING", "AUTHENTICATION"] as Category[]).map((c) => (
                                                <MenuItem key={c} value={c}>
                                                    <Stack direction="row" alignItems="center" spacing={1}>
                                                        <Box sx={{ width: 7, height: 7, borderRadius: "50%", bgcolor: CATEGORY_META[c].color, flexShrink: 0 }} />
                                                        <Typography fontSize={13}>{c}</Typography>
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

                                    {/* Category info tip */}
                                    <Box sx={{
                                        bgcolor: catMeta.bg, border: `1px solid ${catMeta.color}30`,
                                        borderLeft: `3px solid ${catMeta.color}`,
                                        borderRadius: "8px", px: 1.5, py: 1,
                                        display: "flex", gap: 1, alignItems: "flex-start",
                                    }}>
                                        <InfoOutlinedIcon sx={{ fontSize: 14, color: catMeta.color, mt: 0.2, flexShrink: 0 }} />
                                        <Typography fontSize={11.5} color={catMeta.color} lineHeight={1.55}>
                                            {catMeta.tip}
                                        </Typography>
                                    </Box>
                                </Stack>
                            </Box>

                            <Divider sx={{ borderColor: "#f3f4f6" }} />

                            {/* ── AUTHENTICATION SPECIFIC ── */}
                            {isAuth ? (
                                <Box>
                                    <SectionLabel>OTP Configuration</SectionLabel>
                                    <Stack spacing={2}>
                                        {/* Body preview */}
                                        <Box sx={{ bgcolor: "#f9fafb", border: "1px dashed #e5e7eb", borderRadius: "10px", p: 1.5 }}>
                                            <Typography fontSize={11} color="#9ca3af" fontWeight={600} mb={0.5}>
                                                AUTO-GENERATED BODY (by Meta)
                                            </Typography>
                                            <Typography fontSize={12.5} color="#374151" lineHeight={1.6}>
                                                <strong>{"{{1}}"}</strong> is your verification code.{" "}
                                                {form.addSecurityRec && "For your security, do not share this code."}
                                            </Typography>
                                        </Box>

                                        <FormControlLabel
                                            control={
                                                <Switch
                                                    checked={form.addSecurityRec}
                                                    onChange={(e) => handleChange("addSecurityRec", e.target.checked)}
                                                    size="small"
                                                    sx={{ "& .MuiSwitch-switchBase.Mui-checked": { color: "#064e3b" }, "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { bgcolor: "#064e3b" } }}
                                                />
                                            }
                                            label={<Typography fontSize={13}>Add security recommendation</Typography>}
                                        />

                                        <TextField
                                            fullWidth size="small" type="number"
                                            label="OTP Expiry (minutes)"
                                            placeholder="10"
                                            value={form.otpExpiry}
                                            onChange={(e) => handleChange("otpExpiry", e.target.value === "" ? "" : Number(e.target.value))}
                                            helperText="Leave blank to omit expiry notice"
                                            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
                                            InputProps={{ inputProps: { min: 1, max: 90 } }}
                                        />

                                        {/* OTP button type */}
                                        <Box>
                                            <Typography fontSize={12} fontWeight={600} color="#374151" mb={1}>
                                                OTP Button Type
                                            </Typography>
                                            <Stack spacing={1}>
                                                {OTP_TYPES.map((t) => (
                                                    <Paper
                                                        key={t.value}
                                                        variant="outlined"
                                                        onClick={() => {
                                                            handleChange("otpType", t.value);
                                                            if (t.value === "COPY_CODE") handleChange("otpButtonText", "Copy Code");
                                                        }}
                                                        sx={{
                                                            p: 1.5, borderRadius: "10px", cursor: "pointer",
                                                            borderColor: form.otpType === t.value ? "#f59e0b" : "#e5e7eb",
                                                            bgcolor: form.otpType === t.value ? "#fffbeb" : "#fff",
                                                            borderWidth: form.otpType === t.value ? 2 : 1,
                                                            transition: "all 0.15s",
                                                        }}
                                                    >
                                                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                                                            <Box>
                                                                <Typography fontSize={13} fontWeight={600} color={form.otpType === t.value ? "#b45309" : "#374151"}>
                                                                    {t.label}
                                                                </Typography>
                                                                <Typography fontSize={11} color="#9ca3af">{t.desc}</Typography>
                                                            </Box>
                                                            {form.otpType === t.value && (
                                                                <Box sx={{ width: 18, height: 18, borderRadius: "50%", bgcolor: "#f59e0b", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                                    <Typography fontSize={10} color="#fff" fontWeight={800}>✓</Typography>
                                                                </Box>
                                                            )}
                                                        </Stack>
                                                    </Paper>
                                                ))}
                                            </Stack>
                                        </Box>

                                        <TextField
                                            fullWidth size="small" label="OTP Button Text"
                                            value={form.otpButtonText}
                                            onChange={(e) => handleChange("otpButtonText", e.target.value)}
                                            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
                                        />

                                        {(form.otpType === "ONE_TAP" || form.otpType === "ZERO_TAP") && (
                                            <Box sx={{ bgcolor: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "10px", p: 2 }}>
                                                <Typography fontSize={12} fontWeight={700} color="#1d4ed8" mb={1.5}>
                                                    Android App Details (required for {form.otpType === "ONE_TAP" ? "One-Tap" : "Zero-Tap"})
                                                </Typography>
                                                <Stack spacing={1.5}>
                                                    <TextField
                                                        fullWidth size="small" label="Package Name"
                                                        placeholder="com.example.app"
                                                        value={form.packageName}
                                                        onChange={(e) => handleChange("packageName", e.target.value)}
                                                        sx={{ bgcolor: "#fff", "& .MuiOutlinedInput-root": { borderRadius: "8px" } }}
                                                    />
                                                    <TextField
                                                        fullWidth size="small" label="App Signature Hash"
                                                        placeholder="K8akiDTm75A"
                                                        value={form.signatureHash}
                                                        onChange={(e) => handleChange("signatureHash", e.target.value)}
                                                        sx={{ bgcolor: "#fff", "& .MuiOutlinedInput-root": { borderRadius: "8px" } }}
                                                    />
                                                </Stack>
                                            </Box>
                                        )}
                                    </Stack>
                                </Box>
                            ) : (
                                <>
                                    {/* ── HEADER ── */}
                                    <Box>
                                        <SectionLabel>Header</SectionLabel>
                                        <Stack spacing={1.5}>
                                            <Stack direction="row" flexWrap="wrap" gap={0.75}>
                                                {HEADER_TYPES.map((t) => (
                                                    <Chip
                                                        key={t} label={t} clickable size="small"
                                                        onClick={() => { handleChange("headerType", t); handleChange("mediaMode", "upload"); }}
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

                                            {/* TEXT header */}
                                            {form.headerType === "TEXT" && (
                                                <TextField
                                                    fullWidth size="small" label="Header Text"
                                                    value={form.headerText}
                                                    onChange={(e) => handleChange("headerText", e.target.value)}
                                                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
                                                />
                                            )}

                                            {/* Media header (IMAGE / VIDEO / DOCUMENT) */}
                                            {form.headerType !== "NONE" && form.headerType !== "TEXT" && (
                                                <Box>
                                                    {/* Upload vs Dynamic toggle */}
                                                    <Stack direction="row" gap={1} mb={1.5}>
                                                        {[
                                                            { mode: "upload" as MediaMode, icon: <UploadFileOutlinedIcon sx={{ fontSize: 14 }} />, label: "Fixed Image" },
                                                            { mode: "dynamic" as MediaMode, icon: <LinkOutlinedIcon sx={{ fontSize: 14 }} />, label: "URL at Send Time" },
                                                        ].map(({ mode, icon, label }) => (
                                                            <Button
                                                                key={mode}
                                                                size="small"
                                                                startIcon={icon}
                                                                onClick={() => handleChange("mediaMode", mode)}
                                                                variant={form.mediaMode === mode ? "contained" : "outlined"}
                                                                sx={{
                                                                    borderRadius: "8px", textTransform: "none", fontSize: 12,
                                                                    fontWeight: 600,
                                                                    ...(form.mediaMode === mode
                                                                        ? { bgcolor: "#064e3b", "&:hover": { bgcolor: "#065f46" } }
                                                                        : { borderColor: "#e5e7eb", color: "#6b7280", "&:hover": { borderColor: "#d1d5db", bgcolor: "#f9fafb" } }
                                                                    ),
                                                                }}
                                                            >
                                                                {label}
                                                            </Button>
                                                        ))}
                                                        <Tooltip
                                                            title="URL at Send Time: when running a campaign, you enter the image URL once and it's sent to all contacts. No image is stored in the template — only an example URL is needed here for Meta's approval."
                                                            arrow placement="top"
                                                        >
                                                            <InfoOutlinedIcon sx={{ fontSize: 16, color: "#9ca3af", alignSelf: "center", ml: 0.5, cursor: "help" }} />
                                                        </Tooltip>
                                                    </Stack>

                                                    {/* Upload mode */}
                                                    {form.mediaMode === "upload" && (
                                                        <Box>
                                                            <Button
                                                                variant="outlined" component="label" size="small"
                                                                disabled={uploading}
                                                                startIcon={uploading ? <CircularProgress size={13} /> : <UploadFileOutlinedIcon sx={{ fontSize: 15 }} />}
                                                                sx={{
                                                                    borderRadius: "10px", textTransform: "none", fontSize: 13,
                                                                    borderColor: "#e5e7eb", color: "#374151",
                                                                    "&:hover": { borderColor: "#d1d5db", bgcolor: "#f9fafb" },
                                                                }}
                                                            >
                                                                {uploading ? "Uploading…" : `Upload ${form.headerType === "IMAGE" ? "Image" : form.headerType === "VIDEO" ? "Video" : "Document"}`}
                                                                <input
                                                                    type="file" hidden
                                                                    accept={form.headerType === "IMAGE" ? "image/*" : form.headerType === "VIDEO" ? "video/*" : "application/pdf"}
                                                                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); }}
                                                                />
                                                            </Button>
                                                            {form.media && (
                                                                <Typography fontSize={11.5} color="#10b981" mt={0.75} fontWeight={600}>
                                                                    ✓ Fixed image — always sent to all contacts
                                                                </Typography>
                                                            )}
                                                        </Box>
                                                    )}

                                                    {/* Dynamic URL mode */}
                                                    {form.mediaMode === "dynamic" && (
                                                        <Box>
                                                            <Alert
                                                                severity="info"
                                                                sx={{ borderRadius: "10px", mb: 1.5, fontSize: 12, py: 0.5 }}
                                                                icon={<LinkOutlinedIcon fontSize="small" />}
                                                            >
                                                                <strong>URL at send time</strong> — when you run a campaign, you'll enter the image URL <strong>once</strong> and it's sent to all contacts. Upload an example image below for Meta's approval review.
                                                            </Alert>

                                                            {/* Upload example to S3 or type URL */}
                                                            <Stack direction="row" alignItems="center" spacing={1} mb={1.5}>
                                                                <Button
                                                                    variant="outlined" component="label" size="small"
                                                                    disabled={exampleUploading}
                                                                    startIcon={exampleUploading ? <CircularProgress size={13} /> : <UploadFileOutlinedIcon sx={{ fontSize: 15 }} />}
                                                                    sx={{
                                                                        borderRadius: "10px", textTransform: "none", fontSize: 12, fontWeight: 600,
                                                                        borderColor: "#064e3b", color: "#064e3b",
                                                                        "&:hover": { borderColor: "#065f46", bgcolor: "#f0fdf4" },
                                                                        flexShrink: 0,
                                                                    }}
                                                                >
                                                                    {exampleUploading ? "Uploading…" : "Upload Example to S3"}
                                                                    <input
                                                                        type="file" hidden
                                                                        accept={form.headerType === "IMAGE" ? "image/*" : form.headerType === "VIDEO" ? "video/*" : "application/pdf"}
                                                                        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleExampleFileUpload(f); }}
                                                                    />
                                                                </Button>
                                                                <Typography fontSize={11} color="#9ca3af">or paste URL below</Typography>
                                                            </Stack>

                                                            <TextField
                                                                fullWidth size="small"
                                                                label={`Example ${form.headerType === "IMAGE" ? "Image" : form.headerType === "VIDEO" ? "Video" : "Document"} URL (for Meta approval)`}
                                                                placeholder="https://s3.amazonaws.com/bucket/example.jpg"
                                                                value={form.mediaExampleUrl}
                                                                onChange={(e) => handleChange("mediaExampleUrl", e.target.value)}
                                                                sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
                                                                helperText={form.mediaExampleUrl ? "✓ Example URL set — Meta reviewers will see this image" : "Meta reviewers see this URL for approval. Actual send URL is entered at campaign launch."}
                                                                FormHelperTextProps={{ sx: { color: form.mediaExampleUrl ? "#10b981" : undefined } }}
                                                            />
                                                        </Box>
                                                    )}
                                                </Box>
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
                                                        Example values (required by Meta for approval)
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
                                            <Stack direction="row" flexWrap="wrap" gap={0.75}>
                                                {BUTTON_TYPES.map((btn) => {
                                                    const isDisabled = btn.type === "QUICK_REPLY" ? quickReplyCount >= 3 : ctaCount >= 2;
                                                    return (
                                                        <Chip
                                                            key={btn.type} label={btn.label} clickable size="small"
                                                            disabled={isDisabled}
                                                            onClick={() => addButton(btn.type)}
                                                            sx={{
                                                                fontWeight: 700, fontSize: 11, height: 28, borderRadius: "8px",
                                                                bgcolor: `${btn.color}12`, color: btn.color,
                                                                border: `1px solid ${btn.color}35`,
                                                                "&:hover": { bgcolor: `${btn.color}22` },
                                                                "&.Mui-disabled": { opacity: 0.4 },
                                                            }}
                                                        />
                                                    );
                                                })}
                                            </Stack>

                                            {buttons.map((btn) => {
                                                const s = BTN_STYLE[btn.type] || BTN_STYLE.QUICK_REPLY;
                                                return (
                                                    <Paper key={btn.id} variant="outlined" sx={{
                                                        borderRadius: "10px", borderColor: s.border,
                                                        borderLeft: `3px solid ${s.text}`,
                                                        bgcolor: s.bg, p: 1.5,
                                                    }}>
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
                                                                <IconButton size="small" onClick={() => removeButton(btn.id)}
                                                                    sx={{ color: "#ef4444", flexShrink: 0, "&:hover": { bgcolor: "#fef2f2" } }}>
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
                                </>
                            )}
                        </Stack>
                    </Grid>

                    {/* ── RIGHT PREVIEW ── */}
                    <Grid item xs={12} md={6} sx={{
                        height: "100%", overflowY: "auto", p: 3,
                        display: "flex", flexDirection: "column", alignItems: "center",
                        bgcolor: "#f8fafc",
                        "&::-webkit-scrollbar": { width: 4 },
                        "&::-webkit-scrollbar-thumb": { bgcolor: "#e5e7eb", borderRadius: 4 },
                    }}>
                        <SectionLabel>Live Preview</SectionLabel>

                        <Box sx={{
                            width: 280, borderRadius: "38px",
                            background: "linear-gradient(145deg, #1f2937, #111827)",
                            p: "11px",
                            boxShadow: "0 24px 60px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.06)",
                            flexShrink: 0,
                        }}>
                            <Box sx={{ borderRadius: "28px", overflow: "hidden", background: "#e5ddd5", display: "flex", flexDirection: "column", height: 540 }}>
                                {/* WA top bar */}
                                <Box sx={{
                                    background: "linear-gradient(135deg, #075E54, #128C7E)",
                                    height: 58, display: "flex", alignItems: "flex-end", px: 1.5, pb: 1, gap: 1,
                                }}>
                                    <Box sx={{ width: 30, height: 30, borderRadius: "50%", bgcolor: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>
                                        🏢
                                    </Box>
                                    <Box>
                                        <Typography fontSize={13} fontWeight={700} color="#fff" lineHeight={1.1}>Business</Typography>
                                        <Typography fontSize={9.5} color="rgba(255,255,255,0.75)">online</Typography>
                                    </Box>
                                </Box>

                                {/* Chat area */}
                                <Box sx={{ flex: 1, p: 1.5, overflowY: "auto", display: "flex", flexDirection: "column", gap: 1 }}>
                                    <Box sx={{ bgcolor: "#d9fdd3", p: 0.75, borderRadius: 1.5, fontSize: 9.5, color: "#374151", textAlign: "center", mx: 2 }}>
                                        🔒 Messages are end-to-end encrypted
                                    </Box>

                                    {/* Bubble */}
                                    <Box sx={{
                                        background: "#fff", borderRadius: "8px 8px 8px 2px",
                                        p: 1.5, maxWidth: "90%",
                                        display: "flex", flexDirection: "column", gap: 0.6,
                                        boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                                    }}>
                                        {/* Header preview */}
                                        {form.headerType === "TEXT" && (
                                            <Typography fontWeight={700} fontSize={13} color="#111827">
                                                {form.headerText || "Header text…"}
                                            </Typography>
                                        )}
                                        {form.headerType === "IMAGE" && (
                                            form.mediaMode === "upload" && form.media ? (
                                                <img src={form.media} alt="" style={{ width: "100%", borderRadius: 6, maxHeight: 120, objectFit: "cover" }} />
                                            ) : form.mediaMode === "dynamic" ? (
                                                <Box sx={{ bgcolor: "#e0f2fe", borderRadius: 1, p: 1.5, display: "flex", alignItems: "center", gap: 1, justifyContent: "center" }}>
                                                    <LinkOutlinedIcon sx={{ fontSize: 16, color: "#0284c7" }} />
                                                    <Typography fontSize={11} color="#0284c7" fontWeight={600}>Image URL entered at campaign send time</Typography>
                                                </Box>
                                            ) : (
                                                <Box sx={{ bgcolor: "#f3f4f6", borderRadius: 1, p: 1.5, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                    <Typography fontSize={11} color="#9ca3af">🖼 Image placeholder</Typography>
                                                </Box>
                                            )
                                        )}
                                        {form.headerType === "VIDEO" && (
                                            form.mediaMode === "upload" && form.media ? (
                                                <video src={form.media} controls style={{ width: "100%", maxHeight: 100, borderRadius: 6 }} />
                                            ) : form.mediaMode === "dynamic" ? (
                                                <Box sx={{ bgcolor: "#fce7f3", borderRadius: 1, p: 1.5, display: "flex", alignItems: "center", gap: 1, justifyContent: "center" }}>
                                                    <LinkOutlinedIcon sx={{ fontSize: 16, color: "#db2777" }} />
                                                    <Typography fontSize={11} color="#db2777" fontWeight={600}>Video URL entered at campaign send time</Typography>
                                                </Box>
                                            ) : (
                                                <Box sx={{ bgcolor: "#f3f4f6", borderRadius: 1, p: 1.5, textAlign: "center" }}>
                                                    <Typography fontSize={11} color="#9ca3af">🎥 Video placeholder</Typography>
                                                </Box>
                                            )
                                        )}
                                        {form.headerType === "DOCUMENT" && (
                                            form.mediaMode === "dynamic" ? (
                                                <Box sx={{ bgcolor: "#fef3c7", borderRadius: 1, p: 1.5, display: "flex", alignItems: "center", gap: 1 }}>
                                                    <LinkOutlinedIcon sx={{ fontSize: 16, color: "#d97706" }} />
                                                    <Typography fontSize={11} color="#d97706" fontWeight={600}>Document URL entered at campaign send time</Typography>
                                                </Box>
                                            ) : form.media ? (
                                                <Box sx={{ bgcolor: "#f3f4f6", borderRadius: 1, p: 1, fontSize: 11, color: "#374151" }}>📄 View Document</Box>
                                            ) : (
                                                <Box sx={{ bgcolor: "#f3f4f6", borderRadius: 1, p: 1, textAlign: "center" }}>
                                                    <Typography fontSize={11} color="#9ca3af">📄 Document placeholder</Typography>
                                                </Box>
                                            )
                                        )}

                                        {/* Body */}
                                        {isAuth ? (
                                            <Box>
                                                <Typography fontSize={12.5} color="#111827" lineHeight={1.55}>
                                                    <strong>123456</strong> is your verification code.
                                                    {form.addSecurityRec && " For your security, do not share this code."}
                                                </Typography>
                                                {form.otpExpiry !== "" && Number(form.otpExpiry) > 0 && (
                                                    <Typography fontSize={10.5} color="#9ca3af" mt={0.5}>
                                                        This code expires in {form.otpExpiry} minutes.
                                                    </Typography>
                                                )}
                                            </Box>
                                        ) : (
                                            <Typography fontSize={12.5} color={form.body ? "#111827" : "#9ca3af"} lineHeight={1.55}>
                                                {form.body
                                                    ? form.body.replace(/{{(\d+)}}/g, (_, i) => bodyExamples[i - 1] || `{{${i}}}`)
                                                    : "Body text will appear here…"}
                                            </Typography>
                                        )}

                                        {form.footer && !isAuth && (
                                            <Typography fontSize={10.5} color="#9ca3af">{form.footer}</Typography>
                                        )}
                                        <Typography fontSize={9.5} color="#9ca3af" textAlign="right">22:21 ✓✓</Typography>
                                    </Box>

                                    {/* Button previews */}
                                    {isAuth ? (
                                        <Box sx={{
                                            bgcolor: "#fff", borderRadius: "6px", maxWidth: "90%",
                                            py: 0.85, textAlign: "center",
                                            color: "#00a884", fontSize: 12.5, fontWeight: 600,
                                            boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
                                        }}>
                                            🔑 {form.otpButtonText || "Copy Code"}
                                        </Box>
                                    ) : (
                                        buttons.map((btn) => (
                                            <Box key={btn.id} sx={{
                                                bgcolor: "#fff", borderRadius: "6px", maxWidth: "90%",
                                                py: 0.85, textAlign: "center",
                                                color: "#00a884", fontSize: 12.5, fontWeight: 600,
                                                boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
                                            }}>
                                                {btn.type === "URL" && "🔗 "}
                                                {btn.type === "PHONE" && "📞 "}
                                                {btn.type === "FLOW" && "⚡ "}
                                                {btn.text || "Button text"}
                                            </Box>
                                        ))
                                    )}
                                </Box>
                            </Box>
                        </Box>

                        {/* Preview legend */}
                        <Box sx={{ mt: 2, width: "100%", maxWidth: 280 }}>
                            <Stack direction="row" alignItems="center" gap={1} mb={0.5}>
                                <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: catMeta.color }} />
                                <Typography fontSize={11} color={catMeta.color} fontWeight={700}>
                                    {form.category}
                                </Typography>
                            </Stack>
                            {form.mediaMode === "dynamic" && form.headerType !== "NONE" && form.headerType !== "TEXT" && (
                                <Stack direction="row" alignItems="center" gap={0.75}>
                                    <LinkOutlinedIcon sx={{ fontSize: 12, color: "#6b7280" }} />
                                    <Typography fontSize={11} color="#6b7280">
                                        Image/Video URL entered once when sending campaign
                                    </Typography>
                                </Stack>
                            )}
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
                    disabled={loading || !form.name || (!isAuth && !form.body)}
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
