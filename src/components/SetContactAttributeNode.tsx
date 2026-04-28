import { Box, TextField, IconButton } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";

const SetContactAttributeEditor = ({ node, updateNodeData }: any) => {
  const data = node.data || {};

  // 🔥 ALWAYS ARRAY
  const names = Array.isArray(data.attribute_name)
    ? data.attribute_name
    : [data.attribute_name || ""];

  const values = Array.isArray(data.attribute_value)
    ? data.attribute_value
    : [data.attribute_value || ""];

  const updatePair = (index: number, key: string, value: string) => {
    const newNames = [...names];
    const newValues = [...values];

    if (key === "name") newNames[index] = value;
    if (key === "value") newValues[index] = value;

    updateNodeData(node.id, {
      attribute_name: newNames,
      attribute_value: newValues,
    });
  };

  const addField = () => {
    updateNodeData(node.id, {
      attribute_name: [...names, ""],
      attribute_value: [...values, ""],
    });
  };

  const removeField = (index: number) => {
    const newNames = names.filter((_: any, i: number) => i !== index);
    const newValues = values.filter((_: any, i: number) => i !== index);

    updateNodeData(node.id, {
      attribute_name: newNames,
      attribute_value: newValues,
    });
  };

  return (
    <Box display="flex" flexDirection="column" gap={2}>
      {names.map((name: string, index: number) => (
        <Box key={index} display="flex" gap={1}>
          
          <TextField
            label="Attribute Name"
            value={name}
            fullWidth
            onChange={(e) =>
              updatePair(index, "name", e.target.value)
            }
          />

          <TextField
            label="Value ({{var}} or direct)"
            value={values[index]}
            fullWidth
            onChange={(e) =>
              updatePair(index, "value", e.target.value)
            }
          />

          <IconButton onClick={() => removeField(index)}>
            <DeleteIcon />
          </IconButton>
        </Box>
      ))}

      <IconButton onClick={addField}>
        <AddIcon />
      </IconButton>
    </Box>
  );
};

export default SetContactAttributeEditor;