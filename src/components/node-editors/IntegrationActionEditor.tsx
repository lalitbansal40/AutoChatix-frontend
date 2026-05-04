import { Box, Typography, Chip, Stack, Avatar, Alert, Button } from "@mui/material";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { useEffect, useMemo } from "react";
import { useIntegrationCatalog } from "hooks/useIntegrationCatalog";
import { DynamicFieldForm } from "components/integrations/DynamicFieldRenderer";
import { ActionDef, IntegrationDefinition } from "types/integration";

/**
 * Editor for any integration_action node.
 * Renders a form derived from the action's configSchema.
 */
const IntegrationActionEditor = ({
  node,
  updateNodeData,
  channelId,
}: {
  node: any;
  updateNodeData: (id: string, data: any) => void;
  /** Optional — omitted means catalog without channel filter (still works) */
  channelId?: string;
}) => {
  const data = node.data || {};
  const slug: string | undefined = data.integration_slug;
  const actionKey: string | undefined = data.action_key;

  const { data: catalog, isLoading } = useIntegrationCatalog(channelId);

  const app: IntegrationDefinition | undefined = useMemo(
    () => (catalog?.catalog || []).find((a) => a.slug === slug),
    [catalog, slug]
  );

  const action: ActionDef | undefined = useMemo(
    () => app?.actions.find((a) => a.key === actionKey),
    [app, actionKey]
  );

  // Hydrate config with defaults the first time
  useEffect(() => {
    if (!action) return;
    const cfg = data.config || {};
    let touched = false;
    const next = { ...cfg };
    for (const f of action.configSchema || []) {
      if (next[f.key] === undefined && f.defaultValue !== undefined) {
        next[f.key] = f.defaultValue;
        touched = true;
      }
    }
    if (touched) updateNodeData(node.id, { config: next });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actionKey, action?.configSchema?.length]);

  if (isLoading) {
    return <Typography fontSize={13} color="text.secondary">Loading…</Typography>;
  }

  if (!app) {
    return (
      <Alert severity="warning" sx={{ borderRadius: "8px" }}>
        Integration <strong>{slug || "(unknown)"}</strong> is not in the catalog.
      </Alert>
    );
  }

  if (!app.connected) {
    return (
      <Alert
        severity="info"
        sx={{ borderRadius: "8px" }}
        action={
          <Button color="inherit" size="small" href="/integrations" target="_blank" endIcon={<OpenInNewIcon fontSize="small" />}>
            Connect
          </Button>
        }
      >
        <strong>{app.name}</strong> is not connected on this channel. Connect it from the Integrations page first.
      </Alert>
    );
  }

  if (!action) {
    return (
      <Alert severity="error" sx={{ borderRadius: "8px" }}>
        Action <strong>{actionKey}</strong> not found on {app.name}.
      </Alert>
    );
  }

  return (
    <Stack spacing={2}>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
        <Avatar
          sx={{
            bgcolor: app.bgColor,
            color: app.color,
            width: 38,
            height: 38,
            borderRadius: 2,
            fontSize: 18,
            fontWeight: 800,
          }}
        >
          {app.icon || app.name[0]}
        </Avatar>
        <Box sx={{ flex: 1 }}>
          <Typography fontSize={14} fontWeight={700}>
            {app.name} · {action.label}
          </Typography>
          <Typography fontSize={11.5} color="text.secondary">
            {action.description}
          </Typography>
        </Box>
        <Chip
          size="small"
          label="Connected"
          sx={{ bgcolor: "#f0fdf4", color: "#15803d", fontWeight: 700, fontSize: 10 }}
        />
      </Box>

      {/* Form */}
      <DynamicFieldForm
        schema={action.configSchema || []}
        values={data.config || {}}
        onChange={(next) => updateNodeData(node.id, { config: next })}
      />

      {/* Outputs (variables this action exposes) */}
      {action.outputSchema && action.outputSchema.length > 0 && (
        <Box
          sx={{
            mt: 1,
            p: 1.25,
            borderRadius: "10px",
            bgcolor: "#f9fafb",
            border: "1px solid #e5e7eb",
          }}
        >
          <Typography fontSize={11} fontWeight={700} color="#6b7280" sx={{ mb: 0.75, textTransform: "uppercase", letterSpacing: 0.5 }}>
            Available variables
          </Typography>
          <Stack spacing={0.5}>
            {action.outputSchema.map((o) => {
              const saveTo = data.config?.save_to || "result";
              const placeholder = `{{${saveTo}.${o.key}}}`;
              return (
                <Stack key={o.key} direction="row" spacing={1} alignItems="center">
                  <Chip
                    size="small"
                    label={placeholder}
                    sx={{ bgcolor: "#fff", border: "1px solid #e5e7eb", fontFamily: "monospace", fontSize: 11 }}
                  />
                  <Typography fontSize={11.5} color="text.secondary">
                    {o.label}
                  </Typography>
                </Stack>
              );
            })}
          </Stack>
        </Box>
      )}
    </Stack>
  );
};

export default IntegrationActionEditor;
