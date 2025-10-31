import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  FormControlLabel,
  Checkbox,
  Link,
  Alert,
  Divider,
  IconButton,
} from '@mui/material';
import { DarkMode as DarkModeIcon, LightMode as LightModeIcon } from '@mui/icons-material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import type { LoginData } from '@/types';
import toast from 'react-hot-toast';
import logoImage from '@/assets/images/logo.png';

const loginSchema = yup.object({
  email: yup
    .string()
    .email('Please enter a valid email address')
    .required('Email is required'),
  password: yup
    .string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
  rememberMe: yup.boolean().optional(),
});

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, isLoading, error, clearError, user, isAuthenticated } = useAuthStore();
  const { theme, toggleTheme } = useUIStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  // Navigate when user becomes authenticated
  useEffect(() => {
    if (isAuthenticated && user && !isLoading) {
      const redirectPath = user.role === 'admin' ? '/admin/dashboard' : '/dashboard';
      // Navigate immediately when authenticated
      navigate(redirectPath, { replace: true });
    }
  }, [isAuthenticated, user, isLoading, navigate]);

  const onSubmit = async (data: any) => {
    try {
      clearError();
      await login(data as LoginData);
      // Success toast
      toast.success('Login successful!');
      // Navigation will happen via useEffect when auth state updates
    } catch (err: any) {
      // Error is already handled in authStore and displayed in Alert component
      // Also show toast for better visibility
      const errorMessage = err?.message || 'Login failed. Please try again.';
      toast.error(errorMessage);
      console.error('Login error:', err);
    }
  };

  const handleForgotPassword = () => {
    // TODO: Implement forgot password functionality
    toast('Forgot password functionality coming soon!', { icon: 'ℹ️' });
  };

  return (
    <Box
      sx={{
        minHeight: '100dvh',
        width: '100vw',
        display: 'grid',
        placeItems: 'center',
        p: { xs: 2, md: 4 },
        background: theme === 'dark'
          ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
          : 'linear-gradient(135deg, #eff6ff 0%, #ffffff 100%)',
      }}
    >
      <Card sx={{ maxWidth: 440, width: '100%', borderRadius: 3, boxShadow: 4 }}>
        <CardContent sx={{ p: { xs: 3, md: 5 } }}>
          {/* Logo */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
            <Box
              component="img"
              src={logoImage}
              alt="Finance App Logo"
              sx={{
                height: 64,
                width: 'auto',
                objectFit: 'contain',
              }}
            />
          </Box>

          {/* Header with theme toggle */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box>
              <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
                Welcome Back
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Sign in to your account to continue
              </Typography>
            </Box>
            <IconButton onClick={toggleTheme} aria-label="toggle theme" color="inherit">
              {theme === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>
          </Box>

          {/* Error Alert */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={clearError}>
              {error}
            </Alert>
          )}

          {/* Login Form */}
          <Box component="form" onSubmit={handleSubmit(onSubmit)}>
            <TextField
              {...register('email')}
              fullWidth
              label="Email Address"
              type="email"
              error={!!errors.email}
              helperText={errors.email?.message}
              sx={{ mb: 2 }}
              autoComplete="email"
              autoFocus
            />

            <TextField
              {...register('password')}
              fullWidth
              label="Password"
              type="password"
              error={!!errors.password}
              helperText={errors.password?.message}
              sx={{ mb: 2 }}
              autoComplete="current-password"
            />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <FormControlLabel
                control={<Checkbox {...register('rememberMe')} />}
                label="Remember me"
              />
              <Link
                component="button"
                type="button"
                onClick={handleForgotPassword}
                sx={{ textDecoration: 'none', fontSize: '0.875rem' }}
              >
                Forgot password?
              </Link>
            </Box>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={isLoading}
              sx={{ mb: 3 }}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </Box>

          <Divider sx={{ my: 3 }}>
            <Typography variant="body2" color="text.secondary">
              OR
            </Typography>
          </Divider>

          {/* Register Link */}
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Don't have an account?{' '}
              <Link
                component={RouterLink}
                to="/register"
                sx={{ textDecoration: 'none', fontWeight: 500 }}
              >
                Sign up here
              </Link>
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default LoginPage;
