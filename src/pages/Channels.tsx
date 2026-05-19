import { useEffect, useRef, useState } from 'react';
import {
  Alert, Box, Button, Checkbox, CircularProgress, Dialog, DialogActions, DialogContent,
  Fade, FormControlLabel, Grid, IconButton, InputAdornment, Snackbar,
  Step, StepLabel, Stepper, TextField, Tooltip, Typography,
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import LinkIcon from '@mui/icons-material/Link';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
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

const META_APP_ID = process.env.REACT_APP_META_APP_ID || '955625287255039';
const META_CONFIG_ID = process.env.REACT_APP_META_CONFIG_ID || '1917533792228152';

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
  const [linkLoading, setLinkLoading] = useState(false);
  const [onboardingUrl, setOnboardingUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [migrateOpen, setMigrateOpen] = useState(false);
  const [migrateStep, setMigrateStep] = useState(0);
  const [twoFaDisabled, setTwoFaDisabled] = useState(false);
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

  const generateOnboardingLink = () => {
    setLinkLoading(true);
    setOnboardingUrl('');
    channelService
      .getOnboardingLink()
      .then((res: any) => {
        setOnboardingUrl(res.url);
      })
      .catch((err: any) => {
        const msg = err?.response?.data?.message || 'Failed to generate link. Please try again.';
        setToast({ open: true, message: msg, severity: 'error' });
      })
      .finally(() => setLinkLoading(false));
  };

  const copyLink = () => {
    navigator.clipboard.writeText(onboardingUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

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

        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            startIcon={<SwapHorizIcon sx={{ fontSize: 18 }} />}
            onClick={() => { setMigrateStep(0); setTwoFaDisabled(false); setMigrateOpen(true); }}
            sx={{
              fontWeight: 700, fontSize: 13, borderRadius: '10px', px: 2.5, py: 1,
              textTransform: 'none', borderColor: '#d1d5db', color: '#374151',
              '&:hover': { borderColor: '#6b7280', bgcolor: '#f9fafb' },
            }}
          >
            Migrate Existing Number
          </Button>

          <Tooltip title={connectTooltip} arrow>
            <span>
              <Button
                variant="contained"
                startIcon={connecting ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : <AddCircleOutlineIcon sx={{ fontSize: 18 }} />}
                onClick={() => guard(launchWhatsAppSignup)}
                disabled={connectDisabled}
                sx={{
                  bgcolor: '#25D366', color: '#fff', fontWeight: 700, fontSize: 13,
                  borderRadius: '10px', px: 2.5, py: 1, textTransform: 'none',
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

      {/* ── ZERO INTEGRATION ONBOARDING LINK ── */}
      <Box
        sx={{
          mt: 4,
          p: 3,
          borderRadius: '16px',
          border: '1.5px dashed #d1d5db',
          bgcolor: '#f9fafb',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography fontSize={14} fontWeight={700} color="#111827" mb={0.5}>
              Share Onboarding Link
            </Typography>
            <Typography fontSize={12.5} color="#6b7280" maxWidth={480}>
              Generate a link to send to anyone — they open it, connect their WhatsApp Business account,
              and it gets added to your workspace automatically. No manual steps needed.
            </Typography>
          </Box>
          <Tooltip title={channelLimitReached ? connectTooltip : ''} arrow>
            <span>
              <Button
                variant="outlined"
                size="small"
                startIcon={linkLoading ? <CircularProgress size={14} /> : <LinkIcon sx={{ fontSize: 16 }} />}
                onClick={() => guard(generateOnboardingLink)}
                disabled={linkLoading || channelLimitReached}
                sx={{
                  fontWeight: 600,
                  fontSize: 12.5,
                  borderRadius: '9px',
                  textTransform: 'none',
                  borderColor: '#d1d5db',
                  color: '#374151',
                  '&:hover': { borderColor: '#6b7280' },
                }}
              >
                {linkLoading ? 'Generating...' : 'Generate Link'}
              </Button>
            </span>
          </Tooltip>
        </Box>

        {onboardingUrl && (
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              value={onboardingUrl}
              size="small"
              InputProps={{
                readOnly: true,
                sx: { fontSize: 12, borderRadius: '10px', bgcolor: '#fff' },
                endAdornment: (
                  <InputAdornment position="end">
                    <Tooltip title={copied ? 'Copied!' : 'Copy link'}>
                      <IconButton size="small" onClick={copyLink}>
                        {copied
                          ? <CheckIcon sx={{ fontSize: 16, color: '#25D366' }} />
                          : <ContentCopyIcon sx={{ fontSize: 16 }} />
                        }
                      </IconButton>
                    </Tooltip>
                  </InputAdornment>
                ),
              }}
            />
            <Typography fontSize={11} color="#9ca3af" mt={0.75}>
              Link valid for 2 hours. Generate a new one when needed.
            </Typography>
          </Box>
        )}
      </Box>

      <PlanGateModal open={gateOpen} onClose={closeGate} feature="connect channels" />

      {/* ── MIGRATE EXISTING NUMBER DIALOG ── */}
      <Dialog
        open={migrateOpen}
        onClose={() => setMigrateOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}
      >
        {/* Header */}
        <Box sx={{ background: 'linear-gradient(135deg, #0a1628 0%, #0d2044 100%)', px: 3, py: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{
              width: 40, height: 40, borderRadius: '10px',
              background: 'linear-gradient(135deg, #25D366, #128C7E)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
            }}>🔄</Box>
            <Box>
              <Typography variant="h6" fontWeight={800} sx={{ color: '#fff', lineHeight: 1.2 }}>
                Migrate Existing WhatsApp Number
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                Move a number from another BSP or WABA to AutoChatix
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Stepper */}
        <Box sx={{ px: 3, pt: 2.5, pb: 0 }}>
          <Stepper activeStep={migrateStep} alternativeLabel>
            {['Disable 2FA', 'Connect via Facebook'].map((label) => (
              <Step key={label}>
                <StepLabel sx={{
                  '& .MuiStepLabel-label': { fontSize: 12, fontWeight: 600 },
                  '& .MuiStepIcon-root.Mui-active': { color: '#25D366' },
                  '& .MuiStepIcon-root.Mui-completed': { color: '#25D366' },
                }}>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>

        <DialogContent sx={{ pt: 2.5, pb: 1 }}>

          {/* ── STEP 0: Disable 2FA ── */}
          {migrateStep === 0 && (
            <Box>
              <Box sx={{ bgcolor: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 2, p: 2.5, mb: 2.5 }}>
                <Typography fontWeight={700} fontSize={14} color="#92400E" mb={1}>
                  ⚠️ Before you proceed — disable Two-Step Verification
                </Typography>
                <Typography fontSize={13} color="#78350F" lineHeight={1.7}>
                  WhatsApp requires 2FA to be <strong>turned off</strong> on the number you want to migrate.
                  If it's still enabled, the migration will fail.
                </Typography>
              </Box>

              <Typography fontSize={13.5} color="#374151" lineHeight={1.8} mb={2}>
                <strong>How to disable 2FA:</strong>
              </Typography>

              <Box component="ol" sx={{ pl: 2.5, m: 0, mb: 2.5 }}>
                {[
                  'Open WhatsApp Business Manager (business.facebook.com)',
                  'Go to → Accounts → WhatsApp Accounts → select your account',
                  'Click Settings → Two-step verification',
                  'Click "Turn off" and confirm',
                ].map((step, i) => (
                  <Box component="li" key={i} sx={{ fontSize: 13, color: '#374151', mb: 0.75, lineHeight: 1.6 }}>
                    {step}
                  </Box>
                ))}
              </Box>

              <Button
                variant="outlined"
                size="small"
                href="https://business.facebook.com/settings/whatsapp-business-accounts"
                target="_blank"
                rel="noopener noreferrer"
                sx={{ mb: 2.5, fontSize: 12.5, borderRadius: '8px', textTransform: 'none', borderColor: '#d1d5db', color: '#374151' }}
              >
                Open WhatsApp Business Manager ↗
              </Button>

              <FormControlLabel
                control={
                  <Checkbox
                    checked={twoFaDisabled}
                    onChange={(e) => setTwoFaDisabled(e.target.checked)}
                    sx={{ color: '#25D366', '&.Mui-checked': { color: '#25D366' } }}
                  />
                }
                label={
                  <Typography fontSize={13.5} fontWeight={600} color="#0F172A">
                    I have turned off two-step verification for my number
                  </Typography>
                }
              />
            </Box>
          )}

          {/* ── STEP 1: Connect via Facebook ── */}
          {migrateStep === 1 && (
            <Box>
              <Box sx={{ bgcolor: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 2, p: 2.5, mb: 2.5 }}>
                <Typography fontWeight={700} fontSize={14} color="#065F46" mb={0.75}>
                  ✅ 2FA disabled — ready to migrate
                </Typography>
                <Typography fontSize={13} color="#374151" lineHeight={1.7}>
                  Click the button below to launch Facebook's Embedded Signup. Select the WhatsApp number
                  you want to migrate and follow the on-screen steps. The process takes about 2 minutes.
                </Typography>
              </Box>

              <Box sx={{ bgcolor: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 2, p: 2, mb: 2 }}>
                <Typography fontSize={12.5} color="#1E40AF" lineHeight={1.7}>
                  <strong>Note:</strong> During the Facebook login flow, choose the WhatsApp Business Account
                  that contains the number you want to migrate. Meta will handle transferring it automatically.
                </Typography>
              </Box>

              <Button
                fullWidth
                variant="contained"
                disabled={connecting}
                startIcon={connecting ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : undefined}
                onClick={() => {
                  setMigrateOpen(false);
                  guard(launchWhatsAppSignup);
                }}
                sx={{
                  bgcolor: '#1877F2', color: '#fff', fontWeight: 700, fontSize: 14,
                  borderRadius: '10px', py: 1.5, textTransform: 'none',
                  boxShadow: '0 4px 14px rgba(24,119,242,0.4)',
                  '&:hover': { bgcolor: '#1464D8' },
                }}
              >
                {connecting ? 'Connecting…' : '🔵 Login with Facebook to Migrate'}
              </Button>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5, pt: 1, gap: 1 }}>
          <Button onClick={() => setMigrateOpen(false)} color="inherit" sx={{ borderRadius: '8px' }}>
            Cancel
          </Button>
          {migrateStep === 0 && (
            <Button
              variant="contained"
              disabled={!twoFaDisabled}
              onClick={() => setMigrateStep(1)}
              sx={{ bgcolor: '#25D366', '&:hover': { bgcolor: '#1db954' }, borderRadius: '8px', fontWeight: 700 }}
            >
              Next: Connect →
            </Button>
          )}
          {migrateStep === 1 && (
            <Button
              variant="outlined"
              onClick={() => setMigrateStep(0)}
              sx={{ borderRadius: '8px' }}
            >
              ← Back
            </Button>
          )}
        </DialogActions>
      </Dialog>

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
