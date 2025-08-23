import React from 'react';
import { Snackbar, Alert } from '@mui/material';

const GlobalSnackbar = ({ open, message, severity = 'info', onClose }) => {
  // Check if message is long and contains line breaks (detailed error message)
  const isDetailedMessage = message && (message.length > 100 || message.includes('\n'));
  
  return (
    <Snackbar
      open={open}
      autoHideDuration={isDetailedMessage ? 8000 : 4000} // Longer duration for detailed messages
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      <Alert 
        onClose={onClose} 
        severity={severity || "info"} 
        sx={{ 
          width: '100%',
          maxWidth: isDetailedMessage ? '600px' : '400px',
          whiteSpace: isDetailedMessage ? 'pre-line' : 'normal',
          textAlign: isDetailedMessage ? 'left' : 'center'
        }}
      >
        {message}
      </Alert>
    </Snackbar>
  );
};

export default GlobalSnackbar;
