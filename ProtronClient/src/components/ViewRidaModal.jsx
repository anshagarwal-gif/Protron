import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { X, FileText, Tag, Calendar, User, UserCheck, CheckCircle, MessageSquare } from 'lucide-react';

const ViewRidaModal = ({ open, onClose, ridaData }) => {
  const [attachments, setAttachments] = useState([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);
  const [attachmentError, setAttachmentError] = useState(null);

  useEffect(() => {
    const fetchAttachments = async () => {
      if (!open || !ridaData?.id) return;
      setLoadingAttachments(true);
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/rida/${ridaData.id}/attachments`, {
          headers: { authorization: `${sessionStorage.getItem('token')}` },
        });
        if (!res.ok) throw new Error('Failed to fetch attachments');
        const data = await res.json();
        setAttachments(data || []);
        setAttachmentError(null);
      } catch (e) {
        setAttachmentError('Failed to load attachments.');
        setAttachments([]);
      } finally {
        setLoadingAttachments(false);
      }
    };
    fetchAttachments();
  }, [open, ridaData?.id]);

  if (!open || !ridaData) return null;

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const d = new Date(dateString);
    if (isNaN(d)) return 'N/A';
    const day = String(d.getDate()).padStart(2, '0');
    const month = d.toLocaleString('en-US', { month: 'short' });
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return 'N/A';
    const d = new Date(dateTimeString);
    if (isNaN(d)) return 'N/A';
    const day = String(d.getDate()).padStart(2, '0');
    const month = d.toLocaleString('en-US', { month: 'short' });
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}-${month}-${year} ${hours}:${minutes}`;
  };

  const Field = ({ label, value, className = '', isDate }) => (
    <div className={className}>
      <label className="text-xs font-medium text-gray-600 mb-1 block">{label}</label>
      <div className="text-sm text-gray-900 font-medium break-words overflow-wrap-anywhere">{isDate ? formatDate(value) : (value || 'N/A')}</div>
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
                <h2 className="text-base sm:text-lg lg:text-xl font-bold">RIDA Details</h2>
                <p className="text-green-100 text-xs sm:text-sm">ID: {ridaData.meetingReference || 'N/A'}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-green-700 rounded-full transition-colors cursor-pointer">
              <X size={20} className="text-white" />
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Completion Information - Only show if RIDA is completed */}
          {ridaData.completed && (
              <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4 flex items-center">
                  <CheckCircle className="mr-2 text-green-600" size={18} />
                  Completion Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                  <div className="bg-white rounded p-3 border">
                    <label className="text-xs font-medium text-gray-600 mb-1 block">Status</label>
                    <div className="text-sm font-medium text-green-600 flex items-center break-words overflow-wrap-anywhere">
                      <CheckCircle size={14} className="mr-1" />
                      Completed
                    </div>
                  </div>
                  <div className="bg-white rounded p-3 border">
                    <label className="text-xs font-medium text-gray-600 mb-1 block">Completed By</label>
                    <div className="text-sm font-medium text-gray-900 break-words overflow-wrap-anywhere">{ridaData.completedBy || 'N/A'}</div>
                  </div>
                  <div className="bg-white rounded p-3 border">
                    <label className="text-xs font-medium text-gray-600 mb-1 block">Completed At</label>
                    <div className="text-sm font-medium text-gray-900 break-words overflow-wrap-anywhere">{formatDateTime(ridaData.completedAt)}</div>
                  </div>
                </div>
              </div>
          )}
          <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
              <Field label="Type" value={ridaData.type} />
              <Field label="Meeting Reference" value={ridaData.meetingReference} />
              <Field label="Raised By" value={ridaData.raisedBy} />
              <Field label="Owner" value={ridaData.owner} />
              <Field label="Status" value={ridaData.status} />
              <Field label="Date Raised" value={ridaData.dateRaised} isDate />
              <Field label="Target Closer" value={ridaData.targetCloser} isDate />
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4 flex items-center">
              <MessageSquare className="mr-2 text-green-600" size={18} />
              Description
            </h3>
            <div className="bg-white rounded p-3 border">
              <p className="text-sm text-gray-900 leading-relaxed break-words overflow-wrap-anywhere whitespace-pre-wrap">{ridaData.itemDescription || 'No description available'}</p>
            </div>
          </div>

          {ridaData.remarks && (
            <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4">Remarks</h3>
              <div className="bg-white rounded p-3 border">
                <p className="text-sm text-gray-900 leading-relaxed break-words overflow-wrap-anywhere whitespace-pre-wrap">{ridaData.remarks}</p>
              </div>
            </div>
          )}

          

          {(attachments?.length || 0) > 0 && (
            <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4 flex items-center">
                <FileText className="mr-2 text-green-600" size={18} />
                Attachments ({attachments.length})
              </h3>
              <div className="space-y-2">
                {attachments.map((att, idx) => (
                  <button
                    key={att.id || idx}
                    onClick={async () => {
                      try {
                        const response = await axios.get(
                          `${import.meta.env.VITE_API_URL}/api/rida/attachments/${att.id}/download`,
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

export default ViewRidaModal;


