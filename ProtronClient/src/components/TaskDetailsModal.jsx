import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  X,
  Calendar,
  Folder,
  CheckCircle,
  XCircle,
  Eye,
  Download,
  Clock,
  Edit3,
  Trash2,
  FileImage,
  FileVideo,
  Music,
  Archive,
  Paperclip,
  AlertCircle,
  User,
  Layout,
  ExternalLink
} from 'lucide-react';

const TaskDetailsModal = ({
  isOpen,
  onClose,
  taskDetail,
  onEdit,
  onDelete,
  employee,
  isEmployeeView,
  hasAccess = () => true,
  handleViewAttachment = () => { },
  handleDownloadAttachment = () => { },
  formatDateDisplay = (date) => {
    try {
      if (!date) return '';
      const d = new Date(date);
      const day = String(d.getDate()).padStart(2, '0');
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthStr = monthNames[d.getMonth()];
      const year = d.getFullYear();
      return `${day}-${monthStr}-${year}`;
    } catch (error) {
      return 'Invalid Date';
    }
  },
  truncateText = (text, length) => {
    if (!text || typeof text !== 'string') return '';
    return text.length > length ? text.substring(0, length) + '...' : text;
  }
}) => {
  const [previewAttachment, setPreviewAttachment] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  console.log(taskDetail)
  
  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Close preview on escape
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape' && previewAttachment) {
        setPreviewAttachment(null);
      }
    };

    if (previewAttachment) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [previewAttachment]);

  const handleEdit = useCallback(() => {
    if (!taskDetail) return;

    try {
      console.log("Editing task:", taskDetail);
      const updatedTask = {
        ...taskDetail,
        date: taskDetail.date ? new Date(taskDetail.date) : new Date()
      };
      onEdit?.(updatedTask);
    } catch (error) {
      console.error('Error editing task:', error);
    }
  }, [taskDetail, onEdit]);

  const handleDelete = useCallback(() => {
    if (!taskDetail) return;

    try {
      onDelete?.(taskDetail);
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  }, [taskDetail, onDelete]);

  const getFileIcon = useCallback((fileName) => {
    if (!fileName || typeof fileName !== 'string') return FileText;

    const ext = fileName.split('.').pop()?.toLowerCase();
    if (!ext) return FileText;

    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'].includes(ext)) {
      return FileImage;
    } else if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'].includes(ext)) {
      return FileVideo;
    } else if (['mp3', 'wav', 'flac', 'aac', 'ogg'].includes(ext)) {
      return Music;
    } else if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
      return Archive;
    }
    return FileText;
  }, []);

  const isImageFile = useCallback((fileName) => {
    if (!fileName || typeof fileName !== 'string') return false;
    const ext = fileName.split('.').pop()?.toLowerCase();
    return ext ? ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'].includes(ext) : false;
  }, []);

  const getMimeType = useCallback((fileName) => {
    if (!fileName || typeof fileName !== 'string') return 'application/octet-stream';

    const ext = fileName.split('.').pop()?.toLowerCase();
    const mimeTypes = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'bmp': 'image/bmp',
      'svg': 'image/svg+xml',
      'webp': 'image/webp',
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'txt': 'text/plain',
      'mp4': 'video/mp4',
      'mp3': 'audio/mpeg',
      'zip': 'application/zip'
    };

    return mimeTypes[ext] || 'application/octet-stream';
  }, []);

  const formatFileSize = useCallback((base64String) => {
    if (!base64String || typeof base64String !== 'string') return 'Unknown size';

    try {
      const base64Data = base64String.includes(',') ? base64String.split(',')[1] : base64String;
      const sizeInBytes = (base64Data.length * 3) / 4;

      if (sizeInBytes < 1024) {
        return `${Math.round(sizeInBytes)} B`;
      } else if (sizeInBytes < 1024 * 1024) {
        return `${(sizeInBytes / 1024).toFixed(1)} KB`;
      } else {
        return `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`;
      }
    } catch (error) {
      console.error('Error formatting file size:', error);
      return 'Unknown size';
    }
  }, []);

  const fetchAttachment = useCallback(async (attachmentId) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/timesheet-tasks/attachments/${attachmentId}`, {
        headers: {
          Authorization: `${sessionStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch attachment');
      }
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      return url;
    } catch (error) {
      console.error('Error fetching attachment:', error);
      throw new Error('Failed to fetch attachment');
    }
  }, []);

  const handlePreview = useCallback(async (attachment) => {
    if (!attachment) return;

    try {
      if (attachment.attachmentId) {
        const fileUrl = await fetchAttachment(attachment.attachmentId);
        console.log(fileUrl)
        const link = document.createElement('a');
        link.href = fileUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.click();

        console.log(`Opened ${attachment.fileName || 'attachment'} in new tab`);
      } else if (attachment.fileData) {
        const mimeType = getMimeType(attachment.fileName || '');
        let base64Data = attachment.fileData;

        if (!base64Data.startsWith('data:')) {
          const cleanBase64 = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
          base64Data = `data:${mimeType};base64,${cleanBase64}`;
        }

        const link = document.createElement('a');
        link.href = base64Data;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.click();
      } else {
        console.warn('No file data or attachment ID available for preview');
        setSnackbar({
          open: true,
          message: 'Unable to preview this attachment. File data is not available.',
          severity: 'warning',
        })
      }
    } catch (error) {
      console.error('Error opening attachment in new tab:', error);
      setSnackbar({
        open: true,
        message: 'Failed to open attachment. Please try again.',
        severity: 'error',
      });
    }
  }, [fetchAttachment, getMimeType]);

  const handleDownload = useCallback(async (attachment) => {
    if (!attachment) return;

    try {
      const fileName = attachment.fileName || 'downloaded_file';

      if (attachment.attachmentId) {
        const fileUrl = await fetchAttachment(attachment.attachmentId);
        const response = await fetch(fileUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        link.remove();

        window.URL.revokeObjectURL(url);
        console.log(`Downloaded ${fileName}`);
      } else if (attachment.fileData) {
        const mimeType = getMimeType(fileName);
        let base64Data = attachment.fileData;

        if (!base64Data.startsWith('data:')) {
          const cleanBase64 = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
          base64Data = `data:${mimeType};base64,${cleanBase64}`;
        }

        const link = document.createElement('a');
        link.href = base64Data;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        link.remove();

        console.log(`Downloaded ${fileName} from base64`);
      } else {
        console.warn('No file data or attachment ID available for download');
        setSnackbar({
          open: true,
          message: 'Unable to download this attachment. File data is not available.',
          severity: 'warning',
        });
      }
    } catch (error) {
      console.error('Error downloading attachment:', error);
      setSnackbar({
        open: true,
        message: 'Failed to download attachment. Please try again.',
        severity: 'error',
      });
    }
  }, [fetchAttachment, getMimeType]);

  // Early return if modal should not be shown
  if (!isOpen || !taskDetail) return null;

  const hasAttachments = Array.isArray(taskDetail.attachments) && taskDetail.attachments.length > 0;

  // Safe date handling
  const displayDate = (() => {
    try {
      return taskDetail.date ? formatDateDisplay(taskDetail.date) : 'No date';
    } catch (error) {
      return 'Invalid date';
    }
  })();

  console.log(taskDetail)

  return (
    <>
      {/* Main Modal */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-2 sm:p-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <div className="bg-white/95 backdrop-blur-xl rounded-xl sm:rounded-2xl lg:rounded-3xl shadow-2xl w-full max-w-sm sm:max-w-2xl md:max-w-4xl lg:max-w-6xl xl:max-w-7xl h-[95vh] sm:h-[90vh] lg:h-[85vh] border border-emerald-100/50 flex flex-col animate-in fade-in-0 zoom-in-95 duration-300">

          {/* Header */}
          <div className="bg-emerald-50 px-3 sm:px-6 lg:px-8 py-2 sm:py-3 border-b border-emerald-100 flex-shrink-0 rounded-t-xl sm:rounded-t-2xl lg:rounded-t-3xl">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
                <div className="p-2 sm:p-3 bg-emerald-500 rounded-lg sm:rounded-2xl shadow-lg flex-shrink-0">
                  <FileText className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900 truncate">Task Details</h2>
                </div>
              </div>
              
              <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                {/* Action Buttons */}
                <div className="flex gap-1 sm:gap-2">
                  {hasAccess("timesheet", "edit") && isEmployeeView && (
                    <button
                      onClick={handleEdit}
                      className="inline-flex items-center px-2 sm:px-3 py-1 bg-emerald-500 text-white rounded-lg sm:rounded-xl hover:bg-emerald-600 transition-all duration-200 font-semibold shadow-md hover:shadow-lg transform hover:scale-105 text-xs cursor-pointer"
                      aria-label="Edit task"
                    >
                      <Edit3 className="h-3 w-3 sm:mr-1.5" />
                      <span className="hidden sm:inline">Edit</span>
                    </button>
                  )}
                  {hasAccess("timesheet", "delete") && isEmployeeView && (
                    <button
                      onClick={handleDelete}
                      className="inline-flex items-center px-2 sm:px-3 py-1 bg-red-500 text-white rounded-lg sm:rounded-xl hover:bg-red-600 transition-all duration-200 font-semibold shadow-md hover:shadow-lg transform hover:scale-105 text-xs cursor-pointer"
                      aria-label="Delete task"
                    >
                      <Trash2 className="h-3 w-3 sm:mr-1.5" />
                      <span className="hidden sm:inline">Delete</span>
                    </button>
                  )}
                </div>
                
                <button
                  onClick={onClose}
                  className="p-2 sm:p-3 hover:bg-white/60 rounded-lg sm:rounded-2xl transition-all duration-200 group flex-shrink-0 cursor-pointer"
                  aria-label="Close modal"
                >
                  <X className="h-4 w-4 sm:h-6 sm:w-6 text-gray-500 group-hover:text-gray-700" />
                </button>
              </div>
            </div>
          </div>

          {/* Main Content - Responsive Layout */}
          <div className="flex-1 flex flex-col lg:flex-row gap-3 sm:gap-6 p-3 sm:p-6 min-h-0 overflow-hidden">
            
            {/* Left Section - Task Details */}
            <div className="flex-1 flex flex-col gap-3 sm:gap-6 min-w-0">
              
              {/* Basic Details Section */}
              <div className="bg-emerald-50 rounded-xl sm:rounded-2xl border border-emerald-100 p-3 sm:p-4 flex-shrink-0">
                {/* Task Topic and Type - Responsive */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                  <div className="w-1 sm:w-1.5 h-6 sm:h-8 bg-emerald-500 rounded-full flex-shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 break-words">
                      {taskDetail.taskTopic || "(No Topic Specified)"}
                    </h3>
                    <div className="mt-1 sm:mt-2">
                      <span className="inline-flex px-2 sm:px-3 py-1 sm:py-1.5 bg-emerald-500 text-white text-xs sm:text-sm font-medium rounded-lg">
                        {taskDetail.taskType || 'Unknown'}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Info Grid - Responsive */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
                  {/* Date */}
                  <div className="bg-white/80 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-100/50 shadow-sm">
                    <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Date</label>
                    <div className="flex items-center gap-2 mt-2">
                      <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 flex-shrink-0" />
                      <span className="text-gray-800 text-sm font-semibold truncate">
                        {displayDate}
                      </span>
                    </div>
                  </div>

                  {/* Project */}
                  <div className="bg-white/80 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 border border-teal-100/50 shadow-sm">
                    <label className="text-xs font-semibold text-teal-700 uppercase tracking-wider">Initiative</label>
                    <div className="flex items-center gap-2 mt-2">
                      <Folder className="h-3 w-3 sm:h-4 sm:w-4 text-teal-600 flex-shrink-0" />
                      <span
                        className="text-gray-800 text-sm font-semibold cursor-help hover:text-teal-700 transition-colors truncate"
                        title={taskDetail.project?.projectName || "No initiative assigned"}
                      >
                        {taskDetail.project?.projectName || "No initiative"}
                      </span>
                    </div>
                  </div>

                  {/* Hours */}
                  <div className="bg-white/80 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 border border-amber-100/50 shadow-sm">
                    <label className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Hours</label>
                    <div className="flex items-center gap-2 mt-2">
                      <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-amber-500 flex-shrink-0" />
                      <span className="inline-flex items-center px-2 py-1 rounded-lg bg-amber-500 text-white text-xs sm:text-sm font-bold">
                        {taskDetail.hoursSpent || 0}h {taskDetail.minutesSpent || 0}m
                      </span>
                    </div>
                  </div>

                  {/* Remaining Hours */}
                  <div className="bg-white/80 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 border border-blue-100/50 shadow-sm">
                    <label className="text-xs font-semibold text-blue-700 uppercase tracking-wider">Remaining Hours</label>
                    <div className="flex items-center gap-2 mt-2">
                      <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500 flex-shrink-0" />
                      <span className="inline-flex items-center px-2 py-1 rounded-lg bg-blue-500 text-white text-xs sm:text-sm font-bold">
                        {taskDetail.remainingHours || 0}h {taskDetail.remainingMinutes || 0}m
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description Section */}
              <div className="bg-slate-50 rounded-xl sm:rounded-2xl border border-gray-100 flex flex-col flex-1 min-h-0">
                <div className="p-3 sm:p-4 flex-1 flex flex-col">
                  <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4 flex-shrink-0">
                    <div className="w-1 sm:w-1.5 h-6 sm:h-8 bg-emerald-500 rounded-full"></div>
                    <h3 className="text-base sm:text-lg font-bold text-gray-900">Task Description</h3>
                  </div>
                  <div className="flex-1 bg-white/80 backdrop-blur-sm rounded-lg sm:rounded-xl p-4 sm:p-6 text-gray-700 break-words whitespace-pre-wrap overflow-y-auto border border-gray-200/50 shadow-sm custom-scrollbar min-h-0 max-w-full overflow-x-hidden">
                    {taskDetail.description ? (
                      <div className="break-words overflow-wrap-anywhere">{taskDetail.description}</div>
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-500">
                        <div className="text-center">
                          <FileText className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-2 sm:mb-3 text-gray-300" />
                          <p className="font-medium text-sm sm:text-base">No description provided</p>
                          <p className="text-xs sm:text-sm text-gray-400">This task doesn't have a description yet</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Section - Attachments */}
            <div className="w-full lg:w-1/3 flex flex-col min-w-0 min-h-0 lg:min-h-full">
              <div className="bg-blue-50 rounded-xl sm:rounded-2xl border border-blue-100 flex flex-col h-64 lg:h-full p-3 sm:p-6">
                <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4 flex-shrink-0">
                  <div className="w-1 sm:w-1.5 h-6 sm:h-8 bg-blue-500 rounded-full"></div>
                  <h3 className="text-base sm:text-xl font-bold text-gray-900">Attachments</h3>
                  {taskDetail.attachments && taskDetail.attachments.length > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                      {taskDetail.attachments.length}
                    </span>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                  {!hasAttachments ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                      <AlertCircle className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 mb-2 sm:mb-4" />
                      <p className="text-base sm:text-lg font-bold mb-1 sm:mb-2">No attachments</p>
                      <p className="text-gray-400 text-center text-xs sm:text-sm">No files attached to this task</p>
                    </div>
                  ) : (
                    <div className="space-y-2 sm:space-y-3">
                      {taskDetail.attachments.map((attachment, index) => {
                        if (!attachment) return null;
                        const FileIcon = getFileIcon(attachment.fileName);
                        const attachmentKey = attachment.attachmentId || `attachment-${index}`;

                        return (
                          <div
                            key={attachmentKey}
                            className="p-3 sm:p-4 bg-white/80 backdrop-blur-sm rounded-lg sm:rounded-xl hover:bg-white/90 transition-all duration-200 border border-blue-100/50 shadow-sm hover:shadow-md"
                          >
                            <div className="flex items-start gap-2 sm:gap-3 mb-2 sm:mb-3">
                              <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg flex-shrink-0">
                                <FileIcon className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div
                                  className="font-semibold text-gray-800 text-xs sm:text-sm leading-tight cursor-pointer break-words"
                                  title={attachment.fileName || `Attachment ${index + 1}`}
                                >
                                  {attachment.fileName || `Attachment ${index + 1}`}
                                </div>
                                <div className="text-xs text-gray-500 mt-1 font-medium">
                                  {attachment.fileSize ?
                                    `${(attachment.fileSize / 1024).toFixed(1)} KB` :
                                    formatFileSize(attachment.fileData)
                                  }
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={() => handleDownload(attachment)}
                              className="w-full inline-flex items-center justify-center px-2 sm:px-3 py-1.5 sm:py-2 bg-blue-500 text-white text-xs rounded-lg hover:bg-blue-600 transition-colors font-semibold shadow-sm hover:shadow-md transform hover:scale-105"
                              aria-label={`Download ${attachment.fileName || 'attachment'}`}
                              title="Download file"
                            >
                              <Download className="h-3 w-3 mr-1 sm:mr-1.5" />
                              <span>Download</span>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <style jsx>{`
          .custom-scrollbar {
            scrollbar-width: thin;
            scrollbar-color: #10b981 #f1f5f9;
          }
          .custom-scrollbar::-webkit-scrollbar {
            width: 4px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: #f1f5f9;
            border-radius: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #10b981;
            border-radius: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #059669;
          }
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes zoomIn {
            from { transform: scale(0.95); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
          }
          .animate-in {
            animation: fadeIn 0.3s ease-out, zoomIn 0.3s ease-out;
          }
          .fade-in-0 {
            animation-fill-mode: forwards;
          }
          .zoom-in-95 {
            animation-fill-mode: forwards;
          }
          .duration-300 {
            animation-duration: 0.3s;
          }
          .overflow-wrap-anywhere {
            overflow-wrap: anywhere;
            word-break: break-word;
          }
        `}</style>
      </div>

      <div>
        {snackbar.open && (
          <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
            snackbar.severity === 'error' ? 'bg-red-500 text-white' : 
            snackbar.severity === 'warning' ? 'bg-yellow-500 text-white' : 
            'bg-green-500 text-white'
          }`}>
            {snackbar.message}
          </div>
        )}
      </div>
    </>
  );
};

export default TaskDetailsModal;