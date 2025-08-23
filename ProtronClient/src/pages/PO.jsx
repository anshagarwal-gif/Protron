import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { AgGridReact } from 'ag-grid-react';
import { Eye } from "lucide-react";
import ViewPOModal from "../components/ViewPOModal";
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

import {
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
  User,
  CreditCard
} from "lucide-react";
import { useAccess } from "../Context/AccessContext";
import axios from "axios";
import GlobalSnackbar from "../components/GlobalSnackbar";
import AddPOModal from "../components/AddPOModal";
import EditPOModal from "../components/EditPOModal";
import SRNManagement from "./SRN";
import POConsumptionManagement from "./POUtilization";
import InvoiceManagement from "./Invoice";
import MilestoneManagement from "../components/MilestoneManagement";

const POManagement = () => {
  const navigate = useNavigate();
  const { hasAccess } = useAccess();
  const srnRef = useRef();
  const poRef = useRef();
  const invoiceRef = useRef();

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
const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState(false);
const [milestonePOId, setMilestonePOId] = useState(null);
  const handleOpenMilestoneModal = (po) => {
  setMilestonePOId(po.poId || po.id);
  setIsMilestoneModalOpen(true);
};
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
      'USD': '$', 'EUR': '€', 'GBP': '£', 'JPY': '¥', 'INR': '₹',
      'CAD': 'C$', 'AUD': 'A$', 'CHF': 'CHF', 'CNY': '¥', 'SEK': 'kr'
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

  // Excel download functions
  const downloadPOExcel = () => {
    try {
      const excelData = filteredPOData.map((po, index) => ({
        'S.No': index + 1,
        'PO Number': po.poNumber || 'N/A',
        'PO Type': po.poType || 'N/A',
        'Currency': po.poCurrency || 'N/A',
        'PO Amount': po.poAmount ? `${po.poAmount.toLocaleString()}` : 'N/A',
        'Customer': po.customer || 'N/A',
        'Supplier': po.supplier || 'N/A',
        'Project Name': po.projectName || 'N/A',
        'SPOC Name': po.poSpoc || 'N/A',
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

  const downloadSRNExcel = () => {
    if (srnRef.current && srnRef.current.downloadSRNExcel) {
      srnRef.current.downloadSRNExcel();
    }
  };

  const downloadConsumptionExcel = () => {
    if (poRef.current && poRef.current.downloadConsumptionExcel) {
      poRef.current.downloadConsumptionExcel();
    }
  };

  const downloadInvoiceExcel = () => {
    if (invoiceRef.current && invoiceRef.current.downloadInvoiceExcel) {
      invoiceRef.current.downloadInvoiceExcel();
    }
  };

  // Handle actions
  const handleEditPO = (po) => {
    console.log('Editing PO:', po);
    setSelectedPOId(po.poId || po.id);
    setIsEditModalOpen(true);
  };

  const handleAddPO = () => {
    setIsAddModalOpen(true);
  };

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

  const handleAddInvoice = () => {
    if (invoiceRef.current && invoiceRef.current.handleAddInvoice) {
      invoiceRef.current.handleAddInvoice();
    }
  };

  const handlePONumberClick = (po) => {
    navigate(`/po-details/${po.poId || po.id}`);
  };

  const handleModalSubmit = (data) => {
    setIsAddModalOpen(false)
    showSnackbar("PO created successfully!", "success");
    fetchPOData();
  };

  const handleEditModalSubmit = (data) => {
    showSnackbar("PO updated successfully!", "success");
    fetchPOData();
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
      maxWidth: 50,
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
      maxWidth: 140,
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
      maxWidth: 120,
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
      flex: 1,
      minWidth: 150,
      maxWidth: 200,
      sortable: true,
      filter: true,
      cellRenderer: params => (
        <div className="truncate max-w-full overflow-hidden whitespace-nowrap" title={params.value}>
          {params.value}
        </div>
      )
    },
    {
      headerName: "Supplier",
      field: "supplier",
      valueGetter: params => params.data.supplier || 'N/A',
      flex: 1,
      minWidth: 150,
      maxWidth: 200,
      sortable: true,
      filter: true,
      cellRenderer: params => (
        <div className="truncate max-w-full overflow-hidden whitespace-nowrap" title={params.value}>
          {params.value}
        </div>
      )
    },
    {
      headerName: "Project Name",
      field: "projectName",
      valueGetter: params => params.data.projectName || 'N/A',
      flex: 1,
      minWidth: 150,
      maxWidth: 200,
      sortable: true,
      filter: true,
      cellRenderer: params => (
        <div className="truncate max-w-full overflow-hidden whitespace-nowrap" title={params.value}>
          {params.value}
        </div>
      )
    },
    {
      headerName: "SPOC Name",
      field: "poSpoc",
      valueGetter: params => params.data.poSpoc || 'N/A',
      flex: 1,
      minWidth: 150,
      maxWidth: 180,
      sortable: true,
      filter: true,
      cellRenderer: params => (
        <div className="truncate max-w-full overflow-hidden whitespace-nowrap" title={params.value}>
          {params.value}
        </div>
      )
    },
    {
      headerName: "Budget Line Item",
      field: "budgetLineItem",
      valueGetter: params => params.data.budgetLineItem || 'N/A',
      flex: 1,
      minWidth: 150,
      maxWidth: 180,
      sortable: true,
      filter: true,
      cellRenderer: params => (
        <div className="truncate max-w-full overflow-hidden whitespace-nowrap" title={params.value}>
          {params.value}
        </div>
      )
    },
    {
      headerName: "Budget Line Amount",
      field: "budgetLineAmount",
      valueGetter: params => formatCurrency(params.data.budgetLineAmount, params.data.poCurrency),
      width: 140,
      sortable: true,
      filter: true,
      cellStyle: { fontWeight: 'bold', color: '#059669' }
    },
    {
      headerName: "Business Value",
      field: "businessValueAmount",
      valueGetter: params => formatCurrency(params.data.businessValueAmount, params.data.poCurrency),
      width: 140,
      sortable: true,
      filter: true,
      cellStyle: { fontWeight: 'bold', color: '#059669' }
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
            onClick={() => handleOpenMilestoneModal(po)}
            className="p-2 rounded-full hover:bg-green-100 transition-colors cursor-pointer"
            title="Add milestones"
          >
            <Plus size={16} className="text-green-600" />
          </button>
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
                  border-right: 1px solid #e5e7eb;
                  padding: 8px 12px;
                  font-size: 14px;
                }
                .ag-theme-alpine .ag-paging-panel {
                  border-top: 2px solid #e5e7eb;
                  background-color: #f0fdf4;
                  padding: 16px 20px;
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
              />
            </div>
          </div>
        );
      case "utilization":
        return <POConsumptionManagement ref={poRef} searchQuery={searchQuery} setSearchQuery={setSearchQuery} />;
      case "srn":
        return <SRNManagement ref={srnRef} searchQuery={searchQuery} setSearchQuery={setSearchQuery} />;
      case "invoice":
        return <InvoiceManagement ref={invoiceRef} searchQuery={searchQuery} setSearchQuery={setSearchQuery} />;
      default:
        return null;
    }
  };

  return (
    <div className="w-full p-6 bg-white">
      {/* Header with navigation, search and actions */}
      <div className="flex justify-between items-center mb-6">
        {/* Left side - 4-Slider toggle buttons and title */}
        <div className="flex items-center gap-6">
      <div className="relative bg-gray-200 p-1 rounded-full flex">
        <div
          className="absolute top-1 bottom-1 bg-white rounded-full shadow-md transition-all duration-300 ease-in-out"
          style={{
            width: activeTab === "utilization" ? 'calc(25% + 20px)' : activeTab === 'srn' ? 'calc(25% - 25px)' : activeTab === 'invoice' ? 'calc(25% - 10px)' : 'calc(25% - 2px)',
            left: activeTab === "details" ? '4px' :
              activeTab === "utilization" ? '25%' :
                activeTab === "srn" ? '55%' :
                  'calc(75% + 2px)'
          }}
        />
        <button
          className={`relative z-10 py-2 px-3 mr-2 rounded-full transition-colors duration-300 w-1/4 text-sm font-medium ${
            activeTab === "details" ? "text-green-600" : "text-gray-600"
          }`}
          onClick={() => setActiveTab("details")}
        >
          <div className="flex items-center justify-center whitespace-nowrap">
            <FileText size={16} className="mr-1" />
            PO Details
          </div>
        </button>
        <button
          className={`relative z-10 py-2 px-3 rounded-full transition-colors duration-300 w-1/4 text-sm font-medium ${
            activeTab === "utilization" ? "text-green-600" : "text-gray-600"
          }`}
          onClick={() => setActiveTab("utilization")}
        >
          <div className="flex items-center justify-center whitespace-nowrap">
            <TrendingUp size={16} className="mr-1" />
            PO Consumption
          </div>
        </button>
        <button
          className={`relative z-10 py-2 px-3 rounded-full transition-colors duration-300 w-1/4 text-sm font-medium ${
            activeTab === "srn" ? "text-green-600" : "text-gray-600"
          }`}
          onClick={() => setActiveTab("srn")}
        >
          <div className="flex items-center justify-center whitespace-nowrap">
            <Receipt size={16} className="mr-1" />
            SRN
          </div>
        </button>
        <button
          className={`relative z-10 py-2 px-3 rounded-full transition-colors duration-300 w-1/4 text-sm font-medium ${
            activeTab === "invoice" ? "text-green-600" : "text-gray-600"
          }`}
          onClick={() => setActiveTab("invoice")}
        >
          <div className="flex items-center justify-center whitespace-nowrap">
            <CreditCard size={16} className="mr-1" />
            Invoice
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
              PO Consumption
            </>
          )}
          {activeTab === "srn" && (
            <>
              <Receipt size={24} className="mr-2 text-green-600" />
              SRN Management
            </>
          )}
          {activeTab === "invoice" && (
            <>
              <CreditCard size={24} className="mr-2 text-green-600" />
              Invoice Management
            </>
          )}
        </h2>
      </div>
    </div>

        {/* Right side - Search and action buttons */}
        <div className="flex items-center gap-4">
          {/* Search input */}
          <div className="relative w-64">
            <input
              type="text"
              placeholder={
                activeTab === "details" ? "Search POs..." :
                  activeTab === "utilization" ? "Search PO Consumptions..." :
                    activeTab === "srn" ? "Search SRNs..." :
                      "Search Invoices..."
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <Search size={18} className="absolute left-3 top-2.5 text-gray-400" />
          </div>

          {/* Download Excel Button */}
          <button
            className="flex items-center bg-green-900 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors"
            onClick={
              activeTab === "details" ? downloadPOExcel :
                activeTab === "utilization" ? downloadConsumptionExcel :
                  activeTab === "srn" ? downloadSRNExcel :
                    downloadInvoiceExcel
            }
          >
            <Download size={18} className="mr-2" />
            Download Excel
          </button>

          {/* Add Button */}
          <button
            className="flex items-center bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-md transition-colors"
            onClick={
              activeTab === "details" ? handleAddPO :
                activeTab === "utilization" ? handleAddConsumption :
                  activeTab === "srn" ? handleAddSRN :
                    handleAddInvoice
            }
          >
            <Plus size={18} className="mr-2" />
            {activeTab === "details" ? "Add PO" :
              activeTab === "utilization" ? "Add Consumption" :
                activeTab === "srn" ? "Add SRN" :
                  "Add Invoice"}
          </button>
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

      {/* Modals */}
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

      <EditPOModal
        open={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedPOId(null);
          fetchPOData();
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

      {isMilestoneModalOpen && (
  <MilestoneManagement
    poId={milestonePOId}
    open={isMilestoneModalOpen}
    onClose={() => setIsMilestoneModalOpen(false)}
  />
)}
    </div>
  );
};

export default POManagement;