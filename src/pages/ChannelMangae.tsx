import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Chip,
  CircularProgress,
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
import { useQuery } from "@tanstack/react-query";
import { channelService } from "service/channel.service";
import TamplatesTab from "components/TemplatesTab";
import WhatsappFlowTab from "components/WhatsappFlowTab";

const TABS = [
  { label: "Templates", icon: <ArticleOutlinedIcon sx={{ fontSize: 16 }} /> },
  { label: "WhatsApp Flows", icon: <AccountTreeOutlinedIcon sx={{ fontSize: 16 }} /> },
];

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
        {tab === 1 && <WhatsappFlowTab />}
      </Box>
    </Box>
  );
};

export default ChannelManage;
