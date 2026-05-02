import {
  Box,
  Button,
  Chip,
  Dialog,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import CloseIcon from "@mui/icons-material/Close";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AutomationT } from "types/automation";
import automationService from "service/automation.service";

interface Props {
  automation: AutomationT;
  onRefresh: () => void;
}

const TRIGGER_META: Record<string, { icon: string; label: string }> = {
  new_message_received: { icon: "📩", label: "Incoming Message" },
  outgoing_message:     { icon: "📤", label: "Outgoing Message" },
  webhook_received:     { icon: "🔗", label: "Webhook" },
  call_completed:       { icon: "📞", label: "Call Completed" },
  call_missed:          { icon: "📵", label: "Call Missed" },
};

const AutomationCard = ({ automation, onRefresh }: Props) => {
  const navigate = useNavigate();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isActive = automation.status === "active";
  const triggerMeta = TRIGGER_META[automation.trigger as string] || { icon: "⚡", label: automation.trigger || "Unknown" };

  const handleToggle = async () => {
    await automationService.toggleAutomation(automation._id);
    onRefresh();
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await automationService.deleteAutomation(automation._id);
      setConfirmOpen(false);
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Box
        sx={{
          borderRadius: "12px",
          border: "1px solid #e5e7eb",
          borderLeft: `4px solid ${isActive ? "#22c55e" : "#f59e0b"}`,
          bgcolor: "#fff",
          boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
          p: 2,
          display: "flex",
          flexDirection: "column",
          gap: 1.5,
          transition: "box-shadow 0.2s, transform 0.2s",
          "&:hover": {
            boxShadow: "0 6px 20px rgba(0,0,0,0.09)",
            transform: "translateY(-1px)",
          },
        }}
      >
        {/* ── TOP ── */}
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.25 }}>
          <Box sx={{
            width: 42, height: 42, borderRadius: "10px", flexShrink: 0,
            bgcolor: isActive ? "#f0fdf4" : "#fffbeb",
            border: `1px solid ${isActive ? "#bbf7d0" : "#fde68a"}`,
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
          }}>
            🤖
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontSize: 14, fontWeight: 700, color: "#111827", lineHeight: 1.3 }} noWrap>
              {automation.name}
            </Typography>
            <Typography sx={{ fontSize: 11.5, color: "#6b7280", mt: 0.25 }} noWrap>
              📱 {automation.channel_name}
            </Typography>
          </Box>
          <Chip
            label={isActive ? "Active" : "Paused"}
            size="small"
            sx={{
              fontSize: 11, height: 22, fontWeight: 700, flexShrink: 0,
              bgcolor: isActive ? "#f0fdf4" : "#fffbeb",
              color: isActive ? "#16a34a" : "#d97706",
              border: "1px solid",
              borderColor: isActive ? "#bbf7d0" : "#fde68a",
            }}
          />
        </Box>

        {/* ── TRIGGER BADGE ── */}
        <Box sx={{
          display: "inline-flex", alignItems: "center", gap: 0.75,
          px: 1.25, py: 0.6, borderRadius: "8px",
          bgcolor: "#f8fafc", border: "1px solid #f1f5f9",
          width: "fit-content",
        }}>
          <Typography fontSize={13}>{triggerMeta.icon}</Typography>
          <Typography fontSize={11.5} fontWeight={600} color="#475569">{triggerMeta.label}</Typography>
        </Box>

        {/* ── DIVIDER ── */}
        <Box sx={{ height: "1px", bgcolor: "#f3f4f6" }} />

        {/* ── FOOTER ── */}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
          <Typography fontSize={10.5} color="#9ca3af">
            {new Date(automation.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
          </Typography>

          <Stack direction="row" spacing={0.75} alignItems="center">
            <Tooltip title={isActive ? "Pause automation" : "Activate automation"} arrow>
              <IconButton
                size="small"
                onClick={handleToggle}
                sx={{
                  color: isActive ? "#d97706" : "#16a34a",
                  bgcolor: isActive ? "#fffbeb" : "#f0fdf4",
                  border: "1px solid",
                  borderColor: isActive ? "#fde68a" : "#bbf7d0",
                  p: 0.75,
                  "&:hover": { opacity: 0.8, transform: "scale(1.05)" },
                  transition: "all 0.15s",
                }}
              >
                {isActive ? <PauseIcon sx={{ fontSize: 15 }} /> : <PlayArrowIcon sx={{ fontSize: 15 }} />}
              </IconButton>
            </Tooltip>

            <Tooltip title="Delete automation" arrow>
              <IconButton
                size="small"
                onClick={() => setConfirmOpen(true)}
                sx={{
                  color: "#ef4444", bgcolor: "#fef2f2", border: "1px solid #fecaca",
                  p: 0.75,
                  "&:hover": { opacity: 0.8, transform: "scale(1.05)" },
                  transition: "all 0.15s",
                }}
              >
                <DeleteOutlineIcon sx={{ fontSize: 15 }} />
              </IconButton>
            </Tooltip>

            <Button
              size="small"
              variant="contained"
              onClick={() => navigate(`/automations/${automation._id}`)}
              sx={{
                borderRadius: "8px", px: 1.75, py: 0.6, fontSize: 12, fontWeight: 700,
                bgcolor: "#1d4ed8", "&:hover": { bgcolor: "#1e40af" },
                boxShadow: "none", ml: 0.25,
              }}
            >
              Open →
            </Button>
          </Stack>
        </Box>
      </Box>

      {/* ── DELETE CONFIRM DIALOG ── */}
      <Dialog
        open={confirmOpen}
        onClose={() => !deleting && setConfirmOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: "16px", overflow: "hidden", boxShadow: "0 24px 60px rgba(0,0,0,0.2)" } }}
        BackdropProps={{ sx: { backgroundColor: "rgba(0,0,0,0.45)" } }}
      >
        {/* Header */}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 2.5, py: 1.75, bgcolor: "#fef2f2", borderBottom: "1px solid #fecaca" }}>
          <Stack direction="row" spacing={1.25} alignItems="center">
            <Box sx={{ width: 34, height: 34, borderRadius: "10px", bgcolor: "#fff", border: "1px solid #fecaca", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
              🗑️
            </Box>
            <Box>
              <Typography sx={{ fontSize: 14, fontWeight: 700, lineHeight: 1.2, color: "#111827" }}>Delete Automation</Typography>
              <Typography variant="caption" color="text.secondary">This cannot be undone</Typography>
            </Box>
          </Stack>
          <IconButton size="small" onClick={() => setConfirmOpen(false)} disabled={deleting} sx={{ color: "#9ca3af", "&:hover": { color: "#374151", bgcolor: "#f3f4f6" } }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        {/* Body */}
        <Box sx={{ px: 2.5, py: 2.5 }}>
          <Box sx={{ p: 1.75, borderRadius: "10px", bgcolor: "#fef2f2", border: "1px solid #fecaca", mb: 2 }}>
            <Typography fontSize={13} fontWeight={700} color="#111827" noWrap>
              {automation.name}
            </Typography>
            <Typography fontSize={11.5} color="#6b7280" mt={0.25}>
              📱 {automation.channel_name}
            </Typography>
          </Box>
          <Typography fontSize={13} color="#6b7280" lineHeight={1.6}>
            Deleting this automation will permanently remove all its nodes, edges, and settings. Any active contacts in this flow will stop receiving messages.
          </Typography>
        </Box>

        {/* Footer */}
        <Box sx={{ px: 2.5, py: 1.75, borderTop: "1px solid #f3f4f6", display: "flex", justifyContent: "flex-end", gap: 1.5 }}>
          <Button
            variant="outlined"
            onClick={() => setConfirmOpen(false)}
            disabled={deleting}
            sx={{ borderRadius: "8px", fontWeight: 600, fontSize: 13, px: 2.5, color: "#374151", borderColor: "#e5e7eb", "&:hover": { borderColor: "#9ca3af", bgcolor: "#f9fafb" } }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleDelete}
            disabled={deleting}
            sx={{ borderRadius: "8px", fontWeight: 700, fontSize: 13, px: 2.5, bgcolor: "#ef4444", "&:hover": { bgcolor: "#dc2626" }, boxShadow: "none" }}
          >
            {deleting ? "Deleting…" : "Yes, Delete"}
          </Button>
        </Box>
      </Dialog>
    </>
  );
};

export default AutomationCard;
