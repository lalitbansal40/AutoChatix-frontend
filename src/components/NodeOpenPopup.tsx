import {
  Dialog,
  DialogContent,
  IconButton,
  Box,
  Grid,
  Button,
  Typography,
  TextField,
  Stack,
  Chip
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import SaveIcon from "@mui/icons-material/Save";
import { NODE_EDITORS } from "./node-editors";
import { useState } from "react";

/* ── same style map as AutomationBuilder ── */
const NODE_STYLE: Record<string, { color: string; bg: string; icon: string; label: string }> = {
  trigger:               { color: "#f97316", bg: "#fff7ed", icon: "⚡", label: "Trigger" },
  auto_reply:            { color: "#25D366", bg: "#f0fdf4", icon: "💬", label: "Auto Reply" },
  list:                  { color: "#2563eb", bg: "#eff6ff", icon: "📋", label: "List" },
  carousel:              { color: "#ec4899", bg: "#fdf2f8", icon: "🎠", label: "Carousel" },
  ask_input:             { color: "#8b5cf6", bg: "#f5f3ff", icon: "✏️", label: "Ask Input" },
  ask_location:          { color: "#0ea5e9", bg: "#f0f9ff", icon: "📍", label: "Ask Location" },
  address_message:       { color: "#0ea5e9", bg: "#f0f9ff", icon: "🏠", label: "Address" },
  set_contact_attribute: { color: "#f59e0b", bg: "#fffbeb", icon: "🏷️", label: "Set Attribute" },
  google_sheet:          { color: "#16a34a", bg: "#f0fdf4", icon: "📊", label: "Google Sheets" },
  razorpay_payment:      { color: "#2563eb", bg: "#eff6ff", icon: "💳", label: "Razorpay" },
  borzo_delivery:        { color: "#dc2626", bg: "#fef2f2", icon: "🚚", label: "Borzo" },
  distance_check:        { color: "#6366f1", bg: "#eef2ff", icon: "📏", label: "Distance" },
  integration_action:    { color: "#0891b2", bg: "#ecfeff", icon: "🔌", label: "Integration" },
};
const DEFAULT_STYLE = { color: "#6b7280", bg: "#f9fafb", icon: "⚙️", label: "Node" };

/* ── constants ── */
const WA_BG   = "#ece5dd";
const WA_BUBBLE = "#dcf8c6";
const WA_GREEN  = "#075e54";

/* shared WA-style button row */
const WaBtn = ({ label, icon = "" }: { label: string; icon?: string }) => (
  <Box sx={{
    mt: "1px", py: 0.7, bgcolor: "#fff",
    borderTop: "1px solid #e5e7eb",
    textAlign: "center",
    cursor: "pointer",
    "&:hover": { bgcolor: "#f0fdf4" },
  }}>
    <Typography fontSize={12.5} color="#0891b2" fontWeight={500}>{icon}{label}</Typography>
  </Box>
);

/* ── Carousel strip (used inside phone frame) ── */
const CarouselStrip = ({ cards }: { cards: any[] }) => (
  <Box sx={{ mt: 1.5 }}>
    {cards.length === 0 ? (
      <Box sx={{ bgcolor: WA_BUBBLE, borderRadius: 2, p: 2, display: "inline-block" }}>
        <Typography fontSize={11} color="text.secondary">No cards added yet</Typography>
      </Box>
    ) : (
      <Box sx={{ display: "flex", gap: 1, overflowX: "auto", pb: 1,
        /* hide scrollbar visually but keep scroll */
        "&::-webkit-scrollbar": { height: 3 },
        "&::-webkit-scrollbar-thumb": { bgcolor: "#ccc", borderRadius: 4 },
      }}>
        {cards.map((card: any, i: number) => (
          <Box
            key={i}
            sx={{
              flexShrink: 0,
              width: 180,
              bgcolor: "#fff",
              borderRadius: "12px",
              overflow: "hidden",
              boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
              border: "1px solid #e5e7eb",
            }}
          >
            {/* card image */}
            {card.media?.url ? (
              <Box
                component="img"
                src={card.media.url}
                alt=""
                sx={{ width: "100%", height: 110, objectFit: "cover", display: "block" }}
              />
            ) : (
              <Box sx={{
                width: "100%", height: 100,
                bgcolor: "#f3f4f6",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Typography fontSize={28}>🖼️</Typography>
              </Box>
            )}

            {/* card body */}
            <Box sx={{ px: 1.25, pt: 1, pb: 0.5 }}>
              {card.body ? (
                <Typography fontSize={11.5} color="#111827" lineHeight={1.5} sx={{
                  display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden",
                }}>
                  {card.body}
                </Typography>
              ) : (
                <Typography fontSize={11} color="#9ca3af" fontStyle="italic">No body text</Typography>
              )}
            </Box>

            {/* card buttons */}
            {(card.buttons || []).length > 0 && (
              <Box sx={{ borderTop: "1px solid #f3f4f6", mt: 0.5 }}>
                {(card.buttons || []).map((btn: any, bi: number) => (
                  <Box key={bi} sx={{
                    py: 0.7, borderTop: bi > 0 ? "1px solid #f3f4f6" : "none",
                    textAlign: "center",
                  }}>
                    <Typography fontSize={12} color="#0891b2" fontWeight={600}>
                      {btn.type === "url" ? "🔗 " : "↩ "}{btn.title || "Button"}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        ))}
      </Box>
    )}
  </Box>
);

/* ── List bottom sheet ── */
const ListSheet = ({ data, open, onClose }: { data: any; open: boolean; onClose: () => void }) => (
  <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs"
    PaperProps={{ sx: { borderRadius: "20px 20px 0 0", position: "absolute", bottom: 0, m: 0, maxHeight: "70%" } }}
  >
    <Box sx={{ bgcolor: WA_GREEN, px: 2.5, py: 1.5, borderRadius: "20px 20px 0 0" }}>
      <Typography fontWeight={600} color="#fff" fontSize={14}>
        {data.button_text || data.cta || "Options"}
      </Typography>
    </Box>
    <DialogContent sx={{ p: 0 }}>
      {(data.sections || []).map((section: any, si: number) => (
        <Box key={si}>
          {section.title && (
            <Typography sx={{ px: 2, py: 0.75, fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5, bgcolor: "#f9fafb" }}>
              {section.title}
            </Typography>
          )}
          {(section.rows || []).map((row: any) => (
            <Box
              key={row.id}
              sx={{ px: 2, py: 1.25, borderBottom: "1px solid #f3f4f6", cursor: "pointer", "&:hover": { bgcolor: "#f0fdf4" } }}
              onClick={onClose}
            >
              <Typography fontSize={13} fontWeight={500} color="#111827">{row.title}</Typography>
              {row.description && <Typography fontSize={11} color="#6b7280">{row.description}</Typography>}
            </Box>
          ))}
        </Box>
      ))}
    </DialogContent>
  </Dialog>
);

/* ════════════════════════════════════════════
   WAPreview  —  phone-frame wrapper for all types
════════════════════════════════════════════ */
const WAPreview = ({ data }: { data: any }) => {
  const [openList, setOpenList] = useState(false);

  const msgType    = data.messageType || data.type;
  const isCarousel = msgType === "carousel";
  const isList     = msgType === "list" || data.type === "list";
  const isAskInput = data.type === "ask_input" || data.type === "ask_location";
  const isAddress  = data.type === "address_message";
  const hasButtons = Array.isArray(data.buttons) && data.buttons.length > 0;
  const hasMedia   = !!data.media?.url;

  /* ── Google Sheet  → spreadsheet table ── */
  if (data.type === "google_sheet") {
    const entries = Object.entries(data.map || {});
    return (
      <Box sx={{ height: "100%", display: "flex", flexDirection: "column", gap: 1.5 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography fontSize={13} fontWeight={700} color="#166534">📊 Spreadsheet Preview</Typography>
          {data.sheet_name && <Chip label={data.sheet_name} size="small" color="success" variant="outlined" sx={{ fontSize: 10 }} />}
          {data.action && <Chip label={data.action} size="small" sx={{ fontSize: 10, bgcolor: "#f0fdf4", color: "#166534", textTransform: "capitalize" }} />}
        </Stack>

        <Box sx={{ flex: 1, overflow: "auto", borderRadius: 2, border: "1px solid #bbf7d0", bgcolor: "#fff" }}>
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", bgcolor: "#16a34a", position: "sticky", top: 0 }}>
            {["Sheet Column", "Value / Variable"].map((h) => (
              <Typography key={h} sx={{ px: 1.5, py: 0.75, fontSize: 11, fontWeight: 700, color: "#fff" }}>{h}</Typography>
            ))}
          </Box>
          {entries.length === 0 ? (
            <Box sx={{ p: 4, textAlign: "center" }}>
              <Typography fontSize={20} mb={1}>📋</Typography>
              <Typography fontSize={12} color="text.secondary">No columns mapped yet</Typography>
            </Box>
          ) : entries.map(([col, val], i) => (
            <Box key={i} sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderBottom: "1px solid #f0fdf4", bgcolor: i % 2 === 0 ? "#fff" : "#f0fdf4" }}>
              <Typography sx={{ px: 1.5, py: 0.75, fontSize: 11, fontWeight: 600, color: "#166534" }}>{col}</Typography>
              <Typography sx={{ px: 1.5, py: 0.75, fontSize: 11, color: "#374151", fontFamily: "monospace" }}>{String(val)}</Typography>
            </Box>
          ))}
        </Box>
      </Box>
    );
  }

  /* ── Set Contact Attribute → key→value pills ── */
  if (data.type === "set_contact_attribute") {
    const keys: string[] = Array.isArray(data.attribute_name) ? data.attribute_name : data.attribute_name ? [data.attribute_name] : [];
    const vals: string[] = Array.isArray(data.attribute_value) ? data.attribute_value : data.attribute_value ? [data.attribute_value] : [];
    return (
      <Box sx={{ height: "100%", display: "flex", flexDirection: "column", gap: 1.5 }}>
        <Typography fontSize={13} fontWeight={700} color="#92400e">🏷️ Attribute Updates</Typography>
        <Box sx={{ flex: 1, overflow: "auto" }}>
          {keys.length === 0 ? (
            <Box sx={{ p: 4, textAlign: "center" }}>
              <Typography fontSize={20} mb={1}>🏷️</Typography>
              <Typography fontSize={12} color="text.secondary">No attributes configured</Typography>
            </Box>
          ) : keys.map((k, i) => (
            <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 1, p: 1.25, mb: 0.75, bgcolor: "#fffbeb", border: "1px solid #fde68a", borderRadius: 2 }}>
              <Box sx={{ flex: 1, display: "flex", alignItems: "center", gap: 1 }}>
                <Chip label={k || "?"} size="small" sx={{ bgcolor: "#fef3c7", color: "#92400e", fontWeight: 700, fontFamily: "monospace", fontSize: 11 }} />
                <Typography fontSize={13} color="#6b7280">←</Typography>
                <Typography fontSize={12} fontFamily="monospace" color="#374151">{vals[i] || "?"}</Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    );
  }

  /* ── Phone frame for all WA message types ── */
  return (
    <Box sx={{
      height: "100%",
      display: "flex",
      flexDirection: "column",
      bgcolor: "#1a1a2e",
      borderRadius: "24px",
      overflow: "hidden",
      boxShadow: "inset 0 0 0 6px #111",
    }}>
      {/* status bar */}
      <Box sx={{ bgcolor: "#1a1a2e", px: 2, pt: 0.75, pb: 0.25, display: "flex", justifyContent: "space-between" }}>
        <Typography fontSize={9} color="#ffffff88">9:41</Typography>
        <Typography fontSize={9} color="#ffffff88">▐▐▐ WiFi ■</Typography>
      </Box>

      {/* WA header */}
      <Box sx={{ bgcolor: WA_GREEN, px: 1.75, py: 1, display: "flex", alignItems: "center", gap: 1.25 }}>
        <Box sx={{ width: 34, height: 34, borderRadius: "50%", bgcolor: "#128c7e", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>
          🤖
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography fontSize={13} fontWeight={700} color="#fff" lineHeight={1.2}>Bot</Typography>
          <Typography fontSize={10} color="#a7f3d0">online</Typography>
        </Box>
        <Typography fontSize={18} color="#ffffff88">⋮</Typography>
      </Box>

      {/* chat area */}
      <Box sx={{ flex: 1, overflowY: "auto", overflowX: "hidden", bgcolor: WA_BG, p: 1.25,
        "&::-webkit-scrollbar": { width: 3 },
        "&::-webkit-scrollbar-thumb": { bgcolor: "#ccc", borderRadius: 4 },
      }}>

        {/* ─ main bubble ─ */}
        {!isCarousel && (
          <Box sx={{ maxWidth: "88%", mb: 1 }}>
            <Box sx={{
              bgcolor: WA_BUBBLE,
              borderRadius: "0 10px 10px 10px",
              overflow: "hidden",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }}>
              {/* media */}
              {hasMedia && (
                <Box sx={{ bgcolor: "#000" }}>
                  {data.media.type === "image" && (
                    <Box component="img" src={data.media.url} alt="" sx={{ width: "100%", maxHeight: 180, objectFit: "cover", display: "block" }} />
                  )}
                  {data.media.type === "video" && (
                    <Box component="video" src={data.media.url} controls sx={{ width: "100%", maxHeight: 180, display: "block" }} />
                  )}
                  {data.media.type === "document" && (
                    <Box sx={{ p: 1.5, display: "flex", gap: 1, alignItems: "center", bgcolor: "#f3f4f6" }}>
                      <Typography>📄</Typography>
                      <Typography fontSize={11}>{data.media.name || "Document"}</Typography>
                    </Box>
                  )}
                </Box>
              )}

              {/* text body */}
              <Box sx={{ px: 1.25, pt: hasMedia ? 0.75 : 1.25, pb: 0.5 }}>
                {data.message ? (
                  <Typography sx={{ fontSize: 13, color: "#111827", whiteSpace: "pre-line", lineHeight: 1.6 }}>
                    {data.message}
                  </Typography>
                ) : (
                  <Typography sx={{ fontSize: 12, color: "#9ca3af", fontStyle: "italic" }}>
                    {isAddress ? "📦 Please share your delivery address" : "Message preview will appear here…"}
                  </Typography>
                )}

                {isAskInput && (
                  <TextField
                    placeholder="User will type here…"
                    size="small"
                    fullWidth
                    disabled
                    sx={{ mt: 1, "& .MuiOutlinedInput-root": { borderRadius: 2, bgcolor: "#fff", fontSize: 11 } }}
                  />
                )}

                <Typography sx={{ display: "block", textAlign: "right", fontSize: 9.5, color: "#6b7280", mt: 0.5 }}>
                  12:45 PM ✓✓
                </Typography>
              </Box>

              {/* inline buttons (separated by thin line, WA style) */}
              {hasButtons && (
                <Box sx={{ borderTop: "1px solid #d1fae5" }}>
                  {(data.buttons || []).map((btn: any) => (
                    <WaBtn
                      key={btn.id}
                      label={btn.title || "Button"}
                      icon={btn.type === "call" ? "📞 " : btn.type === "url" ? "🔗 " : ""}
                    />
                  ))}
                </Box>
              )}

              {/* list CTA button */}
              {isList && (
                <Box sx={{ borderTop: "1px solid #d1fae5" }}>
                  <WaBtn label={data.button_text || data.cta || "View Options"} icon="☰ " />
                </Box>
              )}
            </Box>

            {/* tap to open list */}
            {isList && (
              <Box
                onClick={() => setOpenList(true)}
                sx={{ mt: 0.5, textAlign: "right", cursor: "pointer" }}
              >
                <Typography fontSize={10} color="#0891b2">tap to preview list ›</Typography>
              </Box>
            )}
          </Box>
        )}

        {/* ─ carousel (no top bubble — WA carousel is full-width strip) ─ */}
        {isCarousel && (
          <>
            {data.message && (
              <Box sx={{ maxWidth: "88%", mb: 1 }}>
                <Box sx={{ bgcolor: WA_BUBBLE, borderRadius: "0 10px 10px 10px", px: 1.25, py: 1, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                  <Typography fontSize={13} color="#111827" whiteSpace="pre-line" lineHeight={1.6}>{data.message}</Typography>
                  <Typography sx={{ display: "block", textAlign: "right", fontSize: 9.5, color: "#6b7280", mt: 0.5 }}>12:45 PM ✓✓</Typography>
                </Box>
              </Box>
            )}
            <CarouselStrip cards={data.cards || []} />
          </>
        )}
      </Box>

      {/* WA input bar */}
      <Box sx={{ bgcolor: "#f0f0f0", px: 1, py: 0.75, display: "flex", alignItems: "center", gap: 0.75 }}>
        <Box sx={{ flex: 1, bgcolor: "#fff", borderRadius: "20px", px: 1.5, py: 0.6 }}>
          <Typography fontSize={11} color="#9ca3af">Type a message</Typography>
        </Box>
        <Box sx={{ width: 32, height: 32, borderRadius: "50%", bgcolor: WA_GREEN, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Typography fontSize={14} color="#fff">🎤</Typography>
        </Box>
      </Box>

      {/* list bottom sheet */}
      <ListSheet data={data} open={openList} onClose={() => setOpenList(false)} />
    </Box>
  );
};

/* ══════════════════════════════════════════════
   MAIN NodeOpenPopup
══════════════════════════════════════════════ */
const NodeOpenPopup = ({ selectedNode, updateNodeData, onClose, allNodes, channelId }: any) => {
  if (!selectedNode) return null;

  const EditorComponent = NODE_EDITORS[selectedNode.data.type] || null;
  const data = selectedNode.data || {};
  const ns = NODE_STYLE[data.type] || DEFAULT_STYLE;

  const noPreview = false;

  return (
    <Dialog
      open={!!selectedNode}
      onClose={onClose}
      fullWidth
      maxWidth={false}
      PaperProps={{
        sx: {
          width: "1160px",
          maxWidth: "96vw",
          height: "88vh",
          borderRadius: "16px",
          boxShadow: "0 32px 80px rgba(0,0,0,0.25)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        },
      }}
      BackdropProps={{ sx: { backgroundColor: "rgba(0,0,0,0.45)" } }}
    >
      {/* ── DIALOG HEADER ── */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 3,
          py: 1.75,
          borderBottom: "1px solid #f3f4f6",
          bgcolor: "#fff",
          flexShrink: 0,
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box sx={{
            width: 36, height: 36, borderRadius: "10px",
            bgcolor: ns.bg,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18,
            border: `1px solid ${ns.color}22`,
          }}>
            {ns.icon}
          </Box>
          <Box>
            <Typography variant="subtitle1" fontWeight={700} sx={{ fontSize: 15, lineHeight: 1.2 }}>
              {ns.label}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11 }}>
              Node ID: {selectedNode.id}
            </Typography>
          </Box>
          <Chip
            label={data.type}
            size="small"
            sx={{ fontSize: 10, height: 20, bgcolor: ns.bg, color: ns.color, fontWeight: 700, fontFamily: "monospace" }}
          />
        </Stack>

        <IconButton onClick={onClose} sx={{ color: "#9ca3af", "&:hover": { color: "#374151", bgcolor: "#f3f4f6" } }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* ── CONTENT ── */}
      <DialogContent sx={{ flex: 1, overflow: "hidden", p: 0 }}>
        <Grid container sx={{ height: "100%" }}>

          {/* LEFT: EDITOR */}
          <Grid
            item
            xs={12}
            md={noPreview ? 12 : 7}
            sx={{
              height: "100%",
              overflowY: "auto",
              p: 3,
              borderRight: noPreview ? "none" : "1px solid #f3f4f6",
            }}
          >
            {EditorComponent ? (
              <EditorComponent
                node={selectedNode}
                updateNodeData={updateNodeData}
                allNodes={allNodes}
                channelId={channelId}
              />
            ) : (
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
                <Box textAlign="center">
                  <Typography fontSize={32} mb={1}>🔧</Typography>
                  <Typography color="text.secondary" fontSize={14}>No editor available for this node type</Typography>
                </Box>
              </Box>
            )}
          </Grid>

          {/* RIGHT: PREVIEW */}
          {!noPreview && (
            <Grid item xs={12} md={5} sx={{ height: "100%", display: "flex", flexDirection: "column", p: 2.5 }}>
              <Stack direction="row" alignItems="center" spacing={1} mb={1.5}>
                <Typography variant="subtitle2" fontWeight={700} sx={{ fontSize: 13 }}>
                  Preview
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, px: 0.75, py: 0.2, borderRadius: "20px", bgcolor: "#f0fdf4", border: "1px solid #bbf7d0" }}>
                  <Box sx={{
                    width: 6, height: 6, borderRadius: "50%", bgcolor: "#22c55e",
                    "@keyframes livepulse": {
                      "0%, 100%": { opacity: 1, transform: "scale(1)" },
                      "50%": { opacity: 0.45, transform: "scale(0.65)" },
                    },
                    animation: "livepulse 1.8s ease-in-out infinite",
                  }} />
                  <Typography fontSize={9.5} color="#16a34a" fontWeight={700} letterSpacing={0.3}>LIVE</Typography>
                </Box>
                {data.type === "google_sheet" ? (
                  <Chip label="Spreadsheet" size="small" sx={{ fontSize: 10, height: 18, bgcolor: "#f0fdf4", color: "#16a34a", fontWeight: 600 }} />
                ) : data.type === "set_contact_attribute" ? (
                  <Chip label="Attributes" size="small" sx={{ fontSize: 10, height: 18, bgcolor: "#fffbeb", color: "#92400e", fontWeight: 600 }} />
                ) : (
                  <Chip label="WhatsApp" size="small" sx={{ fontSize: 10, height: 18, bgcolor: "#f0fdf4", color: "#16a34a", fontWeight: 600 }} />
                )}
              </Stack>

              <Box sx={{ flex: 1, overflow: "hidden", borderRadius: "12px", border: "1px solid #e5e7eb" }}>
                <WAPreview data={data} />
              </Box>
            </Grid>
          )}
        </Grid>
      </DialogContent>

      {/* ── FOOTER ── */}
      <Box sx={{ px: 3, py: 1.75, borderTop: "1px solid #f3f4f6", display: "flex", justifyContent: "flex-end", gap: 1.5, bgcolor: "#fff", flexShrink: 0 }}>
        <Button
          variant="outlined"
          onClick={onClose}
          sx={{ borderRadius: "8px", fontWeight: 600, fontSize: 13, px: 2.5, color: "#374151", borderColor: "#e5e7eb", "&:hover": { borderColor: "#9ca3af", bgcolor: "#f9fafb" } }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          startIcon={<SaveIcon sx={{ fontSize: 16 }} />}
          onClick={onClose}
          sx={{ borderRadius: "8px", fontWeight: 600, fontSize: 13, px: 2.5, bgcolor: ns.color, "&:hover": { bgcolor: ns.color, filter: "brightness(0.9)" }, boxShadow: "none" }}
        >
          Done
        </Button>
      </Box>
    </Dialog>
  );
};

export default NodeOpenPopup;
