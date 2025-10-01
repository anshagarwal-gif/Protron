import React, { useEffect, useState, useRef } from 'react';
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

const AddTaskModal = ({ open, onClose, parentStory }) => {
  if (!open) return null;

  const [formData, setFormData] = useState({
    projectId: '',
    parentId: '',
    date: '',
    taskType: '',
    taskTopic: '',
    taskDescription: '',
    estTime: '',
    timeSpentHours: 0,
    timeSpentMinutes: 0,
    timeRemainingHours: 0,
    timeRemainingMinutes: 0,
    attachments: []
  });

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [error, setError] = useState({});
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
            parentId: parentStory.usId || parentStory.ssId, // Can be from UserStory or SolutionStory
            date: new Date().toISOString().split('T')[0]
          }));
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
      }
    };

    fetchData();
  }, [open, parentStory, sessionData.tenantId]);

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
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({
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

  const validateForm = () => {
    if (!formData.projectId) {
      showSnackbar("Please select a project", 'error');
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

    // Time validation
    const hours = parseInt(formData.timeSpentHours) || 0;
    const minutes = parseInt(formData.timeSpentMinutes) || 0;

    if (hours === 0 && minutes === 0) {
      showSnackbar("Please enter Time Spent", 'error');
      return false;
    }

    // Hours validation
    if (formData.timeSpentHours !== '' && (hours < 0 || hours > 24)) {
      showSnackbar("Hours must be between 0 and 24", 'error');
      return false;
    }

    // Minutes validation
    if (formData.timeSpentMinutes !== '' && (minutes < 0 || minutes >= 60)) {
      showSnackbar("Minutes must be between 0 and 59", 'error');
      return false;
    }

    // Special case: if hours is 24, minutes must be 0
    if (hours === 24 && minutes > 0) {
      showSnackbar("When hours is 24, minutes must be 0", 'error');
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
      
      const taskData = {
        projectId: parseInt(formData.projectId),
        parentId: formData.parentId,
        date: formData.date,
        taskType: formData.taskType,
        taskTopic: formData.taskTopic,
        taskDescription: formData.taskDescription,
        estTime: formData.estTime,
        timeSpentHours: parseInt(formData.timeSpentHours) || 0,
        timeSpentMinutes: parseInt(formData.timeSpentMinutes) || 0,
        timeRemainingHours: parseInt(formData.timeRemainingHours) || 0,
        timeRemainingMinutes: parseInt(formData.timeRemainingMinutes) || 0,
      };

      const response = await axios.post(
        `${API_BASE_URL}/api/tasks/add`,
        taskData,
        {
          headers: {
            Authorization: token,
            'Content-Type': 'application/json'
          }
        }
      );

      const newTaskId = response.data.taskId;

      // Step 2: Upload attachments if any
      if (formData.attachments.length > 0) {
        const uploadPromises = formData.attachments.map(file => {
          const fileFormData = new FormData();
          fileFormData.append("file", file);

          return axios.post(
            `${API_BASE_URL}/api/tasks/${newTaskId}/attachment`,
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

      showSnackbar("Task added successfully", 'success');
      onClose();
      resetForm();
    } catch (error) {
      console.error("Failed to add task:", error);
      if (error.response?.data?.message) {
        showSnackbar(error.response.data.message, 'error');
      } else {
        showSnackbar("Failed to add task", 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      projectId: parentStory?.projectId || '',
      parentId: parentStory?.usId || '',
      date: new Date().toISOString().split('T')[0],
      taskType: '',
      taskTopic: '',
      taskDescription: '',
      estTime: '',
      timeSpentHours: 0,
      timeSpentMinutes: 0,
      timeRemainingHours: 0,
      timeRemainingMinutes: 0,
      attachments: []
    });
    setFieldErrors({});
    setError({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };


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
                    <h2 className="text-xl font-bold text-gray-900">Add Task</h2>
                    {parentStory && (
                      <p className="text-sm text-gray-600">Parent Story: {parentStory.summary}</p>
                    )}
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
                      disabled={!!parentStory}
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
                    Task Topic
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
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1 text-right pr-1">
                    {formData.taskTopic?.length || 0} / 100
                  </p>
                </div>
              </div>

              {/* Row 2: Time Fields */}
              <div className='grid grid-cols-3 gap-3'>
                <div className="w-full">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Est. Time
                  </label>
                  <input
                    type="text"
                    value={formData.estTime || ''}
                    onChange={handleInputChange('estTime')}
                    placeholder="e.g., 2h 30m"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    style={{ height: fieldHeight }}
                  />
                </div>

                <div className="w-full">
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Spent Hours</label>
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
                        />
                        {formData.timeSpentHours !== '' &&
                          (parseInt(formData.timeSpentHours) < 0 || parseInt(formData.timeSpentHours) > 24) && (
                            <p className="text-xs text-red-600 mt-1">0–24</p>
                          )}
                      </div>
                    </div>
                    <div className="text-gray-500 font-semibold text-xl">:</div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Minutes</label>
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
                      />
                      {formData.timeSpentMinutes !== '' &&
                        (parseInt(formData.timeSpentMinutes) < 0 || parseInt(formData.timeSpentMinutes) >= 60) && (
                          <p className="text-xs text-red-600 mt-1">0–59</p>
                        )}
                    </div>
                  </div>
                </div>

                <div className="w-full">
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Remaining Hours</label>
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
                          className="w-full border border-gray-300 rounded-md pl-10 pr-3 py-2 text-sm focus:ring-green-500"
                          style={{ height: fieldHeight }}
                        />
                      </div>
                    </div>
                    <div className="text-gray-500 font-semibold text-xl">:</div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Minutes</label>
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
                        key={file.name + index}
                        className="flex items-center px-2 py-1 rounded-full text-sm border bg-emerald-50 text-emerald-700 border-emerald-300"
                      >
                        <span className="mr-1 flex items-center gap-1">
                          {truncateText(file.name, 15)}
                          <span className="text-gray-500 text-xs">({formatFileSize(file.size)})</span>
                        </span>
                        <button
                          onClick={() => handleRemoveAttachment(index)}
                          type="button"
                          className="ml-2 text-sm text-inherit hover:text-red-500"
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
                    onClick={handleSubmit}
                    disabled={loading}
                    className={`rounded px-5 h-[42px] font-semibold text-sm text-white transition-colors ${loading ? `bg-green-500 cursor-not-allowed` : `bg-green-500 hover:bg-green-600`}`}
                  >
                    {loading ? "Creating..." : "Add Task"}
                  </button>
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

export default AddTaskModal;