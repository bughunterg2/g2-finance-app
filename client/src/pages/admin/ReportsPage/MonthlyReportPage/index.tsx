import React from 'react';
import { Box, Typography, Card as MuiCard, CardContent, Button, Chip, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import PageHeader from '@/components/layout/PageHeader';
import { useReimbursementStore } from '@/stores/reimbursementStore';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend);

const MonthlyReportPage: React.FC = () => {
  const { reimbursements } = useReimbursementStore();

  const [months, setMonths] = React.useState<3|6|12>(6);
  const [status, setStatus] = React.useState<'all'|'pending'|'approved'|'rejected'|'paid'>('all');

  const startDate = React.useMemo(() => new Date(new Date().setMonth(new Date().getMonth() - (months - 1))), [months]);

  const dataInRange = React.useMemo(() => {
    return reimbursements
      .filter(r => new Date(r.createdAt) >= startDate)
      .filter(r => status === 'all' ? true : r.status === status);
  }, [reimbursements, startDate, status]);

  const labels = React.useMemo(() => {
    return Array.from({ length: months }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (months - 1 - i));
      return d.toLocaleString('id-ID', { month: 'short' });
    });
  }, [months]);

  const monthlyTotal = React.useMemo(() => {
    return labels.map((_, idx) => {
      const m = (new Date().getMonth() - (months - 1 - idx) + 12) % 12;
      return dataInRange
        .filter(r => new Date(r.createdAt).getMonth() === m && (r.status === 'approved' || r.status === 'paid'))
        .reduce((sum, r) => sum + r.amount, 0);
    });
  }, [labels, months, dataInRange]);

  const monthlyCount = React.useMemo(() => {
    return labels.map((_, idx) => {
      const m = (new Date().getMonth() - (months - 1 - idx) + 12) % 12;
      return dataInRange.filter(r => new Date(r.createdAt).getMonth() === m).length;
    });
  }, [labels, months, dataInRange]);

  const total = monthlyTotal.reduce((s, v) => s + v, 0);
  const count = dataInRange.length;
  const avg = count ? total / count : 0;

  const exportCsv = () => {
    const rows = [
      ['Month','Total','Count','Avg per claim'],
      ...labels.map((label, i) => [
        label,
        String(monthlyTotal[i]),
        String(monthlyCount[i]),
        String(monthlyCount[i] ? Math.round((monthlyTotal[i] / monthlyCount[i]) * 100) / 100 : 0),
      ]),
    ];
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `monthly-report-${months}-${status}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const combinedData = {
    labels,
    datasets: [
      { type: 'bar' as const, label: 'Total', data: monthlyTotal, backgroundColor: '#93c5fd' },
      { type: 'line' as const, label: 'Count', data: monthlyCount, borderColor: '#3b82f6' },
    ],
  };

  return (
    <Box>
      <PageHeader title="Monthly Report" subtitle="Monthly trends and KPIs" />

      <MuiCard sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <FormControl size="small">
              <InputLabel id="months-label">Months</InputLabel>
              <Select labelId="months-label" value={months} label="Months" onChange={(e) => setMonths(e.target.value as any)}>
                <MenuItem value={3}>Last 3 months</MenuItem>
                <MenuItem value={6}>Last 6 months</MenuItem>
                <MenuItem value={12}>Last 12 months</MenuItem>
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
            <Chip label={`Tx: ${count}`} />
            <Chip label={`Total: ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(total)}`} color="primary" />
            <Chip label={`Avg: ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(avg)}`} />
            <Button variant="outlined" onClick={exportCsv}>Export CSV</Button>
          </Box>
        </CardContent>
      </MuiCard>

      <MuiCard>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>Monthly Total and Count</Typography>
          <Bar data={combinedData as any} />
        </CardContent>
      </MuiCard>
    </Box>
  );
};

export default MonthlyReportPage;


