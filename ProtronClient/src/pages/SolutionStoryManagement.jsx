import React, { useState, useEffect, useCallback, forwardRef, useImperativeHandle, useMemo } from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { FiFileText, FiCheckSquare, FiSearch, FiGitBranch, FiDownload, FiLoader, FiEye, FiTrash2, FiEdit2 } from 'react-icons/fi';
import { Copy } from 'lucide-react';
import GlobalSnackbar from "../components/GlobalSnackbar";
import AddSolutionStoryModal from "../components/AddSolutionStoryModal";
import AddTaskModal from "../components/AddTaskModal";
import EditSolutionStoryModal from "../components/EditSolutionStoryModal";
import ViewSolutionStoryModal from "../components/ViewSolutionStoryModal";

const SolutionStoryManagement = forwardRef(({ searchQuery, setSearchQuery }, ref) => {

  // State management
  const [solutionStories, setSolutionStories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [, setError] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedStoryId, setSelectedStoryId] = useState(null);
  const [selectedStory, setSelectedStory] = useState(null);
  const [parentStory, setParentStory] = useState(null);
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [addTaskParentStory, setAddTaskParentStory] = useState(null);
  const [duplicatingSolutionStory, setDuplicatingSolutionStory] = useState(null);

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    downloadSolutionStoryExcel,
    handleAddSolutionStory: () => setIsAddModalOpen(true),
    fetchSolutionStories
  }));

  // Global snackbar state
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info"
  });

  const showSnackbar = useCallback((message, severity = "info") => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  }, []);

  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const fetchSolutionStories = useCallback(async (parentId) => {
    if (!parentId) return;

    try {
      setLoading(true);
      setError(null);
      const token = sessionStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/solutionstory/solution-stories/${parentId}`, {
        headers: { Authorization: token }
      });

      if (response.ok) {
        const data = await response.json();
        // Sort by ID in descending order (newest first) or by ssId if available
        const sortedData = Array.isArray(data) ? [...data].sort((a, b) => {
          // Try to sort by numeric ID first
          if (a.id && b.id) {
            return b.id - a.id; // Descending order (newest first)
          }
          // Fallback to ssId string comparison (SS-123 format)
          if (a.ssId && b.ssId) {
            return b.ssId.localeCompare(a.ssId);
          }
          return 0;
        }) : data;
        setSolutionStories(sortedData);
      } else {
        throw new Error('Failed to fetch solution stories');
      }
    } catch (error) {
      console.error('Error fetching solution stories:', error);
      setError(error.message);
      showSnackbar('Failed to fetch solution stories', 'error');
    } finally {
      setLoading(false);
    }
  }, [showSnackbar]);

  useEffect(() => {
    // Get parent story info from URL params
    const urlParams = new URLSearchParams(window.location.search);
    const parentStoryData = urlParams.get('parentStory');

    if (parentStoryData) {
      try {
        const parsed = JSON.parse(decodeURIComponent(parentStoryData));
        setParentStory(parsed);
        fetchSolutionStories(parsed.usId);
      } catch (error) {
        console.error('Error parsing parent story data:', error);
        showSnackbar('Invalid parent story data', 'error');
      }
    }
  }, [fetchSolutionStories, showSnackbar]);


  // Custom loading overlay component
  const LoadingOverlay = () => (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <FiLoader className="mx-auto h-8 w-8 animate-spin text-blue-600" />
        <p className="mt-2 text-sm text-gray-600">Loading solution stories...</p>
      </div>
    </div>
  );

  // Generic AG Grid cell renderer that attaches a native title tooltip for full-cell hover
  const CellWithTitle = (params) => {
    const value = params.valueFormatted ?? params.value ?? '';
    return (
      <div title={value !== undefined && value !== null ? String(value) : ''} className="truncate max-w-full overflow-hidden whitespace-nowrap">
        {value}
      </div>
    );
  };

  const downloadSolutionStoryExcel = () => {
    // TODO: Implement Excel download functionality
    showSnackbar('Excel download functionality coming soon', 'info');
  };

  const handleEdit = useCallback((story) => {
    setSelectedStory(story);
    setSelectedStoryId(story.ssId);
    setIsEditModalOpen(true);
  }, []);

  const handleView = useCallback((story) => {
    setSelectedStory(story);
    setIsViewModalOpen(true);
  }, []);

  const handleAddTask = useCallback((story) => {
    setAddTaskParentStory(story);
    setIsAddTaskModalOpen(true);
  }, []);

  const handleDelete = useCallback(async (ssId) => {
    if (!window.confirm('Are you sure you want to delete this solution story?')) return;

    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/solutionstory/${ssId}`, {
        method: 'DELETE',
        headers: { Authorization: token }
      });

      if (response.ok) {
        showSnackbar('Solution Story deleted successfully!', 'success');
        fetchSolutionStories(parentStory?.usId);
      } else {
        showSnackbar('Failed to delete Solution Story', 'error');
      }
    } catch (error) {
      console.error('Error deleting Solution Story:', error);
      showSnackbar('Failed to delete Solution Story', 'error');
    }
  }, [showSnackbar, fetchSolutionStories, parentStory?.usId]);

  const handleDuplicate = useCallback((story) => {
    // Prepare duplicate data: copy all fields except id
    // Preserve the parent user story ID (usId) from the original parentStory if available
    const duplicateData = {
      ...story,
      _isDuplicate: true,
      _originalSsId: story.ssId, // Keep original for reference
      // Preserve parent user story ID - use parentStory.usId if available (from SolutionStoryManagement context)
      // or use story.parentId if it's a US- ID, otherwise use parentStory state
      parentId: parentStory?.usId || (story.parentId && story.parentId.startsWith('US-') ? story.parentId : null) || '',
      usId: parentStory?.usId || (story.parentId && story.parentId.startsWith('US-') ? story.parentId : null) || null
    };
    // Don't delete ssId - we'll use _isDuplicate flag to detect
    delete duplicateData.id;
    setDuplicatingSolutionStory(duplicateData);
    setIsAddModalOpen(true);
  }, [parentStory]);

  const ActionsRenderer = useCallback((params) => {
    const story = params.data;

    return (
      <div className="flex items-center space-x-2">
        <button
          onClick={() => handleView(story)}
          className="text-gray-400 hover:text-blue-600 transition-colors duration-200 p-1 cursor-pointer"
          title="View Solution Story"
        >
          <FiEye size={16} />
        </button>

        <button
          onClick={() => handleEdit(story)}
          className="text-gray-400 hover:text-green-600 transition-colors duration-200 p-1 cursor-pointer"
          title="Edit Solution Story"
        >
          <FiEdit2 size={16} />
        </button>

        <button
          onClick={() => handleDuplicate(story)}
          className="text-gray-400 hover:text-purple-600 transition-colors duration-200 p-1 cursor-pointer"
          title="Copy Solution Story"
        >
          <Copy size={16} />
        </button>

        <button
          onClick={() => handleAddTask(story)}
          className="text-gray-400 hover:text-purple-600 transition-colors duration-200 p-1 cursor-pointer"
          title="Add Task"
        >
          <FiCheckSquare size={16} />
        </button>



      </div>
    );
  }, [handleView, handleEdit, handleDelete, handleAddTask, handleDuplicate]);

  const columnDefs = [
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
      headerName: "SS ID",
      field: "ssId",
      valueGetter: params => params.data.ssId || 'N/A',
      flex: 1,
      minWidth: 120,
      sortable: true,
      filter: true,
      cellStyle: { fontWeight: 'bold', color: '#1f2937' }
    },
    {
      headerName: "Summary",
      field: "summary",
      valueGetter: params => params.data.summary || 'N/A',
      flex: 1,
      minWidth: 200,
      sortable: true,
      filter: true,
      cellStyle: { fontWeight: '500' },
      cellRenderer: params => (
        <div className="truncate max-w-full overflow-hidden whitespace-nowrap" title={params.value}>
          {params.value}
        </div>
      )
    },
    {
      headerName: "Status",
      field: "status",
      valueGetter: params => params.data.status || 'N/A',
      width: 120,
      sortable: true,
      filter: true,
      cellRenderer: params => {
        const status = params.value;
        const statusColors = {
          'todo': 'bg-gray-100 text-gray-800',
          'in-progress': 'bg-blue-100 text-blue-800',
          'completed': 'bg-green-100 text-green-800',
          'blocked': 'bg-red-100 text-red-800'
        };
        const colorClass = statusColors[status] || 'bg-gray-100 text-gray-800';
        return (
          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${colorClass}`}>
            {status}
          </span>
        );
      }
    },
    {
      headerName: "Priority",
      field: "priority",
      valueGetter: params => params.data.priority || 'N/A',
      width: 100,
      sortable: true,
      filter: true,
      cellRenderer: params => {
        const priority = params.value;
        const priorityColors = {
          1: 'bg-red-100 text-red-800',
          2: 'bg-yellow-100 text-yellow-800',
          3: 'bg-green-100 text-green-800'
        };
        const priorityText = {
          1: 'High',
          2: 'Medium',
          3: 'Low'
        };
        const colorClass = priorityColors[priority] || 'bg-gray-100 text-gray-800';
        return (
          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${colorClass}`}>
            {priorityText[priority] || priority}
          </span>
        );
      }
    },
    {
      headerName: "Story Points",
      field: "storyPoints",
      valueGetter: params => params.data.storyPoints || 'N/A',
      width: 100,
      sortable: true,
      filter: true,
      cellStyle: { textAlign: 'center' }
    },
    {
      headerName: "Assignee",
      field: "assignee",
      valueGetter: params => params.data.assignee || 'N/A',
      flex: 1,
      minWidth: 120,
      maxWidth: 150,
      sortable: true,
      filter: true,
      cellRenderer: params => (
        <div className="truncate max-w-full overflow-hidden whitespace-nowrap" title={params.value}>
          {params.value}
        </div>
      )
    },
    {
      headerName: "System",
      field: "system",
      valueGetter: params => params.data.system || 'N/A',
      flex: 1,
      minWidth: 120,
      maxWidth: 150,
      sortable: true,
      filter: true,
      cellRenderer: params => (
        <div className="truncate max-w-full overflow-hidden whitespace-nowrap" title={params.value}>
          {params.value}
        </div>
      )
    },
    {
      headerName: "Actions",
      cellRenderer: ActionsRenderer,
      width: 150,
      suppressMenu: true,
      sortable: false,
      filter: false,
      pinned: 'right'
    }
  ];

  const defaultColDef = {
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
    cellRenderer: CellWithTitle,
  };

  // Filter data based on search query
  const filteredSolutionStories = useMemo(() => {
    if (!searchQuery) return solutionStories;

    const query = searchQuery.toLowerCase();
    return solutionStories.filter(story =>
      story.ssId?.toLowerCase().includes(query) ||
      story.summary?.toLowerCase().includes(query) ||
      story.status?.toLowerCase().includes(query) ||
      story.assignee?.toLowerCase().includes(query) ||
      story.system?.toLowerCase().includes(query)
    );
  }, [solutionStories, searchQuery]);

  return (
    <div className="w-full p-6 bg-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold text-gray-900">Solution Story Management</h2>
          {parentStory && (
            <p className="text-xs sm:text-sm text-gray-600 mt-1 break-words overflow-wrap-anywhere whitespace-pre-wrap">
              Parent Story: {parentStory.summary}
            </p>
          )}
        </div>
        <div className="flex items-center space-x-3">
          {/* Search Bar */}
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search solution stories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={downloadSolutionStoryExcel}
            className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            <FiDownload size={16} className="mr-2" />
            Download Excel
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            <FiGitBranch size={16} className="mr-2" />
            Add Solution Story
          </button>

        </div>
      </div>

      {/* AG Grid */}
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
            rowData={filteredSolutionStories}
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
                  <FiFileText size={48} className="mx-auto mb-2 text-gray-300" />
                  <p className="text-lg font-medium">No solution stories found</p>
                  <p className="text-sm">Try adjusting your search or add a new solution story</p>
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

      {/* Modals */}

      <AddSolutionStoryModal
        open={isAddModalOpen}
        onClose={() => {
          setDuplicatingSolutionStory(null);
          fetchSolutionStories(parentStory?.usId);
          setIsAddModalOpen(false);
        }}
        parentStory={duplicatingSolutionStory ? {
          ...duplicatingSolutionStory,
          // Preserve the original parent user story info for display
          // If we have parentStory state, use its usId and summary for the parent context
          usId: parentStory?.usId || duplicatingSolutionStory.usId || duplicatingSolutionStory.parentId,
          summary: parentStory?.summary || duplicatingSolutionStory.summary
        } : parentStory}
      />



      <EditSolutionStoryModal
        open={isEditModalOpen}
        onClose={() => {
          fetchSolutionStories(parentStory?.usId);
          setIsEditModalOpen(false);
        }}
        storyId={selectedStoryId}
        storyData={selectedStory}
      />

      <AddTaskModal
        open={isAddTaskModalOpen}
        onClose={() => {
          // Close modal and refresh solution stories for the current parent user story
          setIsAddTaskModalOpen(false);
          setAddTaskParentStory(null);
          fetchSolutionStories(parentStory?.usId);
        }}
        parentStory={addTaskParentStory || parentStory}
      />


      <ViewSolutionStoryModal
        open={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        storyData={selectedStory}
        onEdit={handleEdit}
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
});

export default SolutionStoryManagement;
