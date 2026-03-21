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

const AddSolutionStoryModal = ({ open, onClose, parentStory, initialProjectId, initialStatus }) => {
  const [formData, setFormData] = useState({
    projectId: '',
    parentId: '',
    status: initialStatus || 'todo',
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
  const [releaseFixed, setReleaseFixed] = useState(false);
  const [sprintFixed, setSprintFixed] = useState(false);
  const [systemFixed, setSystemFixed] = useState(false);
  const [assigneeFixed, setAssigneeFixed] = useState(false);
  const [projects, setProjects] = useState([]);
  const [systems, setSystems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const { sessionData } = useSession();
  const [statusFlags, setStatusFlags] = useState([]);

  // Green theme colors
  const greenPrimary = '#15803d';
  const greenHover = '#047857';
  const fieldHeight = '40px';
  console.log(parentStory);

  const getProjectName = (projectId) => {
    if (!projectId) return '—';
    const project = projects.find(p => String(p.projectId) === String(projectId));
    return project ? project.projectName : '—';
  };

  const fetchStatusFlags = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/status-flags/type/story`, {
        headers: { Authorization: token }
      });

      if (response.ok) {
        const data = await response.json();
        setStatusFlags(Array.isArray(data) ? data : []);
      } else {
        console.warn('Failed to fetch status flags:', response.status, response.statusText);
        setStatusFlags([]);
      }
    } catch (error) {
      console.error('Error fetching status flags:', error);
      setStatusFlags([]);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (open) {
        // Reset form data first
        const baseFormData = {
          projectId: '',
          parentId: '',
          status: initialStatus || 'todo',
          priority: 2,
          summary: '',
          description: '',
          system: '',
          storyPoints: 0,
          assignee: '',
          releaseId: '',
          sprintId: '',
          attachments: []
        };

        // Set initial form data from parent story or duplicate data
        if (parentStory) {
          // Check if this is duplicate data (has _isDuplicate flag)
          const isDuplicate = parentStory._isDuplicate === true;
          
          if (isDuplicate) {
            // For duplicates, set fresh form data from the duplicate data
            // Preserve the parent user story ID (usId) if available, otherwise clear parentId
            const parentIdForDuplicate = parentStory.usId || parentStory.parentId || '';
            const duplicateFormData = {
              ...baseFormData,
              status: initialStatus || parentStory.status || 'todo',
              projectId: parentStory.projectId ? String(parentStory.projectId) : '',
              parentId: parentIdForDuplicate, // Preserve parent user story ID for duplicates
              summary: parentStory.summary || '',
              description: parentStory.description || '',
              releaseId: parentStory.releaseId ? String(parentStory.releaseId) : (parentStory.release ? String(parentStory.release) : ''),
              sprintId: parentStory.sprintId ? String(parentStory.sprintId) : (parentStory.sprint ? String(parentStory.sprint) : ''),
              system: parentStory.system || parentStory.systemName || '',
              assignee: parentStory.assignee || '',
              priority: parentStory.priority !== undefined ? parentStory.priority : 2,
              storyPoints: parentStory.storyPoints !== undefined ? parentStory.storyPoints : 0
            };
            console.log('Setting duplicate form data:', duplicateFormData);
            setFormData(duplicateFormData);
          } else {
            // For regular parent story (adding child), merge with previous state
            setFormData(prev => ({
              ...prev,
              status: initialStatus || parentStory.status || prev.status || 'todo',
              projectId: parentStory.projectId ? String(parentStory.projectId) : prev.projectId,
              parentId: parentStory.usId || parentStory.parentId || prev.parentId || '',
              releaseId: parentStory.releaseId ? String(parentStory.releaseId) : (parentStory.release ? String(parentStory.release) : ''),
              sprintId: parentStory.sprintId ? String(parentStory.sprintId) : (parentStory.sprint ? String(parentStory.sprint) : ''),
              system: parentStory.system || parentStory.systemName || prev.system || '',
              assignee: parentStory.assignee || prev.assignee || ''
            }));
            // Mark release/sprint/system/assignee as fixed (uneditable) when provided by parentStory
            if (parentStory.releaseId || parentStory.release) setReleaseFixed(true);
            if (parentStory.sprintId || parentStory.sprint) setSprintFixed(true);
            if (parentStory.system || parentStory.systemName) setSystemFixed(true);
            if (parentStory.assignee) setAssigneeFixed(true);
          }
        } else if (initialProjectId) {
          // If initialProjectId is provided (from dashboard context), pre-fill projectId
          setFormData({ ...baseFormData, projectId: String(initialProjectId) });
        } else {
          // Reset to base form data
          setFormData(baseFormData);
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

        // Fetch Systems
        try {
          const systemsResponse = await axios.get(`${API_BASE_URL}/api/systems/tenant`, {
            headers: { Authorization: token }
          });
          setSystems(systemsResponse.data);
        } catch (error) {
          console.error("Error fetching systems:", error);
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
        // Determine projectId from parentStory (could be duplicate data) or initialProjectId
        const projectIdToUse = parentStory?.projectId || initialProjectId || null;
        
        if (projectIdToUse) {
          await fetchProjectUsers(projectIdToUse);
        }

        // Fetch Releases and Sprints scoped to the project if we have a projectId
        if (projectIdToUse) {
          try {
            const releasesResponse = await axios.get(`${API_BASE_URL}/api/releases/project/${projectIdToUse}`, {
              headers: { Authorization: token }
            });
            setReleases(releasesResponse.data || []);
          } catch (error) {
            console.error('Error fetching releases for project', projectIdToUse, error);
            setReleases([]);
          }

          try {
            const sprintsResponse = await axios.get(`${API_BASE_URL}/api/sprints/project/${projectIdToUse}`, {
              headers: { Authorization: token }
            });
            setSprints(sprintsResponse.data || []);
          } catch (error) {
            console.error('Error fetching sprints for project', projectIdToUse, error);
            setSprints([]);
          }
        } else {
          setReleases([]);
          setSprints([]);
        }
      }
    };

    fetchData();
    fetchStatusFlags();
  }, [open, parentStory, sessionData?.tenantId, initialProjectId, initialStatus]);

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
    e.target.value = null;
    return;
  }

  // Validate each file
  const maxSize = 10 * 1024 * 1024;
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
    'image/gif',
    'text/plain'
  ];

  let error = "";
  const validFiles = [];

  for (const file of newFiles) {
    if (file.size > maxSize) {
      error = `File "${file.name}" exceeds 10MB limit.`;
      break;
    }
    if (!allowedTypes.includes(file.type)) {
      error = "Unsupported file type. Upload PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, GIF, or TXT.";
      break;
    }
    validFiles.push(file);
  }

  if (error) {
    showSnackbar(error, "error");
    e.target.value = null;
    return;
  }

  if (validFiles.length > 0) {
    // de-dup by (name + size + lastModified)
    const deduped = validFiles.filter(file => {
      return !formData.attachments.some(existingFile =>
        existingFile.name === file.name &&
        existingFile.size === file.size &&
        existingFile.lastModified === file.lastModified
      );
    });

    const filesToAdd = deduped.slice(0, 4 - formData.attachments.length);

    if (deduped.length > filesToAdd.length) {
      showSnackbar(`Only ${filesToAdd.length} more file(s) can be added (max 4). Some duplicate files were skipped.`, "warning");
    }

    if (filesToAdd.length > 0) {
      setFormData(prev => ({
        ...prev,
        attachments: [...prev.attachments, ...filesToAdd]
      }));
    } else {
      showSnackbar('All selected files are duplicates and were skipped.', 'info');
    }
  }

  e.target.value = null;
};

  const handleInputChange = (field) => (event) => {
    let value = event.target.value;

    if (field === 'storyPoints') {
      const numValue = parseInt(value, 10);
      value = Number.isNaN(numValue) ? 0 : Math.min(50, Math.max(0, numValue));
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

  const validateForm = () => {
    if (!formData.projectId) {
      showSnackbar("Please select an initiative", 'error');
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
        storyPoints: Math.min(50, Math.max(0, parseInt(formData.storyPoints, 10) || 0)),
        assignee: formData.assignee,
        releaseId: formData.releaseId ? parseInt(formData.releaseId) : null,
        sprintId: formData.sprintId ? parseInt(formData.sprintId) : null
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
      status: initialStatus || 'todo',
      priority: 2,
      summary: '',
      description: '',
      system: '',
      storyPoints: 0,
      assignee: '',
      releaseId: parentStory?.releaseId ? String(parentStory.releaseId) : '',
      sprintId: parentStory?.sprint ? String(parentStory.sprint) : '',
      attachments: []
    });
    setFieldErrors({});
    setReleaseFixed(!!parentStory?.releaseId);
    setSprintFixed(!!parentStory?.sprint);
    setSystemFixed(!!parentStory?.system);
    setAssigneeFixed(!!parentStory?.assignee);
  };

  const handleRemoveAttachment = (index) => {
    setFormData((prev) => ({
      ...prev,
      attachments: (prev.attachments || []).filter((_, i) => i !== index),
    }));
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
                      <>
                        <p className="text-green-100 text-xs sm:text-sm break-words overflow-wrap-anywhere">Parent Story: {parentStory.usId}</p>
                        <p className="text-green-100 text-xs sm:text-sm break-words overflow-wrap-anywhere">Initiative name: {getProjectName(formData.projectId)}</p>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-end">
                  <button
                    type="button"
                    onClick={resetForm}
                    disabled={loading}
                    className={`rounded px-5 h-[42px] font-semibold text-sm text-white transition-colors ${loading ? 'text-white cursor-not-allowed' : 'text-white hover:text-black bg-gray-500 hover:bg-gray-100'}`}
                  >
                    Reset
                  </button>

                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={loading}
                    className={`border rounded px-5 h-[42px] text-sm transition-colors ${loading ? 'border-gray-300 text-gray-400 cursor-not-allowed' : `border-[${greenPrimary}] text-[${greenPrimary}] hover:border-[${greenHover}] hover:text-[${greenHover}]`}`}
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={loading}
                    className={`rounded px-5 h-[42px] font-semibold text-sm text-white transition-colors ${loading ? `bg-green-500 cursor-not-allowed` : `bg-green-500 hover:bg-green-600`}`}
                  >
                    {loading ? "Creating..." : "Add Solution Story"}
                  </button>

                  <button
                    type="button"
                    onClick={handleClose}
                    className="p-2 hover:bg-green-700 rounded-full transition-colors cursor-pointer"
                    disabled={loading}
                    aria-label="Close"
                  >
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Form Content */}
            <div className="p-4 sm:p-6 space-y-4">
              {/* Row 1: Status, Priority, Story Points, System */}
              <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3'>
                <div className="w-full flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <div className="relative">
                    <select
                      value={formData.status || ''}
                      onChange={handleInputChange('status')}
                      className="w-full border border-gray-300 rounded-md pl-3 pr-4 py-2 text-sm focus:outline-none  focus:ring-2 focus:ring-green-500 focus:outline-none"
                      style={{ height: fieldHeight }}
                    >
                      {Array.isArray(statusFlags) && statusFlags.map(statusFlag => (
                        <option key={statusFlag.statusId} value={statusFlag.statusValue} title={`${statusFlag.statusName} - ${statusFlag.remarks || 'No description available'}`}>
                          {statusFlag.statusName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="w-full">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <div className="relative">
                    <select
                      value={formData.priority || ''}
                      onChange={handleInputChange('priority')}
                      className="w-full border border-gray-300 rounded-md pl-3 pr-4 py-2 text-sm focus:outline-none  focus:ring-2 focus:ring-green-500 focus:outline-none"
                      style={{ height: fieldHeight }}
                    >
                      <option value="1">High</option>
                      <option value="2">Medium</option>
                      <option value="3">Low</option>
                    </select>
                  </div>
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
                    max="50"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none  focus:ring-2 focus:ring-green-500 focus:outline-none"
                    style={{ height: fieldHeight }}
                  />
                </div>

                <div className="w-full">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    System
                  </label>
                  <div className="relative">
                    <CreatableSelect
                      value={formData.system ? { value: formData.system, label: formData.system } : null}
                      onChange={(selectedOption) => {
                        if (systemFixed) return; // prevent change when fixed
                        const value = selectedOption ? selectedOption.value : '';
                        setFormData(prev => ({ ...prev, system: value }));
                      }}
                      options={systems.map(system => ({
                        value: system.systemName,
                        label: system.systemName
                      }))}
                      isClearable={!systemFixed}
                      placeholder="Select or type system..."
                      isDisabled={loading || systemFixed}
                      className={`text-sm ${systemFixed ? 'opacity-60 bg-gray-100' : ''}`}
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
                        valueContainer: (provided) => provided,
                        singleValue: (provided) => ({ ...provided, marginLeft: 0 }),
                        input: (provided) => ({ ...provided, marginLeft: 0 }),
                        placeholder: (provided) => ({ ...provided, marginLeft: 0 })
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Row 2: Assignee, Release, Sprint */}
              <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3'>
                <div className="w-full">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assignee
                  </label>
                  <div className="relative">
                    <CreatableSelect
                      value={formData.assignee ? { value: formData.assignee, label: formData.assignee } : null}
                      onChange={(selectedOption) => {
                        if (assigneeFixed) return; // prevent change when fixed
                        const value = selectedOption ? selectedOption.value : '';
                        setFormData(prev => ({ ...prev, assignee: value }));
                      }}
                      options={users.map(user => ({
                        value: user.name,
                        label: user.name
                      }))}
                      isClearable={!assigneeFixed}
                      placeholder="Select or type assignee..."
                      isDisabled={loading || assigneeFixed}
                      className={`text-sm ${assigneeFixed ? 'opacity-60 bg-gray-100' : ''}`}
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
                        valueContainer: (provided) => provided,
                        singleValue: (provided) => ({ ...provided, marginLeft: 0 }),
                        input: (provided) => ({ ...provided, marginLeft: 0 }),
                        placeholder: (provided) => ({ ...provided, marginLeft: 0 })
                      }}
                    />
                  </div>
                </div>

                <div className="w-full">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Release
                  </label>
                  <div className="relative">
                    <CreatableSelect
                      value={formData.releaseId ? (() => {
                        const selectedRelease = releases.find(r => r.releaseId.toString() === formData.releaseId.toString());
                        return selectedRelease ? { value: formData.releaseId, label: selectedRelease.releaseName } : { value: formData.releaseId, label: formData.releaseId };
                      })() : null}
                      onChange={(selectedOption) => {
                        if (releaseFixed) return; // prevent change when fixed
                        const value = selectedOption ? selectedOption.value : '';
                        setFormData(prev => ({ ...prev, releaseId: value }));
                      }}
                      options={releases.map(release => ({ value: release.releaseId.toString(), label: release.releaseName }))}
                      isClearable={!releaseFixed}
                      placeholder="Select release"
                      isDisabled={loading || releaseFixed}
                      className={`text-sm ${releaseFixed ? 'opacity-60 bg-gray-100' : ''}`}
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
                        menu: (provided) => ({ ...provided, zIndex: 9999 }),
                        valueContainer: (provided) => provided,
                        singleValue: (provided) => ({ ...provided, marginLeft: 0 }),
                        input: (provided) => ({ ...provided, marginLeft: 0 }),
                        placeholder: (provided) => ({ ...provided, marginLeft: 0 })
                      }}
                    />
                  </div>
                </div>

                <div className="w-full">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sprint
                  </label>
                  <div className="relative">
                    <CreatableSelect
                      value={formData.sprintId ? (() => {
                        const selectedSprint = sprints.find(s => s.sprintId.toString() === formData.sprintId.toString());
                        return selectedSprint ? { value: formData.sprintId, label: selectedSprint.sprintName } : { value: formData.sprintId, label: formData.sprintId };
                      })() : null}
                      onChange={(selectedOption) => {
                        if (sprintFixed) return; // prevent change when fixed
                        const value = selectedOption ? selectedOption.value : '';
                        setFormData(prev => ({ ...prev, sprintId: value }));
                      }}
                      options={sprints.map(sprint => ({ value: sprint.sprintId.toString(), label: sprint.sprintName }))}
                      isClearable={!sprintFixed}
                      placeholder="Select sprint"
                      isDisabled={loading || sprintFixed}
                      className={`text-sm ${sprintFixed ? 'opacity-60 bg-gray-100' : ''}`}
                      styles={{
                        control: (provided) => ({
                          ...provided,
                          minHeight: '40px',
                          borderColor: '#d1d5db',
                          fontSize: '14px',
                          '&:hover': { borderColor: '#10b981' }
                        }),
                        menu: (provided) => ({ ...provided, zIndex: 9999 }),
                        valueContainer: (provided) => provided,
                        singleValue: (provided) => ({ ...provided, marginLeft: 0 }),
                        input: (provided) => ({ ...provided, marginLeft: 0 }),
                        placeholder: (provided) => ({ ...provided, marginLeft: 0 })
                      }}
                    />
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
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none  focus:ring-2 focus:ring-green-500 focus:outline-none focus:border-green-500 resize-none break-words overflow-wrap-anywhere whitespace-pre-wrap"
                  ></textarea>
                </div>
                <div className="flex justify-end text-sm text-gray-500 pr-1 mt-1">
                  {formData.description.length} / 500
                </div>
              </div>
              <div className="w-full md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Summary <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <textarea
                    id="summary"
                    name="summary"
                    placeholder="Enter solution story summary..."
                    value={formData.summary || ''}
                    onChange={handleInputChange('summary')}
                    rows={4}
                    maxLength={200}
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none  focus:ring-2 focus:ring-green-500 focus:outline-none focus:border-green-500 resize-none break-words overflow-wrap-anywhere whitespace-pre-wrap"
                  />
                </div>
                <div className="flex justify-end text-sm text-gray-500 pr-1 mt-1">
                  {formData.summary?.length || 0} / 200
                </div>
              </div>

              {/* Attachments Section (match Add User Story UI) */}
              <div className="w-full mb-4">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Story Attachments (Max 4), Supported formats: PDF, DOC, DOCX, JPG, PNG, GIF, TXT
                </label>

                <input
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  disabled={loading}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.txt"
                  title="Upload document or image file (max 10MB)"
                />

                {formData.attachments.length > 0 && (
                  <ul className="mt-2 text-xs text-gray-700 flex flex-wrap gap-2">
                    {formData.attachments.map((file, index) => (
                      <li
                        key={index}
                        className="flex items-center justify-between bg-gray-100 px-3 py-1 rounded"
                      >
                        <span
                          className="truncate max-w-[150px]"
                          title={file.name}
                        >
                          {file.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveAttachment(index)}
                          className="ml-2 text-red-600 hover:text-red-800 text-xs cursor-pointer"
                        >
                          Delete
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Action Buttons (footer + header) */}
              <div className="flex justify-between items-center mt-2">
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={loading}
                  className={`rounded px-5 h-[42px] font-semibold text-sm text-white transition-colors ${loading ? 'text-white cursor-not-allowed' : 'text-white hover:text-black bg-gray-500 hover:bg-gray-100'}`}
                >
                  Reset
                </button>

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={loading}
                    className={`border rounded px-5 h-[42px] text-sm transition-colors ${loading ? 'border-gray-300 text-gray-400 cursor-not-allowed' : `border-[${greenPrimary}] text-[${greenPrimary}] hover:border-[${greenHover}] hover:text-[${greenHover}]`}`}
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
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