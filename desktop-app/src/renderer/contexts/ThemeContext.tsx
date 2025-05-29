import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createTheme, ThemeProvider, Theme } from '@mui/material/styles';
import { PaletteMode } from '@mui/material';

interface ThemeContextType {
  mode: PaletteMode;
  toggleTheme: () => void;
  theme: Theme;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useThemeContext = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeContext must be used within a ThemeContextProvider');
  }
  return context;
};

interface ThemeContextProviderProps {
  children: ReactNode;
}

export const ThemeContextProvider: React.FC<ThemeContextProviderProps> = ({ children }) => {
  const [mode, setMode] = useState<PaletteMode>(() => {
    // 로컬 스토리지에서 테마 모드 로드
    const savedMode = localStorage.getItem('theme-mode');
    return (savedMode as PaletteMode) || 'light';
  });

  // 테마 생성
  const theme = createTheme({
    palette: {
      mode,
      primary: {
        main: mode === 'light' ? '#1976d2' : '#90caf9',
        dark: mode === 'light' ? '#1565c0' : '#42a5f5',
        light: mode === 'light' ? '#42a5f5' : '#e3f2fd',
      },
      secondary: {
        main: mode === 'light' ? '#dc004e' : '#f48fb1',
        dark: mode === 'light' ? '#c51162' : '#e91e63',
        light: mode === 'light' ? '#ff5983' : '#fce4ec',
      },
      background: {
        default: mode === 'light' ? '#f5f5f5' : '#121212',
        paper: mode === 'light' ? '#ffffff' : '#1e1e1e',
      },
      text: {
        primary: mode === 'light' ? '#000000' : '#ffffff',
        secondary: mode === 'light' ? '#666666' : '#b3b3b3',
      },
      divider: mode === 'light' ? '#e0e0e0' : '#424242',
      action: {
        hover: mode === 'light' ? '#f5f5f5' : '#2a2a2a',
        selected: mode === 'light' ? '#e3f2fd' : '#1a2027',
      },
      success: {
        main: mode === 'light' ? '#2e7d32' : '#4caf50',
        light: mode === 'light' ? '#4caf50' : '#81c784',
        dark: mode === 'light' ? '#1b5e20' : '#388e3c',
      },
      error: {
        main: mode === 'light' ? '#d32f2f' : '#f44336',
        light: mode === 'light' ? '#f44336' : '#e57373',
        dark: mode === 'light' ? '#c62828' : '#d32f2f',
      },
      warning: {
        main: mode === 'light' ? '#ed6c02' : '#ff9800',
        light: mode === 'light' ? '#ff9800' : '#ffb74d',
        dark: mode === 'light' ? '#e65100' : '#f57c00',
      },
      info: {
        main: mode === 'light' ? '#0288d1' : '#29b6f6',
        light: mode === 'light' ? '#03a9f4' : '#4fc3f7',
        dark: mode === 'light' ? '#01579b' : '#0277bd',
      },
    },
    typography: {
      fontFamily: '"Pretendard", "Roboto", "Helvetica", "Arial", sans-serif',
      h1: {
        color: mode === 'light' ? '#000000' : '#ffffff',
      },
      h2: {
        color: mode === 'light' ? '#000000' : '#ffffff',
      },
      h3: {
        color: mode === 'light' ? '#000000' : '#ffffff',
      },
      h4: {
        color: mode === 'light' ? '#000000' : '#ffffff',
      },
      h5: {
        color: mode === 'light' ? '#000000' : '#ffffff',
      },
      h6: {
        color: mode === 'light' ? '#000000' : '#ffffff',
      },
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            borderRadius: 8,
            boxShadow: mode === 'light' ? '0 2px 4px rgba(0,0,0,0.1)' : '0 2px 4px rgba(255,255,255,0.1)',
            '&:hover': {
              boxShadow: mode === 'light' ? '0 4px 8px rgba(0,0,0,0.15)' : '0 4px 8px rgba(255,255,255,0.15)',
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            boxShadow: mode === 'light' 
              ? '0 2px 8px rgba(0,0,0,0.08)' 
              : '0 2px 8px rgba(255,255,255,0.05)',
            border: mode === 'dark' ? '1px solid #333333' : 'none',
            backgroundColor: mode === 'light' ? '#ffffff' : '#1e1e1e',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundColor: mode === 'light' ? '#ffffff' : '#1e1e1e',
            color: mode === 'light' ? '#000000' : '#ffffff',
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: mode === 'light' ? '#1976d2' : '#2c2c2c',
            color: '#ffffff',
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundColor: mode === 'light' ? '#ffffff' : '#1a1a1a',
            color: mode === 'light' ? '#000000' : '#ffffff',
            borderRight: mode === 'dark' ? '1px solid #333333' : '1px solid #e0e0e0',
          },
        },
      },
      MuiListItem: {
        styleOverrides: {
          root: {
            '&:hover': {
              backgroundColor: mode === 'light' ? '#f5f5f5' : '#2a2a2a',
            },
            '&.Mui-selected': {
              backgroundColor: mode === 'light' ? '#e3f2fd' : '#1a2027',
              '&:hover': {
                backgroundColor: mode === 'light' ? '#bbdefb' : '#2a3441',
              },
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            backgroundColor: mode === 'light' ? '#e0e0e0' : '#424242',
            color: mode === 'light' ? '#000000' : '#ffffff',
          },
          colorPrimary: {
            backgroundColor: mode === 'light' ? '#1976d2' : '#90caf9',
            color: mode === 'light' ? '#ffffff' : '#000000',
          },
          colorSecondary: {
            backgroundColor: mode === 'light' ? '#dc004e' : '#f48fb1',
            color: '#ffffff',
          },
          colorSuccess: {
            backgroundColor: mode === 'light' ? '#2e7d32' : '#4caf50',
            color: '#ffffff',
          },
          colorError: {
            backgroundColor: mode === 'light' ? '#d32f2f' : '#f44336',
            color: '#ffffff',
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderBottom: mode === 'light' ? '1px solid #e0e0e0' : '1px solid #424242',
            color: mode === 'light' ? '#000000' : '#ffffff',
          },
          head: {
            backgroundColor: mode === 'light' ? '#f5f5f5' : '#2a2a2a',
            fontWeight: 'bold',
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              backgroundColor: mode === 'light' ? '#ffffff' : '#2a2a2a',
              '& fieldset': {
                borderColor: mode === 'light' ? '#e0e0e0' : '#555555',
              },
              '&:hover fieldset': {
                borderColor: mode === 'light' ? '#1976d2' : '#90caf9',
              },
              '&.Mui-focused fieldset': {
                borderColor: mode === 'light' ? '#1976d2' : '#90caf9',
              },
            },
            '& .MuiInputLabel-root': {
              color: mode === 'light' ? '#666666' : '#b3b3b3',
            },
            '& .MuiOutlinedInput-input': {
              color: mode === 'light' ? '#000000' : '#ffffff',
            },
          },
        },
      },
      MuiAccordion: {
        styleOverrides: {
          root: {
            backgroundColor: mode === 'light' ? '#ffffff' : '#1e1e1e',
            '&:before': {
              backgroundColor: mode === 'light' ? '#e0e0e0' : '#424242',
            },
          },
        },
      },
      MuiAlert: {
        styleOverrides: {
          root: {
            '&.MuiAlert-standardInfo': {
              backgroundColor: mode === 'light' ? '#e3f2fd' : '#1a2027',
              color: mode === 'light' ? '#01579b' : '#90caf9',
            },
            '&.MuiAlert-standardWarning': {
              backgroundColor: mode === 'light' ? '#fff3e0' : '#2e1a00',
              color: mode === 'light' ? '#e65100' : '#ffb74d',
            },
            '&.MuiAlert-standardError': {
              backgroundColor: mode === 'light' ? '#ffebee' : '#2d1b1b',
              color: mode === 'light' ? '#c62828' : '#e57373',
            },
            '&.MuiAlert-standardSuccess': {
              backgroundColor: mode === 'light' ? '#e8f5e8' : '#1b2e1b',
              color: mode === 'light' ? '#2e7d32' : '#81c784',
            },
          },
        },
      },
    },
  });

  const toggleTheme = () => {
    const newMode = mode === 'light' ? 'dark' : 'light';
    setMode(newMode);
    localStorage.setItem('theme-mode', newMode);
  };

  useEffect(() => {
    // 시스템 테마 변경 감지
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      const savedMode = localStorage.getItem('theme-mode');
      if (!savedMode) {
        // 저장된 테마가 없으면 시스템 테마 따르기
        setMode(e.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme, theme }}>
      <ThemeProvider theme={theme}>
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
};