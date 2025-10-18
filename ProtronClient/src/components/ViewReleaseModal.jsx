import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { X, FileText, Hash, Calendar } from 'lucide-react';

const ViewReleaseModal = ({ open, onClose, releaseData }) => {
  // Truncate project name after 25 characters
  const truncate = (str, n = 25) => str && str.length > n ? str.slice(0, n) + '...' : str;
  const [attachments, setAttachments] = useState([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);
  const [attachmentError, setAttachmentError] = useState(null);

  useEffect(() => {
    const fetchAttachments = async () => {
      if (!open || !releaseData?.releaseId) return;
      setLoadingAttachments(true);
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/releases/${releaseData.releaseId}/attachments`, {
          headers: { authorization: `${sessionStorage.getItem('token')}` },
        });
        if (!res.ok) throw new Error('Failed');
        const data = await res.json();
        setAttachments(data || []);
        setAttachmentError(null);
      } catch (e) {
        setAttachments([]);
        setAttachmentError('Failed to load attachments.');
      } finally {
        setLoadingAttachments(false);
      }
    };
    fetchAttachments();
  }, [open, releaseData?.releaseId]);

  if (!open || !releaseData) return null;

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const d = new Date(dateString);
    if (isNaN(d)) return 'N/A';
    const day = String(d.getDate()).padStart(2, '0');
    const month = d.toLocaleString('en-US', { month: 'short' });
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    // If time is in hh:mm:ss, show as is, else fallback
    return /^\d{2}:\d{2}:\d{2}$/.test(timeString) ? timeString : timeString;
  };

  const Field = ({ label, value, className = '' }) => (
    <div className={className}>
      <label className="text-xs font-medium text-gray-600 mb-1 block">{label}</label>
      <div className="text-sm text-gray-900 font-medium break-words overflow-wrap-anywhere">{value || 'N/A'}</div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm p-2 sm:p-4 lg:p-6">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-xs sm:max-w-2xl md:max-w-4xl lg:max-w-6xl xl:max-w-7xl max-h-[95vh] overflow-y-auto">
        <div className="px-4 sm:px-6 py-4 bg-green-600 text-white rounded-t-lg">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <FileText size={20} className="text-white sm:w-6 sm:h-6" />
              <div>
                <h2 className="text-base sm:text-lg lg:text-xl font-bold">Release Details</h2>
                <p className="text-green-100 text-xs sm:text-sm">ID: {releaseData.releaseName || 'N/A'}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-green-700 rounded-full transition-colors cursor-pointer">
              <X size={20} className="text-white" />
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
              <Field label="Release Name" value={releaseData.releaseName} />
              <Field label="Project Name" value={truncate(releaseData.projectName)} />
              <Field label="Start Date" value={formatDate(releaseData.startDate)} />
              <Field label="Start Time" value={formatTime(releaseData.startTime)} />
              <Field label="End Date" value={formatDate(releaseData.endDate)} />
              <Field label="End Time" value={formatTime(releaseData.endTime)} />
              <Field label="Created On" value={formatDate(releaseData.createdOn)} />
            </div>
          </div>

          {releaseData.description && (
            <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4">Description</h3>
              <div className="bg-white rounded p-3 border">
                <p className="text-sm text-gray-900 leading-relaxed break-words overflow-wrap-anywhere whitespace-pre-wrap">{releaseData.description}</p>
              </div>
            </div>
          )}

          {(attachments?.length || 0) > 0 && (
            <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4">Attachments ({attachments.length})</h3>
              <div className="space-y-2">
                {attachments.map((att, idx) => (
                  <button
                    key={att.id || idx}
                    onClick={async () => {
                      try {
                        const response = await axios.get(
                          `${import.meta.env.VITE_API_URL}/api/releases/attachments/${att.id}/download`,
                          {
                            responseType: 'blob',
                            headers: { Authorization: sessionStorage.getItem('token') },
                          }
                        );
                        const url = window.URL.createObjectURL(new Blob([response.data]));
                        const link = document.createElement('a');
                        link.href = url;
                        link.setAttribute('download', att.fileName || `attachment-${att.id}`);
                        document.body.appendChild(link);
                        link.click();
                        link.remove();
                      } catch (error) {
                        console.error('Failed to download attachment:', error);
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
            <div className="text-center py-2 text-sm text-gray-600">Loading attachments...</div>
          )}

          {attachmentError && (
            <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-700">{attachmentError}</div>
          )}
        </div>

        <div className="px-4 sm:px-6 py-4 bg-gray-50 border-t rounded-b-lg">
          <div className="flex justify-end">
            <button onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors">Close</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewReleaseModal;


