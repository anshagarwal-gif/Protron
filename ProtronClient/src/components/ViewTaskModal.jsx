import React from 'react';
import { X, FileText, Clock, Calendar } from 'lucide-react';

const ViewTaskModal = ({ open, onClose, taskData }) => {
    if (!open || !taskData) return null;

    const formatValue = (value) => {
        if (value === null || value === undefined || value === '') {
            return 'N/A';
        }
        return value;
    };

    const formatTime = (hours, minutes) => {
        if (hours === 0 && minutes === 0) return 'N/A';
        return `${hours}h ${minutes}m`;
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
                                <h2 className="text-xl font-bold">Task Details</h2>
                                <p className="text-purple-100 text-sm">Task ID: {taskData.taskId}</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-purple-700 rounded-lg transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    {/* Basic Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    <FileText size={14} className="inline mr-1" />
                                    Task Topic
                                </label>
                                <div className="p-3 bg-gray-50 rounded-md">
                                    {formatValue(taskData.taskTopic)}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    <Building size={14} className="inline mr-1" />
                                    Task Type
                                </label>
                                <div className="p-3 bg-gray-50 rounded-md">
                                    {formatValue(taskData.taskType)}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    <Calendar size={14} className="inline mr-1" />
                                    Date
                                </label>
                                <div className="p-3 bg-gray-50 rounded-md">
                                    {formatValue(taskData.date)}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    <Clock size={14} className="inline mr-1" />
                                    Estimated Time
                                </label>
                                <div className="p-3 bg-gray-50 rounded-md">
                                    {formatValue(taskData.estTime)}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    <Clock size={14} className="inline mr-1" />
                                    Time Spent
                                </label>
                                <div className="p-3 bg-gray-50 rounded-md">
                                    {formatTime(taskData.timeSpentHours, taskData.timeSpentMinutes)}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    <Clock size={14} className="inline mr-1" />
                                    Time Remaining
                                </label>
                                <div className="p-3 bg-gray-50 rounded-md">
                                    {formatTime(taskData.timeRemainingHours, taskData.timeRemainingMinutes)}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    <Clock size={14} className="inline mr-1" />
                                    Time Spent (Hours)
                                </label>
                                <div className="p-3 bg-gray-50 rounded-md">
                                    {formatValue(taskData.timeSpentHours)}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    <Clock size={14} className="inline mr-1" />
                                    Time Spent (Minutes)
                                </label>
                                <div className="p-3 bg-gray-50 rounded-md">
                                    {formatValue(taskData.timeSpentMinutes)}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            <FileText size={14} className="inline mr-1" />
                            Task Description
                        </label>
                        <div className="p-3 bg-gray-50 rounded-md min-h-[100px]">
                            {formatValue(taskData.taskDescription)}
                        </div>
                    </div>

                    {/* Metadata */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Project ID
                            </label>
                            <div className="p-3 bg-gray-50 rounded-md">
                                {formatValue(taskData.projectId)}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Parent ID
                            </label>
                            <div className="p-3 bg-gray-50 rounded-md">
                                {formatValue(taskData.parentId)}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 border-t rounded-b-lg">
                    <div className="flex justify-end">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ViewTaskModal;
