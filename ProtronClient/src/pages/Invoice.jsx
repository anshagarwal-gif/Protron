// InvoiceManagement.js
import React, { useState, useEffect, useMemo, forwardRef, useImperativeHandle } from "react";
import { AgGridReact } from 'ag-grid-react';
import {
  Eye,
  Download,
  Paperclip,
  FileText,
  User,
  Building,
  DollarSign,
  Calendar,
  Loader2,
  Trash2,
  X,
  File,
  Image,
  Archive,
  Clock,
  CreditCard,
  Edit
} from "lucide-react";
import axios from "axios";
import AddInvoiceModal from "../components/AddInvoice";

// ViewInvoiceModal Component
const ViewInvoiceModal = ({ open, onClose, invoice }) => {
  if (!open || !invoice) return null;

  const formatCurrency = (amount, currencyCode) => {
    if (!amount) return 'N/A';
    const getCurrencySymbol = (currencyCode) => {
      const currencySymbols = {
        'USD': '$', 'EUR': '€', 'GBP': '£', 'JPY': '¥', 'INR': '₹',
        'CAD': 'C$', 'AUD': 'A$', 'CHF': 'CHF', 'CNY': '¥'
      };
      return currencySymbols[currencyCode] || currencyCode || '$';
    };
    const symbol = getCurrencySymbol(currencyCode);
    return `${symbol}${parseFloat(amount).toLocaleString()}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const getFileIcon = (fileName) => {
    if (!fileName) return <File size={16} />;
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg'].includes(extension)) {
      return <Image size={16} className="text-green-600" />;
    } else if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension)) {
      return <Archive size={16} className="text-purple-600" />;
    } else {
      return <File size={16} className="text-blue-600" />;
    }
  };

  const handleAttachmentClick = async (attachmentIndex, fileName) => {
    try {
      const token = sessionStorage.getItem("token");
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/invoices/download-attachment/${invoice.invoiceId}/${attachmentIndex + 1}`,
        {
          headers: { Authorization: token },
          responseType: 'blob'
        }
      );

      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName || `attachment_${attachmentIndex + 1}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download attachment:", error);
      alert("Failed to download attachment");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-blue-700 text-white p-4 rounded-t-lg flex justify-between items-center sticky top-0 z-10">
          <div>
            <h2 className="text-xl font-bold">Invoice Details</h2>
            <p className="text-blue-100 text-sm">ID: {invoice.invoiceId}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-blue-600 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Invoice Information */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center">
                <FileText size={20} className="mr-2" />
                INVOICE INFORMATION
              </h3>
              
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600 uppercase tracking-wide">Invoice ID</label>
                    <p className="text-gray-900 font-semibold break-words">{invoice.invoiceId || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600 uppercase tracking-wide">Invoice Name</label>
                    <p className="text-blue-600 font-semibold break-words">{invoice.invoiceName || 'N/A'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600 uppercase tracking-wide">Currency</label>
                    <span className="inline-block mt-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {invoice.currency || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600 uppercase tracking-wide">Total Amount</label>
                    <p className="text-green-600 font-bold text-lg break-words">
                      {formatCurrency(invoice.totalAmount, invoice.currency)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600 uppercase tracking-wide">Rate</label>
                    <p className="text-gray-900 font-medium break-words">
                      {formatCurrency(invoice.rate, invoice.currency)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600 uppercase tracking-wide">Hours Spent</label>
                    <p className="text-gray-700 font-medium">{invoice.hoursSpent || 'N/A'}</p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600 uppercase tracking-wide">Created Date</label>
                  <p className="text-gray-700">{formatDate(invoice.createdAt)}</p>
                </div>
              </div>
            </div>

            {/* Client & Employee Details */}
            <div className="bg-green-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-green-800 mb-4 flex items-center">
                <User size={20} className="mr-2" />
                CLIENT & EMPLOYEE DETAILS
              </h3>
              
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-green-600 uppercase tracking-wide">Customer Name</label>
                  <div className="flex items-center mt-1">
                    <Building size={16} className="text-green-600 mr-2" />
                    <p className="text-gray-900 font-semibold break-words">
                      {invoice.customerName || 'N/A'}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-green-600 uppercase tracking-wide">Supplier Name</label>
                  <div className="flex items-center mt-1">
                    <Building size={16} className="text-green-600 mr-2" />
                    <p className="text-gray-900 font-semibold break-words">
                      {invoice.supplierName || 'N/A'}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-green-600 uppercase tracking-wide">Employee Name</label>
                  <div className="flex items-center mt-1">
                    <User size={16} className="text-green-600 mr-2" />
                    <p className="text-gray-900 font-semibold break-words">
                      {invoice.employeeName || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Invoice Period */}
          <div className="bg-purple-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-purple-800 mb-3 flex items-center">
              <Calendar size={20} className="mr-2" />
              INVOICE PERIOD
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-purple-600 uppercase tracking-wide">From Date</label>
                <div className="flex items-center mt-1">
                  <Clock size={16} className="text-purple-600 mr-2" />
                  <p className="text-gray-900 font-medium">{formatDate(invoice.fromDate)}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-purple-600 uppercase tracking-wide">To Date</label>
                <div className="flex items-center mt-1">
                  <Clock size={16} className="text-purple-600 mr-2" />
                  <p className="text-gray-900 font-medium">{formatDate(invoice.toDate)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Details */}
          <div className="bg-yellow-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-yellow-800 mb-3 flex items-center">
              <CreditCard size={20} className="mr-2" />
              PAYMENT DETAILS
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-yellow-600 uppercase tracking-wide">Rate per Hour</label>
                <p className="text-green-600 font-bold text-lg">
                  {formatCurrency(invoice.rate, invoice.currency)}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-yellow-600 uppercase tracking-wide">Total Hours</label>
                <p className="text-gray-900 font-bold text-lg">{invoice.hoursSpent || '0'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-yellow-600 uppercase tracking-wide">Total Amount</label>
                <p className="text-green-600 font-bold text-xl">
                  {formatCurrency(invoice.totalAmount, invoice.currency)}
                </p>
              </div>
            </div>
          </div>

          {/* Remarks */}
          {(invoice.remarks && invoice.remarks.trim() !== '') && (
            <div className="bg-orange-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-orange-800 mb-3 flex items-center">
                <Edit size={20} className="mr-2" />
                REMARKS
              </h3>
              <div className="text-gray-700 leading-relaxed break-all word-wrap overflow-wrap-anywhere max-h-32 overflow-y-auto bg-white p-3 rounded border" style={{ wordBreak: 'break-all', overflowWrap: 'anywhere' }}>
                {invoice.remarks}
              </div>
            </div>
          )}

          {/* Attachments */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
              <Paperclip size={20} className="mr-2" />
              ATTACHMENTS ({invoice.attachmentCount || 0})
            </h3>
            
            {invoice.attachmentFileNames && invoice.attachmentFileNames.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-48 overflow-y-auto">
                {invoice.attachmentFileNames.map((fileName, index) => (
                  <div 
                    key={index}
                    onClick={() => handleAttachmentClick(index, fileName)}
                    className="flex items-center p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group"
                  >
                    <div className="flex-shrink-0 mr-3">
                      {getFileIcon(fileName)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate group-hover:text-blue-600" title={fileName}>
                        {fileName}
                      </p>
                      <p className="text-xs text-gray-500">
                        Click to download
                      </p>
                    </div>
                    <Download size={14} className="text-gray-400 group-hover:text-blue-600" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Paperclip size={48} className="mx-auto text-gray-300 mb-2" />
                <p className="text-gray-500">No attachments available</p>
              </div>
            )}
          </div>

          {/* Invoice Actions */}
          <div className="bg-indigo-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-indigo-800 mb-3 flex items-center">
              <Download size={20} className="mr-2" />
              INVOICE ACTIONS
            </h3>
            <div className="flex gap-3">
              <button
                onClick={async () => {
                  try {
                    const token = sessionStorage.getItem("token");
                    const response = await axios.get(
                      `${import.meta.env.VITE_API_URL}/api/invoices/download/${invoice.invoiceId}`,
                      {
                        headers: { Authorization: token },
                        responseType: 'blob'
                      }
                    );

                    const blob = new Blob([response.data], { type: 'application/pdf' });
                    const url = window.URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `${invoice.invoiceName || invoice.invoiceId}.pdf`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    window.URL.revokeObjectURL(url);
                  } catch (error) {
                    console.error("Failed to download invoice PDF:", error);
                    alert("Failed to download invoice PDF");
                  }
                }}
                className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Download size={16} className="mr-2" />
                Download PDF
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const InvoiceManagement = forwardRef(({ searchQuery, setSearchQuery }, ref) => {
  // State management
  const [invoiceList, setInvoiceList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [downloadingInvoice, setDownloadingInvoice] = useState(null);
  const [downloadingAttachment, setDownloadingAttachment] = useState(null);
  const [deletingInvoice, setDeletingInvoice] = useState(null);

  // Currency symbols mapping
  const currencySymbols = {
    USD: '$',
    INR: '₹',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
    CAD: 'C$',
    AUD: 'A$'
  };

  // Custom loading overlay component
  const LoadingOverlay = () => (
    <div className="flex items-center justify-center h-full">
      <div className="flex items-center space-x-2">
        <Loader2 className="animate-spin text-green-700" size={24} />
        <span className="text-green-700 font-medium">Loading...</span>
      </div>
    </div>
  );

  // Fetch invoice data
  const fetchInvoiceData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = sessionStorage.getItem('token');
      if (!token) {
        throw new Error("Missing authentication credentials");
      }

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/invoices`,
        {
          headers: { Authorization: token }
        }
      );

      setInvoiceList(response.data || []);
    } catch (error) {
      console.error("Error fetching invoice data:", error);
      setError(error.message || "Failed to fetch invoice data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoiceData();
  }, []);

  // Filter invoice data based on search
  const filteredInvoiceData = invoiceList.filter(invoice => {
    if (searchQuery === "") return true;

    const searchLower = searchQuery.toLowerCase();
    return (
      invoice.invoiceId?.toLowerCase().includes(searchLower) ||
      invoice.invoiceName?.toLowerCase().includes(searchLower) ||
      invoice.customerName?.toLowerCase().includes(searchLower) ||
      invoice.supplierName?.toLowerCase().includes(searchLower) ||
      invoice.employeeName?.toLowerCase().includes(searchLower) ||
      invoice.currency?.toLowerCase().includes(searchLower) ||
      invoice.totalAmount?.toString().includes(searchLower)
    );
  });

  // Format currency
  const formatCurrency = (amount, currency) => {
    if (!amount) return 'N/A';
    const symbol = currencySymbols[currency] || '$';
    return `${symbol}${parseFloat(amount).toLocaleString()}`;
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  // Handle invoice PDF download
  const handleDownloadInvoicePDF = async (invoiceId, invoiceName) => {
    try {
      setDownloadingInvoice(invoiceId);
      const token = sessionStorage.getItem("token");
      
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/invoices/download/${invoiceId}`,
        {
          headers: { Authorization: token },
          responseType: 'blob'
        }
      );

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${invoiceName || invoiceId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error("Failed to download invoice PDF:", error);
      alert("Failed to download invoice PDF");
    } finally {
      setDownloadingInvoice(null);
    }
  };

  // Handle attachment download
  const handleDownloadAttachment = async (invoiceId, attachmentNumber, fileName) => {
    try {
      setDownloadingAttachment(`${invoiceId}-${attachmentNumber}`);
      const token = sessionStorage.getItem("token");
      
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/invoices/download-attachment/${invoiceId}/${attachmentNumber}`,
        {
          headers: { Authorization: token },
          responseType: 'blob'
        }
      );

      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName || `attachment_${attachmentNumber}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error("Failed to download attachment:", error);
      alert("Failed to download attachment");
    } finally {
      setDownloadingAttachment(null);
    }
  };

  // Handle view invoice - Updated to open modal
  const handleViewInvoice = (invoice) => {
    setSelectedInvoice(invoice);
    setIsViewModalOpen(true);
  };

  // Handle soft delete invoice
  const handleSoftDeleteInvoice = async (invoiceId, invoiceName) => {
    // Show confirmation dialog
    const confirmed = window.confirm(
      `Are you sure you want to delete the invoice "${invoiceName || invoiceId}"? This action can be undone by an administrator.`
    );
    
    if (!confirmed) return;

    try {
      setDeletingInvoice(invoiceId);
      const token = sessionStorage.getItem("token");
      
      const response = await axios.delete(
        `${import.meta.env.VITE_API_URL}/api/invoices/${invoiceId}`,
        {
          headers: { Authorization: token }
        }
      );

      if (response.status === 200 || response.status === 204) {
        // Remove the invoice from the local state
        setInvoiceList(prevList => 
          prevList.filter(invoice => invoice.invoiceId !== invoiceId)
        );
        
        // Show success message
        alert("Invoice deleted successfully");
      }
      
    } catch (error) {
      console.error("Failed to delete invoice:", error);
      
      // Handle different error scenarios
      if (error.response?.status === 404) {
        alert("Invoice not found");
      } else if (error.response?.status === 403) {
        alert("You don't have permission to delete this invoice");
      } else if (error.response?.status === 409) {
        alert("Invoice cannot be deleted due to existing dependencies");
      } else {
        alert("Failed to delete invoice. Please try again.");
      }
    } finally {
      setDeletingInvoice(null);
    }
  };

  // Excel download function
  const downloadInvoiceExcel = () => {
    try {
      const excelData = filteredInvoiceData.map((invoice, index) => ({
        'S.No': index + 1,
        'Invoice ID': invoice.invoiceId || 'N/A',
        'Invoice Name': invoice.invoiceName || 'N/A',
        'Customer Name': invoice.customerName || 'N/A',
        'Supplier Name': invoice.supplierName || 'N/A',
        'Employee Name': invoice.employeeName || 'N/A',
        'Rate': invoice.rate ? formatCurrency(invoice.rate, invoice.currency) : 'N/A',
        'Currency': invoice.currency || 'N/A',
        'Hours Spent': invoice.hoursSpent || 'N/A',
        'Total Amount': formatCurrency(invoice.totalAmount, invoice.currency),
        'From Date': formatDate(invoice.fromDate),
        'To Date': formatDate(invoice.toDate),
        'Created Date': formatDate(invoice.createdAt),
        'Attachments': invoice.attachmentCount || 0,
        'Remarks': invoice.remarks || 'N/A'
      }));

      const headers = Object.keys(excelData[0] || {});
      const csvContent = [
        headers.join(','),
        ...excelData.map(row =>
          headers.map(header => {
            const value = row[header] || '';
            return typeof value === 'string' && value.includes(',')
              ? `"${value.replace(/"/g, '""')}"`
              : value;
          }).join(',')
        )
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `invoice_list_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('Error downloading invoice Excel:', error);
      alert('Failed to download Excel file. Please try again.');
    }
  };

  // Handle add invoice
  const handleAddInvoice = () => {
    setIsAddModalOpen(true);
  };

  // Handle modal submit
  const handleModalSubmit = (data) => {
    console.log("Invoice created successfully:", data);
    fetchInvoiceData(); // Refresh the table
    setIsAddModalOpen(false);
  };

  // Expose functions to parent component
  useImperativeHandle(ref, () => ({
    downloadInvoiceExcel,
    handleAddInvoice,
    fetchInvoiceData
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
      headerName: "Invoice ID",
      field: "invoiceId",
      valueGetter: params => params.data.invoiceId || 'N/A',
      flex: 1,
      minWidth: 150,
      sortable: true,
      filter: true,
      cellStyle: { fontWeight: 'bold', color: '#1f2937' }
    },
    {
      headerName: "Invoice Name",
      field: "invoiceName",
      valueGetter: params => params.data.invoiceName || 'N/A',
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
      headerName: "Customer",
      field: "customerName",
      valueGetter: params => params.data.customerName || 'N/A',
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
      headerName: "Employee",
      field: "employeeName",
      valueGetter: params => params.data.employeeName || 'N/A',
      flex: 1,
      minWidth: 150,
      sortable: true,
      filter: true,
      cellRenderer: params => (
        <div className="flex items-center">
         
          <span className="truncate" title={params.value}>{params.value}</span>
        </div>
      )
    },
    {
      headerName: "Amount",
      field: "totalAmount",
      valueGetter: params => formatCurrency(params.data.totalAmount, params.data.currency),
      width: 140,
      sortable: true,
      filter: true,
      cellRenderer: params => (
        <div className="flex items-center font-bold text-green-600">
          {params.value}
        </div>
      )
    },
    {
      headerName: "Period",
      field: "period",
      valueGetter: params => {
        const fromDate = formatDate(params.data.fromDate);
        const toDate = formatDate(params.data.toDate);
        return `${fromDate} - ${toDate}`;
      },
      width: 180,
      sortable: false,
      filter: false,
      cellRenderer: params => (
        <div className="flex items-center text-sm">
          <Calendar size={14} className="text-blue-600 mr-2" />
          <span className="truncate" title={params.value}>{params.value}</span>
        </div>
      )
    },
    {
      headerName: "Hours",
      field: "hoursSpent",
      valueGetter: params => params.data.hoursSpent || 'N/A',
      width: 100,
      sortable: true,
      filter: true,
      cellStyle: { textAlign: 'center', fontWeight: 'bold' }
    },
    {
      headerName: "Created Date",
      field: "createdAt",
      valueGetter: params => formatDate(params.data.createdAt),
      width: 120,
      sortable: true,
      filter: true,
      cellStyle: { fontSize: '12px', color: '#6b7280' }
    },
    {
      headerName: "Actions",
      field: "actions",
      width: 180,
      sortable: false,
      filter: false,
      suppressMenu: true,
      cellRenderer: params => {
        const invoice = params.data;
        const attachmentCount = invoice.attachmentCount || 0;
        
        return (
          <div className="flex justify-center gap-1 h-full items-center">
            {/* View Button */}
            <button
              onClick={() => handleViewInvoice(invoice)}
              className="p-2 rounded-full hover:bg-blue-100 transition-colors"
              title="View Invoice Details"
            >
              <Eye size={14} className="text-blue-600" />
            </button>

            {/* Download PDF Button */}
            <button
              onClick={() => handleDownloadInvoicePDF(invoice.invoiceId, invoice.invoiceName)}
              disabled={downloadingInvoice === invoice.invoiceId}
              className="p-2 rounded-full hover:bg-green-100 transition-colors disabled:opacity-50"
              title="Download PDF"
            >
              {downloadingInvoice === invoice.invoiceId ? (
                <Loader2 size={14} className="text-green-600 animate-spin" />
              ) : (
                <Download size={14} className="text-green-600" />
              )}
            </button>

            {/* Delete Button */}
            <button
              onClick={() => handleSoftDeleteInvoice(invoice.invoiceId, invoice.invoiceName)}
              disabled={deletingInvoice === invoice.invoiceId}
              className="p-2 rounded-full hover:bg-red-100 transition-colors disabled:opacity-50"
              title="Delete Invoice"
            >
              {deletingInvoice === invoice.invoiceId ? (
                <Loader2 size={14} className="text-red-600 animate-spin" />
              ) : (
                <Trash2 size={14} className="text-red-600" />
              )}
            </button>
          </div>
        );
      }
    }
  ], [downloadingInvoice, downloadingAttachment, deletingInvoice]);

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
            columnDefs={columnDefs}
            rowData={filteredInvoiceData}
            defaultColDef={defaultColDef}
            pagination={true}
            paginationPageSize={10}
            paginationPageSizeSelector={[5, 10, 15, 20, 25, 50]}
            suppressMovableColumns={true}
            suppressRowClickSelection={true}
            enableBrowserTooltips={true}
            loadingOverlayComponent={LoadingOverlay}
            noRowsOverlayComponent={() => (
              <div className="flex items-center justify-center h-full">
                <div className="text-gray-500 text-center">
                  <FileText size={48} className="mx-auto mb-2 text-gray-300" />
                  <p className="text-lg font-medium">No invoices found</p>
                  <p className="text-sm">Try adjusting your search or add a new invoice</p>
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

      {/* View Invoice Modal */}
      <ViewInvoiceModal
        open={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedInvoice(null);
        }}
        invoice={selectedInvoice}
      />

      {/* Add Invoice Modal */}
      <AddInvoiceModal
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleModalSubmit}
      />
    </div>
  );
});

InvoiceManagement.displayName = 'InvoiceManagement';

export default InvoiceManagement;