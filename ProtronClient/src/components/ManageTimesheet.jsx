import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  Download, 
  Eye,
  User,
  ChevronDown,
  SkipBack,
  SkipForward
} from 'lucide-react';

const ManageTimesheets = () => {
  const [currentWeek, setCurrentWeek] = useState('13/Jan/25 - 19/Jan/25');
  const [showWeekend, setShowWeekend] = useState(false);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Sample timesheet data
  const timesheetData = [
    {
      id: 1,
      name: '',
      avatar: null,
      mon: { hours: '3H', status: 'pending' },
      tue: { hours: '0H', status: 'approved' },
      wed: { hours: '0H', status: 'pending' },
      thu: { hours: '0H', status: 'approved' },
      fri: { hours: '0H', status: 'pending' },
      total: { hours: '3H', total: '40H' }
    },
    {
      id: 2,
      name: 'Alfie Wood',
      avatar: '👤',
      mon: { hours: '8H', status: 'approved' },
      tue: { hours: '0H', status: 'approved' },
      wed: { hours: '8H', status: 'approved' },
      thu: { hours: '0H', status: 'approved' },
      fri: { hours: '8H', status: 'approved' },
      total: { hours: '24H', total: '40H' }
    },
    {
      id: 3,
      name: 'Chinmay Sarasvati',
      avatar: '👤',
      mon: { hours: '3H', status: 'approved' },
      tue: { hours: '0H', status: 'approved' },
      wed: { hours: '0H', status: 'approved' },
      thu: { hours: '0H', status: 'approved' },
      fri: { hours: '0H', status: 'approved' },
      total: { hours: '40H', total: '40H' }
    },
    {
      id: 4,
      name: 'Homayoun Shakibail',
      avatar: '👤',
      mon: { hours: '8H', status: 'approved' },
      tue: { hours: '0H', status: 'approved' },
      wed: { hours: '8H', status: 'approved' },
      thu: { hours: '0H', status: 'approved' },
      fri: { hours: '8H', status: 'approved' },
      total: { hours: '24H', total: '40H' }
    },
    {
      id: 5,
      name: 'Ingo Schimpff',
      avatar: '👤',
      mon: { hours: '8H', status: 'approved' },
      tue: { hours: '0H', status: 'approved' },
      wed: { hours: '8H', status: 'approved' },
      thu: { hours: '0H', status: 'approved' },
      fri: { hours: '8H', status: 'approved' },
      total: { hours: '24H', total: '40H' }
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'text-green-600';
      case 'pending':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const navigateWeek = (direction) => {
    // This would normally update the week range
    console.log(`Navigate ${direction}`);
  };

  const downloadExcel = () => {
    console.log('Download Excel');
  };

  const viewDetails = (userId) => {
    console.log(`View details for user ${userId}`);
  };

  const totalPages = Math.ceil(timesheetData.length / rowsPerPage);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              <h1 className="text-xl font-semibold text-gray-900">Manage Timesheet</h1>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <User className="h-5 w-5 text-gray-500" />
            <span className="text-sm text-gray-700">User</span>
          </div>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="px-6 py-3 bg-gray-100 border-b border-gray-200">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <span>JIRA</span>
          <span>-</span>
          <span>Manage Timesheet</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 py-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Header Section */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Admin Timesheet View</h2>
            
            {/* Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {/* Week Navigation */}
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => navigateWeek('prev')}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <ChevronLeft className="h-4 w-4 text-gray-600" />
                  </button>
                  <span className="text-sm font-medium text-gray-900 min-w-[140px] text-center">
                    {currentWeek}
                  </span>
                  <button 
                    onClick={() => navigateWeek('next')}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <ChevronRight className="h-4 w-4 text-gray-600" />
                  </button>
                  <button className="p-1 hover:bg-gray-100 rounded">
                    <Calendar className="h-4 w-4 text-gray-600" />
                  </button>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                {/* Show Weekend Toggle */}
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={showWeekend}
                    onChange={(e) => setShowWeekend(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Show Weekend</span>
                </label>

                {/* Download Excel Button */}
                <button
                  onClick={downloadExcel}
                  className="flex items-center space-x-2 px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors"
                >
                  <Download className="h-4 w-4" />
                  <span className="text-sm font-medium">Download Excel</span>
                </button>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                    #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mon, 13 Jan
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tue, 14 Jan
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Wed, 15 Jan
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thu, 16 Jan
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fri, 17 Jan
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {timesheetData.map((row, index) => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        {row.avatar && (
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-sm">{row.avatar}</span>
                          </div>
                        )}
                        <span className="text-sm font-medium text-blue-600 hover:text-blue-800 cursor-pointer">
                          {row.name || 'Unknown User'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`text-sm font-medium ${getStatusColor(row.mon.status)}`}>
                        {row.mon.hours}/8H
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`text-sm font-medium ${getStatusColor(row.tue.status)}`}>
                        {row.tue.hours}/8H
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`text-sm font-medium ${getStatusColor(row.wed.status)}`}>
                        {row.wed.hours}/8H
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`text-sm font-medium ${getStatusColor(row.thu.status)}`}>
                        {row.thu.hours}/8H
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`text-sm font-medium ${getStatusColor(row.fri.status)}`}>
                        {row.fri.hours}/8H
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="text-sm font-medium text-red-600">
                        {row.total.hours}/{row.total.total}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => viewDetails(row.id)}
                        className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-900 mx-auto"
                      >
                        <span>View Details</span>
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-700">Rows per page</span>
                <select
                  value={rowsPerPage}
                  onChange={(e) => setRowsPerPage(Number(e.target.value))}
                  className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </div>

              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-700">
                  1-10 of 80
                </span>
                <div className="flex items-center space-x-1">
                  <button className="p-1 hover:bg-gray-100 rounded">
                    <SkipBack className="h-4 w-4 text-gray-600" />
                  </button>
                  <button className="p-1 hover:bg-gray-100 rounded">
                    <ChevronLeft className="h-4 w-4 text-gray-600" />
                  </button>
                  <button className="p-1 hover:bg-gray-100 rounded">
                    <ChevronRight className="h-4 w-4 text-gray-600" />
                  </button>
                  <button className="p-1 hover:bg-gray-100 rounded">
                    <SkipForward className="h-4 w-4 text-gray-600" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageTimesheets;