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

const AddSRNModal = ({ open, onClose, poNumber }) => {
    const [formData, setFormData] = useState({
        poId: '',
        msId: '',
        srnName: '',
        srnDsc: '',
        srnAmount: '',
        srnCurrency: 'USD',
        srnRemarks: '',
        srnType: 'partial',
        srnDate: ''
    });
    const [srnFiles, setSrnFiles] = useState([]);
    const [srnErrors, setSrnErrors] = useState(""); // optional for error
    const [poList, setPOList] = useState([]);
    const [milestoneList, setMilestoneList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [descCharCount, setDescCharCount] = useState(0);
    const [remarksCharCount, setRemarksCharCount] = useState(0);
    const [poBalance, setPOBalance] = useState(null);
    const [milestoneBalance, setMilestoneBalance] = useState(null);

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

        const fetchMilestone = async (poId, msId) => {
            if (poId && msId) {
                try {
                    const token = sessionStorage.getItem('token');
                    const response = await axios.get(
                        `${import.meta.env.VITE_API_URL}/api/po-milestone/milestonebalance/${poId}/${msId}`,
                        {
                            headers: { Authorization: `${token}` }
                        }
                    );
                    setMilestoneBalance(response.data);
                } catch (error) {
                    console.error("Error fetching milestone balance:", error);
                }
            }
        };

        fetchPOBalance(formData.poId);
        if (formData.poId && formData.msId) {
            fetchMilestone(formData.poId, formData.msId);
        } else {
            setMilestoneBalance(null);
        }
    }, [formData.poId, formData.msId]);


    // Fetch milestones for selected PO
    const fetchMilestones = async (poId) => {
        try {
            const token = sessionStorage.getItem('token');
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/po-milestone/getMilestoneForPo/${poId}`, {
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
        const files = Array.from(e.target.files);
        if (!files.length) return;

        // Combine existing and new files
        const totalFiles = srnFiles.length + files.length;
        if (totalFiles > 4) {
            setSrnErrors("You can upload a maximum of 4 attachments.");
            e.target.value = null;
            return;
        }

        // Validate each file
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

        for (const file of files) {
            if (file.size > 10 * 1024 * 1024) {
                setSrnErrors("File size must be less than 10MB.");
                e.target.value = null;
                return;
            }
            if (!allowedTypes.includes(file.type)) {
                setSrnErrors("Unsupported file type.");
                e.target.value = null;
                return;
            }
        }

        setSrnFiles(prev => [...prev, ...files]);
        setSrnErrors(""); // clear error
        e.target.value = null; // reset input
    };

    const removeSRNAttachment = (index) => {
        setSrnFiles(prev => prev.filter((_, i) => i !== index));
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

        if (!formData.srnName.trim()) {
            newErrors.srnName = "SRN name is required";
        }
        if (!formData.srnAmount || formData.srnAmount <= 0) {
            newErrors.srnAmount = "Valid SRN amount is required";
        }

        if (milestoneList.length === 0) {
            // No milestones available, check against PO balance
            if (formData.srnAmount && poBalance !== null && Number(formData.srnAmount) > Number(poBalance)) {
                newErrors.srnAmount = `SRN amount cannot exceed PO balance (${poBalance} ${formData.srnCurrency})`;
            }
        } else {
            // Milestones exist
            if (!formData.msId) {
                newErrors.msId = "Please select a milestone for this PO";
            } else if (formData.srnAmount && milestoneBalance !== null && Number(formData.srnAmount) > Number(milestoneBalance)) {
                newErrors.srnAmount = `SRN amount cannot exceed milestone balance (${milestoneBalance} ${formData.srnCurrency})`;
            }
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

                const srnId = data.srnId; // Assuming the response contains the created SRN ID
                const srnName = data.srnName || formData.srnName;

                // TODO: Handle file upload if attachment is selected
                if (srnFiles.length > 0) {
                    for (const file of srnFiles) {
                        const attachmentForm = new FormData();
                        attachmentForm.append("file", file);
                        attachmentForm.append("level", "SRN");
                        attachmentForm.append("referenceId", srnId); // replace with actual SRN ID
                        attachmentForm.append("referenceNumber", srnName); // optional

                        try {
                            const uploadRes = await fetch(`${import.meta.env.VITE_API_URL}/api/po-attachments/upload`, {
                                method: "POST",
                                headers: {
                                    'Authorization': `${token}`
                                },
                                body: attachmentForm
                            });

                            if (!uploadRes.ok) {
                                console.error(`Attachment upload failed for ${file.name}`);
                            }
                        } catch (err) {
                            console.error("Attachment upload error:", err);
                        }
                    }
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
            srnType: 'partial',
            srnDate: ''
        });
        setSrnFiles([]);
        setErrors({});
        setDescCharCount(0);
        setRemarksCharCount(0);
        setPOList([]);
        setMilestoneList([]);
        onClose();
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-xl max-w-[90vw] w-full mx-4 max-h-[95vh] overflow-hidden flex flex-col">
                <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-semibold text-green-900 flex items-center">
                            <Receipt size={20} className="mr-2 text-green-600" />
                            Create New SRN
                        </h2>
                        {errors.srnAmount && (
                            <p className="mt-1 text-red-600 text-sm">
                                {errors.srnAmount}
                            </p>
                        )}
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                        disabled={loading}
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-grow">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Error Display */}
                        {errors.submit && (
                            <div className="bg-red-50 border border-red-200 rounded-md p-3 flex items-center">
                                <AlertCircle size={18} className="text-red-500 mr-2" />
                                <span className="text-red-700 text-sm">{errors.submit}</span>
                            </div>
                        )}

                        {/* Row 1: Select PO, Milestone, SRN Type, Currency, and Amount */}
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-15 items-end">
                            <div className="lg:col-span-1">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Select PO *
                                </label>
                                <select
                                    name="poId"
                                    value={formData.poId}
                                    onChange={handleInputChange}
                                    className={`w-full h-10 px-4 border rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 ${errors.poId ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    disabled={loading}
                                    title={formData.poId ? `Selected PO` : "Select a PO"}
                                >
                                    <option value="" title="No PO selected">Select from list</option>
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
                                    <p className="mt-1 text-sm text-red-600" title={`Error: ${errors.poId}`}>
                                        {errors.poId}
                                    </p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    SRN Name *
                                    <span className="float-right text-sm text-gray-500">
                                        {formData.srnName.length}/100 characters
                                    </span>
                                </label>
                                <div className="relative">
                                    <Receipt className="absolute left-3 top-1/2 -translate-y-1/2 text-green-600" size={20} />
                                    <input
                                        type="text"
                                        name="srnName"
                                        value={formData.srnName}
                                        onChange={handleInputChange}
                                        className={`w-full h-10 pl-10 pr-4 border rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 ${errors.srnName ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                        placeholder="Enter here"
                                        maxLength={100}
                                        disabled={loading}
                                        title={formData.srnName ? `SRN Name (${formData.srnName.length}/100 chars): ${formData.srnName}` : "Enter SRN name (required)"}
                                    />
                                </div>
                                {errors.srnName && (
                                    <p className="mt-1 text-sm text-red-600" title={`Error: ${errors.srnName}`}>
                                        {errors.srnName}
                                    </p>
                                )}
                            </div>

                            <div className="lg:col-span-1">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Milestone
                                </label>
                                <select
                                    name="msId"
                                    value={formData.msId}
                                    onChange={handleInputChange}
                                    className="w-full h-10 px-4 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                    disabled={!formData.poId || loading}
                                    title={formData.msId ? `Selected Milestone` : "Select a milestone (optional)"}
                                >
                                    <option value="" title="No specific milestone selected">Select from list</option>
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
                                    <p className="mt-1 text-sm text-red-600" title={`Error: ${errors.msId}`}>
                                        {errors.msId}
                                    </p>
                                )}
                            </div>

                            <div className="lg:col-span-1">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    SRN Type *
                                </label>
                                <select
                                    name="srnType"
                                    value={formData.srnType}
                                    onChange={handleInputChange}
                                    className={`w-full h-10 px-4 border rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 ${errors.srnType ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    disabled={loading}
                                    title={`Selected Type: ${formData.srnType}`}
                                >
                                    <option value="partial" title="Partial SRN - For partial amount of PO/Milestone">Partial</option>
                                    <option value="full" title="Full SRN - For complete amount of PO/Milestone">Full</option>
                                </select>
                                {errors.srnType && (
                                    <p className="mt-1 text-sm text-red-600" title={`Error: ${errors.srnType}`}>
                                        {errors.srnType}
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className='grid grid-cols-5 gap-15'>
                            <div className="lg:col-span-1">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
                                <input type="text" value={formData.srnCurrency} readOnly className="w-full h-10 px-4 border border-gray-300 rounded-md bg-gray-100" />
                            </div>

                            <div className="lg:col-span-1">
                                <div className='flex gap-2 items-center justify-between'>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">SRN Amount *</label>
                                    <span className="text-[10px] text-red-500">
                                        {formData.msId ? `Milestone Balance: ${milestoneBalance}` : `PO Balance: ${poBalance ?? 'Loading...'}`} {formData.srnCurrency}
                                    </span>
                                </div>

                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-green-600 font-semibold">
                                        {getCurrencySymbol(formData.srnCurrency)}
                                    </span>
                                    <input
                                        type="number"
                                        name="srnAmount"
                                        value={formData.srnAmount}
                                        onChange={handleInputChange}
                                        step="1"
                                        min="0"
                                        className={`w-full h-10 pl-8 pr-4 border rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 ${errors.srnAmount ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                        placeholder="Enter here"
                                        disabled={loading}
                                        title={formData.srnAmount ? `Amount: ${getCurrencySymbol(formData.srnCurrency)}${parseFloat(formData.srnAmount).toLocaleString()}` : "Enter SRN amount"}
                                    />
                                </div>

                                {errors.srnAmount && (
                                    <p className="mt-1 text-sm text-red-600" title={`Error: ${errors.srnAmount}`}>
                                        {errors.srnAmount}
                                    </p>
                                )}
                            </div>

                            <div className="lg:col-span-1">
                                <label className="block text-sm font-medium text-gray-700 mb-2">SRN Date</label>
                                <div
                                    onClick={() => handleDateInputClick('srnDate')}
                                    className="relative w-full h-10 pl-10 pr-4 border border-gray-300 rounded-md focus-within:ring-2 focus-within:ring-green-500 focus-within:border-green-500 cursor-pointer flex items-center"
                                >
                                    <Calendar
                                        className="absolute left-3 top-1/2 -translate-y-1/2 text-green-600 pointer-events-none"
                                        size={20}
                                    />
                                    <input
                                        type="date"
                                        name="srnDate"
                                        value={formData.srnDate}
                                        onChange={handleInputChange}
                                        className="w-full bg-transparent outline-none cursor-pointer appearance-none"
                                        disabled={loading}
                                        title={formData.srnDate ? `SRN Date: ${new Date(formData.srnDate).toLocaleDateString()}` : "Click to select SRN date (optional)"}
                                    />
                                </div>
                            </div>
                        </div>
                        {/* Row 2: SRN Name and Attachment */}
                        <div className="grid grid-cols-6 gap-4">


                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">SRN Attachments (Max 4)</label>
                                <div className="relative">
                                    <input
                                        type="file"
                                        id="srn-attachment-input"
                                        onChange={handleFileChange}
                                        className="hidden"
                                        disabled={loading}
                                        multiple
                                        accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.txt"
                                    />
                                    <label
                                        htmlFor="srn-attachment-input"
                                        className="w-full h-10 pl-10 pr-4 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 flex items-center cursor-pointer"
                                    >
                                        <Upload className="absolute left-3 top-1/2 -translate-y-1/2 text-green-600" size={20} />
                                        <span className="text-gray-500 truncate">
                                            {srnFiles.length > 0 ? `${srnFiles.length} file(s) selected` : 'Click to select files'}
                                        </span>
                                    </label>
                                </div>

                                {/* List of selected files */}
                                <ul className="mt-2 text-sm text-gray-700 space-y-1">
                                    {srnFiles.map((file, index) => (
                                        <li
                                            key={index}
                                            className="flex max-w-[300px] items-center justify-between bg-gray-100 px-3 py-1 rounded"
                                        >
                                            <span className="truncate max-w-[200px]" title={file.name}>{file.name}</span>
                                            <button
                                                type="button"
                                                onClick={() => removeSRNAttachment(index)}
                                                className="ml-2 text-red-600 hover:text-red-800 text-xs"
                                            >
                                                Delete
                                            </button>
                                        </li>
                                    ))}
                                </ul>

                                {srnErrors && (
                                    <p className="mt-1 text-sm text-red-600">{srnErrors}</p>
                                )}
                            </div>
                        </div>

                        {/* Row 3: SRN Description */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                SRN Description
                                <span className="float-right text-sm text-gray-500">
                                    {descCharCount}/500 characters
                                </span>
                            </label>
                            <textarea
                                name="srnDsc"
                                value={formData.srnDsc}
                                onChange={handleInputChange}
                                rows={3}
                                className={`w-full px-4 py-3 border rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none ${errors.srnDsc ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                placeholder="Enter here"
                                maxLength={500}
                                disabled={loading}
                                title={formData.srnDsc ? `SRN Description (${descCharCount}/500 chars): ${formData.srnDsc}` : "Enter detailed SRN description (optional)"}
                            />
                            {errors.srnDsc && (
                                <p className="mt-1 text-sm text-red-600" title={`Error: ${errors.srnDsc}`}>
                                    {errors.srnDsc}
                                </p>
                            )}
                        </div>

                        {/* Row 4: SRN Remarks */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                SRN Remarks
                                <span className="float-right text-sm text-gray-500">
                                    {remarksCharCount}/500 characters
                                </span>
                            </label>
                            <textarea
                                name="srnRemarks"
                                value={formData.srnRemarks}
                                onChange={handleInputChange}
                                rows={3}
                                className={`w-full px-4 py-3 border rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none ${remarksCharCount > 500 ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                placeholder="Enter here"
                                maxLength={500}
                                disabled={loading}
                                title={formData.srnRemarks ? `SRN Remarks (${remarksCharCount}/500 chars): ${formData.srnRemarks}` : "Enter additional remarks (optional)"}
                            />
                            {errors.srnRemarks && (
                                <p className="mt-1 text-sm text-red-600" title={`Error: ${errors.srnRemarks}`}>
                                    {errors.srnRemarks}
                                </p>
                            )}
                        </div>
                    </form>
                </div>

                <div className="flex justify-end gap-3 pt-4 px-6 pb-6 border-t border-gray-200 bg-gray-50">
                    <button
                        type="button"
                        onClick={handleClose}
                        className="px-6 py-2 border border-green-700 text-green-700 rounded-md hover:bg-green-50 transition-colors"
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="px-6 py-2 bg-green-700 text-white rounded-md hover:bg-green-800 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                        {loading ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Creating...
                            </>
                        ) : (
                            <>
                                <Receipt size={16} className="mr-2" />
                                Create SRN
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddSRNModal;