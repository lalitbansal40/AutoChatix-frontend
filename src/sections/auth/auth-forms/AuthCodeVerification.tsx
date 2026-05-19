import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useTheme } from '@mui/material/styles';
import { Alert, Button, CircularProgress, Grid, Stack, Typography } from '@mui/material';

import OtpInput from 'react18-input-otp';

import AnimateButton from 'components/@extended/AnimateButton';
import useAuth from 'hooks/useAuth';

import { ThemeMode } from 'types/config';

// ============================|| AUTH - CODE VERIFICATION ||============================ //

const AuthCodeVerification = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { verifyOTP } = useAuth();

  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const email = sessionStorage.getItem('otp_email') || '';

  const borderColor = theme.palette.mode === ThemeMode.DARK ? theme.palette.grey[200] : theme.palette.grey[300];

  const handleVerify = async () => {
    if (otp.length < 6) {
      setError('Please enter the 6-digit code.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await verifyOTP(email, otp);
      navigate('/chats', { replace: true });
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Invalid or expired OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <OtpInput
          value={otp}
          onChange={(val: string) => setOtp(val)}
          numInputs={6}
          containerStyle={{ justifyContent: 'space-between' }}
          inputStyle={{
            width: '100%',
            margin: '6px',
            padding: '10px',
            border: `1px solid ${borderColor}`,
            borderRadius: 4,
          }}
          focusStyle={{
            outline: 'none',
            boxShadow: theme.customShadows.primary,
            border: `1px solid ${theme.palette.primary.main}`,
          }}
        />
      </Grid>

      {error && (
        <Grid item xs={12}>
          <Alert severity="error" sx={{ py: 0.5 }}>{error}</Alert>
        </Grid>
      )}

      <Grid item xs={12}>
        <AnimateButton>
          <Button
            disableElevation
            fullWidth
            size="large"
            variant="contained"
            onClick={handleVerify}
            disabled={loading || otp.length < 6}
            startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
          >
            {loading ? 'Verifying…' : 'Verify & Continue'}
          </Button>
        </AnimateButton>
      </Grid>

      <Grid item xs={12}>
        <Stack direction="row" justifyContent="space-between" alignItems="baseline">
          <Typography variant="body2" color="text.secondary">
            Didn&apos;t receive the email? Check your spam folder.
          </Typography>
        </Stack>
      </Grid>
    </Grid>
  );
};

export default AuthCodeVerification;
