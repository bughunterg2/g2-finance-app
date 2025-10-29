import React from 'react';
import { Box, Typography, Button, Card as MuiCard, CardContent, Chip, Divider, Dialog, DialogContent, IconButton } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import PageHeader from '@/components/layout/PageHeader';
import { useReimbursementStore } from '@/stores/reimbursementStore';
import Badge from '@/components/ui/Badge';
import { Close as CloseIcon, Payment as PaymentIcon } from '@mui/icons-material';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/stores/authStore';

import { formatCurrency, formatDate } from '@/utils/format';

const ReimbursementDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { reimbursements, approveReimbursement, rejectReimbursement, payReimbursement } = useReimbursementStore();
  const { user } = useAuthStore();
  const reimbursement = React.useMemo(() => reimbursements.find(r => r.id === id), [reimbursements, id]);

  const [previewOpen, setPreviewOpen] = React.useState(false);
  const [previewSrc, setPreviewSrc] = React.useState<string | null>(null);

  const openPreview = (src: string) => { setPreviewSrc(src); setPreviewOpen(true); };
  const closePreview = () => { setPreviewOpen(false); setPreviewSrc(null); };

  return (
    <Box>
      <PageHeader
        title={reimbursement ? reimbursement.title : 'Reimbursement Details'}
        subtitle={reimbursement ? formatCurrency(reimbursement.amount) : 'View reimbursement request details'}
        actions={
          <Button
            variant="outlined"
            onClick={() => navigate(user?.role === 'admin' ? '/admin/reimbursements' : '/reimbursements')}
          >
            Back to List
          </Button>
        }
      />
      
      {!reimbursement ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="body1" color="text.secondary">Reimbursement not found.</Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' } }}>
          <Box>
            <MuiCard>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6" fontWeight="bold">Overview</Typography>
                  <Badge status={reimbursement.status} />
                </Box>
                <Typography variant="subtitle2" color="text.secondary">Category</Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>{reimbursement.categoryId}</Typography>

                <Typography variant="subtitle2" color="text.secondary">Description</Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>{reimbursement.description}</Typography>

                <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' }, mb: 2 }}>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">Amount</Typography>
                    <Typography variant="body1">{formatCurrency(reimbursement.amount)}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">Currency</Typography>
                    <Typography variant="body1">{reimbursement.currency}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">Transaction Date</Typography>
                    <Typography variant="body1">{formatDate(reimbursement.transactionDate)}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">Submitted</Typography>
                    <Typography variant="body1">{formatDate(reimbursement.submittedAt)}</Typography>
                  </Box>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Typography variant="subtitle2" color="text.secondary" gutterBottom>Attachments</Typography>
                {reimbursement.attachments.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">No attachments</Typography>
                ) : (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                    {reimbursement.attachments.map((src, idx) => (
                      <Box key={idx} sx={{ width: 96, height: 96, borderRadius: 1, overflow: 'hidden', border: '1px solid', borderColor: 'divider', cursor: 'pointer' }} onClick={() => openPreview(src)}>
                        <img src={src} alt={`attachment-${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </Box>
                    ))}
                  </Box>
                )}
              </CardContent>
            </MuiCard>

            <MuiCard sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>Timeline</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box>
                    <Chip label="Submitted" color="primary" size="small" sx={{ mr: 1 }} />
                    <Typography variant="body2" component="span">{new Date(reimbursement.submittedAt).toLocaleString()}</Typography>
                  </Box>
                  {reimbursement.approvedAt && (
                    <Box>
                      <Chip label="Approved" color="success" size="small" sx={{ mr: 1 }} />
                      <Typography variant="body2" component="span">{new Date(reimbursement.approvedAt).toLocaleString()}</Typography>
                    </Box>
                  )}
                  {reimbursement.rejectionReason && (
                    <Box>
                      <Chip label="Rejected" color="error" size="small" sx={{ mr: 1 }} />
                      <Typography variant="body2" component="span">{reimbursement.rejectionReason}</Typography>
                    </Box>
                  )}
                  {reimbursement.paymentDate && (
                    <Box>
                      <Chip label="Paid" color="primary" size="small" sx={{ mr: 1 }} />
                      <Typography variant="body2" component="span">{new Date(reimbursement.paymentDate).toLocaleString()}</Typography>
                    </Box>
                  )}
                </Box>
              </CardContent>
            </MuiCard>
          </Box>

          <Box>
            <MuiCard>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>Actions</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {/* Approve button - hanya muncul jika status pending dan user adalah admin */}
                  {user?.role === 'admin' && reimbursement?.status === 'pending' && (
                    <Button 
                      variant="contained"
                      color="success"
                      onClick={async () => {
                        if (!reimbursement) return;
                        await approveReimbursement(reimbursement.id, 'Approved from detail view');
                        toast.success('Reimbursement approved');
                      }}
                    >
                      Approve
                    </Button>
                  )}
                  
                  {/* Reject button - hanya muncul jika status pending dan user adalah admin */}
                  {user?.role === 'admin' && reimbursement?.status === 'pending' && (
                    <Button 
                      variant="outlined"
                      color="error"
                      onClick={async () => {
                        if (!reimbursement) return;
                        await rejectReimbursement(reimbursement.id, 'Rejected from detail view');
                        toast.success('Reimbursement rejected');
                      }}
                    >
                      Reject
                    </Button>
                  )}
                  
                  {/* Mark as Paid button - hanya muncul jika status approved dan user adalah admin */}
                  {user?.role === 'admin' && reimbursement?.status === 'approved' && (
                    <Button 
                      variant="contained"
                      color="primary"
                      startIcon={<PaymentIcon />}
                      onClick={async () => {
                        if (!reimbursement) return;
                        await payReimbursement(reimbursement.id);
                        toast.success('Reimbursement marked as paid');
                      }}
                    >
                      Mark as Paid
                    </Button>
                  )}
                  
                  {/* Jika tidak ada action yang tersedia */}
                  {user?.role === 'admin' && reimbursement && reimbursement.status !== 'pending' && reimbursement.status !== 'approved' && (
                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                      No actions available for this status
                    </Typography>
                  )}
                  
                  {/* Untuk agent, tidak ada action button */}
                  {user?.role === 'agent' && (
                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                      Actions are only available for administrators
                    </Typography>
                  )}
                </Box>
              </CardContent>
            </MuiCard>
          </Box>
        </Box>
      )}

      {/* Attachment Preview */}
      <Dialog open={previewOpen} onClose={closePreview} maxWidth="md">
        <IconButton onClick={closePreview} sx={{ position: 'absolute', right: 8, top: 8 }}>
          <CloseIcon />
        </IconButton>
        <DialogContent>
          {previewSrc && (
            <img src={previewSrc} alt="preview" style={{ maxWidth: '100%', height: 'auto' }} />
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default ReimbursementDetailPage;
