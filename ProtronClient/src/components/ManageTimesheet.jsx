"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight, Calendar, Download, SkipBack, SkipForward, ChevronDown } from "lucide-react"
import { FiCalendar } from "react-icons/fi"

const ManageTimesheets = () => {
  const [currentWeek, setCurrentWeek] = useState("13/Jan/25 - 19/Jan/25")
  const [showWeekend, setShowWeekend] = useState(false)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  // Sample timesheet data
  const timesheetData = [
    {
      id: 1,
      name: "Unknown User",
      initials: "UU",
      mon: { hours: "3H", status: "pending" },
      tue: { hours: "0H", status: "approved" },
      wed: { hours: "0H", status: "pending" },
      thu: { hours: "0H", status: "approved" },
      fri: { hours: "0H", status: "pending" },
      total: { hours: "3H", total: "40H" },
    },
    {
      id: 2,
      name: "Alfie Wood",
      initials: "AW",
      mon: { hours: "8H", status: "approved" },
      tue: { hours: "0H", status: "approved" },
      wed: { hours: "8H", status: "approved" },
      thu: { hours: "0H", status: "approved" },
      fri: { hours: "8H", status: "approved" },
      total: { hours: "24H", total: "40H" },
    },
    {
      id: 3,
      name: "Chinmay Sarasvati",
      initials: "CS",
      mon: { hours: "3H", status: "approved" },
      tue: { hours: "0H", status: "approved" },
      wed: { hours: "0H", status: "approved" },
      thu: { hours: "0H", status: "approved" },
      fri: { hours: "0H", status: "approved" },
      total: { hours: "40H", total: "40H" },
    },
    {
      id: 4,
      name: "Homayoun Shakibail",
      initials: "HS",
      mon: { hours: "8H", status: "approved" },
      tue: { hours: "0H", status: "approved" },
      wed: { hours: "8H", status: "approved" },
      thu: { hours: "0H", status: "approved" },
      fri: { hours: "8H", status: "approved" },
      total: { hours: "24H", total: "40H" },
    },
    {
      id: 5,
      name: "Ingo Schimpff",
      initials: "IS",
      mon: { hours: "8H", status: "approved" },
      tue: { hours: "0H", status: "approved" },
      wed: { hours: "8H", status: "approved" },
      thu: { hours: "0H", status: "approved" },
      fri: { hours: "8H", status: "approved" },
      total: { hours: "24H", total: "40H" },
    },
  ]

  const getStatusBadge = (status, hours) => {
    const baseClasses = "inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold"
    const statusClasses = status === "approved" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"

    return <span className={`${baseClasses} ${statusClasses}`}>{hours}/8H</span>
  }

  const navigateWeek = (direction) => {
    console.log(`Navigate ${direction}`)
  }

  const downloadExcel = () => {
    console.log("Download Excel")
  }

  const viewDetails = (userId) => {
    console.log(`View details for user ${userId}`)
  }

  const totalPages = Math.ceil(timesheetData.length / rowsPerPage)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="px-6 py-6">
          <h1 className='flex items-center gap-2 text-xl font-bold mb-4'><FiCalendar /> Timesheet Management</h1>
        </div>
      </div>
      {/* Main Content */}
      <div className="p-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Controls Header */}
          <div className="px-6 py-5 border-b border-gray-200 bg-gray-50/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {/* Week Navigation */}
                <div className="flex items-center bg-white rounded-lg border border-gray-200 p-1 shadow-sm">
                  <button
                    onClick={() => navigateWeek("prev")}
                    className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4 text-gray-600" />
                  </button>
                  <span className="text-sm font-semibold text-gray-900 min-w-[140px] text-center px-3">
                    {currentWeek}
                  </span>
                  <button
                    onClick={() => navigateWeek("next")}
                    className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    <ChevronRight className="h-4 w-4 text-gray-600" />
                  </button>
                  <div className="w-px h-6 bg-gray-200 mx-1"></div>
                  <button className="p-2 hover:bg-gray-100 rounded-md transition-colors">
                    <Calendar className="h-4 w-4 text-gray-600" />
                  </button>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                {/* Show Weekend Toggle */}
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showWeekend}
                    onChange={(e) => setShowWeekend(e.target.checked)}
                    className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2"
                  />
                  <span className="text-sm font-medium text-gray-700">Show Weekend</span>
                </label>
                {/* Download Excel Button */}
                <button
                  onClick={downloadExcel}
                  className="flex items-center space-x-2 px-4 py-2.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors shadow-sm font-medium"
                >
                  <Download className="h-4 w-4" />
                  <span>Download Excel</span>
                </button>
              </div>
            </div>
          </div>
          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-green-700 text-white">
                  <th className="py-4 px-6 text-left font-semibold border-r border-green-600 text-sm">#</th>
                  <th className="py-4 px-6 text-left font-semibold border-r border-green-600 text-sm">Name</th>
                  <th className="py-4 px-6 text-center font-semibold border-r border-green-600 text-sm">Mon, 13 Jan</th>
                  <th className="py-4 px-6 text-center font-semibold border-r border-green-600 text-sm">Tue, 14 Jan</th>
                  <th className="py-4 px-6 text-center font-semibold border-r border-green-600 text-sm">Wed, 15 Jan</th>
                  <th className="py-4 px-6 text-center font-semibold border-r border-green-600 text-sm">Thu, 16 Jan</th>
                  <th className="py-4 px-6 text-center font-semibold border-r border-green-600 text-sm">Fri, 17 Jan</th>
                  <th className="py-4 px-6 text-center font-semibold border-r border-green-600 text-sm">Total</th>
                  <th className="py-4 px-6 text-center font-semibold text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {timesheetData.map((row, index) => (
                  <tr
                    key={row.id}
                    className={`${
                      index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                    } hover:bg-gray-50 transition-colors border-b border-gray-100`}
                  >
                    <td className="py-4 px-6 border-r border-gray-200">
                      <span className="text-sm font-medium text-gray-900">{index + 1}</span>
                    </td>
                    <td className="py-4 px-6 border-r border-gray-200">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center border-2 border-green-200">
                          <span className="text-sm font-semibold text-green-700">{row.initials}</span>
                        </div>
                        <span className="font-medium text-gray-900">{row.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 border-r border-gray-200 text-center">
                      {getStatusBadge(row.mon.status, row.mon.hours)}
                    </td>
                    <td className="py-4 px-6 border-r border-gray-200 text-center">
                      {getStatusBadge(row.tue.status, row.tue.hours)}
                    </td>
                    <td className="py-4 px-6 border-r border-gray-200 text-center">
                      {getStatusBadge(row.wed.status, row.wed.hours)}
                    </td>
                    <td className="py-4 px-6 border-r border-gray-200 text-center">
                      {getStatusBadge(row.thu.status, row.thu.hours)}
                    </td>
                    <td className="py-4 px-6 border-r border-gray-200 text-center">
                      {getStatusBadge(row.fri.status, row.fri.hours)}
                    </td>
                    <td className="py-4 px-6 border-r border-gray-200 text-center">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-red-100 text-red-800">
                        {row.total.hours}/{row.total.total}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className="relative">
                        <select
                          className="appearance-none bg-green-700 text-white px-4 py-2 pr-8 rounded-lg hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1 transition-colors cursor-pointer text-sm font-medium"
                          onChange={(e) => {
                            const action = e.target.value
                            if (action === "view") {
                              viewDetails(row.id)
                            }
                            e.target.selectedIndex = 0
                          }}
                        >
                          <option value="">Actions</option>
                          <option value="view">View Details</option>
                          <option value="edit">Edit</option>
                          <option value="approve">Approve</option>
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white pointer-events-none" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium text-gray-700">Rows per page</span>
                <div className="relative">
                  <select
                    value={rowsPerPage}
                    onChange={(e) => setRowsPerPage(Number(e.target.value))}
                    className="appearance-none bg-white border border-gray-300 rounded-lg px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div className="flex items-center space-x-6">
                <span className="text-sm font-medium text-gray-700">1-10 of 80</span>
                <div className="flex items-center space-x-1">
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <SkipBack className="h-4 w-4 text-gray-600" />
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <ChevronLeft className="h-4 w-4 text-gray-600" />
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <ChevronRight className="h-4 w-4 text-gray-600" />
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <SkipForward className="h-4 w-4 text-gray-600" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
export default ManageTimesheets