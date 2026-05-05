import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    CircularProgress,
    Autocomplete,
    Typography,
    Stack,
    Box,
    Alert,
} from "@mui/material";
import { useState, useMemo } from "react";
import { templateService } from "service/template.service";
import { useMutation } from "@tanstack/react-query";
import { useSnackbar } from "notistack";
import { useQuery } from "@tanstack/react-query";
import { walletService } from "service/wallet.service";
interface Props {
    open: boolean;
    onClose: () => void;
    user: any;
    channelId: string;
}

const SendTemplateModal = ({ open, onClose, user, channelId }: Props) => {
    const { enqueueSnackbar } = useSnackbar();
    const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
    const [bodyValues, setBodyValues] = useState<string[]>([]);

    const formatMoney = (amount: number, currency = "INR") => {
        const value = Number(amount || 0) / 100;
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency,
            maximumFractionDigits: 2,
        }).format(value);
    };

    const { data: walletData } = useQuery({
        queryKey: ["wallet"],
        queryFn: () => walletService.getWallet(),
        enabled: open,
        staleTime: 30_000,
    });

    //   FETCH TEMPLATES
    const { data, isLoading } = useQuery({
        queryKey: ["templates", channelId, "APPROVED"],
        queryFn: async () => {
            const res = await templateService.getTemplates(channelId, {
                status: "APPROVED",
                limit: 100, // 🔥 IMPORTANT
            });

            return res.data;
        },
        enabled: !!channelId && open,
    });

    const templatesList = data || [];


    const { mutate: sendTemplate, isPending: sending } = useMutation({
        mutationFn: (payload: any) =>
            templateService.sendTemplate(channelId, payload),

        onSuccess: () => {
            onClose();
        },

        onError: (err: any) => {
            const message = err?.response?.data?.message || "Failed to send ❌";
            enqueueSnackbar(message, {
                variant: "error",
            });
        },
    });

    //   EXTRACT BODY COMPONENT
    const bodyComponent = useMemo(() => {
        return selectedTemplate?.components?.find((c: any) => c.type === "BODY");
    }, [selectedTemplate]);

    //   EXTRACT VARIABLES
    const variables = useMemo(() => {
        return bodyComponent?.text?.match(/{{\d+}}/g) || [];
    }, [bodyComponent]);

    //   HANDLE INPUT CHANGE
    const handleBodyChange = (index: number, value: string) => {
        const updated = [...bodyValues];
        updated[index] = value;
        setBodyValues(updated);
    };

    //   RENDER BODY WITH VALUES
    const renderedText = useMemo(() => {
        if (!bodyComponent?.text) return "";

        return bodyComponent.text.replace(/{{(\d+)}}/g, (_: any, i: any) => {
            return bodyValues[i - 1] || `{{${i}}}`;
        });
    }, [bodyComponent, bodyValues]);

    //   HEADER
    const headerComponent = selectedTemplate?.components?.find(
        (c: any) => c.type === "HEADER"
    );

    const footerComponent = selectedTemplate?.components?.find(
        (c: any) => c.type === "FOOTER"
    );

    const buttonsComponent = selectedTemplate?.components?.find(
        (c: any) => c.type === "BUTTONS"
    );

    const wallet = walletData?.wallet;
    const availableBalance = Number(walletData?.available_balance || 0);
    const remainingCredit = Number(walletData?.remaining_credit || 0);
    const holdBalance = Number(wallet?.hold_balance || 0);
    const walletCurrency = wallet?.currency || "INR";





    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
            <DialogTitle>Send Template</DialogTitle>

            <DialogContent>
                <Stack direction="row" spacing={3}>
                    {/* 🔥 LEFT SIDE (FORM) */}
                    <Stack spacing={2} flex={1}>
                        <Alert
                            severity={availableBalance < 0 ? "error" : "info"}
                            sx={{ borderRadius: 2 }}
                        >
                            Wallet balance: <strong>{formatMoney(availableBalance, walletCurrency)}</strong>
                            {holdBalance > 0 && <> | Hold: <strong>{formatMoney(holdBalance, walletCurrency)}</strong></>}
                            <> | Credit left: <strong>{formatMoney(remainingCredit, walletCurrency)}</strong></>
                        </Alert>

                        {/* TEMPLATE SELECT */}
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
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="Select Template"
                                    InputProps={{
                                        ...params.InputProps,
                                        endAdornment: (
                                            <>
                                                {isLoading && <CircularProgress size={20} />}
                                                {params.InputProps.endAdornment}
                                            </>
                                        ),
                                    }}
                                />
                            )}
                        />

                        {/* VARIABLES INPUT */}
                        {variables.length > 0 && (
                            <Box>
                                <Typography variant="caption">
                                    Fill template values:
                                </Typography>

                                <Stack spacing={1} mt={1}>
                                    {variables.map((v: string, i: number) => (
                                        <TextField
                                            key={i}
                                            size="small"
                                            label={`Value for ${v}`}
                                            value={bodyValues[i] || ""}
                                            onChange={(e) =>
                                                handleBodyChange(i, e.target.value)
                                            }
                                        />
                                    ))}
                                </Stack>
                            </Box>
                        )}
                    </Stack>

                    {/* 🔥 RIGHT SIDE (WHATSAPP PREVIEW) */}
                    <Box
                        sx={{
                            width: 300,
                            height: 550,
                            borderRadius: "20px",
                            background: "#e5ddd5",
                            p: 2,
                        }}
                    >
                        <Box
                            sx={{
                                background: "#fff",
                                borderRadius: 3,
                                p: 2,
                                display: "flex",
                                flexDirection: "column",
                                gap: 1,
                            }}
                        >
                            {/* HEADER */}
                            {headerComponent?.format === "TEXT" && (
                                <Typography fontWeight="bold">
                                    {headerComponent.text}
                                </Typography>
                            )}

                            {headerComponent?.format === "IMAGE" && (
                                // eslint-disable-next-line jsx-a11y/img-redundant-alt
                                <img
                                    alt="image"
                                    src={headerComponent?.example?.header_handle?.[0]}
                                    style={{ width: "100%", borderRadius: 8 }}
                                />
                            )}

                            {/* BODY */}
                            <Typography>
                                {renderedText || "Template preview..."}
                            </Typography>

                            {/* FOOTER */}
                            {footerComponent && (
                                <Typography fontSize={12} color="gray">
                                    {footerComponent.text}
                                </Typography>
                            )}

                            {/* BUTTONS */}
                            {buttonsComponent?.buttons?.length > 0 && (
                                <>
                                    <Box sx={{ borderTop: "1px solid #eee", mt: 1 }} />
                                    {buttonsComponent.buttons.map((btn: any, i: number) => (
                                        <Box
                                            key={i}
                                            sx={{
                                                textAlign: "center",
                                                py: 1,
                                                color: "#00a884",
                                                borderBottom: "1px solid #eee",
                                            }}
                                        >
                                            {btn.text}
                                        </Box>
                                    ))}
                                </>
                            )}
                        </Box>
                    </Box>
                </Stack>
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button
                    variant="contained"
                    disabled={!selectedTemplate || sending}
                    onClick={() => {
                        sendTemplate({
                            templateName: selectedTemplate.name,
                            to: user.phone || user.mobile || user.wa_id,
                            bodyParams: bodyValues,
                        });
                    }}
                >
                    {sending ? "Sending..." : "Send"}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default SendTemplateModal;
