import { useState } from 'react';
import {
  Alert, Button, CircularProgress, Collapse, Dialog, DialogActions,
  DialogContent, DialogTitle, MenuItem, Select, Stack, Typography
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { walletService } from 'service/wallet.service';
import useAuth from 'hooks/useAuth';

const PLANS = [
  { value: 'starter', label: 'Starter — ₹1,199/mo' },
  { value: 'growth',  label: 'Growth — ₹2,999/mo' },
  { value: 'pro',     label: 'Pro — ₹4,999/mo' },
];

const UpgradeModal = ({ open, onClose, currentPlan }: { open: boolean; onClose: () => void; currentPlan: string }) => {
  const [plan, setPlan] = useState(currentPlan || 'starter');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePay = async () => {
    setLoading(true);
    setError('');
    try {
      const { payment_url } = await walletService.createRenewalLink(plan);
      window.location.href = payment_url;
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to create payment link. Try again.');
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Activate / Upgrade Plan</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Select a plan to activate your account. You'll be redirected to Razorpay to complete payment.
        </Typography>
        <Select fullWidth value={plan} onChange={(e) => setPlan(e.target.value)}>
          {PLANS.map((p) => (
            <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>
          ))}
        </Select>
        {error && (
          <Typography color="error" variant="caption" sx={{ mt: 1, display: 'block' }}>{error}</Typography>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={loading}>Cancel</Button>
        <Button variant="contained" color="primary" onClick={handlePay} disabled={loading}>
          {loading ? <CircularProgress size={18} /> : 'Proceed to Pay'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const SubscriptionBanner = () => {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['my-subscription'],
    queryFn: () => walletService.getMySubscription(),
    staleTime: 5 * 60 * 1000,
  });

  // Superadmin always has full access — no banner
  if ((user as any)?.role === 'superadmin') return null;

  if (isLoading) return null;

  const sub = data?.subscription;
  const isActive = sub?.is_active && sub?.payment_status === 'paid';

  if (isActive) return null;

  const isPending = sub?.payment_status === 'pending' && sub?.razorpay_payment_link_id;

  return (
    <>
      <Collapse in>
        <Alert
          severity="warning"
          sx={{ borderRadius: 0, py: 0.75, '& .MuiAlert-message': { width: '100%' } }}
          action={
            <Stack direction="row" gap={1} alignItems="center">
              {isPending && (
                <Button
                  size="small"
                  variant="outlined"
                  color="warning"
                  href={`https://rzp.io`}
                  sx={{ whiteSpace: 'nowrap', fontSize: 12 }}
                  onClick={() => setOpen(true)}
                >
                  Complete Payment
                </Button>
              )}
              <Button
                size="small"
                variant="contained"
                color="warning"
                onClick={() => setOpen(true)}
                sx={{ whiteSpace: 'nowrap', fontSize: 12 }}
              >
                {sub?.payment_status === 'expired' ? 'Renew Plan' : 'Activate Plan'}
              </Button>
            </Stack>
          }
        >
          <Typography variant="body2" fontWeight={600}>
            {sub?.payment_status === 'expired'
              ? 'Your subscription has expired. Renew to restore access to all features.'
              : sub?.payment_status === 'pending'
              ? 'Payment pending — complete payment to activate your account and unlock all features.'
              : 'No active subscription. Purchase a plan to unlock automations, channels, and more.'}
          </Typography>
        </Alert>
      </Collapse>

      <UpgradeModal
        open={open}
        onClose={() => setOpen(false)}
        currentPlan={sub?.plan_name || 'starter'}
      />
    </>
  );
};

export default SubscriptionBanner;
