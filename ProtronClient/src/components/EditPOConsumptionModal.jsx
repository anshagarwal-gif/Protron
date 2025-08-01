// EditPOConsumptionModal.js
import { useState, useEffect } from "react";
import { X, Activity, DollarSign, Calendar, FileText, AlertCircle, Building, Paperclip } from "lucide-react";
import axios from "axios";

const EditPOConsumptionModal = ({ open, onClose, onSubmit, consumptionId }) => {
  const [formData, setFormData] = useState({
    poNumber: "",
    msId: "",
    amount: "",
    currency: "USD",
    utilizationType: "Fixed",
    resourceOrProject: "",
    workDesc: "",
    workAssignDate: "",
    workCompletionDate: "",
    attachment: null,
    existingAttachment: null,
    remarks: "",
    systemName: ""
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [poList, setPOList] = useState([]);
  const [milestoneList, setMilestoneList] = useState([]);
  const [projectList, setProjectList] = useState([]);
  const [descCharCount, setDescCharCount] = useState(0);
  const [remarksCharCount, setRemarksCharCount] = useState(0);
  const [initialLoading, setInitialLoading] = useState(false);

  // Fetch existing consumption data when modal opens
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
        {/* Tooltip */}
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
    const fetchConsumptionData = async () => {
      if (open && consumptionId) {
        setInitialLoading(true);
        try {
          const token = sessionStorage.getItem('token');
          
          // Fetch consumption details
          const consumptionResponse = await axios.get(
            `${import.meta.env.VITE_API_URL}/api/po-consumption/${consumptionId}`,
            {
              headers: { Authorization: `${token}` }
            }
          );

          const consumption = consumptionResponse.data;
          
          // Format dates for input fields
          const formatDate = (dateString) => {
            if (!dateString) return '';
            const date = new Date(dateString);
            return date.toISOString().split('T')[0];
          };

          setFormData({
            poNumber: consumption.poNumber || "",
            msId: consumption.msId || "",
            amount: consumption.amount?.toString() || "",
            currency: consumption.currency || "USD",
            utilizationType: consumption.utilizationType || "Fixed",
            resourceOrProject: consumption.resourceOrProject || "",
            workDesc: consumption.workDesc || "",
            workAssignDate: formatDate(consumption.workAssignDate),
            workCompletionDate: formatDate(consumption.workCompletionDate),
            attachment: null,
            existingAttachment: consumption.attachment || null,
            remarks: consumption.remarks || "",
            systemName: consumption.systemName || ""
          });

        } catch (error) {
          console.error("Error fetching consumption data:", error);
          setErrors({ submit: "Failed to load consumption data" });
        } finally {
          setInitialLoading(false);
        }
      }
    };

    fetchConsumptionData();
  }, [open, consumptionId]);

  // Fetch PO list and projects when modal opens
  useEffect(() => {
    const fetchPOListAndProjects = async () => {
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

          // Fetch projects list
          const projectResponse = await axios.get(
            `${import.meta.env.VITE_API_URL}/api/projects`,
            {
              headers: { Authorization: `${token}` }
            }
          );
          setProjectList(projectResponse.data);
          
        } catch (error) {
          console.error("Error fetching PO list and projects:", error);
        }
      }
    };

    fetchPOListAndProjects();
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
                `${import.meta.env.VITE_API_URL}/api/po-milestone/getMilestoneForPo/${selectedPO.poId}`,
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
            if (!formData.currency || formData.currency === 'USD') {
              setFormData(prev => ({
                ...prev,
                currency: selectedPO.poCurrency || "USD"
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
    setDescCharCount(formData.workDesc.length);
    setRemarksCharCount(formData.remarks.length);
  }, [formData.workDesc, formData.remarks]);

  useEffect(() => {
    if (open) {
      setErrors({});
    }
  }, [open]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Check character limit for description and remarks
    if (name === 'workDesc') {
      if (value.length > 500) {
        setErrors(prev => ({
          ...prev,
          [name]: "Work description cannot exceed 500 characters"
        }));
        return;
      }
      setDescCharCount(value.length);
    } else if (name === 'remarks') {
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

  // Function to handle date input clicks
  const handleDateInputClick = (inputName) => {
    const dateInput = document.getElementsByName(inputName)[0];
    if (dateInput) {
      dateInput.showPicker();
    }
  };

  const checkBalance = async () => {
    if (!formData.poNumber || !formData.amount || formData.amount <= 0) {
      return true;
    }

    try {
      const token = sessionStorage.getItem('token');
      let balanceEndpoint = '';
      let balanceType = '';

      if (formData.msId && formData.msId.trim()) {
        balanceEndpoint = `${import.meta.env.VITE_API_URL}/api/po-consumption/balance/${formData.poNumber}?msId=${encodeURIComponent(formData.msId)}`;
        balanceType = `Milestone "${formData.msId}"`;
      } else {
        balanceEndpoint = `${import.meta.env.VITE_API_URL}/api/po-consumption/balance/${formData.poNumber}`;
        balanceType = `PO "${formData.poNumber}"`;
      }

      const balanceResponse = await axios.get(balanceEndpoint, {
        headers: { Authorization: `${token}` }
      });

      const availableBalance = balanceResponse.data.remainingBalance;
      const requestedAmount = parseFloat(formData.amount);

      if (requestedAmount > availableBalance) {
        const currencySymbol = getCurrencySymbol(formData.currency);
        const errorMessage = `Amount exceeds available balance. ${balanceType} has ${currencySymbol}${availableBalance.toLocaleString()} remaining, but you're trying to consume ${currencySymbol}${requestedAmount.toLocaleString()}.`;
        
        setErrors(prev => ({
          ...prev,
          amount: errorMessage
        }));
        return false;
      }

      return true;
    } catch (balanceError) {
      console.error("Error checking balance:", balanceError);
      setErrors(prev => ({
        ...prev,
        amount: "Unable to verify balance. Please check the amount manually."
      }));
      return false;
    }
  };

  const validateBasicForm = () => {
    const newErrors = {};

    // Only validate required fields: PO Number, Amount, and Type
    if (!formData.poNumber?.trim()) {
      newErrors.poNumber = "PO Number is required";
    }

    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = "Valid amount is required";
    }

    if (!formData.utilizationType?.trim()) {
      newErrors.utilizationType = "Utilization type is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Helper function to get currency symbol
  const getCurrencySymbol = (currencyCode) => {
    const currencySymbols = {
      'USD': '$',
      'EUR': '€',
      'GBP': '£',
      'JPY': '¥',
      'INR': '₹',
      'CAD': 'C$',
      'AUD': 'A$',
      'CHF': 'CHF',
      'CNY': '¥',
      'SEK': 'kr',
      'NOK': 'kr',
      'MXN': '$',
      'NZD': 'NZ$',
      'SGD': 'S$',
      'HKD': 'HK$',
      'ZAR': 'R',
      'BRL': 'R$',
      'RUB': '₽',
      'KRW': '₩',
      'TRY': '₺',
      'PLN': 'zł',
      'THB': '฿',
      'IDR': 'Rp',
      'MYR': 'RM',
      'PHP': '₱',
      'CZK': 'Kč',
      'HUF': 'Ft',
      'ILS': '₪',
      'CLP': '$',
      'PEN': 'S/',
      'COP': '$',
      'ARS': '$',
      'EGP': 'E£',
      'SAR': 'SR',
      'AED': 'د.إ',
      'QAR': 'QR',
      'KWD': 'KD',
      'BHD': 'BD',
      'OMR': 'OMR',
      'JOD': 'JD',
      'LBP': 'L£',
      'PKR': 'Rs',
      'BDT': '৳',
      'LKR': 'Rs',
      'NPR': 'Rs',
      'MMK': 'K',
      'VND': '₫',
      'KHR': '៛',
      'LAK': '₭',
      'TWD': 'NT$',
      'MOP': 'MOP$',
      'BND': 'B$',
      'FJD': 'FJ$',
      'PGK': 'K',
      'TOP': 'T$',
      'SBD': 'SI$',
      'VUV': 'VT',
      'WST': 'WS$'
    };
    
    return currencySymbols[currencyCode] || currencyCode || '$';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // First validate basic form fields
    if (!validateBasicForm()) {
      return;
    }

    setLoading(true);
    
    try {
      // Check balance
      const balanceValid = await checkBalance();
      if (!balanceValid) {
        setLoading(false);
        return;
      }

      const token = sessionStorage.getItem('token');
      if (!token) {
        throw new Error("Missing authentication credentials");
      }

      // Create FormData for file upload
      const submitData = new FormData();
      submitData.append('poNumber', formData.poNumber);
      submitData.append('msId', formData.msId || '');
      submitData.append('amount', parseInt(formData.amount) || 0);
      submitData.append('currency', formData.currency);
      submitData.append('utilizationType', formData.utilizationType);
      submitData.append('resourceOrProject', formData.resourceOrProject || '');
      submitData.append('workDesc', formData.workDesc || '');
      submitData.append('workAssignDate', formData.workAssignDate || '');
      submitData.append('workCompletionDate', formData.workCompletionDate || '');
      submitData.append('remarks', formData.remarks || '');
      submitData.append('systemName', formData.systemName || '');

      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/api/po-consumption/update/${consumptionId}`,
        submitData,
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
      console.error("Error updating PO consumption:", error);
      
      // Enhanced error message handling
      let errorMessage = "Failed to update PO consumption";
      
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
      amount: "",
      currency: "USD",
      utilizationType: "Fixed",
      resourceOrProject: "",
      workDesc: "",
      workAssignDate: "",
      workCompletionDate: "",
      attachment: null,
      existingAttachment: null,
      remarks: "",
      systemName: ""
    });
    setErrors({});
    setDescCharCount(0);
    setRemarksCharCount(0);
    setPOList([]);
    setMilestoneList([]);
    setProjectList([]);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <Activity size={20} className="mr-2 text-green-600" />
            Edit PO Consumption
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
              <span className="text-green-700 font-medium">Loading consumption data...</span>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Error Display */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 flex items-center">
              <AlertCircle size={18} className="text-red-500 mr-2" />
              <span className="text-red-700 text-sm">{errors.submit}</span>
              <TruncatedText text={errors.submit} maxLength={100} />
            </div>
          )}

          <div className="space-y-4">
            {/* Row 1: PO Number, Milestone, Currency, and Amount */}
            <div className="grid grid-cols-5 gap-4">
              <div className="">
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
                  <p className="mt-1 text-xs text-red-600">{errors.poNumber}
                  <TruncatedText text={errors.poNumber} maxLength={50} />
                  </p>
                  
                )}
              </div>

              <div className="">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  <Activity size={14} className="inline mr-1" />
                  Milestone (Optional)
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
                <input type="text" value={formData.currency} readOnly className="w-full h-10 px-4 border border-gray-300 rounded-md bg-gray-100" />
              </div>

              <div className="">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  <DollarSign size={14} className="inline mr-1" />
                  Amount *
                </label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  step="1"
                  min="0"
                  className={`w-full px-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 ${
                    errors.amount ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="0"
                  disabled={loading || initialLoading}
                  title={formData.amount}
                />
                {errors.amount && (
                  <div className="mt-1">
                    <p className="text-xs text-red-600 leading-relaxed">{errors.amount}</p>
                  </div>
                )}
              </div>

              <div className="col-span-2"></div> {/* Spacer */}
            </div>

            {/* Row 2: Utilization Type, Resource/Project, System Name */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  <Activity size={14} className="inline mr-1" />
                  Type *
                </label>
                <select
                  name="utilizationType"
                  value={formData.utilizationType}
                  onChange={handleInputChange}
                  className={`w-full px-2 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 ${
                    errors.utilizationType ? 'border-red-500' : 'border-gray-300'
                  }`}
                  disabled={loading || initialLoading}
                >
                  <option value="Fixed">Fixed</option>
                  <option value="T&M">T&M</option>
                  <option value="Mixed">Mixed</option>
                </select>
                {errors.utilizationType && (
                  <p className="mt-1 text-xs text-red-600">{errors.utilizationType}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  <Building size={14} className="inline mr-1" />
                  Resource/Project
                </label>
                <select
                  name="resourceOrProject"
                  value={formData.resourceOrProject}
                  onChange={handleInputChange}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                  disabled={loading || initialLoading}
                  title={formData.resourceOrProject}
                >
                  <option value="">Select project</option>
                  {projectList.map((project, index) => (
                  <TruncatedOption 
                      key={project.projectId || index} 
                      value={project.projectName} 
                      text={project.projectName}
                      maxLength={25}
                    />
                  ))}
                </select>
                {projectList.length === 0 && (
                  <p className="mt-1 text-xs text-gray-500">Loading projects...</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  <Building size={14} className="inline mr-1" />
                  System Name
                </label>
                <input
                  type="text"
                  name="systemName"
                  value={formData.systemName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                  placeholder="Enter system name"
                  disabled={loading || initialLoading}
                  title={formData.systemName}
                />
              </div>
            </div>

            {/* Row 3: Work Assign Date, Work Completion Date, and Attachment */}
            <div className="grid grid-cols-12 gap-4">
              <div className="">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  <Calendar size={14} className="inline mr-1" />
                  Work Assign Date
                </label>
                <input
                  type="date"
                  name="workAssignDate"
                  value={formData.workAssignDate}
                  onChange={handleInputChange}
                  onClick={() => handleDateInputClick('workAssignDate')}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 cursor-pointer"
                  disabled={loading || initialLoading}
                  title={formData.workAssignDate ? `Work Assigned: ${new Date(formData.workAssignDate).toLocaleDateString()}` : "Click to select work assignment date (optional)"}
                />
              </div>

              <div className="">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  <Calendar size={14} className="inline mr-1" />
                  Work Completion Date
                </label>
                <input
                  type="date"
                  name="workCompletionDate"
                  value={formData.workCompletionDate}
                  onChange={handleInputChange}
                  onClick={() => handleDateInputClick('workCompletionDate')}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 cursor-pointer"
                  disabled={loading || initialLoading}
                  title={formData.workCompletionDate ? `Work Completed: ${new Date(formData.workCompletionDate).toLocaleDateString()}` : "Click to select work completion date (optional)"}
                />
              </div>

              <div className="">
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

              <div className=""></div> {/* Spacer */}
            </div>

            {/* Row 4: Work Description */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                <FileText size={14} className="inline mr-1" />
                Work Description
                <span className="float-right text-xs text-gray-500">
                  {descCharCount}/500 characters
                </span>
              </label>
              <textarea
                name="workDesc"
                value={formData.workDesc}
                onChange={handleInputChange}
                rows={4}
                className={`w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 resize-none ${
                  errors.workDesc ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter detailed work description including tasks, deliverables, scope, and requirements... (Max 500 characters)"
                disabled={loading || initialLoading}
                title={formData.workDesc ? `Work Description (${descCharCount}/500 chars): ${formData.workDesc}` : "Enter detailed work description (optional)"}
              />
              {errors.workDesc && (
                <p className="mt-1 text-xs text-red-600">{errors.workDesc}</p>
              )}
            </div>

            {/* Row 5: Remarks */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                <FileText size={14} className="inline mr-1" />
                Remarks
                <span className="float-right text-xs text-gray-500">
                  {remarksCharCount}/500 characters
                </span>
              </label>
              <textarea
                name="remarks"
                value={formData.remarks}
                onChange={handleInputChange}
                rows={3}
                className={`w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 resize-none ${
                  remarksCharCount > 500 ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter additional remarks, notes, special instructions, dependencies, or any other relevant information... (Max 500 characters)"
                disabled={loading || initialLoading}
                title={formData.remarks ? `Remarks (${remarksCharCount}/500 chars): ${formData.remarks}` : "Enter additional remarks (optional)"}
              />
              {errors.remarks && (
                <p className="mt-1 text-xs text-red-600">{errors.remarks}</p>
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
                  <Activity size={14} className="mr-2" />
                  Update Consumption
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPOConsumptionModal;