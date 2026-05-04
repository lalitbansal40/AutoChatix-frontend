import {
  Box,
  TextField,
  MenuItem,
  Typography,
  Switch,
  IconButton,
  Stack,
  Button,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { FieldDef } from "types/integration";

/* ─────────────────────────────────────────────────────────
   Decide whether a field should be shown based on
   `visibleWhen: { field, equals }`.
───────────────────────────────────────────────────────── */
const isFieldVisible = (
  field: FieldDef,
  values: Record<string, any>
): boolean => {
  if (!field.visibleWhen) return true;
  const { field: depField, equals } = field.visibleWhen;
  const current = values?.[depField];
  const match = Array.isArray(equals) ? equals.includes(current) : current === equals;
  return !!match;
};

const SectionLabel = ({
  children,
  helper,
}: {
  children: any;
  helper?: string;
}) => (
  <Box sx={{ mb: 0.5 }}>
    <Typography
      sx={{
        fontSize: 11,
        fontWeight: 700,
        color: "#374151",
        textTransform: "uppercase",
        letterSpacing: 0.5,
      }}
    >
      {children}
    </Typography>
    {helper && (
      <Typography sx={{ fontSize: 11, color: "#9ca3af", mt: 0.25 }}>
        {helper}
      </Typography>
    )}
  </Box>
);

/* ─────────────────────────────────────────────────────────
   key_value editor — { col: "value template" } pairs.
───────────────────────────────────────────────────────── */
const KeyValueEditor = ({
  value = {},
  onChange,
  placeholder,
  fixedKeys,
}: {
  value: Record<string, string>;
  onChange: (v: Record<string, string>) => void;
  placeholder?: string;
  fixedKeys?: string[];
}) => {
  const rows: { k: string; v: string }[] = Object.entries(value || {}).map(
    ([k, v]) => ({ k, v: String(v ?? "") })
  );

  const setRow = (i: number, partial: Partial<{ k: string; v: string }>) => {
    const next = rows.map((r, idx) => (idx === i ? { ...r, ...partial } : r));
    onChange(Object.fromEntries(next.map((r) => [r.k, r.v])));
  };

  const addRow = () => {
    const next = [...rows, { k: "", v: "" }];
    onChange(Object.fromEntries(next.map((r) => [r.k, r.v])));
  };

  const delRow = (i: number) => {
    const next = rows.filter((_, idx) => idx !== i);
    onChange(Object.fromEntries(next.map((r) => [r.k, r.v])));
  };

  return (
    <Stack spacing={0.75}>
      {rows.map((r, i) => (
        <Stack key={i} direction="row" spacing={0.75} alignItems="center">
          <TextField
            size="small"
            placeholder="column"
            value={r.k}
            onChange={(e) => setRow(i, { k: e.target.value })}
            disabled={!!fixedKeys}
            sx={{ flex: 1, "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: 13 } }}
          />
          <Typography sx={{ color: "#9ca3af", fontSize: 14 }}>=</Typography>
          <TextField
            size="small"
            placeholder={placeholder || "{{value}}"}
            value={r.v}
            onChange={(e) => setRow(i, { v: e.target.value })}
            sx={{ flex: 2, "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: 13 } }}
          />
          <IconButton size="small" onClick={() => delRow(i)} sx={{ color: "#ef4444" }}>
            <DeleteOutlineIcon fontSize="small" />
          </IconButton>
        </Stack>
      ))}
      <Button
        size="small"
        startIcon={<AddIcon />}
        onClick={addRow}
        sx={{
          alignSelf: "flex-start",
          textTransform: "none",
          fontSize: 12,
          color: "#16a34a",
          "&:hover": { bgcolor: "#f0fdf4" },
        }}
      >
        Add row
      </Button>
    </Stack>
  );
};

/* ─────────────────────────────────────────────────────────
   Single field renderer
───────────────────────────────────────────────────────── */
export const DynamicField = ({
  field,
  value,
  onChange,
}: {
  field: FieldDef;
  value: any;
  onChange: (v: any) => void;
}) => {
  const interp = field.supportsInterpolation;
  const baseSx = {
    "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: 13 },
  };
  const helper = [
    field.helperText,
    interp ? "Supports {{variables}}" : undefined,
  ]
    .filter(Boolean)
    .join(" · ");

  switch (field.type) {
    case "select":
      return (
        <Box>
          <SectionLabel helper={helper}>{field.label}{field.required ? " *" : ""}</SectionLabel>
          <TextField
            select
            fullWidth
            size="small"
            value={value ?? field.defaultValue ?? ""}
            onChange={(e) => onChange(e.target.value)}
            sx={baseSx}
          >
            {(field.options || []).map((opt) => (
              <MenuItem key={opt} value={opt}>
                {opt}
              </MenuItem>
            ))}
          </TextField>
        </Box>
      );

    case "textarea":
      return (
        <Box>
          <SectionLabel helper={helper}>{field.label}{field.required ? " *" : ""}</SectionLabel>
          <TextField
            fullWidth
            multiline
            minRows={2}
            maxRows={6}
            size="small"
            value={value ?? field.defaultValue ?? ""}
            placeholder={field.placeholder}
            onChange={(e) => onChange(e.target.value)}
            sx={baseSx}
          />
        </Box>
      );

    case "number":
      return (
        <Box>
          <SectionLabel helper={helper}>{field.label}{field.required ? " *" : ""}</SectionLabel>
          <TextField
            fullWidth
            size="small"
            type="text"
            value={value ?? field.defaultValue ?? ""}
            placeholder={field.placeholder}
            onChange={(e) => onChange(e.target.value)}
            sx={baseSx}
          />
        </Box>
      );

    case "boolean":
      return (
        <Stack direction="row" spacing={1} alignItems="center" sx={{ py: 0.5 }}>
          <Switch checked={!!value} onChange={(e) => onChange(e.target.checked)} />
          <Box>
            <Typography fontSize={13} fontWeight={600}>{field.label}</Typography>
            {field.helperText && (
              <Typography fontSize={11} color="text.secondary">{field.helperText}</Typography>
            )}
          </Box>
        </Stack>
      );

    case "key_value":
      return (
        <Box>
          <SectionLabel helper={helper}>{field.label}{field.required ? " *" : ""}</SectionLabel>
          <KeyValueEditor
            value={value || {}}
            onChange={onChange}
            fixedKeys={field.fixedKeys}
            placeholder={field.placeholder}
          />
        </Box>
      );

    case "json":
      return (
        <Box>
          <SectionLabel helper={helper}>{field.label}{field.required ? " *" : ""}</SectionLabel>
          <TextField
            fullWidth
            multiline
            minRows={4}
            size="small"
            value={typeof value === "string" ? value : JSON.stringify(value ?? {}, null, 2)}
            placeholder={field.placeholder || "{ }"}
            onChange={(e) => onChange(e.target.value)}
            sx={{ ...baseSx, "& .MuiInputBase-input": { fontFamily: "monospace", fontSize: 12 } }}
          />
        </Box>
      );

    case "password":
      return (
        <Box>
          <SectionLabel helper={helper}>{field.label}{field.required ? " *" : ""}</SectionLabel>
          <TextField
            fullWidth
            size="small"
            type="password"
            value={value ?? ""}
            placeholder={field.placeholder}
            onChange={(e) => onChange(e.target.value)}
            sx={baseSx}
          />
        </Box>
      );

    /* text | url | email | default */
    default:
      return (
        <Box>
          <SectionLabel helper={helper}>{field.label}{field.required ? " *" : ""}</SectionLabel>
          <TextField
            fullWidth
            size="small"
            value={value ?? field.defaultValue ?? ""}
            placeholder={field.placeholder}
            onChange={(e) => onChange(e.target.value)}
            sx={baseSx}
          />
        </Box>
      );
  }
};

/* ─────────────────────────────────────────────────────────
   Form: render an array of FieldDef as a vertical form,
   honoring `visibleWhen` rules.
───────────────────────────────────────────────────────── */
export const DynamicFieldForm = ({
  schema,
  values,
  onChange,
}: {
  schema: FieldDef[];
  values: Record<string, any>;
  onChange: (next: Record<string, any>) => void;
}) => {
  const set = (key: string, v: any) => onChange({ ...values, [key]: v });

  return (
    <Stack spacing={1.5}>
      {(schema || [])
        .filter((f) => isFieldVisible(f, values))
        .map((f) => (
          <DynamicField
            key={f.key}
            field={f}
            value={values?.[f.key]}
            onChange={(v) => set(f.key, v)}
          />
        ))}
    </Stack>
  );
};
