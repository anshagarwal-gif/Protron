import React, { useEffect, useState, useRef } from 'react';
import { Calendar, Upload, User, FolderOpen, X, ChevronDown } from 'lucide-react';
import axios from 'axios';
import CreatableSelect from 'react-select/creatable';

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

// Enhanced Dropdown Component with better functionality
const Dropdown = ({
    options = [],
    value,
    onChange,
    placeholder = "Select an option",
    label,
    icon: Icon,
    getOptionLabel = (option) => option?.toString() || '',
    getOptionValue = (option) => option,
    disabled = false,
    className = ""
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const dropdownRef = useRef(null);
    const inputRef = useRef(null);

    // Filter options based on search term
    const filteredOptions = options.filter(option => {
        const label = getOptionLabel(option);
        return label.toLowerCase().includes(searchTerm.toLowerCase());
    });

    // Find selected option
    const selectedOption = options.find(option => {
        const optionValue = getOptionValue(option);
        return JSON.stringify(optionValue) === JSON.stringify(value);
    });

    // Handle click outside to close dropdown
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

    const handleInputClick = () => {
        if (!disabled) {
            setIsOpen(true);
            setTimeout(() => inputRef.current?.focus(), 0);
        }
    };

    const handleOptionSelect = (option) => {
        onChange(getOptionValue(option));
        setIsOpen(false);
        setSearchTerm('');
    };

    const displayValue = isOpen ? searchTerm : (selectedOption ? getOptionLabel(selectedOption) : '');

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            {label && (
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    {label}
                </label>
            )}
            <div
                className={`relative w-full h-10 border rounded-md px-3 py-2 bg-white cursor-pointer flex items-center transition-colors ${disabled
                    ? 'bg-gray-100 cursor-not-allowed border-gray-300'
                    : isOpen
                        ? 'border-green-600 ring-2 ring-green-200'
                        : 'border-gray-300 hover:border-green-500'
                    }`}
                onClick={handleInputClick}
            >
                {Icon && <Icon className="w-5 h-5 text-green-800 mr-2 flex-shrink-0" />}
                <input
                    ref={inputRef}
                    type="text"
                    className=" outline-none bg-transparent cursor-pointer text-sm"
                    placeholder={placeholder}
                    value={displayValue}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={() => setIsOpen(true)}
                    disabled={disabled}
                    readOnly={!isOpen}
                    title={displayValue}
                />
                <ChevronDown
                    className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''
                        }`}
                />
            </div>

            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                    {filteredOptions.length > 0 ? (
                        filteredOptions.map((option, index) => {
                            const optionValue = getOptionValue(option);
                            const isSelected = JSON.stringify(optionValue) === JSON.stringify(value);

                            return (
                                <div
                                    key={index}
                                    className={`px-3 py-2 cursor-pointer flex items-center transition-colors ${isSelected
                                        ? 'bg-green-100 text-green-800'
                                        : 'hover:bg-green-50'
                                        }`}
                                    onClick={() => handleOptionSelect(option)}
                                >
                                    {option.name && (
                                        <div className="w-6 h-6 rounded-full bg-green-800 text-white text-xs flex items-center justify-center mr-2 flex-shrink-0">
                                            {option.name.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                    <span className="text-sm">{getOptionLabel(option)}</span>
                                </div>
                            );
                        })
                    ) : (
                        <div className="px-3 py-2 text-gray-500 text-sm">No options found</div>
                    )}
                </div>
            )}
        </div>
    );
};

// Date Picker Component
const DatePicker = ({ label, value, onChange, icon: Icon, className = "" }) => {
    const inputRef = useRef(null);

    const formatDateForInput = (date) => {
        if (!date) return '';
        const d = new Date(date);
        return d.toISOString().split('T')[0];
    };

    const handleDateChange = (e) => {
        const dateValue = e.target.value;
        if (dateValue) {
            const isoString = new Date(dateValue).toISOString();
            onChange(isoString);
        } else {
            onChange(null);
        }
    };
    const handleDateInputClick = (inputName) => {
        if (inputRef.current) {
            inputRef.current.showPicker?.(); // Safe call in case browser doesn't support it
        }
    };

    return (
        <div className={className}>
            {label && (
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    {label}
                </label>
            )}
            <div className="relative" onClick={handleDateInputClick}>
                <input
                    ref={inputRef}
                    name="date-picker"
                    type="date"
                    value={formatDateForInput(value)}
                    onChange={handleDateChange}
                    className="w-full h-10 px-3 py-2 pl-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 hover:border-green-500 text-sm"
                    title={formatDateForInput(value)}
                />
                {Icon && (
                    <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-green-800" />
                )}
            </div>
        </div>
    );
};

// Main Edit Project Modal Component
const EditProjectModal = ({ open, onClose, onSubmit, formData, setFormData, projectId }) => {
    const [users, setUsers] = useState([]);
    const [initialFormData, setInitialFormData] = useState({});
    const [newSystems, setNewSystems] = useState([]);
    const [removedSystems, setRemovedSystems] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [systems, setSystems] = useState([]);
    const [submitting, isSubmitting] = useState(false);
    // Ensure formData is always defined and has default values
    const defaultFormData = {
        projectName: '',
        startDate: null,
        endDate: null,
        unit: 'USD',
        projectCost: 0,
        projectManager: null,
        sponsor: null,
        systemImpacted: [],
        productOwner: '',
        businessValueAmount: '',
        businessValueType: 'One Time',
        priority: 1,
    };
    // Local state for form data to ensure controlled inputs
    const [localFormData, setLocalFormData] = useState(defaultFormData);

    // Sync localFormData with fetched project data when modal opens or projectId changes
    useEffect(() => {
        if (open && formData && Object.keys(formData).length > 0) {
            setLocalFormData(formData);
        } else if (open) {
            setLocalFormData(defaultFormData);
        }
    }, [open, formData, projectId]);


    // Mock users data - replace with your actual fetch
    const systemOptions = systems.map((system) => ({
        value: system.systemName,
        label: system.systemName,
    }));

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
        fetchSystems();
    }, []);

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
        fetchUsers();
    }, []);

    const fetchProjectData = async () => {
        if (!projectId || users.length === 0) return;

        try {
            setIsLoading(true);
            // Replace with your actual fetch implementation
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/projects/${projectId}`, {
                headers: { Authorization: `${sessionStorage.getItem('token')}` }
            });
            const data = await response.json();

            const { project, systemsImpacted, teamMembers } = data;
            const manager = users.find(user => user.userId === project.managerId);
            const sponsor = users.find(user => user.userId === project.sponsorId);

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
                systemImpacted: systemsImpacted?.map(system => ({
                    systemId: system.systemId || null,
                    systemName: system.systemName || ''
                })) || [],
                productOwner: project.productOwner || '',
                scrumMaster: project.scrumMaster || '',
                architect: project.architect || '',
                chiefScrumMaster: project.chiefScrumMaster || '',
                deliveryLeader: project.deliveryLeader || '',
                businessUnitFundedBy: project.businessUnitFundedBy || '',
                businessUnitDeliveredTo: project.businessUnitDeliveredTo || '',
                priority: project.priority || 1,
                businessValueAmount: project.businessValueAmount || 0,
                businessValueType: project.businessValueType || 'One Time'
            };
            setLocalFormData(projectData);
            setInitialFormData(projectData);
        } catch (error) {
            console.error('Error fetching project data:', error);
        } finally {
            setIsLoading(false);
        }
    };
    useEffect(() => {
        if (open && projectId && users.length > 0) {
            fetchProjectData();
        }
    }, [open, projectId, users]);
    const handleChange = (field, value) => {
        setLocalFormData((prev) => ({
            ...prev,
            [field]: value
        }));
    };


    const handleSubmit = async () => {
        setIsLoading(true);


        const updatedSystemImpacted = localFormData.systemImpacted.map((system) => ({
            systemId: system.systemId || null,
            systemName: system.systemName,
        }));

        const payload = {
            projectName: localFormData.projectName,
            projectIcon: localFormData.projectIcon || null,
            startDate: localFormData.startDate,
            endDate: localFormData.endDate,
            projectCost: localFormData.projectCost || 0,
            projectManagerId: localFormData.projectManager?.userId || null,
            sponsorId: localFormData.sponsor?.userId || null,
            unit: localFormData.unit || 'USD',
            systemImpacted: updatedSystemImpacted,
            removedSystems: removedSystems,
            productOwner: localFormData.productOwner,
            scrumMaster: localFormData.scrumMaster,
            architect: localFormData.architect,
            chiefScrumMaster: localFormData.chiefScrumMaster,
            deliveryLeader: localFormData.deliveryLeader,
            businessUnitFundedBy: localFormData.businessUnitFundedBy,
            businessUnitDeliveredTo: localFormData.businessUnitDeliveredTo,
            priority: localFormData.priority,
            businessValueAmount: localFormData.businessValueAmount || 0,
            businessValueType: localFormData.businessValueType || 'One Time'
        };

        try {
            // Replace with your actual fetch implementation
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/projects/edit/${projectId}`, {
                method: 'PUT',
                headers: {
                    Authorization: `${sessionStorage.getItem('token')}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });

            const result = await response.json();
            console.log('Project updated successfully:', result);
            onSubmit(result.projectId);
        } catch (error) {
            console.error('Error updating project:', error);
            setErrors({
                submit: `Failed to update initiative`
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleReset = () => {
        setLocalFormData({ ...initialFormData });
        setNewSystems([]);
        setRemovedSystems([]);
    };

    if (!open) return null;

    // Convert users data to select options
    const userOptions = users.map((user) => ({
        value: user.name,
        label: user.name,
    }));

    // Business Unit options
    const businessUnitOptions = [
        { value: 'finance', label: 'Finance' },
        { value: 'it', label: 'IT' },
        { value: 'product', label: 'Product' },
        { value: 'production', label: 'Production' },
        { value: 'sales', label: 'Sales' },
        { value: 'engineering', label: 'Engineering' }
    ];

    return (
        <div className="fixed inset-0 bg-[#00000059] bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg w-full max-w-5xl max-h-[90vh] overflow-auto shadow-xl">
                {/* Header */}
                <div className="bg-gray-50 border-b border-gray-200 py-4 px-6">
                    <h1 className="text-xl font-semibold text-green-800">Edit Initiative</h1>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {isLoading && (
                        <div className="flex items-center justify-center py-8">
                            <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                            <span className="ml-3 text-gray-600">Loading initiative data...</span>
                        </div>
                    )}

                    {!isLoading && (
                        <>
                            {/* Row 1: Project Name and Project Icon */}
                            <div className="grid grid-cols-4 gap-6">
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Initiative name
                                        <span className="float-right text-xs text-gray-500">{localFormData.projectName?.length || 0}/100 characters</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={localFormData.projectName}
                                        onChange={e => handleChange('projectName', e.target.value.slice(0, 100))}
                                        maxLength={100}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                                        placeholder="Enter initiative name"
                                        required
                                    />
                                </div>

                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Project Icon</label>
                                    <div className="h-10 border-2 border-dashed border-gray-300 rounded-md bg-gray-50 flex items-center justify-center">
                                        {localFormData.projectIcon ? (
                                            <div className="flex items-center gap-2">
                                                <img
                                                    src={localFormData.projectIcon}
                                                    alt="Project Icon"
                                                    className="w-10 h-10 rounded-full object-cover"
                                                />
                                                <label className="px-3 py-1 text-sm border border-green-800 text-green-800 rounded hover:bg-green-50 cursor-pointer">
                                                    Change
                                                    <input hidden accept="image/*" type="file" onChange={handleImageUpload} title={localFormData.projectIcon} />
                                                </label>
                                            </div>
                                        ) : (
                                            <label className="flex items-center gap-2 px-3 py-1 text-sm border border-green-800 text-green-800 rounded hover:bg-green-50 cursor-pointer">
                                                <Upload className="w-4 h-4" />
                                                Project Icon
                                                <input hidden accept="image/*" type="file" onChange={handleImageUpload} />
                                            </label>
                                        )}
                                    </div>
                                </div>
                                <DatePicker
                                    label="Project Start Date"
                                    value={localFormData.startDate}
                                    onChange={(value) => handleChange('startDate', value)}
                                    icon={Calendar}
                                    className="flex-1"
                                />
                                <DatePicker
                                    label="Project End Date"
                                    value={localFormData.endDate}
                                    onChange={(value) => handleChange('endDate', value)}
                                    icon={Calendar}
                                    className="flex-1"
                                />
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Business Value Amount</label>
                                    <input
                                        type="number"
                                        className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md"
                                        value={localFormData.businessValueAmount || ''}
                                        onChange={e => {
                                            let value = e.target.value.replace(/[^0-9.]/g, '');
                                            const parts = value.split('.');
                                            if (parts.length > 2) value = parts[0] + '.' + parts[1];
                                            if (parts[0].length > 13) parts[0] = parts[0].slice(0, 13);
                                            if (parts[1]) parts[1] = parts[1].slice(0, 2);
                                            value = parts[1] !== undefined ? parts[0] + '.' + parts[1] : parts[0];
                                            setLocalFormData(prev => ({ ...prev, businessValueAmount: value }));
                                        }}
                                        placeholder="Enter business value amount"
                                        min="0"
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Business Value Type</label>
                                    <select
                                        className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md"
                                        value={localFormData.businessValueType || 'One Time'}
                                        onChange={e => setLocalFormData({ ...localFormData, businessValueType: e.target.value })}
                                    >
                                        <option value="One Time">One Time</option>
                                        <option value="Yearly">Yearly</option>
                                    </select>
                                </div>
                            </div>

                            {/* Row 3: Initiative Manager and Sponsor */}
                            <div className="grid grid-cols-4 gap-6">
                                <Dropdown
                                    options={users}
                                    value={localFormData.projectManager}
                                    onChange={(user) => handleChange('projectManager', user)}
                                    label="Initiative Manager"
                                    placeholder="Search for a manager..."
                                    icon={User}
                                    getOptionLabel={(option) => option?.name || ''}
                                    getOptionValue={(option) => option}
                                    className="flex-1"
                                />
                                <Dropdown
                                    options={users}
                                    value={localFormData.sponsor}
                                    onChange={(user) => handleChange('sponsor', user)}
                                    label="Initiative Sponsor"
                                    placeholder="Search for a sponsor..."
                                    icon={User}
                                    getOptionLabel={(option) => option?.name || ''}
                                    getOptionValue={(option) => option}
                                    className=""
                                />
                                <div className="w-full">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                                    <select
                                        value={localFormData.unit || 'USD'}
                                        onChange={(e) => handleChange('unit', e.target.value)}
                                        className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 hover:border-green-500"
                                        title={localFormData.unit}
                                    >
                                        {currencies.map((currency) => (
                                            <option key={currency} value={currency}>
                                                {currency}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="w-full">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Initiative Cost</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            placeholder="Enter amount"
                                            value={localFormData.projectCost || ''}
                                            onChange={e => {
                                                let value = e.target.value.replace(/[^0-9.]/g, '');
                                                const parts = value.split('.');
                                                if (parts.length > 2) value = parts[0] + '.' + parts[1];
                                                if (parts[0].length > 13) parts[0] = parts[0].slice(0, 13);
                                                if (parts[1]) parts[1] = parts[1].slice(0, 2);
                                                value = parts[1] !== undefined ? parts[0] + '.' + parts[1] : parts[0];
                                                handleChange('projectCost', value);
                                            }}
                                            className="w-full h-10 px-3 py-2 pl-8 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 hover:border-green-500"
                                            title={localFormData.projectCost}
                                            step="0.01"
                                        />
                                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                                            {currencySymbols[localFormData.unit] || ''}
                                        </span>
                                    </div>
                                </div>

                            </div>
                            <div className="grid grid-cols-4 gap-4 mt-4">
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Product Owner</label>
                                    <CreatableSelect
                                        options={userOptions}
                                        value={localFormData.productOwner ? { label: localFormData.productOwner, value: localFormData.productOwner } : null}
                                        onChange={(selected) => handleChange('productOwner', selected?.value || '')}
                                        placeholder="Select or type name..."
                                        isClearable
                                        styles={{
                                            menuPortal: base => ({ ...base, zIndex: 9999 }),
                                            menu: base => ({ ...base, zIndex: 9999, maxHeight: 200, overflowY: 'auto', pointerEvents: 'auto' })
                                        }}
                                        formatCreateLabel={(inputValue) => `Add "${inputValue}"`}
                                        menuPortalTarget={document.body}
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Scrum Master</label>
                                    <CreatableSelect
                                        options={userOptions}
                                        value={localFormData.scrumMaster ? { label: localFormData.scrumMaster, value: localFormData.scrumMaster } : null}
                                        onChange={(selected) => handleChange('scrumMaster', selected?.value || '')}
                                        placeholder="Select or type name..."
                                        isClearable
                                        styles={{
                                            menuPortal: base => ({ ...base, zIndex: 9999 }),
                                            menu: base => ({ ...base, zIndex: 9999, maxHeight: 200, overflowY: 'auto', pointerEvents: 'auto' })
                                        }}
                                        formatCreateLabel={(inputValue) => `Add "${inputValue}"`}
                                        menuPortalTarget={document.body}
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Architect</label>
                                    <CreatableSelect
                                        options={userOptions}
                                        value={localFormData.architect ? { label: localFormData.architect, value: localFormData.architect } : null}
                                        onChange={(selected) => handleChange('architect', selected?.value || '')}
                                        placeholder="Select or type name..."
                                        isClearable
                                        styles={{
                                            menuPortal: base => ({ ...base, zIndex: 9999 }),
                                            menu: base => ({ ...base, zIndex: 9999, maxHeight: 200, overflowY: 'auto', pointerEvents: 'auto' })
                                        }}
                                        formatCreateLabel={(inputValue) => `Add "${inputValue}"`}
                                        menuPortalTarget={document.body}
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Chief Scrum Master</label>
                                    <CreatableSelect
                                        options={userOptions}
                                        value={localFormData.chiefScrumMaster ? { label: localFormData.chiefScrumMaster, value: localFormData.chiefScrumMaster } : null}
                                        onChange={(selected) => handleChange('chiefScrumMaster', selected?.value || '')}
                                        placeholder="Select or type name..."
                                        isClearable
                                        styles={{
                                            menuPortal: base => ({ ...base, zIndex: 9999 }),
                                            menu: base => ({ ...base, zIndex: 9999, maxHeight: 200, overflowY: 'auto', pointerEvents: 'auto' })
                                        }}
                                        formatCreateLabel={(inputValue) => `Add "${inputValue}"`}
                                        menuPortalTarget={document.body}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-4 gap-4 mt-4">
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Leader</label>
                                    <CreatableSelect
                                        options={userOptions}
                                        value={localFormData.deliveryLeader ? { label: localFormData.deliveryLeader, value: localFormData.deliveryLeader } : null}
                                        onChange={(selected) => handleChange('deliveryLeader', selected?.value || '')}
                                        placeholder="Select or type name..."
                                        isClearable
                                        styles={{
                                            menuPortal: base => ({ ...base, zIndex: 9999 }),
                                            menu: base => ({ ...base, zIndex: 9999, maxHeight: 200, overflowY: 'auto', pointerEvents: 'auto' })
                                        }}
                                        formatCreateLabel={(inputValue) => `Add "${inputValue}"`}
                                        menuPortalTarget={document.body}
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Business Unit Funded By</label>
                                    <CreatableSelect
                                        options={businessUnitOptions}
                                        value={localFormData.businessUnitFundedBy ? businessUnitOptions.find(u => u.label.toLowerCase() === localFormData.businessUnitFundedBy.toLowerCase() || u.value.toLowerCase() === localFormData.businessUnitFundedBy.toLowerCase()) || { value: localFormData.businessUnitFundedBy, label: localFormData.businessUnitFundedBy } : null}
                                        onChange={(selected) => handleChange('businessUnitFundedBy', selected?.value || '')}
                                        placeholder="Select or type name..."
                                        isClearable
                                        styles={{
                                            menuPortal: base => ({ ...base, zIndex: 9999 }),
                                            menu: base => ({ ...base, zIndex: 9999, maxHeight: 200, overflowY: 'auto', pointerEvents: 'auto' })
                                        }}
                                        formatCreateLabel={(inputValue) => `Add "${inputValue}"`}
                                        menuPortalTarget={document.body}
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Business Unit Delivered To</label>
                                    <CreatableSelect
                                        options={businessUnitOptions}
                                        value={localFormData.businessUnitDeliveredTo ? businessUnitOptions.find(u => u.label.toLowerCase() === localFormData.businessUnitDeliveredTo.toLowerCase() || u.value.toLowerCase() === localFormData.businessUnitDeliveredTo.toLowerCase()) || { value: localFormData.businessUnitDeliveredTo, label: localFormData.businessUnitDeliveredTo } : null}
                                        onChange={(selected) => handleChange('businessUnitDeliveredTo', selected?.value || '')}
                                        placeholder="Select or type name..."
                                        isClearable
                                        styles={{
                                            menuPortal: base => ({ ...base, zIndex: 9999 }),
                                            menu: base => ({ ...base, zIndex: 9999, maxHeight: 200, overflowY: 'auto', pointerEvents: 'auto' })
                                        }}
                                        formatCreateLabel={(inputValue) => `Add "${inputValue}"`}
                                        menuPortalTarget={document.body}
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Priority (1-10)
                                    </label>
                                    <select
                                        value={localFormData.priority}
                                        onChange={e => handleChange('priority', e.target.value)}
                                        className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md"
                                    >
                                        {[...Array(10)].map((_, i) => (
                                            <option key={i + 1} value={i + 1}>
                                                {i + 1}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Row 4: Currency, Cost, and Add System */}
                            <div className="flex gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Add Systems Impacted</label>
                                    <CreatableSelect
                                        options={systemOptions}
                                        value={(localFormData.systemImpacted || []).map(system => ({
                                            label: system.systemName,
                                            value: system.systemName,
                                            systemId: system.systemId || null
                                        }))}
                                        onChange={(selected) => {
                                            const updated = selected?.map(s => ({
                                                systemId: s.systemId || null,
                                                systemName: s.value
                                            })) || [];
                                            handleChange('systemImpacted', updated);
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
                                        Selected: {localFormData.systemImpacted?.length || 0}
                                    </div>

                                    {/* Display added systems */}
                                    {localFormData.systemImpacted?.length > 0 && (
                                        <div className="mt-2 p-2 border border-green-800 rounded-md bg-white overflow-auto">
                                            <div className="text-xs text-gray-600 mb-2">
                                                Added Systems Impacted ({localFormData.systemImpacted.length})
                                            </div>
                                            <div className="flex flex-wrap gap-1">
                                                {localFormData.systemImpacted.map((system, index) => (
                                                    <div
                                                        key={index}
                                                        className="flex items-center bg-green-700 text-white rounded px-2 py-1 text-sm"
                                                    >
                                                        <span className="truncate flex-1 text-xs">{system.systemName}</span>
                                                        <button
                                                            type="button"
                                                            disabled={isSubmitting}
                                                            onClick={() => {
                                                                if (!isSubmitting) {
                                                                    const updatedSystems = localFormData.systemImpacted.filter((s, i) => i !== index);
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


                            {/* Action Buttons */}
                            <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
                                <button
                                    onClick={onClose}
                                    disabled={isLoading}
                                    className="px-6 py-2 border border-green-800 text-green-800 rounded hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleReset}
                                    disabled={isLoading}
                                    className="px-6 py-2 border border-green-800 text-green-800 rounded hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Reset
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={isLoading}
                                    className="px-8 py-2 bg-green-800 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed w-48 font-semibold flex items-center justify-center"
                                >
                                    {isLoading ? (
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        'Update Initiative'
                                    )}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EditProjectModal;