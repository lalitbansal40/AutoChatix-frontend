import {
  Box,
  TextField,
  IconButton,
  Typography,
  Stack,
  Divider,
  Button,
  Paper
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import AddIcon from "@mui/icons-material/Add";

const COMMON_VARS = [
  "{{contact.name}}",
  "{{contact.phone}}",
];

const SetContactAttributeEditor = ({ node, updateNodeData }: any) => {
  const data = node.data || {};

  const names: string[] = Array.isArray(data.attribute_name)
    ? data.attribute_name
    : [data.attribute_name || ""];

  const values: string[] = Array.isArray(data.attribute_value)
    ? data.attribute_value
    : [data.attribute_value || ""];

  const updatePair = (index: number, key: "name" | "value", val: string) => {
    const newNames = [...names];
    const newValues = [...values];
    if (key === "name") newNames[index] = val;
    else newValues[index] = val;
    updateNodeData(node.id, { attribute_name: newNames, attribute_value: newValues });
  };

  const addField = () => {
    updateNodeData(node.id, {
      attribute_name: [...names, ""],
      attribute_value: [...values, ""],
    });
  };

  const removeField = (index: number) => {
    updateNodeData(node.id, {
      attribute_name: names.filter((_: any, i: number) => i !== index),
      attribute_value: values.filter((_: any, i: number) => i !== index),
    });
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>

      {/* ─ Header ─ */}
      <Stack direction="row" spacing={1.5} alignItems="center">
        <Box sx={{ width: 38, height: 38, borderRadius: "10px", bgcolor: "#fffbeb", border: "1px solid #fde68a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
          🏷️
        </Box>
        <Box>
          <Typography sx={{ fontSize: 15, fontWeight: 700, lineHeight: 1.2 }}>Set Contact Attribute</Typography>
          <Typography variant="caption" color="text.secondary">Store data against the contact for later use</Typography>
        </Box>
      </Stack>

      <Divider />

      {/* ─ Pairs ─ */}
      <Box>
        {/* Column labels */}
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 36px", gap: 1, mb: 1, px: 0.5 }}>
          <Typography sx={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5 }}>
            Attribute Key
          </Typography>
          <Typography sx={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5 }}>
            Value
          </Typography>
          <Box />
        </Box>

        <Stack spacing={1}>
          {names.map((name: string, index: number) => (
            <Paper
              key={index}
              variant="outlined"
              sx={{ borderRadius: "10px", p: 1.5, borderColor: "#e5e7eb", bgcolor: index % 2 === 0 ? "#fff" : "#fafafa" }}
            >
              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 36px", gap: 1, alignItems: "center" }}>
                {/* Key */}
                <TextField
                  size="small"
                  placeholder="e.g. cabin_size"
                  value={name}
                  onChange={(e) => updatePair(index, "name", e.target.value)}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px", fontFamily: "monospace", fontSize: 12 } }}
                />

                {/* Value */}
                <TextField
                  size="small"
                  placeholder="value or {{variable}}"
                  value={values[index] || ""}
                  onChange={(e) => updatePair(index, "value", e.target.value)}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px", fontFamily: "monospace", fontSize: 12 } }}
                />

                {/* Delete */}
                <IconButton
                  size="small"
                  onClick={() => removeField(index)}
                  disabled={names.length === 1}
                  sx={{ color: "#ef4444", "&:hover": { bgcolor: "#fef2f2" }, "&.Mui-disabled": { color: "#d1d5db" } }}
                >
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              </Box>

              {/* Quick-insert variable chips */}
              <Stack direction="row" spacing={0.75} mt={1} flexWrap="wrap" useFlexGap>
                {COMMON_VARS.map((v) => (
                  <Box
                    key={v}
                    onClick={() => updatePair(index, "value", v)}
                    sx={{
                      px: 1, py: 0.25, borderRadius: "20px", fontSize: 10,
                      bgcolor: "#f5f3ff", color: "#6d28d9", fontFamily: "monospace",
                      border: "1px solid #ede9fe", cursor: "pointer",
                      "&:hover": { bgcolor: "#ede9fe" },
                    }}
                  >
                    {v}
                  </Box>
                ))}
              </Stack>
            </Paper>
          ))}
        </Stack>
      </Box>

      {/* ─ Add row ─ */}
      <Button
        variant="outlined"
        startIcon={<AddIcon />}
        onClick={addField}
        sx={{ alignSelf: "flex-start", borderRadius: "8px", borderColor: "#e5e7eb", color: "#374151", fontSize: 12, fontWeight: 600, "&:hover": { borderColor: "#f59e0b", color: "#d97706", bgcolor: "#fffbeb" } }}
      >
        Add Attribute
      </Button>

      <Divider />

      {/* ─ Reference hint ─ */}
      <Box sx={{ bgcolor: "#fffbeb", border: "1px solid #fde68a", borderRadius: "10px", p: 1.5 }}>
        <Typography sx={{ fontSize: 11, fontWeight: 700, color: "#92400e", mb: 0.5 }}>💡 Usage</Typography>
        <Typography sx={{ fontSize: 11, color: "#78350f", lineHeight: 1.6 }}>
          Access saved attributes in messages using{" "}
          <Box component="code" sx={{ bgcolor: "#fef3c7", px: "4px", borderRadius: "4px", fontSize: 11 }}>
            {"{{attributes.key_name}}"}
          </Box>
          , e.g.{" "}
          <Box component="code" sx={{ bgcolor: "#fef3c7", px: "4px", borderRadius: "4px", fontSize: 11 }}>
            {"{{attributes.cabin_size}}"}
          </Box>
        </Typography>
      </Box>

    </Box>
  );
};

export default SetContactAttributeEditor;
