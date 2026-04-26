import { Handle, Position } from "reactflow";
import { Box, Typography, Chip } from "@mui/material";

const CustomNode = ({ data }: any) => {
  const isButtonNode =
    data.type === "auto_reply" &&
    Array.isArray(data.buttons) &&
    data.buttons.length > 0;

  return (
    <Box
      sx={{
        p: 1,                 // 🔥 reduce padding
        borderRadius: 2,      // 🔥 less rounded
        background: "#fff",
        minWidth: 220,
        boxShadow: "none",    // ❌ no elevation
        border: "1px solid #eee", // ✅ flat UI
        position: "relative",
        width: "100%",   // 🔥 ADD THIS
        height: "100%",
      }}
    >
      {/* HEADER */}
      <Typography fontSize={11} color="text.secondary">
        {data.type}
      </Typography>

      <Typography fontWeight={600} fontSize={14}>
        {data.label}
      </Typography>

      {/* MESSAGE */}
      {data.message && (
        <Box
          sx={{
            mt: 1,
            px: 1,
            py: 0.8,
            borderRadius: 2,
            background: "#dcf8c6", // WhatsApp style
            fontSize: 12,
          }}
        >
          {data.message}
        </Box>
      )}

      <Chip
        label={data.type}
        size="small"
        sx={{ mt: 1, fontSize: 10 }}
        color="primary"
      />

      {/* 🟢 BUTTONS */}
      {isButtonNode && (
        data.buttons.map((btn: any, index: number) => {
          const buttonId = btn?.id || `btn_${index}`;

          return (
            <Box
              key={buttonId}
              sx={{
                mt: 1,
                px: 1.5,
                py: 0.8,
                borderRadius: 2,
                fontSize: 12,
                background: "#f0f0f0",
                border: "1px solid #e5e5e5",
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Typography fontSize={12}>
                {btn.title || "Button"}
              </Typography>

              {/* HANDLE */}
              <Handle
                type="source"
                position={Position.Right}
                id={buttonId}
                style={{
                  width: 10,
                  height: 10,
                  background: "#25D366",
                  borderRadius: "50%",
                  position: "absolute",
                  right: -6, // ✅ FIXED (not -10)
                  top: "50%",
                  transform: "translateY(-50%)",
                }}
              />
            </Box>
          );
        })
      )}

      {/* DEFAULT SOURCE */}
      {/* 🔴 TRIGGER → ONLY OUTGOING */}
      {data.type === "trigger" && (
        <Handle
          type="source"
          position={Position.Right}
          style={{
            width: 10,
            height: 10,
            background: "#25D366",
            borderRadius: "50%",
            right: -6,
          }}
        />
      )}

      {/* 🟢 NORMAL NODES → INCOMING */}
      {data.type !== "trigger" && (
        <Handle
          type="target"
          position={Position.Left}
          style={{
            width: 10,
            height: 10,
            background: "#999",
            borderRadius: "50%",
            left: -6,
          }}
        />
      )}

      {/* 🟢 NORMAL NODES → DEFAULT OUTGOING (only if no buttons) */}
      {!isButtonNode && data.type !== "trigger" && (
        <Handle
          type="source"
          position={Position.Right}
          style={{
            width: 10,
            height: 10,
            background: "#25D366",
            borderRadius: "50%",
            right: -6,
          }}
        />
      )}
    </Box>
  );
};

export default CustomNode;