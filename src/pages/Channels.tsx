import { useEffect, useRef, useState } from 'react';
import { Alert, Box, Button, CircularProgress, Fade, Grid, Snackbar, Tooltip, Typography } from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import ChannelCard from 'components/ChannelCard';
import PlanGateModal from 'components/PlanGateModal';
import { channelService } from 'service/channel.service';
import { ChannelT } from 'types/channels';
import axios from 'utils/axios';
import { usePlanGate } from 'hooks/usePlanGate';

const fetchAccountLimits = () => axios.get('/team/limits').then((r) => r.data);

declare global {
  interface Window {
    FB: any;
    fbAsyncInit: () => void;
  }
}

const META_APP_ID = '955625287255039';
const META_CONFIG_ID = '1917533792228152';

const Channels = () => {
  const queryClient = useQueryClient();
  const { guard, gateOpen, closeGate } = usePlanGate();

  // Stores phone_number_id + waba_id received from Meta iframe message event
  const sessionInfoRef = useRef<{
    phone_number_id?: string;
    waba_id?: string;
    display_phone_number?: string;
  }>({});

  const [connecting, setConnecting] = useState(false);
  const [toast, setToast] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['channels'],
    queryFn: () => channelService.getChannels(),
    select: (response) => response.data,
  });

  const { data: limits } = useQuery({ queryKey: ['account-limits'], queryFn: fetchAccountLimits });

  const channelLimit = limits?.limits?.channels ?? null;
  const channelUsage = limits?.usage?.channels ?? (data?.length ?? 0);
  const channelLimitReached = channelLimit !== null && channelLimit !== -1 && channelUsage >= channelLimit;
  const connectDisabled = connecting || channelLimitReached;
  const connectTooltip = channelLimitReached
    ? `Channel limit reached (${channelLimit}). Upgrade your plan to add more.`
    : '';

  // Load Meta Facebook JS SDK dynamically once
  useEffect(() => {
    if (document.getElementById('facebook-jssdk')) return;

    window.fbAsyncInit = () => {
      window.FB.init({
        appId: META_APP_ID,
        autoLogAppEvents: true,
        xfbml: true,
        version: 'v21.0',
      });
    };

    const script = document.createElement('script');
    script.id = 'facebook-jssdk';
    script.src = 'https://connect.facebook.net/en_US/sdk.js';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
  }, []);

  // Listen for WA_EMBEDDED_SIGNUP message from Meta iframe popup
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== 'https://www.facebook.com') return;
      try {
        const parsed = JSON.parse(event.data);
        if (parsed.type === 'WA_EMBEDDED_SIGNUP' && parsed.event === 'FINISH') {
          sessionInfoRef.current = {
            phone_number_id: parsed.data?.phone_number_id,
            waba_id: parsed.data?.waba_id,
            display_phone_number: parsed.data?.display_phone_number,
          };
        }
      } catch {
        // non-JSON messages from facebook — safe to ignore
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const launchWhatsAppSignup = () => {
    if (!window.FB) {
      setToast({ open: true, message: 'Facebook SDK not loaded yet. Please wait a moment and try again.', severity: 'error' });
      return;
    }

    // Reset any previous session info
    sessionInfoRef.current = {};

    window.FB.login(
      (response: any) => {
        if (!response.authResponse?.code) {
          setToast({ open: true, message: 'Connection cancelled or failed. Please try again.', severity: 'error' });
          return;
        }

        setConnecting(true);
        channelService
          .connectViaEmbeddedSignup({
            code: response.authResponse.code,
            waba_id: sessionInfoRef.current.waba_id,
            phone_number_id: sessionInfoRef.current.phone_number_id,
            display_phone_number: sessionInfoRef.current.display_phone_number,
          })
          .then(() => {
            queryClient.invalidateQueries({ queryKey: ['channels'] });
            setToast({ open: true, message: 'WhatsApp channel connected successfully!', severity: 'success' });
          })
          .catch((err: any) => {
            const msg = err?.response?.data?.message || err?.message || 'Failed to connect channel. Please try again.';
            setToast({ open: true, message: msg, severity: 'error' });
          })
          .finally(() => {
            setConnecting(false);
          });
      },
      {
        config_id: META_CONFIG_ID,
        response_type: 'code',
        override_default_response_type: true,
        extras: {
          featureType: 'whatsapp_business_app_onboarding',
          sessionInfoVersion: 3,
          version: 'v4',
        },
      }
    );
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <CircularProgress sx={{ color: '#25D366' }} />
      </Box>
    );
  }

  if (isError) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <Typography color="error">{(error as Error).message}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ px: 3, py: 3 }}>

      {/* ── PAGE HEADER ── */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 4 }}>
        <Box>
          <Typography sx={{ fontSize: 22, fontWeight: 800, color: '#111827', letterSpacing: -0.4, mb: 0.5 }}>
            Channels
          </Typography>
          <Typography sx={{ fontSize: 13.5, color: '#6b7280' }}>
            Manage your WhatsApp business channels
          </Typography>
        </Box>

        <Tooltip title={connectTooltip} arrow>
          <span>
            <Button
              variant="contained"
              startIcon={connecting ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : <AddCircleOutlineIcon sx={{ fontSize: 18 }} />}
              onClick={() => guard(launchWhatsAppSignup)}
              disabled={connectDisabled}
              sx={{
                bgcolor: '#25D366',
                color: '#fff',
                fontWeight: 700,
                fontSize: 13,
                borderRadius: '10px',
                px: 2.5,
                py: 1,
                textTransform: 'none',
                boxShadow: '0 2px 10px rgba(37,211,102,0.35)',
                '&:hover': { bgcolor: '#1db954', boxShadow: '0 4px 14px rgba(37,211,102,0.45)' },
                '&:disabled': { bgcolor: '#86efac', color: '#fff' },
              }}
            >
              {connecting ? 'Connecting...' : 'Connect WhatsApp'}
            </Button>
          </span>
        </Tooltip>
      </Box>

      {/* ── CHANNEL CARDS ── */}
      {data?.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 10 }}>
          <Typography fontSize={48} lineHeight={1} mb={2}>📡</Typography>
          <Typography fontSize={16} fontWeight={700} color="#374151" mb={0.75}>No channels yet</Typography>
          <Typography fontSize={13} color="#9ca3af">Connect a WhatsApp number to get started</Typography>
        </Box>
      ) : (
        <Grid container spacing={2.5}>
          {data?.map((channel: ChannelT, index: number) => (
            <Grid item xs={12} sm={6} lg={4} key={channel._id}>
              <Fade in timeout={350} style={{ transitionDelay: `${index * 80}ms` }}>
                <Box>
                  <ChannelCard channel={channel} />
                </Box>
              </Fade>
            </Grid>
          ))}
        </Grid>
      )}

      <PlanGateModal open={gateOpen} onClose={closeGate} feature="connect channels" />

      {/* ── TOAST NOTIFICATIONS ── */}
      <Snackbar
        open={toast.open}
        autoHideDuration={5000}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setToast((t) => ({ ...t, open: false }))}
          severity={toast.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Channels;
