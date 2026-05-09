import {
  Box,
  IconButton,
  Typography,
  Stack,
  Divider,
  Button,
  Paper,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Alert,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import AddIcon from "@mui/icons-material/Add";
import { useQuery } from "@tanstack/react-query";
import { contactAttributeService, ContactAttribute } from "service/contactAttribute.service";
import VariablePicker from "components/VariablePicker";

const SetContactAttributeEditor = ({ node, updateNodeData }: any) => {
  const data = node.data || {};

  const names: string[] = Array.isArray(data.attribute_name)
    ? data.attribute_name
    : [data.attribute_name || ""];

  const values: string[] = Array.isArray(data.attribute_value)
    ? data.attribute_value
    : [data.attribute_value || ""];

  const { data: attributes = [] } = useQuery<ContactAttribute[]>({
    queryKey: ["contact-attributes"],
    queryFn: async () => {
      const res = await contactAttributeService.getAttributes();
      return res.data || [];
    },
    staleTime: 60_000,
  });

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

      {attributes.length === 0 && (
        <Alert severity="info" sx={{ borderRadius: "10px" }}>
          No contact fields defined yet. Go to <strong>Contact Fields</strong> in the sidebar to create them.
        </Alert>
      )}

      {/* ─ Pairs ─ */}
      <Box>
        {/* Column labels */}
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 36px", gap: 1, mb: 1, px: 0.5 }}>
          <Typography sx={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5 }}>
            Contact Field
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
              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 36px", gap: 1, alignItems: "flex-start" }}>
                {/* Field Key — dropdown from defined contact fields */}
                <FormControl size="small" fullWidth>
                  <InputLabel sx={{ fontSize: 12 }}>Select Field</InputLabel>
                  <Select
                    value={name}
                    label="Select Field"
                    onChange={(e) => updatePair(index, "name", e.target.value)}
                    sx={{ borderRadius: "8px", fontSize: 12, fontFamily: "monospace" }}
                  >
                    {attributes.map((attr) => (
                      <MenuItem key={attr.id} value={attr.id} sx={{ fontSize: 12, fontFamily: "monospace" }}>
                        <Stack>
                          <Typography fontSize={12} fontWeight={600}>{attr.name}</Typography>
                          <Typography fontSize={10} color="text.secondary">{attr.id}</Typography>
                        </Stack>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* Value — VariablePicker */}
                <VariablePicker
                  value={values[index] || ""}
                  onChange={(val) => updatePair(index, "value", val)}
                  placeholder="value or {{variable}}"
                  multiline={false}
                  rows={1}
                  size="small"
                />

                {/* Delete */}
                <IconButton
                  size="small"
                  onClick={() => removeField(index)}
                  disabled={names.length === 1}
                  sx={{ color: "#ef4444", "&:hover": { bgcolor: "#fef2f2" }, "&.Mui-disabled": { color: "#d1d5db" }, mt: 0.5 }}
                >
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              </Box>
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
        Add Field
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
          . Manage fields from the{" "}
          <Box component="code" sx={{ bgcolor: "#fef3c7", px: "4px", borderRadius: "4px", fontSize: 11 }}>
            Contact Fields
          </Box>{" "}
          page in the sidebar.
        </Typography>
      </Box>

    </Box>
  );
};

export default SetContactAttributeEditor;
