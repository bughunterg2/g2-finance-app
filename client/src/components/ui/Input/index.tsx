import React from 'react';
import { TextField } from '@mui/material';
import type { InputProps } from '@/types';

const Input: React.FC<InputProps> = ({
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  disabled = false,
  required = false,
  label,
  className,
  ...props
}) => {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (onChange) {
      onChange(event.target.value);
    }
  };

  return (
    <TextField
      type={type}
      label={label}
      placeholder={placeholder}
      value={value || ''}
      onChange={handleChange}
      error={!!error}
      helperText={error}
      disabled={disabled}
      required={required}
      className={className}
      fullWidth
      variant="outlined"
      {...props}
    />
  );
};

export default Input;
