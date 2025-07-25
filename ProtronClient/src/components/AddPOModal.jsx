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
    FileText
} from 'lucide-react';

// Currency symbols mapping
const currencySymbols = {
    USD: '$',
    INR: '₹',
    EUR: '€',
    GBP: '£',
    JPY: '¥'
};

const AddPOModal = ({ open, onClose, onSubmit }) => {
    const [formData, setFormData] = useState({
        poNumber: '',
        poType: '',
        poAmount: '',
        currency: 'USD',
        customerName: '',
        supplierName: sessionStorage.getItem('tenantName') || '',
        projectName: '',
        spocName: '',
        startDate: '',
        endDate: '',
        projectDescription: '',
        poAttachments: [], // Changed from null to array
        milestones: []
    });

    const [users, setUsers] = useState([]);
    const StartDateInputRef = useRef(null);
    const EndDateInputRef = useRef(null);
    const [projects, setProjects] = useState([]);
    const projectOptions = projects.map((project) => ({
        value: project.projectName,
        label: project.projectName,
    }));
    const [activeTab, setActiveTab] = useState('details');
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
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/projects`, {
                headers: { Authorization: `${token}` }
            });
            const data = await res.json();
            setProjects(data);
        } catch (error) {
            console.log({ message: error });
        }
    };

    useEffect(() => {
        if (open) {
            fetchUsers();
            fetchProjects();
        }
    }, [open]);

    const handleChange = (field) => (event) => {
        setFormData((prev) => ({
            ...prev,
            [field]: event.target.value
        }));
    };

    const handleFileChange = (field) => (event) => {
        // Handle multiple files for PO attachments, limited to 4
        if (field === 'poAttachments') {
            const files = Array.from(event.target.files).slice(0, 4);
            if (event.target.files.length > 4) {
                alert("You can only upload a maximum of 4 files for the PO.");
            }
            setFormData((prev) => ({
                ...prev,
                [field]: files
            }));
        }
    };

    const handleAddMilestone = () => {
        const newMilestone = {
            milestoneName: 'Click to add milestone name',
            milestoneDescription: 'Click to add description',
            amount: 0,
            currency: formData.currency,
            date: new Date().toISOString().split('T')[0],
            duration: 0,
            remark: 'Click to add remark',
            attachment: null
        };
        setFormData(prev => ({
            ...prev,
            milestones: [...prev.milestones, newMilestone]
        }));
    };

    const handleMilestoneFileChange = (rowIndex, event) => {
        const file = event.target.files[0];
        const updatedMilestones = [...formData.milestones];
        updatedMilestones[rowIndex].attachment = file;
        setFormData(prev => ({
            ...prev,
            milestones: updatedMilestones
        }));
    };

    const handleRemoveMilestone = (index) => {
        setFormData(prev => ({
            ...prev,
            milestones: prev.milestones.filter((_, i) => i !== index)
        }));
    };

    const onCellValueChanged = (params) => {
        const updatedMilestones = [...formData.milestones];
        const rowIndex = params.node.rowIndex;

        if (params.colDef.field === 'amount') {
            updatedMilestones[rowIndex].amount = parseFloat(params.newValue) || 0;
        } else if (params.colDef.field === 'duration') {
            updatedMilestones[rowIndex].duration = parseInt(params.newValue) || 0;
        } else if (params.colDef.field === 'currency') {
            updatedMilestones[rowIndex].currency = params.newValue;
        } else {
            if (params.colDef.field === 'milestoneName' && params.oldValue === 'Click to add milestone name') {
                updatedMilestones[rowIndex][params.colDef.field] = params.newValue === 'Click to add milestone name' ? '' : params.newValue;
            } else if (params.colDef.field === 'milestoneDescription' && params.oldValue === 'Click to add description') {
                updatedMilestones[rowIndex][params.colDef.field] = params.newValue === 'Click to add description' ? '' : params.newValue;
            } else if (params.colDef.field === 'remark' && params.oldValue === 'Click to add remark') {
                updatedMilestones[rowIndex][params.colDef.field] = params.newValue === 'Click to add remark' ? '' : params.newValue;
            } else {
                updatedMilestones[rowIndex][params.colDef.field] = params.newValue;
            }
        }

        setFormData(prev => ({
            ...prev,
            milestones: updatedMilestones
        }));
    };

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
            editable: true,
            cellEditor: 'agTextCellEditor',
            cellRenderer: (params) => {
                return params.value === 'Click to add milestone name' ?
                    <span className="text-gray-400 italic">+ Click to add milestone name</span> :
                    params.value;
            }
        },
        {
            headerName: 'Milestone Description',
            field: 'milestoneDescription',
            flex: 2,
            editable: true,
            cellEditor: 'agTextCellEditor',
            cellRenderer: (params) => {
                return params.value === 'Click to add description' ?
                    <span className="text-gray-400 italic">+ Click to add description</span> :
                    params.value;
            }
        },
        {
            headerName: 'Amount',
            field: 'amount',
            width: 120,
            editable: true,
            cellEditor: 'agNumberCellEditor',
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
            editable: true,
            cellEditor: 'agSelectCellEditor',
            cellEditorParams: {
                values: ['USD', 'INR', 'EUR', 'GBP', 'JPY']
            }
        },
        {
            headerName: 'Date',
            field: 'date',
            width: 150,
            editable: true,
            cellEditor: 'agDateCellEditor',
            valueFormatter: (params) => {
                return params.value ? new Date(params.value).toLocaleDateString() : '';
            }
        },
        {
            headerName: 'Duration (Days)',
            field: 'duration',
            width: 130,
            editable: true,
            cellEditor: 'agNumberCellEditor'
        },
        {
            headerName: 'Remark',
            field: 'remark',
            flex: 1,
            editable: true,
            cellEditor: 'agTextCellEditor',
            cellRenderer: (params) => {
                return params.value === 'Click to add remark' ?
                    <span className="text-gray-400 italic">+ Click to add remark</span> :
                    params.value;
            }
        },
        {
            headerName: 'Attachment',
            field: 'attachment',
            width: 120,
            editable: false,
            cellRenderer: (params) => {
                const rowIndex = params.node.rowIndex;
                return (
                    <div className="flex justify-center items-center h-full">
                        <input
                            type="file"
                            id={'milestone-file-' + rowIndex}
                            style={{ display: 'none' }}
                            onChange={(e) => handleMilestoneFileChange(rowIndex, e)}
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        />
                        <button
                            onClick={() => document.getElementById('milestone-file-' + rowIndex).click()}
                            className="p-1 rounded-full hover:bg-blue-100 text-blue-600 transition-colors"
                            title="Upload attachment"
                        >
                            <Upload size={16} />
                        </button>
                        {params.data.attachment ? (
                            <span className="ml-1 text-xs text-green-600">✓</span>
                        ) : (
                            <span className="ml-1 text-xs text-gray-400">+ Add file</span>
                        )}
                    </div>
                );
            }
        },
        {
            headerName: 'Actions',
            field: 'actions',
            width: 100,
            sortable: false,
            filter: false,
            cellRenderer: (params) => (
                <div className="flex justify-center items-center h-full">
                    <button
                        onClick={() => handleRemoveMilestone(params.node.rowIndex)}
                        className="p-1 rounded-full hover:bg-red-100 text-red-600 transition-colors"
                        title="Remove milestone"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            )
        }
    ];

    const defaultColDef = {
        sortable: true,
        filter: true,
        resizable: true
    };

    const uploadAttachment = async (poNumber, entityType, entityId, slot, file, user) => {
        const uploadFormData = new FormData();
        uploadFormData.append('poNumber', poNumber);
        uploadFormData.append('entityType', entityType);
        if (entityId) {
            uploadFormData.append('entityId', entityId);
        }
        uploadFormData.append('attachmentSlot', slot);
        uploadFormData.append('file', file);
        uploadFormData.append('updatedBy', user);

        try {
            const token = sessionStorage.getItem('token');
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/po-attachments/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `${token}`,
                },
                body: uploadFormData,
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Attachment upload failed: ${errorText}`);
            }
            console.log(`Attachment for ${entityType} ${entityId || ''} in slot ${slot} uploaded successfully.`);
        } catch (error) {
            console.error(`Error uploading attachment for ${entityType}:`, error);
        }
    };

    const handleSubmit = async () => {
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
                projectName: formData.projectName,
                poStartDate: formData.startDate || null,
                poEndDate: formData.endDate || null,
            };

            const token = sessionStorage.getItem('token');
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/api/po/add`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(poPayload)
                }
            );

            if (response.ok) {
                const poData = await response.json();
                console.log('PO Created:', poData);
                const currentUser = sessionStorage.getItem('username') || 'system';

                // --- MODIFIED: Upload PO Attachments (up to 4) ---
                if (formData.poAttachments.length > 0) {
                    for (const [index, file] of formData.poAttachments.entries()) {
                        // The loop is already limited to 4 by handleFileChange
                        await uploadAttachment(poData.poNumber, 'PO', null, `po_attachment${index + 1}`, file, currentUser);
                    }
                }

                // --- MODIFIED: Upload Milestone Attachments with a 4-file limit ---
                if (formData.milestones.length > 0) {
                    let milestoneAttachmentCount = 0;
                    for (const milestone of formData.milestones) {
                        if (milestone.milestoneName && milestone.milestoneName.trim() && milestone.milestoneName !== 'Click to add milestone name') {
                            const milestonePayload = {
                                msName: milestone.milestoneName,
                                msDesc: milestone.milestoneDescription || '',
                                msAmount: parseInt(milestone.amount) || 0,
                                msCurrency: formData.currency,
                                msDate: milestone.date || null,
                                msDuration: parseInt(milestone.duration) || 0,
                                msRemarks: milestone.remark || '',
                                poId: poData.poId || poData.id,
                                poNumber: formData.poNumber
                            };

                            const milestoneResponse = await fetch(
                                `${import.meta.env.VITE_API_URL}/api/po-milestone/add`,
                                {
                                    method: 'POST',
                                    headers: {
                                        'Authorization': `${token}`,
                                        'Content-Type': 'application/json'
                                    },
                                    body: JSON.stringify(milestonePayload)
                                }
                            );

                            if (milestoneResponse.ok) {
                                const milestoneData = await milestoneResponse.json();
                                console.log('Milestone created:', milestoneData);

                                // If this milestone has an attachment, upload it, respecting the limit
                                if (milestone.attachment) {
                                    milestoneAttachmentCount++;
                                    if (milestoneAttachmentCount <= 4) {
                                        await uploadAttachment(poData.poNumber, 'MS', milestoneData.msId, `ms_attachment${milestoneAttachmentCount}`, milestone.attachment, currentUser);
                                    } else {
                                        console.warn(`Skipping milestone attachment upload: Maximum of 4 milestone attachments reached.`);
                                        alert('Warning: Maximum of 4 milestone attachments reached. Some files were not uploaded.');
                                    }
                                }
                            } else {
                                const milestoneError = await milestoneResponse.text();
                                console.error('Milestone creation error:', milestoneError);
                            }
                        }
                    }
                }

                onSubmit?.(poData);
                handleReset();
                onClose();
            } else {
                const errorData = await response.text();
                console.error('PO Creation Error:', errorData);
                alert('Failed to create PO. Please check the console for details.');
            }
        } catch (error) {
            console.error('Error creating PO:', error);
            alert('Network error. Please try again.');
        }
    };

    const handleReset = () => {
        setFormData({
            poNumber: '',
            poType: '',
            poAmount: '',
            currency: 'USD',
            customerName: '',
            supplierName: sessionStorage.getItem('tenantName') || '',
            projectName: '',
            spocName: '',
            startDate: '',
            endDate: '',
            projectDescription: '',
            poAttachments: [],
            milestones: []
        });
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full mx-4 max-h-[95vh] overflow-hidden flex flex-col">
                <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-green-900">Create New PO</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="border-b border-gray-200">
                    <nav className="flex px-6" aria-label="Tabs">
                        <button
                            onClick={() => setActiveTab('details')}
                            className={`py-4 px-4 text-sm font-medium border-b-2 ${activeTab === 'details'
                                ? 'border-green-500 text-green-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                } transition-colors`}
                        >
                            PO Details
                        </button>
                        <button
                            onClick={() => setActiveTab('milestones')}
                            className={`py-4 px-4 text-sm font-medium border-b-2 ${activeTab === 'milestones'
                                ? 'border-green-500 text-green-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                } transition-colors`}
                        >
                            Milestone Details
                        </button>
                    </nav>
                </div>

                <div className="p-6 overflow-y-auto flex-grow">
                    {activeTab === 'details' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 items-end">
                                <div className="lg:col-span-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">PO Number</label>
                                    <input
                                        type="text"
                                        placeholder="Enter here"
                                        value={formData.poNumber}
                                        onChange={handleChange('poNumber')}
                                        className="w-full h-10 px-4 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                    />
                                </div>
                                <div className="lg:col-span-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">PO Type</label>
                                    <select
                                        value={formData.poType}
                                        onChange={handleChange('poType')}
                                        className="w-full h-10 px-4 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                    >
                                        <option value="">Select from list</option>
                                        <option value="FIXED">Fixed</option>
                                        <option value="T_AND_M">T & M</option>
                                        <option value="MIXED">Mixed</option>
                                    </select>
                                </div>
                                <div className='lg:col-span-1'>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
                                    <select
                                        value={formData.currency}
                                        onChange={handleChange('currency')}
                                        className="w-full h-10 px-4 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
                                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-600 font-semibold">
                                            {currencySymbols[formData.currency] || '$'}
                                        </span>
                                        <input
                                            type="number"
                                            placeholder="Enter here"
                                            value={formData.poAmount}
                                            onChange={handleChange('poAmount')}
                                            className="w-full h-10 pl-8 pr-4 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                        />
                                    </div>
                                </div>
                                <div className="lg:col-span-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                                    <div
                                        onClick={() => StartDateInputRef.current?.showPicker?.()}
                                        className="relative w-full h-10 pl-10 pr-4 border border-gray-300 rounded-md focus-within:ring-2 focus-within:ring-green-500 focus-within:border-green-500 cursor-pointer flex items-center"
                                    >
                                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-600" size={20} />
                                        <input
                                            ref={StartDateInputRef}
                                            type="date"
                                            value={formData.startDate}
                                            onChange={handleChange('startDate')}
                                            className="w-full bg-transparent outline-none cursor-pointer"
                                        />
                                    </div>
                                </div>
                                <div className="lg:col-span-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                                    <div onClick={() => EndDateInputRef.current?.showPicker?.()} className="relative w-full h-10 pl-10 pr-4 border border-gray-300 rounded-md focus-within:ring-2 focus-within:ring-green-500 focus-within:border-green-500 flex items-center">
                                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-600" size={20} />
                                        <input
                                            ref={EndDateInputRef}
                                            type="date"
                                            value={formData.endDate}
                                            onChange={handleChange('endDate')}
                                            className="w-full bg-transparent outline-none cursor-pointer"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">PM/SPOC Name</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-600" size={20} />
                                        <input
                                            type="text"
                                            placeholder="Enter here"
                                            value={formData.spocName}
                                            onChange={handleChange('spocName')}
                                            className="w-full h-10 pl-10 pr-4 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Project Name
                                    </label>
                                    <div className="relative w-full">
                                        <Folder className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-600 z-10" size={20} />
                                        <CreatableSelect
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
                                            className="react-select-container"
                                            classNamePrefix="react-select"
                                            placeholder="Type or select project"
                                            isSearchable
                                            isClearable
                                            formatCreateLabel={(inputValue) => `Add "${inputValue}"`}
                                            styles={{
                                                control: (base) => ({ ...base, height: '40px', paddingLeft: '28px', borderColor: '#d1d5db' }),
                                                valueContainer: (base) => ({ ...base, padding: '0 6px' }),
                                            }}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Customer Name</label>
                                    <div className="relative">
                                        <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-600" size={20} />
                                        <input
                                            type="text"
                                            placeholder="Enter customer name"
                                            value={formData.customerName}
                                            onChange={handleChange('customerName')}
                                            className="w-full h-10 pl-10 pr-4 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Supplier Name</label>
                                    <div className="relative">
                                        <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-600" size={20} />
                                        <input
                                            type="text"
                                            placeholder="Enter supplier name"
                                            value={formData.supplierName}
                                            onChange={handleChange('supplierName')}
                                            className="w-full h-10 pl-10 pr-4 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                        />
                                    </div>
                                </div>
                                <div className="lg:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">PO Attachments (Max 4)</label>
                                    <div className="relative">
                                        <input
                                            type="file"
                                            id="po-attachment-input"
                                            multiple
                                            onChange={handleFileChange('poAttachments')}
                                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                            className="hidden"
                                        />
                                        <label htmlFor="po-attachment-input" className="w-full h-10 pl-10 pr-4 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 flex items-center cursor-pointer">
                                            <Upload className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-600" size={20} />
                                            <span className="text-gray-500 truncate">
                                                {formData.poAttachments.length > 0
                                                    ? `${formData.poAttachments.length} file(s) selected`
                                                    : 'Click to select files'
                                                }
                                            </span>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Project Description</label>
                                <textarea
                                    placeholder="Enter here"
                                    rows={3}
                                    value={formData.projectDescription}
                                    onChange={handleChange('projectDescription')}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
                                    maxLength={500}
                                />
                            </div>
                        </div>
                    )}

                    {activeTab === 'milestones' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-semibold text-green-900">Milestones Details</h3>
                                <button
                                    onClick={handleAddMilestone}
                                    className="flex items-center px-4 py-2 bg-green-700 text-white rounded-md hover:bg-green-800 transition-colors"
                                >
                                    <Plus size={16} className="mr-2" />
                                    Add Row
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
                                        onCellValueChanged={onCellValueChanged}
                                        animateRows={true}
                                        rowHeight={48}
                                        headerHeight={48}
                                        noRowsOverlayComponent={() => (
                                            <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-3">
                                                <div className="text-6xl text-gray-300">+</div>
                                                <div className="text-center">
                                                    <p className="text-lg font-medium">No milestones added yet</p>
                                                    <p className="text-sm">Click "Add Row" above to get started</p>
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
                    <button
                        onClick={onClose}
                        className="px-6 py-2 border border-green-700 text-green-700 rounded-md hover:bg-green-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleReset}
                        className="px-6 py-2 border border-green-700 text-green-700 rounded-md hover:bg-green-50 transition-colors"
                    >
                        Reset
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="px-6 py-2 bg-green-700 text-white rounded-md hover:bg-green-800 transition-colors font-semibold"
                    >
                        Create PO
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddPOModal;
