import React from 'react';
import { Box, Button, Card as MuiCard, CardContent, IconButton, MenuItem, Select, InputLabel, FormControl, TextField, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Stack, Menu, TablePagination } from '@mui/material';
import Spreadsheet from 'react-spreadsheet';
import type { CellBase, Matrix } from 'react-spreadsheet';
import { Add as AddIcon, NavigateBefore as PrevIcon, NavigateNext as NextIcon, Upload as UploadIcon, Download as DownloadIcon, MoreVert as MoreVertIcon } from '@mui/icons-material';
import PageHeader from '@/components/layout/PageHeader';
import Modal from '@/components/ui/Modal';
import { useParams } from 'react-router-dom';
import { useSpreadsheetStore } from '@/stores/spreadsheetStore';
import { exportToExcel, exportToCSV, importFromExcel, importFromCSV } from '@/utils/excelService';
import toast from 'react-hot-toast';

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

function formatDisplayValue(value: any, type: 'text' | 'number' | 'date' | 'select', format?: string): string {
  if (value === '' || value === undefined || value === null) return '';
  if (!format || format === '') {
    if (type === 'number') return new Intl.NumberFormat('id-ID', { style: 'decimal', maximumFractionDigits: 2 }).format(Number(value));
    return String(value);
  }
  const [fmtType, variant] = format.split(':');
  if (fmtType === 'number') {
    const n = Number(value);
    if (!Number.isFinite(n)) return '';
    if (variant === 'currency') return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);
    if (variant === 'percent') return `${new Intl.NumberFormat('id-ID', { style: 'percent', maximumFractionDigits: 2 }).format(n / 100)}`;
    return new Intl.NumberFormat('id-ID', { style: 'decimal', maximumFractionDigits: 2 }).format(n);
  }
  if (fmtType === 'date') {
    const s = String(value);
    // value stored as YYYY-MM-DD; render to requested display
    if (variant === 'dd/MM/yyyy') {
      if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
        const [y, m, d] = s.split('-');
        return `${d}/${m}/${y}`;
      }
      const d = new Date(s);
      if (!isNaN(d.getTime())) {
        const dd = String(d.getDate()).padStart(2, '0');
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const yyyy = d.getFullYear();
        return `${dd}/${mm}/${yyyy}`;
      }
      return s;
    }
    // fallback or yyyy-MM-dd
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    const d = new Date(s);
    if (!isNaN(d.getTime())) {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    }
    return s;
  }
  if (fmtType === 'text') {
    const s = String(value);
    if (variant === 'uppercase') return s.toUpperCase();
    if (variant === 'lowercase') return s.toLowerCase();
    return s;
  }
  return String(value);
}

const SpreadsheetEditorPage: React.FC = () => {
  const { id } = useParams();
  const routeKey = id as string;
  const { tables, getRows, addRow, addColumn, setActiveMonth, activeMonthByTable, getTotals, renameTable, setRows, setColumns, getEditMode, setEditMode } = useSpreadsheetStore();
  const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const table = tables.find(t => t.id === routeKey) || tables.find(t => slugify(t.title) === routeKey);
  const tableId = table?.id as string;

  const month = table ? activeMonthByTable[tableId] : undefined;
  const monthOptions = React.useMemo(() => monthKeyOptions(), []);
  const selectedMonth = month || monthOptions[0];
  React.useEffect(() => {
    if (!month) setActiveMonth(tableId, selectedMonth);
  }, [month, selectedMonth, setActiveMonth, tableId]);

  const rows = table ? getRows(tableId, selectedMonth) : [];
  const isEditMode = table ? getEditMode(tableId) : false;
  const totals = table ? getTotals(tableId, selectedMonth) : {};
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);
  const displayedRows = React.useMemo(() => {
    if (isEditMode) return rows;
    const start = page * rowsPerPage;
    return rows.slice(start, start + rowsPerPage);
  }, [rows, isEditMode, page, rowsPerPage]);

  React.useEffect(() => {
    setPage(0);
  }, [isEditMode, selectedMonth, tableId]);

  const handleAddColumn = () => {
    addColumn(tableId, { title: `Column ${table?.columns.length ? table.columns.length + 1 : 1}`, type: 'text' });
  };

  const gotoPrevMonth = () => {
    const idx = monthOptions.indexOf(selectedMonth);
    const nextIdx = Math.min(monthOptions.length - 1, idx + 1);
    setActiveMonth(tableId, monthOptions[nextIdx]);
  };

  const gotoNextMonth = () => {
    const idx = monthOptions.indexOf(selectedMonth);
    const prevIdx = Math.max(0, idx - 1);
    setActiveMonth(tableId, monthOptions[prevIdx]);
  };

  // Excel/CSV Export Functions and actions menu
  const [actionMenuAnchor, setActionMenuAnchor] = React.useState<null | HTMLElement>(null);
  const actionMenuOpen = Boolean(actionMenuAnchor);
  const openActionMenu = (event: React.MouseEvent<HTMLElement>) => setActionMenuAnchor(event.currentTarget);
  const closeActionMenu = () => setActionMenuAnchor(null);

  // Columns editor modal
  const [isColsOpen, setIsColsOpen] = React.useState(false);
  const [colsDraft, setColsDraft] = React.useState<Array<{ id?: string; title: string; format?: string }>>([]);
  const openColsEditor = () => {
    if (!table) return;
    setColsDraft(table.columns.map(c => ({ id: c.id, title: c.title, format: c.format })));
    setIsColsOpen(true);
  };
  const addDraftCol = () => {
    const nextIndex = (table?.columns.length || 0) + colsDraft.filter(c => !c.id).length + 1;
    setColsDraft(prev => [...prev, { title: `Column ${nextIndex}`, format: '' }]);
  };
  const updateDraftTitle = (idx: number, title: string) => {
    setColsDraft(prev => prev.map((c, i) => i === idx ? { ...c, title } : c));
  };
  const updateDraftFormat = (idx: number, format: string) => {
    setColsDraft(prev => prev.map((c, i) => i === idx ? { ...c, format } : c));
  };
  const saveColsEditor = async () => {
    if (!table) return;
    try {
      // Update titles for existing columns
      colsDraft.forEach((d) => {
        if (d.id) {
          const orig = table.columns.find(c => c.id === d.id);
          const newTitle = (d.title || '').trim() || 'Untitled';
          if (orig) {
            const updates: any = {};
            if (orig.title !== newTitle) updates.title = newTitle;
            if (d.format !== undefined && d.format !== orig.format) updates.format = d.format;
            if (Object.keys(updates).length) useSpreadsheetStore.getState().updateColumn(tableId, d.id, updates);
          }
        }
      });
      // Add new columns
      for (const d of colsDraft) {
        if (!d.id) {
          const newTitle = (d.title || '').trim() || 'Untitled';
          useSpreadsheetStore.getState().addColumn(tableId, { title: newTitle, type: 'text', format: d.format || '' });
        }
      }
      setIsColsOpen(false);
      closeActionMenu();
      toast.success('Columns updated');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to update columns');
    }
  };

  // Column type editing moved out from header inline controls in react-spreadsheet mode

  const handleExportExcel = () => {
    if (!table) return;
    try {
      exportToExcel(table, rows, selectedMonth);
      toast.success('Exported to Excel successfully');
    } catch (error) {
      toast.error('Failed to export to Excel');
    }
    closeActionMenu();
  };

  const handleExportCSV = () => {
    if (!table) return;
    try {
      exportToCSV(table, rows, selectedMonth);
      toast.success('Exported to CSV successfully');
    } catch (error) {
      toast.error('Failed to export to CSV');
    }
    closeActionMenu();
  };

  // Import Functions
  const csvInputRef = React.useRef<HTMLInputElement | null>(null);
  const excelInputRef = React.useRef<HTMLInputElement | null>(null);

  const [isImporting, setIsImporting] = React.useState(false);

  const triggerImportExcel = () => excelInputRef.current?.click();
  const triggerImportCSV = () => csvInputRef.current?.click();

  const onImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    
    setIsImporting(true);
    try {
      const { columns, rows: importedRows } = await importFromExcel(f);
      
      // Update columns if different or table is empty
      if (table && (table.columns.length === 0 || confirm('This will replace all columns and data. Continue?'))) {
        setColumns(tableId, columns);
        setRows(tableId, selectedMonth, importedRows);
        toast.success('Imported from Excel successfully');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to import Excel file');
    } finally {
      e.target.value = '';
      setIsImporting(false);
    }
  };

  const onImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    
    setIsImporting(true);
    try {
      const { columns, rows: importedRows } = await importFromCSV(f);
      
      // Update columns if different or table is empty
      if (table && (table.columns.length === 0 || confirm('This will replace all columns and data. Continue?'))) {
        setColumns(tableId, columns);
        setRows(tableId, selectedMonth, importedRows);
        toast.success('Imported from CSV successfully');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to import CSV file');
    } finally {
      e.target.value = '';
      setIsImporting(false);
    }
  };

  if (!table) {
    return (
      <Box>
        <Typography variant="body2" color="text.secondary">Table not found.</Typography>
      </Box>
    );
  }

  const [editingTitle, setEditingTitle] = React.useState<string>(table?.title || '');

  React.useEffect(() => {
    setEditingTitle(table?.title || '');
  }, [table?.title]);

  return (
    <Box>
      <PageHeader
        title={table.title}
        subtitle="Edit columns, rows, and values per month"
        actions={
          <Stack direction="row" spacing={1}>
            <IconButton onClick={gotoPrevMonth} aria-label="previous month"><PrevIcon /></IconButton>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel id="month-label">Month</InputLabel>
              <Select labelId="month-label" label="Month" value={selectedMonth} onChange={(e) => setActiveMonth(tableId, e.target.value)}>
                {monthOptions.map(mk => (
                  <MenuItem key={mk} value={mk}>{mk}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <IconButton onClick={gotoNextMonth} aria-label="next month"><NextIcon /></IconButton>
            <Button variant={isEditMode ? 'outlined' : 'contained'} onClick={() => setEditMode(tableId, !isEditMode)}>
              {isEditMode ? 'View Mode' : 'Edit Mode'}
            </Button>
            {/* Actions Menu (Edit mode only) */}
            {isEditMode ? (
              <>
                <input ref={excelInputRef} type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={onImportExcel} />
                <input ref={csvInputRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={onImportCSV} />
                <IconButton aria-label="more actions" onClick={openActionMenu}>
                  <MoreVertIcon />
                </IconButton>
                <Menu anchorEl={actionMenuAnchor} open={actionMenuOpen} onClose={closeActionMenu}>
                  <MenuItem onClick={() => { openColsEditor(); }}>
                    Edit Columns
                  </MenuItem>
                  <MenuItem onClick={() => { handleAddColumn(); closeActionMenu(); }}>
                    <AddIcon fontSize="small" style={{ marginRight: 8 }} />
                    Add Column
                  </MenuItem>
                  <MenuItem onClick={() => { addRow(tableId, selectedMonth); closeActionMenu(); }}>
                    <AddIcon fontSize="small" style={{ marginRight: 8 }} />
                    Add Row
                  </MenuItem>
                  <MenuItem onClick={() => { triggerImportExcel(); }} disabled={isImporting}>
                    <UploadIcon fontSize="small" style={{ marginRight: 8 }} />
                    Import Excel
                  </MenuItem>
                  <MenuItem onClick={() => { triggerImportCSV(); }} disabled={isImporting}>
                    <UploadIcon fontSize="small" style={{ marginRight: 8 }} />
                    Import CSV
                  </MenuItem>
                  <MenuItem onClick={handleExportExcel} disabled={rows.length === 0}>
                    <DownloadIcon fontSize="small" style={{ marginRight: 8 }} />
                    Export to Excel (.xlsx)
                  </MenuItem>
                  <MenuItem onClick={handleExportCSV} disabled={rows.length === 0}>
                    <DownloadIcon fontSize="small" style={{ marginRight: 8 }} />
                    Export to CSV
                  </MenuItem>
                </Menu>
              </>
            ) : null}
          </Stack>
        }
      />

      {isEditMode && (
        <MuiCard sx={{ mb: 2 }}>
          <CardContent>
            <Stack direction="row" spacing={1} alignItems="center">
              <TextField size="small" label="Table Title" value={editingTitle} onChange={(e) => setEditingTitle(e.target.value)} sx={{ maxWidth: 420 }} />
              <Button variant="contained" onClick={() => renameTable(tableId, editingTitle)} disabled={!editingTitle.trim()}>Save Title</Button>
            </Stack>
          </CardContent>
        </MuiCard>
      )}

      <MuiCard>
        <CardContent>
          {isEditMode ? (
            <Box>
              {/* Column header actions (rename/type/add next) remain accessible via previous header UI, but replaced by column labels below */}
              <Box sx={{ mb: 1 }} />
              {(() => {
                // Build matrix from rows and columns
                const makeViewer = (col: { id: string; type: 'text' | 'number' | 'date' | 'select'; format?: string }) => {
                  const Viewer: React.FC<{ cell: CellBase<any> }> = ({ cell }) => (
                    <span>{formatDisplayValue(cell?.value, col.type, col.format)}</span>
                  );
                  return Viewer;
                };
                const matrix: Matrix<CellBase<any>> = (rows || []).map(r =>
                  table.columns.map(col => ({ value: r.cells[col.id] ?? '', DataViewer: makeViewer(col) as any }))
                );
                const columnLabels = table.columns.map(c => c.title);
                const rowLabels = (rows || []).map((_, i) => String(i + 1));
                const onMatrixChange = (next: Matrix<CellBase<any>>) => {
                  const nextRows = (next || []).map((rowCells, idx) => {
                    const base = rows[idx];
                    const cells: Record<string, any> = {};
                    rowCells.forEach((cell, cidx) => {
                      const col = table.columns[cidx];
                      let v: any = cell?.value ?? '';
                      if (col.type === 'number') {
                        const n = typeof v === 'number' ? v : Number(v);
                        v = Number.isFinite(n) ? n : '';
                      } else if (col.type === 'date') {
                        v = String(v || '');
                      } else if (col.type === 'select') {
                        v = String(v || '');
                      } else {
                        v = String(v ?? '');
                      }
                      cells[col.id] = v;
                    });
                    return { id: base?.id || `row_${idx}`, orderIndex: idx, cells };
                  });
                  setRows(tableId, selectedMonth, nextRows);
                };
                return (
                  <Spreadsheet
                    data={matrix}
                    onChange={onMatrixChange}
                    columnLabels={columnLabels}
                    rowLabels={rowLabels}
                  />
                );
              })()}
              {/* Row operations below spreadsheet */}
              <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                <Button startIcon={<AddIcon />} onClick={() => addRow(tableId, selectedMonth)}>Add Row</Button>
                <Button startIcon={<AddIcon />} onClick={handleAddColumn}>Add Column</Button>
              </Stack>
              {/* Totals view */}
              {table.columns.some(c => c.type === 'number') && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>Totals</Typography>
                  <Stack direction="row" spacing={2} flexWrap="wrap">
                    {table.columns.map(col => (
                      col.type === 'number' ? (
                        <Box key={col.id}>
                          <Typography variant="caption" color="text.secondary">{col.title}</Typography>
                          <Typography variant="body2" fontWeight={600}>
                            {new Intl.NumberFormat('id-ID', { style: 'decimal', maximumFractionDigits: 2 }).format(totals[col.id] || 0)}
                          </Typography>
                        </Box>
                      ) : null
                    ))}
                  </Stack>
                </Box>
              )}
            </Box>
          ) : (
            <TableContainer component={Paper}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell 
                      sx={{ 
                        minWidth: 60, 
                        maxWidth: 60, 
                        backgroundColor: (theme) => theme.palette.action.selected,
                        fontWeight: 'bold',
                        textAlign: 'center'
                      }}
                    >
                      #
                    </TableCell>
                    {table.columns.map(col => (
                      <TableCell key={col.id} sx={{ minWidth: 140 }}>
                        <Typography variant="subtitle2" fontWeight={600}>{col.title}</Typography>
                      </TableCell>
                    ))}
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {displayedRows.map((row, idx) => (
                    <TableRow key={row.id} hover>
                      <TableCell 
                        sx={{ 
                          backgroundColor: (theme) => theme.palette.action.hover,
                          textAlign: 'center',
                          fontWeight: 500,
                          width: 60,
                          maxWidth: 60,
                          position: 'relative',
                          overflow: 'visible'
                        }}
                      >
                        {page * rowsPerPage + idx + 1}
                      </TableCell>
                      {table.columns.map(col => (
                        <TableCell key={col.id}>
                          <Typography variant="body2">
                            {formatDisplayValue(row.cells[col.id], col.type as any, col.format)}
                          </Typography>
                        </TableCell>
                      ))}
                      <TableCell align="right"></TableCell>
                    </TableRow>
                  ))}
                  {table.columns.some(c => c.type === 'number') && (
                    <TableRow sx={{ position: 'sticky', bottom: 0, backgroundColor: (theme) => theme.palette.background.paper }}>
                      <TableCell sx={{ backgroundColor: (theme) => theme.palette.action.hover }}></TableCell>
                      {table.columns.map(col => (
                        <TableCell key={col.id}>
                          {col.type === 'number' ? (
                            <Typography variant="body2" fontWeight={600}>
                              {(() => {
                                const total = totals[col.id] || 0;
                                return formatDisplayValue(total, 'number', col.format);
                              })()}
                            </Typography>
                          ) : null}
                        </TableCell>
                      ))}
                      <TableCell align="right">
                        <Typography variant="body2" color="text.secondary">Totals</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
          {!isEditMode && (
            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50]}
              component="div"
              count={rows.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={(_, newPage) => setPage(newPage)}
              onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
            />
          )}
        </CardContent>
      </MuiCard>

      {/* Columns Editor Modal */}
      <Modal open={isColsOpen} onClose={() => setIsColsOpen(false)} title="Edit Columns" size="small">
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="body2" color="text.secondary">Edit column titles and add new columns.</Typography>
          <Stack spacing={1}>
            {colsDraft.map((c, idx) => (
              <Stack key={c.id || `new-${idx}`} direction="row" spacing={1} alignItems="center">
                <TextField
                  size="small"
                  label={c.id ? 'Title' : 'New Column Title'}
                  value={c.title}
                  onChange={(e) => updateDraftTitle(idx, e.target.value)}
                  sx={{ flex: 1 }}
                />
                <FormControl size="small" sx={{ minWidth: 180 }}>
                  <InputLabel id={`fmt-${idx}`} shrink>Format</InputLabel>
                  <Select
                    labelId={`fmt-${idx}`}
                    label="Format"
                    value={c.format || ''}
                    onChange={(e) => updateDraftFormat(idx, e.target.value as string)}
                    displayEmpty
                  >
                    <MenuItem value="">
                      <em>Default</em>
                    </MenuItem>
                    <MenuItem value="number:decimal">Number - Decimal</MenuItem>
                    <MenuItem value="number:currency">Number - Currency (IDR)</MenuItem>
                    <MenuItem value="number:percent">Number - Percent</MenuItem>
                    <MenuItem value="date:yyyy-MM-dd">Date - YYYY-MM-DD</MenuItem>
                    <MenuItem value="date:dd/MM/yyyy">Date - DD/MM/YYYY</MenuItem>
                    <MenuItem value="text:uppercase">Text - UPPERCASE</MenuItem>
                    <MenuItem value="text:lowercase">Text - lowercase</MenuItem>
                  </Select>
                </FormControl>
                {c.id ? (
                  <Typography variant="caption" color="text.secondary">existing</Typography>
                ) : (
                  <Typography variant="caption" color="primary.main">new</Typography>
                )}
              </Stack>
            ))}
            <Button startIcon={<AddIcon />} onClick={addDraftCol}>Add Column</Button>
          </Stack>
          <Stack direction="row" spacing={2}>
            <Box sx={{ flexGrow: 1 }} />
            <Button variant="text" onClick={() => setIsColsOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={saveColsEditor}>Save</Button>
          </Stack>
        </Box>
      </Modal>
    </Box>
  );
};

export default SpreadsheetEditorPage;


