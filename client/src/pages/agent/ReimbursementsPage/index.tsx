import React from 'react';
import { Box, Typography, Button, Chip, TextField, InputAdornment, Stack, Card as MuiCard, Avatar, IconButton, Menu, MenuItem, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import PageHeader from '@/components/layout/PageHeader';
import { useReimbursementStore } from '@/stores/reimbursementStore';
import { useAuthStore } from '@/stores/authStore';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Search as SearchIcon, MoreVert as MoreVertIcon, Visibility as VisibilityIcon, Person as PersonIcon } from '@mui/icons-material';

import { formatCurrency, formatDate } from '@/utils/format';

const AgentReimbursementsPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
  const { reimbursements, fetchReimbursements, isLoading } = useReimbursementStore();

  const query = new URLSearchParams(location.search);
  const initialStatus = (query.get('status') || 'all') as 'all' | 'draft' | 'pending' | 'approved' | 'rejected' | 'paid';

  const [filterStatus, setFilterStatus] = React.useState<typeof initialStatus>(initialStatus);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  React.useEffect(() => {
    fetchReimbursements();
  }, [fetchReimbursements]);

  const myReimbursements = React.useMemo(() => reimbursements.filter(r => r.agentId === user?.uid), [reimbursements, user?.uid]);

  const filteredReimbursements = React.useMemo(() => {
    return myReimbursements
      .filter(r => filterStatus === 'all' ? true : r.status === filterStatus)
      .filter(r => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return r.title.toLowerCase().includes(term) || r.description.toLowerCase().includes(term);
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [myReimbursements, filterStatus, searchTerm]);

  const paginatedReimbursements = React.useMemo(() => {
    const start = page * rowsPerPage;
    return filteredReimbursements.slice(start, start + rowsPerPage);
  }, [filteredReimbursements, page, rowsPerPage]);

  const getStatusCounts = () => {
    return {
      all: myReimbursements.length,
      pending: myReimbursements.filter(r => r.status === 'pending').length,
      approved: myReimbursements.filter(r => r.status === 'approved').length,
      rejected: myReimbursements.filter(r => r.status === 'rejected').length,
      paid: myReimbursements.filter(r => r.status === 'paid').length,
    };
  };
  const statusCounts = getStatusCounts();

  const handleMenuOpen = (e: React.MouseEvent<HTMLElement>, id: string) => {
    setAnchorEl(e.currentTarget);
    setSelectedId(id);
  };
  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedId(null);
  };
  const handleViewDetails = () => {
    if (selectedId) navigate(`/reimbursements/${selectedId}`);
    handleMenuClose();
  };

  React.useEffect(() => {
    setPage(0);
  }, [filterStatus, searchTerm]);

  return (
    <Box>
      <PageHeader
        title="My Reimbursements"
        subtitle="View and manage your reimbursement requests"
        actions={
          <Button variant="contained" onClick={() => navigate('/reimbursements/new')}>
            New Reimbursement
          </Button>
        }
      />

      {/* Filters - aligned with Admin template */}
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap', mb: 3 }}>
        <Box sx={{ flex: '1 1 280px', minWidth: 240 }}>
          <TextField
            fullWidth
            placeholder="Search reimbursements..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Box>
        <Box sx={{ flex: '2 1 400px', minWidth: 260, overflowX: 'auto' }}>
          <Stack direction="row" spacing={1} sx={{ pb: 1 }}>
            {(['all', 'pending', 'approved', 'rejected', 'paid'] as const).map(status => (
              <Chip
                key={status}
                label={`${status.charAt(0).toUpperCase() + status.slice(1)} (${statusCounts[status]})`}
                color={filterStatus === status ? 'primary' : 'default'}
                onClick={() => {
                  setFilterStatus(status);
                }}
                variant={filterStatus === status ? 'filled' : 'outlined'}
                sx={{ minWidth: 'fit-content' }}
              />
            ))}
          </Stack>
        </Box>
      </Box>

      {/* Table - same template as Admin */}
      {isLoading ? (
        <LoadingSpinner size="large" />
      ) : paginatedReimbursements.length === 0 ? (
        <EmptyState title="No Reimbursements Found" description="Try adjusting your filters or create a new one." />
      ) : (
        <MuiCard>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Request</TableCell>
                  <TableCell>Agent</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedReimbursements.map((r) => (
                  <TableRow key={r.id} hover>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {r.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {r.description.substring(0, 50)}...
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 32, height: 32 }}>
                          <PersonIcon fontSize="small" />
                        </Avatar>
                        <Typography variant="body2">
                          {user?.name || 'Me'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{/* Category name will be resolved in admin via helper; keep template same */}
                        {r.categoryId}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {formatCurrency(r.amount)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Badge status={r.status} />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDate(r.createdAt)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <IconButton onClick={(e) => handleMenuOpen(e, r.id)} size="small">
                        <MoreVertIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredReimbursements.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
          />
        </MuiCard>
      )}

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem onClick={handleViewDetails}>
          <VisibilityIcon sx={{ mr: 1 }} />
          View Details
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default AgentReimbursementsPage;
