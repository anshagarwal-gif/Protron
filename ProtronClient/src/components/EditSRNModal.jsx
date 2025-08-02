// EditSRNModal.js
import { useState, useEffect } from "react";
import { X, Receipt, DollarSign, FileText, AlertCircle, Activity, Paperclip, Calendar, Upload } from "lucide-react";
import axios from "axios";

const EditSRNModal = ({ open, onClose, onSubmit, srnId }) => {
  const [formData, setFormData] = useState({
    poNumber: "",
    msId: "",
    srnName: "",
    srnDsc: "",
    srnAmount: "",
    srnCurrency: "USD",
    srnType: "",
    srnRemarks: "",
    attachment: null,
    existingAttachment: null,
  });
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

  useEffect(() => {
    const fetchSRNData = async () => {
      if (open && srnId) {
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
          console.log('SRN response:', srn);
          setFormData({
            poNumber: srn.poNumber || "",
            msId: srn.milestone?.msId || "",
            srnName: srn.srnName || "",
            srnDsc: srn.srnDsc || "",
            srnAmount: srn.srnAmount?.toString() || "",
            srnCurrency: srn.srnCurrency || "USD",
            srnType: srn.srnType,
            srnRemarks: srn.srnRemarks || "",
            attachment: null,
            existingAttachment: srn.attachments && srn.attachments.length > 0 ? srn.attachments[0] : null,
          });
          setPoId(srn.poDetail.poId || "");
          console.log('Fetched SRN data:', srn);
          console.log('SRN Type from response:', srn.srnType);

        } catch (error) {
          console.error("Error fetching SRN data:", error);
          setErrors({ submit: "Failed to load SRN data" });
        } finally {
          setInitialLoading(false);
        }
      }
    };

    fetchSRNData();
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
          [name]: "SRN name cannot exceed 100 characters"
        }));
        return;
      }
      setNameCharCount(value.length);
    } else if (name === 'srnDsc') {
      if (value.length > 500) {
        setErrors(prev => ({
          ...prev,
          [name]: "SRN description cannot exceed 500 characters"
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
    const file = e.target.files[0];
    if (file) {
      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB in bytes
      if (file.size > maxSize) {
        setErrors(prev => ({
          ...prev,
          attachment: "File size must be less than 10MB"
        }));
        return;
      }

      // Validate file type (common document and image types)
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
          attachment: "File type not supported. Please upload PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, GIF, or TXT files."
        }));
        return;
      }

      setFormData(prev => ({
        ...prev,
        attachment: file
      }));

      // Clear error if file is valid
      if (errors.attachment) {
        setErrors(prev => ({
          ...prev,
          attachment: ""
        }));
      }
    }
  };

  const validateBasicForm = () => {
    const newErrors = {};

    // Required fields validation based on the table structure
    if (!formData.poNumber?.trim()) {
      newErrors.poNumber = "PO Number is required";
    }

    if (!formData.srnName?.trim()) {
      newErrors.srnName = "SRN Name is required";
    }

    if (!formData.srnAmount || formData.srnAmount <= 0) {
      newErrors.srnAmount = "Valid SRN amount is required";
    }

    if (!formData.srnType?.trim()) {
      newErrors.srnType = "SRN Type is required";
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

    // First validate basic form fields
    if (!validateBasicForm()) {
      return;
    }

    setLoading(true);

    try {
      const token = sessionStorage.getItem('token');
      if (!token) {
        throw new Error("Missing authentication credentials");
      }

      // Prepare the update data according to SRNDTO structure
      const updateData = {
        poNumber: formData.poNumber,
        msId: formData.msId || null,
        srnName: formData.srnName,
        srnDsc: formData.srnDsc || '',
        srnAmount: parseInt(formData.srnAmount) || 0,
        srnCurrency: formData.srnCurrency,
        srnType: formData.srnType,
        srnRemarks: formData.srnRemarks || ''
      };
      onSubmit(updateData);
      handleClose();
    } catch (error) {
      console.error("Error updating SRN:", error);

      // Enhanced error message handling
      let errorMessage = "Failed to update SRN";

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data) {
        if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      setErrors({
        submit: errorMessage
      });
    } finally {
      setLoading(false);
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
      attachment: null,
      existingAttachment: null
    });
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-[90vw] w-full mx-4 max-h-[95vh] overflow-hidden flex flex-col">
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-green-900 flex items-center">
            <Receipt size={20} className="mr-2 text-green-600" />
            Edit SRN
          </h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
            disabled={loading || initialLoading}
          >
            <X size={20} />
          </button>
        </div>

        {/* Loading overlay for initial data fetch */}
        {initialLoading && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
              <span className="text-green-700 font-medium">Loading SRN data...</span>
            </div>
          </div>
        )}

        <div className="p-6 overflow-y-auto flex-grow">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Display */}
            {errors.submit && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3 flex items-center">
                <AlertCircle size={18} className="text-red-500 mr-2" />
                <TruncatedText text={errors.submit} maxLength={100} className="text-red-700 text-sm" />
              </div>
            )}

            {/* Row 1: PO Number, Milestone Name, Currency, and SRN Amount */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-15 items-end">
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
                  SRN Name *
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
                <label className="block text-sm font-medium text-gray-700 mb-2">SRN Type *</label>
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


            <div className="grid grid-cols-5 gap-15">
              <div className="lg:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
                <input type="text" value={formData.srnCurrency} readOnly className="w-full h-10 px-4 border border-gray-300 rounded-md bg-gray-100" />
              </div>


              <div className="lg:col-span-1">
                <div className="flex gap-2 items-center justify-between">
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
                    disabled={loading || initialLoading}
                    title={formData.srnAmount}
                  />
                </div>

                {errors.srnAmount && (
                  <p className="mt-1 text-sm text-red-600">{errors.srnAmount}</p>
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
                  disabled={loading || initialLoading}
                />
              </div>
            </div>
            </div>
            





            {/* Row 2: SRN Name and Attachment */}
            <div className="grid grid-cols-6  gap-4">

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">SRN Attachment</label>
                <div className="relative">
                  <input
                    type="file"
                    id="srn-attachment-input-edit"
                    name="attachment"
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={loading || initialLoading}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.txt"
                  />
                  <label
                    htmlFor="srn-attachment-input-edit"
                    className="w-full h-10 pl-10 pr-4 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 flex items-center cursor-pointer"
                  >
                    <Upload className="absolute left-3 top-1/2 -translate-y-1/2 text-green-600" size={20} />
                    <span className="text-gray-500 truncate">
                      {formData.attachment ? formData.attachment.name :
                        formData.existingAttachment ? formData.existingAttachment : 'Click to select files'}
                    </span>
                  </label>
                </div>
                {/* Show existing attachment */}
                {formData.existingAttachment && !formData.attachment && (
                  <p className="mt-1 text-sm text-blue-600" title={`Current attachment: ${formData.existingAttachment}`}>
                    Current: {formData.existingAttachment.length > 25 ? `${formData.existingAttachment.substring(0, 25)}...` : formData.existingAttachment}
                  </p>
                )}
                {/* Show new attachment */}
                {formData.attachment && (
                  <p className="mt-1 text-sm text-green-600" title={`New file: ${formData.attachment.name} (${(formData.attachment.size / 1024 / 1024).toFixed(2)} MB)`}>
                    New: {formData.attachment.name.length > 25 ? `${formData.attachment.name.substring(0, 25)}...` : formData.attachment.name}
                    ({(formData.attachment.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
                {errors.attachment && (
                  <p className="mt-1 text-sm text-red-600" title={`Error: ${errors.attachment}`}>
                    {errors.attachment}
                  </p>
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
                disabled={loading || initialLoading}
                title={formData.srnRemarks ? `Remarks (${remarksCharCount}/500 chars): ${formData.srnRemarks}` : "Enter additional remarks (optional)"}
              />
              {errors.srnRemarks && (
                <p className="mt-1 text-sm text-red-600">{errors.srnRemarks}</p>
              )}
            </div>
          </form>
        </div>

        <div className="flex justify-end gap-3 pt-4 px-6 pb-6 border-t border-gray-200 bg-gray-50">
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
                Update SRN
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditSRNModal;