// AddPOConsumptionModal.js
import { useState, useEffect } from "react";
import { X, Activity, DollarSign, Calendar, FileText, AlertCircle, Building } from "lucide-react";
import axios from "axios";
import {useSession} from "../Context/SessionContext";

const AddPOConsumptionModal = ({ open, onClose, onSubmit }) => {
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
  const {sessionData} = useSession();

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

    fetchPOListAndProjects();
  }, [open]);

  // Fetch milestones when PO is selected
  useEffect(() => {
  const fetchMilestones = async () => {
    if (formData.poNumber) {
      try {
        const token = sessionStorage.getItem('token');
        const selectedPO = poList.find(po => po.poNumber === formData.poNumber);
        
        if (selectedPO) {
          console.log('Selected PO:', selectedPO);
          
          // Fetch milestones using the same API endpoint as SRN modal
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

    if (!formData.poNumber?.trim()) {
      newErrors.poNumber = "PO Number is required";
    }

    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = "Valid amount is required";
    }

    if (!formData.utilizationType?.trim()) {
      newErrors.utilizationType = "Utilization type is required";
    }

    if (!formData.workDesc?.trim()) {
      newErrors.workDesc = "Work description is required";
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

      const submitData = {
        poNumber: formData.poNumber,
        msId: formData.msId || null,
        amount: parseInt(formData.amount) || 0,
        currency: formData.currency,
        utilizationType: formData.utilizationType,
        resourceOrProject: formData.resourceOrProject,
        workDesc: formData.workDesc,
        workAssignDate: formData.workAssignDate || null,
        workCompletionDate: formData.workCompletionDate || null,
        remarks: formData.remarks || "",
        systemName: formData.systemName || ""
      };

      console.log('Submitting PO consumption data:', submitData);

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
      resourceOrProject: "",
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

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
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
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-2">
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
                  disabled={loading}
                  title={formData.poNumber ? `Selected PO: ${formData.poNumber}` : "Select a PO Number"}
                >
                  <option value="" title="No PO selected">Select PO</option>
                  {poList.map(po => (
                    <option 
                      key={po.poId} 
                      value={po.poNumber}
                      title={`PO: ${po.poNumber} | Currency: ${po.poCurrency || 'USD'} | Amount: ${po.poAmount ? getCurrencySymbol(po.poCurrency)+(po.poAmount).toLocaleString() : 'N/A'}`}
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

              <div className="col-span-3">
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
                      value={milestone.msId}S
                      title={`Milestone: ${milestone.msName} | Amount: ${milestone.msAmount ? getCurrencySymbol(milestone.msCurrency)+(milestone.msAmount).toLocaleString() : 'N/A'}`}
                    >
                      {milestone.msName.length > 20 ? `${milestone.msName.substring(0, 20)}...` : milestone.msName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-span-1">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Currency
                </label>
                <select
                  name="currency"
                  value={formData.currency}
                  onChange={handleInputChange}
                  className="w-full px-1 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                  disabled={true}
                  title={`Selected Currency: ${formData.currency} (${getCurrencySymbol(formData.currency)})`}
                >
                  <option value="USD" title="US Dollar ($)">USD</option>
                  <option value="INR" title="Indian Rupee (₹)">INR</option>
                  <option value="EUR" title="Euro (€)">EUR</option>
                  <option value="GBP" title="British Pound (£)">GBP</option>
                  <option value="JPY" title="Japanese Yen (¥)">JPY</option>
                </select>
              </div>

              <div className="col-span-2">
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
                  disabled={loading}
                  title={formData.amount ? `Amount: ${getCurrencySymbol(formData.currency)}${parseFloat(formData.amount).toLocaleString()}` : "Enter consumption amount"}
                />
              </div>

              <div className="col-span-4"></div> {/* Spacer */}
            </div>

            {/* Row 2: Utilization Type, Resource/Project, System Name */}
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-2">
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

              <div className="col-span-4">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  <Building size={14} className="inline mr-1" />
                  Resource/Project *
                </label>
                <select
                  name="resourceOrProject"
                  value={formData.resourceOrProject}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 ${
                    errors.resourceOrProject ? 'border-red-500' : 'border-gray-300'
                  }`}
                  disabled={loading}
                  title={formData.resourceOrProject ? `Selected Project: ${formData.resourceOrProject}` : "Select a project"}
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
                {errors.resourceOrProject && (
                  <p className="mt-1 text-xs text-red-600" title={`Error: ${errors.resourceOrProject}`}>
                    {errors.resourceOrProject.length > 30 ? `${errors.resourceOrProject.substring(0, 30)}...` : errors.resourceOrProject}
                  </p>
                )}
                {projectList.length === 0 && (
                  <p className="mt-1 text-xs text-gray-500" title="Loading projects from server...">Loading projects...</p>
                )}
              </div>

              <div className="col-span-3">
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

              <div className="col-span-3"></div> {/* Spacer */}
            </div>

            {/* Row 3: Work Assign Date and Work Completion Date */}
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-3">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  <Calendar size={14} className="inline mr-1" />
                  Work Assign Date
                </label>
                <input
                  type="date"
                  name="workAssignDate"
                  value={formData.workAssignDate}
                  onChange={handleInputChange}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                  disabled={loading}
                  title={formData.workAssignDate ? `Work Assigned: ${new Date(formData.workAssignDate).toLocaleDateString()}` : "Select work assignment date (optional)"}
                />
              </div>

              <div className="col-span-3">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  <Calendar size={14} className="inline mr-1" />
                  Work Completion Date
                </label>
                <input
                  type="date"
                  name="workCompletionDate"
                  value={formData.workCompletionDate}
                  onChange={handleInputChange}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                  disabled={loading}
                  title={formData.workCompletionDate ? `Work Completed: ${new Date(formData.workCompletionDate).toLocaleDateString()}` : "Select work completion date (optional)"}
                />
              </div>

              <div className="col-span-6"></div> {/* Spacer */}
            </div>

            {/* Row 4: Work Description */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                <FileText size={14} className="inline mr-1" />
                Work Description *
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
                disabled={loading}
                title={formData.workDesc ? `Work Description (${descCharCount}/500 chars): ${formData.workDesc}` : "Enter detailed work description (required)"}
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
                className={`w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 resize-none ${
                  remarksCharCount > 500 ? 'border-red-500' : 'border-gray-300'
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