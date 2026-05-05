import {
  Box,
  TextField,
  Button,
  Typography,
  MenuItem,
  Divider,
  Chip,
  Stack,
  IconButton,
  Grid,
  Paper,
} from "@mui/material";
import { DeleteOutlined, PlusOutlined, FileExcelOutlined } from "@ant-design/icons";

/* ─── variable suggestions derived from sibling set_contact_attribute nodes ─── */
const STATIC_VARS = [
  "{{contact.name}}",
  "{{contact.phone}}",
];

const getAttributeVars = (allNodes: any[]): string[] => {
  const attrs: string[] = [];
  (allNodes || []).forEach((n: any) => {
    const keys: string[] =
      n.data?.config?.key ||
      (n.data?.attribute_name ? (Array.isArray(n.data.attribute_name) ? n.data.attribute_name : [n.data.attribute_name]) : []);
    keys.forEach((k: string) => {
      if (k && !attrs.includes(`{{attributes.${k}}}`)) {
        attrs.push(`{{attributes.${k}}}`);
      }
    });
  });
  return attrs;
};

/* ─── helpers ─── */
const mapToRows = (map: Record<string, string>): { col: string; val: string }[] =>
  Object.entries(map || {}).map(([col, val]) => ({ col, val }));

const rowsToMap = (rows: { col: string; val: string }[]): Record<string, string> =>
  Object.fromEntries(rows.map((r) => [r.col, r.val]));

const GoogleSheetEditor = ({ node, updateNodeData, allNodes }: any) => {
  const data = node?.data || {};

  const rows: { col: string; val: string }[] = mapToRows(data.map || {});
  const attrVars = getAttributeVars(allNodes);
  const allVars = [...STATIC_VARS, ...attrVars];

  /* ─── map row helpers ─── */
  const updateRow = (i: number, field: "col" | "val", value: string) => {
    const updated = rows.map((r, idx) => (idx === i ? { ...r, [field]: value } : r));
    updateNodeData(node.id, { map: rowsToMap(updated) });
  };

  const addRow = () => {
    const updated = [...rows, { col: "", val: "" }];
    updateNodeData(node.id, { map: rowsToMap(updated) });
  };

  const deleteRow = (i: number) => {
    const updated = rows.filter((_, idx) => idx !== i);
    updateNodeData(node.id, { map: rowsToMap(updated) });
  };

  const appendVarToLastFocused = (variable: string, rowIdx: number) => {
    const current = rows[rowIdx]?.val || "";
    updateRow(rowIdx, "val", current + variable);
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>

      {/* ─── HEADER ─── */}
      <Stack direction="row" spacing={1.5} alignItems="center">
        <Box
          sx={{
            width: 36, height: 36, borderRadius: 1.5,
            bgcolor: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <FileExcelOutlined style={{ fontSize: 20, color: "#16a34a" }} />
        </Box>
        <Box>
          <Typography variant="h6" lineHeight={1.2}>Google Sheets</Typography>
          <Typography variant="caption" color="text.secondary">Write data into a spreadsheet row</Typography>
        </Box>
      </Stack>

      <Divider />

      {/* ─── SECTION 1: SPREADSHEET ─── */}
      <Box>
        <Typography variant="subtitle2" mb={1.5}>Spreadsheet Settings</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Spreadsheet URL or ID"
              placeholder="Paste full URL or just the ID"
              value={data.spreadsheet_id || ""}
              helperText="Paste the full sheet URL (e.g. https://docs.google.com/spreadsheets/d/…/edit) or only the ID — both work."
              onChange={(e) => updateNodeData(node.id, { spreadsheet_id: e.target.value })}
            />
          </Grid>

          <Grid item xs={8}>
            <TextField
              fullWidth
              label="Sheet / Tab Name"
              placeholder="Sheet1"
              value={data.sheet_name || ""}
              onChange={(e) => updateNodeData(node.id, { sheet_name: e.target.value })}
            />
          </Grid>

          <Grid item xs={4}>
            <TextField
              select
              fullWidth
              label="Action"
              value={data.action || "create"}
              onChange={(e) => updateNodeData(node.id, { action: e.target.value })}
            >
              <MenuItem value="create">➕ Add Row</MenuItem>
              <MenuItem value="update">✏️ Update Row</MenuItem>
              <MenuItem value="find">🔍 Find Row</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </Box>

      <Divider />

      {/* ─── SECTION 2: COLUMN MAPPING ─── */}
      <Box>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
          <Box>
            <Typography variant="subtitle2">Column Mapping</Typography>
            <Typography variant="caption" color="text.secondary">
              Map sheet columns to contact data or attributes
            </Typography>
          </Box>
          <Button
            size="small"
            variant="outlined"
            startIcon={<PlusOutlined />}
            onClick={addRow}
          >
            Add Column
          </Button>
        </Stack>

        {rows.length === 0 && (
          <Paper
            variant="outlined"
            sx={{ p: 3, textAlign: "center", borderStyle: "dashed", borderRadius: 2 }}
          >
            <Typography variant="body2" color="text.secondary">
              No columns mapped yet. Click "Add Column" to start.
            </Typography>
          </Paper>
        )}

        <Stack spacing={1.5}>
          {rows.map((row, i) => (
            <Paper key={i} variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
              <Grid container spacing={1.5} alignItems="flex-start">

                {/* COLUMN NAME */}
                <Grid item xs={4}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Sheet Column"
                    placeholder="e.g. Name"
                    value={row.col}
                    onChange={(e) => updateRow(i, "col", e.target.value)}
                  />
                </Grid>

                {/* VARIABLE VALUE */}
                <Grid item xs={7}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Value / Variable"
                    placeholder="{{contact.name}}"
                    value={row.val}
                    onChange={(e) => updateRow(i, "val", e.target.value)}
                  />
                  {/* Quick-insert variable chips */}
                  <Box display="flex" flexWrap="wrap" gap={0.5} mt={0.75}>
                    {allVars.map((v) => (
                      <Chip
                        key={v}
                        label={v}
                        size="small"
                        variant="outlined"
                        clickable
                        sx={{ fontSize: 10, height: 20, cursor: "pointer" }}
                        onClick={() => appendVarToLastFocused(v, i)}
                      />
                    ))}
                  </Box>
                </Grid>

                {/* DELETE */}
                <Grid item xs={1} display="flex" alignItems="center" justifyContent="center">
                  <IconButton size="small" color="error" onClick={() => deleteRow(i)}>
                    <DeleteOutlined />
                  </IconButton>
                </Grid>

              </Grid>
            </Paper>
          ))}
        </Stack>
      </Box>

      <Divider />

      {/* ─── SECTION 3: VARIABLE REFERENCE ─── */}
      <Box>
        <Typography variant="subtitle2" mb={1}>Available Variables</Typography>
        <Box display="flex" flexWrap="wrap" gap={1}>
          {allVars.map((v) => (
            <Chip
              key={v}
              label={v}
              size="small"
              color={v.startsWith("{{attributes") ? "primary" : "default"}
              variant="outlined"
              sx={{ fontFamily: "monospace", fontSize: 11 }}
            />
          ))}
          {allVars.length === 0 && (
            <Typography variant="caption" color="text.secondary">
              Add "Set Contact Attribute" nodes to see attribute variables here.
            </Typography>
          )}
        </Box>
      </Box>

    </Box>
  );
};

export default GoogleSheetEditor;
