import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import AccountTreeOutlinedIcon from "@mui/icons-material/AccountTreeOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import SyncIcon from "@mui/icons-material/Sync";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSnackbar } from "notistack";
import { FlowApp, whatsappFlowService } from "service/whatsappFlow.service";
import { flowBuilderService, WhatsappFlow } from "service/flowBuilder.service";
import FlowPreviewModal from "./FlowPreviewModal";

const STEP_LIST = [
  {
    step: "1",
    title: "Open Meta Business Manager",
    desc: "Go to WhatsApp Manager → Flows section inside your Business Manager account.",
    color: "#3b82f6",
    bg: "#eff6ff",
  },
  {
    step: "2",
    title: "Create or select a Flow",
    desc: "Create a new WhatsApp Flow and design its screens in Meta's Flow Builder.",
    color: "#8b5cf6",
    bg: "#f5f3ff",
  },
  {
    step: "3",
    title: "Set the Endpoint URL",
    desc: "Open the flow's Preview below → expand 'For Meta admins' to copy the endpoint URL into Meta.",
    color: "#f59e0b",
    bg: "#fffbeb",
  },
  {
    step: "4",
    title: "Publish & Test",
    desc: "Publish the flow in Meta and test it by sending to a number connected to this channel.",
    color: "#10b981",
    bg: "#f0fdf4",
  },
];

/* ── Flow Builder flow card ── */
const FlowBuilderCard = ({
  flow,
  onPreview,
}: {
  flow: WhatsappFlow;
  onPreview: (flow: WhatsappFlow) => void;
}) => {
  const navigate = useNavigate();
  const isPublished = flow.status === "published";
  const hasMetaId = !!flow.meta_flow_id;

  const initials = flow.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Paper
      variant="outlined"
      sx={{
        borderRadius: "16px",
        borderColor: "#e5e7eb",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        transition: "box-shadow 0.2s, transform 0.15s",
        "&:hover": { boxShadow: "0 8px 24px rgba(0,0,0,0.09)", transform: "translateY(-2px)" },
      }}
    >
      <Box sx={{ height: 3, bgcolor: isPublished ? "#25D366" : "#f59e0b" }} />
      <Box sx={{ p: 2.5, display: "flex", flexDirection: "column", flex: 1 }}>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" mb={1.5}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box
              sx={{
                width: 44, height: 44, borderRadius: "12px",
                bgcolor: isPublished ? "#f0fdf4" : "#fffbeb",
                border: `1px solid ${isPublished ? "#bbf7d0" : "#fde68a"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 15, fontWeight: 800,
                color: isPublished ? "#16a34a" : "#d97706",
                fontFamily: "monospace", flexShrink: 0,
              }}
            >
              {initials}
            </Box>
            <Box>
              <Typography fontWeight={700} fontSize={15} color="#111827" lineHeight={1.3}>
                {flow.name}
              </Typography>
              <Typography fontSize={11} color="#9ca3af" fontFamily="monospace">
                {flow.type} · {flow.screens?.length || 0} screens
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={0.5} alignItems="center">
            <Chip
              icon={
                isPublished
                  ? <CheckCircleOutlineIcon sx={{ fontSize: 12, color: "#16a34a !important" }} />
                  : <AccessTimeIcon sx={{ fontSize: 12, color: "#d97706 !important" }} />
              }
              label={isPublished ? "Published" : "Draft"}
              size="small"
              sx={{
                height: 22, fontSize: 11, fontWeight: 700, borderRadius: "6px",
                bgcolor: isPublished ? "#f0fdf4" : "#fffbeb",
                color: isPublished ? "#16a34a" : "#d97706",
                border: `1px solid ${isPublished ? "#bbf7d0" : "#fde68a"}`,
              }}
            />
          </Stack>
        </Stack>

        <Divider sx={{ mb: 1.5, borderColor: "#f3f4f6" }} />

        <Typography fontSize={12.5} color="#6b7280" lineHeight={1.55} mb={2} flex={1}>
          {isPublished
            ? "Published on Meta. Click Preview to open in WhatsApp."
            : "Draft — build your flow in the Flow Builder and publish when ready."}
        </Typography>

        <Stack direction="row" spacing={1}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<EditOutlinedIcon sx={{ fontSize: 14 }} />}
            onClick={() => navigate(`/flow-builder/${flow._id}`)}
            sx={{
              flex: 1, borderRadius: "9px", textTransform: "none", fontWeight: 700,
              fontSize: 12, py: 0.8, borderColor: "#e5e7eb", color: "#374151",
              "&:hover": { borderColor: "#064e3b", color: "#064e3b", bgcolor: "#f0fdf4" },
            }}
          >
            Edit
          </Button>
          <Tooltip
            title={!hasMetaId ? "Publish the flow first to enable live preview" : ""}
            disableHoverListener={hasMetaId}
          >
            <span style={{ flex: 1 }}>
              <Button
                fullWidth
                size="small"
                variant="contained"
                startIcon={<VisibilityOutlinedIcon sx={{ fontSize: 14 }} />}
                onClick={() => onPreview(flow)}
                disabled={!hasMetaId}
                sx={{
                  borderRadius: "9px", textTransform: "none", fontWeight: 700,
                  fontSize: 12, py: 0.8, boxShadow: "none",
                  bgcolor: "#064e3b", "&:hover": { bgcolor: "#065f46" },
                  "&.Mui-disabled": { bgcolor: "#f3f4f6", color: "#9ca3af" },
                }}
              >
                Preview
              </Button>
            </span>
          </Tooltip>
        </Stack>
      </Box>
    </Paper>
  );
};

/* ── Legacy flow app card ── */
const FlowAppCard = ({
  app,
  onPreview,
}: {
  app: FlowApp;
  onPreview: (app: FlowApp) => void;
}) => {
  const initials = app.display_name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Paper
      variant="outlined"
      sx={{
        borderRadius: "16px", borderColor: "#e5e7eb", overflow: "hidden",
        display: "flex", flexDirection: "column",
        transition: "box-shadow 0.2s, transform 0.15s",
        "&:hover": { boxShadow: "0 8px 24px rgba(0,0,0,0.09)", transform: "translateY(-2px)" },
      }}
    >
      <Box sx={{ height: 3, bgcolor: "#25D366" }} />
      <Box sx={{ p: 2.5, display: "flex", flexDirection: "column", flex: 1 }}>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" mb={2}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box
              sx={{
                width: 44, height: 44, borderRadius: "12px",
                bgcolor: "#f0fdf4", border: "1px solid #bbf7d0",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 15, fontWeight: 800, color: "#16a34a", fontFamily: "monospace", flexShrink: 0,
              }}
            >
              {initials}
            </Box>
            <Box>
              <Typography fontWeight={700} fontSize={15} color="#111827" lineHeight={1.3}>
                {app.display_name}
              </Typography>
              <Typography fontSize={11.5} color="#6b7280" fontFamily="monospace">
                /{app.name}
              </Typography>
            </Box>
          </Stack>
          <Chip
            icon={<CheckCircleOutlineIcon sx={{ fontSize: 13, color: "#16a34a !important" }} />}
            label="Active"
            size="small"
            sx={{
              height: 22, fontSize: 11, fontWeight: 700,
              bgcolor: "#f0fdf4", color: "#16a34a",
              border: "1px solid #bbf7d0", borderRadius: "6px",
            }}
          />
        </Stack>
        <Divider sx={{ mb: 2, borderColor: "#f3f4f6" }} />
        <Typography fontSize={12.5} color="#6b7280" lineHeight={1.55} mb={2} flex={1}>
          Interactive WhatsApp Flow connected to your backend. Click preview to see how it will appear in chat.
        </Typography>
        <Button
          fullWidth variant="contained"
          startIcon={<VisibilityOutlinedIcon sx={{ fontSize: 17 }} />}
          onClick={() => onPreview(app)}
          sx={{
            mt: "auto", borderRadius: "10px", textTransform: "none",
            fontWeight: 700, fontSize: 13, py: 0.95, boxShadow: "none",
            bgcolor: "#064e3b", "&:hover": { bgcolor: "#065f46" },
          }}
        >
          Preview Flow
        </Button>
      </Box>
    </Paper>
  );
};

/* ── Main tab component ── */
const WhatsappFlowTab = ({ channelId }: { channelId: string }) => {
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const [previewApp, setPreviewApp] = useState<FlowApp | null>(null);
  const [previewLoading, setPreviewLoading] = useState<string | null>(null);

  // Fetch legacy flow apps
  const { data: appsData, isLoading: appsLoading, isError: appsError } = useQuery({
    queryKey: ["whatsapp-flow-apps"],
    queryFn: () => whatsappFlowService.getFlowApps(),
    staleTime: 60_000,
  });
  const apps: FlowApp[] = appsData?.data || [];

  // Fetch flow builder flows (all, then filter by channelId)
  const { data: flowsData, isLoading: flowsLoading } = useQuery({
    queryKey: ["flow-builder-flows"],
    queryFn: () => flowBuilderService.list(),
    staleTime: 30_000,
    select: (res) => res.data.filter((f) => f.channel_id === channelId),
  });
  const channelFlows: WhatsappFlow[] = flowsData || [];

  // Sync mutation
  const syncMutation = useMutation({
    mutationFn: () => flowBuilderService.syncFromMeta(channelId),
    onSuccess: (data) => {
      enqueueSnackbar(data.message, { variant: "success" });
      queryClient.invalidateQueries({ queryKey: ["flow-builder-flows"] });
    },
    onError: (err: any) => {
      enqueueSnackbar(err?.response?.data?.message || "Sync failed", { variant: "error" });
    },
  });

  // Handle preview for flow builder flows — fetch real Meta preview URL
  const handleFlowBuilderPreview = async (flow: WhatsappFlow) => {
    if (!flow.meta_flow_id) return;
    setPreviewLoading(flow._id);
    try {
      const res = await flowBuilderService.getPreviewUrl(flow._id);
      window.open(res.preview_url, "_blank", "noopener,noreferrer");
    } catch (err: any) {
      enqueueSnackbar(err?.response?.data?.message || "Could not fetch preview URL", { variant: "error" });
    } finally {
      setPreviewLoading(null);
    }
  };

  return (
    <Box>
      {/* ── Hero banner ── */}
      <Box
        sx={{
          borderRadius: "16px",
          background: "linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%)",
          p: { xs: 3, md: 4 }, mb: 4,
          position: "relative", overflow: "hidden",
        }}
      >
        {[
          { w: 180, h: 180, top: -60, right: 40, opacity: 0.06 },
          { w: 120, h: 120, top: 10, right: 160, opacity: 0.04 },
          { w: 80, h: 80, bottom: -20, right: 20, opacity: 0.08 },
        ].map((c, i) => (
          <Box
            key={i}
            sx={{
              position: "absolute", width: c.w, height: c.h, borderRadius: "50%",
              bgcolor: "#fff", opacity: c.opacity, top: c.top, right: c.right,
              bottom: (c as any).bottom, pointerEvents: "none",
            }}
          />
        ))}
        <Stack
          direction={{ xs: "column", sm: "row" }}
          alignItems={{ sm: "center" }}
          justifyContent="space-between"
          spacing={2}
        >
          <Box>
            <Stack direction="row" alignItems="center" spacing={1.5} mb={1}>
              <AccountTreeOutlinedIcon sx={{ color: "#6ee7b7", fontSize: 22 }} />
              <Typography fontSize={20} fontWeight={800} color="#fff" letterSpacing={-0.3}>
                WhatsApp Flows
              </Typography>
            </Stack>
            <Typography fontSize={13.5} color="#a7f3d0" lineHeight={1.6} maxWidth={520}>
              Interactive UI forms that run inside WhatsApp. Sync flows from Meta or use our Flow Builder.
            </Typography>
          </Box>
          <Stack direction="row" spacing={1.5} flexShrink={0}>
            <Button
              variant="outlined"
              startIcon={
                syncMutation.isPending
                  ? <CircularProgress size={13} sx={{ color: "#6ee7b7" }} />
                  : <SyncIcon sx={{ fontSize: 15 }} />
              }
              onClick={() => syncMutation.mutate()}
              disabled={syncMutation.isPending || !channelId}
              sx={{
                borderColor: "#6ee7b7", color: "#6ee7b7",
                fontSize: 12.5, fontWeight: 700, borderRadius: "10px",
                textTransform: "none", px: 2.5,
                "&:hover": { bgcolor: "rgba(110,231,183,0.1)", borderColor: "#34d399" },
                "&.Mui-disabled": { borderColor: "rgba(110,231,183,0.3)", color: "rgba(110,231,183,0.4)" },
              }}
            >
              {syncMutation.isPending ? "Syncing…" : "Sync from Meta"}
            </Button>
            <Button
              variant="outlined"
              endIcon={<OpenInNewIcon sx={{ fontSize: 14 }} />}
              href="https://business.facebook.com/wa/manage/flows/"
              target="_blank" rel="noopener noreferrer"
              sx={{
                borderColor: "#6ee7b7", color: "#6ee7b7",
                fontSize: 12.5, fontWeight: 700, borderRadius: "10px",
                textTransform: "none", px: 2.5,
                "&:hover": { bgcolor: "rgba(110,231,183,0.1)", borderColor: "#34d399" },
              }}
            >
              Open Meta Flow Builder
            </Button>
          </Stack>
        </Stack>
      </Box>

      {/* ── Flow Builder Flows section ── */}
      <Box mb={4}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
          <Box>
            <Typography fontSize={15} fontWeight={700} color="#111827">
              Flow Builder Flows
            </Typography>
            <Typography fontSize={12.5} color="#6b7280" mt={0.25}>
              Flows created in AutoChatix and linked to this channel.
            </Typography>
          </Box>
          {!flowsLoading && (
            <Chip
              label={`${channelFlows.length} flow${channelFlows.length !== 1 ? "s" : ""}`}
              size="small"
              sx={{ bgcolor: "#f3f4f6", color: "#374151", fontWeight: 700, fontSize: 11 }}
            />
          )}
        </Stack>

        {flowsLoading && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress size={24} sx={{ color: "#25D366" }} />
          </Box>
        )}

        {!flowsLoading && channelFlows.length === 0 && (
          <Paper
            variant="outlined"
            sx={{
              borderRadius: "14px", borderStyle: "dashed", borderColor: "#d1d5db",
              p: 4, textAlign: "center", bgcolor: "#fafafa",
            }}
          >
            <AccountTreeOutlinedIcon sx={{ fontSize: 36, color: "#d1d5db", mb: 1 }} />
            <Typography fontWeight={700} fontSize={14} color="#374151" mb={0.5}>
              No flows linked to this channel yet
            </Typography>
            <Typography fontSize={12.5} color="#9ca3af" mb={2}>
              Go to WA Flows and link a flow to this channel, or use Sync from Meta to import existing flows.
            </Typography>
          </Paper>
        )}

        {!flowsLoading && channelFlows.length > 0 && (
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "1fr 1fr 1fr" }, gap: 2 }}>
            {channelFlows.map((flow) => (
              <Box key={flow._id} sx={{ position: "relative" }}>
                {previewLoading === flow._id && (
                  <Box
                    sx={{
                      position: "absolute", inset: 0, zIndex: 2,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      bgcolor: "rgba(255,255,255,0.75)", borderRadius: "16px",
                    }}
                  >
                    <CircularProgress size={24} sx={{ color: "#064e3b" }} />
                  </Box>
                )}
                <FlowBuilderCard
                  flow={flow}
                  onPreview={handleFlowBuilderPreview}
                />
              </Box>
            ))}
          </Box>
        )}
      </Box>

      {/* ── Setup steps ── */}
      <Box mb={4}>
        <Typography fontSize={13} fontWeight={700} color="#374151" mb={2}>
          How to set up
        </Typography>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "1fr 1fr 1fr 1fr" }, gap: 1.5 }}>
          {STEP_LIST.map((s) => (
            <Paper
              key={s.step}
              variant="outlined"
              sx={{ borderRadius: "12px", borderColor: "#e5e7eb", p: 2, bgcolor: "#fafafa" }}
            >
              <Box
                sx={{
                  width: 28, height: 28, borderRadius: "8px", bgcolor: s.bg,
                  border: `1px solid ${s.color}30`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 13, fontWeight: 800, color: s.color, mb: 1.25,
                }}
              >
                {s.step}
              </Box>
              <Typography fontSize={12.5} fontWeight={700} color="#111827" mb={0.5} lineHeight={1.3}>
                {s.title}
              </Typography>
              <Typography fontSize={11.5} color="#6b7280" lineHeight={1.5}>
                {s.desc}
              </Typography>
            </Paper>
          ))}
        </Box>
      </Box>

      {/* ── Legacy Registered apps ── */}
      <Box mb={4}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
          <Box>
            <Typography fontSize={15} fontWeight={700} color="#111827">
              Registered Flow Apps
            </Typography>
            <Typography fontSize={12.5} color="#6b7280" mt={0.25}>
              Legacy flow apps connected to your backend.
            </Typography>
          </Box>
          {!appsLoading && (
            <Chip
              label={`${apps.length} app${apps.length !== 1 ? "s" : ""}`}
              size="small"
              sx={{ bgcolor: "#f3f4f6", color: "#374151", fontWeight: 700, fontSize: 11 }}
            />
          )}
        </Stack>

        {appsLoading && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress size={28} sx={{ color: "#25D366" }} />
          </Box>
        )}

        {appsError && (
          <Alert
            severity="error" icon={<ErrorOutlineIcon />}
            sx={{ borderRadius: "12px", mb: 2 }}
          >
            Failed to load flow apps.
          </Alert>
        )}

        {!appsLoading && !appsError && apps.length === 0 && (
          <Paper
            variant="outlined"
            sx={{
              borderRadius: "14px", borderStyle: "dashed", borderColor: "#d1d5db",
              p: 4, textAlign: "center", bgcolor: "#fafafa",
            }}
          >
            <Typography fontSize={12.5} color="#9ca3af">No legacy flow apps registered.</Typography>
          </Paper>
        )}

        {!appsLoading && apps.length > 0 && (
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "1fr 1fr 1fr" }, gap: 2 }}>
            {apps.map((app) => (
              <FlowAppCard key={app.name} app={app} onPreview={setPreviewApp} />
            ))}
          </Box>
        )}
      </Box>

      {/* ── Preview modal (legacy apps only) ── */}
      <FlowPreviewModal
        open={!!previewApp}
        onClose={() => setPreviewApp(null)}
        app={previewApp}
      />
    </Box>
  );
};

export default WhatsappFlowTab;
