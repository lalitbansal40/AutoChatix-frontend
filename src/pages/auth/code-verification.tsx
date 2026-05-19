import { Box, Typography } from '@mui/material';
import AuthSplitWrapper from 'sections/auth/AuthSplitWrapper';
import AuthFormCard from 'sections/auth/AuthFormCard';
import AuthCodeVerification from 'sections/auth/auth-forms/AuthCodeVerification';

// ================================|| CODE VERIFICATION ||================================ //

const maskEmail = (email: string) => {
  const [user, domain] = email.split('@');
  if (!user || !domain) return email;
  const visible = user.slice(0, 2);
  return `${visible}${'*'.repeat(Math.max(user.length - 2, 3))}@${domain}`;
};

const CodeVerification = () => {
  const email = sessionStorage.getItem('otp_email') || '';

  return (
    <AuthSplitWrapper
      title="Two-step verification"
      subtitle="We send a one-time code to your email each time you sign in — keeping your account secure."
    >
      <AuthFormCard
        heading="Enter Verification Code"
        subheading={
          email
            ? `A 6-digit OTP was sent to ${maskEmail(email)}`
            : 'A 6-digit OTP was sent to your registered email.'
        }
      >
        <AuthCodeVerification />
      </AuthFormCard>

      <Box sx={{ textAlign: 'center', mt: 2.5 }}>
        <Typography variant="caption" color="text.disabled">
          Wrong account?{' '}
          <Box
            component="a"
            href="/login"
            sx={{ color: 'primary.main', fontWeight: 600, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
          >
            Back to sign in
          </Box>
        </Typography>
      </Box>
    </AuthSplitWrapper>
  );
};

export default CodeVerification;
