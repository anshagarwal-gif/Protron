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
  modulesList,
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
    setPermissions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
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

    // Console log as per your request
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
          Add New Role
        </Typography>
      </Box>
      <DialogContent sx={{ p: 3 }}>
        <TextField
          label="Role Name"
          value={roleName}
          onChange={(e) => setRoleName(e.target.value)}
          fullWidth
          sx={{ mb: 3 }}
        />
        <Paper
          variant="outlined"
          sx={{
            p: 3,
            bgcolor: "#f8f9fa",
            borderColor: "#1b5e20",
            borderRadius: 2,
          }}
        >
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {modulesList.map((moduleName, idx) => (
              <Box key={moduleName} sx={{ mb: 2 }}>
                <Typography variant="h6" sx={{ color: "#1b5e20", mb: 1, fontWeight: 600 }}>
                  {formatModuleName(moduleName)}
                </Typography>
                <Box sx={{ display: "flex", gap: 3, pl: 2 }}>
                  {["View", "Edit", "Delete"].map((perm) => (
                    <Box key={perm} sx={{ display: "flex", alignItems: "center" }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
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
              </Box>
            ))}
          </Box>
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