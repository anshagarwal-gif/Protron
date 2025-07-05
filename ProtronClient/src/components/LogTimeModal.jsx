// LogTimeModal.jsx
import React, { useEffect, useState } from 'react';
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
  Tooltip
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import FolderIcon from '@mui/icons-material/Folder';
import TaskIcon from '@mui/icons-material/Task';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import DescriptionIcon from '@mui/icons-material/Description';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import axios from 'axios';
import GlobalSnackbar from './GlobalSnackbar'; // Adjust path as needed

const API_BASE_URL = import.meta.env.VITE_API_URL;

// Truncate function for project names
const truncateText = (text, maxLength = 20) => {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
};

const LogTimeModal = ({ isOpen, onClose, selectedDate, onSave, editingTask }) => {
  const [formData, setFormData] = useState({
    taskType: '',
    hours: '',
    minutes: '',
    description: '',
    projectId: '',
    attachment: null
  });

  const [projects, setProjects] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  useEffect(() => {
    if (isOpen) {
      fetchProjects();
      console.log(editingTask)
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
          attachment: editingTask.attachment // Don't prefill file input for security reasons
        });
      } else {
        // Reset form for new task
        setFormData({
          taskType: '',
          hours: '',
          minutes: '',
          description: '',
          projectId: '',
          attachment: null
        });
      }
    }
    // eslint-disable-next-line
  }, [isOpen, editingTask]);

  const getDisplayDate = () => {
    let dateObj = null;
    if (editingTask?.date) {
      dateObj = new Date(editingTask.date);
    } else if (selectedDate) {
      dateObj = new Date(selectedDate);
    }
    return dateObj
      ? dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })
      : '';
  };

  const fetchProjects = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/projects/user/active-projects`, {
        headers: { Authorization: `${sessionStorage.getItem('token')}` }
      });
      setProjects(res.data);
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
    const file = e.target.files[0];
    if (file) {
      // Validate file size (optional - limit to 10MB)
      const maxSizeInMB = 10;
      const maxSizeInBytes = maxSizeInMB * 1024 * 1024;

      if (file.size > maxSizeInBytes) {
        showSnackbar(`File size must be less than ${maxSizeInMB}MB`, 'error');
        return;
      }

      // Validate file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
      if (!allowedTypes.includes(file.type)) {
        showSnackbar("Only PDF, JPG, PNG, XLS, and XLSX files are allowed", 'error');
        return;
      }

      setFormData(prev => ({
        ...prev,
        attachment: file
      }));
      showSnackbar("File uploaded successfully", 'success');
    }
  };

  const handleReset = () => {
    setFormData({
      taskType: '',
      hours: '',
      minutes: '',
      description: '',
      projectId: '',
      attachment: null
    });
    showSnackbar("Form reset successfully", 'success');
  };

  const handleSubmit = async () => {
    // Validate form before submission
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      let attachmentBytes = null;
      if (formData.attachment instanceof File) {
        attachmentBytes = await fileToByteArray(formData.attachment);
      }

      // Calculate hoursSpent as decimal
      const hours = parseInt(formData.hours, 10) || 0;
      const minutes = parseInt(formData.minutes, 10) || 0;
      const hoursSpent = hours + minutes / 60;

      const payload = {
        taskType: formData.taskType,
        date: new Date(selectedDate),
        hoursSpent: parseFloat(hoursSpent.toFixed(2)),
        description: formData.description,
        projectId: parseInt(formData.projectId),
        attachment: attachmentBytes,
      };

      if (editingTask) {
        if (onSave) {
          onSave(payload);
          showSnackbar("Task updated successfully", 'success');
        }
      } else {
        const response = await axios.post(
          `${API_BASE_URL}/api/timesheet-tasks/add`,
          payload,
          {
            headers: {
              Authorization: sessionStorage.getItem("token"),
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

      // Handle specific error messages
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

  // Date navigation (assumes selectedDate is a Date object)
  const handleDateNavigation = (direction) => {
    if (!(selectedDate instanceof Date)) return;
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + (direction === 'prev' ? -1 : 1));
    // You may want to notify parent to update selectedDate
    // For now, just log
    console.log('Navigate to:', newDate);
  };

  const fieldHeight = '56px';
  const greenPrimary = '#1b5e20';
  const greenHover = '#2e7d32';

  return (
    <>
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
        <Box
          sx={{
            bgcolor: '#f8f9fa',
            borderBottom: '1px solid #e0e0e0',
            py: 2,
            px: 3
          }}
        >
          <Typography variant="h5" fontWeight="600" sx={{ color: greenPrimary }}>
            Log Time{getDisplayDate() ? ` - ${getDisplayDate()}` : ''}
          </Typography>
        </Box>

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
                    {selectedDate
                      ? new Date(selectedDate).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: '2-digit',
                        year: '2-digit',
                      })
                      : ''}
                  </Typography>
                  <CalendarTodayIcon sx={{ color: greenPrimary, fontSize: 18 }} />
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

            {/* Row 2: Time Entry and Description */}
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
                    sx={{ flex: 1, height: fieldHeight }}
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
                    sx={{ flex: 1, height: fieldHeight }}
                    error={formData.minutes !== '' && (parseInt(formData.minutes, 10) < 0 || parseInt(formData.minutes, 10) >= 60)}
                    helperText={formData.minutes !== '' && (parseInt(formData.minutes, 10) < 0 || parseInt(formData.minutes, 10) >= 60) ? "0-59" : ""}
                    InputProps={{
                      sx: { height: fieldHeight }
                    }}
                  />
                </Box>
              </Box>
              <Box sx={{ flex: 0.6 }}>
                <TextField
                  fullWidth
                  label="Description"
                  placeholder="Enter description here..."
                  value={formData.description}
                  onChange={handleInputChange('description')}
                  multiline={false}
                  sx={{ height: fieldHeight }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <DescriptionIcon sx={{ color: greenPrimary }} />
                      </InputAdornment>
                    ),
                    sx: { height: fieldHeight }
                  }}
                />
              </Box>
            </Box>

            {/* Row 3: Attachment - Compact Version */}
            <Box>
              <Typography variant="subtitle1" sx={{ mb: 1, color: 'text.primary', fontWeight: 600 }}>
                Attachment
              </Typography>
              <Box sx={{
                border: '2px dashed #aaa',
                borderRadius: 1,
                p: 2,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: '#fafafa',
                minHeight: '80px',
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
                  style={{ display: 'none' }}
                  id="file-upload"
                />
                <label htmlFor="file-upload" style={{ cursor: 'pointer', textAlign: 'center', width: '100%' }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                    {formData.attachment ? (
                      <>
                        <AttachFileIcon sx={{ color: greenPrimary, fontSize: 24 }} />
                        <Typography variant="body2" sx={{ color: 'text.primary' }}>
                          {formData.attachment.name}
                        </Typography>
                        <Button
                          size="small"
                          variant="outlined"
                          sx={{
                            borderColor: greenPrimary,
                            color: greenPrimary,
                            fontSize: '0.75rem',
                            py: 0.5,
                            '&:hover': {
                              borderColor: greenHover,
                              color: greenHover
                            }
                          }}
                          component="label"
                          htmlFor="file-upload"
                        >
                          Change File
                        </Button>
                      </>
                    ) : (
                      <>
                        <CloudUploadIcon sx={{ color: greenPrimary, fontSize: 24 }} />
                        <Typography variant="body2" sx={{ color: 'text.primary' }}>
                          Upload here
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          *PDF, JPG, PNG, XLS (Max 10MB)
                        </Typography>
                      </>
                    )}
                  </Box>
                </label>
              </Box>
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
                    '&:hover': {
                      bgcolor: greenHover
                    }
                  }}
                >
                  {isSubmitting ? "Saving..." : (editingTask ? "Edit Task" : "Add Entry")}
                </Button>
              </Box>
            </Box>
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

export default LogTimeModal;