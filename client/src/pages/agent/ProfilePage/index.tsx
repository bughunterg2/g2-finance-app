import React from 'react';
import { Box, Typography, Card as MuiCard, CardContent, TextField, Button, Avatar, Chip, Switch, FormControlLabel, FormControl, InputLabel, Select, MenuItem, Alert } from '@mui/material';
import { Email, LockReset } from '@mui/icons-material';
// import { useNavigate } from 'react-router-dom';
import PageHeader from '@/components/layout/PageHeader';
import { useAuthStore } from '@/stores/authStore';
import toast from 'react-hot-toast';

const AgentProfilePage: React.FC = () => {
  // const navigate = useNavigate();
  const { user, updateProfile, sendPasswordResetEmail, isLoading } = useAuthStore();

  const [form, setForm] = React.useState({
    name: user?.name || '',
    email: user?.email || '',
    division: user?.division || '',
    phone: user?.phoneNumber || '0812-3456-7890',
    notificationsEmail: true,
    notificationsPush: true,
  });

  const [isSendingResetEmail, setIsSendingResetEmail] = React.useState(false);
  const [resetEmailSent, setResetEmailSent] = React.useState(false);

  const handleChange = (key: string, value: any) => setForm(prev => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    try {
      await updateProfile({ name: form.name, division: form.division, phoneNumber: form.phone });
      toast.success('Profile updated successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
    }
  };

  const handleSendPasswordReset = async () => {
    if (!user?.email) {
      toast.error('Email not found');
      return;
    }

    setIsSendingResetEmail(true);
    try {
      await sendPasswordResetEmail(user.email);
      toast.success('Password reset email sent! Please check your inbox.');
      setResetEmailSent(true);
      // Reset after 5 seconds
      setTimeout(() => {
        setResetEmailSent(false);
      }, 5000);
    } catch (error: any) {
      toast.error(error.message || 'Failed to send password reset email');
    } finally {
      setIsSendingResetEmail(false);
    }
  };

  return (
    <Box>
      <PageHeader title="Profile" subtitle="Manage your profile information" />

      <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: '1fr 2fr' } }}>
        <Box>
          <MuiCard>
            <CardContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                <Avatar sx={{ width: 80, height: 80, bgcolor: 'primary.main' }}>
                  {(user?.name || 'U').charAt(0).toUpperCase()}
                </Avatar>
                <Typography variant="h6" fontWeight="bold">{user?.name || 'User'}</Typography>
                <Typography variant="body2" color="text.secondary">{user?.email}</Typography>
                <Chip size="small" label={user?.role?.toUpperCase()} color={user?.role === 'admin' ? 'primary' : 'default'} />
                <Typography variant="body2" color="text.secondary">Division: {user?.division || '-'}</Typography>
                {user?.phoneNumber && (
                  <Typography variant="caption" color="text.secondary">Phone: {user.phoneNumber}</Typography>
                )}
                <Typography variant="caption" color="text.secondary">Joined: {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}</Typography>
              </Box>
            </CardContent>
          </MuiCard>
        </Box>
        <Box>
          <MuiCard sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>Account Details</Typography>
              <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
                <TextField fullWidth label="Full Name" value={form.name} onChange={(e) => handleChange('name', e.target.value)} />
                <TextField fullWidth label="Email" value={form.email} disabled />
                <FormControl fullWidth>
                  <InputLabel id="division-label">Division</InputLabel>
                  <Select
                    labelId="division-label"
                    label="Division"
                    value={form.division}
                    onChange={(e) => handleChange('division', e.target.value)}
                  >
                    <MenuItem value="Blok M">Blok M</MenuItem>
                    <MenuItem value="Pejaten">Pejaten</MenuItem>
                    <MenuItem value="Poin">Poin</MenuItem>
                  </Select>
                </FormControl>
                <TextField fullWidth label="Phone" value={form.phone} onChange={(e) => handleChange('phone', e.target.value)} />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                <Button variant="contained" onClick={handleSave}>Save Changes</Button>
              </Box>
            </CardContent>
          </MuiCard>

          <MuiCard sx={{ mt: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <LockReset color="primary" />
                <Typography variant="h6" fontWeight="bold">Security</Typography>
              </Box>
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Reset your password by sending a reset link to your email address.
              </Typography>

              {resetEmailSent && (
                <Alert severity="success" sx={{ mb: 3 }}>
                  Password reset email has been sent to <strong>{user?.email}</strong>. Please check your inbox and follow the instructions to reset your password.
                </Alert>
              )}

              <Box
                sx={{
                  p: 2,
                  bgcolor: 'background.default',
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  mb: 3,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      bgcolor: 'primary.main',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                    }}
                  >
                    <Email />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Email Address
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {user?.email}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <Button
                  variant="outlined"
                  onClick={handleSendPasswordReset}
                  disabled={isSendingResetEmail || isLoading || resetEmailSent}
                  startIcon={<Email />}
                >
                  {isSendingResetEmail || isLoading ? 'Sending...' : resetEmailSent ? 'Email Sent' : 'Send Reset Link'}
                </Button>
              </Box>

              <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                Note: The password reset link will expire after a certain period. If you don't receive the email, please check your spam folder or try again.
              </Typography>
            </CardContent>
          </MuiCard>

          <MuiCard sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>Preferences</Typography>
              <FormControlLabel control={<Switch checked={form.notificationsEmail} onChange={(e) => handleChange('notificationsEmail', e.target.checked)} />} label="Email Notifications" />
              <FormControlLabel control={<Switch checked={form.notificationsPush} onChange={(e) => handleChange('notificationsPush', e.target.checked)} />} label="Push Notifications" />
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                <Button variant="outlined" onClick={() => toast.success('Preferences saved (dummy)')}>Save Preferences</Button>
              </Box>
            </CardContent>
          </MuiCard>
        </Box>
      </Box>
    </Box>
  );
};

export default AgentProfilePage;
