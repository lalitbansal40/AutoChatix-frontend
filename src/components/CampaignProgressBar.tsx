import {
    Box,
    Button,
    Chip,
    CircularProgress,
    IconButton,
    LinearProgress,
    Stack,
    Typography,
} from "@mui/material";
import {
    CheckCircleFilled,
    CloseCircleFilled,
    SendOutlined,
    StopOutlined,
} from "@ant-design/icons";
import { useEffect, useState, useCallback } from "react";
import { campaignService, CampaignStatus } from "service/campaign.service";
import { useSnackbar } from "notistack";

interface Props {
    campaignId: string;
    onDismiss: () => void;
}

const POLL_INTERVAL = 2500; // ms

const CampaignProgressBar = ({ campaignId, onDismiss }: Props) => {
    const { enqueueSnackbar } = useSnackbar();
    const [campaign, setCampaign] = useState<CampaignStatus | null>(null);
    const [stopping, setStopping] = useState(false);

    const fetchStatus = useCallback(async () => {
        try {
            const data = await campaignService.get(campaignId);
            setCampaign(data);
        } catch {
            // silently ignore transient errors
        }
    }, [campaignId]);

    useEffect(() => {
        fetchStatus();
        const interval = setInterval(() => {
            fetchStatus().then(() => {
                if (
                    campaign?.status === "completed" ||
                    campaign?.status === "stopped" ||
                    campaign?.status === "failed"
                ) {
                    clearInterval(interval);
                }
            });
        }, POLL_INTERVAL);
        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [campaignId]);

    // Re-subscribe when status changes to terminal
    useEffect(() => {
        if (!campaign) return;
        if (
            campaign.status === "completed" ||
            campaign.status === "stopped" ||
            campaign.status === "failed"
        ) {
            // keep bar visible so user can see final state — they dismiss manually
        }
    }, [campaign?.status]);

    const handleStop = async () => {
        setStopping(true);
        try {
            await campaignService.stop(campaignId);
            enqueueSnackbar("Campaign stop signal sent", { variant: "info" });
            await fetchStatus();
        } catch {
            enqueueSnackbar("Failed to stop campaign", { variant: "error" });
        } finally {
            setStopping(false);
        }
    };

    if (!campaign) {
        return (
            <Box sx={barSx}>
                <CircularProgress size={16} sx={{ color: "#fff" }} />
                <Typography variant="body2" sx={{ color: "#fff", fontSize: 12 }}>
                    Starting campaign…
                </Typography>
            </Box>
        );
    }

    const { status, total, sent, failed, template_name } = campaign;
    const progress = total > 0 ? Math.round((sent / total) * 100) : 0;
    const pending = total - sent - failed;
    const isTerminal = status === "completed" || status === "stopped" || status === "failed";

    const statusColor =
        status === "completed" ? "#22c55e" :
        status === "stopped"   ? "#f59e0b" :
        status === "failed"    ? "#ef4444" :
                                 "#60a5fa";

    const statusLabel =
        status === "queued"    ? "Queued" :
        status === "running"   ? "Sending…" :
        status === "completed" ? "Completed" :
        status === "stopped"   ? "Stopped" :
                                 "Failed";

    return (
        <Box sx={barSx}>
            <Stack direction="row" alignItems="center" spacing={1.5} sx={{ flex: 1, minWidth: 0 }}>
                {/* Icon */}
                <Box sx={{ flexShrink: 0, color: statusColor, fontSize: 18 }}>
                    {status === "running" || status === "queued"
                        ? <SendOutlined style={{ color: statusColor }} />
                        : status === "completed"
                        ? <CheckCircleFilled style={{ color: statusColor }} />
                        : <CloseCircleFilled style={{ color: statusColor }} />
                    }
                </Box>

                {/* Template name */}
                <Typography
                    variant="body2"
                    sx={{ color: "#fff", fontWeight: 700, fontSize: 12.5, flexShrink: 0, maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                >
                    {template_name}
                </Typography>

                {/* Status chip */}
                <Chip
                    label={statusLabel}
                    size="small"
                    sx={{
                        height: 20, fontSize: 10, fontWeight: 700, flexShrink: 0,
                        bgcolor: `${statusColor}25`, color: statusColor, border: `1px solid ${statusColor}66`,
                    }}
                />

                {/* Progress bar + counters */}
                <Stack sx={{ flex: 1, minWidth: 0 }} spacing={0.4}>
                    <LinearProgress
                        variant={status === "queued" ? "indeterminate" : "determinate"}
                        value={progress}
                        sx={{
                            height: 6, borderRadius: 3,
                            bgcolor: "rgba(255,255,255,0.15)",
                            "& .MuiLinearProgress-bar": { bgcolor: statusColor, borderRadius: 3 },
                        }}
                    />
                    <Stack direction="row" spacing={2}>
                        <Typography variant="caption" sx={{ color: "#86efac", fontSize: 10.5, whiteSpace: "nowrap" }}>
                            Sent: <strong>{sent}</strong>
                        </Typography>
                        <Typography variant="caption" sx={{ color: "#fca5a5", fontSize: 10.5, whiteSpace: "nowrap" }}>
                            Failed: <strong>{failed}</strong>
                        </Typography>
                        {!isTerminal && pending > 0 && (
                            <Typography variant="caption" sx={{ color: "#93c5fd", fontSize: 10.5, whiteSpace: "nowrap" }}>
                                Pending: <strong>{pending}</strong>
                            </Typography>
                        )}
                        {total > 0 && (
                            <Typography variant="caption" sx={{ color: "#d1d5db", fontSize: 10.5, whiteSpace: "nowrap" }}>
                                Total: <strong>{total}</strong>
                            </Typography>
                        )}
                    </Stack>
                </Stack>
            </Stack>

            {/* Actions */}
            <Stack direction="row" spacing={1} alignItems="center" sx={{ flexShrink: 0 }}>
                {/* Stop button — only while running */}
                {!isTerminal && (
                    <Button
                        size="small"
                        variant="outlined"
                        disabled={stopping}
                        startIcon={stopping ? <CircularProgress size={12} color="inherit" /> : <StopOutlined />}
                        onClick={handleStop}
                        sx={{
                            fontSize: 11, fontWeight: 700, borderRadius: "8px", textTransform: "none",
                            borderColor: "#fca5a5", color: "#fca5a5",
                            "&:hover": { bgcolor: "rgba(239,68,68,0.15)", borderColor: "#f87171" },
                        }}
                    >
                        {stopping ? "Stopping…" : "Stop"}
                    </Button>
                )}

                {/* Dismiss button — only when terminal */}
                {isTerminal && (
                    <IconButton
                        size="small"
                        onClick={onDismiss}
                        sx={{ color: "#9ca3af", "&:hover": { color: "#fff" } }}
                    >
                        <CloseCircleFilled style={{ fontSize: 16 }} />
                    </IconButton>
                )}
            </Stack>
        </Box>
    );
};

/* ── Fixed bottom bar styling ── */
const barSx = {
    position: "fixed" as const,
    bottom: 24,
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: 1400,
    display: "flex",
    alignItems: "center",
    gap: 2,
    px: 2.5,
    py: 1.25,
    borderRadius: "14px",
    bgcolor: "#1a2433",
    border: "1px solid rgba(255,255,255,0.12)",
    boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
    minWidth: 500,
    maxWidth: "90vw",
};

export default CampaignProgressBar;
