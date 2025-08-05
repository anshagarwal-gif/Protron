// AddPOConsumptionModal.js
import { useState, useEffect } from "react";
import { X, Activity, DollarSign, Calendar, FileText, AlertCircle, Building, Paperclip } from "lucide-react";
import axios from "axios";
import { useSession } from "../Context/SessionContext";

const AddPOConsumptionModal = ({ open, onClose, onSubmit }) => {
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
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [poList, setPOList] = useState([]);
  const [milestoneList, setMilestoneList] = useState([]);
  const [projectList, setProjectList] = useState([]);
  const [descCharCount, setDescCharCount] = useState(0);
  const [remarksCharCount, setRemarksCharCount] = useState(0);
  const { sessionData } = useSession();
  const [poBalance, setPOBalance] = useState(null);
  const [milestoneBalance, setMilestoneBalance] = useState(null);
  const [poId, setPoId] = useState("");
  const [users, setUsers] = useState([]);
  const [poConsumptionFiles, setPoConsumptionFiles] = useState([]);

  // Fetch PO list and projects on modal open
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

          // Fetch projects list (same as AddPOModal)
          const projectResponse = await axios.get(
            `${import.meta.env.VITE_API_URL}/api/tenants/${sessionData.tenantId}/projects`,
            {
              headers: { Authorization: `${token}` }
            }
          );
          setProjectList(projectResponse.data);
          console.log('Projects fetched:', projectResponse.data);

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

  // Fetch milestones when PO is selected
  useEffect(() => {
    const fetchMilestones = async () => {
      if (formData.poNumber) {
        try {
          const token = sessionStorage.getItem('token');
          const selectedPO = poList.find(po => po.poNumber === formData.poNumber);
          console.log('Selected PO:', selectedPO);

          if (selectedPO) {
            console.log('Selected PO:', selectedPO);

            // Fetch milestones using the same API endpoint as SRN modal
            try {
              const milestoneResponse = await axios.get(
                `${import.meta.env.VITE_API_URL}/api/po-milestone/getMilestoneForPoForCon/${selectedPO.poId}`,
                {
                  headers: { Authorization: `${token}` }
                }
              );

              console.log('Milestone response:', milestoneResponse.data);
              setMilestoneList(milestoneResponse.data || []);
            } catch (milestoneError) {
              console.error("Error fetching milestones:", milestoneError);
              setMilestoneList([]); // No milestones found
            }

            // Update currency based on selected PO
            setFormData(prev => ({
              ...prev,
              currency: selectedPO.poCurrency || "USD"
            }));
          }
        } catch (error) {
          console.error("Error in fetchMilestones:", error);
          setMilestoneList([]); // No milestones found
        }
      } else {
        setMilestoneList([]); // No PO selected, clear milestones
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

    if (name === 'poNumber') {
      setFormData(prev => ({
        ...prev,
        poNumber: value,
        msId: "",
      }));
      fetchPOBalance(value);
      setMilestoneBalance(null); // Clear milestone balance when PO changes
    } else if (name === 'msId') {
      setFormData(prev => ({
        ...prev,
        msId: value,
      }));
      fetchMilestoneBalance(formData.poNumber, value);
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

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    // Limit to 4 files total
    if (poConsumptionFiles.length + files.length > 4) {
      setErrors(prev => ({ ...prev, attachment: "Max 4 attachments allowed." }));
      return;
    }

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
        error = "File must be under 10MB.";
        break;
      }
      if (!allowedTypes.includes(file.type)) {
        error = "Unsupported file type. Upload PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, GIF, or TXT.";
        break;
      }
      validFiles.push(file);
    }

    if (error) {
      setErrors(prev => ({ ...prev, attachment: error }));
      return;
    }

    setPoConsumptionFiles(prev => [...prev, ...validFiles]);
    setErrors(prev => ({ ...prev, attachment: "" }));
    e.target.value = null;
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
      'WST': 'WS$',
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
      'COP': '$'
    };

    return currencySymbols[currencyCode] || currencyCode || '$';
  };

  const validateForm = async () => {
    const newErrors = {};

    // Only validate required fields: PO Number, Amount, and Type
    if (!formData.poNumber?.trim()) {
      newErrors.poNumber = "PO Number is required";
    }

    if (milestoneList.length > 0 && !formData.msId) {
      newErrors.msId = "Milestone is required when PO has milestones";
    }

    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = "Valid amount is required";
    }

    if (!formData.utilizationType?.trim()) {
      newErrors.utilizationType = "Utilization type is required";
    }

    // Balance validation for amount
    if (formData.poNumber && formData.amount > 0) {
      try {
        const token = sessionStorage.getItem('token');
        let balanceEndpoint = '';
        let balanceType = '';

        if (formData.msId && formData.msId.trim()) {
          // Check milestone balance
          balanceEndpoint = `${import.meta.env.VITE_API_URL}/api/po-consumption/balance/${formData.poNumber}?msId=${encodeURIComponent(formData.msId)}`;
          balanceType = `Milestone "${formData.msId}"`;
        } else {
          // Check PO balance
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
          newErrors.amount = `Amount exceeds available balance. ${balanceType} has ${currencySymbol}${availableBalance.toLocaleString()} remaining, but you're trying to consume ${currencySymbol}${requestedAmount.toLocaleString()}.`;

          // Auto-clear the error after 1 second
          setTimeout(() => {
            setErrors(prev => ({
              ...prev,
              amount: ""
            }));
          }, 1000);
        }

      } catch (balanceError) {
        console.error("Error checking balance:", balanceError);
        // If balance check fails, show a warning but don't block submission
        newErrors.amount = "Unable to verify balance. Please check the amount manually.";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);

    try {
      const isValid = await validateForm();
      if (!isValid) {
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
      submitData.append('resource', formData.resource || '');
      submitData.append('project', formData.project || '');
      submitData.append('workDesc', formData.workDesc || '');
      submitData.append('workAssignDate', formData.workAssignDate || '');
      submitData.append('workCompletionDate', formData.workCompletionDate || '');
      submitData.append('remarks', formData.remarks || '');
      submitData.append('systemName', formData.systemName || '');

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/po-consumption/add`,
        submitData,
        {
          headers: {
            Authorization: `${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      console.log("PO Consumption added successfully:", response.data);
      const consumptionId = response.data.utilizationId
;

      if (poConsumptionFiles.length > 0) {
  for (const file of poConsumptionFiles) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("level", "CONSUMPTION");
    formData.append("referenceId", consumptionId);
    formData.append("referenceNumber", ""); // if applicable

    try {
      const uploadRes = await fetch(`${import.meta.env.VITE_API_URL}/api/po-attachments/upload`, {
        method: "POST",
        headers: {
          'Authorization': `${token}`
        },
        body: formData
      });

      if (!uploadRes.ok) {
        console.error(`Attachment upload failed for ${file.name}`);
      }
    } catch (err) {
      console.error("Attachment upload error:", err);
    }
  }
}


      onSubmit(response.data);
      handleClose();
    } catch (error) {
      console.error("Error adding PO consumption:", error);

      // Enhanced error message handling
      let errorMessage = "Failed to add PO consumption";

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data) {
        // Handle validation errors from backend
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
      resource: "",
      project: "",
      workDesc: "",
      workAssignDate: "",
      workCompletionDate: "",
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

  // Function to fetch PO balance
  const fetchPOBalance = async (poNumber) => {
    if (poNumber) {

      const poId = poList.find(po => po.poNumber === poNumber)?.poId;

      try {
        const token = sessionStorage.getItem('token');
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/po/pobalance-con/${poId}`,
          {
            headers: { Authorization: `${token}` }
          }
        );
        setPOBalance(response.data);
      } catch (error) {
        console.error("Error fetching PO balance:", error);
        setPOBalance(null);
      }
    }
  };

  // Function to fetch milestone balance
  const fetchMilestoneBalance = async (poNumber, msId) => {
    if (poNumber && msId) {
      const poId = poList.find(po => po.poNumber === poNumber)?.poId;
      try {
        const token = sessionStorage.getItem('token');
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/po-milestone/milestonebalance-consumption/${poId}/${msId}`,
          {
            headers: { Authorization: `${token}` }
          }
        );
        setMilestoneBalance(response.data);
      } catch (error) {
        console.error("Error fetching milestone balance:", error);
        setMilestoneBalance(null);
      }
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-[90vw] w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <Activity size={20} className="mr-2 text-green-600" />
              Add New PO Consumption
            </h2>
            {errors.amount && (
              <p className="mt-1 text-red-600" style={{ fontSize: '10px' }}>
                {errors.amount}
              </p>
            )}
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            disabled={loading}
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Error Display */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 flex items-center">
              <AlertCircle size={18} className="text-red-500 mr-2" />
              <span className="text-red-700 text-sm">{errors.submit}</span>
            </div>
          )}

          <div className="space-y-4">
            {/* Row 1: PO Number, Milestone, Currency, and Amount */}
            <div className="grid grid-cols-5 gap-4">
              <div >
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  <FileText size={14} className="inline mr-1" />
                  PO Number *
                </label>
                <select
                  name="poNumber"
                  value={formData.poNumber}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 ${errors.poNumber ? 'border-red-500' : 'border-gray-300'
                    }`}
                  disabled={loading}
                  title={formData.poNumber ? `Selected PO: ${formData.poNumber}` : "Select a PO Number"}
                >
                  <option value="" title="No PO selected">Select PO</option>
                  {poList.map(po => (
                    <option
                      key={po.poId}
                      value={po.poNumber}
                      title={`PO: ${po.poNumber} | Currency: ${po.poCurrency || 'USD'} | Amount: ${po.poAmount ? getCurrencySymbol(po.poCurrency) + (po.poAmount).toLocaleString() : 'N/A'}`}
                    >
                      {po.poNumber.length > 15 ? `${po.poNumber.substring(0, 15)}...` : po.poNumber}
                    </option>
                  ))}
                </select>
                {errors.poNumber && (
                  <p className="mt-1 text-xs text-red-600" title={`Error: ${errors.poNumber}`}>
                    {errors.poNumber.length > 30 ? `${errors.poNumber.substring(0, 30)}...` : errors.poNumber}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  <Activity size={14} className="inline mr-1" />
                  Milestone (Optional)
                </label>
                <select
                  name="msId"
                  value={formData.msId}
                  onChange={handleInputChange}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                  disabled={loading}
                  title={formData.msId ? `Selected Milestone: ${formData.msName}` : "Select a milestone (optional)"}
                >
                  <option value="" title="No specific milestone selected">No specific milestone</option>
                  {milestoneList.map(milestone => (
                    <option
                      key={milestone.msId}
                      value={milestone.msId}
                      title={`Milestone: ${milestone.msName} | Amount: ${milestone.msAmount ? getCurrencySymbol(milestone.msCurrency) + (milestone.msAmount).toLocaleString() : 'N/A'}`}
                    >
                      {milestone.msName.length > 20 ? `${milestone.msName.substring(0, 20)}...` : milestone.msName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Currency
                </label>
                <input type="text" value={formData.currency} readOnly className="w-full h-10 px-4 border border-gray-300 rounded-md bg-gray-100" />
              </div>

              <div className="">
                <label className="block text-xs font-medium text-gray-700 mb-1">
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
                  disabled={loading}
                  title={formData.amount ? `Amount: ${getCurrencySymbol(formData.currency)}${parseFloat(formData.amount).toLocaleString()}` : "Enter consumption amount"}
                />
                <span className="text-[10px] text-red-500">
                  {formData.msId ? `Milestone Balance: ${milestoneBalance}` : `PO Balance: ${poBalance ?? 'Loading...'}`} {formData.srnCurrency}
                </span>
              </div>

              <div className="">
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
                  disabled={loading}
                  title={`Selected Type: ${formData.utilizationType}`}
                >
                  <option value="Fixed" title="Fixed Price - Predetermined cost for specific deliverables">Fixed</option>
                  <option value="T&M" title="Time and Materials - Billing based on actual time and resources used">T&M</option>
                  <option value="Mixed" title="Mixed Model - Combination of fixed and time-based billing">Mixed</option>
                </select>
                {errors.utilizationType && (
                  <p className="mt-1 text-xs text-red-600" title={`Error: ${errors.utilizationType}`}>
                    {errors.utilizationType.length > 30 ? `${errors.utilizationType.substring(0, 30)}...` : errors.utilizationType}
                  </p>
                )}
              </div>
            </div>

            {/* Row 2: Utilization Type, Resource/Project, System Name */}
            <div className="grid grid-cols-5 gap-4">

              <div className="">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  <Building size={14} className="inline mr-1" />
                  Resource
                </label>
                <select name="resource" id="resource" value={formData.resource} onChange={handleInputChange} className={`w-full px-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 ${errors.resource ? 'border-red-500' : 'border-gray-300'}`} disabled={loading} title={formData.resource ? `Resource: ${formData.resource}` : "Select a resource"}>
                  <option value="" title="No resource selected">Select resource</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.name} title={`User: ${user.name}`}>
                      {user.name.length > 25 ? `${user.name.substring(0, 25)}...` : user.name}
                    </option>
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
                  disabled={loading}
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

              <div className="">
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
                  disabled={loading}
                  title={formData.systemName ? `System: ${formData.systemName}` : "Enter the system name (optional)"}
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
                  disabled={loading}
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
                  disabled={loading}
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
                  disabled={loading}
                  multiple
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.txt"
                  title="Upload document or image file (max 10MB)"
                />

                {/* Selected Files List */}
                <ul className="mt-2 text-xs text-gray-700 space-y-1">
                  {poConsumptionFiles.map((file, index) => (
                    <li
                      key={index}
                      className="flex items-center justify-between bg-gray-100 px-3 py-1 rounded"
                    >
                      <span className="truncate max-w-[200px]" title={file.name}>{file.name}</span>
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
                disabled={loading}
                title={formData.workDesc ? `Work Description (${descCharCount}/500 chars): ${formData.workDesc}` : "Enter detailed work description (optional)"}
              />
              {errors.workDesc && (
                <p className="mt-1 text-xs text-red-600" title={`Error: ${errors.workDesc}`}>
                  {errors.workDesc.length > 50 ? `${errors.workDesc.substring(0, 50)}...` : errors.workDesc}
                </p>
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
                disabled={loading}
                title={formData.remarks ? `Remarks (${remarksCharCount}/500 chars): ${formData.remarks}` : "Enter additional remarks (optional)"}
              />
              {errors.remarks && (
                <p className="mt-1 text-xs text-red-600" title={`Error: ${errors.remarks}`}>
                  {errors.remarks.length > 50 ? `${errors.remarks.substring(0, 50)}...` : errors.remarks}
                </p>
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
                  <Activity size={14} className="mr-2" />
                  Add Consumption
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPOConsumptionModal;