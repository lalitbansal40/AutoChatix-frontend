import { useState } from "react";
import {
  Box,
  Stack,
  TextField,
  Typography,
  IconButton,
  Button,
  MenuItem,
  Tabs,
  Tab,
  Alert,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";

const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"];
const METHOD_COLORS: Record<string, string> = {
  GET: "#16a34a", POST: "#2563eb", PUT: "#f59e0b",
  PATCH: "#7c3aed", DELETE: "#dc2626",
};

const fieldSx = { "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: 13 } };
const shrinkProps = { shrink: true, sx: { fontSize: 12 } };

/* ── Key-Value pair editor ── */
const KVEditor = ({
  label,
  helperText,
  value,
  onChange,
}: {
  label: string;
  helperText?: string;
  value: Record<string, string>;
  onChange: (v: Record<string, string>) => void;
}) => {
  const pairs = Object.entries(value || {});

  const update = (idx: number, k: string, v: string) => {
    const next: Record<string, string> = {};
    pairs.forEach(([pk, pv], i) => {
      next[i === idx ? k : pk] = i === idx ? v : pv;
    });
    onChange(next);
  };

  const add = () => onChange({ ...value, "": "" });

  const remove = (idx: number) => {
    const next: Record<string, string> = {};
    pairs.forEach(([k, v], i) => { if (i !== idx) next[k] = v; });
    onChange(next);
  };

  return (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
        <Box>
          <Typography fontSize={12} fontWeight={700} color="#374151">{label}</Typography>
          {helperText && <Typography fontSize={11} color="#6b7280">{helperText}</Typography>}
        </Box>
        <Button size="small" startIcon={<AddIcon />} onClick={add}
          sx={{ fontSize: 11, color: "#7c3aed", textTransform: "none" }}>
          Add
        </Button>
      </Stack>

      {pairs.length === 0 && (
        <Typography fontSize={11.5} color="#9ca3af" fontStyle="italic">No entries — click Add</Typography>
      )}

      <Stack spacing={1}>
        {pairs.map(([k, v], idx) => (
          <Stack key={idx} direction="row" spacing={1} alignItems="center">
            <TextField
              size="small" placeholder="Key" value={k}
              onChange={(e) => update(idx, e.target.value, v)}
              sx={{ ...fieldSx, flex: 1 }} InputLabelProps={shrinkProps}
            />
            <TextField
              size="small" placeholder="Value  (supports {{variable}})" value={v}
              onChange={(e) => update(idx, k, e.target.value)}
              sx={{ ...fieldSx, flex: 2 }} InputLabelProps={shrinkProps}
            />
            <IconButton size="small" onClick={() => remove(idx)}
              sx={{ color: "#dc2626", "&:hover": { bgcolor: "#fef2f2" } }}>
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </Stack>
        ))}
      </Stack>
    </Box>
  );
};

/* ── Main editor ── */
const ApiRequestEditor = ({
  node,
  updateNodeData,
}: {
  node: any;
  updateNodeData: (id: string, data: any) => void;
}) => {
  const [tab, setTab] = useState(0);
  const data = node.data || {};
  const config = data.config || {};

  const upd = (patch: Record<string, any>) =>
    updateNodeData(node.id, { config: { ...config, ...patch } });

  const method = config.method || "GET";
  const methodColor = METHOD_COLORS[method] || "#374151";

  return (
    <Stack spacing={2.5}>
      {/* Header */}
      <Stack direction="row" spacing={1.5} alignItems="center">
        <Box sx={{ width: 38, height: 38, borderRadius: "10px", bgcolor: "#f5f3ff", border: "1px solid #ddd6fe", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
          🌐
        </Box>
        <Box>
          <Typography fontSize={14} fontWeight={700}>API Request</Typography>
          <Typography fontSize={11.5} color="text.secondary">Call an external API and save the response to contact fields</Typography>
        </Box>
      </Stack>

      {/* Method + URL */}
      <Stack direction="row" spacing={1} alignItems="flex-start">
        <TextField
          select size="small" label="Method"
          value={method}
          onChange={(e) => upd({ method: e.target.value })}
          InputLabelProps={shrinkProps}
          sx={{
            width: 120, flexShrink: 0,
            "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: 13, fontWeight: 700, color: methodColor },
          }}
        >
          {METHODS.map((m) => (
            <MenuItem key={m} value={m} sx={{ fontSize: 13, fontWeight: 700, color: METHOD_COLORS[m] }}>{m}</MenuItem>
          ))}
        </TextField>

        <TextField
          fullWidth size="small" label="Request URL *"
          value={config.url || ""}
          onChange={(e) => upd({ url: e.target.value })}
          placeholder="https://api.example.com/endpoint  (supports {{variables}})"
          sx={fieldSx} InputLabelProps={shrinkProps}
        />
      </Stack>

      {/* Tabs */}
      <Box sx={{ borderBottom: "1px solid #e5e7eb" }}>
        <Tabs
          value={tab} onChange={(_, v) => setTab(v)}
          sx={{ minHeight: 36, "& .MuiTab-root": { minHeight: 36, fontSize: 12, fontWeight: 600, textTransform: "none", py: 0 } }}
        >
          <Tab label="Headers" />
          <Tab label={method !== "GET" ? "Body" : "Params"} />
          <Tab label="Response → Save" />
        </Tabs>
      </Box>

      {/* Tab: Headers */}
      {tab === 0 && (
        <KVEditor
          label="Request Headers"
          helperText="e.g. Authorization = Bearer {{token}}"
          value={config.headers || {}}
          onChange={(v) => upd({ headers: v })}
        />
      )}

      {/* Tab: Body / Params */}
      {tab === 1 && (
        <Box>
          {method === "GET" ? (
            <KVEditor
              label="Query Parameters"
              helperText="Added to URL as ?key=value"
              value={config.params || {}}
              onChange={(v) => upd({ params: v })}
            />
          ) : (
            <Box>
              <Typography fontSize={12} fontWeight={700} color="#374151" mb={0.5}>Request Body (JSON)</Typography>
              <Typography fontSize={11} color="#6b7280" mb={1}>Supports {"{{variables}}"} inside string values.</Typography>
              <TextField
                fullWidth multiline rows={6}
                size="small"
                placeholder={'{\n  "name": "{{contact.name}}",\n  "phone": "{{contact.phone}}"\n}'}
                value={
                  typeof config.body === "string"
                    ? config.body
                    : config.body
                    ? JSON.stringify(config.body, null, 2)
                    : ""
                }
                onChange={(e) => {
                  const raw = e.target.value;
                  try {
                    upd({ body: JSON.parse(raw) });
                  } catch {
                    upd({ body: raw }); // keep as string if invalid JSON
                  }
                }}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: 12, fontFamily: "monospace" } }}
                InputLabelProps={shrinkProps}
              />
            </Box>
          )}
        </Box>
      )}

      {/* Tab: Response mapping */}
      {tab === 2 && (
        <Box>
          <KVEditor
            label="Save Response Fields to Contact"
            helperText="Left = variable name · Right = JSON path in response (e.g. data.user.id)"
            value={config.response_map || {}}
            onChange={(v) => upd({ response_map: v })}
          />

          {Object.keys(config.response_map || {}).length > 0 && (
            <Alert severity="success" sx={{ mt: 2, fontSize: 11.5, borderRadius: "8px" }}>
              Saved fields are available as <strong>{"{{variable_name}}"}</strong> in all subsequent nodes and also stored in the contact's attributes.
            </Alert>
          )}

          <Box sx={{ mt: 2, p: 1.5, bgcolor: "#f5f3ff", borderRadius: "8px", border: "1px solid #ddd6fe" }}>
            <Typography fontSize={11.5} fontWeight={700} color="#5b21b6" mb={0.5}>Example</Typography>
            <Typography fontSize={11} color="#6b7280" lineHeight={1.7}>
              API returns: <code style={{ fontSize: 10.5 }}>{`{ "data": { "order_id": "ORD123", "total": 499 } }`}</code><br />
              Map: <code style={{ fontSize: 10.5 }}>order_id → data.order_id</code> &nbsp; <code style={{ fontSize: 10.5 }}>total → data.total</code><br />
              Use in nodes: <code style={{ fontSize: 10.5 }}>{`{{order_id}}`}</code> &nbsp; <code style={{ fontSize: 10.5 }}>{`{{total}}`}</code>
            </Typography>
          </Box>
        </Box>
      )}
    </Stack>
  );
};

export default ApiRequestEditor;
