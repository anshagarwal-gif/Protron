import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Download,
  Menu,
  X
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

const TimesheetManager = () => {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [showWeekend, setShowWeekend] = useState(false);
  const [timesheetData, setTimesheetData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [gridApi, setGridApi] = useState(null);

  const API_BASE_URL = import.meta.env.VITE_API_URL;

  // Custom AG Grid theme styles
  const gridStyle = {
    '--ag-header-background-color': '#15803d',
    '--ag-header-foreground-color': '#ffffff',
    '--ag-border-color': '#e5e7eb',
    '--ag-row-hover-color': '#f0fdf4',
    '--ag-selected-row-background-color': '#dcfce7',
    '--ag-odd-row-background-color': '#f9fafb',
    '--ag-even-row-background-color': '#ffffff',
    '--ag-font-family': 'inherit',
    '--ag-font-size': '14px',
    '--ag-row-height': '60px',
    '--ag-header-height': '50px',
    '--ag-header-column-resize-handle-color': '#ffffff',
    '--ag-header-column-separator-color': '#ffffff',
    '--ag-header-cell-hover-background-color': '#166534',
    '--ag-header-cell-moving-background-color': '#166534',
    '--ag-header-column-filter-icon-color': '#ffffff',
    '--ag-header-column-menu-button-color': '#ffffff',
    '--ag-header-column-menu-button-hover-color': '#f3f4f6',
  };

  // Get week start (Monday) and end (Sunday)
  const getWeekDates = (date) => {
    const start = new Date(date);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1);
    start.setDate(diff);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    return { start, end };
  };

  const { start: weekStart, end: weekEnd } = getWeekDates(currentWeek);

  // Format date for display
  const formatDate = (date) => {
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short'
    });
  };

  // Get weekdays based on showWeekend toggle
  const getWeekdays = () => {
    const days = [];
    const current = new Date(weekStart);
    const totalDays = showWeekend ? 7 : 5;
    
    for (let i = 0; i < totalDays; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return days;
  };

  // Name cell renderer with avatar
  const NameCellRenderer = (params) => {
    const { data } = params;
    return (
      <div className="flex items-center">
        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-600 mr-3">
          {data.avatar}
        </div>
        <div className="flex flex-col">
          <Link 
            to="/individual-timesheet" 
            state={{ employee: data }}
            className="text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            {data.name}
          </Link>
          <span className="text-xs text-gray-500">{data.email}</span>
        </div>
      </div>
    );
  };

  // Day cell renderer with hours
  const DayCellRenderer = (params) => {
    const { value } = params;
    if (!value) return <span className="text-sm text-gray-400">0H/8H</span>;

    const getCellColor = (dayData) => {
      const worked = dayData.worked;
      const expected = dayData.expected;

      if (worked === 0) return 'text-red-600';
      if (worked >= expected) return 'text-green-600';
      return 'text-yellow-600';
    };

    return (
      <span className={`text-sm font-medium ${getCellColor(value)}`}>
        {value.display}
      </span>
    );
  };

  // Total hours cell renderer
  const TotalCellRenderer = (params) => {
    const { data } = params;
    const getTotalColor = (total, expected) => {
      if (total === 0) return 'text-red-600';
      if (total >= expected) return 'text-green-600';
      return 'text-yellow-600';
    };

    return (
      <span className={`text-sm font-bold ${getTotalColor(data.totalHours, data.expectedHours)}`}>
        {data.totalHours}H/{data.expectedHours}H
      </span>
    );
  };

  // Actions cell renderer
  const ActionsCellRenderer = (params) => {
    const { data } = params;
    return (
      <Link 
        to="/individual-timesheet" 
        state={{ employee: data }}
        className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-800"
      >
        <span className="hidden xl:inline">View Details</span>
        <ChevronRight className="w-4 h-4" />
      </Link>
    );
  };

  // AG Grid column definitions
  const columnDefs = useMemo(() => {
    const weekdays = getWeekdays();
    
    const dayColumns = weekdays.map((day, index) => ({
      headerName: day.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' }),
      field: `day${index}`,
      cellRenderer: DayCellRenderer,
      valueGetter: (params) => params.data.dailyHours?.[index],
      sortable: false,
      filter: false,
      resizable: true,
      width: 120,
      suppressMenu: true,
    }));

    return [
      {
        headerName: "#",
        valueGetter: (params) => params.node.rowIndex + 1,
        sortable: false,
        filter: false,
        resizable: false,
        width: 60,
        suppressMenu: true,
        pinned: 'left',
      },
      {
        headerName: "Name",
        field: "name",
        cellRenderer: NameCellRenderer,
        sortable: true,
        filter: true,
        resizable: true,
        width: 250,
        pinned: 'left',
      },
      ...dayColumns,
      {
        headerName: "Total",
        field: "totalHours",
        cellRenderer: TotalCellRenderer,
        sortable: true,
        filter: false,
        resizable: true,
        width: 130,
        pinned: 'right',
      },
      {
        headerName: "Actions",
        field: "actions",
        cellRenderer: ActionsCellRenderer,
        sortable: false,
        filter: false,
        resizable: false,
        width: 120,
        suppressMenu: true,
        pinned: 'right',
      }
    ];
  }, [showWeekend, currentWeek]);

  // AG Grid default column definition
  const defaultColDef = useMemo(() => ({
    sortable: true,
    filter: true,
    resizable: true,
    minWidth: 100,
    floatingFilter: false,
    filterParams: {
      buttons: ['reset', 'apply'],
      closeOnApply: true,
      debounceMs: 200,
      suppressAndOrCondition: false,
      filterOptions: ['contains', 'notContains', 'startsWith', 'endsWith', 'equals', 'notEqual'],
      defaultOption: 'contains',
      caseSensitive: false,
    },
    suppressMenu: false,
    menuTabs: ['filterMenuTab'],
  }), []);

  // Grid options
  const gridOptions = useMemo(() => ({
    pagination: true,
    paginationPageSize: 10,
    paginationPageSizeSelector: [10, 20, 50, 100],
    suppressCellFocus: true,
    rowHeight: 60,
    headerHeight: 50,
    animateRows: true,
    suppressRowClickSelection: true,
    getRowStyle: (params) => {
      if (params.node.rowIndex % 2 === 0) {
        return { background: '#ffffff' };
      } else {
        return { background: '#f9fafb' };
      }
    },
  }), []);

  // Grid ready callback
  const onGridReady = useCallback((params) => {
    setGridApi(params.api);
    params.api.sizeColumnsToFit();
  }, []);

  // Fetch timesheet data
  const fetchTimesheetData = async () => {
    setLoading(true);
    try {
      const startParam = weekStart.toISOString().split('T')[0];
      const endParam = weekEnd.toISOString().split('T')[0];

      console.log('Fetching timesheet data for:', { startParam, endParam, showWeekend });

      const response = await fetch(`${API_BASE_URL}/api/timesheet-tasks/admin/summary?start=${startParam}&end=${endParam}`, {
        headers: {
          Authorization: `${sessionStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('API Response:', data);

      // Transform data to match UI structure
      const transformedData = data.map((user, index) => {
        const currentWeekdays = getWeekdays();

        const dailyHours = currentWeekdays.map(day => {
          const dayKey = day.toISOString().split('T')[0];
          const hoursWorked = user.dailyHours?.[dayKey] || 0;
          const workedRounded = Math.round((parseFloat(hoursWorked) || 0) * 100) / 100;
          const expectedDaily = 8;
          return {
            worked: workedRounded,
            expected: expectedDaily,
            display: `${workedRounded}H/${expectedDaily}H`
          };
        });

        const totalWorkedHours = dailyHours.reduce((sum, day) => sum + day.worked, 0);
        const totalExpectedHours = dailyHours.length * 8;

        return {
          id: user.userId || index + 1,
          name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || `User ${index + 1}`,
          email: user.email,
          avatar: user.name ? user.name.charAt(0).toUpperCase() : (user.email ? user.email.charAt(0).toUpperCase() : 'U'),
          dailyHours: dailyHours,
          totalHours: Math.round(totalWorkedHours * 100) / 100,
          expectedHours: totalExpectedHours,
          rawData: user
        };
      });

      setTimesheetData(transformedData);
    } catch (error) {
      console.error('Error fetching timesheet data:', error);

      if (error.message.includes('401')) {
        alert('Authentication failed. Please log in again.');
      } else if (error.message.includes('403')) {
        alert('Access denied. You do not have permission to view timesheet data.');
      } else if (error.message.includes('500')) {
        alert('Server error. Please try again later.');
      } else if (error.name === 'TypeError') {
        alert('Network error. Please check your connection and try again.');
      } else {
        alert('Failed to load timesheet data. Please try again.');
      }

      setTimesheetData([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTimesheetData();
  }, [currentWeek, showWeekend]);

  // Close date picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDatePicker && !event.target.closest('.relative')) {
        setShowDatePicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDatePicker]);

  // Navigation functions
  const goToPreviousWeek = () => {
    const newDate = new Date(currentWeek);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentWeek(newDate);
  };

  const goToNextWeek = () => {
    const newDate = new Date(currentWeek);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentWeek(newDate);
  };

  // Handle date selection from calendar
  const handleDateSelect = (selectedDate) => {
    setCurrentWeek(new Date(selectedDate));
    setShowDatePicker(false);
  };

  // Get today's date for calendar
  const today = new Date().toISOString().split('T')[0];

  // Frontend-only Excel download functionality
  const downloadExcel = () => {
    const weekdays = getWeekdays();
    try {
      const startParam = weekStart.toISOString().split('T')[0];
      const endParam = weekEnd.toISOString().split('T')[0];

      const headers = [
        'Employee ID',
        'Name',
        'Email',
        ...weekdays.map(day =>
          day.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' })
        ),
        'Total Hours',
        'Expected Hours'
      ];

      const csvContent = [
        headers.join(','),
        ...timesheetData.map((emp, index) => [
          index + 1,
          `"${emp.name}"`,
          emp.email,
          ...emp.dailyHours.map(h => Math.round(h.worked * 100) / 100),
          emp.totalHours,
          emp.expectedHours
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `timesheet_${startParam}_to_${endParam}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error creating Excel file:', error);
      alert('Failed to create Excel file. Please try again.');
    }
  };

  // Loading component
  const LoadingSpinner = () => (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div>
      <p className="ml-4 text-gray-600 text-lg">Loading timesheet data...</p>
    </div>
  );

  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-semibold text-gray-900">Manage Timesheet</h1>
            </div>
          </div>
          <div className="hidden sm:block text-sm text-gray-600">User</div>
          <button
            className="sm:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Admin Timesheet View Header */}
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Admin Timesheet View</h2>

          <div className={`${mobileMenuOpen ? 'block' : 'hidden'} sm:block`}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
                {/* Week Navigation */}
                <div className="flex items-center space-x-2 relative">
                  <button
                    onClick={goToPreviousWeek}
                    className="p-2 hover:bg-gray-100 rounded"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm font-medium whitespace-nowrap">
                    {formatDate(weekStart)} - {formatDate(weekEnd)}
                  </span>
                  <button
                    onClick={goToNextWeek}
                    className="p-2 hover:bg-gray-100 rounded"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setShowDatePicker(!showDatePicker)}
                    className="p-2 hover:bg-gray-100 rounded"
                    title="Select date"
                  >
                    <Calendar className="w-4 h-4 text-gray-400" />
                  </button>

                  {/* Date Picker Dropdown */}
                  {showDatePicker && (
                    <div className="absolute top-12 left-0 z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-4">
                      <div className="mb-2">
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Select a date (week will be calculated automatically)
                        </label>
                        <input
                          type="date"
                          value={currentWeek.toISOString().split('T')[0]}
                          onChange={(e) => handleDateSelect(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="flex justify-between items-center">
                        <button
                          onClick={() => handleDateSelect(today)}
                          className="text-xs text-blue-600 hover:text-blue-800"
                        >
                          Go to Today
                        </button>
                        <button
                          onClick={() => setShowDatePicker(false)}
                          className="text-xs text-gray-500 hover:text-gray-700"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
                {/* Show Weekend Toggle */}
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={showWeekend}
                    onChange={(e) => {
                      console.log('Weekend toggle changed:', e.target.checked);
                      setShowWeekend(e.target.checked);
                    }}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700">Show Weekend</span>
                </label>

                {/* Download Excel Button */}
                <button
                  onClick={downloadExcel}
                  className="flex items-center justify-center space-x-2 px-3 py-2 bg-green-700 text-white text-sm rounded hover:bg-green-900 w-full sm:w-auto"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Excel</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <LoadingSpinner />
        ) : (
          /* AG Grid Table */
          <div className="ag-theme-alpine" style={{ height: '600px', width: '100%', ...gridStyle }}>
            <style>{`
              .ag-theme-alpine {
                --ag-header-background-color: #15803d !important;
                --ag-header-foreground-color: #ffffff !important;
              }
              
              .ag-theme-alpine .ag-header {
                background-color: #15803d !important;
                border-bottom: 2px solid #166534 !important;
              }
              
              .ag-theme-alpine .ag-header-cell {
                background-color: #15803d !important;
                color: #ffffff !important;
                border-right: 1px solid rgba(255, 255, 255, 0.2) !important;
                font-weight: 600 !important;
              }
              
              .ag-theme-alpine .ag-header-cell:hover {
                background-color: #166534 !important;
              }
              
              .ag-theme-alpine .ag-header-cell-text {
                color: #ffffff !important;
                font-weight: 500;
              }
              
              .ag-theme-alpine .ag-header-cell-label {
                color: #ffffff !important;
              }
              
              .ag-theme-alpine .ag-header-cell-sortable .ag-header-cell-label {
                cursor: pointer;
              }
              
              .ag-theme-alpine .ag-header-cell-sortable .ag-header-cell-label:hover {
                color: #f3f4f6 !important;
              }
              
              .ag-theme-alpine .ag-menu {
                box-shadow: 0 10px 25px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
                border-radius: 8px;
                border: 1px solid #e5e7eb;
                overflow: hidden;
              }
              
              .ag-theme-alpine .ag-header-cell .ag-header-cell-label {
                justify-content: flex-start;
              }
              
              .ag-theme-alpine .ag-cell {
                display: flex;
                align-items: center;
                justify-content: flex-start;
                text-align: left;
              }
              
              .ag-theme-alpine .ag-header-cell-menu-button {
                color: #ffffff !important;
                opacity: 0.8;
              }
              
              .ag-theme-alpine .ag-header-cell-menu-button:hover {
                opacity: 1;
              }
              
              .ag-theme-alpine .ag-header-cell-menu-button .ag-icon {
                color: #ffffff !important;
              }
              
              .ag-theme-alpine .ag-icon-menu,
              .ag-theme-alpine .ag-icon-filter,
              .ag-theme-alpine .ag-icon-asc,
              .ag-theme-alpine .ag-icon-desc,
              .ag-theme-alpine .ag-icon-none {
                color: #ffffff !important;
              }
              
              .ag-theme-alpine .ag-row {
                border-bottom: 1px solid #e5e7eb;
              }
              
              .ag-theme-alpine .ag-row:hover {
                background-color: #f0fdf4 !important;
              }
              
              .ag-theme-alpine .ag-paging-panel {
                border-top: 1px solid #d1d5db;
                background-color: #f9fafb;
              }
              
              .ag-theme-alpine .ag-paging-button {
                color: #15803d;
              }
              
              .ag-theme-alpine .ag-paging-button:hover {
                background-color: #dcfce7;
              }
              
              .ag-theme-alpine .ag-paging-button.ag-disabled {
                color: #9ca3af;
              }
            `}</style>
            <AgGridReact
              rowData={timesheetData}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              gridOptions={gridOptions}
              onGridReady={onGridReady}
              suppressMenuHide={true}
              enableCellTextSelection={true}
              ensureDomOrder={true}
              suppressRowTransform={true}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default TimesheetManager;