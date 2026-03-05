"use client"

import { useState, useEffect } from "react"
import { User, X } from "lucide-react"
import axios from "axios"

const AddUserModal = ({ isOpen, onClose, onSubmit, selectedUser }) => {
  const [formData, setFormData] = useState({
    tenantName: "",
    name: "",
    emailId: "",
    role: ""
  })

  const generateInvoiceModule = import.meta.env.VITE_GENERATE_INVOICE_MODULE;

  const [permissions, setPermissions] = useState({})
  const [roles, setRoles] = useState([])
  const [selectedRoleData, setSelectedRoleData] = useState(null)
  const [modules, setModules] = useState([])
  const [loading, setLoading] = useState(false)

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
          selectedUser &&
          selectedUser.role &&
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
        name: selectedUser.name || "",
        emailId: selectedUser.email || "",
        role: selectedUser.role?.roleName || "",
      })
    } else {
      // Reset form for new user
      setFormData({
        tenantName: "",
        name: "",
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

  // Toggle component
  const Toggle = ({ checked, onChange, color = "green" }) => {
    const colorClasses = {
      green: checked ? "bg-green-600" : "bg-gray-300",
      yellow: checked ? "bg-yellow-500" : "bg-gray-300",
      red: checked ? "bg-red-600" : "bg-gray-300"
    }

    return (
      <button
        type="button"
        onClick={onChange}
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${color === "green" ? "focus:ring-green-500" :
          color === "yellow" ? "focus:ring-yellow-400" :
            "focus:ring-red-400"
          } ${colorClasses[color]}`}
      >
        <span
          className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${checked ? "translate-x-5" : "translate-x-1"
            }`}
        />
      </button>
    )
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#00000059] bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-[90vw] w-full mx-4 max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-green-900 flex items-center">
              <User size={20} className="mr-2 text-green-600" />
              {selectedUser ? "Edit User" : "Add User"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
            disabled={loading}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col p-6 overflow-y-auto">
          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-2">Email ID</label>
              <input
                type="email"
                placeholder="Enter Email ID"
                disabled={selectedUser ? true : false}
                value={formData.emailId}
                onChange={handleInputChange("emailId")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none  focus:ring-2 focus:ring-green-500 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-2">User's Name</label>
              <input
                type="text"
                placeholder="Enter User's Name"
                value={formData.name}
                onChange={handleInputChange("firstName")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none  focus:ring-2 focus:ring-green-500 focus:outline-none"
                readOnly
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-2">Role</label>
              <select
                value={formData.role}
                onChange={handleInputChange("role")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none  focus:ring-2 focus:ring-green-500 focus:outline-none"
              >
                <option value="">Select from list</option>
                {roles.map((role) => (
                  <option key={role.roleId} value={role.roleName}>
                    {role.roleName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Access Details */}
          <div className="border-2 rounded-xl p-4 md:p-6 bg-gray-50 border-green-300">
            <h2 className="text-green-700 font-semibold text-lg md:text-xl mb-4">Access Details</h2>

            {modules.length > 0 ? (
              <div className="bg-white rounded-lg overflow-hidden shadow-sm">
                {/* Header Row */}
                <div className="grid grid-cols-[1fr_80px_80px_80px] items-center px-4 py-3 bg-green-600 text-white font-semibold text-sm">
                  <span>Module</span>
                  <span className="text-center">View</span>
                  <span className="text-center">Edit</span>
                  <span className="text-center">Delete</span>
                </div>

                {/* Module Rows */}
                <div className="divide-y divide-gray-200">
                  {modules.map((module, index) => {
                    const moduleName = module.moduleName;
                    const formattedModuleName = formatModuleName(moduleName);

                    return (
                      <div
                        key={index}
                        className={`grid grid-cols-[1fr_80px_80px_80px] items-center px-4 py-3 hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'
                          }`}
                      >
                        <span className="text-gray-800 text-sm font-medium">
                          {formattedModuleName}
                        </span>

                        <div className="flex justify-center">
                          <Toggle
                            checked={permissions[`${moduleName}_canView`] || false}
                            onChange={() => handlePermissionToggle(`${moduleName}_canView`)}
                            color="green"
                          />
                        </div>

                        {moduleName !== generateInvoiceModule && (
                          <>
                            <div className="flex justify-center">
                              <Toggle
                                checked={permissions[`${moduleName}_canEdit`] || false}
                                onChange={() => handlePermissionToggle(`${moduleName}_canEdit`)}
                                color="yellow"
                              />
                            </div>

                            <div className="flex justify-center">
                              <Toggle
                                checked={permissions[`${moduleName}_canDelete`] || false}
                                onChange={() => handlePermissionToggle(`${moduleName}_canDelete`)}
                                color="red"
                              />
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 bg-white rounded-lg">
                <p className="text-gray-500">
                  {formData.role
                    ? 'No access rights defined for this role'
                    : 'Please select a role to view access rights'}
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Saving...' : selectedUser ? 'Update User' : 'Add User'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AddUserModal