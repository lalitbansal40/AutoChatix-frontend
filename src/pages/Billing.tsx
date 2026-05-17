import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  LinearProgress,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import {
  CheckCircleFilled,
  CloseCircleFilled,
  CrownOutlined,
  DisconnectOutlined,
  PlusOutlined,
  SafetyCertificateFilled,
  SyncOutlined,
  TeamOutlined,
  ThunderboltFilled,
  WalletOutlined,
  WifiOutlined,
} from '@ant-design/icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchMySubscription, fetchPlanPrices, createRenewalLink, fetchAddonStatus, createChannelAddonLink, createUserAddonLink, updateAutoRenew, renewFromWallet, cancelAutoDebit, PlanPrice } from 'service/subscription.service';
import { walletService } from 'service/wallet.service';
import MainCard from 'components/MainCard';
import useAuth from 'hooks/useAuth';

/* ─── helpers ─── */
const MONEY_SCALE = 1_000_000;
const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: '₹', USD: '$', GBP: '£', AED: 'AED ', SGD: 'S$', AUD: 'A$', EUR: '€',
};
const sym = (c = 'INR') => CURRENCY_SYMBOLS[c] || c + ' ';

const fmtMoney = (amount: number, currency = 'INR') =>
  sym(currency) + (Number(amount || 0) / MONEY_SCALE).toLocaleString('en-IN', {
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  });

const fmtDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const daysLeft = (end?: string) => {
  if (!end) return null;
  const diff = new Date(end).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / 86_400_000));
};


const PLAN_COLORS: Record<string, string> = {
  starter: '#1890ff',
  growth: '#52c41a',
  pro: '#722ed1',
};

/* ─── Upgrade modal ─── */
const UpgradeModal = ({
  open,
  onClose,
  plans,
  currentPlan,
  addonChannels = 0,
  addonUsers = 0,
}: {
  open: boolean;
  onClose: () => void;
  plans: PlanPrice[];
  currentPlan?: string;
  addonChannels?: number;
  addonUsers?: number;
}) => {
  const [selected, setSelected] = useState<string>(currentPlan || 'growth');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleUpgrade = async () => {
    setLoading(true);
    setError('');
    try {
      const url = await createRenewalLink(selected);
      window.location.href = url;
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to create payment link');
      setLoading(false);
    }
  };

  const planData = plans.find((p) => p.plan_name === selected);

  // Addon costs (backend applies 18% GST if Indian account — show estimate)
  const addonBase = addonChannels * 999 + addonUsers * 99;
  const addonTax  = Math.round(addonBase * 18 / 100);
  const addonTotal = addonBase + addonTax;
  const hasAddons = addonBase > 0;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, fontSize: 20 }}>
        {currentPlan ? 'Upgrade / Renew Plan' : 'Choose a Plan'}
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={1.5} sx={{ mb: 2 }}>
          {plans.map((p) => {
            const isCurrent = p.plan_name === currentPlan;
            const isSelected = p.plan_name === selected;
            const color = PLAN_COLORS[p.plan_name] || '#1890ff';
            return (
              <Grid item xs={12} sm={4} key={p.plan_name}>
                <Card
                  onClick={() => setSelected(p.plan_name)}
                  sx={{
                    cursor: 'pointer',
                    border: `2px solid ${isSelected ? color : 'transparent'}`,
                    bgcolor: isSelected ? `${color}11` : 'background.paper',
                    transition: 'all 0.2s',
                    '&:hover': { borderColor: color },
                  }}
                >
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Typography variant="caption" sx={{ color, fontWeight: 700, textTransform: 'uppercase' }}>
                      {p.plan_name}
                    </Typography>
                    {isCurrent && (
                      <Chip label="Current" size="small" sx={{ ml: 1, fontSize: 10 }} />
                    )}
                    <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5 }}>
                      {sym('INR')}{p.base_price.toLocaleString()}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      +{p.tax_percent}% tax · {p.duration_days}d
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>

        {planData && (
          <Box sx={{ bgcolor: 'action.hover', borderRadius: 2, p: 2, mb: 1 }}>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">Plan base</Typography>
              <Typography variant="body2">{sym('INR')}{planData.base_price.toLocaleString()}</Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">Plan tax ({planData.tax_percent}%)</Typography>
              <Typography variant="body2">{sym('INR')}{planData.tax_amount.toLocaleString()}</Typography>
            </Stack>

            {hasAddons && (
              <>
                <Divider sx={{ my: 1 }} />
                <Typography variant="caption" color="text.secondary" fontWeight={600}>Add-on renewal</Typography>
                {addonChannels > 0 && (
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">{addonChannels} extra channel{addonChannels > 1 ? 's' : ''} × ₹999</Typography>
                    <Typography variant="body2">{sym('INR')}{(addonChannels * 999).toLocaleString()}</Typography>
                  </Stack>
                )}
                {addonUsers > 0 && (
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">{addonUsers} extra user{addonUsers > 1 ? 's' : ''} × ₹99</Typography>
                    <Typography variant="body2">{sym('INR')}{(addonUsers * 99).toLocaleString()}</Typography>
                  </Stack>
                )}
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">Add-on tax (18%)</Typography>
                  <Typography variant="body2">{sym('INR')}{addonTax.toLocaleString()}</Typography>
                </Stack>
              </>
            )}

            <Stack direction="row" justifyContent="space-between" sx={{ mt: 0.5 }}>
              <Typography variant="body2" color="text.secondary">Plan period</Typography>
              <Typography variant="body2" color="success.main" fontWeight={600}>30 days + 7 bonus days 🎁</Typography>
            </Stack>
            <Divider sx={{ my: 1 }} />
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" fontWeight={700}>Total</Typography>
              <Typography variant="body2" fontWeight={700} color="primary">
                {sym('INR')}{(planData.total_price + addonTotal).toLocaleString()}
              </Typography>
            </Stack>
            {hasAddons && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                Includes renewal of {addonChannels > 0 ? `${addonChannels} extra channel${addonChannels > 1 ? 's' : ''}` : ''}{addonChannels > 0 && addonUsers > 0 ? ' & ' : ''}{addonUsers > 0 ? `${addonUsers} extra user${addonUsers > 1 ? 's' : ''}` : ''}
              </Typography>
            )}
          </Box>
        )}

        {error && <Alert severity="error" sx={{ mt: 1 }}>{error}</Alert>}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={loading}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleUpgrade}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={14} /> : undefined}
        >
          {loading ? 'Redirecting...' : 'Pay via Razorpay'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

/* ─── Addon Purchase Modal ─── */
const AddonModal = ({
  open, onClose, type, basePrice, taxPercent,
}: {
  open: boolean; onClose: () => void;
  type: 'channel' | 'user';
  basePrice: number; taxPercent: number;
}) => {
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const tax = Math.round(basePrice * qty * taxPercent / 100);
  const total = basePrice * qty + tax;
  const label = type === 'channel' ? 'Channel' : 'User Seat';
  const icon = type === 'channel' ? <WifiOutlined /> : <TeamOutlined />;

  const handlePurchase = async () => {
    setLoading(true); setError('');
    try {
      const url = type === 'channel'
        ? await createChannelAddonLink(qty)
        : await createUserAddonLink(qty);
      window.location.href = url;
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to create payment link');
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Add {label}{qty > 1 ? 's' : ''}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Stack direction="row" alignItems="center" gap={1}>
            <Box sx={{ color: 'primary.main', fontSize: 20 }}>{icon}</Box>
            <Typography variant="body2" color="text.secondary">
              ₹{basePrice.toLocaleString()} per {label.toLowerCase()}/month
              {taxPercent > 0 && ` + ${taxPercent}% GST`}
            </Typography>
          </Stack>

          <Stack direction="row" alignItems="center" gap={2}>
            <Button size="small" variant="outlined" onClick={() => setQty(Math.max(1, qty - 1))} sx={{ minWidth: 36 }}>−</Button>
            <TextField
              type="number"
              value={qty}
              onChange={(e) => setQty(Math.max(1, Math.min(10, Number(e.target.value))))}
              size="small"
              sx={{ width: 80, '& input': { textAlign: 'center' } }}
              inputProps={{ min: 1, max: 10 }}
            />
            <Button size="small" variant="outlined" onClick={() => setQty(Math.min(10, qty + 1))} sx={{ minWidth: 36 }}>+</Button>
            <Typography variant="body2" color="text.secondary">× ₹{basePrice}/mo</Typography>
          </Stack>

          <Box sx={{ bgcolor: 'action.hover', borderRadius: 2, p: 2 }}>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">Base ({qty} × ₹{basePrice})</Typography>
              <Typography variant="body2">₹{(basePrice * qty).toLocaleString()}</Typography>
            </Stack>
            {taxPercent > 0 && (
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">GST ({taxPercent}%)</Typography>
                <Typography variant="body2">₹{tax.toLocaleString()}</Typography>
              </Stack>
            )}
            <Divider sx={{ my: 1 }} />
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" fontWeight={700}>Total</Typography>
              <Typography variant="body2" fontWeight={700} color="primary">₹{total.toLocaleString()}</Typography>
            </Stack>
          </Box>

          {error && <Alert severity="error">{error}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={loading}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handlePurchase}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={14} /> : <PlusOutlined />}
        >
          {loading ? 'Redirecting...' : `Add ${qty} ${label}${qty > 1 ? 's' : ''}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

/* ─── Main Page ─── */
export default function Billing() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isSuperAdmin = (user as any)?.role === 'superadmin';

  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [addonModal, setAddonModal] = useState<'channel' | 'user' | null>(null);
  const [autoRenewSaving, setAutoRenewSaving] = useState(false);
  const [walletRenewLoading, setWalletRenewLoading] = useState(false);
  const [cancelAutoDebitLoading, setCancelAutoDebitLoading] = useState(false);
  const [billingError, setBillingError] = useState('');

  const { data: subData, isLoading: subLoading } = useQuery({
    queryKey: ['my-subscription'],
    queryFn: fetchMySubscription,
  });

  const { data: plans = [], isLoading: plansLoading } = useQuery({
    queryKey: ['plan-prices'],
    queryFn: fetchPlanPrices,
  });

  const { data: ledgerData, isLoading: walletLoading } = useQuery({
    queryKey: ['billing-ledger'],
    queryFn: () => walletService.getLedger({ type: 'SUBSCRIPTION', limit: 100 }),
  });

  const { data: walletInfo } = useQuery({
    queryKey: ['wallet'],
    queryFn: () => walletService.getWallet(),
  });

  const { data: addonData } = useQuery({
    queryKey: ['addon-status'],
    queryFn: fetchAddonStatus,
    retry: false,
  });

  const sub = subData?.subscription;
  const planCfg = subData?.plan_config;
  const days = daysLeft(sub?.payment_end_date);
  const isActive = sub?.is_active && sub?.payment_status === 'paid';
  const planColor = PLAN_COLORS[sub?.plan_name || ''] || '#1890ff';
  const ledger = (ledgerData as any)?.ledger || [];
  const wallet = (walletInfo as any)?.wallet;
  const availableWalletBalance = (wallet?.balance || 0) - (wallet?.hold_balance || 0);

  const refreshBilling = () => {
    queryClient.invalidateQueries({ queryKey: ['my-subscription'] });
    queryClient.invalidateQueries({ queryKey: ['billing-ledger'] });
    queryClient.invalidateQueries({ queryKey: ['wallet'] });
  };

  const handleAutoRenewToggle = async (enabled: boolean) => {
    setAutoRenewSaving(true);
    setBillingError('');
    try {
      await updateAutoRenew(enabled);
      refreshBilling();
    } catch (err: any) {
      setBillingError(err?.response?.data?.message || err?.message || 'Unable to update auto-renew');
    } finally {
      setAutoRenewSaving(false);
    }
  };

  const handleWalletRenew = async () => {
    setWalletRenewLoading(true);
    setBillingError('');
    try {
      await renewFromWallet(sub?.plan_name);
      refreshBilling();
    } catch (err: any) {
      setBillingError(err?.response?.data?.message || err?.message || 'Unable to renew from wallet');
    } finally {
      setWalletRenewLoading(false);
    }
  };

  const handleCancelAutoDebit = async () => {
    if (!window.confirm('Cancel auto-debit? Your plan will continue until expiry but will not be renewed automatically.')) return;
    setCancelAutoDebitLoading(true);
    setBillingError('');
    try {
      await cancelAutoDebit();
      refreshBilling();
    } catch (err: any) {
      setBillingError(err?.response?.data?.message || err?.message || 'Unable to cancel auto-debit');
    } finally {
      setCancelAutoDebitLoading(false);
    }
  };

  const daysProgress =
    sub?.payment_start_date && sub?.payment_end_date
      ? Math.max(
          0,
          Math.min(
            100,
            ((Date.now() - new Date(sub.payment_start_date).getTime()) /
              (new Date(sub.payment_end_date).getTime() - new Date(sub.payment_start_date).getTime())) *
              100
          )
        )
      : 0;

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1100, mx: 'auto' }}>
      <Typography variant="h4" fontWeight={700} sx={{ mb: 3 }}>
        Billing &amp; Plans
      </Typography>

      <Grid container spacing={3}>
        {/* ── Current Plan Card ── */}
        <Grid item xs={12} md={7}>
          {isSuperAdmin ? (
            /* ── Superadmin special card ── */
            <MainCard
              sx={{
                background: 'linear-gradient(135deg, #002612 0%, #00451f 55%, #006e2e 100%)',
                border: '1px solid #00a85466',
                height: '100%',
                color: '#fff',
              }}
            >
              <Stack spacing={2.5}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
                  <Stack direction="row" alignItems="center" gap={1.5}>
                    <Box sx={{
                      width: 44, height: 44, borderRadius: '12px',
                      bgcolor: 'rgba(0,168,84,0.25)', border: '1.5px solid #00a85488',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 22,
                    }}>
                      <SafetyCertificateFilled style={{ color: '#52d68a' }} />
                    </Box>
                    <Box>
                      <Typography variant="h5" fontWeight={800} sx={{ color: '#fff', lineHeight: 1.2 }}>
                        SuperAdmin Plan
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#52d68a' }}>Platform Owner Access</Typography>
                    </Box>
                  </Stack>
                  <Chip
                    label="Unlimited"
                    size="small"
                    sx={{ bgcolor: '#00a854', color: '#fff', fontWeight: 700, fontSize: 12, px: 0.5 }}
                    icon={<CheckCircleFilled style={{ color: '#fff', fontSize: 12 }} />}
                  />
                </Stack>

                <Grid container spacing={2}>
                  {[
                    { label: 'Channels',    value: '∞' },
                    { label: 'Users',       value: '∞' },
                    { label: 'Automations', value: '∞' },
                    { label: 'Plan Cost',   value: '₹0' },
                  ].map(({ label, value }) => (
                    <Grid item xs={6} sm={3} key={label}>
                      <Typography variant="caption" sx={{ color: '#86efac' }}>{label}</Typography>
                      <Typography variant="h6" fontWeight={700} sx={{ color: '#fff' }}>{value}</Typography>
                    </Grid>
                  ))}
                </Grid>

                <Box sx={{ bgcolor: 'rgba(0,168,84,0.15)', borderRadius: 2, p: 1.5, border: '1px solid rgba(0,168,84,0.3)' }}>
                  <Typography variant="body2" sx={{ color: '#86efac', fontSize: 12 }}>
                    As the platform owner, you have unrestricted access to all features. No plan purchase is required.
                  </Typography>
                </Box>
              </Stack>
            </MainCard>
          ) : (
            <MainCard
              sx={{
                background: isActive
                  ? `linear-gradient(135deg, ${planColor}22 0%, ${planColor}08 100%)`
                  : 'background.paper',
                border: `1px solid ${isActive ? planColor + '44' : '#ff4d4f44'}`,
                height: '100%',
              }}
            >
              {subLoading ? (
                <CircularProgress size={24} />
              ) : !sub ? (
                <Stack spacing={2} alignItems="flex-start">
                  <Typography variant="h5" fontWeight={700} color="text.secondary">
                    No Active Plan
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Purchase a plan to start using AutoChatix.
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<CrownOutlined />}
                    onClick={() => setUpgradeOpen(true)}
                    disabled={plansLoading}
                  >
                    Choose a Plan
                  </Button>
                </Stack>
              ) : (
                <Stack spacing={2}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
                    <Stack direction="row" alignItems="center" gap={1}>
                      <CrownOutlined style={{ color: planColor, fontSize: 22 }} />
                      <Typography variant="h5" fontWeight={700} sx={{ textTransform: 'capitalize' }}>
                        {planCfg?.display_name || sub.plan_name} Plan
                      </Typography>
                      <Chip
                        label={isActive ? 'Active' : sub.payment_status}
                        size="small"
                        color={isActive ? 'success' : 'error'}
                        icon={isActive ? <CheckCircleFilled /> : <CloseCircleFilled />}
                        sx={{ textTransform: 'capitalize' }}
                      />
                    </Stack>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<SyncOutlined />}
                      onClick={() => setUpgradeOpen(true)}
                      disabled={plansLoading}
                    >
                      Upgrade / Renew
                    </Button>
                  </Stack>

                  <Grid container spacing={2}>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="caption" color="text.secondary">Start Date</Typography>
                      <Typography variant="body2" fontWeight={600}>{fmtDate(sub.payment_start_date)}</Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="caption" color="text.secondary">Expiry Date</Typography>
                      <Typography variant="body2" fontWeight={600}>{fmtDate(sub.payment_end_date)}</Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="caption" color="text.secondary">Amount Paid</Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {sym(sub.currency)}{(sub.amount_paid || 0).toLocaleString()}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="caption" color="text.secondary">Days Left</Typography>
                      <Typography
                        variant="body2"
                        fontWeight={700}
                        color={days !== null && days < 7 ? 'error.main' : 'text.primary'}
                      >
                        {days !== null ? `${days}d` : '—'}
                      </Typography>
                    </Grid>
                  </Grid>

                  {sub.payment_start_date && sub.payment_end_date && (
                    <Box>
                      <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">Plan Period</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {Math.round(daysProgress)}% used
                        </Typography>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={daysProgress}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          bgcolor: `${planColor}22`,
                          '& .MuiLinearProgress-bar': { bgcolor: planColor },
                        }}
                      />
                    </Box>
                  )}

                  {/* ── Auto-debit (Razorpay Subscription) status ── */}
                  {sub.razorpay_subscription_id && (
                    <Box
                      sx={{
                        border: '1.5px solid',
                        borderColor: sub.auto_charge_enabled && sub.razorpay_subscription_status !== 'halted'
                          ? 'success.light'
                          : 'warning.light',
                        borderRadius: 2,
                        p: 2,
                        bgcolor: sub.auto_charge_enabled && sub.razorpay_subscription_status !== 'halted'
                          ? 'success.lighter'
                          : 'warning.lighter',
                      }}
                    >
                      <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'center' }} justifyContent="space-between" gap={1.5}>
                        <Stack direction="row" alignItems="center" gap={1}>
                          <ThunderboltFilled style={{
                            fontSize: 18,
                            color: sub.razorpay_subscription_status === 'halted' ? '#fa8c16' : '#52c41a',
                          }} />
                          <Box>
                            <Typography variant="subtitle2" fontWeight={700}>
                              Auto-debit {sub.razorpay_subscription_status === 'halted' ? '— Payment Failed' : 'Active'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {sub.razorpay_subscription_status === 'halted'
                                ? 'Razorpay could not charge your saved payment method. Please update it via Razorpay or renew manually.'
                                : 'Your card/UPI is charged automatically each month via Razorpay. No action needed.'}
                            </Typography>
                            {sub.auto_renew_failed_at && sub.razorpay_subscription_status === 'halted' && (
                              <Typography variant="caption" color="error.main" sx={{ display: 'block', mt: 0.5 }}>
                                {sub.auto_renew_failure_reason}
                              </Typography>
                            )}
                          </Box>
                        </Stack>
                        {sub.auto_charge_enabled && sub.razorpay_subscription_status !== 'cancelled' && (
                          <Button
                            size="small"
                            color="error"
                            variant="outlined"
                            startIcon={cancelAutoDebitLoading ? <CircularProgress size={14} /> : <DisconnectOutlined />}
                            disabled={cancelAutoDebitLoading}
                            onClick={handleCancelAutoDebit}
                          >
                            Cancel Auto-debit
                          </Button>
                        )}
                      </Stack>
                    </Box>
                  )}

                  {/* ── Wallet auto-renew (fallback / manual) ── */}
                  <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2, bgcolor: 'background.paper' }}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'center' }} justifyContent="space-between" gap={1.5}>
                      <Box>
                        <Typography variant="subtitle2" fontWeight={700}>Auto-renew from wallet</Typography>
                        <Typography variant="caption" color="text.secondary">
                          On expiry, plan and active add-ons are deducted from wallet balance automatically.
                        </Typography>
                        {sub.auto_renew_failed_at && !sub.razorpay_subscription_id && (
                          <Typography variant="caption" color="error.main" sx={{ display: 'block', mt: 0.5 }}>
                            Last auto-renew failed: {sub.auto_renew_failure_reason || 'Wallet balance was insufficient'}
                          </Typography>
                        )}
                      </Box>
                      <Stack direction="row" alignItems="center" gap={1}>
                        <Typography variant="caption" color={sub.auto_renew_enabled ? 'success.main' : 'text.secondary'}>
                          {sub.auto_renew_enabled ? 'Enabled' : 'Off'}
                        </Typography>
                        <Switch
                          checked={Boolean(sub.auto_renew_enabled)}
                          disabled={autoRenewSaving}
                          onChange={(event) => handleAutoRenewToggle(event.target.checked)}
                        />
                      </Stack>
                    </Stack>
                    <Divider sx={{ my: 1.5 }} />
                    <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'center' }} justifyContent="space-between" gap={1}>
                      <Typography variant="caption" color="text.secondary">
                        Available wallet: {fmtMoney(availableWalletBalance, wallet?.currency)}
                      </Typography>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={walletRenewLoading ? <CircularProgress size={14} /> : <WalletOutlined />}
                        disabled={walletRenewLoading || !sub}
                        onClick={handleWalletRenew}
                      >
                        Renew from Wallet
                      </Button>
                    </Stack>
                  </Box>

                  {billingError && <Alert severity="error">{billingError}</Alert>}
                </Stack>
              )}
            </MainCard>
          )}
        </Grid>

        {/* ── Wallet Balance Card ── */}
        <Grid item xs={12} md={5}>
          <MainCard
            sx={{
              background: 'linear-gradient(135deg, #001529 0%, #003a8c 100%)',
              color: '#fff',
              height: '100%',
            }}
          >
            {walletLoading ? (
              <CircularProgress size={24} sx={{ color: '#fff' }} />
            ) : (
              <Stack spacing={2} height="100%" justifyContent="space-between">
                <Stack direction="row" alignItems="center" gap={1}>
                  <WalletOutlined style={{ fontSize: 20, color: '#40a9ff' }} />
                  <Typography variant="body1" sx={{ color: '#8ec5fc', fontWeight: 600 }}>
                    Wallet Balance
                  </Typography>
                </Stack>
                <Box>
                  <Typography variant="h3" fontWeight={700} sx={{ color: '#fff' }}>
                    {fmtMoney(wallet?.balance || 0, wallet?.currency)}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#8ec5fc' }}>
                    Hold: {fmtMoney(wallet?.hold_balance || 0, wallet?.currency)}
                  </Typography>
                </Box>
                <Stack direction="row" gap={2}>
                  <Box>
                    <Typography variant="caption" sx={{ color: '#8ec5fc' }}>Available</Typography>
                    <Typography variant="body2" fontWeight={700} sx={{ color: '#73d13d' }}>
                      {fmtMoney(
                        (wallet?.balance || 0) - (wallet?.hold_balance || 0),
                        wallet?.currency
                      )}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: '#8ec5fc' }}>Currency</Typography>
                    <Typography variant="body2" fontWeight={700} sx={{ color: '#fff' }}>
                      {wallet?.currency || 'INR'}
                    </Typography>
                  </Box>
                </Stack>
              </Stack>
            )}
          </MainCard>
        </Grid>

        {/* ── All Plans Overview — hidden for superadmin ── */}
        {!isSuperAdmin && <Grid item xs={12}>
          <MainCard title="Available Plans">
            {plansLoading ? (
              <CircularProgress size={24} />
            ) : (
              <Grid container spacing={2}>
                {plans.map((p) => {
                  const isCurrent = p.plan_name === sub?.plan_name && isActive;
                  const color = PLAN_COLORS[p.plan_name] || '#1890ff';
                  return (
                    <Grid item xs={12} sm={4} key={p.plan_name}>
                      <Card
                        variant="outlined"
                        sx={{
                          border: `2px solid ${isCurrent ? color : 'divider'}`,
                          bgcolor: isCurrent ? `${color}0a` : 'background.paper',
                          position: 'relative',
                        }}
                      >
                        {isCurrent && (
                          <Chip
                            label="Current Plan"
                            size="small"
                            sx={{
                              position: 'absolute',
                              top: 12,
                              right: 12,
                              bgcolor: color,
                              color: '#fff',
                              fontSize: 11,
                              fontWeight: 700,
                            }}
                          />
                        )}
                        <CardContent>
                          <Typography variant="overline" sx={{ color, fontWeight: 700 }}>
                            {p.plan_name}
                          </Typography>
                          <Typography variant="h4" fontWeight={700} sx={{ mt: 0.5, mb: 0.5 }}>
                            {sym('INR')}{p.base_price.toLocaleString()}
                            <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
                              /mo
                            </Typography>
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            +{p.tax_percent}% tax = {sym('INR')}{p.total_price.toLocaleString()} total
                            <br />
                            <Typography component="span" variant="caption" color="success.main" fontWeight={600}>
                              37 days (30 + 7 bonus)
                            </Typography>
                          </Typography>
                          <Button
                            variant={isCurrent ? 'outlined' : 'contained'}
                            size="small"
                            fullWidth
                            onClick={() => setUpgradeOpen(true)}
                            sx={isCurrent ? {} : { bgcolor: color, '&:hover': { bgcolor: color } }}
                          >
                            {isCurrent ? 'Renew' : 'Upgrade'}
                          </Button>
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            )}
          </MainCard>
        </Grid>}

        {/* ── Add-ons — hidden for superadmin ── */}
        {!isSuperAdmin && <Grid item xs={12}>
          <MainCard title="Add-ons">
            <Grid container spacing={2}>
              {/* Channel add-on card */}
              <Grid item xs={12} sm={6}>
                <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2.5, p: 2.5 }}>
                  <Stack direction="row" alignItems="center" gap={1.5} sx={{ mb: 1.5 }}>
                    <Box sx={{ bgcolor: 'primary.lighter', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <WifiOutlined style={{ color: '#00a854', fontSize: 20 }} />
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" fontWeight={700}>WhatsApp Channels</Typography>
                      <Typography variant="caption" color="text.secondary">₹999/channel/month + 18% GST</Typography>
                    </Box>
                  </Stack>
                  <Stack direction="row" gap={3} sx={{ mb: 2 }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Included in plan</Typography>
                      <Typography variant="h6" fontWeight={700}>{addonData?.effective_limits?.channels === -1 ? '∞' : (addonData ? addonData.effective_limits.channels - addonData.addon_channels : '—')}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Add-ons purchased</Typography>
                      <Typography variant="h6" fontWeight={700} color="primary">{addonData?.addon_channels ?? '—'}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Total allowed</Typography>
                      <Typography variant="h6" fontWeight={700}>{addonData?.effective_limits?.channels === -1 ? '∞' : addonData?.effective_limits?.channels ?? '—'}</Typography>
                    </Box>
                  </Stack>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<PlusOutlined />}
                    onClick={() => setAddonModal('channel')}
                    disabled={!isActive}
                  >
                    Add Channel
                  </Button>
                </Box>
              </Grid>

              {/* User add-on card */}
              <Grid item xs={12} sm={6}>
                <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2.5, p: 2.5 }}>
                  <Stack direction="row" alignItems="center" gap={1.5} sx={{ mb: 1.5 }}>
                    <Box sx={{ bgcolor: 'primary.lighter', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <TeamOutlined style={{ color: '#00a854', fontSize: 20 }} />
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" fontWeight={700}>Team Users / Agents</Typography>
                      <Typography variant="caption" color="text.secondary">₹99/user/month + 18% GST</Typography>
                    </Box>
                  </Stack>
                  <Stack direction="row" gap={3} sx={{ mb: 2 }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Included in plan</Typography>
                      <Typography variant="h6" fontWeight={700}>{addonData?.effective_limits?.users === -1 ? '∞' : (addonData ? addonData.effective_limits.users - addonData.addon_users : '—')}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Add-ons purchased</Typography>
                      <Typography variant="h6" fontWeight={700} color="primary">{addonData?.addon_users ?? '—'}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Total allowed</Typography>
                      <Typography variant="h6" fontWeight={700}>{addonData?.effective_limits?.users === -1 ? '∞' : addonData?.effective_limits?.users ?? '—'}</Typography>
                    </Box>
                  </Stack>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<PlusOutlined />}
                    onClick={() => setAddonModal('user')}
                    disabled={!isActive}
                  >
                    Add Users
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </MainCard>
        </Grid>}

        {/* ── Transaction History ── */}
        <Grid item xs={12}>
          <MainCard title="Transaction History">
            {walletLoading ? (
              <CircularProgress size={24} />
            ) : ledger.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No transactions yet.
              </Typography>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Plan</TableCell>
                      <TableCell>Payment ID</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Amount Paid</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {ledger.map((entry: any) => (
                      <TableRow key={entry._id} hover>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>
                          {fmtDate(entry.createdAt)}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>
                            {entry.reason || '—'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                            {entry._id?.slice(-8) || '—'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={entry.status}
                            size="small"
                            color={entry.status === 'CAPTURED' ? 'success' : 'warning'}
                          />
                        </TableCell>
                        <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                          <Typography variant="body2" fontWeight={700} color="primary">
                            {fmtMoney(entry.amount, entry.currency)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </MainCard>
        </Grid>
      </Grid>

      <UpgradeModal
        open={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        plans={plans}
        currentPlan={sub?.plan_name}
        addonChannels={addonData?.addon_channels || 0}
        addonUsers={addonData?.addon_users || 0}
      />

      {addonModal && (
        <AddonModal
          open={!!addonModal}
          onClose={() => setAddonModal(null)}
          type={addonModal}
          basePrice={addonModal === 'channel'
            ? (addonData?.addon_prices.channel.base ?? 999)
            : (addonData?.addon_prices.user.base ?? 99)}
          taxPercent={addonModal === 'channel'
            ? (addonData?.addon_prices.channel.tax_percent ?? 18)
            : (addonData?.addon_prices.user.tax_percent ?? 18)}
        />
      )}
    </Box>
  );
}
