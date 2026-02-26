import { useState, useEffect, useMemo } from 'react'
import axios from 'axios'
import { AgGridReact } from 'ag-grid-react'
import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-alpine.css'
import { Search, Download, Plus, Banknote, Edit, Loader2, Eye } from 'lucide-react'
import AddSRNModal from './AddSRNModal'
import EditSRNModal from './EditSRNModal'
import CreateNewSRNModal from './podetailspage/CreateNewSRNModal'
import ViewSRNModal from '../components/podetailspage/ViewSRNModal'

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
const GetSRNDetailsByPO = ({ poId }) => {
  const [srnDetails, setSrnDetails] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [isAddSRNOpen, setIsAddSRNOpen] = useState(false)
  const [selectedSRN, setSelectedSRN] = useState(null)
  const [editSRNModalOpen, setEditSRNModalOpen] = useState(false)

  // State for View Modal
  const [isViewSRNModalOpen, setIsViewSRNModalOpen] = useState(false)
  const [viewSRNData, setViewSRNData] = useState(null)

  const handleOpenSRNModal = () => {
    setIsAddSRNOpen(true)
  }

  const handleCloseSRNModal = () => {
    setIsAddSRNOpen(false)
    fetchSRNDetails()
  }

  const handleEditSRN = (srn) => {
    console.log(srn.srnId)
    setSelectedSRN(srn.srnId)
    setEditSRNModalOpen(true)
  }

  const handleCloseSRNEdit = () => {
    setEditSRNModalOpen(false)
  }

  // Handler for viewing SRN
  const handleViewSRN = (srn) => {
    setViewSRNData(srn)
    setIsViewSRNModalOpen(true)
  }

  const downloadSRNExcel = () => {
    try {
      const excelData = srnDetails.map((srn, index) => ({
        'S.No': index + 1,
        'Payment ID': srn.srnId || 'N/A',
        'Payment Name': srn.srnName || 'N/A',
        'PO Number': srn.poNumber || 'N/A',
        'Milestone': srn.milestone?.msName || 'N/A',
        'Amount': srn.srnAmount ? srn.srnAmount.toLocaleString() : 'N/A',
        'Currency': srn.srnCurrency || 'N/A',
        'Type': srn.srnType || 'N/A',
        'Description': srn.srnDsc || 'N/A',
        'Remarks': srn.srnRemarks || 'N/A',
        'Payment Date': srn.srnDate ? new Date(srn.srnDate).toLocaleDateString() : 'N/A',
        'Created Date': srn.createdTimestamp ? new Date(srn.createdTimestamp).toLocaleDateString() : 'N/A',
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
        link.setAttribute('download', `srn_${poId}_details_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('Error downloading SRN Excel:', error);
      // showSnackbar('Failed to download Excel file. Please try again.', 'error');
    }
  }

  useEffect(() => {
    if (isAddSRNOpen) {
      document.body.classList.add('overflow-hidden')
    } else {
      document.body.classList.remove('overflow-hidden')
    }
  })

  const filteredSRNDetails = srnDetails.filter(srnDetails => {
    if (searchQuery === "") return true;

    const searchLower = searchQuery.toLowerCase();
    return (
      srnDetails.srnName?.toLowerCase().includes(searchLower) ||
      srnDetails.poNumber?.toLowerCase().includes(searchLower) ||
      srnDetails.srnAmount?.toString().includes(searchLower) ||
      srnDetails.srnDsc?.toLowerCase().includes(searchLower) ||
      srnDetails.milestone?.msName?.toLowerCase().includes(searchLower)
    );
  });

  // Column definitions for AG Grid
  const columnDefs = [
    {
      headerName: 'Payment ID',
      field: 'srnId',
      flex: 1,
      maxWidth: 70,
      sortable: true,
      filter: true,
      tooltipField: 'srnId',
      cellClass: 'truncate-cell',
    },
    {
      headerName: 'Payment Name',
      field: 'srnName',
      flex: 1,
      maxWidth: 150,
      sortable: true,
      filter: true,
      tooltipField: 'srnName',
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
      field: 'milestone.msName',
      flex: 1,
      maxWidth: 120,
      sortable: true,
      filter: true,
      valueFormatter: (params) => params.value || 'N/A',
      tooltipField: 'milestone.msName',
      cellClass: 'truncate-cell',
    }, {
      headerName: 'Milestone Amount',
      field: 'milestone.msAmount',
      flex: 1,
      maxWidth: 130,
      sortable: true,
      filter: 'agNumberColumnFilter',
      valueFormatter: (params) => {
        if (params.value) {
          // Get the SRN currency from the data, fallback to PO currency
          const currency = params.data.srnCurrency || poDetails?.poCurrency || 'USD';
          const currencySymbol = getCurrencySymbol(currency);

          // Format the amount with proper currency symbol
          return `${currencySymbol}${params.value.toLocaleString()}`;
        }
        return '';
      },
      tooltipValueGetter: (params) => {
        if (params.value) {
          const currency = params.data.srnCurrency || poDetails?.poCurrency || 'USD';
          const currencySymbol = getCurrencySymbol(currency);
          return `${currencySymbol}${params.value.toLocaleString()} (${currency})`;
        }
        return 'No amount specified';
      },
      cellClass: 'truncate-cell',
      cellStyle: { fontWeight: 'bold', color: '#059669' }, // Green color for amounts
    },
    {
      headerName: 'Amount Paid',
      field: 'srnAmount',
      flex: 1,
      maxWidth: 130,
      sortable: true,
      filter: 'agNumberColumnFilter',
      valueFormatter: (params) => {
        if (params.value) {
          // Get the SRN currency from the data, fallback to PO currency
          const currency = params.data.srnCurrency || poDetails?.poCurrency || 'USD';
          const currencySymbol = getCurrencySymbol(currency);

          // Format the amount with proper currency symbol
          return `${currencySymbol}${params.value.toLocaleString()}`;
        }
        return '';
      },
      tooltipValueGetter: (params) => {
        if (params.value) {
          const currency = params.data.srnCurrency || poDetails?.poCurrency || 'USD';
          const currencySymbol = getCurrencySymbol(currency);
          return `${currencySymbol}${params.value.toLocaleString()} (${currency})`;
        }
        return 'No amount specified';
      },
      cellClass: 'truncate-cell',
      cellStyle: { fontWeight: 'bold', color: '#059669' }, // Green color for amounts
    },
    {
      headerName: 'Payment Type',
      field: 'srnType',
      flex: 1,
      maxWidth: 100,
      sortable: true,
      filter: true,
      cellStyle: (params) => {
        if (params.value === 'partial') {
          return { backgroundColor: '#fff3cd', color: '#856404' }
        } else if (params.value === 'full') {
          return { backgroundColor: '#d4edda', color: '#155724' }
        }
        return null
      },
      tooltipField: 'srnType',
      cellClass: 'truncate-cell',
    },
    {
      headerName: 'Description',
      field: 'srnDsc',
      flex: 1,
      minWidth: 150,
      sortable: true,
      filter: true,
      tooltipField: 'srnDsc',
      cellClass: 'truncate-cell',
    },
    {
      headerName: 'Remarks',
      field: 'srnRemarks',
      flex: 1,
      minWidth: 150,
      sortable: true,
      filter: true,
      tooltipField: 'srnRemarks',
      cellClass: 'truncate-cell',
    },
    {
      headerName: 'Created Date',
      field: 'createdTimestamp',
      flex: 1.5,
      maxWidth: 150,
      sortable: true,
      filter: 'agDateColumnFilter',
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
      pinned: 'right',
      cellRenderer: params => {
        const srn = params.data;
        return (
          <div className="flex justify-center gap-2 h-full items-center">
            <button
              onClick={() => handleViewSRN(srn)}
              className="p-2 rounded-full hover:bg-green-100 transition-colors cursor-pointer"
              title="View SRN"
            >
              <Eye size={16} className="text-green-600" />
            </button>
            <button
              onClick={() => handleEditSRN(srn)}
              className="p-2 rounded-full hover:bg-blue-100 transition-colors cursor-pointer"
              title="Edit SRN"
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

  const fetchSRNDetails = async () => {
    console.log("Fetching SRN Details Again")
    try {
      setLoading(true)
      const response = await axios.get(`${API_BASE_URL}/api/srn/po/${poId}`, {
        headers: {
          Authorization: sessionStorage.getItem("token")
        }
      })
      console.log(response.data)
      // Sort SRN details by createdTimestamp descending (latest first)
      const sortedData = (response.data || []).sort((a, b) => {
        const aTime = a.createdTimestamp ? new Date(a.createdTimestamp).getTime() : 0;
        const bTime = b.createdTimestamp ? new Date(b.createdTimestamp).getTime() : 0;
        return bTime - aTime;
      });
      setSrnDetails(sortedData)
      setError(null)
    } catch (err) {
      console.error('Error fetching SRN details:', err)
      setError('Failed to fetch SRN details')
      setSrnDetails([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSRNDetails()
  }, [poId])

  const handleEditModalSubmit = async (data) => {
    try {
      fetchSRNDetails();
      setEditSRNModalOpen(false);
      setSelectedSRN(null);
    } catch (error) {
      console.error("Error updating SRN:", error);
    }
  };

  const handleViewCloseAndEditOpen = (srn) => {
    setIsViewSRNModalOpen(false);
    setSelectedSRN(srn);
    setEditSRNModalOpen(true);
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center p-4 sm:p-8">
        <div className="text-lg">Loading Payment details...</div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 sm:p-6 m-2 sm:m-4">
        <div className="text-red-800 font-medium">Error</div>
        <div className="text-red-600">{error}</div>
      </div>
    )
  }

  return (
    <div className="">
      <div className="w-full flex flex-col sm:flex-row p-4 sm:p-6 sm:justify-between gap-4">
  
  {/* Heading */}
  <h2 className="w-full sm:w-auto text-lg sm:text-xl font-bold text-gray-900 flex items-center">
    <Banknote size={20} className="mr-2 text-green-600" />
    Payment Details ({filteredSRNDetails.length})
  </h2>

  {/* Right Section */}
  <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 w-full sm:w-auto items-stretch sm:items-center">
    
    {/* Search Input */}
    <div className="relative w-full sm:w-64">
      <input
        type="text"
        placeholder="Search Payment..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      />
      <Search size={18} className="absolute left-3 top-2.5 text-gray-400" />
    </div>

    {/* Buttons */}
    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
      
      <button
        className="w-full sm:w-auto flex items-center justify-start bg-green-900 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors"
        onClick={downloadSRNExcel}
        disabled={filteredSRNDetails.length === 0}
      >
        <Download size={18} className="mr-2" />
        Download Excel
      </button>

      <button
        className="w-full sm:w-auto flex items-center justify-start bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-md transition-colors"
        onClick={handleOpenSRNModal}
      >
        <Plus size={18} className="mr-2" />
        Add Payment
      </button>

    </div>
  </div>
</div>

      <div className="ag-theme-alpine h-64 sm:h-80 md:h-96 lg:h-[60vh]" style={{ width: '100%' }}>
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
          rowData={filteredSRNDetails}
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
                <Banknote size={48} className="mx-auto mb-2 text-gray-300" />
                <p className="text-lg font-medium">No Payment Details found</p>
                <p className="text-sm">
                  {searchQuery ? 'Try adjusting your search or' : ''} Add a new Payment to get started
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

      {/* Create New SRN Modal */}
      <CreateNewSRNModal
        poId={poId}
        open={isAddSRNOpen}
        onClose={handleCloseSRNModal}
      />

      {/* Edit SRN Modal */}
      <EditSRNModal
        open={editSRNModalOpen}
        onClose={handleCloseSRNEdit}
        srnId={selectedSRN}
        onSubmit={handleEditModalSubmit}
      />

      {/* View SRN Modal */}
      <ViewSRNModal
        open={isViewSRNModalOpen}
        onClose={() => {
          setIsViewSRNModalOpen(false)
          setViewSRNData(null)
        }}
        srnData={viewSRNData}
        handleEdit={handleViewCloseAndEditOpen}
      />
    </div>
  )
}

export default GetSRNDetailsByPO