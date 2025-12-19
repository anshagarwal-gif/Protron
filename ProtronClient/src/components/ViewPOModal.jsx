import React, { useState, useEffect } from 'react';
import { X, Calendar, DollarSign, User, Building, FileText, Hash, Clock, MapPin, Target, CreditCard, Users, Edit } from 'lucide-react';
import axios from 'axios';
import { useSession } from '../Context/SessionContext';

const ViewPOModal = ({ open, onClose, poData, handleViewCloseAndEditOpen }) => {
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
    const d = new Date(dateString);
    const day = String(d.getDate()).padStart(2, '0');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthStr = monthNames[d.getMonth()];
    const year = d.getFullYear();
    return `${day}-${monthStr}-${year}`;
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
      <div className="text-sm text-gray-900 font-medium break-words overflow-wrap-anywhere">
        {value || "N/A"}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm p-2 sm:p-4 lg:p-6">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-xs sm:max-w-2xl md:max-w-4xl lg:max-w-6xl xl:max-w-7xl max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 bg-green-600 text-white rounded-t-lg">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <FileText size={20} className="text-white sm:w-6 sm:h-6" />
              <div>
                <h2 className="text-base sm:text-lg lg:text-xl font-bold">Purchase Order Details</h2>
                <p className="text-green-100 text-xs sm:text-sm">PO #{poData.poNumber || 'N/A'}</p>
              </div>
            </div>
            <div className='flex items-center space-x-2 sm:space-x-3'>
              <button onClick={() => handleViewCloseAndEditOpen(poData.poId)} className="p-2 cursor-pointer hover:bg-green-700 text-white rounded-lg transition-colors"><Edit size={20} /></button>
              <button
                onClick={onClose}
                className="p-2 cursor-pointer hover:bg-green-700 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Basic Information */}
          <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4 flex items-center">
              <Hash className="mr-2 text-green-600" size={20} />
              Basic Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
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
          <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 flex items-center">
              <FileText className="mr-2 text-green-600" size={20} />
              Description
            </h3>
            <div className="bg-white rounded p-3 border">
              <p className="text-sm text-gray-900 leading-relaxed break-words overflow-wrap-anywhere whitespace-pre-wrap">
                {poData.poDesc || "No description available"}
              </p>
            </div>
          </div>

          {/* Attachments */}
          {attachments.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 flex items-center">
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
                    className="flex items-center text-blue-700 hover:text-blue-900 hover:bg-blue-50 text-sm p-2 rounded border bg-white w-full text-left transition-colors break-words overflow-wrap-anywhere"
                  >
                    📎 <span className="break-words overflow-wrap-anywhere">{att.fileName}</span>
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
        <div className="px-4 sm:px-6 py-4 bg-gray-50 border-t rounded-b-lg">
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