import React from 'react';
import { Box, Typography, Card as MuiCard, CardContent, TextField, Button, Avatar, Chip, Switch, FormControlLabel, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
// import { useNavigate } from 'react-router-dom';
import PageHeader from '@/components/layout/PageHeader';
import { useAuthStore } from '@/stores/authStore';
import toast from 'react-hot-toast';

const AgentProfilePage: React.FC = () => {
  // const navigate = useNavigate();
  const { user, updateProfile } = useAuthStore();

  const [form, setForm] = React.useState({
    name: user?.name || '',
    email: user?.email || '',
    division: user?.division || '',
    phone: user?.phoneNumber || '0812-3456-7890',
    notificationsEmail: true,
    notificationsPush: true,
  });

  const [passwords, setPasswords] = React.useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleChange = (key: string, value: any) => setForm(prev => ({ ...prev, [key]: value }));
  const handlePasswordChange = (key: string, value: string) => setPasswords(prev => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    await updateProfile({ name: form.name, division: form.division, phoneNumber: form.phone });
    toast.success('Profile updated (dummy)');
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
              <Typography variant="h6" fontWeight="bold" gutterBottom>Security</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Change your password</Typography>
              <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
                <TextField
                  fullWidth
                  type="password"
                  label="Current Password"
                  value={passwords.currentPassword}
                  onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                />
                <Box />
                <TextField
                  fullWidth
                  type="password"
                  label="New Password"
                  value={passwords.newPassword}
                  onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                  helperText="Minimum 6 characters"
                />
                <TextField
                  fullWidth
                  type="password"
                  label="Confirm New Password"
                  value={passwords.confirmPassword}
                  onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                <Button
                  variant="contained"
                  onClick={() => {
                    if (!passwords.currentPassword || !passwords.newPassword || !passwords.confirmPassword) {
                      toast.error('Please complete all password fields');
                      return;
                    }
                    if (passwords.newPassword.length < 6) {
                      toast.error('New password must be at least 6 characters');
                      return;
                    }
                    if (passwords.newPassword !== passwords.confirmPassword) {
                      toast.error('New password and confirmation do not match');
                      return;
                    }
                    // Dummy success
                    toast.success('Password updated (dummy)');
                    setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
                  }}
                >
                  Update Password
                </Button>
              </Box>
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
