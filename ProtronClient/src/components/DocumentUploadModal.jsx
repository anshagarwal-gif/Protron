import React, { useState, useRef } from 'react';
import { X, Upload, FileText, Trash2, AlertCircle, CheckCircle } from 'lucide-react';
import axios from 'axios';

const DocumentUploadModal = ({ isOpen, onClose, budgetId, onDocumentsUpdated }) => {
    const [files, setFiles] = useState([]);
    const [descriptions, setDescriptions] = useState({});
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState({});
    const [errors, setErrors] = useState({});
    const fileInputRef = useRef(null);

    const MAX_FILES = 4;
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    const ALLOWED_TYPES = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain',
        'image/jpeg',
        'image/jpg',
        'image/png'
    ];

    const handleFileSelect = (event) => {
        const selectedFiles = Array.from(event.target.files);
        const currentFileCount = files.length;
        
        if (currentFileCount + selectedFiles.length > MAX_FILES) {
            alert(`You can only upload a maximum of ${MAX_FILES} files.`);
            return;
        }

        const validFiles = selectedFiles.filter(file => {
            // Check file size
            if (file.size > MAX_FILE_SIZE) {
                setErrors(prev => ({
                    ...prev,
                    [file.name]: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`
                }));
                return false;
            }

            // Check file type
            if (!ALLOWED_TYPES.includes(file.type)) {
                setErrors(prev => ({
                    ...prev,
                    [file.name]: 'File type not allowed'
                }));
                return false;
            }

            // Clear any previous errors
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[file.name];
                return newErrors;
            });

            return true;
        });

        setFiles(prev => [...prev, ...validFiles]);
        
        // Initialize description for new files
        validFiles.forEach(file => {
            if (!descriptions[file.name]) {
                setDescriptions(prev => ({
                    ...prev,
                    [file.name]: ''
                }));
            }
        });
    };

    const removeFile = (fileName) => {
        setFiles(prev => prev.filter(file => file.name !== fileName));
        setDescriptions(prev => {
            const newDescriptions = { ...prev };
            delete newDescriptions[fileName];
            return newDescriptions;
        });
        setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[fileName];
            return newErrors;
        });
        setUploadProgress(prev => {
            const newProgress = { ...prev };
            delete newProgress[fileName];
            return newProgress;
        });
    };

    const handleDescriptionChange = (fileName, description) => {
        setDescriptions(prev => ({
            ...prev,
            [fileName]: description
        }));
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const getFileIcon = (fileType) => {
        if (fileType.includes('pdf')) return '📄';
        if (fileType.includes('word') || fileType.includes('document')) return '📝';
        if (fileType.includes('excel') || fileType.includes('spreadsheet')) return '📊';
        if (fileType.includes('text')) return '📄';
        if (fileType.includes('image')) return '🖼️';
        return '📎';
    };

    const uploadFiles = async () => {
        if (files.length === 0) return;

        setUploading(true);
        const newProgress = {};
        files.forEach(file => {
            newProgress[file.name] = 0;
        });
        setUploadProgress(newProgress);

        try {
            const uploadPromises = files.map(async (file) => {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('description', descriptions[file.name] || '');

                const response = await axios.post(
                    `/api/budget-documents/upload/${budgetId}`,
                    formData,
                    {
                        headers: {
                            'Content-Type': 'multipart/form-data',
                            'Authorization': `Bearer ${sessionStorage.getItem('token')}`
                        },
                        onUploadProgress: (progressEvent) => {
                            const progress = Math.round(
                                (progressEvent.loaded * 100) / progressEvent.total
                            );
                            setUploadProgress(prev => ({
                                ...prev,
                                [file.name]: progress
                            }));
                        }
                    }
                );

                return response.data;
            });

            await Promise.all(uploadPromises);
            
            // Clear form and close modal
            setFiles([]);
            setDescriptions({});
            setUploadProgress({});
            setErrors({});
            
            // Notify parent component
            if (onDocumentsUpdated) {
                onDocumentsUpdated();
            }
            
            onClose();
            
        } catch (error) {
            console.error('Upload error:', error);
            if (error.response?.data) {
                alert(`Upload failed: ${error.response.data}`);
            } else {
                alert('Upload failed. Please try again.');
            }
        } finally {
            setUploading(false);
        }
    };

    const handleDrop = (event) => {
        event.preventDefault();
        const droppedFiles = Array.from(event.dataTransfer.files);
        const currentFileCount = files.length;
        
        if (currentFileCount + droppedFiles.length > MAX_FILES) {
            alert(`You can only upload a maximum of ${MAX_FILES} files.`);
            return;
        }

        // Process dropped files similar to selected files
        const validFiles = droppedFiles.filter(file => {
            if (file.size > MAX_FILE_SIZE) {
                setErrors(prev => ({
                    ...prev,
                    [file.name]: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`
                }));
                return false;
            }

            if (!ALLOWED_TYPES.includes(file.type)) {
                setErrors(prev => ({
                    ...prev,
                    [file.name]: 'File type not allowed'
                }));
                return false;
            }

            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[file.name];
                return newErrors;
            });

            return true;
        });

        setFiles(prev => [...prev, ...validFiles]);
        validFiles.forEach(file => {
            if (!descriptions[file.name]) {
                setDescriptions(prev => ({
                    ...prev,
                    [file.name]: ''
                }));
            }
        });
    };

    const handleDragOver = (event) => {
        event.preventDefault();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                    <h2 className="text-xl font-semibold text-gray-900">
                        Upload Documents
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                    {/* File Upload Area */}
                    <div
                        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer"
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <Upload size={48} className="mx-auto text-gray-400 mb-4" />
                        <p className="text-lg font-medium text-gray-700 mb-2">
                            Drop files here or click to browse
                        </p>
                        <p className="text-sm text-gray-500 mb-4">
                            Maximum {MAX_FILES} files, {MAX_FILE_SIZE / 1024 / 1024}MB each
                        </p>
                        <p className="text-xs text-gray-400">
                            Supported: PDF, Word, Excel, Text, Images
                        </p>
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            onChange={handleFileSelect}
                            className="hidden"
                            accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.jpg,.jpeg,.png"
                        />
                    </div>

                    {/* File List */}
                    {files.length > 0 && (
                        <div className="mt-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">
                                Selected Files ({files.length}/{MAX_FILES})
                            </h3>
                            <div className="space-y-3">
                                {files.map((file, index) => (
                                    <div key={index} className="border rounded-lg p-4 bg-gray-50">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center space-x-3 flex-1">
                                                <span className="text-2xl">
                                                    {getFileIcon(file.type)}
                                                </span>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-gray-900 truncate">
                                                        {file.name}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {formatFileSize(file.size)}
                                                    </p>
                                                    {errors[file.name] && (
                                                        <p className="text-xs text-red-600 mt-1 flex items-center">
                                                            <AlertCircle size={12} className="mr-1" />
                                                            {errors[file.name]}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => removeFile(file.name)}
                                                className="text-red-500 hover:text-red-700 transition-colors"
                                                disabled={uploading}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                        
                                        {/* Description Input */}
                                        <div className="mt-3">
                                            <input
                                                type="text"
                                                placeholder="Add description (optional)"
                                                value={descriptions[file.name] || ''}
                                                onChange={(e) => handleDescriptionChange(file.name, e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                disabled={uploading}
                                            />
                                        </div>

                                        {/* Upload Progress */}
                                        {uploading && uploadProgress[file.name] !== undefined && (
                                            <div className="mt-3">
                                                <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                                                    <span>Uploading...</span>
                                                    <span>{uploadProgress[file.name]}%</span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                                        style={{ width: `${uploadProgress[file.name]}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end space-x-3 p-6 border-t bg-gray-50">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        disabled={uploading}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={uploadFiles}
                        disabled={files.length === 0 || uploading || Object.keys(errors).length > 0}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    >
                        {uploading ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                <span>Uploading...</span>
                            </>
                        ) : (
                            <>
                                <Upload size={16} />
                                <span>Upload {files.length} File{files.length !== 1 ? 's' : ''}</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DocumentUploadModal;
