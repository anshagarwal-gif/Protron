import React, { useState } from "react";
import { Dialog, DialogContent, Typography, Box, Paper, Switch, Button, TextField,useMediaQuery, useTheme } from "@mui/material";

// Helper to format module names
const formatModuleName = (moduleName) =>
  moduleName
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

const AddRoleModal = ({
  open,
  onClose,
  modulesList, // List of modules fetched from the API
  onSubmit,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const greenPrimary = "#1b5e20";
  const [roleName, setRoleName] = useState("");
  const [permissions, setPermissions] = useState({});

  const generateInvoiceModule = import.meta.env.VITE_GENERATE_INVOICE_MODULE;

  // Reset state when modal opens/closes
  React.useEffect(() => {
    if (open) {
      setRoleName("");
      setPermissions({});
    }
  }, [open]);

  const handleToggle = (key) => {
  setPermissions((prev) => {
    const updatedPermissions = { ...prev };

    // Prevent toggling "Edit" or "Delete" if "View" is not checked
    if ((key.endsWith("_canEdit") || key.endsWith("_canDelete")) && !prev[key.replace(/_can(Edit|Delete)/, "_canView")]) {
      return prev; // No changes
    }

    updatedPermissions[key] = !updatedPermissions[key];

    // If "View" is unchecked, also uncheck "Edit" and "Delete"
    if (key.endsWith("_canView") && !updatedPermissions[key]) {
      const moduleName = key.replace("_canView", "");
      updatedPermissions[`${moduleName}_canEdit`] = false;
      updatedPermissions[`${moduleName}_canDelete`] = false;
    }

    return updatedPermissions;
  });
};

  const handleSave = () => {
    // Convert permissions to array of { moduleName, canView, canEdit, canDelete }
    const modules = {};
    Object.entries(permissions).forEach(([key, value]) => {
      const match = key.match(/^(.+)_can(View|Edit|Delete)$/);
      if (match) {
        const moduleName = match[1];
        const right = match[2];
        if (!modules[moduleName]) {
          modules[moduleName] = { moduleName, canView: false, canEdit: false, canDelete: false };
        }
        modules[moduleName][`can${right}`] = value;
      }
    });
    const accessRights = Object.values(modules);

    // Console log for debugging
    console.log("New Role Name:", roleName);
    console.log("Access Rights:", accessRights);

    // Call parent submit
    onSubmit(roleName, accessRights);
  };

  return (
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
          Add New Role
        </Typography>
      </Box>
      <DialogContent sx={{ p: 3, overflow: "auto" }}>
        <TextField
          label="Role Name"
          value={roleName}
          onChange={(e) => setRoleName(e.target.value)}
          fullWidth
          sx={{ mb: 3 }}
        />
        
        {/* NEW TABLE-BASED LAYOUT - REPLACE THE EXISTING MODULES SECTION */}
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
            Module Permissions
          </Typography>

          {modulesList.length > 0 ? (
            <Box sx={{ 
              bgcolor: "#ffffff", 
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
                {modulesList.map((moduleName, index) => {
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
                          checked={permissions[`${moduleName}_canView`] || false}
                          onChange={() => handleToggle(`${moduleName}_canView`)}
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
                      {moduleName !== generateInvoiceModule && (
                        <>
                        
                      <Box sx={{ display: "flex", justifyContent: "center" }}>
                        <Switch
                          size="small"
                          checked={permissions[`${moduleName}_canEdit`] || false}
                          onChange={() => handleToggle(`${moduleName}_canEdit`)}
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
                          checked={permissions[`${moduleName}_canDelete`] || false}
                          onChange={() => handleToggle(`${moduleName}_canDelete`)}
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
                No modules available.
              </Typography>
            </Box>
          )}
        </Paper>
        
        {/* Keep existing buttons section unchanged */}
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
            disabled={!roleName.trim()}
          >
            Save
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default AddRoleModal;