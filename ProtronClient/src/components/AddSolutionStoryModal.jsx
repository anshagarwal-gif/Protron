import React, { useEffect, useState } from 'react';
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

const AddSolutionStoryModal = ({ open, onClose, parentStory, initialProjectId }) => {
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
    sprintId: '',
    attachments: []
  });

  const [users, setUsers] = useState([]);
  const [releases, setReleases] = useState([]);
  const [sprints, setSprints] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const { sessionData } = useSession();
  
  // Green theme colors
  const greenPrimary = '#15803d';
  const greenHover = '#047857';
  const fieldHeight = '40px';

  useEffect(() => {
    const fetchData = async () => {
      if (open) {
        // Set initial form data from parent story
        if (parentStory) {
          setFormData(prev => ({
            ...prev,
            projectId: parentStory.projectId,
            parentId: parentStory.usId
          }));
        }

        // If initialProjectId is provided (from dashboard context), pre-fill projectId
        if (!parentStory && initialProjectId) {
          setFormData(prev => ({ ...prev, projectId: initialProjectId }));
        }

        const token = sessionStorage.getItem('token');
        const tenantId = sessionStorage.getItem('tenantId');

        // Fetch Projects
        try {
          const projectResponse = await axios.get(`${API_BASE_URL}/api/tenants/${tenantId}/projects`, {
            headers: { Authorization: token }
          });
          setProjects(projectResponse.data);
        } catch (error) {
          console.error("Error fetching projects:", error);
        }

        // Fetch project-team users if parent story provides a projectId, otherwise leave users empty
        const fetchProjectUsers = async (projectId) => {
          if (!projectId) return;
          try {
            const res = await fetch(`${API_BASE_URL}/api/project-team/list/${projectId}`, {
              headers: { Authorization: token }
            });
            if (res.ok) {
              const data = await res.json();
              setUsers(Array.isArray(data) ? data : []);
            } else {
              console.warn('Failed to fetch project team users:', res.status);
              setUsers([]);
            }
          } catch (error) {
            console.error('Error fetching project team users:', error);
            setUsers([]);
          }
        };
        if (parentStory?.projectId) {
          await fetchProjectUsers(parentStory.projectId);
        }

        // Fetch Releases
        try {
          const releasesResponse = await axios.get(`${API_BASE_URL}/api/releases`, {
            headers: { Authorization: token }
          });
          setReleases(releasesResponse.data || []);
        } catch (error) {
          console.error('Error fetching releases:', error);
        }

        // Fetch Sprints
        try {
          const sprintsResponse = await axios.get(`${API_BASE_URL}/api/sprints`, {
            headers: { Authorization: token }
          });
          setSprints(sprintsResponse.data || []);
        } catch (error) {
          console.error('Error fetching sprints:', error);
        }
      }
    };

    fetchData();
  }, [open, parentStory, sessionData.tenantId, initialProjectId]);

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

  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files);
    if (!newFiles.length) return;

    // Simple validation for file count
    if (formData.attachments.length + newFiles.length > 4) {
      showSnackbar("You can only upload a maximum of 4 files.", "error");
      return;
    }

    setFormData(prev => ({
      ...prev,
      attachments: [...prev.attachments, ...newFiles]
    }));
  };

  const handleRemoveAttachment = (index) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleInputChange = (field) => (event) => {
    const value = event.target.value;
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

  const validateForm = () => {
    if (!formData.projectId) {
      showSnackbar("Please select a project", 'error');
      return false;
    }

    if (!formData.summary) {
      showSnackbar("Please enter summary", 'error');
      return false;
    }

    if (formData.summary.length > 200) {
      showSnackbar("Summary cannot exceed 200 characters", 'error');
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
      
      // Compute parentId to satisfy backend validation: must be null or start with PRJ- or US-
      let computedParentId = null;
      if (formData.parentId && formData.parentId.toString().trim() !== '') {
        computedParentId = formData.parentId;
      } else if (formData.projectId) {
        const proj = projects.find(p => p.projectId === parseInt(formData.projectId));
        // projectCode is expected to be like 'PRJ-<something>' on the server side
        computedParentId = proj?.projectCode || null;
      } else {
        computedParentId = null;
      }

      const payload = {
        projectId: parseInt(formData.projectId),
        parentId: computedParentId,
        status: formData.status,
        priority: parseInt(formData.priority),
        summary: formData.summary,
        description: formData.description,
        system: formData.system,
        storyPoints: parseInt(formData.storyPoints) || 0,
        assignee: formData.assignee,
        releaseId: formData.releaseId || null,
        sprintId: formData.sprintId || null
      };

      const response = await axios.post(
        `${API_BASE_URL}/api/solutionstory/add`,
        payload,
        {
          headers: {
            Authorization: token,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Solution story creation response:', response.data);
      console.log('Response data type:', typeof response.data);
      const newSolutionStoryId = response.data.ssId || response.data.id || (response.data && response.data.toString());
      console.log('Extracted solution story ID:', newSolutionStoryId);

      // Upload attachments if any
      if (formData.attachments.length > 0) {
        console.log('Uploading attachments for solution story:', newSolutionStoryId);
        console.log('Solution story response data type:', typeof newSolutionStoryId);
        
        // Validate that we have a valid ID
        let finalSolutionStoryId = newSolutionStoryId;
        if (typeof finalSolutionStoryId === 'object' && finalSolutionStoryId !== null) {
          finalSolutionStoryId = finalSolutionStoryId.ssId || finalSolutionStoryId.id || finalSolutionStoryId.toString();
          console.log('Processed solution story ID:', finalSolutionStoryId);
        }
        
        if (!finalSolutionStoryId || typeof finalSolutionStoryId !== 'string') {
          console.error('Invalid solution story ID after processing:', finalSolutionStoryId);
          showSnackbar("Solution Story created but attachment upload failed due to invalid ID", 'warning');
        } else {
          let attachmentUploadCount = 0;
          const uploadErrors = [];

          for (const file of formData.attachments) {
          try {
            const formData_upload = new FormData();
            formData_upload.append('file', file);

            const uploadUrl = `${API_BASE_URL}/api/solutionstory/${finalSolutionStoryId}`;
            console.log('Upload URL:', uploadUrl);
            await axios.post(uploadUrl, formData_upload, {
              headers: {
                'Authorization': token
              },
              timeout: 30000 // 30 seconds timeout
            });
            attachmentUploadCount++;
          } catch (uploadError) {
            console.error('Failed to upload attachment:', uploadError);
            uploadErrors.push(file.name);
          }
          }

          if (uploadErrors.length > 0) {
            showSnackbar(`Solution Story added successfully, but ${uploadErrors.length} attachments failed to upload`, 'warning');
          } else if (attachmentUploadCount > 0) {
            showSnackbar(`Solution Story added successfully with ${attachmentUploadCount} attachments`, 'success');
          }
        }
      } else {
        showSnackbar("Solution Story added successfully", 'success');
      }

      onClose();
      resetForm();
    } catch (error) {
      console.error("Failed to add solution story:", error);
      if (error.response?.data?.message) {
        showSnackbar(error.response.data.message, 'error');
      } else {
        showSnackbar("Failed to add solution story", 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      projectId: parentStory?.projectId || '',
      parentId: parentStory?.usId || '',
      status: 'todo',
      priority: 2,
      summary: '',
      description: '',
      system: '',
      storyPoints: 0,
      assignee: '',
      releaseId: '',
      sprintId: '',
      attachments: []
    });
    setFieldErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!open) return null;

  return (
    <>
      <Dialog
        open={open}
        onClose={handleClose}
        fullWidth
        maxWidth="xl"
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            maxHeight: '95vh',
            width: { xs: '95%', sm: '90%', md: '85%', lg: '80%' },
            maxWidth: { xs: '100%', sm: '1200px', md: '1400px', lg: '1600px' }
          }
        }}
      >
        <DialogContent sx={{ p: 0, overflow: 'visible' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {/* Header */}
            <div className="bg-green-600 text-white rounded-t-lg">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0 p-4 sm:p-6">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className="w-8 h-8 bg-green-700 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 2a1 1 0 0 0-1 1v1H6.5A1.5 1.5 0 0 0 5 5.5v13A1.5 1.5 0 0 0 6.5 20H17.5A1.5 1.5 0 0 0 19 18.5v-13A1.5 1.5 0 0 0 17.5 4H16V3a1 1 0 0 0-1-1H9zm1 2h4v1h-4V4zM7 7h10v11H7V7z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg lg:text-xl font-bold">Add Solution Story</h2>
                    {parentStory && (
                      <p className="text-green-100 text-xs sm:text-sm break-words overflow-wrap-anywhere">Parent Story: {parentStory.summary}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="p-2 hover:bg-green-700 rounded-full transition-colors cursor-pointer"
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Form Content */}
            <div className="p-4 sm:p-6 space-y-4">
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3'>
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
                    onChange={handleInputChange("projectId")}
                    className={`w-full border ${!formData.projectId ? 'border-red-500' : 'border-gray-300'} rounded-md h-10 pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 ${initialProjectId ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    required
                    disabled={!!initialProjectId}
                  >
                    <option value="">Select from list</option>
                    {projects.map((project) => (
                      <option key={project.projectId} value={project.projectId} title={project.projectName}>
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
                    <svg
                      className="h-5 w-5"
                      fill={greenPrimary}
                      viewBox="0 0 24 24"
                    >
                      <path d="M9 2a1 1 0 0 0-1 1v1H6.5A1.5 1.5 0 0 0 5 5.5v13A1.5 1.5 0 0 0 6.5 20H17.5A1.5 1.5 0 0 0 19 18.5v-13A1.5 1.5 0 0 0 17.5 4H16V3a1 1 0 0 0-1-1H9zm1 2h4v1h-4V4zM7 7h10v11H7V7z" />
                    </svg>
                  </div>
                  <select
                    value={formData.status || ''}
                    onChange={handleInputChange('status')}
                    className="w-full border border-gray-300 rounded-md pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    style={{ height: fieldHeight }}
                  >
                    <option value="todo">To Do</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="blocked">Blocked</option>
                  </select>
                </div>
              </div>

              <div className="w-full">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg
                      className="h-5 w-5"
                      fill={greenPrimary}
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  </div>
                  <select
                    value={formData.priority || ''}
                    onChange={handleInputChange('priority')}
                    className="w-full border border-gray-300 rounded-md pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    style={{ height: fieldHeight }}
                  >
                    <option value="1">High</option>
                    <option value="2">Medium</option>
                    <option value="3">Low</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Row 2: Summary, System, Story Points */}
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3'>
              <div className="w-full md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Summary <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg
                      className="h-5 w-5"
                      fill={greenPrimary}
                      viewBox="0 0 24 24"
                    >
                      <path d="M9 2a1 1 0 0 0-1 1v1H6.5A1.5 1.5 0 0 0 5 5.5v13A1.5 1.5 0 0 0 6.5 20H17.5A1.5 1.5 0 0 0 19 18.5v-13A1.5 1.5 0 0 0 17.5 4H16V3a1 1 0 0 0-1-1H9zm1 2h4v1h-4V4zM7 7h10v11H7V7z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={formData.summary || ''}
                    onChange={handleInputChange('summary')}
                    placeholder="Enter solution story summary..."
                    maxLength={200}
                    className="w-full border border-gray-300 rounded-md pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 break-words overflow-wrap-anywhere"
                    style={{ height: fieldHeight }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1 text-right pr-1">
                  {formData.summary?.length || 0} / 200
                </p>
              </div>

              <div className="w-full">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  System
                </label>
                <input
                  type="text"
                  value={formData.system || ''}
                  onChange={handleInputChange('system')}
                  placeholder="Enter system name"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  style={{ height: fieldHeight }}
                />
              </div>

              <div className="w-full">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Story Points
                </label>
                <input
                  type="number"
                  value={formData.storyPoints || ''}
                  onChange={handleInputChange('storyPoints')}
                  placeholder="0"
                  min="0"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  style={{ height: fieldHeight }}
                />
              </div>
            </div>

            {/* Row 3: Assignee, Release, Sprint */}
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3'>
              <div className="w-full">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assignee
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  </div>
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
                      control: (provided) => ({
                        ...provided,
                        minHeight: '40px',
                        borderColor: '#d1d5db',
                        fontSize: '14px',
                        '&:hover': {
                          borderColor: '#10b981'
                        }
                      }),
                      menu: (provided) => ({
                        ...provided,
                        zIndex: 9999
                      }),
                      input: (provided) => ({ ...provided, paddingLeft: '20px' }),
                      placeholder: (provided) => ({ ...provided, paddingLeft: '20px' })
                    }}
                  />
                </div>
              </div>

              <div className="w-full">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Release
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <select
                    value={formData.releaseId || ''}
                    onChange={handleInputChange('releaseId')}
                    className="w-full border border-gray-300 rounded-md pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    style={{ height: fieldHeight }}
                  >
                    <option value="">Select release</option>
                    {releases.map((release) => (
                      <option key={release.releaseId} value={release.releaseId}>
                        {release.releaseName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="w-full">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sprint
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <select
                    value={formData.sprintId || ''}
                    onChange={handleInputChange('sprintId')}
                    className="w-full border border-gray-300 rounded-md pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    style={{ height: fieldHeight }}
                  >
                    <option value="">Select sprint</option>
                    {sprints.map((sprint) => (
                      <option key={sprint.sprintId} value={sprint.sprintId}>
                        {sprint.sprintName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="w-full mb-4">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <div className="relative">
                <textarea
                  id="description"
                  name="description"
                  placeholder="Enter detailed description here..."
                  value={formData.description}
                  onChange={handleInputChange('description')}
                  rows={4}
                  maxLength={500}
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none break-words overflow-wrap-anywhere whitespace-pre-wrap"
                ></textarea>
              </div>
              <div className="flex justify-end text-sm text-gray-500 pr-1 mt-1">
                {formData.description.length} / 500
              </div>
            </div>

            {/* Attachments Section */}
            <div className="w-full mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Attachments
              </label>
              <div className="space-y-2">
                <div className="flex items-center gap-4 mb-2">
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      multiple
                      onChange={handleFileChange}
                      disabled={formData.attachments.length >= 4}
                      className="hidden"
                    />
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <svg
                        className="w-5 h-5 text-green-600"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M19 15v4H5v-4H3v4a2 2 0 002 2h14a2 2 0 002-2v-4h-2ZM11 5.83 8.41 8.41 7 7l5-5 5 5-1.41 1.41L13 5.83V16h-2V5.83Z" />
                      </svg>
                      <span className="text-green-600 font-medium">
                        {formData.attachments.length >= 4 ? "Max files reached" : "Attach Files"}
                      </span>
                      {formData.attachments.length < 4 && (
                        <span className="text-gray-500 text-xs">(max 4 files)</span>
                      )}
                    </div>
                  </label>
                </div>

                {/* Selected Files List */}
                {formData.attachments.length > 0 && (
                  <div className="space-y-1">
                    {formData.attachments.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-gray-50 p-2 rounded border text-sm"
                      >
                        <span className="text-gray-700 flex items-center gap-2">
                          <span className="truncate">{file.name}</span>
                          <span className="text-gray-500 text-xs">({formatFileSize(file.size)})</span>
                        </span>
                        <button
                          onClick={() => handleRemoveAttachment(index)}
                          type="button"
                          className="ml-2 text-sm text-gray-500 hover:text-red-500"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
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
                  onClick={handleSubmit}
                  disabled={loading}
                  className={`rounded px-5 h-[42px] font-semibold text-sm text-white transition-colors ${loading ? `bg-green-500 cursor-not-allowed` : `bg-green-500 hover:bg-green-600`}`}
                >
                  {loading ? "Creating..." : "Add Solution Story"}
                </button>
              </div>
            </div>
            </div>
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

export default AddSolutionStoryModal;