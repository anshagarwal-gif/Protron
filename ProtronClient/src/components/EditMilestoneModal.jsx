// EditMilestoneModal.js
import { useState, useEffect } from "react";
import { X, Target, DollarSign, Calendar, FileText, AlertCircle, Loader2, Clock } from "lucide-react";
import axios from "axios";

const EditMilestoneModal = ({ open, onClose, onSubmit, milestoneId }) => {
  const [formData, setFormData] = useState({
    msName: "",
    msDesc: "",
    msAmount: "",
    msCurrency: "USD",
    msDate: "",
    msDuration: "",
    msRemarks: "",
    msAttachment: null,
    poId: "",
    poNumber: ""
  });
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [descWordCount, setDescWordCount] = useState(0);
  const [remarksWordCount, setRemarksWordCount] = useState(0);

  // Helper function to count words
  const countWords = (text) => {
    if (!text || text.trim() === '') return 0;
    return text.trim().split(/\s+/).length;
  };

  // Fetch milestone data when modal opens
  useEffect(() => {
    if (open && milestoneId) {
      fetchMilestoneData();
    }
  }, [open, milestoneId]);

  // Initialize word counts when form data is set
  useEffect(() => {
    setDescWordCount(countWords(formData.msDesc));
    setRemarksWordCount(countWords(formData.msRemarks));
  }, [formData.msDesc, formData.msRemarks]);

  const fetchMilestoneData = async () => {
    setFetchLoading(true);
    setErrors({});
    try {
      const token = sessionStorage.getItem('token');
      if (!token) {
        throw new Error("Missing authentication credentials");
      }

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/po-milestone/${milestoneId}`,
        {
          headers: { Authorization: `${token}` }
        }
      );

      const milestone = response.data;
      console.log('Fetched milestone data:', milestone);

      setFormData({
        msName: milestone.msName || "",
        msDesc: milestone.msDesc || "",
        msAmount: milestone.msAmount || "",
        msCurrency: milestone.msCurrency || "USD",
        msDate: milestone.msDate ? milestone.msDate.split('T')[0] : "",
        msDuration: milestone.msDuration || "",
        msRemarks: milestone.msRemarks || "",
        msAttachment: null, // File attachments handled separately
        poId: milestone.poId || "",
        poNumber: milestone.poNumber || ""
      });
    } catch (error) {
      console.error("Error fetching milestone:", error);
      setErrors({ 
        fetch: error.response?.data?.message || error.message || "Failed to fetch milestone data" 
      });
    } finally {
      setFetchLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, files } = e.target;
    
    if (type === 'file') {
      setFormData(prev => ({
        ...prev,
        [name]: files[0] || null
      }));
    } else {
      // Check word limit for description and remarks
      if (name === 'msDesc') {
        const wordCount = countWords(value);
        if (wordCount > 500) {
          setErrors(prev => ({
            ...prev,
            [name]: "Description cannot exceed 500 words"
          }));
          return; // Don't update if exceeding limit
        }
        setDescWordCount(wordCount);
      } else if (name === 'msRemarks') {
        const wordCount = countWords(value);
        if (wordCount > 500) {
          setErrors(prev => ({
            ...prev,
            [name]: "Remarks cannot exceed 500 words"
          }));
          return; // Don't update if exceeding limit
        }
        setRemarksWordCount(wordCount);
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
        poId: parseInt(formData.poId),
        poNumber: formData.poNumber
      };

      console.log('Submitting milestone update:', submitData);

      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/api/po-milestone/edit/${milestoneId}`,
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
      console.error("Error updating milestone:", error);
      setErrors({ 
        submit: error.response?.data?.message || error.message || "Failed to update milestone" 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      msName: "",
      msDesc: "",
      msAmount: "",
      msCurrency: "USD",
      msDate: "",
      msDuration: "",
      msRemarks: "",
      msAttachment: null,
      poId: "",
      poNumber: ""
    });
    setErrors({});
    setDescWordCount(0);
    setRemarksWordCount(0);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <Target size={20} className="mr-2 text-green-600" />
            Edit Milestone
          </h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            disabled={loading || fetchLoading}
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Loading State */}
        {fetchLoading && (
          <div className="flex items-center justify-center p-8">
            <div className="flex items-center space-x-2">
              <Loader2 className="animate-spin text-green-600" size={24} />
              <span className="text-green-600 font-medium">Loading milestone data...</span>
            </div>
          </div>
        )}

        {/* Error State */}
        {errors.fetch && !fetchLoading && (
          <div className="p-6">
            <div className="bg-red-50 border border-red-200 rounded-md p-4 flex items-center">
              <AlertCircle size={20} className="text-red-500 mr-2" />
              <span className="text-red-700">{errors.fetch}</span>
            </div>
            <div className="flex justify-end mt-4">
              <button
                onClick={handleClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Form */}
        {!fetchLoading && !errors.fetch && (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Error Display */}
            {errors.submit && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3 flex items-center">
                <AlertCircle size={18} className="text-red-500 mr-2" />
                <span className="text-red-700 text-sm">{errors.submit}</span>
              </div>
            )}

            <div className="space-y-4">
              {/* Row 1: Milestone Name, Currency, and Amount (all at top) */}
              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-6">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    <Target size={14} className="inline mr-1" />
                    Milestone Name *
                  </label>
                  <input
                    type="text"
                    name="msName"
                    value={formData.msName}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 ${
                      errors.msName ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter milestone name"
                    disabled={loading}
                  />
                  {errors.msName && (
                    <p className="mt-1 text-xs text-red-600">{errors.msName}</p>
                  )}
                </div>

                <div className="col-span-2">
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

                <div className="col-span-3">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    <DollarSign size={14} className="inline mr-1" />
                    Amount *
                  </label>
                  <input
                    type="number"
                    name="msAmount"
                    value={formData.msAmount}
                    onChange={handleInputChange}
                    step="1"
                    min="0"
                    className={`w-full px-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 ${
                      errors.msAmount ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="0"
                    disabled={loading}
                  />
                  {errors.msAmount && (
                    <p className="mt-1 text-xs text-red-600">{errors.msAmount}</p>
                  )}
                </div>

                <div className="col-span-1"></div> {/* Small spacer */}
              </div>

              {/* Row 2: Duration, Date and Attachment */}
              <div className="grid grid-cols-8 gap-4">
                <div className="col-span-2">
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
                    className={`w-full px-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 ${
                      errors.msDuration ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="0"
                    disabled={loading}
                  />
                  {errors.msDuration && (
                    <p className="mt-1 text-xs text-red-600">{errors.msDuration}</p>
                  )}
                </div>

                <div className="col-span-3">
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
                  />
                </div>

                <div className="col-span-3">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    <FileText size={14} className="inline mr-1" />
                    Attachment
                  </label>
                  <input
                    type="file"
                    name="msAttachment"
                    onChange={handleInputChange}
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xlsx,.xls"
                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-medium file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Row 3: Description (large box for extensive text) */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  <FileText size={14} className="inline mr-1" />
                  Description *
                  <span className="float-right text-xs text-gray-500">
                    {descWordCount}/500 words
                  </span>
                </label>
                <textarea
                  name="msDesc"
                  value={formData.msDesc}
                  onChange={handleInputChange}
                  rows={4}
                  className={`w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 resize-none ${
                    errors.msDesc ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter detailed milestone description with all necessary information, objectives, deliverables, and requirements... (Max 500 words)"
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
                    {remarksWordCount}/500 words
                  </span>
                </label>
                <textarea
                  name="msRemarks"
                  value={formData.msRemarks}
                  onChange={handleInputChange}
                  rows={3}
                  className={`w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 resize-none ${
                    remarksWordCount > 500 ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter additional remarks, notes, special instructions, dependencies, or any other relevant information... (Max 500 words)"
                  disabled={loading}
                />
                {errors.msRemarks && (
                  <p className="mt-1 text-xs text-red-600">{errors.msRemarks}</p>
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
                    Updating...
                  </>
                ) : (
                  <>
                    <Target size={14} className="mr-2" />
                    Update Milestone
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default EditMilestoneModal;