import React, { useState, useEffect } from 'react';
import { X, Calendar, DollarSign, FileText, Hash, Clock } from 'lucide-react';
import axios from 'axios';
import { useSession } from '../Context/SessionContext';

const ViewMilestoneModal = ({ open, onClose, milestoneData }) => {
  const [attachments, setAttachments] = useState([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);
  const [attachmentError, setAttachmentError] = useState(null);
  const { sessionData } = useSession();

  useEffect(() => {
    if (open && milestoneData?.msId) {
      setLoadingAttachments(true);
      axios
        .get(`${import.meta.env.VITE_API_URL}/api/po-attachments/meta/filter?level=MS&referenceId=${milestoneData.msId}`, {
          headers: {
            Authorization: sessionData?.token,
          },
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
  }, [open, milestoneData?.msId]);

  if (!open || !milestoneData) return null;

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
      day: 'numeric',
    });
  };

  // Field component for consistent styling
  const Field = ({ label, value, icon: Icon, className = "", colSpan = 1 }) => (
    <div className={`${colSpan > 1 ? `col-span-${colSpan}` : ''} ${className}`}>
      <div className="flex items-center mb-2">
        {Icon && <Icon size={16} className="text-slate-500 mr-2" />}
        <label className="text-sm font-semibold text-slate-600 uppercase tracking-wide">{label}</label>
      </div>
      <div className="text-slate-900 font-medium break-words overflow-wrap-anywhere">
        {value || "N/A"}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0000006b] bg-opacity-60 p-4 scrollbar-hide">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full border border-slate-200 max-h-[90vh] overflow-y-auto scrollbar-hide">
        {/* Header */}
        <div className="px-8 py-6 bg-gradient-to-r from-blue-800 to-blue-900 rounded-t-3xl">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="bg-white bg-opacity-20 p-3 rounded-xl">
                <FileText size={28} className="text-black" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-white">Milestone Details</h2>
                <p className="text-slate-300 mt-1">Milestone #{milestoneData.msId || 'N/A'}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-3 hover:bg-white hover:bg-opacity-20 rounded-xl transition-all duration-200 group"
            >
              <X size={24} className="text-white group-hover:text-slate-200" />
            </button>
          </div>
        </div>

        <div className="p-8 space-y-8">
          {/* Overview Section */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
            <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
              <Hash className="mr-3 text-blue-600" size={24} />
              Milestone Overview
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Field
                label="Milestone Name"
                value={milestoneData.milestoneName}
                icon={FileText}
              />
              <Field
                label="Milestone Amount"
                value={formatCurrency(milestoneData.milestoneAmount, milestoneData.milestoneCurrency)}
                icon={DollarSign}
              />
              <Field
                label="Start Date"
                value={formatDate(milestoneData.startDate)}
                icon={Calendar}
              />
              <Field
                label="End Date"
                value={formatDate(milestoneData.endDate)}
                icon={Calendar}
              />
              <Field
                label="Duration (Days)"
                value={milestoneData.duration}
                icon={Clock}
              />
              <Field
                label="Remark"
                value={milestoneData.remark}
                icon={FileText}
                colSpan={2}
              />
            </div>
          </div>

          {/* Description Section */}
          <div className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-2xl p-6 border border-slate-100">
            <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
              <FileText className="mr-3 text-slate-600" size={24} />
              Milestone Description
            </h3>
            <div className="bg-white rounded-xl p-6 border border-slate-200 min-h-[120px]">
              <p className="text-slate-900 leading-relaxed whitespace-pre-wrap break-words overflow-wrap-anywhere">
                {milestoneData.milestoneDescription || "No description available"}
              </p>
            </div>
          </div>

          {/* Attachments Section */}
          {attachments.length > 0 && (
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100">
              <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
                <FileText className="mr-3 text-emerald-600" size={24} />
                Attachments
              </h3>
              <div className="space-y-3">
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

                        // Create a temporary link to download the file
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
                    className="block text-blue-700 hover:underline truncate"
                  >
                    📎 {att.fileName}
                  </button>
                ))}
              </div>
            </div>
          )}
          {loadingAttachments && (
            <div className="text-slate-600 text-sm mt-4">Loading attachments...</div>
          )}
          {attachmentError && (
            <div className="text-red-500 text-sm mt-4">{attachmentError}</div>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-4 bg-slate-50 rounded-b-3xl border-t border-slate-200">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-colors duration-200 font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewMilestoneModal;