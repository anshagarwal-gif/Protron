import { useState, useEffect } from 'react'
import axios from 'axios'
import { X, Calendar, Folder, User, Building, DollarSign, FileText, Receipt, Hash, MessageSquare, Upload, AlertCircle } from 'lucide-react'
import GlobalSnackbar from '../GlobalSnackbar'

const CreateNewSRNModal = ({ open, onClose, poId }) => {
    if (!open) return null
    const [po, setPo] = useState({})
    const [milestones, setMilestones] = useState([])
    const [formData, setFormData] = useState({
        poId: poId,
        msId: '',
        srnName: '',
        srnDsc: '',
        srnAmount: '',
        srnCurrency: po.poCurrency || "",
        srnRemarks: '',
        srnAttachment: null,
        srnType: 'partial',
        srnDate: ''
    })
    const [errors, setErrors] = useState({})
    const [loading, setLoading] = useState(false)
    const [poBalance, setPOBalance] = useState(null)
    const [milestoneBalance, setMilestoneBalance] = useState(null)
    const [srnFiles, setSrnFiles] = useState([])
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: ''
    })
const getCurrencySymbol = (currency) => {
    const currencySymbols = {
        'INR': '₹',
        'USD': '$',
        'EUR': '€',
        'GBP': '£',
        'JPY': '¥',
        'AUD': 'A$',
        'CAD': 'C$',
        'CHF': 'CHF',
        'CNY': '¥',
        'SEK': 'kr',
        'NZD': 'NZ$'
    };
    
    return currencySymbols[currency] || currency;
};
    const fetchPODetails = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/po/${poId}`, {
                headers: {
                    Authorization: sessionStorage.getItem("token")
                }
            })
            console.log("PO: ", res.data)
            setPo(res.data)
            setErrors({})
        } catch (error) {
            setErrors({submit:"Error fetching PO details. Please try again."})
            console.log(error)
        }
    }

    const fetchPOMilestones = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/po-milestone/po/${poId}`, {
                headers: {
                    Authorization: sessionStorage.getItem("token")
                }
            })
            console.log("Milestones: ", res.data)
            setMilestones(res.data)
            setErrors({})
        } catch (error) {
            setErrors({submit:"Error fetching PO milestones. Please try again."})
            console.log(error)
        }
    }

    useEffect(() => {
        if (poId) {
            fetchPODetails()
            fetchPOMilestones()
        }
    }, [poId])
    
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
                    setErrors({})
                } catch (error) {
                    setErrors({submit:"Error fetching PO balance. Please try again."})
                    console.error("Error fetching PO balance:", error);
                }
            }
        }
        const fetchMilestoneBalance = async (poId, msId) => {
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
                    setErrors({})
                } catch (error) {
                    setErrors({submit:"Error fetching milestone balance. Please try again."})
                    console.error("Error fetching milestone balance:", error);
                }
            }
        };

        fetchPOBalance(formData.poId);
        if (formData.poId && formData.msId) {
            fetchMilestoneBalance(formData.poId, formData.msId);
        } else {
            setMilestoneBalance(null);
        }
    }, [formData.poId, formData.msId])

    // Auto-fill amount when type is "full"
    useEffect(() => {
        if (formData.srnType === 'full') {
            const balanceToUse = milestoneBalance !== null ? milestoneBalance : poBalance;
            if (balanceToUse !== null && balanceToUse > 0) {
                setFormData(prev => ({
                    ...prev,
                    srnAmount: balanceToUse.toString()
                }));
            }
        }
    }, [formData.srnType, milestoneBalance, poBalance])

    // Auto-fill amount when milestone changes and type is "full"
    useEffect(() => {
        if (formData.srnType === 'full') {
            const balanceToUse = milestoneBalance !== null ? milestoneBalance : poBalance;
            if (balanceToUse !== null && balanceToUse > 0) {
                setFormData(prev => ({
                    ...prev,
                    srnAmount: balanceToUse.toString()
                }));
            }
        }
    }, [milestoneBalance])

    const removeSRNAttachment = async (index) => {
        const fileToDelete = srnFiles[index];
        const token = sessionStorage.getItem('token');

        try {
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/api/po-attachments/delete`, // Replace with actual delete endpoint
                {
                    method: 'DELETE',
                    headers: {
                        Authorization: `${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ fileName: fileToDelete.name }), // Adjust payload as per API requirements
                }
            );

            if (response.ok) {
                console.log(`Attachment ${fileToDelete.name} deleted successfully.`);
                setSrnFiles((prev) => prev.filter((_, i) => i !== index));
                setErrors({})
            } else {
                setErrors({submit:"Error deleting attachment. Please try again."})  
                console.error(`Failed to delete attachment: ${fileToDelete.name}`);
            }
        } catch (error) {
            setErrors({submit:"Error deleting attachment. Please try again."})  
            console.error(`Error deleting attachment: ${fileToDelete.name}`, error);
        }
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        if (!files.length) return;

        // Combine existing and new files
        const totalFiles = srnFiles.length + files.length;
        if (totalFiles > 4) {
            setSnackbar({
                open: true,
                message: "You can upload a maximum of 4 attachments.",
                severity: "error"
            });
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
                setSnackbar({
                    open: true,
                    message: "File size must be less than 10MB.",
                    severity: "error"
                });
                e.target.value = null;
                return;
            }
            if (!allowedTypes.includes(file.type)) {
                setSnackbar({
                    open: true,
                    message: "Unsupported file type.",
                    severity: "error"
                });
                e.target.value = null;
                return;
            }
        }

        setSrnFiles(prev => [...prev, ...files]);
        e.target.value = null; // reset input
    };

    const validateForm = () => {
    const newErrors = {}

    if (!formData.srnName.trim()) {
        newErrors.srnName = 'SRN Name is required'
    }

    if (!formData.srnAmount || formData.srnAmount <= 0) {
        newErrors.srnAmount = 'SRN Amount must be greater than 0'
    } else {
        // Check balance validation
        const enteredAmount = parseFloat(formData.srnAmount);
        const availableBalance = milestoneBalance !== null ? milestoneBalance : poBalance;
        
        if (availableBalance !== null && enteredAmount > availableBalance) {
            const balanceType = milestoneBalance !== null ? 'milestone' : 'PO';
            const currencySymbol = getCurrencySymbol(formData.srnCurrency);
            
            newErrors.srnAmount = `Amount exceeds available ${balanceType} balance of ${currencySymbol}${availableBalance.toLocaleString()}. Please enter an amount within the available balance.`;
        }
    }

    if (!formData.srnType) {
        newErrors.srnType = 'SRN Type is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
}

    const resetForm = () => {
        setFormData({
            poId: poId,
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
        setPo({});
        setMilestones([]);
        setSrnFiles([]);
        setPOBalance(null);
        setMilestoneBalance(null);
        setSnackbar({
            open: false,
            message: '',
            severity: ''
        });
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const handleSrnTypeChange = (e) => {
        const newType = e.target.value;
        setFormData(prev => ({
            ...prev,
            srnType: newType,
            // Clear amount when switching to partial, auto-fill when switching to full
            srnAmount: newType === 'full' ? 
                (milestoneBalance !== null ? milestoneBalance.toString() : 
                 poBalance !== null ? poBalance.toString() : '') : ''
        }));
    };const handleAmountChange = (e) => {
    const value = e.target.value;
    setFormData({ ...formData, srnAmount: value });
    
    // Clear previous amount error
    if (errors.srnAmount) {
        setErrors(prev => ({
            ...prev,
            srnAmount: ""
        }));
    }
    
    // Real-time validation
    if (value && parseFloat(value) > 0) {
        const enteredAmount = parseFloat(value);
        const availableBalance = milestoneBalance !== null ? milestoneBalance : poBalance;
        
        if (availableBalance !== null && enteredAmount > availableBalance) {
            const balanceType = milestoneBalance !== null ? 'milestone' : 'PO';
            const currencySymbol = getCurrencySymbol(formData.srnCurrency);
            
            setErrors(prev => ({
                ...prev,
                srnAmount: `Amount exceeds available ${balanceType} balance of ${currencySymbol}${availableBalance.toLocaleString()}`
            }));
        }
    }
};

    const handleMilestoneChange = (e) => {
        const newMsId = e.target.value;
        setFormData(prev => ({
            ...prev,
            msId: newMsId
        }));
        
        // If type is "full", the useEffect will handle the amount auto-fill
        // when milestoneBalance updates
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrors({}); // Clear previous errors

        try {
            const isValid = validateForm();
            if (!isValid) {
                setLoading(false);
                return;
            }

            const srnPayload = {
                poId: parseInt(formData.poId),
                msId: formData.msId ? parseInt(formData.msId) : null,
                srnName: formData.srnName.trim(),
                srnDsc: formData.srnDsc.trim() || '',
                srnAmount: parseFloat(formData.srnAmount),
                srnCurrency: formData.srnCurrency,
                srnRemarks: formData.srnRemarks.trim() || '',
                srnType: formData.srnType,
                srnDate: formData.srnDate || null,
            };

            console.log('SRN Payload:', srnPayload);

            const token = sessionStorage.getItem('token');
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/api/srn/add`,
                {
                    method: 'POST',
                    headers: {
                        Authorization: `${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(srnPayload),
                }
            );

            if (response.ok) {
                const data = await response.json();
                console.log('SRN Created:', data);
                setSnackbar({
                    open: true,
                    message: "SRN Created Successfully",
                    severity: "success",
                });
                setErrors({})

                const srnId = data.srnId; // Assuming the response contains the created SRN ID
                const srnName = data.srnName || formData.srnName;

                // Upload attachments if any
                if (srnFiles.length > 0) {
                    for (const file of srnFiles) {
                        const attachmentForm = new FormData();
                        attachmentForm.append('file', file);
                        attachmentForm.append('level', 'SRN');
                        attachmentForm.append('referenceId', srnId); // Replace with actual SRN ID
                        attachmentForm.append('referenceNumber', srnName); // Optional

                        try {
                            const uploadRes = await fetch(
                                `${import.meta.env.VITE_API_URL}/api/po-attachments/upload`,
                                {
                                    method: 'POST',
                                    headers: {
                                        Authorization: `${token}`,
                                    },
                                    body: attachmentForm,
                                }
                            );

                            if (!uploadRes.ok) {
                                console.error(`Attachment upload failed for ${file.name}`);
                                setErrors({
                                    submit: 'Attachment upload failed',
                                });
                                setSnackbar({
                                    open: true,
                                    message: "Attachment upload failed",
                                    severity: "error",
                                });
                            }

                        } catch (err) {
                            setErrors({
                                submit: 'Attachment upload failed',
                            });
                            console.error('Attachment upload error:', err);
                        }
                    }
                }

                handleClose();
            } else {
                const errorData = await response.text();
                console.error('SRN Creation Error:', errorData);
                setErrors({
                    submit: 'Failed to create SRN. Please check the console for details.',
                });
                setSnackbar({
                    open: true,
                    message: "Failed to create SRN. Please check the console for details.",
                    severity: "error",
                });

            }
        } catch (error) {
            console.error('Error creating SRN:', error);
            setErrors({
                submit: 'Network error. Please try again.',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDateInputClick = (inputName) => {
        const dateInput = document.getElementsByName(inputName)[0];
        if (dateInput) {
            dateInput.showPicker();
        }
    };
    
    useEffect(() => {
        if (po.poCurrency) {
            setFormData(prev => ({ ...prev, srnCurrency: po.poCurrency }));
        }
    }, [po.poCurrency]);

    // Reset form when modal opens
    useEffect(() => {
        if (open && poId) {
            resetForm();
        }
    }, [open, poId]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-xl max-w-[90vw] w-full mx-4 max-h-[95vh] overflow-hidden flex flex-col">
                <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-semibold text-green-900 flex items-center">
                            <Receipt size={20} className="mr-2 text-green-600" />
                            Create New SRN
                        </h2>
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
                        {errors.submit && (
                            <div className="bg-red-50 border border-red-200 rounded-md p-3 flex items-center">
                                <AlertCircle size={18} className="text-red-500 mr-2" />
                                <span className="text-red-700 text-sm">{errors.submit}</span>
                            </div>
                        )}

                        <div className='grid grid-cols-5 gap-4'>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">PO Name*</label>
                                <input
                                    type="text"
                                    value={po.poNumber ? `${po.poNumber}` : ''}
                                    readOnly
                                    className="w-full h-10 px-4 border border-gray-300 rounded-md bg-gray-100"
                                />
                            </div>

                            <div>
                                <label htmlFor="srnName" className="block text-sm font-medium text-gray-700 mb-2">
                                    SRN Name*
                                </label>
                                <input
                                    type="text"
                                    name="srnName"
                                    value={formData.srnName}
                                    onChange={(e) => setFormData({ ...formData, srnName: e.target.value })}
                                    className={`w-full h-10 px-4 border rounded-md ${errors.srnName ? 'border-red-500' : 'border-gray-300'}`}
                                    placeholder="Enter here"
                                    maxLength={100}
                                    disabled={loading}
                                    title={formData.srnName ? `SRN Name (${formData.srnName.length}/100 chars): ${formData.srnName}` : "Enter SRN name (required)"}
                                />
                                {errors.srnName && (
                                    <p className="mt-1 text-red-600 text-sm">{errors.srnName}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Milestone</label>
                                <select
                                    name="msId"
                                    value={formData.msId}
                                    onChange={handleMilestoneChange}
                                    className="w-full h-10 px-4 border border-gray-300 rounded-md"
                                    disabled={loading}
                                >
                                    <option value="">Select a milestone</option>
                                    {milestones.map((milestone) => (
                                        <option key={milestone.msId} value={milestone.msId}>
                                            {milestone.msName}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className='block text-sm font-medium text-gray-700 mb-2'>SRN Type*</label>
                                <select
                                    name="srnType"
                                    value={formData.srnType}
                                    onChange={handleSrnTypeChange}
                                    className={`w-full h-10 px-4 border rounded-md ${errors.srnType ? 'border-red-500' : 'border-gray-300'}`}
                                    disabled={loading}
                                >
                                    <option value="partial">Partial</option>
                                    <option value="full">Full</option>
                                </select>
                                {errors.srnType && (
                                    <p className="mt-1 text-red-600 text-sm">{errors.srnType}</p>
                                )}
                            </div>

                            <div>
                                <label className='block text-sm font-medium text-gray-700 mb-2'>Currency*</label>
                                <input
                                    type="text"
                                    value={po.poCurrency || formData.srnCurrency}
                                    onChange={(e) => setFormData({ ...formData, srnCurrency: po.poCurrency })}
                                    readOnly
                                    className="w-full h-10 px-4 border border-gray-300 rounded-md bg-gray-100"
                                />
                            </div>

                            <div>
                                <div className='flex justify-between items-center'>
                                    <label className='block text-sm font-medium text-gray-700 mb-2'>SRN Amount*</label>
                                    <label className='block text-[10px] font-medium text-gray-700 mb-2'>
    {milestoneBalance !== null ? (
        <span className="text-green-600">
            Milestone Balance: {getCurrencySymbol(formData.srnCurrency)}{milestoneBalance.toLocaleString()}
        </span>
    ) : (
        <span className="text-green-600">
            PO Balance: {getCurrencySymbol(formData.srnCurrency)}{poBalance !== null ? poBalance.toLocaleString() : 'Loading...'}
        </span>
    )}
</label>
                                </div>
                                <input
                                    type="number"
                                    name="srnAmount"
                                    value={formData.srnAmount}
                                    onChange={(e) => setFormData({ ...formData, srnAmount: e.target.value })}
                                    className={`w-full h-10 px-4 border rounded-md ${errors.srnAmount ? 'border-red-500' : 'border-gray-300'} ${formData.srnType === 'full' ? 'bg-gray-100' : ''}`}
                                    placeholder="Enter here"
                                    disabled={loading}
                                    min="0.01"
                                    step="0.01"
                                    readOnly={formData.srnType === 'full'}
                                />
                                {errors.srnAmount && (
                                    <p className="mt-1 text-red-600 text-sm">{errors.srnAmount}</p>
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
                                        onChange={(e) => setFormData({ ...formData, srnDate: e.target.value })}
                                        className="w-full bg-transparent outline-none cursor-pointer appearance-none"
                                        disabled={loading}
                                        title={formData.srnDate ? `SRN Date: ${new Date(formData.srnDate).toLocaleDateString()}` : "Click to select SRN date (optional)"}
                                    />
                                </div>
                            </div>
                        </div>
                        
                        <div>
                            <label htmlFor="srnDsc" className="block text-sm font-medium text-gray-700 mb-2">
                                SRN Description
                                <span className="float-right text-xs text-gray-500">
                                    {formData.srnDsc.length}/500 characters
                                </span>
                            </label>
                            <textarea
                                name="srnDsc"
                                value={formData.srnDsc}
                                onChange={(e) => setFormData({ ...formData, srnDsc: e.target.value })}
                                className="w-full h-20 px-4 py-2 border border-gray-300 rounded-md"
                                placeholder="Enter here"
                                maxLength={500}
                                disabled={loading}
                                title={formData.srnDsc ? `SRN Description (${formData.srnDsc.length}/500 chars): ${formData.srnDsc}` : "Enter SRN description (optional)"}
                            />
                        </div>

                        <div>
                            <label htmlFor="srnRemarks" className='block text-sm font-medium text-gray-700 mb-2'>
                                SRN Remarks
                                <span className="float-right text-xs text-gray-500">
                                    {formData.srnRemarks.length}/500 characters
                                </span>
                            </label>
                            <textarea
                                name="srnRemarks"
                                value={formData.srnRemarks}
                                onChange={(e) => setFormData({ ...formData, srnRemarks: e.target.value })}
                                className="w-full h-20 px-4 py-2 border border-gray-300 rounded-md"
                                placeholder='Enter Remarks'
                                maxLength={500}
                                disabled={loading}
                                title={formData.srnRemarks ? `SRN Remarks (${formData.srnRemarks.length}/500 chars): ${formData.srnRemarks}` : "Enter SRN remarks (optional)"}
                            />
                        </div>
                        <div className="grid grid-cols-6 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">SRN Attachments (Max 4)</label>
                                <div className="relative">
                                    <input
                                        type="file"
                                        id="srn-attachment-input"
                                        onChange={handleFileChange}
                                        name="srnAttachment"
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
                                
                            </div>
                        </div>
                        <ul className="mt-2 text-sm text-gray-700 flex flex-wrap gap-2">
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

                        <div className='flex justify-end space-x-4'>
                            <button
                                type='button'
                                onClick={handleClose}
                                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                                disabled={loading}
                            >
                                Cancel
                            </button>
                            <button
                                type='submit'
                                className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
                                disabled={loading}
                            >
                                {loading ? 'Creating...' : 'Submit'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
            <GlobalSnackbar
                open={snackbar.open}
                message={snackbar.message}
                severity={snackbar.severity}
                onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
            />

        </div>
    )
}

export default CreateNewSRNModal