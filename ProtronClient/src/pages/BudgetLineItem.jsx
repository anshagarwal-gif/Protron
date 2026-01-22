import React, { useState, useEffect, useMemo, forwardRef, useImperativeHandle, useRef } from "react";
import { AgGridReact } from 'ag-grid-react';
import * as XLSX from 'xlsx';
import {
  Eye,
  FileText,
  User,
  Building,
  DollarSign,
  Calendar,
  X,
  File,
  Plus,
  Clock,
  Edit,
  Paperclip,
  RefreshCw,
  Download,
  Pencil,
} from "lucide-react";
import axios from "axios";
import AddBudgetLineModal from "../components/AddBudgetLineModal";
import BudgetAllocationModal from "../components/BudgetAllocationModal";
import { useAccess } from "../Context/AccessContext";

// Component to display budget documents
const DocumentsDisplay = ({ budgetLine }) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [downloadingDocs, setDownloadingDocs] = useState(new Set());

  // Fetch documents when component mounts or budget line changes
  useEffect(() => {
    if (budgetLine?.budgetId) {
      fetchDocuments();
    }
  }, [budgetLine?.budgetId]);

  const fetchDocuments = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = sessionStorage.getItem('token');
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/budget-documents/budget/${budgetLine.budgetId}`,
        {
          headers: { Authorization: token }
        }
      );
      setDocuments(response.data || []);
    } catch (error) {
      console.error("Error fetching documents:", error);
      setError("Failed to fetch documents");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (documentId, fileName) => {
    // Set downloading state for this document
    setDownloadingDocs(prev => new Set(prev).add(documentId));
    
    try {
      const token = sessionStorage.getItem('token');
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/budget-documents/download/${documentId}`,
        {
          headers: { Authorization: token },
          responseType: 'blob'
        }
      );

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      // Show success message
      console.log(`Document "${fileName}" downloaded successfully`);
    } catch (error) {
      console.error("Error downloading document:", error);
      let errorMessage = "Failed to download document";
      if (error.response?.status === 404) {
        errorMessage = "Document not found";
      } else if (error.response?.status === 403) {
        errorMessage = "Access denied to this document";
      } else if (error.response?.status === 500) {
        errorMessage = "Server error occurred while downloading";
      }
      alert(errorMessage);
    } finally {
      // Clear downloading state for this document
      setDownloadingDocs(prev => {
        const newSet = new Set(prev);
        newSet.delete(documentId);
        return newSet;
      });
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (contentType, fileName) => {
    // Check content type first
    if (contentType?.includes('pdf')) return '📄';
    if (contentType?.includes('word') || contentType?.includes('document')) return '📝';
    if (contentType?.includes('excel') || contentType?.includes('spreadsheet')) return '📊';
    if (contentType?.includes('image')) return '🖼️';
    if (contentType?.includes('text')) return '📄';
    
    // Fallback to file extension if content type is not available
    if (fileName) {
      const extension = fileName.toLowerCase().split('.').pop();
      switch (extension) {
        case 'pdf': return '📄';
        case 'doc':
        case 'docx': return '📝';
        case 'xls':
        case 'xlsx': return '📊';
        case 'jpg':
        case 'jpeg':
        case 'png':
        case 'gif': return '🖼️';
        case 'txt': return '📄';
        default: return '📎';
      }
    }
    
    return '📎';
  };

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
        <p className="text-sm text-gray-600 mt-2">Loading documents...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-4">
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-6">
        <Paperclip size={48} className="mx-auto mb-3 text-gray-300" />
        <p className="text-gray-500 font-medium">No documents found</p>
        <p className="text-sm text-gray-400">This budget line has no documents attached.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header with document count and refresh button */}
      <div className="flex items-center justify-between">
        <div className="text-xs text-gray-600">
          <span>Showing {documents.length} document{documents.length !== 1 ? 's' : ''}</span>
        </div>
        <button
          onClick={fetchDocuments}
          className="p-1.5 hover:bg-gray-200 rounded-md transition-colors text-gray-600 hover:text-gray-800"
          title="Refresh documents"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {documents.map((document) => (
          <div key={document.documentId} className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow">
            <div className="flex flex-col items-center text-center">
              <div className="text-3xl mb-2">{getFileIcon(document.contentType, document.originalFileName)}</div>
              <div className="w-full">
                <p 
                  className="text-xs font-medium text-gray-900 truncate mb-1" 
                  title={document.originalFileName}
                >
                  {document.originalFileName}
                </p>
                <p className="text-xs text-gray-500 mb-1">{formatFileSize(document.fileSize)}</p>
                <p className="text-xs text-gray-400 mb-2">
                  {document.uploadTimestamp 
                    ? new Date(document.uploadTimestamp).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric'
                      })
                    : 'N/A'
                  }
                </p>
              </div>
              
              {/* Download Button */}
              <button
                onClick={() => handleDownload(document.documentId, document.originalFileName)}
                disabled={downloadingDocs.has(document.documentId)}
                className={`w-full px-2 py-1.5 text-xs rounded-md transition-colors flex items-center justify-center space-x-1 ${
                  downloadingDocs.has(document.documentId)
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700 cursor-pointer'
                }`}
              >
                {downloadingDocs.has(document.documentId) ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                    <span className="text-xs">Downloading...</span>
                  </>
                ) : (
                  <>
                    <Download size={12} />
                    <span className="text-xs">Download</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Component to display budget allocations
const AllocationsDisplay = ({ budgetLine }) => {
  const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Fetch allocations when component mounts or budget line changes
  useEffect(() => {
    if (budgetLine?.budgetId) {
      fetchAllocations();
    }
  }, [budgetLine?.budgetId]);

  // Refresh allocations function
  const handleRefresh = () => {
    fetchAllocations();
  };

  const fetchAllocations = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = sessionStorage.getItem('token');
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/budget-allocations/budget/${budgetLine.budgetId}`,
        {
          headers: { Authorization: token }
        }
      );
      setAllocations(response.data || []);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error fetching allocations:", error);
      setError("Failed to fetch allocations");
    } finally {
      setLoading(false);
    }
  };

  // Calculate total allocated amount
  const totalAllocated = allocations.reduce((sum, allocation) => 
    sum + (parseFloat(allocation.amount) || 0), 0
  );

  // Format currency
  const formatCurrency = (amount, currency = 'USD') => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(parseFloat(amount));
  };

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
        <p className="text-sm text-gray-600 mt-2">Loading allocations...</p>
        <p className="text-xs text-gray-400 mt-1">Please wait while we fetch the latest data</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-4">
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (allocations.length === 0) {
    return (
      <div className="text-center py-6">
        <DollarSign size={48} className="mx-auto mb-3 text-gray-300" />
        <p className="text-gray-500 font-medium">No allocations found</p>
        <p className="text-sm text-gray-400">This budget line has no allocations yet.</p>
        <div className="mt-4 text-xs text-gray-400">
          <p>Use the + button in the actions column to add allocations</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with refresh button */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          <span>Showing {allocations.length} allocation{allocations.length !== 1 ? 's' : ''}</span>
          {lastUpdated && (
            <span className="ml-2 text-gray-400">
              • Last updated: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </div>
        <button
          onClick={handleRefresh}
          className="p-2 hover:bg-gray-200 rounded-md transition-colors text-gray-600 hover:text-gray-800"
          title="Refresh allocations"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{allocations.length}</div>
          <div className="text-sm text-blue-800">Total Allocations</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(totalAllocated, budgetLine.currency)}
          </div>
          <div className="text-sm text-green-800">Total Allocated</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">
            {formatCurrency(parseFloat(budgetLine.amountApproved || 0) - totalAllocated, budgetLine.currency)}
          </div>
          <div className="text-sm text-purple-800">Remaining Budget</div>
        </div>
      </div>

      {/* Allocations Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">System</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remarks</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {allocations.map((allocation) => (
                <tr key={allocation.allocationId} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">{allocation.vendorName}</td>
                                     <td className="px-4 py-3 text-sm text-gray-900">{allocation.system?.systemName || allocation.systemName || 'N/A'}</td>
                  <td className="px-4 py-3 text-sm font-medium text-green-600">
                    {formatCurrency(allocation.amount, budgetLine.currency)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 max-w-xs truncate" title={allocation.remarks}>
                    {allocation.remarks || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const ViewBudgetLineModal = ({ open, onClose, budgetLine }) => {
  if (!open || !budgetLine) return null;

  // Format currency
  const formatCurrency = (amount, currency = 'USD') => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(parseFloat(amount));
  };

  // Format date
  const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const d = new Date(dateString);
  const day = String(d.getDate()).padStart(2, '0');
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthStr = monthNames[d.getMonth()];
  const year = d.getFullYear();
  return `${day}-${monthStr}-${year}`;
  };

  // Field component for consistent styling
  const Field = ({ label, value, className = "" }) => (
    <div className={className}>
      <label className="text-xs font-medium text-gray-600 mb-1 block">{label}</label>
      <div className="text-sm text-gray-900 font-medium break-words overflow-wrap-anywhere">
        {value || "N/A"}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm p-2 sm:p-4 lg:p-6">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-xs sm:max-w-2xl md:max-w-4xl lg:max-w-6xl xl:max-w-7xl max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 bg-green-600 text-white rounded-t-lg">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="w-8 h-8 bg-green-700 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg lg:text-xl font-bold">Budget Line Details</h2>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-green-700 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Basic Budget Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <FileText className="mr-2 text-green-600" size={20} />
              Basic Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <Field
                label="Budget Name"
                value={budgetLine.budgetName}
              />
              <Field
                label="Budget Line Item"
                value={budgetLine.budgetLineItem}
              />
              <Field
                label="Currency"
                value={budgetLine.currency}
              />
              <Field
                label="Amount Approved"
                value={formatCurrency(budgetLine.amountApproved, budgetLine.currency)}
              />
              <Field
                label="Amount Utilized"
                value={formatCurrency(budgetLine.amountUtilized, budgetLine.currency)}
              />
              <Field
                label="Amount Available"
                value={formatCurrency(budgetLine.amountAvailable, budgetLine.currency)}
              />
              <Field
                label="Budget End Date"
                value={formatDate(budgetLine.budgetEndDate)}
              />
            </div>
          </div>

          {/* Owner & Sponsor Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <User className="mr-2 text-green-600" size={20} />
              Owner & Sponsor Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <Field
                label="Budget Owner"
                value={budgetLine.budgetOwner}
              />
              <Field
                label="Sponsor"
                value={budgetLine.sponsor}
              />
              <Field
                label="Line of Business"
                value={budgetLine.lob}
              />
            </div>
          </div>

          

          {/* Description & Remarks */}
          {(budgetLine.budgetDescription || budgetLine.remarks) && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                <Edit className="mr-2 text-green-600" size={20} />
                Description & Remarks
              </h3>
              {budgetLine.budgetDescription && (
                <div className="mb-4">
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Description</label>
                  <div className="bg-white rounded p-2 sm:p-3 border max-h-32 sm:max-h-40 overflow-y-auto">
                    <p className="text-xs sm:text-sm text-gray-900 leading-relaxed whitespace-pre-wrap break-words">
                      {budgetLine.budgetDescription}
                    </p>
                  </div>
                </div>
              )}
              {budgetLine.remarks && (
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Remarks</label>
                  <div className="bg-white rounded p-2 sm:p-3 border max-h-32 sm:max-h-40 overflow-y-auto">
                    <p className="text-xs sm:text-sm text-gray-900 leading-relaxed whitespace-pre-wrap break-words">
                      {budgetLine.remarks}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Allocations Section */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <DollarSign className="mr-2 text-green-600" size={20} />
              Budget Allocations
            </h3>
            <AllocationsDisplay budgetLine={budgetLine} />
          </div>

          {/* Documents Section */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <Paperclip className="mr-2 text-green-600" size={20} />
              Documents
            </h3>
            <DocumentsDisplay budgetLine={budgetLine} />
          </div>
        </div>

        {/* Footer */}
        <div className="px-3 sm:px-6 py-3 sm:py-4 bg-gray-50 border-t rounded-b-lg">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-3 sm:px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors text-sm sm:text-base"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const BudgetLineManagement = forwardRef(({ searchQuery }, ref) => {
  // State management
  const [budgetLineList, setBudgetLineList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isBudgetAllocationModalOpen, setIsBudgetAllocationModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedBudgetLine, setSelectedBudgetLine] = useState(null);

  const gridRef = useRef();
const { hasAccess } = useAccess(); // Access context




  // Fetch budget line data
  const fetchBudgetLineData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = sessionStorage.getItem('token');
      if (!token) {
        throw new Error("Missing authentication credentials");
      }

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/budget-lines`,
        {
          headers: { Authorization: token }
        }
      );

      // Sort budget lines by startTimestamp (latest first)
      const sortedBudgetLines = (response.data || []).sort((a, b) => {
        const dateA = a.startTimestamp ? new Date(a.startTimestamp) : new Date(0);
        const dateB = b.startTimestamp ? new Date(b.startTimestamp) : new Date(0);
        return dateB - dateA;
      });
      setBudgetLineList(sortedBudgetLines);
    } catch (error) {
      console.error("Error fetching budget line data:", error);
      setError(error.message || "Failed to fetch budget line data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgetLineData();
  }, []);

  // Filter budget line data based on search
  const filteredBudgetLineData = budgetLineList.filter(budgetLine => {
    if (searchQuery === "") return true;

    const searchLower = searchQuery.toLowerCase();
    return (
      budgetLine.budgetId?.toString().toLowerCase().includes(searchLower) ||
      budgetLine.budgetName?.toLowerCase().includes(searchLower) ||
      budgetLine.budgetLineItem?.toLowerCase().includes(searchLower) ||
      budgetLine.budgetOwner?.toLowerCase().includes(searchLower) ||
      budgetLine.sponsor?.toLowerCase().includes(searchLower) ||
      budgetLine.currency?.toLowerCase().includes(searchLower) ||
      budgetLine.amountApproved?.toString().includes(searchLower)
    );
  });

  // Format currency
  const formatCurrency = (amount, currency) => {
    if (!amount) return 'N/A';
    return `${currency || '$'} ${parseFloat(amount).toLocaleString()}`;
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  // Handle view budget line
  const handleViewBudgetLine = (budgetLine) => {
    setSelectedBudgetLine(budgetLine);
    setIsViewModalOpen(true);
  };

  // Handle open budget allocation modal
  const handleOpenBudgetAllocation = (budgetLine) => {
    setSelectedBudgetLine(budgetLine);
    setIsBudgetAllocationModalOpen(true);
  };

  // Handle edit budget line
  const handleEditBudgetLine = (budgetLine) => {
    setSelectedBudgetLine(budgetLine);
    setIsEditModalOpen(true);
  };







  // Handle add budget line
  const handleAddBudgetLine = () => {
    setIsAddModalOpen(true);
  };

  // Handle modal submit
  const handleModalSubmit = (data) => {
    console.log("Budget line operation completed successfully:", data);
    fetchBudgetLineData(); // Refresh the table
    
    // Update selectedBudgetLine if it was edited (even if budgetId changed, update with new data)
    if (selectedBudgetLine && data) {
      // When editing, backend creates a new budget line with new budgetId
      // So we need to update selectedBudgetLine with the new data
      setSelectedBudgetLine(data); // Update with fresh data including new budgetId
    }
    
    setIsAddModalOpen(false);
    setIsEditModalOpen(false);
  };

  // Download Excel function for budget lines
  const downloadBudgetLineExcel = () => {
    try {
      // Prepare data for export
      const excelData = filteredBudgetLineData.map((budgetLine, index) => ({
        'S.No': index + 1,
        'Budget Name': budgetLine.budgetName || 'N/A',
        'Budget Description': budgetLine.budgetDescription || 'N/A',
        'Budget Line Item': budgetLine.budgetLineItem || 'N/A',
        'Budget Owner': budgetLine.budgetOwner || 'N/A',
        'Sponsor': budgetLine.sponsor || 'N/A',
        'Line of Business (LOB)': budgetLine.lob || 'N/A',
        'Currency': budgetLine.currency || 'N/A',
        'Amount Approved': budgetLine.amountApproved ? `${budgetLine.amountApproved.toLocaleString()}` : 'N/A',
        'Amount Utilized': budgetLine.amountUtilized ? `${budgetLine.amountUtilized.toLocaleString()}` : 'N/A',
        'Amount Available': budgetLine.amountAvailable ? `${budgetLine.amountAvailable.toLocaleString()}` : 'N/A',
        'Budget End Date': budgetLine.budgetEndDate ? new Date(budgetLine.budgetEndDate).toLocaleDateString() : 'N/A',
        'Remarks': budgetLine.remarks || 'N/A',
        'Last Updated By': budgetLine.lastUpdatedBy || 'N/A',
        'Created Date': budgetLine.createdDate ? new Date(budgetLine.createdDate).toLocaleDateString() : 'N/A'
      }));

      // Create worksheet
      const ws = XLSX.utils.json_to_sheet(excelData);
      
      // Create workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Budget Lines');
      
      // Generate filename
      const fileName = `Budget_Lines_${new Date().toISOString().split('T')[0]}.xlsx`;
      
      // Download file
      XLSX.writeFile(wb, fileName);
      
      console.log('Budget lines Excel file downloaded successfully!');
      
    } catch (error) {
      console.error('Error downloading budget lines Excel:', error);
      alert('Failed to download Excel file. Please try again.');
    }
  };

  // Expose functions to parent component
  useImperativeHandle(ref, () => ({
    handleAddBudgetLine,
    handleEditBudgetLine,
    fetchBudgetLineData,
    downloadBudgetLineExcel
  }));

  // AG Grid column definitions
  const columnDefs = useMemo(() => [
    {
      headerName: "#",
      valueGetter: "node.rowIndex + 1",
      width: 70,
      pinned: "left",
      sortable: false,
      filter: false,
      suppressMenu: true,
      cellStyle: { textAlign: 'center' }
    },
    {
      headerName: "Budget Name",
      field: "budgetName",
      valueGetter: params => params.data.budgetName || 'N/A',
      flex: 1,
      minWidth: 180,
      sortable: true,
      filter: true,
      cellRenderer: params => (
        <div
          className="truncate max-w-full overflow-hidden whitespace-nowrap"
          title={params.value}
        >
          {params.value}
        </div>
      )
    },
    {
      headerName: "Budget Line Item",
      field: "budgetLineItem",
      valueGetter: params => params.data.budgetLineItem || 'N/A',
      flex: 1,
      minWidth: 180,
      sortable: true,
      filter: true,
      cellRenderer: params => (
        <div
          className="truncate max-w-full overflow-hidden whitespace-nowrap"
          title={params.value}
        >
          {params.value}
        </div>
      )
    },
    {
      headerName: "Budget Owner",
      field: "budgetOwner",
      valueGetter: params => params.data.budgetOwner || 'N/A',
      flex: 1,
      minWidth: 150,
      sortable: true,
      filter: true,
      cellRenderer: params => (
        <div className="flex items-center">
          <User size={14} className="text-blue-600 mr-2" />
          <span className="truncate" title={params.value}>{params.value}</span>
        </div>
      )
    },
    {
      headerName: "Sponsor",
      field: "sponsor",
      valueGetter: params => params.data.sponsor || 'N/A',
      flex: 1,
      minWidth: 150,
      sortable: true,
      filter: true,
      cellRenderer: params => (
        <div className="flex items-center">
          <Building size={14} className="text-blue-600 mr-2" />
          <span className="truncate" title={params.value}>{params.value}</span>
        </div>
      )
    },
    {
      headerName: "Amount Approved",
      field: "amountApproved",
      valueGetter: params => formatCurrency(params.data.amountApproved, params.data.currency),
      width: 160,
      sortable: true,
      filter: true,
      cellRenderer: params => (
        <div className="flex items-center font-bold text-green-600">
          {params.value}
        </div>
      )
    },
    {
      headerName: "Amount Available",
      field: "amountAvailable",
      valueGetter: params => formatCurrency(params.data.amountAvailable, params.data.currency),
      width: 160,
      sortable: true,
      filter: true,
      cellRenderer: params => (
        <div className="flex items-center font-bold text-blue-600">
          {params.value}
        </div>
      )
    },
    {
      headerName: "Budget End Date",
      field: "budgetEndDate",
      valueGetter: params => formatDate(params.data.budgetEndDate),
      width: 140,
      sortable: true,
      filter: true,
      cellRenderer: params => {
        // Format date to DD-Mon-YYYY
        let formatted = '';
        if (params.value) {
          const d = new Date(params.value);
          const day = String(d.getDate()).padStart(2, '0');
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          const monthStr = monthNames[d.getMonth()];
          const year = d.getFullYear();
          formatted = `${day}-${monthStr}-${year}`;
        }
        return (
          <div className="flex items-center text-sm">
            <Calendar size={14} className="text-blue-600 mr-2" />
            <span className="truncate" title={params.value}>{formatted}</span>
          </div>
        );
      }
    },
   
    {
      headerName: "Actions",
      field: "actions",
      width: 200,
      sortable: false,
      filter: false,
      suppressMenu: true,
      cellRenderer: params => {
        const budgetLine = params.data;
        return (
          <div className="flex justify-center gap-1 h-full items-center">
            {/* View Button (always visible) */}
            <button
              onClick={() => handleViewBudgetLine(budgetLine)}
              className="p-2 rounded-full hover:bg-blue-100 transition-colors cursor-pointer"
              title="View Budget Line"
            >
              <Eye size={14} className="text-green-600" />
            </button>
            {/* Edit Button (edit access) */}
            {hasAccess && hasAccess('budget', 'edit') && (
              <button
                onClick={() => handleEditBudgetLine(budgetLine)}
                className="p-2 rounded-full hover:bg-yellow-100 transition-colors cursor-pointer"
                title="Edit Budget Line"
              >
                <Pencil size={14} className="text-yellow-600" />
              </button>
            )}
            
            {/* Budget Allocation Button (edit access) */}
            {hasAccess && hasAccess('budget', 'edit') && (
              <button
                onClick={() => handleOpenBudgetAllocation(budgetLine)}
                className="p-2 rounded-full hover:bg-green-100 transition-colors cursor-pointer"
                title="Manage Budget Allocations"
              >
                <Plus size={14} className="text-green-600" />
              </button>
            )}
          </div>
        );
      }
    }
  ], []);

  // AG Grid default column properties
  const defaultColDef = useMemo(() => ({
    sortable: true,
    filter: true,
    resizable: true,
    floatingFilter: false,
    filterParams: {
      buttons: ['reset', 'apply'],
      closeOnApply: true,
    },
    suppressMenu: false,
    menuTabs: ['filterMenuTab'],
  }), []);

  return (
    <div className="w-full">
      {/* Error display */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* AG Grid Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="ag-theme-alpine" style={{ height: '76vh', width: '100%' }}>
          <style jsx>{`
            .ag-theme-alpine .ag-header {
              background-color: #15803d!important;
              color: white;
              font-weight: 600;
              border-bottom: 2px solid #047857;
            }
            .ag-theme-alpine .ag-header-cell {
              color: white;
              border-right: 1px solid #047857;
              font-weight: 600;
              font-size: 14px;
            }
            .ag-theme-alpine .ag-sort-ascending-icon,
            .ag-theme-alpine .ag-sort-descending-icon,
            .ag-theme-alpine .ag-sort-none-icon {
              color:rgb(246, 246, 246) !important;
              font-size: 20px !important;
              width: 20px !important;
              height: 20px !important;
              transform: scale(1.2) !important;
            }
            .ag-theme-alpine .ag-icon {
              color:rgb(246, 246, 246) !important;
              font-size: 20px !important;
              width: 20px !important;
              height: 20px !important;
              transform: scale(1.2) !important;
            }
            .ag-theme-alpine .ag-header-cell .ag-icon {
              color:rgb(223, 223, 223) !important;
              font-size: 20px !important;
              width: 20px !important;
              height: 20px !important;
              transform: scale(1.2) !important;
            }
            .ag-theme-alpine .ag-header-cell-menu-button {
              color:rgb(244, 240, 236) !important;
              padding: 4px !important;
            }
            .ag-theme-alpine .ag-header-cell-menu-button .ag-icon {
              font-size: 20px !important;
              width: 20px !important;
              height: 20px !important;
              transform: scale(1.2) !important;
            }
            .ag-theme-alpine .ag-header-cell:hover {
              background-color: #047857;
            }
            .ag-theme-alpine .ag-row {
              border-bottom: 1px solid #e5e7eb;
            }
            .ag-theme-alpine .ag-row:hover {
              background-color: #f0fdf4;
            }
            .ag-theme-alpine .ag-row-even {
              background-color: #ffffff;
            }
            .ag-theme-alpine .ag-row-odd {
              background-color: #f9fafb;
            }
            .ag-theme-alpine .ag-cell {
              display: block !important;
              text-align: left !important;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              word-break: break-word;
              overflow-wrap: anywhere;
              border-right: 1px solid #e5e7eb;
              padding: 8px 12px;
              font-size: 14px;
            }
            .ag-theme-alpine .ag-pinned-left-cols-container {
              border-right: 2px solid #d1d5db;
            }
            .ag-theme-alpine .ag-paging-panel {
              border-top: 2px solid #e5e7eb;
              background-color: #f0fdf4;
              padding: 16px 20px;
              display: flex;
              align-items: center;
              justify-content: space-between;
              font-size: 14px;
              font-weight: 600;
              color: #1f2937;
              border-radius: 0 0 8px 8px;
              box-shadow: inset 0 1px 0 #d1d5db;
            }
          `}</style>
          <AgGridReact
            ref={gridRef}
            columnDefs={columnDefs}
            rowData={filteredBudgetLineData}
            defaultColDef={defaultColDef}
            pagination={true}
            paginationPageSize={10}
            paginationPageSizeSelector={[5, 10, 15, 20, 25, 50]}
            suppressMovableColumns={true}
            suppressRowClickSelection={true}
            enableBrowserTooltips={true}

            noRowsOverlayComponent={() => (
              <div className="flex items-center justify-center h-full">
                <div className="text-gray-500 text-center">
                  <FileText size={48} className="mx-auto mb-2 text-gray-300" />
                  <p className="text-lg font-medium">No budget lines found</p>
                  <p className="text-sm">Try adjusting your search or add a new budget line</p>
                </div>
              </div>
            )}
            loading={loading}
            animateRows={true}
            rowHeight={48}
            headerHeight={48}
            suppressCellFocus={true}
            suppressRowHoverHighlight={false}
            rowClassRules={{
              'ag-row-hover': 'true'
            }}
            gridOptions={{
              getRowStyle: (params) => {
                if (params.node.rowIndex % 2 === 0) {
                  return { backgroundColor: '#ffffff' };
                } else {
                  return { backgroundColor: '#f9fafb' };
                }
              }
            }}
          />
        </div>
      </div>

      {/* View Budget Line Modal */}
      <ViewBudgetLineModal
        open={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedBudgetLine(null);
        }}
        budgetLine={selectedBudgetLine}
      />

             {/* Add Budget Line Modal */}
      {/* Add Budget Line Modal (edit access) */}
      {hasAccess && hasAccess('budget', 'edit') && (
        <AddBudgetLineModal
          open={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSubmit={handleModalSubmit}
        />
      )}

      {/* Edit Budget Line Modal (edit access) */}
      {hasAccess && hasAccess('budget', 'edit') && (
        <AddBudgetLineModal
          open={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedBudgetLine(null);
          }}
          onSubmit={handleModalSubmit}
          budgetLine={selectedBudgetLine}
          isEdit={true}
        />
      )}

      {/* Budget Allocation Modal */}
      <BudgetAllocationModal
        open={isBudgetAllocationModalOpen}
        onClose={() => {
          setIsBudgetAllocationModalOpen(false);
          setSelectedBudgetLine(null);
        }}
        budgetLineId={selectedBudgetLine?.budgetId}
        budgetLineName={selectedBudgetLine?.budgetName}
        currency={selectedBudgetLine?.currency}
        budgetLine={selectedBudgetLine}
      />


    </div>
  );
});

BudgetLineManagement.displayName = 'BudgetLineManagement';

export default BudgetLineManagement;