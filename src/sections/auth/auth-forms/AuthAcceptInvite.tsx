import { useEffect, useState, SyntheticEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControl,
  FormHelperText,
  Grid,
  InputAdornment,
  InputLabel,
  OutlinedInput,
  Stack,
  Typography,
} from '@mui/material';

import * as Yup from 'yup';
import { Formik } from 'formik';

import useScriptRef from 'hooks/useScriptRef';
import IconButton from 'components/@extended/IconButton';
import AnimateButton from 'components/@extended/AnimateButton';
import axios from 'utils/axios';

import { strengthColor, strengthIndicator } from 'utils/password-strength';
import { StringColorProps } from 'types/password';

import { EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons';

// ============================|| AUTH - ACCEPT INVITE ||============================ //

const AuthAcceptInvite = () => {
  const scriptedRef = useScriptRef();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [level, setLevel] = useState<StringColorProps>();
  const [showPassword, setShowPassword] = useState(false);

  const handleClickShowPassword = () => setShowPassword(!showPassword);
  const handleMouseDownPassword = (event: SyntheticEvent) => event.preventDefault();

  const changePassword = (value: string) => {
    setLevel(strengthColor(strengthIndicator(value)));
  };

  useEffect(() => {
    changePassword('');
  }, []);

  if (!token) {
    return (
      <Alert severity="error">
        Invalid invite link. Please ask your admin to resend the invitation.
      </Alert>
    );
  }

  return (
    <Formik
      initialValues={{ password: '', confirmPassword: '', submit: null }}
      validationSchema={Yup.object().shape({
        password: Yup.string().min(8, 'Minimum 8 characters').max(255).required('Password is required'),
        confirmPassword: Yup.string()
          .required('Please confirm your password')
          .test('match', 'Passwords must match', (val, ctx) => ctx.parent.password === val),
      })}
      onSubmit={async (values, { setErrors, setStatus, setSubmitting }) => {
        try {
          const response = await axios.post('/auth/accept-invite', { token, password: values.password });
          const { token: sessionToken } = response.data;

          localStorage.setItem('serviceToken', sessionToken);
          axios.defaults.headers.common.Authorization = `Bearer ${sessionToken}`;

          if (scriptedRef.current) {
            setStatus({ success: true });
            setSubmitting(false);
          }

          navigate('/chats', { replace: true });
        } catch (err: any) {
          if (scriptedRef.current) {
            setStatus({ success: false });
            setErrors({ submit: err?.response?.data?.message || 'Invalid or expired invite link.' });
            setSubmitting(false);
          }
        }
      }}
    >
      {({ errors, handleBlur, handleChange, handleSubmit, isSubmitting, touched, values }) => (
        <form noValidate onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Stack spacing={1}>
                <InputLabel htmlFor="password-invite">Create Password</InputLabel>
                <OutlinedInput
                  fullWidth
                  error={Boolean(touched.password && errors.password)}
                  id="password-invite"
                  type={showPassword ? 'text' : 'password'}
                  value={values.password}
                  name="password"
                  onBlur={handleBlur}
                  onChange={(e) => {
                    handleChange(e);
                    changePassword(e.target.value);
                  }}
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
                  placeholder="Choose a strong password"
                />
                {touched.password && errors.password && (
                  <FormHelperText error>{errors.password}</FormHelperText>
                )}
              </Stack>
              <FormControl fullWidth sx={{ mt: 2 }}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item>
                    <Box sx={{ bgcolor: level?.color, width: 85, height: 8, borderRadius: '7px' }} />
                  </Grid>
                  <Grid item>
                    <Typography variant="subtitle1" fontSize="0.75rem">{level?.label}</Typography>
                  </Grid>
                </Grid>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <Stack spacing={1}>
                <InputLabel htmlFor="confirm-password-invite">Confirm Password</InputLabel>
                <OutlinedInput
                  fullWidth
                  error={Boolean(touched.confirmPassword && errors.confirmPassword)}
                  id="confirm-password-invite"
                  type="password"
                  value={values.confirmPassword}
                  name="confirmPassword"
                  onBlur={handleBlur}
                  onChange={handleChange}
                  placeholder="Confirm your password"
                />
                {touched.confirmPassword && errors.confirmPassword && (
                  <FormHelperText error>{errors.confirmPassword}</FormHelperText>
                )}
              </Stack>
            </Grid>

            {errors.submit && (
              <Grid item xs={12}>
                <Alert severity="error" sx={{ py: 0.5 }}>{errors.submit}</Alert>
              </Grid>
            )}

            <Grid item xs={12}>
              <AnimateButton>
                <Button
                  disableElevation
                  disabled={isSubmitting}
                  fullWidth
                  size="large"
                  type="submit"
                  variant="contained"
                  color="primary"
                  startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : null}
                >
                  {isSubmitting ? 'Activating Account…' : 'Activate Account'}
                </Button>
              </AnimateButton>
            </Grid>
          </Grid>
        </form>
      )}
    </Formik>
  );
};

export default AuthAcceptInvite;
