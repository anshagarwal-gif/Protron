import React, { useEffect, useState, useRef } from 'react';
import { Calendar, Upload, Users, User, FolderOpen, X, Building2, Users as UsersIcon, AlertCircle } from 'lucide-react';
import CreatableSelect from 'react-select/creatable';
import axios from 'axios';
import OrganizationSelect from './OrganizationSelect';

// API Base URL
const API_BASE_URL = import.meta.env.VITE_API_URL;

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
                className={`relative w-full h-10 border border-gray-300 rounded-md px-3 py-2 bg-white cursor-pointer flex items-center ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'hover:border-green-500'
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
                className={`relative z-10 w-full h-10 border border-gray-300 rounded-md px-3 py-2 bg-white cursor-pointer flex items-center hover:border-green-500 ${isOpen ? 'border-green-600' : ''
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
                                    className={`px-3 py-2 hover:bg-green-50 cursor-pointer flex items-center ${isSelected ? 'bg-green-100' : ''
                                        }`}
                                    onClick={() => handleOptionToggle(option)}
                                >
                                    <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => { }}
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
const DatePicker = ({ label, value, onChange, icon: Icon, error }) => {
    const inputRef = useRef(null);

    const handleInputClick = () => {
        if (inputRef.current) {
            inputRef.current.showPicker?.(); // Safe call in case browser doesn't support it
        }
    };

    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            <div className="relative" onClick={handleInputClick}>
                <input
                    ref={inputRef}
                    type="date"
                    value={value ? value.toISOString().split('T')[0] : ''}
                    onChange={(e) => onChange(e.target.value ? new Date(e.target.value) : null)}
                    className={`w-full h-10 px-3 py-2 pl-10 border rounded-md focus:ring-2 focus:ring-green-500 hover:border-green-500 cursor-pointer ${error ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-green-500'}`}
                    title={value || "N/A"}
                />
                {error && (
                    <div className="text-xs text-red-600 mt-1">{error}</div>
                )}
                {Icon && (
                    <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-green-800 pointer-events-none" />
                )}
            </div>
        </div>
    );
};

// Main Modal Component
const AddProjectModal = ({ open, onClose, onSubmit, formData, setFormData }) => {
    const [users, setUsers] = useState([]);
    const [initialFormData, setInitialFormData] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [projectCode, setProjectCode] = useState('');
    const [systems, setSystems] = useState([]);

    const userOptions = users.map((user) => ({
        value: user.name,
        label: user.name,
    }));
    const [errors, setErrors] = useState({})

    const systemOptions = systems.map((system) => ({
        value: system.systemName,
        label: system.systemName,
    }));

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
            setErrors({
                submit: "Error fetching users"
            })
        }
    };

    const fetchSystems = async () => {
        try {
            console.log('Fetching systems from:', `${API_BASE_URL}/api/systems/tenant`);
            const token = sessionStorage.getItem('token');
            console.log('Token exists:', !!token);

            const response = await axios.get(`${API_BASE_URL}/api/systems/tenant`, {
                headers: { Authorization: token }
            });
            console.log('Systems response:', response.data);
            setSystems(response.data);
        } catch (error) {
            console.error('Error fetching systems:', error);
            console.error('Error response:', error.response?.data);
            console.error('Error status:', error.response?.status);
            setSystems([]);
        }
    };

    useEffect(() => {
        if (open) {
            fetchUsers();
            fetchSystems();
            setInitialFormData({ ...formData });
            fetch(`${import.meta.env.VITE_API_URL}/api/projects/generate-code`, {
                headers: { Authorization: `${sessionStorage.getItem('token')}` }
            })
                .then(res => res.text())
                .then(code => {
                    setProjectCode(code);
                    setFormData(prev => ({ ...prev, projectCode: code }));
                })
                .catch(() => setProjectCode(''));
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

    const handleSubmit = async () => {
        // Validate required fields
        const newErrors = {};
        if (!formData.projectName || String(formData.projectName).trim() === '') newErrors.projectName = 'Project name is required';
        if (!formData.startDate) newErrors.startDate = 'Start date is required';
        if (!formData.endDate) newErrors.endDate = 'End date is required';
        if (!formData.currency) newErrors.currency = 'Currency is required';
        if (formData.cost === '' || formData.cost === undefined || formData.cost === null) newErrors.cost = 'Project cost is required';

        setErrors(newErrors);
        if (Object.keys(newErrors).length > 0) {
            return; // Don't submit if validation fails
        }

        setIsSubmitting(true);
        try {
            await onSubmit({ ...formData, projectCode }); // Ensure projectCode is sent
            setErrors({})
        } catch (error) {
            console.error('Error creating project:', error);
            setErrors({
                submit: "Error creating project"
            })
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReset = () => {
        setFormData({ ...initialFormData });
    };

    if (!open) return null;

    return (
        <>
            {/* Modal */}
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                <div className={`bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-auto shadow-xl ${isSubmitting ? 'pointer-events-none' : ''}`}>
                    {/* Header */}
                    <div className="bg-gray-50 border-b border-gray-200 py-4 px-6">
                        <h1 className="text-xl font-semibold text-green-600">Add New Project</h1>
                    </div>

                    {/* Content */}
                    <div className={`p-6 space-y-6 ${isSubmitting ? 'opacity-50' : ''}`}>
                        {/* Row 1: Project Name, Project Icon, and Start/End Dates */}
                        {errors.submit && (
                            <div className="bg-red-50 border border-red-200 rounded-md p-3 flex items-center">
                                <AlertCircle size={18} className="text-red-500 mr-2" />
                                <span className="text-red-700 text-sm">{errors.submit}</span>
                            </div>
                        )}
                        <div className="grid grid-cols-4 gap-4">
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Project Code</label>
                                <input
                                    type="text"
                                    value={projectCode}
                                    disabled
                                    className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-700"
                                    title={projectCode || 'Auto-generated Project Code'}
                                />
                            </div>
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Enter a descriptive project name"
                                        value={formData.projectName || ''}
                                        onChange={(e) => handleChange('projectName', e.target.value)}
                                        disabled={isSubmitting}
                                        className="w-full h-10 px-3 py-2 pl-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 hover:border-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
                                            <label className={`px-3 py-1 text-xs border border-green-800 text-green-800 rounded hover:bg-green-50 cursor-pointer ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                                Change
                                                <input
                                                    hidden
                                                    accept="image/*"
                                                    type="file"
                                                    onChange={handleImageUpload}
                                                    disabled={isSubmitting}
                                                />
                                            </label>
                                        </div>
                                    ) : (
                                        <label className={`flex items-center gap-2 px-3 py-1 text-xs border border-green-800 text-green-800 rounded hover:bg-green-50 cursor-pointer ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                            <Upload className="w-4 h-4" />
                                            Project Icon
                                            <input
                                                hidden
                                                accept="image/*"
                                                type="file"
                                                onChange={handleImageUpload}
                                                disabled={isSubmitting}
                                            />
                                        </label>
                                    )}
                                </div>
                            </div>

                            <div className="flex-none w-full">
                                <DatePicker
                                    label="Start Date *"
                                    value={formData.startDate}
                                    onChange={(value) => handleChange('startDate', value)}
                                    icon={Calendar}
                                    error={errors.startDate}
                                />
                            </div>

                            <div className="flex-none w-full">
                                <DatePicker
                                    label="End Date *"
                                    value={formData.endDate}
                                    onChange={(value) => handleChange('endDate', value)}
                                    icon={Calendar}
                                    error={errors.endDate}
                                />
                            </div>
                        </div>

                        {/* Row 2: Project Manager, Sponsor, Currency, and Cost */}
                        <div className="grid grid-cols-4 gap-4">
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Project Manager
                                </label>
                                <CreatableSelect
                                    options={userOptions}
                                    value={
                                        formData.manager
                                            ? {
                                                label: formData.manager,
                                                value: formData.manager,
                                            }
                                            : null
                                    }
                                    onChange={(selected) =>
                                        handleChange("manager", selected ? selected.value : "")
                                    }
                                    placeholder="Search or add a manager..."
                                    isClearable
                                    isDisabled={isSubmitting}
                                    styles={{
                                        menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                                        menu: (base) => ({ ...base, zIndex: 9999 }),
                                    }}
                                    formatCreateLabel={(inputValue) => `Add "${inputValue}"`}
                                />
                            </div>

                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Project Sponsor
                                </label>
                                <CreatableSelect
                                    options={userOptions}
                                    value={
                                        formData.sponsor
                                            ? {
                                                label: formData.sponsor,
                                                value: formData.sponsor,
                                            }
                                            : null
                                    }
                                    onChange={(selected) =>
                                        handleChange("sponsor", selected ? selected.value : "")
                                    }
                                    placeholder="Search or add a sponsor..."
                                    isClearable
                                    isDisabled={isSubmitting}
                                    styles={{
                                        menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                                        menu: (base) => ({ ...base, zIndex: 9999 }),
                                    }}
                                    formatCreateLabel={(inputValue) => `Add "${inputValue}"`}
                                />
                            </div>

                            <div className="flex-none w-full">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Currency *</label>
                                <select
                                    value={formData.currency || ''}
                                    onChange={(e) => handleChange('currency', e.target.value)}
                                    disabled={isSubmitting}
                                    className={`w-full h-10 px-3 py-2 border rounded-md focus:ring-2 hover:border-green-500 disabled:opacity-50 disabled:cursor-not-allowed ${errors.currency ? 'border-red-500 focus:ring-red-200 focus:border-red-500' : 'border-gray-300 focus:ring-green-500 focus:border-green-500'}`}
                                    title={formData.currency || 'Select Currency'}
                                >
                                    <option value="">Select Currency</option>
                                    {currencies.map((currency) => (
                                        <option key={currency} value={currency}>
                                            {currency}
                                        </option>
                                    ))}
                                </select>
                                {errors.currency && <div className="text-xs text-red-600 mt-1">{errors.currency}</div>}
                            </div>

                            <div className="flex-none w-full">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Project Cost *</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        placeholder="Enter amount"
                                        value={formData.cost || ''}
                                        onChange={e => {
                                            let value = e.target.value.replace(/[^0-9.]/g, '');
                                            const parts = value.split('.');
                                            if (parts.length > 2) value = parts[0] + '.' + parts[1];
                                            if (parts[0].length > 13) parts[0] = parts[0].slice(0, 13);
                                            if (parts[1]) parts[1] = parts[1].slice(0, 2);
                                            value = parts[1] !== undefined ? parts[0] + '.' + parts[1] : parts[0];
                                            setFormData(prev => ({ ...prev, cost: value }));
                                        }}
                                        disabled={isSubmitting}
                                        className={`w-full h-10 px-3 py-2 pl-8 border rounded-md focus:ring-2 hover:border-green-500 disabled:opacity-50 disabled:cursor-not-allowed ${errors.cost ? 'border-red-500 focus:ring-red-200 focus:border-red-500' : 'border-gray-300 focus:ring-green-500 focus:border-green-500'}`}
                                        title={formData.cost || 'Enter Project Cost'}
                                        step="0.01"
                                    />
                                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                                        {formData.currency ? currencySymbols[formData.currency] : ''}
                                    </span>
                                </div>
                                {errors.cost && <div className="text-xs text-red-600 mt-1">{errors.cost}</div>}
                            </div>
                            {/* Business Value Amount */}
                            <div className="flex-none w-full">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Business Value Amount</label>
                                <input
                                    type="number"
                                    placeholder="Enter business value amount"
                                    value={formData.businessValueAmount || ''}
                                    onChange={e => {
                                        let value = e.target.value.replace(/[^0-9.]/g, '');
                                        const parts = value.split('.');
                                        if (parts.length > 2) value = parts[0] + '.' + parts[1];
                                        if (parts[0].length > 13) parts[0] = parts[0].slice(0, 13);
                                        if (parts[1]) parts[1] = parts[1].slice(0, 2);
                                        value = parts[1] !== undefined ? parts[0] + '.' + parts[1] : parts[0];
                                        setFormData(prev => ({ ...prev, businessValueAmount: value }));
                                    }}
                                    min="0"
                                    disabled={isSubmitting}
                                    className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md"
                                />
                            </div>
                            {/* Business Value Type */}
                            <div className="flex-none w-full">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Business Value Type</label>
                                <select
                                    value={formData.businessValueType || 'One Time'}
                                    onChange={e => setFormData({ ...formData, businessValueType: e.target.value })}
                                    disabled={isSubmitting}
                                    className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md"
                                >
                                    <option value="One Time">One Time</option>
                                    <option value="Yearly">Yearly</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-4 gap-4">
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Product Owner</label>
                                <CreatableSelect
                                    options={userOptions}
                                    value={formData.productOwner ? { label: formData.productOwner, value: formData.productOwner } : null}
                                    onChange={(selected) => handleChange('productOwner', selected?.value || '')}
                                    placeholder="Select or type name..."
                                    isClearable
                                    styles={{
                                        menuPortal: base => ({ ...base, zIndex: 9999 }),
                                        menu: base => ({ ...base, zIndex: 9999 })
                                    }}
                                    formatCreateLabel={(inputValue) => `Add "${inputValue}"`}
                                />
                            </div>
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Scrum Master</label>
                                <CreatableSelect
                                    options={userOptions}
                                    value={formData.scrumMaster ? { label: formData.scrumMaster, value: formData.scrumMaster } : null}
                                    onChange={(selected) => handleChange('scrumMaster', selected?.value || '')}
                                    placeholder="Select or type name..."
                                    isClearable
                                    styles={{
                                        menuPortal: base => ({ ...base, zIndex: 9999 }),
                                        menu: base => ({ ...base, zIndex: 9999 })
                                    }}
                                    formatCreateLabel={(inputValue) => `Add "${inputValue}"`}
                                />
                            </div>
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Architect</label>
                                <CreatableSelect
                                    options={userOptions}
                                    value={formData.architect ? { label: formData.architect, value: formData.architect } : null}
                                    onChange={(selected) => handleChange('architect', selected?.value || '')}
                                    placeholder="Select or type name..."
                                    isClearable
                                    styles={{
                                        menuPortal: base => ({ ...base, zIndex: 9999 }),
                                        menu: base => ({ ...base, zIndex: 9999 })
                                    }}
                                    formatCreateLabel={(inputValue) => `Add "${inputValue}"`}
                                />
                            </div>
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Chief Scrum Master</label>
                                <CreatableSelect
                                    options={userOptions}
                                    value={formData.chiefScrumMaster ? { label: formData.chiefScrumMaster, value: formData.chiefScrumMaster } : null}
                                    onChange={(selected) => handleChange('chiefScrumMaster', selected?.value || '')}
                                    placeholder="Select or type name..."
                                    isClearable
                                    styles={{
                                        menuPortal: base => ({ ...base, zIndex: 9999 }),
                                        menu: base => ({ ...base, zIndex: 9999 })
                                    }}
                                    formatCreateLabel={(inputValue) => `Add "${inputValue}"`}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-4 gap-4 mt-4">
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Leader</label>
                                <CreatableSelect
                                    options={userOptions}
                                    value={formData.deliveryLeader ? { label: formData.deliveryLeader, value: formData.deliveryLeader } : null}
                                    onChange={(selected) => handleChange('deliveryLeader', selected?.value || '')}
                                    placeholder="Select or type name..."
                                    isClearable
                                    styles={{
                                        menuPortal: base => ({ ...base, zIndex: 9999 }),
                                        menu: base => ({ ...base, zIndex: 9999 })
                                    }}
                                    formatCreateLabel={(inputValue) => `Add "${inputValue}"`}
                                />
                            </div>
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Business Unit Funded By</label>
                                <CreatableSelect
                                    options={userOptions}
                                    value={formData.businessUnitFundedBy ? { label: formData.businessUnitFundedBy, value: formData.businessUnitFundedBy } : null}
                                    onChange={(selected) => handleChange('businessUnitFundedBy', selected?.value || '')}
                                    placeholder="Select or type name..."
                                    isClearable
                                    styles={{
                                        menuPortal: base => ({ ...base, zIndex: 9999 }),
                                        menu: base => ({ ...base, zIndex: 9999 })
                                    }}
                                    formatCreateLabel={(inputValue) => `Add "${inputValue}"`}
                                />
                            </div>
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Business Unit Delivered To</label>
                                <CreatableSelect
                                    options={userOptions}
                                    value={formData.businessUnitDeliveredTo ? { label: formData.businessUnitDeliveredTo, value: formData.businessUnitDeliveredTo } : null}
                                    onChange={(selected) => handleChange('businessUnitDeliveredTo', selected?.value || '')}
                                    placeholder="Select or type name..."
                                    isClearable
                                    styles={{
                                        menuPortal: base => ({ ...base, zIndex: 9999 }),
                                        menu: base => ({ ...base, zIndex: 9999 })
                                    }}
                                    formatCreateLabel={(inputValue) => `Add "${inputValue}"`}
                                />
                            </div>
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Priority (1-10)</label>
                                <select
                                    value={formData.priority}
                                    onChange={e => handleChange('priority', Number(e.target.value))}
                                    disabled={isSubmitting}
                                    className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 hover:border-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {Array.from({ length: 10 }, (_, i) => (
                                        <option key={i + 1} value={i + 1}>
                                            {i + 1}
                                        </option>
                                    ))}
                                </select>
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
                                    <CreatableSelect
                                        options={systemOptions}
                                        value={(formData.systemImpacted || []).map(system => ({ label: system, value: system }))}
                                        onChange={(selected) => {
                                            console.log('Selected systems:', selected);
                                            handleChange('systemImpacted', selected?.map(s => s.value) || []);
                                        }}
                                        placeholder="Search for systems..."
                                        isClearable
                                        isMulti
                                        isSearchable
                                        styles={{
                                            menuPortal: base => ({ ...base, zIndex: 9999 }),
                                            menu: base => ({ ...base, zIndex: 9999 }),
                                            control: (base) => ({
                                                ...base,
                                                minHeight: '40px',
                                                fontSize: '14px'
                                            })
                                        }}
                                        formatCreateLabel={(inputValue) => `Add "${inputValue}"`}
                                        noOptionsMessage={() => "No systems found. Type to create new one."}
                                        loadingMessage={() => "Loading systems..."}
                                    />
                                    <div className="text-xs text-gray-600 mt-1">
                                        Enter System Name and press Enter to add the system.
                                    </div>
                                    {/* Debug info */}
                                    <div className="text-xs text-gray-500 mt-1">
                                        Available systems: {systemOptions.length} |
                                        Selected: {formData.systemImpacted?.length || 0}
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
                                                            disabled={isSubmitting}
                                                            onClick={() => {
                                                                if (!isSubmitting) {
                                                                    const updatedSystems = formData.systemImpacted.filter(s => s !== system);
                                                                    handleChange('systemImpacted', updatedSystems);
                                                                }
                                                            }}
                                                            className="ml-1 text-white hover:bg-white hover:bg-opacity-20 rounded p-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
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
                                className="px-8 py-2 bg-green-800 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center justify-center min-w-[140px]"
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                        Creating...
                                    </>
                                ) : (
                                    'Create Project'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Full Screen Overlay Loader */}
            {isSubmitting && (
                <div className="fixed inset-0 bg-black bg-opacity-60 z-[60] flex items-center justify-center">
                    <div className="bg-white rounded-lg p-8 shadow-2xl flex flex-col items-center">
                        <div className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mb-4"></div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">Creating Project</h3>
                        <p className="text-gray-600 text-center">Please wait while we create your project...</p>
                    </div>
                </div>
            )}
        </>
    );
};

export default AddProjectModal;