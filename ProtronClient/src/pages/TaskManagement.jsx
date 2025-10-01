import React, { useState, useEffect, useCallback, forwardRef, useImperativeHandle, useMemo } from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import {
  FileText,
  Plus,
  Search,
  Edit,
  Download,
  Loader2,
  Eye,
  Trash2
} from "lucide-react";
import { useAccess } from "../Context/AccessContext";
import GlobalSnackbar from "../components/GlobalSnackbar";
import AddTaskModal from "../components/AddTaskModal";
import EditTaskModal from "../components/EditTaskModal";
import ViewTaskModal from "../components/ViewTaskModal";

const TaskManagement = forwardRef(({ searchQuery, setSearchQuery }, ref) => {
  const { hasAccess } = useAccess();
  
  // State management
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [, setError] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [parentStory, setParentStory] = useState(null);

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    downloadTaskExcel,
    handleAddTask: () => setIsAddModalOpen(true),
    fetchTasks
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

  const fetchTasks = useCallback(async (parentId) => {
    if (!parentId) return;
    
    try {
      setLoading(true);
      setError(null);
      const token = sessionStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/tasks/tasks/${parentId}`, {
        headers: { Authorization: token }
      });
      
      if (response.ok) {
        const data = await response.json();
        setTasks(data);
      } else {
        throw new Error('Failed to fetch tasks');
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setError(error.message);
      showSnackbar('Failed to fetch tasks', 'error');
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
        fetchTasks(parsed.usId);
      } catch (error) {
        console.error('Error parsing parent story data:', error);
        showSnackbar('Invalid parent story data', 'error');
      }
    }
  }, [fetchTasks, showSnackbar]);

  // Custom loading overlay component
  const LoadingOverlay = () => (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-purple-600" />
        <p className="mt-2 text-sm text-gray-600">Loading tasks...</p>
      </div>
    </div>
  );

  const downloadTaskExcel = () => {
    // TODO: Implement Excel download functionality
    showSnackbar('Excel download functionality coming soon', 'info');
  };

  const handleEdit = useCallback((task) => {
    setSelectedTask(task);
    setSelectedTaskId(task.taskId);
    setIsEditModalOpen(true);
  }, []);

  const handleView = useCallback((task) => {
    setSelectedTask(task);
    setIsViewModalOpen(true);
  }, []);

  const handleDelete = useCallback(async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;

    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/task/${taskId}`, {
        method: 'DELETE',
        headers: { Authorization: token }
      });

      if (response.ok) {
        showSnackbar('Task deleted successfully!', 'success');
        fetchTasks(parentStory?.usId);
      } else {
        showSnackbar('Failed to delete Task', 'error');
      }
    } catch (error) {
      console.error('Error deleting Task:', error);
      showSnackbar('Failed to delete Task', 'error');
    }
  }, [showSnackbar, fetchTasks, parentStory?.usId]);

  const ActionsRenderer = useCallback((params) => {
    const task = params.data;
    
    return (
      <div className="flex items-center space-x-2">
        <button
          onClick={() => handleView(task)}
          className="text-gray-400 hover:text-blue-600 transition-colors duration-200 p-1 cursor-pointer"
          title="View Task"
        >
          <Eye size={16} />
        </button>
      
          <button
            onClick={() => handleEdit(task)}
            className="text-gray-400 hover:text-green-600 transition-colors duration-200 p-1 cursor-pointer"
            title="Edit Task"
          >
            <Edit size={16} />
          </button>
       
       
          <button
            onClick={() => handleDelete(task.taskId)}
            className="text-gray-400 hover:text-red-600 transition-colors duration-200 p-1 cursor-pointer"
            title="Delete Task"
          >
            <Trash2 size={16} />
          </button>
        
      </div>
    );
  }, [hasAccess, handleView, handleEdit, handleDelete]);

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
      headerName: "Task ID",
      field: "taskId",
      valueGetter: params => params.data.taskId || 'N/A',
      flex: 1,
      minWidth: 120,
      sortable: true,
      filter: true,
      cellStyle: { fontWeight: 'bold', color: '#1f2937' }
    },
    {
      headerName: "Task Topic",
      field: "taskTopic",
      valueGetter: params => params.data.taskTopic || 'N/A',
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
      headerName: "Task Type",
      field: "taskType",
      valueGetter: params => params.data.taskType || 'N/A',
      width: 120,
      sortable: true,
      filter: true,
      cellRenderer: params => {
        const type = params.value;
        const typeColors = {
          'development': 'bg-blue-100 text-blue-800',
          'testing': 'bg-green-100 text-green-800',
          'design': 'bg-purple-100 text-purple-800',
          'documentation': 'bg-yellow-100 text-yellow-800',
          'review': 'bg-orange-100 text-orange-800',
          'meeting': 'bg-pink-100 text-pink-800',
          'other': 'bg-gray-100 text-gray-800'
        };
        const colorClass = typeColors[type] || 'bg-gray-100 text-gray-800';
        return (
          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${colorClass}`}>
            {type}
          </span>
        );
      }
    },
    {
      headerName: "Date",
      field: "date",
      valueGetter: params => params.data.date || 'N/A',
      width: 120,
      sortable: true,
      filter: true,
      cellStyle: { textAlign: 'center' }
    },
    {
      headerName: "Est. Time",
      field: "estTime",
      valueGetter: params => params.data.estTime || 'N/A',
      width: 100,
      sortable: true,
      filter: true,
      cellStyle: { textAlign: 'center' }
    },
    {
      headerName: "Time Spent",
      field: "timeSpentHours",
      valueGetter: params => {
        const hours = params.data.timeSpentHours || 0;
        const minutes = params.data.timeSpentMinutes || 0;
        if (hours === 0 && minutes === 0) return 'N/A';
        return `${hours}h ${minutes}m`;
      },
      width: 120,
      sortable: true,
      filter: true,
      cellStyle: { textAlign: 'center' }
    },
    {
      headerName: "Time Remaining",
      field: "timeRemainingHours",
      valueGetter: params => {
        const hours = params.data.timeRemainingHours || 0;
        const minutes = params.data.timeRemainingMinutes || 0;
        if (hours === 0 && minutes === 0) return 'N/A';
        return `${hours}h ${minutes}m`;
      },
      width: 140,
      sortable: true,
      filter: true,
      cellStyle: { textAlign: 'center' }
    },
    {
      headerName: "Actions",
      cellRenderer: ActionsRenderer,
      width: 120,
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
  };

  // Filter data based on search query
  const filteredTasks = useMemo(() => {
    if (!searchQuery) return tasks;
    
    const query = searchQuery.toLowerCase();
    return tasks.filter(task => 
      task.taskId?.toLowerCase().includes(query) ||
      task.taskTopic?.toLowerCase().includes(query) ||
      task.taskType?.toLowerCase().includes(query) ||
      task.taskDescription?.toLowerCase().includes(query)
    );
  }, [tasks, searchQuery]);

  return (
    <div className="w-full p-6 bg-white">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Task Management</h2>
          {parentStory && (
            <p className="text-sm text-gray-600 mt-1">
              Parent Story: {parentStory.summary} ({parentStory.usId})
            </p>
          )}
        </div>
        <div className="flex items-center space-x-3">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <button
            onClick={downloadTaskExcel}
            className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            <Download size={16} className="mr-2" />
            Download Excel
          </button>
         
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              <Plus size={16} className="mr-2" />
              Add Task
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
             rowData={filteredTasks}
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
                   <p className="text-lg font-medium">No tasks found</p>
                   <p className="text-sm">Try adjusting your search or add a new task</p>
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
    
        <AddTaskModal
          open={isAddModalOpen}
          onClose={() => {
            fetchTasks(parentStory?.usId);
            setIsAddModalOpen(false);
          }}
          parentStory={parentStory}
        />
    

     
        <EditTaskModal
          open={isEditModalOpen}
          onClose={() => {
            fetchTasks(parentStory?.usId);
            setIsEditModalOpen(false);
          }}
          taskId={selectedTaskId}
          taskData={selectedTask}
        />
     

      <ViewTaskModal
        open={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        taskData={selectedTask}
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

export default TaskManagement;
