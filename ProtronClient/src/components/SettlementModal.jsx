import React, { useState, useEffect, useRef } from "react";
import {
  DollarSign,
  Calendar,
  CreditCard,
  Building,
  FileText,
  X,
  Plus,
  Trash2,
  Check,
  AlertCircle,
  Loader2,
  Paperclip
} from "lucide-react";
import axios from "axios";

const SettlementModal = ({ open, onClose, invoice, onSettlementComplete }) => {
  const [settlementType, setSettlementType] = useState("FULL_PAYMENT");
  const [settlementAmount, setSettlementAmount] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [transactionReference, setTransactionReference] = useState("");
  const [chequeNumber, setChequeNumber] = useState("");
  const [bankName, setBankName] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [settlementNotes, setSettlementNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Attachment states
  const MAX_ATTACHMENTS = 4;
  const [attachments, setAttachments] = useState([]);
  const fileInputRef = useRef(null);

  // Payment methods
  const paymentMethods = [
    "Cash",
    "Bank Transfer",
    "Cheque",
    "Credit Card",
    "Debit Card",
    "Online Payment",
    "Wire Transfer",
    "Mobile Payment",
    "Other"
  ];

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      // Reset all form fields and attachments when modal closes
      setSettlementType("FULL_PAYMENT");
      setSettlementAmount("");
      setCurrency("USD");
      setPaymentMethod("");
      setTransactionReference("");
      setChequeNumber("");
      setBankName("");
      setPaymentDate(new Date().toISOString().split('T')[0]);
      setSettlementNotes("");
      setAttachments([]);
      setError("");
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [open]);

  // Calculate outstanding amount
  const getOutstandingAmount = () => {
    if (!invoice) return 0;
    return parseFloat(invoice.totalAmount || 0) - parseFloat(invoice.totalPaidAmount || 0);
  };

  // Handle file selection
  const handleFileChange = (event) => {
    const files = Array.from(event.target.files);
    if (!files.length) return;

    // Validate each file
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'image/jpeg',
      'image/png',
      'image/gif'
    ];

    let error = "";
    const validFiles = [];

    for (const file of files) {
      if (file.size > maxSize) {
        error = "File must be under 10MB.";
        break;
      }
      if (!allowedTypes.includes(file.type)) {
        error = "Unsupported file type. Upload PDF, DOC, DOCX, JPG, PNG, GIF, or TXT.";
        break;
      }
      validFiles.push(file);
    }

    if (error) {
      setError(error);
      return;
    }

    // De-dup by (name + size + lastModified)
    const deduped = validFiles.filter(file => {
      return !attachments.some(a =>
        a.name === file.name &&
        a.size === file.size &&
        a.lastModified === file.lastModified
      );
    });

    const filesToAdd = deduped.slice(0, MAX_ATTACHMENTS - attachments.length);

    if (deduped.length > filesToAdd.length) {
      setError(`Only ${filesToAdd.length} more file(s) can be added (max 4). Some duplicate files were skipped.`);
    }

    if (filesToAdd.length > 0) {
      setAttachments([...attachments, ...filesToAdd]);
    } else {
      setError('All selected files are duplicates and were skipped.');
    }

    event.target.value = '';
  };

  const removeAttachment = (index) => {
    const newAttachments = [...attachments];
    newAttachments.splice(index, 1);
    setAttachments(newAttachments);
  };

  const removeAllAttachments = () => {
    setAttachments([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Validate form
  const validateForm = () => {
    if (!invoice) {
      setError("No invoice selected");
      return false;
    }

    const outstanding = getOutstandingAmount();
    
    if (!settlementAmount || parseFloat(settlementAmount) <= 0) {
      setError("Settlement amount must be greater than 0");
      return false;
    }

    if (!paymentMethod) {
      setError("Payment method is required");
      return false;
    }

    if (settlementType === "FULL_PAYMENT" && parseFloat(settlementAmount) !== outstanding) {
      setError(`Full payment amount must equal outstanding amount (${outstanding})`);
      return false;
    }

    if (settlementType === "PARTIAL_PAYMENT" && parseFloat(settlementAmount) > outstanding && outstanding > 0) {
      setError(`Partial payment amount cannot exceed outstanding amount (${outstanding})`);
      return false;
    }

    if (!paymentDate) {
      setError("Payment date is required");
      return false;
    }

    return true;
  };

  // Handle settlement submission
  const handleSettlement = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError("");

    try {
      const token = sessionStorage.getItem("token");
      
      const requestData = {
        invoiceId: invoice.invoiceId,
        settlementType,
        settlementAmount: parseFloat(settlementAmount),
        currency: currency,
        paymentMethod,
        transactionReference,
        chequeNumber,
        bankName,
        paymentDate,
        settlementNotes,
        settledBy: "Current User", // TODO: Get from auth context
        autoApplyToInvoice: true
      };

      let response;
      if (attachments.length > 0) {
        // Use multipart endpoint with attachments
        const formData = new FormData();
        formData.append('payment', JSON.stringify(requestData));
        attachments.forEach((file) => {
          formData.append('attachments', file);
        });

        response = await axios.post(
          `${import.meta.env.VITE_API_URL}/api/invoices/settle-payment-with-attachments`,
          formData,
          { 
            headers: { 
              Authorization: token,
              "Content-Type": "multipart/form-data"
            } 
          }
        );
      } else {
        // Use regular endpoint
        response = await axios.post(
          `${import.meta.env.VITE_API_URL}/api/invoices/settle-payment`,
          requestData,
          { headers: { Authorization: token } }
        );
      }

      console.log("Payment settled:", response.data);

      // Call success callback
      if (onSettlementComplete) {
        onSettlementComplete();
      }

      onClose();
    } catch (error) {
      console.error("Settlement error:", error);
      setError(error.response?.data || "Failed to settle payment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    const symbol = invoice?.currency === 'INR' ? '₹' : '$';
    return `${symbol}${parseFloat(amount || 0).toLocaleString()}`;
  };

  if (!open || !invoice) return null;

  const outstanding = getOutstandingAmount();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm p-2 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 bg-green-600 text-white rounded-t-lg">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5" />
              <h2 className="text-lg font-semibold">Settle Invoice</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-green-700 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6 space-y-4">
          {/* Invoice Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-800 mb-2">Invoice Summary</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Invoice ID:</span>
                <span className="ml-2 font-medium">{invoice.invoiceId}</span>
              </div>
              <div>
                <span className="text-gray-600">Customer:</span>
                <span className="ml-2 font-medium">{invoice.customerName}</span>
              </div>
              <div>
                <span className="text-gray-600">Total Amount:</span>
                <span className="ml-2 font-medium">{formatCurrency(invoice.totalAmount)}</span>
              </div>
              <div>
                <span className="text-gray-600">Outstanding:</span>
                <span className="ml-2 font-medium text-green-600">{formatCurrency(outstanding)}</span>
              </div>
            </div>
          </div>

          {/* Settlement Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Settlement Type
            </label>
            <select
              value={settlementType}
              onChange={(e) => {
                const newType = e.target.value;
                setSettlementType(newType);
                if (newType === "FULL_PAYMENT") {
                  setSettlementAmount(outstanding.toString());
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="FULL_PAYMENT">Full Payment</option>
              <option value="PARTIAL_PAYMENT">Partial Payment</option>
            </select>
          </div>

          {/* Currency */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Currency
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - British Pound</option>
                  <option value="INR">INR - Indian Rupee</option>
                  <option value="JPY">JPY - Japanese Yen</option>
                  <option value="CAD">CAD - Canadian Dollar</option>
                  <option value="AUD">AUD - Australian Dollar</option>
                  <option value="CHF">CHF - Swiss Franc</option>
                </select>
              </div>

              
          {/* Payment Form */}
          <>
            {/* Settlement Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount *
              </label>
              <div>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={outstanding}
                  value={settlementAmount}
                  onChange={(e) => setSettlementAmount(e.target.value)}
                  disabled={settlementType === "FULL_PAYMENT"}
                  className="pl-8 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="0.00"
                  maxLength="10"
                />
              </div>
              {settlementType === "PARTIAL_PAYMENT" && outstanding > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  Maximum: {formatCurrency(outstanding)}
                </p>
              )}
            </div>

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Method *
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Select payment method</option>
                  {paymentMethods.map(method => (
                    <option key={method} value={method}>{method}</option>
                  ))}
                </select>
              </div>

              {/* Payment Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Date *
                </label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              {/* Transaction Reference */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Transaction Reference
                </label>
                <input
                  type="text"
                  value={transactionReference}
                  onChange={(e) => setTransactionReference(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Enter transaction reference"
                  maxLength="250"
                />
                <p className="text-xs text-gray-500 mt-1">Maximum 250 characters</p>
              </div>

              {/* Settlement Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Settlement Notes
                </label>
                <textarea
                  value={settlementNotes}
                  onChange={(e) => setSettlementNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  rows="3"
                  placeholder="Enter settlement notes"
                  maxLength="500"
                />
                <p className="text-xs text-gray-500 mt-1">Maximum 500 characters</p>
              </div>

              {/* Attachments Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center">
                  <Paperclip className="mr-2 text-green-600" size={16} />
                  Attachments (Optional - Max 4 files)
                </label>

                {/* File Input */}
                <div className="mb-4">
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.txt"
                    multiple
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors flex items-center justify-center space-x-2 text-gray-600 hover:text-green-600"
                    disabled={attachments.length >= 4}
                  >
                    <Paperclip size={20} />
                    <span className="text-sm font-medium">
                      {attachments.length === 0
                        ? 'Choose Files (Max 4)'
                        : attachments.length >= 4
                          ? 'Maximum 4 files reached'
                          : `Add More Files (${4 - attachments.length} remaining)`
                      }
                    </span>
                  </button>
                  <p className="text-xs text-gray-500 mt-2">
                    Supported formats: PDF, DOC, DOCX, JPG, PNG, GIF, TXT (Max 10MB each)
                  </p>
                </div>

                {/* Selected Files Display */}
                {attachments.length > 0 && (
                  <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium text-gray-700 flex items-center">
                        <FileText className="mr-1" size={16} />
                        Selected Files ({attachments.length}/4)
                      </h4>
                      <button
                        type="button"
                        onClick={removeAllAttachments}
                        className="text-red-500 hover:text-red-700 text-xs font-medium"
                      >
                        Remove All
                      </button>
                    </div>

                    <div className="space-y-2">
                      {attachments.map((file, index) => (
                        <div key={index} className="flex items-center justify-between bg-white rounded-md p-3 border border-gray-200">
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                              <FileText size={16} className="text-green-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-gray-900 break-words" title={file.name}>
                                {file.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {formatFileSize(file.size)}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeAttachment(index)}
                            className="text-red-500 hover:text-red-700 p-1"
                            title="Remove file"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center">
                <AlertCircle className="w-4 h-4 text-red-600 mr-2" />
                <span className="text-sm text-red-700">{error}</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSettlement}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Settle Payment
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettlementModal;
