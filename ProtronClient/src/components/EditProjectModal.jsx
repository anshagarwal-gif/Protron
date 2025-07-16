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

        const { project, systemsImpacted, teamMembers } = res.data;

        // Match based on `name` from users
        const manager = users.find(user => user.userId === project.managerId);
        const sponsor = users.find(user => user.userId === project.sponsorId);
        console.log(manager, sponsor, project.projectId, project.sponsorId, users);
        const projectData = {
            projectId: project.projectId,
            projectName: project.projectName || '',
            startDate: project.startDate || null,
            endDate: project.endDate || null,
            unit: project.unit || 'USD',
            projectCost: project.projectCost || 0,
            projectIcon: project.projectIcon || null,

            projectManager: manager || null,
            sponsor: sponsor || null,

            systemImpacted: systemsImpacted.map(system => ({
                systemId: system.systemId || null,
                systemName: system.systemName || ''
            }))
        };

        setFormData(projectData);
        setInitialFormData(projectData);
    } catch (error) {
        console.error('Error fetching project data:', error);
    }
};



    useEffect(() => {
        fetchUsers();
    }, [open, projectId]);

    useEffect(() => {
        if(open && projectId && users.length > 0) {
            fetchProjectData();
        }
    }, [open, projectId, users]);

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

    const handleSubmit = async () => {
        const updatedSystemImpacted = formData.systemImpacted.map((system) => ({
            systemId: system.systemId || null,
            systemName: system.systemName,
        }));

        const payload = {
            projectName: formData.projectName,
            projectIcon: formData.projectIcon || null, // Handle file upload separately
            startDate: formData.startDate,
            endDate: formData.endDate,
            projectCost: formData.projectCost || 0, // Default to 0 if missing
            projectManagerId: formData.projectManager?.userId || null,
            sponsorId: formData.sponsor?.userId || null,
            unit: formData.unit || 'USD', // Default to USD if missing
            systemImpacted: updatedSystemImpacted,
            removedSystems: removedSystems, // Track removed systems manually
        };

        try {
            const response = await axios.put(
                `${import.meta.env.VITE_API_URL}/api/projects/edit/${projectId}`,
                payload,
                {
                    headers: {
                        Authorization: `${sessionStorage.getItem('token')}`,
                        'Content-Type': 'application/json',
                    },
                }
            );
            console.log('Project updated successfully:', response.data);
            onSubmit();
        } catch (error) {
            console.error('Error updating project:', error);
        }
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
            maxWidth="lg"
            PaperProps={{
                sx: {
                    borderRadius: 2,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                    maxHeight: '90vh',
                    width: '95%',
                    maxWidth: '1200px'
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
                    Edit Project
                </Typography>
            </Box>

            <DialogContent sx={{ p: 3, overflow: 'visible' }}>
                {/* Main container with flex-col */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>

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

                    {/* Row 3: Project Manager and Sponsor in same row */}
                    <Box sx={{ display: 'flex', gap: 3 }}>
                        <Box sx={{ flex: 1 }}>
                            <Autocomplete
                                options={users}
                                value={users.find(user => user.userId === formData.projectManager?.userId) || null}
                                getOptionLabel={(option) => option?.name || ''}

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

                        <Box sx={{ flex: 1 }}>
                            <Autocomplete
                                options={users}
                                value={users.find(user => user.userId === formData.sponsor?.userId) || null}
                                getOptionLabel={(option) => option?.name || ''}
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
                        <Box sx={{ width: '20%' }}>
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

                        <Box sx={{ width: '30%' }}>
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

                        <Box sx={{ width: '50%' }}>
                            <TextField
                                fullWidth
                                label="Add System"
                                placeholder="Add a new system and press Enter"
                                onKeyDown={handleSystemAdd}
                                InputProps={{
                                    sx: { height: fieldHeight }
                                }}
                            />
                        </Box>
                    </Box>

                    {/* Systems Impacted - Chips Display */}
                    <Box>
                        <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
                            Systems Impacted
                        </Typography>
                        <Box sx={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: 1,
                            maxHeight: '120px',
                            overflowY: 'auto',
                            mb: 1,
                            p: 1,


                            minHeight: '40px'
                        }}>
                            {formData.systemImpacted?.map((system, index) => (
                                <Box key={index} sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 0.5,
                                    bgcolor: '#e3fded',
                                    borderRadius: '16px',
                                    px: 1.5,
                                    py: 0.5,
                                    border: '1px solid #bbfbc5'
                                }}>
                                    <TextField
                                        value={system.systemName}
                                        onChange={handleSystemNameChange(index)}
                                        placeholder="Edit system name"
                                        variant="standard"
                                        size="small"
                                        InputProps={{
                                            disableUnderline: true,
                                            sx: {
                                                fontSize: '14px',
                                                minWidth: '80px',
                                                width: `${Math.max(80, system.systemName.length * 8)}px`,
                                                '& input': {
                                                    padding: 0,
                                                    textAlign: 'center',
                                                    bgcolor: 'transparent'
                                                }
                                            }
                                        }}
                                    />
                                    <IconButton
                                        size="small"
                                        onClick={() => handleSystemRemove(index)}
                                        sx={{
                                            color: '#666',
                                            width: '20px',
                                            height: '20px',
                                            '&:hover': {
                                                bgcolor: 'rgba(255, 0, 0, 0.1)',
                                                color: 'red'
                                            }
                                        }}
                                    >
                                        <span style={{ fontSize: '14px', fontWeight: 'bold' }}>×</span>
                                    </IconButton>
                                </Box>
                            ))}
                            {formData.systemImpacted?.length === 0 && (
                                <Typography variant="caption" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                                    No systems added yet
                                </Typography>
                            )}
                        </Box>
                    </Box>

                    {/* Row 5: Action Buttons (Right-aligned) */}
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 1 }}>
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