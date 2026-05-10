import { useState } from "react";
import {
  Alert, Box, CircularProgress, FormControlLabel, MenuItem,
  Stack, Switch, TextField, Typography,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { aiConfigService } from "service/aiConfig.service";

const fieldSx = { "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: 13 } };
const shrinkProps = { shrink: true, sx: { fontSize: 12 } };

const AiResponseEditor = ({ node, updateNodeData }: any) => {
  const cfg = node.data?.config || {};

  const [aiConfigId, setAiConfigId] = useState<string>(cfg.ai_config_id || "");
  const [inputVariable, setInputVariable] = useState<string>(cfg.input_variable || "last_message");
  const [saveTo, setSaveTo] = useState<string>(cfg.save_to || "ai_response");
  const [sendToUser, setSendToUser] = useState<boolean>(cfg.send_to_user !== false);

  const { data: configs = [], isLoading } = useQuery({
    queryKey: ["ai-configs"],
    queryFn: () => aiConfigService.list(),
  });

  const activeConfigs = configs.filter((c) => c.is_active);

  const patch = (update: Record<string, any>) => {
    updateNodeData(node.id, { config: { ...cfg, ...update } });
  };

  const selectedConfig = configs.find((c) => c._id === aiConfigId);

  return (
    <Stack spacing={2} px={0.5} pt={1}>
      <Typography fontSize={12} fontWeight={700} color="#374151">AI Response</Typography>

      {isLoading ? (
        <Box display="flex" justifyContent="center" py={2}>
          <CircularProgress size={20} />
        </Box>
      ) : activeConfigs.length === 0 ? (
        <Alert severity="warning" sx={{ fontSize: 12 }}>
          No active AI Configs found. Create one from the <strong>AI Configs</strong> page.
        </Alert>
      ) : (
        <TextField
          select fullWidth size="small" label="AI Config" sx={fieldSx}
          InputLabelProps={shrinkProps}
          value={aiConfigId}
          onChange={(e) => {
            setAiConfigId(e.target.value);
            patch({ ai_config_id: e.target.value });
          }}
        >
          {activeConfigs.map((c) => (
            <MenuItem key={c._id} value={c._id}>
              <Stack>
                <span>{c.name}</span>
                <Typography variant="caption" color="text.secondary">{c.model}</Typography>
              </Stack>
            </MenuItem>
          ))}
        </TextField>
      )}

      {selectedConfig && (
        <Box sx={{ p: 1, bgcolor: "#f0fdf4", borderRadius: 1, border: "1px solid #bbf7d0" }}>
          <Typography fontSize={11} color="#166534">
            Model: {selectedConfig.model} &nbsp;|&nbsp; Tools: {selectedConfig.tools.length > 0 ? selectedConfig.tools.join(", ") : "none"} &nbsp;|&nbsp; Files: {selectedConfig.files.length}
          </Typography>
        </Box>
      )}

      <TextField
        fullWidth size="small" label="Input Variable" sx={fieldSx}
        InputLabelProps={shrinkProps}
        value={inputVariable}
        onChange={(e) => {
          setInputVariable(e.target.value);
          patch({ input_variable: e.target.value });
        }}
        helperText="Session variable that holds the user's message (e.g. last_message, user_input)"
      />

      <TextField
        fullWidth size="small" label="Save Response To" sx={fieldSx}
        InputLabelProps={shrinkProps}
        value={saveTo}
        onChange={(e) => {
          setSaveTo(e.target.value);
          patch({ save_to: e.target.value });
        }}
        helperText={`AI reply stored as {{${saveTo || "ai_response"}}} in session`}
      />

      <FormControlLabel
        control={
          <Switch size="small" checked={sendToUser}
            onChange={(e) => {
              setSendToUser(e.target.checked);
              patch({ send_to_user: e.target.checked });
            }} />
        }
        label={
          <Stack>
            <Typography fontSize={13}>Send reply to user</Typography>
            <Typography fontSize={11} color="text.secondary">
              Automatically send the AI response to the WhatsApp contact
            </Typography>
          </Stack>
        }
      />

      <Alert severity="info" sx={{ fontSize: 11 }}>
        Wallet balance will be deducted for each AI conversation (OpenAI cost + platform margin).
        If balance is insufficient, the node is skipped.
      </Alert>
    </Stack>
  );
};

export default AiResponseEditor;
