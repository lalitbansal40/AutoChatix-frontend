import {
  Box,
  TextField,
  MenuItem,
  Typography,
  Checkbox,
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

type LineItemRow = {
  id: string;
  name: string;
  qty: string;
  price: string;
};

const parseLineItems = (value: any): any[] => {
  if (Array.isArray(value)) return value;
  if (typeof value !== "string") return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

let __lineItemSeq = 0;
const newLineItem = (): LineItemRow => ({
  id: `line_${++__lineItemSeq}_${Date.now()}`,
  name: "",
  qty: "1",
  price: "",
});

const lineItemsToRows = (value: any): LineItemRow[] =>
  parseLineItems(value).map((item, i) => ({
    id: item.id || `line_${i}`,
    name: item.name || item.label || "",
    qty: String(item.qty ?? item.quantity ?? 1),
    price: String(item.price ?? item.item_price ?? item.amount ?? ""),
  }));

const rowsToLineItems = (rows: LineItemRow[]) =>
  rows
    .map(({ name, qty, price }) => ({
      name: name.trim(),
      qty: qty || "1",
      price: price || "",
    }))
    .filter((row) => row.name || row.price);

const LineItemsEditor = ({
  value,
  onChange,
  placeholder,
}: {
  value: any;
  onChange: (v: any[]) => void;
  placeholder?: string;
}) => {
  const [rows, setRows] = useState<LineItemRow[]>(() => {
    const parsed = lineItemsToRows(value);
    return parsed.length ? parsed : [newLineItem()];
  });

  useEffect(() => {
    const parsed = lineItemsToRows(value);
    if (parsed.length) setRows(parsed);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(value || [])]);

  const commit = (next: LineItemRow[]) => {
    setRows(next);
    onChange(rowsToLineItems(next));
  };

  const setRow = (id: string, patch: Partial<LineItemRow>) => {
    commit(rows.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  };

  return (
    <Stack spacing={0.75}>
      <Stack direction="row" spacing={0.75} alignItems="center" sx={{ pl: 0.25 }}>
        <Typography sx={{ flex: 2, fontSize: 10.5, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.4 }}>
          Name
        </Typography>
        <Typography sx={{ width: 72, fontSize: 10.5, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.4 }}>
          Qty
        </Typography>
        <Typography sx={{ flex: 1, fontSize: 10.5, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.4 }}>
          Price
        </Typography>
        <Box sx={{ width: 28 }} />
      </Stack>

      {rows.map((row) => (
        <Stack key={row.id} direction="row" spacing={0.75} alignItems="center">
          <TextField
            size="small"
            placeholder={placeholder || "Item name"}
            value={row.name}
            onChange={(e) => setRow(row.id, { name: e.target.value })}
            sx={{ flex: 2, "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: 13 } }}
          />
          <TextField
            size="small"
            value={row.qty}
            onChange={(e) => setRow(row.id, { qty: e.target.value })}
            sx={{ width: 72, "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: 13 } }}
          />
          <TextField
            size="small"
            placeholder="₹"
            value={row.price}
            onChange={(e) => setRow(row.id, { price: e.target.value })}
            sx={{ flex: 1, "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: 13 } }}
          />
          <IconButton
            size="small"
            onClick={() => commit(rows.length > 1 ? rows.filter((r) => r.id !== row.id) : [newLineItem()])}
            sx={{ color: "#ef4444" }}
          >
            <DeleteOutlineIcon fontSize="small" />
          </IconButton>
        </Stack>
      ))}

      <Button
        size="small"
        startIcon={<AddIcon />}
        onClick={() => commit([...rows, newLineItem()])}
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
        <Stack direction="row" spacing={1} alignItems="flex-start" sx={{ py: 0.5 }}>
          <Checkbox
            checked={!!value}
            onChange={(e) => onChange(e.target.checked)}
            sx={{
              p: 0,
              color: "#9ca3af",
              "&.Mui-checked": { color: "#25D366" },
            }}
          />
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

    case "line_items":
      return (
        <Box>
          <SectionLabel helper={helper}>{field.label}{field.required ? " *" : ""}</SectionLabel>
          <LineItemsEditor
            value={value ?? field.defaultValue ?? []}
            onChange={onChange}
            placeholder={field.placeholder}
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
