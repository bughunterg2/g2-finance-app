import React from 'react';
import { Card as MuiCard, CardContent, CardHeader, CardActions } from '@mui/material';
import type { BaseComponentProps } from '@/types';

interface CardProps extends BaseComponentProps {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  variant?: 'elevation' | 'outlined';
  padding?: 'none' | 'small' | 'medium' | 'large';
}

const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  actions,
  variant = 'outlined',
  padding = 'medium',
  className,
  children,
  ...props
}) => {
  const getPaddingClass = () => {
    switch (padding) {
      case 'none':
        return 'p-0';
      case 'small':
        return 'p-2';
      case 'large':
        return 'p-6';
      default:
        return 'p-4';
    }
  };

  return (
    <MuiCard
      variant={variant}
      className={`${getPaddingClass()} ${className || ''}`}
      {...props}
    >
      {(title || subtitle) && (
        <CardHeader
          title={title}
          subheader={subtitle}
          titleTypographyProps={{ variant: 'h6', fontWeight: 600 }}
          subheaderTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
        />
      )}
      
      {children && (
        <CardContent className={padding === 'none' ? 'p-0' : undefined}>
          {children}
        </CardContent>
      )}
      
      {actions && (
        <CardActions className="px-4 pb-4">
          {actions}
        </CardActions>
      )}
    </MuiCard>
  );
};

export default Card;
