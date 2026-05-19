import { Box, Typography } from '@mui/material';
import { Link } from 'react-router-dom';
import AuthSplitWrapper from 'sections/auth/AuthSplitWrapper';
import AuthFormCard from 'sections/auth/AuthFormCard';
import AuthResetPassword from 'sections/auth/auth-forms/AuthResetPassword';

// ================================|| RESET PASSWORD ||================================ //

const ResetPassword = () => (
  <AuthSplitWrapper
    title="Create a new password"
    subtitle="Choose something strong that you haven't used before."
  >
    <AuthFormCard
      heading="Reset Password"
      subheading="Your new password must be at least 8 characters."
    >
      <AuthResetPassword />
    </AuthFormCard>

    <Box sx={{ textAlign: 'center', mt: 2.5 }}>
      <Typography variant="body2" color="text.secondary">
        Remember your password?{' '}
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

export default ResetPassword;
