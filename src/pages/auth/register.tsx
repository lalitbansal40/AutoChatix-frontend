import { Link } from 'react-router-dom';
import { Box, Stack, Typography } from '@mui/material';
import { CheckCircleFilled, MessageOutlined, ThunderboltFilled, SafetyCertificateFilled } from '@ant-design/icons';
import useAuth from 'hooks/useAuth';
import Logo from 'components/logo';
import AuthBackground from 'assets/images/auth/AuthBackground';
import AuthRegister from 'sections/auth/auth-forms/AuthRegister';

const BULLETS = [
  { icon: <MessageOutlined />, text: 'Send bulk WhatsApp messages in seconds' },
  { icon: <ThunderboltFilled />, text: 'Automate replies with AI chatbot flows' },
  { icon: <SafetyCertificateFilled />, text: 'Official Meta Business API — no bans' },
  { icon: <CheckCircleFilled />, text: '37 days free on your first plan (30 + 7 bonus)' },
];

const Register = () => {
  const { isLoggedIn } = useAuth();

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', position: 'relative', bgcolor: '#f5f7f5' }}>
      <AuthBackground />

      {/* ── Left brand panel ── */}
      <Box
        sx={{
          display: { xs: 'none', lg: 'flex' },
          flexDirection: 'column',
          justifyContent: 'space-between',
          width: 420,
          minHeight: '100vh',
          background: 'linear-gradient(160deg, #00291a 0%, #005c34 55%, #008245 100%)',
          p: 5,
          flexShrink: 0,
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Decorative circles */}
        <Box sx={{
          position: 'absolute', top: -60, right: -60,
          width: 240, height: 240, borderRadius: '50%',
          background: 'rgba(255,255,255,0.04)', pointerEvents: 'none',
        }} />

        <Box sx={{ position: 'relative' }}>
          <Logo />
          <Typography variant="h4" fontWeight={800} sx={{ color: '#fff', mt: 6, mb: 1, lineHeight: 1.3 }}>
            Grow your business<br />with WhatsApp
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mb: 5, lineHeight: 1.7 }}>
            Join 1,000+ businesses automating WhatsApp marketing, support, and sales.
          </Typography>

          <Stack spacing={2.5}>
            {BULLETS.map((b, i) => (
              <Stack key={i} direction="row" alignItems="flex-start" gap={1.5}>
                <Box
                  sx={{
                    color: '#52d68a', mt: '3px', fontSize: 15,
                    bgcolor: 'rgba(82,214,138,0.15)',
                    borderRadius: '50%', width: 30, height: 30,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {b.icon}
                </Box>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)', lineHeight: 1.6, pt: 0.5 }}>
                  {b.text}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </Box>

        <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.3)' }}>
            Secured by Razorpay · Official Meta Business API Partner
          </Typography>
        </Box>
      </Box>

      {/* ── Right form panel ── */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          minHeight: '100vh',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Mobile logo */}
        <Box sx={{ display: { xs: 'block', lg: 'none' }, p: 3, pb: 0 }}>
          <Logo />
        </Box>

        <Box
          sx={{
            flex: 1,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            py: { xs: 3, md: 5 },
            px: { xs: 2, sm: 4 },
          }}
        >
          <Box sx={{ width: '100%', maxWidth: 680 }}>
            {/* Header */}
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
              <Box>
                <Typography variant="h4" fontWeight={800}>Create your account</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  Set up in 2 minutes — no credit card required upfront
                </Typography>
              </Box>
              <Typography
                component={Link}
                to={isLoggedIn ? '/auth/login' : '/login'}
                variant="body2"
                sx={{ textDecoration: 'none', color: 'primary.main', fontWeight: 600, whiteSpace: 'nowrap' }}
              >
                Sign in →
              </Typography>
            </Stack>

            {/* Form card */}
            <Box
              sx={{
                bgcolor: 'background.paper',
                borderRadius: 3,
                p: { xs: 3, md: 4 },
                boxShadow: '0 2px 24px rgba(0,0,0,0.07)',
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <AuthRegister />
            </Box>

            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 3 }}>
              By signing up you agree to our Terms of Service and Privacy Policy.
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Register;
