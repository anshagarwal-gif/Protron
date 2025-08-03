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
import GlobalSnackbar from './GlobalSnackbar';
import axios from 'axios';


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
      return new Date(date).toLocaleDateString();
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
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/timesheet-tasks/attachments/${attachmentId}`, {
        responseType: 'blob',
         headers: {
          Authorization: `${sessionStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });
      const blob = new Blob([response.data], { type: response.headers['content-type'] });
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
        // Fetch the file as a blob and preview it
        const fileUrl = await fetchAttachment(attachment.attachmentId);
        console.log(fileUrl)
        const link = document.createElement('a');
        link.href = fileUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.click();

        console.log(`Opened ${attachment.fileName || 'attachment'} in new tab`);
      } else if (attachment.fileData) {
        // Optional: Support inline base64 preview if available
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
      // Fetch file blob from server and download
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

      window.URL.revokeObjectURL(url); // Clean up
      console.log(`Downloaded ${fileName}`);
    } else if (attachment.fileData) {
      // Handle base64 file data
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


  // Enhanced function to download attachment
  
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

  const tabs = [
    {
      id: 'overview',
      label: 'Overview',
      icon: Layout,
      count: null
    },
    {
      id: 'attachments',
      label: 'Attachments',
      icon: Paperclip,
      count: hasAttachments ? taskDetail.attachments.length : 0
    }
  ];

  return (
    <>
      {/* Main Modal */}
      <div
  className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-2 sm:p-4 md:p-6"
  onClick={(e) => e.target === e.currentTarget && onClose()}
>
  <div className="bg-white/95 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-sm sm:max-w-2xl md:max-w-4xl lg:max-w-6xl xl:max-w-7xl h-[90vh] sm:h-[85vh] border border-emerald-100/50 flex flex-col animate-in fade-in-0 zoom-in-95 duration-300">

    {/* Header */}
    <div className="bg-emerald-50 px-8 py-3 border-b border-emerald-100 flex-shrink-0 rounded-t-3xl">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-500 rounded-2xl shadow-lg">
            <FileText className="h-4 w-4 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Task Details</h2>
          </div>
        </div>
        <div className='flex'>
          <div className="flex gap-2">
            {hasAccess("timesheet", "edit") && isEmployeeView && (
              <button
                onClick={handleEdit}
                className="inline-flex items-center px-3 py-1 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-all duration-200 font-semibold shadow-md hover:shadow-lg transform hover:scale-105 text-xs"
                aria-label="Edit task"
              >
                <Edit3 className="h-3 w-3 mr-1.5" />
                Edit
              </button>
            )}
            {hasAccess("timesheet", "delete") && isEmployeeView && (
              <button
                onClick={handleDelete}
                className="inline-flex items-center px-3 py-1 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all duration-200 font-semibold shadow-md hover:shadow-lg transform hover:scale-105 text-xs"
                aria-label="Delete task"
              >
                <Trash2 className="h-3 w-3 mr-1.5" />
                Delete
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-3 hover:bg-white/60 rounded-2xl transition-all duration-200 group"
            aria-label="Close modal"
          >
            <X className="h-6 w-6 text-gray-500 group-hover:text-gray-700" />
          </button>
        </div>
      </div>
    </div>

    {/* Main Content - Two Column Layout */}
    <div className="flex-1 flex gap-6 p-6 min-h-0 overflow-hidden">
      
      {/* Left Section - Task Details */}
      <div className="flex-1 flex flex-col gap-6 min-w-0">
        
        {/* Basic Details Section */}
        <div className="bg-emerald-50 rounded-2xl border border-emerald-100 p-3 flex-shrink-0">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-1.5 h-8 bg-emerald-500 rounded-full"></div>
            <h3 className="text-lg font-bold text-gray-900">{taskDetail.taskTopic || "(No Topic Specified)"} <span className="inline-flex ml-3 px-3 py-1.5 bg-emerald-500 text-white text-sm font-medium rounded-lg truncate max-w-full">
                  {taskDetail.taskType || 'Unknown'}
                </span> </h3>
          </div>
          
          <div className="grid grid-cols-4 gap-4">

            {/* Date */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-gray-100/50 shadow-sm">
              <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Date</label>
              <div className="flex items-center gap-2 mt-2">
                <Calendar className="h-4 w-4 text-gray-500 flex-shrink-0" />
                <span className="text-gray-800 text-sm font-semibold truncate">
                  {displayDate}
                </span>
              </div>
            </div>

            {/* Project */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-teal-100/50 shadow-sm">
              <label className="text-xs font-semibold text-teal-700 uppercase tracking-wider">Project</label>
              <div className="flex items-center gap-2 mt-2">
                <Folder className="h-4 w-4 text-teal-600 flex-shrink-0" />
                <span
                  className="text-gray-800 text-sm font-semibold cursor-help hover:text-teal-700 transition-colors truncate"
                  title={taskDetail.project?.projectName || "No project assigned"}
                >
                  {taskDetail.project?.projectName || "No project"}
                </span>
              </div>
            </div>

            {/* Hours */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-amber-100/50 shadow-sm">
              <label className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Hours</label>
              <div className="flex items-center gap-2 mt-2">
                <Clock className="h-4 w-4 text-amber-500 flex-shrink-0" />
                <span className="inline-flex items-center px-2 py-1 rounded-lg bg-amber-500 text-white text-sm font-bold">
                  {taskDetail.hoursSpent || 0}h {taskDetail.minutesSpent || 0}m
                </span>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-amber-100/50 shadow-sm">
              <label className="text-xs font-semibold text-blue-700 uppercase tracking-wider">Remaining Hours</label>
              <div className="flex items-center gap-2 mt-2">
                <Clock className="h-4 w-4 text-blue-500 flex-shrink-0" />
                <span className="inline-flex items-center px-2 py-1 rounded-lg bg-blue-500 text-white text-sm font-bold">
                  {taskDetail.remainingHours || 0}h {taskDetail.remainingMinutes || 0}m
                </span>
              </div>
            </div>

          </div>
        </div>

        {/* Description Section */}
        <div className="bg-slate-50 rounded-2xl border border-gray-100 flex flex-col flex-1 min-h-0">
          <div className="p-3 flex-1 flex flex-col">
            <div className="flex items-center gap-3 mb-4 flex-shrink-0">
              <div className="w-1.5 h-8 bg-emerald-500 rounded-full"></div>
              <h3 className="text-lg font-bold text-gray-900">Task Description</h3>
            </div>
            <div className="flex-1 bg-white/80 backdrop-blur-sm rounded-xl p-6 text-gray-700 break-words whitespace-pre-wrap overflow-y-auto border border-gray-200/50 shadow-sm custom-scrollbar min-h-0 max-w-full overflow-x-auto">
              {taskDetail.description ? (
                <div className="break-words">{taskDetail.description}</div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p className="font-medium">No description provided</p>
                    <p className="text-sm text-gray-400 truncate">This task doesn't have a description yet</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Right Section - Attachments */}
      <div className="w-1/3 flex flex-col min-w-0">
        <div className="bg-blue-50 rounded-2xl border border-blue-100 flex flex-col h-full p-6">
          <div className="flex items-center gap-3 mb-4 flex-shrink-0">
            <div className="w-1.5 h-8 bg-blue-500 rounded-full"></div>
            <h3 className="text-xl font-bold text-gray-900">Attachments</h3>
            {taskDetail.attachments && taskDetail.attachments.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                {taskDetail.attachments.length}
              </span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {!hasAttachments ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <AlertCircle className="h-16 w-16 text-gray-300 mb-4" />
                <p className="text-lg font-bold mb-2">No attachments</p>
                <p className="text-gray-400 text-center text-sm truncate">No files attached to this task</p>
              </div>
            ) : (
              <div className="space-y-3">
                {taskDetail.attachments.map((attachment, index) => {
                  if (!attachment) return null;
                  const FileIcon = getFileIcon(attachment.fileName);
                  const attachmentKey = attachment.attachmentId || `attachment-${index}`;

                  return (
                    <div
                      key={attachmentKey}
                      className="p-4 bg-white/80 backdrop-blur-sm rounded-xl hover:bg-white/90 transition-all duration-200 border border-blue-100/50 shadow-sm hover:shadow-md"
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                          <FileIcon className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div
                            className="font-semibold text-gray-800 text-sm leading-tight cursor-pointer truncate"
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
                        className="w-full inline-flex items-center justify-center px-3 py-2 bg-blue-500 text-white text-xs rounded-lg hover:bg-blue-600 transition-colors font-semibold shadow-sm hover:shadow-md transform hover:scale-105"
                        aria-label={`Download ${attachment.fileName || 'attachment'}`}
                        title="Download file"
                      >
                        <Download className="h-3 w-3 mr-1.5" /> 
                        <span className="truncate">Download</span>
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
      width: 6px;
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
  `}</style>
</div>
    </>
  );
};

export default TaskDetailsModal;