import React from 'react';
import { Box, Skeleton } from '@mui/material';

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 8 }) => {
  return (
    <Box>
      <Skeleton variant="rectangular" height={40} sx={{ mb: 1, borderRadius: 1 }} />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} variant="rectangular" height={56} sx={{ mb: 1, borderRadius: 1 }} />
      ))}
    </Box>
  );
};

export const CardsSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => {
  return (
    <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(3, 1fr)' } }}>
      {Array.from({ length: count }).map((_, i) => (
        <Box key={i}>
          <Skeleton variant="rectangular" height={140} sx={{ borderRadius: 2 }} />
        </Box>
      ))}
    </Box>
  );
};

export default TableSkeleton;


