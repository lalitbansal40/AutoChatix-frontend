import { ReactNode } from 'react';
import { Box, Stack, Typography } from '@mui/material';
import Logo from 'components/logo';
import AuthBackground from 'assets/images/auth/AuthBackground';

interface Props {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}

// Shared split-screen layout for all auth pages (forgot-password, OTP, reset, invite, etc.)
const AuthSplitWrapper = ({ children, title, subtitle }: Props) => (
  <Box sx={{ minHeight: '100vh', display: 'flex', position: 'relative', bgcolor: '#F5F7F5' }}>
    <AuthBackground />

    {/* ── Left brand panel ── */}
    <Box
      sx={{
        display: { xs: 'none', lg: 'flex' },
        flexDirection: 'column',
        justifyContent: 'center',
        width: 400,
        minHeight: '100vh',
        background: 'linear-gradient(160deg, #00291a 0%, #005c34 55%, #008245 100%)',
        p: 5,
        flexShrink: 0,
        position: 'relative',
        zIndex: 1,
      }}
    >
      {/* Decorative circles */}
      <Box sx={{ position: 'absolute', top: -60, right: -60, width: 220, height: 220, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />
      <Box sx={{ position: 'absolute', bottom: 60, left: -80, width: 280, height: 280, borderRadius: '50%', background: 'rgba(255,255,255,0.03)', pointerEvents: 'none' }} />

      <Box sx={{ position: 'relative' }}>
        <Logo />
        {title && (
          <Typography variant="h4" fontWeight={800} sx={{ color: '#fff', mt: 5, mb: 1.5, lineHeight: 1.3 }}>
            {title}
          </Typography>
        )}
        {subtitle && (
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
            {subtitle}
          </Typography>
        )}

        {/* WhatsApp pill badge */}
        <Stack direction="row" alignItems="center" gap={1}
          sx={{ mt: 4, display: 'inline-flex', bgcolor: 'rgba(82,214,138,0.12)', borderRadius: 6, px: 2, py: 0.75 }}
        >
          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#52d68a', flexShrink: 0 }} />
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.75)', fontWeight: 500 }}>
            Official Meta Business API
          </Typography>
        </Stack>
      </Box>
    </Box>

    {/* ── Right content panel ── */}
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
          {children}
        </Box>
      </Box>
    </Box>
  </Box>
);

export default AuthSplitWrapper;
