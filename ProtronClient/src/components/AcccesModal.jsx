import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
const AddUserModal = ({ isOpen, onClose, onSubmit, selectedUser }) => {
  const [formData, setFormData] = useState({
    tenantName: '',
    firstName: '',
    lastName: '',
    emailId: '',
    role: '',
    manageEmail: '',
    status: 'Active'
  });

  const [permissions, setPermissions] = useState({
    dashboardAll: true,
    selfOnly: false,
    manageProjectsAll: true,
    addNewProject: false,
    mangeTeamForProjects: false,
    manageTeamAll: true,
    addNewTeam: false,
    addTeamMembers: false,
    timesheet: true,
    viewManageTimesheets: false
  });

  // Populate form data when editing a user
  useEffect(() => {
    if (selectedUser) {
      setFormData({
        tenantName: selectedUser.tenant || '',
        firstName: selectedUser.name?.split(' ')[0] || '',
        lastName: selectedUser.name?.split(' ').slice(1).join(' ') || '',
        emailId: selectedUser.email || '',
        role: selectedUser.role || '',
        manageEmail: '',
        status: selectedUser.status || 'Active'
      });
      // You might want to load user-specific permissions here as well
    } else {
      // Reset form for new user
      setFormData({
        tenantName: '',
        firstName: '',
        lastName: '',
        emailId: '',
        role: '',
        manageEmail: '',
        status: 'Active'
      });
      setPermissions({
        dashboardAll: true,
        selfOnly: false,
        manageProjectsAll: true,
        addNewProject: false,
        mangeTeamForProjects: false,
        manageTeamAll: true,
        addNewTeam: false,
        addTeamMembers: false,
        timesheet: true,
        viewManageTimesheets: false
      });
    }
  }, [selectedUser]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePermissionToggle = (permission) => {
    setPermissions(prev => ({
      ...prev,
      [permission]: !prev[permission]
    }));
  };

  const handleSubmit = () => {
    // Pass both formData and permissions to parent component
    onSubmit(formData, permissions);
  };

  const handleCancel = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">
            {selectedUser ? 'Edit User' : 'Add New User'}
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form Content */}
        <div className="p-6 space-y-6">
          {/* Tenant Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tenant name
            </label>
            <input
              type="text"
              name="tenantName"
              value={formData.tenantName}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* First Row - Name and Email */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                placeholder="Enter here"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                placeholder="Enter here"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Id
              </label>
              <input
                type="email"
                name="emailId"
                value={formData.emailId}
                onChange={handleInputChange}
                placeholder="Enter here"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
              />
            </div>
          </div>

          {/* Second Row - Role, Manage Email, Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-500"
              >
                <option value="">Select from list</option>
                <option value="Admin">Admin</option>
                <option value="Manager">Manager</option>
                <option value="User">User</option>
                <option value="Guest">Guest</option>
                <option value="Developer">Developer</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Manage Email
              </label>
              <select
                name="manageEmail"
                value={formData.manageEmail}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-500"
              >
                <option value="">Select from list</option>
                <option value="enabled">Enabled</option>
                <option value="disabled">Disabled</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Access Details Section */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-blue-600 mb-4">Access Details</h3>
            
            <div className="space-y-4">
              {/* Dashboard Section */}
              <div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm font-medium text-gray-700">Dashboard (All)</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={permissions.dashboardAll}
                      onChange={() => handlePermissionToggle('dashboardAll')}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between py-2 pl-4">
                  <span className="text-sm text-gray-600">- Self only</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={permissions.selfOnly}
                      onChange={() => handlePermissionToggle('selfOnly')}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                  </label>
                </div>
              </div>

              {/* Manage Projects Section */}
              <div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm font-medium text-gray-700">Manage Projects (All)</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={permissions.manageProjectsAll}
                      onChange={() => handlePermissionToggle('manageProjectsAll')}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between py-2 pl-4">
                  <span className="text-sm text-gray-600">- Add New Project</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={permissions.addNewProject}
                      onChange={() => handlePermissionToggle('addNewProject')}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between py-2 pl-4">
                  <span className="text-sm text-gray-600">- Mange Team for projects</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={permissions.mangeTeamForProjects}
                      onChange={() => handlePermissionToggle('mangeTeamForProjects')}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                  </label>
                </div>
              </div>

              {/* Manage Team Section */}
              <div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm font-medium text-gray-700">Manage Team (All)</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={permissions.manageTeamAll}
                      onChange={() => handlePermissionToggle('manageTeamAll')}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between py-2 pl-4">
                  <span className="text-sm text-gray-600">- Add New Team</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={permissions.addNewTeam}
                      onChange={() => handlePermissionToggle('addNewTeam')}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between py-2 pl-4">
                  <span className="text-sm text-gray-600">- Add Team Members</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={permissions.addTeamMembers}
                      onChange={() => handlePermissionToggle('addTeamMembers')}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                  </label>
                </div>
              </div>

              {/* Timesheet Section */}
              <div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm font-medium text-gray-700">Timesheet</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={permissions.timesheet}
                      onChange={() => handlePermissionToggle('timesheet')}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between py-2 pl-4">
                  <span className="text-sm text-gray-600">- View & Manage all Timesheets</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={permissions.viewManageTimesheets}
                      onChange={() => handlePermissionToggle('viewManageTimesheets')}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={handleCancel}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-6 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors"
          >
            {selectedUser ? 'Update' : 'Submit'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddUserModal;