import {
  Box,
  TextField,
  Button,
  Typography,
  Divider,
  MenuItem,
  IconButton,
  Stack,
  Paper,
  Chip,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import AddIcon from "@mui/icons-material/Add";
import AccountTreeIcon from "@mui/icons-material/AccountTree";

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const genId = (len = 12) =>
  Array.from({ length: len }, () => CHARS[Math.floor(Math.random() * CHARS.length)]).join("");

const OPERATORS = [
  { value: "==",          label: "equals (==)",            numeric: false },
  { value: "!=",          label: "not equals (!=)",         numeric: false },
  { value: ">",           label: "greater than (>)",        numeric: true  },
  { value: "<",           label: "less than (<)",           numeric: true  },
  { value: ">=",          label: "greater or equal (>=)",   numeric: true  },
  { value: "<=",          label: "less or equal (<=)",      numeric: true  },
  { value: "contains",    label: "contains",                numeric: false },
  { value: "not_contains",label: "does not contain",        numeric: false },
  { value: "starts_with", label: "starts with",             numeric: false },
  { value: "ends_with",   label: "ends with",               numeric: false },
  { value: "is_empty",    label: "is empty",                numeric: false },
  { value: "not_empty",   label: "is not empty",            numeric: false },
];

const NO_VALUE_OPS = ["is_empty", "not_empty"];

const BRANCH_COLORS = ["#3b82f6", "#8b5cf6", "#f59e0b", "#10b981", "#ef4444", "#0ea5e9"];
const BRANCH_BGS    = ["#eff6ff", "#f5f3ff", "#fffbeb", "#f0fdf4", "#fef2f2", "#f0f9ff"];

const SectionLabel = ({ children, mb = 1 }: { children: any; mb?: number }) => (
  <Typography sx={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.6, mb }}>
    {children}
  </Typography>
);

const ConditionRouterEditor = ({ node, updateNodeData, allNodes }: any) => {
  const data = node?.data || {};
  const branches: any[] = data.branches || [];

  // Collect variable suggestions from all nodes' save_to
  const varSuggestions: string[] = [
    "last_message",
    ...((allNodes || []) as any[])
      .filter((n: any) => n.id !== node.id && n.data?.save_to)
      .map((n: any) => n.data.save_to as string)
      .filter((v: string, i: number, arr: string[]) => arr.indexOf(v) === i),
  ];

  const updateBranches = (updated: any[]) => updateNodeData(node.id, { branches: updated });

  const addBranch = () => {
    updateBranches([
      ...branches.filter((b) => !b.is_default),
      {
        id: genId(),
        label: `Branch ${branches.filter((b) => !b.is_default).length + 1}`,
        logic: "AND",
        is_default: false,
        conditions: [{ variable: "", operator: "==", value: "" }],
      },
      ...branches.filter((b) => b.is_default),
    ]);
  };

  const removeBranch = (idx: number) => {
    updateBranches(branches.filter((_, i) => i !== idx));
  };

  const updateBranch = (idx: number, patch: Record<string, any>) => {
    updateBranches(branches.map((b, i) => (i === idx ? { ...b, ...patch } : b)));
  };

  const addCondition = (branchIdx: number) => {
    const updated = JSON.parse(JSON.stringify(branches));
    updated[branchIdx].conditions.push({ variable: "", operator: "==", value: "" });
    updateBranches(updated);
  };

  const removeCondition = (branchIdx: number, condIdx: number) => {
    const updated = JSON.parse(JSON.stringify(branches));
    updated[branchIdx].conditions.splice(condIdx, 1);
    updateBranches(updated);
  };

  const updateCondition = (branchIdx: number, condIdx: number, patch: Record<string, any>) => {
    const updated = JSON.parse(JSON.stringify(branches));
    updated[branchIdx].conditions[condIdx] = { ...updated[branchIdx].conditions[condIdx], ...patch };
    updateBranches(updated);
  };

  const ensureDefaultBranch = () => {
    if (!branches.find((b) => b.is_default)) {
      updateBranches([
        ...branches,
        { id: genId(), label: "Else", logic: "AND", is_default: true, conditions: [] },
      ]);
    }
  };

  // Auto-ensure default branch exists
  if (branches.length > 0 && !branches.find((b) => b.is_default)) {
    // don't call updateNodeData during render — defer
  }

  const defaultBranchIdx = branches.findIndex((b) => b.is_default);
  const nonDefaultBranches = branches
    .map((b, i) => ({ ...b, _idx: i }))
    .filter((b) => !b.is_default);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>

      {/* Header */}
      <Stack direction="row" spacing={1.5} alignItems="center">
        <Box sx={{ width: 38, height: 38, borderRadius: "10px", bgcolor: "#fef3c7", border: "1px solid #fde68a", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <AccountTreeIcon sx={{ fontSize: 20, color: "#d97706" }} />
        </Box>
        <Box>
          <Typography sx={{ fontSize: 15, fontWeight: 700, lineHeight: 1.2 }}>Condition Router</Typography>
          <Typography variant="caption" color="text.secondary">Route flow based on variable conditions</Typography>
        </Box>
      </Stack>

      <Divider />

      {/* Info box */}
      <Box sx={{ p: 1.5, borderRadius: "8px", bgcolor: "#fffbeb", border: "1px solid #fde68a" }}>
        <Typography sx={{ fontSize: 11.5, color: "#92400e", lineHeight: 1.6 }}>
          💡 Branches are evaluated <strong>top to bottom</strong>. The first branch whose conditions match will be followed. The <strong>Else</strong> branch runs when nothing matches.
        </Typography>
      </Box>

      {/* Branches */}
      <Box>
        <SectionLabel mb={1.5}>Branches</SectionLabel>
        <Stack spacing={1.5}>
          {nonDefaultBranches.map((branch, visualIdx) => {
            const branchIdx = branch._idx;
            const color = BRANCH_COLORS[visualIdx % BRANCH_COLORS.length];
            const bg    = BRANCH_BGS[visualIdx % BRANCH_BGS.length];
            return (
              <Paper
                key={branch.id}
                variant="outlined"
                sx={{ borderRadius: "10px", p: 1.5, borderColor: color, borderWidth: 1.5, bgcolor: bg }}
              >
                {/* Branch header */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                  <Chip
                    label={`IF ${visualIdx + 1}`}
                    size="small"
                    sx={{ bgcolor: color, color: "#fff", fontWeight: 700, fontSize: 10, height: 20, borderRadius: "6px" }}
                  />
                  <TextField
                    size="small" fullWidth placeholder="Branch label (shown on canvas)"
                    value={branch.label}
                    onChange={(e) => updateBranch(branchIdx, { label: e.target.value })}
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: 13, fontWeight: 600 } }}
                  />
                  <TextField
                    select size="small"
                    value={branch.logic || "AND"}
                    onChange={(e) => updateBranch(branchIdx, { logic: e.target.value })}
                    sx={{ minWidth: 72, "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: 12 } }}
                  >
                    <MenuItem value="AND">AND</MenuItem>
                    <MenuItem value="OR">OR</MenuItem>
                  </TextField>
                  <IconButton
                    size="small"
                    onClick={() => removeBranch(branchIdx)}
                    disabled={nonDefaultBranches.length <= 1}
                    sx={{ color: "#ef4444", "&:hover": { bgcolor: "#fef2f2" }, "&.Mui-disabled": { color: "#d1d5db" } }}
                  >
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </Box>

                {/* Conditions */}
                <Stack spacing={0.75} sx={{ mb: 1 }}>
                  {(branch.conditions || []).map((cond: any, condIdx: number) => {
                    const noValue = NO_VALUE_OPS.includes(cond.operator);
                    return (
                      <Box
                        key={condIdx}
                        sx={{ display: "grid", gridTemplateColumns: "1fr 1.2fr 1fr auto", gap: 0.75, alignItems: "center", p: 1, bgcolor: "#fff", borderRadius: "8px", border: "1px solid #e5e7eb" }}
                      >
                        {/* Variable */}
                        <TextField
                          select size="small" label="Variable"
                          value={cond.variable || ""}
                          onChange={(e) => updateCondition(branchIdx, condIdx, { variable: e.target.value })}
                          sx={{ "& .MuiOutlinedInput-root": { borderRadius: "6px", fontSize: 12 } }}
                        >
                          {varSuggestions.map((v) => (
                            <MenuItem key={v} value={v}>{v}</MenuItem>
                          ))}
                          {cond.variable && !varSuggestions.includes(cond.variable) && (
                            <MenuItem value={cond.variable}>{cond.variable}</MenuItem>
                          )}
                        </TextField>

                        {/* Operator */}
                        <TextField
                          select size="small" label="Condition"
                          value={cond.operator || "=="}
                          onChange={(e) => updateCondition(branchIdx, condIdx, { operator: e.target.value, value: "" })}
                          sx={{ "& .MuiOutlinedInput-root": { borderRadius: "6px", fontSize: 12 } }}
                        >
                          {OPERATORS.map((op) => (
                            <MenuItem key={op.value} value={op.value}>{op.label}</MenuItem>
                          ))}
                        </TextField>

                        {/* Value */}
                        <TextField
                          size="small" label="Value"
                          value={cond.value || ""}
                          onChange={(e) => updateCondition(branchIdx, condIdx, { value: e.target.value })}
                          disabled={noValue}
                          placeholder={noValue ? "—" : "e.g. 18"}
                          sx={{ "& .MuiOutlinedInput-root": { borderRadius: "6px", fontSize: 12 } }}
                        />

                        <IconButton
                          size="small"
                          onClick={() => removeCondition(branchIdx, condIdx)}
                          disabled={(branch.conditions || []).length <= 1}
                          sx={{ color: "#ef4444", "&:hover": { bgcolor: "#fef2f2" }, "&.Mui-disabled": { color: "#d1d5db" } }}
                        >
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    );
                  })}
                </Stack>

                <Button
                  size="small" startIcon={<AddIcon />} variant="outlined"
                  onClick={() => addCondition(branchIdx)}
                  sx={{ fontSize: 11, color: color, borderColor: color, "&:hover": { bgcolor: bg } }}
                >
                  Add Condition
                </Button>

                {/* Handle ID hint */}
                <Box sx={{ mt: 1, px: 1, py: 0.5, borderRadius: "6px", bgcolor: "#f3f4f6", border: "1px dashed #d1d5db" }}>
                  <Typography sx={{ fontSize: 9.5, color: "#6b7280" }}>Handle ID (drag on canvas to connect)</Typography>
                  <Typography sx={{ fontSize: 10.5, fontFamily: "monospace", fontWeight: 600, color: "#374151" }}>{branch.id}</Typography>
                </Box>
              </Paper>
            );
          })}
        </Stack>

        <Button
          variant="outlined" startIcon={<AddIcon />} onClick={addBranch}
          sx={{ mt: 1.5, borderRadius: "8px", borderColor: "#e5e7eb", color: "#374151", fontSize: 12, fontWeight: 600, "&:hover": { borderColor: "#f59e0b", color: "#d97706", bgcolor: "#fffbeb" } }}
        >
          Add Branch
        </Button>
      </Box>

      <Divider />

      {/* Default / Else branch */}
      <Box>
        <SectionLabel mb={1}>Else (Default)</SectionLabel>
        {defaultBranchIdx === -1 ? (
          <Button
            variant="outlined" startIcon={<AddIcon />} onClick={ensureDefaultBranch}
            sx={{ borderRadius: "8px", borderColor: "#e5e7eb", color: "#6b7280", fontSize: 12, fontWeight: 600 }}
          >
            Add Else Branch
          </Button>
        ) : (
          <Paper variant="outlined" sx={{ borderRadius: "10px", p: 1.5, borderColor: "#9ca3af", bgcolor: "#f9fafb" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              <Chip label="ELSE" size="small" sx={{ bgcolor: "#6b7280", color: "#fff", fontWeight: 700, fontSize: 10, height: 20, borderRadius: "6px" }} />
              <TextField
                size="small" fullWidth placeholder="Else branch label"
                value={branches[defaultBranchIdx]?.label || "Else"}
                onChange={(e) => updateBranch(defaultBranchIdx, { label: e.target.value })}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: 13, fontWeight: 600 } }}
              />
              <IconButton
                size="small"
                onClick={() => removeBranch(defaultBranchIdx)}
                sx={{ color: "#ef4444", "&:hover": { bgcolor: "#fef2f2" } }}
              >
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            </Box>
            <Typography sx={{ fontSize: 11, color: "#6b7280", mb: 1 }}>
              Runs when none of the branches above match.
            </Typography>
            <Box sx={{ px: 1, py: 0.5, borderRadius: "6px", bgcolor: "#f3f4f6", border: "1px dashed #d1d5db" }}>
              <Typography sx={{ fontSize: 9.5, color: "#6b7280" }}>Handle ID</Typography>
              <Typography sx={{ fontSize: 10.5, fontFamily: "monospace", fontWeight: 600, color: "#374151" }}>
                {branches[defaultBranchIdx]?.id}
              </Typography>
            </Box>
          </Paper>
        )}
      </Box>

    </Box>
  );
};

export default ConditionRouterEditor;
