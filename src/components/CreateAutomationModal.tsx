import {
  Dialog,
  DialogContent,
  Button,
  TextField,
  MenuItem,
  Box,
  Typography,
  Stack,
  IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useEffect, useState } from "react";
import automationService from "service/automation.service";
import { useNavigate } from "react-router-dom";
import { channelService } from "service/channel.service";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const TRIGGERS = [
  { value: "new_message_received", icon: "📩", label: "Incoming Message", desc: "When contact sends a message" },
  { value: "outgoing_message",     icon: "📤", label: "Outgoing Message",  desc: "When you send a message" },
  { value: "webhook_received",     icon: "🔗", label: "Webhook",           desc: "On webhook call" },
  { value: "call_completed",       icon: "📞", label: "Call Completed",    desc: "After a call ends" },
  { value: "call_missed",          icon: "📵", label: "Call Missed",       desc: "When a call is missed" },
];

const SectionLabel = ({ children }: { children: any }) => (
  <Typography sx={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.6, mb: 1 }}>
    {children}
  </Typography>
);

const CreateAutomationModal = ({ open, onClose, onSuccess }: any) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [channel, setChannel] = useState("");
  const [trigger, setTrigger] = useState("new_message_received");
  const [loading, setLoading] = useState(false);

  const { data: channelsData = [], isLoading: loadingChannels } = useQuery({
    queryKey: ["channels"],
    queryFn: () => channelService.getChannels(),
    enabled: open,
    select: (res: any) => res.data || [],
  });

  const selectedChannel = channelsData.find((c: any) => c._id === channel);

  const handleCreate = async () => {
    try {
      setLoading(true);
      const res = await automationService.createAutomation({
        name,
        channel_id: channel,
        channel_name: selectedChannel?.channel_name || "",
        trigger,
        nodes: [{ id: "start", type: "trigger", label: "trigger" }],
        edges: [],
      });

      const newAutomation = res.data?.data || res.data;
      queryClient.invalidateQueries({ queryKey: ["automations"] });
      onSuccess(newAutomation);

      setName("");
      setChannel("");
      setTrigger("new_message_received");

      navigate(`/automation-builder/${newAutomation._id}`);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      setName("");
      setChannel("");
      setTrigger("new_message_received");
    }
  }, [open]);

  const canCreate = !!name.trim() && !!channel && !loading;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{ sx: { borderRadius: "16px", overflow: "hidden", boxShadow: "0 24px 60px rgba(0,0,0,0.2)" } }}
      BackdropProps={{ sx: { backgroundColor: "rgba(0,0,0,0.45)" } }}
    >
      {/* ── HEADER ── */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 2.5, py: 1.75, bgcolor: "#f0fdf4", borderBottom: "1px solid #bbf7d0" }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box sx={{ width: 36, height: 36, borderRadius: "10px", bgcolor: "#fff", border: "1px solid #bbf7d0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
            🤖
          </Box>
          <Box>
            <Typography sx={{ fontSize: 15, fontWeight: 700, lineHeight: 1.2 }}>New Automation</Typography>
            <Typography variant="caption" color="text.secondary">Configure your automation flow</Typography>
          </Box>
        </Stack>
        <IconButton size="small" onClick={onClose} sx={{ color: "#9ca3af", "&:hover": { color: "#374151", bgcolor: "#f3f4f6" } }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* ── CONTENT ── */}
      <DialogContent sx={{ p: 2.5, display: "flex", flexDirection: "column", gap: 2.5 }}>

        {/* Name */}
        <Box>
          <SectionLabel>Automation Name</SectionLabel>
          <TextField
            fullWidth
            size="small"
            placeholder="e.g. Welcome Message, Order Follow-up"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e: any) => { if (e.key === "Enter" && canCreate) handleCreate(); }}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: 13 } }}
          />
        </Box>

        {/* Channel */}
        <Box>
          <SectionLabel>WhatsApp Channel</SectionLabel>
          <TextField
            select fullWidth size="small"
            value={channel}
            onChange={(e) => setChannel(e.target.value)}
            disabled={loadingChannels}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: 13 } }}
          >
            {loadingChannels && <MenuItem disabled>Loading channels…</MenuItem>}
            {!loadingChannels && channelsData.length === 0 && <MenuItem disabled>No channels found</MenuItem>}
            {channelsData.map((ch: any) => (
              <MenuItem key={ch._id} value={ch._id}>
                📱 {ch.channel_name || ch.display_phone_number}
              </MenuItem>
            ))}
          </TextField>
        </Box>

        {/* Trigger */}
        <Box>
          <SectionLabel>Trigger Event</SectionLabel>
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1 }}>
            {TRIGGERS.map((t) => {
              const active = trigger === t.value;
              return (
                <Box
                  key={t.value}
                  onClick={() => setTrigger(t.value)}
                  sx={{
                    display: "flex", alignItems: "center", gap: 1, p: 1.25, borderRadius: "10px",
                    border: "2px solid", borderColor: active ? "#25D366" : "#e5e7eb",
                    bgcolor: active ? "#f0fdf4" : "#f9fafb",
                    cursor: "pointer", transition: "all 0.15s", userSelect: "none",
                    "&:hover": { borderColor: "#25D366", bgcolor: "#f0fdf4" },
                  }}
                >
                  <Typography fontSize={20}>{t.icon}</Typography>
                  <Box>
                    <Typography fontSize={12} fontWeight={700} color={active ? "#16a34a" : "#374151"} lineHeight={1.2}>
                      {t.label}
                    </Typography>
                    <Typography fontSize={10} color="text.secondary" lineHeight={1.3}>{t.desc}</Typography>
                  </Box>
                </Box>
              );
            })}
          </Box>
        </Box>

      </DialogContent>

      {/* ── FOOTER ── */}
      <Box sx={{ px: 2.5, py: 1.75, borderTop: "1px solid #f3f4f6", display: "flex", justifyContent: "flex-end", gap: 1.5 }}>
        <Button
          variant="outlined"
          onClick={onClose}
          sx={{ borderRadius: "8px", fontWeight: 600, fontSize: 13, px: 2.5, color: "#374151", borderColor: "#e5e7eb", "&:hover": { borderColor: "#9ca3af", bgcolor: "#f9fafb" } }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleCreate}
          disabled={!canCreate}
          sx={{ borderRadius: "8px", fontWeight: 700, fontSize: 13, px: 2.5, bgcolor: "#25D366", "&:hover": { bgcolor: "#1db954" }, boxShadow: "none" }}
        >
          {loading ? "Creating…" : "Create & Open Builder →"}
        </Button>
      </Box>
    </Dialog>
  );
};

export default CreateAutomationModal;
