import React from 'react';
import { Card, CardContent, Box, Typography, Avatar } from '@mui/material';

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  subtitle?: string;
  color?: 'primary' | 'success' | 'warning' | 'error' | 'secondary';
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, subtitle, color = 'primary' }) => {
  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: subtitle ? 1 : 0 }}>
          {icon && (
            <Avatar sx={{ bgcolor: `${color}.main` }}>
              {icon}
            </Avatar>
          )}
          <Box>
            <Typography variant="h4" fontWeight="bold">
              {value}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {title}
            </Typography>
          </Box>
        </Box>
        {subtitle && (
          <Typography variant="caption" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default StatCard;


