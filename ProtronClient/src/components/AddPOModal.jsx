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
    const [currentStep, setCurrentStep] = useState(1); // Step 1: PO Details, Step 2: Milestones
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

    // Add state for milestone modal
    const [milestoneModalOpen, setMilestoneModalOpen] = useState(false);
    const [editingMilestone, setEditingMilestone] = useState(null);
    const [countries, setCountries] = useState([]);
    const [poFiles, setPoFiles] = useState([]);
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success'
    })

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
        }
    };

    useEffect(() => {
        if (open) {
            fetchUsers();
            fetchProjects();
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

    const handleFileChange = (e) => {
        const selectedFiles = Array.from(e.target.files);
        if (selectedFiles.length === 0) return;

        setPoFiles((prevFiles) => {
            const totalFiles = prevFiles.length + selectedFiles.length;

            if (totalFiles > 4) {
                alert(`Maximum 4 attachments allowed. You already selected ${prevFiles.length}.`);
                return prevFiles;
            }

            return [...prevFiles, ...selectedFiles];
        });

        e.target.value = null; // reset file input
    };

    const handleAddMilestone = () => {
        setEditingMilestone(null);
        setMilestoneModalOpen(true);
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
                alert(`Failed to delete milestone. ${errorData?.message || ''}`);
                return;
            }

            setFormData((prev) => ({
                ...prev,
                milestones: prev.milestones.filter((_, i) => i !== index)
            }));
            alert('Milestone deleted successfully.');
        } catch (error) {
            console.error('Error deleting milestone:', error);
            alert('Network error. Please try again.');
        }
    };

    const handleCreatePO = async () => {
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
                alert(`Failed to create PO. ${errorData?.message || ''}`);
                return;
            }

            const poData = await response.json();
            const poId = poData.poId || poData.id;
            setPoId(poId);

            if (poFiles.length > 4) {
                alert('You can attach a maximum of 4 files at once.');
                return;
            }

            // === UPLOAD PO ATTACHMENTS ===
            for (let file of poFiles) {

                if (file.size > 10 * 1024 * 1024) {
                    alert(`File "${file.name}" exceeds 10MB limit and will be skipped.`);
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
                    // Optionally: show error toast or retry
                }
            }

            alert('PO created successfully.');
            setCurrentStep(2);
            setPoFiles([]);

        } catch (error) {
            console.error('Error creating PO:', error);
            alert('Network error. Please try again.');
        }
    };


    const handleSubmitMilestones = async () => {
        onSubmit?.();
        onClose();
        setCurrentStep(1);
    };


    // Updated milestone column definitions for display only
    const milestoneColumnDefs = [
        {
            headerName: '#',
            valueGetter: 'node.rowIndex + 1',
            width: 50,
            pinned: 'left',
            cellStyle: { textAlign: 'center' },
            sortable: false,
            filter: false
        },
        {
            headerName: 'Milestone Name',
            field: 'milestoneName',
            flex: 1,
            editable: false
        },
        {
            headerName: 'Milestone Description',
            field: 'milestoneDescription',
            flex: 2,
            editable: false,
            cellRenderer: (params) => {
                const description = params.value || '';
                return description.length > 50 ?
                    <span title={description}>{description.substring(0, 50)}...</span> :
                    description;
            }
        },
        {
            headerName: 'Amount',
            field: 'amount',
            width: 120,
            editable: false,
            valueFormatter: (params) => {
                const amount = params.value;
                const currency = params.data.currency || formData.currency;
                const symbol = currencySymbols[currency] || '$';
                return amount ? `${symbol}${Number(amount).toLocaleString()}` : '';
            }
        },
        {
            headerName: 'Currency',
            field: 'currency',
            width: 100,
            editable: false
        },
        {
            headerName: 'Date',
            field: 'date',
            width: 150,
            editable: false,
            valueFormatter: (params) => {
                return params.value ? new Date(params.value).toLocaleDateString() : '';
            }
        },
        {
            headerName: 'Duration (Days)',
            field: 'duration',
            width: 130,
            editable: false
        },
        {
            headerName: 'Remark',
            field: 'remark',
            flex: 1,
            editable: false,
            cellRenderer: (params) => {
                const remark = params.value || '';
                return remark.length > 30 ?
                    <span title={remark}>{remark.substring(0, 30)}...</span> :
                    remark;
            }
        },
        {
            headerName: 'Attachment',
            field: 'attachment',
            width: 120,
            editable: false,
            cellRenderer: (params) => {
                return (
                    <div className="flex justify-center items-center h-full">
                        {params.data.attachments ? (
                            <span className="text-xs text-green-600 flex items-center">
                                <FileText size={14} className="mr-1" />
                                File
                            </span>
                        ) : (
                            <span className="text-xs text-gray-400">No file</span>
                        )}
                    </div>
                );
            }
        },
        {
            headerName: 'Actions',
            field: 'actions',
            width: 120,
            sortable: false,
            filter: false,
            cellRenderer: (params) => (
                <div className="flex justify-center items-center h-full gap-1">
                    <button
                        onClick={() => handleRemoveMilestone(params.node.rowIndex)}
                        className="p-1 rounded-full hover:bg-red-100 text-red-600 transition-colors"
                        title="Remove milestone"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            ),
        }
    ];

    const defaultColDef = {
        sortable: true,
        filter: true,
        resizable: true
    };

    const removeAttachment = (indexToRemove) => {
        setPoFiles((prevFiles) => prevFiles.filter((_, index) => index !== indexToRemove));
    };

    // const handleSubmit = async () => {
    //     try {
    //         const poPayload = {
    //             poNumber: formData.poNumber,
    //             poType: formData.poType,
    //             poDesc: formData.projectDescription || '',
    //             poAmount: parseFloat(formData.poAmount) || 0,
    //             poCurrency: formData.currency,
    //             poSpoc: formData.spocName,
    //             supplier: formData.supplierName,
    //             customer: formData.customerName,
    //             sponsorName: formData.sponsorName || '',
    //             sponsorLob: formData.sponsorLob || '',
    //             projectName: formData.projectName,
    //             poStartDate: formData.startDate || null,
    //             poEndDate: formData.endDate || null,
    //         };

    //         const token = sessionStorage.getItem('token');
    //         const response = await fetch(
    //             `${import.meta.env.VITE_API_URL}/api/po/add`,
    //             {
    //                 method: 'POST',
    //                 headers: {
    //                     'Authorization': `${token}`,
    //                     'Content-Type': 'application/json'
    //                 },
    //                 body: JSON.stringify(poPayload)
    //             }
    //         );

    //         if (response.ok) {
    //             const poData = await response.json();
    //             console.log('PO Created:', poData);
    //             const currentUser = sessionStorage.getItem('username') || 'system';

    //             // Upload PO Attachments (up to 4)
    //             if (formData.poAttachments.length > 0) {
    //                 for (const [index, file] of formData.poAttachments.entries()) {
    //                     await uploadAttachment(poData.poNumber, 'PO', null, `po_attachment${index + 1}`, file, currentUser);
    //                 }
    //             }

    //             // Upload Milestone Attachments with a 4-file limit
    //             if (formData.milestones.length > 0) {
    //                 let milestoneAttachmentCount = 0;
    //                 for (const milestone of formData.milestones) {
    //                     if (milestone.milestoneName && milestone.milestoneName.trim()) {
    //                         const milestonePayload = {
    //                             msName: milestone.milestoneName,
    //                             msDesc: milestone.milestoneDescription || '',
    //                             msAmount: parseInt(milestone.amount) || 0,
    //                             msCurrency: milestone.currency || formData.currency,
    //                             msDate: milestone.date || null,
    //                             msDuration: parseInt(milestone.duration) || 0,
    //                             msRemarks: milestone.remark || '',
    //                             poId: poData.poId || poData.id,
    //                             poNumber: formData.poNumber
    //                         };

    //                         const milestoneResponse = await fetch(
    //                             `${import.meta.env.VITE_API_URL}/api/po-milestone/add`,
    //                             {
    //                                 method: 'POST',
    //                                 headers: {
    //                                     'Authorization': `${token}`,
    //                                     'Content-Type': 'application/json'
    //                                 },
    //                                 body: JSON.stringify(milestonePayload)
    //                             }
    //                         );

    //                         if (milestoneResponse.ok) {
    //                             const milestoneData = await milestoneResponse.json();
    //                             console.log('Milestone created:', milestoneData);

    //                             // If this milestone has an attachment, upload it, respecting the limit
    //                             if (milestone.attachment) {
    //                                 milestoneAttachmentCount++;
    //                                 if (milestoneAttachmentCount <= 4) {
    //                                     await uploadAttachment(poData.poNumber, 'MS', milestoneData.msId, `ms_attachment${milestoneAttachmentCount}`, milestone.attachment, currentUser);
    //                                 } else {
    //                                     console.warn(`Skipping milestone attachment upload: Maximum of 4 milestone attachments reached.`);
    //                                     alert('Warning: Maximum of 4 milestone attachments reached. Some files were not uploaded.');
    //                                 }
    //                             }
    //                         } else {
    //                             const milestoneError = await milestoneResponse.text();
    //                             console.error('Milestone creation error:', milestoneError);
    //                         }
    //                     }
    //                 }
    //             }

    //             onSubmit?.(poData);
    //             handleReset();
    //             onClose();
    //         } else {
    //             const errorData = await response.text();
    //             console.error('PO Creation Error:', errorData);
    //             alert('Failed to create PO. Please check the console for details.');
    //         }
    //     } catch (error) {
    //         console.error('Error creating PO:', error);
    //         alert('Network error. Please try again.');
    //     }
    // };

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
            poCountry: '',
            supplierName: sessionStorage.getItem('tenantName') || '',
            projectName: '',
            spocName: '',
            startDate: '',
            endDate: '',
            projectDescription: '',
            milestones: []
        });
        setMilestoneModalOpen(false);
        setEditingMilestone(null);
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
        }
    };

    if (!open) return null;

    return (
        <>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                <div className="bg-white rounded-lg shadow-xl max-w-[90vw] w-full mx-4 max-h-[95vh] overflow-hidden flex flex-col">
                    <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                        <h2 className="text-xl font-semibold text-green-900">
                            {currentStep === 1 ? 'Create New PO' : 'Add Milestones'}
                        </h2>
                        <button
                            onClick={() => {
                                onClose();
                                setCurrentStep(1);
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
                        {currentStep === 1 && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 items-end">
                                    <div className="lg:col-span-1">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">PO Number</label>
                                        <input
                                            type="text"
                                            placeholder="Enter here"
                                            value={formData.poNumber}
                                            onChange={handleChange('poNumber')}
                                            title={formData.poNumber} // Tooltip on hover
                                            className="w-full h-10 px-4 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 truncate"
                                        />
                                    </div>
                                    <div className="lg:col-span-1">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">PO Type</label>
                                        <select
                                            value={formData.poType}
                                            onChange={handleChange('poType')}
                                            title={formData.poType || 'Select from list'} // Tooltip on hover
                                            className="w-full h-10 px-4 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 truncate"
                                        >
                                            <option value="">Select from list</option>
                                            <option value="FIXED">Fixed</option>
                                            <option value="T_AND_M">T & M</option>
                                            <option value="MIXED">Mixed</option>
                                        </select>
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
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
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
                                        <label className="block text-sm font-medium text-gray-700 mb-2">PO Amount</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2  -translate-y-1/2 text-green-600 font-semibold">
                                                {currencySymbols[formData.currency] || '$'}
                                            </span>
                                            <input
                                                type="number"
                                                placeholder="Enter here"
                                                value={formData.poAmount}
                                                onChange={handleChange('poAmount')}
                                                title={formData.poAmount?.toString() || 'Enter Amount'} // Tooltip on hover
                                                className="w-full h-10 pl-8 pr-4 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 truncate"
                                            />
                                        </div>
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
                                                    handleChange('spocName')({
                                                        target: { value: selectedOption?.value || '' },
                                                    });
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
                                                    handleChange('projectName')({
                                                        target: { value: selectedOption?.value || '' },
                                                    });
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
                                            title="Select an existing project or type a new one to create"
                                        >
                                            Customer Name
                                        </label>
                                        <div className="relative w-full">
                                            <Building
                                                className="absolute left-3 top-1/2  -translate-y-1/2 text-green-600 z-15"
                                                size={20}
                                                title="Customer name"
                                            />
                                            <CreatableSelect
                                                inputId="customerName"
                                                options={userOptions}
                                                value={
                                                    formData.customerName
                                                        ? { label: formData.customerName, value: formData.customerName }
                                                        : null
                                                }
                                                onChange={(selectedOption) => {
                                                    handleChange('customerName')({
                                                        target: { value: selectedOption?.value || '' },
                                                    });
                                                }}
                                                className="react-select-container z-11"
                                                classNamePrefix="react-select"
                                                placeholder="Select Customer"
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
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Supplier Name</label>
                                        <div className="relative">
                                            <Building className="absolute left-3 top-1/2  -translate-y-1/2 text-green-600" size={20} />
                                            <input
                                                type="text"
                                                placeholder="Enter supplier name"
                                                value={formData.supplierName}
                                                onChange={handleChange('supplierName')}
                                                className="w-full h-10 pl-10 pr-4 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                                title={formData.supplierName || 'Enter supplier name'}
                                            />
                                        </div>

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
                                                    handleChange('sponsorName')({
                                                        target: { value: selectedOption?.value || '' },
                                                    });
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
                                            title="Select an existing project or type a new one to create"
                                        >
                                            Sponsor LOB
                                        </label>
                                        <div className="relative w-full">
                                            <UserCheck
                                                className="absolute left-3 top-1/2  -translate-y-1/2 text-green-600 z-10"
                                                size={20}
                                                title="Select or create project"
                                            />
                                            <CreatableSelect
                                                inputId="sponsorLob"
                                                options={userOptions}
                                                value={
                                                    formData.sponsorLob
                                                        ? { label: formData.sponsorLob, value: formData.sponsorLob }
                                                        : null
                                                }
                                                onChange={(selectedOption) => {
                                                    handleChange('sponsorLob')({
                                                        target: { value: selectedOption?.value || '' },
                                                    });
                                                }}
                                                className="react-select-container"
                                                classNamePrefix="react-select"
                                                placeholder="Select Sponsor LOB"
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
                                            htmlFor="budgetLineItem"
                                            className="block text-sm font-medium text-gray-700 mb-2"
                                            title="Select an existing project or type a new one to create"
                                        >
                                            Budget Line Item
                                        </label>
                                        <div className="relative w-full">
                                            <UserCheck
                                                className="absolute left-3 top-1/2  -translate-y-1/2 text-green-600 z-10"
                                                size={20}
                                                title="Select Budget Line Item"
                                            />
                                            <CreatableSelect
                                                inputId="budgetLineItem"
                                                options={userOptions}
                                                value={
                                                    formData.budgetLineItem
                                                        ? { label: formData.budgetLineItem, value: formData.budgetLineItem }
                                                        : null
                                                }
                                                onChange={(selectedOption) => {
                                                    handleChange('budgetLineItem')({
                                                        target: { value: selectedOption?.value || '' },
                                                    });
                                                }}
                                                className="react-select-container"
                                                classNamePrefix="react-select"
                                                placeholder="Select Budget Line"
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

                                    <div className="lg:col-span-1">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Budget Line Amount</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2  -translate-y-1/2 text-green-600 font-semibold">
                                                {currencySymbols[formData.currency] || '$'}
                                            </span>
                                            <input
                                                type="number"
                                                placeholder="Enter here"
                                                value={formData.budgetLineAmount}
                                                onChange={handleChange('budgetLineAmount')}
                                                title={formData.budgetLineAmount?.toString() || 'Enter Amount'} // Tooltip on hover
                                                className="w-full h-10 pl-8 pr-4 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 truncate"
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
                                                type="number"
                                                placeholder="Enter here"
                                                value={formData.businessValueAmount}
                                                onChange={handleChange('businessValueAmount')}
                                                title={formData.businessValueAmount?.toString() || 'Enter Amount'} // Tooltip on hover
                                                className="w-full h-10 pl-8 pr-4 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 truncate"
                                            />
                                        </div>
                                    </div>


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

                                    <ul className="mt-2 text-sm text-gray-700 space-y-1">
                                        {poFiles.map((file, index) => (
                                            <li
                                                key={index}
                                                className="flex max-w-[300px] items-center justify-between bg-gray-100 px-3 py-1 rounded"
                                            >
                                                <span className="truncate max-w-[220px]" title={file.name}>{file.name}</span>
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

                                <div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Project Description</label>
                                        <textarea
                                            placeholder="Enter here"
                                            rows={3}
                                            value={formData.projectDescription}
                                            onChange={handleChange('projectDescription')}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
                                            maxLength={500}
                                            title={formData.projectDescription || 'Enter project description'}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Budget Line Remarks</label>
                                        <textarea
                                            placeholder="Enter here"
                                            rows={3}
                                            value={formData.budgetLineRemarks}
                                            onChange={handleChange('budgetLineRemarks')}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
                                            maxLength={500}
                                            title={formData.budgetLineRemarks || 'Enter budget line remarks'}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {currentStep === 2 && (
                            <div className="space-y-6">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-lg font-semibold text-green-900">Milestones Details</h3>
                                    <button
                                        onClick={handleAddMilestone}
                                        className="flex items-center px-4 py-2 bg-green-700 text-white rounded-md hover:bg-green-800 transition-colors"
                                    >
                                        <Plus size={16} className="mr-2" />
                                        Add Milestone
                                    </button>
                                </div>

                                <div className="h-96 w-full border border-gray-200 rounded-md">
                                    <div className="ag-theme-alpine h-full w-full">
                                        <AgGridReact
                                            columnDefs={milestoneColumnDefs}
                                            rowData={formData.milestones}
                                            defaultColDef={defaultColDef}
                                            suppressMovableColumns={true}
                                            enableCellTextSelection={true}
                                            suppressRowClickSelection={true}
                                            animateRows={true}
                                            rowHeight={48}
                                            headerHeight={48}
                                            noRowsOverlayComponent={() => (
                                                <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-3">
                                                    <div className="text-6xl text-gray-300">+</div>
                                                    <div className="text-center">
                                                        <p className="text-lg font-medium">No milestones added yet</p>
                                                        <p className="text-sm">Click "Add Milestone" above to get started</p>
                                                    </div>
                                                </div>
                                            )}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end gap-3 pt-4 px-6 pb-6 border-t border-gray-200 bg-gray-50">
                        {currentStep === 1 ? (
                            <button
                                onClick={handleCreatePO}
                                className="px-6 py-2 bg-green-700 text-white rounded-md hover:bg-green-800 transition-colors font-semibold"
                            >
                                Next
                            </button>
                        ) : (<button
                            onClick={handleSubmitMilestones}
                            className="px-6 py-2 bg-green-700 text-white rounded-md hover:bg-green-800 transition-colors font-semibold"
                        >
                            Submit Milestones
                        </button>)}
                    </div>
                </div>
            </div>
            <GlobalSnackbar
                open={snackbar.open}
                message={snackbar.message}
                severity={snackbar.severity}
                onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
            />

            {/* Add Milestone Modal */}
            <AddMilestoneModal
                open={milestoneModalOpen}
                onClose={() => {
                    setMilestoneModalOpen(false);
                    setEditingMilestone(null);
                }}
                onSubmit={handleMilestoneSubmit}
                poId={poId}
            />
        </>
    );
};

export default AddPOModal;