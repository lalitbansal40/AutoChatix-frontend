import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Box, Button, Stack, Typography } from '@mui/material';
import { CheckCircleFilled, CloseCircleFilled } from '@ant-design/icons';

// ================================|| PAYMENT SUCCESS PAGE ||================================ //

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [countdown, setCountdown] = useState(5);

  // Razorpay appends ?razorpay_payment_link_status=paid (or cancelled)
  const status = searchParams.get('razorpay_payment_link_status') || 'paid';
  const isPaid = status === 'paid';
  // type=renewal → user was already logged in (billing page upgrade/renew)
  const isRenewal = searchParams.get('type') === 'renewal';
  const redirectTo = isRenewal ? '/billing' : '/login';

  useEffect(() => {
    if (!isPaid) return;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate(redirectTo, { replace: true });
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isPaid, navigate, redirectTo]);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        p: 3,
      }}
    >
      <Stack alignItems="center" spacing={3} sx={{ maxWidth: 480, textAlign: 'center' }}>
        {isPaid ? (
          <>
            <CheckCircleFilled style={{ fontSize: 72, color: '#52c41a' }} />
            <Typography variant="h3" fontWeight={700}>
              Payment Successful! 🎉
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {isRenewal
              ? 'Your plan has been renewed successfully.'
              : 'Your AutoChatix subscription is now active. Log in to start building your WhatsApp bot.'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Redirecting to {isRenewal ? 'billing' : 'login'} in <strong>{countdown}</strong> seconds…
            </Typography>
            <Button variant="contained" size="large" onClick={() => navigate(redirectTo, { replace: true })}>
              {isRenewal ? 'Go to Billing' : 'Login Now'}
            </Button>
          </>
        ) : (
          <>
            <CloseCircleFilled style={{ fontSize: 72, color: '#ff4d4f' }} />
            <Typography variant="h3" fontWeight={700}>
              Payment Cancelled
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Your payment was not completed. Your account is created but your subscription is not yet active.
              You can try paying again from the login page.
            </Typography>
            <Stack direction="row" spacing={2}>
              <Button variant="outlined" onClick={() => navigate('/register', { replace: true })}>
                Try Again
              </Button>
              <Button variant="contained" onClick={() => navigate('/login', { replace: true })}>
                Go to Login
              </Button>
            </Stack>
          </>
        )}
      </Stack>
    </Box>
  );
};

export default PaymentSuccess;
