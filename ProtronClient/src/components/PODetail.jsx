// PODetailsPage.js
import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AgGridReact } from 'ag-grid-react';
import { Eye } from "lucide-react";
import ViewPOModal from "./ViewPOModal";
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import GetSRNDetailsByPO from "./GetSRNDetailsByPO";
import GetConsumptionByPO from "./GetConsumptionByPO";
import ViewMilestoneModal from "../components/ViewMilestoneModal";

import {
  ArrowLeft,
  FileText,
  Plus,
  Search,
  Download,
  Edit,
  Loader2,
  DollarSign,
  Building,
  User,
  Calendar,
  Target,
  CheckCircle,
  AlertCircle,
  Clock
} from "lucide-react";
import axios from "axios";
import GlobalSnackbar from "../components/GlobalSnackbar";
import AddMilestoneModal from "../components/AddMilestoneModal";
import EditMilestoneModal from "../components/EditMilestoneModal";
import { Try } from "@mui/icons-material";

const PODetailsPage = () => {
  const { poId } = useParams();
  const navigate = useNavigate();

  // State management
  const [poDetails, setPODetails] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [milestonesLoading, setMilestonesLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddMilestoneModalOpen, setIsAddMilestoneModalOpen] = useState(false);
  const [isEditMilestoneModalOpen, setIsEditMilestoneModalOpen] = useState(false);
  const [selectedMilestoneId, setSelectedMilestoneId] = useState(null);
  const [selectedMilestone, setSelectedMilestone] = useState(null);
const [isViewMilestoneModalOpen, setIsViewMilestoneModalOpen] = useState(false);


  useEffect(() => {
  if (selectedMilestone) {
    setIsViewMilestoneModalOpen(true);
  }
}, [selectedMilestone]);

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

  // Currency symbol mapping (same as POManagement)
  const getCurrencySymbol = (currencyCode) => {
    const currencySymbols = {
      'USD': '$', 'EUR': '€', 'GBP': '£', 'JPY': '¥', 'INR': '₹',
      'CAD': 'C$', 'AUD': 'A$', 'CHF': 'CHF', 'CNY': '¥', 'SEK': 'kr',
      'NOK': 'kr', 'MXN': '$', 'NZD': 'NZ$', 'SGD': 'S$', 'HKD': 'HK$',
      'ZAR': 'R', 'BRL': 'R$', 'RUB': '₽', 'KRW': '₩', 'TRY': '₺'
    };
    return currencySymbols[currencyCode] || currencyCode || '$';
  };

  // Format currency
  const formatCurrency = (amount, currencyCode) => {
    if (!amount) return 'N/A';
    const symbol = getCurrencySymbol(currencyCode);
    return `${symbol}${amount.toLocaleString()}`;
  };

  // Fetch PO details
  const fetchPODetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = sessionStorage.getItem('token');
      if (!token) {
        throw new Error("Missing authentication credentials");
      }

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/po/${poId}`,
        {
          headers: { Authorization: `${token}` }
        }
      );

      setPODetails(response.data);
    } catch (error) {
      console.error("Error fetching PO details:", error);
      setError(error.message || "Failed to fetch PO details");
      showSnackbar("Failed to fetch PO details", "error");
    } finally {
      setLoading(false);
    }
  };

  // Fetch milestones - Fixed to match backend API structure
  const fetchMilestones = async () => {
    setMilestonesLoading(true);
    try {
      const token = sessionStorage.getItem('token');
      if (!token) {
        throw new Error("Missing authentication credentials");
      }

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/po-milestone/po/${poId}`,
        {
          headers: { Authorization: `${token}` }
        }
      );

      console.log('Raw milestones data from API:', response.data); // Debug log

      // Transform the backend data to match display requirements
      const transformedMilestones = response.data.map(milestone => ({
        msId: milestone.msId,
        milestoneName: milestone.msName || 'N/A',
        milestoneDescription: milestone.msDesc || 'N/A',
        milestoneAmount: milestone.msAmount || 0,
        milestoneCurrency: milestone.msCurrency || 'USD',
        startDate: milestone.msDate || null,
        endDate: milestone.endDate || null, // If you have end date field
        duration: milestone.msDuration || 0,
        remark: milestone.msRemarks || '',
        attachment: milestone.attachment || null, // Add attachment field
        createdDate: milestone.createdDate || null
      }));

      setMilestones(transformedMilestones);
    } catch (error) {
      console.error("Error fetching milestones:", error);
      showSnackbar("Failed to fetch milestones", "error");
    } finally {
      setMilestonesLoading(false);
    }
  };

  useEffect(() => {
    if (poId) {
      fetchPODetails();
      fetchMilestones();
    }
  }, [poId]);

  // Filter milestones based on search
  const filteredMilestones = milestones.filter(milestone => {
    if (searchQuery === "") return true;

    const searchLower = searchQuery.toLowerCase();
    return (
      milestone.milestoneName?.toLowerCase().includes(searchLower) ||
      milestone.milestoneDescription?.toLowerCase().includes(searchLower) ||
      milestone.milestoneAmount?.toString().includes(searchLower) ||
      milestone.remark?.toLowerCase().includes(searchLower)
    );
  });

  // Download milestones Excel
  const downloadMilestonesExcel = () => {
    try {
      const excelData = filteredMilestones.map((milestone, index) => ({
        'S.No': index + 1,
        'Milestone Name': milestone.milestoneName || 'N/A',
        'Description': milestone.milestoneDescription || 'N/A',
        'Currency': milestone.milestoneCurrency || poDetails?.poCurrency || 'USD',
        'Amount': milestone.milestoneAmount ? milestone.milestoneAmount.toLocaleString() : 'N/A',
        'Date': milestone.startDate ? new Date(milestone.startDate).toLocaleDateString() : 'N/A',
        'Duration (Days)': milestone.duration || 0,
        'Remark': milestone.remark || 'N/A',
        'Attachment': milestone.attachment ? 'Yes' : 'No',

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
        link.setAttribute('download', `po_${poDetails?.poNumber || poId}_milestones_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('Error downloading milestones Excel:', error);
      showSnackbar('Failed to download Excel file. Please try again.', 'error');
    }
  };

  // Handle milestone actions
  const handleEditMilestone = (milestone) => {
    setSelectedMilestoneId(milestone.msId);
    setIsEditMilestoneModalOpen(true);
  };
  const handleAddMilestone = () => {
    setIsAddMilestoneModalOpen(true);
  };

  const handleMilestoneModalSubmit = async (data) => {
    setIsAddMilestoneModalOpen(false);
    showSnackbar("Milestone created successfully!", "success");
    fetchMilestones(); // Refresh the table
  };

  const handleEditMilestoneModalSubmit = async (data) => {
    setIsEditMilestoneModalOpen(false);
    showSnackbar("Milestone updated successfully!", "success");
    fetchMilestones(); // Refresh the table
  };

  // Get status color and icon
  const getStatusDisplay = (status) => {
    const statusConfig = {
      'PENDING': { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      'IN_PROGRESS': { color: 'bg-blue-100 text-blue-800', icon: AlertCircle },
      'COMPLETED': { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      'ON_HOLD': { color: 'bg-red-100 text-red-800', icon: AlertCircle }
    };

    const config = statusConfig[status] || statusConfig['PENDING'];
    const Icon = config.icon;

    return {
      colorClass: config.color,
      icon: <Icon size={14} className="mr-1" />,
      displayText: status?.replace('_', ' ') || 'Pending'
    };
  };

  // Custom cell renderer for truncated text with tooltip
  const TruncatedCellRenderer = (params) => {
    const value = params.value || 'N/A';
    return (
      <div
        className="truncate w-full cursor-pointer"
        title={value}
      >
        {value}
      </div>
    );
  };

  // AG Grid column definitions for milestones - Fixed to match backend fields
  const milestoneColumnDefs = useMemo(() => [
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
      headerName: "Milestone Name",
      field: "milestoneName",
      valueGetter: params => params.data.milestoneName || 'N/A',
      flex: 1,
      minWidth: 180,
      sortable: true,
      filter: true,
      cellStyle: { fontWeight: 'bold', color: '#1f2937' },
      cellRenderer: TruncatedCellRenderer,
      tooltipField: "milestoneName"
    },
   {
  headerName: 'Amount',
  field: 'milestoneAmount',
  flex: 1,
  maxWidth: 130,
  sortable: true,
  filter: 'agNumberColumnFilter',
  valueFormatter: (params) => {
    if (params.value) {
      // Get the milestone currency from the data, fallback to PO currency
      const currency = params.data.milestoneCurrency || poDetails?.poCurrency || 'USD';
      const currencySymbol = getCurrencySymbol(currency);
      
      // Format the amount with proper currency symbol
      return `${currencySymbol}${params.value.toLocaleString()}`;
    }
    return '';
  },
  tooltipValueGetter: (params) => {
    if (params.value) {
      const currency = params.data.milestoneCurrency || poDetails?.poCurrency || 'USD';
      const currencySymbol = getCurrencySymbol(currency);
      return `${currencySymbol}${params.value.toLocaleString()} (${currency})`;
    }
    return 'No amount specified';
  },
  cellClass: 'truncate-cell',
  cellStyle: { fontWeight: 'bold', color: '#059669' }, // Green color for amounts
},
    {
      headerName: "Milestone Date",
      field: "startDate",
      valueGetter: params => params.data.startDate ? new Date(params.data.startDate).toLocaleDateString() : 'N/A',
      width: 120,
      sortable: true,
      filter: true,
      cellRenderer: TruncatedCellRenderer,
      tooltipValueGetter: params => params.data.startDate ? new Date(params.data.startDate).toLocaleDateString() : 'N/A'
    },
    {
      headerName: "Duration (Days)",
      field: "duration",
      valueGetter: params => params.data.duration || 0,
      width: 140,
      sortable: true,
      filter: true,
      cellStyle: { textAlign: 'center' },
      cellRenderer: TruncatedCellRenderer,
      tooltipValueGetter: params => params.data.duration || 0
    },
    {
      headerName: "Description",
      field: "milestoneDescription",
      valueGetter: params => params.data.milestoneDescription || 'N/A',
      flex: 2,
      minWidth: 200,
      sortable: true,
      filter: true,
      cellStyle: { color: '#4b5563' },
      cellRenderer: TruncatedCellRenderer,
      tooltipField: "milestoneDescription"
    },
    {
      headerName: "Remark",
      field: "remark",
      valueGetter: params => params.data.remark || 'N/A',
      flex: 1,
      minWidth: 150,
      sortable: true,
      filter: true,
      cellStyle: { color: '#4b5563' },
      cellRenderer: TruncatedCellRenderer,
      tooltipField: "remark"
    },
    
    {
      headerName: "Actions",
      field: "actions",
      width: 120,
      sortable: false,
      filter: false,
      suppressMenu: true,
      cellRenderer: params => {
        const milestone = params.data;
        return (
          <div className="flex justify-center gap-2 h-full items-center">
            <button
            onClick={() => setSelectedMilestone(milestone)}
            className="p-2 rounded-full hover:bg-blue-100 transition-colors"
            title="View Milestone"
          >
            <Eye size={16} className="text-blue-600" />
          </button>
            <button
              onClick={() => handleEditMilestone(milestone)}
              className="p-2 rounded-full hover:bg-blue-100 transition-colors"
              title="Edit Milestone"
            >
              <Edit size={16} className="text-blue-600" />
            </button>
            
          </div>
        );
      }
    }
  ], [poDetails]);

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

  // Loading overlay component
  const LoadingOverlay = () => (
    <div className="flex items-center justify-center h-full">
      <div className="flex items-center space-x-2">
        <Loader2 className="animate-spin text-green-700" size={24} />
        <span className="text-green-700 font-medium">Loading...</span>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="w-full p-6 bg-white">
        <div className="flex items-center justify-center h-64">
          <LoadingOverlay />
        </div>
      </div>
    );
  }

  if (error || !poDetails) {
    return (
      <div className="w-full p-6 bg-white">
        <div className="text-center">
          <AlertCircle size={64} className="mx-auto mb-4 text-red-300" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">Error Loading PO Details</h3>
          <p className="text-gray-500 mb-4">{error || "PO not found"}</p>
          <button
            onClick={() => navigate('/po')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
          >
            Back to PO Management
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/po')}
            className="p-2 rounded-full hover:bg-gray-200 transition-colors"
            title="Back to PO Management"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <FileText size={24} className="mr-2 text-blue-600" />
            PO Details - {poDetails.poNumber}
          </h1>
        </div>
      </div>

      {/* PO Details Card - Compact 2-row layout without icons with truncation */}
      <div className="bg-green-50 rounded-lg border border-green-200 shadow-sm p-5 mb-6">
        <div className="grid grid-cols-7 gap-6">
          {/* First Row */}
          <div>
            <p className="text-sm font-medium text-blue-600 mb-1">PO Number</p>
            <p
              className="text-base font-bold text-gray-900 truncate cursor-pointer"
              title={poDetails.poNumber}
            >
              {poDetails.poNumber}
            </p>
          </div>

          <div>
            <p className="text-sm font-medium text-green-600 mb-1">PO Amount</p>
            <p
              className="text-base font-bold text-gray-900 truncate cursor-pointer"
              title={formatCurrency(poDetails.poAmount, poDetails.poCurrency)}
            >
              {formatCurrency(poDetails.poAmount, poDetails.poCurrency)}
            </p>
          </div>

          <div>
            <p className="text-sm font-medium text-purple-600 mb-1">Customer</p>
            <p
              className="text-base font-bold text-gray-900 truncate cursor-pointer"
              title={poDetails.customer || 'N/A'}
            >
              {poDetails.customer || 'N/A'}
            </p>
          </div>

          <div>
            <p className="text-sm font-medium text-orange-600 mb-1">SPOC</p>
            <p
              className="text-base font-bold text-gray-900 truncate cursor-pointer"
              title={poDetails.poSpoc || 'N/A'}
            >
              {poDetails.poSpoc || 'N/A'}
            </p>
          </div>

          <div>
            <p className="text-sm font-medium text-indigo-600 mb-1">PO Type</p>
            <p
              className="text-base font-bold text-gray-900 truncate cursor-pointer"
              title={poDetails.poType === 'T_AND_M' ? 'T & M' :
                poDetails.poType === 'FIXED' ? 'Fixed' :
                  poDetails.poType === 'MIXED' ? 'Mixed' : poDetails.poType || 'N/A'}
            >
              {poDetails.poType === 'T_AND_M' ? 'T & M' :
                poDetails.poType === 'FIXED' ? 'Fixed' :
                  poDetails.poType === 'MIXED' ? 'Mixed' : poDetails.poType || 'N/A'}
            </p>
          </div>

          <div>
            <p className="text-sm font-medium text-yellow-600 mb-1">Supplier</p>
            <p
              className="text-base font-bold text-gray-900 truncate cursor-pointer"
              title={poDetails.supplier || 'N/A'}
            >
              {poDetails.supplier || 'N/A'}
            </p>
          </div>

          <div>
            <p className="text-sm font-medium text-teal-600 mb-1">Project Name</p>
            <p
              className="text-base font-bold text-gray-900 truncate cursor-pointer"
              title={poDetails.projectName || 'N/A'}
            >
              {poDetails.projectName || 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* Milestones Section */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        {/* Milestones Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <Target size={20} className="mr-2 text-green-600" />
            PO Milestones ({filteredMilestones.length})
          </h2>

          <div className="flex items-center gap-4">
            {/* Search input */}
            <div className="relative w-64">
              <input
                type="text"
                placeholder="Search milestones..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <Search size={18} className="absolute left-3 top-2.5 text-gray-400" />
            </div>

            {/* Download Excel Button */}
            <button
              className="flex items-center bg-green-900 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors"
              onClick={downloadMilestonesExcel}
              disabled={filteredMilestones.length === 0}
            >
              <Download size={18} className="mr-2" />
              Download Excel
            </button>

            {/* Add Milestone Button */}
            <button
              className="flex items-center bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-md transition-colors"
              onClick={handleAddMilestone}
            >
              <Plus size={18} className="mr-2" />
              Add Milestone
            </button>
          </div>
        </div>

        {/* Milestones Table */}
        <div className="ag-theme-alpine" style={{ height: '60vh', width: '100%' }}>
          <style jsx>{`
          .ag-theme-alpine {
  font-family: 'Segoe UI', 'Noto Sans', 'Roboto', 'Arial', sans-serif;
}
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
            .ag-theme-alpine .ag-row:hover {
              background-color: #f0fdf4;
            }
            .ag-theme-alpine .ag-cell {
              display: flex !important;
              align-items: center !important;
              border-right: 1px solid #e5e7eb;
              padding: 8px 12px;
              font-size: 14px;
            }
          `}</style>
          <AgGridReact
            columnDefs={milestoneColumnDefs}
            rowData={filteredMilestones}
            defaultColDef={defaultColDef}
            pagination={true}
            paginationPageSize={10}
            paginationPageSizeSelector={[5, 10, 15, 20, 25]}
            suppressMovableColumns={true}
            suppressRowClickSelection={true}
            enableBrowserTooltips={true}
            loadingOverlayComponent={LoadingOverlay}
            noRowsOverlayComponent={() => (
              <div className="flex items-center justify-center h-full">
                <div className="text-gray-500 text-center">
                  <Target size={48} className="mx-auto mb-2 text-gray-300" />
                  <p className="text-lg font-medium">No milestones found</p>
                  <p className="text-sm">
                    {searchQuery ? 'Try adjusting your search or' : ''} Add a new milestone to get started
                  </p>
                </div>
              </div>
            )}
            loading={milestonesLoading}
            animateRows={true}
            rowHeight={48}
            headerHeight={48}
            suppressCellFocus={true}
            suppressRowHoverHighlight={false}
          />
        </div>
      </div>
      <div className="bg-white rounded-lg border border-gray-200 mt-5 shadow-sm">
        <GetSRNDetailsByPO poId={poId} />
      </div>
      <div className="bg-white rounded-lg border border-gray-200 mt-5 shadow-sm">
        <GetConsumptionByPO poNumber={poDetails.poNumber} poId={poId} />
      </div>

      {/* Add Milestone Modal */}
      <AddMilestoneModal
        open={isAddMilestoneModalOpen}
        onClose={() => setIsAddMilestoneModalOpen(false)}
        onSubmit={handleMilestoneModalSubmit}
        poId={poId}
      />

      {/* Edit Milestone Modal */}
      <EditMilestoneModal
        open={isEditMilestoneModalOpen}
        onClose={() => {
          setIsEditMilestoneModalOpen(false);
          setSelectedMilestoneId(null);
        }}
        onSubmit={handleEditMilestoneModalSubmit}
        milestoneId={selectedMilestoneId}
      />

      {/* Global Snackbar */}
      <GlobalSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={handleSnackbarClose}
      />

      <ViewMilestoneModal
  open={isViewMilestoneModalOpen}
  onClose={() => {
    setIsViewMilestoneModalOpen(false);
    setSelectedMilestone(null);
  }}
  milestoneData={selectedMilestone}
/>
    </div>
  );
};

export default PODetailsPage;