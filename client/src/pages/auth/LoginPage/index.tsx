import React, { useState } from 'react';
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
  const { login, isLoading, error, clearError } = useAuthStore();
  const { theme, toggleTheme } = useUIStore();
  const [showPassword, setShowPassword] = useState(false);

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

  const onSubmit = async (data: any) => {
    try {
      clearError();
      await login(data as LoginData);
      toast.success('Login successful!', { duration: 3000 });
      
      // Navigate based on user role (handled in auth store)
      const user = useAuthStore.getState().user;
      if (user) {
        const redirectPath = user.role === 'admin' ? '/admin/dashboard' : '/dashboard';
        navigate(redirectPath);
        // ensure any lingering toasts are cleared after route change
        setTimeout(() => toast.dismiss(), 0);
      }
    } catch (err) {
      toast.error('Login failed. Please try again.');
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
              type={showPassword ? 'text' : 'password'}
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
