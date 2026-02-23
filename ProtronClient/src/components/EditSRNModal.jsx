// EditSRNModal.js
import { useState, useEffect, useRef } from "react";
import { X, Receipt, DollarSign, FileText, AlertCircle, Activity, Paperclip, Calendar, Upload, File as FileIcon } from "lucide-react";
import axios from "axios";
import GlobalSnackbar from "./GlobalSnackbar";


const EditSRNModal = ({ open, onClose, onSubmit, srnId }) => {
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
    poNumber: "",
    msId: "",
    srnName: "",
    srnDsc: "",
    srnAmount: "",
    srnCurrency: "USD",
    srnType: "",
    srnRemarks: "",
    srnDate: "",
  });
  const [srnAttachments, setSrnAttachments] = useState([]); // Holds both existing and new attachments
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [poList, setPOList] = useState([]);
  const [milestoneList, setMilestoneList] = useState([]);
  const [descCharCount, setDescCharCount] = useState(0);
  const [remarksCharCount, setRemarksCharCount] = useState(0);
  const [nameCharCount, setNameCharCount] = useState(0);
  const [initialLoading, setInitialLoading] = useState(false);
  const [poBalance, setPOBalance] = useState(null);
  const [poId, setPoId] = useState("");
  const [milestoneBalance, setMilestoneBalance] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info"
  });

  // Truncate text utility function
  const truncateText = (text, maxLength = 50) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };
  console.log(srnId)
  // Truncate compnent with hover tooltip
  const currencySymbols = {
    USD: "$",
    INR: "₹",
    EUR: "€",
    GBP: "£",
    JPY: "¥"
  };
  const getCurrencySymbol = (currency) => {
    return currencySymbols[currency] || currency;
  }
  const TruncatedText = ({ text, maxLength = 50, className = "" }) => {
    const truncated = truncateText(text, maxLength);
    const isOverflow = text && text.length > maxLength;

    if (!isOverflow) {
      return <span className={className}>{text}</span>;
    }
    return (
      <span
        className={`${className} cursor-help relative group`}
        title={text}
      >
        {truncated}
        <div className="invisible group-hover:visible absolute z-10 w-64 p-2 mt-1 text-xs text-white bg-gray-900 rounded-md shadow-lg -top-2 left-0 break-words">
          {text}
          <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
        </div>
      </span>
    );
  };

  // Truncated option component for select dropdowns
  const TruncatedOption = ({ value, text, maxLength = 30 }) => {
    return (
      <option value={value} title={text}>
        {truncateText(text, maxLength)}
      </option>
    );
  };

  const fetchSRNAttachments = async (srnId) => {
    try {
      const token = sessionStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/po-attachments/meta/filter?level=SRN&referenceId=${srnId}`, {
        headers: { Authorization: token }
      });

      if (res.ok) {
        const data = await res.json();
        setSrnAttachments(data); // Attach to edit modal state
      } else {
        console.error("Failed to fetch SRN attachments");
      }
    } catch (err) {
      console.error("Error fetching SRN attachments:", err);
    }
  };

  useEffect(() => {
    const fetchSRNData = async () => {
      if (open && srnId) {
        console.log('=== Fetching SRN Data ===');
        console.log('SRN ID:', srnId);
        setInitialLoading(true);
        try {
          const token = sessionStorage.getItem('token');

          // Fetch SRN details
          const srnResponse = await axios.get(
            `${import.meta.env.VITE_API_URL}/api/srn/${srnId}`,
            {
              headers: { Authorization: `${token}` }
            }
          );

          const srn = srnResponse.data;
          console.log('✅ SRN response:', srn);
          setFormData({
            poNumber: srn.poNumber || "",
            msId: srn.milestone?.msId || "",
            srnName: srn.srnName || "",
            srnDsc: srn.srnDsc || "",
            srnAmount: srn.srnAmount?.toString() || "",
            srnCurrency: srn.srnCurrency || "USD",
            srnType: srn.srnType,
            srnRemarks: srn.srnRemarks || "",
            srnDate: srn.srnDate || "",
            srnDate: srn.srnDate || "",
          });
          setPoId(srn.poDetail.poId || "");
          console.log('Form data set:', {
            poNumber: srn.poNumber,
            msId: srn.milestone?.msId,
            srnName: srn.srnName,
            srnType: srn.srnType,
            srnAmount: srn.srnAmount
          });
          console.log('SRN Type from response:', srn.srnType);

        } catch (error) {
          console.error("❌ Error fetching SRN data:", error);
          console.error("Error details:", error.response?.data || error.message);
          setErrors({ submit: "Failed to load SRN data" });
        } finally {
          setInitialLoading(false);
        }
      }
    };

    fetchSRNData();
    if (srnId) {
      fetchSRNAttachments(srnId);
    }
  }, [open, srnId]);

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
          console.log('PO Balance response:', response.data);
          setPOBalance(response.data + (parseInt(formData.srnAmount) || 0));
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
          setMilestoneBalance(response.data + (parseInt(formData.srnAmount) || 0));
        } catch (error) {
          console.error("Error fetching milestone balance:", error);
        }
      }
    };

    fetchPOBalance(poId);
    if (poId && formData.msId) {
      fetchMilestone(poId, formData.msId);
    } else {
      setMilestoneBalance(null);
    }



  }, [poId, formData.msId]);

  // Fetch PO list when modal opens
  useEffect(() => {
    const fetchPOList = async () => {
      if (open) {
        try {
          const token = sessionStorage.getItem('token');

          // Fetch PO list
          const poResponse = await axios.get(
            `${import.meta.env.VITE_API_URL}/api/po/all`,
            {
              headers: { Authorization: `${token}` }
            }
          );
          setPOList(poResponse.data);

        } catch (error) {
          console.error("Error fetching PO list:", error);
        }
      }
    };

    fetchPOList();
  }, [open]);

  // Fetch milestones when PO is selected
  useEffect(() => {
    const fetchMilestones = async () => {
      if (formData.poNumber && poList.length > 0) {
        try {
          const token = sessionStorage.getItem('token');
          const selectedPO = poList.find(po => po.poNumber === formData.poNumber);

          if (selectedPO) {
            console.log('Selected PO:', selectedPO);

            try {
              const milestoneResponse = await axios.get(
                `${import.meta.env.VITE_API_URL}/api/po-milestone/po/${selectedPO.poId}`,
                {
                  headers: { Authorization: `${token}` }
                }
              );

              console.log('Milestone response:', milestoneResponse.data);
              setMilestoneList(milestoneResponse.data || []);

            } catch (milestoneError) {
              console.error("Error fetching milestones:", milestoneError);
              setMilestoneList([]);
            }

            // Update currency based on selected PO (only if not already set)
            if (!formData.srnCurrency || formData.srnCurrency === 'USD') {
              setFormData(prev => ({
                ...prev,
                srnCurrency: selectedPO.poCurrency || "USD"
              }));
            }
          }
        } catch (error) {
          console.error("Error in fetchMilestones:", error);
          setMilestoneList([]);
        }
      } else {
        setMilestoneList([]);
      }
    };

    fetchMilestones();
  }, [formData.poNumber, poList]);

  // Initialize character counts when form data is set
  useEffect(() => {
    setNameCharCount(formData.srnName.length);
    setDescCharCount(formData.srnDsc.length);
    setRemarksCharCount(formData.srnRemarks.length);
  }, [formData.srnName, formData.srnDsc, formData.srnRemarks]);

  useEffect(() => {
    if (open) {
      setErrors({});
    }
  }, [open]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // Check character limits
    if (name === 'srnName') {
      if (value.length > 100) {
        setErrors(prev => ({
          ...prev,
          [name]: "Payment name cannot exceed 100 characters"
        }));
        return;
      }
      setNameCharCount(value.length);
    } else if (name === 'srnDsc') {
      if (value.length > 500) {
        setErrors(prev => ({
          ...prev,
          [name]: "Payment description cannot exceed 500 characters"
        }));
        return;
      }
      setDescCharCount(value.length);
    } else if (name === 'srnRemarks') {
      if (value.length > 500) {
        setErrors(prev => ({
          ...prev,
          [name]: "Remarks cannot exceed 500 characters"
        }));
        return;
      }
      setRemarksCharCount(value.length);
    }

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target?.files || e.dataTransfer?.files || []);
    if (!files.length) return;

    const maxFiles = 4;
    const totalFiles = srnAttachments.length + files.length;

    // Check if adding these files exceeds the limit
    if (totalFiles > maxFiles) {
      setErrors(prev => ({ ...prev, attachment: `Maximum ${maxFiles} attachments allowed.` }));
      if (e.target) e.target.value = null;
      return;
    }

    // Validate each file
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

    let error = "";
    const validFiles = [];

    for (const file of files) {
      if (file.size > maxSize) {
        error = `File "${file.name}" exceeds 10MB limit.`;
        break;
      }
      if (!allowedTypes.includes(file.type)) {
        error = `Unsupported file type for "${file.name}". Upload PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, GIF, or TXT.`;
        break;
      }
      validFiles.push(file);
    }

    if (error) {
      setErrors(prev => ({ ...prev, attachment: error }));
      if (e.target) e.target.value = null;
      return;
    }

    // Add valid files to state
    setSrnAttachments(prev => [...prev, ...validFiles]);
    setErrors(prev => ({ ...prev, attachment: "" }));
    if (e.target) e.target.value = null; // Reset file input
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

  const removeAttachment = async (index) => {
    const attachmentToRemove = srnAttachments[index];

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
  setSrnAttachments((prev) => prev.filter((_, i) => i !== index));
};

  const removeAllAttachments = async () => {
    // Delete all existing attachments from server
    const existingAttachments = srnAttachments.filter(att => att.id);
    const token = sessionStorage.getItem("token");
    
    for (const attachment of existingAttachments) {
      try {
        await fetch(`${import.meta.env.VITE_API_URL}/api/po-attachments/${attachment.id}`, {
          method: "DELETE",
          headers: {
            Authorization: token,
          },
        });
        console.log(`Attachment with ID: ${attachment.id} deleted successfully`);
      } catch (error) {
        console.error(`Error deleting attachment with ID: ${attachment.id}`, error);
      }
    }

    // Clear all attachments from state
    setSrnAttachments([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validateBasicForm = () => {
    const newErrors = {};

    // Required fields validation based on the table structure
    if (!formData.poNumber?.trim()) {
      newErrors.poNumber = "PO Number is required";
    }

    if (!formData.srnName?.trim()) {
      newErrors.srnName = "Payment Name is required";
    }

    if (!formData.srnAmount || formData.srnAmount <= 0) {
      newErrors.srnAmount = "Valid Payment amount is required";
    }

    if (!formData.srnType?.trim()) {
      newErrors.srnType = "Payment Type is required";
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

    console.log('=== Edit SRN Submit Started ===');
    console.log('Form Data:', formData);
    console.log('SRN ID:', srnId);

    // Validate basic form fields
    if (!validateBasicForm()) {
      console.log('Validation failed');
      return;
    }

    setLoading(true);

    try {
      const token = sessionStorage.getItem('token');
      if (!token) {
        throw new Error("Missing authentication credentials");
      }

      // Prepare the update data - matching the format used in AddSRNModal
      const updateData = {
        poId: parseInt(poId),
        msId: formData.msId ? parseInt(formData.msId) : null,
        srnName: formData.srnName.trim(),
        srnDsc: formData.srnDsc.trim() || '',
        srnAmount: parseInt(formData.srnAmount) || 0,
        srnCurrency: formData.srnCurrency,
        srnType: formData.srnType,
        srnRemarks: formData.srnRemarks.trim() || '',
        srnDate: formData.srnDate || null  // Send null instead of empty string
      };

      console.log('Update Data:', JSON.stringify(updateData, null, 2));
      console.log('Submitting to:', `${import.meta.env.VITE_API_URL}/api/srn/edit/${srnId}`);

      // Submit SRN data
      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/api/srn/edit/${srnId}`,
        updateData,
        {
          headers: {
            Authorization: `${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ SRN updated successfully:', response.data);

      // Upload attachments - use srnId directly instead of response.data.srnId
      const newFiles = srnAttachments.filter(file => file instanceof File);
      if (newFiles.length > 0) {
        console.log(`Uploading ${newFiles.length} new attachment(s)...`);
        for (const file of newFiles) {
          const fileData = new FormData();
          fileData.append("file", file);
          fileData.append("level", "SRN");
          fileData.append("referenceId", srnId); // Use the existing srnId
          fileData.append("referenceNumber", formData.srnName || "");

          try {
            const uploadRes = await fetch(`${import.meta.env.VITE_API_URL}/api/po-attachments/upload`, {
              method: "POST",
              headers: {
                Authorization: `${token}`
              },
              body: fileData
            });

            if (uploadRes.ok) {
              console.log(`✅ Attachment uploaded successfully: ${file.name}`);
            } else {
              console.error(`❌ Attachment upload failed for ${file.name}:`, uploadRes.status);
            }
          } catch (uploadError) {
            console.error(`❌ Attachment upload error for ${file.name}:`, uploadError);
          }
        }
      }

      console.log('Calling onSubmit callback with response data');
      onSubmit(response.data);
      
      // Show success snackbar
      setSnackbar({
        open: true,
        message: 'SRN updated successfully!',
        severity: 'success'
      });
      
      // Close modal after a short delay to show the success message
      setTimeout(() => {
        console.log('Closing modal');
        handleClose();
      }, 1500);
      
    } catch (error) {
      console.error("❌ Error updating SRN:", error);
      console.error("Error response data:", error.response?.data);
      console.error("Error details:", error.response?.data || error.message);
      
      // Display the actual error message from the server
      const errorMessage = typeof error.response?.data === 'string' 
        ? error.response.data 
        : error.response?.data?.message || error.message || "Failed to update SRN";
      
      setErrors({ submit: errorMessage });
      
      // Show error in snackbar
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: "error"
      });
    } finally {
      setLoading(false);
      console.log('=== Edit SRN Submit Ended ===');
    }
  };

  const handleClose = () => {
    setFormData({
      poNumber: "",
      msId: "",
      srnName: "",
      srnDsc: "",
      srnAmount: "",
      srnCurrency: "USD",
      srnType: "",
      srnRemarks: "",
      srnDate: "",
    });
    setSrnAttachments([]);
    setErrors({});
    setNameCharCount(0);
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
                <h2 className="text-base sm:text-lg lg:text-xl font-bold">Edit Payment</h2>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-green-700 rounded-full transition-colors cursor-pointer"
              disabled={loading || initialLoading}
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Loading overlay for initial data fetch */}
        {initialLoading && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
              <span className="text-green-700 font-medium">Loading Payment data...</span>
            </div>
          </div>
        )}

        <div className="p-4 sm:p-6 overflow-y-auto flex-grow">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Display */}
            {errors.submit && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3 flex items-center">
                <AlertCircle size={18} className="text-red-500 mr-2" />
                <TruncatedText text={errors.submit} maxLength={100} className="text-red-700 text-sm" />
              </div>
            )}

            {/* Row 1: PO Number, Milestone Name, Currency, and SRN Amount */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 items-end">
              <div className="lg:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  PO Number *
                </label>
                <input
                  type="text"
                  value={formData.poNumber}
                  className="w-full h-10 px-4 border rounded-md bg-gray-100 text-gray-500 cursor-not-allowed"
                  disabled
                  readOnly
                />
                {errors.poNumber && (
                  <p className="mt-1 text-sm text-red-600">
                    <TruncatedText text={errors.poNumber} maxLength={50} />
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Name *
                  <span className="float-right text-sm text-gray-500">
                    {nameCharCount}/100 characters
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
                    disabled={loading || initialLoading}
                    title={formData.srnName}
                  />
                </div>
                {errors.srnName && (
                  <p className="mt-1 text-sm text-red-600">{errors.srnName}</p>
                )}
              </div>


              <div className="lg:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Milestone Name
                </label>

                <input
                  type="text"
                  value={milestoneList.find(ms => ms.msId === formData.msId)?.msName || ""}
                  className="w-full h-10 px-4 border rounded-md bg-gray-100 text-gray-500 cursor-not-allowed"
                  disabled
                  readOnly
                />
              </div>

              <div className="lg:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Type *</label>
                <select
                  name="srnType"
                  value={formData.srnType}
                  onChange={handleInputChange}
                  className={`w-full h-10 px-4 border rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 ${errors.srnType ? 'border-red-500' : 'border-gray-300'
                    }`}
                  disabled={loading || initialLoading}
                >
                  <option value="">Select from list</option>
                  <option value="partial">Partial</option>
                  <option value="full">Full</option>
                </select>
                {errors.srnType && (
                  <p className="mt-1 text-sm text-red-600">{errors.srnType}</p>
                )}
              </div>
            </div>


            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <div className="lg:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
                <input type="text" value={formData.srnCurrency} readOnly className="w-full h-10 px-4 border border-gray-300 rounded-md bg-gray-100" />
              </div>


              <div className="lg:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SRN Amount *
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
                    className={`w-full h-10 pl-8 pr-4 border rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 ${errors.srnAmount ? 'border-red-500' : 'border-gray-300'
                      }`}
                    placeholder="Enter here"
                    disabled={loading || initialLoading}
                    title={formData.srnAmount}
                  />
                </div>

                <p className="mt-1 text-xs text-gray-500">
                  {formData.msId ? `Milestone Balance: ${milestoneBalance}` : `PO Balance: ${poBalance ?? 'Loading...'}`} {formData.srnCurrency}
                </p>

                {errors.srnAmount && (
                  <p className="mt-1 text-sm text-red-600">{errors.srnAmount}</p>
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
                    onFocus={e => e.target.showPicker && e.target.showPicker()}
                    value={formData.srnDate}
                    onChange={handleInputChange}
                    className="w-full bg-transparent outline-none cursor-pointer appearance-none"
                    disabled={loading || initialLoading}
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
                className={`w-full px-4 py-3 border rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none ${errors.srnDsc ? 'border-red-500' : 'border-gray-300'
                  }`}
                placeholder="Enter here"
                disabled={loading || initialLoading}
                title={formData.srnDsc ? `SRN Description (${descCharCount}/500 chars): ${formData.srnDsc}` : "Enter detailed SRN description (optional)"}
              />
              {errors.srnDsc && (
                <p className="mt-1 text-sm text-red-600">{errors.srnDsc}</p>
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
                className={`w-full px-4 py-3 border rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none ${remarksCharCount > 500 ? 'border-red-500' : 'border-gray-300'
                  }`}
                placeholder="Enter here"
                disabled={loading || initialLoading}
                title={formData.srnRemarks ? `Remarks (${remarksCharCount}/500 chars): ${formData.srnRemarks}` : "Enter additional remarks (optional)"}
              />
              {errors.srnRemarks && (
                <p className="mt-1 text-sm text-red-600">{errors.srnRemarks}</p>
              )}
            </div>
            <div className="grid grid-cols-1 gap-4">

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
                    name="srnAttachment"
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={loading || initialLoading}
                    multiple
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.txt"
                  />
                </div>

                {errors.attachment && (
                  <p className="mt-2 text-xs text-red-600 flex items-center">
                    <AlertCircle size={12} className="mr-1" />
                    {errors.attachment}
                  </p>
                )}

                {/* Selected Files List */}
                {srnAttachments.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-gray-700">
                        Selected Files ({srnAttachments.length}/4)
                      </span>
                      {srnAttachments.length > 0 && (
                        <button
                          type="button"
                          onClick={removeAllAttachments}
                          className="text-xs text-red-600 hover:text-red-800 font-medium"
                          disabled={loading || initialLoading}
                        >
                          Remove All
                        </button>
                      )}
                    </div>
                    <div className="space-y-2">
                      {srnAttachments.map((file, index) => {
                        const isExisting = file.id; // Existing files have an id
                        const fileName = file.fileName || file.name;
                        const fileSize = file.size || file.fileSize || file.fileSizeInBytes || 0;
                        
                        return (
                          <div
                            key={index}
                            className="flex items-center justify-between p-2 bg-white border border-gray-200 rounded-md hover:border-green-300 transition-colors"
                          >
                            <div className="flex items-center space-x-2 flex-1 min-w-0">
                              <FileIcon 
                                size={16} 
                                className={isExisting ? "text-blue-600" : "text-green-600"} 
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="text-xs font-medium text-gray-700 truncate" title={fileName}>
                                    {fileName}
                                  </p>
                                  {isExisting && (
                                    <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">
                                      Existing
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-gray-500">
                                  {formatFileSize(fileSize)}
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeAttachment(index)}
                              className="ml-2 p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors flex-shrink-0"
                              disabled={loading || initialLoading}
                              title="Remove file"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </form>
        </div>

        <div className="flex flex-col sm:flex-row sm:justify-end gap-3 pt-4 px-4 sm:px-6 pb-4 sm:pb-6 border-t border-gray-200 bg-gray-50">
          <button
            type="button"
            onClick={handleClose}
            className="px-6 py-2 border border-green-700 text-green-700 rounded-md hover:bg-green-50 transition-colors"
            disabled={loading || initialLoading}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || initialLoading}
            className="px-6 py-2 bg-green-700 text-white rounded-md hover:bg-green-800 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Updating...
              </>
            ) : (
              <>
                <Receipt size={16} className="mr-2" />
                Update Payment
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

export default EditSRNModal;