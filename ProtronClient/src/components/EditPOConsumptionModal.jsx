// EditPOConsumptionModal.js
import { useState, useEffect, useRef } from "react";
import { X, Activity, DollarSign, Calendar, FileText, AlertCircle, Building, Paperclip, File as FileIcon } from "lucide-react";
import axios from "axios";
import GlobalSnackbar from "../components/GlobalSnackbar";

const getCurrencySymbol = (currencyCode) => {
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
    
    return currencySymbols[currencyCode] || currencyCode || '$';
};

const EditPOConsumptionModal = ({ open, onClose, onSubmit, consumptionId }) => {
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

  const [poConsumptionFiles, setPoConsumptionFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: ""
  });
  const [poList, setPOList] = useState([]);
  const [milestoneList, setMilestoneList] = useState([]);
  const [projectList, setProjectList] = useState([]);
  const [descCharCount, setDescCharCount] = useState(0);
  const [remarksCharCount, setRemarksCharCount] = useState(0);
  const [initialLoading, setInitialLoading] = useState(false);
  const [poBalance, setPOBalance] = useState(null);
  const [milestoneBalance, setMilestoneBalance] = useState(null);
  const [users, setUsers] = useState([]);
  const [originalAmount, setOriginalAmount] = useState(0);
  const [milestoneName, setMilestoneName] = useState('');

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

  const fetchPOConsumptionAttachments = async (consumptionId) => {
    try {
      const token = sessionStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/po-attachments/meta/filter?level=CONSUMPTION&referenceId=${consumptionId}`, {
        headers: { Authorization: token }
      });

      if (res.ok) {
        const data = await res.json();
        console.log('PO Consumption Attachments fetched:', data);
        if (data && data.length > 0) {
          console.log('First attachment structure:', data[0]);
        }
        setPoConsumptionFiles(data);
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
          console.log('Fetched consumption data:', consumption);

          // Store original amount for balance calculations
          setOriginalAmount(parseFloat(consumption.amount) || 0);

          // Store milestone name if it exists
          if (consumption.milestone?.msName) {
            setMilestoneName(consumption.milestone.msName);
          }

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
    if (consumptionId) {
      fetchPOConsumptionAttachments(consumptionId);
    }
  }, [open, consumptionId]);

  // Fetch PO list and projects when modal opens
  useEffect(() => {
    const fetchPOListAndProjects = async () => {
      if (open) {
        try {
          const token = sessionStorage.getItem('token');
          const tenantId = sessionStorage.getItem('tenantId');

          // Fetch PO list
          const poResponse = await axios.get(
            `${import.meta.env.VITE_API_URL}/api/po/all`,
            {
              headers: { Authorization: `${token}` }
            }
          );
          setPOList(poResponse.data);

          // Fetch projects list (tenant-specific)
          const projectResponse = await axios.get(
            `${import.meta.env.VITE_API_URL}/api/tenants/${tenantId}/projects`,
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
          console.log('Fetching PO balance for poId:', poId);
          
          const response = await axios.get(
            `${import.meta.env.VITE_API_URL}/api/po/pobalance-con/${poId}`,
            {
              headers: { Authorization: `${token}` }
            }
          );
          
          console.log('PO Balance API response:', response.data);
          console.log('Original amount to add back:', originalAmount);
          
          const calculatedBalance = (response.data || 0) + (originalAmount || 0);
          console.log('Final calculated PO balance:', calculatedBalance);
          
          setPOBalance(calculatedBalance);
        } catch (error) {
          console.error("Error fetching PO balance:", error);
          // Try alternative endpoint if the first one fails
          try {
            const response = await axios.get(
              `${import.meta.env.VITE_API_URL}/api/po/pobalance/${poId}`,
              {
                headers: { Authorization: sessionStorage.getItem('token') }
              }
            );
            console.log('Alternative PO Balance API response:', response.data);
            const calculatedBalance = (response.data || 0) + (originalAmount || 0);
            setPOBalance(calculatedBalance);
          } catch (altError) {
            console.error("Alternative PO balance fetch also failed:", altError);
            setPOBalance(0);
          }
        }
      }
    };

    const fetchMilestone = async (poId, msId) => {
      if (poId && msId) {
        try {
          const token = sessionStorage.getItem('token');
          console.log('Fetching milestone balance for poId:', poId, 'msId:', msId);
          
          const response = await axios.get(
            `${import.meta.env.VITE_API_URL}/api/po-milestone/milestonebalance-consumption/${poId}/${msId}`,
            {
              headers: { Authorization: `${token}` }
            }
          );
          
          console.log('Milestone Balance API response:', response.data);
          console.log('Original amount to add back:', originalAmount);
          
          const calculatedBalance = (response.data || 0) + (originalAmount || 0);
          console.log('Final calculated milestone balance:', calculatedBalance);
          
          setMilestoneBalance(calculatedBalance);
        } catch (error) {
          console.error("Error fetching milestone balance:", error);
          // Try alternative endpoint if the first one fails
          try {
            const response = await axios.get(
              `${import.meta.env.VITE_API_URL}/api/po-milestone/milestonebalance/${poId}/${msId}`,
              {
                headers: { Authorization: sessionStorage.getItem('token') }
              }
            );
            console.log('Alternative Milestone Balance API response:', response.data);
            const calculatedBalance = (response.data || 0) + (originalAmount || 0);
            setMilestoneBalance(calculatedBalance);
          } catch (altError) {
            console.error("Alternative milestone balance fetch also failed:", altError);
            setMilestoneBalance(0);
          }
        }
      }
    };

    // Only fetch balances if we have the necessary data
    if (poList.length > 0 && formData.poNumber) {
      const selectedPO = poList.find(po => po.poNumber === formData.poNumber);
      console.log('Selected PO for balance fetch:', selectedPO);
      
      if (selectedPO?.poId) {
        fetchPOBalance(selectedPO.poId);
        if (formData.msId) {
          fetchMilestone(selectedPO.poId, formData.msId);
        } else {
          setMilestoneBalance(null);
        }
      }
    }

  }, [formData.poNumber, formData.msId, originalAmount, poList]);

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

  // Enhanced amount change handler with real-time validation
  const handleAmountChange = (e) => {
    const value = e.target.value;
    setFormData(prev => ({
      ...prev,
      amount: value
    }));

    // Clear previous amount error
    if (errors.amount) {
      setErrors(prev => ({
        ...prev,
        amount: ""
      }));
    }

    // Real-time validation
    if (value && parseFloat(value) > 0) {
      const enteredAmount = parseFloat(value);
      const availableBalance = milestoneBalance !== null ? milestoneBalance : poBalance;
      
      if (availableBalance !== null && enteredAmount > availableBalance) {
        const balanceType = milestoneBalance !== null ? 'milestone' : 'PO';
        const currencySymbol = getCurrencySymbol(formData.currency);
        
        setErrors(prev => ({
          ...prev,
          amount: `Amount exceeds available ${balanceType} balance of ${currencySymbol}${availableBalance.toLocaleString()}. Please enter an amount within the available balance.`
        }));
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // Handle amount field separately for validation
    if (name === 'amount') {
      handleAmountChange(e);
      return;
    }

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
    const files = Array.from(e.target?.files || e.dataTransfer?.files || []);
    if (!files.length) return;

    // Clear previous attachment error
    setErrors(prev => ({ ...prev, attachment: "" }));

    const maxFiles = 4;

    // Check if adding these files exceeds the limit
    if (poConsumptionFiles.length + files.length > maxFiles) {
      setErrors(prev => ({ ...prev, attachment: `Maximum ${maxFiles} attachments allowed. You have ${poConsumptionFiles.length} files and trying to add ${files.length} more.` }));
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
      // Check if it's a new File object or existing document
      if (file instanceof File || (file && !file.id)) {
        if (file.size > maxSize) {
          error = "File must be under 10MB.";
          break;
        }
        if (!allowedTypes.includes(file.type)) {
          error = "Unsupported file type. Upload PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, GIF, or TXT.";
          break;
        }
        validFiles.push(file);
      } else {
        // It's an existing document, add it as is
        validFiles.push(file);
      }
    }

    if (error) {
      setErrors(prev => ({ ...prev, attachment: error }));
      return;
    }

    // de-dup by (name + size + lastModified) against existing File objects
    const existingFiles = poConsumptionFiles.filter(doc => !doc.id); // only new File objects
    const deduped = validFiles.filter(file => {
      return !existingFiles.some(a =>
        a.name === file.name &&
        a.size === file.size &&
        a.lastModified === file.lastModified
      );
    });

    const filesToAdd = deduped.slice(0, maxFiles - poConsumptionFiles.length);

    if (deduped.length > filesToAdd.length) {
      setSnackbar({
        open: true,
        message: `Only ${filesToAdd.length} more file(s) can be added (max 4). Some duplicate files were skipped.`,
        severity: 'warning'
      });
    }

    if (filesToAdd.length > 0) {
      setPoConsumptionFiles(prev => [...prev, ...filesToAdd]);
    } else {
      setSnackbar({
        open: true,
        message: 'All selected files are duplicates and were skipped.',
        severity: 'info'
      });
    }

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

  const removePOConsumptionFile = async (index) => {
    const fileToRemove = poConsumptionFiles[index];

    // Check if the file has an ID (existing file)
    if (fileToRemove.id) {
      try {
        const token = sessionStorage.getItem("token");
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/po-attachments/${fileToRemove.id}`, {
          method: "DELETE",
          headers: {
            Authorization: token,
          },
        });

        if (!response.ok) {
          console.error(`Failed to delete file with ID: ${fileToRemove.id}`);
          return;
        }

        console.log(`File with ID: ${fileToRemove.id} deleted successfully`);
      } catch (error) {
        console.error(`Error deleting file with ID: ${fileToRemove.id}`, error);
        return;
      }
    }

    // Update state to remove the file
    setPoConsumptionFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const removeAllAttachments = async () => {
    // Delete all existing files from server
    const existingFiles = poConsumptionFiles.filter(file => file.id);
    
    for (const file of existingFiles) {
      try {
        const token = sessionStorage.getItem("token");
        await fetch(`${import.meta.env.VITE_API_URL}/api/po-attachments/${file.id}`, {
          method: "DELETE",
          headers: { Authorization: token },
        });
        console.log(`File with ID: ${file.id} deleted successfully`);
      } catch (error) {
        console.error(`Error deleting file with ID: ${file.id}`, error);
      }
    }
    
    // Clear all files from state
    setPoConsumptionFiles([]);
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

  const validateBasicForm = () => {
    const newErrors = {};

    // Only validate required fields: PO Number, Amount, and Type
    if (!formData.poNumber?.trim()) {
      newErrors.poNumber = "PO Number is required";
    }

    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = "Valid amount is required";
    } else {
      // Check balance validation
      const enteredAmount = parseFloat(formData.amount);
      const availableBalance = milestoneBalance !== null ? milestoneBalance : poBalance;
      
      if (availableBalance !== null && enteredAmount > availableBalance) {
        const balanceType = milestoneBalance !== null ? 'milestone' : 'PO';
        const currencySymbol = getCurrencySymbol(formData.currency);
        
        newErrors.amount = `Amount exceeds available ${balanceType} balance of ${currencySymbol}${availableBalance.toLocaleString()}. Please enter an amount within the available balance.`;
      }
    }

    if (!formData.utilizationType?.trim()) {
      newErrors.utilizationType = "Utilization type is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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
          // Skip files that already exist (have an id)
          if (file.id) continue;
          
          const fileData = new FormData();
          fileData.append("file", file);
          fileData.append("level", "CONSUMPTION");
          fileData.append("referenceId", response.data.utilizationId);

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
    setOriginalAmount(0);
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
                <Activity className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg lg:text-xl font-bold">Edit PO Consumption</h2>
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
              <span className="text-green-700 font-medium">Loading consumption data...</span>
            </div>
          </div>
        )}

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
            {/* Row 1: PO Number, Milestone, Currency, and Amount */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
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
                  name="milestone"
                  value={milestoneName || milestoneList.find(ms => ms.msId === formData.msId)?.msName || (formData.msId ? 'Loading...' : '')}
                  readOnly
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md bg-gray-100"
                  title={milestoneName || formData.msId}
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
                  className={`w-full px-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 ${errors.amount ? 'border-red-500' : 'border-gray-300'
                    }`}
                  placeholder="0"
                  disabled={loading || initialLoading}
                  title={formData.amount}
                />
                <p className="mt-1 text-xs text-gray-500">
                  {formData.msId && milestoneBalance !== null ? (
                    `Milestone Balance: ${getCurrencySymbol(formData.currency)}${milestoneBalance.toLocaleString()}`
                  ) : poBalance !== null ? (
                    `PO Balance: ${getCurrencySymbol(formData.currency)}${poBalance.toLocaleString()}`
                  ) : (
                    "Loading balance..."
                  )}
                </p>
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
            </div>

            {/* Row 2: Resource, Project, System Name, Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
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
                  title={formData.project ? `Selected Initiative: ${formData.project}` : "Select an Initiative"}
                >
                  <option value="" title="No initiative selected">Select initiative</option>
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
                  <p className="mt-1 text-xs text-gray-500" title="Loading initiatives from server...">Loading initiatives...</p>
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

            {/* Row 3: Attachments */}
            

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

            {/* Attachments Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Paperclip size={16} className="inline mr-1" />
                Attachments (Max 4 files, 10MB each)
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
                  name="poConsumptionAttachment"
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
              {poConsumptionFiles.length > 0 && (
                <div className="mt-3 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-gray-700">
                      Attachments ({poConsumptionFiles.length}/4)
                    </span>
                    {poConsumptionFiles.length > 0 && (
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
                    {poConsumptionFiles.map((file, index) => {
                      const isExisting = file.id;
                      const fileName = file.fileName || file.name;
                      const fileSize = file.size || file.fileSize || file.fileSizeInBytes || 0;
                      
                      return (
                        <div
                          key={index}
                          className={`flex items-center justify-between p-2 border rounded-md transition-colors ${
                            isExisting
                              ? 'bg-blue-50 border-blue-200 hover:border-blue-300'
                              : 'bg-white border-gray-200 hover:border-green-300'
                          }`}
                        >
                          <div className="flex items-center space-x-2 flex-1 min-w-0">
                            <FileIcon size={16} className={isExisting ? 'text-blue-600' : 'text-green-600'} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2">
                                <p className="text-xs font-medium text-gray-700 truncate" title={fileName}>
                                  {fileName}
                                </p>
                                {isExisting && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 flex-shrink-0">
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
                            onClick={() => removePOConsumptionFile(index)}
                            className="ml-2 p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors flex-shrink-0"
                            disabled={loading || initialLoading}
                            title={isExisting ? "Delete existing file from server" : "Remove file"}
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
      <GlobalSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      />
    </div>
  );
};

export default EditPOConsumptionModal;