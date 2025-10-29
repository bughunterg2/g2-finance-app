import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const UnauthorizedPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Box sx={{ minHeight: '70vh', display: 'grid', placeItems: 'center', textAlign: 'center', p: 3 }}>
      <Box>
        <Typography variant="h3" fontWeight="bold" gutterBottom>
          403
        </Typography>
        <Typography variant="h6" gutterBottom>
          You don't have permission to access this page
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Please contact your administrator if you believe this is a mistake.
        </Typography>
        <Button variant="contained" onClick={() => navigate(-1)}>Go Back</Button>
      </Box>
    </Box>
  );
};

export default UnauthorizedPage;


