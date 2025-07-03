import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, Typography, Box, Paper, Switch, Button } from "@mui/material";
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
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });

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

  // Helper function to format module names for display
  const formatModuleName = (moduleName) => {
    return moduleName
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        fullWidth
        maxWidth="md"
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
          <Typography variant="h5" fontWeight="600" sx={{ color: "#1b5e20" }}>
            Edit Role Access Rights
          </Typography>
          <Typography variant="subtitle1" sx={{ color: "#333", mt: 1 }}>
            {role?.roleName}
          </Typography>
        </Box>
        <DialogContent sx={{ p: 3, overflow: "hidden" }}>
          {modules.length > 0 ? (
            <Box 
              sx={{ 
                display: "flex",
                flexDirection: "column",
                gap: 2,
                maxHeight: "60vh",
                overflowY: "auto",
                pr: 1
              }}
            >
              {modules.map((module, index) => {
                const moduleName = module;
                const formattedModuleName = formatModuleName(moduleName);
                
                return (
                  <Paper
                    key={index}
                    variant="outlined"
                    sx={{
                      p: 2,
                      bgcolor: "#ffffff",
                      borderColor: "#e0e0e0",
                      borderRadius: 2,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      minHeight: "60px",
                      "&:hover": {
                        borderColor: "#1b5e20",
                        boxShadow: "0 2px 8px rgba(27,94,32,0.1)",
                      },
                    }}
                  >
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        color: "#1b5e20", 
                        fontWeight: 600,
                        fontSize: "1rem",
                        minWidth: "150px",
                      }}
                    >
                      {formattedModuleName}
                    </Typography>
                    
                    <Box sx={{ display: "flex", alignItems: "center", gap: 4 }}>
                      {/* View Permission */}
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, fontSize: "0.9rem", minWidth: "40px" }}>
                          View
                        </Typography>
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

                      {/* Edit Permission */}
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, fontSize: "0.9rem", minWidth: "40px" }}>
                          Edit
                        </Typography>
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

                      {/* Delete Permission */}
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, fontSize: "0.9rem", minWidth: "40px" }}>
                          Delete
                        </Typography>
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
                    </Box>
                  </Paper>
                );
              })}
            </Box>
          ) : (
            <Box sx={{ textAlign: "center", py: 4 }}>
              <Typography variant="body1" color="text.secondary">
                No modules available.
              </Typography>
            </Box>
          )}
          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 3, pt: 2, borderTop: "1px solid #e0e0e0" }}>
            <Button
              onClick={onClose}
              variant="outlined"
              sx={{
                borderColor: "#1b5e20",
                color: "#1b5e20",
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
                bgcolor: "#1b5e20",
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