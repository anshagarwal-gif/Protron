import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight, Calendar, Download, Plus, Edit2, Check, X } from "lucide-react"
import { FaChevronLeft, FaChevronRight, FaCalendarAlt, FaTimes, FaUpload } from 'react-icons/fa'

// LogTime Modal Component
const LogTimeModal = ({ isOpen, onClose, selectedDate, onSave }) => {
  const [formData, setFormData] = useState({
    taskType: '',
    hours: '',
    minutes: '',
    description: '',
    attachment: null
  })

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    setFormData(prev => ({
      ...prev,
      attachment: file
    }))
  }

  const handleReset = () => {
    setFormData({
      taskType: '',
      hours: '',
      minutes: '',
      description: '',
      attachment: null
    })
  }

  const handleSubmit = () => {
    if (formData.taskType && (formData.hours || formData.minutes)) {
      const totalHours = parseFloat(formData.hours || 0) + parseFloat(formData.minutes || 0) / 60
      const submitData = {
        task: formData.taskType,
        time: totalHours.toFixed(2),
        description: formData.description,
        attachment: formData.attachment
      }
      onSave(submitData)
      handleReset()
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4">
          <h2 className="text-lg font-semibold text-gray-800">Log Time</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FaTimes size={20} />
          </button>
        </div>

        {/* Date Selector */}
        <div className="px-4 pb-4">
          <div className="flex items-center justify-center gap-2">
            <button className="p-1 hover:bg-gray-100 rounded">
              <FaChevronLeft size={16} />
            </button>
            <div className="flex items-center gap-2 px-3 py-1 bg-gray-50 rounded">
              <span className="font-medium">{selectedDate || '01/Jan/25'}</span>
              <FaCalendarAlt size={14} className="text-gray-500" />
            </div>
            <button className="p-1 hover:bg-gray-100 rounded">
              <FaChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Form Content */}
        <div className="p-4 space-y-4">
          {/* Task Type and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Task Type
              </label>
              <select
                name="taskType"
                value={formData.taskType}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select form list</option>
                <option value="Design">Design</option>
                <option value="Development">Development</option>
                <option value="Testing">Testing</option>
                <option value="Meeting">Meeting</option>
                <option value="Research">Research</option>
                <option value="Documentation">Documentation</option>
                <option value="Review">Review</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Time
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  name="hours"
                  value={formData.hours}
                  onChange={handleInputChange}
                  placeholder="HH"
                  min="0"
                  max="23"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center"
                />
                <span className="flex items-center text-gray-500">:</span>
                <input
                  type="number"
                  name="minutes"
                  value={formData.minutes}
                  onChange={handleInputChange}
                  placeholder="MM"
                  min="0"
                  max="59"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center"
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Enter here"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Attachment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Attachment
            </label>
            <div className="relative">
              <input
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.jpg,.jpeg,.png,.xls,.xlsx"
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="flex items-center justify-center w-full px-3 py-8 border-2 border-dashed border-gray-300 rounded-md cursor-pointer hover:border-gray-400 transition-colors"
              >
                <div className="text-center">
                  <FaUpload className="mx-auto mb-2 text-gray-400" size={24} />
                  <span className="text-sm text-gray-500">
                    {formData.attachment ? formData.attachment.name : 'Upload here'}
                  </span>
                </div>
              </label>
            </div>
            <p className="text-xs text-gray-500 mt-1">*PDF, JPG, PNG, XLS</p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 bg-gray-50">
          <button
            onClick={handleReset}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Reset
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors"
            >
              Add
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const TimesheetManager = () => {
  // Get current date and find nearest Monday
  const getCurrentMondayStart = () => {
    const today = new Date()
    const dayOfWeek = today.getDay()
    const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek // Sunday is 0, Monday is 1
    const monday = new Date(today)
    monday.setDate(today.getDate() + daysToMonday)
    monday.setHours(0, 0, 0, 0)
    return monday
  }

  // Get current month Monday start to month end
  const getCurrentMonthRange = () => {
    const today = new Date()
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
    
    // Find the Monday of the week containing the first day of the month
    const dayOfWeek = firstDay.getDay()
    const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
    const startMonday = new Date(firstDay)
    startMonday.setDate(firstDay.getDate() + daysToMonday)
    
    // Get last day of the month
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0)
    
    return { start: startMonday, end: lastDay }
  }

  // State management
  const [viewMode, setViewMode] = useState("Weekly") // Default to Weekly
  const [currentWeekStart, setCurrentWeekStart] = useState(getCurrentMondayStart())
  const [currentMonthRange, setCurrentMonthRange] = useState(getCurrentMonthRange())
  const [showWeekend, setShowWeekend] = useState(false)
  const [showLogTimeModal, setShowLogTimeModal] = useState(false)
  const [selectedCell, setSelectedCell] = useState(null)
  const [hoveredCell, setHoveredCell] = useState(null)

  // Timesheet data - stores multiple entries per date
  const [timesheetData, setTimesheetData] = useState({})

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

  const formatDateDisplay = (date) => {
    return date.toLocaleDateString('en-GB', { 
      day: '2-digit',
      month: 'short',
      year: '2-digit'
    })
  }

  const getWeekDates = (startDate) => {
    const dates = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate)
      date.setDate(startDate.getDate() + i)
      dates.push(date)
    }
    return dates
  }

  const getMonthDates = () => {
    const dates = []
    const current = new Date(currentMonthRange.start)
    
    while (current <= currentMonthRange.end) {
      dates.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }
    return dates
  }

  const getCurrentDates = () => {
    if (viewMode === "Weekly") {
      return getWeekDates(currentWeekStart)
    } else {
      return getMonthDates()
    }
  }

  const getCurrentDateString = () => {
    if (viewMode === "Weekly") {
      const endDate = new Date(currentWeekStart)
      endDate.setDate(currentWeekStart.getDate() + 6)
      return `${formatDate(currentWeekStart)} - ${formatDate(endDate)}`
    } else {
      return `${formatDate(currentMonthRange.start)} - ${formatDate(currentMonthRange.end)}`
    }
  }

  const getVisibleDates = () => {
    const allDates = getCurrentDates()
    if (viewMode === "Weekly") {
      return showWeekend ? allDates : allDates.slice(0, 5)
    } else {
      // For monthly view, apply weekend filter too
      return showWeekend ? allDates : allDates.filter((date, index) => {
        const dayOfWeek = date.getDay()
        return dayOfWeek !== 0 && dayOfWeek !== 6 // Exclude Sunday (0) and Saturday (6)
      })
    }
  }

  const getDayName = (date) => {
    return date.toLocaleDateString('en-GB', { weekday: 'short' })
  }

  const getTimeEntries = (date) => {
    const dateKey = formatDateKey(date)
    return timesheetData[dateKey] || []
  }

  const getDayTotalHours = (date) => {
    const entries = getTimeEntries(date)
    return entries.reduce((total, entry) => total + entry.hours, 0)
  }

  const getTotalHours = () => {
    const dates = getVisibleDates()
    return dates.reduce((total, date) => total + getDayTotalHours(date), 0)
  }

  // Event handlers
  const navigatePeriod = (direction) => {
    if (viewMode === "Weekly") {
      const newWeekStart = new Date(currentWeekStart)
      newWeekStart.setDate(currentWeekStart.getDate() + (direction === 'next' ? 7 : -7))
      setCurrentWeekStart(newWeekStart)
    } else {
      const currentMonth = currentMonthRange.start.getMonth()
      const currentYear = currentMonthRange.start.getFullYear()
      
      let newMonth, newYear
      if (direction === 'next') {
        newMonth = currentMonth + 1
        newYear = currentYear
        if (newMonth > 11) {
          newMonth = 0
          newYear++
        }
      } else {
        newMonth = currentMonth - 1
        newYear = currentYear
        if (newMonth < 0) {
          newMonth = 11
          newYear--
        }
      }
      
      const firstDay = new Date(newYear, newMonth, 1)
      const dayOfWeek = firstDay.getDay()
      const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
      const startMonday = new Date(firstDay)
      startMonday.setDate(firstDay.getDate() + daysToMonday)
      const lastDay = new Date(newYear, newMonth + 1, 0)
      
      setCurrentMonthRange({ start: startMonday, end: lastDay })
    }
  }

  const handleLogTimeSave = (formData) => {
    if (!selectedCell) return
    
    const { date } = selectedCell
    const dateKey = formatDateKey(date)
    
    // Only store the data that was actually entered in the modal
    const newEntry = {
      id: Date.now() + Math.random(), // Simple unique ID
      hours: parseFloat(formData.time) || 0,
      description: formData.description || '',
      task: formData.task || '',
      attachment: formData.attachment
      // Removed percentage - it won't be stored or displayed
    }
    
    // Add time entry to the date
    setTimesheetData(prev => ({
      ...prev,
      [dateKey]: [...(prev[dateKey] || []), newEntry]
    }))
    
    setSelectedCell(null)
  }

  const deleteTimeEntry = (date, entryId) => {
    const dateKey = formatDateKey(date)
    setTimesheetData(prev => ({
      ...prev,
      [dateKey]: prev[dateKey]?.filter(entry => entry.id !== entryId) || []
    }))
  }

  const downloadExcel = () => {
    try {
      const dates = getVisibleDates()
      const periodType = viewMode === "Weekly" ? "week" : "month"
      
      // Create Excel-like CSV content with BOM for UTF-8
      const BOM = '\uFEFF'
      // Removed "Percentage" from headers since we're not using it
      const headers = ["Date", "Task", "Hours", "Description"]
      
      let csvContent = BOM + headers.map(h => `"${h}"`).join(",") + "\r\n"
      
      dates.forEach(date => {
        const entries = getTimeEntries(date)
        entries.forEach(entry => {
          const row = [
            `"${formatDateDisplay(date)}"`,
            `"${entry.task}"`,
            `"${entry.hours}h"`,
            `"${entry.description}"`
          ]
          csvContent += row.join(",") + "\r\n"
        })
      })
      
      // Create blob with proper MIME type
      const blob = new Blob([csvContent], { 
        type: 'application/vnd.ms-excel;charset=utf-8;' 
      })
      
      // Create download link
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `timesheet-${periodType}-${new Date().toISOString().split('T')[0]}.csv`
      
      // Trigger download
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      // Cleanup
      setTimeout(() => {
        window.URL.revokeObjectURL(url)
      }, 100)
      
      console.log('Download initiated successfully')
    } catch (error) {
      console.error('Download error:', error)
      alert('Download failed. Please try again.')
    }
  }

  const goToCurrentPeriod = () => {
    if (viewMode === "Weekly") {
      setCurrentWeekStart(getCurrentMondayStart())
    } else {
      setCurrentMonthRange(getCurrentMonthRange())
    }
  }

  const handleCellClick = (date) => {
    setSelectedCell({ date })
    setShowLogTimeModal(true)
  }

  const handleCellHover = (date, isHovering) => {
    if (isHovering) {
      setHoveredCell({ date })
    } else {
      setHoveredCell(null)
    }
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm flex-shrink-0">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
                  <Calendar className="h-4 w-4 text-white" />
                </div>
                <h1 className="text-xl font-semibold text-gray-900">Manage Timesheet</h1>
              </div>
              <div className="text-sm text-gray-500">
                JIRA &gt; Manage Timesheet
              </div>
            </div>
            <div className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded">
              Admin
            </div>
          </div>
        </div>
      </div>

      {/* Navigation and Controls */}
      <div className="bg-white border-b border-gray-200 flex-shrink-0">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* View Mode Toggle */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode("Weekly")}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    viewMode === "Weekly" 
                      ? "bg-blue-600 text-white shadow-sm" 
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Weekly
                </button>
                <button
                  onClick={() => setViewMode("Monthly")}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    viewMode === "Monthly" 
                      ? "bg-blue-600 text-white shadow-sm" 
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Monthly
                </button>
              </div>

              {/* Period Navigation */}
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => navigatePeriod("prev")}
                  className="p-2 hover:bg-white rounded-md transition-colors"
                >
                  <ChevronLeft className="h-4 w-4 text-gray-600" />
                </button>
                <button
                  onClick={goToCurrentPeriod}
                  className="px-4 py-2 text-sm font-medium text-gray-900 hover:bg-white rounded-md transition-colors min-w-[200px]"
                >
                  {getCurrentDateString()}
                </button>
                <button
                  onClick={() => navigatePeriod("next")}
                  className="p-2 hover:bg-white rounded-md transition-colors"
                >
                  <ChevronRight className="h-4 w-4 text-gray-600" />
                </button>
              </div>

              <div className="text-sm text-gray-500">
                Timesheet
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Show Weekend Toggle - Now available for both views */}
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={showWeekend}
                  onChange={(e) => setShowWeekend(e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Show Weekend</span>
              </label>

              {/* Action Buttons */}
              <button className="flex items-center space-x-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <span>📋</span>
                <span>Copy Last Week</span>
              </button>
              
              <button
                onClick={downloadExcel}
                className="flex items-center space-x-2 px-3 py-2 bg-orange-500 text-white text-sm rounded-lg hover:bg-orange-600 transition-colors"
              >
                <Download className="h-4 w-4" />
                <span>Download Excel</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white border-b border-gray-200 flex-shrink-0">
        <div className="px-6 py-3">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-700">0 Hrs</span>
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full" style={{ width: `${Math.min((getTotalHours() / 40) * 100, 100)}%` }}></div>
            </div>
            <span className="text-sm font-medium text-gray-700">40 Hrs</span>
            <span className="text-sm font-medium text-green-600">
              {getTotalHours()} Hrs
            </span>
          </div>
        </div>
      </div>

      {/* Timesheet Table */}
      <div className="flex-1 overflow-hidden p-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full flex flex-col">
          <div className="flex-1 overflow-auto">
            <table className="w-full min-w-max">
              <thead className="sticky top-0 z-10">
                <tr className="bg-gray-50 border-b border-gray-200">
                  {getVisibleDates().map((date) => (
                    <th key={date.toISOString()} className="px-4 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px]">
                      <div className="flex flex-col items-center">
                        <span>{getDayName(date)}, {date.getDate()} {date.toLocaleDateString('en-GB', { month: 'short' })}</span>
                        <span className="text-xs text-gray-400 mt-1">{getDayTotalHours(date)}H/8H</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white">
                <tr>
                  {getVisibleDates().map((date) => {
                    const entries = getTimeEntries(date)
                    const isToday = date.toDateString() === new Date().toDateString()
                    const isHovered = hoveredCell?.date.toDateString() === date.toDateString()
                    
                    return (
                      <td 
                        key={date.toISOString()} 
                        className={`px-4 py-6 text-center relative min-w-[200px] align-top ${isToday ? 'bg-blue-50' : ''} border-r border-gray-100`}
                        onMouseEnter={() => handleCellHover(date, true)}
                        onMouseLeave={() => handleCellHover(date, false)}
                      >
                        <div className="space-y-3 min-h-[400px]">
                          {/* Existing Time Entries - Only showing data that was actually logged */}
                          {entries.map((entry, index) => (
                            <div 
                              key={entry.id} 
                              className="bg-gray-50 border border-gray-200 rounded-lg p-3 hover:bg-gray-100 transition-colors group relative"
                            >
                              <button
                                onClick={() => deleteTimeEntry(date, entry.id)}
                                className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700"
                              >
                                <X className="h-3 w-3" />
                              </button>
                              <div className="text-sm font-medium text-gray-900 mb-1">
                                {entry.hours}h
                              </div>
                              <div className="text-xs text-blue-600 font-medium mb-1">
                                {entry.task}
                              </div>
                              {/* Removed percentage display */}
                              {entry.description && (
                                <div className="text-xs text-gray-500 truncate">
                                  {entry.description}
                                </div>
                              )}
                            </div>
                          ))}
                          
                          {/* Add New Entry Button */}
                          <div className="flex items-center justify-center">
                            {isHovered && (
                              <button 
                                onClick={() => handleCellClick(date)}
                                className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors shadow-lg"
                              >
                                <Plus className="h-5 w-5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </td>
                    )
                  })}
                </tr>
              </tbody>
            </table>
          </div>

          {/* Submit Button */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end flex-shrink-0">
            <button className="flex items-center space-x-2 px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium">
              <span>📤</span>
              <span>Submit Timesheet</span>
            </button>
          </div>
        </div>
      </div>

      {/* Log Time Modal */}
      <LogTimeModal 
        isOpen={showLogTimeModal}
        onClose={() => {
          setShowLogTimeModal(false)
          setSelectedCell(null)
        }}
        selectedDate={selectedCell ? formatDateDisplay(selectedCell.date) : ''}
        onSave={handleLogTimeSave}
      />
    </div>
  )
}

export default TimesheetManager