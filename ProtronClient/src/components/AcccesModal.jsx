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
} from "@mui/material"
import PersonIcon from "@mui/icons-material/Person"
import EmailIcon from "@mui/icons-material/Email"
import BusinessIcon from "@mui/icons-material/Business"
import SettingsIcon from "@mui/icons-material/Settings"
import axios from "axios"

const AddUserModal = ({ isOpen, onClose, onSubmit, selectedUser }) => {
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
    setPermissions((prev) => ({
      ...prev,
      [permissionKey]: !prev[permissionKey],
    }))
  }

  const handleSubmit = () => {
    onSubmit(formData, permissions, selectedRoleData)
  }

  const handleReset = () => {
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

  // Helper function to format module names for display
  const formatModuleName = (moduleName) => {
    return moduleName
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  }

  // Common height for input fields
  const fieldHeight = "56px"

  // Custom theme colors
  const greenPrimary = "#1b5e20" // green-900
  const greenHover = "#2e7d32" // green-600

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      fullWidth
      maxWidth="md"
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
        <Typography variant="h5" fontWeight="600" sx={{ color: greenPrimary }}>
          {selectedUser ? "Edit User" : "Add New User"}
        </Typography>
      </Box>

      <DialogContent sx={{ p: 3 }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {/* Row 1: Tenant Name */}
          <Box sx={{ display: "flex", gap: 3 }}>
            <Box sx={{ flex: 1 }}>
              <TextField
                fullWidth
                label="Tenant Name"
                placeholder="Enter tenant name"
                value={formData.tenantName}
                onChange={handleInputChange("tenantName")}
                variant="outlined"
                disabled={'true'}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <BusinessIcon sx={{ color: greenPrimary }} />
                    </InputAdornment>
                  ),
                  sx: { height: fieldHeight },
                }}
              />
            </Box>
          </Box>

          {/* Row 2: First Name, Last Name, and Email ID */}
          <Box sx={{ display: "flex", gap: 3 }}>
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

          <Box sx={{ display: "flex", gap: 3 }}>
            <Box sx={{ flex: 1 }}>
              <TextField
                fullWidth
                label="Email ID"
                placeholder="Enter here"
                type="email"
                value={formData.emailId}
                onChange={handleInputChange("emailId")}
                variant="outlined"
                disabled={'true'}
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

          {/* Dynamic Access Details Section */}
          <Paper
            variant="outlined"
            sx={{
              p: 3,
              bgcolor: "#f8f9fa",
              borderColor: greenPrimary,
              borderRadius: 2,
            }}
          >
            <Typography variant="h6" sx={{ color: greenPrimary, mb: 3, fontWeight: 600 }}>
              Access Details
            </Typography>

            {modules.length > 0 ? (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {modules.map((module, index) => {
                  const moduleName = module.moduleName
                  const formattedModuleName = formatModuleName(moduleName)

                  return (
                    <Box key={index}>
                      <Typography variant="h6" sx={{ color: greenPrimary, mb: 2, fontWeight: 600 }}>
                        {formattedModuleName}
                      </Typography>

                      {/* View Permission */}
                      <Box
                        sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", py: 1, pl: 2 }}
                      >
                        <Typography variant="body2" color="text.secondary">
                          - Can View
                        </Typography>
                        <Switch
                          checked={permissions[`${moduleName}_canView`] || false}
                          onChange={() => handlePermissionToggle(`${moduleName}_canView`)}
                          sx={{
                            "& .MuiSwitch-switchBase.Mui-checked": {
                              color: greenPrimary,
                            },
                            "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                              backgroundColor: greenPrimary,
                            },
                          }}
                        />
                      </Box>

                      {/* Edit Permission */}
                      <Box
                        sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", py: 1, pl: 2 }}
                      >
                        <Typography variant="body2" color="text.secondary">
                          - Can Edit
                        </Typography>
                        <Switch
                          checked={permissions[`${moduleName}_canEdit`] || false}
                          onChange={() => handlePermissionToggle(`${moduleName}_canEdit`)}
                          sx={{
                            "& .MuiSwitch-switchBase.Mui-checked": {
                              color: greenPrimary,
                            },
                            "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                              backgroundColor: greenPrimary,
                            },
                          }}
                        />
                      </Box>

                      {/* Delete Permission */}
                      <Box
                        sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", py: 1, pl: 2 }}
                      >
                        <Typography variant="body2" color="text.secondary">
                          - Can Delete
                        </Typography>
                        <Switch
                          checked={permissions[`${moduleName}_canDelete`] || false}
                          onChange={() => handlePermissionToggle(`${moduleName}_canDelete`)}
                          sx={{
                            "& .MuiSwitch-switchBase.Mui-checked": {
                              color: greenPrimary,
                            },
                            "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                              backgroundColor: greenPrimary,
                            },
                          }}
                        />
                      </Box>
                    </Box>
                  )
                })}
              </Box>
            ) : (
              <Box sx={{ textAlign: "center", py: 4 }}>
                <Typography variant="body1" color="text.secondary">
                  {formData.role
                    ? "No access rights defined for this role"
                    : "Please select a role to view access rights"}
                </Typography>
              </Box>
            )}
          </Paper>

          {/* Action Buttons (Right-aligned) */}
          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 2 }}>
            <Button
              onClick={onClose}
              variant="outlined"
              sx={{
                borderColor: greenPrimary,
                color: greenPrimary,
                height: "42px",
                "&:hover": {
                  borderColor: greenHover,
                  color: greenHover,
                },
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleReset}
              variant="outlined"
              sx={{
                borderColor: greenPrimary,
                color: greenPrimary,
                height: "42px",
                "&:hover": {
                  borderColor: greenHover,
                  color: greenHover,
                },
              }}
            >
              Reset
            </Button>
            <Button
              onClick={handleSubmit}
              variant="contained"
              sx={{
                bgcolor: greenPrimary,
                color: "white",
                height: "42px",
                fontWeight: 600,
                "&:hover": {
                  bgcolor: greenHover,
                },
              }}
            >
              {selectedUser ? "Update User" : "Create User"}
            </Button>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  )
}

export default AddUserModal
