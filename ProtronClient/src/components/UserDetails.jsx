// src/components/UserDetails.jsx
import { useLocation } from "react-router-dom"
import {
  User,
  Mail,
  Building,
  Phone,
  Globe,
  Shield,
  CheckCircle,
  XCircle,
  Eye,
  Edit3,
  Trash2,
  Lock,
  Unlock,
} from "lucide-react"

const UserDetails = () => {
  const location = useLocation()
  const { user } = location.state || {}
  console.log(user)

  if (!user) {
    return <p className="p-4 text-center text-gray-500">No user data found. Please navigate from the user list page.</p>
  }

  // Define access rights mapping for easier display
  const accessMapping = {
    canView: { label: "View", icon: Eye, color: "emerald" },
    canEdit: { label: "Edit", icon: Edit3, color: "green" },
    canDelete: { label: "Delete", icon: Trash2, color: "red" },
  }

  // Step 1: Process role access rights
  const processedAccessRights = (user.role?.roleAccessRights || []).reduce((acc, current) => {
    const { moduleName, canView, canEdit, canDelete } = current.accessRight
    acc[moduleName] = { canView, canEdit, canDelete }
    return acc
  }, {})

  // Step 2: Override with user-specific access rights (priority)
  ;(user.userAccessRights || []).forEach((current) => {
    const { moduleName, canView, canEdit, canDelete } = current.accessRight
    processedAccessRights[moduleName] = { canView, canEdit, canDelete }
  })

  // Determine user status styling
  const getStatusStyle = (status) => {
    switch (status) {
      case "active":
        return "bg-emerald-100 text-emerald-800 border border-emerald-200"
      case "hold":
        return "bg-amber-100 text-amber-800 border border-amber-200"
      case "inactive":
        return "bg-red-100 text-red-800 border border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border border-gray-200"
    }
  }

  const getPermissionBadgeStyle = (hasPermission, colorScheme) => {
    if (hasPermission) {
      switch (colorScheme) {
        case "emerald":
          return "bg-emerald-50 text-emerald-700 border-emerald-200"
        case "green":
          return "bg-green-50 text-green-700 border-green-200"
        case "red":
          return "bg-red-50 text-red-700 border-red-200"
        default:
          return "bg-gray-50 text-gray-700 border-gray-200"
      }
    }
    return "bg-gray-50 text-gray-400 border-gray-200"
  }

  return (
    <div className=" bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 p-3 sm:p-12">
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-green-100 p-6 sm:p-8 mx-auto">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row items-center justify-between pb-8 border-b border-green-200">
          <div className="flex items-center space-x-6">
            <div className="p-4 bg-gradient-to-br from-emerald-100 to-green-100 rounded-2xl text-emerald-600 shadow-lg">
              <User size={40} />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-700 to-green-600 bg-clip-text text-transparent">
                {user.name}
              </h1>
              <p className="text-lg font-medium text-green-600 mt-2 flex items-center">
                <Building size={16} className="mr-2" />
                {user.tenantName}
              </p>
            </div>
          </div>
          <div className="mt-6 sm:mt-0 flex flex-col items-center sm:items-end space-y-2">
            <span
              className={`px-6 py-2 rounded-full text-sm font-bold uppercase tracking-wider shadow-sm ${getStatusStyle(
                user.status,
              )}`}
            >
              {user.status}
            </span>
            <span className="text-sm text-green-600 font-medium">{user.role?.roleName || "No Role Assigned"}</span>
          </div>
        </div>

        {/* User Information Cards */}
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: Mail, label: "Email", value: user.email },
            { icon: Phone, label: "Phone", value: user.mobilePhone || "Not provided" },
            { icon: Globe, label: "Country", value: user.country || "Not specified" },
            { icon: Building, label: "City", value: user.city || "Not specified" },
          ].map((item, index) => (
            <div
              key={index}
              className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100 shadow-sm hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-center space-x-3 mb-2">
                <item.icon size={20} className="text-emerald-600" />
                <span className="text-sm font-semibold text-green-700 uppercase tracking-wide">{item.label}</span>
              </div>
              <p className="text-gray-800 font-medium text-balance">{item.value}</p>
            </div>
          ))}
        </div>

        {/* Access Rights Section */}
        <div className="mt-12">
          <div className="flex items-center space-x-3 mb-8">
            <div className="p-2 bg-gradient-to-br from-emerald-100 to-green-100 rounded-lg">
              <Shield size={24} className="text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-700 to-green-600 bg-clip-text text-transparent">
              Access Rights & Permissions
            </h2>
          </div>

          {Object.keys(processedAccessRights).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {Object.entries(processedAccessRights).map(([module, rights]) => (
                <div
                  key={module}
                  className="bg-gradient-to-br from-white to-green-50/50 rounded-xl p-6 border border-green-100 shadow-sm hover:shadow-lg transition-all duration-300"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-800 capitalize flex items-center">
                      <Lock size={18} className="mr-2 text-emerald-600" />
                      {module}
                    </h3>
                    <div className="flex items-center space-x-1">
                      {Object.values(rights).every(Boolean) ? (
                        <Unlock size={16} className="text-emerald-500" />
                      ) : (
                        <Lock size={16} className="text-gray-400" />
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    {Object.entries(accessMapping).map(([rightKey, config]) => {
                      const hasPermission = rights[rightKey]
                      const IconComponent = config.icon

                      return (
                        <div
                          key={rightKey}
                          className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-200 ${
                            hasPermission
                              ? getPermissionBadgeStyle(true, config.color) + " shadow-sm"
                              : getPermissionBadgeStyle(false, config.color)
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <IconComponent
                              size={16}
                              className={hasPermission ? `text-${config.color}-600` : "text-gray-400"}
                            />
                            <span
                              className={`font-semibold text-sm ${hasPermission ? "text-gray-800" : "text-gray-400"}`}
                            >
                              {config.label}
                            </span>
                          </div>
                          <div className="flex items-center">
                            {hasPermission ? (
                              <CheckCircle size={18} className="text-emerald-500" />
                            ) : (
                              <XCircle size={18} className="text-gray-400" />
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Permission Summary */}
                  <div className="mt-4 pt-4 border-t border-green-100">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600 font-medium">Permissions Active</span>
                      <span className="font-bold text-emerald-600">
                        {Object.values(rights).filter(Boolean).length} / {Object.keys(rights).length}
                      </span>
                    </div>
                    <div className="mt-2 bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-emerald-400 to-green-500 h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${(Object.values(rights).filter(Boolean).length / Object.keys(rights).length) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-green-50/30 rounded-xl border border-green-100">
              <Lock size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 text-lg font-medium">No specific access rights configured</p>
              <p className="text-gray-400 text-sm mt-2">Contact your administrator to set up permissions</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default UserDetails
