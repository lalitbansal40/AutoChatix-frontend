import { Link } from 'react-router-dom';
import { Box, Button, Stack, Typography } from '@mui/material';
import { MailOutlined } from '@ant-design/icons';
import AnimateButton from 'components/@extended/AnimateButton';
import AuthSplitWrapper from 'sections/auth/AuthSplitWrapper';

// ================================|| CHECK MAIL ||================================ //

const CheckMail = () => (
  <AuthSplitWrapper
    title="Check your inbox"
    subtitle="A password reset link is on its way to your email address."
  >
    <Box
      sx={{
        bgcolor: 'background.paper',
        borderRadius: 3,
        p: { xs: 3, md: 4 },
        boxShadow: '0 2px 24px rgba(0,0,0,0.07)',
        border: '1px solid',
        borderColor: 'divider',
        textAlign: 'center',
      }}
    >
      <Box
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 72,
          height: 72,
          borderRadius: '50%',
          bgcolor: 'primary.lighter',
          color: 'primary.main',
          fontSize: 32,
          mb: 2.5,
        }}
      >
        <MailOutlined />
      </Box>

      <Typography variant="h4" fontWeight={800} sx={{ mb: 1 }}>
        Email Sent!
      </Typography>
      <Typography color="text.secondary" variant="body2" sx={{ mb: 3, lineHeight: 1.7 }}>
        We've sent password reset instructions to your email address.
        Check your inbox — and spam folder, just in case.
      </Typography>

      <AnimateButton>
        <Button
          component={Link}
          to="/login"
          disableElevation
          fullWidth
          size="large"
          variant="contained"
          color="primary"
          sx={{ py: 1.4, fontWeight: 700, borderRadius: 2 }}
        >
          Back to Sign In
        </Button>
      </AnimateButton>

      <Stack direction="row" justifyContent="center" sx={{ mt: 2.5 }}>
        <Typography variant="caption" color="text.disabled">
          Didn't receive it?{' '}
          <Box
            component={Link}
            to="/forgot-password"
            sx={{ color: 'primary.main', fontWeight: 600, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
          >
            Try again
          </Box>
        </Typography>
      </Stack>
    </Box>
  </AuthSplitWrapper>
);

export default CheckMail;
