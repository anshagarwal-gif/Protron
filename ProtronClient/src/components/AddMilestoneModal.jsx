// AddMilestoneModal.js
import { useState, useEffect, useRef } from "react";
import { X, Target, DollarSign, Calendar, FileText, AlertCircle, Clock, Upload, File, Paperclip } from "lucide-react";
import axios from "axios";
import GlobalSnackbar from "../components/GlobalSnackbar";


const AddMilestoneModal = ({ open, onClose, onSubmit, poId }) => {
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
    msName: "",
    msDesc: "",
    msAmount: "",
    msCurrency: "USD",
    msDate: "",
    msDuration: "",
    msRemarks: "",
    poId: poId,
    poNumber: ""
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [poDetails, setPODetails] = useState(null);
  const [descCharCount, setDescCharCount] = useState(0);
  const [remarksCharCount, setRemarksCharCount] = useState(0);
  const [poBalance, setPOBalance] = useState(null);
  const [milestoneFiles, setMilestoneFiles] = useState([]);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: ""
  });

  // Character limits
  const DESC_CHAR_LIMIT = 500;
  const REMARKS_CHAR_LIMIT = 500;

  // Fetch PO details to get PO number and currency
  useEffect(() => {
    const fetchPODetails = async () => {
      if (open && poId) {
        try {
          const token = sessionStorage.getItem('token');
          const response = await axios.get(
            `${import.meta.env.VITE_API_URL}/api/po/${poId}`,
            {
              headers: { Authorization: `${token}` }
            }
          );
          setPODetails(response.data);
          setFormData(prev => ({
            ...prev,
            poId: poId,
            poNumber: response.data.poNumber || "",
            msCurrency: response.data.poCurrency || "USD"
          }));
        } catch (error) {
          console.error("Error fetching PO details:", error);
        }
      }
    };

    fetchPODetails();
  }, [open, poId]);

  useEffect(() => {
    const fetchPOBalance = async () => {
      if (poId) {
        try {
          const token = sessionStorage.getItem('token');
          const response = await axios.get(
            `${import.meta.env.VITE_API_URL}/api/po-milestone/getMilestoneBalanceForPO/${poId}`,
            {
              headers: { Authorization: `${token}` }
            }
          );
          setPOBalance(response.data);
          console.log(poId, response.data);
          setErrors({});
        } catch (error) {
          setErrors({ submit: "Error fetching PO balance. Please try again." })
          console.error("Error fetching PO balance:", error);
        }
      }
    };
    fetchPOBalance();
  }, [open, poId]);

  // Initialize character counts when form data is set
  useEffect(() => {
    setDescCharCount(formData.msDesc.length);
    setRemarksCharCount(formData.msRemarks.length);
  }, [formData.msDesc, formData.msRemarks]);

  useEffect(() => {
    if (open && poId) {
      setErrors({});
    }
  }, [open, poId]);

  const handleInputChange = (e) => {
    const { name, value, type, files } = e.target;

    if (type === 'file') {
      setFormData(prev => ({
        ...prev,
        [name]: files[0] || null
      }));
    } else {
      // Check character limit for description and remarks
      if (name === 'msDesc') {
        if (value.length > DESC_CHAR_LIMIT) {
          setErrors(prev => ({
            ...prev,
            [name]: `Description cannot exceed ${DESC_CHAR_LIMIT} characters`
          }));
          return; // Don't update if exceeding limit
        }
        setDescCharCount(value.length);
      } else if (name === 'msRemarks') {
        if (value.length > REMARKS_CHAR_LIMIT) {
          setErrors(prev => ({
            ...prev,
            [name]: `Remarks cannot exceed ${REMARKS_CHAR_LIMIT} characters`
          }));
          return; // Don't update if exceeding limit
        }
        setRemarksCharCount(value.length);
      }

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

  const handleMSFileChange = (e) => {
    const files = Array.from(e.target?.files || e.dataTransfer?.files || []);
    if (!files.length) return;

    // Check max limit of 4 files
    if (milestoneFiles.length + files.length > 4) {
      setSnackbar({
        open: true,
        message: "Maximum 4 files allowed",
        severity: "error"
      });
      return;
    }

    // Validate file size (10MB max per file)
    const maxSize = 10 * 1024 * 1024;
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

    let error = "";
    const validFiles = [];

    for (const file of files) {
      if (file.size > maxSize) {
        error = `File "${file.name}" exceeds 10MB limit.`;
        break;
      }
      if (!allowedTypes.includes(file.type)) {
        error = "Unsupported file type. Upload PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, GIF, or TXT.";
        break;
      }
      validFiles.push(file);
    }

    if (error) {
      setSnackbar({
        open: true,
        message: error,
        severity: "error"
      });
      return;
    }

    setMilestoneFiles(prev => [...prev, ...validFiles]);
    if (e.target) e.target.value = null;
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    handleMSFileChange(e);
  };

  const removeMilestoneAttachment = (index) => {
    setMilestoneFiles(prev => prev.filter((_, i) => i !== index));
  };

  const removeAllAttachments = () => {
    setMilestoneFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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
    console.log(onSubmit)

    console.log("elseCall", milestoneFiles);
    setLoading(true);
    try {
      const token = sessionStorage.getItem('token');
      if (!token) {
        throw new Error("Missing authentication credentials");
      }

      const submitData = {
        msName: formData.msName,
        msDesc: formData.msDesc,
        msAmount: parseInt(formData.msAmount) || 0,
        msCurrency: formData.msCurrency,
        msDate: formData.msDate || null,
        msDuration: parseInt(formData.msDuration) || 0,
        msRemarks: formData.msRemarks || "",
        poId: parseInt(poId),
        poNumber: formData.poNumber
      };

      console.log('Submitting milestone data:', submitData);

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/po-milestone/add`,
        submitData,
        {
          headers: {
            Authorization: `${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      console.log('Milestone added successfully:', response.data);

      setSnackbar({
        open: true,
        message: "Milestone added successfully",
        severity: "success"
      });

      setErrors({})

      const milestoneId = response.data.id || response.data.msId;
      const milestoneName = response.data.msName;

      if (milestoneFiles.length > 0) {
        for (const file of milestoneFiles) {
          const attachmentForm = new FormData();
          attachmentForm.append("file", file);
          attachmentForm.append("level", "MS");
          attachmentForm.append("referenceId", milestoneId);
          attachmentForm.append("referenceNumber", milestoneName || "");

          try {
            const uploadRes = await fetch(`${import.meta.env.VITE_API_URL}/api/po-attachments/upload`, {
              method: "POST",
              headers: {
                Authorization: `${token}`
              },
              body: attachmentForm
            });
            console.log("Attachment upload response:", uploadRes);

            if (!uploadRes.ok) {
              console.error(`Attachment upload failed for ${file.name}`);
              setErrors({ submit: "Error uploading attachment. Please try again." })
              setSnackbar({
                open: true,
                message: "Attachment upload failed",
                severity: "error"
              });
            }
          } catch (err) {
            console.error("Attachment upload error:", err);
            setErrors({ submit: "Error uploading attachment. Please try again." })

          }
        }
      }

      onSubmit({
        msId: milestoneId,
        milestoneName: formData.msName,
        milestoneDescription: formData.msDesc,
        amount: parseInt(formData.msAmount) || 0,
        currency: formData.msCurrency,
        date: formData.msDate ? new Date(formData.msDate).toISOString().split('T')[0] : null,
        duration: parseInt(formData.msDuration) || 0,
        remark: formData.msRemarks || "",
        attachments: milestoneFiles
      });

      resetForm();

    } catch (error) {
      console.error("Error adding milestone:", error);
      setErrors({
        submit: error.response?.data?.message || error.message || "Failed to add milestone"
      });
    } finally {
      setLoading(false);

    }
  };

  const resetForm = () => {
    setFormData({
      msName: "",
      msDesc: "",
      msAmount: "",
      msCurrency: poDetails?.poCurrency || "USD",
      msDate: "",
      msDuration: "",
      msRemarks: "",
      poId: poId,
      poNumber: poDetails?.poNumber || ""
    });
    setErrors({});
    setDescCharCount(0);
    setRemarksCharCount(0);
    setMilestoneFiles([]);
    setSnackbar({
      open: false,
      message: "",
      severity: ""
    });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleDateInputClick = (inputName) => {
    const dateInput = document.getElementsByName(inputName)[0];
    if (dateInput) {
      dateInput.showPicker();
    }
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
                <Target className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg lg:text-xl font-bold">Add New Milestone</h2>
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
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-grow">
          {/* Error Display */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 flex items-center">
              <AlertCircle size={18} className="text-red-500 mr-2" />
              <span className="text-red-700 text-sm">{errors.submit}</span>
            </div>
          )}

          <div className="space-y-4">
            {/* Row 1: Milestone Name, Currency, and Amount (all at top) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  <Target size={14} className="inline mr-1" />
                  Milestone Name *
                  <span className="float-right text-xs text-gray-500">
                    {formData.msName.length}/50 char
                  </span>
                </label>
                <input
                  type="text"
                  name="msName"
                  value={formData.msName}
                  onChange={e => {
                    let value = e.target.value;
                    if (value.length > 50) value = value.slice(0, 50);
                    setFormData(prev => ({ ...prev, msName: value }));
                  }}
                  className={`w-full px-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 ${errors.msName ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="Enter milestone name"
                  maxLength={50}
                  disabled={loading}
                />
                {errors.msName && (
                  <p className="mt-1 text-xs text-red-600">{errors.msName}</p>
                )}
              </div>

              <div className="">
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

              <div className="">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Amount *
                </label>
                <input
                  type="text"
                  name="msAmount"
                  value={formData.msAmount}
                  onChange={e => {
                    let value = e.target.value.replace(/[^0-9.]/g, '');
                    const parts = value.split('.');
                    if (parts.length > 2) value = parts[0] + '.' + parts[1];
                    if (parts[0].length > 13) parts[0] = parts[0].slice(0, 13);
                    if (parts[1]) parts[1] = parts[1].slice(0, 2);
                    value = parts[1] !== undefined ? parts[0] + '.' + parts[1] : parts[0];
                    setFormData(prev => ({ ...prev, msAmount: value }));
                  }}
                  className={`w-full px-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 ${errors.msAmount ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="0"
                  maxLength={16}
                  disabled={loading}
                />
                {errors.msAmount && (
                  <p className="mt-1 text-xs text-red-600">{errors.msAmount}</p>
                )}
                <label className="text-xs text-red-500 mt-1">
                  PO Balance: {poBalance !== null ? `${poBalance} ${formData.msCurrency}` : 'Loading...'}
                </label>
              </div>

              <div className="">
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
                  className={`w-full px-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 ${errors.msDuration ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="0"
                  disabled={loading}
                />
                {errors.msDuration && (
                  <p className="mt-1 text-xs text-red-600">{errors.msDuration}</p>
                )}
              </div>
            </div>

            {/* Row 2: Duration, Date and Attachment */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">

              <div className="">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  <Calendar size={14} className="inline mr-1" />
                  Milestone Date
                </label>
                <input
                  type="date"
                  name="msDate"
                  value={formData.msDate}
                  onChange={handleInputChange}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                  disabled={loading}
                  onClick={() => handleDateInputClick('msDate')}
                  min="1900-01-01"
                  max="2099-12-31"
                />

              </div>


            </div>

            {/* Row 3: Description (large box for extensive text) */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                <FileText size={14} className="inline mr-1" />
                Description *
                <span className="float-right text-xs text-gray-500">
                  {descCharCount}/{DESC_CHAR_LIMIT} characters
                </span>
              </label>
              <textarea
                name="msDesc"
                value={formData.msDesc}
                onChange={handleInputChange}
                rows={4}
                className={`w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 resize-none break-words overflow-wrap-anywhere whitespace-pre-wrap ${errors.msDesc ? 'border-red-500' : 'border-gray-300'}`}
                placeholder={`Enter detailed milestone description with all necessary information, objectives, deliverables, and requirements... (Max ${DESC_CHAR_LIMIT} characters)`}
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
                  {remarksCharCount}/{REMARKS_CHAR_LIMIT} characters
                </span>
              </label>
              <textarea
                name="msRemarks"
                value={formData.msRemarks}
                onChange={handleInputChange}
                rows={3}
                className={`w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 resize-none break-words overflow-wrap-anywhere whitespace-pre-wrap ${remarksCharCount > REMARKS_CHAR_LIMIT ? 'border-red-500' : 'border-gray-300'}`}
                placeholder={`Enter additional remarks, notes, special instructions, dependencies, or any other relevant information... (Max ${REMARKS_CHAR_LIMIT} characters)`}
                disabled={loading}
              />
              {errors.msRemarks && (
                <p className="mt-1 text-xs text-red-600">{errors.msRemarks}</p>
              )}
            </div>

            {/* Attachments Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Paperclip size={16} className="inline mr-1" />
                Milestone Attachments (Max 4 files, 10MB each)
              </label>
              
              {/* Drag and Drop Zone */}
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-green-500 transition-colors bg-gray-50 hover:bg-green-50"
              >
                <File size={32} className="mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-600 mb-1">
                  Drag and drop files here, or click to browse
                </p>
                <p className="text-xs text-gray-500">
                  Supported: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, GIF, TXT
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleMSFileChange}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.txt"
                  className="hidden"
                  disabled={loading}
                />
              </div>

              {/* Selected Files List */}
              {milestoneFiles.length > 0 && (
                <div className="mt-3 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-gray-700">
                      Selected Files ({milestoneFiles.length}/4)
                    </span>
                    {milestoneFiles.length > 0 && (
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
                    {milestoneFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-white border border-gray-200 rounded-md hover:border-green-300 transition-colors"
                      >
                        <div className="flex items-center space-x-2 flex-1 min-w-0">
                          <File size={16} className="text-green-600 flex-shrink-0" />
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
                          onClick={() => removeMilestoneAttachment(index)}
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
                  Adding...
                </>
              ) : (
                <>
                  <Target size={14} className="mr-2" />
                  Add Milestone
                </>
              )}
            </button>
          </div>
        </form>
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

export default AddMilestoneModal;