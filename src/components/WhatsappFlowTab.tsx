import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import AccountTreeOutlinedIcon from "@mui/icons-material/AccountTreeOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { FlowApp, whatsappFlowService } from "service/whatsappFlow.service";
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
        borderRadius: "16px",
        borderColor: "#e5e7eb",
        overflow: "hidden",
        transition: "box-shadow 0.2s, transform 0.15s",
        display: "flex",
        flexDirection: "column",
        "&:hover": {
          boxShadow: "0 8px 24px rgba(0,0,0,0.09)",
          transform: "translateY(-2px)",
        },
      }}
    >
      {/* Card accent */}
      <Box sx={{ height: 3, bgcolor: "#25D366" }} />

      <Box sx={{ p: 2.5, display: "flex", flexDirection: "column", flex: 1 }}>
        {/* Header */}
        <Stack
          direction="row"
          alignItems="flex-start"
          justifyContent="space-between"
          mb={2}
        >
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: "12px",
                bgcolor: "#f0fdf4",
                border: "1px solid #bbf7d0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 15,
                fontWeight: 800,
                color: "#16a34a",
                fontFamily: "monospace",
                flexShrink: 0,
              }}
            >
              {initials}
            </Box>
            <Box>
              <Typography
                fontWeight={700}
                fontSize={15}
                color="#111827"
                lineHeight={1.3}
              >
                {app.display_name}
              </Typography>
              <Typography
                fontSize={11.5}
                color="#6b7280"
                fontFamily="monospace"
              >
                /{app.name}
              </Typography>
            </Box>
          </Stack>

          <Chip
            icon={
              <CheckCircleOutlineIcon
                sx={{ fontSize: 13, color: "#16a34a !important" }}
              />
            }
            label="Active"
            size="small"
            sx={{
              height: 22,
              fontSize: 11,
              fontWeight: 700,
              bgcolor: "#f0fdf4",
              color: "#16a34a",
              border: "1px solid #bbf7d0",
              borderRadius: "6px",
            }}
          />
        </Stack>

        <Divider sx={{ mb: 2, borderColor: "#f3f4f6" }} />

        {/* Description placeholder */}
        <Typography
          fontSize={12.5}
          color="#6b7280"
          lineHeight={1.55}
          mb={2}
          flex={1}
        >
          Interactive WhatsApp Flow connected to your backend. Click preview to
          see how it will appear in chat.
        </Typography>

        {/* Preview button */}
        <Button
          fullWidth
          variant="contained"
          startIcon={<VisibilityOutlinedIcon sx={{ fontSize: 17 }} />}
          onClick={() => onPreview(app)}
          sx={{
            mt: "auto",
            borderRadius: "10px",
            textTransform: "none",
            fontWeight: 700,
            fontSize: 13,
            py: 0.95,
            bgcolor: "#064e3b",
            "&:hover": { bgcolor: "#065f46" },
            boxShadow: "none",
          }}
        >
          Preview Flow
        </Button>
      </Box>
    </Paper>
  );
};

const WhatsappFlowTab = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["whatsapp-flow-apps"],
    queryFn: () => whatsappFlowService.getFlowApps(),
    staleTime: 60_000,
  });

  const apps: FlowApp[] = data?.data || [];

  const [previewApp, setPreviewApp] = useState<FlowApp | null>(null);

  return (
    <Box>
      {/* ── Hero banner ── */}
      <Box
        sx={{
          borderRadius: "16px",
          background:
            "linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%)",
          p: { xs: 3, md: 4 },
          mb: 4,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* decorative circles */}
        {[
          { w: 180, h: 180, top: -60, right: 40, opacity: 0.06 },
          { w: 120, h: 120, top: 10, right: 160, opacity: 0.04 },
          { w: 80, h: 80, bottom: -20, right: 20, opacity: 0.08 },
        ].map((c, i) => (
          <Box
            key={i}
            sx={{
              position: "absolute",
              width: c.w,
              height: c.h,
              borderRadius: "50%",
              bgcolor: "#fff",
              opacity: c.opacity,
              top: c.top,
              right: c.right,
              bottom: (c as any).bottom,
              pointerEvents: "none",
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
              <Typography
                fontSize={20}
                fontWeight={800}
                color="#fff"
                letterSpacing={-0.3}
              >
                WhatsApp Flows
              </Typography>
            </Stack>
            <Typography
              fontSize={13.5}
              color="#a7f3d0"
              lineHeight={1.6}
              maxWidth={520}
            >
              Interactive UI forms that run inside WhatsApp. Preview each flow
              to see how it will appear to your customers in chat.
            </Typography>
          </Box>
          <Button
            variant="outlined"
            endIcon={<OpenInNewIcon sx={{ fontSize: 14 }} />}
            href="https://business.facebook.com/wa/manage/flows/"
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              borderColor: "#6ee7b7",
              color: "#6ee7b7",
              fontSize: 12.5,
              fontWeight: 700,
              borderRadius: "10px",
              textTransform: "none",
              flexShrink: 0,
              px: 2.5,
              "&:hover": {
                bgcolor: "rgba(110,231,183,0.1)",
                borderColor: "#34d399",
              },
            }}
          >
            Open Meta Flow Builder
          </Button>
        </Stack>
      </Box>

      {/* ── Setup steps ── */}
      <Box mb={4}>
        <Typography fontSize={13} fontWeight={700} color="#374151" mb={2}>
          How to set up
        </Typography>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr 1fr", md: "1fr 1fr 1fr 1fr" },
            gap: 1.5,
          }}
        >
          {STEP_LIST.map((s) => (
            <Paper
              key={s.step}
              variant="outlined"
              sx={{
                borderRadius: "12px",
                borderColor: "#e5e7eb",
                p: 2,
                bgcolor: "#fafafa",
              }}
            >
              <Box
                sx={{
                  width: 28,
                  height: 28,
                  borderRadius: "8px",
                  bgcolor: s.bg,
                  border: `1px solid ${s.color}30`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 13,
                  fontWeight: 800,
                  color: s.color,
                  mb: 1.25,
                }}
              >
                {s.step}
              </Box>
              <Typography
                fontSize={12.5}
                fontWeight={700}
                color="#111827"
                mb={0.5}
                lineHeight={1.3}
              >
                {s.title}
              </Typography>
              <Typography fontSize={11.5} color="#6b7280" lineHeight={1.5}>
                {s.desc}
              </Typography>
            </Paper>
          ))}
        </Box>
      </Box>

      {/* ── Registered apps ── */}
      <Box>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          mb={2}
        >
          <Box>
            <Typography fontSize={15} fontWeight={700} color="#111827">
              Registered Flow Apps
            </Typography>
            <Typography fontSize={12.5} color="#6b7280" mt={0.25}>
              Click <b>Preview</b> on any flow to see how it appears in chat.
            </Typography>
          </Box>
          {!isLoading && (
            <Chip
              label={`${apps.length} app${apps.length !== 1 ? "s" : ""}`}
              size="small"
              sx={{
                bgcolor: "#f3f4f6",
                color: "#374151",
                fontWeight: 700,
                fontSize: 11,
              }}
            />
          )}
        </Stack>

        {isLoading && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress size={28} sx={{ color: "#25D366" }} />
          </Box>
        )}

        {isError && (
          <Alert severity="error" sx={{ borderRadius: "12px" }}>
            Failed to load flow apps. Check your backend connection.
          </Alert>
        )}

        {!isLoading && !isError && apps.length === 0 && (
          <Paper
            variant="outlined"
            sx={{
              borderRadius: "14px",
              borderStyle: "dashed",
              borderColor: "#d1d5db",
              p: 6,
              textAlign: "center",
              bgcolor: "#fafafa",
            }}
          >
            <Typography fontSize={40} mb={1.5}>
              🔗
            </Typography>
            <Typography fontWeight={700} fontSize={15} color="#374151" mb={0.5}>
              No flows registered yet
            </Typography>
            <Typography
              fontSize={13}
              color="#9ca3af"
              mb={3}
              maxWidth={380}
              mx="auto"
            >
              Add flow app classes to{" "}
              <Box
                component="code"
                sx={{
                  bgcolor: "#f3f4f6",
                  px: 0.75,
                  borderRadius: 1,
                  fontSize: 12,
                }}
              >
                src/utils/vendors.ts
              </Box>{" "}
              on the backend to register them here.
            </Typography>
          </Paper>
        )}

        {!isLoading && apps.length > 0 && (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "1fr 1fr",
                lg: "1fr 1fr 1fr",
              },
              gap: 2,
            }}
          >
            {apps.map((app) => (
              <FlowAppCard key={app.name} app={app} onPreview={setPreviewApp} />
            ))}
          </Box>
        )}
      </Box>

      {/* ── Info box ── */}
      <Box
        sx={{
          mt: 4,
          borderRadius: "12px",
          border: "1px solid #dbeafe",
          bgcolor: "#eff6ff",
          p: 2.5,
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="flex-start">
          <Typography fontSize={18} lineHeight={1}>
            💡
          </Typography>
          <Box>
            <Typography fontSize={12.5} fontWeight={700} color="#1d4ed8" mb={0.5}>
              Adding a new flow app
            </Typography>
            <Typography fontSize={12} color="#3b82f6" lineHeight={1.6}>
              Create a new class in{" "}
              <Box
                component="code"
                sx={{
                  bgcolor: "#dbeafe",
                  px: 0.75,
                  borderRadius: 1,
                  fontSize: 11,
                }}
              >
                src/flows/
              </Box>{" "}
              that implements{" "}
              <Box
                component="code"
                sx={{
                  bgcolor: "#dbeafe",
                  px: 0.75,
                  borderRadius: 1,
                  fontSize: 11,
                }}
              >
                getNextScreen(body)
              </Box>
              , then register it in{" "}
              <Box
                component="code"
                sx={{
                  bgcolor: "#dbeafe",
                  px: 0.75,
                  borderRadius: 1,
                  fontSize: 11,
                }}
              >
                src/utils/vendors.ts
              </Box>
              . It will appear here automatically.
            </Typography>
          </Box>
        </Stack>
      </Box>

      {/* ── Preview modal ── */}
      <FlowPreviewModal
        open={!!previewApp}
        onClose={() => setPreviewApp(null)}
        app={previewApp}
      />
    </Box>
  );
};

export default WhatsappFlowTab;
