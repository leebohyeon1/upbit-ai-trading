import React from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  Avatar
} from '@mui/material';

interface StatCardProps {
  icon: React.ReactElement;
  title: string;
  value: string | number;
  subtitle?: string;
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info' | 'grey';
}

export const StatCard: React.FC<StatCardProps> = ({
  icon,
  title,
  value,
  subtitle,
  color = 'primary'
}) => {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box display="flex" alignItems="flex-start" gap={2}>
          <Avatar sx={{ bgcolor: `${color}.main`, flexShrink: 0 }}>
            {icon}
          </Avatar>
          <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
            <Typography 
              variant="body2" 
              color="text.secondary"
              gutterBottom
            >
              {title}
            </Typography>
            <Typography 
              variant="h6" 
              fontWeight="bold"
              sx={{ 
                fontSize: '1.25rem',
                lineHeight: 1.2,
                wordBreak: 'break-word'
              }}
            >
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};