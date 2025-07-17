import { useState,useEffect } from 'react';
import { 
    Dialog, 
    DialogContent, 
    Box, 
    Typography, 
    TextField, 
    InputAdornment, 
    Button, 
    Avatar,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
} from '@mui/material';
import { 
    Assignment as AssignmentIcon,
    Badge as BadgeIcon,
    CalendarToday as CalendarTodayIcon,
    MonetizationOn as MonetizationOnIcon,
    Refresh as RefreshIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';;

const EditTeamMemberModal = ({ isOpen, onClose, member, onUpdate, project }) => {
    const [formData, setFormData] = useState({
        pricing: '',
        unit: '',
        estimatedReleaseDate: '',
        taskType: 'developer', // Default value
        systemImpacted: member?.systemImpacted?.systemId || "" // Default value from member object
    });
    
    // Store initial data for reset functionality
    const [initialFormData, setInitialFormData] = useState({
        pricing: '',
        unit: '',
        estimatedReleaseDate: '',
        taskType: 'developer',
        systemImpacted: member?.systemImpacted?.systemId || ""
    });

    // Theme colors
    const greenPrimary = '#1b5e20'; // green-900
    const greenHover = '#2e7d32'; // green-600
    const fieldHeight = '56px';

    useEffect(() => {
        if (member) {
            // Log the member object to see what's coming from the database
            console.log("Member data received:", member);
            
            const newFormData = {
                pricing: member.pricing || '',
                unit: member.unit || 'INR',
                estimatedReleaseDate: member.estimatedReleaseDate || '',
                // Use the member's taskType if it exists, otherwise default to 'developer'
                taskType: member.taskType || 'developer',
                systemImpacted: member?.systemImpacted?.systemId || "" // Default value from member object
            };
            
            setFormData(newFormData);
            setInitialFormData(newFormData); // Store initial data for reset
        }
    }, [member]); // Re-run when member changes

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Log the form data to verify taskType is included
        console.log("Submitting form data:", formData);
        onUpdate(formData, member.projectTeamId);
    };
    
    const handleReset = () => {
        // Reset form to initial values
        setFormData({...initialFormData});
    };

    if (!isOpen) return null;

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
            Edit Team Member
        </Typography>
    </Box>

    <DialogContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Box sx={{ mr: 2 }}>
                    {member?.user?.profilePhoto ? (
                        <Avatar
                            src={member.user.profilePhoto}
                            alt="Profile"
                            sx={{ width: 40, height: 40 }}
                        />
                    ) : (
                        <Avatar
                            sx={{ 
                                width: 40, 
                                height: 40, 
                                bgcolor: greenPrimary 
                            }}
                        >
                            {member?.user?.firstName?.charAt(0) || ''}
                        </Avatar>
                    )}
                </Box>
                <Box>
                    <Typography variant="body1" fontWeight="500">
                        {`${member?.user?.firstName || ''} ${member?.user?.lastName || ''}`}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {member?.user?.email || ''}
                    </Typography>
                </Box>
            </Box>


            <TextField
                fullWidth
                label="Employee Code"
                value={member?.empCode || ''}
                disabled
                variant="outlined"
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <BadgeIcon sx={{ color: greenPrimary }} />
                        </InputAdornment>
                    ),
                    sx: { height: fieldHeight, bgcolor: '#f5f5f5' }
                }}
            />

<FormControl fullWidth>
                        <InputLabel>System</InputLabel>
                        <Select
                            name="systemImpacted"
                            value={formData.systemImpacted || ''}
                            onChange={handleChange}
                            label="System"
                            sx={{ height: '56px' }}
                        >
                            <MenuItem value="" disabled>
                                Select a system
                            </MenuItem>
                            {project.systemsImpacted.map((system, index) => (
                                <MenuItem key={index} value={system.systemId}>
                                    {system.systemName}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

            <FormControl fullWidth>
                <InputLabel>Task Type</InputLabel>
                <Select
                    name="taskType"
                    value={formData.taskType}
                    onChange={handleChange}
                    label="Task Type"
                    sx={{ height: fieldHeight }}
                    required
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <AssignmentIcon sx={{ color: greenPrimary }} />
                            </InputAdornment>
                        )
                    }}
                >
                    <MenuItem value="developer">Developer</MenuItem>
                    <MenuItem value="designer">Designer</MenuItem>
                    <MenuItem value="test">Test</MenuItem>
                </Select>
            </FormControl>

            <Box sx={{ display: 'flex', gap: 3 }}>
                <Box sx={{ width: '50%' }}>
                    <TextField
                        fullWidth
                        label="Cost"
                        name="pricing"
                        type="number"
                        value={formData.pricing}
                        onChange={handleChange}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                 
                                </InputAdornment>
                            ),
                            sx: { height: fieldHeight }
                        }}
                    />
                </Box>
                <Box sx={{ width: '50%' }}>
                    <FormControl fullWidth>
                        <InputLabel>Unit</InputLabel>
                        <Select
                            name="unit"
                            value={formData.unit}
                            onChange={handleChange}
                            label="Unit"
                            sx={{ height: fieldHeight }}
                        >
                            <MenuItem value="USD">USD</MenuItem>
                            <MenuItem value="INR">INR</MenuItem>
                            <MenuItem value="EUR">EUR</MenuItem>
                            <MenuItem value="GBP">GBP</MenuItem>
                            <MenuItem value="JPY">JPY</MenuItem>
                        </Select>
                    </FormControl>
                </Box>
            </Box>

            <DatePicker
                label="Estimated Release Date"
                value={formData.estimatedReleaseDate ? dayjs(formData.estimatedReleaseDate) : null}
                onChange={(newDate) =>
                    setFormData((prev) => ({ 
                        ...prev, 
                        estimatedReleaseDate: newDate ? newDate.format('YYYY-MM-DD') : '' 
                    }))
                }
                slotProps={{
                    textField: {
                        fullWidth: true,
                        required: true,
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
                    startIcon={<RefreshIcon />}
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
                    Update
                </Button>
            </Box>
        </Box>
    </DialogContent>
</Dialog>
    );
};

export default EditTeamMemberModal;