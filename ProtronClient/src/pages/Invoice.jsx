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


const ViewInvoiceModal = ({ open, onClose, invoice }) => {
  if (!open || !invoice) return null;

  // Format currency (matching other modals)
  const formatCurrency = (amount, currency = 'USD') => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(parseFloat(amount));
  };

  // Format date (matching other modals)
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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

  const handleDownloadPDF = async () => {
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
  };

  // Field component for consistent styling (matching other modals)
  const Field = ({ label, value, className = "" }) => (
    <div className={className}>
      <label className="text-xs font-medium text-gray-600 mb-1 block">{label}</label>
      <div className="text-sm text-gray-900 font-medium">
        {value || "N/A"}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-[95vw] sm:max-w-6xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 bg-green-600 text-white rounded-t-lg">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
              <FileText size={20} className="sm:w-6 sm:h-6 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <h2 className="text-lg sm:text-xl font-bold truncate">Invoice Details</h2>
                <p className="text-green-100 text-xs sm:text-sm truncate">Invoice ID: {invoice.invoiceId || 'N/A'}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 hover:bg-green-700 rounded-lg transition-colors flex-shrink-0"
            >
              <X size={18} className="sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
          {/* Basic Invoice Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <FileText className="mr-2 text-green-600" size={20} />
              Basic Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <Field
                label="Invoice ID"
                value={invoice.invoiceId}
              />
              <Field
                label="Invoice Name"
                value={invoice.invoiceName}
              />
              <Field
                label="Currency"
                value={invoice.currency}
              />
              <Field
                label="Total Amount"
                value={formatCurrency(invoice.totalAmount, invoice.currency)}
              />
              <Field
                label="Rate per Hour"
                value={formatCurrency(invoice.rate, invoice.currency)}
              />
              <Field
                label="Hours Spent"
                value={invoice.hoursSpent}
              />
              <Field
                label="Created Date"
                value={formatDate(invoice.createdAt)}
                className="sm:col-span-2"
              />
            </div>
          </div>

          {/* Client & Employee Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <User className="mr-2 text-green-600" size={20} />
              Client & Employee Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <Field
                label="Customer Name"
                value={invoice.customerName}
              />
              <Field
                label="Supplier Name"
                value={invoice.supplierName}
              />
              <Field
                label="Employee Name"
                value={invoice.employeeName}
              />
            </div>
          </div>

          {/* Invoice Period */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <Calendar className="mr-2 text-green-600" size={20} />
              Invoice Period
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <Field
                label="From Date"
                value={formatDate(invoice.fromDate)}
              />
              <Field
                label="To Date"
                value={formatDate(invoice.toDate)}
              />
            </div>
          </div>

          {/* Payment Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <CreditCard className="mr-2 text-green-600" size={20} />
              Payment Summary
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <Field
                label="Rate per Hour"
                value={formatCurrency(invoice.rate, invoice.currency)}
              />
              <Field
                label="Total Hours"
                value={`${invoice.hoursSpent || '0'} hours`}
              />
              <Field
                label="Total Amount"
                value={formatCurrency(invoice.totalAmount, invoice.currency)}
              />
            </div>
          </div>

          {/* Remarks */}
          {invoice.remarks && invoice.remarks.trim() !== '' && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                <Edit className="mr-2 text-green-600" size={20} />
                Remarks
              </h3>
              <div className="bg-white rounded p-2 sm:p-3 border max-h-32 sm:max-h-40 overflow-y-auto">
                <p className="text-xs sm:text-sm text-gray-900 leading-relaxed whitespace-pre-wrap break-words">
                  {invoice.remarks}
                </p>
              </div>
            </div>
          )}

          {/* Attachments */}
          {invoice.attachmentFileNames && invoice.attachmentFileNames.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                <Paperclip className="mr-2 text-green-600" size={20} />
                Attachments ({invoice.attachmentCount || invoice.attachmentFileNames.length})
              </h3>
              <div className="space-y-1 sm:space-y-2">
                {invoice.attachmentFileNames.map((fileName, index) => (
                  <button
                    key={index}
                    onClick={() => handleAttachmentClick(index, fileName)}
                    className="flex items-center text-blue-700 hover:text-blue-900 hover:bg-blue-50 text-xs sm:text-sm p-2 sm:p-3 rounded border bg-white w-full text-left transition-colors"
                  >
                    <div className="flex-shrink-0 mr-2 sm:mr-3">
                      {getFileIcon(fileName)}
                    </div>
                    <div className="flex-1 truncate min-w-0">
                      <p className="font-medium truncate">{fileName}</p>
                      <p className="text-xs text-gray-500">Click to download</p>
                    </div>
                    <Download size={12} className="sm:w-3.5 sm:h-3.5 ml-1 sm:ml-2 flex-shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Invoice Actions */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
              <Download className="mr-2 text-green-600" size={20} />
              Invoice Actions
            </h3>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button
                onClick={handleDownloadPDF}
                className="flex items-center justify-center px-3 sm:px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm sm:text-base"
              >
                <Download size={14} className="sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                Download PDF
              </button>
            </div>
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