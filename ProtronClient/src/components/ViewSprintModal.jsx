import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { X, FileText } from 'lucide-react';

const ViewSprintModal = ({ open, onClose, sprintData, projectName }) => {
  const [attachments, setAttachments] = useState([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);
  const [attachmentError, setAttachmentError] = useState(null);

  useEffect(() => {
    const fetchAttachments = async () => {
      if (!open || !sprintData?.sprintId) return;
      setLoadingAttachments(true);
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/sprints/${sprintData.sprintId}/attachments`, {
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
  }, [open, sprintData?.sprintId]);

  if (!open || !sprintData) return null;

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const d = new Date(dateString);
    if (isNaN(d)) return 'N/A';
    const day = String(d.getDate()).padStart(2, '0');
    const month = d.toLocaleString('en-US', { month: 'short' });
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const Field = ({ label, value, className = '' }) => (
    <div className={className}>
      <label className="text-xs font-medium text-gray-600 mb-1 block">{label}</label>
      <div className="text-sm text-gray-900 font-medium">{value || 'N/A'}</div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 bg-green-600 text-white rounded-t-lg">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <FileText size={20} />
              <div>
                <h2 className="text-lg font-bold">Sprint Details</h2>
                <p className="text-green-100 text-sm">{sprintData.sprintName || 'N/A'}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-green-700 rounded-lg transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Sprint Name" value={sprintData.sprintName} />
              <Field label="Project Name" value={projectName} />
              <Field label="Start Date" value={formatDate(sprintData.startDate)} />
              <Field label="End Date" value={formatDate(sprintData.endDate)} />
              <Field label="Created On" value={formatDate(sprintData.createdOn)} />
            </div>
          </div>

          {sprintData.description && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Description</h3>
              <div className="bg-white rounded p-3 border">
                <p className="text-sm text-gray-900 leading-relaxed whitespace-pre-wrap">{sprintData.description}</p>
              </div>
            </div>
          )}

          {(attachments?.length || 0) > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Attachments ({attachments.length})</h3>
              <div className="space-y-2">
                {attachments.map((att, idx) => (
                  <button
                    key={att.id || idx}
                    onClick={async () => {
                      try {
                        const response = await axios.get(
                          `${import.meta.env.VITE_API_URL}/api/sprints/attachments/${att.id}/download`,
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
                    className="flex items-center text-blue-700 hover:text-blue-900 hover:bg-blue-50 text-sm p-2 rounded border bg-white w-full text-left transition-colors"
                  >
                    📎 {att.fileName}
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

        <div className="px-6 py-4 bg-gray-50 border-t rounded-b-lg">
          <div className="flex justify-end">
            <button onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors">Close</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewSprintModal;


