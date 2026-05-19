import { Box, Typography } from '@mui/material';
import { Link } from 'react-router-dom';
import AuthSplitWrapper from 'sections/auth/AuthSplitWrapper';
import AuthFormCard from 'sections/auth/AuthFormCard';
import AuthAcceptInvite from 'sections/auth/auth-forms/AuthAcceptInvite';

// ================================|| ACCEPT INVITE ||================================ //

const AcceptInvite = () => (
  <AuthSplitWrapper
    title="You've been invited!"
    subtitle="Set up your password to activate your account and start collaborating with your team."
  >
    <AuthFormCard
      heading="Activate Your Account"
      subheading="Create a secure password to get started on AutoChatix."
    >
      <AuthAcceptInvite />
    </AuthFormCard>

    <Box sx={{ textAlign: 'center', mt: 2.5 }}>
      <Typography variant="caption" color="text.disabled">
        Already have an account?{' '}
        <Box
          component={Link}
          to="/login"
          sx={{ color: 'primary.main', fontWeight: 600, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
        >
          Sign in
        </Box>
      </Typography>
    </Box>
  </AuthSplitWrapper>
);

export default AcceptInvite;
