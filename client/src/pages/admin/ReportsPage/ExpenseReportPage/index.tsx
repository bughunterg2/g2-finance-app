import React from 'react';
import { Box, Typography, Card as MuiCard, CardContent, Button, Chip, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
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

const ExpenseReportPage: React.FC = () => {
  const { reimbursements } = useReimbursementStore();

  const [range, setRange] = React.useState<'30d'|'90d'|'180d'>('90d');
  const [status, setStatus] = React.useState<'all'|'pending'|'approved'|'rejected'|'paid'>('all');

  const daysBack = range === '30d' ? 30 : range === '90d' ? 90 : 180;
  const startDate = React.useMemo(() => new Date(Date.now() - (daysBack - 1) * 86400000), [daysBack]);

  const dataInRange = React.useMemo(() => {
    return reimbursements
      .filter(r => new Date(r.createdAt) >= startDate)
      .filter(r => status === 'all' ? true : r.status === status);
  }, [reimbursements, startDate, status]);

  const effectiveExpenses = React.useMemo(() => {
    return dataInRange.filter(r => r.status === 'approved' || r.status === 'paid');
  }, [dataInRange]);

  // Over time (by week buckets across the range)
  const labels = React.useMemo(() => Array.from({ length: Math.ceil(daysBack / 7) }, (_, i) => `W${i+1}`), [daysBack]);
  const series = React.useMemo(() => {
    const weeks = Math.ceil(daysBack / 7);
    const now = new Date();
    const buckets = Array.from({ length: weeks }, () => 0);
    effectiveExpenses.forEach(r => {
      const diffDays = Math.floor((now.getTime() - new Date(r.createdAt).getTime()) / 86400000);
      const weekIndex = Math.min(weeks - 1, Math.floor(diffDays / 7));
      buckets[weeks - 1 - weekIndex] += r.amount;
    });
    return buckets;
  }, [effectiveExpenses, daysBack]);

  const lineData = {
    labels,
    datasets: [{ label: 'Expenses', data: series, borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.2)', fill: true, tension: 0.3 }],
  };

  // Status breakdown (counts)
  const statusCounts = ['pending','approved','rejected','paid'].map(s => dataInRange.filter(r => r.status === (s as any)).length);
  const doughnutData = { labels: ['Pending','Approved','Rejected','Paid'], datasets: [{ data: statusCounts, backgroundColor: ['#f59e0b','#22c55e','#ef4444','#3b82f6'], borderWidth: 0 }] };

  // Category totals
  const categoryTotals = React.useMemo(() => {
    const map = new Map<string, number>();
    effectiveExpenses.forEach(r => map.set(r.categoryId, (map.get(r.categoryId) || 0) + r.amount));
    return Array.from(map.entries()).sort((a,b) => b[1]-a[1]).slice(0,5);
  }, [effectiveExpenses]);

  const barData = {
    labels: categoryTotals.map(([cid]) => cid),
    datasets: [{ label: 'Amount', data: categoryTotals.map(([,v]) => v), backgroundColor: '#60a5fa' }],
  };

  const totalAmount = effectiveExpenses.reduce((s, r) => s + r.amount, 0);
  const avgAmount = effectiveExpenses.length ? totalAmount / effectiveExpenses.length : 0;

  const exportCsv = () => {
    const rows = [
      ['Date','CategoryId','AgentId','Amount','Status'],
      ...dataInRange.map(r => [
        new Date(r.createdAt).toISOString(),
        r.categoryId,
        r.agentId,
        String(r.amount),
        r.status,
      ]),
    ];
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expense-report-${range}-${status}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Box>
      <PageHeader title="Expense Report" subtitle="Overview of expenses and breakdowns" />

      <MuiCard sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <FormControl size="small">
              <InputLabel id="range-label">Range</InputLabel>
              <Select labelId="range-label" value={range} label="Range" onChange={(e) => setRange(e.target.value as any)}>
                <MenuItem value="30d">Last 30 days</MenuItem>
                <MenuItem value="90d">Last 90 days</MenuItem>
                <MenuItem value="180d">Last 180 days</MenuItem>
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
            <Chip label={`Tx: ${dataInRange.length}`} />
            <Chip label={`Total: ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(totalAmount)}`} color="primary" />
            <Chip label={`Avg: ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(avgAmount)}`} />
            <Button variant="outlined" onClick={exportCsv}>Export CSV</Button>
          </Box>
        </CardContent>
      </MuiCard>

      <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, mb: 3 }}>
        <MuiCard>
          <CardContent>
            <Typography variant="h6" fontWeight="bold" gutterBottom>Expenses Over Time</Typography>
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
          <Typography variant="h6" fontWeight="bold" gutterBottom>Top Categories</Typography>
          <Bar data={barData} />
        </CardContent>
      </MuiCard>
    </Box>
  );
};

export default ExpenseReportPage;


