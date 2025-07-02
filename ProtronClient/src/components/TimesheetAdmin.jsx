import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Download,
  ChevronDown,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Menu,
  X
} from 'lucide-react';
import { Link } from 'react-router-dom';

const TimesheetManager = () => {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [showWeekend, setShowWeekend] = useState(false);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [timesheetData, setTimesheetData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_URL;

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
        // Get current weekdays based on showWeekend state
        const currentWeekdays = getWeekdays();

        // Get daily hours for the current week
        const dailyHours = currentWeekdays.map(day => {
          const dayKey = day.toISOString().split('T')[0]; // Format: YYYY-MM-DD
          const hoursWorked = user.dailyHours?.[dayKey] || 0;
          const workedRounded = Math.round((parseFloat(hoursWorked) || 0) * 100) / 100; // Round to 2 decimal places
          const expectedDaily = 8; // Standard 8 hours per day
          return {
            worked: workedRounded,
            expected: expectedDaily,
            display: `${workedRounded}H/${expectedDaily}H`
          };
        });

        // Calculate total hours for the current period (weekdays or including weekend)
        const totalWorkedHours = dailyHours.reduce((sum, day) => sum + day.worked, 0);
        const totalExpectedHours = dailyHours.length * 8; // 8 hours per day

        return {
          id: user.userId || index + 1,
          name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || `User ${index + 1}`,
          email: user.email,
          avatar: user.name ? user.name.charAt(0).toUpperCase() : (user.email ? user.email.charAt(0).toUpperCase() : 'U'),
          dailyHours: dailyHours,
          totalHours: Math.round(totalWorkedHours * 100) / 100,
          expectedHours: totalExpectedHours,
          rawData: user // Keep original data for Excel export
        };
      });

      setTimesheetData(transformedData);
    } catch (error) {
      console.error('Error fetching timesheet data:', error);

      // Show user-friendly error message based on error type
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
    setCurrentPage(1); // Reset pagination when data changes
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

  // Get weekdays for rendering - this will update when showWeekend changes
  const weekdays = getWeekdays();

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

  // Sorting functionality
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  const getSortIcon = (field) => {
    if (sortField !== field) return <ArrowUpDown className="w-4 h-4" />;
    return sortDirection === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />;
  };

  // Sort data
  const sortedData = [...timesheetData].sort((a, b) => {
    let aValue = a[sortField];
    let bValue = b[sortField];

    if (sortField === 'name') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }

    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  // Frontend-only Excel download functionality
  const downloadExcel = () => {
    const weekdays = getWeekdays(); // Move this inside the function
    try {
      const startParam = weekStart.toISOString().split('T')[0];
      const endParam = weekEnd.toISOString().split('T')[0];

      // Create CSV headers
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

      // Create CSV content
      const csvContent = [
        headers.join(','),
        ...sortedData.map((emp, index) => [
          index + 1, // Sequential number instead of user ID
          `"${emp.name}"`,
          emp.email,
          ...emp.dailyHours.map(h => Math.round(h.worked * 100) / 100), // Round to 2 decimal places
          emp.totalHours,
          emp.expectedHours
        ].join(','))
      ].join('\n');

      // Create and download the file
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

  // Get cell color based on hours
  const getCellColor = (dayData) => {
    const worked = dayData.worked;
    const expected = dayData.expected;

    if (worked === 0) return 'text-red-600';
    if (worked >= expected) return 'text-green-600';
    return 'text-yellow-600';
  };

  // Get total color
  const getTotalColor = (total, expected) => {
    if (total === 0) return 'text-red-600';
    if (total >= expected) return 'text-green-600';
    return 'text-yellow-600';
  };

  // Pagination
  const totalPages = Math.ceil(sortedData.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const currentData = sortedData.slice(startIndex, endIndex);

  // Don't show pagination if there's only one page or no data
  const showPagination = totalPages > 1;

  // Pagination helpers
  const goToPage = (page) => {
    setCurrentPage(Math.max(1, Math.min(totalPages, page)));
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading timesheet data...</p>
          </div>
        </div>
      </div>
    );
  }

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

        {/* Desktop Table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                  #
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Name</span>
                    {getSortIcon('name')}
                  </div>
                </th>
                {weekdays.map((day, index) => (
                  <th key={index} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    {day.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' })}
                  </th>
                ))}
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('totalHours')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Total</span>
                    {getSortIcon('totalHours')}
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentData.length === 0 ? (
                <tr>
                  <td colSpan={weekdays.length + 4} className="px-4 py-8 text-center text-gray-500">
                    No timesheet data available for the selected period
                  </td>
                </tr>
              ) : (
                currentData.map((employee, index) => (
                  <tr key={employee.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 text-sm text-gray-900">
                      {startIndex + index + 1}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-600">
                          {employee.avatar}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-blue-600 hover:text-blue-800 cursor-pointer">
                            <Link to="/individual-timesheet" state={{ employee }}>
                              {employee.name}
                            </Link>
                          </span>
                          <span className="text-xs text-gray-500">
                            {employee.email}
                          </span>
                        </div>
                      </div>
                    </td>
                    {employee.dailyHours.slice(0, weekdays.length).map((dayData, index) => (
                      <td key={index} className="px-4 py-4">
                        <span className={`text-sm font-medium ${getCellColor(dayData)}`}>
                          {dayData.display}
                        </span>
                      </td>
                    ))}
                    <td className="px-4 py-4">
                      <span className={`text-sm font-bold ${getTotalColor(employee.totalHours, employee.expectedHours)}`}>
                        {employee.totalHours}H/{employee.expectedHours}H
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <button className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-800">
                        <span className="hidden xl:inline cursor-pointer">
                           <Link to="/individual-timesheet" state={{ employee }}>
                          View Details</Link></span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile/Tablet Card View */}
        <div className="lg:hidden">
          {currentData.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No timesheet data available for the selected period
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {currentData.map((employee) => (
                <div key={employee.id} className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-600">
                        {employee.avatar}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{employee.name}</div>
                        <div className="text-sm text-gray-500">{employee.email}</div>
                      </div>
                    </div>
                    <div className={`text-sm font-bold ${getTotalColor(employee.totalHours, employee.expectedHours)}`}>
                      {employee.totalHours}H/{employee.expectedHours}H
                    </div>
                  </div>

                  <div className={`grid gap-2 ${showWeekend ? 'grid-cols-7' : 'grid-cols-5'} sm:${showWeekend ? 'grid-cols-7' : 'grid-cols-5'}`}>
                    {employee.dailyHours.map((dayData, index) => {
                      const dayDate = weekdays[index];
                      if (!dayDate) return null; // Skip if weekday is undefined

                      return (
                        <div key={index} className="text-center">
                          <div className="text-xs text-gray-500 mb-1">
                            {dayDate.toLocaleDateString('en-US', { weekday: 'short' })}
                          </div>
                          <div className={`text-sm font-medium ${getCellColor(dayData)}`}>
                            {Math.round(dayData.worked * 100) / 100}H
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-3 flex justify-end">
                    <button className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800">
                      <span>View Details</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Enhanced Footer with Better Pagination */}
        {showPagination && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 py-3 border-t border-gray-200 space-y-3 sm:space-y-0">
            <div className="flex items-center justify-center sm:justify-start space-x-2">
              <span className="text-sm text-gray-700">Rows per page</span>
              <div className="relative">
                <select
                  value={rowsPerPage}
                  onChange={(e) => {
                    setRowsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="appearance-none bg-white border border-gray-300 rounded px-3 py-1 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div className="flex items-center justify-center sm:justify-end space-x-4">
              <span className="text-sm text-gray-700">
                {startIndex + 1}-{Math.min(endIndex, sortedData.length)} of {sortedData.length}
              </span>

              <div className="flex items-center space-x-1">
                {/* First Page */}
                <button
                  onClick={() => goToPage(1)}
                  disabled={currentPage === 1}
                  className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="First page"
                >
                  <div className="flex items-center">
                    <ChevronLeft className="w-4 h-4" />
                    <ChevronLeft className="w-4 h-4 -ml-1" />
                  </div>
                </button>

                {/* Previous Page */}
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Previous page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {/* Page Numbers */}
                <div className="hidden sm:flex items-center space-x-1">
                  {getPageNumbers().map(page => (
                    <button
                      key={page}
                      onClick={() => goToPage(page)}
                      className={`px-3 py-1 rounded text-sm ${page === currentPage
                          ? 'bg-blue-600 text-white'
                          : 'hover:bg-gray-100 text-gray-700'
                        }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                {/* Mobile page indicator */}
                <div className="sm:hidden px-3 py-1 text-sm text-gray-700">
                  {currentPage} / {totalPages}
                </div>

                {/* Next Page */}
                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Next page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                {/* Last Page */}
                <button
                  onClick={() => goToPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Last page"
                >
                  <div className="flex items-center">
                    <ChevronRight className="w-4 h-4" />
                    <ChevronRight className="w-4 h-4 -ml-1" />
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Simple footer when no pagination needed */}
        {!showPagination && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-700">Rows per page</span>
              <div className="relative">
                <select
                  value={rowsPerPage}
                  onChange={(e) => {
                    setRowsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="appearance-none bg-white border border-gray-300 rounded px-3 py-1 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <span className="text-sm text-gray-700">
              Showing {sortedData.length} of {sortedData.length} entries
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default TimesheetManager;