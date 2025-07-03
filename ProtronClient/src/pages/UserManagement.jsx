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

    // Custom AG Grid theme styles
    const gridStyle = {
      '--ag-header-background-color': '#15803d',
      '--ag-header-foreground-color': '#ffffff',
      '--ag-border-color': '#e5e7eb',
      '--ag-row-hover-color': '#f0fdf4',
      '--ag-selected-row-background-color': '#dcfce7',
      '--ag-odd-row-background-color': '#f9fafb',
      '--ag-even-row-background-color': '#ffffff',
      '--ag-font-family': 'inherit',
      '--ag-font-size': '14px',
      '--ag-row-height': '48px',
      '--ag-header-height': '48px',
      '--ag-icon-font-family': 'inherit',
      // Make filter, pagination and sorting icons white
      '--ag-header-column-resize-handle-color': '#ffffff',
      '--ag-header-column-separator-color': '#ffffff',
      '--ag-icon-font-code-ascending': '"▲"',
      '--ag-icon-font-code-descending': '"▼"',
      '--ag-icon-font-code-none': '"↕"',
      '--ag-icon-font-code-filter': '"⚲"',
      '--ag-header-cell-hover-background-color': '#166534',
      '--ag-header-cell-moving-background-color': '#166534',
      // Remove floating filter row
      '--ag-header-column-separator-display': 'block',
      '--ag-header-column-separator-height': '100%',
      '--ag-header-column-separator-width': '1px',
      // Filter icon styling
      '--ag-icon-size': '12px',
      '--ag-header-column-filter-icon-color': '#ffffff',
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
          'Role': getRoleName(user.role),
          'Tenant': getTenantName(user),
          'Status': getUserStatus(user),
          'User ID': user.userId || 'N/A'
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
            'Role ID': role.roleId || 'N/A',
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
          `${import.meta.env.VITE_API_URL}/api/tenants/${tenantId}/users`,
          {
            headers: { Authorization: `${token}` }
          }
        );

        setUsers(res.data);
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

    const handleRolePermissionToggle = (permissionKey) => {
      setRolePermissions(prev => ({
        ...prev,
        [permissionKey]: !prev[permissionKey]
      }));
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
      return `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'N/A';
    };

    const getTenantName = (user) => {
      return user.tenant?.tenantName || 'N/A';
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
        showSnackbar("Failed to create role. Please try again.", "error");
      }
    };

    // AG Grid column definitions for users
    const userColumnDefs = useMemo(() => [
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
        minWidth: 200,
        sortable: true,
        filter: true
      },
      {
        headerName: "Role",
        field: "role",
        valueGetter: params => getRoleName(params.data.role),
        flex: 1,
        minWidth: 120,
        sortable: true,
        filter: true
      },
      {
        headerName: "Tenant",
        field: "tenant",
        valueGetter: params => getTenantName(params.data),
        flex: 1,
        minWidth: 120,
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
          const status = params.value;
          return (
            <span
              className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                status === "active"
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {status}
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
                user.status === 'active' ? (
                  <div className="relative group">
                    <button
                      onClick={() => handleHold(user)}
                      className="p-2 rounded-full hover:bg-orange-100 transition-colors"
                    >
                      <Pause size={16} className="text-orange-600" />
                    </button>
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                      Hold
                    </div>
                  </div>
                ) : (
                  <div className="relative group">
                    <button
                      onClick={() => handleActivate(user)}
                      className="p-2 rounded-full hover:bg-green-100 transition-colors"
                    >
                      <ShieldCheck size={16} className="text-green-600" />
                    </button>
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                      Activate
                    </div>
                  </div>
                )
              )}

              {hasAccess('users', 'edit') && (
                <div className="relative group">
                  <button
                    onClick={() => handleManageUser(user)}
                    className="p-2 rounded-full hover:bg-blue-100 transition-colors"
                  >
                    <UserCog size={16} className="text-blue-600" />
                  </button>
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                    Manage User
                  </div>
                </div>
              )}

              <div className="relative group">
                <button
                  onClick={() => handleAuditTrail(user.email)}
                  className="p-2 rounded-full hover:bg-purple-100 transition-colors"
                >
                  <FileText size={16} className="text-purple-600" />
                </button>
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                  Audit Trail
                </div>
              </div>
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
        cellRenderer: params => {
          const role = params.data;
          return (
            <div className="flex justify-center gap-2 h-full items-center">
              <div className="relative group">
                <button
                  onClick={() => handleManageRole(role.roleId)}
                  className="p-2 rounded-full hover:bg-blue-100 transition-colors"
                >
                  <UserCog size={16} className="text-blue-600" />
                </button>
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                  Manage Role
                </div>
              </div>
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
        <div className="flex flex-col md:flex-row justify-between items-center mb-6">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-4 md:mb-0">
            <button
              className={`px-4 py-2 rounded-md transition-colors ${
                activeTab === "users" ? "bg-white shadow-sm" : "hover:bg-gray-200"
              }`}
              onClick={() => setActiveTab("users")}
            >
              <div className="flex items-center">
                <Users size={18} className="mr-2" />
                Manage Users
              </div>
            </button>
            <button
              className={`px-4 py-2 rounded-md transition-colors ${
                activeTab === "roles" ? "bg-white shadow-sm" : "hover:bg-gray-200"
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

          {/* AG Grid Tables */}
          <div className="ag-theme-alpine" style={{ height: '600px', width: '100%', ...gridStyle }}>
             <style>{`
                                    .ag-theme-alpine {
                                        --ag-header-background-color: #15803d !important;
                                        --ag-header-foreground-color: #ffffff !important;
                                    }
                                    
                                    .ag-theme-alpine .ag-header {
                                        background-color: #15803d !important;
                                        border-bottom: 2px solid #166534 !important;
                                    }
                                    
                                    .ag-theme-alpine .ag-header-cell {
                                        background-color: #15803d !important;
                                        color: #ffffff !important;
                                        border-right: 1px solid rgba(255, 255, 255, 0.2) !important;
                                        font-weight: 600 !important;
                                    }
                                    
                                    .ag-theme-alpine .ag-header-cell:hover {
                                        background-color: #166534 !important;
                                    }
                                    
                                    .ag-theme-alpine .ag-header-cell-text {
                                        color: #ffffff !important;
                                        font-weight: 500;
                                    }
                                    
                                    .ag-theme-alpine .ag-header-cell-label {
                                        color: #ffffff !important;
                                    }
                                    
                                    .ag-theme-alpine .ag-header-cell-sortable .ag-header-cell-label {
                                        cursor: pointer;
                                    }
                                    
                                    .ag-theme-alpine .ag-header-cell-sortable .ag-header-cell-label:hover {
                                        color: #f3f4f6 !important;
                                    }
                                    
                                    .ag-theme-alpine .ag-menu {
                                        box-shadow: 0 10px 25px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
                                        border-radius: 8px;
                                        border: 1px solid #e5e7eb;
                                        overflow: hidden;
                                    }
                                    
                                    .ag-theme-alpine .ag-menu .ag-menu-list {
                                        padding: 8px 0;
                                    }
                                    
                                    .ag-theme-alpine .ag-menu .ag-menu-separator {
                                        margin: 4px 0;
                                        border-color: #e5e7eb;
                                    }
                                    
                                    .ag-theme-alpine .ag-filter-panel {
                                        padding: 16px;
                                        background: #ffffff;
                                    }
                                    
                                    .ag-theme-alpine .ag-filter-panel .ag-filter-body {
                                        padding: 0;
                                    }
                                    
                                    .ag-theme-alpine .ag-filter-panel .ag-filter-body .ag-filter-condition {
                                        margin: 8px 0;
                                    }
                                    
                                    .ag-theme-alpine .ag-filter-panel .ag-filter-body input {
                                        padding: 8px 12px;
                                        border: 1px solid #d1d5db;
                                        border-radius: 6px;
                                        font-size: 14px;
                                        transition: all 0.2s ease;
                                    }
                                    
                                    .ag-theme-alpine .ag-filter-panel .ag-filter-body input:focus {
                                        outline: none;
                                        border-color: #15803d;
                                        box-shadow: 0 0 0 3px rgba(21, 128, 61, 0.1);
                                    }
                                    
                                    .ag-theme-alpine .ag-filter-panel .ag-filter-body select {
                                        padding: 8px 12px;
                                        border: 1px solid #d1d5db;
                                        border-radius: 6px;
                                        font-size: 14px;
                                        background: #ffffff;
                                        transition: all 0.2s ease;
                                    }
                                    
                                    .ag-theme-alpine .ag-filter-panel .ag-filter-body select:focus {
                                        outline: none;
                                        border-color: #15803d;
                                        box-shadow: 0 0 0 3px rgba(21, 128, 61, 0.1);
                                    }
                                    
                                    .ag-theme-alpine .ag-filter-panel .ag-filter-apply-panel {
                                        padding: 16px 0 0 0;
                                        border-top: 1px solid #e5e7eb;
                                        margin-top: 16px;
                                        display: flex;
                                        justify-content: flex-end;
                                        gap: 8px;
                                    }
                                    
                                    .ag-theme-alpine .ag-filter-panel .ag-filter-apply-panel .ag-button {
                                        padding: 8px 16px;
                                        border-radius: 6px;
                                        font-size: 14px;
                                        font-weight: 500;
                                        transition: all 0.2s ease;
                                        border: 1px solid transparent;
                                        cursor: pointer;
                                    }
                                    
                                    .ag-theme-alpine .ag-filter-panel .ag-filter-apply-panel .ag-button:not(.ag-button-secondary) {
                                        background: #15803d;
                                        color: #ffffff;
                                        border-color: #15803d;
                                    }
                                                          .ag-theme-alpine .ag-filter-panel .ag-filter-apply-panel .ag-button.ag-button-secondary:hover {
                                        background: #f9fafb;
                                        border-color: #9ca3af;
                                    }
 /* Left-align header labels */
.ag-theme-alpine .ag-header-cell .ag-header-cell-label {
    justify-content: flex-start;
}

/* Left-align all cell content */
.ag-theme-alpine .ag-cell {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    text-align: left;
}
                                    .ag-theme-alpine .ag-filter-panel .ag-filter-apply-panel .ag-button:not(.ag-button-secondary):hover {
                                        background: #166534;
                                        border-color: #166534;
                                    }
                                    
                                    .ag-theme-alpine .ag-filter-panel .ag-filter-apply-panel .ag-button.ag-button-secondary {
                                        background: #ffffff;
                                        color: #374151;
                                        border-color: #d1d5db;
                                    }
                                    
                                    .ag-theme-alpine .ag-filter-panel .ag-filter-apply-panel .ag-button.ag-button-secondary:hover {
                                        background: #f9fafb;
                                        border-color: #9ca3af;
                                    }
                                    
                                    .ag-theme-alpine .ag-header-cell-menu-button {
                                        color: #ffffff !important;
                                        opacity: 0.8;
                                    }
                                    
                                    .ag-theme-alpine .ag-header-cell-menu-button:hover {
                                        opacity: 1;
                                    }
                                    
                                    .ag-theme-alpine .ag-header-cell-menu-button .ag-icon {
                                        color: #ffffff !important;
                                    }
                                    
                                    .ag-theme-alpine .ag-icon-menu {
                                        color: #ffffff !important;
                                    }
                                    
                                    .ag-theme-alpine .ag-icon-filter {
                                        color: #ffffff !important;
                                    }
                                    
                                    .ag-theme-alpine .ag-icon-asc,
                                    .ag-theme-alpine .ag-icon-desc,
                                    .ag-theme-alpine .ag-icon-none {
                                        color: #ffffff !important;
                                    }
                                    
                                    .ag-theme-alpine .ag-sort-ascending-icon,
                                    .ag-theme-alpine .ag-sort-descending-icon,
                                    .ag-theme-alpine .ag-sort-none-icon {
                                        color: #ffffff !important;
                                        font-size: 16px !important;
                                        width: 16px !important;
                                        height: 16px !important;
                                    }
                                    
                                    .ag-theme-alpine .ag-header-cell .ag-icon {
                                        color: #ffffff !important;
                                        font-size: 16px !important;
                                        width: 16px !important;
                                        height: 16px !important;
                                    }
                                    
                                    .ag-theme-alpine .ag-menu-option-text {
                                        color: #374151;
                                        font-size: 14px;
                                    }
                                    
                                    .ag-theme-alpine .ag-menu-option:hover {
                                        background: #f0fdf4;
                                    }
                                    
                                    .ag-theme-alpine .ag-menu-option-active {
                                        background: #dcfce7;
                                    }
                                    
                                    .ag-theme-alpine .ag-row {
                                        border-bottom: 1px solid #e5e7eb;
                                    }
                                    
                                    .ag-theme-alpine .ag-row:hover {
                                        background-color: #f0fdf4 !important;
                                    }
                                    
                                    .ag-theme-alpine .ag-paging-panel {
                                        border-top: 1px solid #d1d5db;
                                        background-color: #f9fafb;
                                    }
                                    
                                    .ag-theme-alpine .ag-paging-button {
                                        color: #15803d;
                                    }
                                    
                                    .ag-theme-alpine .ag-paging-button:hover {
                                        background-color: #dcfce7;
                                    }
                                    
                                    .ag-theme-alpine .ag-paging-button.ag-disabled {
                                        color: #9ca3af;
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
                rowData={roles}
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