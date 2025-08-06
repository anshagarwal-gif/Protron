import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, Typography, Box, Paper, Switch, Button, useMediaQuery, useTheme } from "@mui/material";
import GlobalSnackbar from "./GlobalSnackbar"; // Adjust import path as needed
import axios from "axios"; // Import axios for API calls

const ManageRoleModal = ({
  open,
  onClose,
  role,
  rolePermissions,
  onPermissionToggle,
  onSave,
  modules
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const greenPrimary = "#1b5e20";

  const generateInvoiceModule = import.meta.env.VITE_GENERATE_INVOICE_MODULE;
  
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });

  const formatModuleName = (moduleName) => {
    return moduleName; // You can add formatting logic here if needed
  };

  const handleSave = async () => {
    try {
      await onSave();
      setSnackbar({
        open: true,
        message: "Role permissions updated successfully!",
        severity: "success",
      });
      // Optional: Close modal after successful save
      // setTimeout(() => onClose(), 1500);
    } catch (error) {
      setSnackbar({
        open: true,
        message: "Failed to update role permissions. Please try again.",
        severity: "error",
      });
    }
  };

  const handleSnackbarClose = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        fullWidth
        maxWidth="lg"
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
            maxHeight: "90vh",
          },
        }}
      >
        <Box
          sx={{
            bgcolor: "#f8f9fa",
            borderBottom: "1px solid #e0e0e0",
            py: 2.5,
            px: 3,
          }}
        >
          <Typography variant="h5" fontWeight="600" sx={{ color: greenPrimary }}>
            Edit Role Access Rights
          </Typography>
          <Typography variant="subtitle1" sx={{ color: "#333", mt: 1 }}>
            {role?.roleName}
          </Typography>
        </Box>
        
        <DialogContent sx={{ p: 3, overflow: "hidden" }}>
          {/* Access Details Section */}
          <Paper
            variant="outlined"
            sx={{
              p: isMobile ? 1.5 : 2.5,
              bgcolor: "#f8f9fa",
              borderColor: greenPrimary,
              borderRadius: 2,
              display: "flex",
              flexDirection: "column",
              mb: 3,
            }}
          >
            <Typography 
              variant={isMobile ? "subtitle1" : "h6"} 
              sx={{ 
                color: greenPrimary, 
                mb: isMobile ? 1.5 : 2, 
                fontWeight: 600 
              }}
            >
              Access Details
            </Typography>

            {modules.length > 0 ? (
              <Box sx={{ 
                bgcolor: "#ffffff", 
                maxHeight: "50vh",
                overflowY: "auto",
              }}>
                {/* Header Row */}
                <Box sx={{ 
                  display: "grid", 
                  gridTemplateColumns: isMobile ? "1fr 60px 60px 60px" : "1fr 80px 80px 80px",
                  alignItems: "center",
                  backgroundColor: greenPrimary,
                  borderRadius: 1,
                  px: isMobile ? 1 : 2,
                  py: isMobile ? 0.75 : 1,
                  mb: 1,
                }}>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: "white", 
                      fontWeight: 600,
                      fontSize: isMobile ? "0.8rem" : "0.9rem",
                    }}
                  >
                    Module
                  </Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: "white", 
                      fontWeight: 600,
                      textAlign: "center",
                      fontSize: isMobile ? "0.8rem" : "0.9rem",
                    }}
                  >
                    View
                  </Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: "white", 
                      fontWeight: 600,
                      textAlign: "center",
                      fontSize: isMobile ? "0.8rem" : "0.9rem",
                    }}
                  >
                    Edit
                  </Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: "white", 
                      fontWeight: 600,
                      textAlign: "center",
                      fontSize: isMobile ? "0.8rem" : "0.9rem",
                    }}
                  >
                    Delete
                  </Typography>
                </Box>

                {/* Module Rows */}
                <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                  {modules.map((module, index) => {
                    const moduleName = module;
                    const formattedModuleName = formatModuleName(moduleName);

                    return (
                      <Box
                        key={index}
                        sx={{
                          display: "grid",
                          gridTemplateColumns: isMobile ? "1fr 60px 60px 60px" : "1fr 80px 80px 80px",
                          alignItems: "center",
                          px: isMobile ? 1 : 2,
                          py: isMobile ? 0.75 : 1,
                          backgroundColor: index % 2 === 0 ? "#ffffff" : "#f8f9fa",
                          borderRadius: 1,
                          transition: "background-color 0.2s ease",
                          "&:hover": {
                            backgroundColor: "#e8f5e8",
                          },
                        }}
                      >
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: "#333", 
                            fontWeight: 500,
                            fontSize: isMobile ? "0.8rem" : "0.85rem",
                          }}
                        >
                          {formattedModuleName}
                        </Typography>
                        
                        <Box sx={{ display: "flex", justifyContent: "center" }}>
                          <Switch
                            size="small"
                            checked={rolePermissions[`${moduleName}_canView`] || false}
                            onChange={() => onPermissionToggle(`${moduleName}_canView`)}
                            sx={{
                              "& .MuiSwitch-switchBase.Mui-checked": {
                                color: "#1b5e20",
                              },
                              "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                                backgroundColor: "#1b5e20",
                              },
                            }}
                          />
                        </Box>
                        {moduleName !== generateInvoiceModule && (<>
                        
                        <Box sx={{ display: "flex", justifyContent: "center" }}>
                          <Switch
                            size="small"
                            checked={rolePermissions[`${moduleName}_canEdit`] || false}
                            onChange={() => onPermissionToggle(`${moduleName}_canEdit`)}
                            sx={{
                              "& .MuiSwitch-switchBase.Mui-checked": {
                                color: "#fbc02d",
                              },
                              "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                                backgroundColor: "#fbc02d",
                              },
                            }}
                          />
                        </Box>

                        <Box sx={{ display: "flex", justifyContent: "center" }}>
                          <Switch
                            size="small"
                            checked={rolePermissions[`${moduleName}_canDelete`] || false}
                            onChange={() => onPermissionToggle(`${moduleName}_canDelete`)}
                            sx={{
                              "& .MuiSwitch-switchBase.Mui-checked": {
                                color: "#c62828",
                              },
                              "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                                backgroundColor: "#c62828",
                              },
                            }}
                          />
                        </Box>
                        </>)}
                      </Box>
                    );
                  })}
                </Box>
              </Box>
            ) : (
              <Box sx={{ 
                textAlign: "center", 
                py: isMobile ? 3 : 4,
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center" 
              }}>
                <Typography variant="body1" color="text.secondary">
                  {role?.roleName
                    ? "No access rights defined for this role"
                    : "Please select a role to view access rights"}
                </Typography>
              </Box>
            )}
          </Paper>

          {/* Action Buttons */}
          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 3, pt: 2, borderTop: "1px solid #e0e0e0" }}>
            <Button
              onClick={onClose}
              variant="outlined"
              sx={{
                borderColor: greenPrimary,
                color: greenPrimary,
                height: "42px",
                "&:hover": {
                  borderColor: "#2e7d32",
                  color: "#2e7d32",
                },
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              variant="contained"
              sx={{
                bgcolor: greenPrimary,
                color: "white",
                height: "42px",
                fontWeight: 600,
                "&:hover": {
                  bgcolor: "#2e7d32",
                },
              }}
            >
              Save
            </Button>
          </Box>
        </DialogContent>
      </Dialog>

      <GlobalSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={handleSnackbarClose}
      />
    </>
  );
};

export default ManageRoleModal;