import React, { useEffect, useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  Box
} from '@mui/material';
import axios from 'axios';
import GlobalSnackbar from './GlobalSnackbar';
import CreatableSelect from 'react-select/creatable';
import { useSession } from '../Context/SessionContext';

const API_BASE_URL = import.meta.env.VITE_API_URL;

// Truncate function for project names
const truncateText = (text, maxLength = 20) => {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
};

const EditSolutionStoryModal = ({ open, onClose, storyId, storyData }) => {
  if (!open) return null;

  const [formData, setFormData] = useState({
    projectId: '',
    parentId: '',
    status: 'todo',
    priority: 2,
    summary: '',
    description: '',
    system: '',
    storyPoints: 0,
    assignee: '',
    releaseId: '',
    sprintId: ''
  });

  const [users, setUsers] = useState([]);
  const [releases, setReleases] = useState([]);
  const [sprints, setSprints] = useState([]);
  const [projects, setProjects] = useState([]);
  const [systems, setSystems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [error, setError] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});
  const [summaryCharCount, setSummaryCharCount] = useState(0);
  const [descriptionCharCount, setDescriptionCharCount] = useState(0);
  const { sessionData } = useSession();

  // Green theme colors
  const greenPrimary = '#15803d';
  const greenHover = '#047857';
  const fieldHeight = '40px';

  useEffect(() => {
    const fetchData = async () => {
      if (open && storyData) {
        setInitialLoading(true);
        try {
          // Set form data from existing story data
          setFormData({
            projectId: storyData.projectId || '',
            parentId: storyData.parentId || '',
            status: storyData.status || 'todo',
            priority: storyData.priority || 2,
            summary: storyData.summary || '',
            description: storyData.description || '',
            system: storyData.system || '',
            storyPoints: storyData.storyPoints || 0,
            assignee: storyData.assignee || '',
            releaseId: storyData.releaseId || '',
            sprintId: storyData.sprintId || ''
          });

          setSummaryCharCount(storyData.summary?.length || 0);
          setDescriptionCharCount(storyData.description?.length || 0);

        } catch (error) {
          console.error("Error fetching story data:", error);
          setErrors(prev => ({ ...prev, submit: "Failed to load story data." }));
        } finally {
          setInitialLoading(false);
        }
      }

      if (open) {
        const token = sessionStorage.getItem('token');
        const tenantId = sessionStorage.getItem('tenantId');

        // Fetch all required data in parallel
        try {
          const [projectsRes, usersRes, releasesRes, sprintsRes, systemsRes] = await Promise.all([
            axios.get(`${API_BASE_URL}/api/tenants/${tenantId}/projects`, {
              headers: { Authorization: token }
            }),
            axios.get(`${API_BASE_URL}/api/tenants/${tenantId}/users`, {
              headers: { Authorization: token }
            }),
            axios.get(`${API_BASE_URL}/api/releases`, {
              headers: { Authorization: token }
            }),
            axios.get(`${API_BASE_URL}/api/sprints`, {
              headers: { Authorization: token }
            }),
            axios.get(`${API_BASE_URL}/api/systems/tenant`, {
              headers: { Authorization: token }
            })
          ]);

          setProjects(projectsRes.data);
          setUsers(usersRes.data);
          setReleases(releasesRes.data);
          setSprints(sprintsRes.data);
          setSystems(systemsRes.data);

        } catch (error) {
          console.error("Error fetching data:", error);
        }
      }
    };

    fetchData();
  }, [open, storyData, sessionData?.tenantId]);

  useEffect(() => {
    setSummaryCharCount(formData.summary.length);
    setDescriptionCharCount(formData.description.length);
  }, [formData.summary, formData.description]);

  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const handleInputChange = (field) => (event) => {
    const value = event.target.value;

    if (field === 'summary' && value.length > 100) {
      setFieldErrors(prev => ({ ...prev, summary: "Summary cannot exceed 100 characters" }));
      return;
    }
    if (field === 'description' && value.length > 500) {
      setFieldErrors(prev => ({ ...prev, description: "Description cannot exceed 500 characters" }));
      return;
    }

    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear field error when user starts typing
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleProjectChange = (projectId) => {
    if (projectId) {
      // Filter sprints and releases for the selected project
      const projectSprints = sprints.filter(sprint => sprint.projectId === parseInt(projectId));
      const projectReleases = releases.filter(release => release.projectId === parseInt(projectId));
      
      setReleases(projectReleases);
      setSprints(projectSprints);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toISOString().split('T')[0];
  };

  const validateForm = () => {
    if (!formData.projectId) {
      showSnackbar("Please select a project", 'error');
      return false;
    }

    if (!formData.summary.trim()) {
      showSnackbar("Please enter a summary", 'error');
      return false;
    }

    if (formData.summary.length > 100) {
      showSnackbar("Summary cannot exceed 100 characters", 'error');
      return false;
    }

    if (formData.description.length > 500) {
      showSnackbar("Description cannot exceed 500 characters", 'error');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setLoading(true);
      const token = sessionStorage.getItem('token');
      
      const storyPayload = {
        projectId: parseInt(formData.projectId),
        sessionId: sessionData?.sessionId,
        summary: formData.summary,
        description: formData.description,
        status: formData.status,
        priority: parseInt(formData.priority),
        storyPoints: parseInt(formData.storyPoints) || 0,
        assignee: formData.assignee,
        sprint: formData.sprintId || null,
        release: formData.releaseId || null,
        system: formData.system,
        createdBy: formData.createdBy || "Unknown",
        tenantId: sessionData?.tenantId
      };

      await axios.put(
        `${API_BASE_URL}/api/solutionstory/${storyId}`,
        storyPayload,
        {
          headers: {
            Authorization: token,
            'Content-Type': 'application/json'
          }
        }
      );

      showSnackbar("Solution story updated successfully", 'success');
      onClose();
    } catch (error) {
      console.error("Failed to update solution story:", error);
      if (error.response?.data?.message) {
        showSnackbar(error.response.data.message, 'error');
      } else {
        showSnackbar("Failed to update solution story", 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    if (storyData) {
      setFormData({
        projectId: storyData.projectId || '',
        parentId: storyData.parentId || '',
        status: storyData.status || 'todo',
        priority: storyData.priority || 2,
        summary: storyData.summary || '',
        description: storyData.description || '',
        system: storyData.system || '',
        storyPoints: storyData.storyPoints || 0,
        assignee: storyData.assignee || '',
        releaseId: storyData.releaseId || '',
        sprintId: storyData.sprintId || ''
      });
      setSummaryCharCount(storyData.summary?.length || 0);
      setDescriptionCharCount(storyData.description?.length || 0);
    }
    setFieldErrors({});
    setError({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (initialLoading) {
    return (
      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="lg">
        <DialogContent sx={{ p: 3, overflow: 'visible' }}>
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            <span className="ml-3 text-gray-600">Loading story data...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog
        open={open}
        onClose={handleClose}
        fullWidth
        maxWidth="lg"
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            maxHeight: '90vh',
            width: '95%',
            maxWidth: '1000px'
          }
        }}
      >
        <DialogContent sx={{ p: 3, overflow: 'visible' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 2a1 1 0 0 0-1 1v1H6.5A1.5 1.5 0 0 0 5 5.5v13A1.5 1.5 0 0 0 6.5 20H17.5A1.5 1.5 0 0 0 19 18.5v-13A1.5 1.5 0 0 0 17.5 4H16V3a1 1 0 0 0-1-1H9zm1 2h4v1h-4V4zM7 7h10v11H7V7z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Edit Solution Story</h2>
                  <p className="text-sm text-gray-600">Story ID: {storyData?.ssId}</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={loading}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Error Display */}
            {error.submit && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3 flex items-center">
                <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l9 7.14V22H3V9.14L12 2zm0 2.86L5 10.14V20h14V10.14L12 4.86zM11 13v6h2v-6h-2z" />
                </svg>
                <span className="text-red-700 text-sm">{error.submit}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Row 1: Project, Status, Priority, Story Points */}
              <div className='grid grid-cols-2 gap-3 mb-4'>
                <div className="w-full flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Project <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M4 4h12v2H4V4zm0 4h12v10H4V8zm2 2v6h8v-6H6z" />
                      </svg>
                    </div>
                    <select
                      value={formData.projectId || ''}
                      onChange={(e) => {
                        const projectId = e.target.value;
                        setFormData(prev => ({ ...prev, projectId, sprintId: '', releaseId: '' }));
                        handleProjectChange(projectId);
                      }}
                      required
                      className={`w-full border ${!formData.projectId ? 'border-red-500' : 'border-gray-300'} rounded-md h-10 pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100 disabled:cursor-not-allowed`}
                      disabled={loading}
                    >
                      <option value="">Select from list</option>
                      {projects.map((project) => (
                        <option key={project.projectId} value={project.projectId}>
                          {truncateText(project.projectName, 35)}
                        </option>
                      ))}
                    </select>
                  </div>
                  {!formData.projectId && (
                    <p className="mt-1 text-sm text-red-600">Project is required</p>
                  )}
                </div>

                <div className="w-full flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 2a1 1 0 0 0-1 1v1H6.5A1.5 1.5 0 0 0 5 5.5v13A1.5 1.5 0 0 0 6.5 20H17.5A1.5 1.5 0 0 0 19 18.5v-13A1.5 1.5 0 0 0 17.5 4H16V3a1 1 0 0 0-1-1H9zm1 2h4v1h-4V4zM7 7h10v11H7V7z" />
                      </svg>
                    </div>
                    <select
                      value={formData.status || ''}
                      onChange={handleInputChange("status")}
                      className="w-full border border-gray-300 rounded-md pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      style={{ height: fieldHeight }}
                      disabled={loading}
                    >
                      <option value="todo">To Do</option>
                      <option value="in-progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="blocked">Blocked</option>
                      <option value="ready">Ready</option>
                      <option value="not-ready">Not Ready</option>
                    </select>
                  </div>
                </div>

                <div className="w-full flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 2a1 1 0 0 0-1 1v1H6.5A1.5 1.5 0 0 0 5 5.5v13A1.5 1.5 0 0 0 6.5 20H17.5A1.5 1.5 0 0 0 19 18.5v-13A1.5 1.5 0 0 0 17.5 4H16V3a1 1 0 0 0-1-1H9zm1 2h4v1h-4V4zM7 7h10v11H7V7z" />
                      </svg>
                    </div>
                    <select
                      value={formData.priority || ''}
                      onChange={handleInputChange("priority")}
                      className="w-full border border-gray-300 rounded-md pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      style={{ height: fieldHeight }}
                      disabled={loading}
                    >
                      <option value={1}>High</option>
                      <option value={2}>Medium</option>
                      <option value={3}>Low</option>
                    </select>
                  </div>
                </div>

                <div className="w-full flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Story Points
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 2a1 1 0 0 0-1 1v1H6.5A1.5 1.5 0 0 0 5 5.5v13A1.5 1.5 0 0 0 6.5 20H17.5A1.5 1.5 0 0 0 19 18.5v-13A1.5 1.5 0 0 0 17.5 4H16V3a1 1 0 0 0-1-1H9zm1 2h4v1h-4V4zM7 7h10v11H7V7z" />
                      </svg>
                    </div>
                    <input
                      type="number"
                      value={formData.storyPoints || ''}
                      onChange={handleInputChange('storyPoints')}
                      min="0"
                      max="100"
                      placeholder="Enter story points"
                      className="w-full border border-gray-300 rounded-md pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      style={{ height: fieldHeight }}
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              {/* Row 2: System, Assignee, Sprint, Release */}
              <div className='grid grid-cols-4 gap-3 mb-4'>
                <div className="w-full">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    System
                  </label>
                  <CreatableSelect
                    value={formData.system ? { value: formData.system, label: formData.system } : null}
                    onChange={(selectedOption) => {
                      const value = selectedOption ? selectedOption.value : '';
                      setFormData(prev => ({ ...prev, system: value }));
                    }}
                    options={systems.map(system => ({
                      value: system.systemName,
                      label: system.systemName
                    }))}
                    isClearable
                    placeholder="Select or type system..."
                    isDisabled={loading}
                    className="text-sm"
                    styles={{
                      control: (provided) => ({ ...provided, minHeight: '40px', borderColor: '#d1d5db', fontSize: '14px', '&:hover': { borderColor: '#15803d' } }),
                      menu: (provided) => ({ ...provided, zIndex: 9999 }),
                      option: (provided, state) => ({ ...provided, backgroundColor: state.isFocused ? '#ecfdf5' : 'white', color: state.isFocused ? '#15803d' : '#374151', fontSize: '14px' })
                    }}
                  />
                </div>

                <div className="w-full">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assignee
                  </label>
                  <CreatableSelect
                    value={formData.assignee ? { value: formData.assignee, label: formData.assignee } : null}
                    onChange={(selectedOption) => {
                      const value = selectedOption ? selectedOption.value : '';
                      setFormData(prev => ({ ...prev, assignee: value }));
                    }}
                    options={users.map(user => ({
                      value: user.name,
                      label: user.name
                    }))}
                    isClearable
                    placeholder="Select or type assignee..."
                    isDisabled={loading}
                    className="text-sm"
                    styles={{
                      control: (provided) => ({ ...provided, minHeight: '40px', borderColor: '#d1d5db', fontSize: '14px', '&:hover': { borderColor: '#15803d' } }),
                      menu: (provided) => ({ ...provided, zIndex: 9999 }),
                      option: (provided, state) => ({ ...provided, backgroundColor: state.isFocused ? '#ecfdf5' : 'white', color: state.isFocused ? '#15803d' : '#374151', fontSize: '14px' })
                    }}
                  />
                </div>

                <div className="w-full">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sprint
                  </label>
                  <CreatableSelect
                    value={formData.sprintId ? (() => {
                      const selectedSprint = sprints.find(s => s.sprintId.toString() === formData.sprintId.toString());
                      return selectedSprint ? { value: formData.sprintId, label: selectedSprint.sprintName } : { value: formData.sprintId, label: formData.sprintId };
                    })() : null}
                    onChange={(selectedOption) => {
                      const value = selectedOption ? selectedOption.value : '';
                      setFormData(prev => ({ ...prev, sprintId: value }));
                    }}
                    options={sprints.map(sprint => ({
                      value: sprint.sprintId.toString(),
                      label: sprint.sprintName
                    }))}
                    isClearable
                    placeholder="Select sprint..."
                    isDisabled={loading}
                    className="text-sm"
                    styles={{
                      control: (provided) => ({ ...provided, minHeight: '40px', borderColor: '#d1d5db', fontSize: '14px', '&:hover': { borderColor: '#15803d' } }),
                      menu: (provided) => ({ ...provided, zIndex: 9999 }),
                      option: (provided, state) => ({ ...provided, backgroundColor: state.isFocused ? '#ecfdf5' : 'white', color: state.isFocused ? '#15803d' : '#374151', fontSize: '14px' })
                    }}
                  />
                </div>

                <div className="w-full">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Release
                  </label>
                  <CreatableSelect
                    value={formData.releaseId ? (() => {
                      const selectedRelease = releases.find(r => r.releaseId.toString() === formData.releaseId.toString());
                      return selectedRelease ? { value: formData.releaseId, label: selectedRelease.releaseName } : { value: formData.releaseId, label: formData.releaseId };
                    })() : null}
                    onChange={(selectedOption) => {
                      const value = selectedOption ? selectedOption.value : '';
                      setFormData(prev => ({ ...prev, releaseId: value }));
                    }}
                    options={releases.map(release => ({
                      value: release.releaseId.toString(),
                      label: release.releaseName
                    }))}
                    isClearable
                    placeholder="Select release..."
                    isDisabled={loading}
                    className="text-sm"
                    styles={{
                      control: (provided) => ({ ...provided, minHeight: '40px', borderColor: '#d1d5db', fontSize: '14px', '&:hover': { borderColor: '#15803d' } }),
                      menu: (provided) => ({ ...provided, zIndex: 9999 }),
                      option: (provided, state) => ({ ...provided, backgroundColor: state.isFocused ? '#ecfdf5' : 'white', color: state.isFocused ? '#15803d' : '#374151', fontSize: '14px' })
                    }}
                  />
                </div>
              </div>

              {/* Summary */}
              <div className="w-full mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Summary <span className="text-red-500">*</span>
                  <span className="float-right text-xs text-gray-500">
                    {formData.summary.length} / 100 characters
                  </span>
                </label>
                <input
                  type="text"
                  value={formData.summary || ''}
                  onChange={handleInputChange('summary')}
                  placeholder="Enter summary..."
                  maxLength={100}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  style={{ height: fieldHeight }}
                  disabled={loading}
                  required
                />
                {fieldErrors.summary && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.summary}</p>
                )}
              </div>

              {/* Description */}
              <div className="w-full mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                  <span className="float-right text-xs text-gray-500">
                    {formData.description.length} / 500 characters
                  </span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={handleInputChange('description')}
                  rows={4}
                  maxLength={500}
                  placeholder="Enter detailed description..."
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
                  disabled={loading}
                />
                {fieldErrors.description && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.description}</p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between items-center mt-2">
                <button
                  onClick={resetForm}
                  disabled={loading}
                  className={`rounded px-5 h-[42px] font-semibold text-sm text-white transition-colors ${loading ? 'text-white cursor-not-allowed' : 'text-white hover:text-black bg-gray-500 hover:bg-gray-100'}`}
                >
                  Reset
                </button>

                <div className="flex gap-4">
                  <button
                    onClick={handleClose}
                    disabled={loading}
                    className={`border rounded px-5 h-[42px] text-sm transition-colors ${loading ? 'border-gray-300 text-gray-400 cursor-not-allowed' : `border-[${greenPrimary}] text-[${greenPrimary}] hover:border-[${greenHover}] hover:text-[${greenHover}]`}`}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={loading}
                    className={`rounded px-5 h-[42px] font-semibold text-sm text-white transition-colors ${loading ? `bg-green-500 cursor-not-allowed` : `bg-green-500 hover:bg-green-600`}`}
                  >
                    {loading ? "Updating..." : "Update Solution Story"}
                  </button>
                </div>
              </div>
            </form>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Global Snackbar */}
      <GlobalSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={handleSnackbarClose}
      />
    </>
  );
};

export default EditSolutionStoryModal;