import React from 'react';
import { Box, Typography, Card as MuiCard, CardContent, Button, Chip, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import PageHeader from '@/components/layout/PageHeader';
import { useReimbursementStore } from '@/stores/reimbursementStore';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

const YearlyReportPage: React.FC = () => {
  const { reimbursements } = useReimbursementStore();

  const currentYear = new Date().getFullYear();
  const [year, setYear] = React.useState<number>(currentYear);
  const prevYear = year - 1;

  const byYear = (y: number) => reimbursements.filter(r => new Date(r.createdAt).getFullYear() === y);
  const yData = React.useMemo(() => byYear(year), [reimbursements, year]);
  const pData = React.useMemo(() => byYear(prevYear), [reimbursements, prevYear]);

  const monthlyTotals = (list: typeof reimbursements) => {
    const arr = Array.from({ length: 12 }, () => 0);
    list.filter(r => r.status === 'approved' || r.status === 'paid').forEach(r => {
      const m = new Date(r.createdAt).getMonth();
      arr[m] += r.amount;
    });
    return arr;
  };

  const yMonthly = React.useMemo(() => monthlyTotals(yData), [yData]);
  const pMonthly = React.useMemo(() => monthlyTotals(pData), [pData]);

  const labels = Array.from({ length: 12 }, (_, i) => new Date(0, i).toLocaleString('id-ID', { month: 'short' }));
  const groupedData = {
    labels,
    datasets: [
      { label: String(prevYear), data: pMonthly, backgroundColor: '#93c5fd' },
      { label: String(year), data: yMonthly, backgroundColor: '#3b82f6' },
    ],
  };

  const sum = (a: number[]) => a.reduce((s, v) => s + v, 0);
  const totalY = sum(yMonthly);
  const totalP = sum(pMonthly);
  const yoy = totalP ? ((totalY - totalP) / totalP) * 100 : 0;
  const countY = yData.length;
  const avgY = countY ? totalY / countY : 0;

  const categoryShare = (list: typeof reimbursements) => {
    const map = new Map<string, number>();
    list.filter(r => r.status === 'approved' || r.status === 'paid').forEach(r => map.set(r.categoryId, (map.get(r.categoryId) || 0) + r.amount));
    const entries = Array.from(map.entries());
    const labels = entries.map(([k]) => k);
    const data = entries.map(([,v]) => v);
    return { labels, data };
  };
  const yShare = React.useMemo(() => categoryShare(yData), [yData]);
  const pShare = React.useMemo(() => categoryShare(pData), [pData]);

  const exportCsv = () => {
    const rows = [
      ['Month', String(prevYear), String(year)],
      ...labels.map((m, i) => [m, String(pMonthly[i]), String(yMonthly[i])]),
      [],
      ['Totals', String(totalP), String(totalY)],
      ['YoY %', '', String(Math.round(yoy * 100) / 100)],
      ['Avg per claim (Y)', '', String(Math.round(avgY * 100) / 100)],
    ];
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `yearly-report-${year}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Box>
      <PageHeader title="Yearly Report" subtitle="Year-over-year comparisons" />

      <MuiCard sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <FormControl size="small">
              <InputLabel id="year-label">Year</InputLabel>
              <Select labelId="year-label" value={year} label="Year" onChange={(e) => setYear(e.target.value as any)}>
                <MenuItem value={currentYear - 1}>{currentYear - 1}</MenuItem>
                <MenuItem value={currentYear}>{currentYear}</MenuItem>
              </Select>
            </FormControl>
            <Box sx={{ flexGrow: 1 }} />
            <Chip label={`Total ${year}: ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(totalY)}`} color="primary" />
            <Chip label={`YoY: ${Math.round(yoy * 100) / 100}%`} />
            <Chip label={`Avg/claim: ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(avgY)}`} />
            <Button variant="outlined" onClick={exportCsv}>Export CSV</Button>
          </Box>
        </CardContent>
      </MuiCard>

      <MuiCard sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>Monthly Totals (YoY)</Typography>
          <Bar data={groupedData} />
        </CardContent>
      </MuiCard>

      <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
        <MuiCard>
          <CardContent>
            <Typography variant="h6" fontWeight="bold" gutterBottom>Category Share {prevYear}</Typography>
            <Doughnut data={{ labels: pShare.labels, datasets: [{ data: pShare.data, backgroundColor: ['#60a5fa','#22c55e','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#f97316','#84cc16','#ec4899','#6b7280'] }] }} />
          </CardContent>
        </MuiCard>
        <MuiCard>
          <CardContent>
            <Typography variant="h6" fontWeight="bold" gutterBottom>Category Share {year}</Typography>
            <Doughnut data={{ labels: yShare.labels, datasets: [{ data: yShare.data, backgroundColor: ['#60a5fa','#22c55e','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#f97316','#84cc16','#ec4899','#6b7280'] }] }} />
          </CardContent>
        </MuiCard>
      </Box>
    </Box>
  );
};

export default YearlyReportPage;


