import { useNavigate } from 'react-router-dom';

import {
  Alert,
  Button,
  CircularProgress,
  FormHelperText,
  InputAdornment,
  InputLabel,
  OutlinedInput,
  Stack,
} from '@mui/material';

import * as Yup from 'yup';
import { Formik } from 'formik';

import AnimateButton from 'components/@extended/AnimateButton';
import useAuth from 'hooks/useAuth';
import useScriptRef from 'hooks/useScriptRef';
import { MailOutlined } from '@ant-design/icons';

// ============================|| AUTH - FORGOT PASSWORD ||============================ //

const AuthForgotPassword = () => {
  const scriptedRef = useScriptRef();
  const navigate = useNavigate();
  const { resetPassword } = useAuth();

  return (
    <Formik
      initialValues={{ email: '', submit: null }}
      validationSchema={Yup.object().shape({
        email: Yup.string().email('Must be a valid email').max(255).required('Email is required'),
      })}
      onSubmit={async (values, { setErrors, setStatus, setSubmitting }) => {
        try {
          await resetPassword(values.email);
          if (scriptedRef.current) {
            setStatus({ success: true });
            setSubmitting(false);
            navigate('/check-mail', { replace: true });
          }
        } catch (err: any) {
          if (scriptedRef.current) {
            setStatus({ success: false });
            setErrors({ submit: err?.response?.data?.message || err.message });
            setSubmitting(false);
          }
        }
      }}
    >
      {({ errors, handleBlur, handleChange, handleSubmit, isSubmitting, touched, values }) => (
        <form noValidate onSubmit={handleSubmit}>
          <Stack spacing={2.5}>
            <Stack spacing={0.75}>
              <InputLabel htmlFor="email-forgot">Email address</InputLabel>
              <OutlinedInput
                id="email-forgot"
                type="email"
                name="email"
                value={values.email}
                onBlur={handleBlur}
                onChange={handleChange}
                placeholder="you@company.com"
                fullWidth
                startAdornment={
                  <InputAdornment position="start">
                    <MailOutlined style={{ color: '#bfbfbf' }} />
                  </InputAdornment>
                }
                error={Boolean(touched.email && errors.email)}
              />
              {touched.email && errors.email && (
                <FormHelperText error>{errors.email}</FormHelperText>
              )}
            </Stack>

            {errors.submit && (
              <Alert severity="error" sx={{ py: 0.5 }}>{errors.submit}</Alert>
            )}

            <AnimateButton>
              <Button
                disableElevation
                disabled={isSubmitting}
                fullWidth
                size="large"
                type="submit"
                variant="contained"
                color="primary"
                sx={{ py: 1.4, fontWeight: 700, fontSize: 15, borderRadius: 2 }}
                startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : null}
              >
                {isSubmitting ? 'Sending…' : 'Send Reset Link'}
              </Button>
            </AnimateButton>
          </Stack>
        </form>
      )}
    </Formik>
  );
};

export default AuthForgotPassword;
