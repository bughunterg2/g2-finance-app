import React from 'react';
import { Chip } from '@mui/material';
import type { ReimbursementStatus } from '@/types';

interface BadgeProps {
  status: ReimbursementStatus | string;
  size?: 'small' | 'medium';
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({ status, size = 'small', className }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'default';
      case 'pending':
        return 'warning';
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      case 'paid':
        return 'info';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'draft':
        return 'Draft';
      case 'pending':
        return 'Pending';
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      case 'paid':
        return 'Paid';
      default:
        return status;
    }
  };

  return (
    <Chip
      label={getStatusLabel(status)}
      color={getStatusColor(status) as any}
      size={size}
      className={className}
    />
  );
};

export default Badge;
