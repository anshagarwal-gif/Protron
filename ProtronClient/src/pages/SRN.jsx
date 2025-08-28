// SRNManagement.js
import { useState, useEffect, useMemo, forwardRef, useImperativeHandle } from "react";
import { useNavigate } from "react-router-dom";
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

import {
  Receipt,
  Plus,
  Search,
  Edit,
  Download,
  Loader2,
  DollarSign,
  Building,
  User,
  FileText,
  Trash2,
  Paperclip,
  Eye
} from "lucide-react";
import { useAccess } from "../Context/AccessContext";
import axios from "axios";
import GlobalSnackbar from "../components/GlobalSnackbar";
import AddSRNModal from "../components/AddSRNModal";
import SRNDetailsModal from "../components/SRNDetailsModal";
import EditSRNModal from "../components/EditSRNModal";
// import EditSRNModal from "../components/EditSRNModal";

const SRNManagement = forwardRef(({ searchQuery, setSearchQuery }, ref) => {
  const navigate = useNavigate();
  const { hasAccess } = useAccess();

  // State management
  const [srnList, setSRNList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedSRNId, setSelectedSRNId] = useState(null);

  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
const [selectedSRNDetails, setSelectedSRNDetails] = useState(null);

  const handleViewSRNDetails = async (srn) => {
  try {
    const token = sessionStorage.getItem('token');
    const response = await axios.get(
      `${import.meta.env.VITE_API_URL}/api/srn/${srn.srnId}`,
      {
        headers: { Authorization: `${token}` }
      }
    );
    setSelectedSRNDetails(response.data);
    setIsDetailsModalOpen(true);
  } catch (error) {
    console.error("Error fetching SRN details:", error);
    showSnackbar("Failed to fetch SRN details", "error");
  }
};

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    downloadSRNExcel,
    handleAddSRN: () => setIsAddModalOpen(true),
    fetchSRNData
  }));

  // Global snackbar state
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info"
  });

  const showSnackbar = (message, severity = "info") => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
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

  // Currency symbol mapping
  const getCurrencySymbol = (currencyCode) => {
    const currencySymbols = {
      'USD': '$',
      'EUR': '€',
      'GBP': '£',
      'JPY': '¥',
      'INR': '₹',
      'CAD': 'C$',
      'AUD': 'A$',
      'CHF': 'CHF',
      'CNY': '¥',
      'SEK': 'kr',
      'NOK': 'kr',
      'MXN': '$',
      'NZD': 'NZ$',
      'SGD': 'S$',
      'HKD': 'HK$',
      'ZAR': 'R',
      'BRL': 'R$',
      'RUB': '₽',
      'KRW': '₩',
      'TRY': '₺',
      'PLN': 'zł',
      'THB': '฿',
      'IDR': 'Rp',
      'MYR': 'RM',
      'PHP': '₱',
      'CZK': 'Kč',
      'HUF': 'Ft',
      'ILS': '₪',
      'CLP': '$',
      'PEN': 'S/',
      'COP': '$',
      'ARS': '$',
      'EGP': 'E£',
      'SAR': 'SR',
      'AED': 'د.إ',
      'QAR': 'QR',
      'KWD': 'KD',
      'BHD': 'BD',
      'OMR': 'OMR',
      'JOD': 'JD',
      'LBP': 'L£',
      'PKR': 'Rs',
      'BDT': '৳',
      'LKR': 'Rs',
      'NPR': 'Rs',
      'MMK': 'K',
      'VND': '₫',
      'KHR': '៛',
      'LAK': '₭',
      'TWD': 'NT$',
      'MOP': 'MOP$',
      'BND': 'B$',
      'FJD': 'FJ$',
      'PGK': 'K',
      'TOP': 'T$',
      'SBD': 'SI$',
      'VUV': 'VT',
      'WST': 'WS$'
    };
    
    return currencySymbols[currencyCode] || currencyCode || '$';
  };

  // Fetch SRN data
  const fetchSRNData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = sessionStorage.getItem('token');
      if (!token) {
        throw new Error("Missing authentication credentials");
      }

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/srn/all`,
        {
          headers: { Authorization: `${token}` }
        }
      );

      setSRNList(response.data);
    } catch (error) {
      console.error("Error fetching SRN data:", error);
      setError(error.message || "Failed to fetch SRN data");
      showSnackbar("Failed to fetch SRN data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSRNData();
  }, []);

  // Filter SRN data based on search
  const filteredSRNData = srnList.filter(srn => {
    if (!searchQuery || searchQuery === "") return true;
    
    const searchLower = searchQuery.toLowerCase();
    return (
      srn.poNumber?.toLowerCase().includes(searchLower) ||
      srn.srnId?.toString().includes(searchLower) ||
      srn.milestone?.msName?.toLowerCase().includes(searchLower) ||
      srn.srnName?.toLowerCase().includes(searchLower) ||
      srn.srnDsc?.toLowerCase().includes(searchLower) ||
      srn.srnAmount?.toString().includes(searchLower) ||
      srn.srnCurrency?.toLowerCase().includes(searchLower) ||
      srn.srnRemarks?.toLowerCase().includes(searchLower)
    );
  });

  // Excel download function
  const downloadSRNExcel = () => {
    try {
      const excelData = filteredSRNData.map((srn, index) => ({
        'S.No': index + 1,
        'PO Number': srn.poNumber || 'N/A',
        'SRN ID': srn.srnId || 'N/A',
        'Milestone Name': srn.milestone?.msName || 'N/A',
        'SRN Name': srn.srnName || 'N/A',
        'SRN Description': srn.srnDsc || 'N/A',
        'Currency': srn.srnCurrency || 'N/A',
        'SRN Amount': srn.srnAmount ? `${getCurrencySymbol(srn.srnCurrency)}${srn.srnAmount.toLocaleString()}` : 'N/A',
        'SRN Remarks': srn.srnRemarks || 'N/A',
        'SRN DATE':srn.srnDate || 'N/A',
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
        link.setAttribute('download', `srn_list_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('Error downloading SRN Excel:', error);
      showSnackbar('Failed to download Excel file. Please try again.', 'error');
    }
  };

  // Handle SRN actions
  const handleEditSRN = (srn) => {
    console.log('Editing SRN:', srn);
    setSelectedSRNId(srn.srnId);
    setIsEditModalOpen(true);
  };

  const handleAddSRN = () => {
    setIsAddModalOpen(true);
  };

  const handleSRNIdClick = (srn) => {
    navigate(`/srn-details/${srn.srnId}`);
  };

  const handlePONumberClick = (srn) => {
    // Navigate to PO details using the poDetail.poId
    const poId = srn.poDetail?.poId || srn.poId;
    if (poId) {
      navigate(`/po-details/${poId}`);
    } else {
      showSnackbar("PO ID not found", "error");
    }
  };

  // Delete SRN function
  const handleDeleteSRN = async (srnId) => {
    if (window.confirm("Are you sure you want to delete this SRN?")) {
      try {
        const token = sessionStorage.getItem('token');
        if (!token) {
          throw new Error("Missing authentication credentials");
        }

        await axios.delete(
          `${import.meta.env.VITE_API_URL}/api/srn/delete/${srnId}`,
          {
            headers: { Authorization: `${token}` }
          }
        );

        showSnackbar("SRN deleted successfully!", "success");
        fetchSRNData(); // Refresh the table
      } catch (error) {
        console.error("Error deleting SRN:", error);
        showSnackbar("Failed to delete SRN", "error");
      }
    }
  };

  // Handle attachment view
  const handleViewAttachment = (srn) => {
    // Navigate to attachment view or open attachment modal
    console.log('Viewing attachments for SRN:', srn.srnId);
    // You can implement attachment viewing logic here
    showSnackbar(`Viewing attachments for SRN ${srn.srnId}`, "info");
  };

  const handleEditModalSubmit = async (data) => {
    

      showSnackbar("SRN updated successfully!", "success");
      fetchSRNData(); // Refresh the table
      setIsEditModalOpen(false);
      setSelectedSRNId(null);
    
  };

  // Format currency with dynamic symbol
  const formatCurrency = (amount, currencyCode) => {
    if (!amount) return 'N/A';
    const symbol = getCurrencySymbol(currencyCode);
    return `${symbol}${amount.toLocaleString()}`;
  };

  // AG Grid column definitions
  const columnDefs = useMemo(() => [
    {
      headerName: "#",
      valueGetter: "node.rowIndex + 1",
      width: 50,
      pinned: "left",
      sortable: false,
      filter: false,
      suppressMenu: true,
      cellStyle: { textAlign: 'center' }
    },
    {
        headerName: "PO Number",
        field: "poNumber",
        valueGetter: params => params.data.poNumber || 'N/A',
        flex: 1,
        minWidth: 150,
        sortable: true,
        filter: true,
        cellRenderer: params => {
            const poNumber = params.value;
            if (poNumber && poNumber !== 'N/A') {
                return (
                    <span title={poNumber} className="cursor-pointer text-blue-600 font-bold underline" onClick={() => handlePONumberClick(params.data)}>
                        {poNumber.length > 20 ? `${poNumber.substring(0, 20)}...` : poNumber}
                    </span>
                );
            }
            return poNumber;
        }
    },
    {
        headerName: "SRN ID",
        field: "srnId",
        valueGetter: params => params.data.srnId || 'N/A',
        width: 100,
        sortable: true,
        filter: true,
        cellRenderer: params => {
            const srnId = params.value;
            return (
                <span title={srnId} className="cursor-help">
                    {srnId}
                </span>
            );
        }
    },
    {
        headerName: "Milestone Name",
        field: "milestone.msName",
        valueGetter: params => params.data.milestone?.msName || 'N/A',
        flex: 1,
        minWidth: 150,
        sortable: true,
        filter: true,
        cellRenderer: params => {
            const milestoneName = params.value;
            if (milestoneName && milestoneName !== 'N/A') {
                return (
                    <span title={milestoneName} className="cursor-help">
                        {milestoneName.length > 30 ? `${milestoneName.substring(0, 30)}...` : milestoneName}
                    </span>
                );
            }
            return milestoneName;
        }
    },
    {
    headerName: "SRN Type",
    field: "srnType",
    valueGetter: params => params.data.srnType || 'N/A',
    width: 120,
    sortable: true,
    filter: true,
    cellStyle: { fontWeight: 'bold', color: '#374151' },
    cellRenderer: params => {
        const srnType = params.value;
        return (
            <span title={srnType} className="cursor-help">
                {srnType || 'N/A'}
            </span>
        );
    }
  },
    {
        headerName: "SRN Name",
        field: "srnName",
        valueGetter: params => params.data.srnName || 'N/A',
        flex: 1,
        minWidth: 180,
        sortable: true,
        filter: true,
        cellRenderer: params => {
            const srnName = params.value;
            if (srnName && srnName !== 'N/A') {
                return (
                    <span title={srnName} className="cursor-help">
                        {srnName.length > 30 ? `${srnName.substring(0, 30)}...` : srnName}
                    </span>
                );
            }
            return srnName;
        }
    },
    {
        headerName: "SRN Description",
        field: "srnDsc",
        valueGetter: params => params.data.srnDsc || 'N/A',
        flex: 2,
        minWidth: 200,
        sortable: true,
        filter: true,
        cellRenderer: params => {
            const description = params.value;
            if (description && description !== 'N/A') {
                return (
                    <span title={description} className="cursor-help">
                        {description.length > 50 ? `${description.substring(0, 50)}...` : description}
                    </span>
                );
            }
            return description;
        }
    },
    {
        headerName: "SRN Remarks",
        field: "srnRemarks",
        valueGetter: params => params.data.srnRemarks || 'N/A',
        flex: 1,
        minWidth: 180,
        sortable: true,
        filter: true,
        cellRenderer: params => {
            const remarks = params.value;
            if (remarks && remarks !== 'N/A') {
                return (
                    <span title={remarks} className="cursor-help">
                        {remarks.length > 40 ? `${remarks.substring(0, 40)}...` : remarks}
                    </span>
                );
            }
            return remarks;
        }
    },
    {
        headerName: "Currency",
        field: "srnCurrency",
        valueGetter: params => params.data.srnCurrency || 'N/A',
        width: 100,
        sortable: true,
        filter: true,
        cellRenderer: params => {
            const currency = params.value;
            return (
                <span title={currency} className="cursor-help">
                    {currency}
                </span>
            );
        }
    },
    {
        headerName: "SRN Amount",
        field: "srnAmount",
        valueGetter: params => {
            const amount = params.data.srnAmount;
            const currency = params.data.srnCurrency;
            if (!amount) return 'N/A';
            const symbol = getCurrencySymbol(currency);
            return `${symbol}${amount.toLocaleString()}`;
        },
        width: 140,
        sortable: true,
        filter: true,
        cellRenderer: params => {
            const amount = params.value;
            return (
                <span title={amount} className="cursor-help">
                    {amount}
                </span>
            );
        }
    },
  
    {
      headerName: "Actions",
      field: "actions",
      width: 150,
      sortable: false,
      filter: false,
      suppressMenu: true,
      cellRenderer: params => {
        const srn = params.data;
        return (
          <div className="flex justify-center gap-2 h-full items-center">
            <button
              onClick={() => handleViewSRNDetails(srn)}
              className="p-2 rounded-full hover:bg-green-100 transition-colors"
              title="View SRN Details"
            >
              <Eye size={16} className="text-green-600" />
            </button>
            {hasAccess('budget', 'edit') && (
              <button
                onClick={() => handleEditSRN(srn)}
                className="p-2 rounded-full hover:bg-blue-100 transition-colors"
                title="Edit SRN"
              >
                <Edit size={16} className="text-blue-600" />
              </button>
            )}
            {hasAccess('budget', 'delete') && (
              <button
                onClick={() => handleDeleteSRN(srn.srnId)}
                className="p-2 rounded-full hover:bg-red-100 transition-colors"
                title="Delete SRN"
              >
                <Trash2 size={16} className="text-red-600" />
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
      {/* SRN Grid */}
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
            .ag-theme-alpine .ag-filter-panel .ag-filter-apply-panel .ag-button.ag-button-secondary:hover {
              background: #f9fafb;
              border-color: #9ca3af;
            }
            .ag-theme-alpine .ag-header-cell .ag-header-cell-label {
              justify-content: flex-start;
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
            .ag-theme-alpine .ag-pinned-right-cols-container {
              border-left: 2px solid #d1d5db;
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
            .ag-theme-alpine .ag-header-cell-menu-button {
              color: #ffffff !important;
              opacity: 1 !important;
              background: transparent !important;
            }
            .ag-theme-alpine .ag-header-cell-menu-button:hover {
              opacity: 0.8 !important;
            }
            .ag-theme-alpine .ag-header-cell-menu-button .ag-icon-menu {
              color: #ffffff !important;
              font-size: 16px !important;
            }
            .ag-theme-alpine .ag-header-cell-menu-button .ag-icon-filter {
              color: #ffffff !important;
              font-size: 16px !important;
            }
            .ag-theme-alpine .ag-icon-filter {
              color: #ffffff !important;
              background: transparent !important;
              padding: 2px;
              border-radius: 3px;
            }
            .ag-theme-alpine .ag-header-cell-filtered .ag-header-cell-menu-button {
              opacity: 1 !important;
              background-color: rgba(255, 255, 255, 0.2) !important;
              border-radius: 3px;
            }
            .ag-theme-alpine .ag-menu {
              background: white;
              border: 1px solid #e5e7eb;
              border-radius: 6px;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            }
            .ag-theme-alpine .ag-menu-header {
              background-color: #f9fafb;
              padding: 8px 12px;
              border-bottom: 1px solid #e5e7eb;
            }
            .ag-theme-alpine .ag-filter-condition {
              padding: 8px 12px;
            }
            .ag-theme-alpine .ag-filter-apply-panel button {
              background: #15803d !important;
              color: white !important;
              border: none !important;
              padding: 6px 12px !important;
              border-radius: 4px !important;
              cursor: pointer !important;
              transition: background-color 0.2s !important;
            }
            .ag-theme-alpine .ag-filter-apply-panel button:hover {
              background: #166534 !important;
            }
            .ag-theme-alpine .ag-filter-wrapper .ag-filter-body .ag-input-wrapper::before {
              display: none !important;
            }
            .ag-theme-alpine .ag-filter-wrapper .ag-filter-body input {
              padding: 8px 12px !important;
              padding-left: 12px !important;
              width: 100% !important;
              border: 1px solid #d1d5db !important;
              border-radius: 6px !important;
              font-size: 14px !important;
              background-image: none !important;
            }
            .ag-theme-alpine .ag-filter-wrapper .ag-filter-body input:focus {
              border-color: #15803d !important;
              outline: none !important;
              box-shadow: 0 0 0 3px rgba(21, 128, 61, 0.1) !important;
            }
            .ag-theme-alpine .ag-paging-button {
              background: linear-gradient(135deg, #15803d, #166534);
              color: white;
              border: none;
              border-radius: 4px;
              margin: 0 4px;
              min-width: 30px;
              height: 26px;
              cursor: pointer;
              font-size: 14px;
              font-weight: 500;
              transition: all 0.2s ease-in-out;
              box-shadow: 0 2px 4px rgba(21, 128, 61, 0.2);
              position: relative;
              overflow: hidden;
              display: inline-flex;
              align-items: center;
              justify-content: center;
            }
            .ag-theme-alpine .ag-paging-button::before {
              content: '';
              position: absolute;
              top: 0;
              left: -100%;
              width: 100%;
              height: 100%;
              background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
              transition: left 0.5s ease;
            }
            .ag-theme-alpine .ag-paging-button:hover {
              background: linear-gradient(135deg, #166534, #14532d);
              transform: translateY(-2px);
              box-shadow: 0 4px 8px rgba(21, 128, 61, 0.3);
            }
            .ag-theme-alpine .ag-paging-button:hover::before {
              left: 100%;
            }
            .ag-theme-alpine .ag-paging-button:active {
              transform: translateY(0);
              box-shadow: 0 2px 4px rgba(21, 128, 61, 0.2);
            }
            .ag-theme-alpine .ag-paging-button[disabled] {
              background: #e5e7eb;
              color: #9ca3af;
              cursor: not-allowed;
              transform: none;
              box-shadow: none;
            }
            .ag-theme-alpine .ag-paging-button[disabled]:hover {
              background: #e5e7eb;
              transform: none;
              box-shadow: none;
            }
            .ag-theme-alpine .ag-paging-button[disabled]::before {
              display: none;
            }
            .ag-theme-alpine .ag-paging-button:first-child,
            .ag-theme-alpine .ag-paging-button:last-child {
              background: linear-gradient(135deg, #047857, #065f46);
              font-weight: 600;
            }
            .ag-theme-alpine .ag-paging-button:first-child:hover,
            .ag-theme-alpine .ag-paging-button:last-child:hover {
              background: linear-gradient(135deg, #065f46, #064e3b);
            }
            .ag-theme-alpine .ag-paging-panel::before {
              margin-right: 8px;
              font-weight: 500;
              color: #374151;
            }
            .ag-theme-alpine select {
              padding: 8px 12px;
              border: 2px solid #d1d5db;
              border-radius: 8px;
              background-color: #ffffff;
              color: #111827;
              font-size: 14px;
              font-weight: 500;
              cursor: pointer;
              box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
              transition: all 0.2s ease-in-out;
              appearance: none;
              background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
              background-position: right 8px center;
              background-repeat: no-repeat;
              background-size: 16px;
              padding-right: 32px;
            }
            .ag-theme-alpine select:hover,
            .ag-theme-alpine select:focus {
              border-color: #15803d;
              outline: none;
              background-color: #ecfdf5;
              box-shadow: 0 0 0 3px rgba(21, 128, 61, 0.1);
            }
            .ag-theme-alpine .ag-paging-row-summary-panel {
              font-weight: 500;
              font-size: 14px;
              color: #374151;
              padding: 8px 12px;
            }
            .ag-theme-alpine .ag-paging-panel .ag-paging-button-wrapper {
              display: flex;
              align-items: center;
              gap: 4px;
            }
            .ag-theme-alpine .ag-paging-button.ag-paging-button-current {
              background: linear-gradient(135deg, #dc2626, #b91c1c);
              font-weight: 600;
              box-shadow: 0 2px 8px rgba(220, 38, 38, 0.3);
            }
            .ag-theme-alpine .ag-paging-button.ag-paging-button-current:hover {
              background: linear-gradient(135deg, #b91c1c, #991b1b);
            }
          `}</style>
          <AgGridReact
            columnDefs={columnDefs}
            rowData={filteredSRNData}
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
                  <Receipt size={48} className="mx-auto mb-2 text-gray-300" />
                  <p className="text-lg font-medium">No SRNs found</p>
                  <p className="text-sm">Try adjusting your search or add a new SRN</p>
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

      {/* Add SRN Modal */}
      {hasAccess('budget', 'edit') && (
        <AddSRNModal 
          open={isAddModalOpen}
          onClose={() =>{ fetchSRNData() ;setIsAddModalOpen(false)}}
        />
      )}

      {/* Edit SRN Modal - Uncomment when modal components are available */}
      {hasAccess('budget', 'edit') && (
        <EditSRNModal 
          open={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedSRNId(null);
          }}
          onSubmit={handleEditModalSubmit}
          srnId={selectedSRNId}
        />
      )}
     

      {/* Global Snackbar */}
      <GlobalSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={handleSnackbarClose}
      />

      <SRNDetailsModal
  open={isDetailsModalOpen}
  onClose={() => setIsDetailsModalOpen(false)}
  srnDetails={selectedSRNDetails}
/>
    </div>
  );
});

export default SRNManagement;