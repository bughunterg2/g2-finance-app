import React from 'react';
import { Box, Typography, Button, Card as MuiCard, CardContent, Chip, TextField, IconButton, Stack, Checkbox } from '@mui/material';
// import { useNavigate } from 'react-router-dom';
import PageHeader from '@/components/layout/PageHeader';
import { useCategoryStore } from '@/stores/categoryStore';
import EmptyState from '@/components/ui/EmptyState';
import { Add as AddIcon, Edit as EditIcon } from '@mui/icons-material';
import Modal from '@/components/ui/Modal';

const AdminCategoriesPage: React.FC = () => {
  // const navigate = useNavigate();

  const { categories, fetchCategories, createCategory, updateCategory, deleteCategory, isLoading } = useCategoryStore();
  const [search, setSearch] = React.useState('');
  const [isNewOpen, setIsNewOpen] = React.useState(false);
  const [form, setForm] = React.useState({
    name: '',
    description: '',
    budget: '' as string | number,
  });

  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editForm, setEditForm] = React.useState({
    name: '',
    description: '',
    budget: '' as string | number,
  });

  const niceColors = [
    '#3b82f6', // blue
    '#22c55e', // green
    '#f59e0b', // amber
    '#ef4444', // red
    '#8b5cf6', // purple
    '#06b6d4', // cyan
    '#f97316', // orange
    '#84cc16', // lime
    '#ec4899', // pink
    '#6b7280', // gray
  ];

  const getRandomColor = () => niceColors[Math.floor(Math.random() * niceColors.length)];

  const openNew = () => setIsNewOpen(true);
  const closeNew = () => { setIsNewOpen(false); setForm({ name: '', description: '', budget: '' }); };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.description) return;
    await createCategory({
      name: form.name,
      description: form.description,
      icon: 'work',
      color: getRandomColor(),
      budget: form.budget ? Number(form.budget) : undefined,
    });
    closeNew();
  };

  const [isSelecting, setIsSelecting] = React.useState(false);
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const startSelecting = () => { setIsSelecting(true); setSelectedIds(new Set()); };
  const cancelSelecting = () => { setIsSelecting(false); setSelectedIds(new Set()); };
  const confirmDeleteSelected = async () => {
    const ids = Array.from(selectedIds);
    for (const id of ids) {
      // Soft delete via store action
      await deleteCategory(id);
    }
    cancelSelecting();
  };

  const openEdit = (cat: { id: string; name: string; description: string; budget?: number }) => {
    setEditingId(cat.id);
    setEditForm({
      name: cat.name,
      description: cat.description,
      budget: typeof cat.budget === 'number' ? String(cat.budget) : '',
    });
    setIsEditOpen(true);
  };
  const closeEdit = () => {
    setIsEditOpen(false);
    setEditingId(null);
    setEditForm({ name: '', description: '', budget: '' });
  };
  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId || !editForm.name || !editForm.description) return;
    await updateCategory(editingId, {
      name: editForm.name,
      description: editForm.description,
      budget: editForm.budget ? Number(editForm.budget) : undefined,
    });
    closeEdit();
  };

  React.useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const filtered = React.useMemo(() => {
    const term = search.toLowerCase();
    return categories
      .filter(c => c.isActive)
      .filter(c => !term || c.name.toLowerCase().includes(term) || c.description.toLowerCase().includes(term));
  }, [categories, search]);

  return (
    <Box>
      <PageHeader
        title="Categories"
        subtitle="Manage expense categories"
        actions={
          <Stack direction="row" spacing={1}>
            {isSelecting ? (
              <>
                <Button variant="text" onClick={cancelSelecting}>Cancel</Button>
                <Button variant="contained" color="error" disabled={selectedIds.size === 0} onClick={confirmDeleteSelected}>Delete Selected</Button>
              </>
            ) : (
              <>
                <Button variant="outlined" color="error" onClick={startSelecting}>Delete</Button>
                <Button variant="contained" startIcon={<AddIcon />} onClick={openNew}>New Category</Button>
              </>
            )}
          </Stack>
        }
      />

      {/* Filters */}
      <MuiCard sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <TextField size="small" placeholder="Search categories..." value={search} onChange={(e) => setSearch(e.target.value)} />
            <Box sx={{ flexGrow: 1 }} />
            <Chip label={`Active: ${categories.filter(c => c.isActive).length}`} />
            <Chip label={`Inactive: ${categories.filter(c => !c.isActive).length}`} />
          </Box>
        </CardContent>
      </MuiCard>

      {isLoading ? (
        <Typography variant="body2" color="text.secondary">Loading...</Typography>
      ) : filtered.length === 0 ? (
        <EmptyState title="No categories" description="Try changing the search term or add a new category." actionLabel="New Category" onAction={openNew} />
      ) : (
        <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)' } }}>
          {filtered.map(cat => (
            <Box key={cat.id}>
              <MuiCard>
                <CardContent onClick={isSelecting ? () => toggleSelect(cat.id) : undefined} sx={{ cursor: isSelecting ? 'pointer' : 'default' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {isSelecting && (
                        <Checkbox
                          size="small"
                          checked={selectedIds.has(cat.id)}
                          onChange={(e) => { e.stopPropagation(); toggleSelect(cat.id); }}
                          onClick={(e) => e.stopPropagation()}
                          sx={{ mr: 0.5 }}
                        />
                      )}
                      <Box sx={{ width: 28, height: 28, borderRadius: '50%', bgcolor: cat.color }} />
                      <Typography variant="subtitle1" fontWeight="bold">{cat.name}</Typography>
                    </Box>
                    {!isSelecting && (
                      <IconButton size="small" aria-label="edit" onClick={() => openEdit(cat)}><EditIcon fontSize="small" /></IconButton>
                    )}
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                    {cat.description}
                  </Typography>
                  {typeof cat.budget === 'number' && (
                    <Typography variant="body2">
                      Budget: {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(cat.budget)}
                    </Typography>
                  )}
                </CardContent>
              </MuiCard>
            </Box>
          ))}
        </Box>
      )}

      <Modal open={isNewOpen} onClose={closeNew} title="New Category" size="small">
        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField
            label="Name"
            value={form.name}
            onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
            required
            fullWidth
          />
          <TextField
            label="Description"
            value={form.description}
            onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
            required
            fullWidth
            multiline
            minRows={2}
          />
          
          <TextField
            label="Budget (optional)"
            type="number"
            value={form.budget}
            onChange={(e) => setForm(prev => ({ ...prev, budget: e.target.value }))}
            fullWidth
            inputProps={{ min: 0 }}
          />
          <Stack direction="row" spacing={2} sx={{ pt: 1 }}>
            <Box sx={{ flexGrow: 1 }} />
            <Button variant="text" onClick={closeNew} disabled={isLoading}>Cancel</Button>
            <Button variant="contained" type="submit" disabled={isLoading || !form.name || !form.description}>Save</Button>
          </Stack>
        </Box>
      </Modal>

      <Modal open={isEditOpen} onClose={closeEdit} title="Edit Category" size="small">
        <Box component="form" onSubmit={handleSubmitEdit} sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField
            label="Name"
            value={editForm.name}
            onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
            required
            fullWidth
          />
          <TextField
            label="Description"
            value={editForm.description}
            onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
            required
            fullWidth
            multiline
            minRows={2}
          />
          <TextField
            label="Budget (optional)"
            type="number"
            value={editForm.budget}
            onChange={(e) => setEditForm(prev => ({ ...prev, budget: e.target.value }))}
            fullWidth
            inputProps={{ min: 0 }}
          />
          <Stack direction="row" spacing={2} sx={{ pt: 1 }}>
            <Box sx={{ flexGrow: 1 }} />
            <Button variant="text" onClick={closeEdit} disabled={isLoading}>Cancel</Button>
            <Button variant="contained" type="submit" disabled={isLoading || !editForm.name || !editForm.description}>Save</Button>
          </Stack>
        </Box>
      </Modal>
    </Box>
  );
};

export default AdminCategoriesPage;
