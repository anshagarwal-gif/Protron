import React, { useState } from "react";
import { Dialog, DialogContent, Typography, Box, Paper, Switch, Button } from "@mui/material";
import GlobalSnackbar from "./GlobalSnackbar"; // Adjust import path as needed

// Helper to format module names
const formatModuleName = (moduleName) =>
  moduleName
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

const ManageRoleModal = ({
  open,
  onClose,
  role,
  rolePermissions,
  onPermissionToggle,
  onSave,
}) => {
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info"
  });

  const handleSave = async () => {
    try {
      await onSave();
      setSnackbar({
        open: true,
        message: "Role permissions updated successfully!",
        severity: "success"
      });
      // Optional: Close modal after successful save
      // setTimeout(() => onClose(), 1500);
    } catch (error) {
      setSnackbar({
        open: true,
        message: "Failed to update role permissions. Please try again.",
        severity: "error"
      });
    }
  };

  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
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
        <DialogContent sx={{ p: 3 }}>
          <Paper
            variant="outlined"
            sx={{
              p: 3,
              bgcolor: "#f8f9fa",
              borderColor: "#1b5e20",
              borderRadius: 2,
            }}
          >
            {role && role.roleAccessRights ? (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {role.roleAccessRights.map((accessRight, index) => {
                  const ar = accessRight.accessRight;
                  const moduleName = ar.moduleName;
                  const formattedModuleName = formatModuleName(moduleName);
                  return (
                    <Box key={index} sx={{ mb: 2 }}>
                      <Typography variant="h6" sx={{ color: "#1b5e20", mb: 1, fontWeight: 600 }}>
                        {formattedModuleName}
                      </Typography>
                      <Box sx={{ display: "flex", gap: 3, pl: 2 }}>
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                            View
                          </Typography>
                          <Switch
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
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                            Edit
                          </Typography>
                          <Switch
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
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                            Delete
                          </Typography>
                          <Switch
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
                    </Box>
                  );
                })}
              </Box>
            ) : (
              <Box sx={{ textAlign: "center", py: 4 }}>
                <Typography variant="body1" color="text.secondary">
                  No access rights defined for this role.
                </Typography>
              </Box>
            )}
          </Paper>
          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 2 }}>
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