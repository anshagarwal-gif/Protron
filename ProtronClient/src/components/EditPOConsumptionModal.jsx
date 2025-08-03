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
    resource: "",
    project: "",
    workDesc: "",
    workAssignDate: "",
    workCompletionDate: "",
    remarks: "",
    systemName: ""
  });

  const [poConsumptionFiles, setPoConsumptionFiles] = useState([]); // State for attachments
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [poList, setPOList] = useState([]);
  const [milestoneList, setMilestoneList] = useState([]);
  const [projectList, setProjectList] = useState([]);
  const [descCharCount, setDescCharCount] = useState(0);
  const [remarksCharCount, setRemarksCharCount] = useState(0);
  const [initialLoading, setInitialLoading] = useState(false);
  const [poBalance, setPOBalance] = useState(null);
  const [milestoneBalance, setMilestoneBalance] = useState(null);
  const [users, setUsers] = useState([]);

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

  const fetchPOConsumptionAttachments = async (consumptionId) => {
    try {
      const token = sessionStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/po-attachments/meta/filter?level=CONSUMPTION&referenceId=${consumptionId}`, {
        headers: { Authorization: token }
      });

      if (res.ok) {
        const data = await res.json();
        setPoConsumptionFiles(data); // Update your file list state
      } else {
        console.error("Failed to fetch PO Consumption attachments");
      }
    } catch (err) {
      console.error("Error fetching PO Consumption attachments:", err);
    }
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
            msId: consumption.milestone?.msId || "",
            amount: consumption.amount?.toString() || "",
            currency: consumption.currency || "USD",
            utilizationType: consumption.utilizationType || "Fixed",
            resource: consumption.resource || "",
            project: consumption.project || "",
            workDesc: consumption.workDesc || "",
            workAssignDate: formatDate(consumption.workAssignDate),
            workCompletionDate: formatDate(consumption.workCompletionDate),
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
    fetchPOConsumptionAttachments(consumptionId);
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

    const fetchUsers = async () => {
      try {
        const token = sessionStorage.getItem('token');
        const tenantId = sessionStorage.getItem('tenantId');
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/tenants/${tenantId}/users`, {
          headers: { Authorization: `${token}` }
        });
        const data = await res.json();
        setUsers(data);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    fetchPOListAndProjects();
    fetchUsers();
  }, [open]);

  useEffect(() => {
    const fetchPOBalance = async (poId) => {
      if (poId) {
        try {
          const token = sessionStorage.getItem('token');
          const response = await axios.get(
            `${import.meta.env.VITE_API_URL}/api/po/pobalance-con/${poId}`,
            {
              headers: { Authorization: `${token}` }
            }
          );
          console.log('PO Balance response:', response.data);
          setPOBalance(response.data + (parseInt(formData.amount) || 0));
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
            `${import.meta.env.VITE_API_URL}/api/po-milestone/milestonebalance-consumption/${poId}/${msId}`,
            {
              headers: { Authorization: `${token}` }
            }
          );
          setMilestoneBalance(response.data + (parseInt(formData.amount) || 0));
        } catch (error) {
          console.error("Error fetching milestone balance:", error);
        }
      }
    };

    const poId = poList.find(po => po.poNumber === formData.poNumber)?.poId;

    fetchPOBalance(poId);
    if (poId && formData.msId) {
      fetchMilestone(poId, formData.msId);
    } else {
      setMilestoneBalance(null);
    }



  }, [formData.poNumber, formData.msId]);

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
    const files = Array.from(e.target.files);
    const maxFiles = 4;

    // Check if adding these files exceeds the limit
    if (poConsumptionFiles.length + files.length > maxFiles) {
      setErrors(prev => ({ ...prev, attachment: `Max ${maxFiles} attachments allowed.` }));
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

    const validFiles = files.filter(file => {
      if (file.size > maxSize) {
        setErrors(prev => ({ ...prev, attachment: `File ${file.name} must be under 10MB.` }));
        return false;
      }
      if (!allowedTypes.includes(file.type)) {
        setErrors(prev => ({ ...prev, attachment: `Unsupported file type for ${file.name}.` }));
        return false;
      }
      return true;
    });

    // Add valid files to state
    setPoConsumptionFiles(prev => [...prev, ...validFiles]);
    setErrors(prev => ({ ...prev, attachment: "" }));
    e.target.value = null; // Reset file input
  };

  const removePOConsumptionFile = (index) => {
    setPoConsumptionFiles(prev => prev.filter((_, i) => i !== index));
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
      let availableBalance = 0;
      if (formData.msId) {
        availableBalance = milestoneBalance;
      } else {
        availableBalance = poBalance;
      }

      const balanceResponse = await axios.get(balanceEndpoint, {
        headers: { Authorization: `${token}` }
      });

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

    // Validate basic form fields
    if (!validateBasicForm()) {
      return;
    }

    setLoading(true);

    try {
      const token = sessionStorage.getItem('token');
      if (!token) {
        throw new Error("Missing authentication credentials");
      }

      // Create FormData for form submission
      const submitData = new FormData();
      submitData.append('poNumber', formData.poNumber);
      submitData.append('msId', formData.msId || '');
      submitData.append('amount', parseInt(formData.amount) || 0);
      submitData.append('currency', formData.currency);
      submitData.append('utilizationType', formData.utilizationType);
      submitData.append('resource', formData.resource || '');
      submitData.append('project', formData.project || '');
      submitData.append('workDesc', formData.workDesc || '');
      submitData.append('workAssignDate', formData.workAssignDate || '');
      submitData.append('workCompletionDate', formData.workCompletionDate || '');
      submitData.append('remarks', formData.remarks || '');
      submitData.append('systemName', formData.systemName || '');

      // Submit form data
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

      // Upload attachments
      if (poConsumptionFiles.length > 0) {
        for (const file of poConsumptionFiles) {
          const fileData = new FormData();
          fileData.append("file", file);
          fileData.append("level", "CONSUMPTION");
          fileData.append("referenceId", consumptionId);

          const uploadRes = await fetch(`${import.meta.env.VITE_API_URL}/api/po-attachments/upload`, {
            method: "POST",
            headers: {
              Authorization: `${token}`
            },
            body: fileData
          });

          if (!uploadRes.ok) {
            console.error(`Attachment upload failed for ${file.name}`);
          }
        }
      }

      onSubmit(response.data);
      handleClose();
    } catch (error) {
      console.error("Error updating PO consumption:", error);
      setErrors({ submit: "Failed to update PO consumption" });
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
      resource: "",
      project: "",
      workDesc: "",
      workAssignDate: "",
      workCompletionDate: "",
      remarks: "",
      systemName: ""
    });
    setPoConsumptionFiles([]);
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
      <div className="bg-white rounded-lg shadow-xl max-w-[90vw] w-full max-h-[90vh] overflow-y-auto">
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
                <input
                  type="text"
                  name="poNumber"
                  value={formData.poNumber}
                  readOnly
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md bg-gray-100"
                  title={formData.poNumber}
                />
              </div>

              <div className="">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  <Activity size={14} className="inline mr-1" />
                  Milestone
                </label>
                <input
                  type="text"
                  name="msId"
                  value={milestoneList.find(ms => ms.msId === formData.msId)?.msName || ''}
                  readOnly
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md bg-gray-100"
                  title={formData.msId}
                />
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
                  className={`w-full px-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 ${errors.amount ? 'border-red-500' : 'border-gray-300'
                    }`}
                  placeholder="0"
                  disabled={loading || initialLoading}
                  title={formData.amount}
                />
                <span className="text-[10px] text-red-500">
                  {formData.msId ? `Milestone Balance: ${milestoneBalance}` : `PO Balance: ${poBalance ?? 'Loading...'}`} {formData.currency}
                </span>
                {errors.amount && (
                  <div className="mt-1">
                    <p className="text-xs text-red-600 leading-relaxed">{errors.amount}</p>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  <Activity size={14} className="inline mr-1" />
                  Type *
                </label>
                <select
                  name="utilizationType"
                  value={formData.utilizationType}
                  onChange={handleInputChange}
                  className={`w-full px-2 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 ${errors.utilizationType ? 'border-red-500' : 'border-gray-300'
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

              <div className="">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  <Building size={14} className="inline mr-1" />
                  Resource
                </label>
                <select
                  name="resource"
                  value={formData.resource}
                  onChange={handleInputChange}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                  disabled={loading || initialLoading}
                  title={formData.resource ? `Selected Resource: ${formData.resource}` : "Select a resource"}
                >
                  <option value="" title="No resource selected">Select resource</option>
                  {users.map((user, index) => (
                    <TruncatedOption
                      key={user.userId || index}
                      value={user.name}
                      text={`${user.name}`}
                      maxLength={25}
                    />
                  ))}
                </select>
              </div>

              <div className="">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  <Building size={14} className="inline mr-1" />
                  Project
                </label>
                <select
                  name="project"
                  value={formData.project}
                  onChange={handleInputChange}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                  disabled={loading || initialLoading}
                  title={formData.project ? `Selected Project: ${formData.project}` : "Select a project"}
                >
                  <option value="" title="No project selected">Select project</option>
                  {projectList.map((project, index) => (
                    <option
                      key={project.projectId || index}
                      value={project.projectName}
                      title={`Project: ${project.projectName}${project.projectDescription ? ` | Description: ${project.projectDescription}` : ''}`}
                    >
                      {project.projectName.length > 25 ? `${project.projectName.substring(0, 25)}...` : project.projectName}
                    </option>
                  ))}
                </select>
                {projectList.length === 0 && (
                  <p className="mt-1 text-xs text-gray-500" title="Loading projects from server...">Loading projects...</p>
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
            </div>


            {/* Row 3: Work Assign Date, Work Completion Date, and Attachment */}
            <div className="grid grid-cols-5 gap-4">


              <div className="">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  <Paperclip size={14} className="inline mr-1" />
                  PO Consumption Attachments (Max 4)
                </label>

                <input
                  type="file"
                  name="poConsumptionAttachment"
                  onChange={handleFileChange}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100"
                  disabled={loading || initialLoading}
                  multiple
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.txt"
                  title="Upload document or image file (max 10MB)"
                />

                {/* Display existing and newly added attachments */}
                <ul className="mt-2 text-xs text-gray-700 space-y-1">
                  {poConsumptionFiles.map((file, index) => (
                    <li
                      key={index}
                      className="flex items-center justify-between bg-gray-100 px-3 py-1 rounded"
                    >
                      <span className="truncate max-w-[200px]" title={file.fileName || file.name}>{file.fileName || file.name}</span>
                      <button
                        type="button"
                        onClick={() => removePOConsumptionFile(index)}
                        className="ml-2 text-red-600 hover:text-red-800 text-xs"
                      >
                        Delete
                      </button>
                    </li>
                  ))}
                </ul>

                {errors.attachment && (
                  <p className="mt-1 text-xs text-red-600">{errors.attachment}</p>
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
                className={`w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 resize-none ${errors.workDesc ? 'border-red-500' : 'border-gray-300'
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
                className={`w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 resize-none ${remarksCharCount > 500 ? 'border-red-500' : 'border-gray-300'
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