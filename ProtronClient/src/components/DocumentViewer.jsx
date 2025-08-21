import React, { useState, useEffect } from 'react';
import { Download, Trash2, FileText, Eye, X, AlertCircle } from 'lucide-react';
import axios from 'axios';

const DocumentViewer = ({ budgetId, isOpen, onClose, onDocumentsUpdated }) => {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [deletingDoc, setDeletingDoc] = useState(null);

    useEffect(() => {
        if (isOpen && budgetId) {
            fetchDocuments();
        }
    }, [isOpen, budgetId]);

    const fetchDocuments = async () => {
        setLoading(true);
        setError(null);
        
        try {
            const response = await axios.get(`/api/budget-documents/budget/${budgetId}`, {
                headers: {
                    'Authorization': `Bearer ${sessionStorage.getItem('token')}`
                }
            });
            setDocuments(response.data);
        } catch (error) {
            console.error('Error fetching documents:', error);
            setError('Failed to load documents. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const downloadDocument = async (documentId, originalFileName) => {
        try {
            const response = await axios.get(`/api/budget-documents/download/${documentId}`, {
                headers: {
                    'Authorization': `Bearer ${sessionStorage.getItem('token')}`
                },
                responseType: 'blob'
            });

            // Create download link
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', originalFileName);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error downloading document:', error);
            alert('Failed to download document. Please try again.');
        }
    };

    const deleteDocument = async (documentId) => {
        if (!window.confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
            return;
        }

        setDeletingDoc(documentId);
        
        try {
            await axios.delete(`/api/budget-documents/${documentId}`, {
                headers: {
                    'Authorization': `Bearer ${sessionStorage.getItem('token')}`
                }
            });

            // Remove document from state
            setDocuments(prev => prev.filter(doc => doc.documentId !== documentId));
            
            // Notify parent component
            if (onDocumentsUpdated) {
                onDocumentsUpdated();
            }
            
        } catch (error) {
            console.error('Error deleting document:', error);
            alert('Failed to delete document. Please try again.');
        } finally {
            setDeletingDoc(null);
        }
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getFileIcon = (contentType) => {
        if (contentType.includes('pdf')) return '📄';
        if (contentType.includes('word') || contentType.includes('document')) return '📝';
        if (contentType.includes('excel') || contentType.includes('spreadsheet')) return '📊';
        if (contentType.includes('text')) return '📄';
        if (contentType.includes('image')) return '🖼️';
        return '📎';
    };

    const getFileTypeName = (contentType) => {
        if (contentType.includes('pdf')) return 'PDF Document';
        if (contentType.includes('word') || contentType.includes('document')) return 'Word Document';
        if (contentType.includes('excel') || contentType.includes('spreadsheet')) return 'Excel Spreadsheet';
        if (contentType.includes('text')) return 'Text File';
        if (contentType.includes('image')) return 'Image File';
        return 'Document';
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                    <h2 className="text-xl font-semibold text-gray-900">
                        Documents ({documents.length})
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
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            <span className="ml-3 text-gray-600">Loading documents...</span>
                        </div>
                    ) : error ? (
                        <div className="flex items-center justify-center py-12">
                            <AlertCircle size={24} className="text-red-500 mr-3" />
                            <span className="text-red-600">{error}</span>
                        </div>
                    ) : documents.length === 0 ? (
                        <div className="text-center py-12">
                            <FileText size={48} className="mx-auto text-gray-400 mb-4" />
                            <p className="text-lg font-medium text-gray-700 mb-2">No documents uploaded</p>
                            <p className="text-sm text-gray-500">
                                Documents uploaded to this budget line will appear here.
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {documents.map((document) => (
                                <div key={document.documentId} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start space-x-3 flex-1">
                                            <span className="text-3xl">
                                                {getFileIcon(document.contentType)}
                                            </span>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center space-x-2 mb-1">
                                                    <p className="text-sm font-medium text-gray-900 truncate">
                                                        {document.originalFileName}
                                                    </p>
                                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                        {getFileTypeName(document.contentType)}
                                                    </span>
                                                </div>
                                                
                                                <div className="grid grid-cols-2 gap-4 text-xs text-gray-500 mb-2">
                                                    <div>
                                                        <span className="font-medium">Size:</span> {formatFileSize(document.fileSize)}
                                                    </div>
                                                    <div>
                                                        <span className="font-medium">Uploaded:</span> {formatDate(document.uploadTimestamp)}
                                                    </div>
                                                </div>
                                                
                                                {document.description && (
                                                    <p className="text-sm text-gray-600 bg-gray-100 p-2 rounded">
                                                        {document.description}
                                                    </p>
                                                )}
                                                
                                                <div className="mt-2 text-xs text-gray-500">
                                                    <span className="font-medium">By:</span> {document.uploadedBy}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center space-x-2 ml-4">
                                            <button
                                                onClick={() => downloadDocument(document.documentId, document.originalFileName)}
                                                className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
                                                title="Download document"
                                            >
                                                <Download size={16} />
                                            </button>
                                            <button
                                                onClick={() => deleteDocument(document.documentId)}
                                                disabled={deletingDoc === document.documentId}
                                                className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                                                title="Delete document"
                                            >
                                                {deletingDoc === document.documentId ? (
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                                                ) : (
                                                    <Trash2 size={16} />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end p-6 border-t bg-gray-50">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DocumentViewer;
