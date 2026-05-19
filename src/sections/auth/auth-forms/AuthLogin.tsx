import React from 'react';
import { useNavigate } from 'react-router-dom';

import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  FormControl,
  FormControlLabel,
  FormHelperText,
  InputAdornment,
  InputLabel,
  OutlinedInput,
  Stack,
  Typography,
} from '@mui/material';

import * as Yup from 'yup';
import { Formik } from 'formik';

import IconButton from 'components/@extended/IconButton';
import AnimateButton from 'components/@extended/AnimateButton';
import useAuth from 'hooks/useAuth';
import useScriptRef from 'hooks/useScriptRef';
import { EyeOutlined, EyeInvisibleOutlined, MailOutlined, LockOutlined } from '@ant-design/icons';

// ============================|| AUTH LOGIN ||============================ //

const AuthLogin = () => {
  const [checked, setChecked] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);

  const { login } = useAuth();
  const scriptedRef = useScriptRef();
  const navigate = useNavigate();

  const handleClickShowPassword = () => setShowPassword(!showPassword);
  const handleMouseDownPassword = (e: React.SyntheticEvent) => e.preventDefault();

  return (
    <Formik
      initialValues={{ email: '', password: '', submit: null }}
      validationSchema={Yup.object().shape({
        email:    Yup.string().email('Must be a valid email').max(255).required('Email is required'),
        password: Yup.string().max(255).required('Password is required'),
      })}
      onSubmit={async (values, { setErrors, setStatus, setSubmitting }) => {
        try {
          const result = await login(values.email, values.password);
          if (scriptedRef.current) {
            setStatus({ success: true });
            setSubmitting(false);
          }
          if (result?.require_otp) {
            navigate('/code-verification');
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

            {/* Email */}
            <Stack spacing={0.75}>
              <InputLabel htmlFor="email-login">Email address</InputLabel>
              <OutlinedInput
                id="email-login"
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

            {/* Password */}
            <Stack spacing={0.75}>
              <InputLabel htmlFor="password-login">Password</InputLabel>
              <OutlinedInput
                id="password-login"
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={values.password}
                onBlur={handleBlur}
                onChange={handleChange}
                placeholder="Enter your password"
                fullWidth
                startAdornment={
                  <InputAdornment position="start">
                    <LockOutlined style={{ color: '#bfbfbf' }} />
                  </InputAdornment>
                }
                endAdornment={
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={handleClickShowPassword}
                      onMouseDown={handleMouseDownPassword}
                      edge="end"
                      color="secondary"
                    >
                      {showPassword ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                    </IconButton>
                  </InputAdornment>
                }
                error={Boolean(touched.password && errors.password)}
              />
              {touched.password && errors.password && (
                <FormHelperText error>{errors.password}</FormHelperText>
              )}
            </Stack>

            {/* Remember me + Forgot password */}
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <FormControlLabel
                control={
                  <Checkbox
                    checked={checked}
                    onChange={(e) => setChecked(e.target.checked)}
                    name="checked"
                    color="primary"
                    size="small"
                  />
                }
                label={<Typography variant="body2">Keep me signed in</Typography>}
              />
              <Box
                component="a"
                href="/forgot-password"
                sx={{ color: 'primary.main', fontSize: 13, fontWeight: 500, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
              >
                Forgot password?
              </Box>
            </Stack>

            {/* Error */}
            {errors.submit && (
              <Alert severity="error" sx={{ py: 0.5 }}>{errors.submit}</Alert>
            )}

            {/* Submit */}
            <FormControl fullWidth>
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
                  {isSubmitting ? 'Signing in…' : 'Sign in'}
                </Button>
              </AnimateButton>
            </FormControl>

            <Box sx={{ textAlign: 'center', pt: 0.5 }}>
              <Typography variant="caption" color="text.secondary">
                Don't have an account?{' '}
                <Box
                  component="a"
                  href="/register"
                  sx={{ color: 'primary.main', fontWeight: 600, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                >
                  Sign up free
                </Box>
              </Typography>
            </Box>

          </Stack>
        </form>
      )}
    </Formik>
  );
};

export default AuthLogin;
