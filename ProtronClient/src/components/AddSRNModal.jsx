// AddSRNModal.js
import React, { useEffect, useState, useRef } from 'react';
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
    Activity,
    Paperclip,
    File as FileIcon
} from 'lucide-react';
import GlobalSnackbar from './GlobalSnackbar';

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
    const fileInputRef = useRef(null);

    // Helper function to format file size
    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

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
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success'
    })
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
                [name]: "Payment Name cannot exceed 100 characters"
            }));
            return;
        }
        if (name === 'srnDsc') {
            if (value.length > 500) {
                setErrors(prev => ({
                    ...prev,
                    [name]: "Payment Description cannot exceed 500 characters"
                }));
                return;
            }
            setDescCharCount(value.length);
        }
        if (name === 'srnRemarks') {
            if (value.length > 500) {
                setErrors(prev => ({
                    ...prev,
                    [name]: "Payment Remarks cannot exceed 500 characters"
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
                        srnType: 'This milestone already has Payments. Full Payment is not allowed.'
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
                        srnType: 'This PO already has Payments. Full Payment is not allowed.'
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
  const files = Array.from(e.target?.files || e.dataTransfer?.files || []);
  if (!files.length) return;

  // Remaining slots (max 4)
  const remainingSlots = 4 - srnFiles.length;
  if (remainingSlots <= 0) {
    setSrnErrors("Maximum 4 attachments allowed. Please remove a file to add a new one.");
    if (e.target) e.target.value = null;
    return;
  }

  // Validate each file
  const maxSize = 10 * 1024 * 1024;
  const allowedTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "image/jpeg",
    "image/png",
    "image/gif",
    "text/plain",
  ];

  const validFiles = [];
  for (const file of files) {
    if (file.size > maxSize) {
      setSrnErrors(`File "${file.name}" exceeds 10MB limit.`);
      if (e.target) e.target.value = null;
      return;
    }
    if (!allowedTypes.includes(file.type)) {
      setSrnErrors(
        "Unsupported file type. Upload PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, GIF, or TXT."
      );
      if (e.target) e.target.value = null;
      return;
    }
    validFiles.push(file);
  }

  // ✅ De-dup (same logic as AddBudgetLineModal): (name + size + lastModified)
  const deduped = validFiles.filter((file) => {
    return !srnFiles.some(
      (existing) =>
        existing.name === file.name &&
        existing.size === file.size &&
        existing.lastModified === file.lastModified
    );
  });

  if (deduped.length === 0) {
    setSrnErrors("");
    setSnackbar({
      open: true,
      message: "All selected files are duplicates and were skipped.",
      severity: "info",
    });
    if (e.target) e.target.value = null;
    return;
  }

  // Respect max 4 total files
  const filesToAdd = deduped.slice(0, remainingSlots);

  if (filesToAdd.length < deduped.length) {
    setSnackbar({
      open: true,
      message: `Only ${filesToAdd.length} more attachment(s) can be added (max 4). Some files were skipped.`,
      severity: "warning",
    });
  } else if (filesToAdd.length < validFiles.length) {
    setSnackbar({
      open: true,
      message: "Some duplicate files were skipped.",
      severity: "warning",
    });
  }

  setSrnFiles((prev) => [...prev, ...filesToAdd]);
  setSrnErrors("");

  // Reset input so same file can be picked again later (after removal)
  if (e.target) e.target.value = null;
};

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        handleFileChange(e);
    };

    const removeSRNAttachment = (index) => {
        setSrnFiles(prev => prev.filter((_, i) => i !== index));
    };

    const removeAllAttachments = () => {
        setSrnFiles([]);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
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

        if (!formData.srnName.trim()) {
            newErrors.srnName = "Payment name is required";
        }
        if (!formData.srnAmount || formData.srnAmount <= 0) {
            newErrors.srnAmount = "Valid Payment amount is required";
        }

        if (milestoneList.length === 0) {
            // No milestones available, check against PO balance
            if (formData.srnAmount && poBalance !== null && Number(formData.srnAmount) > Number(poBalance)) {
                newErrors.srnAmount = `Payment amount cannot exceed PO balance (${poBalance} ${formData.srnCurrency})`;
            }
        } else {
            // Milestones exist
            if (!formData.msId) {
                newErrors.msId = "Please select a milestone for this PO";
            } else if (formData.srnAmount && milestoneBalance !== null && Number(formData.srnAmount) > Number(milestoneBalance)) {
                newErrors.srnAmount = `Payment amount cannot exceed milestone balance (${milestoneBalance} ${formData.srnCurrency})`;
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
                                setSnackbar({ open: true, message: `Attachment upload failed for ${file.name}`, severity: 'error' });
                                console.error(`Attachment upload failed for ${file.name}`);
                            }
                        } catch (err) {
                            setSnackbar({ open: true, message: 'Attachment upload error', severity: 'error' });
                            console.error("Attachment upload error:", err);
                        }
                    }
                }
                setSnackbar({ open: true, message: 'Payment created successfully!', severity: 'success' });
                setErrors({})
                handleClose();
            } else {
                const errorData = await response.text();
                console.error('SRN Creation Error:', errorData);
                setErrors({
                    submit: 'Failed to create Payment.'
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
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm p-2 sm:p-4 lg:p-6">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-xs sm:max-w-2xl md:max-w-4xl lg:max-w-6xl xl:max-w-7xl max-h-[95vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="bg-green-600 text-white rounded-t-lg">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0 p-4 sm:p-6">
                        <div className="flex items-center space-x-2 sm:space-x-3">
                            <div className="w-8 h-8 bg-green-700 rounded-lg flex items-center justify-center">
                                <Receipt className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h2 className="text-base sm:text-lg lg:text-xl font-bold">Create New Payment</h2>
                            </div>
                        </div>
                        <button
                            onClick={handleClose}
                            className="p-2 hover:bg-green-700 rounded-full transition-colors cursor-pointer"
                            disabled={loading}
                        >
                            <X className="w-5 h-5 text-white" />
                        </button>
                    </div>
                </div>

                {/* Form */}
                <div className="p-4 sm:p-6 overflow-y-auto flex-grow">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Error Display */}
                        {errors.submit && (
                            <div className="bg-red-50 border border-red-200 rounded-md p-3 flex items-center">
                                <AlertCircle size={18} className="text-red-500 mr-2" />
                                <span className="text-red-700 text-sm">{errors.submit}</span>
                            </div>
                        )}

                        {/* Row 1: Select PO, Milestone, SRN Type, Currency, and Amount */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 items-end relative">
                            <div className="lg:col-span-1 relative">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Select PO *
                                </label>
                                <select
                                    name="poId"
                                    value={formData.poId}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/70 backdrop-blur-sm transition-all duration-200 hover:border-slate-300 disabled:opacity-50"
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
                                            {po.poNumber.length > 20
                                                ? `${po.poNumber.substring(0, 20)}...`
                                                : po.poNumber}
                                            {" - "}
                                            {po.projectName && po.projectName.length > 15
                                                ? `${po.projectName.substring(0, 15)}...`
                                                : po.projectName || "No Project"}
                                        </option>
                                    ))}
                                </select>
                                {errors.poId && (
                                    <p className="absolute mt-1 text-xs text-red-600" title={`Error: ${errors.poId}`}>
                                        {errors.poId}
                                    </p>
                                )}
                            </div>
                            <div className="relative">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Payment Name *
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
                                        className={`w-full h-10 pl-10 pr-4 border rounded-md  focus:ring-2 focus:ring-green-500 focus:outline-none focus:border-green-500 ${errors.srnName ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                        placeholder="Enter here"
                                        maxLength={100}
                                        disabled={loading}
                                        title={formData.srnName ? `SRN Name (${formData.srnName.length}/100 chars): ${formData.srnName}` : "Enter SRN name (required)"}
                                    />
                                </div>
                                {errors.srnName && (
                                    <p className="absolute mt-1 text-xs text-red-600" title={`Error: ${errors.srnName}`}>
                                        {errors.srnName}
                                    </p>
                                )}
                            </div>

                            <div className="lg:col-span-1 relative">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Milestone *
                                </label>
                                <select
                                    name="msId"
                                    value={formData.msId}
                                    onChange={handleInputChange}
                                    className="w-full h-10 px-4 border border-gray-300 rounded-md  focus:ring-2 focus:ring-green-500 focus:outline-none focus:border-green-500"
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
                                    <p className="absolute mt-1 text-xs text-red-600" title={`Error: ${errors.msId}`}>
                                        {errors.msId}
                                    </p>
                                )}
                            </div>

                            <div className="lg:col-span-1 relative">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Payment Type *
                                </label>
                                <select
                                    name="srnType"
                                    value={formData.srnType}
                                    onChange={handleInputChange}
                                    className={`w-full h-10 px-4 border rounded-md  focus:ring-2 focus:ring-green-500 focus:outline-none focus:border-green-500 ${errors.srnType ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    disabled={loading}
                                    title={`Selected Type: ${formData.srnType}`}
                                >
                                    <option value="partial" title="Partial SRN - For partial amount of PO/Milestone">Partial</option>
                                    <option value="full" title="Full SRN - For complete amount of PO/Milestone">Full</option>
                                </select>
                                {errors.srnType && (
                                    <p className="absolute mt-1 text-xs text-red-600" title={`Error: ${errors.srnType}`}>
                                        {errors.srnType}
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4'>
                            <div className="lg:col-span-1">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
                                <input type="text" value={formData.srnCurrency} readOnly className="w-full h-10 px-4 border border-gray-300 rounded-md bg-gray-100" />
                            </div>

                            <div className="lg:col-span-1">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Payment Amount *
                                </label>

                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-green-600 font-semibold">
                                        {getCurrencySymbol(formData.srnCurrency)}
                                    </span>
                                    <input
                                        type="number"
                                        name="srnAmount"
                                        value={formData.srnAmount}
                                        onChange={(e) => {
                                            let value = e.target.value.replace(/[^0-9.]/g, '');
                                            const parts = value.split('.');
                                            if (parts.length > 2) value = parts[0] + '.' + parts[1];
                                            if (parts[0].length > 13) parts[0] = parts[0].slice(0, 13);
                                            if (parts[1]) parts[1] = parts[1].slice(0, 2);
                                            value = parts[1] !== undefined ? parts[0] + '.' + parts[1] : parts[0];
                                            e.target.value = value;
                                            handleInputChange(e);
                                        }}
                                        step="0.01"
                                        min="0"
                                        pattern="^\d{1,13}(\.\d{0,2})?$"
                                        inputMode="decimal"
                                        className={`w-full h-10 pl-8 pr-4 border rounded-md  focus:ring-2 focus:ring-green-500 focus:outline-none focus:border-green-500 ${errors.srnAmount ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                        placeholder="Enter here"
                                        disabled={loading}
                                        title={formData.srnAmount ? `Amount: ${getCurrencySymbol(formData.srnCurrency)}${parseFloat(formData.srnAmount).toLocaleString()}` : "Enter SRN amount"}
                                    />
                                </div>

                                <p className="mt-1 text-xs text-gray-500">
                                    {formData.msId ? `Milestone Balance: ${milestoneBalance}` : `PO Balance: ${poBalance ?? 'Loading...'}`} {formData.srnCurrency}
                                </p>

                                {errors.srnAmount && (
                                    <p className="mt-1 text-sm text-red-600" title={`Error: ${errors.srnAmount}`}>
                                        {errors.srnAmount}
                                    </p>
                                )}
                            </div>

                            <div className="lg:col-span-1">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Date</label>
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


                        {/* Row 3: SRN Description */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Payment Description
                                <span className="float-right text-sm text-gray-500">
                                    {descCharCount}/500 characters
                                </span>
                            </label>
                            <textarea
                                name="srnDsc"
                                value={formData.srnDsc}
                                onChange={handleInputChange}
                                rows={3}
                                className={`w-full px-4 py-3 border rounded-md  focus:ring-2 focus:ring-green-500 focus:outline-none focus:border-green-500 resize-none ${errors.srnDsc ? 'border-red-500' : 'border-gray-300'
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
                                Payment Remarks
                                <span className="float-right text-sm text-gray-500">
                                    {remarksCharCount}/500 characters
                                </span>
                            </label>
                            <textarea
                                name="srnRemarks"
                                value={formData.srnRemarks}
                                onChange={handleInputChange}
                                rows={3}
                                className={`w-full px-4 py-3 border rounded-md  focus:ring-2 focus:ring-green-500 focus:outline-none focus:border-green-500 resize-none ${remarksCharCount > 500 ? 'border-red-500' : 'border-gray-300'
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

                        {/* Attachments Section */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Paperclip size={16} className="inline mr-1" />
                                SRN Attachments (Max 4 files, 10MB each)
                            </label>
                            
                            {/* Drag and Drop Zone */}
                            <div
                                onDragOver={handleDragOver}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-green-500 transition-colors bg-gray-50 hover:bg-green-50"
                            >
                                <FileIcon size={32} className="mx-auto text-gray-400 mb-2" />
                                <p className="text-sm text-gray-600 mb-1">
                                    Drag and drop files here, or click to browse
                                </p>
                                <p className="text-xs text-gray-500">
                                    Supported: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, GIF, TXT
                                </p>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    onChange={handleFileChange}
                                    className="hidden"
                                    disabled={loading}
                                    multiple
                                    accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.txt"
                                />
                            </div>

                            {srnErrors && (
                                <p className="mt-2 text-xs text-red-600 flex items-center">
                                    <AlertCircle size={12} className="mr-1" />
                                    {srnErrors}
                                </p>
                            )}

                            {/* Selected Files List */}
                            {srnFiles.length > 0 && (
                                <div className="mt-3 space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-medium text-gray-700">
                                            Selected Files ({srnFiles.length}/4)
                                        </span>
                                        {srnFiles.length > 0 && (
                                            <button
                                                type="button"
                                                onClick={removeAllAttachments}
                                                className="text-xs text-red-600 hover:text-red-800 font-medium"
                                                disabled={loading}
                                            >
                                                Remove All
                                            </button>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        {srnFiles.map((file, index) => (
                                            <div
                                                key={index}
                                                className="flex items-center justify-between p-2 bg-white border border-gray-200 rounded-md hover:border-green-300 transition-colors"
                                            >
                                                <div className="flex items-center space-x-2 flex-1 min-w-0">
                                                    <FileIcon size={16} className="text-green-600 flex-shrink-0" />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs font-medium text-gray-700 truncate" title={file.name}>
                                                            {file.name}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            {formatFileSize(file.size)}
                                                        </p>
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removeSRNAttachment(index)}
                                                    className="ml-2 p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors flex-shrink-0"
                                                    disabled={loading}
                                                    title="Remove file"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
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
                                Create Payment
                            </>
                        )}
                    </button>
                </div>
            </div>

            <GlobalSnackbar
                open={snackbar.open}
                message={snackbar.message}
                severity={snackbar.severity}
                onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
            />

        </div>
    );
};

export default AddSRNModal;