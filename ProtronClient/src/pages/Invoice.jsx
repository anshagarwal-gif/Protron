// InvoiceManagement.js
import React, { useState, useEffect, useMemo, forwardRef, useImperativeHandle } from "react";
import { AgGridReact } from 'ag-grid-react';
import {
  Eye,
  Edit,
  Download,
  Paperclip,
  FileText,
  User,
  Building,
  DollarSign,
  Calendar,
  Loader2
} from "lucide-react";
import axios from "axios";
import AddInvoiceModal from "../components/AddInvoice";

const InvoiceManagement = forwardRef(({ searchQuery, setSearchQuery }, ref) => {
  // State management
  const [invoiceList, setInvoiceList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [downloadingInvoice, setDownloadingInvoice] = useState(null);
  const [downloadingAttachment, setDownloadingAttachment] = useState(null);

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

  // Handle view invoice (you can implement a view modal here)
  const handleViewInvoice = (invoice) => {
    setSelectedInvoice(invoice);
    console.log("Viewing invoice:", invoice);
    // Implement view modal here if needed
  };

  // Handle edit invoice (you can implement an edit modal here)
  const handleEditInvoice = (invoice) => {
    console.log("Editing invoice:", invoice);
    // Implement edit modal here if needed
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
          <User size={14} className="text-green-600 mr-2" />
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
          <DollarSign size={14} className="mr-1" />
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
      headerName: "Attachments",
      field: "attachments",
      width: 120,
      sortable: false,
      filter: false,
      cellRenderer: params => {
        const invoice = params.data;
        const attachmentCount = invoice.attachmentCount || 0;
        
        if (attachmentCount === 0) {
          return <span className="text-gray-400 text-sm">No files</span>;
        }

        return (
          <div className="flex items-center space-x-1">
            <Paperclip size={14} className="text-green-600" />
            <span className="text-sm font-medium text-green-600">
              {attachmentCount} file{attachmentCount > 1 ? 's' : ''}
            </span>
          </div>
        );
      }
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
      width: 200,
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
              title="View Invoice"
            >
              <Eye size={14} className="text-blue-600" />
            </button>

            {/* Edit Button */}
            <button
              onClick={() => handleEditInvoice(invoice)}
              className="p-2 rounded-full hover:bg-blue-100 transition-colors"
              title="Edit Invoice"
            >
              <Edit size={14} className="text-blue-600" />
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

            {/* Download Attachments Dropdown */}
            {attachmentCount > 0 && (
              <div className="relative group">
                <button
                  className="p-2 rounded-full hover:bg-orange-100 transition-colors"
                  title={`Download Attachments (${attachmentCount})`}
                >
                  <Paperclip size={14} className="text-orange-600" />
                </button>
                
                {/* Dropdown menu for attachments */}
                <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 min-w-40">
                  {invoice.attachmentFileNames?.map((fileName, index) => (
                    <button
                      key={index}
                      onClick={() => handleDownloadAttachment(
                        invoice.invoiceId, 
                        index + 1, 
                        fileName
                      )}
                      disabled={downloadingAttachment === `${invoice.invoiceId}-${index + 1}`}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors disabled:opacity-50 flex items-center"
                    >
                      {downloadingAttachment === `${invoice.invoiceId}-${index + 1}` ? (
                        <Loader2 size={12} className="mr-2 animate-spin" />
                      ) : (
                        <Download size={12} className="mr-2" />
                      )}
                      <span className="truncate" title={fileName}>
                        {fileName}
                      </span>
                    </button>
                  )) || (
                    <div className="px-3 py-2 text-sm text-gray-500">
                      No attachments available
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      }
    }
  ], [downloadingInvoice, downloadingAttachment]);

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