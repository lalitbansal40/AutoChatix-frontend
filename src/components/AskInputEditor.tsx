import {
  TextField,
  Box,
  Typography,
  Stack,
  Divider,
  InputAdornment,
} from "@mui/material";

const INPUT_TYPES = [
  { value: "text",   icon: "✏️", label: "Text",   desc: "Any text response" },
  { value: "number", icon: "🔢", label: "Number", desc: "Numeric only" },
  { value: "date",   icon: "📅", label: "Date",   desc: "Date value" },
  { value: "email",  icon: "📧", label: "Email",  desc: "Email address" },
  { value: "phone",  icon: "📱", label: "Phone",  desc: "Phone number" },
];

const AskInputEditor = ({ node, updateNodeData }: any) => {
  const data = node.data || {};
  const inputType = data.input_type || "text";

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>

      {/* ─ Header ─ */}
      <Stack direction="row" spacing={1.5} alignItems="center">
        <Box sx={{ width: 38, height: 38, borderRadius: "10px", bgcolor: "#f5f3ff", border: "1px solid #ede9fe", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
          ✏️
        </Box>
        <Box>
          <Typography sx={{ fontSize: 15, fontWeight: 700, lineHeight: 1.2 }}>Ask Input</Typography>
          <Typography variant="caption" color="text.secondary">Ask user a question and save their reply</Typography>
        </Box>
      </Stack>

      <Divider />

      {/* ─ Question ─ */}
      <Box>
        <Typography sx={{ mb: 1, fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.6 }}>
          Question / Message
        </Typography>
        <TextField
          fullWidth
          multiline
          rows={4}
          placeholder="e.g. What is your preferred visit date? 📅"
          value={data.message || ""}
          onChange={(e) => updateNodeData(node.id, { message: e.target.value })}
          helperText={`${(data.message || "").length} chars`}
          sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px", fontSize: 13 } }}
        />
      </Box>

      <Divider />

      {/* ─ Input Type grid ─ */}
      <Box>
        <Typography sx={{ mb: 1.25, fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.6 }}>
          Expected Input Type
        </Typography>
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 1 }}>
          {INPUT_TYPES.map((t) => {
            const active = inputType === t.value;
            return (
              <Box
                key={t.value}
                onClick={() => updateNodeData(node.id, { input_type: t.value })}
                sx={{
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  gap: 0.5, py: 1.25, px: 1, borderRadius: "10px", cursor: "pointer",
                  border: "2px solid", borderColor: active ? "#8b5cf6" : "#e5e7eb",
                  bgcolor: active ? "#f5f3ff" : "#fafafa",
                  transition: "all 0.15s",
                  "&:hover": { borderColor: "#8b5cf6", bgcolor: "#f5f3ff" },
                }}
              >
                <Typography fontSize={20}>{t.icon}</Typography>
                <Typography fontSize={11.5} fontWeight={700} color={active ? "#6d28d9" : "#374151"}>{t.label}</Typography>
                <Typography fontSize={10} color="text.secondary" textAlign="center">{t.desc}</Typography>
              </Box>
            );
          })}
        </Box>
      </Box>

      <Divider />

      {/* ─ Save To ─ */}
      <Box>
        <Typography sx={{ mb: 0.5, fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.6 }}>
          Save Response As
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1.25 }}>
          Use{" "}
          <Box component="code" sx={{ bgcolor: "#f5f3ff", px: "5px", py: "2px", borderRadius: "4px", color: "#6d28d9", fontSize: 11 }}>
            {"{{attributes." + (data.save_to || "variable_name") + "}}"}
          </Box>{" "}
          in later nodes to reference this value.
        </Typography>
        <TextField
          fullWidth
          placeholder="e.g. date, preferred_time, phone_number"
          value={data.save_to || ""}
          onChange={(e) => updateNodeData(node.id, { save_to: e.target.value })}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Typography sx={{ fontSize: 12, color: "#8b5cf6", fontFamily: "monospace", userSelect: "none" }}>
                  attributes.
                </Typography>
              </InputAdornment>
            ),
          }}
          sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px", fontFamily: "monospace", fontSize: 13 } }}
        />
      </Box>

    </Box>
  );
};

export default AskInputEditor;
