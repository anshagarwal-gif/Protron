// AddSRNModal.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
    X,
    Calendar,
    Folder,
    User,
    Building,
    DollarSign,
    FileText,
    Receipt,
    Hash,
    MessageSquare,
    Upload,
    AlertCircle,
    Activity
} from 'lucide-react';

// Currency symbols mapping
const currencySymbols = {
    USD: '$',
    INR: '₹',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
    CAD: 'C$',
    AUD: 'A$',
    CHF: 'CHF',
    CNY: '¥',
    SEK: 'kr',
    NOK: 'kr'
};

const AddSRNModal = ({ open, onClose }) => {
    const [formData, setFormData] = useState({
        poId: '',
        msId: '',
        srnName: '',
        srnDsc: '',
        srnAmount: '',
        srnCurrency: 'USD',
        srnRemarks: '',
        srnAttachment: null,
        srnType: 'partial',
        srnDate: ''
    });

    const [poList, setPOList] = useState([]);
    const [milestoneList, setMilestoneList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [descCharCount, setDescCharCount] = useState(0);
    const [remarksCharCount, setRemarksCharCount] = useState(0);
    const [poBalance, setPOBalance] = useState(null);

    // Helper function to get currency symbol
    const getCurrencySymbol = (currencyCode) => {
        return currencySymbols[currencyCode] || currencyCode || '$';
    };

    // Fetch PO list
    const fetchPOList = async () => {
        try {
            const token = sessionStorage.getItem('token');
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/po/all`, {
                headers: { Authorization: `${token}` }
            });
            const data = await response.json();
            setPOList(data);
        } catch (error) {
            console.error('Error fetching PO list:', error);
        }
    };

    useEffect(() => {
        const fetchPOBalance = async (poId) => {
            if (poId) {
                try {
                    const token = sessionStorage.getItem('token');
                    const response = await axios.get(
                        `${import.meta.env.VITE_API_URL}/api/po/pobalance/${poId}`,
                        {
                            headers: { Authorization: `${token}` }
                        }
                    );
                    setPOBalance(response.data);
                } catch (error) {
                    console.error("Error fetching PO balance:", error);
                }
            }
        };

        fetchPOBalance(formData.poId);
    }, [formData.poId]);


    // Fetch milestones for selected PO
    const fetchMilestones = async (poId) => {
        try {
            const token = sessionStorage.getItem('token');
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/po-milestone/po/${poId}`, {
                headers: { Authorization: `${token}` }
            });
            const data = await response.json();
            setMilestoneList(data);
        } catch (error) {
            console.error('Error fetching milestones:', error);
            setMilestoneList([]);
        }
    };

    const checkExistingSRNs = async (poId, msId = null) => {
        try {
            const token = sessionStorage.getItem('token');
            const url = msId
                ? `${import.meta.env.VITE_API_URL}/api/srn/check?poId=${poId}&msId=${msId}`
                : `${import.meta.env.VITE_API_URL}/api/srn/check?poId=${poId}`;
            const response = await fetch(url, {
                headers: { Authorization: `${token}` }
            });
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error checking existing SRNs:', error);
            return true;
        }
    };

    useEffect(() => {
        if (open) {
            fetchPOList();
            setErrors({});
        }
    }, [open]);

    // Initialize character counts when form data is set
    useEffect(() => {
        setDescCharCount(formData.srnDsc.length);
        setRemarksCharCount(formData.srnRemarks.length);
    }, [formData.srnDsc, formData.srnRemarks]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;

        // Check character limits
        if (name === 'srnName' && value.length > 100) {
            setErrors(prev => ({
                ...prev,
                [name]: "SRN Name cannot exceed 100 characters"
            }));
            return;
        }
        if (name === 'srnDsc') {
            if (value.length > 500) {
                setErrors(prev => ({
                    ...prev,
                    [name]: "SRN Description cannot exceed 500 characters"
                }));
                return;
            }
            setDescCharCount(value.length);
        }
        if (name === 'srnRemarks') {
            if (value.length > 500) {
                setErrors(prev => ({
                    ...prev,
                    [name]: "SRN Remarks cannot exceed 500 characters"
                }));
                return;
            }
            setRemarksCharCount(value.length);
        }

        // Handle changes to srnType
        if (name === 'srnType') {
            handleSrnTypeChange(value);
        } else if (name === 'poId') {
            handlePOChange(value);
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }

        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ""
            }));
        }
    };

    const handleSrnTypeChange = async (value) => {
        if (value === 'full') {
            if (formData.msId) {
                const hasExistingSRNs = await checkExistingSRNs(formData.poId, formData.msId);
                if (hasExistingSRNs) {
                    setErrors(prev => ({
                        ...prev,
                        srnType: 'This milestone already has SRNs. Full SRN is not allowed.'
                    }));
                    return;
                }

                const selectedMilestone = milestoneList.find(m => m.msId == formData.msId);
                if (selectedMilestone) {
                    setFormData(prev => ({
                        ...prev,
                        srnAmount: selectedMilestone.msAmount || '',
                        srnType: value
                    }));
                }
            } else {
                const hasExistingSRNs = await checkExistingSRNs(formData.poId);
                if (hasExistingSRNs) {
                    setErrors(prev => ({
                        ...prev,
                        srnType: 'This PO already has SRNs. Full SRN is not allowed.'
                    }));
                    return;
                }

                const selectedPO = poList.find(po => po.poId == formData.poId);
                if (selectedPO) {
                    setFormData(prev => ({
                        ...prev,
                        srnAmount: selectedPO.poAmount || '',
                        srnType: value
                    }));
                }
            }
        } else {
            setFormData(prev => ({
                ...prev,
                srnType: value,
                srnAmount: ''
            }));
        }
    };

    const handlePOChange = (value) => {
        const selectedPO = poList.find(po => po.poId == value);
        if (selectedPO) {
            setFormData(prev => ({
                ...prev,
                poId: value,
                srnCurrency: selectedPO.poCurrency || 'USD',
                msId: '',
                srnAmount: ''
            }));
            fetchMilestones(value);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file size (max 10MB)
            const maxSize = 10 * 1024 * 1024; // 10MB in bytes
            if (file.size > maxSize) {
                setErrors(prev => ({
                    ...prev,
                    srnAttachment: "File size must be less than 10MB"
                }));
                return;
            }

            // Validate file type
            const allowedTypes = [
                'application/pdf',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'application/vnd.ms-excel',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'image/jpeg',
                'image/png',
                'image/gif',
                'text/plain'
            ];

            if (!allowedTypes.includes(file.type)) {
                setErrors(prev => ({
                    ...prev,
                    srnAttachment: "File type not supported. Please upload PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, GIF, or TXT files."
                }));
                return;
            }

            setFormData(prev => ({
                ...prev,
                srnAttachment: file
            }));

            // Clear error if file is valid
            if (errors.srnAttachment) {
                setErrors(prev => ({
                    ...prev,
                    srnAttachment: ""
                }));
            }
        }
    };

    // Function to handle date input clicks
    const handleDateInputClick = (inputName) => {
        const dateInput = document.getElementsByName(inputName)[0];
        if (dateInput) {
            dateInput.showPicker();
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.poId) {
            newErrors.poId = "Please select a PO";
        }
        if (milestoneList.length > 0 && !formData.msId) {
            newErrors.msId = "Please select a Milestone";
        }
        if (!formData.srnName.trim()) {
            newErrors.srnName = "SRN name is required";
        }
        if (!formData.srnAmount || formData.srnAmount <= 0) {
            newErrors.srnAmount = "Valid SRN amount is required";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setLoading(true);

        try {
            const isValid = validateForm();
            if (!isValid) {
                setLoading(false);
                return;
            }

            const srnPayload = {
                poId: parseInt(formData.poId),
                msId: parseInt(formData.msId),
                srnName: formData.srnName.trim(),
                srnDsc: formData.srnDsc.trim() || '',
                srnAmount: parseInt(formData.srnAmount),
                srnCurrency: formData.srnCurrency,
                srnRemarks: formData.srnRemarks.trim() || '',
                srnType: formData.srnType,
                srnDate: formData.srnDate || ''
            };

            console.log('SRN Payload:', srnPayload);

            const token = sessionStorage.getItem('token');
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/api/srn/add`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(srnPayload)
                }
            );

            if (response.ok) {
                const data = await response.json();
                console.log('SRN Created:', data);

                // TODO: Handle file upload if attachment is selected
                if (formData.srnAttachment) {
                    console.log('File attachment to be implemented:', formData.srnAttachment);
                }

                handleClose();
            } else {
                const errorData = await response.text();
                console.error('SRN Creation Error:', errorData);
                setErrors({
                    submit: 'Failed to create SRN. Please check the console for details.'
                });
            }
        } catch (error) {
            console.error('Error creating SRN:', error);
            setErrors({
                submit: 'Network error. Please try again.'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setFormData({
            poId: '',
            msId: '',
            srnName: '',
            srnDsc: '',
            srnAmount: '',
            srnCurrency: 'USD',
            srnRemarks: '',
            srnAttachment: null,
            srnType: 'partial',
            srnDate: ''
        });
        setErrors({});
        setDescCharCount(0);
        setRemarksCharCount(0);
        setPOList([]);
        setMilestoneList([]);
        onClose();
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 flex items-center">
                            <Receipt size={20} className="mr-2 text-green-600" />
                            Create New SRN
                        </h2>
                        {errors.srnAmount && (
                            <p className="mt-1 text-red-600" style={{ fontSize: '10px' }}>
                                {errors.srnAmount}
                            </p>
                        )}
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        disabled={loading}
                    >
                        <X size={20} className="text-gray-400" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Error Display */}
                    {errors.submit && (
                        <div className="bg-red-50 border border-red-200 rounded-md p-3 flex items-center">
                            <AlertCircle size={18} className="text-red-500 mr-2" />
                            <span className="text-red-700 text-sm">{errors.submit}</span>
                        </div>
                    )}

                    <div className="space-y-4">
                        {/* Row 1: Select PO, Milestone, SRN Type, Currency, and Amount */}
                        <div className="grid grid-cols-12 gap-4">
                            <div className="col-span-3">
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                    <FileText size={14} className="inline mr-1" />
                                    Select PO *
                                </label>
                                <select
                                    name="poId"
                                    value={formData.poId}
                                    onChange={handleInputChange}
                                    className={`w-full px-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 ${errors.poId ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    disabled={loading}
                                    title={formData.poId ? `Selected PO` : "Select a PO"}
                                >
                                    <option value="" title="No PO selected">Select PO</option>
                                    {poList.map((po) => (
                                        <option
                                            key={po.poId}
                                            value={po.poId}
                                            title={`PO: ${po.poNumber} | Project: ${po.projectName || 'No Project'} | Currency: ${po.poCurrency || 'USD'} | Amount: ${po.poAmount ? getCurrencySymbol(po.poCurrency) + (po.poAmount).toLocaleString() : 'N/A'}`}
                                        >
                                            {po.poNumber.length > 20 ? `${po.poNumber.substring(0, 20)}...` : po.poNumber} - {po.projectName && po.projectName.length > 15 ? `${po.projectName.substring(0, 15)}...` : po.projectName || 'No Project'}
                                        </option>
                                    ))}
                                </select>
                                {errors.poId && (
                                    <p className="mt-1 text-xs text-red-600" title={`Error: ${errors.poId}`}>
                                        {errors.poId.length > 30 ? `${errors.poId.substring(0, 30)}...` : errors.poId}
                                    </p>
                                )}
                            </div>

                            <div className="col-span-3">
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                    <Folder size={14} className="inline mr-1" />
                                    Milestone (Optional)
                                </label>
                                <select
                                    name="msId"
                                    value={formData.msId}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                                    disabled={!formData.poId || loading}
                                    title={formData.msId ? `Selected Milestone` : "Select a milestone (optional)"}
                                >
                                    <option value="" title="No specific milestone selected">Select milestone (optional)</option>
                                    {milestoneList.map((milestone) => (
                                        <option
                                            key={milestone.msId}
                                            value={milestone.msId}
                                            title={`Milestone: ${milestone.msName} | Amount: ${milestone.msAmount ? getCurrencySymbol(milestone.msCurrency) + (milestone.msAmount).toLocaleString() : 'N/A'}`}
                                        >
                                            {milestone.msName.length > 25 ? `${milestone.msName.substring(0, 25)}...` : milestone.msName}
                                        </option>
                                    ))}
                                </select>
                                {errors.msId && (
                                    <p className="mt-1 text-xs text-red-600" title={`Error: ${errors.msId}`}>
                                        {errors.msId.length > 30 ? `${errors.msId.substring(0, 30)}...` : errors.msId}
                                    </p>
                                )}
                            </div>

                            <div className="col-span-2">
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                    <Activity size={14} className="inline mr-1" />
                                    SRN Type *
                                </label>
                                <select
                                    name="srnType"
                                    value={formData.srnType}
                                    onChange={handleInputChange}
                                    className={`w-full px-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 ${errors.srnType ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    disabled={loading}
                                    title={`Selected Type: ${formData.srnType}`}
                                >
                                    <option value="partial" title="Partial SRN - For partial amount of PO/Milestone">Partial</option>
                                    <option value="full" title="Full SRN - For complete amount of PO/Milestone">Full</option>
                                </select>
                                {errors.srnType && (
                                    <p className="mt-1 text-xs text-red-600" title={`Error: ${errors.srnType}`}>
                                        {errors.srnType.length > 30 ? `${errors.srnType.substring(0, 30)}...` : errors.srnType}
                                    </p>
                                )}
                            </div>

                            <div className="col-span-1">
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Currency
                                </label>
                                <select
                                    name="srnCurrency"
                                    value={formData.srnCurrency}
                                    onChange={handleInputChange}
                                    className="w-full px-1 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                                    disabled={true}
                                    title={`Selected Currency: ${formData.srnCurrency} (${getCurrencySymbol(formData.srnCurrency)})`}
                                >
                                    <option value="USD" title="US Dollar ($)">USD</option>
                                    <option value="INR" title="Indian Rupee (₹)">INR</option>
                                    <option value="EUR" title="Euro (€)">EUR</option>
                                    <option value="GBP" title="British Pound (£)">GBP</option>
                                    <option value="JPY" title="Japanese Yen (¥)">JPY</option>
                                    <option value="CAD" title="Canadian Dollar (C$)">CAD</option>
                                    <option value="AUD" title="Australian Dollar (A$)">AUD</option>
                                    <option value="CHF" title="Swiss Franc (CHF)">CHF</option>
                                    <option value="CNY" title="Chinese Yuan (¥)">CNY</option>
                                    <option value="SEK" title="Swedish Krona (kr)">SEK</option>
                                    <option value="NOK" title="Norwegian Krone (kr)">NOK</option>
                                </select>
                            </div>

                            <div className="col-span-3">
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                    <DollarSign size={14} className="inline mr-1" />
                                    SRN Amount *
                                </label>
                                <input
                                    type="number"
                                    name="srnAmount"
                                    value={formData.srnAmount}
                                    onChange={handleInputChange}
                                    step="1"
                                    min="0"
                                    className={`w-full px-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 ${errors.srnAmount ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    placeholder="0"
                                    disabled={loading}
                                    title={formData.srnAmount ? `Amount: ${getCurrencySymbol(formData.srnCurrency)}${parseFloat(formData.srnAmount).toLocaleString()}` : "Enter SRN amount"}
                                />
                                <label>
                                    <span className="text-xs text-red-500">
                                        PO Balance: {poBalance ?? 'Loading...'} {formData.srnCurrency}
                                    </span>
                                </label>
                                {errors.srnAmount && (
                                    <p className="mt-1 text-xs text-red-600" title={`Error: ${errors.srnAmount}`}>
                                        {errors.srnAmount.length > 30 ? `${errors.srnAmount.substring(0, 30)}...` : errors.srnAmount}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Row 2: SRN Name, SRN Date, and Attachment */}
                        <div className="grid grid-cols-12 gap-4">
                            <div className="col-span-4">
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                    <Receipt size={14} className="inline mr-1" />
                                    SRN Name *
                                    <span className="float-right text-xs text-gray-500">
                                        {formData.srnName.length}/100 characters
                                    </span>
                                </label>
                                <input
                                    type="text"
                                    name="srnName"
                                    value={formData.srnName}
                                    onChange={handleInputChange}
                                    className={`w-full px-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 ${errors.srnName ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    placeholder="Enter SRN name"
                                    maxLength={100}
                                    disabled={loading}
                                    title={formData.srnName ? `SRN Name (${formData.srnName.length}/100 chars): ${formData.srnName}` : "Enter SRN name (required)"}
                                />
                                {errors.srnName && (
                                    <p className="mt-1 text-xs text-red-600" title={`Error: ${errors.srnName}`}>
                                        {errors.srnName.length > 40 ? `${errors.srnName.substring(0, 40)}...` : errors.srnName}
                                    </p>
                                )}
                            </div>

                            <div className="col-span-3">
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                    <Calendar size={14} className="inline mr-1" />
                                    SRN Date
                                </label>
                                <input
                                    type="date"
                                    name="srnDate"
                                    value={formData.srnDate}
                                    onChange={handleInputChange}
                                    onClick={() => handleDateInputClick('srnDate')}
                                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 cursor-pointer"
                                    disabled={loading}
                                    title={formData.srnDate ? `SRN Date: ${new Date(formData.srnDate).toLocaleDateString()}` : "Click to select SRN date (optional)"}
                                />
                            </div>

                            <div className="col-span-3">
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                    <Upload size={14} className="inline mr-1" />
                                    SRN Attachment
                                </label>
                                <input
                                    type="file"
                                    name="srnAttachment"
                                    onChange={handleFileChange}
                                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100"
                                    disabled={loading}
                                    accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.txt"
                                    title="Upload document or image file (max 10MB)"
                                />
                                {formData.srnAttachment && (
                                    <p className="mt-1 text-xs text-gray-600" title={`Selected file: ${formData.srnAttachment.name} (${(formData.srnAttachment.size / 1024 / 1024).toFixed(2)} MB)`}>
                                        {formData.srnAttachment.name.length > 30 ? `${formData.srnAttachment.name.substring(0, 30)}...` : formData.srnAttachment.name}
                                        ({(formData.srnAttachment.size / 1024 / 1024).toFixed(2)} MB)
                                    </p>
                                )}
                                {errors.srnAttachment && (
                                    <p className="mt-1 text-xs text-red-600" title={`Error: ${errors.srnAttachment}`}>
                                        {errors.srnAttachment.length > 50 ? `${errors.srnAttachment.substring(0, 50)}...` : errors.srnAttachment}
                                    </p>
                                )}
                            </div>

                            <div className="col-span-2"></div> {/* Spacer */}
                        </div>

                        {/* Row 3: SRN Description */}
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                <MessageSquare size={14} className="inline mr-1" />
                                SRN Description
                                <span className="float-right text-xs text-gray-500">
                                    {descCharCount}/500 characters
                                </span>
                            </label>
                            <textarea
                                name="srnDsc"
                                value={formData.srnDsc}
                                onChange={handleInputChange}
                                rows={4}
                                className={`w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 resize-none ${errors.srnDsc ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                placeholder="Enter detailed SRN description including scope, deliverables, and requirements... (Max 500 characters)"
                                maxLength={500}
                                disabled={loading}
                                title={formData.srnDsc ? `SRN Description (${descCharCount}/500 chars): ${formData.srnDsc}` : "Enter detailed SRN description (optional)"}
                            />
                            {errors.srnDsc && (
                                <p className="mt-1 text-xs text-red-600" title={`Error: ${errors.srnDsc}`}>
                                    {errors.srnDsc.length > 50 ? `${errors.srnDsc.substring(0, 50)}...` : errors.srnDsc}
                                </p>
                            )}
                        </div>

                        {/* Row 4: SRN Remarks */}
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                <MessageSquare size={14} className="inline mr-1" />
                                SRN Remarks
                                <span className="float-right text-xs text-gray-500">
                                    {remarksCharCount}/500 characters
                                </span>
                            </label>
                            <textarea
                                name="srnRemarks"
                                value={formData.srnRemarks}
                                onChange={handleInputChange}
                                rows={3}
                                className={`w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 resize-none ${remarksCharCount > 500 ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                placeholder="Enter additional remarks, notes, special instructions, or any other relevant information... (Max 500 characters)"
                                maxLength={500}
                                disabled={loading}
                                title={formData.srnRemarks ? `SRN Remarks (${remarksCharCount}/500 chars): ${formData.srnRemarks}` : "Enter additional remarks (optional)"}
                            />
                            {errors.srnRemarks && (
                                <p className="mt-1 text-xs text-red-600" title={`Error: ${errors.srnRemarks}`}>
                                    {errors.srnRemarks.length > 50 ? `${errors.srnRemarks.substring(0, 50)}...` : errors.srnRemarks}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Form Actions */}
                    <div className="flex justify-end gap-3 pt-3 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="px-4 py-1.5 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-1.5 text-sm bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <Receipt size={14} className="mr-2" />
                                    Create SRN
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddSRNModal;