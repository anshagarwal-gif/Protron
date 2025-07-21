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
  Layout
} from 'lucide-react';

const TaskDetailsModal = ({ 
  isOpen, 
  onClose, 
  taskDetail, 
  onEdit, 
  onDelete,
  hasAccess = () => true,
  handleViewAttachment = () => {},
  handleDownloadAttachment = () => {},
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
  const [activeTab, setActiveTab] = useState('overview');

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

  const handlePreview = useCallback((attachment) => {
    if (!attachment) return;
    
    try {
      if (isImageFile(attachment.fileName)) {
        setPreviewAttachment(attachment);
      } else {
        handleViewAttachment?.(taskDetail?.taskId, attachment.attachmentId);
      }
    } catch (error) {
      console.error('Error previewing attachment:', error);
    }
  }, [isImageFile, handleViewAttachment, taskDetail?.taskId]);

  const handleDownload = useCallback((attachment) => {
    if (!attachment) return;
    
    try {
      if (attachment.fileData) {
        const mimeType = getMimeType(attachment.fileName);
        const base64Data = attachment.fileData.includes(',') ? 
          attachment.fileData : 
          `data:${mimeType};base64,${attachment.fileData}`;
        
        const link = document.createElement('a');
        link.href = base64Data;
        link.download = attachment.fileName || 'attachment';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        handleDownloadAttachment?.(taskDetail?.taskId, attachment.attachmentId, attachment.fileName);
      }
    } catch (error) {
      console.error('Error downloading attachment:', error);
    }
  }, [getMimeType, handleDownloadAttachment, taskDetail?.taskId]);

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
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-6"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-6xl h-[80vh] border border-emerald-100/50 flex flex-col animate-in fade-in-0 zoom-in-95 duration-300">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-50 via-green-50 to-teal-50 px-8 py-6 border-b border-emerald-100 flex-shrink-0 rounded-t-3xl">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-r from-emerald-500 to-green-600 rounded-2xl shadow-lg">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Task Details</h2>
                  <p className="text-gray-600 text-sm font-medium">Comprehensive task overview and management</p>
                </div>
                
              </div>
              <div className='flex'>
              <div className="flex gap-2">
                  {hasAccess("timesheet", "edit") && (
                    <button
                      onClick={handleEdit}
                      className="inline-flex items-center px-3 py-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl hover:from-emerald-600 hover:to-green-700 transition-all duration-200 font-semibold shadow-md hover:shadow-lg transform hover:scale-105 text-sm"
                      aria-label="Edit task"
                    >
                      <Edit3 className="h-4 w-4 mr-1.5" />
                      Edit
                    </button>
                  )}
                  {hasAccess("timesheet", "delete") && (
                    <button
                      onClick={handleDelete}
                      className="inline-flex items-center px-3 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200 font-semibold shadow-md hover:shadow-lg transform hover:scale-105 text-sm"
                      aria-label="Delete task"
                    >
                      <Trash2 className="h-4 w-4 mr-1.5" />
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

          {/* Tabs */}
          <div className="bg-white/80 backdrop-blur-sm px-8 py-4 border-b border-gray-200 flex-shrink-0">
            <div className="flex space-x-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-md'
                        : 'text-gray-600 hover:bg-emerald-50 hover:text-emerald-700'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                    {tab.count !== null && (
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                        isActive 
                          ? 'bg-white/20 text-white' 
                          : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1 p-8 min-h-0 overflow-y-auto custom-scrollbar">
            {activeTab === 'overview' && (
              <div className="space-y-6 h-full">
                {/* Project Details and Description */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 h-full">

                  {/* Project Details Section */}
                  <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl border border-emerald-100 p-6 max-h-[300px] overflow-y-auto custom-scrollbar flex flex-col">
                    {/* Project Details Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {/* Task Type */}
                      <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-emerald-100/50 shadow-sm">
                        <label className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Task Type</label>
                        <div className="mt-2">
                          <span className="inline-flex px-3 py-1.5 bg-emerald-500 text-white text-sm font-medium rounded-lg">
                            {taskDetail.taskType || 'Unknown'}
                          </span>
                        </div>
                      </div>

                      {/* Date */}
                      <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-gray-100/50 shadow-sm">
                        <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Date</label>
                        <div className="flex items-center gap-2 mt-2">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span className="text-gray-800 text-sm font-semibold">
                            {displayDate}
                          </span>
                        </div>
                      </div>

                      {/* Project */}
                      <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-teal-100/50 shadow-sm">
                        <label className="text-xs font-semibold text-teal-700 uppercase tracking-wider">Project</label>
                        <div className="flex items-center gap-2 mt-2">
                          <Folder className="h-4 w-4 text-teal-600" />
                          <span 
                            className="text-gray-800 text-sm font-semibold cursor-help hover:text-teal-700 transition-colors truncate"
                            title={taskDetail.project?.projectName || "No project assigned"}
                          >
                            {taskDetail.project?.projectName 
                              ? truncateText(taskDetail.project.projectName, 15) 
                              : "No project"}
                          </span>
                        </div>
                      </div>

                      {/* Hours */}
                      <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-amber-100/50 shadow-sm">
                        <label className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Hours</label>
                        <div className="flex items-center gap-2 mt-2">
                          <Clock className="h-4 w-4 text-amber-500" />
                          <span className="inline-flex items-center px-2 py-1 rounded-lg bg-amber-500 text-white text-sm font-bold">
                            {taskDetail.hoursSpent || 0}h {taskDetail.minutesSpent || 0}m
                          </span>
                        </div>
                      </div>

                      {/* Status */}
                      <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-green-100/50 shadow-sm sm:col-span-2">
                        <label className="text-xs font-semibold text-green-700 uppercase tracking-wider">Status</label>
                        <div className="mt-2">
                          {taskDetail.submitted ? (
                            <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-green-500 text-white text-sm font-medium">
                              <CheckCircle className="h-3 w-3 mr-1.5" /> Submitted
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-red-500 text-white text-sm font-medium">
                              <XCircle className="h-3 w-3 mr-1.5" /> Pending
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Description Section */}
                  <div className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-2xl border border-gray-100 flex flex-col max-h-[300px]">
                    <div className="p-6 flex-1 flex flex-col">
                      <div className="flex items-center gap-3 mb-4 flex-shrink-0">
                        <div className="w-1.5 h-8 bg-gradient-to-b from-emerald-500 to-green-600 rounded-full"></div>
                        <h3 className="text-xl font-bold text-gray-900">Task Description</h3>
                      </div>
                      <div className="flex-1 bg-white/80 backdrop-blur-sm rounded-xl p-6 text-gray-700 break-words whitespace-pre-wrap overflow-y-auto border border-gray-200/50 shadow-sm custom-scrollbar min-h-0">
                        {taskDetail.description ? (
                          taskDetail.description
                        ) : (
                          <div className="flex items-center justify-center h-full text-gray-500">
                            <div className="text-center">
                              <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                              <p className="font-medium">No description provided</p>
                              <p className="text-sm text-gray-400">This task doesn't have a description yet</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'attachments' && (
              <div className="h-full">
                {!hasAttachments ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500 bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl border border-emerald-100">
                    <AlertCircle className="h-20 w-20 text-gray-300 mb-6" />
                    <p className="text-2xl font-bold mb-2">No attachments</p>
                    <p className="text-gray-400 text-center max-w-md">No files have been attached to this task. Attachments will appear here when they are added.</p>
                  </div>
                ) : (
                  <div className="h-full">
                    <div className="mb-6">
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">Task Attachments</h3>
                      <p className="text-gray-600">
                        {taskDetail.attachments.length} file{taskDetail.attachments.length !== 1 ? 's' : ''} attached to this task
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {taskDetail.attachments.map((attachment, index) => {
    if (!attachment) return null;
    
    const FileIcon = getFileIcon(attachment.fileName);
    const attachmentKey = attachment.attachmentId || `attachment-${index}`;
    
    return (
      <div 
        key={attachmentKey} 
        className="p-4 bg-white/80 backdrop-blur-sm rounded-xl hover:bg-white/90 transition-all duration-200 border border-emerald-100/50 shadow-sm hover:shadow-md flex-shrink-0 flex flex-col h-full"
      >
        <div className="flex items-start gap-3 mb-3 flex-1">
          <div className="p-2 bg-emerald-100 rounded-lg flex-shrink-0">
            <FileIcon className="h-5 w-5 text-emerald-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div 
              className="font-semibold text-gray-800 text-sm leading-tight cursor-pointer"
              title={attachment.fileName || `Attachment ${index + 1}`}
            >
              <span className="block truncate">
                {attachment.fileName || `Attachment ${index + 1}`}
              </span>
            </div>
            <div className="text-xs text-gray-500 mt-1 font-medium">
              {attachment.fileSize ? 
                `${(attachment.fileSize / 1024).toFixed(1)} KB` : 
                formatFileSize(attachment.fileData)
              }
            </div>
          </div>
        </div>
        <div className="flex gap-2 mt-auto">
          <button
            onClick={() => handlePreview(attachment)}
            className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-emerald-500 text-white text-xs rounded-lg hover:bg-emerald-600 transition-colors font-semibold shadow-sm"
            aria-label={`View ${attachment.fileName || 'attachment'}`}
          >
            <Eye className="h-3 w-3 mr-1.5" /> View
          </button>
          <button
            onClick={() => handleDownload(attachment)}
            className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 transition-colors font-semibold shadow-sm"
            aria-label={`Download ${attachment.fileName || 'attachment'}`}
          >
            <Download className="h-3 w-3 mr-1.5" /> Download
          </button>
        </div>
      </div>
    );
  })}
</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Image Preview Modal */}
      {previewAttachment && (
        <div 
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
          onClick={(e) => e.target === e.currentTarget && setPreviewAttachment(null)}
        >
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl max-w-5xl max-h-[90vh] overflow-hidden border border-emerald-100">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-emerald-50 to-green-50">
              <h3 className="text-xl font-bold text-gray-900">
                {previewAttachment.fileName || 'Image Preview'}
              </h3>
              <button
                onClick={() => setPreviewAttachment(null)}
                className="p-2 hover:bg-white/60 rounded-xl transition-colors"
                aria-label="Close preview"
              >
                <X className="h-6 w-6 text-gray-500" />
              </button>
            </div>
            <div className="p-8 max-h-[70vh] overflow-auto">
              {previewAttachment.fileData ? (
                <img
                  src={previewAttachment.fileData.includes(',') ? 
                    previewAttachment.fileData : 
                    `data:image/jpeg;base64,${previewAttachment.fileData}`}
                  alt={previewAttachment.fileName || 'Preview'}
                  className="max-w-full h-auto rounded-2xl shadow-lg"
                  onError={() => {
                    console.error('Failed to load image preview');
                    setPreviewAttachment(null);
                  }}
                />
              ) : (
                <div className="flex items-center justify-center h-64 text-gray-500">
                  <div className="text-center">
                    <AlertCircle className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <p className="font-medium">Unable to preview image</p>
                    <p className="text-sm text-gray-400">Image data not available</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
    </>
  );
};

export default TaskDetailsModal;