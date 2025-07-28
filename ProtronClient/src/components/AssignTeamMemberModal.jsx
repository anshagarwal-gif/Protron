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
  Autocomplete,
  Typography,
  Box,
  InputAdornment,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import BadgeIcon from '@mui/icons-material/Badge';
import AssignmentIcon from '@mui/icons-material/Assignment';
import ComputerIcon from '@mui/icons-material/Computer';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import dayjs from 'dayjs';
import axios from 'axios';

const AssignTeamMemberModal = ({ isOpen, onClose, projectName, project, onAddMember }) => {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    employeeCode: '',
    taskType: '',
    unit: '',
    cost: 0,
    releaseDate: '',
    tasktype: '',
    systemImpacted: ''
  });

  const fetchUsersNotInProject = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/tenants/${sessionStorage.getItem("tenantId")}/users-not-in/${project?.project?.projectId}`, {
        headers: { Authorization: `${sessionStorage.getItem('token')}` }
      })
      setUsers(res.data)
    } catch (error) {
      console.log(error)
    }
  }

  useEffect(() => {
    fetchUsersNotInProject();
  }, [project]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    console.log(name, value)
    if (name === 'email') {
      const user = users.find((user) => user.email === value);
      console.log(user)
      if (user) {
        setFormData({
          ...formData,
          email: value,
          name: user.name,
          employeeCode: user.empCode
        })
        setError(null);
      } else {
        setFormData({
          ...formData,
          email: value,
          name: '',
          employeeCode: ''
        });
        setError('User not found');
      }
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleReset = () => {
    setFormData({
      name: '',
      email: '',
      employeeCode: '',
      taskType: '',
      unit: '',
      cost: 0,
      releaseDate: '',
      tasktype: '',
      systemImpacted: 0
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    onAddMember(formData);
    handleReset();
    onClose();
  };

  if (!isOpen) return null;

  // Common height for input fields
  const fieldHeight = '48px';

  // Custom theme colors
  const greenPrimary = '#1b5e20'; // green-900
  const greenHover = '#2e7d32'; // green-600

  // Currency symbols mapping
  const currencySymbols = {
    USD: '$',
    INR: '₹',
    EUR: '€',
    GBP: '£',
    JPY: '¥'
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      fullWidth
      maxWidth="lg"
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          width: '90vw',
          maxWidth: '1200px',
          maxHeight: '90vh'
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
          Assign Team Member | {projectName}
        </Typography>
      </Box>

      <DialogContent sx={{ p: 3, overflow: 'hidden' }}>
        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>

          {/* First Row: Email, Name, Employee Code */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Box sx={{ flex: 1 }}>
              <Autocomplete
                options={users.filter(
                  (user) =>
                    !project.projectTeam?.some(
                      (member) =>
                        member.status === "active" &&
                        member.user?.email?.toLowerCase() === user.email?.toLowerCase()
                    )
                )}
                getOptionLabel={(option) => option.email}
                isOptionEqualToValue={(option, value) => option.email === value.email}
                onChange={(e, value) => {
                  if (value) {
                    setFormData({
                      ...formData,
                      email: value.email,
                      name: value.name,
                      employeeCode: value.empCode
                    });
                    setError(null);
                  } else {
                    setFormData({
                      ...formData,
                      email: '',
                      name: '',
                      employeeCode: ''
                    });
                    setError('User not found');
                  }
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Email"
                    placeholder="Search for an email..."
                    fullWidth
                    error={!!error}
                    helperText={error}
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <>
                          <InputAdornment position="start">
                            <EmailIcon sx={{ color: greenPrimary }} />
                          </InputAdornment>
                          {params.InputProps.startAdornment}
                        </>
                      ),
                      sx: { height: fieldHeight }
                    }}
                  />
                )}
              />
            </Box>

            <Box sx={{ flex: 1 }}>
              <TextField
                fullWidth
                label="Name"
                name="name"
                value={formData.name}
                disabled
                placeholder="Name will be auto-filled"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon sx={{ color: greenPrimary }} />
                    </InputAdornment>
                  ),
                  sx: { height: fieldHeight }
                }}
                sx={{
                  bgcolor: '#f5f5f5',
                  borderRadius: 1
                }}
              />
            </Box>

            <Box sx={{ flex: 1 }}>
              <TextField
                fullWidth
                label="Employee Code"
                name="employeeCode"
                value={formData.employeeCode}
                disabled
                placeholder="Employee Code will be auto-filled"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <BadgeIcon sx={{ color: greenPrimary }} />
                    </InputAdornment>
                  ),
                  sx: { height: fieldHeight }
                }}
                sx={{
                  bgcolor: '#f5f5f5',
                  borderRadius: 1
                }}
              />
            </Box>
          </Box>

          {/* Second Row: Task Type and System Impacted */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Box sx={{ flex: 1 }}>
              <FormControl fullWidth>
                <InputLabel>Task Type</InputLabel>
                <Select
                  name="tasktype"
                  value={formData.tasktype}
                  onChange={handleChange}
                  label="Task Type"
                  sx={{ height: fieldHeight }}
                  startAdornment={
                    <InputAdornment position="start">
                      <AssignmentIcon sx={{ color: greenPrimary }} />
                    </InputAdornment>
                  }
                >
                  <MenuItem value="" disabled>Select Task Type</MenuItem>
                  <MenuItem value="Develop">Develop</MenuItem>
                  <MenuItem value="Design">Design</MenuItem>
                  <MenuItem value="Test">Test</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Box sx={{ flex: 1 }}>
              <FormControl fullWidth>
                <InputLabel>System Impacted</InputLabel>
                <Select
                  name="systemImpacted"
                  value={formData.systemImpacted || ''}
                  onChange={(e) => setFormData({ ...formData, systemImpacted: parseInt(e.target.value, 10) })}
                  label="System Impacted"
                  sx={{ height: fieldHeight }}
                  startAdornment={
                    <InputAdornment position="start">
                      <ComputerIcon sx={{ color: greenPrimary }} />
                    </InputAdornment>
                  }
                >
                  <MenuItem value="" disabled>Select a system</MenuItem>
                  {project.systemsImpacted?.map((system, index) => (
                    <MenuItem key={index} value={system.systemId}>
                      {system.systemName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Box>

          {/* Third Row: Pricing and Release Date */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            {/* Pricing Section */}
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, color: greenPrimary, fontWeight: 600 }}>
                Pricing
              </Typography>
              <Box sx={{ display: 'flex', gap: 1.5 }}>
                <Box sx={{ width: '40%' }}>
                  <FormControl fullWidth>
                    <InputLabel>Currency</InputLabel>
                    <Select
                      name="unit"
                      value={formData.unit}
                      onChange={handleChange}
                      label="Currency"
                      sx={{ height: fieldHeight }}
                    >
                      <MenuItem value="" disabled>Select Unit</MenuItem>
                      <MenuItem value="USD">USD</MenuItem>
                      <MenuItem value="INR">INR</MenuItem>
                      <MenuItem value="EUR">EUR</MenuItem>
                      <MenuItem value="GBP">GBP</MenuItem>
                      <MenuItem value="JPY">JPY</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
                <Box sx={{ width: '60%' }}>
                  <TextField
                    fullWidth
                    label="Cost"
                    name="cost"
                    type="number"
                    value={formData.cost}
                    onChange={handleChange}
                    placeholder="Enter amount"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          {formData.unit ? currencySymbols[formData.unit] : ''}
                        </InputAdornment>
                      ),
                      sx: { height: fieldHeight }
                    }}
                  />
                </Box>
              </Box>
            </Box>

            {/* Release Details Section */}
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, color: greenPrimary, fontWeight: 600 }}>
                Release Details
              </Typography>
              <DatePicker
                label="Estimated Release Date"
                value={formData.releaseDate ? dayjs(formData.releaseDate) : null}
                onChange={(newDate) =>
                  setFormData({ ...formData, releaseDate: newDate ? newDate.format('YYYY-MM-DD') : '' })
                }
                slotProps={{
                  textField: {
                    fullWidth: true,
                    InputProps: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <CalendarTodayIcon sx={{ color: greenPrimary }} />
                        </InputAdornment>
                      ),
                      sx: { height: fieldHeight }
                    }
                  }
                }}
              />
            </Box>
          </Box>

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2, pt: 2, borderTop: '1px solid #e0e0e0' }}>
            <Button
              type="button"
              onClick={() => {
                handleReset();
                onClose();
              }}
              variant="outlined"
              sx={{
                borderColor: greenPrimary,
                color: greenPrimary,
                height: '40px',
                minWidth: '80px',
                '&:hover': {
                  borderColor: greenHover,
                  color: greenHover
                }
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleReset}
              variant="outlined"
              sx={{
                borderColor: greenPrimary,
                color: greenPrimary,
                height: '40px',
                minWidth: '80px',
                '&:hover': {
                  borderColor: greenHover,
                  color: greenHover
                }
              }}
            >
              Reset
            </Button>
            <Button
              type="submit"
              variant="contained"
              sx={{
                bgcolor: greenPrimary,
                color: 'white',
                height: '40px',
                minWidth: '80px',
                fontWeight: 600,
                '&:hover': {
                  bgcolor: greenHover
                }
              }}
            >
              Add
            </Button>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default AssignTeamMemberModal;