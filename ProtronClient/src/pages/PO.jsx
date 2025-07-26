// POManagement.js
import { useState, useEffect, useMemo, useRef, use } from "react";
import { useNavigate } from "react-router-dom";
import { AgGridReact } from 'ag-grid-react';
import { Eye } from "lucide-react";
import ViewPOModal from "../components/ViewPOModal";
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

import {
  ChevronDown,
  FileText,
  TrendingUp,
  Receipt,
  Plus,
  Search,
  Edit,
  Download,
  Loader2,
  DollarSign,
  Building,
  User
} from "lucide-react";
import { useAccess } from "../Context/AccessContext";
import axios from "axios";
import GlobalSnackbar from "../components/GlobalSnackbar";
import AddPOModal from "../components/AddPOModal";
import EditPOModal from "../components/EditPOModal";
import SRNManagement from "./SRN";
import POConsumptionManagement from "./POUtilization";


const POManagement = () => {
  const navigate = useNavigate();
  const { hasAccess } = useAccess();
  const srnRef = useRef();
  const poRef = useRef();

  // State management
  const [activeTab, setActiveTab] = useState("details");
  const [searchQuery, setSearchQuery] = useState("");
  const [poList, setPOList] = useState([]);
  const [selectedPO, setSelectedPO] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedPOId, setSelectedPOId] = useState(null);

  // SRN specific state
  const [isAddSRNModalOpen, setIsAddSRNModalOpen] = useState(false);

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
  const handleViewPO = (po) => {
    setSelectedPOId(po.poId || po.id);
    setSelectedPO(po);
    console.log("Viewing PO:", po);
    setIsViewModalOpen(true);
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

  // Fetch PO data
  const fetchPOData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = sessionStorage.getItem('token');
      if (!token) {
        throw new Error("Missing authentication credentials");
      }

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/po/all`,
        {
          headers: { Authorization: `${token}` }
        }
      );

      setPOList(response.data);
    } catch (error) {
      console.error("Error fetching PO data:", error);
      setError(error.message || "Failed to fetch PO data");
      showSnackbar("Failed to fetch PO data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPOData();
  }, []);

  // Filter PO data based on search
  const filteredPOData = poList.filter(po => {
    if (searchQuery === "") return true;

    const searchLower = searchQuery.toLowerCase();
    return (
      po.poNumber?.toLowerCase().includes(searchLower) ||
      po.poType?.toLowerCase().includes(searchLower) ||
      po.customer?.toLowerCase().includes(searchLower) ||
      po.supplier?.toLowerCase().includes(searchLower) ||
      po.projectName?.toLowerCase().includes(searchLower) ||
      po.poSpoc?.toLowerCase().includes(searchLower) ||
      po.poAmount?.toString().includes(searchLower) ||
      po.poCurrency?.toLowerCase().includes(searchLower)
    );
  });

  // Excel download function
  const downloadPOExcel = () => {
    try {
      const excelData = filteredPOData.map((po, index) => ({
        'S.No': index + 1,
        'PO Number': po.poNumber || 'N/A',
        'PO Type': po.poType || 'N/A',
        'PO Amount': po.poAmount ? `${getCurrencySymbol(po.poCurrency)}${po.poAmount.toLocaleString()}` : 'N/A',
        'Currency': po.poCurrency || 'N/A',
        'Customer': po.customer || 'N/A',
        'Supplier': po.supplier || 'N/A',
        'Project Name': po.projectName || 'N/A',
        'SPOC Name': po.poSpoc || 'N/A',
        'Created Date': po.createdDate ? new Date(po.createdDate).toLocaleDateString() : 'N/A'
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
        link.setAttribute('download', `po_list_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('Error downloading PO Excel:', error);
      showSnackbar('Failed to download Excel file. Please try again.', 'error');
    }
  };

  // SRN Excel download function
  const downloadSRNExcel = () => {
    if (srnRef.current && srnRef.current.downloadSRNExcel) {
      srnRef.current.downloadSRNExcel();
    }
  };

  // Handle PO actions
  const handleEditPO = (po) => {
    console.log('Editing PO:', po);
    setSelectedPOId(po.poId || po.id);
    setIsEditModalOpen(true);
  };

  const handleAddPO = () => {
    setIsAddModalOpen(true);
  };
  // Add these functions to your POManagement.js file

  // PO Consumption Excel download function
  const downloadConsumptionExcel = () => {
    if (poRef.current && poRef.current.downloadConsumptionExcel) {
      poRef.current.downloadConsumptionExcel();
    }
  };

  // Handle Add PO Consumption
  const handleAddConsumption = () => {
    if (poRef.current && poRef.current.handleAddConsumption) {
      poRef.current.handleAddConsumption();
    }
  };
  const handleAddSRN = () => {
    if (srnRef.current && srnRef.current.handleAddSRN) {
      srnRef.current.handleAddSRN();
    }
  };

  const handlePONumberClick = (po) => {
    navigate(`/po-details/${po.poId || po.id}`);
  };

  const handleModalSubmit = (data) => {
    showSnackbar("PO created successfully!", "success");
    fetchPOData(); // Refresh the table
  };

  const handleEditModalSubmit = (data) => {
    showSnackbar("PO updated successfully!", "success");
    fetchPOData(); // Refresh the table
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
      width: 70,
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
      cellStyle: { fontWeight: 'bold', color: '#1f2937' },
      cellRenderer: params => {
        const poNumber = params.value;
        const po = params.data;
        if (poNumber && poNumber !== 'N/A') {
          return (
            <button
              onClick={() => handlePONumberClick(po)}
              className="text-blue-600 hover:text-blue-800 hover:underline font-bold cursor-pointer bg-transparent border-none p-0 text-left"
              title={`View details for ${poNumber}`}
            >
              {poNumber}
            </button>
          );
        }
        return <span className="text-gray-500">{poNumber}</span>;
      }
    },
    {
      headerName: "PO Type",
      field: "poType",
      valueGetter: params => params.data.poType || 'N/A',
      width: 120,
      sortable: true,
      filter: true,
      cellRenderer: params => {
        const type = params.value;
        const typeColors = {
          'FIXED': 'bg-blue-100 text-blue-800',
          'T_AND_M': 'bg-green-100 text-green-800',
          'MIXED': 'bg-purple-100 text-purple-800'
        };
        const colorClass = typeColors[type] || 'bg-gray-100 text-gray-800';
        const displayText = type === 'T_AND_M' ? 'T & M' :
          type === 'FIXED' ? 'Fixed' :
            type === 'MIXED' ? 'Mixed' : type;
        return (
          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${colorClass}`}>
            {displayText}
          </span>
        );
      }
    },
    {
      headerName: "Currency",
      field: "poCurrency",
      valueGetter: params => params.data.poCurrency || 'N/A',
      width: 100,
      sortable: true,
      filter: true,
      cellStyle: { fontWeight: 'bold', color: '#374151' }
    },
    {
      headerName: "PO Amount",
      field: "poAmount",
      valueGetter: params => formatCurrency(params.data.poAmount, params.data.poCurrency),
      width: 140,
      sortable: true,
      filter: true,
      cellStyle: { fontWeight: 'bold', color: '#059669' }
    },
    
    {
      headerName: "Customer",
      field: "customer",
      valueGetter: params => params.data.customer || 'N/A',
      tooltipValueGetter: params => params.data.customer || 'N/A',
      flex: 1,
      minWidth: 150,
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
      headerName: "Supplier",
      field: "supplier",
      valueGetter: params => params.data.supplier || 'N/A',
      tooltipValueGetter: params => params.data.supplier || 'N/A',
      flex: 1,
      minWidth: 150,
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
      headerName: "Project Name",
      field: "projectName",
      valueGetter: params => params.data.projectName || 'N/A',
      tooltipValueGetter: params => params.data.projectName || 'N/A',
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
      headerName: "SPOC Name",
      field: "poSpoc",
      valueGetter: params => params.data.poSpoc || 'N/A',
      tooltipValueGetter: params => params.data.poSpoc || 'N/A',
      flex: 1,
      minWidth: 150,
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
      headerName: "Actions",
      field: "actions",
      width: 120,
      sortable: false,
      filter: false,
      suppressMenu: true,
      cellRenderer: params => {
        const po = params.data;
        return (
          <div className="flex justify-center gap-2 h-full items-center">
            <button
              onClick={() => handleViewPO(po)}
              className="p-2 rounded-full hover:bg-blue-100 transition-colors"
              title="View PO"
            >
              <Eye size={16} className="text-blue-600" />
            </button>
            <button
              onClick={() => handleEditPO(po)}
              className="p-2 rounded-full hover:bg-blue-100 transition-colors"
              title="Edit PO"
            >
              <Edit size={16} className="text-blue-600" />
            </button>
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

  // Render content based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case "details":
        return (
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
                rowData={filteredPOData}
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
                      <p className="text-lg font-medium">No POs found</p>
                      <p className="text-sm">Try adjusting your search or add a new PO</p>
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
        );
      case "utilization":
        return <POConsumptionManagement ref={poRef} searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      case "srn":
        return <SRNManagement ref={srnRef} searchQuery={searchQuery} setSearchQuery={setSearchQuery} />;
      default:
        return null;
    }
  };

  return (
    <div className="w-full p-6 bg-white">
      {/* Header with navigation, search and actions in one line */}
      <div className="flex justify-between items-center mb-6">
        {/* Left side - 3-Slider toggle buttons and title */}
        <div className="flex items-center gap-6">
          {/* 3-Slider toggle buttons */}
          <div className="relative bg-gray-200 p-1 rounded-full flex">
            <div
              className="absolute top-1 bottom-1 bg-white rounded-full shadow-md transition-all duration-300 ease-in-out"
              style={{
                width: 'calc(33.333% - 2px)',
                left: activeTab === "details" ? '4px' :
                  activeTab === "utilization" ? 'calc(33.333% + 2px)' :
                    'calc(66.666% + 1px)'
              }}
            />
            <button
              className={`relative z-10 py-2 px-4 rounded-full transition-colors duration-300 w-1/3 text-sm font-medium ${activeTab === "details" ? "text-green-600" : "text-gray-600"
                }`}
              onClick={() => setActiveTab("details")}
            >
              <div className="flex items-center justify-center whitespace-nowrap">
                <FileText size={16} className="mr-2" />
                PO Details
              </div>
            </button>
            <button
              className={`relative z-10 py-2 px-4 rounded-full transition-colors duration-300 w-1/3 text-sm font-medium ${activeTab === "utilization" ? "text-green-600" : "text-gray-600"
                }`}
              onClick={() => setActiveTab("utilization")}
            >
              <div className="flex items-center justify-center whitespace-nowrap">
                <TrendingUp size={16} className="mr-2" />
                PO Utilization
              </div>
            </button>
            <button
              className={`relative z-10 py-2 px-4 rounded-full transition-colors duration-300 w-1/3 text-sm font-medium ${activeTab === "srn" ? "text-green-600" : "text-gray-600"
                }`}
              onClick={() => setActiveTab("srn")}
            >
              <div className="flex items-center justify-center whitespace-nowrap">
                <Receipt size={16} className="mr-2" />
                SRN
              </div>
            </button>
          </div>

          {/* Dynamic title based on active tab */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              {activeTab === "details" && (
                <>
                  <FileText size={24} className="mr-2 text-green-600" />
                  PO List
                </>
              )}
              {activeTab === "utilization" && (
                <>
                  <TrendingUp size={24} className="mr-2 text-green-600" />
                  PO Utilization
                </>
              )}
              {activeTab === "srn" && (
                <>
                  <Receipt size={24} className="mr-2 text-green-600" />
                  SRN Management
                </>
              )}
            </h2>
          </div>
        </div>

        {/* Right side - Search and action buttons */}
        <div className="flex items-center gap-4">
          {/* Search input - show for all tabs */}
          {(activeTab === "details" || activeTab === "utilization" || activeTab === "srn") && (
            <div className="relative w-64">
              <input
                type="text"
                placeholder={
                  activeTab === "details" ? "Search POs..." :
                    activeTab === "utilization" ? "Search PO Consumptions..." :
                      "Search SRNs..."
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <Search size={18} className="absolute left-3 top-2.5 text-gray-400" />
            </div>
          )}

          {/* Download Excel Button */}
          {activeTab === "details" && (
            <button
              className="flex items-center bg-green-900 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors"
              onClick={downloadPOExcel}
            >
              <Download size={18} className="mr-2" />
              Download Excel
            </button>
          )}
          {activeTab === "utilization" && (
            <button
              className="flex items-center bg-green-900 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors"
              onClick={downloadConsumptionExcel}
            >
              <Download size={18} className="mr-2" />
              Download Excel
            </button>
          )}

          {activeTab === "srn" && (
            <button
              className="flex items-center bg-green-900 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors"
              onClick={downloadSRNExcel}
            >
              <Download size={18} className="mr-2" />
              Download Excel
            </button>
          )}

          {/* Add Button */}
          {activeTab === "details" && (
            <button
              className="flex items-center bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-md transition-colors"
              onClick={handleAddPO}
            >
              <Plus size={18} className="mr-2" />
              Add PO
            </button>
          )}
          {activeTab === "utilization" && (
            <button
              className="flex items-center bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-md transition-colors"
              onClick={handleAddConsumption}
            >
              <Plus size={18} className="mr-2" />
              Add Consumption
            </button>
          )}

          {activeTab === "srn" && (
            <button
              className="flex items-center bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-md transition-colors"
              onClick={handleAddSRN}
            >
              <Plus size={18} className="mr-2" />
              Add SRN
            </button>
          )}
        </div>
      </div>

      {/* Error display - only show on PO Details tab */}
      {activeTab === "details" && error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Content area */}
      {renderContent()}

      {/* Add PO Modal */}
      <ViewPOModal
        open={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        poData={selectedPO}
      />


      <AddPOModal
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleModalSubmit}
      />

      {/* Edit PO Modal */}
      <EditPOModal
        open={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedPOId(null);
        }}
        onSubmit={handleEditModalSubmit}
        poId={selectedPOId}
      />

      {/* Global Snackbar */}
      <GlobalSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={handleSnackbarClose}
      />
    </div>
  );
};

export default POManagement;