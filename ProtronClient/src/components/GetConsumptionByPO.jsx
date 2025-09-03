import { useState, useEffect, useMemo } from 'react'
import axios from 'axios'
import { AgGridReact } from 'ag-grid-react'
import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-alpine.css'
import { Search, Download, Plus, TrendingUp, Edit, Loader2, Eye } from 'lucide-react'
import AddPOConsumptionModal from './AddPOConsumptionModal'
import EditPOConsumptionModal from './EditPOConsumptionModal'
import CreateNewPOConsumption from './podetailspage/CreateNewPOConsumption'
import ViewPOConsumptionModal from './podetailspage/ViewPOConsumption'

const API_BASE_URL = import.meta.env.VITE_API_URL

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
      'CAD': 'C$', 'AUD': 'A$', 'CHF': 'CHF', 'CNY': '¥', 'SEK': 'kr',
      'NOK': 'kr', 'MXN': '$', 'NZD': 'NZ$', 'SGD': 'S$', 'HKD': 'HK$',
      'ZAR': 'R', 'BRL': 'R$', 'RUB': '₽', 'KRW': '₩', 'TRY': '₺'
    };
    return currencySymbols[currencyCode] || currencyCode || '$';
  };
const GetConsumptionByPO = ({ poNumber, poId, onViewConsumption }) => {
  const [consumptions, setConsumptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [isAddConsumptionOpen, setIsAddConsumptionOpen] = useState(false)
  const [selectedConsumption, setSelectedConsumption] = useState(null)
  const [editConsumptionModalOpen, setEditConsumptionModalOpen] = useState(false)
  
  // State for View Modal
  const [isViewConsumptionModalOpen, setIsViewConsumptionModalOpen] = useState(false)
  const [viewConsumptionData, setViewConsumptionData] = useState(null)

  const handleOpenConsumptionModal = () => {
    setIsAddConsumptionOpen(true)
  }

  const handleCloseConsumptionModal = () => {
    setIsAddConsumptionOpen(false)
    fetchConsumptions()
  }

  const handleEditConsumption = (consumption) => {
    console.log(consumption.utilizationId)
    setSelectedConsumption(consumption.utilizationId)
    setEditConsumptionModalOpen(true)
  }

  const handleCloseConsumptionEdit = () => {
    setEditConsumptionModalOpen(false)
    fetchConsumptions()
  }

  // Handler for viewing consumption
  const handleViewConsumption = (consumption) => {
    setViewConsumptionData(consumption)
    setIsViewConsumptionModalOpen(true)
    
    // Also call the parent onViewConsumption if provided
    if (onViewConsumption) {
      onViewConsumption(consumption)
    }
  }

  const downloadConsumptionExcel = () => {
    try {
      const excelData = consumptions.map((consumption, index) => ({
        'S.No': index + 1,
        'Utilization ID': consumption.utilizationId || 'N/A',
        'PO Number': consumption.poNumber || 'N/A',
        'Milestone': consumption.milestone?.msName || 'N/A',
        'Amount': consumption.amount ? consumption.amount.toLocaleString() : 'N/A',
        'Currency': consumption.currency || 'N/A',
        'Utilization Type': consumption.utilizationType || 'N/A',
        'Resource': consumption.resource || 'N/A',
        'Project': consumption.project || 'N/A',
        'System Name': consumption.systemName || 'N/A',
        'Work Description': consumption.workDesc || 'N/A',
        'Remarks': consumption.remarks || 'N/A',
        'Work Assign Date': consumption.workAssignDate ? new Date(consumption.workAssignDate).toLocaleDateString() : 'N/A',
        'Work Completion Date': consumption.workCompletionDate ? new Date(consumption.workCompletionDate).toLocaleDateString() : 'N/A',
        'Created Date': consumption.createdTimestamp ? new Date(consumption.createdTimestamp).toLocaleDateString() : 'N/A',
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
        link.setAttribute('download', `consumption_${poNumber}_details_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('Error downloading consumption Excel:', error);
      // showSnackbar('Failed to download Excel file. Please try again.', 'error');
    }
  }

  const filteredConsumptions = consumptions.filter(consumption => {
    if (searchQuery === "") return true;

    const searchLower = searchQuery.toLowerCase();
    return (
      consumption.systemName?.toLowerCase().includes(searchLower) ||
      consumption.poNumber?.toLowerCase().includes(searchLower) ||
      consumption.amount?.toString().includes(searchLower) ||
      consumption.resource?.toLowerCase().includes(searchLower) ||
      consumption.project?.toLowerCase().includes(searchLower) ||
      consumption.utilizationType?.toLowerCase().includes(searchLower)
    );
  });
  
  useEffect(() => {
    if (isAddConsumptionOpen) {
      document.body.classList.add('overflow-hidden')
    } else {
      document.body.classList.remove('overflow-hidden')
    }
  })

  // Column definitions for AG Grid
  const columnDefs = [
    {
      headerName: 'Utilization ID',
      field: 'utilizationId',
      flex: 1,
      maxWidth: 120,
      sortable: true,
      filter: true,
      tooltipField: 'utilizationId',
      cellClass: 'truncate-cell',
    },
    {
      headerName: 'PO Number',
      field: 'poNumber',
      flex: 1,
      maxWidth: 150,
      sortable: true,
      filter: true,
      tooltipField: 'poNumber',
      cellClass: 'truncate-cell',
    },
    {
      headerName: 'Milestone',
      field: 'milestone',
      flex: 1,
      maxWidth: 120,
      sortable: true,
      filter: true,
      valueFormatter: (params) => params.value?.msName || 'N/A',
      tooltipField: 'milestone.msName',
      cellClass: 'truncate-cell',
    },
    {
      headerName: 'Amount',
      field: 'amount',
      flex: 1,
      maxWidth: 130,
      sortable: true,
      filter: 'agNumberColumnFilter',
      valueFormatter: (params) => {
        if (params.value) {
          // Get the consumption currency from the data, fallback to PO currency
          const currency = params.data.currency || poDetails?.poCurrency || 'USD';
          const currencySymbol = getCurrencySymbol(currency);
          
          // Format the amount with proper currency symbol
          return `${currencySymbol}${params.value.toLocaleString()}`;
        }
        return '';
      },
      tooltipValueGetter: (params) => {
        if (params.value) {
          const currency = params.data.currency || poDetails?.poCurrency || 'USD';
          const currencySymbol = getCurrencySymbol(currency);
          return `${currencySymbol}${params.value.toLocaleString()} (${currency})`;
        }
        return 'No amount specified';
      },
      cellClass: 'truncate-cell',
      cellStyle: { fontWeight: 'bold', color: '#059669' }, // Green color for amounts
    },
    {
      headerName: 'Type',
      field: 'utilizationType',
      flex: 1,
      maxWidth: 100,
      sortable: true,
      filter: true,
      cellStyle: (params) => {
        if (params.value === 'T&M') {
          return { backgroundColor: '#fff3cd', color: '#856404' }
        } else if (params.value === 'Fixed') {
          return { backgroundColor: '#d4edda', color: '#155724' }
        }
        return null
      },
      tooltipField: 'utilizationType',
      cellClass: 'truncate-cell',
    },
    {
      headerName: 'Resource',
      field: 'resource',
      flex: 1,
      minWidth: 120,
      sortable: true,
      filter: true,
      tooltipField: 'resource',
      cellClass: 'truncate-cell',
    },
    {
      headerName: 'Project',
      field: 'project',
      flex: 1,
      minWidth: 120,
      sortable: true,
      filter: true,
      tooltipField: 'project',
      cellClass: 'truncate-cell',
    },
    {
      headerName: 'Work Description',
      field: 'workDesc',
      flex: 1,
      minWidth: 150,
      sortable: true,
      filter: true,
      tooltipField: 'workDesc',
      cellClass: 'truncate-cell',
    },
    {
      headerName: 'Remarks',
      field: 'remarks',
      flex: 1,
      minWidth: 150,
      sortable: true,
      filter: true,
      tooltipField: 'remarks',
      cellClass: 'truncate-cell',
    },
    {
      headerName: 'Work Assign Date',
      field: 'workAssignDate',
      flex: 1.5,
      maxWidth: 150,
      sortable: true,
      filter: 'agDateColumnFilter',
        valueFormatter: (params) => {
          if (params.value) {
            const d = new Date(params.value);
            const day = String(d.getDate()).padStart(2, '0');
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const monthStr = monthNames[d.getMonth()];
            const year = d.getFullYear();
            return `${day}-${monthStr}-${year}`;
          }
          return '';
        },
      tooltipField: 'workAssignDate',
      cellClass: 'truncate-cell',
    },
    {
      headerName: 'Work Completion Date',
      field: 'workCompletionDate',
      flex: 1.5,
      maxWidth: 170,
      sortable: true,
      filter: 'agDateColumnFilter',
        valueFormatter: (params) => {
          if (params.value) {
            const d = new Date(params.value);
            const day = String(d.getDate()).padStart(2, '0');
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const monthStr = monthNames[d.getMonth()];
            const year = d.getFullYear();
            return `${day}-${monthStr}-${year}`;
          }
          return '';
        },
      tooltipField: 'workCompletionDate',
      cellClass: 'truncate-cell',
    },
    {
      headerName: 'System Name',
      field: 'systemName',
      flex: 1,
      maxWidth: 150,
      sortable: true,
      filter: true,
        valueFormatter: (params) => {
          if (params.value) {
            const d = new Date(params.value);
            const day = String(d.getDate()).padStart(2, '0');
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const monthStr = monthNames[d.getMonth()];
            const year = d.getFullYear();
            return `${day}-${monthStr}-${year}`;
          }
          return '';
        },
      valueFormatter: (params) => {
        if (params.value) {
          return new Date(params.value).toLocaleString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: '2-digit',
          })
        }
        return ''
      },
      tooltipField: 'createdTimestamp',
      cellClass: 'truncate-cell',
    },
    {
      headerName: "Actions",
      field: "actions",
      minWidth: 100,
      maxWidth: 120,
      flex: 0,
      sortable: false,
      filter: false,
      suppressMenu: true,
      cellRenderer: params => {
        const consumption = params.data;
        return (
          <div className="flex justify-center gap-2 h-full items-center">
            <button
              onClick={() => handleViewConsumption(consumption)}
              className="p-2 rounded-full hover:bg-green-100 transition-colors"
              title="View Consumption"
            >
              <Eye size={16} className="text-green-600" />
            </button>
            <button
              onClick={() => handleEditConsumption(consumption)}
              className="p-2 rounded-full hover:bg-blue-100 transition-colors"
              title="Edit Consumption"
            >
              <Edit size={16} className="text-blue-600" />
            </button>
          </div>
        );
      }
    }
  ];

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

  const fetchConsumptions = async () => {
    console.log("Fetching Consumption Details Again")
    try {
      setLoading(true)
      const response = await axios.get(`${API_BASE_URL}/api/po-consumption/by-po/${poNumber}`, {
        headers: {
          Authorization: sessionStorage.getItem("token")
        }
      })
      console.log("PO Consumption Details", response.data)
      setConsumptions(response.data || [])
      setError(null)
    } catch (err) {
      console.error('Error fetching consumption details:', err)
      setError('Failed to fetch consumption details')
      setConsumptions([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchConsumptions()
  }, [poNumber])

  const handleEditModalSubmit = async (data) => {
    try {
      fetchConsumptions();
      setEditConsumptionModalOpen(false);
      setSelectedConsumption(null);
    } catch (error) {
      console.error("Error updating consumption:", error);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">Loading consumption details...</div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 m-4">
        <div className="text-red-800 font-medium">Error</div>
        <div className="text-red-600">{error}</div>
      </div>
    )
  }

  return (
    <div className="">
      <div className="flex p-6 justify-between">
        <h2 className="text-xl font-bold text-gray-900 flex items-center">
          <TrendingUp size={20} className="mr-2 text-green-600" />
          PO Consumption Details ({filteredConsumptions.length})
        </h2>
        <div className='flex gap-4 items-center'>
          <div className="relative w-64">
            <input
              type="text"
              placeholder="Search consumptions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <Search size={18} className="absolute left-3 top-2.5 text-gray-400" />
          </div>
          <button
            className="flex items-center bg-green-900 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors"
            onClick={downloadConsumptionExcel}
            disabled={filteredConsumptions.length === 0}
          >
            <Download size={18} className="mr-2" />
            Download Excel
          </button>
          <button
            className="flex items-center bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-md transition-colors"
            onClick={handleOpenConsumptionModal}
          >
            <Plus size={18} className="mr-2" />
            Add Consumption
          </button>
        </div>
      </div>

      <div className="ag-theme-alpine" style={{ height: '60vh', width: '100%' }}>
        <style jsx>{`
          .ag-theme-alpine .ag-header {
            background-color: #15803d !important;
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
          rowData={filteredConsumptions}
          columnDefs={columnDefs}
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
                <TrendingUp size={48} className="mx-auto mb-2 text-gray-300" />
                <p className="text-lg font-medium">No Consumption Details found</p>
                <p className="text-sm">
                  {searchQuery ? 'Try adjusting your search or' : ''} Add a new consumption to get started
                </p>
              </div>
            </div>
          )}
          loading={loading}
          animateRows={true}
          rowHeight={48}
          headerHeight={48}
          suppressCellFocus={true}
          suppressRowHoverHighlight={false}
          onGridReady={(params) => {
            params.api.sizeColumnsToFit()
          }}
          onFirstDataRendered={(params) => {
            params.api.sizeColumnsToFit()
          }}
        />
      </div>

      {/* Create New PO Consumption Modal */}
      <CreateNewPOConsumption
        open={isAddConsumptionOpen}
        onClose={handleCloseConsumptionModal}
        poNumber={poNumber}
        poId={poId}
      />

      {/* Edit PO Consumption Modal */}
      <EditPOConsumptionModal
        open={editConsumptionModalOpen}
        onClose={handleCloseConsumptionEdit}
        consumptionId={selectedConsumption}
        onSubmit={handleEditModalSubmit}
      />

      {/* View PO Consumption Modal */}
      <ViewPOConsumptionModal 
        open={isViewConsumptionModalOpen}
        onClose={() => {
          setIsViewConsumptionModalOpen(false)
          setViewConsumptionData(null)
        }}
        consumptionData={viewConsumptionData}
      />
    </div>
  )
}

export default GetConsumptionByPO