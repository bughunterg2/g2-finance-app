import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  Tabs,
  Tab,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Switch,
  TextField,
  Button,
  Divider,
  Alert,
} from '@mui/material';
import {
  Palette as PaletteIcon,
  Notifications as NotificationsIcon,
  Security as SecurityIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { useUIStore } from '@/stores/uiStore';
import { useSettingsStore } from '@/stores/settingsStore';
import toast from 'react-hot-toast';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const AdminSettingsPage: React.FC = () => {
  const { setTheme, notifications, clearNotifications } = useUIStore();
  const { settings: savedSettings, setSettings: saveSettings, resetDefaults } = useSettingsStore();
  const [tabValue, setTabValue] = useState(0);
  const [settings, setSettings] = useState(savedSettings);

  React.useEffect(() => {
    setSettings(savedSettings);
  }, [savedSettings]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleNestedSettingChange = (parentKey: string, childKey: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [parentKey]: {
        ...(prev as any)[parentKey],
        [childKey]: value,
      } as any,
    }));
  };

  const handleSaveSettings = () => {
    saveSettings(settings);
    // Apply theme immediately
    const selectedTheme = settings.theme === 'auto'
      ? (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : settings.theme;
    setTheme(selectedTheme as any);
    toast.success('Settings saved successfully!');
  };

  const handleReset = () => {
    resetDefaults();
    toast.success('Settings reset to defaults');
  };

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Settings
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Configure your application preferences and system settings
      </Typography>

      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="settings tabs">
            <Tab 
              icon={<PaletteIcon />} 
              label="Appearance" 
              iconPosition="start"
              sx={{ minHeight: 48 }}
            />
            <Tab 
              icon={<NotificationsIcon />} 
              label="Notifications" 
              iconPosition="start"
              sx={{ minHeight: 48 }}
            />
            <Tab 
              icon={<SecurityIcon />} 
              label="Security" 
              iconPosition="start"
              sx={{ minHeight: 48 }}
            />
            
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
            <FormControl component="fieldset">
              <FormLabel component="legend">Theme</FormLabel>
              <RadioGroup
                value={settings.theme}
                onChange={(e) => handleSettingChange('theme', e.target.value)}
              >
                <FormControlLabel value="light" control={<Radio />} label="Light" />
                <FormControlLabel value="dark" control={<Radio />} label="Dark" />
                <FormControlLabel value="auto" control={<Radio />} label="Auto (System)" />
              </RadioGroup>
            </FormControl>
            <Box>
              <Typography variant="h6" gutterBottom>
                Preview
              </Typography>
              <Box
                sx={{
                  p: 2,
                  borderRadius: 1,
                  bgcolor: settings.theme === 'dark' ? 'grey.900' : 'grey.100',
                  color: settings.theme === 'dark' ? 'white' : 'black',
                }}
              >
                <Typography variant="body2">
                  This is how your interface will look with the selected theme.
                </Typography>
              </Box>
            </Box>
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Box>
            <Typography variant="h6" gutterBottom>
              Notification Preferences
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.notifications.email}
                    onChange={(e) => handleNestedSettingChange('notifications', 'email', e.target.checked)}
                  />
                }
                label="Email Notifications"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.notifications.push}
                    onChange={(e) => handleNestedSettingChange('notifications', 'push', e.target.checked)}
                  />
                }
                label="Push Notifications"
              />
            </Box>
            
            <Divider sx={{ my: 3 }} />
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="h6" gutterBottom>
                  Current Notifications
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  You have {notifications.length} unread notifications
                </Typography>
              </Box>
              <Button 
                variant="outlined" 
                onClick={clearNotifications}
                disabled={notifications.length === 0}
              >
                Clear All
              </Button>
            </Box>
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
            <Box>
              <Typography variant="h6" gutterBottom>
                Security Settings
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.twoFactor}
                      onChange={(e) => handleSettingChange('twoFactor', e.target.checked)}
                    />
                  }
                  label="Two-Factor Authentication"
                />
                <TextField
                  label="Auto Logout (minutes)"
                  type="number"
                  value={settings.autoLogout}
                  onChange={(e) => handleSettingChange('autoLogout', parseInt(e.target.value))}
                  inputProps={{ min: 5, max: 480 }}
                  helperText="Automatically log out after inactivity"
                />
              </Box>
            </Box>
            <Box>
              <Alert severity="info">
                <Typography variant="body2">
                  Security settings help protect your account and data. 
                  Enable two-factor authentication for enhanced security.
                </Typography>
              </Alert>
            </Box>
          </Box>
        </TabPanel>

        

        <Divider />
        
        <Box sx={{ p: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button variant="outlined" onClick={handleReset}>
            Reset to Defaults
          </Button>
          <Button 
            variant="contained" 
            startIcon={<SaveIcon />}
            onClick={handleSaveSettings}
          >
            Save Settings
          </Button>
        </Box>
      </Card>
    </Box>
  );
};

export default AdminSettingsPage;
