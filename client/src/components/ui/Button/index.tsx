import React from 'react';
import { Button as MuiButton, CircularProgress } from '@mui/material';
import type { ButtonProps } from '@/types';

const Button: React.FC<ButtonProps> = ({
  variant = 'contained',
  color = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  onClick,
  type = 'button',
  className,
  children,
  ...props
}) => {
  const handleClick = () => {
    if (!disabled && !loading && onClick) {
      onClick();
    }
  };

  return (
    <MuiButton
      variant={variant}
      color={color}
      size={size}
      disabled={disabled || loading}
      onClick={handleClick}
      type={type}
      className={className}
      startIcon={loading ? <CircularProgress size={16} color="inherit" /> : undefined}
      {...props}
    >
      {loading ? 'Loading...' : children}
    </MuiButton>
  );
};

export default Button;
