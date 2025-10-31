import React from 'react';
import { Box, Typography, Button, Card as MuiCard, CardContent, TextField, IconButton } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import PageHeader from '@/components/layout/PageHeader';
import { useReimbursementStore } from '@/stores/reimbursementStore';
import toast from 'react-hot-toast';
import { Delete as DeleteIcon, AttachFile as AttachFileIcon } from '@mui/icons-material';

const NewReimbursementPage: React.FC = () => {
  const navigate = useNavigate();
  const { createReimbursement } = useReimbursementStore();

  const [form, setForm] = React.useState({
    title: '',
    description: '',
    amount: '',
    categoryId: '',
    transactionDate: new Date().toISOString().split('T')[0],
    attachments: [] as string[],
  });

  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleChange = (key: string, value: any) => setForm(prev => ({ ...prev, [key]: value }));

  const handleAddAttachment = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,.pdf';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        // Mock file upload - in real app, upload to server
        const mockUrl = URL.createObjectURL(file);
        setForm(prev => ({ ...prev, attachments: [...prev.attachments, mockUrl] }));
        toast.success('File attached (mock)');
      }
    };
    input.click();
  };

  const handleRemoveAttachment = (index: number) => {
    setForm(prev => ({ ...prev, attachments: prev.attachments.filter((_, i) => i !== index) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.description || !form.amount) {
      toast.error('Please fill all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      await createReimbursement({
        title: form.title,
        description: form.description,
        amount: parseInt(form.amount),
        categoryId: '',
        transactionDate: new Date(form.transactionDate),
        currency: 'IDR',
        attachments: form.attachments,
      });
      toast.success('Reimbursement created successfully!');
      navigate('/reimbursements');
    } catch (error) {
      toast.error('Failed to create reimbursement');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box>
      <PageHeader
        title="New Reimbursement"
        subtitle="Create a new reimbursement request"
        actions={
          <Button
            variant="outlined"
            onClick={() => navigate('/reimbursements')}
          >
            Back to List
          </Button>
        }
      />

      <MuiCard sx={{ maxWidth: 800, mx: 'auto' }}>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <Box sx={{ display: 'grid', gap: 3 }}>
              <TextField
                fullWidth
                label="Title *"
                value={form.title}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="e.g., Office Supplies Purchase"
              />

              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description *"
                value={form.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Describe the expense and its business purpose..."
              />

              <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
                <TextField
                  fullWidth
                  label="Amount (IDR) *"
                  type="number"
                  value={form.amount}
                  onChange={(e) => handleChange('amount', e.target.value)}
                  placeholder="500000"
                  InputProps={{
                    startAdornment: <Typography sx={{ mr: 1 }}>Rp</Typography>,
                  }}
                />

                <TextField
                  fullWidth
                  label="Transaction Date *"
                  type="date"
                  value={form.transactionDate}
                  onChange={(e) => handleChange('transactionDate', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Box>

              <TextField
                fullWidth
                label="Category"
                value={form.categoryId}
                onChange={(e) => handleChange('categoryId', e.target.value)}
                placeholder="e.g., Office Supplies, Travel, etc."
              />

              <Box>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                  {form.attachments.map((_url, index) => (
                    <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, p: 1, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                      <AttachFileIcon fontSize="small" />
                      <Typography variant="body2">File {index + 1}</Typography>
                      <IconButton size="small" onClick={() => handleRemoveAttachment(index)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ))}
                </Box>
                <Button
                  variant="outlined"
                  startIcon={<AttachFileIcon />}
                  onClick={handleAddAttachment}
                >
                  Add Attachment
                </Button>
              </Box>

              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/reimbursements')}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Creating...' : 'Create Reimbursement'}
                </Button>
              </Box>
            </Box>
          </form>
        </CardContent>
      </MuiCard>
    </Box>
  );
};

export default NewReimbursementPage;
