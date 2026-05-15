import React, { useState, useRef } from 'react';
import {
  Box, Button, Chip, CircularProgress, Dialog, DialogContent,
  Grid, IconButton, Stack, Switch, TextField, Tooltip, Typography,
  Collapse, Alert, MenuItem,
} from '@mui/material';
import PlanGateModal from 'components/PlanGateModal';
import { usePlanGate } from 'hooks/usePlanGate';
import {
  PlusOutlined, DeleteOutlined, EditOutlined,
  FileTextOutlined, CloudUploadOutlined, CloseOutlined,
  FunctionOutlined, SettingOutlined, CodeOutlined, GlobalOutlined,
  FileSearchOutlined, PictureOutlined, DownOutlined, RightOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import {
  aiConfigService, AiConfig, AiModel, AiToolType,
  AiFunction, CreateAiConfigPayload,
} from 'service/aiConfig.service';
import MainCard from 'components/MainCard';

// ─── Constants ───────────────────────────────────────────
const MODELS: { value: AiModel; label: string; note: string; badge?: string }[] = [
  { value: 'gpt-4o-mini',  label: 'GPT-4o Mini',  note: 'Fast & cheap',      badge: 'Recommended' },
  { value: 'gpt-4o',       label: 'GPT-4o',        note: 'Most capable'       },
  { value: 'gpt-4.1-nano', label: 'GPT-4.1 Nano',  note: 'Ultra-fast, lowest cost' },
  { value: 'gpt-4.1-mini', label: 'GPT-4.1 Mini',  note: 'Balanced speed & quality' },
  { value: 'gpt-4.1',      label: 'GPT-4.1',       note: 'Latest generation'  },
];

interface ToolDef {
  value: AiToolType;
  label: string;
  desc: string;
  icon: React.ReactNode;
  color: string;
  bg: string;
}

const TOOLS: ToolDef[] = [
  { value: 'file_search',        label: 'File Search',      desc: 'Search uploaded training documents', icon: <FileSearchOutlined />, color: '#2563eb', bg: '#eff6ff' },
  { value: 'web_search_preview', label: 'Web Search',       desc: 'Search the internet in real time',   icon: <GlobalOutlined />,     color: '#16a34a', bg: '#f0fdf4' },
  { value: 'code_interpreter',   label: 'Code Interpreter', desc: 'Run code and analyze data',          icon: <CodeOutlined />,       color: '#7c3aed', bg: '#f5f3ff' },
  { value: 'image_generation',   label: 'Image Generation', desc: 'Generate images with DALL·E',        icon: <PictureOutlined />,    color: '#db2777', bg: '#fdf2f8' },
];

const DEFAULT_FN = (): AiFunction => ({
  name: '',
  description: '',
  parameters: JSON.stringify({ type: 'object', properties: {}, required: [] }, null, 2),
  execution_type: 'static',
  api_method: 'GET',
  api_url: '',
  api_headers: '{}',
  api_body: '',
  result_path: '',
  expression: '',
  static_response: '',
});

const defaultForm = (): CreateAiConfigPayload => ({
  name: '', description: '', model: 'gpt-4o-mini',
  system_message: '', tools: [], functions: [],
});

const fmtSize = (b: number) =>
  b > 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : `${(b / 1024).toFixed(0)} KB`;

// ─── Sub-components ───────────────────────────────────────

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.8, mb: 1.5 }}>
    {children}
  </Typography>
);

const ToolCard = ({
  tool, selected, onClick,
}: { tool: ToolDef; selected: boolean; onClick: () => void }) => (
  <Box
    onClick={onClick}
    sx={{
      display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5,
      borderRadius: '10px', cursor: 'pointer', userSelect: 'none',
      border: '1.5px solid', transition: 'all 0.15s',
      borderColor: selected ? tool.color : '#e5e7eb',
      bgcolor: selected ? tool.bg : '#fafafa',
      '&:hover': { borderColor: tool.color, bgcolor: tool.bg },
    }}
  >
    <Box sx={{
      width: 34, height: 34, borderRadius: '8px', display: 'flex',
      alignItems: 'center', justifyContent: 'center', fontSize: 16,
      bgcolor: selected ? tool.color : '#e5e7eb', color: selected ? '#fff' : '#6b7280',
      flexShrink: 0, transition: 'all 0.15s',
    }}>
      {tool.icon}
    </Box>
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Typography sx={{ fontSize: 13, fontWeight: 600, color: selected ? tool.color : '#374151', lineHeight: 1.3 }}>
        {tool.label}
      </Typography>
      <Typography sx={{ fontSize: 11, color: '#9ca3af', lineHeight: 1.3 }}>{tool.desc}</Typography>
    </Box>
    <Box sx={{
      width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
      border: '2px solid', borderColor: selected ? tool.color : '#d1d5db',
      bgcolor: selected ? tool.color : 'transparent',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {selected && <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: '#fff' }} />}
    </Box>
  </Box>
);

// ─── Function Editor Row ───────────────────────────────────
const FnRow = ({
  fn, idx, onChange, onDelete,
}: { fn: AiFunction; idx: number; onChange: (f: AiFunction) => void; onDelete: () => void }) => {
  const [open, setOpen] = useState(idx === 0);
  const [jsonErr, setJsonErr] = useState('');

  const handleParams = (v: string) => {
    onChange({ ...fn, parameters: v });
    try { JSON.parse(v); setJsonErr(''); } catch { setJsonErr('Invalid JSON'); }
  };

  return (
    <Box sx={{ border: '1.5px solid #e5e7eb', borderRadius: '10px', overflow: 'hidden' }}>
      {/* Header */}
      <Stack direction="row" alignItems="center" sx={{ px: 1.5, py: 1, bgcolor: '#f9fafb', cursor: 'pointer' }}
        onClick={() => setOpen(!open)}>
        <Box sx={{ width: 28, height: 28, borderRadius: '7px', bgcolor: '#f0fdf4', border: '1px solid #bbf7d0',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#16a34a', mr: 1.5, flexShrink: 0 }}>
          <FunctionOutlined />
        </Box>
        <Typography sx={{ fontSize: 13, fontWeight: 600, flex: 1, color: fn.name ? '#111827' : '#9ca3af' }}>
          {fn.name || `function_${idx + 1}`}
        </Typography>
        <Stack direction="row" gap={0.5} onClick={e => e.stopPropagation()}>
          <IconButton size="small" color="error" onClick={onDelete} sx={{ p: 0.5 }}>
            <DeleteOutlined style={{ fontSize: 13 }} />
          </IconButton>
        </Stack>
        <Box sx={{ ml: 1, color: '#9ca3af', fontSize: 11 }}>
          {open ? <DownOutlined /> : <RightOutlined />}
        </Box>
      </Stack>

      <Collapse in={open}>
        <Stack spacing={1.5} sx={{ p: 1.5, borderTop: '1px solid #e5e7eb' }}>
          <Stack direction="row" gap={1.5}>
            <TextField fullWidth size="small" label="Function Name" placeholder="e.g. check_order_status"
              value={fn.name} onChange={e => onChange({ ...fn, name: e.target.value.replace(/\s/g, '_') })}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', fontSize: 13 } }}
              InputLabelProps={{ shrink: true, sx: { fontSize: 12 } }}
              helperText="Use snake_case, no spaces"
            />
            <TextField fullWidth size="small" label="Description"
              placeholder="What does this function do?"
              value={fn.description} onChange={e => onChange({ ...fn, description: e.target.value })}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', fontSize: 13 } }}
              InputLabelProps={{ shrink: true, sx: { fontSize: 12 } }}
            />
          </Stack>
          <TextField fullWidth size="small" label="Parameters (JSON Schema)" multiline rows={5}
            value={fn.parameters} onChange={e => handleParams(e.target.value)}
            error={!!jsonErr} helperText={jsonErr || 'Define input parameters as JSON Schema'}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', fontSize: 12, fontFamily: 'monospace' } }}
            InputLabelProps={{ shrink: true, sx: { fontSize: 12 } }}
          />
          <Stack direction="row" gap={1.5}>
            <TextField
              select
              fullWidth
              size="small"
              label="How to execute"
              value={fn.execution_type || 'static'}
              onChange={e => onChange({ ...fn, execution_type: e.target.value as any })}
              InputLabelProps={{ shrink: true, sx: { fontSize: 12 } }}
            >
              <MenuItem value="static">Static response</MenuItem>
              <MenuItem value="api">API call</MenuItem>
              <MenuItem value="calculation">Calculation</MenuItem>
            </TextField>
            <TextField
              fullWidth
              size="small"
              label="Result path"
              value={fn.result_path || ''}
              onChange={e => onChange({ ...fn, result_path: e.target.value })}
              placeholder="data.price"
              helperText="Optional dotted path from API result"
              InputLabelProps={{ shrink: true, sx: { fontSize: 12 } }}
            />
          </Stack>
          {(fn.execution_type || 'static') === 'api' && (
            <Stack spacing={1.5}>
              <Stack direction="row" gap={1.5}>
                <TextField
                  select
                  size="small"
                  label="Method"
                  value={fn.api_method || 'GET'}
                  onChange={e => onChange({ ...fn, api_method: e.target.value as any })}
                  sx={{ width: 140 }}
                  InputLabelProps={{ shrink: true, sx: { fontSize: 12 } }}
                >
                  {['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map(method => (
                    <MenuItem key={method} value={method}>{method}</MenuItem>
                  ))}
                </TextField>
                <TextField
                  fullWidth
                  size="small"
                  label="API URL"
                  value={fn.api_url || ''}
                  onChange={e => onChange({ ...fn, api_url: e.target.value })}
                  placeholder="https://api.example.com/products/{{product_id}}"
                  helperText="Use {{argument_name}} placeholders"
                  InputLabelProps={{ shrink: true, sx: { fontSize: 12 } }}
                />
              </Stack>
              <TextField
                fullWidth
                size="small"
                label="Headers JSON"
                value={fn.api_headers || '{}'}
                onChange={e => onChange({ ...fn, api_headers: e.target.value })}
                placeholder='{"Authorization":"Bearer ..."}'
                InputLabelProps={{ shrink: true, sx: { fontSize: 12 } }}
              />
              <TextField
                fullWidth
                size="small"
                label="Body JSON / template"
                multiline
                rows={3}
                value={fn.api_body || ''}
                onChange={e => onChange({ ...fn, api_body: e.target.value })}
                placeholder='{"sku":"{{sku}}"}'
                InputLabelProps={{ shrink: true, sx: { fontSize: 12 } }}
              />
            </Stack>
          )}
          {(fn.execution_type || 'static') === 'calculation' && (
            <TextField
              fullWidth
              size="small"
              label="Calculation expression"
              value={fn.expression || ''}
              onChange={e => onChange({ ...fn, expression: e.target.value })}
              placeholder="Number(args.price) * Number(args.qty)"
              helperText="Use args.<field>. Result is returned to AI."
              InputLabelProps={{ shrink: true, sx: { fontSize: 12 } }}
            />
          )}
          {(fn.execution_type || 'static') === 'static' && (
            <TextField
              fullWidth
              size="small"
              label="Static response"
              value={fn.static_response || ''}
              onChange={e => onChange({ ...fn, static_response: e.target.value })}
              placeholder="Function result returned to AI"
              InputLabelProps={{ shrink: true, sx: { fontSize: 12 } }}
            />
          )}
        </Stack>
      </Collapse>
    </Box>
  );
};

// ─── Config Card ──────────────────────────────────────────
const ConfigCard = ({
  config, onEdit, onDelete, onToggle, onUploadFile, onDeleteFile, uploading,
}: {
  config: AiConfig;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: (v: boolean) => void;
  onUploadFile: (f: File) => void;
  onDeleteFile: (fileId: string) => void;
  uploading: boolean;
}) => {
  const [filesOpen, setFilesOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const hasFiles = config.tools.includes('file_search');

  return (
    <Box sx={{
      border: '1.5px solid #e5e7eb', borderRadius: '14px', overflow: 'hidden',
      bgcolor: '#fff', transition: 'box-shadow 0.15s',
      '&:hover': { boxShadow: '0 4px 20px rgba(0,0,0,0.08)' },
      opacity: config.is_active ? 1 : 0.6,
    }}>
      {/* Header strip */}
      <Box sx={{ bgcolor: config.is_active ? '#f0fdf4' : '#f9fafb', px: 2, py: 1.25,
        borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box sx={{ width: 36, height: 36, borderRadius: '10px', bgcolor: config.is_active ? '#16a34a' : '#9ca3af',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
          🤖
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontSize: 14, fontWeight: 700, color: '#111827', lineHeight: 1.2 }} noWrap>
            {config.name}
          </Typography>
          {config.description && (
            <Typography sx={{ fontSize: 11, color: '#6b7280' }} noWrap>{config.description}</Typography>
          )}
        </Box>
        <Switch size="small" checked={config.is_active} onChange={e => onToggle(e.target.checked)} />
      </Box>

      {/* Body */}
      <Box sx={{ px: 2, py: 1.5 }}>
        <Stack direction="row" gap={0.75} flexWrap="wrap" mb={1.25}>
          <Chip label={config.model} size="small"
            sx={{ fontSize: 11, fontWeight: 600, bgcolor: '#f3f4f6', color: '#374151', height: 22 }} />
          {config.tools.map(t => {
            const td = TOOLS.find(x => x.value === t);
            return (
              <Chip key={t} label={td?.label || t} size="small" icon={<span style={{ fontSize: 10 }}>{React.isValidElement(td?.icon) ? td?.icon : null}</span>}
                sx={{ fontSize: 11, fontWeight: 500, height: 22, bgcolor: td?.bg, color: td?.color, border: `1px solid ${td?.color}20` }} />
            );
          })}
          {(config.functions?.length || 0) > 0 && (
            <Chip label={`${config.functions.length} fn`} size="small"
              icon={<FunctionOutlined style={{ fontSize: 10 }} />}
              sx={{ fontSize: 11, fontWeight: 500, height: 22, bgcolor: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' }} />
          )}
        </Stack>

        {config.system_message && (
          <Box sx={{ bgcolor: '#f9fafb', borderRadius: '8px', px: 1.5, py: 1, mb: 1.25 }}>
            <Typography sx={{ fontSize: 11.5, color: '#4b5563', lineHeight: 1.5,
              overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
              {config.system_message}
            </Typography>
          </Box>
        )}

        {/* File section */}
        {hasFiles && (
          <Box>
            <Stack direction="row" alignItems="center" justifyContent="space-between"
              onClick={() => setFilesOpen(!filesOpen)} sx={{ cursor: 'pointer', mb: 0.5 }}>
              <Stack direction="row" alignItems="center" gap={0.75}>
                <FileTextOutlined style={{ fontSize: 12, color: '#6b7280' }} />
                <Typography sx={{ fontSize: 11.5, fontWeight: 600, color: '#374151' }}>
                  Training Files
                </Typography>
                <Chip label={config.files.length} size="small"
                  sx={{ height: 16, fontSize: 10, fontWeight: 700, bgcolor: '#dbeafe', color: '#2563eb', px: 0 }} />
              </Stack>
              <Stack direction="row" alignItems="center" gap={0.5}>
                <Tooltip title="Upload file">
                  <IconButton size="small" component="label" onClick={e => e.stopPropagation()}
                    sx={{ p: 0.5, color: '#2563eb' }}>
                    {uploading ? <CircularProgress size={12} /> : <CloudUploadOutlined style={{ fontSize: 13 }} />}
                    <input type="file" hidden ref={fileRef}
                      onChange={e => { const f = e.target.files?.[0]; if (f) onUploadFile(f); if (fileRef.current) fileRef.current.value = ''; }}
                      accept=".pdf,.txt,.md,.docx,.csv,.json,.xlsx" />
                  </IconButton>
                </Tooltip>
                <Box sx={{ fontSize: 10, color: '#9ca3af' }}>{filesOpen ? <DownOutlined /> : <RightOutlined />}</Box>
              </Stack>
            </Stack>

            <Collapse in={filesOpen}>
              <Stack gap={0.5} mt={0.5}>
                {config.files.length === 0 && (
                  <Typography sx={{ fontSize: 11, color: '#9ca3af', fontStyle: 'italic', pl: 0.5 }}>
                    No files yet — upload to train the AI
                  </Typography>
                )}
                {config.files.map(f => (
                  <Stack key={f.openai_file_id} direction="row" alignItems="center" gap={0.75}
                    sx={{ bgcolor: '#f9fafb', borderRadius: '6px', px: 1, py: 0.5 }}>
                    <FileTextOutlined style={{ fontSize: 11, color: '#2563eb', flexShrink: 0 }} />
                    <Typography sx={{ fontSize: 11, flex: 1, minWidth: 0 }} noWrap title={f.name}>{f.name}</Typography>
                    <Typography sx={{ fontSize: 10, color: '#9ca3af', flexShrink: 0 }}>{fmtSize(f.size)}</Typography>
                    <IconButton size="small" sx={{ p: 0.25 }} onClick={() => onDeleteFile(f.openai_file_id)}>
                      <CloseOutlined style={{ fontSize: 10, color: '#ef4444' }} />
                    </IconButton>
                  </Stack>
                ))}
              </Stack>
            </Collapse>
          </Box>
        )}
      </Box>

      {/* Footer */}
      <Box sx={{ px: 2, py: 1, borderTop: '1px solid #f3f4f6', bgcolor: '#fafafa',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography sx={{ fontSize: 10, color: '#9ca3af', fontFamily: 'monospace' }}>
          {config._id.slice(-8)}
        </Typography>
        <Stack direction="row" gap={0.5}>
          <Tooltip title="Edit">
            <IconButton size="small" onClick={onEdit} sx={{ p: 0.75, '&:hover': { bgcolor: '#eff6ff', color: '#2563eb' } }}>
              <EditOutlined style={{ fontSize: 14 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton size="small" onClick={onDelete} sx={{ p: 0.75, '&:hover': { bgcolor: '#fef2f2', color: '#ef4444' } }}>
              <DeleteOutlined style={{ fontSize: 14 }} />
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>
    </Box>
  );
};

// ─── Main Page ────────────────────────────────────────────
export default function AiConfigs() {
  const qc = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const { guard, gateOpen, closeGate } = usePlanGate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'config' | 'functions'>('config');
  const [editingConfig, setEditingConfig] = useState<AiConfig | null>(null);
  const [form, setForm] = useState<CreateAiConfigPayload>(defaultForm());
  const [deleteTarget, setDeleteTarget] = useState<AiConfig | null>(null);
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);

  const { data: configs = [], isLoading } = useQuery({
    queryKey: ['ai-configs'],
    queryFn: () => aiConfigService.list(),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['ai-configs'] });

  const saveMutation = useMutation({
    mutationFn: (p: CreateAiConfigPayload) =>
      editingConfig ? aiConfigService.update(editingConfig._id, p) : aiConfigService.create(p),
    onSuccess: () => { invalidate(); enqueueSnackbar(editingConfig ? 'Updated' : 'Created', { variant: 'success' }); closeDialog(); },
    onError: (e: any) => enqueueSnackbar(e?.response?.data?.message || 'Save failed', { variant: 'error' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => aiConfigService.remove(id),
    onSuccess: () => { invalidate(); enqueueSnackbar('Deleted', { variant: 'success' }); setDeleteTarget(null); },
    onError: (e: any) => enqueueSnackbar(e?.response?.data?.message || 'Delete failed', { variant: 'error' }),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) => aiConfigService.update(id, { is_active }),
    onSuccess: invalidate,
  });

  const deleteFileMutation = useMutation({
    mutationFn: ({ configId, fileId }: { configId: string; fileId: string }) => aiConfigService.deleteFile(configId, fileId),
    onSuccess: () => { invalidate(); enqueueSnackbar('File removed', { variant: 'success' }); },
    onError: (e: any) => enqueueSnackbar(e?.response?.data?.message || 'Remove failed', { variant: 'error' }),
  });

  const openCreate = () => { setEditingConfig(null); setForm(defaultForm()); setActiveTab('config'); setDialogOpen(true); };

  const openEdit = (c: AiConfig) => {
    setEditingConfig(c);
    setForm({ name: c.name, description: c.description || '', model: c.model,
      system_message: c.system_message, tools: [...c.tools], functions: [...(c.functions || [])] });
    setActiveTab('config');
    setDialogOpen(true);
  };

  const closeDialog = () => { setDialogOpen(false); setEditingConfig(null); setForm(defaultForm()); };

  const toggleTool = (t: AiToolType) =>
    setForm(f => ({ ...f, tools: f.tools.includes(t) ? f.tools.filter(x => x !== t) : [...f.tools, t] }));

  const addFn = () => setForm(f => ({ ...f, functions: [...f.functions, DEFAULT_FN()] }));
  const updateFn = (i: number, fn: AiFunction) =>
    setForm(f => ({ ...f, functions: f.functions.map((x, j) => j === i ? fn : x) }));
  const removeFn = (i: number) =>
    setForm(f => ({ ...f, functions: f.functions.filter((_, j) => j !== i) }));

  const handleUpload = async (file: File, configId: string) => {
    setUploadingFor(configId);
    try { await aiConfigService.uploadFile(configId, file); invalidate(); enqueueSnackbar('File uploaded', { variant: 'success' }); }
    catch (e: any) { enqueueSnackbar(e?.response?.data?.message || 'Upload failed', { variant: 'error' }); }
    finally { setUploadingFor(null); }
  };

  const fnCount = form.functions.length;

  return (
    <MainCard
      title={
        <Stack direction="row" alignItems="center" gap={1.5}>
          <Box sx={{ width: 32, height: 32, borderRadius: '8px', bgcolor: '#f0fdf4', border: '1px solid #bbf7d0',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
            🤖
          </Box>
          <Box>
            <Typography sx={{ fontSize: 16, fontWeight: 700, lineHeight: 1.2 }}>AI Configs</Typography>
            <Typography sx={{ fontSize: 11, color: '#6b7280' }}>Manage AI assistants for your automations</Typography>
          </Box>
        </Stack>
      }
      secondary={
        <Button variant="contained" startIcon={<PlusOutlined />} onClick={() => guard(openCreate)}
          sx={{ borderRadius: '8px', bgcolor: '#16a34a', '&:hover': { bgcolor: '#15803d' }, fontWeight: 600 }}>
          New AI Config
        </Button>
      }
    >
      {isLoading && <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>}

      {!isLoading && configs.length === 0 && (
        <Box textAlign="center" py={10}>
          <Box sx={{ fontSize: 56, mb: 2 }}>🤖</Box>
          <Typography variant="h6" fontWeight={700} mb={1}>No AI Configs yet</Typography>
          <Typography color="text.secondary" mb={3} sx={{ fontSize: 13 }}>
            Create an AI Config to enable intelligent responses in your WhatsApp automations.
          </Typography>
          <Button variant="contained" startIcon={<PlusOutlined />} onClick={() => guard(openCreate)}
            sx={{ borderRadius: '8px', bgcolor: '#16a34a', '&:hover': { bgcolor: '#15803d' } }}>
            Create AI Config
          </Button>
        </Box>
      )}

      <Grid container spacing={2.5}>
        {configs.map(config => (
          <Grid item xs={12} sm={6} lg={4} key={config._id}>
            <ConfigCard
              config={config}
              onEdit={() => openEdit(config)}
              onDelete={() => setDeleteTarget(config)}
              onToggle={v => toggleMutation.mutate({ id: config._id, is_active: v })}
              onUploadFile={f => handleUpload(f, config._id)}
              onDeleteFile={fid => deleteFileMutation.mutate({ configId: config._id, fileId: fid })}
              uploading={uploadingFor === config._id}
            />
          </Grid>
        ))}
      </Grid>

      {/* ══════════════════════════════════════════
          CREATE / EDIT DIALOG
      ══════════════════════════════════════════ */}
      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="md" fullWidth
        PaperProps={{ sx: { borderRadius: '16px', overflow: 'hidden' } }}>

        {/* Dialog Header */}
        <Box sx={{ px: 3, py: 2, bgcolor: '#f9fafb', borderBottom: '1px solid #e5e7eb',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Stack direction="row" alignItems="center" gap={1.5}>
            <Box sx={{ width: 38, height: 38, borderRadius: '10px', bgcolor: '#16a34a',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
              🤖
            </Box>
            <Box>
              <Typography sx={{ fontSize: 16, fontWeight: 700, lineHeight: 1.2 }}>
                {editingConfig ? 'Edit AI Config' : 'New AI Config'}
              </Typography>
              <Typography sx={{ fontSize: 11, color: '#6b7280' }}>
                Configure your AI assistant for WhatsApp automation
              </Typography>
            </Box>
          </Stack>
          <IconButton onClick={closeDialog} size="small" sx={{ color: '#9ca3af' }}>
            <CloseOutlined />
          </IconButton>
        </Box>

        {/* Tab Bar */}
        <Box sx={{ display: 'flex', borderBottom: '1px solid #e5e7eb', bgcolor: '#fff' }}>
          {[
            { id: 'config', label: 'Configuration', icon: <SettingOutlined /> },
            { id: 'functions', label: 'Functions', icon: <FunctionOutlined />, count: fnCount },
          ].map(tab => (
            <Box
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              sx={{
                display: 'flex', alignItems: 'center', gap: 1, px: 3, py: 1.5,
                cursor: 'pointer', fontSize: 13, fontWeight: 600,
                borderBottom: '2px solid',
                borderColor: activeTab === tab.id ? '#16a34a' : 'transparent',
                color: activeTab === tab.id ? '#16a34a' : '#6b7280',
                '&:hover': { color: '#374151', bgcolor: '#f9fafb' },
                transition: 'all 0.15s',
              }}
            >
              {tab.icon}
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <Chip label={tab.count} size="small"
                  sx={{ height: 18, fontSize: 10, fontWeight: 700, bgcolor: '#f0fdf4', color: '#16a34a', ml: 0.25 }} />
              )}
            </Box>
          ))}
        </Box>

        <DialogContent sx={{ p: 3, bgcolor: '#fff' }}>

          {/* ── TAB: Configuration ── */}
          {activeTab === 'config' && (
            <Grid container spacing={2.5}>

              {/* Left Column */}
              <Grid item xs={12} md={5}>
                <Stack spacing={2}>
                  <Box>
                    <SectionLabel>Basic Info</SectionLabel>
                    <Stack spacing={1.5}>
                      <TextField fullWidth size="small" label="Name *"
                        value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                        placeholder="e.g. Customer Support Bot"
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                        InputLabelProps={{ shrink: true }} />
                      <TextField fullWidth size="small" label="Description"
                        value={form.description}
                        onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                        placeholder="Short description..."
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                        InputLabelProps={{ shrink: true }} />
                    </Stack>
                  </Box>

                  <Box>
                    <SectionLabel>Model</SectionLabel>
                    <Stack spacing={1}>
                      {MODELS.map(m => (
                        <Box key={m.value} onClick={() => setForm(f => ({ ...f, model: m.value }))}
                          sx={{
                            display: 'flex', alignItems: 'center', gap: 1.5, px: 1.5, py: 1,
                            borderRadius: '8px', cursor: 'pointer', userSelect: 'none',
                            border: '1.5px solid', transition: 'all 0.12s',
                            borderColor: form.model === m.value ? '#16a34a' : '#e5e7eb',
                            bgcolor: form.model === m.value ? '#f0fdf4' : '#fafafa',
                            '&:hover': { borderColor: '#16a34a', bgcolor: '#f0fdf4' },
                          }}>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Stack direction="row" alignItems="center" gap={1}>
                              <Typography sx={{ fontSize: 13, fontWeight: 600,
                                color: form.model === m.value ? '#16a34a' : '#374151' }}>
                                {m.label}
                              </Typography>
                              {m.badge && (
                                <Chip label={m.badge} size="small"
                                  sx={{ height: 16, fontSize: 9, fontWeight: 700, bgcolor: '#dcfce7', color: '#16a34a' }} />
                              )}
                            </Stack>
                            <Typography sx={{ fontSize: 11, color: '#6b7280' }}>{m.note}</Typography>
                          </Box>
                          <Box sx={{
                            width: 16, height: 16, borderRadius: '50%', flexShrink: 0,
                            border: '2px solid', borderColor: form.model === m.value ? '#16a34a' : '#d1d5db',
                            bgcolor: form.model === m.value ? '#16a34a' : 'transparent',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            {form.model === m.value && <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#fff' }} />}
                          </Box>
                        </Box>
                      ))}
                    </Stack>
                  </Box>
                </Stack>
              </Grid>

              {/* Right Column */}
              <Grid item xs={12} md={7}>
                <Stack spacing={2}>
                  <Box>
                    <SectionLabel>System Message</SectionLabel>
                    <TextField fullWidth multiline rows={7} size="small"
                      value={form.system_message}
                      onChange={e => setForm(f => ({ ...f, system_message: e.target.value }))}
                      placeholder={`You are a helpful assistant for [business name].\n\nYou help customers with:\n- Order tracking\n- Product information\n- General inquiries\n\nAlways reply in a friendly, professional tone.`}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', fontSize: 13 } }}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Box>

                  <Box>
                    <SectionLabel>Tools</SectionLabel>
                    <Grid container spacing={1}>
                      {TOOLS.map(tool => (
                        <Grid item xs={12} sm={6} key={tool.value}>
                          <ToolCard
                            tool={tool}
                            selected={form.tools.includes(tool.value)}
                            onClick={() => toggleTool(tool.value)}
                          />
                        </Grid>
                      ))}
                    </Grid>

                    {form.tools.includes('file_search') && !editingConfig && (
                      <Alert severity="info" sx={{ mt: 1.5, fontSize: 11, borderRadius: '8px' }}>
                        A vector store will be created. Upload training files after saving.
                      </Alert>
                    )}
                  </Box>
                </Stack>
              </Grid>
            </Grid>
          )}

          {/* ── TAB: Functions ── */}
          {activeTab === 'functions' && (
            <Stack spacing={2}>
              <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
                <Box>
                  <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>Custom Functions</Typography>
                  <Typography sx={{ fontSize: 12, color: '#6b7280', mt: 0.25 }}>
                    Define functions the AI can call. The AI decides when to invoke them based on user messages.
                  </Typography>
                </Box>
                <Button size="small" variant="outlined" startIcon={<PlusOutlined />} onClick={addFn}
                  sx={{ borderRadius: '8px', borderColor: '#16a34a', color: '#16a34a', fontWeight: 600,
                    '&:hover': { bgcolor: '#f0fdf4', borderColor: '#16a34a' }, flexShrink: 0 }}>
                  Add Function
                </Button>
              </Stack>

              {form.functions.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 6, border: '2px dashed #e5e7eb', borderRadius: '12px' }}>
                  <Box sx={{ fontSize: 40, mb: 1.5 }}>ƒ</Box>
                  <Typography sx={{ fontSize: 14, fontWeight: 600, color: '#374151', mb: 0.5 }}>No functions yet</Typography>
                  <Typography sx={{ fontSize: 12, color: '#6b7280', mb: 2 }}>
                    Add functions to let the AI fetch data or trigger actions dynamically.
                  </Typography>
                  <Button variant="outlined" size="small" startIcon={<PlusOutlined />} onClick={addFn}
                    sx={{ borderRadius: '8px', borderColor: '#16a34a', color: '#16a34a' }}>
                    Add Function
                  </Button>
                </Box>
              ) : (
                <Stack spacing={1.5}>
                  {form.functions.map((fn, i) => (
                    <FnRow key={i} fn={fn} idx={i}
                      onChange={updated => updateFn(i, updated)}
                      onDelete={() => removeFn(i)}
                    />
                  ))}
                </Stack>
              )}

              {form.functions.length > 0 && (
                <Alert severity="info" sx={{ fontSize: 11.5, borderRadius: '8px' }}>
                  <strong>Note:</strong> Function execution happens inside your automation flow. When the AI calls a function, the result is stored in session data for your next nodes to use.
                </Alert>
              )}
            </Stack>
          )}
        </DialogContent>

        {/* Dialog Footer */}
        <Box sx={{ px: 3, py: 2, borderTop: '1px solid #e5e7eb', display: 'flex',
          alignItems: 'center', justifyContent: 'space-between', bgcolor: '#f9fafb' }}>
          <Typography sx={{ fontSize: 11, color: '#9ca3af' }}>
            {form.tools.length} tool{form.tools.length !== 1 ? 's' : ''} · {form.functions.length} function{form.functions.length !== 1 ? 's' : ''}
          </Typography>
          <Stack direction="row" gap={1.5}>
            <Button onClick={closeDialog} sx={{ borderRadius: '8px', color: '#6b7280' }}>Cancel</Button>
            <Button variant="contained" disabled={!form.name.trim() || saveMutation.isPending}
              onClick={() => saveMutation.mutate(form)}
              sx={{ borderRadius: '8px', bgcolor: '#16a34a', '&:hover': { bgcolor: '#15803d' }, fontWeight: 600, px: 3 }}>
              {saveMutation.isPending
                ? <CircularProgress size={18} sx={{ color: '#fff' }} />
                : editingConfig ? 'Update' : 'Create'}
            </Button>
          </Stack>
        </Box>
      </Dialog>

      {/* ── Delete Confirm ── */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth
        PaperProps={{ sx: { borderRadius: '14px' } }}>
        <Box sx={{ px: 3, py: 2.5, textAlign: 'center' }}>
          <Box sx={{ fontSize: 40, mb: 1.5 }}>🗑️</Box>
          <Typography sx={{ fontSize: 16, fontWeight: 700, mb: 1 }}>Delete AI Config?</Typography>
          <Typography sx={{ fontSize: 13, color: '#6b7280', mb: 2.5 }}>
            <strong>{deleteTarget?.name}</strong> and all its uploaded files will be permanently deleted.
            This cannot be undone.
          </Typography>
          <Stack direction="row" gap={1.5} justifyContent="center">
            <Button onClick={() => setDeleteTarget(null)} sx={{ borderRadius: '8px', color: '#6b7280' }}>Cancel</Button>
            <Button variant="contained" color="error" disabled={deleteMutation.isPending}
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget._id)}
              sx={{ borderRadius: '8px', fontWeight: 600, px: 3 }}>
              {deleteMutation.isPending ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : 'Delete'}
            </Button>
          </Stack>
        </Box>
      </Dialog>
      <PlanGateModal open={gateOpen} onClose={closeGate} feature="create AI configs" />
    </MainCard>
  );
}
