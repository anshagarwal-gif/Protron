import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight, 
  Users, 
  Shield, 
  Plus, 
  Search,
  Eye as FiEye,
  Edit as FiEdit,
  ArrowUp as FiArrowUp,
  ArrowDown as FiArrowDown
} from "lucide-react";
import { useAccess } from "../Context/AccessContext";

const UserManagement = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("users"); // "users" or "roles"
  const [selectedTenant, setSelectedTenant] = useState("All Tenants");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const { hasAccess } = useAccess() // Assuming useAccess is imported from your context

  // Sample data for demonstration
  const tenants = ["All Tenants", "Tenant A", "Tenant B", "Tenant C"];
  
  const users = [
    { id: 1, name: "John Doe", email: "john@example.com", role: "Admin", tenant: "Tenant A", status: "Active" },
    { id: 2, name: "Jane Smith", email: "jane@example.com", role: "User", tenant: "Tenant B", status: "Active" },
    { id: 3, name: "Robert Johnson", email: "robert@example.com", role: "Manager", tenant: "Tenant A", status: "Inactive" },
    { id: 4, name: "Lisa Brown", email: "lisa@example.com", role: "User", tenant: "Tenant C", status: "Active" },
    { id: 5, name: "Michael Wilson", email: "michael@example.com", role: "Admin", tenant: "Tenant B", status: "Active" },
    { id: 6, name: "Emily Davis", email: "emily@example.com", role: "User", tenant: "Tenant A", status: "Active" },
    { id: 7, name: "David Martinez", email: "david@example.com", role: "Manager", tenant: "Tenant C", status: "Inactive" },
    { id: 8, name: "Sarah Thompson", email: "sarah@example.com", role: "User", tenant: "Tenant B", status: "Active" },
    { id: 9, name: "Alex Johnson", email: "alex@example.com", role: "Admin", tenant: "Tenant A", status: "Active" },
    { id: 10, name: "Jessica White", email: "jessica@example.com", role: "User", tenant: "Tenant C", status: "Active" },
    { id: 11, name: "Ryan Nelson", email: "ryan@example.com", role: "Manager", tenant: "Tenant B", status: "Inactive" },
    { id: 12, name: "Olivia Lee", email: "olivia@example.com", role: "User", tenant: "Tenant A", status: "Active" },
  ];
  
  const roles = [
    { id: 1, name: "Admin", description: "Full system access", permissions: 10 },
    { id: 2, name: "Manager", description: "Limited administrative access", permissions: 7 },
    { id: 3, name: "User", description: "Standard user access", permissions: 4 },
    { id: 4, name: "Guest", description: "View-only access", permissions: 2 },
    { id: 5, name: "Developer", description: "Technical access", permissions: 6 },
  ];

  // Filter users based on tenant and search query
  const filteredUsers = users.filter(user => 
    (selectedTenant === "All Tenants" || user.tenant === selectedTenant) && 
    (user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
     user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
     user.role.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Sort function for any collection
  const sortItems = (itemsToSort, field, order) => {
    return [...itemsToSort].sort((a, b) => {
      let valueA = a[field]?.toString().toLowerCase() || '';
      let valueB = b[field]?.toString().toLowerCase() || '';
      
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
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  // Handle pagination
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Handle items per page change
  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  // Helper function to render sort icons
  const renderSortIcon = (field) => {
    if (sortField !== field) {
      return <ChevronDown className="ml-1 text-orange-500 text-md" />;
    }
    return sortOrder === 'asc' ?
      <FiArrowUp className="ml-1 text-green-900" /> :
      <FiArrowDown className="ml-1 text-green-900" />;
  };

  // Placeholder functions for actions
  const handleView = (user) => {
    console.log("Viewing user:", user);
  };

  const handleEdit = (userId) => {
    console.log("Editing user:", userId);
  };

  const handleViewRole = (role) => {
    console.log("Viewing role:", role);
  };

  const handleEditRole = (roleId) => {
    console.log("Editing role:", roleId);
  };
  
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
          {hasAccess('users', 'edit') && (
          <button
            className="flex items-center bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-md transition-colors"
            onClick={() => navigate('/signup')}
          >
            <Plus size={18} className="mr-2" />
            Create User
          </button>)}
        </div>

        {/* Tables */}
        {activeTab === "users" ? (
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
                        key={user.id}
                        className={`border-t ${index % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-green-50`}
                      >
                        <td className="py-3 px-4 border-r">{indexOfFirstItem + index + 1}</td>
                        <td className="py-3 px-4 border-r font-medium">{user.name}</td>
                        <td className="py-3 px-4 border-r">{user.email}</td>
                        <td className="py-3 px-4 border-r">{user.role}</td>
                        <td className="py-3 px-4 border-r">{user.tenant}</td>
                        <td className="py-3 px-4 border-r">
                          <span
                            className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              user.status === "Active"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {user.status}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex justify-center gap-2">
                            {/* View User Button */}
                            <button
                              onClick={() => handleView(user)}
                              className="p-2 rounded-full hover:bg-green-100"
                              title="View"
                            >
                              <FiEye size={20} className="text-green-700" />
                            </button>

                            {/* Edit User Button */}
                            <button
                              onClick={() => handleEdit(user.id)}
                              className="p-2 rounded-full hover:bg-green-100"
                              title="Edit"
                            >
                              <FiEdit size={20} className="text-green-700" />
                            </button>
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
        ) : (
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
                      className="py-3 px-4 font-medium border-r cursor-pointer select-none"
                      onClick={() => handleSort('description')}
                    >
                      <div className="flex items-center">
                        Description
                        {renderSortIcon('description')}
                      </div>
                    </th>
                    <th
                      className="py-3 px-4 font-medium cursor-pointer select-none"
                      onClick={() => handleSort('permissions')}
                    >
                      <div className="flex items-center">
                        Permissions
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
                        <td className="py-3 px-4 border-r font-medium">{role.name}</td>
                        <td className="py-3 px-4 border-r">{role.description}</td>
                        <td className="py-3 px-4 border-r">{role.permissions}</td>
                        <td className="py-3 px-4">
                          <div className="flex justify-center gap-2">
                            {/* View Role Button */}
                            <button
                              onClick={() => handleViewRole(role)}
                              className="p-2 rounded-full hover:bg-green-100"
                              title="View"
                            >
                              <FiEye size={20} className="text-green-700" />
                            </button>

                            {/* Edit Role Button */}
                            <button
                              onClick={() => handleEditRole(role.id)}
                              className="p-2 rounded-full hover:bg-green-100"
                              title="Edit"
                            >
                              <FiEdit size={20} className="text-green-700" />
                            </button>
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
        )}

        {/* Pagination Controls */}
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
              {filteredUsers.length > 0 ? `${indexOfFirstItem + 1}-${Math.min(indexOfLastItem, filteredUsers.length)} of ${filteredUsers.length}` : '0-0 of 0'}
            </span>
            <button
              className={`p-1 rounded-full ${
                currentPage === 1 || filteredUsers.length === 0
                  ? "text-gray-300 cursor-not-allowed"
                  : "text-green-700 hover:bg-green-100"
              }`}
              onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
              disabled={currentPage === 1 || filteredUsers.length === 0}
            >
              <ChevronLeft size={20} />
            </button>
            <button
              className={`p-1 rounded-full ${
                currentPage === totalPages || totalPages === 0
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
      </div>
    </div>
  );
};

export default UserManagement;