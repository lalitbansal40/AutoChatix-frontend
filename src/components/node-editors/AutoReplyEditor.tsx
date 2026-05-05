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
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import AddIcon from "@mui/icons-material/Add";
import { useEffect, useState } from "react";
import mediaService from "service/media.service";
import { templateService } from "service/template.service";

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

const createQuickReplyId = () =>
  `b${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`.slice(0, 20);

const AutoReplyEditor = ({ node, updateNodeData, allNodes }: any) => {
  const [messageType, setMessageType] = useState(
    node.data.type === "list" ? "list" : node.data.messageType || "text"
  );
  const [uploading, setUploading] = useState(false);
  const [cardUploading, setCardUploading] = useState<Record<string, boolean>>({});

  const data = node?.data || {};
  const buttons = data.buttons || [];
  const nodesList = allNodes || [];

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
      buttons: [...buttons, { id: createQuickReplyId(), title: "New Button", type: "quick_reply" }],
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
          rows: [{ id: `row_${Date.now()}`, title: "Option 1", description: "", nextNode: "" }],
        }],
      });
    }
  }, [messageType, node.data.sections]);

  useEffect(() => {
    if (messageType === "carousel" && (!node.data.cards || node.data.cards.length === 0)) {
      updateNodeData(node.id, {
        cards: [{ id: `card_${Date.now()}`, media: null, body: "", buttons: [] }],
      });
    }
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
          <TextField
            fullWidth multiline rows={5}
            placeholder={"Type your message…\nUse {{contact.name}} for variables"}
            value={data.message || ""}
            onChange={(e) => updateNodeData(node.id, { message: e.target.value })}
            helperText={`${(data.message || "").length} chars`}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px", fontSize: 13 } }}
          />
        </Box>
      )}

      {/* ═══════════════ BUTTON ═══════════════ */}
      {messageType === "button" && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
          <Box>
            <SectionLabel>Message Body</SectionLabel>
            <TextField
              fullWidth multiline rows={4}
              placeholder={"Type your message…\nUse {{contact.name}} for variables"}
              value={data.message || ""}
              onChange={(e) => updateNodeData(node.id, { message: e.target.value })}
              helperText={`${(data.message || "").length} chars`}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px", fontSize: 13 } }}
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
                    <TextField
                      select fullWidth size="small" label="Next Node"
                      value={btn.nextNode || ""}
                      onChange={(e) => updateBtn(i, { nextNode: e.target.value })}
                      sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: 12 } }}
                    >
                      {nodesList.map((n: any) => (
                        <MenuItem key={n.id} value={n.id}>{n.data?.label || n.id}</MenuItem>
                      ))}
                    </TextField>
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
            <TextField
              fullWidth multiline rows={3}
              placeholder="e.g. Please select an option below"
              value={data.message || ""}
              onChange={(e) => updateNodeData(node.id, { message: e.target.value })}
              helperText={`${(data.message || "").length} chars`}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px", fontSize: 13 } }}
            />
          </Box>

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

          <Divider />

          <Box>
            <SectionLabel mb={1.5}>Sections</SectionLabel>
            <Stack spacing={1.5}>
              {(data.sections || []).map((section: any, si: number) => (
                <Paper key={si} variant="outlined" sx={{ borderRadius: "10px", p: 1.5, borderColor: "#e5e7eb" }}>
                  {/* Section header */}
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                    <TextField
                      size="small" fullWidth placeholder="Section title"
                      value={section.title}
                      onChange={(e) => {
                        const updated = JSON.parse(JSON.stringify(data.sections));
                        updated[si].title = e.target.value;
                        updateNodeData(node.id, { sections: updated });
                      }}
                      sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: 12, fontWeight: 600 } }}
                    />
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

                  {/* Rows */}
                  <Stack spacing={0.75}>
                    {(section.rows || []).map((row: any, ri: number) => (
                      <Box
                        key={row.id}
                        sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 36px", gap: 1, alignItems: "center", p: 1, borderRadius: "8px", bgcolor: "#f9fafb", border: "1px solid #f3f4f6" }}
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
                        <TextField
                          select size="small" label="Next Node"
                          value={row.nextNode || ""}
                          onChange={(e) => {
                            const updated = JSON.parse(JSON.stringify(data.sections));
                            updated[si].rows[ri].nextNode = e.target.value;
                            updateNodeData(node.id, { sections: updated });
                          }}
                          sx={{ "& .MuiOutlinedInput-root": { borderRadius: "6px", fontSize: 12 } }}
                        >
                          {nodesList.map((n: any) => (
                            <MenuItem key={n.id} value={n.id}>{n.data?.label || n.id}</MenuItem>
                          ))}
                        </TextField>
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
                        updated[si].rows.push({ id: `row_${Date.now()}`, title: "New Option", description: "", nextNode: "" });
                        updateNodeData(node.id, { sections: updated });
                      }}
                      sx={{ mt: 1, fontSize: 11, color: "#374151", borderColor: "#e5e7eb", "&:hover": { borderColor: "#22c55e", color: "#16a34a", bgcolor: "#f0fdf4" } }}
                    >
                      Add Row
                    </Button>
                  )}
                </Paper>
              ))}
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
          <TextField
            fullWidth multiline rows={3}
            placeholder="e.g. Please share your delivery address 🏠"
            value={data.message || ""}
            onChange={(e) => updateNodeData(node.id, { message: e.target.value })}
            helperText={`${(data.message || "").length} chars`}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px", fontSize: 13 } }}
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
          <TextField
            fullWidth multiline rows={3}
            placeholder="e.g. Please share your current location 📍"
            value={data.message || ""}
            onChange={(e) => updateNodeData(node.id, { message: e.target.value })}
            helperText={`${(data.message || "").length} chars`}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px", fontSize: 13 } }}
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
            <TextField
              fullWidth multiline rows={3}
              placeholder={"Type the text shown above the carousel…\nExample: Choose your workspace type"}
              value={data.body || ""}
              onChange={(e) => updateNodeData(node.id, { body: e.target.value })}
              helperText={`${(data.body || "").length}/1024 chars`}
              inputProps={{ maxLength: 1024 }}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px", fontSize: 13 } }}
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
                        <TextField
                          select size="small"
                          value={btn.nextNode || ""}
                          onChange={(e) => {
                            const updated = JSON.parse(JSON.stringify(data.cards));
                            updated[ci].buttons[bi].nextNode = e.target.value;
                            updateNodeData(node.id, { cards: updated });
                          }}
                          sx={{ "& .MuiOutlinedInput-root": { borderRadius: "6px", fontSize: 12 } }}
                        >
                          {nodesList.map((n: any) => (
                            <MenuItem key={n.id} value={n.id}>{n.data?.label || n.id}</MenuItem>
                          ))}
                        </TextField>
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
                        { id: createQuickReplyId(), title: "Button", type: "quick_reply", nextNode: "" },
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
                  cards: [...(data.cards || []), { id: `card_${Date.now()}`, media: null, body: "", buttons: [] }],
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
