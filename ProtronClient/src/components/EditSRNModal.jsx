// EditSRNModal.js
import { useState, useEffect } from "react";
import { X, Receipt, DollarSign, FileText, AlertCircle, Activity, Paperclip } from "lucide-react";
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
    existingAttachment: null
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [poList, setPOList] = useState([]);
  const [milestoneList, setMilestoneList] = useState([]);
  const [descCharCount, setDescCharCount] = useState(0);
  const [remarksCharCount, setRemarksCharCount] = useState(0);
  const [nameCharCount, setNameCharCount] = useState(0);
  const [initialLoading, setInitialLoading] = useState(false);

  // Truncate text utility function
  const truncateText = (text, maxLength = 50) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  // Truncate component with hover tooltip
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
            existingAttachment: srn.attachments && srn.attachments.length > 0 ? srn.attachments[0] : null
          });

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

      console.log('Updating SRN data:', updateData);

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

      onSubmit(response.data);
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <Receipt size={20} className="mr-2 text-green-600" />
            Edit SRN
          </h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            disabled={loading || initialLoading}
          >
            <X size={20} className="text-gray-400" />
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Error Display */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 flex items-center">
              <AlertCircle size={18} className="text-red-500 mr-2" />
              <TruncatedText text={errors.submit} maxLength={100} className="text-red-700 text-sm" />
            </div>
          )}

          <div className="space-y-4">
            {/* Row 1: PO Number, Milestone Name, Currency, and SRN Amount */}
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-3">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  <FileText size={14} className="inline mr-1" />
                  PO Number *
                </label>
                <select
                  name="poNumber"
                  value={formData.poNumber}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 ${
                    errors.poNumber ? 'border-red-500' : 'border-gray-300'
                  }`}
                  disabled={loading || initialLoading}
                  title={formData.poNumber}
                >
                  <option value="">Select PO</option>
                  {poList.map(po => (
                    <TruncatedOption 
                      key={po.poId} 
                      value={po.poNumber} 
                      text={po.poNumber}
                      maxLength={25}
                    />
                  ))}
                </select>
                {errors.poNumber && (
                  <p className="mt-1 text-xs text-red-600">
                    <TruncatedText text={errors.poNumber} maxLength={50} />
                  </p>
                )}
              </div>

              <div className="col-span-3">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  <Activity size={14} className="inline mr-1" />
                  Milestone Name (Optional)
                </label>
                <select
                  name="msId"
                  value={formData.msId}
                  onChange={handleInputChange}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                  disabled={loading || initialLoading}
                  title={formData.msName}
                >
                  <option value="">No specific milestone</option>
                  {milestoneList.map(milestone => (
                    <TruncatedOption 
                      key={milestone.msId} 
                      value={milestone.msId} 
                      text={milestone.msName}
                      maxLength={25}
                    />
                  ))}
                </select>
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
                  SRN Amount *
                </label>
                <input
                  type="number"
                  name="srnAmount"
                  value={formData.srnAmount}
                  onChange={handleInputChange}
                  step="1"
                  min="0"
                  className={`w-full px-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 ${
                    errors.srnAmount ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="0"
                  disabled={loading || initialLoading}
                  title={formData.srnAmount}
                />
                {errors.srnAmount && (
                  <div className="mt-1">
                    <p className="text-xs text-red-600 leading-relaxed">{errors.srnAmount}</p>
                  </div>
                )}
              </div>

              <div className="col-span-2"></div>
            </div>

            {/* Row 2: SRN Type, SRN Name, and Attachment */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  <Receipt size={14} className="inline mr-1" />
                  SRN Type *
                </label>
                <select
                  name="srnType"
                  value={formData.srnType}
                  onChange={handleInputChange}
                  className={`w-full px-2 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 ${
                    errors.srnType ? 'border-red-500' : 'border-gray-300'
                  }`}
                  disabled={loading || initialLoading}
                >
                  <option value="">Select SRN Type</option>
                  <option value="partial">Partial</option>
                  <option value="full">Full</option>
                </select>
                {errors.srnType && (
                  <p className="mt-1 text-xs text-red-600">{errors.srnType}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  <FileText size={14} className="inline mr-1" />
                  SRN Name *
                  <span className="float-right text-xs text-gray-500">
                    {nameCharCount}/100 characters
                  </span>
                </label>
                <input
                  type="text"
                  name="srnName"
                  value={formData.srnName}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 ${
                    errors.srnName ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter SRN name"
                  disabled={loading || initialLoading}
                  title={formData.srnName}
                />
                {errors.srnName && (
                  <p className="mt-1 text-xs text-red-600">{errors.srnName}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  <Paperclip size={14} className="inline mr-1" />
                  Attachment
                </label>
                <input
                  type="file"
                  name="attachment"
                  onChange={handleFileChange}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100"
                  disabled={loading || initialLoading}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.txt"
                  title="Upload document or image file (max 10MB)"
                />
                {/* Show existing attachment */}
                {formData.existingAttachment && !formData.attachment && (
                  <p className="mt-1 text-xs text-blue-600" title={`Current attachment: ${formData.existingAttachment}`}>
                    Current: {formData.existingAttachment.length > 25 ? `${formData.existingAttachment.substring(0, 25)}...` : formData.existingAttachment}
                  </p>
                )}
                {/* Show new attachment */}
                {formData.attachment && (
                  <p className="mt-1 text-xs text-green-600" title={`New file: ${formData.attachment.name} (${(formData.attachment.size / 1024 / 1024).toFixed(2)} MB)`}>
                    New: {formData.attachment.name.length > 25 ? `${formData.attachment.name.substring(0, 25)}...` : formData.attachment.name} 
                    ({(formData.attachment.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
                {errors.attachment && (
                  <p className="mt-1 text-xs text-red-600" title={`Error: ${errors.attachment}`}>
                    {errors.attachment.length > 50 ? `${errors.attachment.substring(0, 50)}...` : errors.attachment}
                  </p>
                )}
              </div>
            </div>

            {/* Row 3: SRN Description */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                <FileText size={14} className="inline mr-1" />
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
                className={`w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 resize-none ${
                  errors.srnDsc ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter detailed SRN description including scope, deliverables, and requirements... (Max 500 characters)"
                disabled={loading || initialLoading}
                title={formData.srnDsc ? `SRN Description (${descCharCount}/500 chars): ${formData.srnDsc}` : "Enter detailed SRN description (optional)"}
              />
              {errors.srnDsc && (
                <p className="mt-1 text-xs text-red-600">{errors.srnDsc}</p>
              )}
            </div>

            {/* Row 4: SRN Remarks */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                <FileText size={14} className="inline mr-1" />
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
                className={`w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 resize-none ${
                  remarksCharCount > 500 ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter additional remarks, notes, special instructions, dependencies, or any other relevant information... (Max 500 characters)"
                disabled={loading || initialLoading}
                title={formData.srnRemarks ? `Remarks (${remarksCharCount}/500 chars): ${formData.srnRemarks}` : "Enter additional remarks (optional)"}
              />
              {errors.srnRemarks && (
                <p className="mt-1 text-xs text-red-600">{errors.srnRemarks}</p>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-3 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-1.5 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              disabled={loading || initialLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || initialLoading}
              className="px-4 py-1.5 text-sm bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                  Updating...
                </>
              ) : (
                <>
                  <Receipt size={14} className="mr-2" />
                  Update SRN
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditSRNModal;