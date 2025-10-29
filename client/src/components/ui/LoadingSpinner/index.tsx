import React from 'react';
import { CircularProgress, Box } from '@mui/material';
import type { LoadingProps } from '@/types';

const LoadingSpinner: React.FC<LoadingProps> = ({
  size = 'medium',
  color = 'primary',
  className,
}) => {
  const getSize = () => {
    switch (size) {
      case 'small':
        return 20;
      case 'large':
        return 60;
      default:
        return 40;
    }
  };

  return (
    <Box
      className={`flex items-center justify-center ${className || ''}`}
    >
      <CircularProgress
        size={getSize()}
        color={color as any}
      />
    </Box>
  );
};

export default LoadingSpinner;
