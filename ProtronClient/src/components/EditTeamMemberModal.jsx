import React, { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';

const EditTeamMemberModal = ({ isOpen, onClose, member, onUpdate }) => {
    const [formData, setFormData] = useState({
        pricing: '',
        unit: '',
        estimatedReleaseDate: '',
        taskType: 'developer' // Default value
    });

    useEffect(() => {
        if (member) {
            // Log the member object to see what's coming from the database
            console.log("Member data received:", member);
            
            setFormData({
                pricing: member.pricing || '',
                unit: member.unit || 'Dollar',
                estimatedReleaseDate: member.estimatedReleaseDate || '',
                // Use the member's taskType if it exists, otherwise default to 'developer'
                taskType: member.taskType || 'developer'
            });
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

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
            <div className="bg-white rounded-lg w-full max-w-md p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold text-gray-800">Edit Team Member</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        <FiX size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* Display member info (non-editable) */}
                    <div className="mb-4 flex items-center">
                        <div className="w-10 h-10 bg-gray-200 rounded-full mr-3 flex items-center justify-center">
                            {member?.user?.profilePhoto ? (
                                <img
                                    src={member.user.profilePhoto}
                                    alt="Profile"
                                    className="w-10 h-10 rounded-full"
                                />
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white">
                                    {member?.user?.firstName?.charAt(0) || ''}
                                </div>
                            )}
                        </div>
                        <div>
                            <p className="font-medium">{`${member?.user?.firstName || ''} ${member?.user?.lastName || ''}`}</p>
                            <p className="text-sm text-gray-500">{member?.user?.email || ''}</p>
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="block text-gray-600 text-sm font-medium mb-1">
                            Employee Code
                        </label>
                        <input
                            type="text"
                            value={member?.empCode || ''}
                            className="w-full px-3 py-2 border rounded bg-gray-100 text-gray-600"
                            disabled
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block text-gray-600 text-sm font-medium mb-1">
                            Task Type *
                        </label>
                        <select
                            name="taskType"
                            value={formData.taskType}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        >
                            <option value="developer">Developer</option>
                            <option value="designer">Designer</option>
                            <option value="test">Test</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-gray-600 text-sm font-medium mb-1">
                                Cost *
                            </label>
                            <input
                                type="number"
                                name="pricing"
                                value={formData.pricing}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-gray-600 text-sm font-medium mb-1">
                                Unit *
                            </label>
                            <select
                                name="unit"
                                value={formData.unit}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            >
                                <option value="Dollar">Dollar ($)</option>
                                <option value="Rupees">Rupees (₹)</option>
                                <option value="Euro">Euro (€)</option>
                            </select>
                        </div>
                    </div>

                    <div className="mb-6">
                        <label className="block text-gray-600 text-sm font-medium mb-1">
                            Estimated Release Date *
                        </label>
                        <input
                            type="date"
                            name="estimatedReleaseDate"
                            value={formData.estimatedReleaseDate}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>

                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
                        >
                            Update
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditTeamMemberModal;