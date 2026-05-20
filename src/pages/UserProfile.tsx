import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  Paper,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  ApiOutlined,
  BankOutlined,
  CheckOutlined,
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  KeyOutlined,
  LockOutlined,
  PlusOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axiosServices from 'utils/axios';
import useAuth from 'hooks/useAuth';
import MainCard from 'components/MainCard';

// ── Types ────────────────────────────────────────────────────────────────────

interface ApiKey {
  _id: string;
  name: string;
  key_prefix: string;
  key: string;
  createdAt: string;
  last_used_at?: string;
}

interface AccountInfo {
  _id: string;
  name: string;
  country_code: string;
  plan_type: string;
  createdAt: string;
}

// ── API helpers ───────────────────────────────────────────────────────────────

const fetchApiKeys = (): Promise<ApiKey[]> =>
  axiosServices.get('/api-keys').then((r) => r.data);

const createApiKey = (name: string): Promise<{ key: string; key_prefix: string; name: string }> =>
  axiosServices.post('/api-keys', { name }).then((r) => r.data);

const revokeApiKey = (id: string) => axiosServices.delete(`/api-keys/${id}`);

const renameApiKey = (id: string, name: string) =>
  axiosServices.patch(`/api-keys/${id}`, { name }).then((r) => r.data);

const updateProfile = (data: { name?: string; phone?: string }) =>
  axiosServices.put('/auth/me', data).then((r) => r.data.user);

const doChangePassword = (data: { current_password: string; new_password: string }) =>
  axiosServices.post('/auth/change-password', data).then((r) => r.data);

const fetchAccount = (): Promise<AccountInfo> =>
  axiosServices.get('/account').then((r) => r.data.account);

const updateAccountName = (name: string): Promise<AccountInfo> =>
  axiosServices.put('/account/name', { name }).then((r) => r.data.account);

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmtDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const PLAN_COLORS: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
  starter: 'default',
  growth: 'info',
  pro: 'success',
  enterprise: 'warning',
};

// ── Avatar with initials ───────────────────────────────────────────────────────

function InitialsAvatar({ name, size = 64 }: { name?: string; size?: number }) {
  const initials = (name || 'U')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  return (
    <Box
      sx={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        boxShadow: '0 4px 14px rgba(24,144,255,0.35)',
      }}
    >
      <Typography
        sx={{ color: '#fff', fontWeight: 700, fontSize: size * 0.35, lineHeight: 1, letterSpacing: 1 }}
      >
        {initials}
      </Typography>
    </Box>
  );
}

// ── CopyButton ────────────────────────────────────────────────────────────────

function CopyButton({ text, size = 'small' }: { text: string; size?: 'small' | 'medium' }) {
  const [copied, setCopied] = useState(false);
  return (
    <Tooltip title={copied ? 'Copied!' : 'Copy'}>
      <IconButton
        size={size}
        onClick={() => {
          navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }}
      >
        {copied ? <CheckOutlined style={{ color: '#52c41a' }} /> : <CopyOutlined />}
      </IconButton>
    </Tooltip>
  );
}

// ── API Keys Section ──────────────────────────────────────────────────────────

function ApiKeysSection() {
  const qc = useQueryClient();
  const [newKeyName, setNewKeyName] = useState('');
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [toast, setToast] = useState('');

  const { data: keys = [], isLoading } = useQuery({ queryKey: ['api-keys'], queryFn: fetchApiKeys });

  const createMutation = useMutation({
    mutationFn: createApiKey,
    onSuccess: (data) => {
      setNewKeyName('');
      qc.invalidateQueries({ queryKey: ['api-keys'] });
      // auto-reveal newly created key
      qc.getQueryData<ApiKey[]>(['api-keys'])?.forEach((k) => {
        if (k.key === data.key) setVisibleKeys((v) => new Set(v).add(k._id));
      });
      // give a moment for refetch then reveal by key prefix
      setTimeout(() => {
        const all = qc.getQueryData<ApiKey[]>(['api-keys']) || [];
        const found = all.find((k) => k.key === data.key || k.key_prefix === data.key_prefix);
        if (found) setVisibleKeys((v) => new Set(v).add(found._id));
      }, 500);
    },
    onError: (err: any) => setToast(err?.response?.data?.message || 'Failed to create key'),
  });

  const revokeMutation = useMutation({
    mutationFn: revokeApiKey,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['api-keys'] }); setToast('API key revoked'); },
    onError: () => setToast('Failed to revoke key'),
  });

  const renameMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => renameApiKey(id, name),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['api-keys'] }); setEditingId(null); },
    onError: () => setToast('Failed to rename'),
  });

  const toggleVisible = (id: string) =>
    setVisibleKeys((v) => { const n = new Set(v); n.has(id) ? n.delete(id) : n.add(id); return n; });

  return (
    <Box>
      {/* Generate bar */}
      <Stack direction="row" gap={1.5} mb={3} flexWrap="wrap">
        <TextField
          size="small"
          placeholder="Key name (e.g. my-integration)"
          value={newKeyName}
          onChange={(e) => setNewKeyName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && newKeyName.trim()) createMutation.mutate(newKeyName.trim());
          }}
          sx={{ flex: 1, minWidth: 220 }}
        />
        <Button
          variant="contained"
          startIcon={createMutation.isPending ? <CircularProgress size={14} color="inherit" /> : <PlusOutlined />}
          disabled={!newKeyName.trim() || createMutation.isPending}
          onClick={() => createMutation.mutate(newKeyName.trim())}
        >
          Generate Key
        </Button>
      </Stack>

      {isLoading ? (
        <Box display="flex" justifyContent="center" py={5}>
          <CircularProgress />
        </Box>
      ) : keys.length === 0 ? (
        <Box
          sx={{
            border: '2px dashed',
            borderColor: 'divider',
            borderRadius: 2,
            p: 5,
            textAlign: 'center',
            color: 'text.secondary',
          }}
        >
          <KeyOutlined style={{ fontSize: 36, marginBottom: 12, opacity: 0.4 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>No API keys yet</Typography>
          <Typography variant="body2">Generate a key above to integrate external apps with AutoChatix.</Typography>
        </Box>
      ) : (
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                {['Name', 'API Key', 'Created', 'Last Used', 'Actions'].map((h) => (
                  <TableCell key={h}>
                    <Typography variant="caption" fontWeight={700} color="text.secondary" textTransform="uppercase" letterSpacing={0.5}>
                      {h}
                    </Typography>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {keys.map((k) => {
                const visible = visibleKeys.has(k._id);
                const isEditing = editingId === k._id;
                return (
                  <TableRow key={k._id} hover sx={{ '&:last-child td': { borderBottom: 0 } }}>
                    {/* Name */}
                    <TableCell sx={{ minWidth: 160 }}>
                      {isEditing ? (
                        <Stack direction="row" gap={0.5} alignItems="center">
                          <TextField
                            size="small"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') renameMutation.mutate({ id: k._id, name: editName });
                              if (e.key === 'Escape') setEditingId(null);
                            }}
                            autoFocus
                            sx={{ width: 140 }}
                          />
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => renameMutation.mutate({ id: k._id, name: editName })}
                          >
                            <CheckOutlined />
                          </IconButton>
                        </Stack>
                      ) : (
                        <Stack direction="row" alignItems="center" gap={0.5}>
                          <Typography variant="body2" fontWeight={600}>{k.name}</Typography>
                          <Tooltip title="Rename">
                            <IconButton
                              size="small"
                              sx={{ opacity: 0, '.MuiTableRow-root:hover &': { opacity: 1 }, transition: 'opacity 0.15s' }}
                              onClick={() => { setEditingId(k._id); setEditName(k.name); }}
                            >
                              <EditOutlined style={{ fontSize: 13 }} />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      )}
                    </TableCell>

                    {/* Key */}
                    <TableCell sx={{ minWidth: 320 }}>
                      <Stack direction="row" alignItems="center" gap={0.5}>
                        <Box
                          component="code"
                          sx={{
                            fontFamily: 'monospace',
                            fontSize: 12,
                            bgcolor: 'grey.100',
                            px: 1.5,
                            py: 0.5,
                            borderRadius: 1,
                            letterSpacing: 0.5,
                            wordBreak: 'break-all',
                            flex: 1,
                          }}
                        >
                          {visible ? k.key : `${k.key_prefix}${'•'.repeat(26)}`}
                        </Box>
                        <Tooltip title={visible ? 'Hide key' : 'Show key'}>
                          <IconButton size="small" onClick={() => toggleVisible(k._id)}>
                            {visible ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                          </IconButton>
                        </Tooltip>
                        <CopyButton text={k.key} />
                      </Stack>
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2" color="text.secondary" noWrap>{fmtDate(k.createdAt)}</Typography>
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2" color="text.secondary" noWrap>{fmtDate(k.last_used_at)}</Typography>
                    </TableCell>

                    {/* Actions */}
                    <TableCell>
                      <Tooltip title="Revoke key">
                        <IconButton
                          size="small"
                          color="error"
                          disabled={revokeMutation.isPending}
                          onClick={() => {
                            if (window.confirm(`Revoke "${k.name}"? This cannot be undone.`))
                              revokeMutation.mutate(k._id);
                          }}
                        >
                          <DeleteOutlined />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Snackbar open={!!toast} autoHideDuration={3000} onClose={() => setToast('')} message={toast}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} />
    </Box>
  );
}

// ── Edit Profile ──────────────────────────────────────────────────────────────

function EditProfileSection() {
  const { user, setUser } = useAuth() as any;
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [toast, setToast] = useState('');

  const mutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: (updated) => { if (setUser) setUser(updated); setToast('Profile updated'); },
    onError: (err: any) => setToast(err?.response?.data?.message || 'Update failed'),
  });

  return (
    <Box>
      <Grid container spacing={2.5} maxWidth={640}>
        <Grid item xs={12} sm={6}>
          <TextField label="Full Name" value={name} onChange={(e) => setName(e.target.value)} size="small" fullWidth />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField label="Email" value={user?.email || ''} size="small" fullWidth disabled
            helperText="Email cannot be changed" />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} size="small" fullWidth />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField label="Role" value={user?.role || ''} size="small" fullWidth disabled />
        </Grid>
        <Grid item xs={12}>
          <Button
            variant="contained"
            disabled={mutation.isPending || (!name.trim() && !phone.trim())}
            onClick={() => mutation.mutate({ name, phone })}
            startIcon={mutation.isPending ? <CircularProgress size={14} color="inherit" /> : undefined}
          >
            Save Changes
          </Button>
        </Grid>
      </Grid>
      <Snackbar open={!!toast} autoHideDuration={3000} onClose={() => setToast('')} message={toast}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} />
    </Box>
  );
}

// ── Account Section ───────────────────────────────────────────────────────────

function AccountSection() {
  const { user, setUser } = useAuth() as any;
  const [toast, setToast] = useState('');
  const qc = useQueryClient();

  const { data: account, isLoading } = useQuery({ queryKey: ['account-info'], queryFn: fetchAccount });

  const [accName, setAccName] = useState('');
  const nameMutation = useMutation({
    mutationFn: updateAccountName,
    onSuccess: (updated) => {
      qc.setQueryData(['account-info'], updated);
      if (setUser) setUser({ ...user, account_name: updated.name });
      setToast('Account name updated');
    },
    onError: (err: any) => setToast(err?.response?.data?.message || 'Update failed'),
  });

  if (isLoading) return <Box display="flex" justifyContent="center" py={4}><CircularProgress /></Box>;

  const canEdit = user?.role === 'owner' || user?.role === 'admin' || user?.role === 'superadmin';

  return (
    <Box>
      {/* Plan badge */}
      <Paper
        variant="outlined"
        sx={{
          p: 2.5,
          mb: 3,
          borderRadius: 2,
          background: 'linear-gradient(135deg, #f0f5ff 0%, #e6f4ff 100%)',
          border: '1px solid #91caff',
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase" letterSpacing={0.5}>
              Current Plan
            </Typography>
            <Stack direction="row" alignItems="center" gap={1} mt={0.5}>
              <Typography variant="h5" fontWeight={700} textTransform="capitalize">{account?.plan_type}</Typography>
              <Chip
                label={account?.plan_type?.toUpperCase()}
                size="small"
                color={PLAN_COLORS[account?.plan_type || 'starter'] || 'default'}
                sx={{ fontWeight: 700 }}
              />
            </Stack>
          </Box>
          <Box textAlign="right">
            <Typography variant="caption" color="text.secondary">Country</Typography>
            <Typography variant="body1" fontWeight={600}>{account?.country_code || '—'}</Typography>
          </Box>
          <Box textAlign="right">
            <Typography variant="caption" color="text.secondary">Member Since</Typography>
            <Typography variant="body1" fontWeight={600}>{fmtDate(account?.createdAt)}</Typography>
          </Box>
        </Stack>
      </Paper>

      {/* Account name edit */}
      <Typography variant="subtitle1" fontWeight={600} mb={2}>Account Details</Typography>
      <Grid container spacing={2.5} maxWidth={640}>
        <Grid item xs={12} sm={8}>
          <TextField
            label="Account / Business Name"
            defaultValue={account?.name || ''}
            value={accName || account?.name || ''}
            onChange={(e) => setAccName(e.target.value)}
            size="small"
            fullWidth
            disabled={!canEdit}
            helperText={!canEdit ? 'Only owners can change the account name' : ''}
          />
        </Grid>
        {canEdit && (
          <Grid item xs={12} sm={4} display="flex" alignItems="flex-start" pt="4px !important">
            <Button
              variant="contained"
              disabled={nameMutation.isPending || !(accName || '').trim()}
              onClick={() => nameMutation.mutate(accName.trim())}
              startIcon={nameMutation.isPending ? <CircularProgress size={14} color="inherit" /> : undefined}
              sx={{ mt: 0.5 }}
              fullWidth
            >
              Update Name
            </Button>
          </Grid>
        )}
        <Grid item xs={12} sm={6}>
          <TextField label="Account ID" value={account?._id || ''} size="small" fullWidth disabled
            InputProps={{ endAdornment: <InputAdornment position="end"><CopyButton text={account?._id || ''} /></InputAdornment> }}
          />
        </Grid>
      </Grid>
      <Snackbar open={!!toast} autoHideDuration={3000} onClose={() => setToast('')} message={toast}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} />
    </Box>
  );
}

// ── Change Password ───────────────────────────────────────────────────────────

function ChangePasswordSection() {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [toast, setToast] = useState('');
  const [toastSev, setToastSev] = useState<'success' | 'error'>('success');

  const mutation = useMutation({
    mutationFn: doChangePassword,
    onSuccess: () => { setToast('Password changed'); setToastSev('success'); setCurrent(''); setNext(''); },
    onError: (err: any) => { setToast(err?.response?.data?.message || 'Failed'); setToastSev('error'); },
  });

  const strength = !next ? 0 : next.length < 8 ? 1 : /[A-Z]/.test(next) && /[0-9]/.test(next) ? 3 : 2;
  const strengthColor = ['', 'error.main', 'warning.main', 'success.main'][strength];
  const strengthLabel = ['', 'Weak', 'Fair', 'Strong'][strength];

  return (
    <Box>
      <Grid container spacing={2.5} maxWidth={480}>
        <Grid item xs={12}>
          <TextField
            label="Current Password"
            type={showCurrent ? 'text' : 'password'}
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            size="small"
            fullWidth
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setShowCurrent((v) => !v)}>
                    {showCurrent ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            label="New Password"
            type={showNext ? 'text' : 'password'}
            value={next}
            onChange={(e) => setNext(e.target.value)}
            size="small"
            fullWidth
            helperText={
              next ? (
                <Box component="span" sx={{ color: strengthColor }}>{strengthLabel} — {strength < 3 ? 'Add uppercase and numbers for stronger password' : 'Great password!'}</Box>
              ) : 'Minimum 8 characters'
            }
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setShowNext((v) => !v)}>
                    {showNext ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          {/* Strength bar */}
          {next && (
            <Stack direction="row" gap={0.5} mt={1}>
              {[1, 2, 3].map((lvl) => (
                <Box key={lvl} sx={{ flex: 1, height: 3, borderRadius: 1, bgcolor: strength >= lvl ? strengthColor : 'grey.200', transition: 'background 0.3s' }} />
              ))}
            </Stack>
          )}
        </Grid>
        <Grid item xs={12}>
          <Button
            variant="contained"
            color="warning"
            disabled={mutation.isPending || !current || next.length < 8}
            onClick={() => mutation.mutate({ current_password: current, new_password: next })}
            startIcon={mutation.isPending ? <CircularProgress size={14} color="inherit" /> : undefined}
          >
            Change Password
          </Button>
        </Grid>
      </Grid>
      <Snackbar open={!!toast} autoHideDuration={3000} onClose={() => setToast('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={toastSev} onClose={() => setToast('')}>{toast}</Alert>
      </Snackbar>
    </Box>
  );
}

// ── Tab definitions ───────────────────────────────────────────────────────────

const TABS = [
  { id: 'profile', label: 'Profile', icon: <UserOutlined />, content: EditProfileSection },
  { id: 'account', label: 'Account', icon: <BankOutlined />, content: AccountSection },
  { id: 'security', label: 'Security', icon: <LockOutlined />, content: ChangePasswordSection },
  { id: 'apikeys', label: 'API Keys', icon: <ApiOutlined />, content: ApiKeysSection },
] as const;

type TabId = typeof TABS[number]['id'];

// ── Main Page ─────────────────────────────────────────────────────────────────

const UserProfile = () => {
  const { user } = useAuth() as any;
  const [tab, setTab] = useState<TabId>('profile');

  const ActiveContent = TABS.find((t) => t.id === tab)!.content;

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      {/* ── Hero Header ── */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, sm: 3.5 },
          mb: 3,
          borderRadius: 3,
          background: 'linear-gradient(135deg, #001d3d 0%, #003366 60%, #0050b3 100%)',
          color: '#fff',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: -60,
            right: -60,
            width: 200,
            height: 200,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.04)',
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: -40,
            right: 80,
            width: 120,
            height: 120,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.03)',
          },
        }}
      >
        <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ sm: 'center' }} gap={3}>
          <InitialsAvatar name={user?.name} size={72} />
          <Box flex={1}>
            <Typography variant="h3" fontWeight={700} color="#fff" mb={0.5}>
              {user?.name || '—'}
            </Typography>
            <Stack direction="row" flexWrap="wrap" gap={1} alignItems="center">
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.65)' }}>{user?.email}</Typography>
              <Chip
                label={user?.role?.toUpperCase()}
                size="small"
                sx={{
                  height: 20,
                  fontSize: 10,
                  fontWeight: 700,
                  bgcolor: user?.role === 'superadmin' ? '#ff4d4f' : user?.role === 'owner' ? '#1890ff' : 'rgba(255,255,255,0.2)',
                  color: '#fff',
                  border: 0,
                }}
              />
              {user?.account_name && (
                <Chip
                  label={user.account_name}
                  size="small"
                  sx={{ height: 20, fontSize: 10, bgcolor: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.85)', border: 0 }}
                />
              )}
            </Stack>
          </Box>
          {/* Quick stats */}
          <Stack direction="row" gap={3} sx={{ display: { xs: 'none', md: 'flex' } }}>
            {[
              { label: 'Plan', value: user?.plan_type || 'starter', cap: true },
              { label: 'Role', value: user?.role || '—', cap: true },
            ].map((s) => (
              <Box key={s.label} textAlign="center">
                <Typography variant="h5" fontWeight={700} color="#fff" textTransform={s.cap ? 'capitalize' : undefined}>
                  {s.value}
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  {s.label}
                </Typography>
              </Box>
            ))}
          </Stack>
        </Stack>
      </Paper>

      {/* ── Tab Bar ── */}
      <Stack
        direction="row"
        gap={0}
        sx={{
          mb: 3,
          bgcolor: 'background.paper',
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          p: 0.5,
          display: 'inline-flex',
          flexWrap: 'wrap',
        }}
      >
        {TABS.map((t) => (
          <Button
            key={t.id}
            startIcon={t.icon}
            onClick={() => setTab(t.id)}
            sx={{
              borderRadius: 1.5,
              px: 2.5,
              py: 1,
              fontWeight: tab === t.id ? 600 : 400,
              bgcolor: tab === t.id ? 'primary.main' : 'transparent',
              color: tab === t.id ? '#fff' : 'text.secondary',
              '& .anticon': { color: tab === t.id ? '#fff' : undefined },
              '&:hover': {
                bgcolor: tab === t.id ? 'primary.dark' : 'action.hover',
                color: tab === t.id ? '#fff' : 'text.primary',
              },
              transition: 'all 0.18s ease',
              minWidth: { xs: 'auto', sm: 130 },
            }}
          >
            {t.label}
          </Button>
        ))}
      </Stack>

      {/* ── Panel ── */}
      <MainCard>
        <Box sx={{ p: { xs: 0.5, sm: 1 } }}>
          {/* Section title */}
          <Stack direction="row" alignItems="center" gap={1.5} mb={3}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: '10px',
                bgcolor: 'primary.lighter',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'primary.main',
                fontSize: 16,
              }}
            >
              {TABS.find((t) => t.id === tab)?.icon}
            </Box>
            <Box>
              <Typography variant="h5" fontWeight={600}>
                {tab === 'profile' && 'Personal Information'}
                {tab === 'account' && 'Account Settings'}
                {tab === 'security' && 'Change Password'}
                {tab === 'apikeys' && 'API Keys'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {tab === 'profile' && 'Update your name and contact details'}
                {tab === 'account' && 'Manage your account and business name'}
                {tab === 'security' && 'Keep your account secure with a strong password'}
                {tab === 'apikeys' && 'Generate keys for external integrations via X-API-Key header'}
              </Typography>
            </Box>
          </Stack>
          <Divider sx={{ mb: 3 }} />
          <ActiveContent />
        </Box>
      </MainCard>
    </Box>
  );
};

export default UserProfile;
