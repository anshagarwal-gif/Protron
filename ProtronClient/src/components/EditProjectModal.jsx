import React, { useEffect, useState } from 'react';
import {
    Dialog,
    DialogContent,
    TextField,
    Button,
    Avatar,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    Autocomplete,
    Typography,
    Box,
    Grid,
    Paper,
    InputAdornment
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import PersonIcon from '@mui/icons-material/Person';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import ProjectIcon from '@mui/icons-material/Folder';
import dayjs from 'dayjs';
import axios from 'axios';

// Currency data
const currencies = ['USD', 'INR', 'EUR', 'GBP', 'JPY'];

// Currency symbols mapping
const currencySymbols = {
    USD: '$',
    INR: '₹',
    EUR: '€',
    GBP: '£',
    JPY: '¥'
};

const EditProjectModal = ({ open, onClose, onSubmit, formData, setFormData, projectId }) => {
    const [users, setUsers] = useState([]);
    const [initialFormData, setInitialFormData] = useState({});
    console.log(formData)
    const fetchUsers = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/users`, {
                headers: { Authorization: `${sessionStorage.getItem('token')}` }
            });
            console.log(res.data)
            setUsers(res.data);
        } catch (error) {
            console.log({ message: error });
        }
    };

    // Fetch project data when modal opens or projectId changes
    const fetchProjectData = async () => {
        if (!projectId) return;

        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/projects/${projectId}`, {
                headers: { Authorization: `${sessionStorage.getItem('token')}` }
            });
            setFormData(res.data);
            setInitialFormData(res.data); // Store initial data for reset
        } catch (error) {
            console.log({ message: error });
        }
    };

    useEffect(() => {
        fetchUsers();
        if (open && projectId) {
            fetchProjectData();
        }
    }, [open, projectId]);

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData((prev) => ({ ...prev, projectIcon: URL.createObjectURL(file) }));
        }
    };

    const handleChange = (field) => (event) => {
        setFormData((prev) => ({
            ...prev,
            [field]: event.target.value
        }));
    };

    const handleSubmit = () => {
        console.log(formData)
        onSubmit(formData);
    };

    const handleReset = () => {
        setFormData({ ...initialFormData });
    };

    // Common height for input fields
    const fieldHeight = '56px';

    // Custom theme colors
    const greenPrimary = '#1b5e20'; // green-900
    const greenHover = '#2e7d32'; // green-600

    return (
        <Dialog
            open={open}
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
                    Edit Project
                </Typography>
            </Box>

            <DialogContent sx={{ p: 3 }}>
                {/* Main container with flex-col */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

                    {/* Row 1: Project Name and Project Icon */}
                    <Box sx={{ display: 'flex', gap: 3 }}>
                        <Box sx={{ flex: 1 }}>
                            <TextField
                                fullWidth
                                label="Project Name"
                                placeholder="Enter a descriptive project name"
                                value={formData.projectName || ''}
                                onChange={handleChange('projectName')}
                                variant="outlined"
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <ProjectIcon sx={{ color: greenPrimary }} />
                                        </InputAdornment>
                                    ),
                                    sx: { height: fieldHeight }
                                }}
                            />
                        </Box>

                        <Box sx={{ flex: 1 }}>
                            <Box sx={{
                                border: '1px dashed #aaa',
                                borderRadius: 1,
                                height: fieldHeight,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                bgcolor: '#fafafa'
                            }}>
                                {formData.projectIcon ? (
                                    <Box sx={{ display: 'flex', alignItems: 'center', p: "0px" }}>
                                        <Avatar
                                            src={formData.projectIcon}
                                            alt="Project Icon"
                                            sx={{ width: 40, height: 40, mr: 1 }}
                                        />
                                        <Button
                                            component="label"
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
                                            Change
                                            <input hidden accept="image/*" type="file" onChange={handleImageUpload} />
                                        </Button>
                                    </Box>
                                ) : (
                                    <Button
                                        component="label"
                                        startIcon={<CloudUploadIcon sx={{ color: greenPrimary }} />}
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
                                        Project Icon
                                        <input hidden accept="image/*" type="file" onChange={handleImageUpload} />
                                    </Button>
                                )}
                            </Box>
                        </Box>
                    </Box>

                    {/* Row 2: Start Date and End Date */}
                    <Box sx={{ display: 'flex', gap: 3, width: '100%' }}>
                        <Box sx={{ flex: 1 }}>
                            <DatePicker
                                label="Project Start Date"
                                value={formData.startDate ? dayjs(formData.startDate) : null}
                                onChange={(newDate) =>
                                    setFormData((prev) => ({ ...prev, startDate: newDate ? newDate.toISOString() : null }))
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

                        <Box sx={{ flex: 1 }}>
                            <DatePicker
                                label="Project End Date"
                                value={formData.endDate ? dayjs(formData.endDate) : null}
                                onChange={(newDate) =>
                                    setFormData((prev) => ({ ...prev, endDate: newDate ? newDate.toISOString() : null }))
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

                    {/* Row 3: Project Manager */}
                    <Box sx={{ display: 'flex', gap: 3 }}>
                        <Box sx={{ flex: 1 }}>
                            <Autocomplete
                                options={users}
                                value={users.find(user => user.userId === formData.projectManager?.userId) || null}
                                getOptionLabel={(option) => option ? `${option.firstName} ${option.lastName}` : ''}
                                isOptionEqualToValue={(option, value) => option?.userId === value?.userId}
                                onChange={(e, value) => {
                                    console.log("Selected manager:", value);
                                    setFormData((prev) => ({
                                        ...prev,
                                        projectManagerId: value ? value.userId : null,
                                        projectManager: value || null,
                                    }));
                                }}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Select Project Manager"
                                        placeholder="Search for a manager..."
                                        fullWidth
                                        InputProps={{
                                            ...params.InputProps,
                                            startAdornment: (
                                                <>
                                                    <InputAdornment position="start">
                                                        <PersonIcon sx={{ color: greenPrimary }} />
                                                    </InputAdornment>
                                                    {params.InputProps.startAdornment}
                                                </>
                                            ),
                                            sx: { height: fieldHeight },
                                        }}
                                    />
                                )}
                            />
                        </Box>
                    </Box>

                    {/* Sponsor Name */}
                    <Box sx={{ display: 'flex', gap: 3 }}>
                        <Box sx={{ flex: 1 }}>
                            <Autocomplete
                                options={users}
                                value={
                                    formData.sponsor?.userId
                                        ? users.find(user => user.userId === formData.sponsor.userId)
                                        : null
                                }
                                getOptionLabel={(option) =>
                                    option ? `${option.firstName} ${option.lastName}` : ''
                                }
                                isOptionEqualToValue={(option, value) =>
                                    option?.userId === value?.userId
                                }
                                onChange={(e, value) => {
                                    setFormData((prev) => ({
                                        ...prev,
                                        sponsor: value.userId || null, // Store the selected user object or null
                                    }));
                                }}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Select Sponsor"
                                        placeholder="Search for a sponsor..."
                                        fullWidth
                                        InputProps={{
                                            ...params.InputProps,
                                            startAdornment: (
                                                <>
                                                    <InputAdornment position="start">
                                                        <PersonIcon sx={{ color: greenPrimary }} />
                                                    </InputAdornment>
                                                    {params.InputProps.startAdornment}
                                                </>
                                            ),
                                            sx: { height: fieldHeight },
                                        }}
                                    />
                                )}
                            />
                        </Box>
                    </Box>

                    {/* Row 4: Currency and Cost */}
                    <Box sx={{ display: 'flex', gap: 3 }}>
                        <Box sx={{ width: '30%' }}>
                            <FormControl fullWidth>
                                <InputLabel>Currency</InputLabel>
                                <Select
                                    value={formData.unit || 'USD'}
                                    onChange={handleChange('unit')}
                                    label="Currency"
                                    sx={{ height: fieldHeight }}
                                >
                                    {currencies.map((currency) => (
                                        <MenuItem key={currency} value={currency}>
                                            <Typography variant="body1">{currency}</Typography>
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Box>

                        <Box sx={{ width: '70%' }}>
                            <TextField
                                fullWidth
                                label="Project Cost"
                                placeholder="Enter amount"
                                type="number"
                                value={formData.projectCost || ''}
                                onChange={handleChange('projectCost')}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            {formData.currency ? currencySymbols[formData.currency] : ''}
                                        </InputAdornment>
                                    ),
                                    sx: { height: fieldHeight }
                                }}
                            />
                        </Box>
                    </Box>

                    {/* Row 5: Action Buttons (Right-aligned) */}
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
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
                            onClick={handleReset}
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
                            Reset
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
                            Update Project
                        </Button>
                    </Box>
                </Box>
            </DialogContent>
        </Dialog>
    );
};

export default EditProjectModal;