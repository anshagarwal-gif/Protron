import React, { useState } from "react";
import { Dialog, DialogContent, Typography, Box, Paper, Switch, Button, TextField } from "@mui/material";

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
  const [roleName, setRoleName] = useState("");
  const [permissions, setPermissions] = useState({});

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
        <Typography variant="h5" fontWeight="600" sx={{ color: "#1b5e20" }}>
          Add New Role
        </Typography>
      </Box>
      <DialogContent sx={{ p: 3, overflow: "hidden" }}>
        <TextField
          label="Role Name"
          value={roleName}
          onChange={(e) => setRoleName(e.target.value)}
          fullWidth
          sx={{ mb: 3 }}
        />
        {modulesList.length > 0 ? (
          <Box 
            sx={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
              gap: 2,
              maxHeight: "50vh",
              overflowY: "auto",
              pr: 1
            }}
          >
            {modulesList.map((moduleName, idx) => (
              <Paper
                key={moduleName}
                variant="outlined"
                sx={{
                  p: 2.5,
                  bgcolor: "#f8f9fa",
                  borderColor: "#1b5e20",
                  borderRadius: 2,
                  height: "fit-content",
                  minHeight: "160px",
                }}
              >
                <Typography 
                  variant="h6" 
                  sx={{ 
                    color: "#1b5e20", 
                    mb: 2, 
                    fontWeight: 600,
                    textAlign: "center",
                    pb: 1,
                    borderBottom: "1px solid #e0e0e0"
                  }}
                >
                  {formatModuleName(moduleName)}
                </Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {["View", "Edit", "Delete"].map((perm) => (
                    <Box key={perm} sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                        {perm}
                      </Typography>
                      <Switch
                        checked={permissions[`${moduleName}_can${perm}`] || false}
                        onChange={() => handleToggle(`${moduleName}_can${perm}`)}
                        sx={{
                          "& .MuiSwitch-switchBase.Mui-checked": {
                            color:
                              perm === "View"
                                ? "#1b5e20"
                                : perm === "Edit"
                                ? "#fbc02d"
                                : "#c62828",
                          },
                          "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                            backgroundColor:
                              perm === "View"
                                ? "#1b5e20"
                                : perm === "Edit"
                                ? "#fbc02d"
                                : "#c62828",
                          },
                        }}
                      />
                    </Box>
                  ))}
                </Box>
              </Paper>
            ))}
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