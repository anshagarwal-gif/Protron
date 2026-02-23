// LogTimeModal.jsx
import React, { useEffect, useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  TextField,
  Button,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Typography,
  Box,
  InputAdornment,
  IconButton,
  Paper,
  Tooltip,
  Popover,
  Chip
} from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CalendarTodayIcon from '@mui/icons-material/CalendarMonth';
import axios from 'axios';
import GlobalSnackbar from './GlobalSnackbar';
import { StaticDatePicker } from '@mui/x-date-pickers/StaticDatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { enGB } from 'date-fns/locale';

const API_BASE_URL = import.meta.env.VITE_API_URL;

// Truncate function for project names
const truncateText = (text, maxLength = 20) => {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
};

const LogTimeModal = ({ isOpen, onClose, selectedDate, onDateChange, onSave, editingTask, timesheetData }) => {
  const [formData, setFormData] = useState({
    taskType: '',
    hours: '',
    minutes: '',
    remainingHours: '',
    remainingMinutes: '',
    description: '',
    projectId: '',
    taskTopic: '',
    attachments: [] // Changed to array for multiple attachments
  });
  const [projects, setProjects] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentDate, setCurrentDate] = useState(selectedDate || new Date());
  const [existingTime, setExistingTime] = useState(0);
  // Calendar popover state
  const [calendarAnchorEl, setCalendarAnchorEl] = useState(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [error, setError] = useState('');

  // Snackbar state
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  // Helper function to show snackbar
  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  // Handle snackbar close
  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Update currentDate when selectedDate changes
  useEffect(() => {
    if (selectedDate) {
      const localDate = new Date(selectedDate);
      localDate.setHours(0, 0, 0, 0); // Reset time to avoid timezone issues
      setCurrentDate(localDate);
    }
  }, [selectedDate]);
  // Add this new function to load existing attachments
  const loadExistingAttachments = async (task) => {
    if (!task.taskId) {
      console.log("No taskId found for editing task");
      return;
    }

    try {
      console.log("Loading existing attachments for task:", task.taskId);

      // Check if attachments are already in the task object
      if (task.attachments && Array.isArray(task.attachments) && task.attachments.length > 0) {
        console.log("Found attachments in task object:", task.attachments);

        // Convert backend attachments to File-like objects for display
        const existingAttachments = task.attachments.map((attachment, index) => ({
          // Create a pseudo-file object for display purposes
          name: attachment.fileName || `Attachment ${index + 1}`,
          size: attachment.fileSize || 0,
          type: attachment.fileType || 'application/octet-stream',
          // Mark as existing attachment
          isExisting: true,
          attachmentId: attachment.attachmentId,
          // Don't include file data for display efficiency
        }));

        setFormData(prev => ({
          ...prev,
          attachments: existingAttachments
        }));

        console.log("Loaded existing attachments:", existingAttachments);
        return;
      }

      // If not in task object, fetch them separately
      const token = sessionStorage.getItem('token');
      if (!token) {
        console.log("No token found for fetching attachments");
        return;
      }

      const response = await axios.get(
        `${API_BASE_URL}/api/timesheet-tasks/${task.taskId}/attachments`,
        {
          headers: { Authorization: token }
        }
      );

      console.log("Fetched attachments from API:", response.data);

      if (response.data && response.data.length > 0) {
        // Convert API response to File-like objects for display
        const existingAttachments = response.data.map((attachment) => ({
          name: attachment.fileName || `Attachment ${attachment.attachmentId}`,
          size: attachment.fileSize || 0,
          type: attachment.fileType || 'application/octet-stream',
          isExisting: true,
          attachmentId: attachment.attachmentId,
          data: attachment.fileData, // Keep file data for potential download
        }));

        setFormData(prev => ({
          ...prev,
          attachments: existingAttachments
        }));

        console.log("Loaded existing attachments from API:", existingAttachments);
        showSnackbar(`Loaded ${existingAttachments.length} existing attachment(s)`, 'info');
      }

    } catch (error) {
      console.error("Failed to load existing attachments:", error);
      // Don't show error to user as this is not critical
    }
  };
  useEffect(() => {
    if (isOpen) {
      fetchProjects();

      if (editingTask) {
        console.log(editingTask, "et")
        // Pre-fill fields from editingTask
        const totalMinutes =
          (editingTask.hours || editingTask.hoursSpent || 0) * 60 +
          (editingTask.minutes || editingTask.minutesSpent || 0);
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;

        setFormData({
          taskType: editingTask.taskType || editingTask.task || '',
          taskTopic: editingTask.taskTopic || '',
          hours: hours ? String(hours) : '',
          minutes: minutes ? String(minutes) : '',
          remainingHours: editingTask.remainingHours || '',
          remainingMinutes: editingTask.remainingMinutes || '',
          description: editingTask.description || '',
          projectId: editingTask.projectId?.toString() || editingTask.project?.projectId?.toString() || '',
          attachments: [] // Don't prefill file input for security reasons
        });
        loadExistingAttachments(editingTask);
      } else {
        // Reset form for new task
        setFormData({
          taskType: '',
          taskTopic: '',
          hours: '',
          minutes: '',
          remainingHours: '',
          remainingMinutes: '',
          description: '',
          projectId: '',
          attachments: []
        });
      }
    }
  }, [isOpen, editingTask]);

  // Helper function to format date key using local components
  const formatDateKey = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    if (selectedDate && timesheetData && projects) {
      const dateKey = formatDateKey(selectedDate);
      const entries = timesheetData[dateKey] || [];
      const totalMinutes = entries.reduce((total, entry) => {
        return total + (entry.hours || 0) * 60 + (entry.minutes || 0);
      }, 0);

      setExistingTime(totalMinutes);
    }
  }, [selectedDate, timesheetData, projects]);

  const validateTime = (hours, minutes) => {

    const currentMinutes = (parseInt(hours, 10) || 0) * 60 + (parseInt(minutes, 10) || 0);

    let additionalTime = 0

    if (editingTask) {
      console.log("Editing task, adding existing time to current time");
      additionalTime = (parseInt(editingTask.hoursSpent, 10) || 0) * 60 + (parseInt(editingTask.minutesSpent, 10) || 0);
    }
    console.log("Current minutes:", currentMinutes, "Existing time:", existingTime, additionalTime);

    if ((existingTime - additionalTime) + currentMinutes > 1440) { // 1440 minutes = 24 hours
      setError('Total time for the day cannot exceed 24 hours.');
      return false;
    }
    setError('');
    return true;
  };

  // Auto-select project if only one available
  useEffect(() => {
    if (projects.length > 0 && !editingTask && formData.projectId === '') {
      setFormData(prev => ({
        ...prev,
        projectId: projects[0].projectId.toString()
      }));
    }
  }, [projects, editingTask, formData.projectId]);

  useEffect(() => {
    if (isOpen && !editingTask && formData.taskType === '') {
      setFormData((prev) => ({
        ...prev,
        taskType: 'Documentation',
      }));
    }
  }, [isOpen, editingTask, formData.taskType]);

  const fetchProjects = async () => {
    try {
      const token = sessionStorage.getItem('token');
      if (!token) {
        showSnackbar("No authorization token found", 'error');
        return;
      }

      const res = await axios.get(`${API_BASE_URL}/api/projects/user/active-projects`, {
        headers: { Authorization: token }
      });

      setProjects(res.data || []);

      if (res.data.length === 0) {
        showSnackbar("No active projects found. Please create a project first.", 'warning');
      }
    } catch (error) {
      console.error("Failed to fetch projects:", error);
      showSnackbar("Failed to fetch projects", 'error');
    }
  };

  const fileToByteArray = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const arrayBuffer = reader.result;
        const byteArray = Array.from(new Uint8Array(arrayBuffer));
        resolve(byteArray);
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  };

  const validateForm = () => {
    // Project validation - required
    if (!formData.projectId) {
      showSnackbar("Please select an initiative", 'error');
      return false;
    }

    // Time validation (optional, but if provided must be valid)
    const hours = parseInt(formData.hours, 10) || 0;
    const minutes = parseInt(formData.minutes, 10) || 0;

    if (hours === 0 && minutes === 0) {
      showSnackbar("Please enter Time", 'error');
      return false;
    }

    // Hours validation (only if hours is entered)
    if (formData.hours !== '' && (hours < 0 || hours > 24)) {
      showSnackbar("Hours must be between 0 and 24", 'error');
      return false;
    }

    // Minutes validation (only if minutes is entered)
    if (formData.minutes !== '' && (minutes < 0 || minutes >= 60)) {
      showSnackbar("Minutes must be between 0 and 59", 'error');
      return false;
    }

    // Special case: if hours is 24, minutes must be 0
    if (hours === 24 && minutes > 0) {
      showSnackbar("When hours is 24, minutes must be 0", 'error');
      return false;
    }

    if (formData.taskTopic.length > 100) {
      showSnackbar("Task Topic cannot exceed 100 characters", 'error');
      return false;
    }

    return true;
  };

  const handleInputChange = (field) => (event) => {
    const value = event.target.value;

    if (field === 'hours' || field === 'minutes') {
      const updatedFormData = { ...formData, [field]: value };
      if (!validateTime(updatedFormData.hours, updatedFormData.minutes)) {
        return; // Prevent invalid input
      }
    }

    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const currentAttachments = formData.attachments;

    // Check if adding these files would exceed the limit
    if (currentAttachments.length + files.length > 4) {
      showSnackbar("Maximum 4 attachments allowed", 'error');
      return;
    }

    const validFiles = [];
    const maxSizeInMB = 10;
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    for (const file of files) {
      // Validate file size
      if (file.size > maxSizeInBytes) {
        showSnackbar(`File ${file.name} is too large. Maximum size is ${maxSizeInMB}MB`, 'error');
        continue;
      }

      // Validate file type
      if (!allowedTypes.includes(file.type)) {
        showSnackbar(`File ${file.name} has invalid type. Only PDF, JPG, PNG, XLS, XLSX, DOC, and DOCX files are allowed`, 'error');
        continue;
      }

      // Check for duplicate names (including existing attachments)
      if (currentAttachments.some(att => att.name === file.name)) {
        showSnackbar(`File ${file.name} already exists`, 'error');
        continue;
      }

      validFiles.push(file);
    }

    if (validFiles.length > 0) {
      setFormData(prev => ({
        ...prev,
        attachments: [...prev.attachments, ...validFiles]
      }));
      showSnackbar(`${validFiles.length} file(s) uploaded successfully`, 'success');
    }

    // Reset file input
    e.target.value = '';
  };

  const handleRemoveAttachment = async (index) => {
    const attachment = formData.attachments[index];
    console.log(attachment)

    // If it's an existing attachment, we need to delete it from the server
    if (attachment.isExisting && attachment.attachmentId) {
      try {
        const token = sessionStorage.getItem('token');
        if (token) {
          await axios.delete(
            `${API_BASE_URL}/api/timesheet-tasks/attachments/${attachment.attachmentId}`,
            {
              headers: { Authorization: token }
            }
          );
          showSnackbar("Existing attachment deleted", 'success');
        }
      } catch (error) {
        console.error("Failed to delete existing attachment:", error);
        showSnackbar("Failed to delete existing attachment", 'error');
        return; // Don't remove from UI if server deletion failed
      }
    }

    // Remove from UI
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));

    if (!attachment.isExisting) {
      showSnackbar("File removed", 'info');
    }
  };

  const handleReset = () => {
    setFormData({
      taskType: '',
      hours: '',
      minutes: '',
      remainingHours: '',
      remainingMinutes: '',
      description: '',
      projectId: projects.length === 1 ? projects[0].projectId.toString() : '',
      attachments: []
    });
    // Reset file input
    const fileInput = document.getElementById('file-upload');
    if (fileInput) {
      fileInput.value = '';
    }
    showSnackbar("Form reset successfully", 'success');
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    if (!validateTime(formData.hours, formData.minutes)) {
      return; // Prevent submission if validation fails
    }

    setIsSubmitting(true);

    try {
      // Convert only NEW attachments to byte arrays with metadata
      const attachmentData = [];
      for (const file of formData.attachments) {
        if (file instanceof File) {
          const bytes = await fileToByteArray(file);
          attachmentData.push({
            fileData: bytes,
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size
          });
          console.log("Converted file to byte array:", bytes);
        } else {
          // Existing attachment, already has required metadata
          attachmentData.push({
            fileData: file.data,
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size
          });
        }
      }

      const payload = {
        taskType: formData.taskType,
        taskTopic: formData.taskTopic,
        date: formatDateKey(currentDate),
        hoursSpent: parseInt(formData.hours, 10) || 0,
        minutesSpent: parseInt(formData.minutes, 10) || 0,
        remainingHours: parseInt(formData.remainingHours, 10) || 0,
        remainingMinutes: parseInt(formData.remainingMinutes, 10) || 0,
        description: formData.description,
        projectId: parseInt(formData.projectId),
        attachments: attachmentData,
      };
      console.log("Payload to save:", payload);

      if (editingTask) {
        if (onSave) {
          onSave(payload);
          showSnackbar("Task updated successfully", 'success');
        }
      } else {
        const token = sessionStorage.getItem("token");
        if (!token) {
          showSnackbar("No authorization token found", 'error');
          return;
        }

        const response = await axios.post(
          `${API_BASE_URL}/api/timesheet-tasks/add`,
          payload,
          {
            headers: {
              Authorization: token,
              'Content-Type': 'application/json'
            },
          }
        );

        if (onSave) {
          onSave(response.data);
        }
        showSnackbar("Task added successfully", 'success');
      }

      onClose();
      handleReset();
    } catch (err) {
      console.error("Failed to save task:", err);

      if (err.response?.data?.message) {
        showSnackbar(err.response.data.message, 'error');
      } else if (err.response?.status === 401) {
        showSnackbar("Session expired. Please log in again.", 'error');
      } else if (err.response?.status === 403) {
        showSnackbar("You don't have permission to perform this action", 'error');
      } else {
        showSnackbar(editingTask ? "Failed to update task" : "Failed to add task", 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDateNavigation = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + (direction === 'prev' ? -1 : 1));
    setCurrentDate(newDate);
    if (onDateChange) {
      onDateChange(newDate);
    }
  };

  const handleCalendarIconClick = (event) => {
    setCalendarAnchorEl(event.currentTarget);
    setIsCalendarOpen(true);
  };

  const handleCalendarClose = () => {
    setCalendarAnchorEl(null);
    setIsCalendarOpen(false);
  };

  const handleDateChange = (newDate) => {
    if (newDate) {
      setCurrentDate(newDate);
      if (onDateChange) {
        onDateChange(newDate);
      }
      handleCalendarClose();
    }
  };

  const fieldHeight = '2.5rem';
  const greenPrimary = '#1b5e20';
  const greenHover = '#2e7d32';

  return (
    <>
      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={enGB}>
        <Dialog
          open={isOpen}
          onClose={() => { onClose(); handleReset(); }}
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
          <DialogContent sx={{ p: { xs: 2, sm: 3 }, overflow: 'visible' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              {/* Date Selector */}
              {!editingTask && (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2 }}>
                  <IconButton
                    onClick={() => handleDateNavigation('prev')}
                    sx={{
                      color: greenPrimary,
                      '&:hover': { bgcolor: 'rgba(27, 94, 32, 0.1)' }
                    }}
                  >
                    <ChevronLeftIcon />
                  </IconButton>

                  <Paper
                    elevation={0}
                    onClick={handleCalendarIconClick}
                    sx={{
                      px: 2.5,
                      py: 0.8,
                      bgcolor: '#f5f5f5',
                      borderRadius: 2,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      cursor: 'pointer',
                    }}
                  >
                    <Typography variant="subtitle1" fontWeight="500">
                      {currentDate.toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: '2-digit',
                        year: '2-digit',
                      })}
                    </Typography>

                    <IconButton
                      onClick={handleCalendarIconClick}
                      size="small"
                      sx={{
                        '&:hover': { bgcolor: 'rgba(27, 94, 32, 0.1)' }
                      }}
                    >
                      <CalendarTodayIcon sx={{ color: greenPrimary, fontSize: 18 }} />
                    </IconButton>
                  </Paper>

                  <IconButton
                    onClick={() => handleDateNavigation('next')}
                    sx={{
                      color: greenPrimary,
                      '&:hover': { bgcolor: 'rgba(27, 94, 32, 0.1)' }
                    }}
                  >
                    <ChevronRightIcon />
                  </IconButton>
                </Box>
              )}

              {/* Calendar Popover */}
              <Popover
                open={isCalendarOpen}
                anchorEl={calendarAnchorEl}
                onClose={handleCalendarClose}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'center',
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'center',
                }}
                PaperProps={{
                  sx: {
                    borderRadius: 2,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    overflow: 'visible',
                  }
                }}
              >
                <Box sx={{ p: 2 }}>
                  <StaticDatePicker
                    value={currentDate}
                    onChange={handleDateChange}
                    displayStaticWrapperAs="desktop"
                    slots={{
                      actionBar: () => null // ❌ Remove OK/Cancel buttons
                    }}
                  />
                </Box>
              </Popover>

              {/* Row 1: Project and Task Type */}
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
                      className={`w-full border ${!formData.projectId ? 'border-red-500' : 'border-gray-300'} rounded-md h-10 pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500`}

                      required
                    >
                      <option value="">
                        Select from list
                      </option>
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
                    {/* Start Adornment Icon */}
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
                      <option value="Design">Design</option>
                      <option value="Development">Development</option>
                      <option value="Testing">Testing</option>
                      <option value="Documentation">Documentation</option>
                    </select>
                  </div>
                </div>
                <div className="w-full">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Task Topic
                  </label>
                  <div className="relative">
                    {/* Icon at start */}
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


                <div className="w-full">
                  <div className="flex flex-col sm:flex-row sm:items-end gap-2 sm:gap-2">
                    {/* Hours Input */}
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Spend Hours</label>
                      <div className="relative">
                        {/* Start adornment icon */}
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <svg
                            className="h-5 w-5 text-green-600"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M12 8V13H16V11H14V8H12ZM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 
              10-4.48 10-10S17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12S7.59 4 12 
              4s8 3.59 8 8-3.59 8-8 8Z" />
                          </svg>
                        </div>
                        <input
                          type="number"
                          placeholder="HH"
                          className={`w-full border rounded-md pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 ${formData.hours !== '' && (parseInt(formData.hours) < 0 || parseInt(formData.hours) > 24)
                            ? 'border-red-500 focus:ring-red-500'
                            : 'border-gray-300 focus:ring-green-500'
                            }`}
                          value={formData.hours}
                          onChange={handleInputChange('hours')}
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
                        />
                        {formData.hours !== '' &&
                          (parseInt(formData.hours) < 0 || parseInt(formData.hours) > 24) && (
                            <p className="text-xs text-red-600 mt-1">0–24</p>
                          )}
                      </div>
                    </div>

                    {/* Colon Separator */}
                    <div className="text-gray-500 font-semibold text-xl">:</div>

                    {/* Minutes Input */}
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Minutes</label>
                      <input
                        type="number"
                        placeholder="MM"
                        className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 ${formData.minutes !== "" &&
                          (parseInt(formData.minutes) < 0 || parseInt(formData.minutes) > 59)
                          ? "border-red-500 focus:ring-red-500"
                          : "border-gray-300 focus:ring-green-500"
                          }`}
                        value={formData.minutes}
                        onChange={(e) => {
                          let value = e.target.value;

                          // Allow empty (user clears input)
                          if (value === "") {
                            handleInputChange("minutes")({ target: { value: "" } });
                            return;
                          }

                          const num = parseInt(value, 10);

                          // Accept only numbers between 0–59
                          if (num >= 0 && num <= 59) {
                            handleInputChange("minutes")(e);
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
                      />
                      {formData.minutes !== '' &&
                        (parseInt(formData.minutes) < 0 || parseInt(formData.minutes) >= 60) && (
                          <p className="text-xs text-red-600 mt-1">0–59</p>
                        )}
                    </div>
                  </div>

                  {/* Remaining Time */}
                  <p className="text-xs text-gray-500 mt-2">
                    Remaining Time:{' '}
                    {(() => {

                      const hours = Math.floor(existingTime / 60);
                      const minutes = existingTime % 60;
                      return `${hours}h ${minutes}m`;
                    })()}
                  </p>
                </div>

                <div className="w-full">
                  <div className="flex items-center gap-2">
                    {/* Remaining Hours Input */}
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Remaining Hours</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <svg
                            className="h-5 w-5 text-green-600"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M12 8V13H16V11H14V8H12ZM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 
              10-4.48 10-10S17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12S7.59 4 12 
              4s8 3.59 8 8-3.59 8-8 8Z" />
                          </svg>
                        </div>
                        <input
                          type="number"
                          placeholder="HH"
                          value={formData.remainingHours}
                          onChange={handleInputChange('remainingHours')}
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
                          className={`w-full border rounded-md pl-10 pr-3 py-2 text-sm focus:ring-green-500 `}
                        />

                      </div>
                    </div>

                    {/* Colon */}
                    <div className="text-gray-500 font-semibold text-xl">:</div>

                    {/* Remaining Minutes Input */}
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Minutes</label>
                      <input
                        type="number"
                        placeholder="MM"
                        value={formData.remainingMinutes}
                        onChange={(e) => {
                          let value = e.target.value;

                          // Prevent invalid input
                          if (value === "") {
                            handleInputChange("remainingMinutes")({ target: { value: "" } });
                            return;
                          }

                          const num = parseInt(value, 10);

                          if (num >= 0 && num <= 59) {
                            handleInputChange("remainingMinutes")(e);
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
                        className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 ${formData.remainingMinutes !== "" &&
                          (parseInt(formData.remainingMinutes) < 0 ||
                            parseInt(formData.remainingMinutes) > 59)
                          ? "border-red-500 focus:ring-red-500"
                          : "border-gray-300 focus:ring-green-500"
                          }`}
                      />

                      {formData.remainingMinutes !== '' &&
                        (parseInt(formData.remainingMinutes) < 0 || parseInt(formData.remainingMinutes) >= 60) && (
                          <p className="text-xs text-red-600 mt-1">0–59</p>
                        )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Compact Attachment Upload */}
              <div className="w-full md:w-[60%]">
                <p className="text-sm font-semibold text-gray-800 mb-2">
                  Attachments ({formData.attachments.length}/4)
                </p>

                {/* Upload Box */}
                <label
                  htmlFor="file-upload"
                  className={`
      border border-dashed rounded p-3 flex items-center justify-center min-h-[50px] bg-gray-50 w-full cursor-pointer transition
      ${formData.attachments.length >= 4 ? 'cursor-not-allowed opacity-50' : 'hover:border-green-700 hover:bg-green-50'}
    `}
                >
                  <input
                    type="file"
                    id="file-upload"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png,.xls,.xlsx,.doc,.docx"
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
                      {formData.attachments.length >= 4
                        ? 'Max files reached'
                        : 'Upload files'}
                    </span>
                  </div>
                </label>

                {/* Uploaded Files */}
                <p className="text-xs text-gray-500 mt-1">
                  Max file size: 10 MB per file
                </p>
                {formData.attachments.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {formData.attachments.map((file, index) => (
                      <div
                        key={index}
                        className={`flex items-center px-2 py-1 rounded-full text-sm border ${file.isExisting
                          ? 'bg-green-50 text-green-600 border-green-300'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-300'
                          }`}
                      >
                        <span className="mr-1 flex items-center gap-1">
                          {file.isExisting ? '📎 ' : ''}
                          {truncateText(file.name, 15)}
                          <span className="text-gray-500 text-xs">
                            ({formatFileSize(file.size)})
                          </span>
                          {file.isExisting ? ' (existing)' : ''}
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



              {/* Row 3: Large Description */}
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
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
                  ></textarea>
                </div>
                <div className="flex justify-end text-sm text-gray-500 pr-1 mt-1">
                  {formData.description.length} / 500
                </div>
              </div>

              {/* Row 4: Action Buttons */}
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-2 mt-2">
                <button
                  onClick={handleReset}
                  disabled={isSubmitting}
                  className={`rounded px-5 h-[42px] font-semibold text-sm text-white transition-colors ${isSubmitting
                    ? 'text-white cursor-not-allowed'
                    : 'text-white hover:text-black bg-gray-500 hover:bg-gray-100'
                    }`}
                >
                  Reset
                </button>

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <button
                    onClick={() => {
                      onClose();
                      handleReset();
                    }}
                    disabled={isSubmitting}
                    className={`border rounded px-5 h-[42px] text-sm transition-colors ${isSubmitting
                      ? 'border-gray-300 text-gray-400 cursor-not-allowed'
                      : `border-[${greenPrimary}] text-[${greenPrimary}] hover:border-[${greenHover}] hover:text-[${greenHover}]`
                      }`}
                  >
                    Cancel
                  </button>

                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className={`rounded px-5 h-[42px] font-semibold text-sm text-white transition-colors ${isSubmitting
                      ? `bg-green-500 cursor-not-allowed`
                      : `bg-green-500 hover:bg-green-600`
                      }`}
                  >
                    {isSubmitting ? "Saving..." : editingTask ? "Update Task" : "Add Entry"}
                  </button>
                </div>
              </div>

            </Box>
          </DialogContent>
        </Dialog>
      </LocalizationProvider>

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

export default LogTimeModal;