import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  ArrowLeftOutlined,
  CheckOutlined,
  CloudUploadOutlined,
  DeleteOutlined,
  PlusOutlined,
  SaveOutlined,
  ThunderboltOutlined,
  FileTextOutlined,
  EyeOutlined,
  CodeOutlined,
  CopyOutlined,
  WarningOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  SwapOutlined,
  AppstoreOutlined,
} from "@ant-design/icons";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  flowBuilderService,
  FlowScreen,
  FlowComponent,
  WhatsappFlow,
} from "service/flowBuilder.service";
import { channelService } from "service/channel.service";
import MonacoEditor from "@monaco-editor/react";

/* ═══════════════════════════════════════════════════
   COMPONENT REGISTRY
══════════════════════════════════════════════════ */
interface FieldDef {
  key: string;
  label: string;
  type: "text" | "multiline" | "boolean" | "number" | "select" | "options" | "action";
  options?: string[];
  placeholder?: string;
  hint?: string;
}

interface ComponentDef {
  label: string;
  color: string;
  bg: string;
  icon: React.ReactNode;
  emoji: string;
  description: string;
  fields: FieldDef[];
  defaults: Record<string, any>;
}

const T = (str: string) => <span style={{ fontFamily: "monospace", fontWeight: 800, fontSize: 13 }}>{str}</span>;

const COMPONENT_DEFS: Record<string, ComponentDef> = {
  TextHeading: {
    label: "Heading", color: "#1a56db", bg: "#eff6ff", icon: T("H1"), emoji: "📌",
    description: "Large bold title text",
    fields: [{ key: "text", label: "Heading text", type: "text", placeholder: "e.g. Welcome back!" }],
    defaults: { text: "Welcome" },
  },
  TextSubheading: {
    label: "Subheading", color: "#1d4ed8", bg: "#eff6ff", icon: T("H2"), emoji: "📝",
    description: "Medium bold section title",
    fields: [{ key: "text", label: "Subheading text", type: "text", placeholder: "e.g. Personal Details" }],
    defaults: { text: "Section title" },
  },
  TextBody: {
    label: "Body Text", color: "#374151", bg: "#f9fafb", icon: T("¶"), emoji: "📄",
    description: "Regular paragraph text",
    fields: [{ key: "text", label: "Body text", type: "multiline", placeholder: "Enter paragraph text..." }],
    defaults: { text: "Your message here." },
  },
  TextCaption: {
    label: "Caption", color: "#6b7280", bg: "#f9fafb", icon: T("Aa"), emoji: "💬",
    description: "Small secondary text / disclaimer",
    fields: [{ key: "text", label: "Caption text", type: "text", placeholder: "e.g. *Required fields" }],
    defaults: { text: "Caption" },
  },
  TextInput: {
    label: "Text Input", color: "#0891b2", bg: "#ecfeff", icon: T("Abc"), emoji: "✏️",
    description: "Single-line text input field",
    fields: [
      { key: "name", label: "Variable name", type: "text", placeholder: "e.g. full_name", hint: `Used to reference this field: \${form.full_name}` },
      { key: "label", label: "Field label", type: "text", placeholder: "e.g. Full Name" },
      { key: "input-type", label: "Input type", type: "select", options: ["text", "email", "number", "phone", "password", "passcode", "url"] },
      { key: "helper-text", label: "Helper text", type: "text", placeholder: "Optional hint shown below field" },
      { key: "required", label: "Required field", type: "boolean" },
    ],
    defaults: { name: "field_name", label: "Label", "input-type": "text", required: true },
  },
  TextArea: {
    label: "Text Area", color: "#0e7490", bg: "#ecfeff", icon: T("¶¶"), emoji: "📋",
    description: "Multi-line text input",
    fields: [
      { key: "name", label: "Variable name", type: "text", placeholder: "e.g. message", hint: `Used as: \${form.message}` },
      { key: "label", label: "Field label", type: "text", placeholder: "e.g. Your Message" },
      { key: "helper-text", label: "Helper text", type: "text", placeholder: "Optional hint" },
      { key: "required", label: "Required field", type: "boolean" },
    ],
    defaults: { name: "message", label: "Message", required: false },
  },
  RadioButtonsGroup: {
    label: "Radio Buttons", color: "#7c3aed", bg: "#f5f3ff", icon: T("◉"), emoji: "🔘",
    description: "Single-choice option selector",
    fields: [
      { key: "name", label: "Variable name", type: "text", placeholder: "e.g. choice" },
      { key: "label", label: "Group label", type: "text", placeholder: "e.g. Select an option" },
      { key: "required", label: "Required field", type: "boolean" },
      { key: "data-source", label: "Options", type: "options" },
    ],
    defaults: {
      name: "choice", label: "Select an option", required: true,
      "data-source": [{ id: "0", title: "Option 1" }, { id: "1", title: "Option 2" }],
    },
  },
  CheckboxGroup: {
    label: "Checkboxes", color: "#6d28d9", bg: "#f5f3ff", icon: T("☑"), emoji: "✅",
    description: "Multi-choice checkbox selector",
    fields: [
      { key: "name", label: "Variable name", type: "text", placeholder: "e.g. interests" },
      { key: "label", label: "Group label", type: "text", placeholder: "e.g. Select all that apply" },
      { key: "required", label: "Required field", type: "boolean" },
      { key: "min-selected-items", label: "Min selections", type: "number" },
      { key: "max-selected-items", label: "Max selections", type: "number" },
      { key: "data-source", label: "Options", type: "options" },
    ],
    defaults: {
      name: "selections", label: "Choose options", required: false,
      "data-source": [{ id: "0", title: "Option A" }, { id: "1", title: "Option B" }],
    },
  },
  Dropdown: {
    label: "Dropdown", color: "#0d9488", bg: "#f0fdfa", icon: T("▼"), emoji: "📂",
    description: "Scrollable dropdown selector",
    fields: [
      { key: "name", label: "Variable name", type: "text", placeholder: "e.g. city" },
      { key: "label", label: "Field label", type: "text", placeholder: "e.g. Select City" },
      { key: "required", label: "Required field", type: "boolean" },
      { key: "data-source", label: "Options", type: "options" },
    ],
    defaults: {
      name: "selection", label: "Select one", required: true,
      "data-source": [{ id: "0", title: "Option 1" }, { id: "1", title: "Option 2" }],
    },
  },
  DatePicker: {
    label: "Date Picker", color: "#be185d", bg: "#fdf2f8", icon: T("📅"), emoji: "📅",
    description: "Calendar date selection",
    fields: [
      { key: "name", label: "Variable name", type: "text", placeholder: "e.g. appointment_date" },
      { key: "label", label: "Field label", type: "text", placeholder: "e.g. Pick a Date" },
      { key: "required", label: "Required field", type: "boolean" },
      { key: "min-date", label: "Min date (YYYY-MM-DD)", type: "text", placeholder: "e.g. 2025-01-01" },
      { key: "max-date", label: "Max date (YYYY-MM-DD)", type: "text", placeholder: "e.g. 2025-12-31" },
    ],
    defaults: { name: "date", label: "Select Date", required: true },
  },
  Image: {
    label: "Image", color: "#b45309", bg: "#fffbeb", icon: T("🖼"), emoji: "🖼️",
    description: "Display an image",
    fields: [
      { key: "src", label: "Image URL", type: "text", placeholder: "https://example.com/image.jpg" },
      { key: "width", label: "Width (px)", type: "number" },
      { key: "height", label: "Height (px)", type: "number" },
      { key: "alt-text", label: "Alt text", type: "text", placeholder: "Describe the image" },
      { key: "scale-type", label: "Scale", type: "select", options: ["cover", "contain"] },
    ],
    defaults: { src: "", width: 300, height: 160, "alt-text": "image", "scale-type": "cover" },
  },
  Footer: {
    label: "Footer Button", color: "#065f46", bg: "#f0fdf4", icon: T("▶"), emoji: "🟢",
    description: "Primary action button (always at bottom)",
    fields: [
      { key: "label", label: "Button text", type: "text", placeholder: "e.g. Submit, Continue, Next" },
      { key: "on-click-action", label: "On Click Action", type: "action" },
    ],
    defaults: { label: "Submit", "on-click-action": { name: "complete", payload: {} } },
  },
};

const COMPONENT_GROUPS = [
  { title: "Text", color: "#374151", types: ["TextHeading", "TextSubheading", "TextBody", "TextCaption"] },
  { title: "Input", color: "#0891b2", types: ["TextInput", "TextArea", "RadioButtonsGroup", "CheckboxGroup", "Dropdown", "DatePicker"] },
  { title: "Media", color: "#b45309", types: ["Image"] },
  { title: "Action", color: "#065f46", types: ["Footer"] },
];

/* ═══════════════════════════════════════════════════
   PHONE PREVIEW — WhatsApp Flow UI mock
══════════════════════════════════════════════════ */
const PreviewComponent = ({ comp, idx }: { comp: FlowComponent; idx: number }) => {
  const base: React.CSSProperties = { marginBottom: 14 };

  switch (comp.type) {
    case "TextHeading":
      return <p key={idx} style={{ ...base, margin: "0 0 10px", fontSize: 17, fontWeight: 800, color: "#111" }}>{comp.text || "Heading"}</p>;

    case "TextSubheading":
      return <p key={idx} style={{ ...base, margin: "0 0 8px", fontSize: 14, fontWeight: 700, color: "#333" }}>{comp.text || "Subheading"}</p>;

    case "TextBody":
      return <p key={idx} style={{ ...base, margin: "0 0 10px", fontSize: 13, lineHeight: 1.55, color: "#444" }}>{comp.text || "Body text"}</p>;

    case "TextCaption":
      return <p key={idx} style={{ ...base, margin: "0 0 8px", fontSize: 11, color: "#888" }}>{comp.text || "Caption"}</p>;

    case "TextInput":
      return (
        <div key={idx} style={{ ...base, marginBottom: 12 }}>
          <label style={{ fontSize: 11, color: "#555", fontWeight: 600, display: "block", marginBottom: 4 }}>
            {comp.label || "Label"}{comp.required ? " *" : ""}
          </label>
          <div style={{ border: "1.5px solid #d1d5db", borderRadius: 8, padding: "8px 10px", background: "#fafafa", fontSize: 12, color: "#9ca3af" }}>
            {comp["input-type"] === "password" ? "••••••••" : `Enter ${comp.label || "text"}...`}
          </div>
          {comp["helper-text"] && <p style={{ fontSize: 10, color: "#9ca3af", margin: "3px 0 0" }}>{comp["helper-text"]}</p>}
        </div>
      );

    case "TextArea":
      return (
        <div key={idx} style={{ ...base, marginBottom: 12 }}>
          <label style={{ fontSize: 11, color: "#555", fontWeight: 600, display: "block", marginBottom: 4 }}>
            {comp.label || "Label"}{comp.required ? " *" : ""}
          </label>
          <div style={{ border: "1.5px solid #d1d5db", borderRadius: 8, padding: "8px 10px", background: "#fafafa", minHeight: 56, fontSize: 12, color: "#9ca3af" }}>
            {`Type your ${comp.label?.toLowerCase() || "message"}...`}
          </div>
        </div>
      );

    case "RadioButtonsGroup": {
      const opts = (comp["data-source"] || []).slice(0, 5);
      return (
        <div key={idx} style={{ ...base, marginBottom: 14 }}>
          <label style={{ fontSize: 11, color: "#555", fontWeight: 600, display: "block", marginBottom: 6 }}>
            {comp.label || "Select"}{comp.required ? " *" : ""}
          </label>
          {opts.map((opt: any, i: number) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, padding: "6px 10px", borderRadius: 8, border: `1.5px solid ${i === 0 ? "#25d366" : "#e5e7eb"}`, background: i === 0 ? "#f0fdf4" : "#fff" }}>
              <div style={{ width: 14, height: 14, borderRadius: "50%", border: `2px solid ${i === 0 ? "#25d366" : "#d1d5db"}`, background: i === 0 ? "#25d366" : "transparent", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {i === 0 && <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#fff" }} />}
              </div>
              <span style={{ fontSize: 12, color: "#111" }}>{opt.title}</span>
            </div>
          ))}
          {(comp["data-source"] || []).length > 5 && (
            <p style={{ fontSize: 10, color: "#9ca3af", margin: "2px 0 0" }}>+{(comp["data-source"] || []).length - 5} more options</p>
          )}
        </div>
      );
    }

    case "CheckboxGroup": {
      const opts = (comp["data-source"] || []).slice(0, 4);
      return (
        <div key={idx} style={{ ...base, marginBottom: 14 }}>
          <label style={{ fontSize: 11, color: "#555", fontWeight: 600, display: "block", marginBottom: 6 }}>
            {comp.label || "Select"}{comp.required ? " *" : ""}
          </label>
          {opts.map((opt: any, i: number) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, padding: "6px 10px", borderRadius: 8, border: `1.5px solid ${i < 2 ? "#25d366" : "#e5e7eb"}`, background: i < 2 ? "#f0fdf4" : "#fff" }}>
              <div style={{ width: 14, height: 14, borderRadius: 4, border: `2px solid ${i < 2 ? "#25d366" : "#d1d5db"}`, background: i < 2 ? "#25d366" : "transparent", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {i < 2 && <span style={{ fontSize: 9, color: "#fff", lineHeight: 1 }}>✓</span>}
              </div>
              <span style={{ fontSize: 12, color: "#111" }}>{opt.title}</span>
            </div>
          ))}
        </div>
      );
    }

    case "Dropdown":
      return (
        <div key={idx} style={{ ...base, marginBottom: 12 }}>
          <label style={{ fontSize: 11, color: "#555", fontWeight: 600, display: "block", marginBottom: 4 }}>
            {comp.label || "Select"}{comp.required ? " *" : ""}
          </label>
          <div style={{ border: "1.5px solid #d1d5db", borderRadius: 8, padding: "8px 10px", background: "#fafafa", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, color: (comp["data-source"] || [])[0]?.title ? "#111" : "#9ca3af" }}>
              {(comp["data-source"] || [])[0]?.title || "Choose an option"}
            </span>
            <span style={{ fontSize: 10, color: "#9ca3af" }}>▼</span>
          </div>
        </div>
      );

    case "DatePicker":
      return (
        <div key={idx} style={{ ...base, marginBottom: 12 }}>
          <label style={{ fontSize: 11, color: "#555", fontWeight: 600, display: "block", marginBottom: 4 }}>
            {comp.label || "Date"}{comp.required ? " *" : ""}
          </label>
          <div style={{ border: "1.5px solid #d1d5db", borderRadius: 8, padding: "8px 10px", background: "#fafafa", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, color: "#9ca3af" }}>DD / MM / YYYY</span>
            <span style={{ fontSize: 14 }}>📅</span>
          </div>
        </div>
      );

    case "Image":
      return (
        <div key={idx} style={{ ...base, marginBottom: 12, borderRadius: 10, overflow: "hidden", height: Math.min(comp.height || 130, 140), background: "#e5e7eb", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {comp.src ? (
            <img src={comp.src} alt={comp["alt-text"] || ""} style={{ width: "100%", height: "100%", objectFit: comp["scale-type"] || "cover" }} onError={(e: any) => { e.target.style.display = "none"; }} />
          ) : (
            <span style={{ fontSize: 28, opacity: 0.4 }}>🖼️</span>
          )}
        </div>
      );

    case "Footer":
      return null; // rendered separately at bottom

    default:
      return <div key={idx} style={{ fontSize: 11, color: "#9ca3af", padding: "6px 0" }}>{comp.type}</div>;
  }
};

const PhonePreview = ({ screen, flowName }: { screen: FlowScreen | null; flowName: string }) => {
  const footer = screen?.children?.find((c) => c.type === "Footer");
  const content = screen?.children?.filter((c) => c.type !== "Footer") || [];

  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 2, px: 2 }}>
      {/* Phone shell */}
      <Box
        sx={{
          width: 270,
          height: 540,
          background: "#0f0f0f",
          borderRadius: "38px",
          p: "10px",
          boxShadow: "0 30px 80px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.08), inset 0 0 0 1px rgba(255,255,255,0.04)",
          position: "relative",
          flexShrink: 0,
        }}
      >
        {/* Camera notch */}
        <Box sx={{
          position: "absolute", top: 14, left: "50%", transform: "translateX(-50%)",
          width: 90, height: 26, bgcolor: "#0f0f0f", borderRadius: "0 0 16px 16px",
          zIndex: 10, display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5,
        }}>
          <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#1a1a1a", border: "1px solid #333" }} />
          <Box sx={{ width: 3, height: 3, borderRadius: "50%", bgcolor: "#222" }} />
        </Box>

        {/* Screen */}
        <Box
          sx={{
            width: "100%",
            height: "100%",
            borderRadius: "28px",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            bgcolor: "#fff",
          }}
        >
          {/* Status bar */}
          <Box sx={{ bgcolor: "#075e54", px: 2, pt: 1.5, pb: 0.5, display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
            <Typography sx={{ color: "#fff", fontSize: 10, fontWeight: 700 }}>9:41</Typography>
            <Stack direction="row" gap={0.5} alignItems="center">
              {["▪▪▪", "WiFi", "🔋"].map((_, i) => (
                <Box key={i} sx={{ width: i === 2 ? 14 : i === 1 ? 11 : 9, height: i === 2 ? 7 : 8, borderRadius: "1px", bgcolor: "rgba(255,255,255,0.85)" }} />
              ))}
            </Stack>
          </Box>

          {/* WA header */}
          <Box sx={{ bgcolor: "#128C7E", px: 1.5, py: 1, display: "flex", alignItems: "center", gap: 1, flexShrink: 0, boxShadow: "0 1px 4px rgba(0,0,0,0.2)" }}>
            <Box sx={{ width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "#fff", fontSize: 12, opacity: 0.9 }}>←</span>
            </Box>
            <Box sx={{ width: 26, height: 26, borderRadius: "50%", bgcolor: "rgba(255,255,255,0.25)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ fontSize: 13 }}>💼</span>
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ color: "#fff", fontSize: 12, fontWeight: 700, lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {screen?.title || flowName}
              </Typography>
              <Typography sx={{ color: "rgba(255,255,255,0.7)", fontSize: 9 }}>WhatsApp Flow</Typography>
            </Box>
          </Box>

          {/* Flow content */}
          <Box sx={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column" }}>
            {/* Progress indicator */}
            <Box sx={{ height: 3, bgcolor: "#e5e7eb" }}>
              <Box sx={{ height: "100%", width: "40%", bgcolor: "#25d366", borderRadius: "0 2px 2px 0" }} />
            </Box>

            {/* Components */}
            <Box sx={{ px: 2, py: 2, flex: 1 }}>
              {screen ? (
                content.length > 0 ? (
                  content.map((comp, idx) => <PreviewComponent key={idx} comp={comp} idx={idx} />)
                ) : (
                  <Box sx={{ textAlign: "center", py: 3, color: "#9ca3af" }}>
                    <Typography fontSize={11}>No components added yet</Typography>
                  </Box>
                )
              ) : (
                <Box sx={{ textAlign: "center", py: 3 }}>
                  <Typography fontSize={12} color="#9ca3af">Select a screen to preview</Typography>
                </Box>
              )}
            </Box>
          </Box>

          {/* Footer */}
          <Box sx={{ px: 2, pb: 2, pt: 1, borderTop: "1px solid #f3f4f6", flexShrink: 0 }}>
            <Box
              sx={{
                bgcolor: footer ? "#25d366" : "#d1d5db",
                borderRadius: "10px",
                py: 1.25,
                textAlign: "center",
                cursor: "pointer",
                transition: "opacity 0.15s",
                "&:hover": { opacity: 0.9 },
              }}
            >
              <Typography sx={{ color: "#fff", fontSize: 13, fontWeight: 700 }}>
                {footer?.label || "Submit"}
              </Typography>
            </Box>
            {footer && (
              <Typography sx={{ fontSize: 9, color: "#9ca3af", textAlign: "center", mt: 0.5 }}>
                {footer["on-click-action"]?.name === "navigate"
                  ? `→ ${footer["on-click-action"]?.next?.name || "next screen"}`
                  : footer["on-click-action"]?.name === "data_exchange"
                  ? "⚡ sends to endpoint"
                  : "✓ completes flow"}
              </Typography>
            )}
          </Box>
        </Box>
      </Box>

      <Typography sx={{ fontSize: 10.5, color: "#9ca3af", mt: 1.5, textAlign: "center" }}>
        Approximate — actual UI may vary
      </Typography>
    </Box>
  );
};

/* ═══════════════════════════════════════════════════
   ADD COMPONENT DIALOG
══════════════════════════════════════════════════ */
const AddComponentDialog = ({
  open,
  onClose,
  onAdd,
}: {
  open: boolean;
  onClose: () => void;
  onAdd: (type: string) => void;
}) => (
  <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: "16px" } }}>
    <DialogTitle sx={{ fontWeight: 800, fontSize: 18, pb: 0 }}>
      <Stack direction="row" alignItems="center" gap={1.5}>
        <Box sx={{ width: 32, height: 32, borderRadius: "8px", bgcolor: "#064e3b", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <AppstoreOutlined style={{ color: "#fff", fontSize: 16 }} />
        </Box>
        Add Component
      </Stack>
    </DialogTitle>
    <DialogContent sx={{ pt: 2 }}>
      {COMPONENT_GROUPS.map((group) => (
        <Box key={group.title} mb={2.5}>
          <Typography fontSize={11} fontWeight={800} color="#9ca3af" textTransform="uppercase" letterSpacing={1} mb={1.25}>
            {group.title}
          </Typography>
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 1.25 }}>
            {group.types.map((type) => {
              const def = COMPONENT_DEFS[type];
              if (!def) return null;
              return (
                <Paper
                  key={type}
                  variant="outlined"
                  onClick={() => { onAdd(type); onClose(); }}
                  sx={{
                    borderRadius: "12px",
                    p: 1.75,
                    cursor: "pointer",
                    borderColor: "#e5e7eb",
                    borderWidth: "1.5px",
                    transition: "all 0.15s",
                    "&:hover": {
                      borderColor: def.color,
                      bgcolor: def.bg,
                      transform: "translateY(-2px)",
                      boxShadow: `0 4px 16px ${def.color}25`,
                    },
                  }}
                >
                  <Stack direction="row" alignItems="flex-start" gap={1.25}>
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: "10px",
                        bgcolor: def.bg,
                        border: `1.5px solid ${def.color}30`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: def.color,
                        flexShrink: 0,
                        fontSize: 14,
                      }}
                    >
                      {def.icon}
                    </Box>
                    <Box minWidth={0}>
                      <Typography fontSize={12.5} fontWeight={700} color="#111">
                        {def.label}
                      </Typography>
                      <Typography fontSize={10.5} color="#9ca3af" lineHeight={1.4}>
                        {def.description}
                      </Typography>
                    </Box>
                  </Stack>
                </Paper>
              );
            })}
          </Box>
        </Box>
      ))}
    </DialogContent>
    <DialogActions sx={{ px: 3, pb: 2.5 }}>
      <Button onClick={onClose} sx={{ borderRadius: "8px" }}>Cancel</Button>
    </DialogActions>
  </Dialog>
);

/* ═══════════════════════════════════════════════════
   OPTIONS EDITOR
══════════════════════════════════════════════════ */
const OptionsEditor = ({
  value,
  onChange,
}: {
  value: { id: string; title: string }[];
  onChange: (v: { id: string; title: string }[]) => void;
}) => {
  const slugify = (s: string) =>
    s.trim().replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_]/g, "") || String(value.length);
  const add = () => {
    const title = `Option ${value.length + 1}`;
    onChange([...value, { id: slugify(title), title }]);
  };
  const remove = (idx: number) => onChange(value.filter((_, i) => i !== idx));
  const update = (idx: number, title: string) =>
    onChange(value.map((opt, i) => (i === idx ? { ...opt, title } : opt)));
  const updateId = (idx: number, id: string) =>
    onChange(value.map((opt, i) => (i === idx ? { ...opt, id } : opt)));
  const move = (idx: number, dir: "up" | "down") => {
    const next = [...value];
    const target = dir === "up" ? idx - 1 : idx + 1;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange(next);
  };

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
        <Typography fontSize={11.5} fontWeight={700} color="#374151">Options ({value.length})</Typography>
        <Button size="small" startIcon={<PlusOutlined />} onClick={add} sx={{ fontSize: 11.5, py: 0.25, textTransform: "none" }}>
          Add
        </Button>
      </Stack>
      <Stack gap={1}>
        {value.map((opt, idx) => (
          <Stack key={idx} gap={0.4}>
            <Stack direction="row" alignItems="center" gap={0.75}>
              <Box
                sx={{
                  width: 22, height: 22, borderRadius: "6px",
                  bgcolor: "#f3f4f6", display: "flex", alignItems: "center",
                  justifyContent: "center", flexShrink: 0,
                }}
              >
                <Typography fontSize={10} fontWeight={700} color="#6b7280">{idx + 1}</Typography>
              </Box>
              <TextField
                value={opt.title}
                onChange={(e) => update(idx, e.target.value)}
                size="small"
                fullWidth
                placeholder={`Option ${idx + 1}`}
                sx={{ "& .MuiInputBase-input": { fontSize: 12.5, py: 0.75 } }}
              />
              <Stack direction="row" gap={0.25}>
                <IconButton size="small" disabled={idx === 0} onClick={() => move(idx, "up")} sx={{ p: 0.3 }}>
                  <KeyboardArrowUpIcon sx={{ fontSize: 14 }} />
                </IconButton>
                <IconButton size="small" disabled={idx === value.length - 1} onClick={() => move(idx, "down")} sx={{ p: 0.3 }}>
                  <KeyboardArrowDownIcon sx={{ fontSize: 14 }} />
                </IconButton>
                <IconButton size="small" onClick={() => remove(idx)} sx={{ p: 0.3, color: "#ef4444" }}>
                  <DeleteOutlined style={{ fontSize: 12 }} />
                </IconButton>
              </Stack>
            </Stack>
            <Stack direction="row" alignItems="center" gap={0.5} pl={3.5}>
              <Typography fontSize={10.5} color="#9ca3af" sx={{ flexShrink: 0 }}>ID:</Typography>
              <TextField
                value={opt.id}
                onChange={(e) => updateId(idx, e.target.value)}
                size="small"
                fullWidth
                placeholder="value_id"
                sx={{ "& .MuiInputBase-input": { fontSize: 11.5, py: 0.4, fontFamily: "monospace" } }}
              />
            </Stack>
          </Stack>
        ))}
        {value.length === 0 && (
          <Box sx={{ textAlign: "center", py: 2, borderRadius: "8px", border: "1.5px dashed #e5e7eb" }}>
            <Typography fontSize={12} color="#9ca3af">No options yet — click Add above</Typography>
          </Box>
        )}
      </Stack>
    </Box>
  );
};

/* ═══════════════════════════════════════════════════
   ACTION EDITOR (Footer on-click-action)
══════════════════════════════════════════════════ */
const ActionEditor = ({
  value,
  screens,
  screenId,
  screenChildren,
  screenData,
  flowType,
  onChange,
}: {
  value: any;
  screens: FlowScreen[];
  screenId: string;
  screenChildren: FlowComponent[];
  screenData: Record<string, any>;
  flowType: "static" | "dynamic";
  onChange: (v: any) => void;
}) => {
  const actionName: string = value?.name || "complete";
  const otherScreens = screens.filter((s) => s.id !== screenId);

  // Form fields on this screen
  const formFields = screenChildren
    .filter((c) => ["TextInput", "TextArea", "RadioButtonsGroup", "CheckboxGroup", "Dropdown", "DatePicker"].includes(c.type))
    .filter((c) => c.name);

  // Data variables passed from previous screens (declared in Screen Data Variables)
  const dataVars = Object.entries(screenData || {}).filter(
    ([, v]) => typeof v === "object" && v !== null && "type" in v
  );

  const autoFillPayload = () => {
    const payload: Record<string, string> = {};
    // Pass-through data vars from previous screens
    dataVars.forEach(([key]) => { payload[key] = `\${data.${key}}`; });
    // Current screen's form fields
    formFields.forEach((c) => { payload[c.name] = `\${form.${c.name}}`; });
    onChange({ ...value, payload });
  };

  const ACTION_DESCRIPTIONS: Record<string, { color: string; bg: string; icon: React.ReactNode; desc: string }> = {
    complete: { color: "#065f46", bg: "#f0fdf4", icon: <CheckCircleOutlined />, desc: "Closes the flow and sends data via webhook" },
    navigate: { color: "#1a56db", bg: "#eff6ff", icon: <SwapOutlined />, desc: "Navigate to another screen (static flows)" },
    data_exchange: { color: "#7c3aed", bg: "#f5f3ff", icon: <ThunderboltOutlined />, desc: "Send data to your backend endpoint (dynamic flows)" },
  };

  return (
    <Box>
      <Typography fontSize={11.5} fontWeight={700} color="#374151" mb={1}>Action Type</Typography>

      <Stack gap={0.75} mb={1.5}>
        {Object.entries(ACTION_DESCRIPTIONS).filter(([name]) => !(flowType === "static" && name === "data_exchange")).map(([name, info]) => (
          <Box
            key={name}
            onClick={() =>
              onChange({
                name,
                payload: value?.payload || {},
                ...(name === "navigate" ? { next: { type: "screen", name: otherScreens[0]?.id || "" } } : {}),
              })
            }
            sx={{
              display: "flex", alignItems: "center", gap: 1.5, p: 1.25, borderRadius: "10px",
              border: `1.5px solid ${actionName === name ? info.color : "#e5e7eb"}`,
              bgcolor: actionName === name ? info.bg : "#fff",
              cursor: "pointer", transition: "all 0.15s",
              "&:hover": { borderColor: info.color },
            }}
          >
            <Box sx={{ color: info.color, fontSize: 16, flexShrink: 0 }}>{info.icon}</Box>
            <Box flex={1}>
              <Typography fontSize={12.5} fontWeight={700} color={actionName === name ? info.color : "#374151"}>{name}</Typography>
              <Typography fontSize={11} color="#9ca3af">{info.desc}</Typography>
            </Box>
            {actionName === name && (
              <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: info.color, flexShrink: 0 }} />
            )}
          </Box>
        ))}
      </Stack>

      {/* Navigate: screen picker */}
      {actionName === "navigate" && (
        <FormControl fullWidth size="small" sx={{ mb: 1.5 }}>
          <InputLabel>Navigate to screen</InputLabel>
          <Select
            value={value?.next?.name || ""}
            label="Navigate to screen"
            onChange={(e) => onChange({ ...value, next: { type: "screen", name: e.target.value } })}
          >
            {otherScreens.length === 0
              ? <MenuItem disabled value="">No other screens — add screens first</MenuItem>
              : otherScreens.map((s) => (
                <MenuItem key={s.id} value={s.id}>{s.title} ({s.id})</MenuItem>
              ))
            }
          </Select>
        </FormControl>
      )}

      {/* Payload — for complete & navigate */}
      {(actionName === "complete" || actionName === "navigate") && (
        <Box>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={0.75}>
            <Typography fontSize={11.5} fontWeight={700} color="#374151">Payload (sent on submit)</Typography>
            {(formFields.length > 0 || dataVars.length > 0) && (
              <Tooltip title="Auto-fill: carries forward data vars from previous screens + adds this screen's form fields">
                <Button size="small" onClick={autoFillPayload} sx={{ fontSize: 11, py: 0.25, textTransform: "none" }}>
                  ✨ Auto-fill
                </Button>
              </Tooltip>
            )}
          </Stack>
          <TextField
            multiline
            rows={4}
            fullWidth
            size="small"
            value={JSON.stringify(value?.payload || {}, null, 2)}
            onChange={(e) => {
              try { onChange({ ...value, payload: JSON.parse(e.target.value) }); } catch { }
            }}
            inputProps={{ style: { fontFamily: "monospace", fontSize: 11.5 } }}
            sx={{ bgcolor: "#1e1e2e", borderRadius: "8px", "& .MuiInputBase-input": { color: "#a3e635" }, "& .MuiOutlinedInput-root": { bgcolor: "#1e1e2e" } }}
          />
          {(formFields.length > 0 || dataVars.length > 0) && (
            <Typography fontSize={10.5} color="#9ca3af" mt={0.75}>
              {dataVars.length > 0 && <>Pass-through: {dataVars.map(([k]) => k).join(", ")} → <code>${"{data.key}"}</code>{"  "}</>}
              {formFields.length > 0 && <>This screen: {formFields.map((f) => f.name).join(", ")} → <code>${"{form.key}"}</code></>}
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
};

/* ═══════════════════════════════════════════════════
   COMPONENT FIELD EDITOR
══════════════════════════════════════════════════ */
const ComponentFieldEditor = ({
  component,
  screens,
  screenId,
  screenChildren,
  screenData,
  flowType,
  onChange,
}: {
  component: FlowComponent;
  screens: FlowScreen[];
  screenId: string;
  screenChildren: FlowComponent[];
  screenData: Record<string, any>;
  flowType: "static" | "dynamic";
  onChange: (c: FlowComponent) => void;
}) => {
  const def = COMPONENT_DEFS[component.type];
  if (!def) return null;

  const set = (key: string, val: any) => onChange({ ...component, [key]: val });

  return (
    <Box sx={{ px: 2, py: 2, bgcolor: "#fafafa", borderTop: "1px solid #f3f4f6" }}>
      <Stack gap={1.75}>
        {def.fields.map((field) => {
          if (field.type === "text") {
            return (
              <Box key={field.key}>
                <TextField
                  label={field.label}
                  value={component[field.key] ?? ""}
                  onChange={(e) => set(field.key, e.target.value)}
                  size="small"
                  fullWidth
                  placeholder={field.placeholder}
                  sx={{ "& .MuiInputBase-input": { fontSize: 13 } }}
                />
                {field.hint && (
                  <Typography fontSize={10.5} color="#9ca3af" mt={0.5} sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <InfoCircleOutlined style={{ fontSize: 11 }} /> {field.hint}
                  </Typography>
                )}
              </Box>
            );
          }
          if (field.type === "multiline") {
            return (
              <TextField
                key={field.key}
                label={field.label}
                value={component[field.key] ?? ""}
                onChange={(e) => set(field.key, e.target.value)}
                size="small"
                fullWidth
                multiline
                rows={3}
                placeholder={field.placeholder}
                sx={{ "& .MuiInputBase-input": { fontSize: 13 } }}
              />
            );
          }
          if (field.type === "number") {
            return (
              <TextField
                key={field.key}
                label={field.label}
                type="number"
                value={component[field.key] ?? ""}
                onChange={(e) => set(field.key, e.target.value ? Number(e.target.value) : "")}
                size="small"
                fullWidth
                sx={{ "& .MuiInputBase-input": { fontSize: 13 } }}
              />
            );
          }
          if (field.type === "boolean") {
            return (
              <FormControlLabel
                key={field.key}
                control={<Switch size="small" checked={!!component[field.key]} onChange={(e) => set(field.key, e.target.checked)} color="success" />}
                label={<Typography fontSize={13} color="#374151">{field.label}</Typography>}
                sx={{ m: 0 }}
              />
            );
          }
          if (field.type === "select") {
            return (
              <FormControl key={field.key} fullWidth size="small">
                <InputLabel>{field.label}</InputLabel>
                <Select
                  value={component[field.key] || ""}
                  label={field.label}
                  onChange={(e) => set(field.key, e.target.value)}
                  sx={{ fontSize: 13 }}
                >
                  {(field.options || []).map((opt) => (
                    <MenuItem key={opt} value={opt} sx={{ fontSize: 13 }}>{opt}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            );
          }
          if (field.type === "options") {
            return (
              <OptionsEditor
                key={field.key}
                value={component[field.key] || []}
                onChange={(v) => set(field.key, v)}
              />
            );
          }
          if (field.type === "action") {
            return (
              <ActionEditor
                key={field.key}
                value={component[field.key]}
                screens={screens}
                screenId={screenId}
                screenChildren={screenChildren.filter((c) => c !== component)}
                screenData={screenData}
                flowType={flowType}
                onChange={(v) => set(field.key, v)}
              />
            );
          }
          return null;
        })}
      </Stack>
    </Box>
  );
};

/* ═══════════════════════════════════════════════════
   COMPONENT CARD
══════════════════════════════════════════════════ */
const ComponentCard = ({
  component, index, total, screens, screenId, screenChildren,
  expanded, onToggle, onChange, onMove, onDelete, flowType, screenData,
}: {
  component: FlowComponent; index: number; total: number;
  screens: FlowScreen[]; screenId: string; screenChildren: FlowComponent[];
  expanded: boolean; onToggle: () => void;
  onChange: (c: FlowComponent) => void;
  onMove: (dir: "up" | "down") => void;
  onDelete: () => void;
  flowType: "static" | "dynamic";
  screenData: Record<string, any>;
}) => {
  const def = COMPONENT_DEFS[component.type];
  const color = def?.color || "#6b7280";

  const getSummary = () => {
    if (component.text) return component.text.slice(0, 35) + (component.text.length > 35 ? "…" : "");
    if (component.name) return `var: ${component.name}`;
    if (component.label) return component.label;
    return "";
  };

  return (
    <Paper
      variant="outlined"
      sx={{
        borderRadius: "12px",
        overflow: "hidden",
        borderColor: expanded ? color : "#e5e7eb",
        borderWidth: "1.5px",
        mb: 1.25,
        transition: "border-color 0.15s, box-shadow 0.15s",
        boxShadow: expanded ? `0 4px 16px ${color}18` : "none",
      }}
    >
      {/* Colored top strip */}
      <Box sx={{ height: 3, bgcolor: color }} />

      {/* Header */}
      <Stack
        direction="row"
        alignItems="center"
        onClick={onToggle}
        sx={{
          px: 1.75, py: 1.25, cursor: "pointer",
          bgcolor: expanded ? `${color}06` : "#fff",
          "&:hover": { bgcolor: `${color}06` },
          userSelect: "none",
        }}
      >
        {/* Icon */}
        <Box
          sx={{
            width: 32, height: 32, borderRadius: "8px",
            bgcolor: def?.bg || "#f9fafb",
            border: `1.5px solid ${color}25`,
            display: "flex", alignItems: "center", justifyContent: "center",
            color, flexShrink: 0, mr: 1.25, fontSize: 13,
          }}
        >
          {def?.icon || "?"}
        </Box>

        {/* Info */}
        <Box flex={1} minWidth={0}>
          <Typography fontSize={13} fontWeight={700} color="#111">
            {def?.label || component.type}
          </Typography>
          <Typography fontSize={11.5} color="#9ca3af" noWrap>
            {getSummary()}
          </Typography>
        </Box>

        {/* Controls */}
        <Stack direction="row" alignItems="center" gap={0.25} ml={0.5} onClick={(e) => e.stopPropagation()}>
          <Tooltip title="Move up">
            <span>
              <IconButton size="small" disabled={index === 0} onClick={() => onMove("up")} sx={{ p: 0.5, color: "#9ca3af", "&:hover": { color: "#374151" } }}>
                <KeyboardArrowUpIcon sx={{ fontSize: 15 }} />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Move down">
            <span>
              <IconButton size="small" disabled={index === total - 1} onClick={() => onMove("down")} sx={{ p: 0.5, color: "#9ca3af", "&:hover": { color: "#374151" } }}>
                <KeyboardArrowDownIcon sx={{ fontSize: 15 }} />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Delete component">
            <IconButton size="small" onClick={onDelete} sx={{ p: 0.5, color: "#e5e7eb", "&:hover": { color: "#ef4444" } }}>
              <DeleteOutlined style={{ fontSize: 13 }} />
            </IconButton>
          </Tooltip>
          <Box sx={{ color: "#9ca3af", pl: 0.5 }}>
            {expanded ? <ExpandLessIcon sx={{ fontSize: 18 }} /> : <ExpandMoreIcon sx={{ fontSize: 18 }} />}
          </Box>
        </Stack>
      </Stack>

      {/* Field editor */}
      {expanded && (
        <ComponentFieldEditor
          component={component}
          screens={screens}
          screenId={screenId}
          screenChildren={screenChildren}
          screenData={screenData}
          flowType={flowType}
          onChange={onChange}
        />
      )}
    </Paper>
  );
};

/* ═══════════════════════════════════════════════════
   SCREEN DATA VARIABLES EDITOR
══════════════════════════════════════════════════ */
const DATA_VAR_TYPES = ["string", "boolean", "number", "object", "array"];

const ScreenDataEditor = ({
  data,
  onChange,
}: {
  data: Record<string, any>;
  onChange: (d: Record<string, any>) => void;
}) => {
  const [open, setOpen] = useState(false);
  const entries = Object.entries(data).filter(
    ([, v]) => typeof v === "object" && v !== null && "type" in v
  );

  const addVar = () => {
    const key = `var_${entries.length + 1}`;
    onChange({ ...data, [key]: { type: "string", __example__: "" } });
    setOpen(true);
  };

  const removeVar = (key: string) => {
    const next = { ...data };
    delete next[key];
    onChange(next);
  };

  const renameVar = (oldKey: string, newKey: string) => {
    const safe = newKey.replace(/[^a-z0-9_]/gi, "_").toLowerCase();
    if (!safe || safe === oldKey) return;
    const next: Record<string, any> = {};
    for (const [k, v] of Object.entries(data)) next[k === oldKey ? safe : k] = v;
    onChange(next);
  };

  const updateVar = (key: string, field: string, value: any) => {
    const current = data[key] || {};
    let updated = { ...current, [field]: value };
    // When switching to array type, auto-set items and fix example
    if (field === "type" && value === "array") {
      if (!updated.items) updated.items = { type: "string" };
      if (!Array.isArray(updated.__example__)) updated.__example__ = ["example"];
    }
    // When switching away from array, remove items
    if (field === "type" && value !== "array") {
      delete updated.items;
      if (Array.isArray(updated.__example__)) updated.__example__ = "";
    }
    // When changing items sub-type
    if (field === "items_type") {
      updated.items = { type: value };
      delete (updated as any).items_type;
    }
    onChange({ ...data, [key]: updated });
  };

  return (
    <Box sx={{ mb: 2, border: "1.5px solid #e5e7eb", borderRadius: "12px", overflow: "hidden", bgcolor: "#fff" }}>
      <Stack
        direction="row" alignItems="center" justifyContent="space-between"
        onClick={() => setOpen((o) => !o)}
        sx={{ px: 2, py: 1.25, cursor: "pointer", bgcolor: open ? "#f9fafb" : "#fff", "&:hover": { bgcolor: "#f9fafb" }, userSelect: "none" }}
      >
        <Stack direction="row" alignItems="center" gap={1}>
          <Typography fontSize={12} fontWeight={700} color="#374151">Screen Data Variables</Typography>
          {entries.length > 0 && (
            <Chip label={entries.length} size="small" sx={{ height: 18, fontSize: 10, fontWeight: 700, bgcolor: "#f0fdf4", color: "#065f46", borderRadius: "5px", border: "1px solid #bbf7d0" }} />
          )}
          <Typography fontSize={11} color="#9ca3af">— data received from previous screens</Typography>
        </Stack>
        <Stack direction="row" alignItems="center" gap={0.5}>
          <Tooltip title="Add variable">
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); addVar(); }}
              sx={{ bgcolor: "#f3f4f6", borderRadius: "6px", p: 0.4, "&:hover": { bgcolor: "#064e3b", color: "#fff" } }}>
              <PlusOutlined style={{ fontSize: 11 }} />
            </IconButton>
          </Tooltip>
          <Box sx={{ color: "#9ca3af", display: "flex" }}>
            {open ? <ExpandLessIcon sx={{ fontSize: 18 }} /> : <ExpandMoreIcon sx={{ fontSize: 18 }} />}
          </Box>
        </Stack>
      </Stack>

      {open && (
        <Box sx={{ px: 2, pb: 2, pt: 0.5 }}>
          <Alert severity="info" icon={<InfoCircleOutlined style={{ fontSize: 13 }} />}
            sx={{ mb: 1.5, borderRadius: "8px", "& .MuiAlert-message": { fontSize: 11.5 } }}>
            Declare variables this screen receives from the previous screen's Footer payload.
            Then use <code style={{ backgroundColor: "#e0f2fe", padding: "1px 4px", borderRadius: 3 }}>{`\${data.var_name}`}</code> in any text field to display them.
          </Alert>

          {entries.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 2.5, border: "1.5px dashed #e5e7eb", borderRadius: "10px", bgcolor: "#fafafa" }}>
              <Typography fontSize={12} color="#9ca3af" mb={1}>No variables defined</Typography>
              <Button size="small" startIcon={<PlusOutlined />} onClick={addVar}
                sx={{ textTransform: "none", fontSize: 12, borderRadius: "8px" }}>
                Add Variable
              </Button>
            </Box>
          ) : (
            <Stack gap={1}>
              {entries.map(([key, varDef]) => (
                <Paper key={key} variant="outlined" sx={{ borderRadius: "10px", p: 1.25, borderColor: "#bbf7d0", bgcolor: "#f0fdf4" }}>
                  <Stack direction="row" alignItems="center" gap={0.75} mb={0.75}>
                    <Box sx={{ display: "flex", alignItems: "center", flex: 1, bgcolor: "#fff", border: "1px solid #bbf7d0", borderRadius: "8px", px: 1, py: 0.5 }}>
                      <Typography fontSize={11} color="#9ca3af" sx={{ mr: 0.25, fontFamily: "monospace", flexShrink: 0 }}>$data.</Typography>
                      <input
                        value={key}
                        onChange={(e) => renameVar(key, e.target.value)}
                        style={{ border: "none", background: "transparent", fontSize: 12.5, fontFamily: "monospace", fontWeight: 700, color: "#065f46", outline: "none", width: "100%", minWidth: 0 }}
                        placeholder="variable_name"
                      />
                    </Box>
                    <FormControl size="small" sx={{ width: 90 }}>
                      <Select value={varDef.type || "string"} onChange={(e) => updateVar(key, "type", e.target.value)} sx={{ fontSize: 12 }}>
                        {DATA_VAR_TYPES.map((t) => <MenuItem key={t} value={t} sx={{ fontSize: 12 }}>{t}</MenuItem>)}
                      </Select>
                    </FormControl>
                    <IconButton size="small" onClick={() => removeVar(key)} sx={{ color: "#d1d5db", "&:hover": { color: "#ef4444" }, p: 0.5 }}>
                      <DeleteOutlined style={{ fontSize: 12 }} />
                    </IconButton>
                  </Stack>
                  {varDef.type === "array" && (
                    <Stack direction="row" alignItems="center" gap={1} mb={0.75}>
                      <Typography fontSize={11} color="#065f46" sx={{ flexShrink: 0 }}>Items type:</Typography>
                      <FormControl size="small" sx={{ width: 100 }}>
                        <Select
                          value={varDef.items?.type || "string"}
                          onChange={(e) => updateVar(key, "items_type", e.target.value)}
                          sx={{ fontSize: 12 }}
                        >
                          {["string", "number", "boolean", "object"].map((t) => (
                            <MenuItem key={t} value={t} sx={{ fontSize: 12 }}>{t}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <Typography fontSize={10} color="#9ca3af">each array element type</Typography>
                    </Stack>
                  )}
                  <TextField
                    value={
                      varDef.type === "array"
                        ? (Array.isArray(varDef.__example__) ? JSON.stringify(varDef.__example__) : varDef.__example__ || '["example"]')
                        : (varDef.__example__ || "")
                    }
                    onChange={(e) => {
                      if (varDef.type === "array") {
                        try { updateVar(key, "__example__", JSON.parse(e.target.value)); }
                        catch { updateVar(key, "__example__", e.target.value); }
                      } else {
                        updateVar(key, "__example__", e.target.value);
                      }
                    }}
                    size="small" fullWidth
                    placeholder={varDef.type === "array" ? '["example value"]' : "Example value (required by Meta when publishing)"}
                    sx={{ "& .MuiInputBase-input": { fontSize: 11.5 } }}
                  />
                </Paper>
              ))}
            </Stack>
          )}
        </Box>
      )}
    </Box>
  );
};

/* ═══════════════════════════════════════════════════
   FLOW JSON MODAL
══════════════════════════════════════════════════ */
const FlowJSONModal = ({ open, onClose, flowJson }: { open: boolean; onClose: () => void; flowJson: any }) => {
  const json = JSON.stringify(flowJson, null, 2);
  const [copied, setCopied] = useState(false);
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: "16px" } }}>
      <DialogTitle sx={{ fontWeight: 800 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" gap={1}>
            <CodeOutlined style={{ color: "#064e3b" }} /> Generated Flow JSON
          </Stack>
          <Button
            size="small" variant="outlined"
            startIcon={copied ? <CheckOutlined style={{ color: "#10b981" }} /> : <CopyOutlined />}
            onClick={() => { navigator.clipboard.writeText(json); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
            sx={{ borderRadius: "8px", fontSize: 12, textTransform: "none" }}
          >
            {copied ? "Copied!" : "Copy JSON"}
          </Button>
        </Stack>
      </DialogTitle>
      <DialogContent>
        <Box component="pre" sx={{ bgcolor: "#0d1117", color: "#a3e635", borderRadius: "12px", p: 2.5, fontSize: 12, overflow: "auto", maxHeight: 500, fontFamily: "'JetBrains Mono', 'Fira Code', monospace", m: 0, lineHeight: 1.6 }}>
          {json}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} sx={{ borderRadius: "8px" }}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

/* ═══════════════════════════════════════════════════
   MAIN EDITOR
══════════════════════════════════════════════════ */
const buildFlowJSON = (screens: FlowScreen[], _type: string) => ({
  version: "6.0",
  screens: screens.map((screen) => {
    // Footer MUST be last — Meta rejects if it's anywhere else in the Form
    const children = screen.children || [];
    const sortedChildren = [
      ...children.filter((c) => c.type !== "Footer"),
      ...children.filter((c) => c.type === "Footer"),
    ];

    // Only include data vars that have valid type + __example__ (Meta requires both)
    const validDataEntries = Object.entries(screen.data || {}).filter(
      ([, v]) => typeof v === "object" && v !== null && "type" in (v as object) && "__example__" in (v as object)
    );
    const validData = Object.fromEntries(validDataEntries);

    return {
      id: screen.id,
      title: screen.title,
      terminal: screen.terminal,
      ...(validDataEntries.length > 0 ? { data: validData } : {}),
      layout: {
        type: "SingleColumnLayout",
        children: [{ type: "Form", name: "form", children: sortedChildren }],
      },
    };
  }),
});

export default function FlowBuilderEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: flowData, isLoading } = useQuery({
    queryKey: ["wb-flow", id],
    queryFn: () => flowBuilderService.get(id!),
    enabled: !!id,
  });

  const { data: channelsData } = useQuery({
    queryKey: ["channels"],
    queryFn: () => channelService.getChannels(),
    select: (r) => r.data,
    staleTime: 60_000,
  });

  const [flow, setFlow] = useState<WhatsappFlow | null>(null);
  const [selectedScreenIdx, setSelectedScreenIdx] = useState(0);
  const [expandedCompIdx, setExpandedCompIdx] = useState<number | null>(null);
  const [addCompOpen, setAddCompOpen] = useState(false);
  const [jsonModalOpen, setJsonModalOpen] = useState(false);
  const [publishResult, setPublishResult] = useState<any>(null);
  const [toast, setToast] = useState<{ msg: string; sev: "success" | "error" | "info" } | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (flowData?.data) { setFlow(flowData.data); setIsDirty(false); }
  }, [flowData]);

  const saveMut = useMutation({
    mutationFn: (data: Partial<WhatsappFlow>) => flowBuilderService.update(id!, data),
    onSuccess: (res) => {
      setFlow(res.data); setIsDirty(false);
      qc.invalidateQueries({ queryKey: ["wb-flows"] });
      setToast({ msg: "Flow saved successfully!", sev: "success" });
    },
    onError: () => setToast({ msg: "Save failed — check your connection", sev: "error" }),
  });

  const publishMut = useMutation({
    mutationFn: () => flowBuilderService.publish(id!),
    onSuccess: (res) => {
      setPublishResult(res);
      qc.invalidateQueries({ queryKey: ["wb-flow", id] });
      qc.invalidateQueries({ queryKey: ["wb-flows"] });
      qc.invalidateQueries({ queryKey: ["flow-builder-flows"] });
    },
    onError: (e: any) => {
      // Always refresh so DB status syncs even if publish errored
      qc.invalidateQueries({ queryKey: ["wb-flow", id] });
      qc.invalidateQueries({ queryKey: ["wb-flows"] });
      qc.invalidateQueries({ queryKey: ["flow-builder-flows"] });
      setToast({ msg: e?.response?.data?.message || "Publish failed", sev: "error" });
    },
  });

  const saveNow = useCallback(() => {
    if (!flow) return;
    saveMut.mutate({ name: flow.name, type: flow.type, channel_id: flow.channel_id, screens: flow.screens, endpoint_responses: flow.endpoint_responses });
  }, [flow, saveMut]);

  const patchFlow = (patch: Partial<WhatsappFlow>) => {
    setFlow((p) => p ? { ...p, ...patch } : p);
    setIsDirty(true);
  };

  const selectedScreen = flow?.screens?.[selectedScreenIdx] ?? null;

  const patchScreen = (patch: Partial<FlowScreen>) => {
    if (!flow) return;
    patchFlow({ screens: flow.screens.map((s, i) => i === selectedScreenIdx ? { ...s, ...patch } : s) });
  };

  const addScreen = () => {
    if (!flow) return;
    const newId = `SCREEN_${flow.screens.length + 1}`;
    const screens = flow.screens.map((s, i) => i === flow.screens.length - 1 ? { ...s, terminal: false } : s);
    screens.push({
      id: newId, title: `Screen ${flow.screens.length + 1}`, terminal: true, data: {},
      children: [
        { type: "TextHeading", text: "New Screen" },
        { type: "Footer", label: "Continue", "on-click-action": { name: "complete", payload: {} } },
      ],
    });
    patchFlow({ screens });
    setSelectedScreenIdx(screens.length - 1);
    setExpandedCompIdx(null);
  };

  const deleteScreen = (idx: number) => {
    if (!flow || flow.screens.length <= 1) return;
    const screens = flow.screens.filter((_, i) => i !== idx);
    if (screens.length > 0 && !screens[screens.length - 1].terminal) {
      screens[screens.length - 1] = { ...screens[screens.length - 1], terminal: true };
    }
    patchFlow({ screens });
    setSelectedScreenIdx(Math.min(idx, screens.length - 1));
    setExpandedCompIdx(null);
  };

  const addComponent = (type: string) => {
    if (!selectedScreen || !flow) return;
    const def = COMPONENT_DEFS[type];
    const children = [...(selectedScreen.children || []), { type, ...def.defaults }];
    patchScreen({ children });
    setExpandedCompIdx(children.length - 1);
  };

  const updateComp = (idx: number, comp: FlowComponent) => {
    if (!selectedScreen) return;
    patchScreen({ children: selectedScreen.children.map((c, i) => i === idx ? comp : c) });
  };

  const deleteComp = (idx: number) => {
    if (!selectedScreen) return;
    patchScreen({ children: selectedScreen.children.filter((_, i) => i !== idx) });
    setExpandedCompIdx(null);
  };

  const moveComp = (idx: number, dir: "up" | "down") => {
    if (!selectedScreen) return;
    const children = [...selectedScreen.children];
    const to = dir === "up" ? idx - 1 : idx + 1;
    if (to < 0 || to >= children.length) return;
    [children[idx], children[to]] = [children[to], children[idx]];
    patchScreen({ children });
    setExpandedCompIdx(to);
  };

  const generatedJSON = useMemo(() => flow ? buildFlowJSON(flow.screens, flow.type) : null, [flow]);
  const channels = channelsData || [];

  if (isLoading || !flow) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", gap: 2, bgcolor: "#f8fafc" }}>
        <CircularProgress sx={{ color: "#064e3b" }} size={36} />
        <Typography color="#6b7280" fontSize={14}>Loading flow…</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100vh", bgcolor: "#f8fafc", overflow: "hidden" }}>

      {/* ══════ TOP BAR ══════ */}
      <Box sx={{ display: "flex", alignItems: "center", px: 2, py: 1, bgcolor: "#fff", borderBottom: "1px solid #e5e7eb", gap: 1.5, flexShrink: 0, boxShadow: "0 1px 4px rgba(0,0,0,0.04)", zIndex: 20 }}>

        <Tooltip title="Back to all flows">
          <IconButton size="small" onClick={() => navigate("/flow-builder")} sx={{ bgcolor: "#f3f4f6", borderRadius: "8px", "&:hover": { bgcolor: "#e5e7eb" } }}>
            <ArrowLeftOutlined style={{ fontSize: 15 }} />
          </IconButton>
        </Tooltip>

        {/* Breadcrumb */}
        <Stack direction="row" alignItems="center" gap={0.75}>
          <Typography fontSize={12} color="#9ca3af" sx={{ cursor: "pointer", "&:hover": { color: "#374151" } }} onClick={() => navigate("/flow-builder")}>
            WA Flows
          </Typography>
          <Typography fontSize={12} color="#d1d5db">/</Typography>
          <TextField
            value={flow.name}
            onChange={(e) => patchFlow({ name: e.target.value })}
            variant="standard"
            inputProps={{ style: { fontWeight: 700, fontSize: 15, color: "#111827", padding: 0 } }}
            sx={{ "& .MuiInput-underline:before": { display: "none" }, "& .MuiInput-underline:after": { borderColor: "#064e3b" } }}
          />
        </Stack>

        {/* Unsaved indicator */}
        {isDirty && (
          <Chip label="Unsaved" size="small" icon={<WarningOutlined style={{ fontSize: 10, color: "#d97706" }} />}
            sx={{ height: 20, fontSize: 10, fontWeight: 700, bgcolor: "#fef9c3", color: "#d97706", border: "1px solid #fde68a", borderRadius: "6px" }}
          />
        )}

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

        {/* Type selector */}
        <Stack direction="row" gap={0.75}>
          {(["static", "dynamic"] as const).map((t) => {
            const isActive = flow.type === t;
            const cfg = t === "static"
              ? { color: "#1a56db", bg: "#eff6ff", border: "#bfdbfe", icon: <FileTextOutlined /> }
              : { color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe", icon: <ThunderboltOutlined /> };
            return (
              <Chip
                key={t}
                label={t.charAt(0).toUpperCase() + t.slice(1)}
                icon={<Box sx={{ color: isActive ? cfg.color : "#9ca3af", fontSize: 12 }}>{cfg.icon}</Box>}
                onClick={() => patchFlow({ type: t })}
                sx={{
                  height: 26, fontSize: 12, fontWeight: 700, cursor: "pointer", textTransform: "capitalize",
                  bgcolor: isActive ? cfg.bg : "transparent",
                  color: isActive ? cfg.color : "#9ca3af",
                  border: `1.5px solid ${isActive ? cfg.border : "#e5e7eb"}`,
                  "& .MuiChip-icon": { ml: "6px" },
                  "&:hover": { bgcolor: cfg.bg, borderColor: cfg.border, color: cfg.color },
                  transition: "all 0.15s",
                }}
              />
            );
          })}
        </Stack>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

        {/* Channel */}
        <FormControl size="small" sx={{ minWidth: 190 }}>
          <Select
            value={flow.channel_id || ""}
            displayEmpty
            onChange={(e) => patchFlow({ channel_id: e.target.value || undefined })}
            sx={{ fontSize: 12.5, borderRadius: "8px" }}
            renderValue={(v) => v ? (channels.find((c: any) => c._id === v)?.channel_name || "Channel") : <span style={{ color: "#9ca3af" }}>Link channel for publish</span>}
          >
            <MenuItem value=""><em style={{ color: "#9ca3af" }}>No channel</em></MenuItem>
            {channels.map((ch: any) => (
              <MenuItem key={ch._id} value={ch._id}>{ch.channel_name} · {ch.display_phone_number}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <Box flex={1} />

        {/* Actions */}
        <Stack direction="row" gap={1}>
          <Tooltip title="View generated Flow JSON">
            <Button size="small" variant="outlined" startIcon={<CodeOutlined />} onClick={() => setJsonModalOpen(true)}
              sx={{ fontSize: 12, textTransform: "none", borderRadius: "8px", borderColor: "#e5e7eb", color: "#374151", "&:hover": { borderColor: "#064e3b", color: "#064e3b" } }}>
              JSON
            </Button>
          </Tooltip>

          <Button
            size="small" variant="outlined"
            startIcon={saveMut.isPending ? <CircularProgress size={12} /> : <SaveOutlined />}
            onClick={saveNow} disabled={saveMut.isPending}
            sx={{ fontSize: 12, textTransform: "none", borderRadius: "8px", minWidth: 80, borderColor: isDirty ? "#064e3b" : "#e5e7eb", color: isDirty ? "#064e3b" : "#9ca3af", fontWeight: isDirty ? 700 : 400 }}
          >
            {saveMut.isPending ? "Saving…" : "Save"}
          </Button>

          <Tooltip title={!flow.channel_id ? "Link a channel first to publish" : ""}>
            <span>
              <Button
                size="small" variant="contained"
                startIcon={publishMut.isPending ? <CircularProgress size={12} sx={{ color: "#fff" }} /> : <CloudUploadOutlined />}
                onClick={() => { if (isDirty) saveNow(); setTimeout(() => publishMut.mutate(), isDirty ? 600 : 0); }}
                disabled={publishMut.isPending || !flow.channel_id}
                sx={{ fontSize: 12, textTransform: "none", borderRadius: "8px", bgcolor: "#064e3b", "&:hover": { bgcolor: "#065f46" }, boxShadow: "none", minWidth: 100 }}
              >
                {publishMut.isPending ? "Publishing…" : "Publish to Meta"}
              </Button>
            </span>
          </Tooltip>
        </Stack>
      </Box>

      {/* ══════ BODY — 3 columns ══════ */}
      <Box sx={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* ── LEFT: Screens panel ── */}
        <Box sx={{ width: 230, flexShrink: 0, bgcolor: "#fff", borderRight: "1px solid #e5e7eb", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 2, py: 1.5, borderBottom: "1px solid #f3f4f6" }}>
            <Stack direction="row" alignItems="center" gap={1}>
              <Typography fontSize={11} fontWeight={800} color="#6b7280" letterSpacing={0.8} textTransform="uppercase">Screens</Typography>
              <Chip label={flow.screens.length} size="small" sx={{ height: 18, fontSize: 10, fontWeight: 700, bgcolor: "#f3f4f6", color: "#6b7280", borderRadius: "6px" }} />
            </Stack>
            <Tooltip title="Add screen">
              <IconButton size="small" onClick={addScreen} sx={{ bgcolor: "#f3f4f6", borderRadius: "6px", p: 0.5, "&:hover": { bgcolor: "#064e3b", color: "#fff" } }}>
                <PlusOutlined style={{ fontSize: 12 }} />
              </IconButton>
            </Tooltip>
          </Stack>

          <Box sx={{ flex: 1, overflow: "auto", p: 1.25 }}>
            {flow.screens.map((screen, idx) => {
              const isSelected = selectedScreenIdx === idx;
              const compCount = screen.children?.length || 0;
              return (
                <Box
                  key={screen.id}
                  onClick={() => { setSelectedScreenIdx(idx); setExpandedCompIdx(null); }}
                  sx={{
                    borderRadius: "10px", p: 1.25, mb: 0.75, cursor: "pointer",
                    bgcolor: isSelected ? "#f0fdf4" : "#fafafa",
                    border: `1.5px solid ${isSelected ? "#86efac" : "transparent"}`,
                    transition: "all 0.15s",
                    "&:hover": { bgcolor: "#f0fdf4", border: "1.5px solid #bbf7d0" },
                    position: "relative",
                  }}
                >
                  <Stack direction="row" alignItems="flex-start" gap={1}>
                    <Box sx={{ width: 22, height: 22, borderRadius: "6px", bgcolor: isSelected ? "#064e3b" : "#e5e7eb", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, mt: 0.1 }}>
                      <Typography fontSize={10} fontWeight={800} color={isSelected ? "#fff" : "#6b7280"}>{idx + 1}</Typography>
                    </Box>
                    <Box flex={1} minWidth={0}>
                      <Typography fontSize={12.5} fontWeight={isSelected ? 700 : 500} color="#111" noWrap lineHeight={1.3}>{screen.title}</Typography>
                      <Typography fontSize={10.5} color="#9ca3af" fontFamily="monospace" noWrap lineHeight={1.4}>{screen.id}</Typography>
                    </Box>
                    {flow.screens.length > 1 && (
                      <IconButton
                        size="small" onClick={(e) => { e.stopPropagation(); deleteScreen(idx); }}
                        sx={{ p: 0.25, color: "transparent", ".MuiBox-root:hover &": { color: "#ef4444" }, "&:hover": { color: "#ef4444 !important", bgcolor: "#fee2e2" }, borderRadius: "4px" }}
                      >
                        <DeleteOutlined style={{ fontSize: 11 }} />
                      </IconButton>
                    )}
                  </Stack>
                  <Stack direction="row" gap={0.75} mt={0.75} flexWrap="wrap">
                    <Chip label={`${compCount} comp${compCount !== 1 ? "s" : ""}`} size="small"
                      sx={{ height: 16, fontSize: 9.5, fontWeight: 600, bgcolor: "#f3f4f6", color: "#6b7280", borderRadius: "4px" }} />
                    {screen.terminal && (
                      <Chip label="terminal" size="small"
                        sx={{ height: 16, fontSize: 9.5, fontWeight: 700, bgcolor: "#fef9c3", color: "#b45309", borderRadius: "4px" }} />
                    )}
                  </Stack>
                </Box>
              );
            })}
          </Box>

          <Box sx={{ p: 1.25, borderTop: "1px solid #f3f4f6" }}>
            <Button fullWidth size="small" variant="outlined" startIcon={<PlusOutlined />} onClick={addScreen}
              sx={{ borderRadius: "8px", fontSize: 12, textTransform: "none", borderColor: "#e5e7eb", color: "#6b7280", borderStyle: "dashed", "&:hover": { borderColor: "#064e3b", color: "#064e3b" } }}>
              Add Screen
            </Button>
          </Box>
        </Box>

        {/* ── CENTER: Component editor ── */}
        <Box sx={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", bgcolor: "#f8fafc" }}>
          {selectedScreen && (
            <>
              {/* Screen settings */}
              <Box sx={{ px: 2.5, py: 1.5, bgcolor: "#fff", borderBottom: "1px solid #e5e7eb", flexShrink: 0 }}>
                <Stack direction="row" alignItems="center" gap={2} flexWrap="wrap">
                  <TextField
                    label="Screen Title"
                    value={selectedScreen.title}
                    onChange={(e) => patchScreen({ title: e.target.value })}
                    size="small"
                    sx={{ width: 200 }}
                    inputProps={{ style: { fontSize: 13 } }}
                  />
                  <TextField
                    label="Screen ID"
                    value={selectedScreen.id}
                    onChange={(e) => patchScreen({ id: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, "_") })}
                    size="small"
                    sx={{ width: 160 }}
                    inputProps={{ style: { fontFamily: "monospace", fontSize: 12 } }}
                  />
                  <FormControlLabel
                    control={
                      <Switch size="small" color="success"
                        checked={selectedScreen.terminal}
                        onChange={(e) => {
                          const screens = flow.screens.map((s, i) => ({
                            ...s, terminal: i === selectedScreenIdx ? e.target.checked : (e.target.checked ? false : s.terminal),
                          }));
                          patchFlow({ screens });
                        }}
                      />
                    }
                    label={
                      <Stack direction="row" alignItems="center" gap={0.5}>
                        <Typography fontSize={12.5}>Terminal</Typography>
                        <Tooltip title="Mark this as the last screen. Meta requires exactly one terminal screen.">
                          <InfoCircleOutlined style={{ fontSize: 12, color: "#9ca3af" }} />
                        </Tooltip>
                      </Stack>
                    }
                    sx={{ m: 0 }}
                  />
                </Stack>
              </Box>

              {/* Components */}
              <Box sx={{ flex: 1, overflow: "auto", p: 2.5 }}>
                {/* Screen data variables (for referencing previous screen values) */}
                <ScreenDataEditor
                  data={selectedScreen.data || {}}
                  onChange={(d) => patchScreen({ data: d })}
                />

                {selectedScreen.children?.length === 0 ? (
                  <Box
                    sx={{
                      border: "2px dashed #d1d5db", borderRadius: "16px", p: 6,
                      textAlign: "center", mb: 2, bgcolor: "#fff",
                      transition: "all 0.15s", cursor: "pointer",
                      "&:hover": { borderColor: "#064e3b", bgcolor: "#f0fdf4" },
                    }}
                    onClick={() => setAddCompOpen(true)}
                  >
                    <Box sx={{ fontSize: 40, mb: 1.5 }}>🧩</Box>
                    <Typography fontWeight={700} fontSize={15} color="#374151" mb={0.5}>Add your first component</Typography>
                    <Typography fontSize={13} color="#9ca3af" mb={2.5}>Click to choose from 10 component types</Typography>
                    <Button variant="contained" startIcon={<PlusOutlined />}
                      sx={{ bgcolor: "#064e3b", borderRadius: "10px", textTransform: "none", fontWeight: 600, boxShadow: "none", "&:hover": { bgcolor: "#065f46" } }}>
                      Add Component
                    </Button>
                  </Box>
                ) : (
                  <>
                    {selectedScreen.children.map((comp, idx) => (
                      <ComponentCard
                        key={`${comp.type}-${idx}`}
                        component={comp} index={idx} total={selectedScreen.children.length}
                        screens={flow.screens} screenId={selectedScreen.id} screenChildren={selectedScreen.children}
                        expanded={expandedCompIdx === idx}
                        onToggle={() => setExpandedCompIdx(expandedCompIdx === idx ? null : idx)}
                        onChange={(c) => updateComp(idx, c)}
                        onMove={(dir) => moveComp(idx, dir)}
                        onDelete={() => deleteComp(idx)}
                        flowType={flow.type}
                        screenData={selectedScreen.data || {}}
                      />
                    ))}

                    <Button
                      fullWidth variant="outlined" startIcon={<PlusOutlined />} onClick={() => setAddCompOpen(true)}
                      sx={{
                        borderRadius: "12px", textTransform: "none", fontSize: 13, borderColor: "#d1d5db",
                        borderStyle: "dashed", color: "#6b7280", mt: 0.5, py: 1.25,
                        "&:hover": { borderColor: "#064e3b", color: "#064e3b", bgcolor: "#f0fdf4", borderStyle: "solid" },
                      }}
                    >
                      Add Component
                    </Button>
                  </>
                )}

                {/* Dynamic endpoint config */}
                {flow.type === "dynamic" && (
                  <Box sx={{ mt: 3 }}>
                    <Divider sx={{ mb: 2.5 }}>
                      <Chip
                        label="Backend Response Config"
                        icon={<ThunderboltOutlined style={{ fontSize: 11, color: "#7c3aed" }} />}
                        size="small"
                        sx={{ bgcolor: "#f5f3ff", color: "#7c3aed", border: "1px solid #ddd6fe", fontWeight: 700, fontSize: 11.5 }}
                      />
                    </Divider>

                    {/* Endpoint URL */}
                    <Box sx={{ mb: 2.5, p: 1.5, borderRadius: "10px", bgcolor: "#0d1117", border: "1px solid #30363d" }}>
                      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={0.5}>
                        <Typography fontSize={10.5} fontWeight={700} color="#7c3aed" letterSpacing={0.5} textTransform="uppercase">
                          Meta Endpoint URL
                        </Typography>
                        <Button size="small" sx={{ fontSize: 10.5, py: 0, textTransform: "none", color: "#7c3aed", minWidth: 0 }}
                          onClick={() => {
                            const base = process.env.REACT_APP_BACKEND_PUBLIC_URL || process.env.REACT_APP_API_URL?.replace(/\/api\/?$/, "") || "http://localhost:5005";
                            navigator.clipboard.writeText(`${base}/api/flow-builder/endpoint/${flow._id}`);
                          }}>Copy</Button>
                      </Stack>
                      <Typography fontSize={11} fontFamily="monospace" color="#a3e635" sx={{ wordBreak: "break-all" }}>
                        {`${process.env.REACT_APP_BACKEND_PUBLIC_URL || (process.env.REACT_APP_API_URL?.replace(/\/api\/?$/, "") || "http://localhost:5005")}/api/flow-builder/endpoint/${flow._id}`}
                      </Typography>
                      <Typography fontSize={10.5} color="#6b7280" mt={0.75}>
                        Auto-set in Meta when you click <strong style={{ color: "#9ca3af" }}>Publish to Meta</strong>.
                      </Typography>
                    </Box>

                    {/* Flow path */}
                    <Box sx={{ mb: 2.5, p: 1.25, borderRadius: "10px", bgcolor: "#f5f3ff", border: "1px solid #ddd6fe", display: "flex", alignItems: "center", gap: 0.75, flexWrap: "wrap" }}>
                      <Chip label="INIT" size="small" sx={{ bgcolor: "#7c3aed", color: "#fff", fontWeight: 700, fontSize: 10.5 }} />
                      <Typography fontSize={13} color="#7c3aed">→</Typography>
                      {flow.screens.map((s, idx) => (
                        <span key={s.id} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <Chip label={s.id} size="small" sx={{ bgcolor: s.terminal ? "#064e3b" : "#e0e7ff", color: s.terminal ? "#fff" : "#3730a3", fontWeight: 700, fontSize: 10.5, border: s.terminal ? "1px solid #059669" : "1px solid #c7d2fe" }} />
                          {idx < flow.screens.length - 1 && <Typography fontSize={13} color="#7c3aed">→</Typography>}
                        </span>
                      ))}
                      <Typography fontSize={10} color="#7c3aed" sx={{ ml: 0.5 }}>✓ complete</Typography>
                    </Box>

                    {/* Mode toggle */}
                    <Box sx={{ mb: 2.5, p: 1.5, borderRadius: "12px", bgcolor: "#f8fafc", border: "1px solid #e2e8f0" }}>
                      <Typography fontSize={11.5} fontWeight={700} color="#374151" mb={1.25}>Response Mode</Typography>
                      <Stack direction="row" gap={1.5}>
                        <Box
                          onClick={() => patchFlow({ use_custom_code: false })}
                          sx={{
                            flex: 1, p: 1.5, borderRadius: "10px", cursor: "pointer", border: "2px solid",
                            borderColor: !flow.use_custom_code ? "#7c3aed" : "#e2e8f0",
                            bgcolor: !flow.use_custom_code ? "#f5f3ff" : "#fff",
                            transition: "all 0.15s",
                          }}
                        >
                          <Typography fontSize={12} fontWeight={700} color={!flow.use_custom_code ? "#7c3aed" : "#6b7280"}>
                            📋 Static JSON
                          </Typography>
                          <Typography fontSize={10.5} color="#9ca3af" mt={0.25}>
                            Configure response per screen as fixed JSON
                          </Typography>
                        </Box>
                        <Box
                          onClick={() => {
                            if (!flow.custom_handler_code) {
                              const firstId = flow.screens[0]?.id || "WELCOME";
                              const nonTerminal = flow.screens.filter((s) => !s.terminal);
                              const template = [
                                `// Available: action, screen, data, flow_token, axios, screens, console`,
                                `// action  → "INIT" | "data_exchange" | "ping"`,
                                `// screen  → current screen ID (on data_exchange)`,
                                `// data    → form fields submitted by user { field_name: value }`,
                                `// axios   → make HTTP requests (supports async/await)`,
                                ``,
                                `if (action === "ping") {`,
                                `  return { data: { status: "active" } };`,
                                `}`,
                                ``,
                                `if (action === "INIT") {`,
                                `  // Example: fetch dynamic data for first screen`,
                                `  // const res = await axios.get("https://your-api.com/slots");`,
                                `  return {`,
                                `    screen: "${firstId}",`,
                                `    data: {}`,
                                `  };`,
                                `}`,
                                ``,
                                ...nonTerminal.map((s, i) => {
                                  const next = flow.screens[i + 1];
                                  return [
                                    `if (screen === "${s.id}") {`,
                                    `  // data contains: ${Object.keys(s.children?.filter?.((c: any) => c.name)?.reduce?.((acc: any, c: any) => { acc[c.name] = true; return acc; }, {}) || {}).join(", ") || "form fields"}`,
                                    `  console.log("${s.id} data:", data);`,
                                    `  return {`,
                                    `    screen: "${next?.id || "SUCCESS"}",`,
                                    `    data: { ...data }`,
                                    `  };`,
                                    `}`,
                                  ].join("\n");
                                }),
                                ``,
                                `// Default fallback`,
                                `return {`,
                                `  screen: "SUCCESS",`,
                                `  data: {`,
                                `    extension_message_response: {`,
                                `      params: { flow_token }`,
                                `    }`,
                                `  }`,
                                `};`,
                              ].join("\n");
                              patchFlow({ use_custom_code: true, custom_handler_code: template });
                            } else {
                              patchFlow({ use_custom_code: true });
                            }
                          }}
                          sx={{
                            flex: 1, p: 1.5, borderRadius: "10px", cursor: "pointer", border: "2px solid",
                            borderColor: flow.use_custom_code ? "#1e40af" : "#e2e8f0",
                            bgcolor: flow.use_custom_code ? "#eff6ff" : "#fff",
                            transition: "all 0.15s",
                          }}
                        >
                          <Typography fontSize={12} fontWeight={700} color={flow.use_custom_code ? "#1e40af" : "#6b7280"}>
                            ⚡ Custom Code
                          </Typography>
                          <Typography fontSize={10.5} color="#9ca3af" mt={0.25}>
                            Write JavaScript — API calls, conditions, calculations
                          </Typography>
                        </Box>
                      </Stack>
                    </Box>

                    {/* ── STATIC JSON MODE ── */}
                    {!flow.use_custom_code && (
                      <>
                        <Alert severity="info" icon={<InfoCircleOutlined style={{ fontSize: 14 }} />}
                          sx={{ mb: 2.5, borderRadius: "10px", "& .MuiAlert-message": { fontSize: 12 } }}>
                          When a user opens the flow, Meta calls your backend with <code>action: "INIT"</code>.
                          When they tap <em>Next</em>, Meta sends <code>action: "data_exchange"</code> + screen ID.
                          Configure what your backend returns for each step below.
                          Use <code>{"{{flow_token}}"}</code> as token placeholder.
                        </Alert>

                        {/* INIT */}
                        {(() => {
                          const initVal = flow.endpoint_responses?.["INIT"];
                          const initFallback = { screen: flow.screens[0]?.id || "WELCOME", data: {} };
                          return (
                            <Box sx={{ mb: 2.5 }}>
                              <Stack direction="row" alignItems="center" gap={1} mb={1}>
                                <Chip label="INIT" size="small" sx={{ bgcolor: "#7c3aed", color: "#fff", fontWeight: 700, fontSize: 10.5 }} />
                                <Typography fontSize={11.5} color="#6b7280">Flow opens → show which screen first</Typography>
                              </Stack>
                              <TextField multiline rows={4} fullWidth
                                value={JSON.stringify(initVal ?? initFallback, null, 2)}
                                onChange={(e) => { try { patchFlow({ endpoint_responses: { ...flow.endpoint_responses, INIT: JSON.parse(e.target.value) } }); } catch { } }}
                                inputProps={{ style: { fontFamily: "monospace", fontSize: 12, color: "#a3e635" } }}
                                sx={{ bgcolor: "#0d1117", borderRadius: "12px", "& .MuiOutlinedInput-root": { bgcolor: "#0d1117", borderRadius: "12px", "& fieldset": { borderColor: "#7c3aed44" } } }}
                              />
                            </Box>
                          );
                        })()}

                        {/* Per non-terminal screen */}
                        {flow.screens.filter((s) => !s.terminal).map((screen, idx) => {
                          const nextScreen = flow.screens[idx + 1];
                          const val = flow.endpoint_responses?.[screen.id];
                          const fallback = nextScreen
                            ? { screen: nextScreen.id, data: {} }
                            : { screen: "SUCCESS", data: { extension_message_response: { params: { flow_token: "{{flow_token}}" } } } };
                          return (
                            <Box key={screen.id} sx={{ mb: 2.5 }}>
                              <Stack direction="row" alignItems="center" gap={1} mb={1}>
                                <Chip label={`After ${screen.id} → Next`} size="small" sx={{ bgcolor: "#1e40af", color: "#fff", fontWeight: 700, fontSize: 10.5 }} />
                                <Typography fontSize={11.5} color="#6b7280">User taps Next on <strong>{screen.title}</strong> → respond with</Typography>
                              </Stack>
                              <TextField multiline rows={4} fullWidth
                                value={JSON.stringify(val ?? fallback, null, 2)}
                                onChange={(e) => { try { patchFlow({ endpoint_responses: { ...flow.endpoint_responses, [screen.id]: JSON.parse(e.target.value) } }); } catch { } }}
                                inputProps={{ style: { fontFamily: "monospace", fontSize: 12, color: "#93c5fd" } }}
                                sx={{ bgcolor: "#0d1117", borderRadius: "12px", "& .MuiOutlinedInput-root": { bgcolor: "#0d1117", borderRadius: "12px", "& fieldset": { borderColor: "#1e40af44" } } }}
                              />
                            </Box>
                          );
                        })}

                        {/* Terminal note */}
                        {flow.screens.filter((s) => s.terminal).map((s) => (
                          <Box key={s.id} sx={{ p: 1.5, borderRadius: "10px", bgcolor: "#f0fdf4", border: "1px solid #bbf7d0" }}>
                            <Stack direction="row" alignItems="center" gap={1}>
                              <Chip label={`${s.id} (Terminal)`} size="small" sx={{ bgcolor: "#064e3b", color: "#fff", fontWeight: 700, fontSize: 10.5 }} />
                              <Typography fontSize={11.5} color="#166534">
                                User taps Submit → Meta sends <code>nfm_reply</code> → automation continues. No backend response needed.
                              </Typography>
                            </Stack>
                          </Box>
                        ))}
                      </>
                    )}

                    {/* ── CUSTOM CODE MODE ── */}
                    {flow.use_custom_code && (
                      <Box>
                        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1.5}>
                          <Stack direction="row" alignItems="center" gap={1}>
                            <Chip label="JavaScript" size="small" sx={{ bgcolor: "#fef3c7", color: "#92400e", fontWeight: 700, fontSize: 10.5 }} />
                            <Typography fontSize={11.5} color="#6b7280">
                              Runs on your backend. Supports <code>async/await</code>, <code>axios</code>, conditionals, calculations.
                            </Typography>
                          </Stack>
                        </Stack>

                        <Box sx={{ borderRadius: "12px", overflow: "hidden", border: "1px solid #30363d" }}>
                          {/* Monaco toolbar */}
                          <Box sx={{ bgcolor: "#161b22", px: 2, py: 0.75, display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #30363d" }}>
                            <Typography fontSize={10.5} color="#7d8590" fontFamily="monospace">handler.js</Typography>
                            <Stack direction="row" gap={0.5}>
                              <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: "#ff5f57" }} />
                              <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: "#febc2e" }} />
                              <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: "#28c840" }} />
                            </Stack>
                          </Box>
                          <MonacoEditor
                            height="480px"
                            language="javascript"
                            theme="vs-dark"
                            value={flow.custom_handler_code || ""}
                            onChange={(val) => patchFlow({ custom_handler_code: val || "" })}
                            options={{
                              minimap: { enabled: false },
                              fontSize: 13,
                              lineHeight: 22,
                              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                              scrollBeyondLastLine: false,
                              wordWrap: "on",
                              padding: { top: 16, bottom: 16 },
                              renderLineHighlight: "line",
                              suggestOnTriggerCharacters: true,
                              quickSuggestions: true,
                              tabSize: 2,
                            }}
                          />
                        </Box>

                        {/* Variable reference card */}
                        <Box sx={{ mt: 1.5, p: 1.5, borderRadius: "10px", bgcolor: "#0d1117", border: "1px solid #30363d" }}>
                          <Typography fontSize={10.5} fontWeight={700} color="#7d8590" letterSpacing={0.5} textTransform="uppercase" mb={1}>
                            Available Variables
                          </Typography>
                          {[
                            { name: "action", type: "string", desc: '"INIT" | "data_exchange" | "ping"' },
                            { name: "screen", type: "string", desc: "current screen ID (on data_exchange)" },
                            { name: "data", type: "object", desc: "form fields submitted by user" },
                            { name: "flow_token", type: "string", desc: "WhatsApp flow token" },
                            { name: "axios", type: "function", desc: "make HTTP requests — axios.get/post/put/delete" },
                            { name: "screens", type: "array", desc: "all screen definitions from this flow" },
                            { name: "console", type: "object", desc: "console.log — appears in server logs" },
                          ].map((v) => (
                            <Stack key={v.name} direction="row" alignItems="baseline" gap={1} mb={0.5}>
                              <Typography fontSize={11} fontFamily="monospace" color="#a3e635" sx={{ minWidth: 90 }}>{v.name}</Typography>
                              <Typography fontSize={10} color="#7c3aed" fontFamily="monospace" sx={{ minWidth: 55 }}>{v.type}</Typography>
                              <Typography fontSize={10.5} color="#6b7280">{v.desc}</Typography>
                            </Stack>
                          ))}
                        </Box>
                      </Box>
                    )}
                  </Box>
                )}
              </Box>
            </>
          )}
        </Box>

        {/* ── RIGHT: Preview panel ── */}
        <Box
          sx={{
            width: 330, flexShrink: 0,
            background: "linear-gradient(135deg, #e8ecf0 0%, #dce3ea 100%)",
            display: "flex", flexDirection: "column", overflow: "auto",
          }}
        >
          {/* Preview header */}
          <Box sx={{ px: 2, py: 1.5, display: "flex", alignItems: "center", gap: 1, borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
            <EyeOutlined style={{ fontSize: 13, color: "#6b7280" }} />
            <Typography fontSize={11} fontWeight={800} color="#6b7280" letterSpacing={0.8} textTransform="uppercase">
              Live Preview
            </Typography>
          </Box>

          {/* Screen tabs */}
          <Box sx={{ px: 1.5, py: 1, display: "flex", gap: 0.75, flexWrap: "wrap", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
            {flow.screens.map((s, idx) => (
              <Chip
                key={s.id} label={s.title} size="small" clickable
                onClick={() => { setSelectedScreenIdx(idx); setExpandedCompIdx(null); }}
                sx={{
                  height: 22, fontSize: 10.5, fontWeight: selectedScreenIdx === idx ? 700 : 500,
                  bgcolor: selectedScreenIdx === idx ? "#064e3b" : "rgba(255,255,255,0.6)",
                  color: selectedScreenIdx === idx ? "#fff" : "#6b7280",
                  borderRadius: "6px", cursor: "pointer",
                  "&:hover": { bgcolor: selectedScreenIdx === idx ? "#065f46" : "rgba(255,255,255,0.9)" },
                }}
              />
            ))}
          </Box>

          <PhonePreview screen={selectedScreen} flowName={flow.name} />
        </Box>
      </Box>

      {/* ══ DIALOGS ══ */}
      <AddComponentDialog open={addCompOpen} onClose={() => setAddCompOpen(false)} onAdd={addComponent} />
      <FlowJSONModal open={jsonModalOpen} onClose={() => setJsonModalOpen(false)} flowJson={generatedJSON} />

      {/* Publish success */}
      <Dialog open={!!publishResult} onClose={() => setPublishResult(null)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: "16px" } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>
          <Stack direction="row" alignItems="center" gap={1.5}>
            <Box sx={{ width: 36, height: 36, borderRadius: "10px", bgcolor: "#f0fdf4", border: "1.5px solid #bbf7d0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>✅</Box>
            Published to Meta!
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            <Alert severity="success" sx={{ borderRadius: "10px" }}>
              <strong>{flow.name}</strong> is now live on WhatsApp.
            </Alert>
            {publishResult?.meta_flow_id && (
              <Box sx={{ p: 1.5, bgcolor: "#f9fafb", borderRadius: "10px", border: "1px solid #e5e7eb" }}>
                <Typography fontSize={11} color="#9ca3af" mb={0.25}>Meta Flow ID</Typography>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Typography fontFamily="monospace" fontSize={13} fontWeight={700} color="#111">{publishResult.meta_flow_id}</Typography>
                  <IconButton size="small" onClick={() => navigator.clipboard.writeText(publishResult.meta_flow_id)}><CopyOutlined style={{ fontSize: 13 }} /></IconButton>
                </Stack>
              </Box>
            )}
            {publishResult?.endpoint_url && (
              <Box sx={{ p: 1.5, bgcolor: "#0d1117", borderRadius: "10px" }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" mb={0.5}>
                  <Typography fontSize={11} color="#6b7280">Dynamic Endpoint URL</Typography>
                  <IconButton size="small" onClick={() => navigator.clipboard.writeText(publishResult.endpoint_url)} sx={{ color: "#6b7280" }}>
                    <CopyOutlined style={{ fontSize: 13 }} />
                  </IconButton>
                </Stack>
                <Typography fontFamily="monospace" fontSize={11} color="#a3e635" sx={{ wordBreak: "break-all" }}>
                  {publishResult.endpoint_url}
                </Typography>
                <Typography fontSize={10.5} color="#6b7280" mt={0.75}>
                  If not auto-set, paste this in WhatsApp Manager → Flows → Settings → Endpoint
                </Typography>
              </Box>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setPublishResult(null)} variant="contained"
            sx={{ bgcolor: "#064e3b", "&:hover": { bgcolor: "#065f46" }, borderRadius: "10px", textTransform: "none", fontWeight: 700 }}>
            Done
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!toast} autoHideDuration={3000} onClose={() => setToast(null)} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
        <Alert severity={toast?.sev} onClose={() => setToast(null)} sx={{ borderRadius: "10px", boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }}>
          {toast?.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
