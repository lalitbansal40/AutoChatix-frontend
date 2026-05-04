import { useEffect, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, CircularProgress, Alert, Box, Typography,
  TextField, Select, MenuItem, FormControl, InputLabel,
  Chip, Divider, Avatar, Stack, FormHelperText, Tooltip, IconButton,
} from '@mui/material';
import BoltIcon from '@mui/icons-material/Bolt';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { IntegrationDefinition, IntegrationT, FieldDef } from 'types/integration';
import { ChannelT } from 'types/channels';
import { integrationService } from 'service/integration.service';

interface Props {
  open: boolean;
  onClose: () => void;
  app: IntegrationDefinition | null;
  channels: ChannelT[];
  editing: IntegrationT | null; // null = connect mode, non-null = edit mode
  onSuccess: () => void;
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  payments:    { bg: '#eff6ff', text: '#1d4ed8' },
  logistics:   { bg: '#f0fdf4', text: '#15803d' },
  productivity:{ bg: '#faf5ff', text: '#7c3aed' },
  ecommerce:   { bg: '#fef3c7', text: '#b45309' },
  crm:         { bg: '#fff7ed', text: '#c2410c' },
  other:       { bg: '#f9fafb', text: '#374151' },
};

const ConnectModal = ({ open, onClose, app, channels, editing, onSuccess }: Props) => {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [channelId, setChannelId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isEditMode = !!editing;

  useEffect(() => {
    if (!open || !app) return;
    if (isEditMode && editing) {
      setChannelId(editing.channel_id ?? '');
      const prefilled: Record<string, string> = {};
      app.fields.filter((f) => !f.isSecret).forEach((f) => {
        if (editing.config?.[f.key] !== undefined) prefilled[f.key] = String(editing.config[f.key]);
      });
      setFormData(prefilled);
    } else {
      setFormData({});
      setChannelId('');
    }
    setError('');
  }, [open, app, editing, isEditMode]);

  const handleChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    if (!app) return;
    if (!channelId) { setError('Please select a channel'); return; }

    setLoading(true);
    setError('');
    try {
      if (isEditMode && editing) {
        const config: Record<string, string> = {};
        const secrets: Record<string, string> = {};
        app.fields.forEach((f) => {
          const val = formData[f.key];
          if (val) {
            if (f.isSecret) secrets[f.key] = val;
            else config[f.key] = val;
          }
        });
        await integrationService.updateIntegration(app.slug, channelId, { config, secrets });
      } else {
        const payload: { slug: string; channel_id: string; [key: string]: string } = { slug: app.slug, channel_id: channelId };
        app.fields.forEach((f) => {
          if (formData[f.key]) payload[f.key] = formData[f.key];
        });
        await integrationService.connectIntegration(payload);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!app) return null;

  const catColor = CATEGORY_COLORS[app.category] ?? CATEGORY_COLORS.other;

  const renderField = (field: FieldDef) => {
    const isSecretInEditMode = isEditMode && field.isSecret;
    const label = field.label + (field.required && !isSecretInEditMode ? ' *' : '');

    if (field.type === 'select') {
      return (
        <FormControl fullWidth key={field.key} size="small">
          <InputLabel>{label}</InputLabel>
          <Select
            value={formData[field.key] ?? ''}
            label={label}
            onChange={(e) => handleChange(field.key, e.target.value)}
          >
            {field.options?.map((opt) => (
              <MenuItem key={opt} value={opt}>{opt}</MenuItem>
            ))}
          </Select>
        </FormControl>
      );
    }

    if (field.type === 'textarea') {
      return (
        <TextField
          key={field.key}
          label={label}
          fullWidth
          multiline
          minRows={3}
          size="small"
          type="text"
          placeholder={isSecretInEditMode ? '••••••  Leave empty to keep existing' : field.placeholder}
          value={formData[field.key] ?? ''}
          onChange={(e) => handleChange(field.key, e.target.value)}
        />
      );
    }

    return (
      <TextField
        key={field.key}
        label={label}
        fullWidth
        size="small"
        type={field.type === 'password' ? 'password' : field.type === 'email' ? 'email' : 'text'}
        placeholder={isSecretInEditMode ? '••••••  Leave empty to keep existing' : field.placeholder}
        value={formData[field.key] ?? ''}
        onChange={(e) => handleChange(field.key, e.target.value)}
        InputProps={{ autoComplete: field.type === 'password' ? 'new-password' : undefined }}
      />
    );
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Avatar sx={{ bgcolor: app.bgColor, width: 40, height: 40, borderRadius: 2, fontSize: 18, fontWeight: 700, color: app.color }}>
            {app.name[0]}
          </Avatar>
          <Box>
            <Typography sx={{ fontSize: 16, fontWeight: 700, color: '#111827', lineHeight: 1.2 }}>
              {isEditMode ? `Edit ${app.name}` : `Connect ${app.name}`}
            </Typography>
            <Chip label={app.category} size="small" sx={{ bgcolor: catColor.bg, color: catColor.text, fontSize: 10, fontWeight: 600, height: 18, textTransform: 'capitalize', mt: 0.25 }} />
          </Box>
        </Stack>
      </DialogTitle>

      <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2.5 }}>
        {error && <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>}

        {/* Channel selector */}
        <FormControl fullWidth size="small" required>
          <InputLabel>Channel</InputLabel>
          <Select
            value={channelId}
            label="Channel"
            disabled={isEditMode}
            onChange={(e) => setChannelId(e.target.value)}
          >
            {channels.map((ch) => (
              <MenuItem key={ch._id} value={ch._id}>
                {ch.channel_name} · {ch.display_phone_number}
              </MenuItem>
            ))}
          </Select>
          {isEditMode && <FormHelperText>Channel cannot be changed after connecting</FormHelperText>}
        </FormControl>

        <Divider />

        {/* Google-Sheets-style: no user credentials, just share the service account */}
        {app.connectInfo ? (
          <Box sx={{ bgcolor: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: 2.5, p: 2 }}>
            <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#15803d', mb: 0.75 }}>
              Share your Google Sheet with us
            </Typography>
            <Typography sx={{ fontSize: 12.5, color: '#374151', mb: 1.5, lineHeight: 1.6 }}>
              Open your Google Sheet → click <strong>Share</strong> → paste the email below and give <strong>Editor</strong> access.
              You don't need to provide any credentials here.
            </Typography>
            <Stack direction="row" alignItems="center" spacing={1}
              sx={{ bgcolor: '#fff', border: '1px solid #d1fae5', borderRadius: 2, px: 1.5, py: 1 }}>
              <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: '#065f46', flex: 1, wordBreak: 'break-all' }}>
                {app.connectInfo}
              </Typography>
              <Tooltip title="Copy email">
                <IconButton size="small" onClick={() => navigator.clipboard.writeText(app.connectInfo!)}
                  sx={{ color: '#15803d', flexShrink: 0 }}>
                  <ContentCopyIcon sx={{ fontSize: 15 }} />
                </IconButton>
              </Tooltip>
            </Stack>
            <Typography sx={{ fontSize: 11.5, color: '#6b7280', mt: 1.25 }}>
              The spreadsheet URL and sheet name will be configured when you use this integration in a flow.
            </Typography>
          </Box>
        ) : (
          <>
            {app.fields.map(renderField)}
            {isEditMode && app.fields.some((f) => f.isSecret) && (
              <Typography sx={{ fontSize: 11.5, color: '#9ca3af' }}>
                Secret fields are hidden. Enter a new value to update, or leave blank to keep existing.
              </Typography>
            )}
          </>
        )}

        {/* Actions & Triggers info */}
        {(app.actions.length > 0 || app.triggers.length > 0) && (
          <>
            <Divider />
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              {app.actions.length > 0 && (
                <Box sx={{ flex: 1, minWidth: 180 }}>
                  <Stack direction="row" spacing={0.5} alignItems="center" mb={0.75}>
                    <BoltIcon sx={{ fontSize: 14, color: '#f59e0b' }} />
                    <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>Actions</Typography>
                  </Stack>
                  <Stack spacing={0.4}>
                    {app.actions.map((a) => (
                      <Typography key={a.key} sx={{ fontSize: 11.5, color: '#6b7280' }}>• {a.label}</Typography>
                    ))}
                  </Stack>
                </Box>
              )}
              {app.triggers.length > 0 && (
                <Box sx={{ flex: 1, minWidth: 180 }}>
                  <Stack direction="row" spacing={0.5} alignItems="center" mb={0.75}>
                    <NotificationsNoneIcon sx={{ fontSize: 14, color: '#8b5cf6' }} />
                    <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>Triggers</Typography>
                  </Stack>
                  <Stack spacing={0.4}>
                    {app.triggers.map((t) => (
                      <Typography key={t.key} sx={{ fontSize: 11.5, color: '#6b7280' }}>• {t.label}</Typography>
                    ))}
                  </Stack>
                </Box>
              )}
            </Box>
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button onClick={onClose} disabled={loading} sx={{ color: '#6b7280', textTransform: 'none', fontWeight: 600 }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={14} color="inherit" /> : undefined}
          sx={{
            bgcolor: '#25D366', color: '#fff', fontWeight: 700, textTransform: 'none',
            borderRadius: 2, px: 3,
            '&:hover': { bgcolor: '#1db954' },
          }}
        >
          {loading ? 'Saving...' : isEditMode ? 'Update' : 'Connect'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConnectModal;
