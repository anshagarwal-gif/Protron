import { useState, useEffect } from "react";
import axios from "axios";
import { ChevronLeft, ChevronRight, Calendar, Download, Plus, X } from "lucide-react";
import LogTimeModal from "./LogTimeModal";
import { CheckCircle, XCircle, FileText, Calendar as CalendarIcon, Folder } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_URL;

// Helper functions
const formatDate = (date) =>
  date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" });
const formatDateKey = (date) => date.toISOString().split("T")[0];
const formatDateDisplay = (date) =>
  date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" });

const getCurrentMondayStart = () => {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(today);
  monday.setDate(today.getDate() + daysToMonday);
  monday.setHours(0, 0, 0, 0);
  return monday;
};

const getCurrentMonthRange = () => {
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  const dayOfWeek = firstDay.getDay();
  const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const startMonday = new Date(firstDay);
  startMonday.setDate(firstDay.getDate() + daysToMonday);
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  return { start: startMonday, end: lastDay };
};

const TimesheetManager = () => {
  const [editingTask, setEditingTask] = useState(null);
  const [viewMode, setViewMode] = useState("Weekly");
  const [currentWeekStart, setCurrentWeekStart] = useState(getCurrentMondayStart());
  const [currentMonthRange, setCurrentMonthRange] = useState(getCurrentMonthRange());
  const [showWeekend, setShowWeekend] = useState(false);
  const [showLogTimeModal, setShowLogTimeModal] = useState(false);
  const [selectedCell, setSelectedCell] = useState(null);
  const [hoveredCell, setHoveredCell] = useState(null);
  const [timesheetData, setTimesheetData] = useState({});
  const [taskDetail, setTaskDetail] = useState(null); // For modal

  const fetchTasks = async () => {
    const dates = getVisibleDates();
    if (!dates.length) return;
    const start = dates[0].toISOString().split("T")[0];
    const end = dates[dates.length - 1].toISOString().split("T")[0];
    try {
      const res = await axios.get(
        `${API_BASE_URL}/api/timesheet-tasks/between?start=${start}&end=${end}`,
        {
          headers: {
            Authorization: sessionStorage.getItem("token"),
          },
        }
      );
      // Group tasks by date
      const grouped = {};
      res.data.forEach((task) => {
        const dateKey = task.date.split("T")[0];
        if (!grouped[dateKey]) grouped[dateKey] = [];
        grouped[dateKey].push({
          id: task.taskId,
          hours: task.hoursSpent,
          description: task.description,
          task: task.taskType,
          project: task.project?.projectName || "",
          submitted: task.submitted,
          attachment: task.attachment,
          fullTask: task,
        });
      });
      setTimesheetData(grouped);
    } catch (err) {
      console.error("Failed to fetch tasks", err);
    }
  };

  // Update useEffect to use fetchTasks
  useEffect(() => {
    fetchTasks();
    // eslint-disable-next-line
  }, [viewMode, currentWeekStart, currentMonthRange, showWeekend]);

  const getWeekDates = (startDate) => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const getMonthDates = () => {
    const dates = [];
    const current = new Date(currentMonthRange.start);
    while (current <= currentMonthRange.end) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return dates;
  };

  const getCurrentDates = () => (viewMode === "Weekly" ? getWeekDates(currentWeekStart) : getMonthDates());

  const getCurrentDateString = () => {
    if (viewMode === "Weekly") {
      const endDate = new Date(currentWeekStart);
      endDate.setDate(currentWeekStart.getDate() + 6);
      return `${formatDate(currentWeekStart)} - ${formatDate(endDate)}`;
    } else {
      return `${formatDate(currentMonthRange.start)} - ${formatDate(currentMonthRange.end)}`;
    }
  };

  const getVisibleDates = () => {
    const allDates = getCurrentDates();
    if (showWeekend) return allDates;
    return allDates.filter((date) => {
      const dayOfWeek = date.getDay();
      return dayOfWeek !== 0 && dayOfWeek !== 6;
    });
  };

  const getDayName = (date) => date.toLocaleDateString("en-GB", { weekday: "short" });

  const getTimeEntries = (date) => {
    const dateKey = formatDateKey(date);
    return timesheetData[dateKey] || [];
  };

  const getDayTotalHours = (date) => {
    const entries = getTimeEntries(date);
    const total = entries.reduce((total, entry) => total + (entry.hours || 0), 0);
    return Math.round(total * 100) / 100; // Round to 2 decimal places
  };

  const getTotalHoursForPeriod = () => {
    const dates = getVisibleDates();
    let total = 0;
    dates.forEach(date => {
      total += getDayTotalHours(date);
    });
    return Math.round(total * 100) / 100;
  };

  // Navigation
  const navigatePeriod = (direction) => {
    if (viewMode === "Weekly") {
      const newWeekStart = new Date(currentWeekStart);
      newWeekStart.setDate(currentWeekStart.getDate() + (direction === "next" ? 7 : -7));
      setCurrentWeekStart(newWeekStart);
    } else {
      const currentMonth = currentMonthRange.start.getMonth();
      const currentYear = currentMonthRange.start.getFullYear();
      let newMonth = direction === "next" ? currentMonth + 1 : currentMonth - 1;
      let newYear = currentYear;
      if (newMonth > 11) {
        newMonth = 0;
        newYear++;
      } else if (newMonth < 0) {
        newMonth = 11;
        newYear--;
      }
      // Always use the first and last day of the new month
      const firstDay = new Date(newYear, newMonth, 1);
      const lastDay = new Date(newYear, newMonth + 1, 0);
      setCurrentMonthRange({ start: firstDay, end: lastDay });
    }
  };

  const goToCurrentPeriod = () => {
    if (viewMode === "Weekly") {
      setCurrentWeekStart(getCurrentMondayStart());
    } else {
      setCurrentMonthRange(getCurrentMonthRange());
    }
  };

  // Modal handlers
  const handleCellClick = (date) => {
    setSelectedCell({ date });
    setShowLogTimeModal(true);
  };

  const handleCellHover = (date, isHovering) => {
    setHoveredCell(isHovering ? { date } : null);
  };

  // Save handler for LogTimeModal
  const handleLogTimeSave = async (taskData) => {
  if (editingTask) {
    console.log({
          ...taskData,
          date: editingTask.date.toISOString().split("T")[0], // or use taskData.date if you allow editing date
        })
    // Edit mode
    try {
      const res = await axios.put(
        `${API_BASE_URL}/api/timesheet-tasks/edit/${editingTask.id}`,
        {
          taskType: taskData.taskType,
          hoursSpent: taskData.hoursSpent,
          description: taskData.description,
          projectId: taskData.project?.projectId || null, // Ensure projectId is passed correctly
          attachment: taskData.attachment || null, // Handle optional attachment
          date: new Date(editingTask.date), // or use taskData.date if you allow editing date
        },
        {
          headers: {
            Authorization: sessionStorage.getItem("token"),
          },
        }
      );
      // Update UI
      const dateKey = editingTask.date.toISOString().split("T")[0];
      setTimesheetData((prev) => ({
        ...prev,
        [dateKey]: prev[dateKey].map((entry) =>
          entry.id === editingTask.id
            ? {
                ...entry,
                ...res.data,
                hours: res.data.hoursSpent,
                description: res.data.description,
                task: res.data.taskType,
                project: res.data.project?.projectName || "",
                submitted: res.data.submitted,
                attachment: res.data.attachment,
                fullTask: res.data,
              }
            : entry
        ),
      }));
    } catch (err) {
      alert("Failed to update task.");
    }
    setEditingTask(null);
    setShowLogTimeModal(false);
    setSelectedCell(null);
  } else {
    const dateKey = taskData.date.split("T")[0];
    setTimesheetData((prev) => ({
      ...prev,
      [dateKey]: [
        ...(prev[dateKey] || []),
        {
          id: taskData.taskId,
          hours: taskData.hoursSpent,
          description: taskData.description,
          task: taskData.taskType,
          project: taskData.project?.projectName || "",
          submitted: taskData.submitted,
          attachment: taskData.attachment,
          fullTask: taskData,
        },
      ],
    }));
    setShowLogTimeModal(false);
    setSelectedCell(null);
  }
};

  const deleteTimeEntry = async (date, entryId) => {
    try {
      await axios.delete(`${API_BASE_URL}/api/timesheet-tasks/delete/${entryId}`, {
        headers: {
          Authorization: sessionStorage.getItem("token"),
        },
      });
      const dateKey = formatDateKey(date);
      setTimesheetData((prev) => ({
        ...prev,
        [dateKey]: prev[dateKey]?.filter((entry) => entry.id !== entryId) || [],
      }));
    } catch (error) {
      alert("Failed to delete entry. Please try again.");
    }
  };

  const handleSubmitTimesheet = async () => {
    // Get visible dates for the current period
    const dates = getVisibleDates();
    if (!dates.length) return;
    const start = dates[0].toISOString().split("T")[0];
    const end = dates[dates.length - 1].toISOString().split("T")[0];

    try {
      await axios.post(
        `${API_BASE_URL}/api/timesheet-tasks/submit?start=${start}&end=${end}`,
        {},
        {
          headers: {
            Authorization: sessionStorage.getItem("token"),
          },
        }
      );
      // Option 1: Refetch tasks for real-time update (recommended for accuracy)
      fetchTasks();
      // Option 2: If you want to update manually for performance, you could do:
      // setTimesheetData(prev => {
      //   const updated = { ...prev };
      //   dates.forEach(date => {
      //     const key = date.toISOString().split("T")[0];
      //     if (updated[key]) {
      //       updated[key] = updated[key].map(entry => ({ ...entry, submitted: true }));
      //     }
      //   });
      //   return updated;
      // });
    } catch (error) {
      alert("Failed to submit timesheet. Please try again.");
    }
  };

  const hasUnsubmittedTasks = () => {
    const dates = getVisibleDates();
    for (const date of dates) {
      const entries = getTimeEntries(date);
      if (entries.some(entry => !entry.submitted)) {
        return true;
      }
    }
    return false;
  };

  const handleCopyLastWeek = async () => {
    // Only allow in Weekly view
    if (viewMode !== "Weekly") {
      alert("Copy Last Week is only available in Weekly view.");
      return;
    }
    // Calculate last week's start and end dates
    const lastWeekStart = new Date(currentWeekStart);
    lastWeekStart.setDate(currentWeekStart.getDate() - 7);
    const lastWeekEnd = new Date(currentWeekStart);
    lastWeekEnd.setDate(currentWeekStart.getDate() - 1);

    const start = lastWeekStart.toISOString().split("T")[0];
    const end = lastWeekEnd.toISOString().split("T")[0];

    try {
      await axios.post(
        `${API_BASE_URL}/api/timesheet-tasks/copy-last-week?start=${start}&end=${end}`,
        {},
        {
          headers: {
            Authorization: sessionStorage.getItem("token"),
          },
        }
      );
      // Refresh data after copy
      setTimeout(() => {
        // Give backend a moment to process, then refetch
        fetchTasks();
      }, 500);
    } catch (error) {
      alert("Failed to copy last week. Please try again.");
    }
  };

  // Download as CSV
  const downloadExcel = () => {
    try {
      const dates = getVisibleDates();
      const periodType = viewMode === "Weekly" ? "week" : "month";
      const BOM = "\uFEFF";
      const headers = ["Date", "Task", "Hours", "Description"];
      let csvContent = BOM + headers.map((h) => `"${h}"`).join(",") + "\r\n";
      dates.forEach((date) => {
        const entries = getTimeEntries(date);
        entries.forEach((entry) => {
          const row = [
            `"${formatDateDisplay(date)}"`,
            `"${entry.task}"`,
            `"${entry.hours}h"`,
            `"${entry.description}"`,
          ];
          csvContent += row.join(",") + "\r\n";
        });
      });
      const blob = new Blob([csvContent], {
        type: "application/vnd.ms-excel;charset=utf-8;",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `timesheet-${periodType}-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 100);
    } catch (error) {
      alert("Download failed. Please try again.");
    }
  };

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm flex-shrink-0">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-green-700 rounded flex items-center justify-center">
                  <Calendar className="h-4 w-4 text-white" />
                </div>
                <h1 className="text-xl font-semibold text-gray-900">Manage Timesheet</h1>
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
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${viewMode === "Weekly"
                    ? "bg-green-700 text-white shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                    }`}
                >
                  Weekly
                </button>
                <button
                  onClick={() => setViewMode("Monthly")}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${viewMode === "Monthly"
                    ? "bg-green-700 text-white shadow-sm"
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

              <div className="text-sm text-gray-500">Timesheet</div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Show Weekend Toggle */}
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
              <button
                className="flex items-center space-x-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                onClick={handleCopyLastWeek}
              >
                <span>📋</span>
                <span>Copy Last Week</span>
              </button>

              <button
                onClick={downloadExcel}
                className="flex items-center space-x-2 px-3 py-2 bg-green-700 text-white text-sm rounded-lg hover:bg-green-600 transition-colors"
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
            <span className="text-sm font-medium text-gray-700">{getTotalHoursForPeriod()} Hrs</span>
            <div className="flex-1 bg-gray-200 rounded-full h-2 relative">
              <div
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min((getTotalHoursForPeriod() / 40) * 100, 100)}%`
                }}
              ></div>
            </div>
            <span className="text-sm font-medium text-gray-700">40 Hrs</span>
            <span className="text-sm font-medium text-green-600">
              {getTotalHoursForPeriod() >= 40 ? "✅" : ""}
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
                    <th
                      key={date.toISOString()}
                      className="px-4 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px]"
                    >
                      <div className="flex flex-col items-center">
                        <span>
                          {getDayName(date)}, {date.getDate()} {date.toLocaleDateString("en-GB", { month: "short" })}
                        </span>
                        <span className="text-xs text-gray-400 mt-1">{getDayTotalHours(date)}H/8H</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white">
                <tr>
                  {getVisibleDates().map((date) => {
                    const entries = getTimeEntries(date);
                    const isToday = date.toDateString() === new Date().toDateString();
                    const isHovered = hoveredCell?.date.toDateString() === date.toDateString();

                    return (
                      <td
                        key={date.toISOString()}
                        className={`px-4 py-6 text-center relative min-w-[200px] align-top ${isToday ? "bg-blue-50" : ""
                          } border-r border-gray-100`}
                        onMouseEnter={() => handleCellHover(date, true)}
                        onMouseLeave={() => handleCellHover(date, false)}
                      >
                        <div className="space-y-3 min-h-[400px]">
                          {/* Existing Time Entries */}
                          {entries.map((entry) => (
                            <div
                              key={entry.id}
                              className={`border rounded-lg p-4 hover:shadow-md transition group relative cursor-pointer flex flex-col justify-between min-h-[110px]
      ${entry.submitted ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}
    `}
                              onClick={() => setTaskDetail(entry.fullTask)}
                              style={{ boxSizing: "border-box" }}
                            >
                              {!entry.submitted && (
                                <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={e => { e.stopPropagation(); deleteTimeEntry(date, entry.id); }}
                                    className="text-red-500 hover:text-red-700"
                                    title="Delete"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={e => { e.stopPropagation(); setEditingTask({ ...entry, date }); setShowLogTimeModal(true); }}
                                    className="text-blue-500 hover:text-blue-700"
                                    title="Edit"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13l6-6m2 2l-6 6m-2 2h6a2 2 0 002-2v-6a2 2 0 00-2-2h-6a2 2 0 00-2 2v6a2 2 0 002 2z" /></svg>
                                  </button>
                                </div>
                              )}
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <FileText className="h-4 w-4 text-blue-500" />
                                  <span className="text-base font-semibold text-gray-900">{entry.hours}h</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-semibold text-blue-600">{entry.task}</span>
                                  {entry.project && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded bg-green-100 text-green-800 text-xs font-semibold">
                                      <Folder className="h-3 w-3 mr-1" /> {entry.project}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex-1 flex items-end">
                                <div className={`w-full text-xs text-gray-600 rounded px-2 py-1 mt-1 min-h-[32px] ${!entry.description ? "italic text-gray-400" : ""}`}>
                                  {entry.description ? entry.description : "No description"}
                                </div>
                              </div>
                              <div className="mt-2 flex items-center gap-2">
                                {entry.submitted ? (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded bg-green-200 text-green-800 text-xs font-semibold">
                                    <CheckCircle className="h-3 w-3 mr-1" /> Submitted
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded bg-red-200 text-red-800 text-xs font-semibold">
                                    <XCircle className="h-3 w-3 mr-1" /> Not Submitted
                                  </span>
                                )}
                                {entry.attachment && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-xs font-semibold ml-2">
                                    <FileText className="h-3 w-3 mr-1" /> Attachment
                                  </span>
                                )}
                              </div>
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
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>

          {/* Submit Button */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end flex-shrink-0">
            <button
              className="flex items-center space-x-2 px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleSubmitTimesheet}
              disabled={!hasUnsubmittedTasks()}
            >
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
          setShowLogTimeModal(false);
          setSelectedCell(null);
          setEditingTask(null);
        }}
        selectedDate={selectedCell ? selectedCell.date : null}
        onSave={handleLogTimeSave}
        editingTask={editingTask?.fullTask? editingTask.fullTask : null}
      />

      {taskDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-200/60 backdrop-blur-sm backdrop-brightness-95">
          <div className="bg-white rounded-xl shadow-2xl p-8 min-w-[350px] max-w-[90vw] border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <FileText className="h-6 w-6 text-blue-500" />
                <h2 className="text-xl font-bold">Task Details</h2>
              </div>
              <button onClick={() => setTaskDetail(null)} className="text-gray-400 hover:text-gray-700">
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="font-semibold">Task Type:</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-xs font-semibold">
                  {taskDetail.taskType}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-gray-500" />
                <span className="font-semibold">Date:</span>
                <span>{formatDateDisplay(new Date(taskDetail.date))}</span>
              </div>
              <div className="flex items-center gap-2">
                <Folder className="h-4 w-4 text-green-600" />
                <span className="font-semibold">Project:</span>
                <span>{taskDetail.project?.projectName || "-"}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">Hours:</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded bg-orange-100 text-orange-800 text-xs font-semibold">
                  {taskDetail.hoursSpent}
                </span>
              </div>
              <div>
                <span className="font-semibold">Description:</span>
                <div className="text-gray-700 mt-1">{taskDetail.description}</div>
              </div>
              <div>
                <span className="font-semibold">Status:</span>
                {taskDetail.submitted ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded bg-green-200 text-green-800 text-xs font-semibold ml-2">
                    <CheckCircle className="h-4 w-4 mr-1" /> Submitted
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded bg-red-200 text-red-800 text-xs font-semibold ml-2">
                    <XCircle className="h-4 w-4 mr-1" /> Not Submitted
                  </span>
                )}
              </div>
              {taskDetail.attachment && (
                <div>
                  <span className="font-semibold">Attachment:</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-xs font-semibold ml-2">
                    [File Attached]
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimesheetManager;