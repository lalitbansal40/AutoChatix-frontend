import {
    Dialog,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    CircularProgress,
    Autocomplete,
    Typography,
    Stack,
    Box,
    IconButton,
    Chip,
    Paper,
    Divider,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import CloseIcon from "@mui/icons-material/Close";
import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";
import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";
import VariablePicker from "components/VariablePicker";
import { useState, useMemo } from "react";
import { templateService } from "service/template.service";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useSnackbar } from "notistack";
import { walletService } from "service/wallet.service";

interface Props {
    open: boolean;
    onClose: () => void;
    user: any;
    channelId: string;
}

const CATEGORY_COLOR: Record<string, { color: string; bg: string }> = {
    UTILITY: { color: "#3b82f6", bg: "#eff6ff" },
    MARKETING: { color: "#8b5cf6", bg: "#f5f3ff" },
    AUTHENTICATION: { color: "#f59e0b", bg: "#fffbeb" },
};

const SendTemplateModal = ({ open, onClose, user, channelId }: Props) => {
    const { enqueueSnackbar } = useSnackbar();
    const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
    const [bodyValues, setBodyValues] = useState<string[]>([]);

    const formatMoney = (amount: number, currency = "INR") => {
        const value = Number(amount || 0) / 1000000;
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 6
        }).format(value);
    };

    const { data: walletData } = useQuery({
        queryKey: ["wallet"],
        queryFn: () => walletService.getWallet(),
        enabled: open,
        staleTime: 30_000,
    });

    const { data, isLoading } = useQuery({
        queryKey: ["templates", channelId, "APPROVED"],
        queryFn: async () => {
            const res = await templateService.getTemplates(channelId, { status: "APPROVED", limit: 100 });
            return res.data;
        },
        enabled: !!channelId && open,
    });

    const templatesList = data || [];

    const { mutate: sendTemplate, isPending: sending } = useMutation({
        mutationFn: (payload: any) => templateService.sendTemplate(channelId, payload),
        onSuccess: () => { onClose(); },
        onError: (err: any) => {
            enqueueSnackbar(err?.response?.data?.message || "Failed to send ❌", { variant: "error" });
        },
    });

    const bodyComponent = useMemo(() => selectedTemplate?.components?.find((c: any) => c.type === "BODY"), [selectedTemplate]);
    const variables = useMemo(() => bodyComponent?.text?.match(/{{\d+}}/g) || [], [bodyComponent]);
    const headerComponent = selectedTemplate?.components?.find((c: any) => c.type === "HEADER");
    const footerComponent = selectedTemplate?.components?.find((c: any) => c.type === "FOOTER");
    const buttonsComponent = selectedTemplate?.components?.find((c: any) => c.type === "BUTTONS");

    const handleBodyChange = (index: number, value: string) => {
        const updated = [...bodyValues];
        updated[index] = value;
        setBodyValues(updated);
    };

    const renderedText = useMemo(() => {
        if (!bodyComponent?.text) return "";
        return bodyComponent.text.replace(/{{(\d+)}}/g, (_: any, i: any) => bodyValues[i - 1] || `{{${i}}}`);
    }, [bodyComponent, bodyValues]);

    const wallet = walletData?.wallet;
    const availableBalance = Number(walletData?.available_balance || 0);
    const remainingCredit = Number(walletData?.remaining_credit || 0);
    const holdBalance = Number(wallet?.hold_balance || 0);
    const walletCurrency = wallet?.currency || "INR";

    const handleClose = () => {
        setSelectedTemplate(null);
        setBodyValues([]);
        onClose();
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            fullWidth
            maxWidth="md"
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
                            Send Template
                        </Typography>
                        <Typography fontSize={12} color="#a7f3d0">
                            to {user?.name || user?.phone || "contact"}
                        </Typography>
                    </Box>
                </Stack>
                <IconButton
                    size="small"
                    onClick={handleClose}
                    sx={{ color: "#a7f3d0", bgcolor: "rgba(255,255,255,0.08)", borderRadius: "8px", "&:hover": { bgcolor: "rgba(255,255,255,0.15)" } }}
                >
                    <CloseIcon sx={{ fontSize: 17 }} />
                </IconButton>
            </Box>

            <DialogContent sx={{ p: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
                {/* ── WALLET BAR ── */}
                <Box sx={{ px: 3, py: 1.75, borderBottom: "1px solid #f3f4f6", bgcolor: "#fafafa" }}>
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                        <AccountBalanceWalletOutlinedIcon sx={{ fontSize: 15, color: "#9ca3af" }} />
                        <Typography fontSize={11.5} color="#6b7280" fontWeight={600}>Wallet</Typography>
                        <Divider orientation="vertical" flexItem sx={{ height: 14, alignSelf: "center" }} />
                        <Stack direction="row" spacing={2}>
                            <Stack direction="row" spacing={0.5} alignItems="center">
                                <Typography fontSize={11} color="#9ca3af">Available</Typography>
                                <Typography fontSize={12} fontWeight={700} color={availableBalance < 0 ? "#ef4444" : "#10b981"}>
                                    {formatMoney(availableBalance, walletCurrency)}
                                </Typography>
                            </Stack>
                            {holdBalance > 0 && (
                                <Stack direction="row" spacing={0.5} alignItems="center">
                                    <Typography fontSize={11} color="#9ca3af">Hold</Typography>
                                    <Typography fontSize={12} fontWeight={700} color="#f59e0b">
                                        {formatMoney(holdBalance, walletCurrency)}
                                    </Typography>
                                </Stack>
                            )}
                            <Stack direction="row" spacing={0.5} alignItems="center">
                                <Typography fontSize={11} color="#9ca3af">Credit</Typography>
                                <Typography fontSize={12} fontWeight={700} color="#3b82f6">
                                    {formatMoney(remainingCredit, walletCurrency)}
                                </Typography>
                            </Stack>
                        </Stack>
                    </Stack>
                </Box>

                {/* ── FORM + PREVIEW ── */}
                <Box sx={{ flex: 1, overflow: "hidden", display: "flex" }}>
                    <Stack direction="row" sx={{ height: "100%", width: "100%" }}>
                        {/* LEFT FORM */}
                        <Box
                            sx={{
                                flex: 1, p: 3, overflowY: "auto",
                                "&::-webkit-scrollbar": { width: 4 },
                                "&::-webkit-scrollbar-thumb": { bgcolor: "#e5e7eb", borderRadius: 4 },
                            }}
                        >
                            <Stack spacing={2.5}>
                                <Autocomplete
                                    options={templatesList}
                                    isOptionEqualToValue={(option, value) => option.name === value.name}
                                    loading={isLoading}
                                    getOptionLabel={(option) => option?.name || ""}
                                    value={selectedTemplate}
                                    onChange={(_, value) => {
                                        setSelectedTemplate(value);
                                        setBodyValues([]);
                                    }}
                                    renderOption={(props, option) => {
                                        const cat = CATEGORY_COLOR[option.category] || CATEGORY_COLOR.UTILITY;
                                        return (
                                            <Box component="li" {...props} sx={{ py: 1.25, px: 2 }}>
                                                <Stack direction="row" alignItems="center" justifyContent="space-between" width="100%">
                                                    <Stack direction="row" alignItems="center" spacing={1}>
                                                        <ArticleOutlinedIcon sx={{ fontSize: 15, color: "#9ca3af" }} />
                                                        <Typography fontSize={13} fontWeight={600} color="#111827">
                                                            {option.name}
                                                        </Typography>
                                                    </Stack>
                                                    <Chip
                                                        label={option.category}
                                                        size="small"
                                                        sx={{
                                                            height: 20, fontSize: 10, fontWeight: 700, borderRadius: "5px",
                                                            bgcolor: cat.bg, color: cat.color,
                                                        }}
                                                    />
                                                </Stack>
                                            </Box>
                                        );
                                    }}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label="Select Template"
                                            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
                                            InputProps={{
                                                ...params.InputProps,
                                                endAdornment: (
                                                    <>
                                                        {isLoading && <CircularProgress size={18} />}
                                                        {params.InputProps.endAdornment}
                                                    </>
                                                ),
                                            }}
                                        />
                                    )}
                                />

                                {selectedTemplate && (
                                    <Paper
                                        variant="outlined"
                                        sx={{ borderRadius: "12px", borderColor: "#e5e7eb", p: 2, bgcolor: "#fafafa" }}
                                    >
                                        <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
                                            <Typography fontSize={12} fontWeight={700} color="#374151">{selectedTemplate.name}</Typography>
                                            {selectedTemplate.category && (
                                                <Chip
                                                    label={selectedTemplate.category}
                                                    size="small"
                                                    sx={{
                                                        height: 18, fontSize: 10, fontWeight: 700, borderRadius: "5px",
                                                        bgcolor: CATEGORY_COLOR[selectedTemplate.category]?.bg || "#f3f4f6",
                                                        color: CATEGORY_COLOR[selectedTemplate.category]?.color || "#374151",
                                                    }}
                                                />
                                            )}
                                        </Stack>
                                        <Typography fontSize={12} color="#6b7280">{selectedTemplate.language}</Typography>
                                    </Paper>
                                )}

                                {variables.length > 0 && (
                                    <Box sx={{ borderRadius: "12px", border: "1px solid #dbeafe", bgcolor: "#eff6ff", p: 2 }}>
                                        <Typography fontSize={12} fontWeight={700} color="#1d4ed8" mb={1.5}>
                                            Fill template variables
                                        </Typography>
                                        <Stack spacing={1.5}>
                                            {variables.map((v: string, i: number) => (
                                                <VariablePicker
                                                    key={i}
                                                    value={bodyValues[i] || ""}
                                                    onChange={(val) => handleBodyChange(i, val)}
                                                    label={`Value for ${v}`}
                                                    multiline={false}
                                                    rows={1}
                                                    size="small"
                                                />
                                            ))}
                                        </Stack>
                                    </Box>
                                )}
                            </Stack>
                        </Box>

                        {/* DIVIDER */}
                        <Divider orientation="vertical" flexItem sx={{ borderColor: "#f3f4f6" }} />

                        {/* RIGHT PREVIEW */}
                        <Box
                            sx={{
                                width: 320, flexShrink: 0, p: 3,
                                overflowY: "auto", bgcolor: "#f8fafc",
                                display: "flex", flexDirection: "column", alignItems: "center",
                            }}
                        >
                            <Typography sx={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.6, mb: 2, alignSelf: "flex-start" }}>
                                Preview
                            </Typography>

                            {/* Phone shell */}
                            <Box sx={{
                                width: 240,
                                borderRadius: "34px",
                                background: "linear-gradient(145deg, #1f2937, #111827)",
                                p: "10px",
                                boxShadow: "0 20px 50px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.05)",
                            }}>
                                <Box sx={{
                                    borderRadius: "26px", overflow: "hidden",
                                    background: "#e5ddd5",
                                    display: "flex", flexDirection: "column", height: 420,
                                }}>
                                    {/* WA top bar */}
                                    <Box sx={{
                                        background: "linear-gradient(135deg, #075E54, #128C7E)",
                                        height: 50,
                                        display: "flex", alignItems: "flex-end",
                                        px: 1.5, pb: 1, gap: 1,
                                    }}>
                                        <Box sx={{ width: 26, height: 26, borderRadius: "50%", bgcolor: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11 }}>
                                            🏢
                                        </Box>
                                        <Box>
                                            <Typography fontSize={11.5} fontWeight={700} color="#fff" lineHeight={1.1}>Business</Typography>
                                            <Typography fontSize={8.5} color="rgba(255,255,255,0.7)">online</Typography>
                                        </Box>
                                    </Box>

                                    {/* Chat area */}
                                    <Box sx={{ flex: 1, p: 1.5, overflowY: "auto", display: "flex", flexDirection: "column", gap: 1 }}>
                                        <Box sx={{ bgcolor: "#d9fdd3", p: 0.75, borderRadius: 1.5, fontSize: 9, color: "#374151", textAlign: "center", mx: 1, lineHeight: 1.4 }}>
                                            🔒 End-to-end encrypted
                                        </Box>

                                        <Box sx={{
                                            background: "#fff",
                                            borderRadius: "7px 7px 7px 2px",
                                            p: 1.25, maxWidth: "92%",
                                            display: "flex", flexDirection: "column", gap: 0.5,
                                            boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
                                        }}>
                                            {headerComponent?.format === "TEXT" && (
                                                <Typography fontWeight={700} fontSize={11.5} color="#111827">{headerComponent.text}</Typography>
                                            )}
                                            {headerComponent?.format === "IMAGE" && (
                                                <img alt="header" src={headerComponent?.example?.header_handle?.[0]} style={{ width: "100%", borderRadius: 5, maxHeight: 80, objectFit: "cover" }} />
                                            )}

                                            <Typography fontSize={11.5} color={renderedText ? "#111827" : "#9ca3af"} lineHeight={1.5}>
                                                {renderedText || "Template preview…"}
                                            </Typography>

                                            {footerComponent && (
                                                <Typography fontSize={9.5} color="#9ca3af">{footerComponent.text}</Typography>
                                            )}

                                            <Typography fontSize={8.5} color="#9ca3af" textAlign="right">22:21 ✓✓</Typography>
                                        </Box>

                                        {buttonsComponent?.buttons?.map((btn: any, i: number) => (
                                            <Box
                                                key={i}
                                                sx={{
                                                    bgcolor: "#fff", borderRadius: "6px", maxWidth: "92%",
                                                    py: 0.75, textAlign: "center",
                                                    color: "#00a884", fontSize: 11, fontWeight: 600,
                                                    boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
                                                }}
                                            >
                                                {btn.text}
                                            </Box>
                                        ))}
                                    </Box>
                                </Box>
                            </Box>
                        </Box>
                    </Stack>
                </Box>
            </DialogContent>

            {/* ── FOOTER ── */}
            <DialogActions sx={{ px: 3, py: 2, borderTop: "1px solid #f3f4f6", gap: 1 }}>
                <Button
                    onClick={handleClose}
                    sx={{ borderRadius: "10px", color: "#6b7280", fontWeight: 600, "&:hover": { bgcolor: "#f9fafb" } }}
                >
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    disabled={!selectedTemplate || sending}
                    startIcon={sending ? <CircularProgress size={15} color="inherit" /> : <SendIcon sx={{ fontSize: 16 }} />}
                    onClick={() => {
                        sendTemplate({
                            templateName: selectedTemplate.name,
                            to: user.phone || user.mobile || user.wa_id,
                            bodyParams: bodyValues,
                        });
                    }}
                    sx={{
                        borderRadius: "10px", fontWeight: 700, px: 3,
                        bgcolor: "#25D366", "&:hover": { bgcolor: "#1ebe5d" }, boxShadow: "none",
                    }}
                >
                    {sending ? "Sending…" : "Send Template"}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default SendTemplateModal;
