import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight, Calendar, Download, SkipBack, SkipForward, ChevronDown, Plus, Edit2, Check, X } from "lucide-react"
import { FiCalendar } from "react-icons/fi"

const ManageTimesheets = () => {
  // Week management
  const [currentWeekStart, setCurrentWeekStart] = useState(new Date(2025, 0, 13)) // Jan 13, 2025
  const [showWeekend, setShowWeekend] = useState(false)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  
  // Modal states
  const [showAddUser, setShowAddUser] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [newUser, setNewUser] = useState({ name: "", initials: "" })

  // Sample timesheet data with more realistic structure
  const [timesheetData, setTimesheetData] = useState([
    {
      id: 1,
      name: "Unknown User",
      initials: "UU",
      schedule: {
        "2025-01-13": { hours: 3, status: "pending" },
        "2025-01-14": { hours: 0, status: "approved" },
        "2025-01-15": { hours: 0, status: "pending" },
        "2025-01-16": { hours: 0, status: "approved" },
        "2025-01-17": { hours: 0, status: "pending" },
        "2025-01-18": { hours: 0, status: "approved" },
        "2025-01-19": { hours: 0, status: "approved" },
      }
    },
    {
      id: 2,
      name: "Alfie Wood",
      initials: "AW",
      schedule: {
        "2025-01-13": { hours: 8, status: "approved" },
        "2025-01-14": { hours: 0, status: "approved" },
        "2025-01-15": { hours: 8, status: "approved" },
        "2025-01-16": { hours: 0, status: "approved" },
        "2025-01-17": { hours: 8, status: "approved" },
        "2025-01-18": { hours: 0, status: "approved" },
        "2025-01-19": { hours: 0, status: "approved" },
      }
    },
    {
      id: 3,
      name: "Chinmay Sarasvati",
      initials: "CS",
      schedule: {
        "2025-01-13": { hours: 8, status: "approved" },
        "2025-01-14": { hours: 8, status: "approved" },
        "2025-01-15": { hours: 8, status: "approved" },
        "2025-01-16": { hours: 8, status: "approved" },
        "2025-01-17": { hours: 8, status: "approved" },
        "2025-01-18": { hours: 0, status: "approved" },
        "2025-01-19": { hours: 0, status: "approved" },
      }
    },
    {
      id: 4,
      name: "Homayoun Shakibail",
      initials: "HS",
      schedule: {
        "2025-01-13": { hours: 8, status: "approved" },
        "2025-01-14": { hours: 0, status: "approved" },
        "2025-01-15": { hours: 8, status: "approved" },
        "2025-01-16": { hours: 0, status: "approved" },
        "2025-01-17": { hours: 8, status: "approved" },
        "2025-01-18": { hours: 0, status: "approved" },
        "2025-01-19": { hours: 0, status: "approved" },
      }
    },
    {
      id: 5,
      name: "Ingo Schimpff",
      initials: "IS",
      schedule: {
        "2025-01-13": { hours: 8, status: "approved" },
        "2025-01-14": { hours: 0, status: "approved" },
        "2025-01-15": { hours: 8, status: "approved" },
        "2025-01-16": { hours: 0, status: "approved" },
        "2025-01-17": { hours: 8, status: "approved" },
        "2025-01-18": { hours: 0, status: "approved" },
        "2025-01-19": { hours: 0, status: "approved" },
      }
    },
  ])

  // Helper functions
  const formatDate = (date) => {
    return date.toLocaleDateString('en-GB', { 
      day: '2-digit', 
      month: 'short', 
      year: '2-digit' 
    })
  }

  const formatDateKey = (date) => {
    return date.toISOString().split('T')[0]
  }

  const getCurrentWeekDates = () => {
    const dates = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(currentWeekStart)
      date.setDate(currentWeekStart.getDate() + i)
      dates.push(date)
    }
    return dates
  }

  const getCurrentWeekString = () => {
    const endDate = new Date(currentWeekStart)
    endDate.setDate(currentWeekStart.getDate() + 6)
    return `${formatDate(currentWeekStart)} - ${formatDate(endDate)}`
  }

  const getWeekdays = () => {
    const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
    const weekend = ['Sat', 'Sun']
    return showWeekend ? [...weekdays, ...weekend] : weekdays
  }

  const getDayData = (user, date) => {
    const dateKey = formatDateKey(date)
    return user.schedule[dateKey] || { hours: 0, status: "pending" }
  }

  const getWeekTotal = (user) => {
    const dates = getCurrentWeekDates()
    const workingDates = showWeekend ? dates : dates.slice(0, 5)
    return workingDates.reduce((total, date) => {
      const dayData = getDayData(user, date)
      return total + dayData.hours
    }, 0)
  }

  // Event handlers
  const navigateWeek = (direction) => {
    const newWeekStart = new Date(currentWeekStart)
    newWeekStart.setDate(currentWeekStart.getDate() + (direction === 'next' ? 7 : -7))
    setCurrentWeekStart(newWeekStart)
  }

  const updateUserSchedule = (userId, date, field, value) => {
    setTimesheetData(prev => prev.map(user => {
      if (user.id === userId) {
        const dateKey = formatDateKey(date)
        return {
          ...user,
          schedule: {
            ...user.schedule,
            [dateKey]: {
              ...user.schedule[dateKey],
              [field]: value
            }
          }
        }
      }
      return user
    }))
  }

  const addNewUser = () => {
    if (!newUser.name.trim() || !newUser.initials.trim()) return
    
    const newId = Math.max(...timesheetData.map(u => u.id)) + 1
    const dates = getCurrentWeekDates()
    const schedule = {}
    
    dates.forEach(date => {
      schedule[formatDateKey(date)] = { hours: 0, status: "pending" }
    })
    
    setTimesheetData(prev => [...prev, {
      id: newId,
      name: newUser.name,
      initials: newUser.initials,
      schedule
    }])
    
    setNewUser({ name: "", initials: "" })
    setShowAddUser(false)
  }

  const deleteUser = (userId) => {
    setTimesheetData(prev => prev.filter(user => user.id !== userId))
  }

  const approveAll = (userId) => {
    const dates = getCurrentWeekDates()
    dates.forEach(date => {
      updateUserSchedule(userId, date, 'status', 'approved')
    })
  }

  const downloadExcel = () => {
    // Create CSV content
    const dates = getCurrentWeekDates()
    const workingDates = showWeekend ? dates : dates.slice(0, 5)
    
    let csvContent = "Name," + workingDates.map(date => 
      `${date.toLocaleDateString('en-GB', { weekday: 'short' })} ${date.getDate()}/${date.getMonth() + 1}`
    ).join(",") + ",Total\n"
    
    timesheetData.forEach(user => {
      const row = [user.name]
      workingDates.forEach(date => {
        const dayData = getDayData(user, date)
        row.push(`${dayData.hours}H (${dayData.status})`)
      })
      row.push(`${getWeekTotal(user)}H`)
      csvContent += row.join(",") + "\n"
    })
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `timesheet-${getCurrentWeekString().replace(/[^\w\s]/gi, '-')}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const getStatusBadge = (status, hours) => {
    const baseClasses = "inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold"
    const statusClasses = status === "approved" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
    return <span className={`${baseClasses} ${statusClasses}`}>{hours}H</span>
  }

  // Pagination
  const totalPages = Math.ceil(timesheetData.length / rowsPerPage)
  const startIndex = (currentPage - 1) * rowsPerPage
  const endIndex = startIndex + rowsPerPage
  const currentData = timesheetData.slice(startIndex, endIndex)

  const goToPage = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="px-6 py-6">
          <div className="flex items-center justify-between">
            <h1 className='flex items-center gap-2 text-xl font-bold'><FiCalendar /> Timesheet Management</h1>
            <button
              onClick={() => setShowAddUser(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm font-medium"
            >
              <Plus className="h-4 w-4" />
              <span>Add User</span>
            </button>
          </div>
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
                    {getCurrentWeekString()}
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
                  <span>Download CSV</span>
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
                  {getCurrentWeekDates().map((date, index) => {
                    const dayName = date.toLocaleDateString('en-GB', { weekday: 'short' })
                    const isWeekend = index >= 5
                    if (!showWeekend && isWeekend) return null
                    return (
                      <th key={date.toISOString()} className="py-4 px-6 text-center font-semibold border-r border-green-600 text-sm">
                        {dayName}, {date.getDate()} {date.toLocaleDateString('en-GB', { month: 'short' })}
                      </th>
                    )
                  })}
                  <th className="py-4 px-6 text-center font-semibold border-r border-green-600 text-sm">Total</th>
                  <th className="py-4 px-6 text-center font-semibold text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentData.map((row, index) => (
                  <tr
                    key={row.id}
                    className={`${
                      index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                    } hover:bg-gray-50 transition-colors border-b border-gray-100`}
                  >
                    <td className="py-4 px-6 border-r border-gray-200">
                      <span className="text-sm font-medium text-gray-900">{startIndex + index + 1}</span>
                    </td>
                    <td className="py-4 px-6 border-r border-gray-200">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center border-2 border-green-200">
                          <span className="text-sm font-semibold text-green-700">{row.initials}</span>
                        </div>
                        <span className="font-medium text-gray-900">{row.name}</span>
                      </div>
                    </td>
                    {getCurrentWeekDates().map((date, dateIndex) => {
                      const isWeekend = dateIndex >= 5
                      if (!showWeekend && isWeekend) return null
                      const dayData = getDayData(row, date)
                      return (
                        <td key={date.toISOString()} className="py-4 px-6 border-r border-gray-200 text-center">
                          <div className="flex flex-col items-center space-y-1">
                            {getStatusBadge(dayData.status, dayData.hours)}
                            <div className="flex space-x-1">
                              <input
                                type="number"
                                min="0"
                                max="24"
                                value={dayData.hours}
                                onChange={(e) => updateUserSchedule(row.id, date, 'hours', parseInt(e.target.value) || 0)}
                                className="w-12 text-xs px-1 py-1 border border-gray-300 rounded text-center focus:ring-1 focus:ring-green-500 focus:border-green-500"
                              />
                              <button
                                onClick={() => updateUserSchedule(row.id, date, 'status', dayData.status === 'approved' ? 'pending' : 'approved')}
                                className={`p-1 rounded text-xs ${dayData.status === 'approved' ? 'text-green-600 hover:bg-green-50' : 'text-red-600 hover:bg-red-50'}`}
                              >
                                {dayData.status === 'approved' ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                              </button>
                            </div>
                          </div>
                        </td>
                      )
                    })}
                    <td className="py-4 px-6 border-r border-gray-200 text-center">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                        {getWeekTotal(row)}H
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => approveAll(row.id)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Approve All"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteUser(row.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete User"
                        >
                          <X className="h-4 w-4" />
                        </button>
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
                    onChange={(e) => {
                      setRowsPerPage(Number(e.target.value))
                      setCurrentPage(1)
                    }}
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
                <span className="text-sm font-medium text-gray-700">
                  {startIndex + 1}-{Math.min(endIndex, timesheetData.length)} of {timesheetData.length}
                </span>
                <div className="flex items-center space-x-1">
                  <button 
                    onClick={() => goToPage(1)}
                    disabled={currentPage === 1}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <SkipBack className="h-4 w-4 text-gray-600" />
                  </button>
                  <button 
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-4 w-4 text-gray-600" />
                  </button>
                  <button 
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="h-4 w-4 text-gray-600" />
                  </button>
                  <button 
                    onClick={() => goToPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <SkipForward className="h-4 w-4 text-gray-600" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-96 shadow-xl">
            <h3 className="text-lg font-semibold mb-4">Add New User</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Enter full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Initials</label>
                <input
                  type="text"
                  value={newUser.initials}
                  onChange={(e) => setNewUser(prev => ({ ...prev, initials: e.target.value.toUpperCase().slice(0, 3) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="e.g., JD"
                  maxLength="3"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowAddUser(false)
                  setNewUser({ name: "", initials: "" })
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={addNewUser}
                disabled={!newUser.name.trim() || !newUser.initials.trim()}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ManageTimesheets