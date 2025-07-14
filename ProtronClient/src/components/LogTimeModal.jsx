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
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import FolderIcon from '@mui/icons-material/Folder';
import TaskIcon from '@mui/icons-material/Task';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import DescriptionIcon from '@mui/icons-material/Description';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CalendarTodayIcon from '@mui/icons-material/CalendarMonth';
import DeleteIcon from '@mui/icons-material/Delete';
import axios from 'axios';
import GlobalSnackbar from './GlobalSnackbar';
import {StaticDatePicker} from '@mui/x-date-pickers/StaticDatePicker';
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

const LogTimeModal = ({ isOpen, onClose, selectedDate, onDateChange, onSave, editingTask }) => {
  const [formData, setFormData] = useState({
    taskType: '',
    hours: '',
    minutes: '',
    description: '',
    projectId: '',
    attachments: [] // Changed to array for multiple attachments
  });

  const [projects, setProjects] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentDate, setCurrentDate] = useState(selectedDate || new Date());

  // Calendar popover state
  const [calendarAnchorEl, setCalendarAnchorEl] = useState(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

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

  // Update currentDate when selectedDate changes
  useEffect(() => {
    if (selectedDate) {
      setCurrentDate(new Date(selectedDate));
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
        // Pre-fill fields from editingTask
        const totalMinutes = Math.round((editingTask.hours || editingTask.hoursSpent || 0) * 60);
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;

        setFormData({
          taskType: editingTask.taskType || editingTask.task || '',
          hours: hours ? String(hours) : '',
          minutes: minutes ? String(minutes) : '',
          description: editingTask.description || '',
          projectId: editingTask.projectId?.toString() || editingTask.project?.projectId?.toString() || '',
          attachments: [] // Don't prefill file input for security reasons
        });
        loadExistingAttachments(editingTask);
      } else {
        // Reset form for new task
        setFormData({
          taskType: '',
          hours: '',
          minutes: '',
          description: '',
          projectId: '',
          attachments: []
        });
      }
    }
  }, [isOpen, editingTask]);

  // Auto-select project if only one available
  useEffect(() => {
    if (projects.length === 1 && !editingTask && formData.projectId === '') {
      setFormData(prev => ({
        ...prev,
        projectId: projects[0].projectId.toString()
      }));
    }
  }, [projects, editingTask, formData.projectId]);

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
      showSnackbar("Please select a project", 'error');
      return false;
    }

    // Time validation (optional, but if provided must be valid)
    const hours = parseInt(formData.hours, 10) || 0;
    const minutes = parseInt(formData.minutes, 10) || 0;

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

    return true;
  };

  const handleInputChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
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
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    for (const file of files) {
      // Validate file size
      if (file.size > maxSizeInBytes) {
        showSnackbar(`File ${file.name} is too large. Maximum size is ${maxSizeInMB}MB`, 'error');
        continue;
      }

      // Validate file type
      if (!allowedTypes.includes(file.type)) {
        showSnackbar(`File ${file.name} has invalid type. Only PDF, JPG, PNG, XLS, and XLSX files are allowed`, 'error');
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

      // Calculate hoursSpent as decimal
      const hours = parseInt(formData.hours, 10) || 0;
      const minutes = parseInt(formData.minutes, 10) || 0;
      const hoursSpent = hours + minutes / 60;

      const payload = {
        taskType: formData.taskType,
        date: currentDate,
        hoursSpent: parseFloat(hoursSpent.toFixed(2)),
        description: formData.description,
        projectId: parseInt(formData.projectId),
        attachments: attachmentData, // Changed to array
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

  const fieldHeight = '56px';
  const greenPrimary = '#1b5e20';
  const greenHover = '#2e7d32';

  return (
    <>
      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={enGB}>
        <Dialog
          open={isOpen}
          onClose={() => { onClose(); handleReset(); }}
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
                    sx={{
                      px: 2.5,
                      py: 0.8,
                      bgcolor: '#f5f5f5',
                      borderRadius: 2,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
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
    />
  </Box>
</Popover>



              {/* Row 1: Project and Task Type */}
              <Box sx={{ display: 'flex', gap: 3 }}>
                <Box sx={{ flex: 1 }}>
                  <FormControl fullWidth required error={!formData.projectId}>
                    <InputLabel>Project *</InputLabel>
                    <Select
                      value={formData.projectId}
                      onChange={handleInputChange('projectId')}
                      label="Project *"
                      sx={{ height: fieldHeight }}
                      startAdornment={
                        <InputAdornment position="start">
                          <FolderIcon sx={{ color: greenPrimary }} />
                        </InputAdornment>
                      }
                      renderValue={(selected) => {
                        if (!selected) return <em>Select from list</em>;
                        const selectedProject = projects.find((p) => p.projectId.toString() === selected.toString());
                        return selectedProject ? (
                          <Tooltip title={selectedProject.projectName} placement="top">
                            <span>{truncateText(selectedProject.projectName, 25)}</span>
                          </Tooltip>
                        ) : <em>Select from list</em>;
                      }}
                    >
                      <MenuItem value="">
                        <em>Select from list</em>
                      </MenuItem>
                      {projects.map((project) => (
                        <MenuItem key={project.projectId} value={project.projectId.toString()}>
                          <Tooltip title={project.projectName} placement="right">
                            <span>{truncateText(project.projectName, 35)}</span>
                          </Tooltip>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>

                <Box sx={{ flex: 1 }}>
                  <FormControl fullWidth>
                    <InputLabel>Task Type</InputLabel>
                    <Select
                      value={formData.taskType}
                      onChange={handleInputChange('taskType')}
                      label="Task Type"
                      sx={{ height: fieldHeight }}
                      startAdornment={
                        <InputAdornment position="start">
                          <TaskIcon sx={{ color: greenPrimary }} />
                        </InputAdornment>
                      }
                    >
                      <MenuItem value="">
                        <em>Select from list</em>
                      </MenuItem>
                      <MenuItem value="Design">Design</MenuItem>
                      <MenuItem value="Development">Development</MenuItem>
                      <MenuItem value="Testing">Testing</MenuItem>
                      <MenuItem value="Documentation">Documentation</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              </Box>

              {/* Row 2: Time Entry */}
              <Box sx={{ display: 'flex', gap: 3 }}>
                <Box sx={{ flex: 0.4 }}>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <TextField
                      type="number"
                      label="Hours"
                      value={formData.hours}
                      onChange={handleInputChange('hours')}
                      placeholder="HH"
                      inputProps={{ min: 0, max: 24 }}
                      sx={{ flex: 1 }}
                      error={formData.hours !== '' && (parseInt(formData.hours, 10) < 0 || parseInt(formData.hours, 10) > 24)}
                      helperText={formData.hours !== '' && (parseInt(formData.hours, 10) < 0 || parseInt(formData.hours, 10) > 24) ? "0-24" : ""}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <AccessTimeIcon sx={{ color: greenPrimary }} />
                          </InputAdornment>
                        ),
                        sx: { height: fieldHeight }
                      }}
                    />
                    <Typography variant="h6" sx={{ color: 'text.secondary', mx: 0.5 }}>
                      :
                    </Typography>
                    <TextField
                      type="number"
                      label="Minutes"
                      value={formData.minutes}
                      onChange={handleInputChange('minutes')}
                      placeholder="MM"
                      inputProps={{ min: 0, max: 59 }}
                      sx={{ flex: 1 }}
                      error={formData.minutes !== '' && (parseInt(formData.minutes, 10) < 0 || parseInt(formData.minutes, 10) >= 60)}
                      helperText={formData.minutes !== '' && (parseInt(formData.minutes, 10) < 0 || parseInt(formData.minutes, 10) >= 60) ? "0-59" : ""}
                      InputProps={{
                        sx: { height: fieldHeight }
                      }}
                    />
                  </Box>
                </Box>

                {/* Compact Attachment Upload */}
                <Box sx={{ flex: 0.6 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.primary', fontWeight: 600 }}>
                    Attachments ({formData.attachments.length}/4)
                  </Typography>
                  <Box sx={{
                    border: '1px dashed #ccc',
                    borderRadius: 1,
                    p: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: '#fafafa',
                    minHeight: '50px',
                    cursor: 'pointer',
                    '&:hover': {
                      borderColor: greenPrimary,
                      bgcolor: 'rgba(27, 94, 32, 0.02)'
                    }
                  }}>
                    <input
                      type="file"
                      onChange={handleFileChange}
                      accept=".pdf,.jpg,.jpeg,.png,.xls,.xlsx"
                      multiple
                      style={{ display: 'none' }}
                      id="file-upload"
                      disabled={formData.attachments.length >= 4}
                    />
                    <label htmlFor="file-upload" style={{ cursor: 'pointer', textAlign: 'center', width: '100%' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                        <CloudUploadIcon sx={{ color: greenPrimary, fontSize: 20 }} />
                        <Typography variant="body2" sx={{ color: 'text.primary' }}>
                          {formData.attachments.length >= 4 ? 'Max files reached' : 'Upload files'}
                        </Typography>
                      </Box>
                    </label>
                  </Box>

                  {/* Display uploaded files */}
                  {formData.attachments.length > 0 && (
                    <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {formData.attachments.map((file, index) => (
                        <Chip
                          key={index}
                          label={
                            <span>
                              {file.isExisting && "📎 "}{truncateText(file.name, 15)}
                              {file.isExisting && " (existing)"}
                            </span>
                          }
                          size="small"
                          onDelete={() => handleRemoveAttachment(index)}
                          deleteIcon={<DeleteIcon />}
                          sx={{
                            bgcolor: file.isExisting ? 'rgba(76, 175, 80, 0.1)' : 'rgba(27, 94, 32, 0.1)',
                            color: file.isExisting ? '#4caf50' : greenPrimary,
                            '& .MuiChip-deleteIcon': {
                              color: file.isExisting ? '#4caf50' : greenPrimary,
                              '&:hover': {
                                color: greenHover
                              }
                            }
                          }}
                        />
                      ))}
                    </Box>
                  )}
                </Box>
              </Box>

              {/* Row 3: Large Description */}
              <Box>
                <TextField
                  fullWidth
                  label="Description"
                  placeholder="Enter detailed description here..."
                  value={formData.description}
                  onChange={handleInputChange('description')}
                  multiline
                  rows={4}
                  inputProps={{ maxLength: 500 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1 }}>
                        <DescriptionIcon sx={{ color: greenPrimary }} />
                      </InputAdornment>
                    ),
                  }}
                  helperText={
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                      {`${formData.description.length} / 500`}
                    </Box>
                  }
                  FormHelperTextProps={{ sx: { margin: 0, paddingRight: 1 } }}
                />
              </Box>

              {/* Row 4: Action Buttons */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                <Button
                  onClick={handleReset}
                  variant="text"
                  disabled={isSubmitting}
                  sx={{
                    color: 'text.secondary',
                    '&:hover': {
                      color: 'text.primary',
                      bgcolor: 'rgba(0, 0, 0, 0.04)'
                    }
                  }}
                >
                  Reset
                </Button>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    onClick={() => { onClose(); handleReset(); }}
                    variant="outlined"
                    disabled={isSubmitting}
                    sx={{
                      borderColor: greenPrimary,
                      color: greenPrimary,
                      height: '42px',
                      '&:hover': {
                        borderColor: greenHover,
                        color: greenHover
                      }
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    variant="contained"
                    disabled={isSubmitting}
                    sx={{
                      bgcolor: greenPrimary,
                      color: 'white',
                      height: '42px',
                      fontWeight: 600,
                      '&:disabled': {
                        bgcolor: 'rgba(0, 0, 0, 0.26)'
                      },
                      '&:hover': {
                        bgcolor: greenHover
                      }
                    }}
                  >
                    {isSubmitting ? "Saving..." : (editingTask ? "Update Task" : "Add Entry")}
                  </Button>
                </Box>
              </Box>
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