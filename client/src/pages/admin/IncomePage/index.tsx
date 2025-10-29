import React from 'react';
import { Box, Typography, Card as MuiCard, CardContent, Button, TextField, Chip, Stack, IconButton, Tooltip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination, Card } from '@mui/material';
import { Edit as EditIcon, DeleteOutline as DeleteIcon } from '@mui/icons-material';
import PageHeader from '@/components/layout/PageHeader';
import { useIncomeStore } from '@/stores/incomeStore';
import { useBalanceStore } from '@/stores/balanceStore';
import { useReimbursementStore } from '@/stores/reimbursementStore';
import Modal from '@/components/ui/Modal';

const AdminIncomePage: React.FC = () => {
  const { incomes, fetchIncomes, createIncome, updateIncome, deleteIncome, isLoading } = useIncomeStore();
  const { currentBalance, recalculate } = useBalanceStore();
  const { reimbursements } = useReimbursementStore();

  const [isAddOpen, setIsAddOpen] = React.useState(false);
  const [form, setForm] = React.useState({ date: new Date().toISOString().slice(0,10), amount: '', category: '', description: '' });
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [editForm, setEditForm] = React.useState({ id: '', date: new Date().toISOString().slice(0,10), amount: '', category: '', description: '' });

  React.useEffect(() => { fetchIncomes(); }, [fetchIncomes]);
  React.useEffect(() => { recalculate(incomes, reimbursements); }, [incomes, reimbursements, recalculate]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.amount) return;
    await createIncome({ date: new Date(form.date), amount: Number(form.amount), category: form.category || undefined, description: form.description || undefined });
    setIsAddOpen(false);
    setForm({ date: new Date().toISOString().slice(0,10), amount: '', category: '', description: '' });
  };

  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);

  const paginated = React.useMemo(() => {
    const start = page * rowsPerPage;
    return incomes.slice(start, start + rowsPerPage);
  }, [incomes, page, rowsPerPage]);

  return (
    <Box>
      <PageHeader title="Income" subtitle="Manage incomes and balance (dummy)" actions={<Button variant="contained" onClick={() => setIsAddOpen(true)}>Add Income</Button>} />

      <MuiCard sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <Chip color="primary" label={`Current: ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(currentBalance)}`} />
            <Box sx={{ flexGrow: 1 }} />
          </Box>
        </CardContent>
      </MuiCard>

      {incomes.length === 0 ? (
        <MuiCard>
          <CardContent>
            <Typography variant="body2" color="text.secondary">No incomes yet.</Typography>
          </CardContent>
        </MuiCard>
      ) : (
        <Card>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginated.map(inc => (
                  <TableRow key={inc.id} hover>
                    <TableCell>
                      <Typography variant="body2">{new Date(inc.date).toLocaleDateString('id-ID')}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{inc.category || '-'}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">{inc.description || '-'}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(inc.amount)}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => {
                          setEditForm({
                            id: inc.id,
                            date: new Date(inc.date).toISOString().slice(0,10),
                            amount: String(inc.amount),
                            category: inc.category || '',
                            description: inc.description || '',
                          });
                          setIsEditOpen(true);
                        }}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" color="error" onClick={() => deleteIncome(inc.id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={incomes.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
          />
        </Card>
      )}

      <Modal open={isAddOpen} onClose={() => setIsAddOpen(false)} title="Add Income" size="small">
        <Box component="form" onSubmit={handleAdd} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField label="Date" type="date" value={form.date} onChange={(e) => setForm(prev => ({ ...prev, date: e.target.value }))} />
          <TextField label="Amount" type="number" value={form.amount} onChange={(e) => setForm(prev => ({ ...prev, amount: e.target.value }))} required />
          <TextField label="Category (optional)" value={form.category} onChange={(e) => setForm(prev => ({ ...prev, category: e.target.value }))} />
          <TextField label="Description (optional)" value={form.description} onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))} />
          <Stack direction="row" spacing={2}>
            <Box sx={{ flexGrow: 1 }} />
            <Button variant="text" onClick={() => setIsAddOpen(false)}>Cancel</Button>
            <Button variant="contained" type="submit" disabled={isLoading || !form.amount}>Save</Button>
          </Stack>
        </Box>
      </Modal>

      <Modal open={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Income" size="small">
        <Box component="form" onSubmit={async (e) => {
          e.preventDefault();
          if (!editForm.id || !editForm.amount) return;
          await updateIncome(editForm.id, {
            date: new Date(editForm.date),
            amount: Number(editForm.amount),
            category: editForm.category || undefined,
            description: editForm.description || undefined,
          });
          setIsEditOpen(false);
        }} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField label="Date" type="date" value={editForm.date} onChange={(e) => setEditForm(prev => ({ ...prev, date: e.target.value }))} />
          <TextField label="Amount" type="number" value={editForm.amount} onChange={(e) => setEditForm(prev => ({ ...prev, amount: e.target.value }))} required />
          <TextField label="Category (optional)" value={editForm.category} onChange={(e) => setEditForm(prev => ({ ...prev, category: e.target.value }))} />
          <TextField label="Description (optional)" value={editForm.description} onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))} />
          <Stack direction="row" spacing={2}>
            <Box sx={{ flexGrow: 1 }} />
            <Button variant="text" onClick={() => setIsEditOpen(false)}>Cancel</Button>
            <Button variant="contained" type="submit" disabled={isLoading || !editForm.amount}>Save</Button>
          </Stack>
        </Box>
      </Modal>
    </Box>
  );
};

export default AdminIncomePage;


