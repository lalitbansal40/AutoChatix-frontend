import {
  Box,
  Typography,
  TextField,
  MenuItem,
  Stack,
} from "@mui/material";

const UNITS = [
  { value: "seconds", label: "Seconds" },
  { value: "minutes", label: "Minutes" },
  { value: "hours",   label: "Hours"   },
  { value: "days",    label: "Days"    },
  { value: "weeks",   label: "Weeks"   },
  { value: "months",  label: "Months"  },
];

const DelayNodeEditor = ({ node, updateNodeData }: any) => {
  const value = node.data?.delay_duration?.value ?? 1;
  const unit  = node.data?.delay_duration?.unit  ?? "hours";

  const update = (patch: Partial<{ value: number; unit: string }>) => {
    updateNodeData(node.id, { delay_duration: { value, unit, ...patch } });
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography fontSize={13} fontWeight={700} color="#0e7490" sx={{ mb: 0.5 }}>
        ⏱️ Delay
      </Typography>
      <Typography fontSize={12} color="text.secondary" sx={{ mb: 2 }}>
        Pause the automation for the specified duration before moving to the next node.
      </Typography>

      <Stack direction="row" spacing={1.5} alignItems="center">
        <TextField
          label="Duration"
          type="number"
          size="small"
          value={value}
          onChange={(e) => {
            const v = Math.max(1, parseInt(e.target.value) || 1);
            update({ value: v });
          }}
          inputProps={{ min: 1 }}
          sx={{ width: 110 }}
        />
        <TextField
          label="Unit"
          select
          size="small"
          value={unit}
          onChange={(e) => update({ unit: e.target.value })}
          sx={{ width: 130 }}
        >
          {UNITS.map((u) => (
            <MenuItem key={u.value} value={u.value}>
              {u.label}
            </MenuItem>
          ))}
        </TextField>
      </Stack>

      <Box sx={{ mt: 2, bgcolor: "#ecfeff", border: "1px solid #a5f3fc", borderRadius: 1.5, px: 1.5, py: 1 }}>
        <Typography fontSize={11.5} color="#0e7490">
          The automation will resume after <strong>{value} {unit}</strong>, even if the contact sends a message before the delay is over.
        </Typography>
      </Box>
    </Box>
  );
};

export default DelayNodeEditor;
