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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Divider,
  Link,
} from '@mui/material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import type { RegisterData } from '@/types';
import toast from 'react-hot-toast';

const registerSchema = yup.object({
  email: yup
    .string()
    .email('Please enter a valid email address')
    .required('Email is required'),
  password: yup
    .string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], 'Passwords must match')
    .required('Please confirm your password'),
  name: yup
    .string()
    .min(2, 'Name must be at least 2 characters')
    .required('Name is required'),
  role: yup
    .string()
    .oneOf(['admin', 'agent'], 'Please select a valid role')
    .required('Role is required'),
  department: yup
    .string()
    .min(2, 'Department must be at least 2 characters')
    .required('Department is required'),
});

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register: registerUser, isLoading, error, clearError } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<RegisterData & { confirmPassword: string }>({
    resolver: yupResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      name: '',
      role: 'agent',
      department: '',
    },
  });

  const onSubmit = async (data: RegisterData & { confirmPassword: string }) => {
    try {
      clearError();
      const { confirmPassword, ...registerData } = data;
      await registerUser(registerData);
      toast.success('Registration successful!');
      
      // Navigate based on user role
      const user = useAuthStore.getState().user;
      if (user) {
        const redirectPath = user.role === 'admin' ? '/admin/dashboard' : '/dashboard';
        navigate(redirectPath);
      }
    } catch (err) {
      toast.error('Registration failed. Please try again.');
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        p: 2,
      }}
    >
      <Card sx={{ maxWidth: 500, width: '100%' }}>
        <CardContent sx={{ p: 4 }}>
          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
              Create Account
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Sign up to get started with the finance app
            </Typography>
          </Box>

          {/* Error Alert */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={clearError}>
              {error}
            </Alert>
          )}

          {/* Register Form */}
          <Box component="form" onSubmit={handleSubmit(onSubmit)}>
            <TextField
              {...register('name')}
              fullWidth
              label="Full Name"
              error={!!errors.name}
              helperText={errors.name?.message}
              sx={{ mb: 2 }}
              autoComplete="name"
              autoFocus
            />

            <TextField
              {...register('email')}
              fullWidth
              label="Email Address"
              type="email"
              error={!!errors.email}
              helperText={errors.email?.message}
              sx={{ mb: 2 }}
              autoComplete="email"
            />

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Role</InputLabel>
              <Select
                {...register('role')}
                label="Role"
                error={!!errors.role}
              >
                <MenuItem value="agent">Agent</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
              </Select>
              {errors.role && (
                <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                  {errors.role.message}
                </Typography>
              )}
            </FormControl>

            <TextField
              {...register('department')}
              fullWidth
              label="Department"
              error={!!errors.department}
              helperText={errors.department?.message}
              sx={{ mb: 2 }}
              autoComplete="organization"
            />

            <TextField
              {...register('password')}
              fullWidth
              label="Password"
              type={showPassword ? 'text' : 'password'}
              error={!!errors.password}
              helperText={errors.password?.message}
              sx={{ mb: 2 }}
              autoComplete="new-password"
            />

            <TextField
              {...register('confirmPassword')}
              fullWidth
              label="Confirm Password"
              type={showConfirmPassword ? 'text' : 'password'}
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword?.message}
              sx={{ mb: 3 }}
              autoComplete="new-password"
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={isLoading}
              sx={{ mb: 3 }}
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </Box>

          <Divider sx={{ my: 3 }}>
            <Typography variant="body2" color="text.secondary">
              OR
            </Typography>
          </Divider>

          {/* Login Link */}
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Already have an account?{' '}
              <Link
                component={RouterLink}
                to="/login"
                sx={{ textDecoration: 'none', fontWeight: 500 }}
              >
                Sign in here
              </Link>
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default RegisterPage;
