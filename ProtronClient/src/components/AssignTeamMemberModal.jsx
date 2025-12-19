import React, { useEffect, useRef, useState } from 'react';

const AssignTeamMemberModal = ({ isOpen, onClose, projectName, project, onAddMember }) => {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState(null);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    employeeCode: '',
    taskType: '',
    unit: '',
    cost: 0,
    releaseDate: '',
    onBoardingDate: '',
    tasktype: '',
    systemImpacted: '',
    pricingType: 'hourly'
  });
  const dateInputRef = useRef(null);

  const fetchUsersNotInProject = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/tenants/${sessionStorage.getItem("tenantId")}/users-not-in/${project?.project?.projectId}`, {
        headers: { Authorization: `${sessionStorage.getItem('token')}` }
      });
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.log(error)
    }
  }

  useEffect(() => {
    fetchUsersNotInProject();
  }, [project]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    console.log(name, value)
    if (name === 'email') {
      const user = users.find((user) => user.email === value);
      console.log(user)
      if (user) {
        setFormData({
          ...formData,
          email: value,
          name: user.name,
          employeeCode: user.empCode
        })
        setError(null);
      } else {
        setFormData({
          ...formData,
          email: value,
          name: '',
          employeeCode: ''
        });
        setError('User not found');
      }
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleEmailSearch = (value) => {
    setFormData({ ...formData, email: value });
    if (value) {
      const filtered = users.filter(
        (user) =>
          user.email.toLowerCase().includes(value.toLowerCase()) &&
          !project.projectTeam?.some(
            (member) =>
              member.status === "active" &&
              member.user?.email?.toLowerCase() === user.email?.toLowerCase()
          )
      );
      setFilteredUsers(filtered);
      setShowUserDropdown(true);
    } else {
      setShowUserDropdown(false);
    }
  };

  const selectUser = (user) => {
    setFormData({
      ...formData,
      email: user.email,
      name: user.name,
      employeeCode: user.empCode
    });
    setError(null);
    setShowUserDropdown(false);
  };

  const handleReset = () => {
    setFormData({
      name: '',
      email: '',
      employeeCode: '',
      taskType: '',
      unit: '',
      cost: 0,
      releaseDate: '',
      tasktype: '',
      systemImpacted: 0
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    onAddMember(formData);
    handleReset();
    onClose();
  };

  const currencySymbols = {
    USD: '$',
    INR: '₹',
    EUR: '€',
    GBP: '£',
    JPY: '¥'
  };
  const handleDateInputClick = () => {
    dateInputRef.current.showPicker?.(); // Safe call in case browser doesn't support it
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#00000059] bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl w-[90vw] max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gray-50 border-b border-gray-200 py-4 px-6">
          <h2 className="text-xl font-semibold text-green-900">
            Assign Team Member | {projectName}
          </h2>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          <div onSubmit={handleSubmit} className="flex flex-col gap-6">

            {/* First Row: Email, Name, Employee Code */}
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-green-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onFocus={() => setShowUserDropdown(true)} // Show dropdown on focus
                    onChange={(e) => handleEmailSearch(e.target.value)} // Filter users as user types
                    placeholder="Search for an email..."
                    className={`w-full pl-10 pr-3 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 ${error ? 'border-red-500' : 'border-gray-300'
                      }`}
                  />
                  {showUserDropdown && filteredUsers.length > 0 && (
                    <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto mt-1">
                      {filteredUsers.map((user, index) => (
                        <div
                          key={index}
                          onClick={() => selectUser(user)} // Select user on click
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                        >
                          <div className="font-medium">{user.email}</div>
                          <div className="text-sm text-gray-600">{user.name}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
              </div>

              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-green-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    disabled
                    placeholder="Name will be auto-filled"
                    className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md bg-gray-100 text-gray-500"
                  />
                </div>
              </div>

              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Employee Code</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-green-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-2 10a3 3 0 100-6 3 3 0 000 6z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    name="employeeCode"
                    value={formData.employeeCode}
                    disabled
                    placeholder="Employee Code will be auto-filled"
                    className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md bg-gray-100 text-gray-500"
                  />
                </div>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Task Type</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-green-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <select
                    name="tasktype"
                    value={formData.tasktype}
                    onChange={handleChange}
                    className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 appearance-none bg-white"
                  >
                    <option value="" disabled>Select Task Type</option>
                    <option value="Develop">Develop</option>
                    <option value="Design">Design</option>
                    <option value="Test">Test</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Second Row: Task Type and System Impacted */}
            <div className="flex gap-4">


              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">System Impacted</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-green-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <select
                    name="systemImpacted"
                    value={formData.systemImpacted || ''}
                    onChange={(e) => setFormData({ ...formData, systemImpacted: parseInt(e.target.value, 10) })}
                    className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 appearance-none bg-white"
                  >
                    <option value="" disabled>Select a system</option>
                    {project.systemsImpacted?.map((system, index) => (
                      <option key={index} value={system.systemId}>
                        {system.systemName}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Pricing Type</label>
                <div className="relative">

                  <input
                    type="text"
                    name="pricingType"
                    value="Hourly"
                    disabled
                    className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md bg-gray-100 text-gray-500"
                  />
                </div>
              </div>

              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                <div className="relative">
                  <select
                    name="unit"
                    value={formData.unit}
                    onChange={handleChange}
                    className="w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 appearance-none bg-white"
                  >
                    <option value="" disabled>Select Unit</option>
                    <option value="USD">USD</option>
                    <option value="INR">INR</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="JPY">JPY</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Cost</label>
                <div className="relative">
                  {formData.unit && (
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500">{currencySymbols[formData.unit]}</span>
                    </div>
                  )}
                  <input
                    type="number"
                    name="cost"
                    value={formData.cost}
                    onChange={handleChange}
                    placeholder="Enter amount"
                    className={`w-full ${formData.unit ? 'pl-8' : 'pl-3'} pr-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500`}
                  />
                </div>
              </div>
              <div className='flex-1'>
                <label className="block text-sm font-medium text-gray-700 mb-1">Onboarding Date</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-green-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <input
                    type="date"
                    name="onBoardingDate"
                    value={formData.onBoardingDate}
                    onChange={e => setFormData({ ...formData, onBoardingDate: e.target.value })}
                    onClick={e => e.target.showPicker && e.target.showPicker()}
                    className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </div>
              <div className='flex-1'>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Release Date</label>
                <div className="relative" onClick={handleDateInputClick}>
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-green-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <input
                    ref={dateInputRef}
                    type="date"
                    name="releaseDate"
                    value={formData.releaseDate}
                    onChange={(e) => setFormData({ ...formData, releaseDate: e.target.value })}
                    className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </div>

            </div>

            {/* Third Row: Pricing and Release Date */}

            {/* Action Buttons */}
            <div className="flex justify-end gap-4 mt-4 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => {
                  handleReset();
                  onClose();
                }}
                className="px-6 py-2 border border-green-900 text-green-900 rounded-md hover:border-green-600 hover:text-green-600 transition-colors duration-200 min-w-20"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="px-6 py-2 border border-green-900 text-green-900 rounded-md hover:border-green-600 hover:text-green-600 transition-colors duration-200 min-w-20"
              >
                Reset
              </button>
              <button
                type="submit"
                onClick={handleSubmit}
                className="px-6 py-2 bg-green-900 text-white rounded-md hover:bg-green-600 transition-colors duration-200 font-semibold min-w-20"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignTeamMemberModal;