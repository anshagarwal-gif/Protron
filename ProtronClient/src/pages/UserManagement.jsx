import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import {
  ChevronDown,
  Users,
  Shield,
  Plus,
  Search,
  Pause,
  UserCog,
  FileText,
  ShieldCheck,
  Download,
  Loader2
} from "lucide-react";
import { useAccess } from "../Context/AccessContext";
import AddUserModal from "../components/AcccesModal";
import axios from "axios";
import ManageRoleModal from "../components/ManageRoleModal";
import AddRoleModal from "../components/AddRoleModal";
import GlobalSnackbar from "../components/GlobalSnackbar";

const UserManagement = () => {
  const navigate = useNavigate();

  const [isAddRoleModalOpen, setIsAddRoleModalOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [rolePermissions, setRolePermissions] = useState({});
  const [activeTab, setActiveTab] = useState("users");
  const [selectedTenant, setSelectedTenant] = useState("All Tenants");
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const { hasAccess } = useAccess();
  const [tenants, setTenants] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [roles, setRoles] = useState([]);
  const [modules, setModules] = useState([]);

  // Global snackbar state
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info"
  });

  const showSnackbar = (message, severity = "info") => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };



  // Custom loading overlay component
  const LoadingOverlay = () => (
    <div className="flex items-center justify-center h-full">
      <div className="flex items-center space-x-2">
        <Loader2 className="animate-spin text-green-700" size={24} />
        <span className="text-green-700 font-medium">Loading...</span>
      </div>
    </div>
  );

  // Excel download functions
  const downloadUsersExcel = () => {
    try {
      const excelData = filteredUsers.map((user, index) => ({
        'S.No': index + 1,
        'Name': getFullName(user),
        'Email': user.email || 'N/A',
        'Mobile Number': user.mobilePhone || 'N/A',
        'City': user.city || 'N/A',
        'Country': user.country || 'N/A',
        'Role': getRoleName(user.role),
        'Tenant': getTenantName(user),
        'Status': getUserStatus(user),
       
      }));

      const headers = Object.keys(excelData[0] || {});
      const csvContent = [
        headers.join(','),
        ...excelData.map(row =>
          headers.map(header => {
            const value = row[header] || '';
            return typeof value === 'string' && value.includes(',')
              ? `"${value.replace(/"/g, '""')}"`
              : value;
          }).join(',')
        )
      ].join('\n');

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
      showSnackbar('Failed to download Excel file. Please try again.', 'error');
    }
  };

  const downloadRolesExcel = () => {
    try {
      const excelData = roles.map((role, index) => {
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
          'Access Rights': accessRights
        };
      });

      const headers = Object.keys(excelData[0] || {});
      const csvContent = [
        headers.join(','),
        ...excelData.map(row =>
          headers.map(header => {
            const value = row[header] || '';
            return typeof value === 'string' && (value.includes(',') || value.includes('|'))
              ? `"${value.replace(/"/g, '""')}"`
              : value;
          }).join(',')
        )
      ].join('\n');

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
      showSnackbar('Failed to download Excel file. Please try again.', 'error');
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
      `${import.meta.env.VITE_API_URL}/api/tenants/${tenantId}/getAllUsers`,
      {
        headers: { Authorization: `${token}` }
      }
    );

    // Ensure users is always an array
    const fetchedUsers = Array.isArray(res.data) ? res.data : [];
    setUsers(fetchedUsers);

    const uniqueTenants = [...new Set(
      fetchedUsers
        .map(emp => emp.tenantName)
        .filter(Boolean)
    )];
    setTenants(["All Tenants", ...uniqueTenants]);
  } catch (error) {
    console.error("Error fetching employees:", error);
    setError(error.message || "Failed to fetch users");
    setUsers([]); // Set users to an empty array on error
  } finally {
    setLoading(false);
  }
};

  const fetchRoles = async () => {
    try {
      const token = sessionStorage.getItem("token");
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/access/getRoles`, {
        headers: { Authorization: `${token}` },
      });
      setRoles(res.data);
    } catch (error) {
      console.error("Failed to fetch roles", error);
    }
  };

  const fetchModules = async () => {
    try {
      const token = sessionStorage.getItem("token");
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/modules/`, {
        headers: { Authorization: `${token}` },
      });
      setModules(res.data);
    } catch (error) {
      console.error("Failed to fetch modules", error);
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchRoles();
    fetchModules();
  }, []);
  console.log("Users:", users);
  const getAllModuleNames = () => {
    const moduleNames = new Set(modules.map((module) => module.moduleName));
    roles.forEach((role) => {
      (role.roleAccessRights || []).forEach((ar) => {
        if (ar.accessRight?.moduleName) moduleNames.add(ar.accessRight.moduleName);
      });
    });
    return Array.from(moduleNames);
  };

  const getRoleName = (role) => {
    if (!role) return 'N/A';
    if (typeof role === 'string') return role;
    if (typeof role === 'object') {
      return role.roleName || role.name || 'N/A';
    }
    return 'N/A';
  };

  const filteredUsers = (Array.isArray(users) ? users : []).filter(user => {
  const tenantMatch = selectedTenant === "All Tenants" ||
    user.tenantName === selectedTenant;

  const roleName = getRoleName(user.role);
  const searchMatch = searchQuery === "" ||
    (user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      roleName.toLowerCase().includes(searchQuery.toLowerCase()));

  return tenantMatch && searchMatch;
});
const filteredRoles = roles.filter(role => {
  if (searchQuery === "") return true;
  
  const searchLower = searchQuery.toLowerCase();
  
  // Search in role name
  const roleNameMatch = role.roleName?.toLowerCase().includes(searchLower);
  
  // Search in access rights/permissions
  const accessRightsMatch = role.roleAccessRights?.some(accessRight => {
    const ar = accessRight.accessRight;
    // Search in module name
    const moduleNameMatch = ar?.moduleName?.toLowerCase().includes(searchLower);
    
    // Search in permission types (view, edit, delete)
    const permissionMatch = (
      (ar?.canView && 'view'.includes(searchLower)) ||
      (ar?.canEdit && 'edit'.includes(searchLower)) ||
      (ar?.canDelete && 'delete'.includes(searchLower))
    );
    
    return moduleNameMatch || permissionMatch;
  });
  
  return roleNameMatch || accessRightsMatch;
});
  // Action functions
  const handleHold = async (user) => {
    try {
      const token = sessionStorage.getItem('token');
      if (!token) {
        showSnackbar("Authentication required.", "error");
        return;
      }
      await axios.put(
        `${import.meta.env.VITE_API_URL}/api/users/status/hold/${user.userId}`,
        {},
        {
          headers: { Authorization: `${token}` }
        }
      );
      setUsers((prevUsers) => {
        return prevUsers.map(u =>
          u.userId === user.userId ? { ...u, status: 'hold' } : u
        );
      });
    } catch (err) {
      console.error("Failed to hold user:", err);
      showSnackbar("Failed to put user on hold. Please try again.", "error");
    }
  };

  const handleActivate = async (user) => {
    try {
      const token = sessionStorage.getItem('token');
      if (!token) {
        showSnackbar("Authentication required.", "error");
        return;
      }
      await axios.put(
        `${import.meta.env.VITE_API_URL}/api/users/status/activate/${user.userId}`,
        {},
        {
          headers: { Authorization: `${token}` }
        }
      );
      setUsers((prevUsers) => {
        return prevUsers.map(u =>
          u.userId === user.userId ? { ...u, status: 'active' } : u
        );
      });
    } catch (err) {
      console.error("Failed to activate user:", err);
      showSnackbar("Failed to activate user. Please try again.", "error");
    }
  };

  const handleManageUser = (user) => {
    const loggedInUserId = sessionStorage.getItem("userId");
    if (user.userId == loggedInUserId) {
      showSnackbar("You cannot edit your own information.", "error");
      return;
    }
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleAuditTrail = async (userEmail) => {
    try {
      const token = sessionStorage.getItem("token");
      if (!token) {
        showSnackbar("Authentication required.", "error");
        return;
      }

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/audit/user/${userEmail}`,
        {
          headers: { Authorization: `${token}` },
          responseType: "blob",
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `audit-trail-${userEmail}.log`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showSnackbar("Audit trail downloaded successfully.", "success");
    } catch (error) {
      console.error("Failed to download audit trail:", error);
      showSnackbar("Failed to download audit trail. Please try again.", "error");
    }
  };

  const handleManageRole = (roleId) => {
    const role = roles.find((r) => r.roleId === roleId);
    setSelectedRole(role);

    const perms = {};
    if (role && role.roleAccessRights) {
      role.roleAccessRights.forEach((accessRight) => {
        const ar = accessRight.accessRight;
        perms[`${ar.moduleName}_canView`] = ar.canView;
        perms[`${ar.moduleName}_canEdit`] = ar.canEdit;
        perms[`${ar.moduleName}_canDelete`] = ar.canDelete;
      });
    }

    modules.forEach((module) => {
      const moduleName = module.moduleName;
      if (!perms.hasOwnProperty(`${moduleName}_canView`)) {
        perms[`${moduleName}_canView`] = false;
        perms[`${moduleName}_canEdit`] = false;
        perms[`${moduleName}_canDelete`] = false;
      }
    });

    setRolePermissions(perms);
    setIsRoleModalOpen(true);
  };

  const handleRolePermissionToggle = (key) => {
    setRolePermissions((prev) => {
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

  const handleRoleModalSave = async () => {
    const modulesMap = {};
    Object.entries(rolePermissions).forEach(([key, value]) => {
      const match = key.match(/^(.+)_can(View|Edit|Delete)$/);
      if (match) {
        const moduleName = match[1];
        const right = match[2];
        if (!modulesMap[moduleName]) {
          modulesMap[moduleName] = { moduleName, canView: false, canEdit: false, canDelete: false };
        }
        modulesMap[moduleName][`can${right}`] = value;
      }
    });

    const requestBody = Object.values(modulesMap);

    try {
      const token = sessionStorage.getItem("token");
      if (!token) {
        showSnackbar("Authentication required.", "error");
        return;
      }

      await axios.put(
        `${import.meta.env.VITE_API_URL}/api/access/role/edit?roleId=${selectedRole.roleId}`,
        requestBody,
        {
          headers: {
            Authorization: `${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      await fetchRoles();
      showSnackbar("Role access rights updated successfully.", "success");
    } catch (err) {
      console.error("Failed to update role access rights:", err);
      showSnackbar("Failed to update role access rights. Please try again.", "error");
    }

    setIsRoleModalOpen(false);
    setSelectedRole(null);
    setRolePermissions({});
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
  };

  const handleModalSubmit = async (formData, permissions, updatedRoleData) => {
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
    try {
      const token = sessionStorage.getItem('token');
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
      await fetchEmployees();
    } catch (err) {
      console.error("Failed to update access rights:", err);
      showSnackbar("Failed to update access rights. Please try again.", "error");
    }
  };

  const getFullName = (user) => {
    return `${user.name}`.trim() || 'N/A';
  };

  const getTenantName = (user) => {
    return user.tenantName || 'N/A';
  };

  const getUserStatus = (user) => {
    return user.status;
  };

  const getPermissionsNumber = (permissions) => {
    if (!permissions || permissions.length === 0) {
      return "No Access Rights";
    }

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

  const handleAddRoleSubmit = async (roleName, accessRights) => {
    try {
      const token = sessionStorage.getItem("token");
      if (!token) {
        showSnackbar("Authentication required.", "error");
        return;
      }

      await axios.post(`${import.meta.env.VITE_API_URL}/api/access/role/add?roleName=${roleName}`, accessRights, {
        headers: {
          Authorization: `${token}`,
          "Content-Type": "application/json",
        },
      });

      showSnackbar("Role created successfully.", "success");
      await fetchRoles();
      setIsAddRoleModalOpen(false);
    } catch (error) {
      console.error("Failed to create role:", error);
      showSnackbar(error.status === 409 ? "Role already exists. Please choose a different name." : "Failed to create role. Please try again.", "error");
    }
  };

  // AG Grid column definitions for users
  const userColumnDefs = useMemo(() => [
    {
      headerName: "#",
      valueGetter: "node.rowIndex + 1",

      minWidth: 10,
      maxWidth: 50,
      pinned: "left",
      sortable: false,
      filter: false,
      suppressMenu: true,
      cellStyle: { textAlign: 'center' }
    },
    {
      headerName: "Name",
      field: "name",
      valueGetter: params => getFullName(params.data),
      flex: 1,
      minWidth: 150,
      sortable: true,
      filter: true,
      cellStyle: { fontWeight: 'bold' }
    },
    {
      headerName: "Email",
      field: "email",
      valueGetter: params => params.data.email || 'N/A',
      flex: 1,
      minWidth: 250,
      sortable: true,
      filter: true
    },
    {
      headerName: "Mobile Number",
      field: "mobileNumber",
      valueGetter: params => params.data.mobilePhone || 'N/A',
      flex: 1,
      minWidth: 200,
      sortable: true,
      filter: true
    },
    {
      headerName: "Role",
      field: "role",
      valueGetter: params => getRoleName(params.data.role),
      flex: 1,
      minWidth: 70,
      maxWidth: 170,
      sortable: true,
      filter: true
    },
    {
      headerName: "Tenant",
      field: "tenantName",
      valueGetter: params => getTenantName(params.data),
      flex: 1,
      minWidth: 150,
      sortable: true,
      filter: true
    },
    {
      headerName: "City",
      field: "city",
      valueGetter: params => params.data.city || 'N/A',
      flex: 1,
      minWidth: 100,
      sortable: true,
      filter: true
    },
    {
      headerName: "Country",
      field: "country",
      valueGetter: params => params.data.country || 'N/A',
      flex: 1,
      minWidth: 100,
      sortable: true,
      filter: true
    },
    {
  headerName: "Status",
  field: "status",
  valueGetter: params => getUserStatus(params.data),
  width: 120,
  sortable: true,
  filter: true,
  cellRenderer: params => {
    const rawStatus = params.value?.toLowerCase() || "inactive";

    const getStatusStyle = (status) => {
      switch (status) {
        case "active":
          return "bg-green-100 text-green-800";
        case "hold":
        case "on hold":
          return "bg-yellow-100 text-yellow-800";
        case "removed":
          return "bg-red-100 text-red-800";
        case "inactive":
        default:
          return "bg-gray-100 text-gray-800";
      }
    };

    const getStatusLabel = (status) => {
      switch (status) {
        case "active":
          return "Active";
        case "hold":
        case "on hold":
          return "On Hold";
        case "removed":
          return "Removed";
        case "inactive":
        default:
          return "Inactive";
      }
    };

    return (
      <span
        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusStyle(rawStatus)}`}
      >
        {getStatusLabel(rawStatus)}
      </span>
    );
  }
},
    {
      headerName: "Actions",
      field: "actions",
      width: 180,
      sortable: false,
      filter: false,
      suppressMenu: true,
      cellRenderer: params => {
        const user = params.data;
        return (
          <div className="flex justify-center gap-2 h-full items-center">
            {hasAccess('users', 'edit') && (
              user.status.toLowerCase() === 'active' ? (
                <button
                  onClick={() => handleHold(user)}
                  className="p-2 rounded-full hover:bg-orange-100 transition-colors"
                  title="Put user on hold"
                >
                  <Pause size={16} className="text-orange-600" />
                </button>
              ) : (
                <button
                  onClick={() => handleActivate(user)}
                  className="p-2 rounded-full hover:bg-green-100 transition-colors"
                  title="Activate user account"
                >
                  <ShieldCheck size={16} className="text-green-600" />
                </button>
              )
            )}

            {hasAccess('users', 'edit') && (
              <button
                onClick={() => handleManageUser(user)}
                className="p-2 rounded-full hover:bg-blue-100 transition-colors"
                title="Edit user permissions"
              >
                <UserCog size={16} className="text-blue-600" />
              </button>
            )}

            <button
              onClick={() => handleAuditTrail(user.email)}
              className="p-2 rounded-full hover:bg-purple-100 transition-colors"
              title="Download audit trail"
            >
              <FileText size={16} className="text-purple-600" />
            </button>
          </div>
        );
      }
    }
  ], [hasAccess, users]);

  // AG Grid column definitions for roles
  const roleColumnDefs = useMemo(() => [
    {
      headerName: "#",
      valueGetter: "node.rowIndex + 1",
      width: 70,
      pinned: "left",
      sortable: false,
      filter: false,
      suppressMenu: true,
      cellStyle: { textAlign: 'center' }
    },
    {
      headerName: "Role Name",
      field: "roleName",
      flex: 1,
      minWidth: 150,
      sortable: true,
      filter: true,
      cellStyle: { fontWeight: 'bold' }
    },
    {
      headerName: "Access Rights",
      field: "roleAccessRights",
      flex: 2,
      minWidth: 300,
      sortable: false,
      filter: false,
      cellRenderer: params => {
        return (
          <div className="py-2">
            {getPermissionsNumber(params.value)}
          </div>
        );
      },
      autoHeight: true
    },
    ...(hasAccess('users', 'edit') ? [{
      headerName: "Actions",
      field: "actions",
      width: 120,
      sortable: false,
      filter: false,
      suppressMenu: true,
      // REPLACE YOUR ROLE ACTIONS CELL RENDERER WITH THIS:

      cellRenderer: params => {
        const role = params.data;
        return (
          <div className="flex justify-center gap-2 h-full items-center">
            <button
              onClick={() => handleManageRole(role.roleId)}
              className="p-2 rounded-full hover:bg-blue-100 transition-colors"
              title="Manage Role Permissions"
            >
              <UserCog size={16} className="text-blue-600" />
            </button>
          </div>
        );
      }
    }] : [])
  ], [hasAccess, roles]);

  // AG Grid default column properties
  const defaultColDef = useMemo(() => ({
    sortable: true,
    filter: true,
    resizable: true,
    floatingFilter: false, // Remove floating filters
    filterParams: {
      buttons: ['reset', 'apply'],
      closeOnApply: true,
    },
    // Show filter icon in header
    suppressMenu: false,
    menuTabs: ['filterMenuTab'],
  }), []);

  return (
    <div className="w-full p-6 bg-white">
      {/* Header with toggle and tenant selector */}
      <div className="flex justify-between items-center mb-6">
        {/* Toggle buttons on left side */}
        <div className="relative bg-gray-200 p-1 rounded-full flex">
          <div
            className={`absolute top-1 bottom-1 bg-white rounded-full shadow-md transition-all duration-300 ease-in-out ${activeTab === "users" ? "left-1 right-1/2" : "left-1/2 right-1"
              }`}
          />
          <button
            className={`relative z-10 px-6 py-2 rounded-full transition-colors duration-300 ${activeTab === "users" ? "text-green-600" : "text-gray-600"
              }`}
            onClick={() => setActiveTab("users")}
          >
            <div className="flex items-center">
              <Users size={18} className="mr-2" />
              Manage Users
            </div>
          </button>
          <button
            className={`relative z-10 px-6 py-2 rounded-full transition-colors duration-300 ${activeTab === "roles" ? "text-green-600" : "text-gray-600"
              }`}
            onClick={() => setActiveTab("roles")}
          >
            <div className="flex items-center">
              <Shield size={18} className="mr-2" />
              Manage Roles
            </div>
          </button>
        </div>

        {/* Search and action buttons on right side */}
        <div className="flex items-center gap-4">
          {/* Search input */}
          <div className="relative w-64">
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <Search size={18} className="absolute left-3 top-2.5 text-gray-400" />
          </div>

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

      {/* Error display */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Content area */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">

        {/* AG Grid Tables */}
        <div className="ag-theme-alpine" style={{ height: '76vh', width: '100%' }}>
          <style jsx>{`
                  .ag-theme-alpine .ag-header {
                    background-color: #15803d!important;
                    color: white;
                    font-weight: 600;
                    
                    border-bottom: 2px solid #047857;
                  }
                  .ag-theme-alpine .ag-header-cell {
                    
                    color: white;
                    border-right: 1px solid #047857;
                    font-weight: 600;
                    font-size: 14px;
                  }
                          .ag-theme-alpine .ag-sort-ascending-icon,
                                    .ag-theme-alpine .ag-sort-descending-icon,
                                    .ag-theme-alpine .ag-sort-none-icon {
                                        color:rgb(246, 246, 246) !important;
                                        font-size: 20px !important;
                                        width: 20px !important;
                                        height: 20px !important;
                                        transform: scale(1.2) !important;
                                    }
                                        .ag-theme-alpine .ag-icon {
                                        color:rgb(246, 246, 246) !important;
                                        font-size: 20px !important;
                                        width: 20px !important;
                                        height: 20px !important;
                                        transform: scale(1.2) !important;
                                    }
                                    .ag-theme-alpine .ag-header-cell .ag-icon {
                                        color:rgb(223, 223, 223) !important;
                                        font-size: 20px !important;
                                        width: 20px !important;
                                        height: 20px !important;
                                        transform: scale(1.2) !important;
                                    }
                                    .ag-theme-alpine .ag-header-cell-menu-button {
                                        color:rgb(244, 240, 236) !important;
                                        padding: 4px !important;
                                    }
                                    .ag-theme-alpine .ag-header-cell-menu-button .ag-icon {
                                        font-size: 20px !important;
                                        width: 20px !important;
                                        height: 20px !important;
                                        transform: scale(1.2) !important;
                                    }
                  .ag-theme-alpine .ag-header-cell:hover {
                    background-color: #047857;
                  }
                  .ag-theme-alpine .ag-row {
                    border-bottom: 1px solid #e5e7eb;
                  }
                  .ag-theme-alpine .ag-row:hover {
                    background-color: #f0fdf4;
                  }
                                          .ag-theme-alpine .ag-filter-panel .ag-filter-apply-panel .ag-button.ag-button-secondary:hover {
                                        background: #f9fafb;
                                        border-color: #9ca3af;
                                    }
/* Left-align header labels */
.ag-theme-alpine .ag-header-cell .ag-header-cell-label {
    justify-content: flex-start;
}


                  .ag-theme-alpine .ag-row-even {
                    background-color: #ffffff;
                  }
                  .ag-theme-alpine .ag-row-odd {
                    background-color: #f9fafb;
                  }
.ag-theme-alpine .ag-cell {
  display: block !important;           /* Override AG Grid's flex */
  text-align: left !important;         /* Ensure text is left-aligned */
  white-space: nowrap;                 /* Prevent wrap */
  overflow: hidden;                    /* Hide overflow */
  text-overflow: ellipsis;            /* Show ... when content is too long */
  word-break: break-word;
  overflow-wrap: anywhere;

  border-right: 1px solid #e5e7eb;
  padding: 8px 12px;
  font-size: 14px;
}


                  .ag-theme-alpine .ag-pinned-left-cols-container {
                    border-right: 2px solid #d1d5db;
                  }
                  .ag-theme-alpine .ag-pinned-right-cols-container {
                    border-left: 2px solid #d1d5db;
                  }
                  .ag-theme-alpine .ag-paging-panel {
                    border-top: 2px solid #e5e7eb;
                    background-color: #f9fafb;
                    padding: 12px;
                  }
                    /* Paging Panel Container */
.ag-theme-alpine .ag-paging-panel {
  border-top: 2px solid #e5e7eb;
  background-color: #f0fdf4;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
  border-radius: 0 0 8px 8px;
  box-shadow: inset 0 1px 0 #d1d5db;
}


.ag-theme-alpine .ag-header-cell-menu-button {
    color: #ffffff !important;
    opacity: 1 !important;
    background: transparent !important;
}

.ag-theme-alpine .ag-header-cell-menu-button:hover {
    opacity: 0.8 !important;
}

.ag-theme-alpine .ag-header-cell-menu-button .ag-icon-menu {
    color: #ffffff !important;
    font-size: 16px !important;
}

.ag-theme-alpine .ag-header-cell-menu-button .ag-icon-filter {
    color: #ffffff !important;
    font-size: 16px !important;
}

/* Style for the filter icon */
.ag-theme-alpine .ag-icon-filter {
    color: #ffffff !important;
    background: transparent !important;
    padding: 2px;
    border-radius: 3px;
}

/* Active filter indicator */
.ag-theme-alpine .ag-header-cell-filtered .ag-header-cell-menu-button {
    opacity: 1 !important;
    background-color: rgba(255, 255, 255, 0.2) !important;
    border-radius: 3px;
}

/* Filter popup menu styling */
.ag-theme-alpine .ag-menu {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.ag-theme-alpine .ag-menu-header {
    background-color: #f9fafb;
    padding: 8px 12px;
    border-bottom: 1px solid #e5e7eb;
}

.ag-theme-alpine .ag-filter-condition {
    padding: 8px 12px;
}

/* Filter buttons in popup */
.ag-theme-alpine .ag-filter-apply-panel button {
    background: #15803d !important;
    color: white !important;
    border: none !important;
    padding: 6px 12px !important;
    border-radius: 4px !important;
    cursor: pointer !important;
    transition: background-color 0.2s !important;
}

.ag-theme-alpine .ag-filter-apply-panel button:hover {
    background: #166534 !important;
}

.ag-theme-alpine .ag-filter-wrapper .ag-filter-body .ag-input-wrapper::before {
    display: none !important;
}

/* Style the filter input */
.ag-theme-alpine .ag-filter-wrapper .ag-filter-body input {
    padding: 8px 12px !important;
    padding-left: 12px !important; /* Remove extra padding for icon */
    width: 100% !important;
    border: 1px solid #d1d5db !important;
    border-radius: 6px !important;
    font-size: 14px !important;
    background-image: none !important; /* Remove any background images */
}

/* Focus state for filter input */
.ag-theme-alpine .ag-filter-wrapper .ag-filter-body input:focus {
    border-color: #15803d !important;
    outline: none !important;
    box-shadow: 0 0 0 3px rgba(21, 128, 61, 0.1) !important;
}

/* Enhanced Pagination Buttons */
.ag-theme-alpine .ag-paging-button {
  background: linear-gradient(135deg, #15803d, #166534);
  color: white;
  border: none;
  border-radius: 4px;
  margin: 0 4px;
  min-width: 30px;
  height: 26px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease-in-out;
  box-shadow: 0 2px 4px rgba(21, 128, 61, 0.2);
  position: relative;
  overflow: hidden;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.ag-theme-alpine .ag-paging-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s ease;
}

.ag-theme-alpine .ag-paging-button:hover {
  background: linear-gradient(135deg, #166534, #14532d);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(21, 128, 61, 0.3);
}

.ag-theme-alpine .ag-paging-button:hover::before {
  left: 100%;
}

.ag-theme-alpine .ag-paging-button:active {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(21, 128, 61, 0.2);
}

.ag-theme-alpine .ag-paging-button[disabled] {
  background: #e5e7eb;
  color: #9ca3af;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.ag-theme-alpine .ag-paging-button[disabled]:hover {
  background: #e5e7eb;
  transform: none;
  box-shadow: none;
}

.ag-theme-alpine .ag-paging-button[disabled]::before {
  display: none;
}

/* First/Last page buttons */
.ag-theme-alpine .ag-paging-button:first-child,
.ag-theme-alpine .ag-paging-button:last-child {
  background: linear-gradient(135deg, #047857, #065f46);
  font-weight: 600;
}

.ag-theme-alpine .ag-paging-button:first-child:hover,
.ag-theme-alpine .ag-paging-button:last-child:hover {
  background: linear-gradient(135deg, #065f46, #064e3b);
}

/* Page Size Dropdown Label */
.ag-theme-alpine .ag-paging-panel::before {
  margin-right: 8px;
  font-weight: 500;
  color: #374151;
}

/* Page Size Selector */
.ag-theme-alpine select {
  padding: 8px 12px;
  border: 2px solid #d1d5db;
  border-radius: 8px;
  background-color: #ffffff;
  color: #111827;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease-in-out;
  appearance: none;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
  background-position: right 8px center;
  background-repeat: no-repeat;
  background-size: 16px;
  padding-right: 32px;
}

.ag-theme-alpine select:hover,
.ag-theme-alpine select:focus {
  border-color: #15803d;
  outline: none;
  background-color: #ecfdf5;
  box-shadow: 0 0 0 3px rgba(21, 128, 61, 0.1);
}

/* Page info text (e.g., 1 to 10 of 16) */
.ag-theme-alpine .ag-paging-row-summary-panel {
  font-weight: 500;
  font-size: 14px;
  color: #374151;
  padding: 8px 12px;

}

/* Pagination container improvements */
.ag-theme-alpine .ag-paging-panel .ag-paging-button-wrapper {
  display: flex;
  align-items: center;
  gap: 4px;
}

/* Current page indicator */
.ag-theme-alpine .ag-paging-button.ag-paging-button-current {
  background: linear-gradient(135deg, #dc2626, #b91c1c);
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(220, 38, 38, 0.3);
}

.ag-theme-alpine .ag-paging-button.ag-paging-button-current:hover {
  background: linear-gradient(135deg, #b91c1c, #991b1b);
}

                `}</style>
          {activeTab === "users" ? (
            <AgGridReact
              columnDefs={userColumnDefs}
              rowData={filteredUsers}
              defaultColDef={defaultColDef}
              pagination={true}
              paginationPageSize={10}
              paginationPageSizeSelector={[5, 10, 15, 20, 25, 50]}
              suppressMovableColumns={true}
              suppressRowClickSelection={true}
              enableBrowserTooltips={true}
              loadingOverlayComponent={LoadingOverlay}
              noRowsOverlayComponent={() => (
                <div className="flex items-center justify-center h-full">
                  <div className="text-gray-500 text-center">
                    <Users size={48} className="mx-auto mb-2 text-gray-300" />
                    <p className="text-lg font-medium">No users found</p>
                    <p className="text-sm">Try adjusting your search or filters</p>
                  </div>
                </div>
              )}
              overlayLoadingTemplate={
                '<div class="flex items-center justify-center h-full"><div class="flex items-center space-x-2"><div class="animate-spin rounded-full h-6 w-6 border-b-2 border-green-700"></div><span class="text-green-700 font-medium">Loading...</span></div></div>'
              }
              loading={loading}
              animateRows={true}
              rowHeight={48}
              headerHeight={48}
              suppressCellFocus={true}
              suppressRowHoverHighlight={false}
              rowClassRules={{
                'ag-row-hover': 'true'
              }}
              gridOptions={{
                getRowStyle: (params) => {
                  if (params.node.rowIndex % 2 === 0) {
                    return { backgroundColor: '#ffffff' };
                  } else {
                    return { backgroundColor: '#f9fafb' };
                  }
                }
              }}
            />
          ) : (
            <AgGridReact
              columnDefs={roleColumnDefs}
              rowData={filteredRoles}
              
              defaultColDef={defaultColDef}
              pagination={true}
              paginationPageSize={10}
              paginationPageSizeSelector={[5, 10, 15, 20, 25, 50]}
              suppressMovableColumns={true}
              suppressRowClickSelection={true}
              enableBrowserTooltips={true}
              loadingOverlayComponent={LoadingOverlay}
              noRowsOverlayComponent={() => (
                <div className="flex items-center justify-center h-full">
                  <div className="text-gray-500 text-center">
                    <Shield size={48} className="mx-auto mb-2 text-gray-300" />
                    <p className="text-lg font-medium">No roles found</p>
                    <p className="text-sm">Try adjusting your search or filters</p>
                  </div>
                </div>
              )}
              overlayLoadingTemplate={
                '<div class="flex items-center justify-center h-full"><div class="flex items-center space-x-2"><div class="animate-spin rounded-full h-6 w-6 border-b-2 border-green-700"></div><span class="text-green-700 font-medium">Loading...</span></div></div>'
              }
              loading={loading}
              animateRows={true}
              rowHeight={60}
              headerHeight={48}
              suppressCellFocus={true}
              suppressRowHoverHighlight={false}
              rowClassRules={{
                'ag-row-hover': 'true'
              }}
              gridOptions={{
                getRowStyle: (params) => {
                  if (params.node.rowIndex % 2 === 0) {
                    return { backgroundColor: '#ffffff' };
                  } else {
                    return { backgroundColor: '#f9fafb' };
                  }
                }
              }}
            />
          )}
        </div>
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
        modules={getAllModuleNames()}
      />

      <AddRoleModal
        open={isAddRoleModalOpen}
        onClose={() => setIsAddRoleModalOpen(false)}
        modulesList={getAllModuleNames()}
        onSubmit={handleAddRoleSubmit}
      />

      {/* Global Snackbar */}
      <GlobalSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={handleSnackbarClose}
      />
    </div>
  );
};

export default UserManagement;