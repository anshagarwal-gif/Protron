import React, {useState, useEffect} from "react";
import axios from "axios";
import { X, Paperclip, Image, Archive, File, Download } from "lucide-react";

const SRNDetailsModal = ({ open, onClose, srnDetails }) => {

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

  // Function to get tag styling for SRN Type
  const getSrnTypeTag = (type) => {
    const baseClasses = "px-3 py-1.5 rounded-lg text-sm font-medium inline-flex items-center";
    switch (type) {
      case "Full":
        return `${baseClasses} bg-emerald-100 text-emerald-700 border border-emerald-200`;
      case "Partial":
        return `${baseClasses} bg-amber-100 text-amber-700 border border-amber-200`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-700 border border-gray-200`;
    }
  };

  // Function to get tag styling for PO Type
  const getPoTypeTag = (type) => {
    const baseClasses = "px-3 py-1.5 rounded-lg text-sm font-medium inline-flex items-center";
    switch (type) {
      case "FIXED":
        return `${baseClasses} bg-blue-100 text-blue-700 border border-blue-200`;
      case "T&M":
        return `${baseClasses} bg-purple-100 text-purple-700 border border-purple-200`;
      case "MIXED":
        return `${baseClasses} bg-orange-100 text-orange-700 border border-orange-200`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-700 border border-gray-200`;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#000000c2] bg-opacity-50 p-2">
      <div className="bg-white rounded-2xl shadow-2xl max-w-7xl h-[90vh] overflow-auto w-full border border-gray-100">
        {/* Header */}
        <div 
          className="px-8 py-3 flex justify-between items-center rounded-t-2xl"
          style={{ backgroundColor: 'var(--color-green-800)' }}
        >
          <div className="flex items-center space-x-3">
            <div>
              <h2 className="text-2xl font-bold text-white">SRN Details</h2>
              <p className="text-green-100 text-sm">Comprehensive SRN overview and management</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-all duration-200"
          >
            <X size={24} className="text-white hover:text-black" />
          </button>
        </div>

        <div className="p-8">
          {/* Top Row - Main Information */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Left Column - SRN Information */}
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-6">SRN INFORMATION</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600 uppercase tracking-wide">SRN Name</label>
                  <p className="text-gray-900 font-medium mt-1 break-words overflow-wrap-anywhere">{srnDetails.srnName || "N/A"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 uppercase tracking-wide">SRN Amount</label>
                  <p className="text-gray-900 font-medium mt-1">
                    {srnDetails.srnAmount || "N/A"} {srnDetails.srnCurrency || ""}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 uppercase tracking-wide">SRN Type</label>
                  <div className="mt-2">
                    <span className={getSrnTypeTag(srnDetails.srnType)}>
                      {srnDetails.srnType || "N/A"}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 uppercase tracking-wide">SRN Remarks</label>
                  <p className="text-gray-900 mt-1 break-words overflow-wrap-anywhere">{srnDetails.srnRemarks || "N/A"}</p>
                </div>
              </div>
            </div>

            {/* Right Column - Milestone or PO Details */}
            <div>
              {milestone ? (
                <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl p-6 border border-teal-100 h-full">
                  <h3 className="text-lg font-semibold text-teal-800 mb-6">MILESTONE DETAILS</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium text-teal-700 uppercase tracking-wide">Milestone Name</label>
                      <p className="text-gray-900 font-medium mt-1 break-words overflow-wrap-anywhere">{milestone.msName || "N/A"}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-teal-700 uppercase tracking-wide">Milestone Amount</label>
                      <p className="text-gray-900 font-medium mt-1">
                        {milestone.msAmount || "N/A"} {milestone.msCurrency || ""}
                      </p>
                    </div>
                    <div className="">
                      <label className="text-sm font-medium text-teal-700 uppercase tracking-wide">Milestone Date</label>
                      <div className="mt-2  items-center ">
                        <span className="text-gray-900 font-medium">
                          {milestone.msDate ? new Date(milestone.msDate).toLocaleDateString() : "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-6 border border-emerald-100 h-full">
                  <h3 className="text-lg font-semibold text-emerald-800 mb-6">PO DETAILS</h3>
                  <div className="grid grid-cols-3  gap-4">
                    <div>
                      <label className="text-sm font-medium text-emerald-700 uppercase tracking-wide">Project Name</label>
                      <p className="text-gray-900 font-medium mt-1 break-words overflow-wrap-anywhere">{poDetail.projectName || "N/A"}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-emerald-700 uppercase tracking-wide">PO Amount</label>
                      <p className="text-gray-900 font-medium mt-1">
                        {poDetail.poAmount || "N/A"} {poDetail.poCurrency || ""}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-emerald-700 uppercase tracking-wide">PO Start Date</label>
                      <div className="mt-2 items-center ">
                        <span className="text-gray-900 font-medium">
                          {poDetail.poStartDate ? new Date(poDetail.poStartDate).toLocaleDateString() : "N/A"}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-emerald-700 uppercase tracking-wide">PO Number</label>
                      <p className="text-gray-900 font-medium mt-1 break-words overflow-wrap-anywhere">{poDetail.poNumber || "N/A"}</p>
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium text-emerald-700 uppercase tracking-wide">PO Type</label>
                      <div className="mt-2">
                        <span className={getPoTypeTag(poDetail.poType)}>
                          {poDetail.poType || "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Row - Description Section */}
          <div className="">
            {/* SRN Description */}
            <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
              <h3 className="text-lg font-semibold text-blue-800 mb-4">SRN DESCRIPTION</h3>
              <div className="min-h-[120px]">
                <p className="text-gray-900 leading-relaxed whitespace-pre-wrap break-words overflow-wrap-anywhere">
                  {srnDetails.srnDsc || "No description available"}
                </p>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 mt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
              <Paperclip size={20} className="mr-2" />
              ATTACHMENTS ({attachments.length})
            </h3>

            {loadingAttachments && (
              <div className="text-gray-500 text-sm">Loading attachments...</div>
            )}
            {attachmentError && (
              <div className="text-red-500 text-sm">{attachmentError}</div>
            )}

            {attachments.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-48 overflow-y-auto">
                {attachments.map((attachment, index) => (
                  <div
                    key={index}
                    onClick={() => handleAttachmentClick(attachment)}
                    className="flex items-center p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group"
                  >
                    <div className="flex-shrink-0 mr-3">
                      {getFileIcon(attachment.fileName || attachment.name || attachment.filename)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-sm font-medium text-gray-900 truncate group-hover:text-blue-600"
                        title={attachment.fileName || attachment.name || attachment.filename}
                      >
                        {attachment.fileName || attachment.name || attachment.filename || `Attachment ${index + 1}`}
                      </p>
                    </div>
                    <Download size={14} className="text-gray-400 group-hover:text-blue-600" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Paperclip size={48} className="mx-auto text-gray-300 mb-2" />
                <p className="text-gray-500">No attachments available</p>
              </div>
            )}
          </div>
          </div>

          
        </div>
      </div>
    </div>
  );
};

export default SRNDetailsModal;