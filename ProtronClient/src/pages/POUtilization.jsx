// POConsumptionManagement.js
import { useState, useEffect, useMemo, forwardRef, useImperativeHandle } from "react";
import { useNavigate } from "react-router-dom";
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

import {
  Activity,
  Plus,
  Search,
  Edit,
  Download,
  Loader2,
  DollarSign,
  Building,
  User,
  FileText,
  Hash,
  Trash2,
  Calendar,
  Eye,
  Paperclip,
  X,
  Target,
  File,
  Image,
  Archive
} from "lucide-react";
import { useAccess } from "../Context/AccessContext";
import axios from "axios";
import GlobalSnackbar from "../components/GlobalSnackbar";
import AddPOConsumptionModal from "../components/AddPOConsumptionModal";
import EditPOConsumptionModal from "../components/EditPOConsumptionModal";

// ViewDetailsModal Component - Fixed with correct milestone properties
const ViewDetailsModal = ({ open, onClose, consumption }) => {
  const [attachments, setAttachments] = useState([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);
  const [attachmentError, setAttachmentError] = useState(null);

  useEffect(() => {
    if (open && consumption?.utilizationId) {
      setLoadingAttachments(true);
      const token = sessionStorage.getItem("token");

      axios
        .get(
          `${import.meta.env.VITE_API_URL}/api/po-attachments/meta/filter?level=CONSUMPTION&referenceId=${consumption.utilizationId}`,
          {
            headers: {
              Authorization: `${token}`,
            },
          }
        )
        .then((res) => {
          setAttachments(res.data);
          setAttachmentError(null);
        })
        .catch((err) => {
          setAttachmentError("Failed to load attachments.");
          console.error(err);
        })
        .finally(() => setLoadingAttachments(false));
    }
  }, [open, consumption?.utilizationId]);

  const handleAttachmentClick = async (attachment) => {
    try {
      const token = sessionStorage.getItem("token");
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/po-attachments/${attachment.id}/download`,
        {
          responseType: "blob",
          headers: {
            Authorization: `${token}`,
          },
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", attachment.fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Failed to download attachment:", error);
    }
  };

  if (!open || !consumption) return null;

  // Format currency (matching PO modal)
  const formatCurrency = (amount, currency = 'USD') => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  // Format date (matching PO modal)
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const d = new Date(dateString);
    const day = String(d.getDate()).padStart(2, '0');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthStr = monthNames[d.getMonth()];
    const year = d.getFullYear();
    return `${day}-${monthStr}-${year}`;
  };

  // Get consumption type tag styling
  const getConsumptionTypeTag = (type) => {
    const baseClasses = "px-2 py-1 rounded text-xs font-medium";
    switch (type) {
      case "MILESTONE":
        return `${baseClasses} bg-emerald-100 text-emerald-800`;
      case "RESOURCE":
        return `${baseClasses} bg-violet-100 text-violet-800`;
      case "EXPENSE":
        return `${baseClasses} bg-amber-100 text-amber-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-700`;
    }
  };

  // Field component for consistent styling (matching PO modal)
  const Field = ({ label, value, className = "" }) => (
    <div className={className}>
      <label className="text-xs font-medium text-gray-600 mb-1 block">{label}</label>
      <div className="text-sm text-gray-900 font-medium">
        {value || "N/A"}
      </div>
    </div>
  );

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#00000059] bg-opacity-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-[95vw] sm:max-w-6xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 bg-green-600 text-white rounded-t-lg">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
              <FileText size={20} className="sm:w-6 sm:h-6 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <h2 className="text-lg sm:text-xl font-bold truncate">PO Consumption Details</h2>
                <p className="text-green-100 text-xs sm:text-sm truncate">Consumption ID: {consumption.utilizationId || 'N/A'}</p>
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
          {/* Basic Consumption Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <FileText className="mr-2 text-green-600" size={20} />
              Basic Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <Field
                label="PO Number"
                value={consumption.poNumber}
              />
              <Field
                label="Consumption ID"
                value={consumption.utilizationId}
              />
              <Field
                label="Consumption Type"
                value={<span className={getConsumptionTypeTag(consumption.utilizationType)}>{consumption.utilizationType}</span>}
              />
              <Field
                label="Amount"
                value={formatCurrency(consumption.amount, consumption.currency)}
              />
              <Field
                label="Resource/Initiative"
                value={consumption.project}
              />
              <Field
                label="System Name"
                value={consumption.systemName}
              />
              <Field
                label="Work Assign Date"
                value={formatDate(consumption.workAssignDate)}
              />
              <Field
                label="Work Completion Date"
                value={formatDate(consumption.workCompletionDate)}
              />
            </div>
          </div>

          {/* Milestone Information */}
          {consumption.milestone && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <Target className="mr-2 text-green-600" size={20} />
                Milestone Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <Field
                  label="Milestone Name"
                  value={consumption.milestone.msName}
                />
                <Field
                  label="Milestone Amount"
                  value={formatCurrency(consumption.milestone.msAmount, consumption.milestone.msCurrency)}
                />
                <Field
                  label="Milestone Date"
                  value={formatDate(consumption.milestone.msDate)}
                />
                <Field
                  label="Duration (Days)"
                  value={consumption.milestone.msDuration ? `${consumption.milestone.msDuration} days` : 'N/A'}
                />
              </div>
              {consumption.milestone.msDesc && (
                <div className="mt-3 sm:mt-4">
                  <Field
                    label="Milestone Description"
                    value={
                      <div className="bg-white rounded p-2 sm:p-3 border max-h-24 sm:max-h-32 overflow-y-auto">
                        <p className="text-xs sm:text-sm text-gray-900 leading-relaxed whitespace-pre-wrap break-words">
                          {consumption.milestone.msDesc}
                        </p>
                      </div>
                    }
                  />
                </div>
              )}
              {consumption.milestone.msRemarks && (
                <div className="mt-3 sm:mt-4">
                  <Field
                    label="Milestone Remarks"
                    value={
                      <div className="bg-white rounded p-2 sm:p-3 border max-h-24 sm:max-h-32 overflow-y-auto">
                        <p className="text-xs sm:text-sm text-gray-900 leading-relaxed whitespace-pre-wrap break-words">
                          {consumption.milestone.msRemarks}
                        </p>
                      </div>
                    }
                  />
                </div>
              )}
            </div>
          )}

          {/* Work Description */}
          {consumption.workDesc && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                <FileText className="mr-2 text-green-600" size={20} />
                Work Description
              </h3>
              <div className="bg-white rounded p-2 sm:p-3 border max-h-32 sm:max-h-40 overflow-y-auto">
                <p className="text-xs sm:text-sm text-gray-900 leading-relaxed whitespace-pre-wrap break-words">
                  {consumption.workDesc || "No work description provided"}
                </p>
              </div>
            </div>
          )}

          {/* Remarks */}
          {consumption.remarks && consumption.remarks.trim() !== '' && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                <Edit className="mr-2 text-green-600" size={20} />
                Remarks
              </h3>
              <div className="bg-white rounded p-2 sm:p-3 border max-h-32 sm:max-h-40 overflow-y-auto">
                <p className="text-xs sm:text-sm text-gray-900 leading-relaxed whitespace-pre-wrap break-words">
                  {consumption.remarks}
                </p>
              </div>
            </div>
          )}

          {/* Attachments */}
          {attachments.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                <Paperclip className="mr-2 text-green-600" size={20} />
                Attachments ({attachments.length})
              </h3>
              <div className="space-y-1 sm:space-y-2">
                {attachments.map((attachment, index) => (
                  <button
                    key={attachment.id || index}
                    onClick={() => handleAttachmentClick(attachment)}
                    className="flex items-center text-blue-700 hover:text-blue-900 hover:bg-blue-50 text-xs sm:text-sm p-2 sm:p-3 rounded border bg-white w-full text-left transition-colors"
                  >
                    <div className="flex-shrink-0 mr-2 sm:mr-3">
                      {getFileIcon(attachment.fileName || attachment.name || attachment.filename)}
                    </div>
                    <div className="flex-1 truncate min-w-0">
                      <span className="block truncate">
                        {attachment.fileName || attachment.name || attachment.filename || `Attachment ${index + 1}`}
                      </span>
                    </div>
                    <Download size={12} className="sm:w-3.5 sm:h-3.5 ml-1 sm:ml-2 flex-shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {loadingAttachments && (
            <div className="text-center py-4">
              <div className="text-gray-600 text-sm flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600 mr-2"></div>
                Loading attachments...
              </div>
            </div>
          )}

          {attachmentError && (
            <div className="bg-red-50 border border-red-200 rounded p-3">
              <div className="text-red-700 text-sm flex items-center">
                <X className="mr-2" size={16} />
                {attachmentError}
              </div>
            </div>
          )}
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


const POConsumptionManagement = forwardRef(({ searchQuery, setSearchQuery }, ref) => {
  const navigate = useNavigate();
  const { hasAccess } = useAccess();

  // State management
  const [consumptionList, setConsumptionList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedConsumptionId, setSelectedConsumptionId] = useState(null);
  const [selectedConsumption, setSelectedConsumption] = useState(null);

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    downloadConsumptionExcel,
    handleAddConsumption: () => setIsAddModalOpen(true),
    fetchConsumptionData
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

  // Utility function to truncate text with hover tooltip
  const truncateWithTooltip = (text, maxLength = 15) => {
    if (!text || text === 'N/A') return text;
    if (text.length <= maxLength) return text;

    return (
      <span
        title={text}
        className="cursor-help truncate block"
        style={{ maxWidth: '100%' }}
      >
        {text.substring(0, maxLength)}...
      </span>
    );
  };

  // Fetch PO Consumption data - UPDATED WITHOUT MOCK DATA
  const fetchConsumptionData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = sessionStorage.getItem('token');
      if (!token) {
        throw new Error("Missing authentication credentials");
      }

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/po-consumption/all`,
        {
          headers: { Authorization: `${token}` }
        }
      );

      // Use real data only - no mock attachments
      // Sort PO consumption by createdTimestamp (latest first)
      const sortedList = (response.data || []).sort((a, b) => {
        const dateA = a.createdTimestamp ? new Date(a.createdTimestamp) : new Date(0);
        const dateB = b.createdTimestamp ? new Date(b.createdTimestamp) : new Date(0);
        return dateB - dateA;
      });
      setConsumptionList(sortedList);
    } catch (error) {
      console.error("Error fetching PO Consumption data:", error);
      setError(error.message || "Failed to fetch PO Consumption data");
      showSnackbar("Failed to fetch PO Consumption data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConsumptionData();
  }, []);

  // Filter PO Consumption data based on search
  const filteredConsumptionData = consumptionList.filter(consumption => {
    if (!searchQuery || searchQuery === "") return true;

    const searchLower = searchQuery.toLowerCase();
    return (
      consumption.poNumber?.toLowerCase().includes(searchLower) ||
      consumption.utilizationId?.toString().includes(searchLower) ||
      consumption.milestone?.msName?.toLowerCase().includes(searchLower) ||
      consumption.utilizationType?.toLowerCase().includes(searchLower) ||
      consumption.project?.toLowerCase().includes(searchLower) ||
      consumption.workDesc?.toLowerCase().includes(searchLower) ||
      consumption.amount?.toString().includes(searchLower) ||
      consumption.currency?.toLowerCase().includes(searchLower) ||
      consumption.remarks?.toLowerCase().includes(searchLower) ||
      consumption.systemName?.toLowerCase().includes(searchLower) ||
      consumption.updatedBy?.toLowerCase().includes(searchLower)
    );
  });

  // Excel download function
  const downloadConsumptionExcel = () => {
    try {
      const excelData = filteredConsumptionData.map((consumption, index) => ({
        'S.No': index + 1,
        'PO Number': consumption.poNumber || 'N/A',
        'Milestone Name': consumption.milestone?.msName || 'N/A',
        'Consumption Type': consumption.utilizationType || 'N/A',
        'Project': consumption.project || 'N/A',
        'Work Description': consumption.workDesc || 'N/A',
        'Currency': consumption.currency || 'N/A',
        'Amount': consumption.amount ? `${getCurrencySymbol(consumption.currency)}${consumption.amount.toLocaleString()}` : 'N/A',
        'Work Assign Date': consumption.workAssignDate ? new Date(consumption.workAssignDate).toLocaleDateString() : 'N/A',
        'Work Completion Date': consumption.workCompletionDate ? new Date(consumption.workCompletionDate).toLocaleDateString() : 'N/A',
        'Remarks': consumption.remarks || 'N/A',
        'System Name': consumption.systemName || 'N/A',
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
        link.setAttribute('download', `po_consumption_list_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('Error downloading PO Consumption Excel:', error);
      showSnackbar('Failed to download Excel file. Please try again.', 'error');
    }
  };

  // Handle PO Consumption actions
  const handleViewConsumption = (consumption) => {
    setSelectedConsumption(consumption);
    setIsViewModalOpen(true);
  };

  const handleEditConsumption = (consumption) => {
    console.log('Editing PO Consumption:', consumption);
    setSelectedConsumptionId(consumption.utilizationId);
    setIsEditModalOpen(true);
  };

  const handleAddConsumption = () => {
    setIsAddModalOpen(true);
  };

  const handleConsumptionIdClick = (consumption) => {
    navigate(`/po-consumption-details/${consumption.utilizationId}`);
  };

  const handlePONumberClick = (consumption) => {
    // Navigate to PO details using the poNumber
    if (consumption.poNumber) {
      // You might need to fetch the PO ID first, or modify the route to use poNumber
      navigate(`/po-details/${consumption.poNumber}`);
    } else {
      showSnackbar("PO Number not found", "error");
    }
  };

  // Delete PO Consumption function
  const handleDeleteConsumption = async (utilizationId) => {
    if (window.confirm("Are you sure you want to delete this PO Consumption?")) {
      try {
        const token = sessionStorage.getItem('token');
        if (!token) {
          throw new Error("Missing authentication credentials");
        }

        await axios.delete(
          `${import.meta.env.VITE_API_URL}/api/po-consumption/delete/${utilizationId}`,
          {
            headers: { Authorization: `${token}` }
          }
        );

        showSnackbar("PO Consumption deleted successfully!", "success");
        fetchConsumptionData(); // Refresh the table
      } catch (error) {
        console.error("Error deleting PO Consumption:", error);
        showSnackbar("Failed to delete PO Consumption", "error");
      }
    }
  };

  const handleEditModalSubmit = async (data) => {
    try {
      showSnackbar("PO Consumption updated successfully!", "success");
      fetchConsumptionData(); // Refresh the table
      setIsEditModalOpen(false);
      setSelectedConsumptionId(null);
    } catch (error) {
      console.error("Error updating PO Consumption:", error);
      showSnackbar("Failed to update PO Consumption", "error");
    }
  };

  // Format currency with dynamic symbol
  const formatCurrency = (amount, currencyCode) => {
    if (!amount) return 'N/A';
    const symbol = getCurrencySymbol(currencyCode);
    return `${symbol}${amount.toLocaleString()}`;
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  // Get utilization type badge color
  const getUtilizationTypeBadge = (type) => {
    const colors = {
      'Fixed': 'bg-blue-100 text-blue-800',
      'T&M': 'bg-green-100 text-green-800',
      'Mixed': 'bg-purple-100 text-purple-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  // AG Grid column definitions
  const columnDefs = useMemo(() => [
    {
      headerName: "#",
      valueGetter: "node.rowIndex + 1",
      width: 60,
      pinned: "left",
      sortable: false,
      filter: false,
      suppressMenu: true,
      cellStyle: { textAlign: 'center' },
      cellRenderer: params => (
        <span title={`Row ${params.value}`} className="cursor-help">
          {params.value}
        </span>
      )
    },
    {
      headerName: "PO Number",
      field: "poNumber",
      valueGetter: params => params.data.poNumber || 'N/A',
      width: 120,
      minWidth: 120,
      sortable: true,
      filter: true,
      cellStyle: { fontWeight: 'bold', color: '#1f2937' },
      cellRenderer: params => {
        const poNumber = params.value;
        const consumption = params.data;
        if (poNumber && poNumber !== 'N/A') {
          return (
            <button
              onClick={() => handlePONumberClick(consumption)}
              className="text-blue-600 hover:text-blue-800 hover:underline font-bold cursor-pointer bg-transparent border-none p-0 text-left truncate block w-full"
              title={`View PO details for ${poNumber}`}
            >
              {truncateWithTooltip(poNumber, 12)}
            </button>
          );
        }
        return <span className="text-gray-500" title={poNumber}>{truncateWithTooltip(poNumber, 12)}</span>;
      }
    },
    {
      headerName: "Milestone",
      field: "milestone.msName",
      valueGetter: params => params.data.milestone?.msName || 'N/A',
      width: 120,
      minWidth: 120,
      filter: true,
      cellRenderer: params => {
        const msName = params.value;
        return (
          <span title={msName} className="cursor-help truncate block w-full">
            {truncateWithTooltip(msName, 15)}
          </span>
        );
      }
    },
    {
      headerName: "Type",
      field: "utilizationType",
      valueGetter: params => params.data.utilizationType || 'N/A',
      width: 80,
      sortable: true,
      filter: true,
      cellRenderer: params => {
        const type = params.value;
        if (type && type !== 'N/A') {
          const badgeClass = getUtilizationTypeBadge(type);
          return (
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${badgeClass} truncate block`}
              title={type}
            >
              {truncateWithTooltip(type, 8)}
            </span>
          );
        }
        return <span className="text-gray-500" title={type}>{truncateWithTooltip(type, 8)}</span>;
      }
    },
    {
      headerName: "Initiative",
      field: "project",
      valueGetter: params => params.data?.project || 'N/A',
      width: 120,
      minWidth: 120,
      sortable: true,
      filter: true,
      cellStyle: { fontWeight: '500' },
      cellRenderer: params => {
        const project = params.value;
        return (
          <span title={project} className="cursor-help truncate block w-full font-medium">
            {truncateWithTooltip(project, 15)}
          </span>
        );
      }
    },
    {
      headerName: "Work Description",
      field: "workDesc",
      valueGetter: params => params.data.workDesc || 'N/A',
      flex: 1,
      minWidth: 180,
      sortable: true,
      filter: true,
      cellRenderer: params => {
        const description = params.value;
        return (
          <span title={description} className="cursor-help truncate block w-full">
            {truncateWithTooltip(description, 35)}
          </span>
        );
      }
    },
    {
      headerName: "Amount",
      field: "amount",
      valueGetter: params => {
        const amount = params.data.amount;
        const currency = params.data.currency;
        if (!amount) return 'N/A';
        const symbol = getCurrencySymbol(currency);
        return `${symbol}${amount.toLocaleString()}`;
      },
      width: 110,
      sortable: true,
      filter: true,
      cellStyle: { fontWeight: 'bold', color: '#059669' },
      cellRenderer: params => {
        const amount = params.value;
        return (
          <span title={amount} className="cursor-help truncate block w-full font-bold text-green-600">
            {truncateWithTooltip(amount, 12)}
          </span>
        );
      }
    },

    {
      headerName: "Assigned",
      field: "workAssignDate",
      valueGetter: params => {
        const dateString = params.data.workAssignDate;
        if (!dateString) return 'N/A';
        const d = new Date(dateString);
        const day = String(d.getDate()).padStart(2, '0');
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthStr = monthNames[d.getMonth()];
        const year = d.getFullYear();
        return `${day}-${monthStr}-${year}`;
      },
      width: 100,
      sortable: true,
      filter: true,
      cellStyle: { color: '#374151', fontSize: '13px' },
      cellRenderer: params => {
        const date = params.value;
        return (
          <span title={date} className="cursor-help truncate block w-full text-gray-700 text-sm">
            {truncateWithTooltip(date, 10)}
          </span>
        );
      }
    },
    {
      headerName: "Completed",
      field: "workCompletionDate",
      valueGetter: params => {
        const dateString = params.data.workCompletionDate;
        if (!dateString) return 'N/A';
        const d = new Date(dateString);
        const day = String(d.getDate()).padStart(2, '0');
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthStr = monthNames[d.getMonth()];
        const year = d.getFullYear();
        return `${day}-${monthStr}-${year}`;
      },
      width: 100,
      sortable: true,
      filter: true,
      cellStyle: { color: '#374151', fontSize: '13px' },
      cellRenderer: params => {
        const date = params.value;
        return (
          <span title={date} className="cursor-help truncate block w-full text-gray-700 text-sm">
            {truncateWithTooltip(date, 10)}
          </span>
        );
      }
    },
    {
      headerName: "Remarks",
      field: "remarks",
      valueGetter: params => params.data.remarks || 'N/A',
      width: 120,
      minWidth: 120,
      sortable: true,
      filter: true,
      cellRenderer: params => {
        const remarks = params.value;
        return (
          <span title={remarks} className="cursor-help truncate block w-full">
            {truncateWithTooltip(remarks, 15)}
          </span>
        );
      }
    },
    {
      headerName: "System",
      field: "systemName",
      valueGetter: params => params.data.systemName || 'N/A',
      width: 90,
      sortable: true,
      filter: true,
      cellStyle: { color: '#6b7280', fontSize: '13px' },
      cellRenderer: params => {
        const system = params.value;
        return (
          <span title={system} className="cursor-help truncate block w-full text-gray-500 text-sm">
            {truncateWithTooltip(system, 10)}
          </span>
        );
      }
    },
    {
      headerName: "Actions",
      field: "actions",
      width: 120,
      sortable: false,
      filter: false,
      suppressMenu: true,
      cellRenderer: params => {
        const consumption = params.data;
        return (
          <div className="flex gap-2">
            {/* View Button */}
            <button
              onClick={() => handleViewConsumption(consumption)}
              className="p-1 rounded hover:bg-green-100 text-green-600 cursor-pointer"
              title="View Details"
            >
              <Eye size={16} />
            </button>
            {/* Edit Button */}
            {hasAccess('budget', 'edit') && (
              <button
                onClick={() => handleEditConsumption(consumption)}
                className="p-1 rounded hover:bg-blue-100 text-blue-600 cursor-pointer"
                title="Edit Consumption"
              >
                <Edit size={16} />
              </button>
            )}
            {/* Delete Button */}
            {hasAccess('budget', 'delete') && (
              <button
                onClick={() => handleDeleteConsumption(consumption.utilizationId)}
                className="p-1 rounded hover:bg-red-100 text-red-600 cursor-pointer"
                title="Delete Consumption"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        );
      }
    }
  ], [hasAccess]);

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
      {/* PO Consumption Grid */}
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
            /* Custom truncate styles */
            .truncate {
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }
            /* Tooltip hover effects */
            .cursor-help:hover {
              background-color: rgba(59, 130, 246, 0.05);
              border-radius: 2px;
              transition: background-color 0.2s ease;
            }
          `}</style>
          <AgGridReact
            columnDefs={columnDefs}
            rowData={filteredConsumptionData}
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
                  <Activity size={48} className="mx-auto mb-2 text-gray-300" />
                  <p className="text-lg font-medium">No PO Consumptions found</p>
                  <p className="text-sm">Try adjusting your search or add a new PO Consumption</p>
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

      {/* View Details Modal */}
      <ViewDetailsModal
        open={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedConsumption(null);
        }}
        consumption={selectedConsumption}
      />

      {/* Add PO Consumption Modal */}
      {hasAccess('budget', 'edit') && (
        <AddPOConsumptionModal
          open={isAddModalOpen}
          onClose={() => { fetchConsumptionData(); setIsAddModalOpen(false) }}
        />
      )}

      {/* Edit PO Consumption Modal */}
      {hasAccess('budget', 'edit') && (
        <EditPOConsumptionModal
          open={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedConsumptionId(null);
          }}
          onSubmit={handleEditModalSubmit}
          utilizationId={selectedConsumptionId}
        />
      )}

      {/* Global Snackbar */}
      <GlobalSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={handleSnackbarClose}
      />
    </div>
  );
});

export default POConsumptionManagement;