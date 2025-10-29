import React from 'react';
import { Box } from '@mui/material';
import { ThemeProvider, CssBaseline } from '@mui/material';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { useUIStore } from '@/stores/uiStore';
import { lightTheme, darkTheme } from '@/styles/theme';

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
  showHeader?: boolean;
}

const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  title,
  showHeader = true,
}) => {
  const { theme } = useUIStore();
  const currentTheme = theme === 'dark' ? darkTheme : lightTheme;

  return (
    <ThemeProvider theme={currentTheme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', minHeight: '100vh' }}>
        {/* Sidebar */}
        <a
          href="#main-content"
          style={{
            position: 'absolute',
            left: -9999,
            top: 0,
            background: '#111',
            color: '#fff',
            padding: '8px 12px',
            borderRadius: 6,
            zIndex: 2000,
          }}
          onFocus={(e) => {
            e.currentTarget.style.left = '12px';
          }}
          onBlur={(e) => {
            e.currentTarget.style.left = '-9999px';
          }}
        >
          Skip to content
        </a>
        <Sidebar />
        
        {/* Main Content */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            minHeight: '100vh',
            bgcolor: 'background.default',
          }}
        >
          {/* Header */}
          {showHeader && <Header title={title} />}
          
          {/* Page Content */}
          <Box
            sx={{
              flexGrow: 1,
              p: 3,
              mt: showHeader ? 8 : 0, // Account for fixed header
              bgcolor: 'background.default',
            }}
            id="main-content"
            tabIndex={-1}
          >
            {children}
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default AppLayout;
