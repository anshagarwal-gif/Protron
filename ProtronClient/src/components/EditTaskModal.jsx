import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  Box
} from '@mui/material';
import axios from 'axios';
import GlobalSnackbar from './GlobalSnackbar';
import { useSession } from '../Context/SessionContext';

const API_BASE_URL = import.meta.env.VITE_API_URL;

// Truncate function for project names
const truncateText = (text, maxLength = 20) => {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
};

const EditTaskModal = ({ open, onClose, taskId, taskData }) => {
  const [formData, setFormData] = useState({
    projectId: '',
    parentId: '',
    date: '',
    taskType: '',
    taskTopic: '',
    taskDescription: '',
    estTimeHours: 0,
    estTimeMinutes: 0,
    timeSpentHours: 0,
    timeSpentMinutes: 0,
    timeRemainingHours: 0,
    timeRemainingMinutes: 0,
    attachments: [],
    createdBy: '',
    dateCreated: '',
    status: 'todo'
  });

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [errors, setErrors] = useState({});
  const [statusFlags, setStatusFlags] = useState([]);
  const { sessionData } = useSession();

  // Green theme colors
  const greenPrimary = '#15803d';
  const greenHover = '#047857';
  const fieldHeight = '40px';

  // Helper function to parse estTime string (e.g., "2h 30m") into hours and minutes
  const parseEstTime = (estTimeString) => {
    if (!estTimeString) return { hours: 0, minutes: 0 };
    
    const hoursMatch = estTimeString.match(/(\d+)h/i);
    const minutesMatch = estTimeString.match(/(\d+)m/i);
    
    const hours = hoursMatch ? parseInt(hoursMatch[1], 10) : 0;
    const minutes = minutesMatch ? parseInt(minutesMatch[1], 10) : 0;
    
    return { hours, minutes };
  };

  const fetchStatusFlags = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/status-flags/type/story`, {
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
      if (open && taskData) {
        setInitialLoading(true);
        try {
          // Fetch status flags when modal opens
          
          // Parse estTime into hours and minutes
          const { hours: estHours, minutes: estMinutes } = parseEstTime(taskData.estTime || '');
          
          // Set form data from existing task data
          setFormData({
            projectId: taskData.projectId || '',
            parentId: taskData.parentId || '',
            date: taskData.date || '',
            taskType: taskData.taskType || '',
            taskTopic: taskData.taskTopic || '',
            // Use taskDescription field from API response to populate the textarea
            taskDescription: taskData.taskDescription || '',
            estTimeHours: estHours,
            estTimeMinutes: estMinutes,
            timeSpentHours: taskData.timeSpentHours || 0,
            timeSpentMinutes: taskData.timeSpentMinutes || 0,
            timeRemainingHours: taskData.timeRemainingHours || 0,
            timeRemainingMinutes: taskData.timeRemainingMinutes || 0,
            attachments: [],
            createdBy: taskData.createdBy || '',
            dateCreated: taskData.dateCreated || '',
            status: taskData.status || 'todo'
          });

          // Fetch existing attachments
          await fetchTaskAttachments(taskData.taskId);

        } catch (error) {
          console.error("Error fetching task data:", error);
          setErrors(prev => ({ ...prev, submit: "Failed to load task data." }));
        } finally {
          setInitialLoading(false);
        }
      }

      if (open) {
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
      }
    };

    fetchData();
    fetchStatusFlags();
  }, [open, taskData, sessionData?.tenantId]);

  const fetchTaskAttachments = async (currentTaskId) => {
    try {
      const token = sessionStorage.getItem("token");
      const response = await axios.get(
        `${API_BASE_URL}/api/tasks/${currentTaskId}/attachments`,
        { headers: { Authorization: token } }
      );
      // Convert existing attachments to file-like objects for display
      const existingFiles = response.data.map(attachment => ({
        id: attachment.id,
        name: attachment.fileName,
        size: attachment.fileSize || 0,
        existing: true
      }));
      setFormData(prev => ({ ...prev, attachments: existingFiles }));
    } catch (error) {
      console.error("Error fetching task attachments:", error);
      setFormData(prev => ({ ...prev, attachments: [] }));
    }
  };

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
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
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

  const handleRemoveAttachment = (index, attachmentId = null) => {
    if (attachmentId) {
      // Remove existing attachment from server
      axios.delete(`${API_BASE_URL}/api/tasks/attachment/${attachmentId}`, {
        headers: { Authorization: sessionStorage.getItem('token') }
      }).then(() => {
        showSnackbar("Attachment removed successfully", "success");
      }).catch(error => {
        console.error("Error removing attachment:", error);
        showSnackbar("Failed to remove attachment", "error");
      });
    }

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

  const validateForm = () => {
    if (!formData.projectId) {
      showSnackbar("Please select an initiative", 'error');
      return false;
    }

    if (!formData.taskTopic) {
      showSnackbar("Please enter task topic", 'error');
      return false;
    }

    if (formData.taskTopic.length > 100) {
      showSnackbar("Task Topic cannot exceed 100 characters", 'error');
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
      
      // Format estTime from hours and minutes
      const estHours = parseInt(formData.estTimeHours) || 0;
      const estMinutes = parseInt(formData.estTimeMinutes) || 0;
      const estTime = estHours > 0 || estMinutes > 0 ? `${estHours}h ${estMinutes}m` : '';

      const taskData = {
        projectId: parseInt(formData.projectId),
        parentId: formData.parentId,
        date: formData.date,
        taskType: formData.taskType,
        taskTopic: formData.taskTopic,
        taskDescription: formData.taskDescription,
        estTime: estTime,
        timeSpentHours: parseInt(formData.timeSpentHours) || 0,
        timeSpentMinutes: parseInt(formData.timeSpentMinutes) || 0,
        timeRemainingHours: parseInt(formData.timeRemainingHours) || 0,
        timeRemainingMinutes: parseInt(formData.timeRemainingMinutes) || 0,
        createdBy: formData.createdBy,
        dateCreated: formData.dateCreated,
        status: formData.status
      };

      await axios.put(
        `${API_BASE_URL}/api/tasks/${taskId}`,
        taskData,
        {
          headers: {
            Authorization: token,
            'Content-Type': 'application/json'
          }
        }
      );

      // Upload new attachments if any
      const newFiles = formData.attachments.filter(file => !file.existing);
      if (newFiles.length > 0) {
        const uploadPromises = newFiles.map(file => {
          const fileFormData = new FormData();
          fileFormData.append("file", file);

          return axios.post(
            `${API_BASE_URL}/api/tasks/${taskId}/attachment`,
            fileFormData,
            {
              headers: {
                Authorization: token,
                'Content-Type': 'multipart/form-data',
              },
            }
          );
        });
        await Promise.all(uploadPromises);
      }

      showSnackbar("Task updated successfully", 'success');
      onClose();
    } catch (error) {
      console.error("Failed to update task:", error);
      if (error.response?.data?.message) {
        showSnackbar(error.response.data.message, 'error');
      } else {
        showSnackbar("Failed to update task", 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    if (taskData) {
      // Parse estTime into hours and minutes
      const { hours: estHours, minutes: estMinutes } = parseEstTime(taskData.estTime || '');
      
      setFormData({
        projectId: taskData.projectId || '',
        parentId: taskData.parentId || '',
        date: taskData.date || '',
        taskType: taskData.taskType || '',
        taskTopic: taskData.taskTopic || '',
        taskDescription: taskData.taskDescription || '',
        estTimeHours: estHours,
        estTimeMinutes: estMinutes,
        timeSpentHours: taskData.timeSpentHours || 0,
        timeSpentMinutes: taskData.timeSpentMinutes || 0,
        timeRemainingHours: taskData.timeRemainingHours || 0,
        timeRemainingMinutes: taskData.timeRemainingMinutes || 0,
        attachments: [],
        createdBy: taskData.createdBy || '',
        dateCreated: taskData.dateCreated || '',
        status: taskData.status || 'todo'
      });
    }
    setErrors({});
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
            <span className="ml-3 text-gray-600">Loading task data...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

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
                  <h2 className="text-xl font-bold text-gray-900">Edit Task</h2>
                  {taskData && (
                    <div className="flex items-center space-x-4">
                  <p className="text-sm text-gray-600">Task ID: {taskData?.taskId}</p>
                  <p className="text-sm text-gray-600">Parent ID: {taskData?.parentId}</p>
                  </div>)}
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Error Display */}
            {errors.submit && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3 flex items-center">
                <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l9 7.14V22H3V9.14L12 2zm0 2.86L5 10.14V20h14V10.14L12 4.86zM11 13v6h2v-6h-2z" />
                </svg>
                <span className="text-red-700 text-sm">{errors.submit}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Row 1: Project and Task Type */}
              <div className='grid grid-cols-3 gap-3'>
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
                      className={`w-full border ${!formData.projectId ? 'border-red-500' : 'border-gray-300'} rounded-md h-10 pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100 disabled:cursor-not-allowed`}
                      required
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
                    Task Type
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
                      value={formData.taskType || ''}
                      onChange={handleInputChange('taskType')}
                      className="w-full border border-gray-300 rounded-md pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      style={{ height: fieldHeight }}
                      disabled={loading}
                    >
                      <option value="">Select from list</option>
                      <option value="development">Development</option>
                      <option value="testing">Testing</option>
                      <option value="design">Design</option>
                      <option value="documentation">Documentation</option>
                      <option value="review">Review</option>
                      <option value="meeting">Meeting</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="w-full">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Task Topic <span className="text-red-500">*</span>
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
                      value={formData.taskTopic || ''}
                      onChange={handleInputChange('taskTopic')}
                      placeholder="Enter task topic..."
                      maxLength={100}
                      className="w-full border border-gray-300 rounded-md pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      style={{ height: fieldHeight }}
                      disabled={loading}
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1 text-right pr-1">
                    {formData.taskTopic?.length || 0} / 100
                  </p>
                </div>
              </div>

              {/* Status */}
              <div className="w-full mt-3">
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
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                    </svg>
                  </div>
                  <select
                    value={formData.status}
                    onChange={handleInputChange('status')}
                    className="w-full border border-gray-300 rounded-md pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    style={{ height: fieldHeight }}
                    disabled={loading}
                  >
                    {Array.isArray(statusFlags) && statusFlags.map(statusFlag => (
                    <option key={statusFlag.statusId} value={statusFlag.statusValue} title={`${statusFlag.statusName} - ${statusFlag.remarks || 'No description available'}`}>
                      {statusFlag.statusName}
                    </option>
                  ))}
                  </select>
                </div>
              </div>

              {/* Row 2: Time Fields */}
              <div className='grid grid-cols-3 gap-3'>

                <div className="w-full">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Est. Time
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <label className="block text-xs text-gray-600 mb-1">Hours</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <svg
                            className="h-5 w-5 text-green-600"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M12 8V13H16V11H14V8H12ZM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12S7.59 4 12 4s8 3.59 8 8-3.59 8-8 8Z" />
                          </svg>
                        </div>
                        <input
                          type="number"
                          placeholder="HH"
                          className={`w-full border rounded-md pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 ${formData.estTimeHours !== '' && (parseInt(formData.estTimeHours) < 0 || parseInt(formData.estTimeHours) > 24)
                            ? 'border-red-500 focus:ring-red-500'
                            : 'border-gray-300 focus:ring-green-500'
                            }`}
                          value={formData.estTimeHours}
                          onChange={handleInputChange('estTimeHours')}
                          onKeyDown={(e) => {
                            if (
                              !/[0-9]/.test(e.key) &&
                              !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)
                            ) {
                              e.preventDefault();
                            }
                          }}
                          min="0"
                          max="24"
                          style={{ height: fieldHeight }}
                          disabled={loading}
                        />
                        {formData.estTimeHours !== '' &&
                          (parseInt(formData.estTimeHours) < 0 || parseInt(formData.estTimeHours) > 24) && (
                            <p className="text-xs text-red-600 mt-1">0–24</p>
                          )}
                      </div>
                    </div>
                    <div className="text-gray-500 font-semibold text-xl self-end pb-2">:</div>
                    <div className="flex-1">
                      <label className="block text-xs text-gray-600 mb-1">Minutes</label>
                      <input
                        type="number"
                        placeholder="MM"
                        className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 ${formData.estTimeMinutes !== "" &&
                          (parseInt(formData.estTimeMinutes) < 0 || parseInt(formData.estTimeMinutes) > 59)
                          ? "border-red-500 focus:ring-red-500"
                          : "border-gray-300 focus:ring-green-500"
                          }`}
                        value={formData.estTimeMinutes}
                        onChange={(e) => {
                          let value = e.target.value;

                          // Allow empty (user clears input)
                          if (value === "") {
                            handleInputChange("estTimeMinutes")({ target: { value: "" } });
                            return;
                          }

                          const num = parseInt(value, 10);

                          // Accept only numbers between 0–59
                          if (num >= 0 && num <= 59) {
                            handleInputChange("estTimeMinutes")(e);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (
                            !/[0-9]/.test(e.key) &&
                            !["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab"].includes(e.key)
                          ) {
                            e.preventDefault();
                          }
                        }}
                        min="0"
                        max="59"
                        style={{ height: fieldHeight }}
                        disabled={loading}
                      />
                      {formData.estTimeMinutes !== "" &&
                        (parseInt(formData.estTimeMinutes) < 0 || parseInt(formData.estTimeMinutes) > 59) && (
                          <p className="text-xs text-red-600 mt-1">0–59</p>
                        )}
                    </div>
                  </div>
                </div>

                <div className="w-full">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Spent Hours</label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <label className="block text-xs text-gray-600 mb-1">Hours</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <svg
                            className="h-5 w-5 text-green-600"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M12 8V13H16V11H14V8H12ZM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12S7.59 4 12 4s8 3.59 8 8-3.59 8-8 8Z" />
                          </svg>
                        </div>
                        <input
                          type="number"
                          placeholder="HH"
                          className={`w-full border rounded-md pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 ${formData.timeSpentHours !== '' && (parseInt(formData.timeSpentHours) < 0 || parseInt(formData.timeSpentHours) > 24)
                            ? 'border-red-500 focus:ring-red-500'
                            : 'border-gray-300 focus:ring-green-500'
                            }`}
                          value={formData.timeSpentHours}
                          onChange={handleInputChange('timeSpentHours')}
                          onKeyDown={(e) => {
                            if (
                              !/[0-9]/.test(e.key) &&
                              !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)
                            ) {
                              e.preventDefault();
                            }
                          }}
                          min="0"
                          max="24"
                          style={{ height: fieldHeight }}
                          disabled={loading}
                        />
                        {formData.timeSpentHours !== '' &&
                          (parseInt(formData.timeSpentHours) < 0 || parseInt(formData.timeSpentHours) > 24) && (
                            <p className="text-xs text-red-600 mt-1">0–24</p>
                          )}
                      </div>
                    </div>
                    <div className="text-gray-500 font-semibold text-xl self-end pb-2">:</div>
                    <div className="flex-1">
                      <label className="block text-xs text-gray-600 mb-1">Minutes</label>
                      <input
                        type="number"
                        placeholder="MM"
                        className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 ${formData.timeSpentMinutes !== "" &&
                          (parseInt(formData.timeSpentMinutes) < 0 || parseInt(formData.timeSpentMinutes) > 59)
                          ? "border-red-500 focus:ring-red-500"
                          : "border-gray-300 focus:ring-green-500"
                          }`}
                        value={formData.timeSpentMinutes}
                        onChange={(e) => {
                          let value = e.target.value;

                          // Allow empty (user clears input)
                          if (value === "") {
                            handleInputChange("timeSpentMinutes")({ target: { value: "" } });
                            return;
                          }

                          const num = parseInt(value, 10);

                          // Accept only numbers between 0–59
                          if (num >= 0 && num <= 59) {
                            handleInputChange("timeSpentMinutes")(e);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (
                            !/[0-9]/.test(e.key) &&
                            !["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab"].includes(e.key)
                          ) {
                            e.preventDefault();
                          }
                        }}
                        min="0"
                        max="59"
                        style={{ height: fieldHeight }}
                        disabled={loading}
                      />
                      {formData.timeSpentMinutes !== '' &&
                        (parseInt(formData.timeSpentMinutes) < 0 || parseInt(formData.timeSpentMinutes) >= 60) && (
                          <p className="text-xs text-red-600 mt-1">0–59</p>
                        )}
                    </div>
                  </div>
                </div>

                <div className="w-full">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Remaining Hours</label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <label className="block text-xs text-gray-600 mb-1">Hours</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <svg
                            className="h-5 w-5 text-green-600"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M12 8V13H16V11H14V8H12ZM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12S7.59 4 12 4s8 3.59 8 8-3.59 8-8 8Z" />
                          </svg>
                        </div>
                        <input
                          type="number"
                          placeholder="HH"
                          value={formData.timeRemainingHours}
                          onChange={handleInputChange('timeRemainingHours')}
                          onKeyDown={(e) => {
                            if (
                              !/[0-9]/.test(e.key) &&
                              !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)
                            ) {
                              e.preventDefault();
                            }
                          }}
                          min="0"
                          max="24"
                          className="w-full border border-gray-300 rounded-md pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                          style={{ height: fieldHeight }}
                          disabled={loading}
                        />
                      </div>
                    </div>
                    <div className="text-gray-500 font-semibold text-xl self-end pb-2">:</div>
                    <div className="flex-1">
                      <label className="block text-xs text-gray-600 mb-1">Minutes</label>
                      <input
                        type="number"
                        placeholder="MM"
                        value={formData.timeRemainingMinutes}
                        onChange={(e) => {
                          let value = e.target.value;

                          // Prevent invalid input
                          if (value === "") {
                            handleInputChange("timeRemainingMinutes")({ target: { value: "" } });
                            return;
                          }

                          const num = parseInt(value, 10);

                          if (num >= 0 && num <= 59) {
                            handleInputChange("timeRemainingMinutes")(e);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (
                            !/[0-9]/.test(e.key) &&
                            !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)
                          ) {
                            e.preventDefault();
                          }
                        }}
                        min="0"
                        max="59"
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                        style={{ height: fieldHeight }}
                        disabled={loading}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="w-full mb-4">
                <label htmlFor="taskDescription" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <div className="relative">
                  <textarea
                    id="taskDescription"
                    name="taskDescription"
                    placeholder="Enter detailed description here..."
                    value={formData.taskDescription}
                    onChange={handleInputChange('taskDescription')}
                    rows={4}
                    maxLength={500}
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
                    disabled={loading}
                  ></textarea>
                </div>
                <div className="flex justify-end text-sm text-gray-500 pr-1 mt-1">
                  {formData.taskDescription.length} / 500
                </div>
              </div>

              {/* Attachments */}
              <div className="w-full mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Attachments ({formData.attachments.length}/4)
                </label>
                <label
                  htmlFor="file-upload"
                  className={`border border-dashed rounded p-3 flex items-center justify-center min-h-[50px] bg-gray-50 w-full cursor-pointer transition ${formData.attachments.length >= 4 ? 'cursor-not-allowed opacity-50' : 'hover:border-green-700 hover:bg-green-50'}`}
                >
                  <input
                    type="file"
                    id="file-upload"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png,.xls,.xlsx"
                    onChange={handleFileChange}
                    disabled={formData.attachments.length >= 4 || loading}
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
                    <span>
                      {formData.attachments.length >= 4 ? 'Max files reached' : 'Upload files'}
                    </span>
                  </div>
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  Max file size: 10 MB per file
                </p>
                {formData.attachments.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {formData.attachments.map((file, index) => (
                      <div
                        key={(file.id || file.name) + index}
                        className={`flex items-center px-2 py-1 rounded-full text-sm border ${
                          file.existing 
                            ? 'bg-blue-50 text-blue-700 border-blue-300' 
                            : 'bg-emerald-50 text-emerald-700 border-emerald-300'
                        }`}
                      >
                        <span className="mr-1 flex items-center gap-1">
                          {truncateText(file.name, 15)}
                          <span className="text-gray-500 text-xs">({formatFileSize(file.size)})</span>
                          {file.existing && <span className="text-xs text-blue-600">(existing)</span>}
                        </span>
                        <button
                          onClick={() => handleRemoveAttachment(index, file.id)}
                          type="button"
                          className="ml-2 text-sm text-inherit hover:text-red-500"
                          disabled={loading}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
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
                    {loading ? "Updating..." : "Update Task"}
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

export default EditTaskModal;