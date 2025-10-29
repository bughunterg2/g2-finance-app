import React, { useEffect } from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { Toaster } from 'react-hot-toast';
import { useUIStore } from '@/stores/uiStore';
import { lightTheme, darkTheme } from '@/styles/theme';

const AppThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { theme } = useUIStore();
  const currentTheme = theme === 'dark' ? darkTheme : lightTheme;

  useEffect(() => {
    // Ensure data-theme attribute reflects the current theme on initial mount
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <ThemeProvider theme={currentTheme}>
      <CssBaseline />
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: theme === 'dark' ? '#1e293b' : '#ffffff',
            color: theme === 'dark' ? '#f8fafc' : '#0f172a',
            border: `1px solid ${theme === 'dark' ? '#334155' : '#e2e8f0'}`,
          },
        }}
      />
    </ThemeProvider>
  );
};

export default AppThemeProvider;


