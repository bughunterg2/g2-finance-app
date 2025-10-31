import React, { useMemo, useState } from 'react';
import {
  Box,
  Card as MuiCard,
  CardContent,
  Typography,
  Stack,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
} from '@mui/material';
import {
  TableChart as TableChartIcon,
  BarChart as BarChartIcon,
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  OpenInNew as OpenInNewIcon,
  CalendarMonth as CalendarMonthIcon,
  Numbers as NumbersIcon,
  List as ListIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
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
import PageHeader from '@/components/layout/PageHeader';
import StatCard from '@/components/ui/StatCard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import { useSpreadsheetStore } from '@/stores/spreadsheetStore';
import { useAuthStore } from '@/stores/authStore';
import { formatCurrency } from '@/utils/format';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend
);

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

const formatNumber = (n: number) => {
  if (n >= 1000000) return `${(n / 1000000).toFixed(2)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(2)}K`;
  return new Intl.NumberFormat('id-ID', { style: 'decimal', maximumFractionDigits: 2 }).format(n);
};

const formatMonthLabel = (monthKey: string) => {
  const [year, month] = monthKey.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleString('id-ID', { month: 'short', year: 'numeric' });
};

const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { tables, dataByMonth, monthMetaByTable, getRows, getTotals } = useSpreadsheetStore();
  const [selectedMonth, setSelectedMonth] = useState<string>(''); // Empty string means "all months"
  const [selectedTables, setSelectedTables] = useState<string[]>([]);
  const [expandedTable, setExpandedTable] = useState<string | false>(false);

  // Get unique months from actual data instead of just last 12 months
  const monthOptions = useMemo(() => {
    const allMonths = new Set<string>();
    
    // Collect all months from all tables
    tables.forEach(table => {
      const months = dataByMonth[table.id] || {};
      Object.keys(months).forEach(monthKey => {
        allMonths.add(monthKey);
      });
    });
    
    // Convert to array and sort descending (newest first)
    const monthArray = Array.from(allMonths).sort((a, b) => {
      // Compare as strings works because format is YYYY-MM
      return b.localeCompare(a);
    });
    
    // If no data, fallback to last 12 months
    if (monthArray.length === 0) {
      return monthKeyOptions();
    }
    
    return monthArray;
  }, [tables, dataByMonth]);

  // Filter tables based on selectedTables
  const filteredTables = useMemo(() => {
    if (selectedTables.length === 0) return tables;
    return tables.filter(t => selectedTables.includes(t.id));
  }, [tables, selectedTables]);

  // Calculate overall statistics with filters applied
  const overallStats = useMemo(() => {
    const totalTables = filteredTables.length;
    let totalRows = 0;
    let totalNumericColumns = 0;
    const activeMonths = new Set<string>();
    let latestTable = null;
    let latestUpdate = 0;

    filteredTables.forEach(table => {
      const numericCols = table.columns.filter(c => c.type === 'number');
      totalNumericColumns += numericCols.length;
      
      const months = dataByMonth[table.id] || {};
      Object.keys(months).forEach(monthKey => {
        // Filter by selectedMonth if provided
        if (selectedMonth && monthKey !== selectedMonth) return;
        activeMonths.add(monthKey);
        totalRows += months[monthKey].length;
      });

      const updatedAt = new Date(table.updatedAt).getTime();
      if (updatedAt > latestUpdate) {
        latestUpdate = updatedAt;
        latestTable = table;
      }
    });

    return {
      totalTables,
      totalRows,
      totalNumericColumns,
      activeMonthsCount: activeMonths.size,
      latestTable: latestTable?.title || 'N/A',
    };
  }, [filteredTables, dataByMonth, selectedMonth]);

  // Calculate aggregate numeric totals with filters applied
  const aggregateTotals = useMemo(() => {
    const monthTotals: Record<string, number> = {};
    let allTimeTotal = 0;

    filteredTables.forEach(table => {
      const numericCols = table.columns.filter(c => c.type === 'number');
      const months = dataByMonth[table.id] || {};
      
      Object.entries(months).forEach(([monthKey, rows]) => {
        // Filter by selectedMonth if provided
        if (selectedMonth && monthKey !== selectedMonth) return;
        
        if (!monthTotals[monthKey]) monthTotals[monthKey] = 0;
        
        numericCols.forEach(col => {
          const colTotal = rows.reduce((sum, r) => {
            const v = r.cells[col.id];
            const n = typeof v === 'number' ? v : Number(v);
            return sum + (Number.isFinite(n) ? n : 0);
          }, 0);
          monthTotals[monthKey] += colTotal;
          allTimeTotal += colTotal;
        });
      });
    });

    return { monthTotals, allTimeTotal };
  }, [filteredTables, dataByMonth, selectedMonth]);

  // Prepare chart data for aggregate trends
  const aggregateTrendData = useMemo(() => {
    const months = monthOptions.slice(0, 6).reverse();
    const data = months.map(monthKey => aggregateTotals.monthTotals[monthKey] || 0);
    
    return {
      labels: months.map(formatMonthLabel),
      datasets: [
        {
          label: 'Total Nilai Numerik',
          data,
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.2)',
          tension: 0.3,
          fill: true,
        },
      ],
    };
  }, [monthOptions, aggregateTotals]);

  // Prepare data distribution chart with filters applied
  const distributionData = useMemo(() => {
    const tableRows = filteredTables.map(t => {
      const months = dataByMonth[t.id] || {};
      if (selectedMonth) {
        // Filter by selectedMonth
        return months[selectedMonth]?.length || 0;
      }
      return Object.values(months).reduce((sum, rows) => sum + rows.length, 0);
    });

    return {
      labels: filteredTables.map(t => t.title),
      datasets: [
        {
          label: 'Jumlah Baris',
          data: tableRows,
          backgroundColor: [
            '#3b82f6',
            '#22c55e',
            '#f59e0b',
            '#ef4444',
            '#8b5cf6',
            '#ec4899',
            '#06b6d4',
            '#84cc16',
          ],
        },
      ],
    };
  }, [filteredTables, dataByMonth, selectedMonth]);

  // Calculate per-table statistics with filters applied
  const tableStats = useMemo(() => {
    return filteredTables.map(table => {
      const numericCols = table.columns.filter(c => c.type === 'number');
      const months = dataByMonth[table.id] || {};
      
      // Filter rows by selectedMonth if provided
      let allRows;
      if (selectedMonth) {
        allRows = months[selectedMonth] || [];
      } else {
        allRows = Object.values(months).flat();
      }
      const totalRows = allRows.length;

      // Calculate totals per numeric column
      const columnStats: Record<string, { total: number; avg: number; min: number; max: number; count: number }> = {};
      
      numericCols.forEach(col => {
        const values = allRows
          .map(r => {
            const v = r.cells[col.id];
            return typeof v === 'number' ? v : Number(v);
          })
          .filter(v => Number.isFinite(v) && v !== 0);
        
        if (values.length > 0) {
          columnStats[col.id] = {
            total: values.reduce((sum, v) => sum + v, 0),
            avg: values.reduce((sum, v) => sum + v, 0) / values.length,
            min: Math.min(...values),
            max: Math.max(...values),
            count: values.length,
          };
        }
      });

      // Monthly trend data (filter by selectedMonth if provided)
      let monthKeys = Object.keys(months).sort();
      if (selectedMonth) {
        // If month filter is active, only show that month in trend
        monthKeys = monthKeys.filter(mk => mk === selectedMonth);
      }
      const monthlyTrend = monthKeys.map(monthKey => {
        const rows = months[monthKey] || [];
        return numericCols.reduce((sum, col) => {
          const colTotal = rows.reduce((s, r) => {
            const v = r.cells[col.id];
            const n = typeof v === 'number' ? v : Number(v);
            return s + (Number.isFinite(n) ? n : 0);
          }, 0);
          return sum + colTotal;
        }, 0);
      });

      // Find most active month
      const monthRowCounts = Object.entries(months).map(([mk, rows]) => ({
        monthKey: mk,
        count: rows.length,
      }));
      const mostActiveMonth = monthRowCounts.sort((a, b) => b.count - a.count)[0];

      return {
        table,
        totalRows,
        numericCols,
        columnStats,
        monthlyTrend: {
          labels: monthKeys.map(formatMonthLabel),
          data: monthlyTrend,
        },
        mostActiveMonth: mostActiveMonth?.monthKey || null,
        mostActiveMonthCount: mostActiveMonth?.count || 0,
      };
    });
  }, [filteredTables, dataByMonth, selectedMonth]);

  // Comparison table data
  const comparisonData = useMemo(() => {
    return tableStats.map(stat => {
      const numericTotals = Object.values(stat.columnStats).reduce((sum, s) => sum + s.total, 0);
      const numericAvg = Object.values(stat.columnStats).length > 0
        ? Object.values(stat.columnStats).reduce((sum, s) => sum + s.avg, 0) / Object.values(stat.columnStats).length
        : 0;

      return {
        id: stat.table.id,
        title: stat.table.title,
        total: numericTotals,
        avg: numericAvg,
        rows: stat.totalRows,
        lastUpdate: formatMonthLabel(stat.mostActiveMonth || selectedMonth),
      };
    });
  }, [tableStats, selectedMonth]);

  // Quick insights
  const insights = useMemo(() => {
    const mostActiveTable = tableStats.sort((a, b) => b.totalRows - a.totalRows)[0];
    const highestValueTable = comparisonData.sort((a, b) => b.total - a.total)[0];
    
    let highestValueColumn = { tableTitle: '', columnTitle: '', value: 0 };
    tableStats.forEach(stat => {
      Object.entries(stat.columnStats).forEach(([colId, stats]) => {
        const col = stat.numericCols.find(c => c.id === colId);
        if (stats.total > highestValueColumn.value) {
          highestValueColumn = {
            tableTitle: stat.table.title,
            columnTitle: col?.title || '',
            value: stats.total,
          };
        }
      });
    });

    return {
      mostActiveTable: mostActiveTable?.table.title || 'N/A',
      highestValueTable: highestValueTable?.title || 'N/A',
      highestValueColumn,
    };
  }, [tableStats, comparisonData]);

  const handleTableClick = (tableId: string) => {
    const table = tables.find(t => t.id === tableId);
    if (table) {
      const slug = table.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      navigate(`/admin/spreadsheets/${slug}`);
    }
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  // tableStats already filtered by selectedTables, so use it directly
  const filteredTableStats = tableStats;

  if (tables.length === 0) {
    return (
      <Box>
        <PageHeader
          title={`Welcome back, ${user?.name}!`}
          subtitle="Dashboard analisis data dari semua tabel spreadsheet"
        />
        <EmptyState
          title="Belum ada tabel"
          description="Buat tabel terlebih dahulu untuk melihat analisis data"
        />
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title={`Welcome back, ${user?.name}!`}
        subtitle="Dashboard analisis data dari semua tabel spreadsheet"
        actions={
          <Stack direction="row" spacing={1}>
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel id="filter-month">Filter Bulan</InputLabel>
              <Select
                labelId="filter-month"
                label="Filter Bulan"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              >
                <MenuItem value="">Semua Bulan</MenuItem>
                {monthOptions.map(mk => (
                  <MenuItem key={mk} value={mk}>{formatMonthLabel(mk)}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel id="filter-tables">Pilih Tabel</InputLabel>
              <Select
                labelId="filter-tables"
                label="Pilih Tabel"
                multiple
                value={selectedTables}
                onChange={(e) => setSelectedTables(e.target.value as string[])}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {(selected as string[]).map((value) => {
                      const table = tables.find(t => t.id === value);
                      return <Chip key={value} label={table?.title || value} size="small" />;
                    })}
                  </Box>
                )}
              >
                {tables.map((table) => (
                  <MenuItem key={table.id} value={table.id}>
                    {table.title}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={handleRefresh}
            >
              Refresh
            </Button>
          </Stack>
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
          md: 'repeat(5, 1fr)',
        },
      }}>
        <StatCard
          title="Total Tabel"
          value={overallStats.totalTables}
          icon={<TableChartIcon />}
          color="primary"
        />
        <StatCard
          title="Total Baris"
          value={formatNumber(overallStats.totalRows)}
          icon={<ListIcon />}
          color="success"
        />
        <StatCard
          title="Kolom Numerik"
          value={overallStats.totalNumericColumns}
          icon={<NumbersIcon />}
          color="warning"
        />
        <StatCard
          title="Bulan Aktif"
          value={overallStats.activeMonthsCount}
          icon={<CalendarMonthIcon />}
          color="secondary"
        />
        <StatCard
          title="Tabel Terbaru"
          value={overallStats.latestTable}
          icon={<AssessmentIcon />}
          color="primary"
          subtitle="Terakhir diupdate"
        />
      </Box>

      {/* Aggregate Charts */}
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
              Tren Total Nilai Numerik
            </Typography>
            {aggregateTrendData.labels.length > 0 ? (
              <Line data={aggregateTrendData} />
            ) : (
              <EmptyState title="Tidak ada data" description="Belum ada data numerik untuk ditampilkan" />
            )}
          </CardContent>
        </MuiCard>
        <MuiCard>
          <CardContent>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Distribusi Data per Tabel
            </Typography>
            {distributionData.labels.length > 0 ? (
              <Doughnut data={distributionData} />
            ) : (
              <EmptyState title="Tidak ada data" description="Belum ada data untuk ditampilkan" />
            )}
          </CardContent>
        </MuiCard>
      </Box>

      {/* Per Table Analysis */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ mb: 2 }}>
          Analisis per Tabel
        </Typography>
        <Stack spacing={2}>
          {filteredTableStats.map((stat) => (
            <Accordion
              key={stat.table.id}
              expanded={expandedTable === stat.table.id}
              onChange={(_, isExpanded) => setExpandedTable(isExpanded ? stat.table.id : false)}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', pr: 2 }}>
                  <Box>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {stat.table.title}
                    </Typography>
                    <Stack direction="row" spacing={2} sx={{ mt: 0.5 }}>
                      <Chip size="small" label={`${stat.totalRows} baris`} />
                      <Chip size="small" label={`${stat.numericCols.length} kolom numerik`} />
                      {stat.mostActiveMonth && (
                        <Chip size="small" label={`Aktif: ${formatMonthLabel(stat.mostActiveMonth)}`} color="primary" />
                      )}
                    </Stack>
                  </Box>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTableClick(stat.table.id);
                    }}
                  >
                    <OpenInNewIcon />
                  </IconButton>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Box>
                  {/* Column Statistics */}
                  {stat.numericCols.length > 0 ? (
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                        Statistik Kolom Numerik
                      </Typography>
                      <TableContainer component={Paper} variant="outlined">
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Kolom</TableCell>
                              <TableCell align="right">Total</TableCell>
                              <TableCell align="right">Rata-rata</TableCell>
                              <TableCell align="right">Min</TableCell>
                              <TableCell align="right">Max</TableCell>
                              <TableCell align="right">Count</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {stat.numericCols.map(col => {
                              const colStat = stat.columnStats[col.id];
                              if (!colStat) return null;
                              return (
                                <TableRow key={col.id}>
                                  <TableCell>{col.title}</TableCell>
                                  <TableCell align="right">{formatNumber(colStat.total)}</TableCell>
                                  <TableCell align="right">{formatNumber(colStat.avg)}</TableCell>
                                  <TableCell align="right">{formatNumber(colStat.min)}</TableCell>
                                  <TableCell align="right">{formatNumber(colStat.max)}</TableCell>
                                  <TableCell align="right">{colStat.count}</TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                      Tidak ada kolom numerik pada tabel ini
                    </Typography>
                  )}

                  {/* Monthly Trend Chart */}
                  {stat.monthlyTrend.labels.length > 0 && (
                    <Box>
                      <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                        Tren Bulanan
                      </Typography>
                      <Line
                        data={{
                          labels: stat.monthlyTrend.labels,
                          datasets: [
                            {
                              label: 'Total Nilai Numerik',
                              data: stat.monthlyTrend.data,
                              borderColor: '#3b82f6',
                              backgroundColor: 'rgba(59, 130, 246, 0.2)',
                              tension: 0.3,
                              fill: true,
                            },
                          ],
                        }}
                      />
                    </Box>
                  )}
                </Box>
              </AccordionDetails>
            </Accordion>
          ))}
        </Stack>
      </Box>

      {/* Comparison Table */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ mb: 2 }}>
          Perbandingan Antar Tabel
        </Typography>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Tabel</TableCell>
                <TableCell align="right">Total Nilai</TableCell>
                <TableCell align="right">Rata-rata</TableCell>
                <TableCell align="right">Jumlah Baris</TableCell>
                <TableCell>Bulan Terakhir</TableCell>
                <TableCell align="center">Aksi</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {comparisonData.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell>
                    <Typography fontWeight="medium">{row.title}</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography fontWeight="bold">{formatNumber(row.total)}</Typography>
                  </TableCell>
                  <TableCell align="right">{formatNumber(row.avg)}</TableCell>
                  <TableCell align="right">{row.rows}</TableCell>
                  <TableCell>{row.lastUpdate}</TableCell>
                  <TableCell align="center">
                    <Button
                      size="small"
                      startIcon={<OpenInNewIcon />}
                      onClick={() => handleTableClick(row.id)}
                    >
                      Buka
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Quick Insights */}
      <MuiCard>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Quick Insights
          </Typography>
          <Box sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: {
              xs: '1fr',
              sm: '1fr 1fr',
              md: 'repeat(3, 1fr)',
            },
          }}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Tabel Paling Aktif
              </Typography>
              <Typography variant="h6" fontWeight="bold">
                {insights.mostActiveTable}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Tabel dengan Nilai Tertinggi
              </Typography>
              <Typography variant="h6" fontWeight="bold">
                {insights.highestValueTable}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Kolom dengan Nilai Tertinggi
              </Typography>
              <Typography variant="h6" fontWeight="bold">
                {insights.highestValueColumn.columnTitle}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                di {insights.highestValueColumn.tableTitle}: {formatNumber(insights.highestValueColumn.value)}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </MuiCard>
    </Box>
  );
};

export default AdminDashboardPage;
