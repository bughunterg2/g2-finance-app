import React from 'react';
import { Box, Typography, Card as MuiCard, CardContent, Button, Chip, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import PageHeader from '@/components/layout/PageHeader';
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

const IncomeReportPage: React.FC = () => {
  const { reimbursements } = useReimbursementStore();

  // Dummy mapping: treat 'paid' reimbursements as income-like for this report
  const [range, setRange] = React.useState<'3m'|'6m'|'12m'>('6m');
  const monthsBack = range === '3m' ? 3 : range === '6m' ? 6 : 12;
  const startDate = React.useMemo(() => new Date(new Date().setMonth(new Date().getMonth() - (monthsBack - 1))), [monthsBack]);

  const dataInRange = React.useMemo(() => {
    return reimbursements.filter(r => new Date(r.createdAt) >= startDate && r.status === 'paid');
  }, [reimbursements, startDate]);

  const labels = React.useMemo(() => Array.from({ length: monthsBack }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (monthsBack - 1 - i));
    return d.toLocaleString('id-ID', { month: 'short' });
  }), [monthsBack]);

  const series = React.useMemo(() => labels.map((_, idx) => {
    const m = (new Date().getMonth() - (monthsBack - 1 - idx) + 12) % 12;
    return dataInRange.filter(r => new Date(r.createdAt).getMonth() === m).reduce((s, r) => s + r.amount, 0);
  }), [labels, monthsBack, dataInRange]);

  const lineData = {
    labels,
    datasets: [{ label: 'Income (dummy)', data: series, borderColor: '#22c55e', backgroundColor: 'rgba(34,197,94,0.2)', fill: true, tension: 0.3 }],
  };

  const statusCounts = [dataInRange.length];
  const doughnutData = { labels: ['Paid'], datasets: [{ data: statusCounts, backgroundColor: ['#22c55e'], borderWidth: 0 }] };

  const total = series.reduce((s, v) => s + v, 0);
  const count = dataInRange.length;
  const avg = count ? total / count : 0;

  const exportCsv = () => {
    const rows = [
      ['Month','Amount'],
      ...labels.map((l, i) => [l, String(series[i])]),
    ];
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `income-report-${range}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Box>
      <PageHeader title="Income Report" subtitle="Overview of income-related metrics" />

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
            <Box sx={{ flexGrow: 1 }} />
            <Chip label={`Tx: ${count}`} />
            <Chip label={`Total: ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(total)}`} color="primary" />
            <Chip label={`Avg: ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(avg)}`} />
            <Button variant="outlined" onClick={exportCsv}>Export CSV</Button>
          </Box>
        </CardContent>
      </MuiCard>

      <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' } }}>
        <MuiCard>
          <CardContent>
            <Typography variant="h6" fontWeight="bold" gutterBottom>Income Over Time (dummy)</Typography>
            <Line data={lineData} />
          </CardContent>
        </MuiCard>
        <MuiCard>
          <CardContent>
            <Typography variant="h6" fontWeight="bold" gutterBottom>Paid Count</Typography>
            <Doughnut data={doughnutData} />
          </CardContent>
        </MuiCard>
      </Box>
    </Box>
  );
};

export default IncomeReportPage;


