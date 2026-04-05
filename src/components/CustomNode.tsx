import { Handle, Position } from "reactflow";
import { Box, Typography, Chip } from "@mui/material";

const CustomNode = ({ data }: any) => {
  return (
    <Box
      sx={{
        padding: 1.5,
        borderRadius: 2,
        background: "#fff",
        border: "1px solid #ddd",
        minWidth: 180,
        boxShadow: 2,
      }}
    >
      <Typography fontSize={12} color="text.secondary">
        {data.type}
      </Typography>

      <Typography fontWeight={600} fontSize={14}>
        {data.label}
      </Typography>

      {data.message && (
        <Typography fontSize={12} mt={1} color="text.secondary">
          {data.message.slice(0, 40)}...
        </Typography>
      )}

      <Chip
        label={data.type}
        size="small"
        sx={{ mt: 1 }}
        color="primary"
      />

      {/* Handles */}
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </Box>
  );
};

export default CustomNode;