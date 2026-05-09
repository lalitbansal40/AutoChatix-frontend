import { useState, useMemo } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  InputAdornment,
  InputLabel,
  MenuItem,
  Pagination,
  Paper,
  Select,
  Snackbar,
  Stack,
  Switch,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'utils/axios';
import useAuth from 'hooks/useAuth';
import { UserOutlined, DeleteOutlined, LoginOutlined, PlusOutlined, SettingOutlined } from '@ant-design/icons';

const PLANS = ['starter', 'growth', 'pro', 'enterprise'] as const;
type Plan = (typeof PLANS)[number];

const PLAN_CHIP: Record<Plan, { label: string; color: 'default' | 'primary' | 'secondary' | 'success' | 'warning' }> = {
  starter:    { label: 'Starter',    color: 'default' },
  growth:     { label: 'Growth',     color: 'primary' },
  pro:        { label: 'Pro',        color: 'secondary' },
  enterprise: { label: 'Enterprise', color: 'success' },
};

const fetchAccounts = async () => {
  const res = await axios.get('/superadmin/accounts');
  return res.data.accounts;
};

const emptyForm = {
  account_name: '',
  owner_name: '',
  owner_email: '',
  owner_phone: '',
  password: '',
  plan_type: 'starter' as Plan,
};

const PAGE_SIZE = 20;

/* ─────────────────────────────────────────
   Account Manage Dialog (Wallet + Plan)
───────────────────────────────────────── */
const ManageDialog = ({
  acc,
  onClose,
  showToast,
}: {
  acc: any;
  onClose: () => void;
  showToast: (msg: string, sev?: 'success' | 'error') => void;
}) => {
  const qc = useQueryClient();
  const [tab, setTab] = useState(0);

  // Wallet state — balance/balance_limit stored in paise in DB, displayed in rupees
  const [wallet, setWallet] = useState({
    balance: (acc.wallet?.balance ?? 0) / 100,
    balance_limit: (acc.wallet?.balance_limit ?? 0) / 100,
    commission_percent: acc.wallet?.commission_percent ?? 10,
    commission_enabled: acc.wallet?.commission_enabled ?? true,
    meta_payer: acc.wallet?.meta_payer ?? 'customer',
  });

  // Subscription state
  const [sub, setSub] = useState({
    payment_status: acc.subscription?.payment_status ?? 'pending',
    is_active: acc.subscription?.is_active ?? false,
    payment_start_date: acc.subscription?.payment_start_date
      ? new Date(acc.subscription.payment_start_date).toISOString().split('T')[0]
      : '',
    payment_end_date: acc.subscription?.payment_end_date
      ? new Date(acc.subscription.payment_end_date).toISOString().split('T')[0]
      : '',
    extend_days: '',
  });

  const saveWallet = useMutation({
    mutationFn: () => axios.patch(`/superadmin/accounts/${acc._id}/wallet`, {
      balance: Number(wallet.balance),
      balance_limit: Number(wallet.balance_limit),
      commission_percent: Number(wallet.commission_percent),
      commission_enabled: wallet.commission_enabled,
      meta_payer: wallet.meta_payer,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sa-accounts'] }); showToast('Wallet updated'); },
    onError: () => showToast('Failed to update wallet', 'error'),
  });

  const saveSub = useMutation({
    mutationFn: (payload: any) => axios.patch(`/superadmin/accounts/${acc._id}/subscription`, payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sa-accounts'] }); showToast('Subscription updated'); },
    onError: () => showToast('Failed to update subscription', 'error'),
  });

  const handleExtend = (days: number) => {
    saveSub.mutate({ extend_days: days });
  };

  const handleSaveSub = () => {
    const payload: any = {
      payment_status: sub.payment_status,
      is_active: sub.is_active,
    };
    if (sub.payment_start_date) payload.payment_start_date = sub.payment_start_date;
    if (sub.payment_end_date) payload.payment_end_date = sub.payment_end_date;
    if (sub.extend_days) payload.extend_days = Number(sub.extend_days);
    saveSub.mutate(payload);
  };

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
      <DialogTitle sx={{ pb: 0 }}>
        <Typography variant="h5" fontWeight={700}>{acc.name}</Typography>
        <Typography variant="body2" color="text.secondary">{acc.owner?.email}</Typography>
      </DialogTitle>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label="Wallet & Billing" />
          <Tab label="Subscription / Plan" />
        </Tabs>
      </Box>

      <DialogContent>
        {/* ─── Tab 0: Wallet ─── */}
        {tab === 0 && (
          <Stack spacing={2.5} mt={1}>
            <Stack direction="row" spacing={2}>
              <TextField
                label="Wallet Balance (₹)"
                type="number"
                value={wallet.balance}
                onChange={(e) => setWallet({ ...wallet, balance: Number(e.target.value) })}
                fullWidth size="small"
                helperText="Current account wallet balance"
                InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
              />
              <TextField
                label="Max Limit (₹)"
                type="number"
                value={wallet.balance_limit}
                onChange={(e) => setWallet({ ...wallet, balance_limit: Number(e.target.value) })}
                fullWidth size="small"
                helperText="0 = no limit"
                InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
              />
            </Stack>
            <Divider>Meta Template Commission</Divider>
            <Stack direction="row" spacing={2} alignItems="center">
              <TextField
                label="Commission %"
                type="number"
                value={wallet.commission_percent}
                onChange={(e) => setWallet({ ...wallet, commission_percent: Number(e.target.value) })}
                size="small"
                sx={{ width: 160 }}
                InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
                helperText="% taken on each template"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={wallet.commission_enabled}
                    onChange={(e) => setWallet({ ...wallet, commission_enabled: e.target.checked })}
                  />
                }
                label="Commission Enabled"
              />
            </Stack>
            <Box>
              <InputLabel sx={{ mb: 0.75, fontSize: 13 }}>Meta Template Payer</InputLabel>
              <Select
                size="small"
                value={wallet.meta_payer}
                onChange={(e) => setWallet({ ...wallet, meta_payer: e.target.value })}
                sx={{ minWidth: 200 }}
              >
                <MenuItem value="customer">Customer (deducted from wallet)</MenuItem>
                <MenuItem value="platform">Platform (we pay)</MenuItem>
              </Select>
            </Box>
          </Stack>
        )}

        {/* ─── Tab 1: Subscription ─── */}
        {tab === 1 && (
          <Stack spacing={2.5} mt={1}>
            <Stack direction="row" spacing={2}>
              <Box flex={1}>
                <InputLabel sx={{ mb: 0.75, fontSize: 13 }}>Payment Status</InputLabel>
                <Select
                  size="small" fullWidth
                  value={sub.payment_status}
                  onChange={(e) => setSub({ ...sub, payment_status: e.target.value })}
                >
                  {['pending', 'paid', 'expired', 'cancelled'].map((s) => (
                    <MenuItem key={s} value={s} sx={{ textTransform: 'capitalize' }}>{s}</MenuItem>
                  ))}
                </Select>
              </Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={sub.is_active}
                    onChange={(e) => setSub({ ...sub, is_active: e.target.checked })}
                  />
                }
                label="Active"
                sx={{ mt: 2 }}
              />
            </Stack>

            <Stack direction="row" spacing={2}>
              <TextField
                label="Start Date"
                type="date"
                size="small"
                value={sub.payment_start_date}
                onChange={(e) => setSub({ ...sub, payment_start_date: e.target.value })}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
              <TextField
                label="End Date"
                type="date"
                size="small"
                value={sub.payment_end_date}
                onChange={(e) => setSub({ ...sub, payment_end_date: e.target.value })}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Stack>

            <Box>
              <Typography variant="body2" fontWeight={600} mb={1}>Quick Extend / Reduce</Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {[
                  { label: '+7 days', days: 7 },
                  { label: '+1 month', days: 30 },
                  { label: '+3 months', days: 90 },
                  { label: '+1 year', days: 365 },
                  { label: '−7 days', days: -7 },
                  { label: '−1 month', days: -30 },
                ].map(({ label, days }) => (
                  <Button
                    key={label}
                    size="small"
                    variant="outlined"
                    color={days < 0 ? 'error' : 'primary'}
                    onClick={() => handleExtend(days)}
                    disabled={saveSub.isPending}
                  >
                    {label}
                  </Button>
                ))}
              </Stack>
            </Box>

            <Stack direction="row" spacing={1} alignItems="center">
              <TextField
                label="Custom Days"
                type="number"
                size="small"
                value={sub.extend_days}
                onChange={(e) => setSub({ ...sub, extend_days: e.target.value })}
                sx={{ width: 140 }}
                placeholder="e.g. 15 or -5"
                helperText="Positive = extend, negative = reduce"
              />
              <Button
                variant="outlined"
                size="small"
                sx={{ mt: -1.5 }}
                disabled={!sub.extend_days || saveSub.isPending}
                onClick={() => saveSub.mutate({ extend_days: Number(sub.extend_days) })}
              >
                Apply
              </Button>
            </Stack>

            {acc.subscription?.payment_end_date && (
              <Alert severity="info" sx={{ py: 0.5 }}>
                Current end date: <b>{new Date(acc.subscription.payment_end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</b>
              </Alert>
            )}
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} color="inherit">Close</Button>
        {tab === 0 && (
          <Button variant="contained" disabled={saveWallet.isPending} onClick={() => saveWallet.mutate()}>
            {saveWallet.isPending ? 'Saving…' : 'Save Wallet'}
          </Button>
        )}
        {tab === 1 && (
          <Button variant="contained" disabled={saveSub.isPending} onClick={handleSaveSub}>
            {saveSub.isPending ? 'Saving…' : 'Save Subscription'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

/* ─────────────────────────────────────────
   Main SuperAdmin Page
───────────────────────────────────────── */
const SuperAdmin = () => {
  const qc = useQueryClient();
  const { impersonate } = useAuth() as any;

  const [toast, setToast] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false, message: '', severity: 'success',
  });
  const [createOpen, setCreateOpen] = useState(false);
  const [managingAcc, setManagingAcc] = useState<any | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const showToast = (message: string, severity: 'success' | 'error' = 'success') =>
    setToast({ open: true, message, severity });

  const { data: accounts = [], isLoading, isError } = useQuery({ queryKey: ['sa-accounts'], queryFn: fetchAccounts });

  const updatePlan = useMutation({
    mutationFn: ({ id, plan_type }: { id: string; plan_type: Plan }) =>
      axios.patch(`/superadmin/accounts/${id}/plan`, { plan_type }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sa-accounts'] }); showToast('Plan updated'); },
    onError: () => showToast('Failed to update plan', 'error'),
  });

  const createAccount = useMutation({
    mutationFn: (data: typeof form) => axios.post('/superadmin/accounts', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sa-accounts'] });
      setCreateOpen(false);
      setForm(emptyForm);
      showToast('Account created successfully');
    },
    onError: (err: any) => showToast(err?.response?.data?.message || 'Failed to create account', 'error'),
  });

  const deleteAccount = useMutation({
    mutationFn: (id: string) => axios.delete(`/superadmin/accounts/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sa-accounts'] }); showToast('Account deleted'); },
    onError: () => showToast('Failed to delete account', 'error'),
  });

  const handleImpersonate = async (userId: string, name: string) => {
    try {
      await impersonate(userId);
      showToast(`Now viewing as ${name}`);
    } catch {
      showToast('Impersonation failed', 'error');
    }
  };

  const filteredAccounts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return accounts;
    return accounts.filter((acc: any) =>
      acc.name?.toLowerCase().includes(q) ||
      acc.owner?.name?.toLowerCase().includes(q) ||
      acc.owner?.email?.toLowerCase().includes(q)
    );
  }, [accounts, search]);

  const totalPages = Math.max(1, Math.ceil(filteredAccounts.length / PAGE_SIZE));
  const pagedAccounts = filteredAccounts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (isLoading) return <Box display="flex" justifyContent="center" mt={10}><CircularProgress /></Box>;
  if (isError) return <Alert severity="error" sx={{ m: 3 }}>Failed to load accounts</Alert>;

  return (
    <Box p={3}>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight={700}>Super Admin Panel</Typography>
          <Typography variant="body2" color="text.secondary">
            {filteredAccounts.length} of {accounts.length} client account{accounts.length !== 1 ? 's' : ''}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <TextField
            size="small"
            placeholder="Search by name, owner, email…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            sx={{ width: 280 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                </InputAdornment>
              ),
            }}
          />
          <Button variant="contained" startIcon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
            New Account
          </Button>
        </Stack>
      </Stack>

      {/* Accounts Table */}
      <TableContainer component={Paper} sx={{ boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.50' }}>
              <TableCell sx={{ fontWeight: 700, width: '26%' }}>Account</TableCell>
              <TableCell sx={{ fontWeight: 700, width: '20%' }}>Owner</TableCell>
              <TableCell sx={{ fontWeight: 700, width: '16%' }}>Plan</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="center">Users</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="center">Channels</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="center">Automations</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="center">Wallet</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {pagedAccounts.map((acc: any) => {
              const plan = (acc.plan_type || 'starter') as Plan;
              const chip = PLAN_CHIP[plan] || PLAN_CHIP.starter;
              return (
                <TableRow key={acc._id} hover sx={{ '&:last-child td': { border: 0 } }}>
                  <TableCell>
                    <Typography fontWeight={600} fontSize={14}>{acc.name}</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                      {acc._id}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Box sx={{ width: 28, height: 28, borderRadius: '50%', bgcolor: 'primary.lighter', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <UserOutlined style={{ fontSize: 12, color: '#1677ff' }} />
                      </Box>
                      <Box>
                        <Typography fontSize={13} fontWeight={500}>{acc.owner?.name || '—'}</Typography>
                        <Typography variant="caption" color="text.secondary">{acc.owner?.email}</Typography>
                      </Box>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Stack spacing={0.5}>
                      <Select
                        size="small"
                        value={plan}
                        onChange={(e) => updatePlan.mutate({ id: acc._id, plan_type: e.target.value as Plan })}
                        sx={{ fontSize: 13, minWidth: 110 }}
                      >
                        {PLANS.map((p) => <MenuItem key={p} value={p} sx={{ textTransform: 'capitalize' }}>{p}</MenuItem>)}
                      </Select>
                      <Chip label={chip.label} color={chip.color} size="small" sx={{ width: 'fit-content' }} />
                    </Stack>
                  </TableCell>
                  <TableCell align="center">
                    <Typography fontSize={13}>{acc.stats?.users} / {acc.limits?.users === -1 ? '∞' : acc.limits?.users}</Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography fontSize={13}>{acc.stats?.channels} / {acc.limits?.channels === -1 ? '∞' : acc.limits?.channels}</Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography fontSize={13}>{acc.stats?.automations} / {acc.limits?.automations === -1 ? '∞' : acc.limits?.automations}</Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography fontSize={13} fontWeight={500} color={acc.wallet?.balance > 0 ? 'success.main' : 'text.secondary'}>
                      ₹{((acc.wallet?.balance ?? 0) / 100).toFixed(2)}
                    </Typography>
                    {acc.wallet?.balance_limit > 0 && (
                      <Typography variant="caption" color="text.secondary">
                        / ₹{((acc.wallet.balance_limit) / 100).toFixed(0)} max
                      </Typography>
                    )}
                    {acc.wallet?.commission_enabled && (
                      <Typography variant="caption" color="text.secondary"> {acc.wallet?.commission_percent ?? 10}% comm.</Typography>
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={0.75} justifyContent="flex-end">
                      <Tooltip title="Manage wallet & subscription">
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<SettingOutlined />}
                          onClick={() => setManagingAcc(acc)}
                          sx={{ fontSize: 12 }}
                        >
                          Manage
                        </Button>
                      </Tooltip>
                      {acc.owner && (
                        <Tooltip title={`Login as ${acc.owner.name}`}>
                          <Button
                            size="small"
                            variant="contained"
                            startIcon={<LoginOutlined />}
                            onClick={() => handleImpersonate(acc.owner._id, acc.owner.name)}
                            sx={{ fontSize: 12 }}
                          >
                            Login As
                          </Button>
                        </Tooltip>
                      )}
                      <Tooltip title="Delete account permanently">
                        <Button
                          size="small"
                          color="error"
                          variant="outlined"
                          startIcon={<DeleteOutlined />}
                          onClick={() => {
                            if (window.confirm(`Delete "${acc.name}"? This cannot be undone.`)) {
                              deleteAccount.mutate(acc._id);
                            }
                          }}
                          sx={{ fontSize: 12 }}
                        >
                          Delete
                        </Button>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              );
            })}
            {pagedAccounts.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                  <Typography color="text.secondary">
                    {search ? 'No accounts match your search.' : 'No client accounts yet.'}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {totalPages > 1 && (
        <Box display="flex" justifyContent="center" mt={2}>
          <Pagination count={totalPages} page={page} onChange={(_, v) => setPage(v)} color="primary" />
        </Box>
      )}

      {/* Manage Dialog */}
      {managingAcc && (
        <ManageDialog
          acc={managingAcc}
          onClose={() => setManagingAcc(null)}
          showToast={showToast}
        />
      )}

      {/* Create Account Dialog */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h5" fontWeight={700}>Create New Account</Typography>
          <Typography variant="body2" color="text.secondary">Set up a new client workspace with its owner.</Typography>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} mt={1}>
            <TextField
              label="Account / Company Name"
              value={form.account_name}
              onChange={(e) => setForm({ ...form, account_name: e.target.value })}
              fullWidth required placeholder="e.g. Agarwal Cake Zone"
            />
            <Divider>Owner Details</Divider>
            <Stack direction="row" spacing={2}>
              <TextField
                label="Owner Name"
                value={form.owner_name}
                onChange={(e) => setForm({ ...form, owner_name: e.target.value })}
                fullWidth required
              />
              <TextField
                label="Phone"
                value={form.owner_phone}
                onChange={(e) => setForm({ ...form, owner_phone: e.target.value })}
                fullWidth required placeholder="+91..."
              />
            </Stack>
            <TextField
              label="Owner Email"
              type="email"
              value={form.owner_email}
              onChange={(e) => setForm({ ...form, owner_email: e.target.value })}
              fullWidth required
            />
            <TextField
              label="Password"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              fullWidth required
            />
            <Box>
              <InputLabel sx={{ mb: 0.75, fontSize: 13 }}>Plan</InputLabel>
              <Select
                value={form.plan_type}
                onChange={(e) => setForm({ ...form, plan_type: e.target.value as Plan })}
                fullWidth size="small"
              >
                {PLANS.map((p) => <MenuItem key={p} value={p} sx={{ textTransform: 'capitalize' }}>{p}</MenuItem>)}
              </Select>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => { setCreateOpen(false); setForm(emptyForm); }} color="inherit">Cancel</Button>
          <Button
            variant="contained"
            disabled={createAccount.isPending || !form.account_name || !form.owner_email || !form.owner_phone || !form.password}
            onClick={() => createAccount.mutate(form)}
          >
            {createAccount.isPending ? 'Creating…' : 'Create Account'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={toast.open} autoHideDuration={4000} onClose={() => setToast({ ...toast, open: false })}>
        <Alert severity={toast.severity} onClose={() => setToast({ ...toast, open: false })}>{toast.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default SuperAdmin;
