import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  InputAdornment,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'utils/axios';

const fetchPaymentConfig = () => axios.get('/account/payment-config').then((r) => r.data.payment_config);

const Payments = () => {
  const qc = useQueryClient();
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false, message: '', severity: 'success',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['payment-config'],
    queryFn: fetchPaymentConfig,
  });

  const [form, setForm] = useState<{
    payment_method: 'upi_vpa' | 'razorpay';
    upi_config_name: string;
    upi_vpa: string;
    razorpay_config_name: string;
  } | null>(null);

  // Initialise form once data loads
  const config = form ?? (data ? {
    payment_method: data.payment_method || 'upi_vpa',
    upi_config_name: data.upi_config_name || '',
    upi_vpa: data.upi_vpa || '',
    razorpay_config_name: data.razorpay_config_name || '',
  } : null);

  const save = useMutation({
    mutationFn: (payload: typeof config) => axios.put('/account/payment-config', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payment-config'] });
      setToast({ open: true, message: 'Payment settings saved', severity: 'success' });
    },
    onError: () => setToast({ open: true, message: 'Failed to save', severity: 'error' }),
  });

  const set = (key: string, val: string) => setForm((f) => ({ ...(f ?? config!), [key]: val }) as any);

  if (isLoading || !config) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="60vh">
        <CircularProgress sx={{ color: '#25D366' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ px: 3, py: 3, maxWidth: 640 }}>
      {/* Header */}
      <Box mb={3}>
        <Typography sx={{ fontSize: 22, fontWeight: 800, color: '#111827', mb: 0.5 }}>
          Payment Settings
        </Typography>
        <Typography sx={{ fontSize: 13.5, color: '#6b7280' }}>
          Configure default payment gateway used across all WhatsApp Payment nodes.
        </Typography>
      </Box>

      <Paper variant="outlined" sx={{ borderRadius: 3, p: 3 }}>
        <Stack spacing={3}>

          {/* Default Payment Method */}
          <Box>
            <Typography fontSize={13} fontWeight={600} mb={0.75}>Default Payment Method</Typography>
            <Select
              size="small"
              value={config.payment_method}
              onChange={(e) => set('payment_method', e.target.value)}
              fullWidth
            >
              <MenuItem value="upi_vpa">UPI (upi_collect)</MenuItem>
              <MenuItem value="razorpay">Razorpay</MenuItem>
            </Select>
            <Typography fontSize={11.5} color="text.secondary" mt={0.5}>
              Must be configured in Meta Business Manager under your WABA payment settings.
            </Typography>
          </Box>

          {/* UPI Section */}
          {config.payment_method === 'upi_vpa' && (
            <>
              <Divider>UPI Settings</Divider>
              <TextField
                label="UPI Config Name"
                size="small"
                fullWidth
                value={config.upi_config_name}
                onChange={(e) => set('upi_config_name', e.target.value)}
                placeholder="e.g. Autochatix"
                helperText="Exact name registered under your WABA in Meta Business Manager → Payments."
              />
              <TextField
                label="Merchant UPI VPA"
                size="small"
                fullWidth
                value={config.upi_vpa}
                onChange={(e) => set('upi_vpa', e.target.value)}
                placeholder="e.g. 9664114023@slc"
                helperText="Your UPI address — customer's payment goes here."
                InputProps={{
                  startAdornment: <InputAdornment position="start">@</InputAdornment>,
                }}
              />
            </>
          )}

          {/* Razorpay Section */}
          {config.payment_method === 'razorpay' && (
            <>
              <Divider>Razorpay Settings</Divider>
              <TextField
                label="Razorpay Config Name"
                size="small"
                fullWidth
                value={config.razorpay_config_name}
                onChange={(e) => set('razorpay_config_name', e.target.value)}
                placeholder="e.g. MyRazorpayConfig"
                helperText="Exact name registered under your WABA in Meta Business Manager → Payments."
              />
            </>
          )}

          <Box pt={1}>
            <Button
              variant="contained"
              disabled={save.isPending}
              onClick={() => save.mutate(config)}
              sx={{
                bgcolor: '#25D366',
                '&:hover': { bgcolor: '#1db954' },
                fontWeight: 700,
                borderRadius: '10px',
                textTransform: 'none',
                px: 3,
              }}
            >
              {save.isPending ? 'Saving…' : 'Save Settings'}
            </Button>
          </Box>
        </Stack>
      </Paper>

      {/* Info box */}
      <Alert severity="info" sx={{ mt: 3, borderRadius: 2 }}>
        <Typography fontSize={12.5} fontWeight={600} mb={0.5}>How it works</Typography>
        <Typography fontSize={12} color="text.secondary">
          These settings are used automatically in all <strong>WhatsApp Payment</strong> nodes.
          You no longer need to enter payment details inside each node — just configure it once here.
        </Typography>
      </Alert>

      <Snackbar open={toast.open} autoHideDuration={4000} onClose={() => setToast((t) => ({ ...t, open: false }))}>
        <Alert severity={toast.severity} onClose={() => setToast((t) => ({ ...t, open: false }))}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Payments;
