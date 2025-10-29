import React from 'react';
import { Box, Typography, Card as MuiCard, CardContent, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import PageHeader from '@/components/layout/PageHeader';
import { useAuthStore } from '@/stores/authStore';
import { useReimbursementStore } from '@/stores/reimbursementStore';
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

const AgentReportsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { reimbursements } = useReimbursementStore();

  const [range, setRange] = React.useState<'3m'|'6m'|'12m'>('3m');
  const monthsBack = range === '3m' ? 3 : range === '6m' ? 6 : 12;
  const startDate = React.useMemo(() => new Date(new Date().setMonth(new Date().getMonth() - (monthsBack - 1))), [monthsBack]);

  const mine = React.useMemo(() => {
    if (!user) return [] as typeof reimbursements;
    return reimbursements.filter(r => r.agentId === user.uid).filter(r => new Date(r.createdAt) >= startDate);
  }, [reimbursements, user, startDate]);

  const labels = React.useMemo(() => Array.from({ length: monthsBack }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (monthsBack - 1 - i));
    return d.toLocaleString('id-ID', { month: 'short' });
  }), [monthsBack]);

  const spendingSeries = React.useMemo(() => {
    return labels.map((_, idx) => {
      const m = (new Date().getMonth() - (monthsBack - 1 - idx) + 12) % 12;
      return mine
        .filter(r => new Date(r.createdAt).getMonth() === m && (r.status === 'approved' || r.status === 'paid'))
        .reduce((sum, r) => sum + r.amount, 0);
    });
  }, [labels, monthsBack, mine]);

  const lineData = {
    labels,
    datasets: [{ label: 'My Spending', data: spendingSeries, borderColor: '#22c55e', backgroundColor: 'rgba(34,197,94,0.2)', fill: true, tension: 0.3 }],
  };

  const statusCounts = ['pending','approved','rejected','paid'].map(s => mine.filter(r => r.status === (s as any)).length);
  const doughnutData = { labels: ['Pending','Approved','Rejected','Paid'], datasets: [{ data: statusCounts, backgroundColor: ['#f59e0b','#22c55e','#ef4444','#3b82f6'], borderWidth: 0 }] };

  return (
    <Box>
      <PageHeader title="My Reports" subtitle="Your personal reimbursement analytics" />

      <MuiCard sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <FormControl size="small">
              <InputLabel id="range-label">Range</InputLabel>
              <Select labelId="range-label" value={range} label="Range" onChange={(e) => setRange(e.target.value as any)}>
                <MenuItem value="3m">Last 3 months</MenuItem>
                <MenuItem value="6m">Last 6 months</MenuItem>
                <MenuItem value="12m">Last 12 months</MenuItem>
              </Select>
            </FormControl>
            <Box sx={{ flexGrow: 1 }} />
            <Typography variant="body2" color="text.secondary">Total records: {mine.length}</Typography>
          </Box>
        </CardContent>
      </MuiCard>

      <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' } }}>
        <MuiCard>
          <CardContent>
            <Typography variant="h6" fontWeight="bold" gutterBottom>My Spending Over Time</Typography>
            <Line data={lineData} />
          </CardContent>
        </MuiCard>
        <MuiCard>
          <CardContent>
            <Typography variant="h6" fontWeight="bold" gutterBottom>Status Breakdown</Typography>
            <Doughnut data={doughnutData} />
          </CardContent>
        </MuiCard>
      </Box>
    </Box>
  );
};

export default AgentReportsPage;
