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
    InputAdornment,
    IconButton
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
    const [newSystems, setNewSystems] = useState([]); // Track newly added systems
    const [removedSystems, setRemovedSystems] = useState([]);

    const fetchUsers = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/tenants/${sessionStorage.getItem("tenantId")}/users`, {
                headers: { Authorization: `${sessionStorage.getItem('token')}` }
            });
            setUsers(res.data);
        } catch (error) {
            console.log({ message: error });
        }
    };

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

    const handleSystemNameChange = (index) => (e) => {
        const updatedSystems = [...formData.systemImpacted];
        const newName = e.target.value;

        // Check if the system is a newly added system
        console.log(index, updatedSystems[index]);
        const isNewSystem = !updatedSystems[index].systemId; // Newly added systems won't have an ID

        if (isNewSystem) {
            // Update the name in the newSystems array
            const oldName = updatedSystems[index].systemName;
            const newSystemIndex = newSystems.findIndex((name) => name === oldName);
            if (newSystemIndex !== -1) {
                const updatedNewSystems = [...newSystems];
                updatedNewSystems[newSystemIndex] = newName; // Update the name in newSystems
                setNewSystems(updatedNewSystems);
            }
        }

        // Update the system name in formData
        updatedSystems[index].systemName = newName;
        setFormData((prev) => ({
            ...prev,
            systemImpacted: updatedSystems
        }));
    };

    const handleSystemAdd = (e) => {
        if (e.key === 'Enter' && e.target.value.trim()) {
            const newSystem = e.target.value.trim();
            // setNewSystems((prev) => [...prev, newSystem]);
            setFormData((prev) => ({
                ...prev,
                systemImpacted: [...(prev.systemImpacted || []), { systemId: null, systemName: newSystem }]
            }));
            e.target.value = ''; // Clear input
        }
    };

    const handleSystemRemove = (index) => {
        const updatedSystems = [...formData.systemImpacted];
        const removedSystem = updatedSystems.splice(index, 1)[0]; // Remove the system
    
        // If the system is not new, track it in removedSystems
        if (removedSystem.systemId) {
            setRemovedSystems((prev) => [...prev, removedSystem.systemId]);
        }
    
        setFormData((prev) => ({
            ...prev,
            systemImpacted: updatedSystems
        }));
    };

    const handleSubmit = () => {
        const updatedSystemImpacted = [
            ...formData.systemImpacted, // Existing systems (with updated names)
            ...newSystems.map((name) => ({ systemName: name })) // Add new systems
        ];

        const payload = {
            ...formData,
            systemImpacted: updatedSystemImpacted,
            removedSystems, // Single field for all systems
        };

        console.log('Payload:', payload);
        onSubmit(payload);
    };

    const handleReset = () => {
        setFormData({ ...initialFormData });
        setNewSystems([]);
        setRemovedSystems([]);
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
                                value={users.find(user => user.userId === formData.sponsor?.userId) || null}
                                getOptionLabel={(option) =>
                                    option ? `${option.firstName} ${option.lastName}` : ''
                                }
                                isOptionEqualToValue={(option, value) =>
                                    option?.userId === value?.userId
                                }
                                onChange={(e, value) => {
                                    setFormData((prev) => ({
                                        ...prev,
                                        sponsorId: value ? value.userId : null,
                                        sponsor: value || null,
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

                    {/* Existing Systems Impacted */}
                    <Box>
                        <Typography variant="subtitle1" sx={{ mb: 1 }}>
                            Systems Impacted
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            {formData.systemImpacted?.map((system, index) => (
                                <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <TextField
                                        fullWidth
                                        value={system.systemName}
                                        onChange={handleSystemNameChange(index)}
                                        placeholder="Edit system name"
                                        variant="outlined"
                                        sx={{
                                            bgcolor: '#f5f5f5',
                                            borderRadius: 1
                                        }}
                                    />
                                    <IconButton
                                        size="small"
                                        onClick={() => handleSystemRemove(index)}
                                        sx={{
                                            color: 'red',
                                            '&:hover': {
                                                bgcolor: 'rgba(255, 0, 0, 0.1)'
                                            }
                                        }}
                                    >
                                        <span style={{ fontSize: '16px', fontWeight: 'bold' }}>×</span>
                                    </IconButton>
                                </Box>
                            ))}
                        </Box>
                        <TextField
                            fullWidth
                            placeholder="Add a new system and press Enter"
                            onKeyDown={handleSystemAdd}
                            sx={{ mt: 2 }}
                        />
                        <Typography variant="caption" sx={{ mt: 1, color: 'text.secondary' }}>
                            Enter System Name and press Enter to add the system.
                        </Typography>
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