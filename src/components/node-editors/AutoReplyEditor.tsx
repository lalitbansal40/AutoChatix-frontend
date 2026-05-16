import {
  Box,
  TextField,
  Button,
  Typography,
  Divider,
  MenuItem,
  IconButton,
  Stack,
  Paper,
  Switch,
  FormControlLabel,
  Tooltip,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import AddIcon from "@mui/icons-material/Add";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import { useEffect, useState } from "react";
import mediaService from "service/media.service";
import { templateService } from "service/template.service";
import VariablePicker from "components/VariablePicker";

const MSG_TYPES = [
  { value: "text",     icon: "💬", label: "Text" },
  { value: "button",   icon: "🔘", label: "Button" },
  { value: "list",     icon: "📋", label: "List" },
  { value: "address",  icon: "🏠", label: "Address" },
  { value: "location", icon: "📍", label: "Location" },
  { value: "carousel", icon: "🃏", label: "Carousel" },
];

const MEDIA_TYPES = [
  { value: "image",    icon: "🖼️", label: "Image",    accept: "image/*" },
  { value: "video",    icon: "🎥", label: "Video",    accept: "video/*" },
  { value: "document", icon: "📄", label: "Document", accept: "" },
];

const SectionLabel = ({ children, mb = 1 }: { children: any; mb?: number }) => (
  <Typography sx={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.6, mb }}>
    {children}
  </Typography>
);

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const genId = (len = 16) =>
  Array.from({ length: len }, () => CHARS[Math.floor(Math.random() * CHARS.length)]).join("");

const AutoReplyEditor = ({ node, updateNodeData, allNodes }: any) => {
  const [messageType, setMessageType] = useState(
    node.data.type === "list" ? "list" : node.data.messageType || "text"
  );
  const [uploading, setUploading] = useState(false);
  const [cardUploading, setCardUploading] = useState<Record<string, boolean>>({});

  const data = node?.data || {};
  const buttons = data.buttons || [];

  const switchType = (v: string) => {
    setMessageType(v);
    updateNodeData(node.id, { messageType: v });
    if (v === "list") {
      updateNodeData(node.id, { type: "list" });
    } else if (v === "carousel") {
      updateNodeData(node.id, { type: "carousel" });
    } else if (node.data.type === "list" || node.data.type === "carousel") {
      updateNodeData(node.id, { type: "auto_reply" });
    }
  };

  const handleAddButton = () => {
    updateNodeData(node.id, {
      buttons: [...buttons, { id: genId(), title: "New Button", type: "quick_reply" }],
    });
  };

  const updateBtn = (index: number, patch: Record<string, any>) => {
    updateNodeData(node.id, {
      buttons: buttons.map((btn: any, i: number) => (i === index ? { ...btn, ...patch } : btn)),
    });
  };

  const handleFileUpload = async (e: any, type: string) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setUploading(true);
      const url = await mediaService.uploadMedia(file);
      updateNodeData(node.id, { media: { type, url, name: file.name } });
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleCardFileUpload = async (e: any, cardId: string) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setCardUploading((prev) => ({ ...prev, [cardId]: true }));
      const url = await mediaService.uploadMedia(file);
      const cards = JSON.parse(JSON.stringify(node.data.cards || []));
      const idx = cards.findIndex((c: any) => c.id === cardId);
      if (idx !== -1) cards[idx].media = { type: "image", url, name: file.name };
      updateNodeData(node.id, { cards });
    } catch (err) {
      console.error(err);
    } finally {
      setCardUploading((prev) => ({ ...prev, [cardId]: false }));
    }
  };

  useEffect(() => {
    const fetchFlows = async () => {
      try {
        const flows = await templateService.getWhatsappFlows("PUBLISHED");
        updateNodeData(node.id, { flows });
      } catch (err) {
        console.error(err);
      }
    };
    fetchFlows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (messageType === "list" && !node.data.sections) {
      updateNodeData(node.id, {
        sections: [{
          title: "Section 1",
          rows: [{ id: genId(), title: "Option 1", description: "" }],
        }],
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messageType, node.data.sections]);

  useEffect(() => {
    if (messageType === "carousel" && (!node.data.cards || node.data.cards.length === 0)) {
      updateNodeData(node.id, {
        cards: [{ id: genId(), media: null, body: "", buttons: [] }],
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messageType, node.data.cards]);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>

      {/* ─ Header ─ */}
      <Stack direction="row" spacing={1.5} alignItems="center">
        <Box sx={{ width: 38, height: 38, borderRadius: "10px", bgcolor: "#f0fdf4", border: "1px solid #bbf7d0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
          💬
        </Box>
        <Box>
          <Typography sx={{ fontSize: 15, fontWeight: 700, lineHeight: 1.2 }}>Auto Reply</Typography>
          <Typography variant="caption" color="text.secondary">Send a message when this node is reached</Typography>
        </Box>
      </Stack>

      <Divider />

      {/* ─ Message Type Tabs ─ */}
      <Box>
        <SectionLabel mb={1.25}>Message Type</SectionLabel>
        <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
          {MSG_TYPES.map((t) => {
            const active = messageType === t.value;
            return (
              <Box
                key={t.value}
                onClick={() => switchType(t.value)}
                sx={{
                  px: 1.5, py: 0.5, borderRadius: "20px", fontSize: 12, fontWeight: 600,
                  cursor: "pointer", display: "flex", alignItems: "center", gap: 0.5,
                  border: "1.5px solid",
                  borderColor: active ? "#22c55e" : "#e5e7eb",
                  bgcolor: active ? "#f0fdf4" : "#f9fafb",
                  color: active ? "#16a34a" : "#6b7280",
                  transition: "all 0.15s",
                  userSelect: "none",
                  "&:hover": { borderColor: "#22c55e", color: "#16a34a", bgcolor: "#f0fdf4" },
                }}
              >
                <span style={{ fontSize: 14 }}>{t.icon}</span>
                {t.label}
              </Box>
            );
          })}
        </Box>
      </Box>

      <Divider />

      {/* ═══════════════ TEXT ═══════════════ */}
      {messageType === "text" && (
        <Box>
          <SectionLabel>Message Body</SectionLabel>
          <VariablePicker
            value={data.message || ""}
            onChange={(val) => updateNodeData(node.id, { message: val })}
            placeholder={"Type your message…\nUse {{contact.name}} for variables"}
            rows={5}
            helperText={`${(data.message || "").length} chars`}
          />
        </Box>
      )}

      {/* ═══════════════ BUTTON ═══════════════ */}
      {messageType === "button" && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
          <Box>
            <SectionLabel>Message Body</SectionLabel>
            <VariablePicker
              value={data.message || ""}
              onChange={(val) => updateNodeData(node.id, { message: val })}
              placeholder={"Type your message…\nUse {{contact.name}} for variables"}
              rows={4}
              helperText={`${(data.message || "").length} chars`}
            />
          </Box>

          <Divider />

          <Box>
            <SectionLabel mb={1.5}>Buttons ({buttons.length}/3)</SectionLabel>
            <Stack spacing={1.5}>
              {buttons.map((btn: any, i: number) => (
                <Paper key={btn.id} variant="outlined" sx={{ borderRadius: "10px", p: 1.5, borderColor: "#e5e7eb" }}>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.25 }}>
                    <Box sx={{ px: 1, py: 0.25, borderRadius: "12px", bgcolor: "#f0fdf4", border: "1px solid #bbf7d0", fontSize: 11, fontWeight: 700, color: "#16a34a" }}>
                      Button {i + 1}
                    </Box>
                    <IconButton
                      size="small"
                      onClick={() => updateNodeData(node.id, { buttons: buttons.filter((_: any, idx: number) => idx !== i) })}
                      sx={{ color: "#ef4444", "&:hover": { bgcolor: "#fef2f2" } }}
                    >
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </Box>

                  <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, mb: 1 }}>
                    <TextField
                      size="small" placeholder="Button label"
                      value={btn.title}
                      onChange={(e) => updateBtn(i, { title: e.target.value })}
                      sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: 12 } }}
                    />
                    <TextField
                      select size="small"
                      value={btn.type || "quick_reply"}
                      onChange={(e) => updateBtn(i, { type: e.target.value })}
                      sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: 12 } }}
                    >
                      <MenuItem value="quick_reply">Quick Reply</MenuItem>
                      <MenuItem value="flow">WhatsApp Flow</MenuItem>
                      <MenuItem value="url">Open URL</MenuItem>
                      <MenuItem value="call">Call</MenuItem>
                    </TextField>
                  </Box>

                  {btn.type === "quick_reply" && (
                    <Box sx={{ px: 1, py: 0.5, borderRadius: "6px", bgcolor: "#f3f4f6", border: "1px dashed #d1d5db" }}>
                      <Typography sx={{ fontSize: 10, color: "#6b7280", mb: 0.25 }}>Handle ID (drag on canvas to connect)</Typography>
                      <Typography sx={{ fontSize: 11, fontFamily: "monospace", fontWeight: 600, color: "#374151" }}>{btn.id}</Typography>
                    </Box>
                  )}
                  {btn.type === "flow" && (
                    <TextField
                      select fullWidth size="small" label="Select Flow"
                      value={btn.flowId || ""}
                      onChange={(e) => updateBtn(i, { flowId: e.target.value })}
                      sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: 12 } }}
                    >
                      {(data.flows || []).map((f: any) => (
                        <MenuItem key={f.id} value={f.id}>{f.name}</MenuItem>
                      ))}
                    </TextField>
                  )}
                  {btn.type === "url" && (
                    <TextField
                      fullWidth size="small" placeholder="https://example.com"
                      value={btn.url || ""}
                      onChange={(e) => updateBtn(i, { url: e.target.value })}
                      sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: 12 } }}
                    />
                  )}
                  {btn.type === "call" && (
                    <TextField
                      fullWidth size="small" placeholder="+91 9999999999"
                      value={btn.phone_number || ""}
                      onChange={(e) => updateBtn(i, { phone_number: e.target.value })}
                      sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: 12 } }}
                    />
                  )}
                </Paper>
              ))}
            </Stack>

            {buttons.length < 3 && (
              <Button
                variant="outlined" startIcon={<AddIcon />} onClick={handleAddButton}
                sx={{ mt: 1.5, borderRadius: "8px", borderColor: "#e5e7eb", color: "#374151", fontSize: 12, fontWeight: 600, "&:hover": { borderColor: "#22c55e", color: "#16a34a", bgcolor: "#f0fdf4" } }}
              >
                Add Button
              </Button>
            )}
          </Box>
        </Box>
      )}

      {/* ═══════════════ LIST ═══════════════ */}
      {messageType === "list" && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
          <Box>
            <SectionLabel>Message Body</SectionLabel>
            <VariablePicker
              value={data.message || ""}
              onChange={(val) => updateNodeData(node.id, { message: val })}
              placeholder="e.g. Please select an option below"
              rows={3}
              helperText={`${(data.message || "").length} chars`}
            />
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 }}>
            <Box>
              <SectionLabel>CTA Button Label</SectionLabel>
              <TextField
                fullWidth size="small"
                placeholder="e.g. View Options"
                value={data.button_text || ""}
                onChange={(e) => updateNodeData(node.id, { button_text: e.target.value })}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px", fontSize: 13 } }}
              />
            </Box>
            <Box>
              <SectionLabel>Save selection to</SectionLabel>
              <TextField
                fullWidth size="small"
                placeholder="e.g. appointment_date"
                value={data.save_to || ""}
                onChange={(e) => updateNodeData(node.id, { save_to: e.target.value })}
                helperText="Variable name for {{…}} templates"
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px", fontSize: 13 } }}
              />
            </Box>
          </Box>

          <Divider />

          <Box>
            <SectionLabel mb={1.5}>Sections</SectionLabel>
            <Stack spacing={1.5}>
              {(data.sections || []).map((section: any, si: number) => {
                const isDynamic = !!section.dynamic?.type;
                const dynType   = section.dynamic?.type || "date";

                const updateSection = (patch: Record<string, any>) => {
                  const updated = JSON.parse(JSON.stringify(data.sections));
                  Object.assign(updated[si], patch);
                  updateNodeData(node.id, { sections: updated });
                };

                const updateDynamic = (patch: Record<string, any>) => {
                  const updated = JSON.parse(JSON.stringify(data.sections));
                  updated[si].dynamic = { ...(updated[si].dynamic || {}), ...patch };
                  updateNodeData(node.id, { sections: updated });
                };

                const toggleDynamic = (on: boolean) => {
                  const updated = JSON.parse(JSON.stringify(data.sections));
                  if (on) {
                    updated[si].dynamic = { type: "date", from_offset: 0, to_offset: 6, date_format: "EEE, DD MMM" };
                    updated[si].rows = [];
                  } else {
                    updated[si].dynamic = null;
                    if (!updated[si].rows?.length)
                      updated[si].rows = [{ id: genId(), title: "Option 1", description: "" }];
                  }
                  updateNodeData(node.id, { sections: updated });
                };

                return (
                  <Paper key={si} variant="outlined" sx={{ borderRadius: "10px", p: 1.5, borderColor: isDynamic ? "#a78bfa" : "#e5e7eb", bgcolor: isDynamic ? "#faf5ff" : "#fff" }}>
                    {/* Section header row */}
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                      <TextField
                        size="small" fullWidth placeholder="Section title"
                        value={section.title}
                        onChange={(e) => updateSection({ title: e.target.value })}
                        sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: 12, fontWeight: 600 } }}
                      />
                      <Tooltip title={isDynamic ? "Switch to static rows" : "Generate rows dynamically from date/time"}>
                        <FormControlLabel
                          control={
                            <Switch
                              size="small"
                              checked={isDynamic}
                              onChange={(e) => toggleDynamic(e.target.checked)}
                              sx={{ "& .MuiSwitch-thumb": { bgcolor: isDynamic ? "#7c3aed" : undefined } }}
                            />
                          }
                          label={<Box sx={{ display: "flex", alignItems: "center", gap: 0.4 }}><AutoAwesomeIcon sx={{ fontSize: 13, color: isDynamic ? "#7c3aed" : "#9ca3af" }} /><Typography sx={{ fontSize: 11, fontWeight: 600, color: isDynamic ? "#7c3aed" : "#9ca3af" }}>Dynamic</Typography></Box>}
                          sx={{ mr: 0, ml: 0.5, whiteSpace: "nowrap" }}
                        />
                      </Tooltip>
                      <IconButton
                        size="small"
                        onClick={() => {
                          const updated = JSON.parse(JSON.stringify(data.sections));
                          updated.splice(si, 1);
                          updateNodeData(node.id, { sections: updated });
                        }}
                        disabled={(data.sections || []).length <= 1}
                        sx={{ color: "#ef4444", "&:hover": { bgcolor: "#fef2f2" }, "&.Mui-disabled": { color: "#d1d5db" } }}
                      >
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </Box>

                    {/* ── DYNAMIC CONFIG ── */}
                    {isDynamic && (
                      <Box sx={{ bgcolor: "#f5f3ff", borderRadius: "8px", p: 1.5, border: "1px solid #ddd6fe", mb: 1 }}>
                        <Stack spacing={1.5}>
                          {/* Type picker */}
                          <TextField
                            select size="small" label="Generate rows for"
                            value={dynType}
                            onChange={(e) => {
                              const t = e.target.value;
                              const base: any = { type: t };
                              if (t === "date")    Object.assign(base, { from_offset: 0, to_offset: 6, date_format: "EEE, DD MMM" });
                              if (t === "hours")   Object.assign(base, { mode: "absolute", start_hour: 9, end_hour: 17, interval: 1, skip_past: true, date_context_key: "" });
                              if (t === "minutes") Object.assign(base, { from_offset: 0, count: 8, interval: 30, skip_past: true });
                              const updated = JSON.parse(JSON.stringify(data.sections));
                              updated[si].dynamic = base;
                              updateNodeData(node.id, { sections: updated });
                            }}
                            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: 12 } }}
                          >
                            <MenuItem value="date">📅 Date</MenuItem>
                            <MenuItem value="hours">🕐 Hours</MenuItem>
                            <MenuItem value="minutes">⏱️ Minutes</MenuItem>
                          </TextField>

                          {/* DATE options */}
                          {dynType === "date" && (
                            <>
                              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1 }}>
                                <TextField
                                  size="small" type="number" label="From (days from today)"
                                  value={section.dynamic?.from_offset ?? 0}
                                  onChange={(e) => updateDynamic({ from_offset: Number(e.target.value) })}
                                  inputProps={{ min: -30, max: 365 }}
                                  helperText={section.dynamic?.from_offset === 0 ? "0 = Today" : section.dynamic?.from_offset === 1 ? "1 = Tomorrow" : section.dynamic?.from_offset === -1 ? "-1 = Yesterday" : ""}
                                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: 12 } }}
                                />
                                <TextField
                                  size="small" type="number" label="To (days from today)"
                                  value={section.dynamic?.to_offset ?? 6}
                                  onChange={(e) => updateDynamic({ to_offset: Number(e.target.value) })}
                                  inputProps={{ min: -30, max: 365 }}
                                  helperText={`Shows ${Math.max(0, (section.dynamic?.to_offset ?? 6) - (section.dynamic?.from_offset ?? 0) + 1)} date${((section.dynamic?.to_offset ?? 6) - (section.dynamic?.from_offset ?? 0) + 1) !== 1 ? "s" : ""}`}
                                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: 12 } }}
                                />
                              </Box>
                              <TextField
                                select size="small" label="Date format"
                                value={section.dynamic?.date_format || "EEE, DD MMM"}
                                onChange={(e) => updateDynamic({ date_format: e.target.value })}
                                sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: 12 } }}
                              >
                                <MenuItem value="EEE, DD MMM">Mon, 19 May</MenuItem>
                                <MenuItem value="EEEE, DD MMM">Monday, 19 May</MenuItem>
                                <MenuItem value="DD MMM YYYY">19 May 2025</MenuItem>
                                <MenuItem value="DD/MM/YYYY">19/05/2025</MenuItem>
                                <MenuItem value="EEEE">Monday (day name only)</MenuItem>
                              </TextField>
                            </>
                          )}

                          {/* HOURS options */}
                          {dynType === "hours" && (
                            <>
                              {/* Mode selector */}
                              <TextField
                                select size="small" label="Hour mode"
                                value={section.dynamic?.mode || "absolute"}
                                onChange={(e) => {
                                  const m = e.target.value;
                                  if (m === "absolute") {
                                    updateDynamic({ mode: "absolute", start_hour: 9, end_hour: 17, from_offset: undefined, count: undefined });
                                  } else {
                                    updateDynamic({ mode: "relative", from_offset: 0, count: 8, start_hour: undefined, end_hour: undefined });
                                  }
                                }}
                                sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: 12 } }}
                              >
                                <MenuItem value="absolute">🕐 Fixed clock hours (e.g. 9 AM – 5 PM)</MenuItem>
                                <MenuItem value="relative">⏩ Relative to now (e.g. next 8 hours)</MenuItem>
                              </TextField>

                              {/* Absolute mode fields */}
                              {(section.dynamic?.mode === "absolute" || (!section.dynamic?.mode && section.dynamic?.start_hour !== undefined)) && (
                                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 1 }}>
                                  <TextField
                                    size="small" type="number" label="Start hour (0–23)"
                                    value={section.dynamic?.start_hour ?? 9}
                                    onChange={(e) => updateDynamic({ start_hour: Number(e.target.value) })}
                                    inputProps={{ min: 0, max: 23 }}
                                    helperText={`${section.dynamic?.start_hour ?? 9}:00`}
                                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: 12 } }}
                                  />
                                  <TextField
                                    size="small" type="number" label="End hour (0–23)"
                                    value={section.dynamic?.end_hour ?? 17}
                                    onChange={(e) => updateDynamic({ end_hour: Number(e.target.value) })}
                                    inputProps={{ min: 0, max: 23 }}
                                    helperText={`${section.dynamic?.end_hour ?? 17}:00`}
                                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: 12 } }}
                                  />
                                  <TextField
                                    select size="small" label="Interval"
                                    value={section.dynamic?.interval ?? 1}
                                    onChange={(e) => updateDynamic({ interval: Number(e.target.value) })}
                                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: 12 } }}
                                  >
                                    <MenuItem value={1}>Every 1 hr</MenuItem>
                                    <MenuItem value={2}>Every 2 hrs</MenuItem>
                                    <MenuItem value={3}>Every 3 hrs</MenuItem>
                                    <MenuItem value={4}>Every 4 hrs</MenuItem>
                                  </TextField>
                                </Box>
                              )}

                              {/* Relative mode fields */}
                              {section.dynamic?.mode === "relative" && (
                                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 1 }}>
                                  <TextField
                                    size="small" type="number" label="Start (hrs from now)"
                                    value={section.dynamic?.from_offset ?? 0}
                                    onChange={(e) => updateDynamic({ from_offset: Number(e.target.value) })}
                                    inputProps={{ min: 0, max: 24 }}
                                    helperText="0 = current hour"
                                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: 12 } }}
                                  />
                                  <TextField
                                    size="small" type="number" label="No. of slots"
                                    value={section.dynamic?.count ?? 8}
                                    onChange={(e) => updateDynamic({ count: Number(e.target.value) })}
                                    inputProps={{ min: 1, max: 24 }}
                                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: 12 } }}
                                  />
                                  <TextField
                                    select size="small" label="Interval"
                                    value={section.dynamic?.interval ?? 1}
                                    onChange={(e) => updateDynamic({ interval: Number(e.target.value) })}
                                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: 12 } }}
                                  >
                                    <MenuItem value={1}>Every 1 hr</MenuItem>
                                    <MenuItem value={2}>Every 2 hrs</MenuItem>
                                    <MenuItem value={3}>Every 3 hrs</MenuItem>
                                    <MenuItem value={4}>Every 4 hrs</MenuItem>
                                  </TextField>
                                </Box>
                              )}

                              {/* date_context_key — shown for both modes */}
                              {(() => {
                                const saveToKeys = (allNodes || [])
                                  .filter((n: any) => n.id !== node.id && n.data?.save_to)
                                  .map((n: any) => n.data.save_to as string)
                                  .filter((v: string, i: number, arr: string[]) => arr.indexOf(v) === i);
                                return (
                                  <TextField
                                    select size="small" label="Date context (optional)"
                                    value={section.dynamic?.date_context_key || ""}
                                    onChange={(e) => updateDynamic({ date_context_key: e.target.value || undefined })}
                                    helperText="If set: skip past slots only when user picked today"
                                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: 12 } }}
                                  >
                                    <MenuItem value="">(none — always apply skip_past)</MenuItem>
                                    {saveToKeys.map((key: string) => (
                                      <MenuItem key={key} value={key}>{key}</MenuItem>
                                    ))}
                                  </TextField>
                                );
                              })()}

                              <FormControlLabel
                                control={<Switch size="small" checked={section.dynamic?.skip_past !== false} onChange={(e) => updateDynamic({ skip_past: e.target.checked })} />}
                                label={<Typography sx={{ fontSize: 11, color: "#374151" }}>Skip past time slots</Typography>}
                              />
                            </>
                          )}

                          {/* MINUTES options */}
                          {dynType === "minutes" && (
                            <>
                              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 1 }}>
                                <TextField
                                  size="small" type="number" label="Start (mins from now)"
                                  value={section.dynamic?.from_offset ?? 0}
                                  onChange={(e) => updateDynamic({ from_offset: Number(e.target.value) })}
                                  inputProps={{ min: 0, max: 120 }}
                                  helperText="0 = right now"
                                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: 12 } }}
                                />
                                <TextField
                                  size="small" type="number" label="No. of slots"
                                  value={section.dynamic?.count ?? 8}
                                  onChange={(e) => updateDynamic({ count: Number(e.target.value) })}
                                  inputProps={{ min: 1, max: 48 }}
                                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: 12 } }}
                                />
                                <TextField
                                  select size="small" label="Interval"
                                  value={section.dynamic?.interval ?? 30}
                                  onChange={(e) => updateDynamic({ interval: Number(e.target.value) })}
                                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: 12 } }}
                                >
                                  <MenuItem value={15}>Every 15 min</MenuItem>
                                  <MenuItem value={30}>Every 30 min</MenuItem>
                                  <MenuItem value={45}>Every 45 min</MenuItem>
                                  <MenuItem value={60}>Every 60 min</MenuItem>
                                </TextField>
                              </Box>
                              <FormControlLabel
                                control={<Switch size="small" checked={section.dynamic?.skip_past !== false} onChange={(e) => updateDynamic({ skip_past: e.target.checked })} />}
                                label={<Typography sx={{ fontSize: 11, color: "#374151" }}>Skip past time slots</Typography>}
                              />
                            </>
                          )}

                          {/* Preview hint */}
                          <Box sx={{ px: 1.25, py: 0.75, borderRadius: "6px", bgcolor: "#ede9fe", border: "1px solid #ddd6fe" }}>
                            <Typography sx={{ fontSize: 10.5, color: "#5b21b6", lineHeight: 1.6 }}>
                              ✨ Rows are generated <strong>live</strong> when the message is sent — based on the date/time at that moment.
                            </Typography>
                          </Box>
                        </Stack>
                      </Box>
                    )}

                    {/* ── STATIC ROWS ── */}
                    {!isDynamic && (
                      <>
                        <Stack spacing={0.75}>
                          {(section.rows || []).map((row: any, ri: number) => (
                            <Box
                              key={row.id}
                              sx={{ display: "grid", gridTemplateColumns: "1fr 1fr auto 36px", gap: 1, alignItems: "center", p: 1, borderRadius: "8px", bgcolor: "#f9fafb", border: "1px solid #f3f4f6" }}
                            >
                              <TextField
                                size="small" placeholder="Title"
                                value={row.title}
                                onChange={(e) => {
                                  const updated = JSON.parse(JSON.stringify(data.sections));
                                  updated[si].rows[ri].title = e.target.value;
                                  updateNodeData(node.id, { sections: updated });
                                }}
                                sx={{ "& .MuiOutlinedInput-root": { borderRadius: "6px", fontSize: 12 } }}
                              />
                              <TextField
                                size="small" placeholder="Description (opt.)"
                                value={row.description || ""}
                                onChange={(e) => {
                                  const updated = JSON.parse(JSON.stringify(data.sections));
                                  updated[si].rows[ri].description = e.target.value;
                                  updateNodeData(node.id, { sections: updated });
                                }}
                                sx={{ "& .MuiOutlinedInput-root": { borderRadius: "6px", fontSize: 12 } }}
                              />
                              <Box sx={{ px: 1, py: 0.5, borderRadius: "6px", bgcolor: "#f3f4f6", border: "1px dashed #d1d5db", minWidth: 0 }}>
                                <Typography sx={{ fontSize: 9, color: "#6b7280" }}>ID</Typography>
                                <Typography sx={{ fontSize: 10, fontFamily: "monospace", fontWeight: 600, color: "#374151" }} noWrap>{row.id}</Typography>
                              </Box>
                              <IconButton
                                size="small"
                                onClick={() => {
                                  const updated = JSON.parse(JSON.stringify(data.sections));
                                  updated[si].rows.splice(ri, 1);
                                  updateNodeData(node.id, { sections: updated });
                                }}
                                disabled={(section.rows || []).length <= 1}
                                sx={{ color: "#ef4444", "&:hover": { bgcolor: "#fef2f2" }, "&.Mui-disabled": { color: "#d1d5db" } }}
                              >
                                <DeleteOutlineIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          ))}
                        </Stack>

                        {(section.rows || []).length < 10 && (
                          <Button
                            size="small" startIcon={<AddIcon />} variant="outlined"
                            onClick={() => {
                              const updated = JSON.parse(JSON.stringify(data.sections));
                              updated[si].rows.push({ id: genId(), title: "New Option", description: "" });
                              updateNodeData(node.id, { sections: updated });
                            }}
                            sx={{ mt: 1, fontSize: 11, color: "#374151", borderColor: "#e5e7eb", "&:hover": { borderColor: "#22c55e", color: "#16a34a", bgcolor: "#f0fdf4" } }}
                          >
                            Add Row
                          </Button>
                        )}
                      </>
                    )}
                  </Paper>
                );
              })}
            </Stack>

            <Button
              variant="outlined" startIcon={<AddIcon />}
              onClick={() => {
                const updated = data.sections || [];
                updateNodeData(node.id, {
                  sections: [...updated, {
                    title: "New Section",
                    rows: [{ id: `row_${Date.now()}`, title: "Option 1", description: "", nextNode: "" }],
                  }],
                });
              }}
              sx={{ mt: 1.5, borderRadius: "8px", borderColor: "#e5e7eb", color: "#374151", fontSize: 12, fontWeight: 600, "&:hover": { borderColor: "#22c55e", color: "#16a34a", bgcolor: "#f0fdf4" } }}
            >
              Add Section
            </Button>
          </Box>
        </Box>
      )}

      {/* ═══════════════ ADDRESS ═══════════════ */}
      {messageType === "address" && (
        <Box>
          <SectionLabel>Message</SectionLabel>
          <VariablePicker
            value={data.message || ""}
            onChange={(val) => updateNodeData(node.id, { message: val })}
            placeholder="e.g. Please share your delivery address 🏠"
            rows={3}
            helperText={`${(data.message || "").length} chars`}
          />
          <Box sx={{ mt: 1.5, p: 1.5, borderRadius: "10px", bgcolor: "#eff6ff", border: "1px solid #bfdbfe" }}>
            <Typography sx={{ fontSize: 11, color: "#1e40af", lineHeight: 1.6 }}>
              💡 The contact will be prompted to share their address using WhatsApp's native address collection UI.
            </Typography>
          </Box>
        </Box>
      )}

      {/* ═══════════════ LOCATION ═══════════════ */}
      {messageType === "location" && (
        <Box>
          <SectionLabel>Message</SectionLabel>
          <VariablePicker
            value={data.message || ""}
            onChange={(val) => updateNodeData(node.id, { message: val })}
            placeholder="e.g. Please share your current location 📍"
            rows={3}
            helperText={`${(data.message || "").length} chars`}
          />
          <Box sx={{ mt: 1.5, p: 1.5, borderRadius: "10px", bgcolor: "#eff6ff", border: "1px solid #bfdbfe" }}>
            <Typography sx={{ fontSize: 11, color: "#1e40af", lineHeight: 1.6 }}>
              💡 The contact will be prompted to share their location using WhatsApp's location picker.
            </Typography>
          </Box>
        </Box>
      )}

      {/* ═══════════════ CAROUSEL ═══════════════ */}
      {messageType === "carousel" && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Box>
            <SectionLabel>Main Message</SectionLabel>
            <VariablePicker
              value={data.body || ""}
              onChange={(val) => updateNodeData(node.id, { body: val })}
              placeholder={"Type the text shown above the carousel…\nExample: Choose your workspace type"}
              rows={3}
              helperText={`${(data.body || "").length}/1024 chars`}
            />
          </Box>

          <Box>
          <SectionLabel mb={1.5}>Cards ({(data.cards || []).length}/10)</SectionLabel>
          <Stack spacing={1.5}>
            {(data.cards || []).map((card: any, ci: number) => (
              <Paper key={card.id} variant="outlined" sx={{ borderRadius: "10px", p: 1.5, borderColor: "#e5e7eb" }}>
                {/* Card header */}
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.25 }}>
                  <Box sx={{ px: 1, py: 0.25, borderRadius: "12px", bgcolor: "#f0fdf4", border: "1px solid #bbf7d0", fontSize: 11, fontWeight: 700, color: "#16a34a" }}>
                    Card {ci + 1}
                  </Box>
                  <IconButton
                    size="small"
                    onClick={() => {
                      const updated = JSON.parse(JSON.stringify(data.cards));
                      updated.splice(ci, 1);
                      updateNodeData(node.id, { cards: updated });
                    }}
                    disabled={(data.cards || []).length <= 1}
                    sx={{ color: "#ef4444", "&:hover": { bgcolor: "#fef2f2" }, "&.Mui-disabled": { color: "#d1d5db" } }}
                  >
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </Box>

                {/* Image upload */}
                <Button
                  variant="outlined" component="label" size="small" fullWidth
                  disabled={!!cardUploading[card.id]}
                  sx={{
                    mb: 1.5, borderRadius: "8px", borderStyle: "dashed",
                    borderColor: card.media?.name ? "#22c55e" : "#d1d5db",
                    color: card.media?.name ? "#16a34a" : "#6b7280",
                    bgcolor: card.media?.name ? "#f0fdf4" : "#fafafa",
                    fontSize: 12, fontWeight: 500,
                    "&:hover": { borderColor: "#22c55e", bgcolor: "#f0fdf4", color: "#16a34a" },
                  }}
                >
                  {cardUploading[card.id] ? "⏳ Uploading…" : card.media?.name ? `🖼️ ${card.media.name}` : "🖼️ Upload Card Image"}
                  <input hidden type="file" accept="image/*" onChange={(e) => handleCardFileUpload(e, card.id)} />
                </Button>

                {/* Body */}
                <TextField
                  fullWidth multiline rows={2}
                  placeholder="Card description…"
                  value={card.body || ""}
                  onChange={(e) => {
                    const updated = JSON.parse(JSON.stringify(data.cards));
                    updated[ci].body = e.target.value;
                    updateNodeData(node.id, { cards: updated });
                  }}
                  sx={{ mb: 1.5, "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: 12 } }}
                />

                {/* Card buttons */}
                <Stack spacing={0.75}>
                  {(card.buttons || []).map((btn: any, bi: number) => (
                    <Box
                      key={btn.id}
                      sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 36px", gap: 1, alignItems: "center" }}
                    >
                      <TextField
                        size="small" placeholder="Label"
                        value={btn.title || ""}
                        onChange={(e) => {
                          const updated = JSON.parse(JSON.stringify(data.cards));
                          updated[ci].buttons[bi].title = e.target.value;
                          updateNodeData(node.id, { cards: updated });
                        }}
                        sx={{ "& .MuiOutlinedInput-root": { borderRadius: "6px", fontSize: 12 } }}
                      />
                      <TextField
                        select size="small"
                        value={btn.type || "quick_reply"}
                        onChange={(e) => {
                          const updated = JSON.parse(JSON.stringify(data.cards));
                          updated[ci].buttons[bi].type = e.target.value;
                          updateNodeData(node.id, { cards: updated });
                        }}
                        sx={{ "& .MuiOutlinedInput-root": { borderRadius: "6px", fontSize: 12 } }}
                      >
                        <MenuItem value="quick_reply">Quick Reply</MenuItem>
                        <MenuItem value="url">URL</MenuItem>
                      </TextField>
                      {btn.type === "quick_reply" ? (
                        <Box sx={{ px: 1, py: 0.5, borderRadius: "6px", bgcolor: "#f3f4f6", border: "1px dashed #d1d5db" }}>
                          <Typography sx={{ fontSize: 9, color: "#6b7280" }}>ID</Typography>
                          <Typography sx={{ fontSize: 10, fontFamily: "monospace", fontWeight: 600, color: "#374151" }} noWrap>{btn.id}</Typography>
                        </Box>
                      ) : (
                        <TextField
                          size="small" placeholder="https://…"
                          value={btn.url || ""}
                          onChange={(e) => {
                            const updated = JSON.parse(JSON.stringify(data.cards));
                            updated[ci].buttons[bi].url = e.target.value;
                            updateNodeData(node.id, { cards: updated });
                          }}
                          sx={{ "& .MuiOutlinedInput-root": { borderRadius: "6px", fontSize: 12 } }}
                        />
                      )}
                      <IconButton
                        size="small"
                        onClick={() => {
                          const updated = JSON.parse(JSON.stringify(data.cards));
                          updated[ci].buttons.splice(bi, 1);
                          updateNodeData(node.id, { cards: updated });
                        }}
                        sx={{ color: "#ef4444", "&:hover": { bgcolor: "#fef2f2" } }}
                      >
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ))}
                </Stack>

                {(card.buttons || []).length < 2 && (
                  <Button
                    size="small" startIcon={<AddIcon />} variant="outlined"
                    onClick={() => {
                      const updated = JSON.parse(JSON.stringify(data.cards));
                      updated[ci].buttons = [
                        ...(updated[ci].buttons || []),
                        { id: genId(), title: "Button", type: "quick_reply" },
                      ];
                      updateNodeData(node.id, { cards: updated });
                    }}
                    sx={{ mt: 1, fontSize: 11, color: "#374151", borderColor: "#e5e7eb", "&:hover": { borderColor: "#22c55e", color: "#16a34a", bgcolor: "#f0fdf4" } }}
                  >
                    Add Button
                  </Button>
                )}
              </Paper>
            ))}
          </Stack>

          {(data.cards || []).length < 10 && (
            <Button
              variant="outlined" startIcon={<AddIcon />}
              onClick={() => {
                updateNodeData(node.id, {
                  cards: [...(data.cards || []), { id: genId(), media: null, body: "", buttons: [] }],
                });
              }}
              sx={{ mt: 1.5, borderRadius: "8px", borderColor: "#e5e7eb", color: "#374151", fontSize: 12, fontWeight: 600, "&:hover": { borderColor: "#22c55e", color: "#16a34a", bgcolor: "#f0fdf4" } }}
            >
              Add Card
            </Button>
          )}
          </Box>
        </Box>
      )}

      {/* ═══════════════ MEDIA (non-carousel only) ═══════════════ */}
      {messageType !== "carousel" && (
        <>
          <Divider />
          <Box>
            <SectionLabel mb={1.25}>Attachment (optional)</SectionLabel>
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              {MEDIA_TYPES.map((mt) => (
                <Button
                  key={mt.value}
                  variant="outlined"
                  component="label"
                  size="small"
                  disabled={uploading}
                  sx={{
                    borderRadius: "8px", borderStyle: "dashed",
                    borderColor: data.media?.type === mt.value ? "#22c55e" : "#d1d5db",
                    color: data.media?.type === mt.value ? "#16a34a" : "#6b7280",
                    bgcolor: data.media?.type === mt.value ? "#f0fdf4" : "#fafafa",
                    fontSize: 12, fontWeight: 500, px: 1.5,
                    "&:hover": { borderColor: "#22c55e", bgcolor: "#f0fdf4", color: "#16a34a" },
                  }}
                >
                  {mt.icon} {mt.label}
                  <input hidden type="file" {...(mt.accept ? { accept: mt.accept } : {})} onChange={(e) => handleFileUpload(e, mt.value)} />
                </Button>
              ))}
            </Box>

            {data.media?.name && (
              <Box sx={{ mt: 1.25, px: 1.5, py: 0.75, borderRadius: "8px", bgcolor: "#f0fdf4", border: "1px solid #bbf7d0", display: "inline-flex", alignItems: "center", gap: 1 }}>
                <Typography sx={{ fontSize: 12, color: "#16a34a", fontWeight: 500 }}>
                  📎 {data.media.name}
                </Typography>
                <IconButton
                  size="small"
                  onClick={() => updateNodeData(node.id, { media: null })}
                  sx={{ p: 0.25, color: "#ef4444", "&:hover": { bgcolor: "transparent" } }}
                >
                  <DeleteOutlineIcon sx={{ fontSize: 14 }} />
                </IconButton>
              </Box>
            )}
          </Box>
        </>
      )}

    </Box>
  );
};

export default AutoReplyEditor;
