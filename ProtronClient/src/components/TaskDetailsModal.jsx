import React, { useState } from 'react';
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
  Image,
  File,
  FileImage,
  FileVideo,
  Music,
  Archive,
  Paperclip,
  AlertCircle
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
  formatDateDisplay = (date) => date.toLocaleDateString(),
  truncateText = (text, length) => text.length > length ? text.substring(0, length) + '...' : text
}) => {
  const [previewAttachment, setPreviewAttachment] = useState(null);

  if (!isOpen || !taskDetail) return null;

  const handleEdit = () => {
    console.log("Editing task:", taskDetail);
    const updatedTask = { ...taskDetail, date: new Date(taskDetail.date) };
    onEdit(updatedTask);
  };

  const handleDelete = () => {
    onDelete(taskDetail);
  };

  const getFileIcon = (fileName) => {
    if (!fileName) return FileText;
    
    const ext = fileName.split('.').pop()?.toLowerCase();
    
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'].includes(ext)) {
      return FileImage;
    } else if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'].includes(ext)) {
      return FileVideo;
    } else if (['mp3', 'wav', 'flac', 'aac', 'ogg'].includes(ext)) {
      return Music;
    } else if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
      return Archive;
    } else {
      return FileText;
    }
  };

  const isImageFile = (fileName) => {
    if (!fileName) return false;
    const ext = fileName.split('.').pop()?.toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'].includes(ext);
  };

  const getMimeType = (fileName) => {
    if (!fileName) return 'application/octet-stream';
    
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
  };

  const formatFileSize = (base64String) => {
    if (!base64String) return 'Unknown size';
    
    const base64Data = base64String.includes(',') ? base64String.split(',')[1] : base64String;
    const sizeInBytes = (base64Data.length * 3) / 4;
    
    if (sizeInBytes < 1024) {
      return `${Math.round(sizeInBytes)} B`;
    } else if (sizeInBytes < 1024 * 1024) {
      return `${(sizeInBytes / 1024).toFixed(1)} KB`;
    } else {
      return `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`;
    }
  };

  const handlePreview = (attachment) => {
      handleViewAttachment(taskDetail.taskId, attachment.attachmentId);
  };

  const handleDownload = (attachment) => {
    
      handleDownloadAttachment(taskDetail.taskId, attachment.attachmentId, attachment.fileName);
    
  };

  const hasAttachments = taskDetail.attachments && taskDetail.attachments.length > 0;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-7xl max-h-[95vh] overflow-hidden border border-gray-200 flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200 flex-shrink-0">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500 rounded-xl shadow-lg">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Task Details</h2>
                  <p className="text-gray-600 text-sm">View and manage task information</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-white/50 rounded-xl transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 h-full">
              {/* Left Section - Basic Info & Description */}
              <div className="xl:col-span-2 space-y-6">
                {/* Basic Information */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <div className="w-1 h-5 bg-blue-500 rounded-full"></div>
                    Basic Information
                  </h3>
                  
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {/* Task Type */}
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-600">Task Type</label>
                      <div className="p-3 flex justify-center bg-blue-50 rounded-lg border border-blue-100">
                        <span className="inline-flex rounded-md text-blue-700 text-xs font-medium">
                          {taskDetail.taskType}
                        </span>
                      </div>
                    </div>

                    {/* Date */}
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-600">Date</label>
                      <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-700 text-sm font-medium">{formatDateDisplay(new Date(taskDetail.date))}</span>
                      </div>
                    </div>

                    {/* Project */}
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-600">Project</label>
                      <div className="flex items-center gap-2 bg-green-50 p-3 rounded-lg border border-green-100">
                        <Folder className="h-4 w-4 text-green-600" />
                        <span
                          className="text-gray-700 text-sm font-medium cursor-help hover:text-gray-800 transition-colors truncate"
                          title={taskDetail.project?.projectName || "No project assigned"}
                        >
                          {taskDetail.project?.projectName 
                            ? truncateText(taskDetail.project.projectName, 15) 
                            : "No project"}
                        </span>
                      </div>
                    </div>

                    {/* Hours */}
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-600">Hours</label>
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-orange-50 border border-orange-100">
                        <Clock className="h-4 w-4 text-orange-500" />
                        <span className="inline-flex items-center px-2 py-1 rounded-md bg-orange-100 text-orange-700 text-xs font-medium">
                          {taskDetail.hoursSpent}h
                        </span>
                      </div>
                    </div>

                    {/* Status */}
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-600">Status</label>
                      <div className="flex items-center gap-2 p-3 rounded-lg border border-gray-100">
                        {taskDetail.submitted ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-md bg-green-100 text-green-700 text-xs font-medium">
                            <CheckCircle className="h-3 w-3 mr-1" /> Submitted
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-md bg-red-100 text-red-700 text-xs font-medium">
                            <XCircle className="h-3 w-3 mr-1" /> Pending
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex-1">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <div className="w-1 h-5 bg-purple-500 rounded-full"></div>
                    Description
                  </h3>
                  <div className="bg-gray-50 rounded-xl p-4 text-gray-700 break-words whitespace-pre-wrap h-48 overflow-y-auto border border-gray-100">
                    {taskDetail.description || "No description provided"}
                  </div>
                </div>
              </div>

              {/* Right Section - Attachments */}
              <div className="xl:col-span-1">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 h-full">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <div className="w-1 h-5 bg-green-500 rounded-full"></div>
                    Attachments
                    <div className="flex items-center gap-2 ml-auto">
                      <Paperclip className="h-4 w-4 text-gray-500" />
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                        {hasAttachments ? taskDetail.attachments.length : 0}
                      </span>
                    </div>
                  </h3>

                  {!hasAttachments ? (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                      <AlertCircle className="h-12 w-12 text-gray-300 mb-3" />
                      <p className="text-sm font-medium">No attachments</p>
                      <p className="text-xs text-gray-400 mt-1">No files attached to this task</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-80 overflow-y-auto">
                      {taskDetail.attachments.map((attachment, index) => {
                        const FileIcon = getFileIcon(attachment.fileName);
                        return (
                          <div 
                            key={attachment.attachmentId || index} 
                            className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-100"
                          >
                            <div className="flex items-start gap-3 mb-2">
                              <div className="p-1.5 bg-blue-50 rounded-md flex-shrink-0">
                                <FileIcon className="h-4 w-4 text-blue-500" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-gray-700 text-xs leading-tight">
                                  {truncateText(attachment.fileName || `Attachment ${index + 1}`, 20)}
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handlePreview(attachment)}
                                className="flex-1 inline-flex items-center justify-center px-2 py-1.5 bg-blue-500 text-white text-xs rounded-md hover:bg-blue-600 transition-colors font-medium"
                              >
                                <Eye className="h-3 w-3 mr-1" /> View
                              </button>
                              <button
                                onClick={() => handleDownload(attachment)}
                                className="flex-1 inline-flex items-center justify-center px-2 py-1.5 bg-green-500 text-white text-xs rounded-md hover:bg-green-600 transition-colors font-medium"
                              >
                                <Download className="h-3 w-3 mr-1" /> Download
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end gap-3 flex-shrink-0">
            {hasAccess("timesheet", "edit") && (
              <button
                onClick={handleEdit}
                className="inline-flex items-center px-5 py-2.5 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors font-medium shadow-lg hover:shadow-xl"
              >
                <Edit3 className="h-4 w-4 mr-2" />
                Edit Task
              </button>
            )}
            {hasAccess("timesheet", "delete") && (
              <button
                onClick={handleDelete}
                className="inline-flex items-center px-5 py-2.5 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors font-medium shadow-lg hover:shadow-xl"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Task
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Image Preview Modal */}
      {previewAttachment && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">
                {previewAttachment.fileName}
              </h3>
              <button
                onClick={() => setPreviewAttachment(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 max-h-[70vh] overflow-auto">
              <img
                src={previewAttachment.fileData.includes(',') ? previewAttachment.fileData : `data:image/jpeg;base64,${previewAttachment.fileData}`}
                alt={previewAttachment.fileName}
                className="max-w-full h-auto rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TaskDetailsModal;