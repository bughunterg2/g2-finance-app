import React, { useEffect } from 'react';
import {
  Box,
  Card as MuiCard,
  CardContent,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
} from '@mui/material';
import {
  Receipt as ReceiptIcon,
  TrendingUp as TrendingUpIcon,
  Pending as PendingIcon,
  CheckCircle as CheckCircleIcon,
  Add as AddIcon,
  AttachMoney as MoneyIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useReimbursementStore } from '@/stores/reimbursementStore';
import { useAuthStore } from '@/stores/authStore';
import PageHeader from '@/components/layout/PageHeader';
import Badge from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

import { formatCurrency } from '@/utils/format';

const AgentDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { 
    reimbursements, 
    isLoading, 
    fetchReimbursements 
  } = useReimbursementStore();

  useEffect(() => {
    fetchReimbursements();
  }, [fetchReimbursements]);

  // Calculate dashboard stats
  const myReimbursements = React.useMemo(() => {
    return reimbursements.filter(r => r.agentId === user?.uid);
  }, [reimbursements, user?.uid]);

  const stats = React.useMemo(() => {
    const totalReimbursements = myReimbursements.length;
    const pendingCount = myReimbursements.filter(r => r.status === 'pending').length;
    const approvedCount = myReimbursements.filter(r => r.status === 'approved' || r.status === 'paid').length;
    const totalAmount = myReimbursements
      .filter(r => r.status === 'approved' || r.status === 'paid')
      .reduce((sum, r) => sum + r.amount, 0);

    return {
      totalReimbursements,
      pendingCount,
      approvedCount,
      totalAmount,
    };
  }, [myReimbursements]);

  // Get recent reimbursements
  const recentReimbursements = myReimbursements
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const handleNewReimbursement = () => {
    navigate('/reimbursements/new');
  };

  const handleViewReimbursement = (id: string) => {
    navigate(`/reimbursements/${id}`);
  };

  if (isLoading) {
    return <LoadingSpinner size="large" />;
  }

  return (
    <Box>
      <PageHeader
        title={`Welcome back, ${user?.name}!`}
        subtitle="Here's an overview of your reimbursements"
        actions={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleNewReimbursement}
          >
            New Reimbursement
          </Button>
        }
      />

      {/* Stats Cards */}
      <Box sx={{
        mb: 4,
        display: 'grid',
        gap: 3,
        gridTemplateColumns: {
          xs: '1fr',
          sm: '1fr 1fr',
          md: 'repeat(4, 1fr)',
        },
      }}>
        <MuiCard>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                <ReceiptIcon />
              </Avatar>
              <Box>
                <Typography variant="h4" fontWeight="bold">
                  {stats.totalReimbursements}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Reimbursements
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </MuiCard>
        <MuiCard>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Avatar sx={{ bgcolor: 'warning.main', mr: 2 }}>
                <PendingIcon />
              </Avatar>
              <Box>
                <Typography variant="h4" fontWeight="bold">
                  {stats.pendingCount}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Pending Approval
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </MuiCard>
        <MuiCard>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
                <CheckCircleIcon />
              </Avatar>
              <Box>
                <Typography variant="h4" fontWeight="bold">
                  {stats.approvedCount}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Approved
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </MuiCard>
        <MuiCard>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Avatar sx={{ bgcolor: 'info.main', mr: 2 }}>
                <MoneyIcon />
              </Avatar>
              <Box>
                <Typography variant="h4" fontWeight="bold">
                  {formatCurrency(stats.totalAmount)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Approved
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </MuiCard>
      </Box>

      <Box sx={{
        display: 'grid',
        gap: 3,
        gridTemplateColumns: {
          xs: '1fr',
          md: '2fr 1fr',
        },
      }}>
        {/* Recent Reimbursements */}
        <MuiCard>
          <CardContent>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Recent Reimbursements
            </Typography>
            {recentReimbursements.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="text.secondary" gutterBottom>
                No reimbursements yet
              </Typography>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={handleNewReimbursement}
              >
                Create your first reimbursement
              </Button>
            </Box>
          ) : (
            <List>
              {recentReimbursements.map((reimbursement) => (
                <ListItem
                  key={reimbursement.id}
                  component="div"
                  onClick={() => handleViewReimbursement(reimbursement.id)}
                  sx={{
                    borderRadius: 1,
                    mb: 1,
                    cursor: 'pointer',
                    '&:hover': {
                      bgcolor: 'action.hover',
                    },
                  }}
                >
                  <ListItemIcon>
                    <ReceiptIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary={reimbursement.title}
                    secondary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                        <Typography variant="body2" color="text.secondary">
                          {new Intl.NumberFormat('id-ID', {
                            style: 'currency',
                            currency: 'IDR',
                            minimumFractionDigits: 0,
                          }).format(reimbursement.amount)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          •
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {new Date(reimbursement.createdAt).toLocaleDateString()}
                        </Typography>
                      </Box>
                    }
                  />
                  <Badge status={reimbursement.status} />
                </ListItem>
              ))}
            </List>
            )}
          </CardContent>
        </MuiCard>

        {/* Sidebar widgets */}
        <Box>
          <MuiCard>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Quick Actions
              </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Button
                variant="contained"
                fullWidth
                startIcon={<AddIcon />}
                onClick={handleNewReimbursement}
              >
                New Reimbursement
              </Button>
              
              <Button
                variant="outlined"
                fullWidth
                startIcon={<ReceiptIcon />}
                onClick={() => navigate('/reimbursements')}
              >
                View All Reimbursements
              </Button>
              
              <Button
                variant="outlined"
                fullWidth
                startIcon={<TrendingUpIcon />}
                onClick={() => navigate('/reports')}
              >
                View Reports
              </Button>
            </Box>
            </CardContent>
          </MuiCard>

          <MuiCard sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                This Month
              </Typography>
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h5" fontWeight="bold" color="primary" gutterBottom>
                {new Intl.NumberFormat('id-ID', {
                  style: 'currency',
                  currency: 'IDR',
                  minimumFractionDigits: 0,
                }).format(stats.totalAmount)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total approved this month
              </Typography>
            </Box>
            </CardContent>
          </MuiCard>
        </Box>
      </Box>
    </Box>
  );
};

export default AgentDashboardPage;
