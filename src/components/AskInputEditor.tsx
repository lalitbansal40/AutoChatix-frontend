import { TextField, MenuItem, Box } from "@mui/material";

const AskInputEditor = ({ node, updateNodeData }: any) => {
    const data = node.data || {};

    return (
        <Box display="flex" flexDirection="column" gap={2}>

            {/* MESSAGE */}
            <TextField
                label="Message"
                multiline
                rows={4}
                value={data.message || ""}
                onChange={(e) =>
                    updateNodeData(node.id, { message: e.target.value })
                }
                fullWidth
            />

            {/* INPUT TYPE */}
            <TextField
                select
                label="Input Type"
                value={data.input_type || "text"}
                onChange={(e) =>
                    updateNodeData(node.id, { input_type: e.target.value })
                }
                fullWidth
            >
                <MenuItem value="text">Text</MenuItem>
                <MenuItem value="number">Number</MenuItem>
                <MenuItem value="date">Date</MenuItem>
            </TextField>

            {/* SAVE VARIABLE */}
            <TextField
                label="Save To"
                value={data.save_to || ""}
                onChange={(e) =>
                    updateNodeData(node.id, { save_to: e.target.value })
                }
                fullWidth
            />
        </Box>
    );
};

export default AskInputEditor;