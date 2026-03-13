import React, { useState, useEffect } from "react";
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
  Loader2
} from "lucide-react";
import axios from "axios";

const SettlementModal = ({ open, onClose, invoice, onSettlementComplete }) => {
  const [settlementType, setSettlementType] = useState("FULL_PAYMENT");
  const [settlementAmount, setSettlementAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [transactionReference, setTransactionReference] = useState("");
  const [chequeNumber, setChequeNumber] = useState("");
  const [bankName, setBankName] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState("");
  const [settlementNotes, setSettlementNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [multiplePayments, setMultiplePayments] = useState([]);
  const [showMultiplePayments, setShowMultiplePayments] = useState(false);

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

  // Initialize form when invoice changes
  useEffect(() => {
    if (invoice && open) {
      const outstanding = parseFloat(invoice.totalAmount || 0) - parseFloat(invoice.totalPaidAmount || 0);
      setSettlementAmount(outstanding.toString());
      setSettlementType(outstanding <= 0 ? "FULL_PAYMENT" : "PARTIAL_PAYMENT");
      setError("");
      setMultiplePayments([]);
      setShowMultiplePayments(false);
    }
  }, [invoice, open]);

  // Calculate outstanding amount
  const getOutstandingAmount = () => {
    if (!invoice) return 0;
    return parseFloat(invoice.totalAmount || 0) - parseFloat(invoice.totalPaidAmount || 0);
  };

  // Add multiple payment entry
  const addMultiplePaymentEntry = () => {
    const newPayment = {
      id: Date.now(),
      amount: "",
      paymentMethod: "",
      transactionReference: "",
      chequeNumber: "",
      bankName: "",
      paymentDate: new Date().toISOString().split('T')[0],
      notes: ""
    };
    setMultiplePayments([...multiplePayments, newPayment]);
  };

  // Remove multiple payment entry
  const removeMultiplePaymentEntry = (id) => {
    setMultiplePayments(multiplePayments.filter(p => p.id !== id));
  };

  // Update multiple payment entry
  const updateMultiplePaymentEntry = (id, field, value) => {
    setMultiplePayments(multiplePayments.map(p => 
      p.id === id ? { ...p, [field]: value } : p
    ));
  };

  // Calculate total of multiple payments
  const getTotalMultiplePayments = () => {
    return multiplePayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
  };

  // Validate form
  const validateForm = () => {
    if (!invoice) {
      setError("No invoice selected");
      return false;
    }

    const outstanding = getOutstandingAmount();
    
    if (settlementType === "MULTIPLE_PAYMENTS") {
      if (multiplePayments.length === 0) {
        setError("At least one payment entry is required");
        return false;
      }

      const total = getTotalMultiplePayments();
      if (total <= 0) {
        setError("Total payment amount must be greater than 0");
        return false;
      }

      if (total > outstanding) {
        setError(`Total payment amount (${total}) cannot exceed outstanding amount (${outstanding})`);
        return false;
      }

      for (const payment of multiplePayments) {
        if (!payment.amount || parseFloat(payment.amount) <= 0) {
          setError("All payment amounts must be greater than 0");
          return false;
        }
        if (!payment.paymentMethod) {
          setError("Payment method is required for all entries");
          return false;
        }
      }
    } else {
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

      if (settlementType === "PARTIAL_PAYMENT" && parseFloat(settlementAmount) > outstanding) {
        setError(`Partial payment amount cannot exceed outstanding amount (${outstanding})`);
        return false;
      }
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
      
      let requestData;
      
      if (settlementType === "MULTIPLE_PAYMENTS") {
        requestData = {
          invoiceId: invoice.invoiceId,
          settlementType: "MULTIPLE_PAYMENTS",
          settlementAmount: getTotalMultiplePayments(),
          paymentDate,
          notes,
          settlementNotes,
          settledBy: "Current User", // TODO: Get from auth context
          autoApplyToInvoice: true,
          paymentDetails: multiplePayments.map(p => ({
            amount: parseFloat(p.amount),
            paymentMethod: p.paymentMethod,
            transactionReference: p.transactionReference,
            chequeNumber: p.chequeNumber,
            bankName: p.bankName,
            paymentDate: p.paymentDate,
            notes: p.notes
          }))
        };

        const response = await axios.post(
          `${import.meta.env.VITE_API_URL}/api/invoices/settle-multiple-payments`,
          requestData,
          { headers: { Authorization: token } }
        );

        console.log("Multiple payments settled:", response.data);
      } else {
        requestData = {
          invoiceId: invoice.invoiceId,
          settlementType,
          settlementAmount: parseFloat(settlementAmount),
          paymentMethod,
          transactionReference,
          chequeNumber,
          bankName,
          paymentDate,
          notes,
          settlementNotes,
          settledBy: "Current User", // TODO: Get from auth context
          autoApplyToInvoice: true
        };

        const response = await axios.post(
          `${import.meta.env.VITE_API_URL}/api/invoices/settle-payment`,
          requestData,
          { headers: { Authorization: token } }
        );

        console.log("Payment settled:", response.data);
      }

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
            <div className="grid grid-cols-3 gap-2">
              {outstanding <= 0 ? (
                <button
                  type="button"
                  onClick={() => setSettlementType("FULL_PAYMENT")}
                  className={`px-3 py-2 rounded-md border text-sm font-medium transition-colors ${
                    settlementType === "FULL_PAYMENT"
                      ? "bg-green-600 text-white border-green-600"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  Full Payment
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setSettlementType("FULL_PAYMENT");
                      setSettlementAmount(outstanding.toString());
                      setShowMultiplePayments(false);
                    }}
                    className={`px-3 py-2 rounded-md border text-sm font-medium transition-colors ${
                      settlementType === "FULL_PAYMENT"
                        ? "bg-green-600 text-white border-green-600"
                        : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    Full Payment
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSettlementType("PARTIAL_PAYMENT");
                      setShowMultiplePayments(false);
                    }}
                    className={`px-3 py-2 rounded-md border text-sm font-medium transition-colors ${
                      settlementType === "PARTIAL_PAYMENT"
                        ? "bg-green-600 text-white border-green-600"
                        : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    Partial Payment
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSettlementType("MULTIPLE_PAYMENTS");
                      setShowMultiplePayments(true);
                      if (multiplePayments.length === 0) {
                        addMultiplePaymentEntry();
                      }
                    }}
                    className={`px-3 py-2 rounded-md border text-sm font-medium transition-colors ${
                      settlementType === "MULTIPLE_PAYMENTS"
                        ? "bg-green-600 text-white border-green-600"
                        : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    Multiple Payments
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Single Payment Form */}
          {settlementType !== "MULTIPLE_PAYMENTS" && (
            <>
              {/* Settlement Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Settlement Amount *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                    {invoice.currency === 'INR' ? '₹' : '$'}
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={outstanding}
                    value={settlementAmount}
                    onChange={(e) => setSettlementAmount(e.target.value)}
                    className="pl-8 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="0.00"
                  />
                </div>
                {settlementType === "PARTIAL_PAYMENT" && (
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

              {/* Conditional fields based on payment method */}
              {paymentMethod === "Cheque" && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cheque Number
                    </label>
                    <input
                      type="text"
                      value={chequeNumber}
                      onChange={(e) => setChequeNumber(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Enter cheque number"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bank Name
                    </label>
                    <input
                      type="text"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Enter bank name"
                    />
                  </div>
                </>
              )}

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
                />
              </div>
            </>
          )}

          {/* Multiple Payments Form */}
          {settlementType === "MULTIPLE_PAYMENTS" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-medium text-gray-700">Payment Entries</h4>
                <button
                  type="button"
                  onClick={addMultiplePaymentEntry}
                  className="flex items-center px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Payment
                </button>
              </div>

              {multiplePayments.map((payment, index) => (
                <div key={payment.id} className="border border-gray-200 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <h5 className="text-sm font-medium text-gray-700">Payment {index + 1}</h5>
                    {multiplePayments.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeMultiplePaymentEntry(payment.id)}
                        className="text-red-600 hover:text-red-800 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Amount *
                      </label>
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-xs">
                          {invoice.currency === 'INR' ? '₹' : '$'}
                        </span>
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          value={payment.amount}
                          onChange={(e) => updateMultiplePaymentEntry(payment.id, 'amount', e.target.value)}
                          className="pl-6 w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Payment Method *
                      </label>
                      <select
                        value={payment.paymentMethod}
                        onChange={(e) => updateMultiplePaymentEntry(payment.id, 'paymentMethod', e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                      >
                        <option value="">Select method</option>
                        {paymentMethods.map(method => (
                          <option key={method} value={method}>{method}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Transaction Reference
                      </label>
                      <input
                        type="text"
                        value={payment.transactionReference}
                        onChange={(e) => updateMultiplePaymentEntry(payment.id, 'transactionReference', e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                        placeholder="Reference"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Payment Date
                      </label>
                      <input
                        type="date"
                        value={payment.paymentDate}
                        onChange={(e) => updateMultiplePaymentEntry(payment.id, 'paymentDate', e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                      />
                    </div>
                  </div>

                  {payment.paymentMethod === "Cheque" && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Cheque Number
                        </label>
                        <input
                          type="text"
                          value={payment.chequeNumber}
                          onChange={(e) => updateMultiplePaymentEntry(payment.id, 'chequeNumber', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                          placeholder="Cheque number"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Bank Name
                        </label>
                        <input
                          type="text"
                          value={payment.bankName}
                          onChange={(e) => updateMultiplePaymentEntry(payment.id, 'bankName', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                          placeholder="Bank name"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Notes
                    </label>
                    <textarea
                      value={payment.notes}
                      onChange={(e) => updateMultiplePaymentEntry(payment.id, 'notes', e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                      rows="2"
                      placeholder="Payment notes"
                    />
                  </div>
                </div>
              ))}

              {multiplePayments.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Total Multiple Payments:</span>
                    <span className="text-sm font-bold text-green-600">
                      {formatCurrency(getTotalMultiplePayments())}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Common fields */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Date *
            </label>
            <input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              rows="3"
              placeholder="Additional notes about this payment"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Settlement Notes
            </label>
            <textarea
              value={settlementNotes}
              onChange={(e) => setSettlementNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              rows="2"
              placeholder="Internal settlement notes"
            />
          </div>

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
