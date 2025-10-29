import React, { useState } from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
  Typography,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Collapse,
  Badge,
  useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  Dashboard as DashboardIcon,
  Receipt as ReceiptIcon,
  Assessment as AssessmentIcon,
  AttachMoney as AttachMoneyIcon,
  Person as PersonIcon,
  Category as CategoryIcon,
  People as PeopleIcon,
  Settings as SettingsIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Logout as LogoutIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { useReimbursementStore } from '@/stores/reimbursementStore';
import logoImage from '@/assets/images/logo.png';

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  badge?: string | number;
  submenu?: MenuItem[];
}

const SIDEBAR_WIDTH = 280;
const SIDEBAR_WIDTH_COLLAPSED = 80;

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Derive dynamic counts
  const { reimbursements } = useReimbursementStore();
  const pendingAll = React.useMemo(
    () => reimbursements.filter(r => r.status === 'pending').length,
    [reimbursements]
  );
  // const pendingMine = React.useMemo(
  //   () => reimbursements.filter(r => r.status === 'pending' && r.agentId === user?.uid).length,
  //   [reimbursements, user?.uid]
  // );

  // Menu items based on user role
  const getMenuItems = (): MenuItem[] => {
    if (user?.role === 'admin') {
      return [
        {
          id: 'dashboard',
          label: 'Dashboard',
          icon: <DashboardIcon />,
          path: '/admin/dashboard',
        },
        {
          id: 'reimbursements',
          label: 'Reimbursements',
          icon: <ReceiptIcon />,
          path: '/admin/reimbursements',
          badge: pendingAll || undefined,
          submenu: [
            {
              id: 'reimbursements-blokm',
              label: 'Blok M',
              path: '/admin/reimbursements?site=blokm',
              icon: <ReceiptIcon />,
            },
            {
              id: 'reimbursements-pejaten',
              label: 'Pejaten',
              path: '/admin/reimbursements?site=pejaten',
              icon: <ReceiptIcon />,
            },
          ],
        },
        {
          id: 'categories',
          label: 'Categories',
          icon: <CategoryIcon />,
          path: '/admin/categories',
        },
        {
          id: 'income',
          label: 'Income',
          icon: <AttachMoneyIcon />,
          path: '/admin/income',
        },
        {
          id: 'users',
          label: 'Users',
          icon: <PeopleIcon />,
          path: '/admin/users',
        },
        {
          id: 'reports',
          label: 'Reports',
          icon: <AssessmentIcon />,
          path: '/admin/reports',
          submenu: [
            {
              id: 'income-report',
              label: 'Income Report',
              path: '/admin/reports/income',
              icon: <AssessmentIcon />,
            },
            {
              id: 'expense-report',
              label: 'Expense Report',
              path: '/admin/reports/expense',
              icon: <AssessmentIcon />,
            },
            {
              id: 'monthly-report',
              label: 'Monthly Report',
              path: '/admin/reports/monthly',
              icon: <AssessmentIcon />,
            },
            {
              id: 'yearly-report',
              label: 'Yearly Report',
              path: '/admin/reports/yearly',
              icon: <AssessmentIcon />,
            },
          ],
        },
        {
          id: 'settings',
          label: 'Settings',
          icon: <SettingsIcon />,
          path: '/admin/settings',
        },
        {
          id: 'profile',
          label: 'Profile',
          icon: <PersonIcon />,
          path: '/profile',
        },
      ];
    } else {
      return [
        {
          id: 'dashboard',
          label: 'Dashboard',
          icon: <DashboardIcon />,
          path: '/dashboard',
        },
        {
          id: 'reimbursements',
          label: 'Reimbursements',
          icon: <ReceiptIcon />,
          path: '/reimbursements',
        },
        {
          id: 'reports',
          label: 'My Reports',
          icon: <AssessmentIcon />,
          path: '/reports',
        },
        {
          id: 'settings',
          label: 'Settings',
          icon: <SettingsIcon />,
          path: '/settings',
        },
        {
          id: 'profile',
          label: 'Profile',
          icon: <PersonIcon />,
          path: '/profile',
        },
      ];
    }
  };

  const handleMenuClick = (path: string) => {
    navigate(path);
    if (isMobile) {
      toggleSidebar();
    }
  };

  const handleSubmenuToggle = (menuId: string) => {
    setExpandedMenus(prev => {
      const newSet = new Set(prev);
      if (newSet.has(menuId)) {
        newSet.delete(menuId);
      } else {
        newSet.add(menuId);
      }
      return newSet;
    });
  };

  const isMenuExpanded = (menuId: string) => expandedMenus.has(menuId);

  const getQueryParams = (path: string) => {
    const idx = path.indexOf('?');
    if (idx === -1) return new URLSearchParams();
    return new URLSearchParams(path.substring(idx + 1));
  };

  const isActivePath = (path: string) => {
    const [basePath] = path.split('?');
    return location.pathname === basePath || location.pathname.startsWith(basePath);
  };

  const isActivePathStrict = (path: string) => {
    const [basePath] = path.split('?');
    if (location.pathname !== basePath) return false;
    const expected = getQueryParams(path);
    if ([...expected.keys()].length === 0) return true;
    const current = new URLSearchParams(location.search);
    for (const key of expected.keys()) {
      if (current.get(key) !== expected.get(key)) return false;
    }
    return true;
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
    handleProfileMenuClose();
  };

  const menuItems = getMenuItems();

  return (
    <Drawer
      variant={isMobile ? 'temporary' : 'permanent'}
      open={isMobile ? !sidebarCollapsed : undefined}
      onClose={isMobile ? toggleSidebar : undefined}
      ModalProps={isMobile ? { keepMounted: true } : undefined}
      sx={{
        width: isMobile ? SIDEBAR_WIDTH : (sidebarCollapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH),
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: isMobile ? SIDEBAR_WIDTH : (sidebarCollapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH),
          boxSizing: 'border-box',
          transition: isMobile ? 'none' : 'width 0.3s ease',
          overflowX: 'hidden',
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: sidebarCollapsed ? 'center' : 'space-between',
          p: 2,
          minHeight: 64,
        }}
      >
        {!sidebarCollapsed ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              component="img"
              src={logoImage}
              alt="Finance App Logo"
              sx={{
                height: 32,
                width: 'auto',
                objectFit: 'contain',
              }}
            />
            <Typography variant="h6" fontWeight="bold" color="primary">
              Finance App
            </Typography>
          </Box>
        ) : (
          <Box
            component="img"
            src={logoImage}
            alt="Finance App Logo"
            sx={{
              height: 32,
              width: 32,
              objectFit: 'contain',
            }}
          />
        )}
        {!isMobile && (
          <IconButton onClick={toggleSidebar}>
            {sidebarCollapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
          </IconButton>
        )}
      </Box>

      <Divider />

      {/* Navigation Menu */}
      <List sx={{ flexGrow: 1 }}>
        {menuItems.map((item) => (
          <React.Fragment key={item.id}>
            <ListItem disablePadding>
              <ListItemButton
                onClick={() => item.submenu ? handleSubmenuToggle(item.id) : handleMenuClick(item.path)}
                selected={isActivePath(item.path)}
                aria-haspopup={item.submenu ? 'true' : undefined}
                aria-expanded={item.submenu ? isMenuExpanded(item.id) : undefined}
                aria-controls={item.submenu ? `${item.id}-submenu` : undefined}
                sx={{
                  minHeight: 48,
                  justifyContent: sidebarCollapsed ? 'center' : 'initial',
                  px: 2.5,
                  borderRadius: 1,
                  mx: 1,
                  mb: 0.5,
                  '&.Mui-selected': {
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    '&:hover': {
                      bgcolor: 'primary.dark',
                    },
                    '& .MuiListItemIcon-root': {
                      color: 'primary.contrastText',
                    },
                  },
                  '&:hover': {
                    bgcolor: 'action.hover',
                  },
                  transition: 'all 0.2s ease-in-out',
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: sidebarCollapsed ? 0 : 3,
                    justifyContent: 'center',
                    transition: 'color 0.2s ease-in-out',
                  }}
                >
                  {item.badge ? (
                    <Badge badgeContent={item.badge} color="error">
                      {item.icon}
                    </Badge>
                  ) : (
                    item.icon
                  )}
                </ListItemIcon>
                {!sidebarCollapsed && (
                  <>
                    <ListItemText
                      primary={item.label}
                      primaryTypographyProps={{
                        fontSize: '0.875rem',
                        fontWeight: 500,
                      }}
                    />
                    {item.submenu && (
                      <Box sx={{ ml: 1 }}>
                        {isMenuExpanded(item.id) ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      </Box>
                    )}
                  </>
                )}
              </ListItemButton>
            </ListItem>

            {/* Submenu */}
            {!sidebarCollapsed && item.submenu && (
              <Collapse in={isMenuExpanded(item.id)} timeout="auto" unmountOnExit>
                <List sx={{ pl: 2 }} id={`${item.id}-submenu`} role="group" aria-label={`${item.label} submenu`}>
                  {item.submenu.map((subItem) => (
                    <ListItem key={subItem.id} disablePadding>
                      <ListItemButton
                        onClick={() => handleMenuClick(subItem.path)}
                        selected={isActivePathStrict(subItem.path)}
                        aria-current={isActivePathStrict(subItem.path) ? 'page' : undefined}
                        sx={{ 
                          minHeight: 40, 
                          pl: 3,
                          borderRadius: 1,
                          mx: 1,
                          mb: 0.5,
                          '&.Mui-selected': {
                            bgcolor: 'primary.light',
                            color: 'primary.contrastText',
                            '&:hover': {
                              bgcolor: 'primary.main',
                            },
                          },
                          '&:hover': {
                            bgcolor: 'action.hover',
                          },
                          transition: 'all 0.2s ease-in-out',
                        }}
                      >
                        <ListItemText
                          primary={subItem.label}
                          primaryTypographyProps={{
                            fontSize: '0.8rem',
                            fontWeight: 400,
                          }}
                        />
                        {subItem.badge && (
                          <Badge 
                            badgeContent={subItem.badge} 
                            color="error"
                            sx={{ ml: 1 }}
                          />
                        )}
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              </Collapse>
            )}
          </React.Fragment>
        ))}
      </List>

      <Divider />

      {/* User Profile */}
      <Box sx={{ p: 2 }}>
        <ListItemButton
          onClick={handleProfileMenuOpen}
          sx={{
            borderRadius: 1,
            minHeight: 48,
            justifyContent: sidebarCollapsed ? 'center' : 'initial',
            '&:hover': {
              bgcolor: 'action.hover',
            },
            transition: 'all 0.2s ease-in-out',
          }}
        >
          <Avatar
            sx={{
              width: 32,
              height: 32,
              mr: sidebarCollapsed ? 0 : 2,
              bgcolor: 'primary.main',
            }}
          >
            {user?.name?.charAt(0).toUpperCase()}
          </Avatar>
          {!sidebarCollapsed && (
            <>
              <ListItemText
                primary={user?.name}
                secondary={user?.role}
                primaryTypographyProps={{
                  fontSize: '0.875rem',
                  fontWeight: 500,
                }}
                secondaryTypographyProps={{
                  fontSize: '0.75rem',
                }}
              />
              <ExpandMoreIcon fontSize="small" />
            </>
          )}
        </ListItemButton>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleProfileMenuClose}
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
        >
          <MenuItem onClick={() => navigate('/profile')}>
            <PersonIcon sx={{ mr: 1 }} />
            Profile
          </MenuItem>
          <MenuItem onClick={handleLogout}>
            <LogoutIcon sx={{ mr: 1 }} />
            Logout
          </MenuItem>
        </Menu>
      </Box>
    </Drawer>
  );
};

export default Sidebar;
