import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Edit, Eye, Send, Plus, Save, X, Check } from 'lucide-react';

const TimesheetDashboard = () => {
  const [timesheets, setTimesheets] = useState([
    {
      id: 1,
      date: '2024-05-20',
      project: 'Project Alpha',
      task: 'Frontend Development',
      startTime: '09:00',
      endTime: '17:00',
      breakTime: 60,
      totalHours: 7,
      description: 'Worked on user interface components',
      status: 'draft'
    },
    {
      id: 2,
      date: '2024-05-21',
      project: 'Project Beta',
      task: 'Backend API',
      startTime: '09:30',
      endTime: '18:00',
      breakTime: 30,
      totalHours: 8,
      description: 'Implemented REST API endpoints',
      status: 'submitted'
    },
    {
      id: 3,
      date: '2024-05-22',
      project: 'Project Alpha',
      task: 'Testing',
      startTime: '08:00',
      endTime: '16:30',
      breakTime: 60,
      totalHours: 7.5,
      description: 'Unit testing and bug fixes',
      status: 'approved'
    }
  ]);

  const [currentView, setCurrentView] = useState('view');
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    date: '',
    project: '',
    task: '',
    startTime: '',
    endTime: '',
    breakTime: 0,
    description: ''
  });

  const projects = ['Project Alpha', 'Project Beta', 'Project Gamma', 'Internal'];
  const tasks = ['Frontend Development', 'Backend API', 'Testing', 'Documentation', 'Meeting', 'Research'];

  const calculateHours = (start, end, breakMinutes) => {
    if (!start || !end) return 0;
    const startTime = new Date(`2000-01-01T${start}`);
    const endTime = new Date(`2000-01-01T${end}`);
    const diffMs = endTime - startTime;
    const diffHours = diffMs / (1000 * 60 * 60);
    return Math.max(0, diffHours - (breakMinutes / 60));
  };

  const handleInputChange = (field, value) => {
    const newData = { ...formData, [field]: value };
    
    if (field === 'startTime' || field === 'endTime' || field === 'breakTime') {
      const totalHours = calculateHours(
        newData.startTime, 
        newData.endTime, 
        parseInt(newData.breakTime) || 0
      );
      newData.totalHours = Math.round(totalHours * 100) / 100;
    }
    
    setFormData(newData);
  };

  const resetForm = () => {
    setFormData({
      date: '',
      project: '',
      task: '',
      startTime: '',
      endTime: '',
      breakTime: 0,
      description: ''
    });
  };

  const handleSave = () => {
    if (!formData.date || !formData.project || !formData.startTime || !formData.endTime) {
      alert('Please fill in all required fields');
      return;
    }

    const totalHours = calculateHours(formData.startTime, formData.endTime, parseInt(formData.breakTime) || 0);
    
    if (editingId) {
      setTimesheets(prev => prev.map(ts => 
        ts.id === editingId 
          ? { ...ts, ...formData, totalHours, status: 'draft' }
          : ts
      ));
      setEditingId(null);
    } else {
      const newTimesheet = {
        id: Date.now(),
        ...formData,
        totalHours,
        breakTime: parseInt(formData.breakTime) || 0,
        status: 'draft'
      };
      setTimesheets(prev => [...prev, newTimesheet]);
    }
    
    resetForm();
    setCurrentView('view');
  };

  const handleEdit = (timesheet) => {
    if (timesheet.status === 'approved') {
      alert('Cannot edit approved timesheets');
      return;
    }
    setFormData(timesheet);
    setEditingId(timesheet.id);
    setCurrentView('create');
  };

  const handleSubmitForApproval = (id) => {
    setTimesheets(prev => prev.map(ts => 
      ts.id === id ? { ...ts, status: 'submitted' } : ts
    ));
  };

  const handleDelete = (id) => {
    const timesheet = timesheets.find(ts => ts.id === id);
    if (timesheet.status === 'approved') {
      alert('Cannot delete approved timesheets');
      return;
    }
    if (confirm('Are you sure you want to delete this timesheet?')) {
      setTimesheets(prev => prev.filter(ts => ts.id !== id));
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      draft: 'bg-gray-100 text-gray-800',
      submitted: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getTotalHours = () => {
    return timesheets.reduce((total, ts) => total + ts.totalHours, 0).toFixed(1);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Clock className="h-6 w-6 text-blue-600" />
                Timesheet Dashboard
              </h1>
              <p className="text-gray-600 mt-1">Track your daily work hours and submit for approval</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setCurrentView('view')}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                  currentView === 'view'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Eye className="h-4 w-4" />
                View Timesheets
              </button>
              <button
                onClick={() => {
                  setCurrentView('create');
                  resetForm();
                  setEditingId(null);
                }}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                  currentView === 'create'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Plus className="h-4 w-4" />
                Create Timesheet
              </button>
            </div>
          </div>
        </div>

        {/* Create/Edit Form */}
        {currentView === 'create' && (
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <h2 className="text-xl font-semibold mb-6">
              {editingId ? 'Edit Timesheet' : 'Create New Timesheet'}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date *
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project *
                </label>
                <select
                  value={formData.project}
                  onChange={(e) => handleInputChange('project', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Project</option>
                  {projects.map(project => (
                    <option key={project} value={project}>{project}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Task *
                </label>
                <select
                  value={formData.task}
                  onChange={(e) => handleInputChange('task', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Task</option>
                  {tasks.map(task => (
                    <option key={task} value={task}>{task}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Break Time (minutes)
                </label>
                <input
                  type="number"
                  value={formData.breakTime}
                  onChange={(e) => handleInputChange('breakTime', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Time *
                </label>
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => handleInputChange('startTime', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Time *
                </label>
                <input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => handleInputChange('endTime', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total Hours
                </label>
                <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-700">
                  {calculateHours(formData.startTime, formData.endTime, parseInt(formData.breakTime) || 0).toFixed(2)} hours
                </div>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Describe what you worked on..."
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSave}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {editingId ? 'Update' : 'Save'} Timesheet
              </button>
              <button
                onClick={() => {
                  setCurrentView('view');
                  resetForm();
                  setEditingId(null);
                }}
                className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-300 flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Timesheets Table */}
        {currentView === 'view' && (
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">My Timesheets</h2>
                <div className="text-sm text-gray-600">
                  Total Hours: <span className="font-semibold text-blue-600">{getTotalHours()}</span>
                </div>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hours</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {timesheets.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                        No timesheets found. Create your first timesheet to get started.
                      </td>
                    </tr>
                  ) : (
                    timesheets.map((timesheet) => (
                      <tr key={timesheet.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                            {new Date(timesheet.date).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {timesheet.project}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {timesheet.task}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {timesheet.startTime} - {timesheet.endTime}
                          {timesheet.breakTime > 0 && (
                            <div className="text-xs text-gray-500">
                              Break: {timesheet.breakTime}min
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {timesheet.totalHours}h
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(timesheet.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            {timesheet.status !== 'approved' && (
                              <button
                                onClick={() => handleEdit(timesheet)}
                                className="text-blue-600 hover:text-blue-900"
                                title="Edit"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                            )}
                            {timesheet.status === 'draft' && (
                              <button
                                onClick={() => handleSubmitForApproval(timesheet.id)}
                                className="text-green-600 hover:text-green-900"
                                title="Submit for Approval"
                              >
                                <Send className="h-4 w-4" />
                              </button>
                            )}
                            {timesheet.status !== 'approved' && (
                              <button
                                onClick={() => handleDelete(timesheet.id)}
                                className="text-red-600 hover:text-red-900"
                                title="Delete"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            )}
                            {timesheet.status === 'approved' && (
                              <span className="text-green-600" title="Approved">
                                <Check className="h-4 w-4" />
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
            {timesheets.length > 0 && (
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <div>
                    Total Entries: {timesheets.length}
                  </div>
                  <div className="flex gap-4">
                    <span>Draft: {timesheets.filter(ts => ts.status === 'draft').length}</span>
                    <span>Submitted: {timesheets.filter(ts => ts.status === 'submitted').length}</span>
                    <span>Approved: {timesheets.filter(ts => ts.status === 'approved').length}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TimesheetDashboard;