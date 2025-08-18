import React, { useEffect, useState, useRef } from 'react';
import { Calendar, Upload, User, FolderOpen, X, ChevronDown } from 'lucide-react';
import CreatableSelect from 'react-select/creatable';

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
                className={`relative w-full h-10 border rounded-md px-3 py-2 bg-white cursor-pointer flex items-center transition-colors ${
                    disabled 
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
                    title={displayValue }
                />
                <ChevronDown 
                    className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${
                        isOpen ? 'rotate-180' : ''
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
                                    className={`px-3 py-2 cursor-pointer flex items-center transition-colors ${
                                        isSelected 
                                            ? 'bg-green-100 text-green-800' 
                                            : 'hover:bg-green-50'
                                    }`}
                                    onClick={() => handleOptionSelect(option)
                                    }
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
    // Ensure formData is always defined and has default values
    const defaultFormData = {
        projectName: '',
        projectIcon: null,
        startDate: null,
        endDate: null,
        unit: 'USD',
        projectCost: 0,
        projectManager: null,
        sponsor: null,
        systemImpacted: [],
        productOwner: '',
    scrumMaster: '',
    architect: '',
    chiefScrumMaster: '',
    deliveryLeader: '',
    businessUnitFundedBy: '',
    businessUnitDeliveredTo: '',
    priority: 1
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
    priority: project.priority || 1
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
    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            setLocalFormData((prev) => ({ ...prev, projectIcon: URL.createObjectURL(file) }));
        }
    };
    const handleChange = (field, value) => {
        setLocalFormData((prev) => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSystemNameChange = (index, newName) => {
        const updatedSystems = [...localFormData.systemImpacted];
        const isNewSystem = !updatedSystems[index].systemId;

        if (isNewSystem) {
            const oldName = updatedSystems[index].systemName;
            const newSystemIndex = newSystems.findIndex((name) => name === oldName);
            if (newSystemIndex !== -1) {
                const updatedNewSystems = [...newSystems];
                updatedNewSystems[newSystemIndex] = newName;
                setNewSystems(updatedNewSystems);
            }
        }

        updatedSystems[index].systemName = newName;
        setLocalFormData((prev) => ({
            ...prev,
            systemImpacted: updatedSystems
        }));
    };

    const handleSystemAdd = (systemName) => {
        if (systemName.trim()) {
            setLocalFormData((prev) => ({
                ...prev,
                systemImpacted: [...(prev.systemImpacted || []), { systemId: null, systemName: systemName.trim() }]
            }));
        }
    };

    const handleSystemRemove = (index) => {
        const updatedSystems = [...localFormData.systemImpacted];
        const removedSystem = updatedSystems.splice(index, 1)[0];

        if (removedSystem.systemId) {
            setRemovedSystems((prev) => [...prev, removedSystem.systemId]);
        }

        setLocalFormData((prev) => ({
            ...prev,
            systemImpacted: updatedSystems
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
    priority: localFormData.priority
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

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg w-full max-w-5xl max-h-[90vh] overflow-auto shadow-xl">
                {/* Header */}
                <div className="bg-gray-50 border-b border-gray-200 py-4 px-6">
                    <h1 className="text-xl font-semibold text-green-800">Edit Project</h1>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {isLoading && (
                        <div className="flex items-center justify-center py-8">
                            <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                            <span className="ml-3 text-gray-600">Loading project data...</span>
                        </div>
                    )}

                    {!isLoading && (
                        <>
                            {/* Row 1: Project Name and Project Icon */}
                            <div className="grid grid-cols-4 gap-6">
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="Enter a descriptive project name"
                                            value={localFormData.projectName || ''}
                                            onChange={(e) => handleChange('projectName', e.target.value)}
                                            className="w-full h-10 px-3 py-2 pl-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 hover:border-green-500"
                                            title={localFormData.projectName}
                                        />
                                        <FolderOpen className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-green-800" />
                                    </div>
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
                            </div>

                            {/* Row 3: Project Manager and Sponsor */}
                            <div className="grid grid-cols-4 gap-6">
                                <Dropdown
                                    options={users}
                                    value={localFormData.projectManager}
                                    onChange={(user) => handleChange('projectManager', user)}
                                    label="Project Manager"
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
                                    label="Project Sponsor"
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
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Project Cost</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            placeholder="Enter amount"
                                            value={localFormData.projectCost || ''}
                                            onChange={(e) => {
                                                // Accept only up to two decimal places
                                                let value = e.target.value;
                                                value = value.replace(/[^\d.]/g, "");
                                                if (value.includes(".")) {
                                                    const [intPart, decPart] = value.split(".");
                                                    value = intPart + "." + (decPart.substring(0, 2));
                                                }
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
                                        options={userOptions}
                                        value={localFormData.businessUnitFundedBy ? { label: localFormData.businessUnitFundedBy, value: localFormData.businessUnitFundedBy } : null}
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
                                        options={userOptions}
                                        value={localFormData.businessUnitDeliveredTo ? { label: localFormData.businessUnitDeliveredTo, value: localFormData.businessUnitDeliveredTo } : null}
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
                                

                                
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Add System</label>
                                    <input
                                        type="text"
                                        placeholder="Add a new system and press Enter"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && e.target.value.trim()) {
                                                e.preventDefault();
                                                handleSystemAdd(e.target.value);
                                                e.target.value = '';
                                            }
                                        }}
                                        className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 hover:border-green-500"
                                        title={localFormData.systemImpacted || "N/A"}
                                    />
                                </div>

                                
                            </div>

                            {/* Systems Impacted */}
                            <div>
                                <h3 className="text-base font-semibold text-gray-700 mb-3">Systems Impacted</h3>
                                <div className="min-h-16 max-h-32 overflow-y-auto p-2 border border-gray-200 rounded-md bg-gray-50">
                                    <div className="flex flex-wrap gap-2">
                                        {localFormData.systemImpacted?.length > 0 ? (
                                            localFormData.systemImpacted.map((system, index) => (
                                                <div
                                                    key={index}
                                                    className="flex items-center gap-1 bg-green-100 border border-green-300 rounded-full px-3 py-1"
                                                >
                                                    <input
                                                        type="text"
                                                        value={system.systemName}
                                                        onChange={(e) => handleSystemNameChange(index, e.target.value)}
                                                        className="bg-transparent border-none outline-none text-sm min-w-20"
                                                        style={{ width: `${Math.max(80, system.systemName.length * 8)}px` }}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => handleSystemRemove(index)}
                                                        className="w-5 h-5 flex items-center justify-center text-gray-600 hover:text-red-600 hover:bg-red-100 rounded-full transition-colors"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            ))
                                        ) : (
                                            <span className="text-gray-500 italic text-sm">No systems added yet</span>
                                        )}
                                    </div>
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
                                        'Update Project'
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