import React from 'react';
import { Snackbar, Alert } from '@mui/material';

const GlobalSnackbar = ({ open, message, severity = 'info', onClose }) => {
  return (
    <Snackbar
      open={open}
      autoHideDuration={4000}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      <Alert onClose={onClose} severity={severity || "info"} sx={{ width: '100%' }}>
        {message}
      </Alert>
    </Snackbar>
  );
};

export default GlobalSnackbar;
