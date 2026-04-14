import { useState } from 'react';

import {
  Button,
  FormHelperText,
  Grid,
  InputAdornment,
  InputLabel,
  OutlinedInput,
  Stack,
  Typography
} from '@mui/material';

import * as Yup from 'yup';
import { Formik } from 'formik';

import IconButton from 'components/@extended/IconButton';
import AnimateButton from 'components/@extended/AnimateButton';

import useAuth from 'hooks/useAuth';
import useScriptRef from 'hooks/useScriptRef';

import { EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons';

const AuthLogin = () => {
  const [step, setStep] = useState<'login' | 'otp'>('login');
  const [email, setEmail] = useState('');
  const [passwordState, setPasswordState] = useState('');
  const [otp, setOtp] = useState('');

  const { login, verifyOTP } = useAuth();

  const scriptedRef = useScriptRef();

  const [showPassword, setShowPassword] = useState(false);

  const handleVerifyOTP = async () => {
    try {
      await verifyOTP(email, otp);
      window.location.href = '/';
    } catch (err) {
      console.error(err);
    }
  };

  const handleResend = async () => {
    await login(email, passwordState);
  };

  // ================= OTP UI =================
  if (step === 'otp') {
    return (
      <Stack spacing={3} alignItems="center">
        <Typography variant="h3" sx={{ fontWeight: 600 }}>
          Verify OTP 🔐
        </Typography>

        <Typography variant="body2" color="text.secondary">
          Code sent to {email}
        </Typography>

        {/* OTP BOX */}
        <OutlinedInput
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          placeholder="••••••"
          inputProps={{ maxLength: 6 }}
          sx={{
            textAlign: 'center',
            fontSize: 28,
            letterSpacing: 10,
            borderRadius: 2,
            width: 220
          }}
        />

        <Button
          fullWidth
          variant="contained"
          sx={{
            borderRadius: 2,
            py: 1.5,
            background: '#22c55e'
          }}
          onClick={handleVerifyOTP}
        >
          Verify & Continue
        </Button>

        <Typography variant="body2">
          Didn’t receive?{' '}
          <span
            style={{ color: '#22c55e', cursor: 'pointer', fontWeight: 500 }}
            onClick={handleResend}
          >
            Resend
          </span>
        </Typography>
      </Stack>
    );
  }

  // ================= LOGIN UI =================
  return (
    <Formik
      initialValues={{
        email: '',
        password: '',
        submit: null
      }}
      validationSchema={Yup.object().shape({
        email: Yup.string().required('Email is required'),
        password: Yup.string().required('Password is required')
      })}
      onSubmit={async (values, { setErrors, setStatus, setSubmitting }) => {
        try {
          await login(values.email, values.password);

          setEmail(values.email);
          setPasswordState(values.password);

          setStep('otp'); // 🔥 move to OTP screen

          if (scriptedRef.current) {
            setStatus({ success: true });
            setSubmitting(false);
          }
        } catch (err: any) {
          console.error(err);
          if (scriptedRef.current) {
            setStatus({ success: false });
            setErrors({ submit: err.message });
            setSubmitting(false);
          }
        }
      }}
    >
      {({ errors, handleBlur, handleChange, handleSubmit, isSubmitting, touched, values }) => (
        <form noValidate onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* EMAIL */}
            <Grid item xs={12}>
              <Stack spacing={1}>
                <InputLabel>Email Address</InputLabel>
                <OutlinedInput
                  value={values.email}
                  name="email"
                  onBlur={handleBlur}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  fullWidth
                  sx={{
                    borderRadius: 2,
                    backgroundColor: '#f9fafb', // light grey
                    '& input': {
                      padding: '14px',
                      color: '#111'
                    },
                    '& fieldset': {
                      borderColor: '#e5e7eb'
                    },
                    '&:hover fieldset': {
                      borderColor: '#22c55e'
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#22c55e'
                    }
                  }}
                />
                {touched.email && errors.email && (
                  <FormHelperText error>{errors.email}</FormHelperText>
                )}
              </Stack>
            </Grid>

            {/* PASSWORD */}
            <Grid item xs={12}>
              <Stack spacing={1}>
                <InputLabel>Password</InputLabel>
                <OutlinedInput
                  type={showPassword ? 'text' : 'password'}
                  value={values.password}
                  name="password"
                  onBlur={handleBlur}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  fullWidth
                  sx={{
                    borderRadius: 2,
                    backgroundColor: '#f9fafb', // light grey
                    '& input': {
                      padding: '14px',
                      color: '#111'
                    },
                    '& fieldset': {
                      borderColor: '#e5e7eb'
                    },
                    '&:hover fieldset': {
                      borderColor: '#22c55e'
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#22c55e'
                    }
                  }}
                  endAdornment={
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                      </IconButton>
                    </InputAdornment>
                  }
                />
                {touched.password && errors.password && (
                  <FormHelperText error>{errors.password}</FormHelperText>
                )}
              </Stack>
            </Grid>

            {/* ACTIONS */}
            <Grid item xs={12}>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">
                  Keep me signed in
                </Typography>

                <Typography variant="body2" sx={{ cursor: 'pointer' }}>
                  Forgot password?
                </Typography>
              </Stack>
            </Grid>

            {/* BUTTON */}
            <Grid item xs={12}>
              <AnimateButton>
                <Button
                  fullWidth
                  type="submit"
                  variant="contained"
                  sx={{
                    borderRadius: 2,
                    py: 1.5,
                    fontSize: 16,
                    fontWeight: 600,
                    background: '#22c55e',
                    '&:hover': {
                      background: '#16a34a'
                    }
                  }}
                >
                  Continue
                </Button>
              </AnimateButton>
            </Grid>
          </Grid>
        </form>
      )}
    </Formik>
  );
};

export default AuthLogin;