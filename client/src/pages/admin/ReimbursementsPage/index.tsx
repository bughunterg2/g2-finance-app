import React, { useEffect, useState, useMemo } from 'react';
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Card,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
} from '@mui/material';
import {
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Visibility as VisibilityIcon,
  Payment as PaymentIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import PageHeader from '@/components/layout/PageHeader';
import { useReimbursementStore } from '@/stores/reimbursementStore';
import { useUserStore } from '@/stores/userStore';
import { useCategoryStore } from '@/stores/categoryStore';
import Badge from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import toast from 'react-hot-toast';
import type { ReimbursementStatus } from '@/types';
import { formatCurrency, formatDate } from '@/utils/format';

const AdminReimbursementsPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { reimbursements, isLoading, fetchReimbursements, approveReimbursement, rejectReimbursement, payReimbursement } = useReimbursementStore();
  const { users } = useUserStore();
  const { categories } = useCategoryStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<ReimbursementStatus | 'all'>('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedReimbursement, setSelectedReimbursement] = useState<string | null>(null);

  useEffect(() => {
    fetchReimbursements();
  }, [fetchReimbursements]);

  const siteParam = useMemo(() => new URLSearchParams(location.search).get('site'), [location.search]);

  const isInSite = (id: string) => {
    if (!siteParam) return true;
    // Simple deterministic split by id hash parity to simulate different datasets per site
    const sum = Array.from(id).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    if (siteParam === 'blokm') return sum % 2 === 0;
    if (siteParam === 'pejaten') return sum % 2 === 1;
    return true;
  };

  const filteredReimbursements = useMemo(() => {
    let filtered = reimbursements.filter(r => isInSite(r.id));

    if (filterStatus !== 'all') {
      filtered = filtered.filter(r => r.status === filterStatus);
    }

    if (searchTerm) {
      filtered = filtered.filter(r =>
        r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        users.find(u => u.uid === r.agentId)?.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [reimbursements, filterStatus, searchTerm, users]);

  const paginatedReimbursements = useMemo(() => {
    const startIndex = page * rowsPerPage;
    return filteredReimbursements.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredReimbursements, page, rowsPerPage]);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, reimbursementId: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedReimbursement(reimbursementId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedReimbursement(null);
  };

  const handleViewDetails = () => {
    if (selectedReimbursement) {
      navigate(`/admin/reimbursements/${selectedReimbursement}`);
    }
    handleMenuClose();
  };

  const handleApprove = async () => {
    if (selectedReimbursement) {
      await approveReimbursement(selectedReimbursement, 'Approved via list');
      toast.success('Reimbursement approved!');
    }
    handleMenuClose();
  };

  const handleReject = async () => {
    if (selectedReimbursement) {
      await rejectReimbursement(selectedReimbursement, 'Rejected by admin');
      toast.success('Reimbursement rejected!');
    }
    handleMenuClose();
  };

  const handlePay = async () => {
    if (selectedReimbursement) {
      await payReimbursement(selectedReimbursement);
      toast.success('Reimbursement marked as paid!');
    }
    handleMenuClose();
  };

  const getSelectedReimbursement = () => {
    if (!selectedReimbursement) return null;
    return reimbursements.find(r => r.id === selectedReimbursement);
  };

  const getUserName = (uid: string) => {
    const user = users.find(u => u.uid === uid);
    return user?.name || 'Unknown User';
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.name || 'Unknown Category';
  };

  const getStatusCounts = () => {
    const counts = {
      all: reimbursements.filter(r => isInSite(r.id)).length,
      pending: reimbursements.filter(r => isInSite(r.id) && r.status === 'pending').length,
      approved: reimbursements.filter(r => isInSite(r.id) && r.status === 'approved').length,
      rejected: reimbursements.filter(r => isInSite(r.id) && r.status === 'rejected').length,
      paid: reimbursements.filter(r => isInSite(r.id) && r.status === 'paid').length,
    };
    return counts;
  };

  const statusCounts = getStatusCounts();

  if (isLoading) {
    return <LoadingSpinner size="large" />;
  }

  return (
    <Box>
      <PageHeader
        title="All Reimbursements"
        subtitle="Manage and approve reimbursement requests"
      />

      {/* Statistics Cards removed as requested */}

      {/* Filters */}
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
                  setPage(0);
                }}
                variant={filterStatus === status ? 'filled' : 'outlined'}
                sx={{ minWidth: 'fit-content' }}
              />
            ))}
          </Stack>
        </Box>
      </Box>

      {/* Table */}
      {paginatedReimbursements.length === 0 ? (
        <EmptyState
          title="No Reimbursements Found"
          description="Try adjusting your filters or check back later."
        />
      ) : (
        <Card>
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
                {paginatedReimbursements.map((reimbursement) => (
                  <TableRow key={reimbursement.id} hover>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {reimbursement.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {reimbursement.description.substring(0, 50)}...
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 32, height: 32 }}>
                          <PersonIcon fontSize="small" />
                        </Avatar>
                        <Typography variant="body2">
                          {getUserName(reimbursement.agentId)}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {getCategoryName(reimbursement.categoryId)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {formatCurrency(reimbursement.amount)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Badge status={reimbursement.status} />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDate(reimbursement.createdAt)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        onClick={(e) => handleMenuOpen(e, reimbursement.id)}
                        size="small"
                      >
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
        </Card>
      )}

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={handleViewDetails}>
          <VisibilityIcon sx={{ mr: 1 }} />
          View Details
        </MenuItem>
        
        {/* Approve - hanya muncul jika status pending */}
        {getSelectedReimbursement()?.status === 'pending' && (
          <MenuItem onClick={handleApprove}>
            <CheckCircleIcon sx={{ mr: 1 }} />
            Approve
          </MenuItem>
        )}
        
        {/* Reject - hanya muncul jika status pending */}
        {getSelectedReimbursement()?.status === 'pending' && (
          <MenuItem onClick={handleReject}>
            <CancelIcon sx={{ mr: 1 }} />
            Reject
          </MenuItem>
        )}
        
        {/* Mark as Paid - hanya muncul jika status approved */}
        {getSelectedReimbursement()?.status === 'approved' && (
          <MenuItem onClick={handlePay}>
            <PaymentIcon sx={{ mr: 1 }} />
            Mark as Paid
          </MenuItem>
        )}
      </Menu>
    </Box>
  );
};

export default AdminReimbursementsPage;
