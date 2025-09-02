import React, { useEffect, useState, useRef } from 'react';
import Select from 'react-select';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import CreatableSelect from 'react-select/creatable';
import {
    X,
    Calendar,
    Folder,
    User,
    Building,
    DollarSign,
    Plus,
    Trash2,
    Upload,
    FileText,
    Edit2,
    UserCheck
} from 'lucide-react';
import AddMilestoneModal from './AddMilestoneModal'; // Import the AddMilestoneModal
import OrganizationSelect from './OrganizationSelect'; // Import OrganizationSelect
import axios from 'axios';
import GlobalSnackbar from './GlobalSnackbar';

// Currency symbols mapping
const currencySymbols = {
    USD: '$',
    INR: '₹',
    EUR: '€',
    GBP: '£',
    JPY: '¥'
};

const AddPOModal = ({ open, onClose, onSubmit }) => {
    if (!open) return null;
    const [poId, setPoId] = useState(null); // Store the created PO ID
    const [formData, setFormData] = useState({
        poNumber: '',
        poType: '',
        poAmount: '',
        currency: 'USD',
        customerName: '',
        sponsorName: '',
        sponsorLob: '',
        budgetLineItem: '',
        budgetLineAmount: '',
        budgetLineRemarks: '',
        businessValueAmount: '',
        businessValueType: '',
        poCountry: '',
        supplierName: sessionStorage.getItem('tenantName') || '',
        projectName: '',
        spocName: '',
        startDate: '',
        endDate: '',
        projectDescription: '',
        milestones: []
    });

    const [users, setUsers] = useState([]);
    const StartDateInputRef = useRef(null);
    const EndDateInputRef = useRef(null);
    const [projects, setProjects] = useState([]);
    const [budgetLineOptions, setBudgetLineOptions] = useState([]);
    const poNumberCharCount = formData.poNumber.length;
    const [countries, setCountries] = useState([]);
    const [poFiles, setPoFiles] = useState([]);
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success'
    })
    const [error, setError] = useState({})
    const [fieldErrors, setFieldErrors] = useState({})

    const fetchUsers = async () => {
        try {
            const token = sessionStorage.getItem('token');
            const tenantId = sessionStorage.getItem('tenantId');
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/tenants/${tenantId}/users`, {
                headers: { Authorization: `${token}` }
            });
            const data = await res.json();
            setUsers(data);
        } catch (error) {
            console.error('Error fetching users:', error);
            setError({
                submit:"Error fetching users"
            })
        }
    };

    const fetchProjects = async () => {
        try {
            const token = sessionStorage.getItem('token');
            const tenantId = sessionStorage.getItem('tenantId');
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/tenants/${tenantId}/projects`, {
                headers: { Authorization: `${token}` }
            });
            setProjects(res.data);
        } catch (error) {
            console.error('Error fetching projects:', error);
            setError({
                submit:"Error fetching projects"
            })
        }
    };
    const fetchBudgetLines = async () => {
        try {
            const token = sessionStorage.getItem('token');
            const tenantId = sessionStorage.getItem('tenantId');
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/budget-lines/tenant/${tenantId}`, {
                headers: { Authorization: `${token}` }
            });
            const data = Array.isArray(res.data) ? res.data : [];
            const opts = data.map(bl => ({
                label: `${bl.budgetName} (${bl.currency || ''} ${bl.amountApproved})`,
                value: bl.budgetName,
                amountApproved: bl.amountApproved,
                currency: bl.currency || 'USD'
            }));
            setBudgetLineOptions(opts);
        } catch (error) {
            console.error('Error fetching budget lines:', error);
        }
    };
    const fetchCountries = async () => {
        try {
            const response = await axios.get(`https://secure.geonames.org/countryInfoJSON?&username=bhagirathauti`);
            const countriesData = response.data.geonames.map(country => ({
                code: country.countryCode,
                name: country.countryName,
                geonameId: country.geonameId
            })).sort((a, b) => a.name.localeCompare(b.name))

            setCountries(countriesData);
        } catch (error) {
            console.error("Failed to fetch countries:", error);
            setError({
                submit:"Failed to fetch countries"
            })
        }
    };
    useEffect(() => {
        if (open) {
            fetchUsers();
            fetchProjects();
            fetchBudgetLines();
            fetchCountries();
        }
    }, [open]);

    const projectOptions = projects.map((project) => ({
        value: project.projectName,
        label: project.projectName,
    }));

    const userOptions = users.map((user) => ({
        value: user.name,
        label: user.name,
    }));

    const handleChange = (field) => (event) => {
        setFormData((prev) => ({
            ...prev,
            [field]: event.target.value
        }));
    };

    // Handler for customer organization selection with full details
    const handleCustomerOrgSelect = (orgData) => {
        if (orgData && orgData.length > 0) {
            const org = orgData[0]; // Single selection
            // You can add customer-specific fields here if needed in the future
            console.log('Customer organization selected:', org);
        }
    };

    // Handler for supplier organization selection with full details
    const handleSupplierOrgSelect = (orgData) => {
        if (orgData && orgData.length > 0) {
            const org = orgData[0]; // Single selection
            // You can add supplier-specific fields here if needed in the future
            console.log('Supplier organization selected:', org);
        }
    };

    const handleFileChange = (e) => {
        const selectedFiles = Array.from(e.target.files);
        if (selectedFiles.length === 0) return;

        const totalFiles = poFiles.length + selectedFiles.length;
        if (totalFiles > 4) {
            setSnackbar({
                open: true,
                message: `Maximum 4 attachments allowed. You already selected ${poFiles.length}.`,
                severity: "error"
            });
            e.target.value = null; // reset file input
            return;
        }

        setPoFiles((prevFiles) => [...prevFiles, ...selectedFiles]);
        e.target.value = null; // reset file input
    };


    


    const handleMilestoneSubmit = (milestoneData) => {
        console.log("Milestone Data Submitted:", milestoneData);
        if (editingMilestone !== null) {
            const updatedMilestones = [...formData.milestones];
            updatedMilestones[editingMilestone] = milestoneData;
            setFormData((prev) => ({
                ...prev,
                milestones: updatedMilestones
            }));
        } else {
            setFormData((prev) => ({
                ...prev,
                milestones: [...prev.milestones, milestoneData]
            }));
        }
        setMilestoneModalOpen(false);
        setEditingMilestone(null);
    };

    const handleRemoveMilestone = async (index) => {
        const milestoneToRemove = formData.milestones[index];
        try {
            const token = sessionStorage.getItem('token');
            console.log('Removing milestone:', milestoneToRemove);
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/po-milestone/delete/${milestoneToRemove.msId}`, {
                method: 'DELETE',
                headers: { Authorization: `${token}` }
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Error deleting milestone:', errorData);
                setSnackbar({
                    open: true,
                    message: "Error deleting milestone",
                    severity: "error"
                });
                return;
            }

            setFormData((prev) => ({
                ...prev,
                milestones: prev.milestones.filter((_, i) => i !== index)
            }));
            setSnackbar({
                open: true,
                message: 'Milestone deleted successfully!',
                severity: 'success'
            });
        } catch (error) {
            console.error('Error deleting milestone:', error);
            setError({
                submit:"Error deleting milestone"
            })
        }
    };

    const validateRequired = () => {
        const errs = {};
        if (!formData.poNumber || !formData.poNumber.trim()) {
            errs.poNumber = 'PO Number is required';
        }
        if (!formData.poType || !formData.poType.trim()) {
            errs.poType = 'PO Type is required';
        }
        if (!formData.poAmount || isNaN(Number(formData.poAmount)) || Number(formData.poAmount) <= 0) {
            errs.poAmount = 'PO Amount must be greater than 0';
        }
        setFieldErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleCreatePO = async () => {
        if (!validateRequired()) {
            setSnackbar({ open: true, message: 'Please fill all required fields.', severity: 'error' });
            return;
        }
        try {
            const poPayload = {
                poNumber: formData.poNumber,
                poType: formData.poType,
                poDesc: formData.projectDescription || '',
                poAmount: parseFloat(formData.poAmount) || 0,
                poCurrency: formData.currency,
                poSpoc: formData.spocName,
                supplier: formData.supplierName,
                customer: formData.customerName,
                sponsorName: formData.sponsorName || '',
                budgetLineItem: formData.budgetLineItem || '',
                budgetLineAmount: formData.budgetLineAmount || '',
                budgetLineRemarks: formData.budgetLineRemarks || '',
                poCountry: formData.poCountry || '',
                businessValueAmount: parseFloat(formData.businessValueAmount) || 0,
                businessValueType: formData.businessValueType || '',
                sponsorLob: formData.sponsorLob || '',
                projectName: formData.projectName,
                poStartDate: formData.startDate || null,
                poEndDate: formData.endDate || null
            };

            const token = sessionStorage.getItem('token');
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/po/add`, {
                method: 'POST',
                headers: {
                    Authorization: `${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(poPayload)
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('PO Creation Error:', errorData);
                setSnackbar({
                    open: true,
                    message: "Failed to create PO",
                    severity: "error"
                })
                return;
            }

            const poData = await response.json();
            const poId = poData.poId || poData.id;
            setPoId(poId);

            if (poFiles.length > 4) {
                setSnackbar({
                    open: true,
                    message: "You can attach a maximum of 4 files at once.",
                    severity: "error"
                });
                setError({
                    submit:"You can attach a maximum of 4 files at once."
                })
                return;
            }

            // === UPLOAD PO ATTACHMENTS ===
            for (let file of poFiles) {

                if (file.size > 10 * 1024 * 1024) {
                    setError({
                        submit:`File "${file.name}" exceeds 10MB limit and will be skipped.`
                    })
                    continue;
                }

                const attachmentFormData = new FormData();
                attachmentFormData.append('file', file);
                attachmentFormData.append('level', 'PO');
                attachmentFormData.append('referenceId', poId);
                attachmentFormData.append('referenceNumber', poPayload.poNumber);

                const uploadResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/po-attachments/upload`, {
                    method: 'POST',
                    headers: {
                        Authorization: `${token}`
                    },
                    body: attachmentFormData
                });

                if (!uploadResponse.ok) {
                    const uploadError = await uploadResponse.text();
                    console.warn(`Attachment upload failed: ${file.name} - ${uploadError}`);
                    setSnackbar({
                        open: true,
                        message: "Attachment upload failed",
                        severity: "error"
                    });
                    // Optionally: show error toast or retry
                }
            }
            setPoFiles([]);
            handleReset();
            onSubmit();
            setError({})

        } catch (error) {
            console.error('Error creating PO:', error);
            setError({
                submit:"Network error, please try again"
            })
        }
    };




    const defaultColDef = {
        sortable: true,
        filter: true,
        resizable: true
    };

    const removeAttachment = (indexToRemove) => {
        setPoFiles((prevFiles) => prevFiles.filter((_, index) => index !== indexToRemove));
    };


    const handleReset = () => {
        setFormData({
            poNumber: '',
            poType: '',
            poAmount: '',
            currency: 'USD',
            customerName: '',
            sponsorName: '',
            sponsorLob: '',
            budgetLineItem: '',
            budgetLineAmount: '',
            budgetLineRemarks: '',
            businessValueAmount: '',
            businessValueType: '',
            poCountry: '',
            supplierName: sessionStorage.getItem('tenantName') || '',
            projectName: '',
            spocName: '',
            startDate: '',
            endDate: '',
            projectDescription: '',
            milestones: []
        });
    };


    return (
        <>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                <div className="bg-white rounded-lg shadow-xl max-w-[90vw] w-full mx-4 max-h-[95vh] overflow-hidden flex flex-col">
                    <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                        <h2 className="text-xl font-semibold text-green-900">
                            Create new Purchase Order
                        </h2>
                        <button
                            onClick={() => {
                                onClose();
                                setFormData({
                                    poNumber: '',
                                    poType: '',
                                    poAmount: '',
                                    currency: 'USD',
                                    customerName: '',
                                    sponsorName: '',
                                    sponsorLob: '',
                                    budgetLineItem: '',
                                    budgetLineAmount: '',
                                    budgetLineRemarks: '',
                                    businessValueAmount: '',
                                    businessValueType: '',
                                    poCountry: '',
                                    supplierName: sessionStorage.getItem('tenantName') || '',
                                    projectName: '',
                                    spocName: '',
                                    startDate: '',
                                    endDate: '',
                                    projectDescription: '',
                                    milestones: []
                                });
                            }}
                            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="p-6 overflow-y-auto flex-grow">

                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 items-end">
                                <div className="lg:col-span-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        PO Number <span className='text-red-500'>*</span>
                                        <span className="float-right text-xs text-gray-500">
                                            {poNumberCharCount}/50 characters
                                        </span>
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Enter here"
                                        value={formData.poNumber}
                                        onChange={handleChange('poNumber')}
                                        title={formData.poNumber}
                                        maxLength={50} // Tooltip on hover
                                        className={`w-full h-10 px-4 border rounded-md focus:ring-2 focus:ring-green-500 truncate ${fieldErrors.poNumber ? 'border-red-500' : 'border-gray-300'}`}
                                    />
                                    {fieldErrors.poNumber && (
                                        <p className="text-xs text-red-600 mt-1">{fieldErrors.poNumber}</p>
                                    )}
                                </div>
                                <div className="lg:col-span-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">PO Type <span className='text-red-500'>*</span></label>
                                    <select
                                        value={formData.poType}
                                        onChange={handleChange('poType')}
                                        title={formData.poType || 'Select from list'} // Tooltip on hover
                                        className={`w-full h-10 px-4 border rounded-md focus:ring-2 focus:ring-green-500 truncate ${fieldErrors.poType ? 'border-red-500' : 'border-gray-300'}`}
                                    >
                                        <option value="">Select from list</option>
                                        <option value="FIXED">Fixed</option>
                                        <option value="T_AND_M">T & M</option>
                                        <option value="MIXED">Mixed</option>
                                    </select>
                                    {fieldErrors.poType && (
                                        <p className="text-xs text-red-600 mt-1">{fieldErrors.poType}</p>
                                    )}
                                </div>

                                <div className="lg:col-span-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">PO Country</label>
                                    <select
                                        value={formData.poCountry}
                                        onChange={handleChange('poCountry')}
                                        title={formData.poCountry || 'Select from list'} // Tooltip on hover
                                        className="w-full h-10 px-4 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 truncate"
                                    >
                                        <option value="">Select from list</option>
                                        {countries.map((country) => (
                                            <option key={country.code} value={country.name}>
                                                {country.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="lg:col-span-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Currency <span className='text-red-500'>*</span></label>
                                    <select
                                        value={formData.currency}
                                        onChange={handleChange('currency')}
                                        title={formData.currency}
                                        className="w-full h-10 px-4 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 truncate"
                                    >
                                        <option value="USD">USD</option>
                                        <option value="INR">INR</option>
                                        <option value="EUR">EUR</option>
                                        <option value="GBP">GBP</option>
                                        <option value="JPY">JPY</option>
                                    </select>
                                </div>


                    
                                <div className="lg:col-span-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">PO Amount <span className='text-red-500'>*</span></label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2  -translate-y-1/2 text-green-600 font-semibold">
                                            {currencySymbols[formData.currency] || '$'}
                                        </span>
                                        <input
                                            type="text"
                                            placeholder="Enter here"
                                            value={formData.poAmount}
                                            onChange={e => {
                                                let value = e.target.value.replace(/[^0-9.]/g, '');
                                                const parts = value.split('.');
                                                if (parts.length > 2) value = parts[0] + '.' + parts[1];
                                                if (parts[0].length > 13) parts[0] = parts[0].slice(0, 13);
                                                if (parts[1]) parts[1] = parts[1].slice(0, 2);
                                                value = parts[1] !== undefined ? parts[0] + '.' + parts[1] : parts[0];
                                                setFormData(prev => ({
                                                    ...prev,
                                                    poAmount: value
                                                }));
                                            }}
                                            title={formData.poAmount?.toString() || 'Enter Amount'}
                                            className={`w-full h-10 pl-8 pr-4 border rounded-md focus:ring-2 focus:ring-green-500 truncate ${fieldErrors.poAmount ? 'border-red-500' : 'border-gray-300'}`}
                                            inputMode="decimal"
                                            pattern="^\d{1,13}(\.\d{0,2})?$"
                                            maxLength={16}
                                            autoComplete="off"
                                        />
                                    </div>
                                    {fieldErrors.poAmount && (
                                        <p className="text-xs text-red-600 mt-1">{fieldErrors.poAmount}</p>
                                    )}
                                </div>

                                <div className="lg:col-span-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">PO Start Date</label>
                                    <div
                                        onClick={() => StartDateInputRef.current?.showPicker?.()}
                                        className="relative w-full h-10 pl-10 pr-4 border border-gray-300 rounded-md focus-within:ring-2 focus-within:ring-green-500 focus-within:border-green-500 cursor-pointer flex items-center"
                                    >
                                        <Calendar
                                            className="absolute left-3 top-1/2 -translate-y-1/2 text-green-600 pointer-events-none"
                                            size={20}
                                        />
                                        <input
                                            ref={StartDateInputRef}
                                            type="date"
                                            value={formData.startDate}
                                            onChange={handleChange('startDate')}
                                            className="w-full bg-transparent outline-none cursor-pointer appearance-none"
                                            min="1900-01-01"
                                            max="2100-12-31"
                                            onFocus={e => e.target.showPicker && e.target.showPicker()}
                                        />
                                    </div>
                                </div>
                                <div className="lg:col-span-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">PO End Date</label>
                                    <div onClick={() => EndDateInputRef.current?.showPicker?.()} className="relative w-full h-10 pl-10 pr-4 border border-gray-300 rounded-md focus-within:ring-2 focus-within:ring-green-500 focus-within:border-green-500 cursor-pointer flex items-center">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-green-600 pointer-events-none" size={20} />
                                        <input
                                            ref={EndDateInputRef}
                                            type="date"
                                            value={formData.endDate}
                                            onFocus={e => e.target.showPicker && e.target.showPicker()}
                                            onChange={handleChange('endDate')}
                                            className="w-full bg-transparent outline-none cursor-pointer"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label
                                        htmlFor="spocName"
                                        className="block text-sm font-medium text-gray-700 mb-2"
                                        title="Select an existing project or type a new one to create"
                                    >
                                        PM/SPOC Name
                                    </label>
                                    <div className="relative w-full">
                                        <UserCheck
                                            className="absolute left-3 top-1/2  -translate-y-1/2 text-green-600 z-20"
                                            size={20}
                                            title="Select or create project"
                                        />
                                        <CreatableSelect
                                            inputId="spocName"
                                            options={userOptions}
                                            value={
                                                formData.spocName
                                                    ? { label: formData.spocName, value: formData.spocName }
                                                    : null
                                            }
                                            onChange={(selectedOption) => {
                                                let value = selectedOption?.value || '';
                                                if (value.length > 255) value = value.slice(0, 255);
                                                handleChange('spocName')({ target: { value } });
                                            }}
                                            className="react-select-container z-15"
                                            classNamePrefix="react-select"
                                            placeholder="Select PM/SPOC"
                                            isSearchable
                                            isClearable
                                            formatCreateLabel={(inputValue) => `Add "${inputValue}"`}
                                            styles={{
                                                control: (base) => ({
                                                    ...base,
                                                    height: '40px',
                                                    paddingLeft: '28px',
                                                    borderColor: '#d1d5db',
                                                }),
                                                valueContainer: (base) => ({ ...base, padding: '0 6px' }),
                                            }}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label
                                        htmlFor="projectName"
                                        className="block text-sm font-medium text-gray-700 mb-2"
                                        title="Select an existing project or type a new one to create"
                                    >
                                        Project Name
                                    </label>
                                    <div className="relative w-full">
                                        <Folder
                                            className="absolute left-3 top-1/2  -translate-y-1/2 text-green-600 z-15"
                                            size={20}
                                            title="Create project"
                                        />
                                        <CreatableSelect
                                            inputId="projectName"
                                            options={projectOptions}
                                            value={
                                                formData.projectName
                                                    ? { label: formData.projectName, value: formData.projectName }
                                                    : null
                                            }
                                            onChange={(selectedOption) => {
                                                let value = selectedOption?.value || '';
                                                if (value.length > 255) value = value.slice(0, 255);
                                                handleChange('projectName')({ target: { value } });
                                            }}
                                            className="react-select-container z-11"
                                            classNamePrefix="react-select"
                                            placeholder="Select Project"
                                            isSearchable
                                            isClearable
                                            formatCreateLabel={(inputValue) => `Add "${inputValue}"`}
                                            styles={{
                                                control: (base) => ({
                                                    ...base,
                                                    height: '40px',
                                                    paddingLeft: '28px',
                                                    borderColor: '#d1d5db',
                                                }),
                                                valueContainer: (base) => ({ ...base, padding: '0 6px' }),
                                            }}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label
                                        htmlFor="customerName"
                                        className="block text-sm font-medium text-gray-700 mb-2"
                                        title="Select an existing customer or type a new one to create"
                                    >
                                        Customer Name
                                    </label>
                                    <OrganizationSelect
                                        value={formData.customerName || ''}
                                        onChange={(value) => {
                                            let finalValue = value;
                                            if (value && value.length > 255) finalValue = value.slice(0, 255);
                                            setFormData(prev => ({ ...prev, customerName: finalValue }));
                                        }}
                                        onOrgSelect={handleCustomerOrgSelect}
                                        placeholder="Select or type for customer"
                                        orgType="CUSTOMER"
                                        className="w-full"
                                    />
                                </div>


                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Supplier Name</label>
                                    <OrganizationSelect
                                        value={formData.supplierName || ''}
                                        onChange={(value) => {
                                            let finalValue = value;
                                            if (value && value.length > 255) finalValue = value.slice(0, 255);
                                            setFormData(prev => ({ ...prev, supplierName: finalValue }));
                                        }}
                                        onOrgSelect={handleSupplierOrgSelect}
                                        placeholder="Select or type for supplier."
                                        orgType="SUPPLIER"
                                        className="w-full"
                                    />
                                </div>

                                <div>
                                    <label
                                        htmlFor="sponsorName"
                                        className="block text-sm font-medium text-gray-700 mb-2"
                                        title="Select an existing project or type a new one to create"
                                    >
                                        Sponsor Name
                                    </label>
                                    <div className="relative w-full">
                                        <UserCheck
                                            className="absolute left-3 top-1/2  -translate-y-1/2 text-green-600 z-15"
                                            size={20}
                                            title="Select or create project"
                                        />
                                        <CreatableSelect
                                            inputId="sponsorName"
                                            options={userOptions}
                                            value={
                                                formData.sponsorName
                                                    ? { label: formData.sponsorName, value: formData.sponsorName }
                                                    : null
                                            }
                                            onChange={(selectedOption) => {
                                                let value = selectedOption?.value || '';
                                                if (value.length > 255) value = value.slice(0, 255);
                                                handleChange('sponsorName')({ target: { value } });
                                            }}
                                            className="react-select-container z-10"
                                            classNamePrefix="react-select"
                                            placeholder="Select Sponsor"
                                            isSearchable
                                            isClearable
                                            formatCreateLabel={(inputValue) => `Add "${inputValue}"`}
                                            styles={{
                                                control: (base) => ({
                                                    ...base,
                                                    height: '40px',
                                                    paddingLeft: '28px',
                                                    borderColor: '#d1d5db',
                                                }),
                                                valueContainer: (base) => ({ ...base, padding: '0 6px' }),
                                            }}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label
                                        htmlFor="sponsorLob"
                                        className="block text-sm font-medium text-gray-700 mb-2"
                                    >
                                        Sponsor LOB
                                    </label>
                                    <div className="relative w-full">
                                        <UserCheck
                                            className="absolute left-3 top-1/2 -translate-y-1/2 text-green-600 z-10"
                                            size={20}
                                        />
                                        <input
                                            type="text"
                                            id="sponsorLob"
                                            name="sponsorLob"
                                            value={formData.sponsorLob}
                                            onChange={handleChange('sponsorLob')}
                                            className="w-full h-10 pl-10 pr-4 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                            placeholder="Enter Sponsor LOB"
                                            maxLength={255}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Budget Line Item</label>
                                    <div className="relative w-full">
                                        <UserCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-green-600 z-10" size={20} />
                                        <CreatableSelect
                                            inputId="budgetLineItem"
                                            options={budgetLineOptions}
                                            value={formData.budgetLineItem ? { label: formData.budgetLineItem, value: formData.budgetLineItem } : null}
                                            onChange={(selected) => {
                                                const value = selected?.value || '';
                                                const match = budgetLineOptions.find(o => o.value === value);
                                                setFormData(prev => ({
                                                    ...prev,
                                                    budgetLineItem: value,
                                                    budgetLineAmount: match ? String(match.amountApproved ?? '') : prev.budgetLineAmount,
                                                    currency: match?.currency || prev.currency
                                                }));
                                            }}
                                            classNamePrefix="react-select"
                                            placeholder="Select or type Budget Line"
                                            isClearable
                                            isSearchable
                                            styles={{
                                                control: (base) => ({ ...base, height: '40px', paddingLeft: '28px', borderColor: '#d1d5db' }),
                                                valueContainer: (base) => ({ ...base, padding: '0 6px' })
                                            }}
                                        />
                                    </div>
                                </div>

                                <div className="lg:col-span-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Budget Line Amount</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2  -translate-y-1/2 text-green-600 font-semibold">
                                            {currencySymbols[formData.currency] || '$'}
                                        </span>
                                        <input
                                            type="text"
                                            placeholder="Enter here"
                                            value={formData.budgetLineAmount}
                                            onChange={e => {
                                                let value = e.target.value.replace(/[^0-9.]/g, '');
                                                const parts = value.split('.');
                                                if (parts.length > 2) value = parts[0] + '.' + parts[1];
                                                if (parts[0].length > 13) parts[0] = parts[0].slice(0, 13);
                                                if (parts[1]) parts[1] = parts[1].slice(0, 2);
                                                value = parts[1] !== undefined ? parts[0] + '.' + parts[1] : parts[0];
                                                setFormData(prev => ({
                                                    ...prev,
                                                    budgetLineAmount: value
                                                }));
                                            }}
                                            title={formData.budgetLineAmount?.toString() || 'Enter Amount'}
                                            className="w-full h-10 pl-8 pr-4 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 truncate"
                                            inputMode="decimal"
                                            pattern="^\d{1,13}(\.\d{0,2})?$"
                                            maxLength={16}
                                            autoComplete="off"
                                        />
                                    </div>
                                </div>

                                <div className="lg:col-span-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Business Value Amount</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2  -translate-y-1/2 text-green-600 font-semibold">
                                            {currencySymbols[formData.currency] || '$'}
                                        </span>
                                        <input
                                            type="text"
                                            placeholder="Enter here"
                                            value={formData.businessValueAmount}
                                            onChange={e => {
                                                let value = e.target.value.replace(/[^0-9.]/g, '');
                                                const parts = value.split('.');
                                                if (parts.length > 2) value = parts[0] + '.' + parts[1];
                                                if (parts[0].length > 13) parts[0] = parts[0].slice(0, 13);
                                                if (parts[1]) parts[1] = parts[1].slice(0, 2);
                                                value = parts[1] !== undefined ? parts[0] + '.' + parts[1] : parts[0];
                                                setFormData(prev => ({
                                                    ...prev,
                                                    businessValueAmount: value
                                                }));
                                            }}
                                            title={formData.businessValueAmount?.toString() || 'Enter Amount'}
                                            className="w-full h-10 pl-8 pr-4 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 truncate"
                                            inputMode="decimal"
                                            pattern="^\d{1,13}(\.\d{0,2})?$"
                                            maxLength={16}
                                            autoComplete="off"
                                        />
                                    </div>
                                </div>

                                <div className="lg:col-span-1">
    <label className="block text-sm font-medium text-gray-700 mb-2">Business Value Type</label>
    <select
        value={formData.businessValueType}
        onChange={handleChange('businessValueType')}
        className="w-full h-10 px-4 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 truncate"
    >
        <option value="">Select Type</option>
        <option value="One Time">One Time</option>
        <option value="Yearly">Yearly</option>
    </select>
</div>


                            </div>



                            <div>

                                <div>
<label className="block text-sm font-medium text-gray-700 mb-2">
        Project Description
        <span className="float-right text-xs text-gray-500">
            {formData.projectDescription.length}/500 characters
        </span>
    </label>                                    <textarea
                                        placeholder="Enter here"
                                        rows={3}
                                        value={formData.projectDescription}
                                        onChange={e => {
                                            let value = e.target.value;
                                            if (value.length > 500) value = value.slice(0, 500);
                                            setFormData(prev => ({
                                                ...prev,
                                                projectDescription: value
                                            }));
                                        }}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
                                        maxLength={500}
                                        title={formData.projectDescription || 'Enter project description'}
                                    />
                                </div>
                                <div>
<label className="block text-sm font-medium text-gray-700 mb-2">
        Budget Line Remarks
        <span className="float-right text-xs text-gray-500">
            {formData.budgetLineRemarks.length}/500 characters
        </span>
    </label>                                    <textarea
                                        placeholder="Enter here"
                                        rows={3}
                                        value={formData.budgetLineRemarks}
                                        onChange={e => {
                                            let value = e.target.value;
                                            if (value.length > 500) value = value.slice(0, 500);
                                            setFormData(prev => ({
                                                ...prev,
                                                budgetLineRemarks: value
                                            }));
                                        }}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
                                        maxLength={500}
                                        title={formData.budgetLineRemarks || 'Enter budget line remarks'}
                                    />
                                </div>
                                <div className="lg:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        PO Attachments (Max 4)
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="file"
                                            id="po-attachment-input"
                                            multiple
                                            onChange={handleFileChange}
                                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                            className="hidden"
                                        />
                                        <label
                                            htmlFor="po-attachment-input"
                                            className="w-[300px] h-10 pl-10 pr-4 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 flex items-center cursor-pointer"
                                        >
                                            <Upload className="absolute left-3 top-1/2 -translate-y-1/2 text-green-600" size={20} />
                                            <span className="text-gray-500 truncate">
                                                {poFiles.length > 0 ? `${poFiles.length} file(s) selected` : 'Click to select files'}
                                            </span>
                                        </label>
                                    </div>

                                    <ul className="mt-2 text-sm text-gray-700 flex flex-wrap gap-2">
                                        {poFiles.map((file, index) => (
                                            <li
                                                key={index}
                                                className="flex items-center bg-gray-100 px-3 py-1 rounded max-w-[150px]"
                                            >
                                                <span className="truncate max-w-[100px]" title={file.name}>
                                                    {file.name}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => removeAttachment(index)}
                                                    className="ml-2 text-red-600 hover:text-red-800 text-xs"
                                                >
                                                    Delete
                                                </button>
                                            </li>
                                        ))}
                                    </ul>

                                </div>
                            </div>





                    </div>


                    <div className="flex justify-end gap-3 pt-4 px-6 pb-6 border-t border-gray-200 bg-gray-50">

                        <button
                            onClick={() => {
                                onClose();
                                setFormData({
                                    poNumber: '',
                                    poType: '',
                                    poAmount: '',
                                    currency: 'USD',
                                    customerName: '',
                                    sponsorName: '',
                                    sponsorLob: '',
                                    budgetLineItem: '',
                                    budgetLineAmount: '',
                                    budgetLineRemarks: '',
                                    businessValueAmount: '',
                                    businessValueType: '',
                                    poCountry: '',
                                    supplierName: sessionStorage.getItem('tenantName') || '',
                                    projectName: '',
                                    spocName: '',
                                    startDate: '',
                                    endDate: '',
                                    projectDescription: '',
                                    milestones: []
                                });
                            }}
                            className="px-6 py-2 bg-white border-2 border-green-700 cursor-pointer text-green-700 rounded-md hover:bg-green-700 hover:text-white transition-colors font-semibold"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleCreatePO}
                            className="cursor-pointer px-6 py-2 bg-green-700 text-white rounded-md hover:bg-green-800 transition-colors font-semibold"
                        >
                            Save
                        </button>

                    </div>
                </div>
            </div>
            <GlobalSnackbar
                open={snackbar.open}
                message={snackbar.message}
                severity={snackbar.severity}
                onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
            />
            </div>
        </>
    );
};

export default AddPOModal;