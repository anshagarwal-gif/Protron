import React, { useEffect, useState } from 'react';
import Select from 'react-select';
import {
    X,
    FileText,
    Plus
} from 'lucide-react';
import GlobalSnackbar from './GlobalSnackbar';

const EditSolutionStoryModal = ({ open, onClose, storyId, storyData }) => {
    if (!open) return null;
    
    const [formData, setFormData] = useState({
        projectId: '',
        parentId: '',
        status: 'todo',
        priority: 2,
        summary: '',
        description: '',
        system: '',
        storyPoints: 0,
        assignee: '',
        releaseId: '',
        sprintId: ''
    });

    const [users, setUsers] = useState([]);
    const [releases, setReleases] = useState([]);
    const [sprints, setSprints] = useState([]);
    const [loading, setLoading] = useState(false);
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success'
    });
    const [error, setError] = useState({});
    const [fieldErrors, setFieldErrors] = useState({});

    useEffect(() => {
        if (storyData) {
            setFormData({
                projectId: storyData.projectId || '',
                parentId: storyData.parentId || '',
                status: storyData.status || 'todo',
                priority: storyData.priority || 2,
                summary: storyData.summary || '',
                description: storyData.description || '',
                system: storyData.system || '',
                storyPoints: storyData.storyPoints || 0,
                assignee: storyData.assignee || '',
                releaseId: storyData.release?.toString() || '',
                sprintId: storyData.sprint?.toString() || ''
            });
        }
        fetchUsers();
        fetchReleases();
        fetchSprints();
    }, [storyData]);

    const fetchUsers = async () => {
        try {
            const token = sessionStorage.getItem('token');
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/active`, {
                headers: { Authorization: token }
            });
            if (response.ok) {
                const data = await response.json();
                setUsers(data);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    const fetchReleases = async () => {
        try {
            const token = sessionStorage.getItem('token');
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/release/active`, {
                headers: { Authorization: token }
            });
            if (response.ok) {
                const data = await response.json();
                setReleases(data);
            }
        } catch (error) {
            console.error('Error fetching releases:', error);
        }
    };

    const fetchSprints = async () => {
        try {
            const token = sessionStorage.getItem('token');
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/sprint/active`, {
                headers: { Authorization: token }
            });
            if (response.ok) {
                const data = await response.json();
                setSprints(data);
            }
        } catch (error) {
            console.error('Error fetching sprints:', error);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'priority' || name === 'storyPoints' ? parseInt(value) || 0 : value
        }));
        
        if (fieldErrors[name]) {
            setFieldErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const handleSelectChange = (name, selectedOption) => {
        const value = selectedOption ? selectedOption.value : '';
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        
        if (fieldErrors[name]) {
            setFieldErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const validateForm = () => {
        const errors = {};
        
        if (!formData.summary.trim()) {
            errors.summary = 'Summary is required';
        }
        
        if (formData.priority < 1 || formData.priority > 3) {
            errors.priority = 'Priority must be between 1 and 3';
        }
        
        if (formData.storyPoints < 0) {
            errors.storyPoints = 'Story points cannot be negative';
        }
        
        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            setSnackbar({
                open: true,
                message: 'Please fix the errors before submitting',
                severity: 'error'
            });
            return;
        }

        setLoading(true);
        setError({});

        try {
            const token = sessionStorage.getItem('token');
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/solutionstory/${storyId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token
                },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                setSnackbar({
                    open: true,
                    message: 'Solution Story updated successfully!',
                    severity: 'success'
                });
                setTimeout(() => {
                    onClose();
                }, 1500);
            } else {
                const errorData = await response.json();
                setError({
                    submit: errorData.message || 'Failed to update Solution Story'
                });
                setSnackbar({
                    open: true,
                    message: errorData.message || 'Failed to update Solution Story',
                    severity: 'error'
                });
            }
        } catch (error) {
            console.error('Error updating Solution Story:', error);
            setError({
                submit: 'Failed to update Solution Story'
            });
            setSnackbar({
                open: true,
                message: 'Failed to update Solution Story',
                severity: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setFieldErrors({});
        setError({});
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="px-6 py-4 bg-blue-600 text-white rounded-t-lg">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-3">
                            <FileText size={24} />
                            <div>
                                <h2 className="text-xl font-bold">Edit Solution Story</h2>
                                <p className="text-blue-100 text-sm">SS ID: {storyData?.ssId}</p>
                            </div>
                        </div>
                        <button
                            onClick={handleClose}
                            className="p-2 hover:bg-blue-700 rounded-lg transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Row 1: Summary, Status, Priority, Story Points */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                <FileText size={14} className="inline mr-1" />
                                Summary *
                            </label>
                            <input
                                type="text"
                                name="summary"
                                value={formData.summary}
                                onChange={handleInputChange}
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                    fieldErrors.summary ? 'border-red-500' : 'border-gray-300'
                                }`}
                                placeholder="Enter solution story summary"
                                required
                            />
                            {fieldErrors.summary && (
                                <p className="text-red-500 text-xs mt-1">{fieldErrors.summary}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                <Building size={14} className="inline mr-1" />
                                Status
                            </label>
                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="todo">To Do</option>
                                <option value="in-progress">In Progress</option>
                                <option value="completed">Completed</option>
                                <option value="blocked">Blocked</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                <DollarSign size={14} className="inline mr-1" />
                                Priority
                            </label>
                            <select
                                name="priority"
                                value={formData.priority}
                                onChange={handleInputChange}
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                    fieldErrors.priority ? 'border-red-500' : 'border-gray-300'
                                }`}
                            >
                                <option value={1}>High</option>
                                <option value={2}>Medium</option>
                                <option value={3}>Low</option>
                            </select>
                            {fieldErrors.priority && (
                                <p className="text-red-500 text-xs mt-1">{fieldErrors.priority}</p>
                            )}
                        </div>
                    </div>

                    {/* Row 2: Story Points, System, Assignee */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                <DollarSign size={14} className="inline mr-1" />
                                Story Points
                            </label>
                            <input
                                type="number"
                                name="storyPoints"
                                value={formData.storyPoints}
                                onChange={handleInputChange}
                                min="0"
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                    fieldErrors.storyPoints ? 'border-red-500' : 'border-gray-300'
                                }`}
                            />
                            {fieldErrors.storyPoints && (
                                <p className="text-red-500 text-xs mt-1">{fieldErrors.storyPoints}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                <Building size={14} className="inline mr-1" />
                                System
                            </label>
                            <input
                                type="text"
                                name="system"
                                value={formData.system}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter system name"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                <User size={14} className="inline mr-1" />
                                Assignee
                            </label>
                            <Select
                                value={users.find(user => user.email === formData.assignee) ? 
                                    { value: formData.assignee, label: users.find(user => user.email === formData.assignee)?.firstName + ' ' + users.find(user => user.email === formData.assignee)?.lastName } : 
                                    null}
                                onChange={(selectedOption) => handleSelectChange('assignee', selectedOption)}
                                options={users.map(user => ({
                                    value: user.email,
                                    label: `${user.firstName} ${user.lastName}`
                                }))}
                                isClearable
                                placeholder="Select assignee..."
                                className="text-sm"
                            />
                        </div>
                    </div>

                    {/* Row 3: Release, Sprint */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                <Calendar size={14} className="inline mr-1" />
                                Release
                            </label>
                            <Select
                                value={releases.find(release => release.id.toString() === formData.releaseId) ? 
                                    { value: formData.releaseId, label: releases.find(release => release.id.toString() === formData.releaseId)?.releaseName } : 
                                    null}
                                onChange={(selectedOption) => handleSelectChange('releaseId', selectedOption)}
                                options={releases.map(release => ({
                                    value: release.id.toString(),
                                    label: release.releaseName
                                }))}
                                isClearable
                                placeholder="Select release..."
                                className="text-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                <Calendar size={14} className="inline mr-1" />
                                Sprint
                            </label>
                            <Select
                                value={sprints.find(sprint => sprint.id.toString() === formData.sprintId) ? 
                                    { value: formData.sprintId, label: sprints.find(sprint => sprint.id.toString() === formData.sprintId)?.sprintName } : 
                                    null}
                                onChange={(selectedOption) => handleSelectChange('sprintId', selectedOption)}
                                options={sprints.map(sprint => ({
                                    value: sprint.id.toString(),
                                    label: sprint.sprintName
                                }))}
                                isClearable
                                placeholder="Select sprint..."
                                className="text-sm"
                            />
                        </div>
                    </div>

                    {/* Row 4: Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            <FileText size={14} className="inline mr-1" />
                            Description
                        </label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter detailed description"
                        />
                    </div>

                    {/* Error Message */}
                    {error.submit && (
                        <div className="bg-red-50 border border-red-200 rounded-md p-3">
                            <p className="text-red-600 text-sm">{error.submit}</p>
                        </div>
                    )}

                    {/* Footer */}
                    <div className="flex justify-end space-x-3 pt-4 border-t">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center"
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Updating...
                                </>
                            ) : (
                                <>
                                    <Plus size={16} className="mr-2" />
                                    Update Solution Story
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>

            {/* Global Snackbar */}
            <GlobalSnackbar
                open={snackbar.open}
                message={snackbar.message}
                severity={snackbar.severity}
                onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
            />
        </div>
    );
};

export default EditSolutionStoryModal;
