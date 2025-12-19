import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  X,
  Paperclip,
  Image,
  Archive,
  File,
  Download,
  FileText,
  Target,
  Calendar,
  Edit
} from "lucide-react";

const SRNDetailsModal = ({ open, onClose, srnDetails, handleEdit }) => {
  const [attachments, setAttachments] = useState([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);
  const [attachmentError, setAttachmentError] = useState(null);

  useEffect(() => {
    if (open && srnDetails?.srnId) {
      setLoadingAttachments(true);
      const token = sessionStorage.getItem("token");

      axios
        .get(
          `${import.meta.env.VITE_API_URL}/api/po-attachments/meta/filter?level=SRN&referenceId=${srnDetails.srnId}`,
          {
            headers: {
              Authorization: `${token}`,
            },
          }
        )
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
  }, [open, srnDetails?.srnId]);

  const handleAttachmentClick = async (attachment) => {
    try {
      const token = sessionStorage.getItem("token");
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/po-attachments/${attachment.id}/download`,
        {
          responseType: "blob",
          headers: {
            Authorization: `${token}`,
          },
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", attachment.fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Failed to download attachment:", error);
    }
  };

  const getFileIcon = (fileName) => {
    if (!fileName) return <File size={16} />;
    const extension = fileName.split('.').pop()?.toLowerCase();

    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg'].includes(extension)) {
      return <Image size={16} className="text-green-600" />;
    } else if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension)) {
      return <Archive size={16} className="text-purple-600" />;
    } else {
      return <File size={16} className="text-blue-600" />;
    }
  };

  if (!open || !srnDetails) return null;

  const { milestone, poDetail } = srnDetails;

  // Format currency (matching other modals)
  const formatCurrency = (amount, currency = 'USD') => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  // Format date (matching other modals)
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const d = new Date(dateString);
    const day = String(d.getDate()).padStart(2, '0');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthStr = monthNames[d.getMonth()];
    const year = d.getFullYear();
    return `${day}-${monthStr}-${year}`;
  };

  // Function to get tag styling for SRN Type
  const getSrnTypeTag = (type) => {
    const baseClasses = "px-2 py-1 rounded text-xs font-medium";
    switch (type) {
      case "Full":
        return `${baseClasses} bg-emerald-100 text-emerald-800`;
      case "Partial":
        return `${baseClasses} bg-amber-100 text-amber-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-700`;
    }
  };

  // Function to get tag styling for PO Type
  const getPoTypeTag = (type) => {
    const baseClasses = "px-2 py-1 rounded text-xs font-medium";
    switch (type) {
      case "FIXED":
        return `${baseClasses} bg-emerald-100 text-emerald-800`;
      case "T&M":
        return `${baseClasses} bg-violet-100 text-violet-800`;
      case "MIXED":
        return `${baseClasses} bg-amber-100 text-amber-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-700`;
    }
  };

  // Field component for consistent styling (matching other modals)
  const Field = ({ label, value, className = "" }) => (
    <div className={className}>
      <label className="text-xs font-medium text-gray-600 mb-1 block">{label}</label>
      <div className="text-sm text-gray-900 font-medium">
        {value || "N/A"}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#00000059] bg-opacity-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-[95vw] sm:max-w-6xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 bg-green-600 text-white rounded-t-lg">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
              <FileText size={20} className="sm:w-6 sm:h-6 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <h2 className="text-lg sm:text-xl font-bold truncate">Payment Details</h2>
                <p className="text-green-100 text-xs sm:text-sm truncate">Payment: {srnDetails.srnName || 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button className="cursor-pointer p-2 hover:bg-green-700 rounded-lg transition-colors" onClick={() => {
                handleEdit(srnDetails.srnId)
              }}><Edit size={20} /></button>
              <button
                onClick={onClose}
                className="p-1.5 sm:p-2 hover:bg-green-700 rounded-lg transition-colors flex-shrink-0"
              >
                <X size={18} className="sm:w-5 sm:h-5" />
              </button>
            </div>

          </div>
        </div>

        <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
          {/* Basic SRN Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <FileText className="mr-2 text-green-600" size={20} />
              Basic Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <Field
                label="Payment Name"
                value={srnDetails.srnName}
              />
              <Field
                label="Payment Amount"
                value={formatCurrency(srnDetails.srnAmount, srnDetails.srnCurrency)}
              />
              <Field
                label="Payment Type"
                value={<span className={getSrnTypeTag(srnDetails.srnType)}>{srnDetails.srnType}</span>}
              />
              <Field
                label="Currency"
                value={srnDetails.srnCurrency}
              />
              <Field
                label="Payment Remarks"
                value={
                  srnDetails.srnRemarks ? (
                    <div className="bg-white rounded p-2 sm:p-3 border max-h-24 sm:max-h-32 overflow-y-auto">
                      <p className="text-xs sm:text-sm text-gray-900 leading-relaxed whitespace-pre-wrap break-words">
                        {srnDetails.srnRemarks}
                      </p>
                    </div>
                  ) : "N/A"
                }
                className="sm:col-span-2 lg:col-span-4"
              />
            </div>
          </div>

          {/* Milestone Information */}
          {milestone && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <Target className="mr-2 text-green-600" size={20} />
                Milestone Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <Field
                  label="Milestone Name"
                  value={milestone.msName}
                />
                <Field
                  label="Milestone Amount"
                  value={formatCurrency(milestone.msAmount, milestone.msCurrency)}
                />
                <Field
                  label="Milestone Date"
                  value={formatDate(milestone.msDate)}
                />
                <Field
                  label="Currency"
                  value={milestone.msCurrency}
                />
              </div>
            </div>
          )}

          {/* PO Information */}
          {poDetail && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <Calendar className="mr-2 text-green-600" size={20} />
                PO Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <Field
                  label="Project Name"
                  value={poDetail.projectName}
                />
                <Field
                  label="PO Amount"
                  value={formatCurrency(poDetail.poAmount, poDetail.poCurrency)}
                />
                <Field
                  label="PO Start Date"
                  value={formatDate(poDetail.poStartDate)}
                />
                <Field
                  label="PO Number"
                  value={poDetail.poNumber}
                />
                <Field
                  label="PO Type"
                  value={<span className={getPoTypeTag(poDetail.poType)}>{poDetail.poType}</span>}
                />
                <Field
                  label="Currency"
                  value={poDetail.poCurrency}
                />
              </div>
            </div>
          )}

          {/* SRN Description */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
              <FileText className="mr-2 text-green-600" size={20} />
              Payment Description
            </h3>
            <div className="bg-white rounded p-2 sm:p-3 border max-h-32 sm:max-h-40 overflow-y-auto">
              <p className="text-xs sm:text-sm text-gray-900 leading-relaxed whitespace-pre-wrap break-words">
                {srnDetails.srnDsc || "No description available"}
              </p>
            </div>
          </div>

          {/* Attachments */}
          {attachments.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                <Paperclip className="mr-2 text-green-600" size={20} />
                Attachments ({attachments.length})
              </h3>
              <div className="space-y-1 sm:space-y-2">
                {attachments.map((attachment, index) => (
                  <button
                    key={attachment.id || index}
                    onClick={() => handleAttachmentClick(attachment)}
                    className="flex items-center text-blue-700 hover:text-blue-900 hover:bg-blue-50 text-xs sm:text-sm p-2 sm:p-3 rounded border bg-white w-full text-left transition-colors"
                  >
                    <div className="flex-shrink-0 mr-2 sm:mr-3">
                      {getFileIcon(attachment.fileName || attachment.name || attachment.filename)}
                    </div>
                    <div className="flex-1 truncate min-w-0">
                      <span className="block truncate">
                        {attachment.fileName || attachment.name || attachment.filename || `Attachment ${index + 1}`}
                      </span>
                    </div>
                    <Download size={12} className="sm:w-3.5 sm:h-3.5 ml-1 sm:ml-2 flex-shrink-0" />
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

export default SRNDetailsModal;