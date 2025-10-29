import React from 'react';
import { Box, Typography, Button, Card as MuiCard, CardContent, MenuItem, FormControl, InputLabel, Select } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import PageHeader from '@/components/layout/PageHeader';
import { useReimbursementStore } from '@/stores/reimbursementStore';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend);

const AdminReportsPage: React.FC = () => {
  const navigate = useNavigate();
  const { reimbursements } = useReimbursementStore();

  const [range, setRange] = React.useState<'3m'|'6m'|'12m'>('6m');
  const [groupBy, setGroupBy] = React.useState<'month'|'week'>('month');
  const [status, setStatus] = React.useState<'all'|'pending'|'approved'|'rejected'|'paid'>('all');

  const monthsBack = range === '3m' ? 3 : range === '6m' ? 6 : 12;
  const startDate = React.useMemo(() => new Date(new Date().setMonth(new Date().getMonth() - (monthsBack - 1))), [monthsBack]);

  const dataInRange = React.useMemo(() => {
    return reimbursements.filter(r => new Date(r.createdAt) >= startDate).filter(r => status === 'all' ? true : r.status === status);
  }, [reimbursements, startDate, status]);

  const labels = React.useMemo(() => {
    if (groupBy === 'month') {
      return Array.from({ length: monthsBack }, (_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - (monthsBack - 1 - i));
        return d.toLocaleString('id-ID', { month: 'short' });
      });
    }
    // week grouping: last N weeks (approx monthsBack*4)
    return Array.from({ length: monthsBack * 4 }, (_, i) => `W${i+1}`);
  }, [groupBy, monthsBack]);

  const series = React.useMemo(() => {
    if (groupBy === 'month') {
      const sums = labels.map((_, idx) => {
        const m = (new Date().getMonth() - (monthsBack - 1 - idx) + 12) % 12;
        return dataInRange
          .filter(r => new Date(r.createdAt).getMonth() === m && (r.status === 'approved' || r.status === 'paid'))
          .reduce((sum, r) => sum + r.amount, 0);
      });
      return sums;
    }
    // naive weekly buckets over the period
    const weeks = monthsBack * 4;
    const now = new Date();
    const buckets = Array.from({ length: weeks }, () => 0);
    dataInRange.forEach(r => {
      const diffDays = Math.floor((now.getTime() - new Date(r.createdAt).getTime()) / 86400000);
      const weekIndex = Math.min(weeks - 1, Math.floor(diffDays / 7));
      if (r.status === 'approved' || r.status === 'paid') buckets[weeks - 1 - weekIndex] += r.amount;
    });
    return buckets;
  }, [groupBy, labels, monthsBack, dataInRange]);

  const lineData = {
    labels,
    datasets: [{ label: 'Spending', data: series, borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.2)', fill: true, tension: 0.3 }],
  };

  const statusBreakdown = ['pending','approved','rejected','paid'].map(s => dataInRange.filter(r => r.status === (s as any)).length);
  const doughnutData = { labels: ['Pending','Approved','Rejected','Paid'], datasets: [{ data: statusBreakdown, backgroundColor: ['#f59e0b','#22c55e','#ef4444','#3b82f6'], borderWidth: 0 }] };

  const topAgents = React.useMemo(() => {
    const map = new Map<string, number>();
    dataInRange.filter(r => r.status === 'approved' || r.status === 'paid').forEach(r => {
      map.set(r.agentId, (map.get(r.agentId) || 0) + r.amount);
    });
    return Array.from(map.entries()).sort((a,b) => b[1]-a[1]).slice(0,5);
  }, [dataInRange]);

  const barData = {
    labels: topAgents.map(([id]) => id),
    datasets: [{ label: 'Amount', data: topAgents.map(([,v]) => v), backgroundColor: '#60a5fa' }],
  };

  return (
    <Box>
      <PageHeader title="Reports" subtitle="Generate and view system reports" />

      {/* Controls */}
      <MuiCard sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <FormControl size="small">
              <InputLabel id="range-label">Range</InputLabel>
              <Select labelId="range-label" value={range} label="Range" onChange={(e) => setRange(e.target.value as any)}>
                <MenuItem value="3m">Last 3 months</MenuItem>
                <MenuItem value="6m">Last 6 months</MenuItem>
                <MenuItem value="12m">Last 12 months</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small">
              <InputLabel id="groupby-label">Group by</InputLabel>
              <Select labelId="groupby-label" value={groupBy} label="Group by" onChange={(e) => setGroupBy(e.target.value as any)}>
                <MenuItem value="month">Month</MenuItem>
                <MenuItem value="week">Week</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small">
              <InputLabel id="status-label">Status</InputLabel>
              <Select labelId="status-label" value={status} label="Status" onChange={(e) => setStatus(e.target.value as any)}>
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="approved">Approved</MenuItem>
                <MenuItem value="rejected">Rejected</MenuItem>
                <MenuItem value="paid">Paid</MenuItem>
              </Select>
            </FormControl>
            <Box sx={{ flexGrow: 1 }} />
            <Button variant="outlined" onClick={() => navigate('/admin/dashboard')}>Back to Dashboard</Button>
          </Box>
        </CardContent>
      </MuiCard>

      {/* Charts */}
      <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, mb: 3 }}>
        <MuiCard>
          <CardContent>
            <Typography variant="h6" fontWeight="bold" gutterBottom>Spending Over Time</Typography>
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

      <MuiCard>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>Top Agents</Typography>
          <Bar data={barData} />
        </CardContent>
      </MuiCard>
    </Box>
  );
};

export default AdminReportsPage;
