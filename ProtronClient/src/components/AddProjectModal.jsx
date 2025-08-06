import React, { useEffect, useState, useRef } from 'react';
import { Calendar, Upload, Users, User, FolderOpen, X } from 'lucide-react';
// axios import removed - replace with fetch API in actual implementation

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

// Custom Dropdown Component
const Dropdown = ({ 
    options = [], 
    value, 
    onChange, 
    placeholder, 
    label, 
    icon: Icon,
    getOptionLabel = (option) => option,
    isOptionEqualToValue = (option, value) => option === value,
    disabled = false
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const dropdownRef = useRef(null);

    const filteredOptions = options.filter(option =>
        getOptionLabel(option).toLowerCase().includes(searchTerm.toLowerCase())
    );

    const selectedOption = options.find(option => isOptionEqualToValue(option, value));

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
                setSearchTerm('');
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            <div
                className={`relative w-full h-10 border border-gray-300 rounded-md px-3 py-2 bg-white cursor-pointer flex items-center ${
                    disabled ? 'bg-gray-100 cursor-not-allowed' : 'hover:border-green-500'
                } ${isOpen ? 'border-green-600' : ''}`}
                onClick={() => !disabled && setIsOpen(!isOpen)}
            >
                {Icon && <Icon className="w-5 h-5 text-green-800 mr-2" />}
                <input
                    type="text"
                    className="flex-1 outline-none bg-transparent cursor-pointer"
                    placeholder={placeholder}
                    value={isOpen ? searchTerm : (selectedOption ? getOptionLabel(selectedOption) : '')}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    readOnly={!isOpen}
                    disabled={disabled}
                    title={isOpen ? searchTerm : (selectedOption ? getOptionLabel(selectedOption) : 'N/A')}
                />
                <div className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`}>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </div>

            {isOpen && (
                <div className="fixed z-50 w-[20%] mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                    {filteredOptions.length > 0 ? (
                        filteredOptions.map((option, index) => (
                            <div
                                key={index}
                                className="px-3 py-2 hover:bg-green-50 cursor-pointer flex items-center"
                                onClick={() => {
                                    onChange(option);
                                    setIsOpen(false);
                                    setSearchTerm('');
                                }}
                            >
                                {option.name && (
                                    <div className="w-6 h-6 rounded-full bg-green-800 text-white text-xs flex items-center justify-center mr-2">
                                        {option.name.charAt(0)}
                                    </div>
                                )}
                                {getOptionLabel(option)}
                            </div>
                        ))
                    ) : (
                        <div className="px-3 py-2 text-gray-500 text-sm">No options found</div>
                    )}
                </div>
            )}
        </div>
    );
};

// Multi-select Dropdown Component
const MultiSelectDropdown = ({ 
    options = [], 
    value = [], 
    onChange, 
    placeholder, 
    label, 
    icon: Icon,
    getOptionLabel = (option) => option,
    isOptionEqualToValue = (option, value) => option === value
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const dropdownRef = useRef(null);

    const filteredOptions = options.filter(option =>
        getOptionLabel(option).toLowerCase().includes(searchTerm.toLowerCase())
    );

    const selectedOptions = options.filter(option => 
        value.some(selectedValue => isOptionEqualToValue(option, selectedValue))
    );

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
                setSearchTerm('');
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleOptionToggle = (option) => {
        const optionValue = option.userId || option;
        const isSelected = value.includes(optionValue);
        
        if (isSelected) {
            onChange(value.filter(v => v !== optionValue));
        } else {
            onChange([...value, optionValue]);
        }
    };

    return (
        <div className="relative z-10" ref={dropdownRef}>
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            <div
                className={`relative z-10 w-full h-10 border border-gray-300 rounded-md px-3 py-2 bg-white cursor-pointer flex items-center hover:border-green-500 ${
                    isOpen ? 'border-green-600' : ''
                }`}
                onClick={() => setIsOpen(!isOpen)}
            >
                {Icon && <Icon className="w-5 h-5 text-green-800 mr-2" />}
                <input
                    type="text"
                    className="flex-1 outline-none bg-transparent cursor-pointer"
                    placeholder={placeholder}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    readOnly={!isOpen}
                />
                <div className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`}>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </div>

            {isOpen && (
                <div className="fixed z-50 w-[300px] mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                    {filteredOptions.length > 0 ? (
                        filteredOptions.map((option, index) => {
                            const optionValue = option.userId || option;
                            const isSelected = value.includes(optionValue);
                            
                            return (
                                <div
                                    key={index}
                                    className={`px-3 py-2 hover:bg-green-50 cursor-pointer flex items-center ${
                                        isSelected ? 'bg-green-100' : ''
                                    }`}
                                    onClick={() => handleOptionToggle(option)}
                                >
                                    <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => {}}
                                        className="mr-2 text-green-600"
                                    />
                                    {option.name && (
                                        <div className="w-6 h-6 rounded-full bg-green-800 text-white text-xs flex items-center justify-center mr-2">
                                            {option.name.charAt(0)}
                                        </div>
                                    )}
                                    {getOptionLabel(option)}
                                </div>
                            );
                        })
                    ) : (
                        <div className="px-3 py-2 text-gray-500 text-sm">No options found</div>
                    )}
                </div>
            )}

            {/* Display selected team members */}
            {selectedOptions.length > 0 && (
                <div className="mt-2 p-2 border border-green-800 rounded-md bg-white max-h-32 overflow-auto">
                    <div className="text-xs text-gray-600 mb-2">
                        Selected Team Members ({selectedOptions.length})
                    </div>
                    <div className="flex flex-wrap gap-1">
                        {selectedOptions.map((option) => (
                            <div
                                key={option.userId || option}
                                className="flex items-center bg-green-700 text-white rounded px-2 py-1 text-sm w-full"
                            >
                                <div className="w-4 h-4 rounded-full bg-green-800 text-white text-xs flex items-center justify-center mr-1">
                                    {option.name?.charAt(0)}
                                </div>
                                <span className="truncate flex-1 text-xs">{option.name}</span>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        const optionValue = option.userId || option;
                                        onChange(value.filter(v => v !== optionValue));
                                    }}
                                    className="ml-1 text-white hover:bg-white hover:bg-opacity-20 rounded p-0.5"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

// Date Picker Component (simplified)
const DatePicker = ({ label, value, onChange, icon: Icon }) => {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            <div className="relative">
                <input
                    type="date"
                    value={value ? value.toISOString().split('T')[0] : ''}
                    onChange={(e) => onChange(e.target.value ? new Date(e.target.value) : null)}
                    className="w-full h-10 px-3 py-2 pl-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 hover:border-green-500"
                    title={value || "N/A"}
                />
                {Icon && <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-green-800" />}
            </div>
        </div>
    );
};

// Main Modal Component
const AddProjectModal = ({ open, onClose, onSubmit, formData, setFormData }) => {
    const [users, setUsers] = useState([]);
    const [initialFormData, setInitialFormData] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchUsers = async () => {
        try {
            // Replace with your actual fetch implementation
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/tenants/${sessionStorage.getItem("tenantId")}/users`, {
                headers: { Authorization: `${sessionStorage.getItem('token')}` }
            });
            const data = await response.json();
            setUsers(data);
        } catch (error) {
            console.log({ message: error });
        }
    };

    useEffect(() => {
        if (open) {
            fetchUsers();
            setInitialFormData({ ...formData });
        }
    }, [open]);

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData((prev) => ({ ...prev, projectIcon: URL.createObjectURL(file) }));
        }
    };

    const handleChange = (field, value) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSubmit = () => {
        setIsSubmitting(true);
        onSubmit(formData);
        setIsSubmitting(false);
    };

    const handleReset = () => {
        setFormData({ ...initialFormData });
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-auto shadow-xl">
                {/* Header */}
                <div className="bg-gray-50 border-b border-gray-200 py-4 px-6">
                    <h1 className="text-xl font-semibold text-green-600">Add New Project</h1>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Row 1: Project Name, Project Icon, and Start/End Dates */}
                    <div className="grid grid-cols-4 gap-4">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Enter a descriptive project name"
                                    value={formData.projectName || ''}
                                    onChange={(e) => handleChange('projectName', e.target.value)}
                                    className="w-full h-10 px-3 py-2 pl-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 hover:border-green-500"
                                    title={formData.projectName || 'Enter Project Name'}
                                />
                                <FolderOpen className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-green-800" />
                            </div>
                        </div>

                        <div className="flex-none w-full">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Project Icon</label>
                            <div className="h-10 border-2 border-dashed border-gray-300 rounded-md bg-gray-50 flex items-center justify-center">
                                {formData.projectIcon ? (
                                    <div className="flex items-center gap-2">
                                        <img
                                            src={formData.projectIcon}
                                            alt="Project Icon"
                                            className="w-8 h-8 rounded-full object-cover"
                                        />
                                        <label className="px-3 py-1 text-xs border border-green-800 text-green-800 rounded hover:bg-green-50 cursor-pointer">
                                            Change
                                            <input hidden accept="image/*" type="file" onChange={handleImageUpload} />
                                        </label>
                                    </div>
                                ) : (
                                    <label className="flex items-center gap-2 px-3 py-1 text-xs border border-green-800 text-green-800 rounded hover:bg-green-50 cursor-pointer">
                                        <Upload className="w-4 h-4" />
                                        Project Icon
                                        <input hidden accept="image/*" type="file" onChange={handleImageUpload} />
                                    </label>
                                )}
                            </div>
                        </div>

                        <div className="flex-none w-full">
                            <DatePicker
                                label="Start Date"
                                value={formData.startDate}
                                onChange={(value) => handleChange('startDate', value)}
                                icon={Calendar}
                            />
                        </div>

                        <div className="flex-none w-full">
                            <DatePicker
                                label="End Date"
                                value={formData.endDate}
                                onChange={(value) => handleChange('endDate', value)}
                                icon={Calendar}
                            />
                        </div>
                    </div>

                    {/* Row 2: Project Manager, Sponsor, Currency, and Cost */}
                    <div className="grid grid-cols-4 gap-4">
                        <div className="flex-1">
                            <Dropdown
                                options={users}
                                value={formData.manager}
                                onChange={(user) => handleChange('manager', user ? user.userId : null)}
                                label="Project Manager"
                                placeholder="Search for a manager..."
                                icon={User}
                                getOptionLabel={(option) => option.name || ''}
                                isOptionEqualToValue={(option, value) => option.userId === value}
                            />
                        </div>

                        <div className="flex-1">
                            <Dropdown
                                options={users}
                                value={formData.sponsor}
                                onChange={(user) => handleChange('sponsor', user ? user.userId : null)}
                                label="Sponsor"
                                placeholder="Search for a sponsor..."
                                icon={User}
                                getOptionLabel={(option) => option.name || ''}
                                isOptionEqualToValue={(option, value) => option.userId === value}
                            />
                        </div>

                        <div className="flex-none w-full">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                            <select
                                value={formData.currency || ''}
                                onChange={(e) => handleChange('currency', e.target.value)}
                                className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 hover:border-green-500"
                                title={formData.currency || 'Select Currency'}
                            >
                                <option value="">Select Currency</option>
                                {currencies.map((currency) => (
                                    <option key={currency} value={currency}>
                                        {currency}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex-none w-full">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Project Cost</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    placeholder="Enter amount"
                                    value={formData.cost || ''}
                                    onChange={(e) => handleChange('cost', e.target.value)}
                                    className="w-full h-10 px-3 py-2 pl-8 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 hover:border-green-500"
                                    title={formData.cost || 'Enter Project Cost'}
                                />
                                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                                    {formData.currency ? currencySymbols[formData.currency] : ''}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Row 3: Team Members and Systems Impacted */}
                    <div className="flex gap-4 items-start">
                        <div className="flex-1">
                            <MultiSelectDropdown
                                options={users}
                                value={formData.teamMembers || []}
                                onChange={(value) => handleChange('teamMembers', value)}
                                label="Team Members"
                                placeholder="Search for team members..."
                                icon={Users}
                                getOptionLabel={(option) => option.name || ''}
                                isOptionEqualToValue={(option, value) => option.userId === value}
                            />
                        </div>

                        <div className="flex-1">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Add Systems Impacted</label>
                                <input
                                    type="text"
                                    placeholder="Type a system and press Enter"
                                    value={formData.newSystem || ''}
                                    onChange={(e) => handleChange('newSystem', e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && formData.newSystem?.trim()) {
                                            e.preventDefault();
                                            const currentSystems = formData.systemImpacted || [];
                                            handleChange('systemImpacted', [...currentSystems, formData.newSystem.trim()]);
                                            handleChange('newSystem', '');
                                        }
                                    }}
                                    className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 hover:border-green-500"
                                />
                                <div className="text-xs text-gray-600 mt-1">
                                    Enter System Name and press Enter to add the system.
                                </div>

                                {/* Display added systems */}
                                {formData.systemImpacted?.length > 0 && (
                                    <div className="mt-2 p-2 border border-green-800 rounded-md bg-white overflow-auto">
                                        <div className="text-xs text-gray-600 mb-2">
                                            Added Systems Impacted ({formData.systemImpacted.length})
                                        </div>
                                        <div className="flex flex-wrap gap-1">
                                            {formData.systemImpacted.map((system, index) => (
                                                <div
                                                    key={index}
                                                    className="flex items-center bg-green-700 text-white rounded px-2 py-1 text-sm"
                                                >
                                                    <span className="truncate flex-1 text-xs">{system}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const updatedSystems = formData.systemImpacted.filter(s => s !== system);
                                                            handleChange('systemImpacted', updatedSystems);
                                                        }}
                                                        className="ml-1 text-white hover:bg-white hover:bg-opacity-20 rounded p-0.5"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
                        <button
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="px-6 py-2 border border-green-800 text-green-800 rounded hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleReset}
                            disabled={isSubmitting}
                            className="px-6 py-2 border border-green-800 text-green-800 rounded hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Reset
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="px-8 py-2 bg-green-800 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed     font-semibold flex items-center justify-center"
                        >
                            {isSubmitting ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                'Create Project'
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddProjectModal;