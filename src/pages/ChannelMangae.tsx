import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Stack,
  Typography,
  IconButton,
  Tooltip,
} from "@mui/material";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PhoneIcon from "@mui/icons-material/Phone";
import AccountTreeOutlinedIcon from "@mui/icons-material/AccountTreeOutlined";
import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import KeyOutlinedIcon from "@mui/icons-material/KeyOutlined";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { channelService } from "service/channel.service";
import TamplatesTab from "components/TemplatesTab";
import WhatsappFlowTab from "components/WhatsappFlowTab";

const TABS = [
  { label: "Templates", icon: <ArticleOutlinedIcon sx={{ fontSize: 16 }} /> },
  { label: "WhatsApp Flows", icon: <AccountTreeOutlinedIcon sx={{ fontSize: 16 }} /> },
  { label: "Settings", icon: <LockOutlinedIcon sx={{ fontSize: 16 }} /> },
];

/* ── Encryption / Key Management Tab ── */
const EncryptionTab = ({ channelId }: { channelId: string }) => {
  const queryClient = useQueryClient();
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const { data: keyStatus, isLoading: keyLoading } = useQuery({
    queryKey: ["channel-key-status", channelId],
    queryFn: () => channelService.getFlowKeyStatus(channelId),
    retry: false,
  });

  const hasKey = keyStatus?.has_key === true;

  const generateMut = useMutation({
    mutationFn: () => channelService.generateFlowKeyPair(channelId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["channel-key-status", channelId] });
      setMsg({ type: "success", text: "RSA-2048 key pair generated successfully." });
    },
    onError: (e: any) => setMsg({ type: "error", text: e?.response?.data?.message || "Failed to generate key pair" }),
  });

  const publishMut = useMutation({
    mutationFn: () => channelService.publishFlowKeyToMeta(channelId),
    onSuccess: (d) => setMsg({ type: "success", text: d.message || "Public key uploaded to Meta successfully." }),
    onError: (e: any) => setMsg({ type: "error", text: e?.response?.data?.message || "Failed to upload to Meta" }),
  });

  return (
    <Box sx={{ maxWidth: 560 }}>
      <Typography fontSize={16} fontWeight={700} color="#111827" mb={0.5}>
        WhatsApp Flow Encryption
      </Typography>
      <Typography fontSize={13} color="#6b7280" mb={3}>
        Dynamic WhatsApp Flows encrypt all data between Meta and your backend using RSA-2048.
        Generate a key pair and publish it to Meta — no key is ever shown to users.
      </Typography>

      {msg && (
        <Alert severity={msg.type} onClose={() => setMsg(null)} sx={{ mb: 2.5, borderRadius: "10px", fontSize: 13 }}>
          {msg.text}
        </Alert>
      )}

      {/* Status card */}
      <Box sx={{ p: 2.5, borderRadius: "14px", border: "1px solid #e5e7eb", mb: 3, bgcolor: "#fafafa" }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" gap={1.5}>
            <Box sx={{ width: 40, height: 40, borderRadius: "10px", bgcolor: hasKey ? "#f0fdf4" : "#f9fafb", border: "1px solid", borderColor: hasKey ? "#bbf7d0" : "#e5e7eb", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <KeyOutlinedIcon sx={{ fontSize: 20, color: hasKey ? "#16a34a" : "#9ca3af" }} />
            </Box>
            <Box>
              <Typography fontSize={13.5} fontWeight={700} color="#111827">RSA-2048 Key Pair</Typography>
              {keyLoading
                ? <Typography fontSize={12} color="#9ca3af">Checking…</Typography>
                : <Typography fontSize={12} color={hasKey ? "#16a34a" : "#9ca3af"}>
                    {hasKey ? "✅ Key pair exists — stored securely on server" : "No key pair generated yet"}
                  </Typography>
              }
            </Box>
          </Stack>
          <Button
            variant="outlined"
            size="small"
            startIcon={generateMut.isPending ? <CircularProgress size={13} /> : <KeyOutlinedIcon sx={{ fontSize: 14 }} />}
            disabled={generateMut.isPending}
            onClick={() => generateMut.mutate()}
            sx={{ fontSize: 12, textTransform: "none", borderRadius: "8px", borderColor: "#d1d5db", color: "#374151", "&:hover": { borderColor: "#6b7280" } }}
          >
            {hasKey ? "Regenerate" : "Generate Key"}
          </Button>
        </Stack>
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* Publish to Meta */}
      <Typography fontSize={14} fontWeight={700} color="#111827" mb={0.5}>
        Publish to Meta
      </Typography>
      <Typography fontSize={12.5} color="#6b7280" mb={2}>
        This uploads your public key to Meta via API so your dynamic flows can encrypt/decrypt data.
        Your private key stays on the server — Meta never sees it.
      </Typography>

      <Button
        variant="contained"
        fullWidth
        size="large"
        startIcon={publishMut.isPending ? <CircularProgress size={16} sx={{ color: "#fff" }} /> : <CloudUploadOutlinedIcon />}
        disabled={!hasKey || publishMut.isPending}
        onClick={() => publishMut.mutate()}
        sx={{
          bgcolor: "#064e3b", color: "#fff", borderRadius: "12px", fontSize: 14, fontWeight: 700, textTransform: "none", py: 1.5,
          "&:hover": { bgcolor: "#065f46" },
          "&:disabled": { bgcolor: "#e5e7eb", color: "#9ca3af" },
        }}
      >
        {publishMut.isPending ? "Uploading to Meta…" : "Publish Public Key to Meta"}
      </Button>

      {!hasKey && (
        <Typography fontSize={11.5} color="#9ca3af" mt={1} textAlign="center">
          Generate a key pair first to enable this button
        </Typography>
      )}
    </Box>
  );
};

const ChannelManage = () => {
  const { id: channelId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);

  const { data: channelsData, isLoading } = useQuery({
    queryKey: ["channels"],
    queryFn: () => channelService.getChannels(),
    select: (res) => res.data,
    staleTime: 60_000,
  });

  const channel = channelsData?.find((c: any) => c._id === channelId);

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f8fafc" }}>

      {/* ── PAGE HEADER ── */}
      <Box
        sx={{
          background: "linear-gradient(135deg, #064e3b 0%, #065f46 60%, #047857 100%)",
          px: { xs: 2.5, md: 4 },
          pt: 3,
          pb: 0,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative circles */}
        {[
          { w: 220, h: 220, top: -80, right: 60, opacity: 0.05 },
          { w: 140, h: 140, top: 20, right: 220, opacity: 0.04 },
        ].map((c, i) => (
          <Box
            key={i}
            sx={{
              position: "absolute",
              width: c.w, height: c.h,
              borderRadius: "50%",
              bgcolor: "#fff",
              opacity: c.opacity,
              top: c.top, right: c.right,
              pointerEvents: "none",
            }}
          />
        ))}

        {/* Back + breadcrumb */}
        <Stack direction="row" alignItems="center" spacing={1} mb={2.5}>
          <Tooltip title="Back to Channels">
            <IconButton
              size="small"
              onClick={() => navigate("/Channels")}
              sx={{
                color: "#a7f3d0",
                bgcolor: "rgba(255,255,255,0.08)",
                borderRadius: "8px",
                "&:hover": { bgcolor: "rgba(255,255,255,0.14)" },
              }}
            >
              <ArrowBackIcon sx={{ fontSize: 17 }} />
            </IconButton>
          </Tooltip>
          <Typography fontSize={12} color="#6ee7b7" fontWeight={500}>
            Channels
          </Typography>
          <Typography fontSize={12} color="#4ade80" sx={{ opacity: 0.6 }}>
            /
          </Typography>
          <Typography fontSize={12} color="#fff" fontWeight={600}>
            {isLoading ? "…" : channel?.channel_name || "Channel"}
          </Typography>
        </Stack>

        {/* Channel info */}
        {isLoading ? (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
            <CircularProgress size={18} sx={{ color: "#6ee7b7" }} />
            <Typography color="#a7f3d0" fontSize={13}>Loading channel…</Typography>
          </Box>
        ) : channel ? (
          <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ sm: "center" }} justifyContent="space-between" mb={3} spacing={2}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Box
                sx={{
                  width: 52, height: 52,
                  borderRadius: "14px",
                  bgcolor: "rgba(255,255,255,0.12)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <WhatsAppIcon sx={{ color: "#fff", fontSize: 26 }} />
              </Box>
              <Box>
                <Typography fontSize={20} fontWeight={800} color="#fff" lineHeight={1.2} letterSpacing={-0.3}>
                  {channel.channel_name}
                </Typography>
                <Stack direction="row" alignItems="center" spacing={0.75} mt={0.5}>
                  <PhoneIcon sx={{ fontSize: 12, color: "#a7f3d0" }} />
                  <Typography fontSize={12.5} color="#a7f3d0" fontWeight={500}>
                    {channel.display_phone_number}
                  </Typography>
                </Stack>
              </Box>
            </Stack>

            <Chip
              label={channel.is_active ? "Active" : "Inactive"}
              size="small"
              sx={{
                height: 26,
                fontSize: 12,
                fontWeight: 700,
                bgcolor: channel.is_active ? "rgba(74,222,128,0.18)" : "rgba(255,255,255,0.1)",
                color: channel.is_active ? "#4ade80" : "#9ca3af",
                border: `1px solid ${channel.is_active ? "rgba(74,222,128,0.4)" : "rgba(255,255,255,0.15)"}`,
                borderRadius: "8px",
                alignSelf: "flex-start",
              }}
            />
          </Stack>
        ) : (
          <Box mb={3}>
            <Typography fontSize={18} fontWeight={700} color="#fff">Channel not found</Typography>
          </Box>
        )}

        {/* ── CUSTOM TABS ── */}
        <Stack direction="row" spacing={0.5} sx={{ mt: "auto" }}>
          {TABS.map((t, i) => (
            <Box
              key={i}
              onClick={() => setTab(i)}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.75,
                px: 2.25,
                py: 1.1,
                cursor: "pointer",
                borderRadius: "10px 10px 0 0",
                fontSize: 13,
                fontWeight: tab === i ? 700 : 500,
                color: tab === i ? "#064e3b" : "#a7f3d0",
                bgcolor: tab === i ? "#fff" : "transparent",
                transition: "all 0.15s",
                "&:hover": {
                  bgcolor: tab === i ? "#fff" : "rgba(255,255,255,0.1)",
                  color: tab === i ? "#064e3b" : "#d1fae5",
                },
                "& .MuiSvgIcon-root": {
                  color: tab === i ? "#25D366" : "inherit",
                },
              }}
            >
              {t.icon}
              {t.label}
            </Box>
          ))}
        </Stack>
      </Box>

      {/* ── TAB CONTENT ── */}
      <Box
        sx={{
          bgcolor: "#fff",
          borderTop: "none",
          px: { xs: 2.5, md: 4 },
          py: 3.5,
          minHeight: "calc(100vh - 200px)",
        }}
      >
        {tab === 0 && <TamplatesTab />}
        {tab === 1 && <WhatsappFlowTab channelId={channelId || ""} />}
        {tab === 2 && <EncryptionTab channelId={channelId || ""} />}
      </Box>
    </Box>
  );
};

export default ChannelManage;
