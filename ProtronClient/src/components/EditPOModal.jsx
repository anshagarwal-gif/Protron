// EditPOModal.js
import React, { useEffect, useState, useRef } from 'react';
import Select from 'react-select';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
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

const EditPOModal = ({ open, onClose, onSubmit, poId }) => {
    const [formData, setFormData] = useState({
        poId: '',
        poNumber: '',
        poType: '',
        poAmount: '',
        poCurrency: 'USD',
        customer: '',
        supplier: '',
        projectName: '',
        poSpoc: '',
        poStartDate: '',
        poEndDate: '',
        poDesc: '',
        poAttachment: null,
        milestones: []
    });

    const [initialFormData, setInitialFormData] = useState({});
    const [users, setUsers] = useState([]);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(false);
    const startDateRef = useRef(null);
    const endDateRef = useRef(null);
    const projectOptions = projects.map((project) => ({
    value: project.projectName,
    label: project.projectName,
  }));

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

    const fetchPOData = async () => {
        if (!poId) return;

        setLoading(true);
        try {
            const token = sessionStorage.getItem('token');

            // Fetch PO details
            const poResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/po/${poId}`, {
                headers: { Authorization: `${token}` }
            });
            const poData = await poResponse.json();

            // Fetch milestones for this PO
            const milestonesResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/po-milestone/po/${poId}`, {
                headers: { Authorization: `${token}` }
            });
            const milestonesData = await milestonesResponse.json();

            console.log('Raw milestones data from API:', milestonesData); // Debug log

            // Map the backend data to form structure
            const mappedFormData = {
                poId: poData.poId,
                poNumber: poData.poNumber || '',
                poType: poData.poType || '',
                poAmount: poData.poAmount || '',
                poCurrency: poData.poCurrency || 'USD',
                customer: poData.customer || '',
                supplier: poData.supplier || '',
                projectName: poData.projectName || '',
                poSpoc: poData.poSpoc || '',
                poStartDate: poData.poStartDate || '',
                poEndDate: poData.poEndDate || '',
                poDesc: poData.poDesc || '',
                poAttachment: null, // File attachments need to be handled separately
                milestones: milestonesData.map(milestone => {
                    console.log('Processing milestone:', milestone); // Debug log

                    // Handle date formatting - convert from backend date to YYYY-MM-DD format
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
                        remark: milestone.msRemarks || '', // This should now work correctly
                        attachment: null // File attachments need to be handled separately
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

    useEffect(() => {
        if (open && poId) {
            fetchUsers();
            fetchProjects();
            fetchPOData();
        }
    }, [open, poId]);

    const handleChange = (field) => (event) => {
        setFormData((prev) => ({
            ...prev,
            [field]: event.target.value
        }));
    };

    const handleFileChange = (field) => (event) => {
        const file = event.target.files[0];
        setFormData((prev) => ({
            ...prev,
            [field]: file
        }));
    };

    // AG Grid column definitions for milestones
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
            cellEditor: 'agTextCellEditor'
        },
        {
            headerName: 'Milestone Description',
            field: 'milestoneDescription',
            flex: 2,
            editable: true,
            cellEditor: 'agTextCellEditor'
        },
        {
            headerName: 'Amount',
            field: 'amount',
            width: 120,
            editable: true,
            cellEditor: 'agNumberCellEditor',
            valueFormatter: (params) => {
                const amount = params.value;
                const currency = params.data.currency || formData.poCurrency;
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
            cellEditor: 'agTextCellEditor'
        },
        {
            headerName: 'Attachment',
            field: 'attachment',
            width: 120,
            editable: false,
            cellRenderer: 'attachmentRenderer'
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

    const handleAddMilestone = () => {
        const newMilestone = {
            msId: null, // New milestone, no ID yet
            milestoneName: '',
            milestoneDescription: '',
            amount: 0,
            currency: formData.poCurrency,
            date: new Date().toISOString().split('T')[0],
            duration: 0,
            remark: '',
            attachment: null
        };
        setFormData(prev => ({
            ...prev,
            milestones: [...prev.milestones, newMilestone]
        }));
    };

    const handleRemoveMilestone = (index) => {
        setFormData(prev => ({
            ...prev,
            milestones: prev.milestones.filter((_, i) => i !== index)
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

    // Custom cell renderer component
    const AttachmentRenderer = (params) => {
        const rowIndex = params.node.rowIndex;
        const fileInputId = 'editfile' + rowIndex;

        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <input
                    type="file"
                    id={fileInputId}
                    style={{ display: 'none' }}
                    onChange={(e) => handleMilestoneFileChange(rowIndex, e)}
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                />
                <button
                    onClick={() => document.getElementById(fileInputId).click()}
                    style={{
                        padding: '4px',
                        borderRadius: '50%',
                        border: 'none',
                        background: 'transparent',
                        cursor: 'pointer',
                        color: '#2563eb'
                    }}
                    title="Upload attachment"
                >
                    📎
                </button>
                {params.data.attachment && (
                    <span style={{ marginLeft: '4px', fontSize: '12px', color: '#059669' }}>✓</span>
                )}
            </div>
        );
    };

    const onCellValueChanged = (params) => {
        console.log('Cell changed:', params.colDef.field, params.newValue);

        const updatedMilestones = [...formData.milestones];
        const rowIndex = params.node.rowIndex;

        if (params.colDef.field === 'amount') {
            updatedMilestones[rowIndex].amount = parseFloat(params.newValue) || 0;
        } else if (params.colDef.field === 'duration') {
            updatedMilestones[rowIndex].duration = parseInt(params.newValue) || 0;
        } else if (params.colDef.field === 'currency') {
            updatedMilestones[rowIndex].currency = params.newValue;
        } else {
            updatedMilestones[rowIndex][params.colDef.field] = params.newValue;
        }

        setFormData(prev => ({
            ...prev,
            milestones: updatedMilestones
        }));
    };

    const handleSubmit = async () => {
        try {
            const poPayload = {
                poNumber: formData.poNumber,
                poType: formData.poType,
                poDesc: formData.poDesc || '',
                poAmount: parseFloat(formData.poAmount) || 0,
                poCurrency: formData.poCurrency,
                poSpoc: formData.poSpoc,
                supplier: formData.supplier,
                customer: formData.customer,
                projectName: formData.projectName,
                poStartDate: formData.poStartDate || null,
                poEndDate: formData.poEndDate || null,
            };

            console.log('Updating PO with payload:', poPayload);

            const token = sessionStorage.getItem('token');
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/api/po/edit/${poId}`,
                {
                    method: 'PUT',
                    headers: {
                        'Authorization': `${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(poPayload)
                }
            );

            if (response.ok) {
                const data = await response.json();
                console.log('PO Updated:', data);

                // Handle milestones - update existing and create new ones
                for (const milestone of formData.milestones) {
                    if (milestone.milestoneName && milestone.milestoneName.trim()) {
                        const milestonePayload = {
                            msName: milestone.milestoneName,
                            msDesc: milestone.milestoneDescription || '',
                            msAmount: parseInt(milestone.amount) || 0,
                            msCurrency: milestone.currency || formData.poCurrency,
                            msDate: milestone.date || null,
                            msDuration: parseInt(milestone.duration) || 0,
                            msRemarks: milestone.remark || '',
                            poId: poId,
                            poNumber: formData.poNumber
                        };

                        console.log('Processing milestone:', milestone);

                        if (milestone.msId) {
                            // Update existing milestone
                            const milestoneResponse = await fetch(
                                `${import.meta.env.VITE_API_URL}/api/po-milestone/edit/${milestone.msId}`,
                                {
                                    method: 'PUT',
                                    headers: {
                                        'Authorization': `${token}`,
                                        'Content-Type': 'application/json'
                                    },
                                    body: JSON.stringify(milestonePayload)
                                }
                            );

                            if (!milestoneResponse.ok) {
                                const milestoneError = await milestoneResponse.text();
                                console.error('Failed to update milestone:', milestoneError);
                            }
                        } else {
                            // Create new milestone
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

                            if (!milestoneResponse.ok) {
                                const milestoneError = await milestoneResponse.text();
                                console.error('Failed to create milestone:', milestoneError);
                            }
                        }
                    }
                }

                onSubmit?.(data);
                onClose();
            } else {
                const errorData = await response.text();
                console.error('PO Update Error:', errorData);
                alert('Failed to update PO. Please check the console for details.');
            }
        } catch (error) {
            console.error('Error updating PO:', error);
            alert('Network error. Please try again.');
        }
    };

    const handleReset = () => {
        setFormData({ ...initialFormData });
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full mx-4 max-h-[95vh] overflow-hidden">
                <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-green-900">Edit PO</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto max-h-[calc(95vh-120px)]">
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700 mx-auto"></div>
                                <p className="mt-4 text-gray-600">Loading PO data...</p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">PO Number</label>
                                    <input
                                        type="text"
                                        placeholder="Enter here"
                                        value={formData.poNumber}
                                        onChange={handleChange('poNumber')}
                                        className="w-full h-14 px-4 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">PO Type</label>
                                    <select
                                        value={formData.poType}
                                        onChange={handleChange('poType')}
                                        className="w-full h-14 px-4 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                    >
                                        <option value="">Select from list</option>
                                        <option value="FIXED">Fixed</option>
                                        <option value="T_AND_M">T & M</option>
                                        <option value="MIXED">Mixed</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
                                    <select
                                        value={formData.poCurrency}
                                        onChange={handleChange('poCurrency')}
                                        className="w-full h-14 px-4 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                    >
                                        <option value="USD">USD</option>
                                        <option value="INR">INR</option>
                                        <option value="EUR">EUR</option>
                                        <option value="GBP">GBP</option>
                                        <option value="JPY">JPY</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-4 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">PO Amount</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-600 font-semibold">
                                            {currencySymbols[formData.poCurrency] || '$'}
                                        </span>
                                        <input
                                            type="number"
                                            placeholder="Enter here"
                                            value={formData.poAmount}
                                            onChange={handleChange('poAmount')}
                                            className="w-full h-14 pl-12 pr-4 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                                    <div
                                        onClick={() => startDateRef.current?.showPicker?.()}
                                        className="relative w-full h-14 pl-12 pr-4 border border-gray-300 rounded-md focus-within:ring-2 focus-within:ring-green-500 focus-within:border-green-500 cursor-pointer"
                                    >
                                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-600" size={20} />
                                        <input
                                            ref={startDateRef}
                                            type="date"
                                            value={formData.poStartDate}
                                            onChange={handleChange('poStartDate')}
                                            className="w-full h-full bg-transparent outline-none cursor-pointer"
                                        />
                                    </div>
                                </div>

                                <div className="mt-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                                    <div
                                        onClick={() => endDateRef.current?.showPicker?.()}
                                        className="relative w-full h-14 pl-12 pr-4 border border-gray-300 rounded-md focus-within:ring-2 focus-within:ring-green-500 focus-within:border-green-500 cursor-pointer"
                                    >
                                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-600" size={20} />
                                        <input
                                            ref={endDateRef}
                                            type="date"
                                            value={formData.poEndDate}
                                            onChange={handleChange('poEndDate')}
                                            className="w-full h-full bg-transparent outline-none cursor-pointer"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">PM/SPOC Name</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-600" size={20} />
                                        <input
                                            type="text"
                                            placeholder="Enter here"
                                            value={formData.poSpoc}
                                            onChange={handleChange('poSpoc')}
                                            className="w-full h-14 pl-12 pr-4 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Customer Name</label>
                                    <div className="relative">
                                        <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-600" size={20} />
                                        <input
                                            type="text"
                                            placeholder="Enter customer name"
                                            value={formData.customer}
                                            onChange={handleChange('customer')}
                                            className="w-full h-14 pl-12 pr-4 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
                                            value={formData.supplier}
                                            onChange={handleChange('supplier')}
                                            className="w-full h-14 pl-12 pr-4 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                        />
                                    </div>
                                </div>
                                <div >
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Project Name</label>
                                    <div className="relative w-full h-14">
                                    <Folder className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-600 z-10" size={20} />
                                    <div className="pl-10">
                                        <Select
                                            options={projectOptions}
                                            value={projectOptions.find(option => option.value === formData.projectName)}
                                            onChange={(selectedOption) =>
                                                handleChange('projectName')({ target: { value: selectedOption.value } })
                                            }
                                            className="react-select-container"
                                            classNamePrefix="react-select"
                                            placeholder="Enter here"
                                            isSearchable
                                        />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Project Description</label>
                                    <textarea
                                        placeholder="Enter here"
                                        rows={3}
                                        value={formData.poDesc}
                                        onChange={handleChange('poDesc')}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
                                        maxLength={500}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">PO Attachment</label>
                                    <div className="relative">
                                        <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-600" size={20} />
                                        <input
                                            type="file"
                                            onChange={handleFileChange('poAttachment')}
                                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                            className="w-full h-14 pl-12 pr-4 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-semibold text-green-900">Milestones Details</h3>
                                    <button
                                        onClick={handleAddMilestone}
                                        className="flex items-center px-4 py-2 bg-green-700 text-white rounded-md hover:bg-green-800 transition-colors"
                                    >
                                        <Plus size={16} className="mr-2" />
                                        Add Row
                                    </button>
                                </div>

                                <div className="h-80 w-full border border-gray-200 rounded-md">
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
                                            components={{
                                                attachmentRenderer: AttachmentRenderer
                                            }}
                                            noRowsOverlayComponent={() => (
                                                <div className="flex items-center justify-center h-full text-gray-500">
                                                    No milestones found. Click "Add Row" to add new milestones.
                                                </div>
                                            )}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
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
                                    Update PO
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EditPOModal;