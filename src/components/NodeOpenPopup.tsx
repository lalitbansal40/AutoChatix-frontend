import { Box, Typography, TextField, Button, Stack } from "@mui/material";
import { Node } from "reactflow";

interface Props {
  selectedNode: Node;
  onClose: () => void;
  updateNodeData: (key: string, value: any) => void;
}

const NodeOpenPopup = ({
  selectedNode,
  onClose,
  updateNodeData,
}: Props) => {
  return (
    <Box
      sx={{
        position: "absolute",
        right: 0,
        top: 0,
        width: 320,
        height: "100%",
        background: "#fff",
        borderLeft: "1px solid #ddd",
        p: 2,
        zIndex: 10,
        overflowY: "auto",
      }}
    >
      <Stack spacing={2}>
        <Typography variant="h6">Edit Node</Typography>

        <Typography variant="caption">
          ID: {selectedNode.id}
        </Typography>

        <Typography variant="body2">
          Type: {selectedNode.data.type}
        </Typography>

        {/* MESSAGE */}
        <TextField
          label="Message"
          multiline
          rows={3}
          value={selectedNode.data.message || ""}
          onChange={(e) =>
            updateNodeData("message", e.target.value)
          }
          fullWidth
        />

        <Button variant="contained">Save Changes</Button>

        <Button variant="outlined" onClick={onClose}>
          Close
        </Button>
      </Stack>
    </Box>
  );
};

export default NodeOpenPopup;