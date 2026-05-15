import { Link } from 'react-router-dom';
import { Box, Divider, Stack, Typography } from '@mui/material';
import {
  MessageOutlined,
  ThunderboltFilled,
  SafetyCertificateFilled,
  TeamOutlined,
} from '@ant-design/icons';
import useAuth from 'hooks/useAuth';
import Logo from 'components/logo';
import AuthBackground from 'assets/images/auth/AuthBackground';
import AuthLogin from 'sections/auth/auth-forms/AuthLogin';

const BULLETS = [
  { icon: <MessageOutlined />, text: 'Bulk WhatsApp campaigns in seconds' },
  { icon: <ThunderboltFilled />, text: 'AI-powered automation flows' },
  { icon: <TeamOutlined />, text: 'Collaborative inbox for your team' },
  { icon: <SafetyCertificateFilled />, text: 'Official Meta Business API — verified & secure' },
];

const Login = () => {
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
          width: 440,
          minHeight: '100vh',
          background: 'linear-gradient(160deg, #00291a 0%, #005c34 55%, #008245 100%)',
          p: 5,
          flexShrink: 0,
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Subtle decorative circles */}
        <Box sx={{
          position: 'absolute', top: -60, right: -60,
          width: 240, height: 240, borderRadius: '50%',
          background: 'rgba(255,255,255,0.04)', pointerEvents: 'none',
        }} />
        <Box sx={{
          position: 'absolute', bottom: 80, left: -80,
          width: 300, height: 300, borderRadius: '50%',
          background: 'rgba(255,255,255,0.03)', pointerEvents: 'none',
        }} />

        <Box sx={{ position: 'relative' }}>
          <Logo />
          <Typography variant="h4" fontWeight={800} sx={{ color: '#fff', mt: 6, mb: 1, lineHeight: 1.3 }}>
            Welcome back to<br />AutoChatix
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mb: 5, lineHeight: 1.7 }}>
            Your WhatsApp automation platform — manage campaigns, flows, and contacts from one place.
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

        {/* Testimonial */}
        <Box sx={{ position: 'relative' }}>
          <Box
            sx={{
              bgcolor: 'rgba(255,255,255,0.07)',
              borderRadius: 2.5,
              p: 2.5,
              mb: 3,
              borderLeft: '3px solid rgba(82,214,138,0.6)',
            }}
          >
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', fontStyle: 'italic', lineHeight: 1.6 }}>
              "AutoChatix cut our response time by 70%. Our WhatsApp sales went up 3x in the first month."
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(82,214,138,0.9)', mt: 1, display: 'block', fontWeight: 600 }}>
              — Marketing Head, D2C Brand
            </Typography>
          </Box>
          <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', mb: 2 }} />
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
            alignItems: 'center',
            justifyContent: 'center',
            py: { xs: 4, md: 6 },
            px: { xs: 2, sm: 4 },
          }}
        >
          <Box sx={{ width: '100%', maxWidth: 420 }}>
            {/* Header */}
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 3.5 }}>
              <Box>
                <Typography variant="h4" fontWeight={800} sx={{ lineHeight: 1.2 }}>Sign in</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                  Welcome back — enter your credentials
                </Typography>
              </Box>
              <Typography
                component={Link}
                to={isLoggedIn ? '/auth/register' : '/register'}
                variant="body2"
                sx={{
                  textDecoration: 'none',
                  color: 'primary.main',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  mt: 0.5,
                  '&:hover': { textDecoration: 'underline' },
                }}
              >
                Create account →
              </Typography>
            </Stack>

            {/* Form card */}
            <Box
              sx={{
                bgcolor: 'background.paper',
                borderRadius: 3,
                p: { xs: 3, md: 3.5 },
                boxShadow: '0 2px 24px rgba(0,0,0,0.07)',
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <AuthLogin />
            </Box>

            {/* Trust badges */}
            <Stack direction="row" justifyContent="center" gap={3} sx={{ mt: 3 }}>
              {['🔒 SSL Secured', '✓ Meta Verified', '⚡ Razorpay'].map((t) => (
                <Typography key={t} variant="caption" color="text.disabled" sx={{ fontWeight: 500 }}>{t}</Typography>
              ))}
            </Stack>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Login;
