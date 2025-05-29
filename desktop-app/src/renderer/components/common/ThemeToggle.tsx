import React from 'react';
import {
  IconButton,
  Tooltip,
  Box,
  Typography,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Brightness4,
  Brightness7,
  DarkMode,
  LightMode
} from '@mui/icons-material';
import { useThemeContext } from '../../contexts/ThemeContext';

interface ThemeToggleProps {
  variant?: 'icon' | 'switch';
  showLabel?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ 
  variant = 'icon', 
  showLabel = false,
  size = 'medium'
}) => {
  const { mode, toggleTheme } = useThemeContext();

  if (variant === 'switch') {
    return (
      <FormControlLabel
        control={
          <Switch
            checked={mode === 'dark'}
            onChange={toggleTheme}
            color="primary"
            size={size === 'large' ? 'medium' : 'small'}
          />
        }
        label={
          <Box display="flex" alignItems="center" gap={1}>
            {mode === 'dark' ? <DarkMode fontSize="small" /> : <LightMode fontSize="small" />}
            {showLabel && (
              <Typography variant="body2">
                {mode === 'dark' ? '다크 모드' : '라이트 모드'}
              </Typography>
            )}
          </Box>
        }
      />
    );
  }

  return (
    <Tooltip 
      title={mode === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'}
      arrow
    >
      <IconButton
        onClick={toggleTheme}
        color="inherit"
        size={size}
        sx={{
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'rotate(180deg)',
          },
        }}
      >
        {mode === 'dark' ? (
          <Brightness7 />
        ) : (
          <Brightness4 />
        )}
      </IconButton>
    </Tooltip>
  );
};