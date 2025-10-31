import React from 'react';
import { Box, Card as MuiCard, CardContent, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Stack, Select, MenuItem, InputLabel, FormControl } from '@mui/material';
import PageHeader from '@/components/layout/PageHeader';
import { useSpreadsheetStore } from '@/stores/spreadsheetStore';

function monthKeyOptions(): string[] {
  const now = new Date();
  const list: string[] = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(now);
    d.setMonth(now.getMonth() - i);
    const m = String(d.getMonth() + 1).padStart(2, '0');
    list.push(`${d.getFullYear()}-${m}`);
  }
  return list;
}

const SpreadsheetSummaryPage: React.FC = () => {
  const { tables, dataByMonth } = useSpreadsheetStore();

  const monthOptions = React.useMemo(() => monthKeyOptions(), []);
  const [selectedMonth, setSelectedMonth] = React.useState<string>(monthOptions[0]);

  const formatNumber = (n: number) => new Intl.NumberFormat('id-ID', { style: 'decimal', maximumFractionDigits: 2 }).format(n);

  return (
    <Box>
      <PageHeader
        title="Spreadsheet Summary"
        subtitle="Ringkasan per tabel dan akumulasi untuk kolom angka"
        actions={
          <Stack direction="row" spacing={1} alignItems="center">
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel id="sum-month">Month</InputLabel>
              <Select labelId="sum-month" label="Month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
                {monthOptions.map(mk => (
                  <MenuItem key={mk} value={mk}>{mk}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        }
      />

      {tables.length === 0 ? (
        <Typography variant="body2" color="text.secondary">Belum ada tabel.</Typography>
      ) : (
        <Stack spacing={2}>
          {tables.map(table => {
            const numericCols = table.columns.filter(c => c.type === 'number');
            const months = dataByMonth[table.id] || {};
            const rowsThisMonth = months[selectedMonth] || [];

            const perColMonthTotals: Record<string, number> = {};
            numericCols.forEach(c => {
              perColMonthTotals[c.id] = rowsThisMonth.reduce((sum, r) => {
                const v = r.cells[c.id];
                const n = typeof v === 'number' ? v : Number(v);
                return sum + (Number.isFinite(n) ? n : 0);
              }, 0);
            });

            const perColAllTotals: Record<string, number> = {};
            numericCols.forEach(c => {
              let sum = 0;
              Object.values(months).forEach(rows => {
                rows.forEach(r => {
                  const v = r.cells[c.id];
                  const n = typeof v === 'number' ? v : Number(v);
                  sum += Number.isFinite(n) ? n : 0;
                });
              });
              perColAllTotals[c.id] = sum;
            });

            const grandMonth = Object.values(perColMonthTotals).reduce((a, b) => a + b, 0);
            const grandAll = Object.values(perColAllTotals).reduce((a, b) => a + b, 0);

            return (
              <MuiCard key={table.id}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                    <Typography variant="h6">{table.title}</Typography>
                    <Stack direction="row" spacing={3}>
                      <Typography variant="body2" color="text.secondary">Total bulan {selectedMonth}: <strong>{formatNumber(grandMonth)}</strong></Typography>
                      <Typography variant="body2" color="text.secondary">Total semua bulan: <strong>{formatNumber(grandAll)}</strong></Typography>
                    </Stack>
                  </Stack>
                  {numericCols.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">Tidak ada kolom angka.</Typography>
                  ) : (
                    <TableContainer component={Paper}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Kolom</TableCell>
                            <TableCell align="right">Bulan {selectedMonth}</TableCell>
                            <TableCell align="right">Semua Bulan</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {numericCols.map(c => (
                            <TableRow key={c.id}>
                              <TableCell>{c.title}</TableCell>
                              <TableCell align="right">{formatNumber(perColMonthTotals[c.id] || 0)}</TableCell>
                              <TableCell align="right">{formatNumber(perColAllTotals[c.id] || 0)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </CardContent>
              </MuiCard>
            );
          })}
        </Stack>
      )}
    </Box>
  );
};

export default SpreadsheetSummaryPage;


