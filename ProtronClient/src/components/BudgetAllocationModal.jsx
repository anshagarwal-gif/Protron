import React, { useState, useEffect } from "react";
import CreatableSelect from 'react-select/creatable';
import Select from 'react-select';
import { X, DollarSign, Monitor, FileText, AlertCircle, Plus, Building, Edit, Trash2, Loader2 } from "lucide-react";
import axios from "axios";
import GlobalSnackbar from "./GlobalSnackbar";
import OrganizationSelect from "./OrganizationSelect";

const BudgetAllocationModal = ({ open, onClose, budgetLineId, budgetLineName, currency, budgetLine }) => {
  const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: ""
  });

  // Form states
  const [isAddMode, setIsAddMode] = useState(true);
  const [editingAllocation, setEditingAllocation] = useState(null);
  const [formData, setFormData] = useState({
    vendorName: "",
    systemId: null,
    systemName: "",
    amount: "",
    remarks: ""
  });

  // Character limits
  const REMARKS_CHAR_LIMIT = 500;

  // Suggestions and user data
  const [systemSuggestions, setSystemSuggestions] = useState([]);

  // Delete confirmation dialog
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    open: false,
    allocation: null
  });

  // Fetch existing allocations when modal opens
  useEffect(() => {
    if (open && budgetLineId) {
      fetchAllocations();
      fetchSuggestions();
      resetForm();
    }
  }, [open, budgetLineId]);



  const fetchAllocations = async () => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem('token');
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/budget-allocations/budget/${budgetLineId}`,
        {
          headers: { Authorization: token }
        }
      );
      setAllocations(response.data || []);
    } catch (error) {
      console.error("Error fetching allocations:", error);
      setSnackbar({
        open: true,
        message: "Failed to fetch budget allocations",
        severity: "error"
      });
    } finally {
      setLoading(false);
    }
  };



  const fetchSuggestions = async () => {
    try {
      const token = sessionStorage.getItem('token');

      // Fetch systems from SystemMaster entity
      const systemsResponse = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/systems/tenant`,
        {
          headers: { Authorization: token }
        }
      );

      const systems = systemsResponse.data || [];
      setSystemSuggestions(systems);
    } catch (error) {
      console.error("Error fetching suggestions:", error);

      // Handle specific error for systems API
      if (error.response?.status === 500) {
        console.error("Systems API error:", error.response.data);
        // Set empty systems array to prevent crashes
        setSystemSuggestions([]);
        console.warn("Systems API failed - users can still enter custom system names");
      }
    }
  };



  const resetForm = () => {
    setFormData({
      vendorName: "",
      systemId: null,
      systemName: "",
      amount: "",
      remarks: ""
    });
    setErrors({});
    setIsAddMode(true);
    setEditingAllocation(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // Check character limit for remarks
    if (name === 'remarks' && value.length > REMARKS_CHAR_LIMIT) {
      return;
    }

    // Handle amount decimal validation
    if (name === 'amount') {
      // Allow only numbers with max 2 decimal places
      const decimalRegex = /^\d*\.?\d{0,2}$/;
      if (value && !decimalRegex.test(value)) {
        return; // Don't update the input if it doesn't match the pattern
      }

      // Additional check: prevent more than 2 decimal places
      if (value.includes('.')) {
        const parts = value.split('.');
        if (parts[1] && parts[1].length > 2) {
          return; // Don't allow more than 2 decimal places
        }
      }
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

  const validateForm = () => {
    const newErrors = {};

    // ✅ Either vendorName OR system required
    if (!formData.vendorName?.trim() && !formData.systemId && !formData.systemName?.trim()) {
      newErrors.vendorName = "Vendor name or System is required";
      newErrors.systemId = "Vendor name or System is required";
      newErrors.systemName = "Vendor name or System is required";
    }

    // Amount validation
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = "Valid amount is required";
    }

    // Budget validation
    if (budgetLine && formData.amount) {
      const requestedAmount = parseFloat(formData.amount);
      let remainingBudget = parseFloat(budgetLine.amountApproved || 0) - totalAllocated;

      // If editing an existing allocation, add its current amount to the available budget
      if (!isAddMode && editingAllocation) {
        remainingBudget += parseFloat(editingAllocation.amount || 0);
      }

      if (requestedAmount > remainingBudget) {
        newErrors.amount = `Amount exceeds remaining budget. Available: ${currency} ${remainingBudget.toLocaleString()}`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };


  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    try {
      const token = sessionStorage.getItem('token');
      const submitData = {
        budgetLineId: parseInt(budgetLineId),
        vendorName: formData.vendorName.trim(),
        systemId: formData.systemId,
        systemName: formData.systemName?.trim() || null,
        amount: parseFloat(formData.amount),
        remarks: formData.remarks.trim() || ""
      };



      if (isAddMode) {
        // Add new allocation
        await axios.post(
          `${import.meta.env.VITE_API_URL}/api/budget-allocations`,
          submitData,
          {
            headers: {
              Authorization: token,
              'Content-Type': 'application/json'
            }
          }
        );
        setSnackbar({
          open: true,
          message: "Budget allocation added successfully",
          severity: "success"
        });
      } else {
        // Update existing allocation
        await axios.put(
          `${import.meta.env.VITE_API_URL}/api/budget-allocations/${editingAllocation.allocationId}`,
          submitData,
          {
            headers: {
              Authorization: token,
              'Content-Type': 'application/json'
            }
          }
        );
        setSnackbar({
          open: true,
          message: "Budget allocation updated successfully",
          severity: "success"
        });
      }

      // Refresh allocations and reset form
      await fetchAllocations();
      resetForm();

    } catch (error) {
      console.error("Error saving allocation:", error);

      // Handle detailed error messages from backend
      let errorMessage = "Failed to save budget allocation";
      if (error.response?.data) {
        // Check if it's a detailed error message from our backend
        if (typeof error.response.data === 'string' && error.response.data.includes('Budget allocation')) {
          errorMessage = error.response.data;
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        }
      }

      setSnackbar({
        open: true,
        message: errorMessage,
        severity: "error"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (allocation) => {
    setFormData({
      vendorName: allocation.vendorName || "",
      systemId: allocation.systemId || null,
      systemName: allocation.systemName || "",
      amount: allocation.amount?.toString() || "",
      remarks: allocation.remarks || ""
    });
    setEditingAllocation(allocation);
    setIsAddMode(false);
  };

  const handleDelete = (allocationId) => {
    const allocation = allocations.find(a => a.allocationId === allocationId);
    if (!allocation) return;

    setDeleteConfirmation({
      open: true,
      allocation: allocation
    });
  };

  const confirmDelete = async () => {
    if (!deleteConfirmation.allocation) return;

    const allocation = deleteConfirmation.allocation;
    const allocationId = allocation.allocationId;

    try {
      const token = sessionStorage.getItem('token');
      const response = await axios.delete(
        `${import.meta.env.VITE_API_URL}/api/budget-allocations/${allocationId}`,
        {
          headers: { Authorization: token }
        }
      );

      // Handle detailed success messages from backend
      let successMessage = "Budget allocation deleted successfully";
      if (response?.data && typeof response.data === 'string' && response.data.includes('deleted successfully')) {
        successMessage = response.data;
      }

      setSnackbar({
        open: true,
        message: successMessage,
        severity: "success"
      });

      // Update allocations state immediately for real-time UI update
      setAllocations(prev => prev.filter(a => a.allocationId !== allocationId));

    } catch (error) {
      console.error("Error deleting allocation:", error);

      // Handle detailed error messages from backend
      let errorMessage = "Failed to delete budget allocation";
      if (error.response?.data) {
        // Check if it's a detailed error message from our backend
        if (typeof error.response.data === 'string' && error.response.data.includes('Failed to delete')) {
          errorMessage = error.response.data;
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        }
      }

      setSnackbar({
        open: true,
        message: errorMessage,
        severity: "error"
      });
    } finally {
      // Close confirmation dialog
      setDeleteConfirmation({ open: false, allocation: null });
    }
  };

  const cancelDelete = () => {
    setDeleteConfirmation({ open: false, allocation: null });
  };

  // Handler for vendor organization selection
  const handleVendorOrgSelect = (orgData) => {
    if (orgData) {
      // The OrganizationDTO uses orgName, not orgname
      const vendorName = orgData.orgName || orgData.value || '';
      setFormData(prev => ({
        ...prev,
        vendorName: vendorName
      }));

      if (errors.vendorName) {
        setErrors(prev => ({ ...prev, vendorName: "" }));
      }
    }
  };

  const handleCancel = () => {
    resetForm();
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Calculate total allocated amount
  const totalAllocated = allocations.reduce((sum, allocation) =>
    sum + (parseFloat(allocation.amount) || 0), 0
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-[#00000059] bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="budget-allocation-modal bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between
                p-3 sm:p-4 md:p-6
                gap-3 sm:gap-4
                border-b border-gray-200">

  {/* Title Wrapper (IMPORTANT: min-w-0 prevents overflow in flex) */}
  <div className="flex items-start sm:items-center min-w-0 flex-1">
    
    <DollarSign
      size={20}
      className="mr-2 text-green-600 shrink-0 mt-0.5 sm:mt-0"
    />

    <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900
                   leading-tight
                   break-words overflow-hidden">
      Budget Allocations - {budgetLineName}
    </h2>
  </div>

  {/* Close Button */}
  <button
    onClick={handleClose}
    className="self-end sm:self-auto p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer shrink-0"
    disabled={submitting}
  >
    <X size={20} className="text-gray-400" />
  </button>

</div>

        <div className="p-6 space-y-6">
          {/* Summary Section */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{allocations.length}</div>
                <div className="text-sm text-blue-800">Total Allocations</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {currency} {totalAllocated.toLocaleString()}
                </div>
                <div className="text-sm text-green-800">Total Allocated</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {currency} {(parseFloat(budgetLine?.amountApproved || 0) - totalAllocated).toLocaleString()}
                </div>
                <div className="text-sm text-purple-800">Remaining Budget</div>
              </div>
            </div>
          </div>

          {/* Add/Edit Form */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              {isAddMode ? (
                <>
                  <Plus size={18} className="mr-2 text-green-600" />
                  Add New Allocation
                </>
              ) : (
                <>
                  <Edit size={18} className="mr-2 text-blue-600" />
                  Edit Allocation
                </>
              )}
            </h3>



            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    <Building size={14} className="inline mr-1" />
                    Vendor Name *
                  </label>
                  <OrganizationSelect
                    value={formData.vendorName || ''}
                    onChange={(value) => setFormData(prev => ({ ...prev, vendorName: value }))}
                    onOrgSelect={handleVendorOrgSelect}
                    placeholder="Search for vendor or type new..."
                    orgType="SUPPLIER"
                    className="w-full"
                    isDisabled={loading}
                  />
                  {errors.vendorName && (
                    <p className="mt-1 text-xs text-red-600">{errors.vendorName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">

                    System Name *
                  </label>
                  <div className="relative">
                    <Monitor className="absolute left-3 top-3 text-green-600 z-10" size={14} />
                    <CreatableSelect
                      options={systemSuggestions.map(system => ({
                        label: system.systemName,
                        value: system.systemId,
                        isExisting: true
                      }))}

                      value={formData.systemId ?
                        (systemSuggestions.find(s => s.systemId === formData.systemId) ? {
                          label: systemSuggestions.find(s => s.systemId === formData.systemId).systemName,
                          value: formData.systemId,
                          isExisting: true
                        } : formData.systemName ? {
                          label: formData.systemName,
                          value: formData.systemName,
                          isExisting: false
                        } : null) :
                        formData.systemName ? {
                          label: formData.systemName,
                          value: formData.systemName,
                          isExisting: false
                        } : null
                      }
                      onChange={(selectedOption) => {
                        if (selectedOption) {
                          if (selectedOption.isExisting) {
                            // Existing system from database
                            setFormData(prev => ({
                              ...prev,
                              systemId: selectedOption.value,
                              systemName: null
                            }));
                          } else {
                            // New system name entered by user
                            setFormData(prev => ({
                              ...prev,
                              systemId: null,
                              systemName: selectedOption.value
                            }));
                          }
                        } else {
                          // Nothing selected
                          setFormData(prev => ({
                            ...prev,
                            systemId: null,
                            systemName: null
                          }));
                        }

                        if (errors.systemId || errors.systemName) {
                          setErrors(prev => ({ ...prev, systemId: "", systemName: "" }));
                        }
                      }}
                      className="react-select-container"
                      classNamePrefix="react-select"
                      placeholder="Select or add existing system "
                      isSearchable
                      isClearable
                      isValidNewOption={(inputValue) => inputValue.length > 0 && inputValue.length <= 250}
                      formatCreateLabel={(inputValue) => `Add "${inputValue}" as new system`}
                      styles={{
                        control: (base, state) => ({
                          ...base,
                          height: '40px',
                          paddingLeft: '28px',
                          borderColor: (errors.systemId || errors.systemName) ? '#ef4444' : state.isFocused ? '#10b981' : '#d1d5db',
                          boxShadow: state.isFocused ? '0 0 0 2px rgba(16, 185, 129, 0.2)' : 'none',
                        }),
                        valueContainer: (base) => ({ ...base, padding: '0 6px' }),
                      }}
                    />
                  </div>
                  {(errors.systemId || errors.systemName) && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.systemId || errors.systemName}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    Select from existing systems or type a new system name
                  </p>
                  {systemSuggestions.length === 0 && (
                    <p className="mt-1 text-xs text-amber-600">
                      ⚠️ Systems list unavailable - you can still type custom system names
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Amount * (Max 2 decimal places)
                  </label>
                  <input
                    type="text"
                    name="amount"
                    value={formData.amount}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 ${errors.amount ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="0.00"
                    disabled={submitting}
                  />
                  {errors.amount && (
                    <p className="mt-1 text-xs text-red-600">{errors.amount}</p>
                  )}
                  {budgetLine && formData.amount && !errors.amount && (
                    <p className="mt-1 text-xs text-gray-500">
                      Remaining budget: {currency} {(parseFloat(budgetLine.amountApproved || 0) - totalAllocated - parseFloat(formData.amount)).toLocaleString()}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    Format: 1234.56 (maximum 2 decimal places)
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  <FileText size={14} className="inline mr-1" />
                  Remarks
                  <span className="float-right text-xs text-gray-500">
                    {formData.remarks.length}/{REMARKS_CHAR_LIMIT} characters
                  </span>
                </label>
                <textarea
                  name="remarks"
                  value={formData.remarks}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 resize-none"
                  placeholder="Enter additional remarks or notes..."
                  maxLength={REMARKS_CHAR_LIMIT}
                  disabled={submitting}
                />
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-3 pt-3 border-t border-gray-200">
                {!isAddMode && (
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors cursor-pointer"
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={14} className="animate-spin mr-2" />
                      {isAddMode ? 'Adding...' : 'Updating...'}
                    </>
                  ) : (
                    <>
                      {isAddMode ? (
                        <>
                          <Plus size={14} className="mr-2" />
                          Add Allocation
                        </>
                      ) : (
                        <>
                          <Edit size={14} className="mr-2" />
                          Update Allocation
                        </>
                      )}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Allocations Table */}
          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="px-4 py-3 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">Existing Allocations</h3>
            </div>

            {loading ? (
              <div className="p-8 text-center">
                <Loader2 size={24} className="animate-spin text-green-600 mx-auto mb-2" />
                <p className="text-gray-600">Loading allocations...</p>
              </div>
            ) : allocations.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <DollarSign size={48} className="mx-auto mb-2 text-gray-300" />
                <p>No budget allocations found</p>
                <p className="text-sm">Add your first allocation using the form above</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">System</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remarks</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {allocations.map((allocation) => (
                      <tr key={allocation.allocationId} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">{allocation.vendorName}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{allocation.system?.systemName || allocation.systemName || 'N/A'}</td>
                        <td className="px-4 py-3 text-sm font-medium text-green-600">
                          {currency} {parseFloat(allocation.amount).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 max-w-xs truncate" title={allocation.remarks}>
                          {allocation.remarks || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEdit(allocation)}
                              className="text-blue-600 hover:text-blue-800 p-1 cursor-pointer"
                              title="Edit"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(allocation.allocationId)}
                              className="text-red-600 hover:text-red-800 p-1 cursor-pointer"
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteConfirmation.open && deleteConfirmation.allocation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                  <Trash2 size={24} className="text-red-600" />
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Delete Budget Allocation</h3>
                <p className="text-sm text-gray-500">This action cannot be undone.</p>
              </div>
            </div>

            <div className="mb-6">
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-700">Vendor:</span>
                  <span className="text-sm text-gray-900">{deleteConfirmation.allocation.vendorName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-700">System:</span>
                  <span className="text-sm text-gray-900">{deleteConfirmation.allocation.system?.systemName || deleteConfirmation.allocation.systemName || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-700">Amount:</span>
                  <span className="text-sm font-medium text-green-600">
                    {currency} {parseFloat(deleteConfirmation.allocation.amount).toLocaleString()}
                  </span>
                </div>
                {deleteConfirmation.allocation.remarks && (
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-700">Remarks:</span>
                    <span className="text-sm text-gray-900 max-w-xs truncate" title={deleteConfirmation.allocation.remarks}>
                      {deleteConfirmation.allocation.remarks}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={cancelDelete}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors cursor-pointer"
              >
                Delete Allocation
              </button>
            </div>
          </div>
        </div>
      )}

      <GlobalSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
      />
    </div>
  );
};

export default BudgetAllocationModal;
