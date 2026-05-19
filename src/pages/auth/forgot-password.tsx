import { Link } from 'react-router-dom';
import { Box, Typography } from '@mui/material';
import AuthSplitWrapper from 'sections/auth/AuthSplitWrapper';
import AuthFormCard from 'sections/auth/AuthFormCard';
import AuthForgotPassword from 'sections/auth/auth-forms/AuthForgotPassword';

// ================================|| FORGOT PASSWORD ||================================ //

const ForgotPassword = () => (
  <AuthSplitWrapper
    title="Forgot your password?"
    subtitle="No worries — enter your email and we'll send you a reset link right away."
  >
    <AuthFormCard
      heading="Reset Password"
      subheading="We'll email you a secure link to create a new password."
    >
      <AuthForgotPassword />
    </AuthFormCard>

    <Box sx={{ textAlign: 'center', mt: 2.5 }}>
      <Typography variant="body2" color="text.secondary">
        Remember it?{' '}
        <Box
          component={Link}
          to="/login"
          sx={{ color: 'primary.main', fontWeight: 600, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
        >
          Back to sign in
        </Box>
      </Typography>
    </Box>
  </AuthSplitWrapper>
);

export default ForgotPassword;
