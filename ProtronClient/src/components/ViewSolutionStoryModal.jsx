import React from 'react';
import { X, FileText, User, Building, Calendar, DollarSign } from 'lucide-react';

const ViewSolutionStoryModal = ({ open, onClose, storyData }) => {
    if (!open || !storyData) return null;

    const formatValue = (value) => {
        if (value === null || value === undefined || value === '') {
            return 'N/A';
        }
        return value;
    };

    const getPriorityText = (priority) => {
        switch (priority) {
            case 1: return 'High';
            case 2: return 'Medium';
            case 3: return 'Low';
            default: return 'N/A';
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'todo': return 'bg-gray-100 text-gray-800';
            case 'in-progress': return 'bg-blue-100 text-blue-800';
            case 'completed': return 'bg-green-100 text-green-800';
            case 'blocked': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
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
                                <h2 className="text-xl font-bold">Solution Story Details</h2>
                                <p className="text-blue-100 text-sm">SS ID: {storyData.ssId}</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-blue-700 rounded-lg transition-colors"
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
                                    Summary
                                </label>
                                <div className="p-3 bg-gray-50 rounded-md">
                                    {formatValue(storyData.summary)}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    <Building size={14} className="inline mr-1" />
                                    Status
                                </label>
                                <div className="p-3 bg-gray-50 rounded-md">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(storyData.status)}`}>
                                        {formatValue(storyData.status)}
                                    </span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    <DollarSign size={14} className="inline mr-1" />
                                    Priority
                                </label>
                                <div className="p-3 bg-gray-50 rounded-md">
                                    {getPriorityText(storyData.priority)}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    <DollarSign size={14} className="inline mr-1" />
                                    Story Points
                                </label>
                                <div className="p-3 bg-gray-50 rounded-md">
                                    {formatValue(storyData.storyPoints)}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    <Building size={14} className="inline mr-1" />
                                    System
                                </label>
                                <div className="p-3 bg-gray-50 rounded-md">
                                    {formatValue(storyData.system)}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    <User size={14} className="inline mr-1" />
                                    Assignee
                                </label>
                                <div className="p-3 bg-gray-50 rounded-md">
                                    {formatValue(storyData.assignee)}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    <Calendar size={14} className="inline mr-1" />
                                    Release
                                </label>
                                <div className="p-3 bg-gray-50 rounded-md">
                                    {formatValue(storyData.release)}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    <Calendar size={14} className="inline mr-1" />
                                    Sprint
                                </label>
                                <div className="p-3 bg-gray-50 rounded-md">
                                    {formatValue(storyData.sprint)}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            <FileText size={14} className="inline mr-1" />
                            Description
                        </label>
                        <div className="p-3 bg-gray-50 rounded-md min-h-[100px]">
                            {formatValue(storyData.description)}
                        </div>
                    </div>

                    {/* Metadata */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Project ID
                            </label>
                            <div className="p-3 bg-gray-50 rounded-md">
                                {formatValue(storyData.projectId)}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Parent ID
                            </label>
                            <div className="p-3 bg-gray-50 rounded-md">
                                {formatValue(storyData.parentId)}
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

export default ViewSolutionStoryModal;
