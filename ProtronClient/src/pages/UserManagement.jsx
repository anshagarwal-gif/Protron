import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Users,
  Shield,
  Plus,
  Search,
  Pause,
  UserCog,
  FileText,
  ArrowUp,
  ArrowDown,
  ShieldCheck,
  Download
} from "lucide-react";
import { useAccess } from "../Context/AccessContext";
import AddUserModal from "../components/AcccesModal";
import axios from "axios";
import ManageRoleModal from "../components/ManageRoleModal";
import AddRoleModal from "../components/AddRoleModal";

const UserManagement = () => {
  const navigate = useNavigate();

  const [isAddRoleModalOpen, setIsAddRoleModalOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [rolePermissions, setRolePermissions] = useState({});
  const [activeTab, setActiveTab] = useState("users");
  const [selectedTenant, setSelectedTenant] = useState("All Tenants");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState("firstName");
  const [sortOrder, setSortOrder] = useState("asc");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const { hasAccess } = useAccess();
  const [tenants, setTenants] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [roles, setRoles] = useState([])
  console.log(roles)

  // Excel download functions
  const downloadUsersExcel = () => {
    try {
      // Prepare data for Excel
      const excelData = filteredUsers.map((user, index) => ({
        'S.No': index + 1,
        'Name': getFullName(user),
        'Email': user.email || 'N/A',
        'Role': getRoleName(user.role),
        'Tenant': getTenantName(user),
        'Status': getUserStatus(user),
        'User ID': user.userId || 'N/A'
      }));

      // Convert to CSV format
      const headers = Object.keys(excelData[0] || {});
      const csvContent = [
        headers.join(','),
        ...excelData.map(row => 
          headers.map(header => {
            const value = row[header] || '';
            // Escape quotes and wrap in quotes if contains comma
            return typeof value === 'string' && value.includes(',') 
              ? `"${value.replace(/"/g, '""')}"` 
              : value;
          }).join(',')
        )
      ].join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `users_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('Error downloading users Excel:', error);
      alert('Failed to download Excel file. Please try again.');
    }
  };

  const downloadRolesExcel = () => {
    try {
      // Prepare data for Excel
      const excelData = roles.map((role, index) => {
        // Convert access rights to readable format
        const accessRights = role.roleAccessRights?.map(ar => {
          const permissions = [];
          if (ar.accessRight?.canView) permissions.push('View');
          if (ar.accessRight?.canEdit) permissions.push('Edit');
          if (ar.accessRight?.canDelete) permissions.push('Delete');
          return `${ar.accessRight?.moduleName}: ${permissions.join(', ') || 'No Permissions'}`;
        }).join(' | ') || 'No Access Rights';

        return {
          'S.No': index + 1,
          'Role Name': role.roleName || 'N/A',
          'Role ID': role.roleId || 'N/A',
          'Access Rights': accessRights
        };
      });

      // Convert to CSV format
      const headers = Object.keys(excelData[0] || {});
      const csvContent = [
        headers.join(','),
        ...excelData.map(row => 
          headers.map(header => {
            const value = row[header] || '';
            // Escape quotes and wrap in quotes if contains comma or pipe
            return typeof value === 'string' && (value.includes(',') || value.includes('|'))
              ? `"${value.replace(/"/g, '""')}"` 
              : value;
          }).join(',')
        )
      ].join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `roles_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('Error downloading roles Excel:', error);
      alert('Failed to download Excel file. Please try again.');
    }
  };

  const fetchEmployees = async () => {
    setLoading(true);
    setError(null);
    try {
      const tenantId = sessionStorage.getItem("tenantId");
      const token = sessionStorage.getItem('token');

      if (!tenantId || !token) {
        throw new Error("Missing authentication credentials");
      }

      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/tenants/${tenantId}/users`,
        {
          headers: { Authorization: `${token}` }
        }
      );

      console.log(res.data);
      setUsers(res.data);

      // Extract unique tenant names with null safety
      const uniqueTenants = [...new Set(
        res.data
          .map(emp => emp.tenant?.tenantName)
          .filter(Boolean)
      )];

      setTenants(["All Tenants", ...uniqueTenants]);
    } catch (error) {
      console.error("Error fetching employees:", error);
      setError(error.message || "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

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

  useEffect(() => {
    fetchEmployees();
    fetchRoles();
  }, []);

  const getAllModuleNames = () => {
    const modules = new Set();
    roles.forEach(role => {
      (role.roleAccessRights || []).forEach(ar => {
        if (ar.accessRight?.moduleName) modules.add(ar.accessRight.moduleName);
      });
    });
    return Array.from(modules);
  };

  const handleAddRoleSubmit = async (roleName, accessRights) => {
  try {
    const token = sessionStorage.getItem('token');
    if (!token) {
      alert("Authentication required.");
      return;
    }
    // API expects roleName as param, accessRights as body
    const res = await axios.post(
      `${import.meta.env.VITE_API_URL}/api/access/role/add?roleName=${encodeURIComponent(roleName)}`,
      accessRights,
      {
        headers: {
          Authorization: `${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    // Optionally refresh roles after adding
    await fetchRoles();
    alert("Role added successfully.");
  } catch (err) {
    console.error("Failed to add new role:", err);
    alert("Failed to add new role. Please try again.");
  }
  setIsAddRoleModalOpen(false);
};

  // Helper function to get role name from role object or string
  const getRoleName = (role) => {
    if (!role) return 'N/A';
    if (typeof role === 'string') return role;
    if (typeof role === 'object') {
      return role.roleName || role.name || 'N/A';
    }
    return 'N/A';
  };

  // Filter users based on tenant and search query with null safety
  const filteredUsers = users.filter(user => {
    const tenantMatch = selectedTenant === "All Tenants" ||
      user.tenant?.tenantName === selectedTenant;

    const roleName = getRoleName(user.role);
    const searchMatch = searchQuery === "" ||
      (user.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        roleName.toLowerCase().includes(searchQuery.toLowerCase()));

    return tenantMatch && searchMatch;
  });

  // Sort function with null safety
  const sortItems = (itemsToSort, field, order) => {
    return [...itemsToSort].sort((a, b) => {
      let valueA, valueB;

      // Handle nested properties like tenant.tenantName
      if (field === 'tenant') {
        valueA = (a.tenant?.tenantName || '').toLowerCase();
        valueB = (b.tenant?.tenantName || '').toLowerCase();
      } else if (field === 'name') {
        // Combine first and last name for sorting
        valueA = `${a.firstName || ''} ${a.lastName || ''}`.toLowerCase().trim();
        valueB = `${b.firstName || ''} ${b.lastName || ''}`.toLowerCase().trim();
      } else if (field === 'role') {
        // Handle role object or string
        valueA = getRoleName(a.role).toLowerCase();
        valueB = getRoleName(b.role).toLowerCase();
      } else {
        valueA = (a[field]?.toString() || '').toLowerCase();
        valueB = (b[field]?.toString() || '').toLowerCase();
      }

      if (order === 'asc') {
        return valueA > valueB ? 1 : valueA < valueB ? -1 : 0;
      } else {
        return valueA < valueB ? 1 : valueA > valueB ? -1 : 0;
      }
    });
  };

  // Apply sorting to users
  const sortedUsers = sortItems(filteredUsers, sortField, sortOrder);

  // Handle sort
  const handleSort = (field) => {
    const newOrder = field === sortField && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortOrder(newOrder);
  };

  // Apply sorting to roles
  const sortedRoles = sortItems(roles, sortField, sortOrder);

  // Calculate pagination for users
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentUsers = sortedUsers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedUsers.length / itemsPerPage);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedTenant, sortField, sortOrder]);

  // Handle pagination
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Handle items per page change
  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  // Helper function to render sort icons
  const renderSortIcon = (field) => {
    if (sortField !== field) {
      return <ChevronDown className="ml-1 text-orange-500 text-md" />;
    }
    return sortOrder === 'asc' ?
      <ArrowUp className="ml-1 text-green-900" /> :
      <ArrowDown className="ml-1 text-green-900" />;
  };

  // Action functions
  const handleHold = async (user) => {
    try {
      const token = sessionStorage.getItem('token');
      if (!token) {
        alert("Authentication required.");
        return;
      }
      // Call the backend API to hold the user
      await axios.put(
        `${import.meta.env.VITE_API_URL}/api/users/status/hold/${user.userId}`,
        {},
        {
          headers: { Authorization: `${token}` }
        }
      );
      // Optionally show a success message
      // alert("User put on hold successfully.");
      // Refresh the user list to update the UI
      setUsers((prevUsers) => {
        return prevUsers.map(u =>
          u.userId === user.userId ? { ...u, status: 'hold' } : u
        );
      })
    } catch (err) {
      console.error("Failed to hold user:", err);
      alert("Failed to put user on hold. Please try again.");
    }
  };

  const handleActivate = async (user) => {
    try {
      const token = sessionStorage.getItem('token');
      if (!token) {
        alert("Authentication required.");
        return;
      }
      // Call the backend API to activate the user
      await axios.put(
        `${import.meta.env.VITE_API_URL}/api/users/status/activate/${user.userId}`,
        {},
        {
          headers: { Authorization: `${token}` }
        }
      );
      // Optionally show a success message
      // alert("User activated successfully.");
      // Refresh the user list to update the UI
      setUsers((prevUsers) => {
        return prevUsers.map(u =>
          u.userId === user.userId ? { ...u, status: 'active' } : u
        );
      }
      )
    } catch (err) {
      console.error("Failed to activate user:", err);
      alert("Failed to activate user. Please try again.");
    }
  };

  const handleManageUser = (user) => {
    console.log("Manage user:", user);
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleAuditTrail = (userId) => {
    console.log("View audit trail for user:", userId);
    // Implement audit trail navigation
  };

  const handleManageRole = (roleId) => {
    const role = roles.find(r => r.roleId === roleId);
    setSelectedRole(role);
    const perms = {};
    if (role && role.roleAccessRights) {
      role.roleAccessRights.forEach(accessRight => {
        const ar = accessRight.accessRight;
        perms[`${ar.moduleName}_canView`] = ar.canView;
        perms[`${ar.moduleName}_canEdit`] = ar.canEdit;
        perms[`${ar.moduleName}_canDelete`] = ar.canDelete;
      });
    }
    setRolePermissions(perms);
    setIsRoleModalOpen(true);
  };

  const handleRolePermissionToggle = (permissionKey) => {
    setRolePermissions(prev => ({
      ...prev,
      [permissionKey]: !prev[permissionKey]
    }));
  };

  const handleRoleModalSave = async () => {
    // Convert rolePermissions to array of { moduleName, canView, canEdit, canDelete }
    const modules = {};
    Object.entries(rolePermissions).forEach(([key, value]) => {
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
    const requestBody = Object.values(modules);

    try {
      const token = sessionStorage.getItem('token');
      if (!token) {
        alert("Authentication required.");
        return;
      }

      await axios.put(
        `${import.meta.env.VITE_API_URL}/api/access/role/edit?roleId=${selectedRole.roleId}`,
        requestBody,
        {
          headers: {
            Authorization: `${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      // Optionally show a success message or refresh roles
      await fetchRoles();
      alert("Role access rights updated successfully.");
    } catch (err) {
      console.error("Failed to update role access rights:", err);
      alert("Failed to update role access rights. Please try again.");
    }

    setIsRoleModalOpen(false);
    setSelectedRole(null);
    setRolePermissions({});
  };

  // Handle modal close
  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
  };

  // Handle modal submit
  const handleModalSubmit = async (formData, permissions, updatedRoleData) => {
    console.log("User data submitted:", formData);
    // console.log("Permissions:", permissions);

    const modules = {};

    Object.entries(permissions).forEach(([key, value]) => {
      // key example: "project_team_canEdit"
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

    // Convert to array
    const accessRights = Object.values(modules);
    const isRoleUpdated = selectedUser?.role?.roleName !== formData.role;
    console.log("Access rights to be submitted:", accessRights, isRoleUpdated);
    console.log("Updated role data:", updatedRoleData);
    console.log("Selected user:", selectedUser);
    try {
      const token = sessionStorage.getItem('token');
      // Determine if role is updated and include roleId if so
      let apiUrl = `${import.meta.env.VITE_API_URL}/api/access/edit?userIdToUpdate=${selectedUser.userId}&roleId=${updatedRoleData.roleId}`;
      await axios.put(
        apiUrl,
        accessRights,
        {
          headers: {
            Authorization: `${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      handleModalClose();
      // Optionally refresh users after submission
      await fetchEmployees();
    } catch (err) {
      console.error("Failed to update access rights:", err);
      alert("Failed to update access rights. Please try again.");
      // Optionally show error to user
    }
  };

  // Helper function to get full name
  const getFullName = (user) => {
    return `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'N/A';
  };

  // Helper function to get tenant name
  const getTenantName = (user) => {
    return user.tenant?.tenantName || 'N/A';
  };

  // Helper function to get user status
  const getUserStatus = (user) => {
    return user.status;
  };

  const getPermissionsNumber = (permissions) => {
    if (!permissions || permissions.length === 0) {
      return "No Access Rights";
    }

    // Render each module and its permissions as a styled block
    return (
      <div className="space-y-1">
        {permissions.map((perm, idx) => {
          const ar = perm.accessRight || {};
          const permsArr = [];
          if (ar.canView) permsArr.push(<span key="view" className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs mr-1">View</span>);
          if (ar.canEdit) permsArr.push(<span key="edit" className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded text-xs mr-1">Edit</span>);
          if (ar.canDelete) permsArr.push(<span key="delete" className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-xs mr-1">Delete</span>);
          return (
            <div key={ar.moduleName || idx} className="flex items-center flex-wrap">
              <span className="font-semibold mr-2">{ar.moduleName}:</span>
              {permsArr.length > 0 ? permsArr : <span className="text-gray-400 text-xs">No Permissions</span>}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="w-full p-6 bg-white">
      {/* Header with toggle and tenant selector */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-4 md:mb-0">
          <button
            className={`px-4 py-2 rounded-md transition-colors ${activeTab === "users" ? "bg-white shadow-sm" : "hover:bg-gray-200"
              }`}
            onClick={() => setActiveTab("users")}
          >
            <div className="flex items-center">
              <Users size={18} className="mr-2" />
              Manage Users
            </div>
          </button>
          <button
            className={`px-4 py-2 rounded-md transition-colors ${activeTab === "roles" ? "bg-white shadow-sm" : "hover:bg-gray-200"
              }`}
            onClick={() => setActiveTab("roles")}
          >
            <div className="flex items-center">
              <Shield size={18} className="mr-2" />
              Manage Roles
            </div>
          </button>
        </div>

        <div className="flex items-center space-x-4">
          <div className="relative">
            <select
              value={selectedTenant}
              onChange={(e) => setSelectedTenant(e.target.value)}
              className="appearance-none bg-white border border-gray-300 rounded-md py-2 pl-4 pr-10 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {tenants.map((tenant) => (
                <option key={tenant} value={tenant}>
                  {tenant}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
              <ChevronDown size={16} />
            </div>
          </div>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Content area */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        {/* Table header with search and create button */}
        <div className="p-4 border-b border-gray-200 flex flex-col md:flex-row justify-between items-center">
          <div className="relative w-full md:w-64 mb-4 md:mb-0">
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <Search size={18} className="absolute left-3 top-2.5 text-gray-400" />
          </div>
          
          <div className="flex items-center gap-2">
            {/* Download Excel Button */}
            <button
              className="flex items-center bg-green-900 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors"
              onClick={activeTab === "users" ? downloadUsersExcel : downloadRolesExcel}
            >
              <Download size={18} className="mr-2" />
              Download Excel
            </button>

            {/* Create User/Role Button */}
            {(hasAccess('users', 'edit') && activeTab === "users") && (
              <button
                className="flex items-center bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-md transition-colors"
                onClick={() => navigate('/signup')}
              >
                <Plus size={18} className="mr-2" />
                Create User
              </button>
            )}
            {activeTab === "roles" && hasAccess('users', 'edit') && (
              <button
                className="flex items-center bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-md transition-colors"
                onClick={() => setIsAddRoleModalOpen(true)}
              >
                <Plus size={18} className="mr-2" />
                Add New Role
              </button>
            )}
          </div>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="p-8 text-center text-gray-500">
            Loading...
          </div>
        )}

        {/* Tables */}
        {!loading && activeTab === "users" ? (
          <>
            {/* Users Table */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-green-700 text-white">
                    <th className="py-3 px-4 font-medium border-r">#</th>
                    <th
                      className="py-3 px-4 font-medium border-r cursor-pointer select-none"
                      onClick={() => handleSort('name')}
                    >
                      <div className="flex items-center">
                        Name
                        {renderSortIcon('name')}
                      </div>
                    </th>
                    <th
                      className="py-3 px-4 font-medium border-r cursor-pointer select-none"
                      onClick={() => handleSort('email')}
                    >
                      <div className="flex items-center">
                        Email
                        {renderSortIcon('email')}
                      </div>
                    </th>
                    <th
                      className="py-3 px-4 font-medium border-r cursor-pointer select-none"
                      onClick={() => handleSort('role')}
                    >
                      <div className="flex items-center">
                        Role
                        {renderSortIcon('role')}
                      </div>
                    </th>
                    <th
                      className="py-3 px-4 font-medium border-r cursor-pointer select-none"
                      onClick={() => handleSort('tenant')}
                    >
                      <div className="flex items-center">
                        Tenant
                        {renderSortIcon('tenant')}
                      </div>
                    </th>
                    <th
                      className="py-3 px-4 font-medium cursor-pointer select-none"
                      onClick={() => handleSort('status')}
                    >
                      <div className="flex items-center">
                        Status
                        {renderSortIcon('status')}
                      </div>
                    </th>
                    <th className="py-3 px-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentUsers.length > 0 ? (
                    currentUsers.map((user, index) => (
                      <tr
                        key={user.userId || index}
                        className={`border-t ${index % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-green-50`}
                      >
                        <td className="py-3 px-4 border-r">{indexOfFirstItem + index + 1}</td>
                        <td className="py-3 px-4 border-r font-medium">{getFullName(user)}</td>
                        <td className="py-3 px-4 border-r">{user.email || 'N/A'}</td>
                        <td className="py-3 px-4 border-r">{getRoleName(user.role)}</td>
                        <td className="py-3 px-4 border-r">{getTenantName(user)}</td>
                        <td className="py-3 px-4 border-r">
                          <span
                            className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getUserStatus(user) === "active"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                              }`}
                          >
                            {getUserStatus(user)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex justify-center gap-2">
                            {/* Hold Button */}
                            {hasAccess('users', 'edit') && (
                              user.status == 'active' ? (

                                <div className="relative group">
                                  <button
                                    onClick={() => handleHold(user)}
                                    className="p-2 rounded-full hover:bg-orange-100 transition-colors"
                                  >
                                    <Pause size={20} className="text-orange-600" />
                                  </button>
                                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                                    Hold
                                  </div>
                                </div>
                              ) : (
                                <div className="relative group">
                                  <button
                                    onClick={() => handleActivate(user)}
                                    className="p-2 rounded-full hover:bg-orange-100 transition-colors"
                                  >
                                    {/* <Pause size={20} className="text-orange-600" /> */}
                                    <ShieldCheck size={20} className="text-green-400" />
                                  </button>
                                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                                    Activate
                                  </div>
                                </div>
                              )
                            )}

                            {/* Manage Users Button */}
                            {hasAccess('users', 'edit') && (
                              <div className="relative group">
                                <button
                                  onClick={() => handleManageUser(user)}
                                  className="p-2 rounded-full hover:bg-blue-100 transition-colors"
                                >
                                  <UserCog size={20} className="text-blue-600" />
                                </button>
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                                  Manage Users
                                </div>
                              </div>)}

                            {/* Audit Trail Button */}
                            <div className="relative group">
                              <button
                                onClick={() => handleAuditTrail(user.userId)}
                                className="p-2 rounded-full hover:bg-purple-100 transition-colors"
                              >
                                <FileText size={20} className="text-purple-600" />
                              </button>
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                                Audit Trail
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="py-6 text-center text-gray-500 border-t">
                        No users found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        ) : !loading && activeTab === "roles" ? (
          <>
            {/* Roles Table */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-green-700 text-white">
                    <th className="py-3 px-4 font-medium border-r">#</th>
                    <th
                      className="py-3 px-4 font-medium border-r cursor-pointer select-none"
                      onClick={() => handleSort('name')}
                    >
                      <div className="flex items-center">
                        Role Name
                        {renderSortIcon('name')}
                      </div>
                    </th>
                    <th
                      className="py-3 px-4 font-medium cursor-pointer select-none"
                      onClick={() => handleSort('permissions')}
                    >
                      <div className="flex items-center">
                        Access Rights
                        {renderSortIcon('permissions')}
                      </div>
                    </th>
                    <th className="py-3 px-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedRoles.length > 0 ? (
                    sortedRoles.map((role, index) => (
                      <tr
                        key={role.id}
                        className={`border-t ${index % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-green-50`}
                      >
                        <td className="py-3 px-4 border-r">{index + 1}</td>
                        <td className="py-3 px-4 border-r font-medium">{role.roleName}</td>
                        <td className="py-3 px-4 border-r">{getPermissionsNumber(role.roleAccessRights)}</td>
                        <td className="py-3 px-4">
                          <div className="flex justify-center gap-2">
                            {/* Manage Role Button */}
                            <div className="relative group">
                              <button
                                onClick={() => handleManageRole(role.roleId)}
                                className="p-2 rounded-full hover:bg-blue-100 transition-colors"
                              >
                                <UserCog size={20} className="text-blue-600" />
                              </button>
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                                Manage Role
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="py-6 text-center text-gray-500 border-t">
                        No roles found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        ) : null}

        {/* Pagination Controls */}
        {!loading && activeTab === "users" && (
          <div className="px-4 py-3 flex justify-between items-center bg-white border-t">
            <div className="flex items-center">
              <span className="text-sm text-gray-700 mr-2">
                Rows per page:
              </span>
              <select
                value={itemsPerPage}
                onChange={handleItemsPerPageChange}
                className="appearance-none bg-white border border-gray-300 rounded-md py-1 pl-3 pr-8 text-sm leading-tight focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                {[5, 10, 15, 20].map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex space-x-1 items-center">
              <span className="text-sm text-gray-700">
                {sortedUsers.length > 0 ?
                  `${indexOfFirstItem + 1}-${Math.min(indexOfLastItem, sortedUsers.length)} of ${sortedUsers.length}` :
                  '0-0 of 0'
                }
              </span>
              <button
                className={`p-1 rounded-full ${currentPage === 1 || sortedUsers.length === 0
                    ? "text-gray-300 cursor-not-allowed"
                    : "text-green-700 hover:bg-green-100"
                  }`}
                onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                disabled={currentPage === 1 || sortedUsers.length === 0}
              >
                <ChevronLeft size={20} />
              </button>
              <button
                className={`p-1 rounded-full ${currentPage === totalPages || totalPages === 0
                    ? "text-gray-300 cursor-not-allowed"
                    : "text-green-700 hover:bg-green-100"
                  }`}
                onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages || totalPages === 0}
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Render Modal when open */}
      {isModalOpen && (
        <AddUserModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          onSubmit={handleModalSubmit}
          selectedUser={selectedUser}
        />
      )}
      <ManageRoleModal
        open={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        role={selectedRole}
        rolePermissions={rolePermissions}
        onPermissionToggle={handleRolePermissionToggle}
        onSave={handleRoleModalSave}
      />

      <AddRoleModal
        open={isAddRoleModalOpen}
        onClose={() => setIsAddRoleModalOpen(false)}
        modulesList={getAllModuleNames()}
        onSubmit={handleAddRoleSubmit}
      />
    </div>
  );
};

export default UserManagement;