import { createTheme, type ThemeOptions } from '@mui/material/styles';

// Enhanced color palette with better contrast and accessibility
const lightColors = {
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },
  secondary: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
  },
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },
  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },
  info: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
  },
};

// Dark theme colors with proper contrast ratios
const darkColors = {
  primary: {
    50: '#0c1a3a',
    100: '#1e3a8a',
    200: '#1e40af',
    300: '#1d4ed8',
    400: '#2563eb',
    500: '#3b82f6',
    600: '#60a5fa',
    700: '#93c5fd',
    800: '#bfdbfe',
    900: '#dbeafe',
  },
  secondary: {
    50: '#0f172a',
    100: '#1e293b',
    200: '#334155',
    300: '#475569',
    400: '#64748b',
    500: '#94a3b8',
    600: '#cbd5e1',
    700: '#e2e8f0',
    800: '#f1f5f9',
    900: '#f8fafc',
  },
  success: {
    50: '#14532d',
    100: '#166534',
    200: '#15803d',
    300: '#16a34a',
    400: '#22c55e',
    500: '#4ade80',
    600: '#86efac',
    700: '#bbf7d0',
    800: '#dcfce7',
    900: '#f0fdf4',
  },
  warning: {
    50: '#78350f',
    100: '#92400e',
    200: '#b45309',
    300: '#d97706',
    400: '#f59e0b',
    500: '#fbbf24',
    600: '#fcd34d',
    700: '#fde68a',
    800: '#fef3c7',
    900: '#fffbeb',
  },
  error: {
    50: '#7f1d1d',
    100: '#991b1b',
    200: '#b91c1c',
    300: '#dc2626',
    400: '#ef4444',
    500: '#f87171',
    600: '#fca5a5',
    700: '#fecaca',
    800: '#fee2e2',
    900: '#fef2f2',
  },
  info: {
    50: '#0c4a6e',
    100: '#075985',
    200: '#0369a1',
    300: '#0284c7',
    400: '#0ea5e9',
    500: '#38bdf8',
    600: '#7dd3fc',
    700: '#bae6fd',
    800: '#e0f2fe',
    900: '#f0f9ff',
  },
};

const createAppTheme = (mode: 'light' | 'dark'): ThemeOptions => {
  const colors = mode === 'light' ? lightColors : darkColors;
  
  return {
    palette: {
      mode,
      primary: {
        main: colors.primary[500],
        light: colors.primary[400],
        dark: colors.primary[600],
        contrastText: mode === 'light' ? '#ffffff' : '#000000',
      },
      secondary: {
        main: colors.secondary[500],
        light: colors.secondary[400],
        dark: colors.secondary[600],
        contrastText: mode === 'light' ? '#ffffff' : '#000000',
      },
      success: {
        main: colors.success[500],
        light: colors.success[400],
        dark: colors.success[600],
        contrastText: mode === 'light' ? '#ffffff' : '#000000',
      },
      warning: {
        main: colors.warning[500],
        light: colors.warning[400],
        dark: colors.warning[600],
        contrastText: mode === 'light' ? '#ffffff' : '#000000',
      },
      error: {
        main: colors.error[500],
        light: colors.error[400],
        dark: colors.error[600],
        contrastText: mode === 'light' ? '#ffffff' : '#000000',
      },
      info: {
        main: colors.info[500],
        light: colors.info[400],
        dark: colors.info[600],
        contrastText: mode === 'light' ? '#ffffff' : '#000000',
      },
      background: {
        default: mode === 'light' ? '#fafafa' : '#0a0a0a',
        paper: mode === 'light' ? '#ffffff' : '#1a1a1a',
      },
      text: {
        primary: mode === 'light' ? '#0f172a' : '#f8fafc',
        secondary: mode === 'light' ? '#475569' : '#cbd5e1',
      },
      divider: mode === 'light' ? '#e2e8f0' : '#374151',
      action: {
        hover: mode === 'light' ? 'rgba(15, 23, 42, 0.04)' : 'rgba(248, 250, 252, 0.08)',
        selected: mode === 'light' ? 'rgba(59, 130, 246, 0.08)' : 'rgba(59, 130, 246, 0.16)',
        disabled: mode === 'light' ? 'rgba(15, 23, 42, 0.26)' : 'rgba(248, 250, 252, 0.3)',
      },
    },
    typography: {
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', sans-serif",
      h1: {
        fontSize: '2.5rem',
        fontWeight: 700,
        lineHeight: 1.2,
        letterSpacing: '-0.025em',
      },
      h2: {
        fontSize: '2rem',
        fontWeight: 600,
        lineHeight: 1.25,
        letterSpacing: '-0.025em',
      },
      h3: {
        fontSize: '1.5rem',
        fontWeight: 600,
        lineHeight: 1.3,
        letterSpacing: '-0.025em',
      },
      h4: {
        fontSize: '1.25rem',
        fontWeight: 600,
        lineHeight: 1.35,
      },
      h5: {
        fontSize: '1.125rem',
        fontWeight: 600,
        lineHeight: 1.4,
      },
      h6: {
        fontSize: '1rem',
        fontWeight: 600,
        lineHeight: 1.5,
      },
      body1: {
        fontSize: '1rem',
        lineHeight: 1.6,
        fontWeight: 400,
      },
      body2: {
        fontSize: '0.875rem',
        lineHeight: 1.6,
        fontWeight: 400,
      },
      button: {
        fontSize: '0.875rem',
        fontWeight: 500,
        textTransform: 'none',
        letterSpacing: '0.025em',
      },
      caption: {
        fontSize: '0.75rem',
        lineHeight: 1.5,
        fontWeight: 400,
      },
      overline: {
        fontSize: '0.75rem',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        lineHeight: 1.5,
      },
    },
    shape: {
      borderRadius: 12,
    },
    spacing: 8,
    shadows: [
      'none',
      '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
      '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
      '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
      '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
      '0 25px 50px -12px rgb(0 0 0 / 0.25)',
      '0 25px 50px -12px rgb(0 0 0 / 0.25)',
      '0 25px 50px -12px rgb(0 0 0 / 0.25)',
      '0 25px 50px -12px rgb(0 0 0 / 0.25)',
      '0 25px 50px -12px rgb(0 0 0 / 0.25)',
      '0 25px 50px -12px rgb(0 0 0 / 0.25)',
      '0 25px 50px -12px rgb(0 0 0 / 0.25)',
      '0 25px 50px -12px rgb(0 0 0 / 0.25)',
      '0 25px 50px -12px rgb(0 0 0 / 0.25)',
      '0 25px 50px -12px rgb(0 0 0 / 0.25)',
      '0 25px 50px -12px rgb(0 0 0 / 0.25)',
      '0 25px 50px -12px rgb(0 0 0 / 0.25)',
      '0 25px 50px -12px rgb(0 0 0 / 0.25)',
      '0 25px 50px -12px rgb(0 0 0 / 0.25)',
      '0 25px 50px -12px rgb(0 0 0 / 0.25)',
      '0 25px 50px -12px rgb(0 0 0 / 0.25)',
      '0 25px 50px -12px rgb(0 0 0 / 0.25)',
      '0 25px 50px -12px rgb(0 0 0 / 0.25)',
      '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    ],
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            textTransform: 'none',
            fontWeight: 500,
            padding: '10px 20px',
            fontSize: '0.875rem',
            letterSpacing: '0.025em',
            transition: 'all 0.2s ease-in-out',
            '&:focus-visible': {
              outline: `2px solid ${colors.primary[500]}`,
              outlineOffset: '2px',
            },
          },
          contained: {
            boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
            '&:hover': {
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
              transform: 'translateY(-1px)',
            },
            '&:active': {
              transform: 'translateY(0)',
            },
          },
          outlined: {
            borderWidth: '1.5px',
            '&:hover': {
              borderWidth: '1.5px',
              transform: 'translateY(-1px)',
            },
          },
          text: {
            '&:hover': {
              backgroundColor: mode === 'light' ? 'rgba(59, 130, 246, 0.04)' : 'rgba(59, 130, 246, 0.08)',
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
            border: `1px solid ${mode === 'light' ? '#e2e8f0' : '#374151'}`,
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
              transform: 'translateY(-2px)',
            },
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 12,
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: colors.primary[400],
                },
              },
              '&.Mui-focused': {
                '& .MuiOutlinedInput-notchedOutline': {
                  borderWidth: '2px',
                },
              },
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            fontWeight: 500,
            fontSize: '0.75rem',
            height: 28,
          },
          filled: {
            boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            borderRight: `1px solid ${mode === 'light' ? '#e2e8f0' : '#374151'}`,
            boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
            borderBottom: `1px solid ${mode === 'light' ? '#e2e8f0' : '#374151'}`,
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            margin: '2px 8px',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              backgroundColor: mode === 'light' ? 'rgba(59, 130, 246, 0.08)' : 'rgba(59, 130, 246, 0.16)',
            },
            '&.Mui-selected': {
              backgroundColor: mode === 'light' ? 'rgba(59, 130, 246, 0.12)' : 'rgba(59, 130, 246, 0.24)',
              '&:hover': {
                backgroundColor: mode === 'light' ? 'rgba(59, 130, 246, 0.16)' : 'rgba(59, 130, 246, 0.32)',
              },
            },
          },
        },
      },
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            scrollbarColor: `${mode === 'light' ? '#94a3b8' : '#64748b'} ${mode === 'light' ? '#f1f5f9' : '#1e293b'}`,
            '&::-webkit-scrollbar, & *::-webkit-scrollbar': {
              backgroundColor: 'transparent',
              width: 8,
              height: 8,
            },
            '&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb': {
              borderRadius: 4,
              backgroundColor: mode === 'light' ? '#94a3b8' : '#64748b',
            },
            '&::-webkit-scrollbar-thumb:hover, & *::-webkit-scrollbar-thumb:hover': {
              backgroundColor: mode === 'light' ? '#64748b' : '#475569',
            },
            '&::-webkit-scrollbar-track, & *::-webkit-scrollbar-track': {
              backgroundColor: 'transparent',
            },
          },
        },
      },
    },
  };
};

export const lightTheme = createTheme(createAppTheme('light'));
export const darkTheme = createTheme(createAppTheme('dark'));

export default createAppTheme;
