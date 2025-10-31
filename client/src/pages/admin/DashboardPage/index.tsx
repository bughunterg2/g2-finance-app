import React, { useEffect } from 'react';
import {
  Box,
  Card as MuiCard,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  Receipt as ReceiptIcon,
  Pending as PendingIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { useReimbursementStore } from '@/stores/reimbursementStore';
import { useAuthStore } from '@/stores/authStore';
import PageHeader from '@/components/layout/PageHeader';
import Badge from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import StatCard from '@/components/ui/StatCard';
import EmptyState from '@/components/ui/EmptyState';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Tooltip, Legend);

import { formatCurrency, formatDate } from '@/utils/format';

const AdminDashboardPage: React.FC = () => {
  
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
  const stats = React.useMemo(() => {
    const totalReimbursements = reimbursements.length;
    const pendingCount = reimbursements.filter(r => r.status === 'pending').length;
    const approvedCount = reimbursements.filter(r => r.status === 'approved').length;
    const rejectedCount = reimbursements.filter(r => r.status === 'rejected').length;
    const totalAmount = reimbursements
      .filter(r => r.status === 'approved')
      .reduce((sum, r) => sum + r.amount, 0);
    const pendingAmount = reimbursements
      .filter(r => r.status === 'pending')
      .reduce((sum, r) => sum + r.amount, 0);

    return {
      totalReimbursements,
      pendingCount,
      approvedCount,
      rejectedCount,
      totalAmount,
      pendingAmount,
    };
  }, [reimbursements]);

  // Get recent reimbursements requiring attention
  const pendingReimbursements = reimbursements
    .filter(r => r.status === 'pending')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  

  if (isLoading) {
    return <LoadingSpinner size="large" />;
  }

  // Charts data (derived from reimbursements)
  const chartLabels = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    return d.toLocaleString('id-ID', { month: 'short' });
  });

  const monthlyTotals = chartLabels.map((_, idx) => {
    const monthIndex = (new Date().getMonth() - (5 - idx) + 12) % 12;
    return reimbursements
      .filter(r => new Date(r.createdAt).getMonth() === monthIndex && (r.status === 'approved' || r.status === 'paid'))
      .reduce((sum, r) => sum + r.amount, 0);
  });

  const lineData = {
    labels: chartLabels,
    datasets: [
      {
        label: 'Approved/Paid Amount',
        data: monthlyTotals,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        tension: 0.3,
        fill: true,
      },
    ],
  };

  const statusCounts = ['pending', 'approved', 'rejected', 'paid'].map(s =>
    reimbursements.filter(r => r.status === (s as any)).length
  );

  const doughnutData = {
    labels: ['Pending', 'Approved', 'Rejected', 'Paid'],
    datasets: [
      {
        label: 'Count',
        data: statusCounts,
        backgroundColor: ['#f59e0b', '#22c55e', '#ef4444', '#3b82f6'],
        borderWidth: 0,
      },
    ],
  };

  return (
    <Box>
      <PageHeader
        title={`Welcome back, ${user?.name}!`}
        subtitle="Here's an overview of the reimbursement system"
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
        <StatCard title="Total Reimbursements" value={stats.totalReimbursements} icon={<ReceiptIcon />} color="primary" />
        <StatCard title="Pending Approval" value={stats.pendingCount} icon={<PendingIcon />} color="warning" />
        <StatCard title="Approved" value={stats.approvedCount} icon={<CheckCircleIcon />} color="success" />
        <StatCard title="Rejected" value={stats.rejectedCount} icon={<CancelIcon />} color="error" />
      </Box>

      {/* Financial Overview */}
      <Box sx={{
        mb: 4,
        display: 'grid',
        gap: 3,
        gridTemplateColumns: {
          xs: '1fr',
          md: '2fr 1fr',
        },
      }}>
        <MuiCard>
          <CardContent>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Spending Over Time
            </Typography>
            <Line data={lineData} />
          </CardContent>
        </MuiCard>
        <MuiCard>
          <CardContent>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Status Breakdown
            </Typography>
            {reimbursements.length === 0 ? (
              <EmptyState title="No data" description="No reimbursements available." />
            ) : (
              <Doughnut data={doughnutData} />
            )}
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
        {/* Pending Approvals */}
        <MuiCard>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6" fontWeight="bold">Pending Approvals</Typography>
              
            </Box>
          {pendingReimbursements.length === 0 ? (
            <EmptyState title="No pending approvals" description="All reimbursements have been processed" />
          ) : (
            <List>
              {pendingReimbursements.map((reimbursement) => (
                <ListItem
                  key={reimbursement.id}
                  component="div"
                  
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
                    <ReceiptIcon color="warning" />
                  </ListItemIcon>
                  <ListItemText
                    primary={reimbursement.title}
                    secondary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                        <Typography variant="body2" color="text.secondary">
                          {formatCurrency(reimbursement.amount)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          •
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {formatDate(reimbursement.createdAt)}
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

        {/* System Status */}
        <MuiCard>
          <CardContent>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              System Status
            </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" fontWeight="bold" color="success.main" gutterBottom>
                {stats.approvedCount}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Approved this month
              </Typography>
            </Box>

            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" fontWeight="bold" color="warning.main" gutterBottom>
                {stats.pendingCount}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Awaiting approval
              </Typography>
            </Box>

            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" fontWeight="bold" color="error.main" gutterBottom>
                {stats.rejectedCount}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Rejected this month
              </Typography>
            </Box>
          </Box>
          </CardContent>
        </MuiCard>
      </Box>
    </Box>
  );
};

export default AdminDashboardPage;
