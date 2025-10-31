import React from 'react';
import { Box, Button, Card as MuiCard, CardContent, TextField, MenuItem, Select, InputLabel, FormControl, Stack, Typography, IconButton, Chip } from '@mui/material';
 
import { Edit as EditIcon, Delete as DeleteIcon, Save as SaveIcon, Close as CloseIcon } from '@mui/icons-material';
import toast from 'react-hot-toast';
import PageHeader from '@/components/layout/PageHeader';
import Modal from '@/components/ui/Modal';
import { useSpreadsheetStore } from '@/stores/spreadsheetStore';
import type { SpreadsheetColumn } from '@/stores/spreadsheetStore';
import { useNavigate } from 'react-router-dom';

const AdminSpreadsheetsPage: React.FC = () => {
  const navigate = useNavigate();
  const { tables, createTable } = useSpreadsheetStore();
  const { renameTable, deleteTableDeep } = useSpreadsheetStore();

  const [isOpen, setIsOpen] = React.useState(false);
  const [title, setTitle] = React.useState('');
  const [initialRows, setInitialRows] = React.useState('0');
  const [cols, setCols] = React.useState<Array<Omit<SpreadsheetColumn, 'id'>>>([
    { title: 'Name', type: 'text' },
    { title: 'Amount', type: 'number' },
  ]);

  const addCol = () => setCols(prev => [...prev, { title: `Column ${prev.length + 1}`, type: 'text' }]);
  const updateCol = (idx: number, updates: Partial<Omit<SpreadsheetColumn, 'id'>>) => {
    setCols(prev => prev.map((c, i) => i === idx ? { ...c, ...updates } : c));
  };
  const removeCol = (idx: number) => setCols(prev => prev.filter((_, i) => i !== idx));

  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editingText, setEditingText] = React.useState<string>('');
  const startRename = (id: string, current: string) => { setEditingId(id); setEditingText(current); };
  const cancelRename = () => { setEditingId(null); setEditingText(''); };
  const commitRename = () => { if (editingId && editingText.trim()) { renameTable(editingId, editingText.trim()); cancelRename(); } };

  // Enhance: search and sort
  const [query, setQuery] = React.useState('');
  const [sortBy, setSortBy] = React.useState<'updatedAt' | 'title'>('updatedAt');
  const [sortDir, setSortDir] = React.useState<'desc' | 'asc'>('desc');
  const filteredTables = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = tables.filter(t => !q || t.title.toLowerCase().includes(q));
    list = list.slice().sort((a, b) => {
      if (sortBy === 'title') {
        const cmp = a.title.localeCompare(b.title);
        return sortDir === 'asc' ? cmp : -cmp;
      }
      const at = new Date(a.updatedAt).getTime();
      const bt = new Date(b.updatedAt).getTime();
      return sortDir === 'asc' ? at - bt : bt - at;
    });
    return list;
  }, [tables, query, sortBy, sortDir]);
  const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');


  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || cols.length === 0) return;
    createTable({ title: title.trim(), columns: cols, initialRows: Number(initialRows) || 0 });
    setIsOpen(false);
    setTitle('');
    setInitialRows('0');
    setCols([{ title: 'Name', type: 'text' }, { title: 'Amount', type: 'number' }]);
    const slug = title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    navigate(`/admin/spreadsheets/${slug}`);
  };

  const confirmAndDelete = async (id: string, title: string) => {
    if (!confirm(`Delete table "${title}" and all its data? This action cannot be undone.`)) return;
    let toastId: string | undefined;
    try {
      toastId = toast.loading('Deleting table...');
      await deleteTableDeep(id, ({ rowsDeleted, monthsDeleted }) => {
        toast.loading(`Deleting... ${rowsDeleted} rows, ${monthsDeleted} months`, { id: toastId });
      });
      toast.success('Table deleted successfully', { id: toastId });
    } catch (e: any) {
      toast.error(e?.message || 'Failed to delete table', { id: toastId });
      // Fallback: ensure removal in local state (already optimistic), or we could refresh
    }
  };

  return (
    <Box>
      <PageHeader
        title="Spreadsheets"
        subtitle="Create and manage custom tables per month"
        actions={
          <Stack direction="row" spacing={1}>
            <Button variant="contained" onClick={() => setIsOpen(true)}>Create Table</Button>
          </Stack>
        }
      />

      <MuiCard sx={{ mb: 2 }}>
        <CardContent>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'stretch', sm: 'center' }}>
            <TextField
              size="small"
              placeholder="Search tables..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              sx={{ flex: 1, maxWidth: 420 }}
            />
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel id="sort-by">Sort By</InputLabel>
              <Select labelId="sort-by" label="Sort By" value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}>
                <MenuItem value="updatedAt">Last Updated</MenuItem>
                <MenuItem value="title">Title</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel id="sort-dir">Order</InputLabel>
              <Select labelId="sort-dir" label="Order" value={sortDir} onChange={(e) => setSortDir(e.target.value as any)}>
                <MenuItem value="desc">Desc</MenuItem>
                <MenuItem value="asc">Asc</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </CardContent>
      </MuiCard>

      {filteredTables.length === 0 ? (
        <MuiCard>
          <CardContent>
            <Typography variant="body2" color="text.secondary">No tables found.</Typography>
          </CardContent>
        </MuiCard>
      ) : (
        <Box sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: {
            xs: '1fr',
            sm: '1fr 1fr',
            md: 'repeat(3, 1fr)',
            lg: 'repeat(4, 1fr)'
          }
        }}>
          {filteredTables.map((t) => (
            <MuiCard
              key={t.id}
              variant="outlined"
              sx={{ height: '100%', display: 'flex', flexDirection: 'column', cursor: 'pointer' }}
              onClick={() => navigate(`/admin/spreadsheets/${slugify(t.title)}`)}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                  {editingId === t.id ? (
                    <TextField size="small" value={editingText} onChange={(e) => setEditingText(e.target.value)} onClick={(e) => e.stopPropagation()} sx={{ maxWidth: '100%' }} />
                  ) : (
                    <Typography variant="subtitle1" fontWeight={600} sx={{ pr: 1, wordBreak: 'break-word' }}>{t.title}</Typography>
                  )}
                  <Stack direction="row" spacing={0.5}>
                    {editingId === t.id ? (
                      <>
                        <IconButton size="small" color="primary" onClick={(e) => { e.stopPropagation(); commitRename(); }}><SaveIcon fontSize="small" /></IconButton>
                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); cancelRename(); }}><CloseIcon fontSize="small" /></IconButton>
                      </>
                    ) : (
                      <>
                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); startRename(t.id, t.title); }} aria-label="rename"><EditIcon fontSize="small" /></IconButton>
                        <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); confirmAndDelete(t.id, t.title); }} aria-label="delete"><DeleteIcon fontSize="small" /></IconButton>
                      </>
                    )}
                  </Stack>
                </Stack>
                <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                  <Chip size="small" label={`${t.columns.length} cols`} />
                  <Chip size="small" variant="outlined" label={new Date(t.updatedAt).toLocaleDateString()} />
                </Stack>
              </CardContent>
            </MuiCard>
          ))}
        </Box>
      )}

      <Modal open={isOpen} onClose={() => setIsOpen(false)} title="Create Table" size="small">
        <Box component="form" onSubmit={handleCreate} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField label="Table Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          <TextField label="Initial Rows" type="number" value={initialRows} onChange={(e) => setInitialRows(e.target.value)} />
          <Typography variant="subtitle2">Columns</Typography>
          <Stack spacing={1}>
            {cols.map((c, idx) => (
              <Stack key={idx} direction="row" spacing={1} alignItems="center">
                <TextField label="Title" value={c.title} onChange={(e) => updateCol(idx, { title: e.target.value })} sx={{ flex: 1 }} />
                <FormControl sx={{ minWidth: 140 }}>
                  <InputLabel id={`col-type-${idx}`}>Type</InputLabel>
                  <Select labelId={`col-type-${idx}`} label="Type" value={c.type} onChange={(e) => updateCol(idx, { type: (e.target.value as any) })}>
                    <MenuItem value="text">Text</MenuItem>
                    <MenuItem value="number">Number</MenuItem>
                    <MenuItem value="date">Date</MenuItem>
                    <MenuItem value="select">Select</MenuItem>
                  </Select>
                </FormControl>
                <Button color="error" onClick={() => removeCol(idx)}>Remove</Button>
              </Stack>
            ))}
            <Button onClick={addCol}>Add Column</Button>
          </Stack>
          <Stack direction="row" spacing={2}>
            <Box sx={{ flexGrow: 1 }} />
            <Button variant="text" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={!title || cols.length === 0}>Create</Button>
          </Stack>
        </Box>
      </Modal>
    </Box>
  );
};

export default AdminSpreadsheetsPage;


