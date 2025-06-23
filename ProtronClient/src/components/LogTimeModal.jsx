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
  Paper
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
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
const API_BASE_URL = import.meta.env.VITE_API_URL;
const LogTimeModal = ({ isOpen, onClose, selectedDate, onSave }) => {
  const [formData, setFormData] = useState({
    taskType: '',       // string
    date: '',           // ISO string or Date object
    hoursSpent: '',     // number
    description: '',    // string
    projectId: '',      // number (Long)
    attachment: null    // base64 or byte[] if uploading files
  }
  );

  const [projects, setProjects] = useState([])
  const fetchProjects = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/tenants/${sessionStorage.getItem("tenantId")}/projects`, {
        headers: { Authorization: `${sessionStorage.getItem('token')}` }
      });
      setProjects(res.data); // No `.projectName` – set full array
    } catch (error) {
      console.error("Failed to fetch projects:", error);
    }
  };

  useEffect(() => {
    fetchProjects()
  })
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

  const handleInputChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handleDateChange = (newDate) => {
    setFormData(prev => ({
      ...prev,
      date: newDate
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setFormData(prev => ({
      ...prev,
      attachment: file
    }));
  };

  const handleReset = () => {
    setFormData({
      taskType: '',       // string
      date: '',           // ISO string or Date object
      hoursSpent: '',     // number
      description: '',    // string
      projectId: '',      // number (Long)
      attachment: null    // base64 or byte[] if uploading files
    });
  };

  const handleSubmit = async () => {
  try {
    let attachmentBytes = null;

    if (formData.attachment instanceof File) {
      attachmentBytes = await fileToByteArray(formData.attachment);
    }

    const payload = {
      taskType: formData.taskType,
      date: formData.date, // should be ISO or Date object
      hoursSpent: parseFloat(formData.hoursSpent),
      description: formData.description,
      projectId: parseInt(formData.projectId),
      attachment: attachmentBytes,
    };

    const response = await axios.post(
      `${API_BASE_URL}/api/timesheet-tasks/add`,
      payload,
      {
        headers: {
          Authorization: sessionStorage.getItem("token"),
        },
      }
    );

    console.log("Task saved:", response.data);
    onClose();
    handleReset();
  } catch (err) {
    console.error("Failed to save task:", err);
  }
};

  const handleDateNavigation = (direction) => {
    const newDate = direction === 'prev'
      ? formData.date.subtract(1, 'day')
      : formData.date.add(1, 'day');
    setFormData(prev => ({ ...prev, date: newDate }));
  };

  // Common height for input fields
  const fieldHeight = '56px';

  // Custom theme colors (matching EditProjectModal)
  const greenPrimary = '#1b5e20'; // green-900
  const greenHover = '#2e7d32'; // green-600

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
        }
      }}
    >
      <Box
        sx={{
          bgcolor: '#f8f9fa',
          borderBottom: '1px solid #e0e0e0',
          py: 2.5,
          px: 3
        }}
      >
        <Typography variant="h5" fontWeight="600" sx={{ color: greenPrimary }}>
          Log Time
        </Typography>
      </Box>

      <DialogContent sx={{ p: 3 }}>
        {/* Main container with flex-col */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

          {/* Date Selector */}
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
                px: 3,
                py: 1,
                bgcolor: '#f5f5f5',
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}
            >
              <Typography variant="subtitle1" fontWeight="500">
                {new Date(formData.date).toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: 'short',
                  year: '2-digit',
                })}
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

          {/* Row 1: Project */}
          <Box sx={{ display: 'flex', gap: 3 }}>
            <Box sx={{ flex: 1 }}>
              <FormControl fullWidth>
                <InputLabel>Project</InputLabel>
                <Select
                  value={formData.projectId} // note: changed from formData.project to formData.projectId
                  onChange={handleInputChange('projectId')}
                  label="Project"
                  sx={{ height: fieldHeight }}
                  startAdornment={
                    <InputAdornment position="start">
                      <FolderIcon sx={{ color: greenPrimary }} />
                    </InputAdornment>
                  }
                >
                  <MenuItem value="">
                    <em>Select from list</em>
                  </MenuItem>
                  {projects.map((project) => (
                    <MenuItem key={project.projectId} value={project.projectId}>
                      {project.projectName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Box>
          {/* Row 2: Task Type and Time */}
          <Box sx={{ display: 'flex', gap: 3 }}>
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

            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <TextField
                  type="number"
                  label="Hours"
                  value={formData.hours}
                  onChange={handleInputChange('hours')}
                  placeholder="HH"
                  inputProps={{ min: 0, max: 23 }}
                  sx={{ flex: 1 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <AccessTimeIcon sx={{ color: greenPrimary }} />
                      </InputAdornment>
                    ),
                    sx: { height: fieldHeight }
                  }}
                />
                <Typography variant="h6" sx={{ color: 'text.secondary', mx: 1 }}>
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
                  InputProps={{
                    sx: { height: fieldHeight }
                  }}
                />
              </Box>
            </Box>
          </Box>

          {/* Row 3: Description */}
          <Box sx={{ display: 'flex', gap: 3 }}>
            <Box sx={{ flex: 1 }}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description"
                placeholder="Enter description here..."
                value={formData.description}
                onChange={handleInputChange('description')}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 2 }}>
                      <DescriptionIcon sx={{ color: greenPrimary }} />
                    </InputAdornment>
                  )
                }}
              />
            </Box>
          </Box>

          {/* Row 4: Attachment */}
          <Box>
            <Typography variant="subtitle1" sx={{ mb: 1, color: 'text.primary' }}>
              Attachment
            </Typography>
            <Box sx={{
              border: '2px dashed #aaa',
              borderRadius: 1,
              p: 4,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: '#fafafa',
              minHeight: '120px',
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
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                  {formData.attachment ? (
                    <>
                      <AttachFileIcon sx={{ color: greenPrimary, fontSize: 32 }} />
                      <Typography variant="body2" sx={{ color: 'text.primary' }}>
                        {formData.attachment.name}
                      </Typography>
                      <Button
                        size="small"
                        variant="outlined"
                        sx={{
                          borderColor: greenPrimary,
                          color: greenPrimary,
                          '&:hover': {
                            borderColor: greenHover,
                            color: greenHover
                          }
                        }}
                      >
                        Change File
                      </Button>
                    </>
                  ) : (
                    <>
                      <CloudUploadIcon sx={{ color: greenPrimary, fontSize: 32 }} />
                      <Typography variant="body1" sx={{ color: 'text.primary' }}>
                        Upload here
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        *PDF, JPG, PNG, XLS
                      </Typography>
                    </>
                  )}
                </Box>
              </label>
            </Box>
          </Box>

          {/* Row 5: Action Buttons (Right-aligned) */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
            <Button
              onClick={handleReset}
              variant="text"
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
                onClick={onClose}
                variant="outlined"
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
                Add Entry
              </Button>
            </Box>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default LogTimeModal;