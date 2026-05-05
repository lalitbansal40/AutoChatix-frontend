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
import { useEffect, useRef, useState } from "react";
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

   IMPORTANT: state is held as an ORDERED ARRAY of rows
   internally so that:
     • two rows with the same (or empty) key never collapse
     • typing into one row never reorders/loses another row
     • rows preserve identity across re-renders (stable React keys)

   We sync the external object → array only when the parent
   value object changes by KEY SET (i.e. real edits from
   outside), not on every render.
───────────────────────────────────────────────────────── */
type KvRow = { id: string; k: string; v: string };

const objectToRows = (obj: Record<string, any> | undefined): KvRow[] =>
  Object.entries(obj || {}).map(([k, v], i) => ({
    id: `${i}-${k}`,
    k,
    v: v === null || v === undefined ? "" : String(v),
  }));

const rowsToObject = (rows: KvRow[]): Record<string, string> => {
  // Last write wins on duplicate keys; empty keys are dropped.
  const out: Record<string, string> = {};
  for (const r of rows) {
    const key = (r.k || "").trim();
    if (!key) continue;
    out[key] = r.v ?? "";
  }
  return out;
};

let __kvRowSeq = 0;
const newRow = (): KvRow => ({ id: `kv_${++__kvRowSeq}_${Date.now()}`, k: "", v: "" });

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
  const [rows, setRows] = useState<KvRow[]>(() => objectToRows(value));

  // Sync from parent ONLY when the external key set changes (e.g. user
  // loaded a different node). This prevents wiping local typed-but-empty
  // rows on every parent re-render.
  const externalKeysRef = useRef<string>("");
  useEffect(() => {
    const externalKeys = Object.keys(value || {})
      .sort()
      .join("|");
    if (externalKeys !== externalKeysRef.current) {
      externalKeysRef.current = externalKeys;
      // Merge: keep our local order/rows, but pick up any new keys we
      // don't have. (Only run on truly external changes — e.g. node load.)
      setRows((prev) => {
        const localObj = rowsToObject(prev);
        const same =
          Object.keys(localObj).length === Object.keys(value || {}).length &&
          Object.keys(localObj).every((k) => (value || {})[k] === localObj[k]);
        if (same) return prev;
        return objectToRows(value);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const commit = (next: KvRow[]) => {
    setRows(next);
    onChange(rowsToObject(next));
  };

  const setRow = (id: string, partial: Partial<KvRow>) => {
    commit(rows.map((r) => (r.id === id ? { ...r, ...partial } : r)));
  };

  const addRow = () => commit([...rows, newRow()]);
  const delRow = (id: string) => commit(rows.filter((r) => r.id !== id));

  return (
    <Stack spacing={0.5}>
      {rows.length > 0 && (
        <Stack direction="row" spacing={0.75} alignItems="center" sx={{ pl: 0.25 }}>
          <Typography sx={{ flex: 1, fontSize: 10.5, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.4 }}>
            Sheet column
          </Typography>
          <Box sx={{ width: 18 }} />
          <Typography sx={{ flex: 2, fontSize: 10.5, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.4 }}>
            Value or {`{{variable}}`}
          </Typography>
          <Box sx={{ width: 28 }} />
        </Stack>
      )}

      {rows.map((r) => (
        <Stack key={r.id} direction="row" spacing={0.75} alignItems="center">
          <TextField
            size="small"
            placeholder="e.g. Phone"
            value={r.k}
            onChange={(e) => setRow(r.id, { k: e.target.value })}
            disabled={!!fixedKeys}
            sx={{ flex: 1, "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: 13 } }}
          />
          <Typography sx={{ color: "#9ca3af", fontSize: 14 }}>=</Typography>
          <TextField
            size="small"
            placeholder={placeholder || "Lalit Bansal or {{contact.name}}"}
            value={r.v}
            onChange={(e) => setRow(r.id, { v: e.target.value })}
            sx={{ flex: 2, "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: 13 } }}
          />
          <IconButton size="small" onClick={() => delRow(r.id)} sx={{ color: "#ef4444" }}>
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
          mt: 0.25,
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
