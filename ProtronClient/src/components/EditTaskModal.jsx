import React, { useEffect, useState } from 'react';
import {
    X,
    FileText,
    Plus
} from 'lucide-react';
import GlobalSnackbar from './GlobalSnackbar';

const EditTaskModal = ({ open, onClose, taskId, taskData }) => {
    if (!open) return null;
    
    const [formData, setFormData] = useState({
        projectId: '',
        parentId: '',
        date: '',
        taskType: '',
        taskTopic: '',
        taskDescription: '',
        estTime: '',
        timeSpentHours: 0,
        timeSpentMinutes: 0,
        timeRemainingHours: 0,
        timeRemainingMinutes: 0
    });

    const [loading, setLoading] = useState(false);
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success'
    });
    const [error, setError] = useState({});
    const [fieldErrors, setFieldErrors] = useState({});

    useEffect(() => {
        if (taskData) {
            setFormData({
                projectId: taskData.projectId || '',
                parentId: taskData.parentId || '',
                date: taskData.date || '',
                taskType: taskData.taskType || '',
                taskTopic: taskData.taskTopic || '',
                taskDescription: taskData.taskDescription || '',
                estTime: taskData.estTime || '',
                timeSpentHours: taskData.timeSpentHours || 0,
                timeSpentMinutes: taskData.timeSpentMinutes || 0,
                timeRemainingHours: taskData.timeRemainingHours || 0,
                timeRemainingMinutes: taskData.timeRemainingMinutes || 0
            });
        }
    }, [taskData]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name.includes('Hours') || name.includes('Minutes') ? parseInt(value) || 0 : value
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
        
        if (!formData.taskTopic.trim()) {
            errors.taskTopic = 'Task topic is required';
        }
        
        if (!formData.taskType.trim()) {
            errors.taskType = 'Task type is required';
        }
        
        if (!formData.date) {
            errors.date = 'Date is required';
        }
        
        if (formData.timeSpentHours < 0 || formData.timeSpentHours > 24) {
            errors.timeSpentHours = 'Hours must be between 0 and 24';
        }
        
        if (formData.timeSpentMinutes < 0 || formData.timeSpentMinutes > 59) {
            errors.timeSpentMinutes = 'Minutes must be between 0 and 59';
        }
        
        if (formData.timeRemainingHours < 0 || formData.timeRemainingHours > 24) {
            errors.timeRemainingHours = 'Remaining hours must be between 0 and 24';
        }
        
        if (formData.timeRemainingMinutes < 0 || formData.timeRemainingMinutes > 59) {
            errors.timeRemainingMinutes = 'Remaining minutes must be between 0 and 59';
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
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/task/${taskId}`, {
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
                    message: 'Task updated successfully!',
                    severity: 'success'
                });
                setTimeout(() => {
                    onClose();
                }, 1500);
            } else {
                const errorData = await response.json();
                setError({
                    submit: errorData.message || 'Failed to update Task'
                });
                setSnackbar({
                    open: true,
                    message: errorData.message || 'Failed to update Task',
                    severity: 'error'
                });
            }
        } catch (error) {
            console.error('Error updating Task:', error);
            setError({
                submit: 'Failed to update Task'
            });
            setSnackbar({
                open: true,
                message: 'Failed to update Task',
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
                <div className="px-6 py-4 bg-purple-600 text-white rounded-t-lg">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-3">
                            <FileText size={24} />
                            <div>
                                <h2 className="text-xl font-bold">Edit Task</h2>
                                <p className="text-purple-100 text-sm">Task ID: {taskData?.taskId}</p>
                            </div>
                        </div>
                        <button
                            onClick={handleClose}
                            className="p-2 hover:bg-purple-700 rounded-lg transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Row 1: Task Topic, Task Type, Date */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                <FileText size={14} className="inline mr-1" />
                                Task Topic *
                            </label>
                            <input
                                type="text"
                                name="taskTopic"
                                value={formData.taskTopic}
                                onChange={handleInputChange}
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                                    fieldErrors.taskTopic ? 'border-red-500' : 'border-gray-300'
                                }`}
                                placeholder="Enter task topic"
                                required
                            />
                            {fieldErrors.taskTopic && (
                                <p className="text-red-500 text-xs mt-1">{fieldErrors.taskTopic}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                <Building size={14} className="inline mr-1" />
                                Task Type *
                            </label>
                            <select
                                name="taskType"
                                value={formData.taskType}
                                onChange={handleInputChange}
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                                    fieldErrors.taskType ? 'border-red-500' : 'border-gray-300'
                                }`}
                                required
                            >
                                <option value="">Select Task Type</option>
                                <option value="development">Development</option>
                                <option value="testing">Testing</option>
                                <option value="design">Design</option>
                                <option value="documentation">Documentation</option>
                                <option value="review">Review</option>
                                <option value="meeting">Meeting</option>
                                <option value="other">Other</option>
                            </select>
                            {fieldErrors.taskType && (
                                <p className="text-red-500 text-xs mt-1">{fieldErrors.taskType}</p>
                            )}
                        </div>
                    </div>

                    {/* Row 2: Date, Estimated Time */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                <Calendar size={14} className="inline mr-1" />
                                Date *
                            </label>
                            <input
                                type="date"
                                name="date"
                                value={formData.date}
                                onChange={handleInputChange}
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                                    fieldErrors.date ? 'border-red-500' : 'border-gray-300'
                                }`}
                                required
                            />
                            {fieldErrors.date && (
                                <p className="text-red-500 text-xs mt-1">{fieldErrors.date}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                <Clock size={14} className="inline mr-1" />
                                Estimated Time
                            </label>
                            <input
                                type="text"
                                name="estTime"
                                value={formData.estTime}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                placeholder="e.g., 2h 30m"
                            />
                        </div>
                    </div>

                    {/* Row 3: Time Spent Hours, Time Spent Minutes */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                <Clock size={14} className="inline mr-1" />
                                Time Spent (Hours)
                            </label>
                            <input
                                type="number"
                                name="timeSpentHours"
                                value={formData.timeSpentHours}
                                onChange={handleInputChange}
                                min="0"
                                max="24"
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                                    fieldErrors.timeSpentHours ? 'border-red-500' : 'border-gray-300'
                                }`}
                            />
                            {fieldErrors.timeSpentHours && (
                                <p className="text-red-500 text-xs mt-1">{fieldErrors.timeSpentHours}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                <Clock size={14} className="inline mr-1" />
                                Time Spent (Minutes)
                            </label>
                            <input
                                type="number"
                                name="timeSpentMinutes"
                                value={formData.timeSpentMinutes}
                                onChange={handleInputChange}
                                min="0"
                                max="59"
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                                    fieldErrors.timeSpentMinutes ? 'border-red-500' : 'border-gray-300'
                                }`}
                            />
                            {fieldErrors.timeSpentMinutes && (
                                <p className="text-red-500 text-xs mt-1">{fieldErrors.timeSpentMinutes}</p>
                            )}
                        </div>
                    </div>

                    {/* Row 4: Time Remaining Hours, Time Remaining Minutes */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                <Clock size={14} className="inline mr-1" />
                                Time Remaining (Hours)
                            </label>
                            <input
                                type="number"
                                name="timeRemainingHours"
                                value={formData.timeRemainingHours}
                                onChange={handleInputChange}
                                min="0"
                                max="24"
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                                    fieldErrors.timeRemainingHours ? 'border-red-500' : 'border-gray-300'
                                }`}
                            />
                            {fieldErrors.timeRemainingHours && (
                                <p className="text-red-500 text-xs mt-1">{fieldErrors.timeRemainingHours}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                <Clock size={14} className="inline mr-1" />
                                Time Remaining (Minutes)
                            </label>
                            <input
                                type="number"
                                name="timeRemainingMinutes"
                                value={formData.timeRemainingMinutes}
                                onChange={handleInputChange}
                                min="0"
                                max="59"
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                                    fieldErrors.timeRemainingMinutes ? 'border-red-500' : 'border-gray-300'
                                }`}
                            />
                            {fieldErrors.timeRemainingMinutes && (
                                <p className="text-red-500 text-xs mt-1">{fieldErrors.timeRemainingMinutes}</p>
                            )}
                        </div>
                    </div>

                    {/* Row 5: Task Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            <FileText size={14} className="inline mr-1" />
                            Task Description
                        </label>
                        <textarea
                            name="taskDescription"
                            value={formData.taskDescription}
                            onChange={handleInputChange}
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                            placeholder="Enter detailed task description"
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
                            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center"
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Updating...
                                </>
                            ) : (
                                <>
                                    <Plus size={16} className="mr-2" />
                                    Update Task
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

export default EditTaskModal;
