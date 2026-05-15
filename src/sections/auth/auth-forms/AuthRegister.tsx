import { useEffect, useState, SyntheticEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'utils/axios';

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
  MenuItem,
  OutlinedInput,
  Select,
  Stack,
  Typography,
} from '@mui/material';

import * as Yup from 'yup';
import { Formik } from 'formik';

import IconButton from 'components/@extended/IconButton';
import AnimateButton from 'components/@extended/AnimateButton';
import { strengthColor, strengthIndicator } from 'utils/password-strength';
import { StringColorProps } from 'types/password';
import {
  EyeOutlined,
  EyeInvisibleOutlined,
  UserOutlined,
  ShopOutlined,
  MailOutlined,
  PhoneOutlined,
  GlobalOutlined,
  LockOutlined,
} from '@ant-design/icons';
import useAuth from 'hooks/useAuth';

const COUNTRIES: { code: string; name: string }[] = [
  { code: 'IN', name: '🇮🇳 India' }, { code: 'US', name: '🇺🇸 United States' }, { code: 'GB', name: '🇬🇧 United Kingdom' },
  { code: 'AE', name: '🇦🇪 UAE' }, { code: 'SG', name: '🇸🇬 Singapore' }, { code: 'AU', name: '🇦🇺 Australia' },
  { code: 'CA', name: '🇨🇦 Canada' }, { code: 'DE', name: '🇩🇪 Germany' }, { code: 'FR', name: '🇫🇷 France' },
  { code: 'SA', name: '🇸🇦 Saudi Arabia' }, { code: 'QA', name: '🇶🇦 Qatar' }, { code: 'KW', name: '🇰🇼 Kuwait' },
  { code: 'BH', name: '🇧🇭 Bahrain' }, { code: 'OM', name: '🇴🇲 Oman' }, { code: 'MY', name: '🇲🇾 Malaysia' },
  { code: 'PH', name: '🇵🇭 Philippines' }, { code: 'ID', name: '🇮🇩 Indonesia' }, { code: 'TH', name: '🇹🇭 Thailand' },
  { code: 'BD', name: '🇧🇩 Bangladesh' }, { code: 'PK', name: '🇵🇰 Pakistan' }, { code: 'LK', name: '🇱🇰 Sri Lanka' },
  { code: 'NP', name: '🇳🇵 Nepal' }, { code: 'NG', name: '🇳🇬 Nigeria' }, { code: 'KE', name: '🇰🇪 Kenya' },
  { code: 'ZA', name: '🇿🇦 South Africa' }, { code: 'GH', name: '🇬🇭 Ghana' }, { code: 'EG', name: '🇪🇬 Egypt' },
  { code: 'BR', name: '🇧🇷 Brazil' }, { code: 'MX', name: '🇲🇽 Mexico' }, { code: 'AR', name: '🇦🇷 Argentina' },
  { code: 'JP', name: '🇯🇵 Japan' }, { code: 'KR', name: '🇰🇷 South Korea' }, { code: 'CN', name: '🇨🇳 China' },
  { code: 'HK', name: '🇭🇰 Hong Kong' }, { code: 'IT', name: '🇮🇹 Italy' }, { code: 'ES', name: '🇪🇸 Spain' },
  { code: 'NL', name: '🇳🇱 Netherlands' }, { code: 'RU', name: '🇷🇺 Russia' }, { code: 'TR', name: '🇹🇷 Turkey' },
  { code: 'IL', name: '🇮🇱 Israel' }, { code: 'UA', name: '🇺🇦 Ukraine' }, { code: 'NZ', name: '🇳🇿 New Zealand' },
  { code: 'VN', name: '🇻🇳 Vietnam' }, { code: 'PL', name: '🇵🇱 Poland' }, { code: 'CO', name: '🇨🇴 Colombia' },
];

const SectionLabel = ({ label }: { label: string }) => (
  <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>{label}</Typography>
);

const FieldWrapper = ({ children }: { children: React.ReactNode }) => (
  <Stack spacing={0.75}>{children}</Stack>
);

// ============================|| AUTH REGISTER ||============================ //

const AuthRegister = () => {
  const [, setSearchParams] = useSearchParams();
  const [level, setLevel] = useState<StringColorProps>();
  const [showPassword, setShowPassword] = useState(false);
  const [countryCode, setCountryCode] = useState<string>('IN');
  const { login } = useAuth();

  const handleClickShowPassword = () => setShowPassword(!showPassword);
  const handleMouseDownPassword = (e: SyntheticEvent) => e.preventDefault();
  const changePassword = (value: string) => setLevel(strengthColor(strengthIndicator(value)));

  useEffect(() => {
    changePassword('');
    // Auto-detect country from IP
    fetch('https://ipapi.co/json/')
      .then((r) => r.json())
      .then((geo) => { if (geo?.country_code) setCountryCode(geo.country_code); })
      .catch(() => {});
  }, []);

  // suppress unused warning
  void setSearchParams;

  return (
    <Formik
      initialValues={{ firstname: '', lastname: '', company: '', email: '', phone: '', password: '', submit: null }}
      validationSchema={Yup.object().shape({
        firstname: Yup.string().max(255).required('First name is required'),
        lastname:  Yup.string().max(255).required('Last name is required'),
        company:   Yup.string().max(255).required('Business name is required'),
        email:     Yup.string().email('Must be a valid email').max(255).required('Email is required'),
        phone:     Yup.string().min(7, 'Enter a valid phone number').required('Phone number is required'),
        password:  Yup.string().min(6, 'Min. 6 characters').required('Password is required'),
      })}
      onSubmit={async (values, { setErrors, setStatus, setSubmitting }) => {
        try {
          // Step 1: Create account
          const response = await axios.post('/auth/register', {
            email:        values.email,
            phone:        values.phone,
            password:     values.password,
            user_name:    `${values.firstname} ${values.lastname}`,
            account_name: values.company,
            country_code: countryCode,
          });

          // Step 2: Auto-login with returned token
          const { token } = response.data;
          if (token) {
            // Use the token directly — same as what login does
            await login(values.email, values.password);
          }

          setStatus({ success: true });
          setSubmitting(false);
          // Redirect to billing so user can see plans and purchase
          window.location.href = '/billing';
        } catch (err: any) {
          const msg = err?.response?.data?.message || err.message || 'Registration failed';
          setStatus({ success: false });
          setErrors({ submit: msg });
          setSubmitting(false);
        }
      }}
    >
      {({ errors, handleBlur, handleChange, handleSubmit, isSubmitting, touched, values }) => (
        <form noValidate onSubmit={handleSubmit}>
          <Stack spacing={4}>

            <Box>
              <SectionLabel label="Your Details" />
              <Grid container spacing={2}>

                <Grid item xs={12} sm={6}>
                  <FieldWrapper>
                    <InputLabel htmlFor="firstname-signup">First Name *</InputLabel>
                    <OutlinedInput
                      id="firstname-signup" name="firstname" value={values.firstname}
                      onBlur={handleBlur} onChange={handleChange} placeholder="John" fullWidth
                      startAdornment={<InputAdornment position="start"><UserOutlined style={{ color: '#bfbfbf' }} /></InputAdornment>}
                      error={Boolean(touched.firstname && errors.firstname)}
                    />
                    {touched.firstname && errors.firstname && <FormHelperText error>{errors.firstname}</FormHelperText>}
                  </FieldWrapper>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FieldWrapper>
                    <InputLabel htmlFor="lastname-signup">Last Name *</InputLabel>
                    <OutlinedInput
                      id="lastname-signup" name="lastname" value={values.lastname}
                      onBlur={handleBlur} onChange={handleChange} placeholder="Doe" fullWidth
                      startAdornment={<InputAdornment position="start"><UserOutlined style={{ color: '#bfbfbf' }} /></InputAdornment>}
                      error={Boolean(touched.lastname && errors.lastname)}
                    />
                    {touched.lastname && errors.lastname && <FormHelperText error>{errors.lastname}</FormHelperText>}
                  </FieldWrapper>
                </Grid>

                <Grid item xs={12}>
                  <FieldWrapper>
                    <InputLabel htmlFor="company-signup">Business / Company Name *</InputLabel>
                    <OutlinedInput
                      id="company-signup" name="company" value={values.company}
                      onBlur={handleBlur} onChange={handleChange} placeholder="Acme Pvt. Ltd." fullWidth
                      startAdornment={<InputAdornment position="start"><ShopOutlined style={{ color: '#bfbfbf' }} /></InputAdornment>}
                      error={Boolean(touched.company && errors.company)}
                    />
                    {touched.company && errors.company && <FormHelperText error>{errors.company}</FormHelperText>}
                  </FieldWrapper>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FieldWrapper>
                    <InputLabel htmlFor="email-signup">Email Address *</InputLabel>
                    <OutlinedInput
                      id="email-signup" type="email" name="email" value={values.email}
                      onBlur={handleBlur} onChange={handleChange} placeholder="you@company.com" fullWidth
                      startAdornment={<InputAdornment position="start"><MailOutlined style={{ color: '#bfbfbf' }} /></InputAdornment>}
                      error={Boolean(touched.email && errors.email)}
                    />
                    {touched.email && errors.email && <FormHelperText error>{errors.email}</FormHelperText>}
                  </FieldWrapper>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FieldWrapper>
                    <InputLabel htmlFor="phone-signup">WhatsApp Number *</InputLabel>
                    <OutlinedInput
                      id="phone-signup" type="tel" name="phone" value={values.phone}
                      onBlur={handleBlur} onChange={handleChange} placeholder="+91 98765 43210" fullWidth
                      startAdornment={<InputAdornment position="start"><PhoneOutlined style={{ color: '#bfbfbf' }} /></InputAdornment>}
                      error={Boolean(touched.phone && errors.phone)}
                    />
                    {touched.phone && errors.phone && <FormHelperText error>{errors.phone}</FormHelperText>}
                  </FieldWrapper>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FieldWrapper>
                    <InputLabel htmlFor="country-signup">Country *</InputLabel>
                    <Select
                      id="country-signup" value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      fullWidth
                      startAdornment={<InputAdornment position="start"><GlobalOutlined style={{ color: '#bfbfbf' }} /></InputAdornment>}
                    >
                      {COUNTRIES.map((c) => (
                        <MenuItem key={c.code} value={c.code}>{c.name}</MenuItem>
                      ))}
                    </Select>
                    <Typography variant="caption" color="text.secondary">Used for billing currency &amp; tax</Typography>
                  </FieldWrapper>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FieldWrapper>
                    <InputLabel htmlFor="password-signup">Password *</InputLabel>
                    <OutlinedInput
                      id="password-signup" type={showPassword ? 'text' : 'password'}
                      name="password" value={values.password}
                      onBlur={handleBlur}
                      onChange={(e) => { handleChange(e); changePassword(e.target.value); }}
                      placeholder="Min. 6 characters" fullWidth
                      startAdornment={<InputAdornment position="start"><LockOutlined style={{ color: '#bfbfbf' }} /></InputAdornment>}
                      endAdornment={
                        <InputAdornment position="end">
                          <IconButton aria-label="toggle password" onClick={handleClickShowPassword} onMouseDown={handleMouseDownPassword} edge="end" color="secondary">
                            {showPassword ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                          </IconButton>
                        </InputAdornment>
                      }
                      error={Boolean(touched.password && errors.password)}
                    />
                    {touched.password && errors.password && <FormHelperText error>{errors.password}</FormHelperText>}
                    {values.password && (
                      <Stack direction="row" alignItems="center" gap={1} sx={{ mt: 0.5 }}>
                        <Box sx={{ bgcolor: level?.color, width: 60, height: 6, borderRadius: 3 }} />
                        <Typography variant="caption" color="text.secondary">{level?.label}</Typography>
                      </Stack>
                    )}
                  </FieldWrapper>
                </Grid>

              </Grid>
            </Box>

            {/* What happens next */}
            <Box
              sx={{
                p: 2, borderRadius: 2,
                bgcolor: 'primary.lighter',
                border: '1px solid', borderColor: 'primary.light',
              }}
            >
              <Typography variant="body2" color="primary.dark" fontWeight={600} sx={{ mb: 0.5 }}>
                What happens after sign up?
              </Typography>
              <Typography variant="body2" color="primary.dark">
                Your account is created instantly — no payment needed now. You can explore the dashboard, then activate a plan from <strong>Billing &amp; Plans</strong> when you're ready to start sending messages.
              </Typography>
            </Box>

            {errors.submit && (
              <Alert severity="error">{errors.submit}</Alert>
            )}

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
                  sx={{ py: 1.5, fontWeight: 700, fontSize: 16, borderRadius: 2 }}
                  startIcon={isSubmitting ? <CircularProgress size={18} color="inherit" /> : null}
                >
                  {isSubmitting ? 'Creating account…' : 'Create Free Account →'}
                </Button>
              </AnimateButton>
              <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', mt: 1 }}>
                No credit card required · Cancel anytime
              </Typography>
            </FormControl>

          </Stack>
        </form>
      )}
    </Formik>
  );
};

export default AuthRegister;
