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
    IconButton,
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

const AddProjectModal = ({ open, onClose, onSubmit, formData, setFormData }) => {
    const [users, setUsers] = useState([]);
    const [initialFormData, setInitialFormData] = useState({});

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

    useEffect(() => {
        fetchUsers();
        // Store initial form data for reset functionality
        setInitialFormData({ ...formData });
    }, [open]);

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
        // console.log('Form Data:', formData);
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
                    Add New Project
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
                                value={formData.projectName}
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
                                value={formData.startDate}
                                onChange={(newDate) =>
                                    setFormData((prev) => ({ ...prev, startDate: newDate }))
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
                                value={formData.endDate}
                                onChange={(newDate) =>
                                    setFormData((prev) => ({ ...prev, endDate: newDate }))
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

                    {/* Row 3: Project Manager and Team Members */}
                    <Box sx={{ display: 'flex', gap: 3 }}>
                        <Box sx={{ flex: 1 }}>
                            <Autocomplete
                                options={users}
                                getOptionLabel={(option) => option ? `${option.firstName} ${option.lastName}` : ''}
                                isOptionEqualToValue={(option, value) => option.userId === value.userId}
                                onChange={(e, value) => setFormData((prev) => ({
                                    ...prev,
                                    manager: value ? value.userId : null,
                                }))}
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
                                            sx: { height: fieldHeight }
                                        }}
                                    />
                                )}
                            />
                        </Box>

                        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                            <Autocomplete
                                multiple
                                options={users}
                                value={users.filter((user) => formData.teamMembers.includes(user.userId))}
                                getOptionLabel={(option) => option ? `${option.firstName} ${option.lastName}` : ''}
                                isOptionEqualToValue={(option, value) => option.userId === value.userId}
                                onChange={(e, selectedUsers) => setFormData((prev) => ({
                                    ...prev,
                                    teamMembers: selectedUsers.map((user) => user.userId),
                                }))}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Select Team Members"
                                        placeholder="Search for team members..."
                                        fullWidth
                                        InputProps={{
                                            ...params.InputProps,
                                            startAdornment: (
                                                <>
                                                    <InputAdornment position="start">
                                                        <PeopleAltIcon sx={{ color: greenPrimary }} />
                                                    </InputAdornment>
                                                    {params.InputProps.startAdornment}
                                                </>
                                            ),
                                            sx: { height: fieldHeight }
                                        }}
                                    />
                                )}
                                renderOption={(props, option) => (
                                    <li {...props}>
                                        <Box sx={{ display: "flex", alignItems: "center" }}>
                                            <Avatar
                                                sx={{
                                                    width: 24,
                                                    height: 24,
                                                    mr: 1,
                                                    fontSize: "12px",
                                                    bgcolor: greenPrimary,
                                                }}
                                            >
                                                {option.firstName?.charAt(0)}
                                            </Avatar>
                                            {option.firstName} {option.lastName}
                                        </Box>
                                    </li>
                                )}
                                renderTags={() => null} // Don't render tags inside the input
                            />

                            {/* Display selected team members below the input field */}
                            {formData.teamMembers.length > 0 && (
                                <Paper
                                    variant="outlined"
                                    sx={{
                                        mt: 1,
                                        p: 1,
                                        maxHeight: '150px',
                                        overflow: 'auto',
                                        borderColor: greenPrimary,
                                        borderRadius: 1,
                                    }}
                                >
                                    <Typography variant="caption" sx={{ color: 'text.secondary', mb: 1, display: 'block' }}>
                                        Selected Team Members ({formData.teamMembers.length})
                                    </Typography>

                                    <Grid container spacing={1}>
                                        {users
                                            .filter((user) => formData.teamMembers.includes(user.userId))
                                            .map((user) => (
                                                <Grid item xs={6} sm={4} md={3} key={user.userId}>
                                                    <Box
                                                        sx={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            bgcolor: greenHover,
                                                            color: 'white',
                                                            borderRadius: 1,
                                                            p: 0.5,
                                                            pl: 1,
                                                        }}
                                                    >
                                                        <Avatar
                                                            sx={{
                                                                width: 24,
                                                                height: 24,
                                                                mr: 1,
                                                                fontSize: '12px',
                                                                bgcolor: greenPrimary,
                                                            }}
                                                        >
                                                            {user.firstName?.charAt(0)}
                                                        </Avatar>
                                                        <Typography
                                                            noWrap
                                                            sx={{
                                                                flex: 1,
                                                                fontSize: '0.875rem',
                                                            }}
                                                        >
                                                            {user.firstName} {user.lastName}
                                                        </Typography>
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => {
                                                                setFormData((prev) => ({
                                                                    ...prev,
                                                                    teamMembers: prev.teamMembers.filter(id => id !== user.userId),
                                                                }));
                                                            }}
                                                            sx={{
                                                                color: 'white',
                                                                p: 0.5,
                                                                '&:hover': {
                                                                    bgcolor: 'rgba(255, 255, 255, 0.2)'
                                                                }
                                                            }}
                                                        >
                                                            {/* <CloseIcon fontSize="small" /> */}
                                                        </IconButton>
                                                    </Box>
                                                </Grid>
                                            ))}
                                    </Grid>
                                </Paper>
                            )}
                        </Box>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 3 }}>
                        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                            <TextField
                                fullWidth
                                label="Add Systems Impacted"
                                placeholder="Type a system and press Enter"
                                value={formData.newSystem || ''}
                                onChange={(e) => setFormData((prev) => ({
                                    ...prev,
                                    newSystem: e.target.value,
                                }))}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && formData.newSystem?.trim()) {
                                        e.preventDefault();
                                        setFormData((prev) => ({
                                            ...prev,
                                            systemImpacted: [...(prev.systemImpacted || []), prev.newSystem.trim()],
                                            newSystem: '', // Clear the input
                                        }));
                                    }
                                }}
                                InputProps={{
                                    sx: { height: fieldHeight },
                                }}
                            />

                            {/* Note for the user */}
                            <Typography variant="caption" sx={{ mt: 1, color: 'text.secondary' }}>
                                Enter System Name and press Enter to add the system.
                            </Typography>

                            {/* Display added systems below the input field */}
                            {formData.systemImpacted?.length > 0 && (
                                <Paper
                                    variant="outlined"
                                    sx={{
                                        mt: 1,
                                        p: 1,
                                        maxHeight: '150px',
                                        overflow: 'auto',
                                        borderColor: greenPrimary,
                                        borderRadius: 1,
                                    }}
                                >
                                    <Typography variant="caption" sx={{ color: 'text.secondary', mb: 1, display: 'block' }}>
                                        Added Systems Impacted ({formData.systemImpacted.length})
                                    </Typography>

                                    <Grid container spacing={1}>
                                        {formData.systemImpacted.map((system, index) => (
                                            <Grid item xs={6} sm={4} md={3} key={index}>
                                                <Box
                                                    sx={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        bgcolor: greenHover,
                                                        color: 'white',
                                                        borderRadius: 1,
                                                        p: 0.5,
                                                        pl: 1,
                                                    }}
                                                >
                                                    <Typography
                                                        noWrap
                                                        sx={{
                                                            flex: 1,
                                                            fontSize: '0.875rem',
                                                        }}
                                                    >
                                                        {system}
                                                    </Typography>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => {
                                                            setFormData((prev) => ({
                                                                ...prev,
                                                                systemImpacted: prev.systemImpacted.filter((s) => s !== system),
                                                            }));
                                                        }}
                                                        sx={{
                                                            color: 'white',
                                                            p: 0.5,
                                                            '&:hover': {
                                                                bgcolor: 'rgba(255, 255, 255, 0.2)',
                                                            },
                                                        }}
                                                    >
                                                        <span style={{ fontSize: '12px', fontWeight: 'bold' }}>×</span>
                                                    </IconButton>
                                                </Box>
                                            </Grid>
                                        ))}
                                    </Grid>
                                </Paper>
                            )}
                        </Box>
                    </Box>

                    {/* Row 5: Sponsor Name */}
                    <Box sx={{ display: 'flex', gap: 3 }}>
                        <Box sx={{ flex: 1 }}>
                            <Autocomplete
                                options={users}
                                getOptionLabel={(option) => option ? `${option.firstName} ${option.lastName}` : ''}
                                isOptionEqualToValue={(option, value) => option.userId === value.userId}
                                onChange={(e, value) => setFormData((prev) => ({
                                    ...prev,
                                    sponsor: value ? value.userId : null,
                                }))}
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
                                            sx: { height: fieldHeight }
                                        }}
                                    />
                                )}
                            />
                        </Box>
                    </Box>

                    {/* Row 6: Currency and Cost */}
                    <Box sx={{ display: 'flex', gap: 3 }}>
                        <Box sx={{ width: '30%' }}>
                            <FormControl fullWidth>
                                <InputLabel>Currency</InputLabel>
                                <Select
                                    value={formData.currency}
                                    onChange={handleChange('currency')}
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
                                value={formData.cost}
                                onChange={handleChange('cost')}
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

                    {/* Row 7: Action Buttons (Right-aligned) */}
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
                            Create Project
                        </Button>
                    </Box>
                </Box>
            </DialogContent>
        </Dialog>
    );
};

export default AddProjectModal;