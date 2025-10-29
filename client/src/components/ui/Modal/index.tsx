import React from 'react';
import { Dialog, DialogTitle, DialogContent, IconButton } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import type { ModalProps } from '@/types';

const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  title,
  size = 'medium',
  fullScreen = false,
  className,
  children,
  ...props
}) => {
  const getMaxWidth = () => {
    switch (size) {
      case 'small':
        return 'sm';
      case 'large':
        return 'lg';
      default:
        return 'md';
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={getMaxWidth()}
      fullWidth
      fullScreen={fullScreen}
      className={className}
      {...props}
    >
      {title && (
        <DialogTitle className="flex items-center justify-between">
          <span className="text-lg font-semibold">{title}</span>
          <IconButton
            onClick={onClose}
            size="small"
            className="text-gray-500 hover:text-gray-700"
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
      )}
      
      <DialogContent className={title ? 'pt-2' : 'pt-4'}>
        {children}
      </DialogContent>
    </Dialog>
  );
};

export default Modal;
