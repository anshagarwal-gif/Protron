import React, { useState, useEffect } from 'react';
import { X, Calendar, DollarSign, FileText, Hash, Receipt, Target, CreditCard, Edit } from 'lucide-react';
import axios from 'axios';
import { useSession } from '../../Context/SessionContext'

const ViewSRNModal = ({ open, onClose, srnData, handleEdit }) => {
  const [attachments, setAttachments] = useState([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);
  const [attachmentError, setAttachmentError] = useState(null);
  const { sessionData } = useSession();
  const [srnLinkedPayments, setSrnLinkedPayments] = useState({});

  useEffect(() => {
    if (open && srnData?.srnId) {
      fetchSRNLinkedPayments(srnData.srnId);
      setLoadingAttachments(true);
      axios
        .get(`${import.meta.env.VITE_API_URL}/api/po-attachments/meta/filter?level=SRN&referenceId=${srnData.srnId}`, {
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
  }, [open, srnData?.srnId]);

  if (!open || !srnData) return null;

  const fetchSRNLinkedPayments = async (srnId) => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/srn/${srnId}/linked-amounts`,
        {
          headers: {
            Authorization: sessionData?.token
          }
        }
      );

      setSrnLinkedPayments(response.data);
    } catch (error) {
      console.error('Error fetching SRN linked payments:', error);
    }
  };


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

  // Get SRN type display name and tag styling
  const getSRNTypeDisplay = (type) => {
    switch (type) {
      case 'partial':
        return 'Partial';
      case 'full':
        return 'Full';
      default:
        return type || 'N/A';
    }
  };

  // Function to get tag styling for SRN Type
  const getSRNTypeTag = (type) => {
    const baseClasses = "px-2 py-1 rounded text-xs font-medium";
    switch (type) {
      case "full":
        return `${baseClasses} bg-green-100 text-green-800`;
      case "partial":
        return `${baseClasses} bg-blue-100 text-blue-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-700`;
    }
  };

  // Field component for consistent styling
  const Field = ({ label, value, className = "" }) => (
    <div className={className}>
      <label className="text-xs font-medium text-gray-600 mb-1 block">{label}</label>
      <div className="text-sm text-gray-900 font-medium">
        {value || "N/A"}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#00000059] bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 bg-green-600 text-white rounded-t-lg">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <Receipt size={24} />
              <div>
                <h2 className="text-xl font-bold">Payment Details</h2>
                <p className="text-green-100 text-sm">{srnData.srnName || 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button className="cursor-pointer p-2 hover:bg-green-700 rounded-lg transition-colors" onClick={() => {
                handleEdit(srnData.srnId)
              }}><Edit size={20} /></button>
              <button className="cursor-pointer p-2 hover:bg-green-700 rounded-lg transition-colors" onClick={onClose}>
                <X size={20} />
              </button>
            </div>
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
                label="Payment ID"
                value={srnData.srnId}
              />
              <Field
                label="PO Number"
                value={srnData.poNumber}
              />
              <Field
                label="PO Amount"
                value={formatCurrency(srnLinkedPayments?.poAmount, srnData.srnCurrency)}
              />
              <Field
                label="Milestone Amount"
                value={formatCurrency(srnLinkedPayments?.milestoneAmount, srnData.srnCurrency)}
              />
              <Field
                label="Amount Paid"
                value={formatCurrency(srnData.srnAmount, srnData.srnCurrency)}
              />
              <Field
                label="Currency"
                value={srnData.srnCurrency}
              />
              <Field
                label="Payment Type"
                value={<span className={getSRNTypeTag(srnData.srnType)}>{getSRNTypeDisplay(srnData.srnType)}</span>}
              />
              <Field
                label="Milestone"
                value={
                  srnData.milestone?.msName ||
                  srnData.msName ||
                  srnData.milestoneName ||
                  (srnData.msId ? `Milestone ID: ${srnData.msId}` : "No specific milestone")
                }
              />
              <Field
                label="Payment Date"
                value={formatDate(srnData.srnDate)}
              />
              <Field
                label="Created Date"
                value={formatDate(srnData.createdTimestamp)}
              />
            </div>
          </div>

          {/* Description */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
              <FileText className="mr-2 text-green-600" size={20} />
              Description
            </h3>
            <div className="bg-white rounded p-3 border">
              <p className="text-sm text-gray-900 leading-relaxed whitespace-pre-wrap">
                {srnData.srnDsc || "No description available"}
              </p>
            </div>
          </div>

          {/* Remarks */}
          {srnData.srnRemarks && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                <FileText className="mr-2 text-blue-600" size={20} />
                Remarks
              </h3>
              <div className="bg-white rounded p-3 border">
                <p className="text-sm text-gray-900 leading-relaxed whitespace-pre-wrap">
                  {srnData.srnRemarks}
                </p>
              </div>
            </div>
          )}

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


      </div>
    </div>
  );
};

export default ViewSRNModal;