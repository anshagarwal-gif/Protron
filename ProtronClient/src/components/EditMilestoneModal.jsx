// EditMilestoneModal.js
import { useState, useEffect, useRef } from "react";
import { X, Target, DollarSign, Calendar, FileText, AlertCircle, Loader2, Clock } from "lucide-react";
import axios from "axios";
import GlobalSnackbar from "../components/GlobalSnackbar";
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
const EditMilestoneModal = ({ open, onClose, onSubmit, milestoneId }) => {
  const [formData, setFormData] = useState({
    msName: "",
    msDesc: "",
    msAmount: "",
    msCurrency: "USD",
    msDate: "",
    msDuration: "",
    msRemarks: "",
    poId: "",
    poNumber: ""
  });
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [descWordCount, setDescWordCount] = useState(0);
  const [remarksWordCount, setRemarksWordCount] = useState(0);
  const [milestoneAttachments, setMilestoneAttachments] = useState([]);
  const [poBalance, setPOBalance] = useState(null); // Added state for PO balance
  const dateInputRef = useRef(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: ""
  });


  const fetchPOBalance = async () => {
    console.log("Fetching PO balance for PO ID:", formData.poId);
    if (formData.poId) {
      try {
        const token = sessionStorage.getItem('token');
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/po-milestone/getMilestoneBalanceForPO/${formData.poId}`,
          {
            headers: { Authorization: `${token}` }
          }
        );
        const calculatedBalance = (response.data || 0) + (formData.msAmount || 0)
        setPOBalance(calculatedBalance);
      } catch (error) {
        console.error("Error fetching PO balance:", error);
      }
    }
  };

  useEffect(() => {
    fetchPOBalance();
  }, [formData.poId]);

  // Helper function to count words
  const countWords = (text) => {
    if (!text || text.trim() === '') return 0;
    return text.trim().split(/\s+/).length;
  };

  // Fetch milestone data when modal opens
  useEffect(() => {
    if (open && milestoneId) {
      fetchMilestoneData();
      fetchMilestoneAttachments(milestoneId);
    }
  }, [open, milestoneId]);

  // Initialize word counts when form data is set
  useEffect(() => {
    setDescWordCount(countWords(formData.msDesc));
    setRemarksWordCount(countWords(formData.msRemarks));
  }, [formData.msDesc, formData.msRemarks]);

  const fetchMilestoneAttachments = async (milestoneId) => {
    try {
      const token = sessionStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/po-attachments/meta/filter?level=MS&referenceId=${milestoneId}`, {
        headers: { Authorization: token }
      });

      if (res.ok) {
        const data = await res.json();
        setMilestoneAttachments(data); // Assuming you're storing file meta here
      } else {
        console.error("Failed to fetch milestone attachments");
      }
    } catch (err) {
      console.error("Error fetching milestone attachments:", err);
    }
  };


  const fetchMilestoneData = async () => {
    setFetchLoading(true);
    setErrors({});
    try {
      const token = sessionStorage.getItem('token');
      if (!token) {
        throw new Error("Missing authentication credentials");
      }

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/po-milestone/${milestoneId}`,
        {
          headers: { Authorization: `${token}` }
        }
      );

      const milestone = response.data;
      console.log('Fetched milestone data:', milestone);

      setFormData({
        msName: milestone.msName || "",
        msDesc: milestone.msDesc || "",
        msAmount: milestone.msAmount || "",
        msCurrency: milestone.msCurrency || "USD",
        msDate: milestone.msDate ? milestone.msDate.split('T')[0] : "",
        msDuration: milestone.msDuration || "",
        msRemarks: milestone.msRemarks || "",
        poId: milestone.poDetail?.poId || "",
        poNumber: milestone.poNumber || ""
      });
    } catch (error) {
      console.error("Error fetching milestone:", error);
      setErrors({
        fetch: error.response?.data?.message || error.message || "Failed to fetch milestone data"
      });
    } finally {
      setFetchLoading(false);
    }
  };

  const removeAttachment = async (index) => {
    const attachmentToRemove = milestoneAttachments[index];

    try {
      const token = sessionStorage.getItem("token");
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/po-attachments/${attachmentToRemove.id}`, {
        method: "DELETE",
        headers: { Authorization: token },
      });

      if (!response.ok) {
        console.error(`Failed to delete attachment with ID: ${attachmentToRemove.id}`);
        return;
      }

      console.log(`Attachment with ID: ${attachmentToRemove.id} deleted successfully`);
      setMilestoneAttachments((prev) => prev.filter((_, i) => i !== index));
    } catch (error) {
      console.error(`Error deleting attachment with ID: ${attachmentToRemove.id}`, error);
    }
  };

 const handleInputChange = (e) => {
    const { name, value, type, files } = e.target;

    if (type === 'file') {
        setFormData(prev => ({
            ...prev,
            [name]: files[0] || null
        }));
    } else {
        // Check word limit for description and remarks
        if (name === 'msDesc') {
            const wordCount = countWords(value);
            if (wordCount > 500) {
                setErrors(prev => ({
                    ...prev,
                    [name]: "Description cannot exceed 500 words"
                }));
                return; // Don't update if exceeding limit
            }
            setDescWordCount(wordCount);
        } else if (name === 'msRemarks') {
            const wordCount = countWords(value);
            if (wordCount > 500) {
                setErrors(prev => ({
                    ...prev,
                    [name]: "Remarks cannot exceed 500 words"
                }));
                return; // Don't update if exceeding limit
            }
            setRemarksWordCount(wordCount);
        }

        // Real-time amount validation
        if (name === 'msAmount' && value) {
            const enteredAmount = parseFloat(value);
            if (poBalance !== null && enteredAmount > poBalance) {
                const currencySymbol = getCurrencySymbol(formData.msCurrency);
                setErrors(prev => ({
                    ...prev,
                    msAmount: `Amount exceeds available PO balance of ${currencySymbol}${poBalance.toLocaleString()}`
                }));
            }
        }

        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    }

    // Clear error when user starts typing (except for real-time validation)
    if (errors[name] && name !== 'msAmount') {
        setErrors(prev => ({
            ...prev,
            [name]: ""
        }));
    } else if (name === 'msAmount' && value && parseFloat(value) <= poBalance) {
        // Clear amount error only when value is within balance
        setErrors(prev => ({
            ...prev,
            [name]: ""
        }));
    }
};
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const maxFiles = 4;

    if (milestoneAttachments.length + files.length > maxFiles) {
      setErrors(prev => ({
        ...prev,
        attachment: `You can upload a maximum of ${maxFiles} attachments.`
      }));
      return;
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
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

    const validFiles = files.filter(file => {
      if (file.size > maxSize) {
        setErrors(prev => ({
          ...prev,
          attachment: `File ${file.name} exceeds the maximum size of 10MB.`
        }));
        return false;
      }
      if (!allowedTypes.includes(file.type)) {
        setErrors(prev => ({
          ...prev,
          attachment: `File type for ${file.name} is not supported.`
        }));
        return false;
      }
      return true;
    });

    if (validFiles.length > 0) {
      setMilestoneAttachments(prev => [...prev, ...validFiles]);
    }

    e.target.value = null; // Reset file input
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.msName?.trim()) {
        newErrors.msName = "Milestone name is required";
    }

    if (!formData.msDesc?.trim()) {
        newErrors.msDesc = "Description is required";
    }

    if (!formData.msAmount || formData.msAmount <= 0) {
        newErrors.msAmount = "Valid amount is required";
    } else {
        // Check balance validation
        const enteredAmount = parseFloat(formData.msAmount);
        
        if (poBalance !== null && enteredAmount > poBalance) {
            const currencySymbol = getCurrencySymbol(formData.msCurrency);
            newErrors.msAmount = `Amount exceeds available PO balance of ${currencySymbol}${poBalance.toLocaleString()}. Please enter an amount within the available balance.`;
        }
    }

    if (formData.msDuration && formData.msDuration < 0) {
        newErrors.msDuration = "Duration cannot be negative";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
};

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const token = sessionStorage.getItem('token');
      if (!token) {
        throw new Error("Missing authentication credentials");
      }

      // Prepare milestone data
      const submitData = {
        msName: formData.msName,
        msDesc: formData.msDesc,
        msAmount: parseInt(formData.msAmount) || 0,
        msCurrency: formData.msCurrency,
        msDate: formData.msDate || null,
        msDuration: parseInt(formData.msDuration) || 0,
        msRemarks: formData.msRemarks || "",
        poId: parseInt(formData.poId),
        poNumber: formData.poNumber
      };

      console.log('Submitting milestone update:', submitData);

      // Update milestone data
      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/api/po-milestone/edit/${milestoneId}`,
        submitData,
        {
          headers: {
            Authorization: `${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      console.log('Milestone updated successfully:', response.data);
      setSnackbar({
        open: true,
        message: "Milestone updated successfully",
        severity: "success"
      });


      // Upload new attachments
      if (milestoneAttachments.length > 0) {
        for (const file of milestoneAttachments) {
          if (file instanceof File) { // Ensure only new files are uploaded
            const formData = new FormData();
            formData.append("file", file);
            formData.append("level", "MS");
            formData.append("referenceId", response.data.msId); // Use the updated milestone ID

            const uploadResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/po-attachments/upload`, {
              method: "POST",
              headers: { Authorization: token },
              body: formData
            });

            if (!uploadResponse.ok) {
              console.error(`Failed to upload file: ${file.name}`);
            }

          }
        }
      }

      onSubmit(response.data);

      handleClose();
    } catch (error) {
      console.error("Error updating milestone:", error);
      setSnackbar({
        open: true,
        message: "Failed to update milestone",
        severity: "error"
      })
      setErrors({
        submit: error.response?.data?.message || error.message || "Failed to update milestone"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      msName: "",
      msDesc: "",
      msAmount: "",
      msCurrency: "USD",
      msDate: "",
      msDuration: "",
      msRemarks: "",
      poId: "",
      poNumber: ""
    });
    setErrors({});
    setDescWordCount(0);
    setRemarksWordCount(0);
    onClose();
  };
  const handleDateInputClick = () => {
    dateInputRef.current.showPicker?.();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <Target size={20} className="mr-2 text-green-600" />
            Edit Milestone
          </h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            disabled={loading || fetchLoading}
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Loading State */}
        {fetchLoading && (
          <div className="flex items-center justify-center p-8">
            <div className="flex items-center space-x-2">
              <Loader2 className="animate-spin text-green-600" size={24} />
              <span className="text-green-600 font-medium">Loading milestone data...</span>
            </div>
          </div>
        )}

        {/* Error State */}
        {errors.fetch && !fetchLoading && (
          <div className="p-6">
            <div className="bg-red-50 border border-red-200 rounded-md p-4 flex items-center">
              <AlertCircle size={20} className="text-red-500 mr-2" />
              <span className="text-red-700">{errors.fetch}</span>
            </div>
            <div className="flex justify-end mt-4">
              <button
                onClick={handleClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Form */}
        {!fetchLoading && !errors.fetch && (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Error Display */}
            {errors.submit && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3 flex items-center">
                <AlertCircle size={18} className="text-red-500 mr-2" />
                <span className="text-red-700 text-sm">{errors.submit}</span>
              </div>
            )}

            <div className="space-y-4">
              {/* Row 1: Milestone Name, Currency, and Amount (all at top) */}
              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-6">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    <Target size={14} className="inline mr-1" />
                    Milestone Name *
                  </label>
                  <input
                    type="text"
                    name="msName"
                    value={formData.msName}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 ${errors.msName ? 'border-red-500' : 'border-gray-300'
                      }`}
                    placeholder="Enter milestone name"
                    disabled={loading}
                  />
                  {errors.msName && (
                    <p className="mt-1 text-xs text-red-600">{errors.msName}</p>
                  )}
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Currency
                  </label>
                  <select
                    name="msCurrency"
                    value={formData.msCurrency}
                    onChange={handleInputChange}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                    disabled={true}
                  >
                    <option value="USD">USD</option>
                    <option value="INR">INR</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="JPY">JPY</option>
                  </select>
                </div>

                <div className="col-span-3">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    <DollarSign size={14} className="inline mr-1" />
                    Amount *
                  </label>
                  <input
                    type="number"
                    name="msAmount"
                    value={formData.msAmount}
                    onChange={handleInputChange}
                    step="1"
                    min="0"
                    className={`w-full px-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 ${errors.msAmount ? 'border-red-500' : 'border-gray-300'
                      }`}
                    placeholder="0"
                    disabled={loading}
                  />
                  {errors.msAmount && (
                    <p className="mt-1 text-xs text-red-600">{errors.msAmount}</p>
                  )}
               <label className="text-xs text-green-600 mt-1">
    PO Balance: {poBalance !== null ? `${getCurrencySymbol(formData.msCurrency)}${poBalance.toLocaleString()}` : 'Loading...'}
</label>
                </div>

                <div className="col-span-1"></div> {/* Small spacer */}
              </div>

              {/* Row 2: Duration, Date and Attachment */}
              <div className="grid grid-cols-8 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    <Clock size={14} className="inline mr-1" />
                    Duration (Days)
                  </label>
                  <input
                    type="number"
                    name="msDuration"
                    value={formData.msDuration}
                    onChange={handleInputChange}
                    min="0"
                    className={`w-full px-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 ${errors.msDuration ? 'border-red-500' : 'border-gray-300'
                      }`}
                    placeholder="0"
                    disabled={loading}
                  />
                  {errors.msDuration && (
                    <p className="mt-1 text-xs text-red-600">{errors.msDuration}</p>
                  )}
                </div>

                <div className="col-span-3" onClick={handleDateInputClick}>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    <Calendar size={14} className="inline mr-1" />
                    Milestone Date
                  </label>
                  <input
                    ref={dateInputRef}
                    type="date"
                    name="msDate"
                    value={formData.msDate}
                    onChange={handleInputChange}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                    disabled={loading}
                  />
                </div>

                <div className="col-span-3">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    <FileText size={14} className="inline mr-1" />
                    Attachments (Max 4)
                  </label>
                  <input
                    type="file"
                    name="msAttachment"
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xlsx,.xls"
                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-medium file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                    disabled={loading}
                    multiple
                  />
                  <ul className="mt-2 text-xs text-gray-700 space-y-1">
                    {milestoneAttachments.map((file, index) => (
                      <li key={index} className="flex items-center justify-between bg-gray-100 px-3 py-1 rounded">
                        <span className="truncate max-w-[200px]" title={file.fileName || file.name}>
                          {file.fileName || file.name}
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

              {/* Row 3: Description (large box for extensive text) */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  <FileText size={14} className="inline mr-1" />
                  Description *
                  <span className="float-right text-xs text-gray-500">
                    {descWordCount}/500 words
                  </span>
                </label>
                <textarea
                  name="msDesc"
                  value={formData.msDesc}
                  onChange={handleInputChange}
                  rows={4}
                  className={`w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 resize-none ${errors.msDesc ? 'border-red-500' : 'border-gray-300'
                    }`}
                  placeholder="Enter detailed milestone description with all necessary information, objectives, deliverables, and requirements... (Max 500 words)"
                  disabled={loading}
                />
                {errors.msDesc && (
                  <p className="mt-1 text-xs text-red-600">{errors.msDesc}</p>
                )}
              </div>

              {/* Row 4: Remarks (large box for extensive text) */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  <FileText size={14} className="inline mr-1" />
                  Remarks
                  <span className="float-right text-xs text-gray-500">
                    {remarksWordCount}/500 words
                  </span>
                </label>
                <textarea
                  name="msRemarks"
                  value={formData.msRemarks}
                  onChange={handleInputChange}
                  rows={3}
                  className={`w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 resize-none ${remarksWordCount > 500 ? 'border-red-500' : 'border-gray-300'
                    }`}
                  placeholder="Enter additional remarks, notes, special instructions, dependencies, or any other relevant information... (Max 500 words)"
                  disabled={loading}
                />
                {errors.msRemarks && (
                  <p className="mt-1 text-xs text-red-600">{errors.msRemarks}</p>
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
                    Updating...
                  </>
                ) : (
                  <>
                    <Target size={14} className="mr-2" />
                    Update Milestone
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
      <GlobalSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      />
    </div>
  );
};

export default EditMilestoneModal;