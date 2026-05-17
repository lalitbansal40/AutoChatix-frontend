import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, CircularProgress, Typography } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import axios from 'utils/axios';

type Status = 'loading' | 'success' | 'error';

const MetaCallback = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<Status>('loading');
  const [message, setMessage] = useState('Connecting your WhatsApp channel...');
  const [channelName, setChannelName] = useState('');
  const called = useRef(false);

  useEffect(() => {
    if (called.current) return;
    called.current = true;

    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');
    const wabaId = params.get('waba_id') || undefined;
    const phoneNumberId = params.get('phone_number_id') || undefined;
    const displayPhone = params.get('display_phone_number') || undefined;
    const error = params.get('error');

    if (error) {
      setStatus('error');
      setMessage(params.get('error_description') || 'Meta authorization was cancelled or failed.');
      return;
    }

    if (!code || !state) {
      setStatus('error');
      setMessage('Missing required parameters. Please use a valid onboarding link.');
      return;
    }

    axios
      .post('channel/oauth-callback', {
        code,
        state,
        waba_id: wabaId,
        phone_number_id: phoneNumberId,
        display_phone_number: displayPhone,
      })
      .then((res: any) => {
        setChannelName(res.data?.channel?.display_phone_number || res.data?.channel?.channel_name || '');
        setStatus('success');
        setMessage(res.data?.message || 'WhatsApp channel connected successfully!');
      })
      .catch((err: any) => {
        setStatus('error');
        setMessage(err?.response?.data?.message || err?.message || 'Failed to connect channel. Please try again.');
      });
  }, []);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#f8fafc',
        px: 2,
      }}
    >
      <Box
        sx={{
          maxWidth: 440,
          width: '100%',
          bgcolor: '#fff',
          borderRadius: '20px',
          boxShadow: '0 4px 32px rgba(0,0,0,0.08)',
          p: 5,
          textAlign: 'center',
        }}
      >
        {/* Logo */}
        <Box sx={{ mb: 3 }}>
          <Box
            component="img"
            src="/logo.png"
            onError={(e: any) => { e.target.style.display = 'none'; }}
            sx={{ height: 44, objectFit: 'contain' }}
          />
        </Box>

        {status === 'loading' && (
          <>
            <CircularProgress size={56} sx={{ color: '#25D366', mb: 3 }} />
            <Typography fontSize={18} fontWeight={700} color="#111827" mb={1}>
              Connecting WhatsApp
            </Typography>
            <Typography fontSize={13.5} color="#6b7280">
              {message}
            </Typography>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircleOutlineIcon sx={{ fontSize: 64, color: '#25D366', mb: 2 }} />
            <Typography fontSize={20} fontWeight={800} color="#111827" mb={1}>
              Connected!
            </Typography>
            {channelName && (
              <Typography fontSize={14} color="#374151" fontWeight={600} mb={1}>
                {channelName}
              </Typography>
            )}
            <Typography fontSize={13.5} color="#6b7280" mb={4}>
              {message}
            </Typography>
            <Button
              variant="contained"
              fullWidth
              onClick={() => navigate('/Channels')}
              sx={{
                bgcolor: '#25D366',
                color: '#fff',
                fontWeight: 700,
                fontSize: 14,
                borderRadius: '12px',
                py: 1.5,
                textTransform: 'none',
                '&:hover': { bgcolor: '#1db954' },
              }}
            >
              Go to Channels
            </Button>
          </>
        )}

        {status === 'error' && (
          <>
            <ErrorOutlineIcon sx={{ fontSize: 64, color: '#ef4444', mb: 2 }} />
            <Typography fontSize={20} fontWeight={800} color="#111827" mb={1}>
              Connection Failed
            </Typography>
            <Typography fontSize={13.5} color="#6b7280" mb={4}>
              {message}
            </Typography>
            <Button
              variant="outlined"
              fullWidth
              onClick={() => navigate('/Channels')}
              sx={{
                borderColor: '#d1d5db',
                color: '#374151',
                fontWeight: 600,
                fontSize: 14,
                borderRadius: '12px',
                py: 1.5,
                textTransform: 'none',
                '&:hover': { borderColor: '#6b7280' },
              }}
            >
              Back to Channels
            </Button>
          </>
        )}
      </Box>
    </Box>
  );
};

export default MetaCallback;
