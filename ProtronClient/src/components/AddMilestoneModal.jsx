// AddMilestoneModal.js
import { useState, useEffect } from "react";
import { X, Target, DollarSign, Calendar, FileText, AlertCircle, Clock, Upload } from "lucide-react";
import axios from "axios";
import GlobalSnackbar from "../components/GlobalSnackbar";


const AddMilestoneModal = ({ open, onClose, onSubmit, poId }) => {
  const [formData, setFormData] = useState({
    msName: "",
    msDesc: "",
    msAmount: "",
    msCurrency: "USD",
    msDate: "",
    msDuration: "",
    msRemarks: "",
    poId: poId,
    poNumber: ""
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [poDetails, setPODetails] = useState(null);
  const [descCharCount, setDescCharCount] = useState(0);
  const [remarksCharCount, setRemarksCharCount] = useState(0);
  const [poBalance, setPOBalance] = useState(null);
  const [milestoneFiles, setMilestoneFiles] = useState([]);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: ""
  });

  // Character limits
  const DESC_CHAR_LIMIT = 500;
  const REMARKS_CHAR_LIMIT = 500;

  // Fetch PO details to get PO number and currency
  useEffect(() => {
    const fetchPODetails = async () => {
      if (open && poId) {
        try {
          const token = sessionStorage.getItem('token');
          const response = await axios.get(
            `${import.meta.env.VITE_API_URL}/api/po/${poId}`,
            {
              headers: { Authorization: `${token}` }
            }
          );
          setPODetails(response.data);
          setFormData(prev => ({
            ...prev,
            poId: poId,
            poNumber: response.data.poNumber || "",
            msCurrency: response.data.poCurrency || "USD"
          }));
        } catch (error) {
          console.error("Error fetching PO details:", error);
        }
      }
    };

    fetchPODetails();
  }, [open, poId]);

  useEffect(() => {
    const fetchPOBalance = async () => {
      if (poId) {
        try {
          const token = sessionStorage.getItem('token');
          const response = await axios.get(
            `${import.meta.env.VITE_API_URL}/api/po-milestone/getMilestoneBalanceForPO/${poId}`,
            {
              headers: { Authorization: `${token}` }
            }
          );
          console.log(response.data);
          setPOBalance(response.data);
          console.log(poId, response.data);
        } catch (error) {
          console.error("Error fetching PO balance:", error);
        }
      }
    };
    fetchPOBalance();
  }, [poId]);

  // Initialize character counts when form data is set
  useEffect(() => {
    setDescCharCount(formData.msDesc.length);
    setRemarksCharCount(formData.msRemarks.length);
  }, [formData.msDesc, formData.msRemarks]);

  useEffect(() => {
    if (open && poId) {
      setErrors({});
    }
  }, [open, poId]);

  const handleInputChange = (e) => {
    const { name, value, type, files } = e.target;

    if (type === 'file') {
      setFormData(prev => ({
        ...prev,
        [name]: files[0] || null
      }));
    } else {
      // Check character limit for description and remarks
      if (name === 'msDesc') {
        if (value.length > DESC_CHAR_LIMIT) {
          setErrors(prev => ({
            ...prev,
            [name]: `Description cannot exceed ${DESC_CHAR_LIMIT} characters`
          }));
          return; // Don't update if exceeding limit
        }
        setDescCharCount(value.length);
      } else if (name === 'msRemarks') {
        if (value.length > REMARKS_CHAR_LIMIT) {
          setErrors(prev => ({
            ...prev,
            [name]: `Remarks cannot exceed ${REMARKS_CHAR_LIMIT} characters`
          }));
          return; // Don't update if exceeding limit
        }
        setRemarksCharCount(value.length);
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

  const handleMSFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    // Check max limit of 4 files
    if (milestoneFiles.length + files.length > 4) {
      alert("You can upload a maximum of 4 attachments.");
      return;
    }

    setMilestoneFiles(prev => [...prev, ...files]);
    e.target.value = null;
  };

  const removeMilestoneAttachment = (index) => {
    setMilestoneFiles(prev => prev.filter((_, i) => i !== index));
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
    console.log(onSubmit)

    console.log("elseCall", milestoneFiles);
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
        poId: parseInt(poId),
        poNumber: formData.poNumber
      };

      console.log('Submitting milestone data:', submitData);

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/po-milestone/add`,
        submitData,
        {
          headers: {
            Authorization: `${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      console.log('Milestone added successfully:', response.data);
      setSnackbar({
        open: true,
        message: "Milestone added successfully",
        severity: "success"
      });

      const milestoneId = response.data.id || response.data.msId;
      const milestoneName = response.data.msName;

      if (milestoneFiles.length > 0) {
        for (const file of milestoneFiles) {
          const attachmentForm = new FormData();
          attachmentForm.append("file", file);
          attachmentForm.append("level", "MS");
          attachmentForm.append("referenceId", milestoneId);
          attachmentForm.append("referenceNumber", milestoneName || "");

          try {
            const uploadRes = await fetch(`${import.meta.env.VITE_API_URL}/api/po-attachments/upload`, {
              method: "POST",
              headers: {
                Authorization: `${token}`
              },
              body: attachmentForm
            });
            console.log("Attachment upload response:", uploadRes);

            if (!uploadRes.ok) {
              console.error(`Attachment upload failed for ${file.name}`);
              setSnackbar({
                open: true,
                message: "Attachment upload failed",
                severity: "error"
              });
            }
          } catch (err) {
            console.error("Attachment upload error:", err);
            setSnackbar({
              open: true,
              message: "Attachment upload failed",
              severity: "error"
            })
          }
        }
      }

      onSubmit({
        msId: milestoneId,
        milestoneName: formData.msName,
        milestoneDescription: formData.msDesc,
        amount: parseInt(formData.msAmount) || 0,
        currency: formData.msCurrency,
        date: formData.msDate ? new Date(formData.msDate).toISOString().split('T')[0] : null,
        duration: parseInt(formData.msDuration) || 0,
        remark: formData.msRemarks || "",
        attachments: milestoneFiles
      });

      resetForm();

    } catch (error) {
      console.error("Error adding milestone:", error);
      setErrors({
        submit: error.response?.data?.message || error.message || "Failed to add milestone"
      });
      setSnackbar({
        open: true,
        message: "Failed to add milestone",
        severity: "error"
      });
    } finally {
      setLoading(false);

    }
  };

  const resetForm = () => {
    setFormData({
      msName: "",
      msDesc: "",
      msAmount: "",
      msCurrency: poDetails?.poCurrency || "USD",
      msDate: "",
      msDuration: "",
      msRemarks: "",
      poId: poId,
      poNumber: poDetails?.poNumber || ""
    });
    setErrors({});
    setDescCharCount(0);
    setRemarksCharCount(0);
    setMilestoneFiles([]);
    setSnackbar({
      open: false,
      message: "",
      severity: ""
    });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleDateInputClick = (inputName) => {
        const dateInput = document.getElementsByName(inputName)[0];
        if (dateInput) {
            dateInput.showPicker();
        }
    };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <Target size={20} className="mr-2 text-green-600" />
            Add New Milestone
          </h2>
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
            {/* Row 1: Milestone Name, Currency, and Amount (all at top) */}
            <div className="grid grid-cols-4 gap-4">
              <div className="">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  <Target size={14} className="inline mr-1" />
                  Milestone Name *
                </label>
                <input
                  type="text"
                  name="msName"
                  value={formData.msName}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 ${errors.msName ? 'border-red-500' : 'border-gray-300'
                    }`}
                  placeholder="Enter milestone name"
                  disabled={loading}
                />
                {errors.msName && (
                  <p className="mt-1 text-xs text-red-600">{errors.msName}</p>
                )}
              </div>

              <div className="">
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

              <div className="">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Amount *
                </label>
                <input
                  type="number"
                  name="msAmount"
                  value={formData.msAmount}
                  onChange={handleInputChange}
                  step="1"
                  min="0"
                  className={`w-full px-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 ${errors.msAmount ? 'border-red-500' : 'border-gray-300'
                    }`}
                  placeholder="0"
                  disabled={loading}
                />
                {errors.msAmount && (
                  <p className="mt-1 text-xs text-red-600">{errors.msAmount}</p>
                )}
                <label className="text-xs text-red-500 mt-1">
                  PO Balance: {poBalance !== null ? `${poBalance} ${formData.msCurrency}` : 'Loading...'}
                </label>
              </div>

              <div className="">
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
                  className={`w-full px-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 ${errors.msDuration ? 'border-red-500' : 'border-gray-300'
                    }`}
                  placeholder="0"
                  disabled={loading}
                />
                {errors.msDuration && (
                  <p className="mt-1 text-xs text-red-600">{errors.msDuration}</p>
                )}
              </div>
            </div>

            {/* Row 2: Duration, Date and Attachment */}
            <div className="grid grid-cols-4 gap-4">

              <div className="">
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
                  onClick={() => handleDateInputClick('msDate')}
                />
              </div>

              <div className="">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  <FileText size={14} className="inline mr-1" />
                  Milestone Attachments (Max 4)
                </label>

                <div className="relative">
                  <input
                    type="file"
                    multiple
                    id="ms-attachment-input"
                    onChange={handleMSFileChange}
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xlsx,.xls"
                    className="hidden"
                    disabled={loading}
                  />
                  <label
                    htmlFor="ms-attachment-input"
                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 flex items-center justify-between cursor-pointer"
                  >
                    <span className="text-gray-600">
                      {milestoneFiles.length > 0 ? `${milestoneFiles.length} file(s) selected` : 'Click to select files'}
                    </span>
                    <Upload size={16} className="text-green-600" />
                  </label>
                </div>

                <ul className="mt-2 text-xs text-gray-700 space-y-1">
                  {milestoneFiles.map((file, index) => (
                    <li
                      key={index}
                      className="flex items-center justify-between bg-gray-100 px-3 py-1 rounded"
                    >
                      <span className="truncate max-w-[200px]" title={file.name}>{file.name}</span>
                      <button
                        type="button"
                        onClick={() => removeMilestoneAttachment(index)}
                        className="ml-2 text-red-600 hover:text-red-800 text-xs"
                      >
                        Delete
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Row 3: Description (large box for extensive text) */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                <FileText size={14} className="inline mr-1" />
                Description *
                <span className="float-right text-xs text-gray-500">
                  {descCharCount}/{DESC_CHAR_LIMIT} characters
                </span>
              </label>
              <textarea
                name="msDesc"
                value={formData.msDesc}
                onChange={handleInputChange}
                rows={4}
                className={`w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 resize-none ${errors.msDesc ? 'border-red-500' : 'border-gray-300'
                  }`}
                placeholder={`Enter detailed milestone description with all necessary information, objectives, deliverables, and requirements... (Max ${DESC_CHAR_LIMIT} characters)`}
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
                  {remarksCharCount}/{REMARKS_CHAR_LIMIT} characters
                </span>
              </label>
              <textarea
                name="msRemarks"
                value={formData.msRemarks}
                onChange={handleInputChange}
                rows={3}
                className={`w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 resize-none ${remarksCharCount > REMARKS_CHAR_LIMIT ? 'border-red-500' : 'border-gray-300'
                  }`}
                placeholder={`Enter additional remarks, notes, special instructions, dependencies, or any other relevant information... (Max ${REMARKS_CHAR_LIMIT} characters)`}
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
                  Adding...
                </>
              ) : (
                <>
                  <Target size={14} className="mr-2" />
                  Add Milestone
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
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
      />
    </div>
  );
};

export default AddMilestoneModal;