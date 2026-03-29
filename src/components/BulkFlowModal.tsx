import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    CircularProgress,
} from "@mui/material";
import { useState } from "react";
import ContactSelectionStep from "./ContactSelectionStep";
import SendTemplateModalContent from "./SendTemplateModalContent";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import { useRef } from "react";

interface Props {
    open: boolean;
    onClose: () => void;
    channelId: string;
}

const BulkFlowModal = ({ open, onClose, channelId }: Props) => {
    const [step, setStep] = useState(1);
    const [templateData, setTemplateData] = useState<any>(null);
    const sendRef = useRef<any>(null);
    const [loading, setLoading] = useState(false);

    const handleNext = (data: any) => {
        setTemplateData(data);
    };

    const handleBack = () => {
        setStep(1);
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
            <DialogTitle
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                }}
            >
                {step === 1 ? "Select Template" : "Select Contacts"}

                <IconButton onClick={onClose}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent
                sx={{
                    display: "flex",
                    flexDirection: "column",
                    height: "70vh",
                    p: 2,
                }}
            >
                {step === 1 && (
                    <SendTemplateModalContent
                        channelId={channelId}
                        onNext={handleNext}
                    />
                )}

                {step === 2 && templateData && (
                    <ContactSelectionStep
                        channelId={channelId}
                        templateData={templateData}
                        onSend={sendRef}
                    />
                )}
            </DialogContent>

            <DialogActions
                sx={{
                    justifyContent: "space-between",
                    px: 3,
                    pb: 2,
                }}
            >
                {/* LEFT SIDE */}
                {step === 2 ? (
                    <Button onClick={handleBack}>Back</Button>
                ) : (
                    <div />
                )}

                {/* RIGHT SIDE */}
                {step === 1 && (
                    <Button
                        variant="contained"
                        disabled={!templateData?.isValid}
                        onClick={() => setStep(2)}
                    >
                        Next
                    </Button>
                )}

                {step === 2 && (
                    <Button
                        variant="contained"
                        color="success"
                        disabled={loading}
                        onClick={async () => {
                            setLoading(true);
                            await sendRef.current();
                            setLoading(false);
                            onClose();
                        }}
                    >
                        {loading ? (
                            <>
                                <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
                                Sending...
                            </>
                        ) : (
                            "Send Bulk"
                        )}
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
};

export default BulkFlowModal;