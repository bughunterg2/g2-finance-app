import React from 'react';
import { Box, Typography, Button, Chip, TextField, MenuItem, Card as MuiCard, CardContent, List, ListItem, ListItemText, Select, FormControl, InputLabel, Pagination, Stack } from '@mui/material';
// import { useNavigate } from 'react-router-dom';
import PageHeader from '@/components/layout/PageHeader';
import { useUserStore } from '@/stores/userStore';
import EmptyState from '@/components/ui/EmptyState';
import { TableSkeleton } from '@/components/ui/LoadingSkeleton';
import Modal from '@/components/ui/Modal';

const AdminUsersPage: React.FC = () => {
  // const navigate = useNavigate();
  const { users, fetchUsers, updateRole, toggleActive, inviteUser, isLoading } = useUserStore();

  const [search, setSearch] = React.useState('');
  const [role, setRole] = React.useState<'all'|'admin'|'agent'>('all');
  const [status, setStatus] = React.useState<'all'|'active'|'inactive'>('all');
  const [page, setPage] = React.useState(1);
  const pageSize = 10;

  const [isAddOpen, setIsAddOpen] = React.useState(false);
  const [form, setForm] = React.useState({
    name: '',
    email: '',
    role: 'agent' as 'admin' | 'agent',
    division: '',
    phoneNumber: '',
  });

  const resetForm = () => setForm({ name: '', email: '', role: 'agent', division: '', phoneNumber: '' });
  const openAdd = () => setIsAddOpen(true);
  const closeAdd = () => { setIsAddOpen(false); resetForm(); };

  const handleSubmitAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.division) return;
    await inviteUser({
      name: form.name,
      email: form.email,
      role: form.role,
      division: form.division,
      phoneNumber: form.phoneNumber || undefined,
    });
    closeAdd();
  };

  React.useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const filtered = React.useMemo(() => {
    const term = search.toLowerCase();
    return users
      .filter(u => (role === 'all' ? true : u.role === role))
      .filter(u => (status === 'all' ? true : status === 'active' ? u.isActive : !u.isActive))
      .filter(u => !term || u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term))
      .sort((a,b) => (b.lastLoginAt?.getTime() || 0) - (a.lastLoginAt?.getTime() || 0));
  }, [users, role, status, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  React.useEffect(() => { setPage(1); }, [role, status, search]);

  return (
    <Box>
      <PageHeader
        title="Users"
        subtitle="Manage user accounts"
        actions={<Button variant="contained" onClick={openAdd}>Add User</Button>}
      />

      {/* Filters */}
      <MuiCard sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <TextField size="small" placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} />
            <FormControl size="small">
              <InputLabel id="role-label">Role</InputLabel>
              <Select labelId="role-label" value={role} label="Role" onChange={(e) => setRole(e.target.value as any)}>
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="agent">Agent</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small">
              <InputLabel id="status-label">Status</InputLabel>
              <Select labelId="status-label" value={status} label="Status" onChange={(e) => setStatus(e.target.value as any)}>
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </Select>
            </FormControl>
            <Box sx={{ flexGrow: 1 }} />
            <Chip label={`Total: ${users.length}`} />
            <Chip label={`Admins: ${users.filter(u => u.role==='admin').length}`} />
            <Chip label={`Agents: ${users.filter(u => u.role==='agent').length}`} />
          </Box>
        </CardContent>
      </MuiCard>

      <MuiCard>
        <CardContent>
          {isLoading ? (
            <TableSkeleton />
          ) : paged.length === 0 ? (
            <EmptyState title="No users" description="Try changing filters or add a user." actionLabel="Add User" onAction={openAdd} />
          ) : (
            <List>
              {paged.map(user => (
                <ListItem key={user.uid} divider secondaryAction={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                      <Select value={user.role} onChange={(e) => updateRole(user.uid, e.target.value as any)}>
                        <MenuItem value="admin">Admin</MenuItem>
                        <MenuItem value="agent">Agent</MenuItem>
                      </Select>
                    </FormControl>
                    <Button variant="outlined" color={user.isActive ? 'error' : 'success'} onClick={() => toggleActive(user.uid)}>
                      {user.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                  </Box>
                }>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body1" fontWeight={600}>{user.name}</Typography>
                        <Chip size="small" label={user.role} color={user.role === 'admin' ? 'secondary' : 'default'} />
                        <Chip size="small" label={user.isActive ? 'Active' : 'Inactive'} color={user.isActive ? 'success' : 'default'} />
                      </Box>
                    }
                    secondary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        <Typography variant="body2" color="text.secondary">{user.email}</Typography>
                        <Typography variant="body2" color="text.secondary">•</Typography>
                        <Typography variant="body2" color="text.secondary">{user.division}</Typography>
                        {user.phoneNumber && <>
                          <Typography variant="body2" color="text.secondary">•</Typography>
                          <Typography variant="body2" color="text.secondary">{user.phoneNumber}</Typography>
                        </>}
                        {user.lastLoginAt && (<>
                          <Typography variant="body2" color="text.secondary">•</Typography>
                          <Typography variant="body2" color="text.secondary">Last login {new Date(user.lastLoginAt).toLocaleDateString()}</Typography>
                        </>)}
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          )}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
              <Pagination count={totalPages} page={page} onChange={(_, p) => setPage(p)} color="primary" />
            </Box>
          )}
        </CardContent>
      </MuiCard>

      <Modal open={isAddOpen} onClose={closeAdd} title="Add User" size="small">
        <Box component="form" onSubmit={handleSubmitAdd} sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField
            label="Name"
            value={form.name}
            onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
            required
            fullWidth
          />
          <TextField
            type="email"
            label="Email"
            value={form.email}
            onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
            required
            fullWidth
          />
          <FormControl fullWidth>
            <InputLabel id="add-role-label">Role</InputLabel>
            <Select
              labelId="add-role-label"
              value={form.role}
              label="Role"
              onChange={(e) => setForm(prev => ({ ...prev, role: e.target.value as 'admin' | 'agent' }))}
            >
              <MenuItem value="admin">Admin</MenuItem>
              <MenuItem value="agent">Agent</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel id="add-division-label">Division</InputLabel>
            <Select
              labelId="add-division-label"
              value={form.division}
              label="Division"
              onChange={(e) => setForm(prev => ({ ...prev, division: e.target.value as string }))}
              required
            >
              <MenuItem value="Blok M">Blok M</MenuItem>
              <MenuItem value="Pejaten">Pejaten</MenuItem>
              <MenuItem value="Poin">Poin</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label="Phone Number"
            value={form.phoneNumber}
            onChange={(e) => setForm(prev => ({ ...prev, phoneNumber: e.target.value }))}
            fullWidth
          />
          <Stack direction="row" spacing={2} sx={{ pt: 1 }}>
            <Box sx={{ flexGrow: 1 }} />
            <Button variant="text" onClick={closeAdd} disabled={isLoading}>Cancel</Button>
            <Button variant="contained" type="submit" disabled={isLoading || !form.name || !form.email || !form.division}>Save</Button>
          </Stack>
        </Box>
      </Modal>
    </Box>
  );
};

export default AdminUsersPage;
