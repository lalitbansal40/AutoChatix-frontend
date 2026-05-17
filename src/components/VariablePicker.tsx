import {
  Box,
  Chip,
  Divider,
  IconButton,
  Popover,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import DataObjectIcon from "@mui/icons-material/DataObject";
import { useQuery } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { contactAttributeService, ContactAttribute } from "service/contactAttribute.service";

const FORMAT_BUTTONS = [
  { key: "bold",    title: "Bold (*text*)",          marker: "*",   display: "B",  sx: { fontWeight: 800, fontSize: 13 } },
  { key: "italic",  title: "Italic (_text_)",         marker: "_",   display: "I",  sx: { fontStyle: "italic", fontSize: 13 } },
  { key: "strike",  title: "Strikethrough (~text~)",  marker: "~",   display: "S",  sx: { textDecoration: "line-through", fontSize: 13 } },
  { key: "mono",    title: "Monospace (```text```)",  marker: "```", display: "</>",sx: { fontFamily: "monospace", fontSize: 11, letterSpacing: -0.3 } },
];

const SYSTEM_VARS: { label: string; value: string; color: string; bg: string }[] = [
  { label: "contact.name",  value: "{{contact.name}}",  color: "#16a34a", bg: "#f0fdf4" },
  { label: "contact.phone", value: "{{contact.phone}}", color: "#16a34a", bg: "#f0fdf4" },
];

interface VariablePickerProps {
  value: string;
  onChange: (val: string) => void;
  label?: string;
  placeholder?: string;
  rows?: number;
  multiline?: boolean;
  helperText?: string;
  size?: "small" | "medium";
  fullWidth?: boolean;
}

const VariablePicker = ({
  value,
  onChange,
  label,
  placeholder,
  rows = 4,
  multiline = true,
  helperText,
  size = "medium",
  fullWidth = true,
}: VariablePickerProps) => {
  const inputRef = useRef<HTMLTextAreaElement | HTMLInputElement>(null);
  const [anchor, setAnchor] = useState<HTMLButtonElement | null>(null);

  const { data: attributes = [] } = useQuery<ContactAttribute[]>({
    queryKey: ["contact-attributes"],
    queryFn: async () => {
      const res = await contactAttributeService.getAttributes();
      return res.data || [];
    },
    staleTime: 60_000,
  });

  const applyFormat = (marker: string) => {
    const el = inputRef.current;
    if (!el) return;
    const start = el.selectionStart ?? 0;
    const end   = el.selectionEnd   ?? 0;
    const selected = value.slice(start, end);
    if (selected) {
      const next = value.slice(0, start) + marker + selected + marker + value.slice(end);
      onChange(next);
      setTimeout(() => {
        el.focus();
        el.setSelectionRange(start + marker.length, end + marker.length);
      }, 0);
    } else {
      const next = value.slice(0, start) + marker + marker + value.slice(start);
      onChange(next);
      setTimeout(() => {
        el.focus();
        const pos = start + marker.length;
        el.setSelectionRange(pos, pos);
      }, 0);
    }
  };

  const insertVar = (variable: string) => {
    const el = inputRef.current;
    if (!el) {
      onChange(value + variable);
      return;
    }
    const start = el.selectionStart ?? value.length;
    const end = el.selectionEnd ?? value.length;
    const next = value.slice(0, start) + variable + value.slice(end);
    onChange(next);
    // restore focus + cursor after React re-render
    setTimeout(() => {
      el.focus();
      const pos = start + variable.length;
      el.setSelectionRange(pos, pos);
    }, 0);
    setAnchor(null);
  };

  return (
    <Box sx={{ position: "relative" }}>
      {/* ── Formatting toolbar (multiline only) ── */}
      {multiline && (
        <Box
          sx={{
            display: "flex", alignItems: "center", gap: 0.25,
            mb: 0.5, px: 0.5,
          }}
        >
          {FORMAT_BUTTONS.map((btn) => (
            <Tooltip key={btn.key} title={btn.title} placement="top">
              <IconButton
                size="small"
                onMouseDown={(e) => {
                  e.preventDefault(); // keep textarea focus + selection intact
                  applyFormat(btn.marker);
                }}
                sx={{
                  width: 28, height: 28, borderRadius: "6px",
                  color: "#6b7280",
                  "&:hover": { bgcolor: "#f3f4f6", color: "#111827" },
                }}
              >
                <Typography component="span" sx={{ lineHeight: 1, userSelect: "none", ...btn.sx }}>
                  {btn.display}
                </Typography>
              </IconButton>
            </Tooltip>
          ))}
          <Box sx={{ width: "1px", height: 16, bgcolor: "#e5e7eb", mx: 0.5 }} />
          <Tooltip title="WhatsApp formatting: *bold* _italic_ ~strike~ ```mono```" placement="top">
            <Typography sx={{ fontSize: 10, color: "#9ca3af", cursor: "default", userSelect: "none" }}>
              WA format
            </Typography>
          </Tooltip>
        </Box>
      )}

      <TextField
        fullWidth={fullWidth}
        multiline={multiline}
        rows={rows}
        size={size}
        label={label}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        helperText={helperText}
        inputRef={inputRef}
        sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px", fontSize: 13, pr: "44px" } }}
        InputProps={{
          endAdornment: (
            <Box
              sx={{
                position: "absolute",
                right: 8,
                top: multiline ? 8 : "50%",
                transform: multiline ? "none" : "translateY(-50%)",
              }}
            >
              <Tooltip title="Insert variable">
                <IconButton
                  size="small"
                  onClick={(e) => setAnchor(e.currentTarget)}
                  sx={{
                    color: anchor ? "#6366f1" : "#9ca3af",
                    bgcolor: anchor ? "#eef2ff" : "transparent",
                    "&:hover": { color: "#6366f1", bgcolor: "#eef2ff" },
                  }}
                >
                  <DataObjectIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
            </Box>
          ),
        }}
      />

      <Popover
        open={!!anchor}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        PaperProps={{
          sx: {
            borderRadius: "12px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.14)",
            border: "1px solid #e5e7eb",
            minWidth: 240,
            maxWidth: 300,
            p: 1.5,
          },
        }}
      >
        {/* System vars */}
        <Typography sx={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.5, mb: 0.75, px: 0.5 }}>
          System
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.6, mb: 1 }}>
          {SYSTEM_VARS.map((v) => (
            <Chip
              key={v.value}
              label={v.label}
              size="small"
              onClick={() => insertVar(v.value)}
              sx={{
                bgcolor: v.bg, color: v.color, fontWeight: 700,
                fontFamily: "monospace", fontSize: 11,
                cursor: "pointer", height: 24,
                "&:hover": { filter: "brightness(0.93)" },
              }}
            />
          ))}
        </Box>

        {attributes.length > 0 && (
          <>
            <Divider sx={{ my: 1 }} />
            <Typography sx={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.5, mb: 0.75, px: 0.5 }}>
              Contact Fields
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.6 }}>
              {attributes.map((attr) => (
                <Chip
                  key={attr.id}
                  label={attr.name}
                  size="small"
                  onClick={() => insertVar(`{{attributes.${attr.id}}}`)}
                  sx={{
                    bgcolor: "#f5f3ff", color: "#6d28d9", fontWeight: 600,
                    fontSize: 11, cursor: "pointer", height: 24,
                    "&:hover": { filter: "brightness(0.93)" },
                  }}
                />
              ))}
            </Box>
          </>
        )}
      </Popover>
    </Box>
  );
};

export default VariablePicker;
