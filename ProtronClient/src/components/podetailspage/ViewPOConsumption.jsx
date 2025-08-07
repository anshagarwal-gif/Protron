import React, { useState, useEffect } from 'react';
import { X, Calendar, DollarSign, User, Building, FileText, Hash, Activity, Briefcase, Target, CreditCard } from 'lucide-react';
import axios from 'axios';
import { useSession } from '../../Context/SessionContext'

const ViewPOConsumptionModal = ({ open, onClose, consumptionData }) => {
  const [attachments, setAttachments] = useState([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);
  const [attachmentError, setAttachmentError] = useState(null);
  const { sessionData } = useSession();

  useEffect(() => {
    if (open && consumptionData?.utilizationId) {
      setLoadingAttachments(true);
      axios
        .get(`${import.meta.env.VITE_API_URL}/api/po-attachments/meta/filter?level=CONSUMPTION&referenceId=${consumptionData.utilizationId}`, {
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
  }, [open, consumptionData?.utilizationId]);

  if (!open || !consumptionData) return null;

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

  // Get utilization type display name and tag styling
  const getUtilizationTypeDisplay = (type) => {
    switch (type) {
      case 'T&M':
        return 'Time & Material';
      case 'Fixed':
        return 'Fixed Price';
      case 'Mixed':
        return 'Mixed';
      default:
        return type || 'N/A';
    }
  };

  // Function to get tag styling for Utilization Type
  const getUtilizationTypeTag = (type) => {
    const baseClasses = "px-2 py-1 rounded text-xs font-medium";
    switch (type) {
      case "Fixed":
        return `${baseClasses} bg-green-100 text-green-800`;
      case "T&M":
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case "Mixed":
        return `${baseClasses} bg-gray-100 text-gray-700`;
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 bg-green-600 text-white rounded-t-lg">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <Activity size={24} />
              <div>
                <h2 className="text-xl font-bold">PO Consumption Details</h2>
                <p className="text-green-100 text-sm">PO #{consumptionData.poNumber || 'N/A'}</p>
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
                value={consumptionData.poNumber}
              />
              <Field
                label="Amount"
                value={formatCurrency(consumptionData.amount, consumptionData.currency)}
              />
              <Field
                label="Currency"
                value={consumptionData.currency}
              />
              <Field
                label="Utilization Type"
                value={<span className={getUtilizationTypeTag(consumptionData.utilizationType)}>{getUtilizationTypeDisplay(consumptionData.utilizationType)}</span>}
              />
              <Field
                label="Milestone"
                value={
                  consumptionData.milestone?.msName || 
                  consumptionData.msName || 
                  consumptionData.milestoneName ||
                  (consumptionData.msId ? `Milestone ID: ${consumptionData.msId}` : "No specific milestone")
                }
              />
              <Field
                label="Resource"
                value={consumptionData.resource}
              />
              <Field
                label="Project"
                value={consumptionData.project}
              />
              <Field
                label="System Name"
                value={consumptionData.systemName}
              />
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <Calendar className="mr-2 text-blue-600" size={20} />
              Timeline
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field
                label="Work Assign Date"
                value={formatDate(consumptionData.workAssignDate)}
              />
              <Field
                label="Work Completion Date"
                value={formatDate(consumptionData.workCompletionDate)}
              />
            </div>
          </div>

          {/* Work Description */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
              <FileText className="mr-2 text-green-600" size={20} />
              Work Description
            </h3>
            <div className="bg-white rounded p-3 border">
              <p className="text-sm text-gray-900 leading-relaxed whitespace-pre-wrap">
                {consumptionData.workDesc || "No work description available"}
              </p>
            </div>
          </div>

          {/* Remarks */}
          {consumptionData.remarks && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                <FileText className="mr-2 text-blue-600" size={20} />
                Remarks
              </h3>
              <div className="bg-white rounded p-3 border">
                <p className="text-sm text-gray-900 leading-relaxed whitespace-pre-wrap">
                  {consumptionData.remarks}
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

export default ViewPOConsumptionModal;