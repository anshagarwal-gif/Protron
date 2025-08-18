import React, { useState, useEffect } from 'react';
import { X, Calendar, DollarSign, User, Building, FileText, Hash, Clock, MapPin, Target, CreditCard, Users } from 'lucide-react';
import axios from 'axios';
import { useSession } from '../Context/SessionContext';

const ViewPOModal = ({ open, onClose, poData }) => {
  const [attachments, setAttachments] = useState([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);
  const [attachmentError, setAttachmentError] = useState(null);
  const { sessionData } = useSession();

  useEffect(() => {
    if (open && poData?.poId) {
      setLoadingAttachments(true);
      axios
        .get(`${import.meta.env.VITE_API_URL}/api/po-attachments/meta/filter?level=PO&referenceId=${poData.poId}`, {
          headers: {
            'Authorization': sessionData?.token
          }
        })
        .then((res) => {
          setAttachments(res.data);
          setAttachmentError(null);
        })
        .catch((err) => {
          setAttachmentError("Failed to load attachments.");
          console.error(err);
        })
        .finally(() => setLoadingAttachments(false));
    }
  }, [open, poData?.poId]);

  if (!open || !poData) return null;

  // Format currency
  const formatCurrency = (amount, currency = 'USD') => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Get PO type display name and tag styling
  const getPOTypeDisplay = (type) => {
    switch (type) {
      case 'T_AND_M':
        return 'Time & Material';
      case 'FIXED':
        return 'Fixed Price';
      case 'MIXED':
        return 'Mixed';
      default:
        return type || 'N/A';
    }
  };

  // Function to get tag styling for PO Type
  const getPoTypeTag = (type) => {
    const baseClasses = "px-2 py-1 rounded text-xs font-medium";
    switch (type) {
      case "FIXED":
        return `${baseClasses} bg-emerald-100 text-emerald-800`;
      case "T_AND_M":
        return `${baseClasses} bg-violet-100 text-violet-800`;
      case "MIXED":
        return `${baseClasses} bg-amber-100 text-amber-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-700`;
    }
  };

  // Field component for consistent styling (matching SRN modal)
  const Field = ({ label, value, className = "" }) => (
    <div className={className}>
      <label className="text-xs font-medium text-gray-600 mb-1 block">{label}</label>
      <div className="text-sm text-gray-900 font-medium">
        {value || "N/A"}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 bg-green-600 text-white rounded-t-lg">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <FileText size={24} />
              <div>
                <h2 className="text-xl font-bold">Purchase Order Details</h2>
                <p className="text-green-100 text-sm">PO #{poData.poNumber || 'N/A'}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-green-700 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <Hash className="mr-2 text-green-600" size={20} />
              Basic Information
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Field
                label="PO Number"
                value={poData.poNumber}
              />
              <Field
                label="PO Amount"
                value={formatCurrency(poData.poAmount, poData.poCurrency)}
              />
              <Field
                label="PO Type"
                value={<span className={getPoTypeTag(poData.poType)}>{getPOTypeDisplay(poData.poType)}</span>}
              />
              <Field
                label="Currency"
                value={poData.poCurrency}
              />
              <Field
                label="Project Name"
                value={poData.projectName}
              />
              <Field
                label="Country"
                value={poData.poCountry}
              />
              <Field
                label="SPOC"
                value={poData.poSpoc}
              />
              <Field
                label="Customer"
                value={poData.customer}
              />
              <Field
                label="Start Date"
                value={formatDate(poData.poStartDate)}
              />
              <Field
                label="End Date"
                value={formatDate(poData.poEndDate)}
              />
              <Field
                label="Created Date"
                value={formatDate(poData.createdTimestamp)}
              />
            </div>
          </div>

          {/* Sponsor & Budget Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <Target className="mr-2 text-green-600" size={20} />
              Sponsor & Budget Information
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Field
                label="Supplier"
                value={poData.supplier}
              />
              <Field
                label="Sponsor Name"
                value={poData.sponsorName}
              />
              <Field
                label="Sponsor LOB"
                value={poData.sponsorLob}
              />
              <Field
                label="Budget Line Item"
                value={poData.budgetLineItem}
              />
              <Field
                label="Budget Line Amount"
                value={formatCurrency(poData.budgetLineAmount, poData.poCurrency)}
              />
              <Field
                label="Business Value Amount"
                value={formatCurrency(poData.businessValueAmount, poData.poCurrency)}
              />
              <Field
                label="Business Value Type"
                value={poData.businessValueType}
              />
            </div>
            {poData.budgetLineRemarks && (
              <div className="mt-4">
                <Field
                  label="Budget Line Remarks"
                  value={poData.budgetLineRemarks}
                />
              </div>
            )}
          </div>

          {/* Description */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
              <FileText className="mr-2 text-green-600" size={20} />
              Description
            </h3>
            <div className="bg-white rounded p-3 border">
              <p className="text-sm text-gray-900 leading-relaxed whitespace-pre-wrap">
                {poData.poDesc || "No description available"}
              </p>
            </div>
          </div>

          {/* Attachments */}
          {attachments.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                <FileText className="mr-2 text-green-600" size={20} />
                Attachments ({attachments.length})
              </h3>
              <div className="space-y-2">
                {attachments.map((att, idx) => (
                  <button
                    key={att.attachmentId || idx}
                    onClick={async () => {
                      try {
                        const response = await axios.get(
                          `${import.meta.env.VITE_API_URL}/api/po-attachments/${att.id}/download`,
                          {
                            responseType: "blob",
                            headers: {
                              Authorization: sessionData?.token,
                            },
                          }
                        );

                        const url = window.URL.createObjectURL(new Blob([response.data]));
                        const link = document.createElement("a");
                        link.href = url;
                        link.setAttribute("download", att.fileName);
                        document.body.appendChild(link);
                        link.click();
                        link.remove();
                      } catch (error) {
                        console.error("Failed to download attachment:", error);
                      }
                    }}
                    className="flex items-center text-blue-700 hover:text-blue-900 hover:bg-blue-50 text-sm p-2 rounded border bg-white w-full text-left transition-colors"
                  >
                    📎 {att.fileName}
                  </button>
                ))}
              </div>
            </div>
          )}

          {loadingAttachments && (
            <div className="text-center py-4">
              <div className="text-gray-600 text-sm flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600 mr-2"></div>
                Loading attachments...
              </div>
            </div>
          )}

          {attachmentError && (
            <div className="bg-red-50 border border-red-200 rounded p-3">
              <div className="text-red-700 text-sm flex items-center">
                <X className="mr-2" size={16} />
                {attachmentError}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t rounded-b-lg">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewPOModal;