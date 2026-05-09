import {
  Box,
  Chip,
  CircularProgress,
  Divider,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import PhoneCallbackIcon from "@mui/icons-material/PhoneCallback";
import PhoneMissedIcon from "@mui/icons-material/PhoneMissed";
import PhoneForwardedIcon from "@mui/icons-material/PhoneForwarded";
import PhoneIcon from "@mui/icons-material/Phone";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { messageService } from "service/message.service";
import { channelService } from "service/channel.service";
import { useNavigate } from "react-router-dom";

const STATUS_FILTER = [
  { value: "", label: "All Calls" },
  { value: "COMPLETED", label: "Completed" },
  { value: "NO_ANSWER", label: "No Answer" },
  { value: "BUSY", label: "Busy" },
  { value: "REJECTED", label: "Rejected" },
  { value: "FAILED", label: "Failed" },
];

function getCallMeta(call: any) {
  const callData = call?.call || {};
  const rawStatus = (callData.status || call?.status || "").toUpperCase();
  const direction = call?.direction || callData.direction || "IN";

  const isCompleted =
    rawStatus === "COMPLETED" || call?.status === "CALL_COMPLETED";
  const isMissed =
    ["NO_ANSWER", "FAILED", "BUSY", "REJECTED"].some((s) =>
      rawStatus.includes(s)
    ) ||
    (!isCompleted && (call?.status || "").startsWith("CALL_"));

  const isOutgoing = direction === "OUT";

  let icon;
  let label;
  let color: string;
  let bg: string;
  let border: string;

  if (isOutgoing) {
    icon = <PhoneForwardedIcon sx={{ fontSize: 18 }} />;
    label = "Outgoing";
    color = "#2563eb";
    bg = "#eff6ff";
    border = "#bfdbfe";
  } else if (isCompleted) {
    icon = <PhoneCallbackIcon sx={{ fontSize: 18 }} />;
    label = "Incoming";
    color = "#16a34a";
    bg = "#f0fdf4";
    border = "#bbf7d0";
  } else {
    icon = <PhoneMissedIcon sx={{ fontSize: 18 }} />;
    label = "Missed";
    color = "#dc2626";
    bg = "#fef2f2";
    border = "#fecaca";
  }

  const statusLabel = isCompleted
    ? "Completed"
    : rawStatus.replace("CALL_", "") || "Unknown";

  return { icon, label, color, bg, border, statusLabel, isCompleted, isMissed, isOutgoing };
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } else if (diffDays === 1) {
    return "Yesterday " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } else if (diffDays < 7) {
    return d.toLocaleDateString([], { weekday: "short" }) + " " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } else {
    return d.toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" });
  }
}

const CallLogs = () => {
  const navigate = useNavigate();
  const [channelFilter, setChannelFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const { data: channelsData = [] } = useQuery({
    queryKey: ["channels"],
    queryFn: () => channelService.getChannels(),
    select: (res: any) => res.data || [],
  });

  const { data, isLoading, isError } = useQuery({
    queryKey: ["call-logs", channelFilter, statusFilter],
    queryFn: () =>
      messageService.getCallLogs({
        channel_id: channelFilter || undefined,
        status: statusFilter || undefined,
        limit: 50,
      }),
    select: (res: any) => res.data || [],
  });

  const calls: any[] = data || [];

  const stats = {
    total: calls.length,
    completed: calls.filter((c) => getCallMeta(c).isCompleted).length,
    missed: calls.filter((c) => getCallMeta(c).isMissed).length,
    outgoing: calls.filter((c) => getCallMeta(c).isOutgoing).length,
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f8fafc" }}>
      {/* ── GRADIENT HEADER ── */}
      <Box
        sx={{
          background:
            "linear-gradient(135deg, #064e3b 0%, #065f46 60%, #047857 100%)",
          px: { xs: 2.5, md: 4 },
          pt: 3,
          pb: 3,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {[
          { w: 220, h: 220, top: -80, right: 60, opacity: 0.05 },
          { w: 140, h: 140, top: 20, right: 220, opacity: 0.04 },
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
          <Stack direction="row" alignItems="center" spacing={2}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: "13px",
                bgcolor: "rgba(255,255,255,0.12)",
                border: "1px solid rgba(255,255,255,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <PhoneIcon sx={{ color: "#6ee7b7", fontSize: 24 }} />
            </Box>
            <Box>
              <Typography
                fontSize={20}
                fontWeight={800}
                color="#fff"
                lineHeight={1.2}
                letterSpacing={-0.3}
              >
                Call Logs
              </Typography>
              <Typography fontSize={12.5} color="#a7f3d0" fontWeight={500}>
                WhatsApp voice call history
              </Typography>
            </Box>
          </Stack>

          {/* STAT CHIPS */}
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {[
              { label: `${stats.total} Total`, color: "#fff", bg: "rgba(255,255,255,0.12)", border: "rgba(255,255,255,0.2)" },
              { label: `${stats.completed} Completed`, color: "#86efac", bg: "rgba(134,239,172,0.12)", border: "rgba(134,239,172,0.3)" },
              { label: `${stats.missed} Missed`, color: "#fca5a5", bg: "rgba(252,165,165,0.12)", border: "rgba(252,165,165,0.3)" },
            ].map((s) => (
              <Chip
                key={s.label}
                label={s.label}
                size="small"
                sx={{
                  height: 26,
                  fontSize: 11.5,
                  fontWeight: 700,
                  color: s.color,
                  bgcolor: s.bg,
                  border: `1px solid ${s.border}`,
                  borderRadius: "8px",
                }}
              />
            ))}
          </Stack>
        </Stack>
      </Box>

      {/* ── FILTERS ── */}
      <Box
        sx={{
          bgcolor: "#fff",
          px: { xs: 2.5, md: 4 },
          py: 2,
          borderBottom: "1px solid #f3f4f6",
          display: "flex",
          gap: 1.5,
          flexWrap: "wrap",
        }}
      >
        <TextField
          select
          size="small"
          value={channelFilter}
          onChange={(e) => setChannelFilter(e.target.value)}
          sx={{
            minWidth: 180,
            "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: 13 },
          }}
        >
          <MenuItem value="">All Channels</MenuItem>
          {channelsData.map((ch: any) => (
            <MenuItem key={ch._id} value={ch._id}>
              📱 {ch.channel_name || ch.display_phone_number}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          size="small"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          sx={{
            minWidth: 150,
            "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: 13 },
          }}
        >
          {STATUS_FILTER.map((s) => (
            <MenuItem key={s.value} value={s.value}>
              {s.label}
            </MenuItem>
          ))}
        </TextField>
      </Box>

      {/* ── CONTENT ── */}
      <Box sx={{ px: { xs: 2.5, md: 4 }, py: 3 }}>
        {isLoading && (
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            py={10}
            gap={2}
          >
            <CircularProgress sx={{ color: "#25D366" }} />
            <Typography color="text.secondary" fontSize={14}>
              Loading call logs…
            </Typography>
          </Box>
        )}

        {isError && (
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            py={10}
            gap={1.5}
          >
            <Typography fontSize={36}>⚠️</Typography>
            <Typography color="error" fontSize={14} fontWeight={600}>
              Failed to load call logs
            </Typography>
          </Box>
        )}

        {!isLoading && !isError && calls.length === 0 && (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              py: 10,
              gap: 2,
              border: "2px dashed #e5e7eb",
              borderRadius: "16px",
              bgcolor: "#fafafa",
            }}
          >
            <Typography fontSize={48} lineHeight={1}>
              📵
            </Typography>
            <Box textAlign="center">
              <Typography fontSize={16} fontWeight={700} color="#374151">
                No call logs yet
              </Typography>
              <Typography fontSize={13} color="#6b7280" mt={0.5}>
                WhatsApp voice call events will appear here automatically
              </Typography>
            </Box>
          </Box>
        )}

        {!isLoading && calls.length > 0 && (
          <Box
            sx={{
              bgcolor: "#fff",
              borderRadius: "14px",
              border: "1px solid #e5e7eb",
              overflow: "hidden",
              boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
            }}
          >
            {calls.map((call: any, idx: number) => {
              const meta = getCallMeta(call);
              const contact = call.contact_id;
              const contactName =
                contact?.name || contact?.phone || call?.call?.from || "Unknown";
              const phone = contact?.phone || call?.call?.from || "";
              const channelName =
                channelsData.find((c: any) => c._id === (call.channel_id?._id || call.channel_id))
                  ?.channel_name || "";

              return (
                <Box key={call._id || idx}>
                  {idx > 0 && <Divider sx={{ borderColor: "#f9fafb" }} />}
                  <Box
                    onClick={() =>
                      contact?._id &&
                      navigate(`/chats?contactId=${contact._id}`)
                    }
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                      px: 3,
                      py: 1.75,
                      cursor: contact?._id ? "pointer" : "default",
                      transition: "bgcolor 0.15s",
                      "&:hover": contact?._id
                        ? { bgcolor: "#f9fafb" }
                        : {},
                    }}
                  >
                    {/* ICON */}
                    <Box
                      sx={{
                        width: 42,
                        height: 42,
                        borderRadius: "50%",
                        bgcolor: meta.bg,
                        border: `2px solid ${meta.border}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: meta.color,
                        flexShrink: 0,
                      }}
                    >
                      {meta.icon}
                    </Box>

                    {/* CONTACT INFO */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Typography
                          fontSize={14}
                          fontWeight={600}
                          color="#111827"
                          noWrap
                        >
                          {contactName}
                        </Typography>
                        <Chip
                          label={meta.label}
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: 10.5,
                            fontWeight: 700,
                            color: meta.color,
                            bgcolor: meta.bg,
                            border: `1px solid ${meta.border}`,
                            borderRadius: "6px",
                          }}
                        />
                      </Stack>
                      <Stack direction="row" alignItems="center" spacing={1} mt={0.25}>
                        {phone && (
                          <Typography fontSize={12} color="#6b7280">
                            {phone}
                          </Typography>
                        )}
                        {channelName && (
                          <>
                            <Box sx={{ width: 3, height: 3, borderRadius: "50%", bgcolor: "#d1d5db" }} />
                            <Typography fontSize={12} color="#6b7280">
                              {channelName}
                            </Typography>
                          </>
                        )}
                      </Stack>
                    </Box>

                    {/* STATUS + TIME */}
                    <Box sx={{ textAlign: "right", flexShrink: 0 }}>
                      <Typography
                        fontSize={12}
                        fontWeight={600}
                        color={meta.color}
                      >
                        {meta.statusLabel}
                      </Typography>
                      <Tooltip title={new Date(call.createdAt).toLocaleString()}>
                        <Typography fontSize={11} color="#9ca3af" mt={0.25}>
                          {formatTime(call.createdAt)}
                        </Typography>
                      </Tooltip>
                    </Box>
                  </Box>
                </Box>
              );
            })}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default CallLogs;
