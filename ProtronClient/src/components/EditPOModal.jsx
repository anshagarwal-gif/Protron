import React, { useEffect, useState, useRef } from 'react';
import Select from 'react-select';
import AddMilestoneModal from './AddMilestoneModal';
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
    UserCheck,
    Edit2
} from 'lucide-react';
import axios from 'axios';

// Currency symbols mapping
const currencySymbols = {
    USD: '$',
    INR: '₹',
    EUR: '€',
    GBP: '£',
    JPY: '¥'
};

const EditPOModal = ({ open, onClose, onSubmit, poId }) => {
    const [currentStep, setCurrentStep] = useState(1); // Step 1: PO Details, Step 2: Milestones
    const [formData, setFormData] = useState({
        poId: '',
        poNumber: '',
        poType: '',
        poAmount: '',
        poCurrency: 'USD',
        customer: '',
        supplier: '',
        projectName: '',
        sponsorName: '',
        sponsorLob: '',
        budgetLineItem: '',
        budgetLineAmount: '',
        budgetLineRemarks: '',
        poCountry: '',
        businessValueAmount: '',
        businessValueType: '',
        poSpoc: '',
        poStartDate: '',
        poEndDate: '',
        poDesc: '',
        milestones: []
    });
    const [poAttachments, setPoAttachments] = useState([]); // Separate state for attachments
    const [errors, setErrors] = useState({})

    const handleNextStep = async () => {
        if (currentStep === 1) {
            try {
                const poPayload = {
                    poNumber: formData.poNumber,
                    poType: formData.poType,
                    poDesc: formData.poDesc,
                    poAmount: parseFloat(formData.poAmount) || 0,
                    poCurrency: formData.poCurrency,
                    poSpoc: formData.poSpoc,
                    supplier: formData.supplier,
                    customer: formData.customer,
                    sponsorName: formData.sponsorName,
                    sponsorLob: formData.sponsorLob,
                    budgetLineItem: formData.budgetLineItem,
                    budgetLineAmount: parseFloat(formData.budgetLineAmount) || 0,
                    budgetLineRemarks: formData.budgetLineRemarks,
                    poCountry: formData.poCountry || '',
                    businessValueAmount: parseFloat(formData.businessValueAmount) || 0,
                    businessValueType: formData.businessValueType || '',
                    projectName: formData.projectName,
                    poStartDate: formData.poStartDate,
                    poEndDate: formData.poEndDate,
                };

                const token = sessionStorage.getItem('token');
                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/po/edit/${poId}`, {
                    method: 'PUT',
                    headers: { 'Authorization': token, 'Content-Type': 'application/json' },
                    body: JSON.stringify(poPayload)
                });

                if (response.ok) {
                    const poData = await response.json();
                    console.log('PO updated successfully:', poData);

                    // Upload attachments
                    for (let file of poAttachments) {
                        if (file instanceof File) {

                            const attachmentFormData = new FormData();
                            attachmentFormData.append('file', file);
                            attachmentFormData.append('level', 'PO');
                            attachmentFormData.append('referenceId', poData.poId);
                            attachmentFormData.append('referenceNumber', poPayload.poNumber);

                            const uploadResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/po-attachments/upload`, {
                                method: 'POST',
                                headers: { Authorization: token },
                                body: attachmentFormData
                            });

                            if (!uploadResponse.ok) {
                                const uploadError = await uploadResponse.text();
                                console.warn(`Attachment upload failed: ${file.name} - ${uploadError}`);
                            }
                        }
                    }
                    // setCurrentStep(2);
                    onSubmit?.();

                    onClose();
                    setCurrentStep(1);
                    setEditingMilestone(null);
                    setPoAttachments([]);
                } else {
                    const errorData = await response.json();
                    setErrors({
                        submit:`Error updating PO : ${errorData.message}`
                    })
                    console.error('PO Update Error:', errorData);
                    
                }
            } catch (error) {
                setErrors({
                    submit:`Error updating PO : ${error.message}`
                })
                console.error('Error updating PO:', error);
                
            }
        }
    };

    const [initialFormData, setInitialFormData] = useState({});
    const [users, setUsers] = useState([]);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(false);
    const startDateRef = useRef(null);
    const [isEditMilestoneModalOpen, setIsEditMilestoneModalOpen] = useState(false);
    const [editingMilestone, setEditingMilestone] = useState(null);
    const endDateRef = useRef(null);
    const projectOptions = projects.map((project) => ({
        value: project.projectName,
        label: project.projectName,
    }));
    const userOptions = users.map((user) => ({
        value: user.name,
        label: user.name,
    }));
    const [countries, setCountries] = useState([]);
    const [milestoneAttachments, setMilestoneAttachments] = useState([]); // Separate state for milestone attachments

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
            console.log({ message: error });
            
        }
    };

    const fetchProjects = async () => {
        try {
            const token = sessionStorage.getItem('token');
            const tenantId = sessionStorage.getItem('tenantId');
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/tenants/${tenantId}/projects`, {
                headers: { Authorization: `${token}` }
            });
            const data = await res.json();
            setProjects(data);
        } catch (error) {
            console.log({ message: error });
           
        }
    };

    const fetchPOData = async () => {
        if (!poId) return;

        setLoading(true);
        try {
            const token = sessionStorage.getItem('token');
            const poResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/po/${poId}`, {
                headers: { Authorization: `${token}` }
            });
            const poData = await poResponse.json();

            const milestonesResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/po-milestone/po/${poId}`, {
                headers: { Authorization: `${token}` }
            });
            const milestonesData = await milestonesResponse.json();

            const mappedFormData = {
                poId: poData.poId,
                poNumber: poData.poNumber || '',
                poType: poData.poType || '',
                poAmount: poData.poAmount || '',
                poCurrency: poData.poCurrency || 'USD',
                customer: poData.customer || '',
                sponsorName: poData.sponsorName || '',
                sponsorLob: poData.sponsorLob || '',
                budgetLineItem: poData.budgetLineItem || '',
                budgetLineAmount: poData.budgetLineAmount || '',
                budgetLineRemarks: poData.budgetLineRemarks || '',
                poCountry: poData.poCountry || '',
                businessValueAmount: poData.businessValueAmount || '',
                businessValueType: poData.businessValueType || '',
                supplier: poData.supplier || '',
                projectName: poData.projectName || '',
                poSpoc: poData.poSpoc || '',
                poStartDate: poData.poStartDate || '',
                poEndDate: poData.poEndDate || '',
                poDesc: poData.poDesc || '',
                milestones: milestonesData.map(milestone => {
                    let formattedDate = '';
                    if (milestone.msDate) {
                        const date = new Date(milestone.msDate);
                        formattedDate = date.toISOString().split('T')[0];
                    }
                    return {
                        msId: milestone.msId,
                        milestoneName: milestone.msName || '',
                        milestoneDescription: milestone.msDesc || '',
                        amount: milestone.msAmount || 0,
                        currency: milestone.msCurrency || poData.poCurrency || 'USD',
                        date: formattedDate,
                        duration: milestone.msDuration || 0,
                        remark: milestone.msRemarks || '',
                        attachment: null // New attachments can be added
                    };
                })
            };

            setFormData(mappedFormData);
            setInitialFormData(mappedFormData);

        } catch (error) {
            console.error('Error fetching PO data:', error);
           
        } finally {
            setLoading(false);
        }
    };

    const fetchPOAttachments = async (poId) => {
        try {
            const token = sessionStorage.getItem("token");
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/po-attachments/meta/filter?level=PO&referenceId=${poId}`, {
                headers: { Authorization: token }
            });

            if (res.ok) {
                const data = await res.json();
                setPoAttachments(data); // Set this in your component state
            } else {
                console.error("Failed to fetch PO attachments");
            }
        } catch (err) {
            console.error("Error fetching PO attachments:", err);
           
        }
    };


    useEffect(() => {
        if (open && poId) {
            fetchUsers();
            fetchProjects();
            fetchCountries();
            fetchPOData();
            fetchPOAttachments(poId);
        }
    }, [open, poId]);

    const handleChange = (field) => (event) => {
        setFormData((prev) => ({
            ...prev,
            [field]: event.target.value
        }));
    };

    const handleFileChange = (e) => {
        const selectedFiles = Array.from(e.target.files);
        if (selectedFiles.length === 0) return;

        setPoAttachments((prevFiles) => {
            const totalFiles = prevFiles.length + selectedFiles.length;

            if (totalFiles > 4) {
                alert(`Maximum 4 attachments allowed. You already selected ${prevFiles.length}.`);
                return prevFiles;
            }

            return [...prevFiles, ...selectedFiles];
        });

        e.target.value = null; // Reset file input
    };

    const removeAttachment = async (indexToRemove) => {
        const attachmentToRemove = poAttachments[indexToRemove];

        // Check if the attachment has an ID (existing attachment)
        if (attachmentToRemove.id) {
            try {
                const token = sessionStorage.getItem("token");
                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/po-attachments/${attachmentToRemove.id}`, {
                    method: "DELETE",
                    headers: {
                        Authorization: token,
                    },
                });

                if (!response.ok) {
                    console.error(`Failed to delete attachment with ID: ${attachmentToRemove.id}`);
                    return;
                }

                console.log(`Attachment with ID: ${attachmentToRemove.id} deleted successfully`);
            } catch (error) {
                console.error(`Error deleting attachment with ID: ${attachmentToRemove.id}`, error);
                return;
            }
        }

        // Update state to remove the attachment
        setPoAttachments((prevFiles) => prevFiles.filter((_, index) => index !== indexToRemove));
    };

    const handleMilestoneFileChange = (milestoneIndex, e) => {
        const selectedFiles = Array.from(e.target.files);
        if (selectedFiles.length === 0) return;

        setMilestoneAttachments((prevFiles) => {
            const updatedFiles = [...prevFiles];
            updatedFiles[milestoneIndex] = selectedFiles;
            return updatedFiles;
        });

        e.target.value = null; // Reset file input
    };

    const removeMilestoneAttachment = async (milestoneIndex, fileIndex) => {
        const attachmentToRemove = milestoneAttachments[milestoneIndex]?.[fileIndex];

        // Check if the attachment has an ID (existing attachment)
        if (attachmentToRemove.id) {
            try {
                const token = sessionStorage.getItem("token");
                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/po-attachments/${attachmentToRemove.id}`, {
                    method: "DELETE",
                    headers: {
                        Authorization: token,
                    },
                });

                if (!response.ok) {
                    console.error(`Failed to delete attachment with ID: ${attachmentToRemove.id}`);
                    return;
                }

                console.log(`Attachment with ID: ${attachmentToRemove.id} deleted successfully`);
            } catch (error) {
                console.error(`Error deleting attachment with ID: ${attachmentToRemove.id}`, error);
                return;
            }
        }

        setMilestoneAttachments((prevFiles) => {
            const updatedFiles = [...prevFiles];
            updatedFiles[milestoneIndex] = updatedFiles[milestoneIndex].filter((_, index) => index !== fileIndex);
            return updatedFiles;
        });
    };

    const AttachmentRenderer = (params) => {
        const rowIndex = params.node.rowIndex;
        const fileInputId = `edit-milestone-file-${rowIndex}`;
        return (
            <div className="flex justify-center items-center h-full">
                <input
                    type="file"
                    id={fileInputId}
                    style={{ display: 'none' }}
                    onChange={(e) => handleMilestoneFileChange(rowIndex, e)}
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                />
                <button
                    onClick={() => document.getElementById(fileInputId).click()}
                    className="p-1 rounded-full hover:bg-blue-100 text-blue-600 transition-colors"
                    title="Upload or replace attachment"
                >
                    <Upload size={16} />
                </button>
                {params.data.attachment && (
                    <span className="ml-1 text-xs text-green-600">✓ New</span>
                )}
            </div>
        );
    };

    const milestoneColumnDefs = [
        {
            headerName: '#',
            valueGetter: 'node.rowIndex + 1',
            width: 50,
            pinned: 'left'
        },
        {
            headerName: 'Milestone Name',
            field: 'milestoneName',
            flex: 1,
            editable: true,
            tooltipValueGetter: p => p.data.milestoneName || 'N/A',
            cellRenderer: p => (
                <div className="truncate max-w-full whitespace-nowrap overflow-hidden" title={p.value}>
                    {p.value}
                </div>
            )
        },
        {
            headerName: 'Milestone Description',
            field: 'milestoneDescription',
            flex: 2,
            editable: true,
            tooltipValueGetter: p => p.data.milestoneDescription || 'N/A',
            cellRenderer: p => (
                <div className="truncate max-w-full whitespace-nowrap overflow-hidden" title={p.value}>
                    {p.value}
                </div>
            )
        },
        {
            headerName: 'Currency',
            field: 'currency',
            width: 100,
            editable: true,
            cellEditor: 'agSelectCellEditor',
            cellEditorParams: {
                values: ['USD', 'INR', 'EUR', 'GBP', 'JPY']
            }
        },
        {
            headerName: 'Amount',
            field: 'amount',
            width: 120,
            editable: true,
            valueFormatter: p =>
                p.value ? `${currencySymbols[p.data.currency] || '$'}${Number(p.value).toLocaleString()}` : ''
        },
        {
            headerName: 'Date',
            field: 'date',
            width: 150,
            editable: true,
            cellEditor: 'agDateCellEditor'
        },
        {
            headerName: 'Duration (Days)',
            field: 'duration',
            width: 130,
            editable: true
        },
        {
            headerName: 'Remark',
            field: 'remark',
            flex: 1,
            editable: true,
            tooltipValueGetter: p => p.data.remark || 'N/A',
            cellRenderer: p => (
                <div className="truncate max-w-full whitespace-nowrap overflow-hidden" title={p.value}>
                    {p.value}
                </div>
            )
        },
        {
            headerName: 'Attachment',
            field: 'attachment',
            width: 120,
            cellRenderer: AttachmentRenderer
        },
        {
            headerName: 'Actions',
            field: 'actions',
            width: 120,
            sortable: false,
            filter: false,
            cellRendererFramework: (params) => (
                <div className="flex justify-center items-center h-full gap-1">
                    <button
                        onClick={() =>
                            handleEditMilestone(params.node.rowIndex)
                        }
                        className="p-1 rounded-full hover:bg-blue-100 text-blue-600 transition-colors"
                        title="Edit milestone"
                    >
                        <Edit2 size={16} />
                    </button>
                    <button
                        onClick={() =>
                            handleRemoveMilestone(params.node.rowIndex)
                        }
                        className="p-1 rounded-full hover:bg-red-100 text-red-600 transition-colors"
                        title="Remove milestone"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            ),
        }
    ];


    const defaultColDef = { sortable: true, filter: true, resizable: true };

    const uploadAttachment = async (poNumber, entityType, entityId, slot, file, user) => {
        const uploadFormData = new FormData();
        uploadFormData.append('poNumber', poNumber);
        uploadFormData.append('entityType', entityType);
        if (entityId) uploadFormData.append('entityId', entityId);
        uploadFormData.append('attachmentSlot', slot);
        uploadFormData.append('file', file);
        uploadFormData.append('updatedBy', user);

        try {
            const token = sessionStorage.getItem('token');
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/po-attachments/upload`, {
                method: 'POST',
                headers: { 'Authorization': `${token}` },
                body: uploadFormData,
            });
            if (!response.ok) throw new Error(await response.text());
            console.log(`Attachment for ${entityType} in slot ${slot} uploaded.`);
        } catch (error) {
            console.error(`Error uploading attachment for ${entityType}:`, error);
        }
    };

    const handleSubmitMilestones = async () => {
        try {
            const token = sessionStorage.getItem('token');
            for (const milestone of formData.milestones) {
                const milestonePayload = {
                    msName: milestone.milestoneName,
                    msDesc: milestone.milestoneDescription,
                    msAmount: parseFloat(milestone.amount) || 0,
                    msCurrency: milestone.currency,
                    msDate: milestone.date,
                    msDuration: parseInt(milestone.duration) || 0,
                    msRemarks: milestone.remark,
                    poId: poId,
                    poNumber: formData.poNumber
                };

                let milestoneResponse;
                if (milestone.msId) {
                    milestoneResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/po-milestone/edit/${milestone.msId}`, {
                        method: 'PUT',
                        headers: { 'Authorization': token, 'Content-Type': 'application/json' },
                        body: JSON.stringify(milestonePayload)
                    });
                } else {
                    milestoneResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/po-milestone/add`, {
                        method: 'POST',
                        headers: { 'Authorization': token, 'Content-Type': 'application/json' },
                        body: JSON.stringify(milestonePayload)
                    });
                }

                if (!milestoneResponse.ok) {
                    console.error('Failed to save milestone:', await milestoneResponse.text());
                }

                const milestoneIndex = formData.milestones.indexOf(milestone);
                if (milestoneAttachments[milestoneIndex]) {
                    for (let file of milestoneAttachments[milestoneIndex]) {
                        const attachmentFormData = new FormData();
                        attachmentFormData.append('file', file);
                        attachmentFormData.append('level', 'Milestone');
                        attachmentFormData.append('referenceId', milestone.msId || milestoneResponse.msId);
                        attachmentFormData.append('referenceNumber', formData.poNumber);

                        const uploadResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/po-attachments/upload`, {
                            method: 'POST',
                            headers: { Authorization: token },
                            body: attachmentFormData
                        });

                        if (!uploadResponse.ok) {
                            const uploadError = await uploadResponse.text();
                            console.warn(`Attachment upload failed: ${file.name} - ${uploadError}`);
                        }
                    }
                }

            }

            onSubmit?.();
            onClose();
            setCurrentStep(1);
            setEditingMilestone(null);
        } catch (error) {
            console.error('Error submitting milestones:', error);
            alert('Network error. Please try again.');
        }
    };

    const handleEditMilestone = (index) => {
        setEditingMilestone({ ...formData.milestones[index], index });
        setIsEditMilestoneModalOpen(true);
    };

    const handleRemoveMilestone = (index) => {
        setFormData((prev) => ({
            ...prev,
            milestones: prev.milestones.filter((_, i) => i !== index),
        }));
    };

    const fetchCountries = async () => {
        try {
            const response = await axios.get(`https://secure.geonames.org/countryInfoJSON?&username=bhagirathauti`);
            const countriesData = response.data.geonames.map(country => ({
                code: country.countryCode,
                name: country.countryName,
                geonameId: country.geonameId
            })).sort((a, b) => a.name.localeCompare(b.name));

            setCountries(countriesData);
        } catch (error) {
            console.error("Failed to fetch countries:", error);
        }
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-xl max-w-[90vw] w-full mx-4 max-h-[95vh] overflow-hidden flex flex-col">
                <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-green-900 truncate">
                        {currentStep === 1 ? 'Edit PO Details' : 'Edit Milestones'}
                    </h2>
                    <button
                        onClick={() => {
                            setCurrentStep(1);
                            setEditingMilestone(null);
                            setIsEditMilestoneModalOpen(false);
                            onClose();
                        }}
                        className="p-2 hover:bg-gray-200 rounded-full"
                        title="Close"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-grow">
                    {currentStep === 1 && (
                        <div className="space-y-6">
                            {/* PO Details Form Fields */}
                            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 items-end">
                                {/* PO Number, Type, Currency, Amount, Dates */}
                                <div className="lg:col-span-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-2 truncate" title="PO Number">
                                        PO Number <span className="text-red-500">*</span>
                                        <span className="float-right text-xs text-gray-500">
                                            {formData.poNumber.length}/100 characters
                                        </span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.poNumber}
                                        onChange={e => {
                                            let value = e.target.value;
                                            if (value.length > 100) value = value.slice(0, 100);
                                            setFormData(prev => ({ ...prev, poNumber: value }));
                                        }}
                                        className="w-full h-10 px-4 border border-gray-300 rounded-md truncate"
                                        title={formData.poNumber || "Enter PO Number"}
                                        placeholder="Enter PO Number"
                                        maxLength={100}
                                        required
                                    />
                                </div>
                                <div className="lg:col-span-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-2 truncate" title="PO Type">
                                        PO Type <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={formData.poType}
                                        onChange={handleChange('poType')}
                                        className="w-full h-10 px-4 border border-gray-300 rounded-md truncate"
                                        title={formData.poType || "Select PO Type"}
                                        required
                                    >
                                        <option value="">Select</option>
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
                                <div className='lg:col-span-1'>
                                    <label className="block text-sm font-medium text-gray-700 mb-2 truncate" title="Currency">
                                        Currency <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={formData.poCurrency}
                                        onChange={handleChange('poCurrency')}
                                        className="w-full h-10 px-4 border border-gray-300 rounded-md truncate"
                                        title={formData.poCurrency || "Currency"}
                                        required
                                    >
                                        <option value="USD">USD</option>
                                        <option value="INR">INR</option>
                                        <option value="EUR">EUR</option>
                                        <option value="GBP">GBP</option>
                                        <option value="JPY">JPY</option>
                                    </select>
                                </div>
                                <div className="lg:col-span-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-2 truncate" title="PO Amount">
                                        PO Amount <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-green-600 font-semibold">
                                            {currencySymbols[formData.poCurrency] || '$'}
                                        </span>
                                        <input
                                            type="text"
                                            value={formData.poAmount}
                                            onChange={e => {
                                                let value = e.target.value.replace(/[^0-9.]/g, '');
                                                const parts = value.split('.');
                                                if (parts.length > 2) value = parts[0] + '.' + parts[1];
                                                if (parts[0].length > 13) parts[0] = parts[0].slice(0, 13);
                                                if (parts[1]) parts[1] = parts[1].slice(0, 2);
                                                value = parts[1] !== undefined ? parts[0] + '.' + parts[1] : parts[0];
                                                setFormData(prev => ({ ...prev, poAmount: value }));
                                            }}
                                            className="w-full h-10 pl-8 pr-4 border border-gray-300 rounded-md truncate"
                                            title={formData.poAmount || "Enter PO Amount"}
                                            placeholder="Enter Amount"
                                            maxLength={16}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="lg:col-span-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-2 truncate" title="Start Date">
                                        PO Start Date <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative w-full h-10 border border-gray-300 rounded-md flex items-center">
                                        <Calendar className="absolute left-3 text-green-600" size={20} />
                                        <input
                                            ref={startDateRef}
                                            type="date"
                                            value={formData.poStartDate}
                                            onChange={handleChange('poStartDate')}
                                            className="w-full h-full bg-transparent outline-none cursor-pointer pl-10 truncate"
                                            title={formData.poStartDate || "Select Start Date"}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="lg:col-span-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-2 truncate" title="End Date">
                                        PO End Date <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative w-full h-10 border border-gray-300 rounded-md flex items-center">
                                        <Calendar className="absolute left-3 text-green-600" size={20} />
                                        <input
                                            ref={endDateRef}
                                            type="date"
                                            value={formData.poEndDate}
                                            onChange={handleChange('poEndDate')}
                                            className="w-full h-full bg-transparent outline-none cursor-pointer pl-10 truncate"
                                            title={formData.poEndDate || "Select End Date"}
                                            required
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label
                                        htmlFor="poSpoc"
                                        className="block text-sm font-medium text-gray-700 mb-2"
                                        title="Select an existing project or type a new one to create"
                                    >
                                        PM/SPOC Name
                                    </label>
                                    <div className="relative w-full">
                                        <Folder
                                            className="absolute left-3 top-1/2 -translate-y-1/2 text-green-600 z-11"
                                            size={20}
                                            title="Select or create project"
                                        />
                                        <CreatableSelect
                                            inputId="poSpoc"
                                            options={userOptions}
                                            value={
                                                formData.poSpoc
                                                    ? { label: formData.poSpoc, value: formData.poSpoc }
                                                    : null
                                            }
                                            onChange={(selectedOption) => {
                                                let value = selectedOption?.value || '';
                                                if (value.length > 255) value = value.slice(0, 255);
                                                setFormData(prev => ({ ...prev, poSpoc: value }));
                                            }}
                                            className="react-select-container z-10"
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
                                    <label className="block text-sm font-medium text-gray-700 mb-2 truncate" title="Project Name">
                                        Project Name <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative w-full">
                                        <Folder className="absolute left-3 top-1/2 -translate-y-1/2 text-green-600 z-11" size={20} />
                                        <CreatableSelect
                                            options={projectOptions}
                                            value={formData.projectName ? { label: formData.projectName, value: formData.projectName } : null}
                                            onChange={(opt) => {
                                                let value = opt?.value || '';
                                                if (value.length > 255) value = value.slice(0, 255);
                                                setFormData(prev => ({ ...prev, projectName: value }));
                                            }}
                                            styles={{
                                                control: (base) => ({
                                                    ...base,
                                                    height: '40px',
                                                    paddingLeft: '28px'
                                                }),
                                                singleValue: (base) => ({
                                                    ...base,
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                    overflow: 'hidden'
                                                })
                                            }}
                                            className="react-select-container z-10"
                                            placeholder="Select or create project"
                                            title={formData.projectName || "Select or create project"}
                                            required
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2 truncate" title="Customer Name">
                                        Customer Name <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative w-full">
                                        <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-green-600 z-11" size={20} />
                                        <CreatableSelect
                                            options={userOptions}
                                            value={formData.customer ? { label: formData.customer, value: formData.customer } : null}
                                            onChange={(opt) => {
                                                let value = opt?.value || '';
                                                if (value.length > 255) value = value.slice(0, 255);
                                                setFormData(prev => ({ ...prev, customer: value }));
                                            }}
                                            styles={{
                                                control: (base) => ({
                                                    ...base,
                                                    height: '40px',
                                                    paddingLeft: '28px'
                                                }),
                                                singleValue: (base) => ({
                                                    ...base,
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                    overflow: 'hidden'
                                                })
                                            }}
                                            className="react-select-container z-10"
                                            placeholder="Select or create project"
                                            title={formData.customer || "Select or create customer"}
                                            required
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2 truncate" title="Supplier Name">
                                        Supplier Name <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-green-600" size={20} />
                                        <input
                                            type="text"
                                            value={formData.supplier}
                                            onChange={e => {
                                                let value = e.target.value;
                                                if (value.length > 255) value = value.slice(0, 255);
                                                setFormData(prev => ({ ...prev, supplier: value }));
                                            }}
                                            className="w-full h-10 pl-10 pr-4 border border-gray-300 rounded-md truncate"
                                            title={formData.supplier || "Enter Supplier Name"}
                                            placeholder="Enter Supplier Name"
                                            maxLength={255}
                                            required
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
                                            className="absolute left-3 top-1/2  -translate-y-1/2 text-green-600 z-10"
                                            size={20}
                                            title="Select or create sponsor"
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
                                                setFormData(prev => ({ ...prev, sponsorName: value }));
                                            }}
                                            className="react-select-container"
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
                                            className="absolute left-3 top-1/2  -translate-y-1/2 text-green-600 z-9"
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
                                                let value = selectedOption?.value || '';
                                                if (value.length > 255) value = value.slice(0, 255);
                                                setFormData(prev => ({ ...prev, sponsorLob: value }));
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
                                            className="absolute left-3 top-1/2  -translate-y-1/2 text-green-600 z-9"
                                            size={20}
                                            title="Select or create project"
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
                                                let value = selectedOption?.value || '';
                                                if (value.length > 255) value = value.slice(0, 255);
                                                setFormData(prev => ({ ...prev, budgetLineItem: value }));
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
                                    <label className="block text-sm font-medium text-gray-700 mb-2 truncate" title="Budget Line Amount">
                                        Budget Line Amount <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-green-600 font-semibold">
                                            {currencySymbols[formData.poCurrency] || '$'}
                                        </span>
                                        <input
                                            type="text"
                                            value={formData.budgetLineAmount}
                                            onChange={e => {
                                                let value = e.target.value.replace(/[^0-9.]/g, '');
                                                const parts = value.split('.');
                                                if (parts.length > 2) value = parts[0] + '.' + parts[1];
                                                if (parts[0].length > 13) parts[0] = parts[0].slice(0, 13);
                                                if (parts[1]) parts[1] = parts[1].slice(0, 2);
                                                value = parts[1] !== undefined ? parts[0] + '.' + parts[1] : parts[0];
                                                setFormData(prev => ({ ...prev, budgetLineAmount: value }));
                                            }}
                                            className="w-full h-10 pl-8 pr-4 border border-gray-300 rounded-md truncate"
                                            title={formData.budgetLineAmount || "Enter Budget Line Amount"}
                                            placeholder="Enter Amount"
                                            maxLength={16}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="lg:col-span-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-2 truncate" title="Business Value Amount">
                                        Business Value Amount
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-green-600 font-semibold">
                                            {currencySymbols[formData.poCurrency] || '$'}
                                        </span>
                                        <input
                                            type="text"
                                            value={formData.businessValueAmount}
                                            onChange={e => {
                                                let value = e.target.value.replace(/[^0-9.]/g, '');
                                                const parts = value.split('.');
                                                if (parts.length > 2) value = parts[0] + '.' + parts[1];
                                                if (parts[0].length > 13) parts[0] = parts[0].slice(0, 13);
                                                if (parts[1]) parts[1] = parts[1].slice(0, 2);
                                                value = parts[1] !== undefined ? parts[0] + '.' + parts[1] : parts[0];
                                                setFormData(prev => ({ ...prev, businessValueAmount: value }));
                                            }}
                                            className="w-full h-10 pl-8 pr-4 border border-gray-300 rounded-md truncate"
                                            title={formData.businessValueAmount || "Enter Business Value Amount"}
                                            placeholder="Enter Amount"
                                            maxLength={16}
                                            required
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
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                                {/* SPOC, Project, Customer, Supplier, Attachments */}





                            </div>
                            
                            <div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2 truncate" title="Project Description">
                                        Project Description
                                        <span className="float-right text-xs text-gray-500">
                                            {formData.poDesc?.length || 0}/500 characters
                                        </span>
                                    </label>
                                    <textarea
                                        rows={3}
                                        value={formData.poDesc}
                                        onChange={e => {
                                            let value = e.target.value;
                                            if (value.length > 500) value = value.slice(0, 500);
                                            setFormData(prev => ({ ...prev, poDesc: value }));
                                        }}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-md resize-none"
                                        title={formData.poDesc || "Enter Project Description"}
                                        placeholder="Enter Project Description"
                                        maxLength={500}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2 truncate" title="Budget Line Remarks">
                                        Budget Line Remarks
                                        <span className="float-right text-xs text-gray-500">
                                            {formData.budgetLineRemarks?.length || 0}/500 characters
                                        </span>
                                    </label>
                                    <textarea
                                        rows={3}
                                        value={formData.budgetLineRemarks}
                                        onChange={e => {
                                            let value = e.target.value;
                                            if (value.length > 500) value = value.slice(0, 500);
                                            setFormData(prev => ({ ...prev, budgetLineRemarks: value }));
                                        }}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-md resize-none"
                                        title={formData.budgetLineRemarks || "Enter Budget Line Remarks"}
                                        placeholder="Enter Budget Line Remarks"
                                        maxLength={500}
                                    />
                                </div>
                                <div className="lg:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">PO Attachments (Max 4)</label>
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
                                        className="w-[300px] h-10 pl-10 pr-4 border border-gray-300 rounded-md flex items-center cursor-pointer"
                                    >
                                        <Upload className="absolute left-3 top-1/2 -translate-y-1/2 text-green-600" size={20} />
                                        <span className="text-gray-500 truncate">
                                            {poAttachments.length > 0 ? `${poAttachments.length} file(s) selected` : 'Click to select files'}
                                        </span>
                                    </label>
                                </div>

                                <ul className="mt-2 text-sm text-gray-700 flex flex-wrap gap-2">
                                    {poAttachments.map((file, index) => (
                                        <li
                                            key={index}
                                            className="flex max-w-[150px] items-center justify-between bg-gray-100 px-3 py-1 rounded"
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
                            </div>

                        </div>
                    )}

                    {currentStep === 2 && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-semibold text-green-900 truncate" title="Milestones Details">
                                    Milestones Details
                                </h3>
                            </div>
                            <div className="h-96 w-full border border-gray-200 rounded-md">
                                <div className="ag-theme-alpine h-full w-full">
                                    <AgGridReact
                                        key={formData.milestones.length}
                                        columnDefs={milestoneColumnDefs}
                                        rowData={formData.milestones}
                                        defaultColDef={defaultColDef}
                                        rowHeight={48}
                                        headerHeight={48}
                                        components={{ AttachmentRenderer }}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-3 pt-4 px-6 pb-6 border-t border-gray-200 bg-gray-50">
                    {currentStep === 1 ? (
                        <button
                            onClick={handleNextStep}
                            className="px-6 py-2 bg-green-700 text-white rounded-md hover:bg-green-800"
                        >
                            Submit
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmitMilestones}
                            className="px-6 py-2 bg-green-700 text-white rounded-md hover:bg-green-800"
                        >
                            Submit
                        </button>
                    )}
                </div>
            </div>

            {isEditMilestoneModalOpen && (
                <EditMilestoneModal
                    open={isEditMilestoneModalOpen}
                    onClose={() => setIsEditMilestoneModalOpen(false)}
                    onSubmit={(updatedMilestone) => {
                        if (editingMilestone?.index !== undefined) {
                            const updatedMilestones = [...formData.milestones];
                            updatedMilestones[editingMilestone.index] = updatedMilestone;
                            setFormData({ ...formData, milestones: updatedMilestones });
                        } else {
                            setFormData((prev) => ({
                                ...prev,
                                milestones: [...prev.milestones, updatedMilestone],
                            }));
                        }
                        setIsEditMilestoneModalOpen(false);
                    }}
                    initialData={editingMilestone || {}}
                />
            )}
        </div>

    );
};

export default EditPOModal;
