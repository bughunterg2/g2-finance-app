import React from 'react';
import { Box, Typography, Button } from '@mui/material';

interface EmptyStateProps {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ title, description, actionLabel, onAction }) => {
  return (
    <Box sx={{ textAlign: 'center', py: 6 }}>
      <Typography variant="h6" fontWeight="bold" gutterBottom>
        {title}
      </Typography>
      {description && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: actionLabel ? 2 : 0 }}>
          {description}
        </Typography>
      )}
      {actionLabel && (
        <Button variant="contained" size="small" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </Box>
  );
};

export default EmptyState;


