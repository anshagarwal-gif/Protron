
"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  TextField,
  Button,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Typography,
  Box,
  Paper,
  Switch,
  InputAdornment,
  useTheme,
  useMediaQuery,
} from "@mui/material"
import PersonIcon from "@mui/icons-material/Person"
import EmailIcon from "@mui/icons-material/Email"
import axios from "axios"

const AddUserModal = ({ isOpen, onClose, onSubmit, selectedUser }) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const isTablet = useMediaQuery(theme.breakpoints.down('md'))

  const [formData, setFormData] = useState({
    tenantName: "",
    firstName: "",
    lastName: "",
    emailId: "",
    role: ""
  })

  const [permissions, setPermissions] = useState({})
  const [roles, setRoles] = useState([])
  const [selectedRoleData, setSelectedRoleData] = useState(null)
  const [modules, setModules] = useState([])

  const fetchRoles = async () => {
    try {
      const token = sessionStorage.getItem("token")
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/access/getRoles`, {
        headers: { Authorization: `${token}` },
      })
      console.log(res.data)
      setRoles(res.data)
    } catch (error) {
      console.error("Failed to fetch roles", error)
    }
  }

  // Fetch modules from the new API
  const fetchModules = async () => {
    try {
      const token = sessionStorage.getItem("token")
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/modules/`, {
        headers: { Authorization: `${token}` },
      })
      console.log(res.data)
      setModules(res.data)
    } catch (error) {
      console.error("Failed to fetch modules", error)
    }
  }

  useEffect(() => {
    fetchRoles()
    fetchModules()
  }, [])

  // Update permissions when role changes
  useEffect(() => {
  if (formData.role && roles.length > 0 && modules.length > 0) {
    const roleData = roles.find((role) => role.roleName === formData.role)
    setSelectedRoleData(roleData)

    const newPermissions = {}

    if (roleData && roleData.roleAccessRights) {
      // Step 1: Compare modules with role access rights
      modules.forEach((module) => {
        const accessRight = roleData.roleAccessRights.find(
          (right) => right.accessRight.moduleName === module.moduleName
        )

        newPermissions[`${module.moduleName}_canView`] = accessRight
          ? accessRight.accessRight.canView
          : false
        newPermissions[`${module.moduleName}_canEdit`] = accessRight
          ? accessRight.accessRight.canEdit
          : false
        newPermissions[`${module.moduleName}_canDelete`] = accessRight
          ? accessRight.accessRight.canDelete
          : false
      })

      // Step 2: Apply userAccessRights ONLY if role has NOT changed from selectedUser
      if (
        selectedUser.role.roleName === formData.role &&
        selectedUser.userAccessRights &&
        selectedUser.userAccessRights.length > 0
      ) {
        selectedUser.userAccessRights.forEach((userAccess) => {
          const access = userAccess.accessRight
          const moduleName = access.moduleName

          if (newPermissions.hasOwnProperty(`${moduleName}_canView`)) {
            newPermissions[`${moduleName}_canView`] = access.canView
            newPermissions[`${moduleName}_canEdit`] = access.canEdit
            newPermissions[`${moduleName}_canDelete`] = access.canDelete
          }
        })
      }
    }

    // Step 3: Set final permissions
    setPermissions(newPermissions)
  }
}, [formData.role, roles, modules, selectedUser])

  // Populate form data when editing a user
  useEffect(() => {
    if (selectedUser) {
      console.log(selectedUser)
      setFormData({
        tenantName: selectedUser.tenant?.tenantName || "",
        firstName: selectedUser.firstName?.split(" ")[0] || "",
        lastName: selectedUser.lastName?.split(" ")[0] || "",
        emailId: selectedUser.email || "",
        role: selectedUser.role?.roleName || "",
      })
    } else {
      // Reset form for new user
      setFormData({
        tenantName: "",
        firstName: "",
        lastName: "",
        emailId: "",
        role: "",
      })
      setPermissions({})
      setSelectedRoleData(null)
    }
  }, [selectedUser])

  const handleInputChange = (field) => (event) => {
    setFormData((prev) => ({
      ...prev,
      [field]: event.target.value,
    }))
  }

  const handlePermissionToggle = (permissionKey) => {
  setPermissions((prev) => {
    const updatedPermissions = { ...prev };

    // Prevent toggling "Edit" or "Delete" if "View" is not checked
    if ((permissionKey.endsWith("_canEdit") || permissionKey.endsWith("_canDelete")) && !prev[permissionKey.replace(/_can(Edit|Delete)/, "_canView")]) {
      return prev; // No changes
    }

    updatedPermissions[permissionKey] = !updatedPermissions[permissionKey];

    // If "View" is unchecked, also uncheck "Edit" and "Delete"
    if (permissionKey.endsWith("_canView") && !updatedPermissions[permissionKey]) {
      const moduleName = permissionKey.replace("_canView", "");
      updatedPermissions[`${moduleName}_canEdit`] = false;
      updatedPermissions[`${moduleName}_canDelete`] = false;
    }

    return updatedPermissions;
  });
};

  const handleSubmit = () => {
    onSubmit(formData, permissions, selectedRoleData)
  }

  // Helper function to format module names for display
  const formatModuleName = (moduleName) => {
    return moduleName
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  }

  // Responsive field height
  const fieldHeight = isMobile ? "48px" : "56px"

  // Custom theme colors
  const greenPrimary = "#1b5e20" // green-900
  const greenHover = "#2e7d32" // green-600

  // Responsive grid columns for access rights
  const getGridColumns = () => {
    if (isMobile) return "1fr"
    if (isTablet) return "repeat(2, 1fr)"
    return "repeat(auto-fit, minmax(180px, 1fr))"
  }

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      fullWidth
      maxWidth="lg"
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : 2,
          boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
          // Remove fixed height - let it adjust to content
          maxHeight: isMobile ? "100vh" : "95vh",
          height: isMobile ? "100vh" : "auto",
          m: isMobile ? 0 : 2,
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          bgcolor: "#f8f9fa",
          borderBottom: "1px solid #e0e0e0",
          py: isMobile ? 1.5 : 2,
          px: isMobile ? 2 : 3,
          flexShrink: 0,
        }}
      >
        <Typography 
          variant={isMobile ? "h6" : "h5"} 
          fontWeight="600" 
          sx={{ color: greenPrimary }}
        >
          {selectedUser ? "Edit User" : "Add New User"}
        </Typography>
        {/* Add tenant name as subtitle only when editing */}
        {selectedUser && formData.tenantName && (
          <Typography 
            variant="body2" 
            sx={{ 
              color: "#666", 
              mt: 0.5, 
              fontSize: isMobile ? "0.8rem" : "0.875rem",
              fontWeight: 400 
            }}
          >
            {formData.tenantName}
          </Typography>
        )}
      </Box>

      <DialogContent 
        sx={{ 
          p: 0,
          overflow: "hidden", 
          display: "flex", 
          flexDirection: "column", 
          flex: 1,
          minHeight: 0, // Important for proper flexbox behavior
        }}
      >
        {/* Scrollable Content Area */}
        <Box 
          sx={{ 
            p: isMobile ? 2 : 3,
            overflowY: "auto",
            flex: 1,
            minHeight: 0, // Important for proper flexbox behavior
          }}
        >
          <Box sx={{ display: "flex", flexDirection: "column", gap: isMobile ? 2 : 2.5 }}>
            {/* Row 1: Email ID only */}
            <Box sx={{ display: "flex", gap: isMobile ? 2 : 3 }}>
              <Box sx={{ flex: 1 }}>
                <TextField
                  fullWidth
                  label="Email ID"
                  placeholder="Enter here"
                  type="email"
                  value={formData.emailId}
                  onChange={handleInputChange("emailId")}
                  variant="outlined"
                  disabled={true}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailIcon sx={{ color: greenPrimary }} />
                      </InputAdornment>
                    ),
                    sx: { height: fieldHeight },
                  }}
                />
              </Box>
            </Box>

            {/* Row 2: First Name, Last Name, and Role */}
            <Box sx={{ 
              display: "flex", 
              flexDirection: isMobile ? "column" : "row",
              gap: isMobile ? 2 : 3 
            }}>
              <Box sx={{ flex: 1 }}>
                <TextField
                  fullWidth
                  label="First Name"
                  placeholder="Enter here"
                  value={formData.firstName}
                  onChange={handleInputChange("firstName")}
                  variant="outlined"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonIcon sx={{ color: greenPrimary }} />
                      </InputAdornment>
                    ),
                    sx: { height: fieldHeight },
                  }}
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <TextField
                  fullWidth
                  label="Last Name"
                  placeholder="Enter here"
                  value={formData.lastName}
                  onChange={handleInputChange("lastName")}
                  variant="outlined"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonIcon sx={{ color: greenPrimary }} />
                      </InputAdornment>
                    ),
                    sx: { height: fieldHeight },
                  }}
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <FormControl fullWidth>
                  <InputLabel>Role</InputLabel>
                  <Select
                    value={formData.role}
                    onChange={handleInputChange("role")}
                    label="Role"
                    sx={{ height: fieldHeight }}
                  >
                    <MenuItem value="">Select from list</MenuItem>
                    {roles.map((role) => (
                      <MenuItem key={role.roleId} value={role.roleName}>
                        {role.roleName}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </Box>

            {/* Dynamic Access Details Section */}
            <Paper
              variant="outlined"
              sx={{
                p: isMobile ? 1.5 : 2.5,
                bgcolor: "#f8f9fa",
                borderColor: greenPrimary,
                borderRadius: 2,
                // Remove flex: 1 to allow natural sizing
                display: "flex",
                flexDirection: "column",
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
                <Box 
                  sx={{ 
                    display: "grid", 
                    gridTemplateColumns: getGridColumns(),
                    gap: isMobile ? 1.5 : 2,
                    // Remove fixed height constraints
                  }}
                >
                  {modules.map((module, index) => {
                    const moduleName = module.moduleName
                    const formattedModuleName = formatModuleName(moduleName)

                    return (
                      <Paper
                        key={index}
                        variant="outlined"
                        sx={{
                          p: isMobile ? 1.5 : 2,
                          bgcolor: "#ffffff",
                          borderColor: greenPrimary,
                          borderRadius: 2,
                          height: "fit-content",
                          minHeight: isMobile ? "120px" : "140px",
                        }}
                      >
                        <Typography 
                          variant={isMobile ? "body1" : "h6"} 
                          sx={{ 
                            color: greenPrimary, 
                            mb: isMobile ? 1 : 1.5, 
                            fontWeight: 600,
                            textAlign: "center",
                            pb: 1,
                            borderBottom: "1px solid #e0e0e0",
                            fontSize: isMobile ? "0.8rem" : "0.9rem",
                          }}
                        >
                          {formattedModuleName}
                        </Typography>
                        <Box sx={{ display: "flex", flexDirection: "column", gap: isMobile ? 0.5 : 1 }}>
                          {/* View Permission */}
                          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <Typography 
                              variant="body2" 
                              color="text.secondary" 
                              sx={{ 
                                fontWeight: 500, 
                                fontSize: isMobile ? "0.75rem" : "0.8rem" 
                              }}
                            >
                              View
                            </Typography>
                            <Switch
                              size="small"
                              checked={permissions[`${moduleName}_canView`] || false}
                              onChange={() => handlePermissionToggle(`${moduleName}_canView`)}
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
                          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <Typography 
                              variant="body2" 
                              color="text.secondary" 
                              sx={{ 
                                fontWeight: 500, 
                                fontSize: isMobile ? "0.75rem" : "0.8rem" 
                              }}
                            >
                              Edit
                            </Typography>
                            <Switch
                              size="small"
                              checked={permissions[`${moduleName}_canEdit`] || false}
                              onChange={() => handlePermissionToggle(`${moduleName}_canEdit`)}
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
                          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <Typography 
                              variant="body2" 
                              color="text.secondary" 
                              sx={{ 
                                fontWeight: 500, 
                                fontSize: isMobile ? "0.75rem" : "0.8rem" 
                              }}
                            >
                              Delete
                            </Typography>
                            <Switch
                              size="small"
                              checked={permissions[`${moduleName}_canDelete`] || false}
                              onChange={() => handlePermissionToggle(`${moduleName}_canDelete`)}
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
                    )
                  })}
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
                    {formData.role
                      ? "No access rights defined for this role"
                      : "Please select a role to view access rights"}
                  </Typography>
                </Box>
              )}
            </Paper>
          </Box>
        </Box>

        {/* Fixed Action Buttons at Bottom */}
        <Box sx={{ 
          display: "flex", 
          flexDirection: isMobile ? "column" : "row",
          justifyContent: "flex-end", 
          gap: isMobile ? 1.5 : 2, 
          p: isMobile ? 2 : 3,
          pt: 2,
          borderTop: "1px solid #e0e0e0",
          flexShrink: 0,
          bgcolor: "#ffffff", // Ensure white background
        }}>
          <Button
            onClick={onClose}
            variant="outlined"
            fullWidth={isMobile}
            sx={{
              borderColor: greenPrimary,
              color: greenPrimary,
              height: isMobile ? "48px" : "42px",
              minWidth: isMobile ? "auto" : "120px",
              "&:hover": {
                borderColor: greenHover,
                color: greenHover,
              },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            fullWidth={isMobile}
            sx={{
              bgcolor: greenPrimary,
              color: "white",
              height: isMobile ? "48px" : "42px",
              minWidth: isMobile ? "auto" : "150px",
              fontWeight: 600,
              "&:hover": {
                bgcolor: greenHover,
              },
            }}
          >
            {selectedUser ? "Update User" : "Create User"}
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  )
}

export default AddUserModal