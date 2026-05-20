import {
    Dialog,
    DialogContent,
    DialogActions,
    Button,
    CircularProgress,
    Box,
    Typography,
    Stack,
    IconButton,
    Stepper,
    Step,
    StepLabel,
    stepLabelClasses,
    stepConnectorClasses,
    StepConnector,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { useState, useRef } from "react";
import ContactSelectionStep from "./ContactSelectionStep";
import SendTemplateModalContent from "./SendTemplateModalContent";
import CloseIcon from "@mui/icons-material/Close";
import SendIcon from "@mui/icons-material/Send";
import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";

interface Props {
    open: boolean;
    onClose: () => void;
    channelId: string;
    /** Called after campaign is created — parent uses this to show progress bar */
    onCampaignStarted?: (campaignId: string) => void;
}

const STEPS = ["Select Template", "Select Contacts"];

const GreenConnector = styled(StepConnector)(() => ({
    [`& .${stepConnectorClasses.line}`]: {
        borderColor: "rgba(110,231,183,0.3)",
        borderTopWidth: 2,
    },
    [`&.${stepConnectorClasses.active} .${stepConnectorClasses.line}`]: {
        borderColor: "#6ee7b7",
    },
    [`&.${stepConnectorClasses.completed} .${stepConnectorClasses.line}`]: {
        borderColor: "#6ee7b7",
    },
}));

const BulkFlowModal = ({ open, onClose, channelId, onCampaignStarted }: Props) => {
    const [step, setStep] = useState(1);
    const [templateData, setTemplateData] = useState<any>(null);
    const sendRef = useRef<(() => Promise<string | null>) | null>(null);
    const [loading, setLoading] = useState(false);

    const handleClose = () => {
        setStep(1);
        setTemplateData(null);
        onClose();
    };

    const handleSend = async () => {
        if (!sendRef.current) return;
        setLoading(true);
        try {
            const campaignId = await sendRef.current();
            // Close modal immediately — campaign runs in background
            handleClose();
            // Notify parent so it can show the progress bar
            if (campaignId && onCampaignStarted) {
                onCampaignStarted(campaignId);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            fullWidth
            maxWidth="lg"
            PaperProps={{ sx: { borderRadius: "20px", overflow: "hidden", maxHeight: "92vh" } }}
        >
            {/* ── GRADIENT HEADER ── */}
            <Box
                sx={{
                    background: "linear-gradient(135deg, #064e3b 0%, #065f46 60%, #047857 100%)",
                    px: 3, pt: 2.5, pb: 0,
                    flexShrink: 0,
                }}
            >
                <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2.5}>
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                        <Box
                            sx={{
                                width: 38, height: 38, borderRadius: "10px",
                                bgcolor: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                            }}
                        >
                            <SendIcon sx={{ color: "#6ee7b7", fontSize: 18 }} />
                        </Box>
                        <Box>
                            <Typography fontSize={17} fontWeight={800} color="#fff" lineHeight={1.2}>
                                Send Bulk Template
                            </Typography>
                            <Typography fontSize={12} color="#a7f3d0">
                                Send a WhatsApp template to multiple contacts at once
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
                </Stack>

                {/* ── STEPPER ── */}
                <Stepper activeStep={step - 1} connector={<GreenConnector />} sx={{ pb: 0 }}>
                    {STEPS.map((label, index) => (
                        <Step key={label} completed={step > index + 1}>
                            <StepLabel
                                icon={
                                    <Box
                                        sx={{
                                            width: 30, height: 30, borderRadius: "50%",
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            bgcolor: step > index + 1 ? "#6ee7b7" : step === index + 1 ? "#fff" : "rgba(255,255,255,0.15)",
                                            transition: "all 0.25s",
                                        }}
                                    >
                                        {index === 0
                                            ? <ArticleOutlinedIcon sx={{ fontSize: 15, color: step === 1 ? "#064e3b" : step > 1 ? "#064e3b" : "#a7f3d0" }} />
                                            : <PeopleAltOutlinedIcon sx={{ fontSize: 15, color: step === 2 ? "#064e3b" : step > 2 ? "#064e3b" : "#a7f3d0" }} />
                                        }
                                    </Box>
                                }
                                sx={{
                                    [`& .${stepLabelClasses.label}`]: {
                                        color: step === index + 1 ? "#fff" : step > index + 1 ? "#6ee7b7" : "#6b7280",
                                        fontWeight: step === index + 1 ? 700 : 500,
                                        fontSize: 12.5,
                                    },
                                    [`& .${stepLabelClasses.active}`]: { color: "#fff !important" },
                                    [`& .${stepLabelClasses.completed}`]: { color: "#6ee7b7 !important" },
                                }}
                            >
                                {label}
                            </StepLabel>
                        </Step>
                    ))}
                </Stepper>

                <Box sx={{ height: 3, bgcolor: "#fff", borderRadius: "3px 3px 0 0", width: 60, mt: 1.5, ml: step === 1 ? 0 : "calc(50% - 30px)", transition: "margin-left 0.3s" }} />
            </Box>

            {/* ── CONTENT ── */}
            <DialogContent
                sx={{
                    display: "flex", flexDirection: "column",
                    height: "65vh", p: 3, bgcolor: "#f8fafc", overflow: "hidden",
                }}
            >
                <Box sx={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
                    {step === 1 && (
                        <SendTemplateModalContent
                            channelId={channelId}
                            onNext={(data) => setTemplateData(data)}
                        />
                    )}
                    {step === 2 && templateData && (
                        <ContactSelectionStep
                            channelId={channelId}
                            templateData={templateData}
                            onSend={sendRef}
                        />
                    )}
                </Box>
            </DialogContent>

            {/* ── FOOTER ── */}
            <DialogActions sx={{ px: 3, py: 2, borderTop: "1px solid #f3f4f6", justifyContent: "space-between" }}>
                {step === 2 ? (
                    <Button
                        onClick={() => setStep(1)}
                        sx={{ borderRadius: "10px", color: "#6b7280", fontWeight: 600, "&:hover": { bgcolor: "#f3f4f6" } }}
                    >
                        ← Back
                    </Button>
                ) : (
                    <div />
                )}

                {step === 1 && (
                    <Button
                        variant="contained"
                        disabled={!templateData?.isValid}
                        onClick={() => setStep(2)}
                        sx={{
                            borderRadius: "10px", fontWeight: 700, px: 3,
                            bgcolor: "#064e3b", "&:hover": { bgcolor: "#065f46" }, boxShadow: "none",
                        }}
                    >
                        Next: Select Contacts →
                    </Button>
                )}

                {step === 2 && (
                    <Button
                        variant="contained"
                        disabled={loading}
                        startIcon={loading ? <CircularProgress size={15} color="inherit" /> : <SendIcon sx={{ fontSize: 16 }} />}
                        onClick={handleSend}
                        sx={{
                            borderRadius: "10px", fontWeight: 700, px: 3,
                            bgcolor: "#25D366", "&:hover": { bgcolor: "#1ebe5d" }, boxShadow: "none",
                        }}
                    >
                        {loading ? "Starting…" : "Send Bulk"}
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
};

export default BulkFlowModal;
