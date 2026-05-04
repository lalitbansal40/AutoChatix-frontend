import { useState, useMemo } from 'react';
import {
  Box, Grid, Paper, Typography, Button, Chip, Avatar,
  Stack, IconButton, Tooltip, Switch, Divider, CircularProgress,
  InputAdornment, TextField,
} from '@mui/material';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import BoltIcon from '@mui/icons-material/Bolt';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import SearchIcon from '@mui/icons-material/Search';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import ConnectModal from 'components/integrations/ConnectModal';
import { integrationService } from 'service/integration.service';
import { channelService } from 'service/channel.service';
import { IntegrationDefinition, IntegrationT } from 'types/integration';
import { ChannelT } from 'types/channels';

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  payments:     { bg: '#eff6ff', text: '#1d4ed8' },
  logistics:    { bg: '#f0fdf4', text: '#15803d' },
  productivity: { bg: '#faf5ff', text: '#7c3aed' },
  ecommerce:    { bg: '#fef3c7', text: '#b45309' },
  crm:          { bg: '#fff7ed', text: '#c2410c' },
  other:        { bg: '#f9fafb', text: '#374151' },
};

const ALL_CATEGORIES = ['All', 'payments', 'logistics', 'productivity', 'ecommerce', 'crm', 'other'];

/* ─── Available App Card ─────────────────────────────────────── */
const AppCard = ({
  app,
  configuredCount,
  onConnect,
}: {
  app: IntegrationDefinition;
  configuredCount: number;
  onConnect: () => void;
}) => {
  const cat = CATEGORY_COLORS[app.category] ?? CATEGORY_COLORS.other;

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        height: '100%',
        border: '1.5px solid',
        borderColor: app.available ? '#e5e7eb' : '#f3f4f6',
        borderRadius: 2.5,
        opacity: app.available ? 1 : 0.55,
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
        bgcolor: '#fff',
        transition: 'all 0.18s',
        ...(app.available && {
          '&:hover': {
            borderColor: '#25D366',
            boxShadow: '0 6px 24px rgba(37,211,102,0.13)',
            transform: 'translateY(-2px)',
          },
        }),
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <Avatar
          sx={{
            bgcolor: app.bgColor, width: 42, height: 42,
            borderRadius: 2, fontSize: 19, fontWeight: 800, color: app.color,
          }}
        >
          {app.name[0]}
        </Avatar>
        <Chip
          label={app.category}
          size="small"
          sx={{ bgcolor: cat.bg, color: cat.text, fontWeight: 700, fontSize: 10, textTransform: 'capitalize', border: 'none', height: 20 }}
        />
      </Box>

      <Box sx={{ flex: 1 }}>
        <Typography sx={{ fontSize: 14, fontWeight: 700, color: '#111827', mb: 0.4 }}>
          {app.name}
        </Typography>
        <Typography sx={{ fontSize: 11.5, color: '#6b7280', lineHeight: 1.55 }}>
          {app.description}
        </Typography>
      </Box>

      <Stack direction="row" spacing={2}>
        <Stack direction="row" spacing={0.4} alignItems="center">
          <BoltIcon sx={{ fontSize: 12, color: '#f59e0b' }} />
          <Typography sx={{ fontSize: 11, color: '#9ca3af' }}>{app.actions.length} Actions</Typography>
        </Stack>
        <Stack direction="row" spacing={0.4} alignItems="center">
          <NotificationsNoneIcon sx={{ fontSize: 12, color: '#8b5cf6' }} />
          <Typography sx={{ fontSize: 11, color: '#9ca3af' }}>{app.triggers.length} Triggers</Typography>
        </Stack>
      </Stack>

      {configuredCount > 0 && (
        <Chip
          label={`${configuredCount} channel${configuredCount > 1 ? 's' : ''} connected`}
          size="small"
          sx={{ bgcolor: '#dcfce7', color: '#15803d', fontWeight: 700, fontSize: 10, width: 'fit-content', height: 20 }}
        />
      )}

      <Button
        variant={app.available ? 'contained' : 'outlined'}
        disabled={!app.available}
        onClick={onConnect}
        size="small"
        sx={
          app.available
            ? {
                bgcolor: '#25D366', color: '#fff', fontWeight: 700, fontSize: 12,
                borderRadius: 1.5, textTransform: 'none', mt: 0.5, py: 0.75,
                boxShadow: 'none',
                '&:hover': { bgcolor: '#1db954', boxShadow: '0 2px 8px rgba(37,211,102,0.3)' },
              }
            : {
                fontSize: 12, borderRadius: 1.5, textTransform: 'none',
                borderColor: '#e5e7eb', color: '#9ca3af', mt: 0.5, py: 0.75,
                bgcolor: '#fafafa',
              }
        }
      >
        {app.available ? 'Connect' : 'Coming Soon'}
      </Button>
    </Paper>
  );
};

/* ─── Configured Integration Row ─────────────────────────────── */
const ConfiguredCard = ({
  integration,
  app,
  channelName,
  onEdit,
  onToggle,
  onDelete,
  togglingId,
  deletingId,
}: {
  integration: IntegrationT;
  app: IntegrationDefinition | undefined;
  channelName: string;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
  togglingId: string | null;
  deletingId: string | null;
}) => {
  const cat = app ? (CATEGORY_COLORS[app.category] ?? CATEGORY_COLORS.other) : CATEGORY_COLORS.other;
  const displayName = app?.name ?? integration.slug;
  const color = app?.color ?? '#6b7280';
  const bgColor = app?.bgColor ?? '#f9fafb';
  const isToggling = togglingId === integration._id;
  const isDeleting = deletingId === integration._id;

  return (
    <Paper
      elevation={0}
      sx={{
        px: 2.5, py: 2, border: '1.5px solid #e5e7eb', borderRadius: 2.5,
        bgcolor: '#fff',
        opacity: isDeleting ? 0.5 : 1, transition: 'opacity 0.2s',
        '&:hover': { borderColor: '#d1d5db', boxShadow: '0 2px 10px rgba(0,0,0,0.06)' },
      }}
    >
      <Stack direction="row" alignItems="center" spacing={2}>
        <Avatar sx={{ bgcolor: bgColor, width: 38, height: 38, borderRadius: 2, fontSize: 16, fontWeight: 800, color, flexShrink: 0 }}>
          {displayName[0]}
        </Avatar>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" alignItems="center" spacing={0.75} flexWrap="wrap">
            <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: '#111827' }}>{displayName}</Typography>
            <Chip label={channelName} size="small" sx={{ bgcolor: '#f3f4f6', color: '#374151', fontSize: 10, fontWeight: 600, height: 18 }} />
            {app && (
              <Chip label={app.category} size="small" sx={{ bgcolor: cat.bg, color: cat.text, fontSize: 10, fontWeight: 600, textTransform: 'capitalize', height: 18 }} />
            )}
            <Chip
              label={integration.is_active ? 'Active' : 'Inactive'}
              size="small"
              sx={{
                bgcolor: integration.is_active ? '#dcfce7' : '#f9fafb',
                color: integration.is_active ? '#15803d' : '#9ca3af',
                fontWeight: 700, fontSize: 10, height: 18,
              }}
            />
          </Stack>

          {Object.keys(integration.config).length > 0 && (
            <Stack direction="row" spacing={1.5} flexWrap="wrap" mt={0.4}>
              {Object.entries(integration.config).map(([k, v]) => (
                <Typography key={k} sx={{ fontSize: 11, color: '#9ca3af' }}>
                  <span style={{ fontWeight: 600, color: '#6b7280' }}>{k}:</span> {String(v)}
                </Typography>
              ))}
            </Stack>
          )}
        </Box>

        {app && (
          <Stack direction="row" spacing={2} sx={{ display: { xs: 'none', md: 'flex' } }}>
            {app.actions.length > 0 && (
              <Stack direction="row" spacing={0.4} alignItems="center">
                <BoltIcon sx={{ fontSize: 11, color: '#f59e0b' }} />
                <Typography sx={{ fontSize: 10.5, color: '#9ca3af', whiteSpace: 'nowrap' }}>
                  {app.actions.map((a) => a.label).join(', ')}
                </Typography>
              </Stack>
            )}
            {app.triggers.length > 0 && (
              <Stack direction="row" spacing={0.4} alignItems="center">
                <NotificationsNoneIcon sx={{ fontSize: 11, color: '#8b5cf6' }} />
                <Typography sx={{ fontSize: 10.5, color: '#9ca3af', whiteSpace: 'nowrap' }}>
                  {app.triggers.map((t) => t.label).join(', ')}
                </Typography>
              </Stack>
            )}
          </Stack>
        )}

        <Stack direction="row" alignItems="center" spacing={0.25} flexShrink={0}>
          <Tooltip title={integration.is_active ? 'Disable' : 'Enable'}>
            <span>
              {isToggling
                ? <CircularProgress size={16} sx={{ mx: 1 }} />
                : <Switch
                    checked={integration.is_active}
                    onChange={onToggle}
                    size="small"
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': { color: '#25D366' },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#25D366' },
                    }}
                  />
              }
            </span>
          </Tooltip>
          <Tooltip title="Edit">
            <IconButton size="small" onClick={onEdit} sx={{ color: '#9ca3af', '&:hover': { color: '#111827', bgcolor: '#f3f4f6' } }}>
              <EditOutlinedIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton size="small" onClick={onDelete} disabled={isDeleting} sx={{ color: '#9ca3af', '&:hover': { color: '#ef4444', bgcolor: '#fef2f2' } }}>
              {isDeleting ? <CircularProgress size={14} /> : <DeleteOutlineIcon sx={{ fontSize: 16 }} />}
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>
    </Paper>
  );
};

/* ─── Filter Chip ────────────────────────────────────────────── */
const FilterChip = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
  <Chip
    label={label}
    onClick={onClick}
    size="small"
    sx={{
      cursor: 'pointer', fontWeight: 600, fontSize: 11.5,
      bgcolor: active ? '#25D366' : '#f3f4f6',
      color: active ? '#fff' : '#374151',
      border: 'none', height: 26,
      '&:hover': { bgcolor: active ? '#1db954' : '#e5e7eb' },
    }}
  />
);

/* ─── Main Page ──────────────────────────────────────────────── */
const Integrations = () => {
  const queryClient = useQueryClient();

  const [categoryFilter, setCategoryFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [channelFilter, setChannelFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<IntegrationDefinition | null>(null);
  const [editingIntegration, setEditingIntegration] = useState<IntegrationT | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: registry = [], isLoading: registryLoading } = useQuery({
    queryKey: ['integration-registry'],
    queryFn: () => integrationService.getRegistry(),
  });

  const { data: configured = [], isLoading } = useQuery({
    queryKey: ['integrations'],
    queryFn: () => integrationService.getIntegrations(),
  });

  const { data: channelsData } = useQuery({
    queryKey: ['channels'],
    queryFn: () => channelService.getChannels(),
  });
  const channels = useMemo<ChannelT[]>(() => channelsData?.data ?? [], [channelsData]);

  const channelMap = useMemo(
    () => Object.fromEntries(channels.map((c) => [c._id, c.channel_name])),
    [channels]
  );

  const registryMap = useMemo(
    () => Object.fromEntries(registry.map((a) => [a.slug, a])),
    [registry]
  );

  const configuredCountBySlug = useMemo(() => {
    const counts: Record<string, number> = {};
    configured.forEach((i) => { counts[i.slug] = (counts[i.slug] ?? 0) + 1; });
    return counts;
  }, [configured]);

  const categoryCountMap = useMemo(() => {
    const counts: Record<string, number> = { All: registry.length };
    registry.forEach((a) => { counts[a.category] = (counts[a.category] ?? 0) + 1; });
    return counts;
  }, [registry]);

  const visibleApps = useMemo(() => {
    let apps = registry;
    if (categoryFilter !== 'All') apps = apps.filter((a) => a.category === categoryFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      apps = apps.filter((a) => a.name.toLowerCase().includes(q) || a.description.toLowerCase().includes(q));
    }
    return apps;
  }, [registry, categoryFilter, search]);

  const visibleConfigured = useMemo(() => {
    if (channelFilter === 'all') return configured;
    return configured.filter((i) => i.channel_id === channelFilter);
  }, [configured, channelFilter]);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['integrations'] });

  const handleToggle = async (integration: IntegrationT) => {
    setTogglingId(integration._id);
    try {
      await integrationService.toggleIntegration(integration.slug, integration.channel_id);
      invalidate();
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (integration: IntegrationT) => {
    if (!window.confirm(`Disconnect ${registryMap[integration.slug]?.name ?? integration.slug}?`)) return;
    setDeletingId(integration._id);
    try {
      await integrationService.disconnectIntegration(integration.slug, integration.channel_id);
      invalidate();
    } finally {
      setDeletingId(null);
    }
  };

  const openConnect = (app: IntegrationDefinition) => {
    setSelectedApp(app);
    setEditingIntegration(null);
    setModalOpen(true);
  };

  const openEdit = (integration: IntegrationT) => {
    setSelectedApp(registryMap[integration.slug] ?? null);
    setEditingIntegration(integration);
    setModalOpen(true);
  };

  return (
    <Box sx={{ px: { xs: 2, md: 4 }, py: 3, bgcolor: '#f8fafc', minHeight: '100%' }}>

      {/* ── Page Header ── */}
      <Box mb={4}>
        <Typography sx={{ fontSize: 22, fontWeight: 800, color: '#111827', letterSpacing: -0.4, mb: 0.4 }}>
          Integrations
        </Typography>
        <Typography sx={{ fontSize: 13, color: '#6b7280' }}>
          Connect third-party apps to automate your WhatsApp workflows — per channel
        </Typography>
      </Box>

      {/* ── Section 1: Available Apps ── */}
      <Box
        mb={4}
        sx={{ bgcolor: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 3, p: { xs: 2, md: 3 } }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2.5}>
          <Typography sx={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>
            Available Apps
          </Typography>
          <Typography sx={{ fontSize: 12, color: '#9ca3af' }}>
            {registry.length} integrations
          </Typography>
        </Stack>

        {/* Search + Category filters */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }} mb={2.5}>
          <TextField
            size="small"
            placeholder="Search integrations…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: 16, color: '#9ca3af' }} />
                </InputAdornment>
              ),
            }}
            sx={{
              width: { xs: '100%', sm: 200 },
              '& .MuiOutlinedInput-root': {
                borderRadius: 2, fontSize: 12.5,
                '& fieldset': { borderColor: '#e5e7eb' },
                '&:hover fieldset': { borderColor: '#d1d5db' },
                '&.Mui-focused fieldset': { borderColor: '#25D366' },
              },
            }}
          />

          <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
            {ALL_CATEGORIES.map((cat) => {
              const count = categoryCountMap[cat] ?? 0;
              const label = cat === 'All' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1);
              return (
                <FilterChip
                  key={cat}
                  label={`${label}${count > 0 ? ` (${count})` : ''}`}
                  active={categoryFilter === cat}
                  onClick={() => setCategoryFilter(cat)}
                />
              );
            })}
          </Stack>
        </Stack>

        {registryLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress sx={{ color: '#25D366' }} size={28} />
          </Box>
        ) : visibleApps.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6, bgcolor: '#fafafa', borderRadius: 2, border: '1.5px dashed #e5e7eb' }}>
            <Typography fontSize={13} color="#9ca3af">No integrations match your search</Typography>
          </Box>
        ) : (
          <Grid container spacing={2}>
            {visibleApps.map((app) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={app.slug}>
                <AppCard
                  app={app}
                  configuredCount={configuredCountBySlug[app.slug] ?? 0}
                  onConnect={() => openConnect(app)}
                />
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      {/* ── Section 2: Configured Integrations ── */}
      <Box sx={{ bgcolor: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 3, p: { xs: 2, md: 3 } }}>

        {/* Header row */}
        <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ sm: 'center' }} justifyContent="space-between" spacing={1.5} mb={2.5}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Typography sx={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>
              Configured Integrations
            </Typography>
            {configured.length > 0 && (
              <Chip
                label={configured.length}
                size="small"
                sx={{ bgcolor: '#25D366', color: '#fff', fontWeight: 700, fontSize: 11, height: 20 }}
              />
            )}
          </Stack>

          {/* Channel filter */}
          {channels.length > 0 && configured.length > 0 && (
            <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
              <FilterChip
                label="All Channels"
                active={channelFilter === 'all'}
                onClick={() => setChannelFilter('all')}
              />
              {channels.map((ch) => (
                <FilterChip
                  key={ch._id}
                  label={ch.channel_name}
                  active={channelFilter === ch._id}
                  onClick={() => setChannelFilter(ch._id)}
                />
              ))}
            </Stack>
          )}
        </Stack>

        <Divider sx={{ mb: 2.5 }} />

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress sx={{ color: '#25D366' }} size={28} />
          </Box>
        ) : configured.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8, bgcolor: '#fafafa', borderRadius: 2, border: '1.5px dashed #e5e7eb' }}>
            <Typography fontSize={28} mb={1}>🔌</Typography>
            <Typography fontSize={14} fontWeight={700} color="#374151" mb={0.5}>
              No integrations configured yet
            </Typography>
            <Typography fontSize={12.5} color="#9ca3af">
              Pick an app above and click Connect to get started
            </Typography>
          </Box>
        ) : visibleConfigured.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 5, bgcolor: '#fafafa', borderRadius: 2, border: '1.5px dashed #e5e7eb' }}>
            <Typography fontSize={13} color="#9ca3af">
              No integrations for this channel
            </Typography>
          </Box>
        ) : (
          <Stack spacing={1.5}>
            {visibleConfigured.map((integration) => (
              <ConfiguredCard
                key={integration._id}
                integration={integration}
                app={registryMap[integration.slug]}
                channelName={channelMap[integration.channel_id] ?? 'Unknown channel'}
                onEdit={() => openEdit(integration)}
                onToggle={() => handleToggle(integration)}
                onDelete={() => handleDelete(integration)}
                togglingId={togglingId}
                deletingId={deletingId}
              />
            ))}
          </Stack>
        )}
      </Box>

      {/* ── Connect / Edit Modal ── */}
      <ConnectModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        app={selectedApp}
        channels={channels}
        editing={editingIntegration}
        onSuccess={invalidate}
      />
    </Box>
  );
};

export default Integrations;
