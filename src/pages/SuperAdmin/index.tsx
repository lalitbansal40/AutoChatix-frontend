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
  IconButton,
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
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import SearchIcon from '@mui/icons-material/Search';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'utils/axios';
import useAuth from 'hooks/useAuth';
import { UserOutlined, DeleteOutlined, LoginOutlined, PlusOutlined, SettingOutlined } from '@ant-design/icons';

const PLANS = ['starter', 'growth', 'pro', 'enterprise'] as const;
type Plan = (typeof PLANS)[number];

const COUNTRIES: { code: string; name: string }[] = [
  { code: 'IN', name: '🇮🇳 India' }, { code: 'US', name: '🇺🇸 United States' }, { code: 'GB', name: '🇬🇧 United Kingdom' },
  { code: 'AE', name: '🇦🇪 UAE' }, { code: 'SG', name: '🇸🇬 Singapore' }, { code: 'AU', name: '🇦🇺 Australia' },
  { code: 'CA', name: '🇨🇦 Canada' }, { code: 'DE', name: '🇩🇪 Germany' }, { code: 'FR', name: '🇫🇷 France' },
  { code: 'SA', name: '🇸🇦 Saudi Arabia' }, { code: 'QA', name: '🇶🇦 Qatar' }, { code: 'KW', name: '🇰🇼 Kuwait' },
  { code: 'BH', name: '🇧🇭 Bahrain' }, { code: 'OM', name: '🇴🇲 Oman' }, { code: 'MY', name: '🇲🇾 Malaysia' },
  { code: 'PH', name: '🇵🇭 Philippines' }, { code: 'ID', name: '🇮🇩 Indonesia' }, { code: 'TH', name: '🇹🇭 Thailand' },
  { code: 'BD', name: '🇧🇩 Bangladesh' }, { code: 'PK', name: '🇵🇰 Pakistan' }, { code: 'LK', name: '🇱🇰 Sri Lanka' },
  { code: 'NP', name: '🇳🇵 Nepal' }, { code: 'NG', name: '🇳🇬 Nigeria' }, { code: 'KE', name: '🇰🇪 Kenya' },
  { code: 'ZA', name: '🇿🇦 South Africa' }, { code: 'GH', name: '🇬🇭 Ghana' }, { code: 'EG', name: '🇪🇬 Egypt' },
  { code: 'BR', name: '🇧🇷 Brazil' }, { code: 'MX', name: '🇲🇽 Mexico' }, { code: 'AR', name: '🇦🇷 Argentina' },
  { code: 'JP', name: '🇯🇵 Japan' }, { code: 'KR', name: '🇰🇷 South Korea' }, { code: 'CN', name: '🇨🇳 China' },
  { code: 'HK', name: '🇭🇰 Hong Kong' }, { code: 'IT', name: '🇮🇹 Italy' }, { code: 'ES', name: '🇪🇸 Spain' },
  { code: 'NL', name: '🇳🇱 Netherlands' }, { code: 'RU', name: '🇷🇺 Russia' }, { code: 'TR', name: '🇹🇷 Turkey' },
  { code: 'NZ', name: '🇳🇿 New Zealand' }, { code: 'VN', name: '🇻🇳 Vietnam' },
];

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
  country_code: 'IN',
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

  // Wallet state — balance/balance_limit stored in micro-units in DB, displayed in rupees
  const [wallet, setWallet] = useState({
    balance: (acc.wallet?.balance ?? 0) / 1000000,
    balance_limit: (acc.wallet?.balance_limit ?? 0) / 1000000,
    template_commission_percent: acc.wallet?.template_commission_percent ?? acc.wallet?.commission_percent ?? 15,
    template_commission_enabled: acc.wallet?.template_commission_enabled ?? acc.wallet?.commission_enabled ?? true,
    ai_commission_percent: acc.wallet?.ai_commission_percent ?? acc.wallet?.commission_percent ?? 15,
    ai_commission_enabled: acc.wallet?.ai_commission_enabled ?? acc.wallet?.commission_enabled ?? true,
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
      template_commission_percent: Number(wallet.template_commission_percent),
      template_commission_enabled: wallet.template_commission_enabled,
      ai_commission_percent: Number(wallet.ai_commission_percent),
      ai_commission_enabled: wallet.ai_commission_enabled,
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

  // WA Flow limit override
  const [flowLimitInput, setFlowLimitInput] = useState<string>(
    acc.wa_flow_limit_override != null ? String(acc.wa_flow_limit_override) : ''
  );
  const saveFlowLimit = useMutation({
    mutationFn: (val: number | null) => axios.patch(`/superadmin/accounts/${acc._id}/flow-limit`, { wa_flow_limit: val }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sa-accounts'] }); showToast('Flow limit updated'); },
    onError: () => showToast('Failed to update flow limit', 'error'),
  });

  // Channel + User limit overrides
  const [channelLimitInput, setChannelLimitInput] = useState<string>(
    acc.channel_limit_override != null ? String(acc.channel_limit_override) : ''
  );
  const [userLimitInput, setUserLimitInput] = useState<string>(
    acc.user_limit_override != null ? String(acc.user_limit_override) : ''
  );
  const saveLimits = useMutation({
    mutationFn: (payload: { channel_limit?: number | null; user_limit?: number | null }) =>
      axios.patch(`/superadmin/accounts/${acc._id}/limits`, payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sa-accounts'] }); showToast('Limits updated'); },
    onError: () => showToast('Failed to update limits', 'error'),
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
            <Divider>Template Commission</Divider>
            <Stack direction="row" spacing={2} alignItems="center">
              <TextField
                label="Template Commission %"
                type="number"
                value={wallet.template_commission_percent}
                onChange={(e) => setWallet({ ...wallet, template_commission_percent: Number(e.target.value) })}
                size="small"
                sx={{ width: 160 }}
                InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
                helperText="% added on WhatsApp template usage"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={wallet.template_commission_enabled}
                    onChange={(e) => setWallet({ ...wallet, template_commission_enabled: e.target.checked })}
                  />
                }
                label="Template commission enabled"
              />
            </Stack>
            <Divider>AI Commission</Divider>
            <Stack direction="row" spacing={2} alignItems="center">
              <TextField
                label="AI Commission %"
                type="number"
                value={wallet.ai_commission_percent}
                onChange={(e) => setWallet({ ...wallet, ai_commission_percent: Number(e.target.value) })}
                size="small"
                sx={{ width: 160 }}
                InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
                helperText="% added on OpenAI usage"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={wallet.ai_commission_enabled}
                    onChange={(e) => setWallet({ ...wallet, ai_commission_enabled: e.target.checked })}
                  />
                }
                label="AI commission enabled"
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

            <Divider>Channel & User Limits</Divider>
            <Stack direction="row" spacing={2}>
              {/* Channels */}
              {(() => {
                const planDefault = acc.channel_limit_override != null ? null : acc.limits?.channels;
                const effectiveLimit = acc.channel_limit_override != null ? acc.channel_limit_override : (acc.limits?.channels ?? 1);
                const used = acc.stats?.channels ?? 0;
                const isCustom = acc.channel_limit_override != null;
                const currentVal = Number(channelLimitInput !== '' ? channelLimitInput : effectiveLimit);
                return (
                  <Box sx={{ flex: 1, border: '1px solid #e2e8f0', borderRadius: 2, p: 1.5 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                      <Typography fontSize={12} fontWeight={700} color="#475569">📱 Channels</Typography>
                      {isCustom && <Chip label="Custom" size="small" sx={{ fontSize: 9, height: 16, bgcolor: '#dbeafe', color: '#1d4ed8', fontWeight: 700 }} />}
                    </Stack>
                    <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
                      <Typography fontSize={11} color="#94a3b8">Used: <b style={{ color: '#1e293b' }}>{used}</b></Typography>
                      <Typography fontSize={11} color="#94a3b8">Limit: <b style={{ color: currentVal === -1 ? '#16a34a' : '#1e293b' }}>{currentVal === -1 ? '∞' : currentVal}</b></Typography>
                    </Stack>
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <IconButton size="small" disabled={saveLimits.isPending || currentVal <= 1}
                        onClick={() => {
                          const next = currentVal - 1;
                          setChannelLimitInput(String(next));
                          saveLimits.mutate({ channel_limit: next });
                        }}
                        sx={{ border: '1px solid #e2e8f0', borderRadius: '6px', p: 0.4, '&:hover': { bgcolor: '#fee2e2', borderColor: '#fca5a5' } }}>
                        <RemoveIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                      <Box sx={{ flex: 1, textAlign: 'center', px: 1, py: 0.5, border: '1px solid #e2e8f0', borderRadius: '6px', bgcolor: '#f8fafc' }}>
                        <Typography fontSize={15} fontWeight={800} color="#1e293b">{currentVal === -1 ? '∞' : currentVal}</Typography>
                      </Box>
                      <IconButton size="small" disabled={saveLimits.isPending}
                        onClick={() => {
                          const next = currentVal + 1;
                          setChannelLimitInput(String(next));
                          saveLimits.mutate({ channel_limit: next });
                        }}
                        sx={{ border: '1px solid #e2e8f0', borderRadius: '6px', p: 0.4, '&:hover': { bgcolor: '#dcfce7', borderColor: '#86efac' } }}>
                        <AddIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                    </Stack>
                    {isCustom && (
                      <Button fullWidth size="small" color="error" variant="text" disabled={saveLimits.isPending}
                        onClick={() => { setChannelLimitInput(''); saveLimits.mutate({ channel_limit: null }); }}
                        sx={{ mt: 0.75, fontSize: 10, py: 0.25 }}>
                        Reset to plan default ({planDefault === -1 ? '∞' : planDefault})
                      </Button>
                    )}
                  </Box>
                );
              })()}

              {/* Users */}
              {(() => {
                const planDefault = acc.user_limit_override != null ? null : acc.limits?.users;
                const effectiveLimit = acc.user_limit_override != null ? acc.user_limit_override : (acc.limits?.users ?? 2);
                const used = acc.stats?.users ?? 0;
                const isCustom = acc.user_limit_override != null;
                const currentVal = Number(userLimitInput !== '' ? userLimitInput : effectiveLimit);
                return (
                  <Box sx={{ flex: 1, border: '1px solid #e2e8f0', borderRadius: 2, p: 1.5 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                      <Typography fontSize={12} fontWeight={700} color="#475569">👤 Users</Typography>
                      {isCustom && <Chip label="Custom" size="small" sx={{ fontSize: 9, height: 16, bgcolor: '#dbeafe', color: '#1d4ed8', fontWeight: 700 }} />}
                    </Stack>
                    <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
                      <Typography fontSize={11} color="#94a3b8">Used: <b style={{ color: '#1e293b' }}>{used}</b></Typography>
                      <Typography fontSize={11} color="#94a3b8">Limit: <b style={{ color: currentVal === -1 ? '#16a34a' : '#1e293b' }}>{currentVal === -1 ? '∞' : currentVal}</b></Typography>
                    </Stack>
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <IconButton size="small" disabled={saveLimits.isPending || currentVal <= 1}
                        onClick={() => {
                          const next = currentVal - 1;
                          setUserLimitInput(String(next));
                          saveLimits.mutate({ user_limit: next });
                        }}
                        sx={{ border: '1px solid #e2e8f0', borderRadius: '6px', p: 0.4, '&:hover': { bgcolor: '#fee2e2', borderColor: '#fca5a5' } }}>
                        <RemoveIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                      <Box sx={{ flex: 1, textAlign: 'center', px: 1, py: 0.5, border: '1px solid #e2e8f0', borderRadius: '6px', bgcolor: '#f8fafc' }}>
                        <Typography fontSize={15} fontWeight={800} color="#1e293b">{currentVal === -1 ? '∞' : currentVal}</Typography>
                      </Box>
                      <IconButton size="small" disabled={saveLimits.isPending}
                        onClick={() => {
                          const next = currentVal + 1;
                          setUserLimitInput(String(next));
                          saveLimits.mutate({ user_limit: next });
                        }}
                        sx={{ border: '1px solid #e2e8f0', borderRadius: '6px', p: 0.4, '&:hover': { bgcolor: '#dcfce7', borderColor: '#86efac' } }}>
                        <AddIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                    </Stack>
                    {isCustom && (
                      <Button fullWidth size="small" color="error" variant="text" disabled={saveLimits.isPending}
                        onClick={() => { setUserLimitInput(''); saveLimits.mutate({ user_limit: null }); }}
                        sx={{ mt: 0.75, fontSize: 10, py: 0.25 }}>
                        Reset to plan default ({planDefault === -1 ? '∞' : planDefault})
                      </Button>
                    )}
                  </Box>
                );
              })()}
            </Stack>

            <Divider>WhatsApp Flows Limit</Divider>
            <Box>
              <Typography variant="body2" color="text.secondary" mb={1.5} fontSize={12}>
                Plan default: <b>{acc.limits?.wa_flows === -1 ? 'Unlimited' : (acc.limits?.wa_flows ?? 0)}</b> flows.
                Set a custom override below (−1 = unlimited, empty = use plan default).
                Currently using: <b>{acc.stats?.wa_flows ?? 0}</b> flows.
              </Typography>
              <Stack direction="row" spacing={1.5} alignItems="flex-start">
                <TextField
                  label="Custom WA Flow Limit"
                  type="number"
                  size="small"
                  value={flowLimitInput}
                  onChange={(e) => setFlowLimitInput(e.target.value)}
                  placeholder="e.g. 3 or -1 for unlimited"
                  helperText="-1 = unlimited · empty = use plan default"
                  sx={{ width: 220 }}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">🔀</InputAdornment>,
                  }}
                />
                <Stack direction="row" spacing={1} mt={0.5}>
                  <Button
                    variant="contained"
                    size="small"
                    disabled={saveFlowLimit.isPending}
                    onClick={() => {
                      const val = flowLimitInput.trim() === '' ? null : Number(flowLimitInput);
                      saveFlowLimit.mutate(val);
                    }}
                    sx={{ bgcolor: '#7c3aed', '&:hover': { bgcolor: '#6d28d9' }, fontSize: 12, borderRadius: '8px' }}
                  >
                    Save Limit
                  </Button>
                  {acc.wa_flow_limit_override != null && (
                    <Button
                      variant="outlined"
                      size="small"
                      color="error"
                      disabled={saveFlowLimit.isPending}
                      onClick={() => { setFlowLimitInput(''); saveFlowLimit.mutate(null); }}
                      sx={{ fontSize: 12, borderRadius: '8px' }}
                    >
                      Reset to Plan
                    </Button>
                  )}
                </Stack>
              </Stack>
            </Box>
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
   Email Panel (superadmin send + inbox)
───────────────────────────────────────── */
const EmailPanel = ({ showToast }: { showToast: (msg: string, sev?: 'success' | 'error') => void }) => {
  const [emailTab, setEmailTab] = useState(0); // 0=Compose, 1=Inbox
  const [form, setForm] = useState({ to: '', subject: '', body: '', is_html: false });
  const [sending, setSending] = useState(false);

  // Inbox state
  const [inboxEmails, setInboxEmails] = useState<any[]>([]);
  const [inboxLoading, setInboxLoading] = useState(false);
  const [inboxTotal, setInboxTotal] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [inboxPage, setInboxPage] = useState(1);
  const [selectedEmail, setSelectedEmail] = useState<any | null>(null);

  const loadInbox = async (page = 1) => {
    setInboxLoading(true);
    try {
      const res = await axios.get('/superadmin/email/inbox', { params: { page, limit: 20 } });
      setInboxEmails(res.data.emails || []);
      setInboxTotal(res.data.total || 0);
      setUnreadCount(res.data.unread || 0);
      setInboxPage(page);
    } catch {
      showToast('Failed to load inbox', 'error');
    } finally {
      setInboxLoading(false);
    }
  };

  const handleOpenEmail = async (email: any) => {
    setSelectedEmail(email);
    if (!email.is_read) {
      try {
        await axios.patch(`/superadmin/email/inbox/${email._id}/read`);
        setInboxEmails((prev) => prev.map((e) => e._id === email._id ? { ...e, is_read: true } : e));
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch { /* silent */ }
    }
  };

  const handleDeleteEmail = async (id: string) => {
    try {
      await axios.delete(`/superadmin/email/inbox/${id}`);
      setInboxEmails((prev) => prev.filter((e) => e._id !== id));
      if (selectedEmail?._id === id) setSelectedEmail(null);
      showToast('Email deleted');
    } catch {
      showToast('Failed to delete', 'error');
    }
  };

  const handleSend = async () => {
    if (!form.to || !form.subject || !form.body) {
      showToast('Please fill all fields', 'error');
      return;
    }
    setSending(true);
    try {
      await axios.post('/superadmin/email/send', form);
      showToast('Email sent successfully!');
      setForm({ to: '', subject: '', body: '', is_html: false });
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Failed to send email', 'error');
    } finally {
      setSending(false);
    }
  };

  // Load inbox when switching to inbox tab
  const handleTabChange = (_: any, v: number) => {
    setEmailTab(v);
    if (v === 1) loadInbox(1);
  };

  const inboxTotalPages = Math.max(1, Math.ceil(inboxTotal / 20));

  return (
    <Box sx={{ px: { xs: 2, md: 4 }, py: 3, maxWidth: 900 }}>
      <Paper sx={{ borderRadius: 3, overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>

        {/* Header */}
        <Box sx={{ background: 'linear-gradient(135deg, #0a0f1e 0%, #0d1f3c 100%)', px: 3, py: 2.5 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" alignItems="center" gap={1.5}>
              <Box sx={{
                width: 40, height: 40, borderRadius: '10px',
                background: 'linear-gradient(135deg, #3b82f6, #60a5fa)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
              }}>✉️</Box>
              <Box>
                <Typography variant="h6" fontWeight={800} sx={{ color: '#fff', lineHeight: 1.2 }}>Email</Typography>
                <Typography variant="caption" sx={{ color: '#64748b' }}>hello@autochatix.com</Typography>
              </Box>
            </Stack>
            {unreadCount > 0 && (
              <Chip
                label={`${unreadCount} unread`}
                size="small"
                sx={{ bgcolor: '#ef4444', color: '#fff', fontWeight: 700, fontSize: 11 }}
              />
            )}
          </Stack>

          {/* Sub-tabs */}
          <Box sx={{ mt: 1.5 }}>
            <Tabs value={emailTab} onChange={handleTabChange}
              sx={{
                minHeight: 34,
                '& .MuiTab-root': { color: '#64748b', fontWeight: 600, fontSize: 12.5, textTransform: 'none', minHeight: 34, py: 0.5 },
                '& .Mui-selected': { color: '#fff !important' },
                '& .MuiTabs-indicator': { bgcolor: '#3b82f6', height: 2.5, borderRadius: '2px 2px 0 0' },
              }}>
              <Tab label="✏️  Compose" />
              <Tab label={`📥  Inbox${unreadCount > 0 ? ` (${unreadCount})` : ''}`} />
            </Tabs>
          </Box>
        </Box>

        {/* ── COMPOSE ── */}
        {emailTab === 0 && (
          <Box sx={{ p: 3 }}>
            <Stack spacing={2.5}>
              <TextField
                label="To (Recipient Email)" type="email" value={form.to}
                onChange={(e) => setForm({ ...form, to: e.target.value })}
                fullWidth placeholder="customer@example.com"
                InputProps={{ startAdornment: <InputAdornment position="start" sx={{ color: '#64748b' }}>📧</InputAdornment> }}
              />
              <TextField
                label="Subject" value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                fullWidth placeholder="Your subject line here…"
              />
              <Box>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={0.75}>
                  <Typography variant="caption" fontWeight={600} color="#475569" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Message Body
                  </Typography>
                  <FormControlLabel
                    control={<Switch size="small" checked={form.is_html} onChange={(e) => setForm({ ...form, is_html: e.target.checked })} />}
                    label={<Typography variant="caption" color="#64748b">HTML mode</Typography>}
                    sx={{ m: 0 }}
                  />
                </Stack>
                <TextField
                  multiline rows={10} value={form.body}
                  onChange={(e) => setForm({ ...form, body: e.target.value })}
                  fullWidth
                  placeholder={form.is_html ? '<p>Your HTML email content here...</p>' : 'Type your message here…'}
                  sx={{ '& .MuiOutlinedInput-root': { fontFamily: form.is_html ? 'monospace' : 'inherit', fontSize: form.is_html ? 13 : 14 } }}
                />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="contained" size="large"
                  disabled={sending || !form.to || !form.subject || !form.body}
                  onClick={handleSend}
                  sx={{ bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' }, fontWeight: 700, borderRadius: '10px', px: 4, boxShadow: '0 4px 14px rgba(59,130,246,0.35)' }}
                >
                  {sending ? 'Sending…' : 'Send Email →'}
                </Button>
              </Box>
            </Stack>
          </Box>
        )}

        {/* ── INBOX ── */}
        {emailTab === 1 && (
          <Box sx={{ display: 'flex', minHeight: 480 }}>

            {/* Email list */}
            <Box sx={{ width: 340, flexShrink: 0, borderRight: '1px solid #f1f5f9', overflow: 'auto' }}>
              {inboxLoading ? (
                <Box display="flex" justifyContent="center" alignItems="center" height={200}>
                  <CircularProgress size={28} />
                </Box>
              ) : inboxEmails.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <Typography fontSize={36} mb={1}>📭</Typography>
                  <Typography fontSize={13} color="#94a3b8" fontWeight={600}>Inbox is empty</Typography>
                  <Typography fontSize={12} color="#cbd5e1" mt={0.5}>Emails sent to hello@autochatix.com<br/>will appear here</Typography>
                </Box>
              ) : (
                <>
                  {inboxEmails.map((email) => (
                    <Box
                      key={email._id}
                      onClick={() => handleOpenEmail(email)}
                      sx={{
                        px: 2, py: 1.75, cursor: 'pointer', borderBottom: '1px solid #f1f5f9',
                        bgcolor: selectedEmail?._id === email._id ? '#eff6ff' : email.is_read ? '#fff' : '#f0f9ff',
                        borderLeft: `3px solid ${selectedEmail?._id === email._id ? '#3b82f6' : email.is_read ? 'transparent' : '#3b82f6'}`,
                        '&:hover': { bgcolor: '#f8fafc' },
                      }}
                    >
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={0.3}>
                        <Typography fontSize={12.5} fontWeight={email.is_read ? 500 : 700} color="#0f172a" noWrap sx={{ maxWidth: 200 }}>
                          {email.from_name || email.from_email}
                        </Typography>
                        <Typography fontSize={10.5} color="#94a3b8" flexShrink={0} ml={1}>
                          {new Date(email.received_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                        </Typography>
                      </Stack>
                      <Typography fontSize={12} fontWeight={email.is_read ? 400 : 600} color="#374151" noWrap mb={0.25}>
                        {email.subject}
                      </Typography>
                      <Typography fontSize={11} color="#94a3b8" noWrap>
                        {(email.body_text || '').slice(0, 60)}
                      </Typography>
                    </Box>
                  ))}
                  {inboxTotalPages > 1 && (
                    <Box display="flex" justifyContent="center" py={1.5}>
                      <Pagination count={inboxTotalPages} page={inboxPage} size="small"
                        onChange={(_, p) => loadInbox(p)} color="primary" />
                    </Box>
                  )}
                </>
              )}
            </Box>

            {/* Email detail */}
            <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
              {!selectedEmail ? (
                <Box sx={{ textAlign: 'center', pt: 8 }}>
                  <Typography fontSize={40} mb={1}>👆</Typography>
                  <Typography fontSize={13} color="#94a3b8">Select an email to read it</Typography>
                </Box>
              ) : (
                <Stack spacing={2}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Typography fontSize={18} fontWeight={700} color="#0f172a" sx={{ flex: 1, pr: 2 }}>
                      {selectedEmail.subject}
                    </Typography>
                    <IconButton size="small" color="error" onClick={() => handleDeleteEmail(selectedEmail._id)}>
                      <DeleteOutlined style={{ fontSize: 16 }} />
                    </IconButton>
                  </Stack>

                  <Box sx={{ bgcolor: '#f8fafc', borderRadius: 2, p: 2, border: '1px solid #e2e8f0' }}>
                    <Stack direction="row" spacing={2}>
                      <Box sx={{ width: 36, height: 36, borderRadius: '50%', bgcolor: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                        {(selectedEmail.from_name || selectedEmail.from_email || '?')[0].toUpperCase()}
                      </Box>
                      <Box>
                        <Typography fontSize={13} fontWeight={700} color="#0f172a">
                          {selectedEmail.from_name || selectedEmail.from_email}
                        </Typography>
                        <Typography fontSize={11.5} color="#64748b">{selectedEmail.from_email}</Typography>
                        <Typography fontSize={11} color="#94a3b8">
                          {new Date(selectedEmail.received_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                        </Typography>
                      </Box>
                    </Stack>
                  </Box>

                  <Divider />

                  {selectedEmail.body_html ? (
                    <Box
                      sx={{ fontSize: 14, lineHeight: 1.7, color: '#374151', '& a': { color: '#3b82f6' } }}
                      dangerouslySetInnerHTML={{ __html: selectedEmail.body_html }}
                    />
                  ) : (
                    <Typography fontSize={14} color="#374151" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
                      {selectedEmail.body_text || '(empty)'}
                    </Typography>
                  )}
                </Stack>
              )}
            </Box>
          </Box>
        )}
      </Paper>
    </Box>
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
  const [mainTab, setMainTab] = useState(0);
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

  /* ── summary stats ── */
  const totalActive = accounts.filter((a: any) => a.subscription?.is_active).length;
  const totalWallet = accounts.reduce((s: number, a: any) => s + (a.wallet?.balance ?? 0), 0) / 1_000_000;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc' }}>

      {/* ── Dark hero header ── */}
      <Box sx={{
        background: 'linear-gradient(135deg, #0a0f1e 0%, #0d1f3c 60%, #0f2b52 100%)',
        px: { xs: 2.5, md: 4 }, pt: 3.5, pb: 4,
      }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={2}>
          <Box>
            <Stack direction="row" alignItems="center" gap={1.5} mb={0.5}>
              <Box sx={{
                width: 38, height: 38, borderRadius: '10px',
                background: 'linear-gradient(135deg, #00a854, #00d68f)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
              }}>🛡️</Box>
              <Typography variant="h5" fontWeight={800} sx={{ color: '#fff', letterSpacing: -0.5 }}>
                Super Admin Panel
              </Typography>
            </Stack>
            <Typography variant="body2" sx={{ color: '#64748b', ml: 6.5 }}>
              Platform owner · Full access to all client accounts
            </Typography>
          </Box>

          <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
            <TextField
              size="small"
              placeholder="Search by name, owner, email…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              sx={{
                width: 260,
                '& .MuiOutlinedInput-root': {
                  bgcolor: 'rgba(255,255,255,0.07)',
                  '& fieldset': { borderColor: 'rgba(255,255,255,0.15)' },
                  '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                  '&.Mui-focused fieldset': { borderColor: '#00a854' },
                },
                '& input': { color: '#fff', '&::placeholder': { color: '#64748b' } },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" sx={{ color: '#64748b' }} />
                  </InputAdornment>
                ),
              }}
            />
            <Button
              variant="contained"
              startIcon={<PlusOutlined />}
              onClick={() => setCreateOpen(true)}
              sx={{
                bgcolor: '#00a854', '&:hover': { bgcolor: '#008c44' },
                fontWeight: 700, borderRadius: '10px', px: 2.5, py: 1,
                boxShadow: '0 4px 14px rgba(0,168,84,0.4)',
              }}
            >
              New Account
            </Button>
          </Stack>
        </Stack>

        {/* Main nav tabs */}
        <Box sx={{ mt: 2.5 }}>
          <Tabs
            value={mainTab}
            onChange={(_, v) => setMainTab(v)}
            sx={{
              '& .MuiTab-root': { color: '#64748b', fontWeight: 600, fontSize: 13, textTransform: 'none', minHeight: 38, py: 0.75 },
              '& .Mui-selected': { color: '#fff !important' },
              '& .MuiTabs-indicator': { bgcolor: '#00a854', height: 3, borderRadius: '3px 3px 0 0' },
            }}
          >
            <Tab label="🏢  Accounts" />
            <Tab label="✉️  Email" />
          </Tabs>
        </Box>

        {/* Stats row (accounts tab only) */}
        {mainTab === 0 && <Stack direction="row" spacing={2} mt={2} flexWrap="wrap">
          {[
            { label: 'Total Accounts', value: accounts.length, icon: '🏢', color: '#3b82f6' },
            { label: 'Active Plans', value: totalActive, icon: '✅', color: '#00a854' },
            { label: 'Inactive', value: accounts.length - totalActive, icon: '⚠️', color: '#f59e0b' },
            { label: 'Total Wallet', value: `₹${totalWallet.toFixed(2)}`, icon: '💰', color: '#a855f7' },
          ].map(({ label, value, icon, color }) => (
            <Box key={label} sx={{
              bgcolor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 2, px: 2.5, py: 1.5, minWidth: 140,
            }}>
              <Stack direction="row" alignItems="center" gap={1}>
                <Typography fontSize={18}>{icon}</Typography>
                <Box>
                  <Typography variant="h6" fontWeight={700} sx={{ color, lineHeight: 1.2 }}>{value}</Typography>
                  <Typography variant="caption" sx={{ color: '#64748b' }}>{label}</Typography>
                </Box>
              </Stack>
            </Box>
          ))}
          <Box sx={{ flex: 1 }} />
          <Box sx={{ display: 'flex', alignItems: 'flex-end' }}>
            <Typography variant="caption" sx={{ color: '#334155' }}>
              Showing {filteredAccounts.length} of {accounts.length}
            </Typography>
          </Box>
        </Stack>}
      </Box>

      {/* ── Email Panel ── */}
      {mainTab === 1 && <EmailPanel showToast={showToast} />}

      {/* ── Table ── */}
      {mainTab === 0 && <Box sx={{ px: { xs: 2, md: 4 }, py: 3 }}>
        <Paper sx={{ borderRadius: 2, border: '1px solid #e2e8f0', boxShadow: '0 1px 6px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f1f5f9' }}>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5, color: '#475569', width: '24%' }}>Account</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5, color: '#475569', width: '20%' }}>Owner</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5, color: '#475569', width: '14%' }}>Plan</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5, color: '#475569' }} align="center">Users</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5, color: '#475569' }} align="center">Channels</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5, color: '#475569' }} align="center">Automations</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5, color: '#7c3aed' }} align="center">WA Flows</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5, color: '#475569' }} align="center">Wallet</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5, color: '#475569' }} align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pagedAccounts.map((acc: any) => {
                  const plan = (acc.plan_type || 'starter') as Plan;
                  const isActiveSub = acc.subscription?.is_active;
                  return (
                    <TableRow key={acc._id} hover sx={{
                      '&:last-child td': { border: 0 },
                      '&:hover': { bgcolor: '#f8fafc' },
                      borderLeft: `3px solid ${isActiveSub ? '#00a854' : '#e2e8f0'}`,
                    }}>
                      <TableCell>
                        <Stack direction="row" alignItems="center" gap={1.5}>
                          <Box sx={{
                            width: 36, height: 36, borderRadius: '10px', flexShrink: 0,
                            background: 'linear-gradient(135deg, #0d1f3c, #1e3a5f)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 14, fontWeight: 800, color: '#60a5fa',
                          }}>
                            {(acc.name || '?')[0].toUpperCase()}
                          </Box>
                          <Box>
                            <Typography fontWeight={700} fontSize={13.5} color="#1e293b">{acc.name}</Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace', fontSize: 10 }}>
                              {acc._id?.slice(-10)}
                            </Typography>
                          </Box>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography fontSize={13} fontWeight={600} color="#1e293b">{acc.owner?.name || '—'}</Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11 }}>{acc.owner?.email}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Stack spacing={0.75}>
                          <Select
                            size="small"
                            value={plan}
                            onChange={(e) => updatePlan.mutate({ id: acc._id, plan_type: e.target.value as Plan })}
                            sx={{ fontSize: 12, minWidth: 100, borderRadius: '8px' }}
                          >
                            {PLANS.map((p) => <MenuItem key={p} value={p} sx={{ textTransform: 'capitalize', fontSize: 13 }}>{p}</MenuItem>)}
                          </Select>
                          <Chip
                            label={isActiveSub ? 'Active' : 'Inactive'}
                            size="small"
                            sx={{
                              width: 'fit-content', fontSize: 10, height: 18,
                              bgcolor: isActiveSub ? '#dcfce7' : '#fee2e2',
                              color: isActiveSub ? '#15803d' : '#dc2626',
                              fontWeight: 700,
                            }}
                          />
                        </Stack>
                      </TableCell>
                      <TableCell align="center">
                        <Typography fontSize={13} fontWeight={600} color="#1e293b">
                          {acc.stats?.users}<Typography component="span" variant="caption" color="text.secondary"> / {acc.limits?.users === -1 ? '∞' : acc.limits?.users}</Typography>
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography fontSize={13} fontWeight={600} color="#1e293b">
                          {acc.stats?.channels}<Typography component="span" variant="caption" color="text.secondary"> / {acc.limits?.channels === -1 ? '∞' : acc.limits?.channels}</Typography>
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography fontSize={13} fontWeight={600} color="#1e293b">
                          {acc.stats?.automations}<Typography component="span" variant="caption" color="text.secondary"> / {acc.limits?.automations === -1 ? '∞' : acc.limits?.automations}</Typography>
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography fontSize={13} fontWeight={700} color="#7c3aed">
                          {acc.stats?.wa_flows ?? 0}
                          <Typography component="span" variant="caption" color="text.secondary">
                            {' / '}{acc.limits?.wa_flows === -1 ? '∞' : (acc.limits?.wa_flows ?? 0)}
                          </Typography>
                        </Typography>
                        {acc.wa_flow_limit_override != null && (
                          <Typography fontSize={9} color="#7c3aed" fontWeight={700}>CUSTOM</Typography>
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <Typography fontSize={13} fontWeight={700} color={acc.wallet?.balance > 0 ? '#15803d' : '#94a3b8'}>
                          ₹{((acc.wallet?.balance ?? 0) / 1000000).toFixed(2)}
                        </Typography>
                        <Typography variant="caption" color="#94a3b8" fontSize={10}>
                          T{acc.wallet?.template_commission_percent ?? acc.wallet?.commission_percent ?? 15}% · AI{acc.wallet?.ai_commission_percent ?? acc.wallet?.commission_percent ?? 15}%
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={0.75} justifyContent="flex-end">
                          <Tooltip title="Manage wallet & subscription">
                            <Button size="small" variant="outlined" startIcon={<SettingOutlined />} onClick={() => setManagingAcc(acc)}
                              sx={{ fontSize: 11, borderRadius: '8px', borderColor: '#e2e8f0', color: '#475569', '&:hover': { borderColor: '#00a854', color: '#00a854', bgcolor: '#f0fdf4' } }}>
                              Manage
                            </Button>
                          </Tooltip>
                          {acc.owner && (
                            <Tooltip title={`Login as ${acc.owner.name}`}>
                              <Button size="small" variant="contained" startIcon={<LoginOutlined />}
                                onClick={() => handleImpersonate(acc.owner._id, acc.owner.name)}
                                sx={{ fontSize: 11, borderRadius: '8px', bgcolor: '#00a854', '&:hover': { bgcolor: '#008c44' } }}>
                                Login As
                              </Button>
                            </Tooltip>
                          )}
                          <Tooltip title="Delete account permanently">
                            <Button size="small" color="error" variant="outlined" startIcon={<DeleteOutlined />}
                              onClick={() => { if (window.confirm(`Delete "${acc.name}"? This cannot be undone.`)) deleteAccount.mutate(acc._id); }}
                              sx={{ fontSize: 11, borderRadius: '8px' }}>
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
                    <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                      <Typography fontSize={40} mb={1}>🏢</Typography>
                      <Typography fontWeight={600} color="#475569">
                        {search ? 'No accounts match your search.' : 'No client accounts yet.'}
                      </Typography>
                      {!search && (
                        <Button variant="contained" startIcon={<PlusOutlined />} onClick={() => setCreateOpen(true)}
                          sx={{ mt: 2, bgcolor: '#00a854', '&:hover': { bgcolor: '#008c44' }, borderRadius: '10px' }}>
                          Create First Account
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {totalPages > 1 && (
          <Box display="flex" justifyContent="center" mt={2.5}>
            <Pagination count={totalPages} page={page} onChange={(_, v) => setPage(v)} color="primary" />
          </Box>
        )}
      </Box>}

      {/* Manage Dialog */}
      {managingAcc && (
        <ManageDialog
          acc={managingAcc}
          onClose={() => setManagingAcc(null)}
          showToast={showToast}
        />
      )}

      {/* ── Create Account Dialog ── */}
      <Dialog
        open={createOpen}
        onClose={() => { setCreateOpen(false); setForm(emptyForm); }}
        maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}
      >
        {/* Dialog header */}
        <Box sx={{
          background: 'linear-gradient(135deg, #0a0f1e 0%, #0d1f3c 100%)',
          px: 3, py: 2.5,
        }}>
          <Stack direction="row" alignItems="center" gap={1.5}>
            <Box sx={{
              width: 40, height: 40, borderRadius: '10px',
              background: 'linear-gradient(135deg, #00a854, #00d68f)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
            }}>🏢</Box>
            <Box>
              <Typography variant="h6" fontWeight={800} sx={{ color: '#fff', lineHeight: 1.2 }}>
                Create New Account
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                Set up a new client workspace with its owner
              </Typography>
            </Box>
          </Stack>
        </Box>

        <DialogContent sx={{ pt: 3, pb: 1 }}>
          <Stack spacing={2.5}>
            {/* Company */}
            <TextField
              label="Account / Company Name"
              value={form.account_name}
              onChange={(e) => setForm({ ...form, account_name: e.target.value })}
              fullWidth required placeholder="e.g. Agarwal Cake Zone"
              InputProps={{ startAdornment: <InputAdornment position="start">🏢</InputAdornment> }}
            />

            {/* Owner section */}
            <Box sx={{ bgcolor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 2, p: 2 }}>
              <Typography variant="caption" fontWeight={700} color="#64748b" sx={{ textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 1.5 }}>
                Owner Details
              </Typography>
              <Stack spacing={2}>
                <Stack direction="row" spacing={2}>
                  <TextField
                    label="Full Name"
                    value={form.owner_name}
                    onChange={(e) => setForm({ ...form, owner_name: e.target.value })}
                    fullWidth required size="small"
                    InputProps={{ startAdornment: <InputAdornment position="start"><UserOutlined style={{ fontSize: 14, color: '#94a3b8' }} /></InputAdornment> }}
                  />
                  <TextField
                    label="Phone / WhatsApp"
                    value={form.owner_phone}
                    onChange={(e) => setForm({ ...form, owner_phone: e.target.value })}
                    fullWidth required size="small" placeholder="+91 98765 43210"
                  />
                </Stack>
                <Stack direction="row" spacing={2}>
                  <TextField
                    label="Email Address"
                    type="email"
                    value={form.owner_email}
                    onChange={(e) => setForm({ ...form, owner_email: e.target.value })}
                    fullWidth required size="small" placeholder="owner@company.com"
                  />
                  <TextField
                    label="Password"
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    fullWidth required size="small" placeholder="Min. 6 chars"
                  />
                </Stack>
              </Stack>
            </Box>

            {/* Plan + Country */}
            <Stack direction="row" spacing={2}>
              <Box flex={1}>
                <InputLabel sx={{ mb: 0.75, fontSize: 12, fontWeight: 600, color: '#475569' }}>Country</InputLabel>
                <Select
                  value={form.country_code}
                  onChange={(e) => setForm({ ...form, country_code: e.target.value })}
                  fullWidth size="small"
                >
                  {COUNTRIES.map((c) => (
                    <MenuItem key={c.code} value={c.code} sx={{ fontSize: 13 }}>{c.name}</MenuItem>
                  ))}
                </Select>
                <Typography variant="caption" color="text.secondary">Sets wallet currency &amp; tax</Typography>
              </Box>
              <Box flex={1}>
                <InputLabel sx={{ mb: 0.75, fontSize: 12, fontWeight: 600, color: '#475569' }}>Starting Plan</InputLabel>
                <Select
                  value={form.plan_type}
                  onChange={(e) => setForm({ ...form, plan_type: e.target.value as Plan })}
                  fullWidth size="small"
                >
                  {PLANS.map((p) => (
                    <MenuItem key={p} value={p} sx={{ textTransform: 'capitalize', fontSize: 13 }}>{p}</MenuItem>
                  ))}
                </Select>
                <Typography variant="caption" color="text.secondary">Plan limits apply immediately</Typography>
              </Box>
            </Stack>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5, pt: 1.5, gap: 1 }}>
          <Button onClick={() => { setCreateOpen(false); setForm(emptyForm); }} color="inherit" sx={{ borderRadius: '8px' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={createAccount.isPending || !form.account_name || !form.owner_name || !form.owner_email || !form.owner_phone || !form.password}
            onClick={() => createAccount.mutate(form)}
            sx={{ borderRadius: '8px', bgcolor: '#00a854', '&:hover': { bgcolor: '#008c44' }, fontWeight: 700, px: 3 }}
          >
            {createAccount.isPending ? 'Creating…' : 'Create Account →'}
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
