import React from 'react';
import { AppBar, Toolbar, Typography, IconButton, Box, Badge as MuiBadge, Menu, MenuItem, ListItemText } from '@mui/material';
import { Menu as MenuIcon, Notifications as NotificationsIcon, DarkMode as DarkModeIcon, LightMode as LightModeIcon } from '@mui/icons-material';
import { useUIStore } from '@/stores/uiStore';
import logoImage from '@/assets/images/logo.png';

interface HeaderProps {
  title?: string;
  onMenuClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ title, onMenuClick }) => {
  const { toggleSidebar, theme, toggleTheme, notifications, clearNotifications } = useUIStore();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  

  const handleMenuClick = () => {
    if (onMenuClick) {
      onMenuClick();
    } else {
      toggleSidebar();
    }
  };

  const openNotif = (e: React.MouseEvent<HTMLElement>) => setAnchorEl(e.currentTarget);
  const closeNotif = () => setAnchorEl(null);
  const handleClear = () => { clearNotifications(); closeNotif(); };

  return (
    <AppBar
      position="fixed"
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        bgcolor: 'background.paper',
        color: 'text.primary',
        boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Toolbar>
        <IconButton
          color="inherit"
          aria-label="open drawer"
          onClick={handleMenuClick}
          edge="start"
          sx={{ mr: 2 }}
        >
          <MenuIcon />
        </IconButton>
        
        <Box
          component="img"
          src={logoImage}
          alt="Finance App Logo"
          sx={{
            height: 28,
            width: 'auto',
            objectFit: 'contain',
            mr: 1.5,
            display: { xs: 'none', sm: 'block' },
          }}
        />
        
        {title && (
          <Typography variant="h6" component="div" sx={{ mr: 2 }}>
            {title}
          </Typography>
        )}

        {/* Spacer to push actions to the right */}
        <Box sx={{ flexGrow: 1 }} />
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton color="inherit" onClick={toggleTheme} aria-label="toggle theme">
            {theme === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
          </IconButton>
          <IconButton color="inherit" onClick={openNotif} aria-label="notifications">
            <MuiBadge color="error" badgeContent={notifications.length} overlap="circular">
              <NotificationsIcon />
            </MuiBadge>
          </IconButton>
        </Box>
      </Toolbar>

      {/* Notifications Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={closeNotif} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} transformOrigin={{ vertical: 'top', horizontal: 'right' }}>
        {notifications.length === 0 ? (
          <MenuItem disabled>
            <ListItemText primary="No notifications" secondary="You're all caught up" />
          </MenuItem>
        ) : (
          notifications.slice(-8).reverse().map(n => (
            <MenuItem key={n.id}>
              <ListItemText primary={n.title} secondary={n.message} />
            </MenuItem>
          ))
        )}
        {notifications.length > 0 && (
          <MenuItem onClick={handleClear} sx={{ justifyContent: 'center', color: 'primary.main' }}>
            Clear all
          </MenuItem>
        )}
      </Menu>
    </AppBar>
  );
};

export default Header;
