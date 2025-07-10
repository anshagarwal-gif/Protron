// TimesheetManager.jsx
import { useState, useEffect } from "react";
import axios from "axios";
import { ChevronLeft, ChevronRight, Calendar, Download, Plus, X, Eye, Download as DownloadIcon, Trash2, SquarePen } from "lucide-react";
import LogTimeModal from "./LogTimeModal";
import { CheckCircle, XCircle, FileText, Calendar as CalendarIcon, Folder } from "lucide-react";
import { Link } from "react-router-dom";
import { useAccess } from "../Context/AccessContext";

const API_BASE_URL = import.meta.env.VITE_API_URL;

// Helper functions
const formatDate = (date) =>
  date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" });
const formatDateKey = (date) => date.toISOString().split("T")[0];
const formatDateDisplay = (date) =>
  date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" });

// Truncate function for project names
const truncateText = (text, maxLength = 15) => {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
};
const isWeekend = (date) => {
  const day = date.getDay();
  return day === 0 || day === 6; // Sunday (0) or Saturday (6)
};
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

// Toast Component
const Toast = ({ message, type, isVisible, onClose }) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 4000); // Auto-hide after 4 seconds
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  const bgColor = type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500';
  const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';

  return (
    <div className={`fixed top-4 right-4 z-50 ${bgColor} text-white px-6 py-4 rounded-lg shadow-lg transform transition-all duration-300 ease-in-out ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0'
      }`}>
      <div className="flex items-center space-x-3">
        <span className="text-lg">{icon}</span>
        <span className="font-medium">{message}</span>
        <button
          onClick={onClose}
          className="ml-4 text-white hover:text-gray-200 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

const TimesheetManager = () => {
  const [editingTask, setEditingTask] = useState(null);
  const [viewMode, setViewMode] = useState("Weekly");
  const [currentWeekStart, setCurrentWeekStart] = useState(getCurrentMondayStart());
  const [currentMonthRange, setCurrentMonthRange] = useState(getCurrentMonthRange());
  const [showLogTimeModal, setShowLogTimeModal] = useState(false);
  const [selectedCell, setSelectedCell] = useState(null);
  const [hoveredCell, setHoveredCell] = useState(null);
  const [timesheetData, setTimesheetData] = useState({});
  const [taskDetail, setTaskDetail] = useState(null);
  const { hasAccess } = useAccess();

  // Toast state
  const [toast, setToast] = useState({
    isVisible: false,
    message: '',
    type: 'info' // 'success', 'error', 'info'
  });

  // Dynamic hour targets based on view mode
  const getTargetHours = () => {
    return viewMode === "Weekly" ? 40 : 184;
  };

  // Toast helper function
  const showToast = (message, type = 'info') => {
    setToast({
      isVisible: true,
      message,
      type
    });
  };

  const hideToast = () => {
    setToast(prev => ({ ...prev, isVisible: false }));
  };

  // Attachment handling functions with better error handling
 
// Updated attachment handling functions
const handleViewAttachment = async (taskId, attachmentId = null) => {
  try {
    showToast("Loading attachment...", "info");

    // Use specific attachment ID if provided, otherwise get first attachment
    const url = attachmentId 
      ? `${API_BASE_URL}/api/timesheet-tasks/attachments/${attachmentId}`
      : `${API_BASE_URL}/api/timesheet-tasks/${taskId}/attachment`; // Fallback to old endpoint

    const response = await axios.get(url, {
      headers: {
        Authorization: sessionStorage.getItem("token"),
      },
      responseType: 'blob',
      timeout: 30000
    });

    if (!response.data || response.data.size === 0) {
      showToast("Attachment file is empty or not found", "error");
      return;
    }

    const contentType = response.headers['content-type'] || 'application/octet-stream';
    const blob = new Blob([response.data], { type: contentType });
    const url_blob = window.URL.createObjectURL(blob);

    const newWindow = window.open(url_blob, '_blank');

    if (!newWindow || newWindow.closed || typeof newWindow.closed == 'undefined') {
      showToast("Popup blocked. Starting download instead...", "info");
      const link = document.createElement('a');
      link.href = url_blob;
      link.download = `attachment_${taskId}_${attachmentId || 'default'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      showToast("Attachment opened successfully!", "success");
    }

    setTimeout(() => {
      window.URL.revokeObjectURL(url_blob);
    }, 5000);

  } catch (error) {
    console.error("Failed to view attachment:", error);
    if (error.response?.status === 404) {
      showToast("Attachment not found or has been deleted", "error");
    } else {
      showToast("Failed to open attachment", "error");
    }
  }
};

const handleDownloadAttachment = async (taskId, attachmentId = null, fileName = null) => {
  try {
    showToast("Downloading attachment...", "info");

    const url = attachmentId 
      ? `${API_BASE_URL}/api/timesheet-tasks/attachments/${attachmentId}`
      : `${API_BASE_URL}/api/timesheet-tasks/${taskId}/attachment`;

    const response = await axios.get(url, {
      headers: {
        Authorization: sessionStorage.getItem("token"),
      },
      responseType: 'blob',
      timeout: 60000
    });

    if (!response.data || response.data.size === 0) {
      showToast("Attachment file is empty or not found", "error");
      return;
    }

    const contentDisposition = response.headers['content-disposition'];
    let downloadFileName = fileName || `attachment_${taskId}_${attachmentId || 'default'}`;

    if (contentDisposition) {
      const fileNameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (fileNameMatch && fileNameMatch[1]) {
        downloadFileName = fileNameMatch[1].replace(/['"]/g, '');
      }
    }

    const contentType = response.headers['content-type'] || 'application/octet-stream';
    const blob = new Blob([response.data], { type: contentType });
    const url_blob = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url_blob;
    link.download = downloadFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      window.URL.revokeObjectURL(url_blob);
    }, 1000);

    showToast("Attachment downloaded successfully!", "success");
  } catch (error) {
    console.error("Failed to download attachment:", error);
    showToast("Failed to download attachment", "error");
  }
};
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
        
      // Updated attachment handling - check for new attachments array
      const hasAttachments = task.attachments && task.attachments.length > 0;

      console.log("Task attachment data:", {
        taskId: task.taskId,
        hasAttachments: hasAttachments,
        attachmentCount: task.attachments ? task.attachments.length : 0,
        attachments: task.attachments
      });

        grouped[dateKey].push({
          id: task.taskId,
          hours: task.hoursSpent,
          description: task.description,
          task: task.taskType,
          project: task.project?.projectName || "",
          submitted: task.submitted,
       attachment: hasAttachments, // Boolean for backward compatibility
        attachments: task.attachments || [], // New: array of attachments
        attachmentCount: task.attachments ? task.attachments.length : 0,
        attachmentUrl: hasAttachments ? `${API_BASE_URL}/api/timesheet-tasks/${task.taskId}/attachments` : null,
     
          fullTask: task,
        });
      });
      setTimesheetData(grouped);
    } catch (err) {
      console.error("Failed to fetch tasks", err);
      showToast("Failed to fetch tasks", "error");
    }
  };

  // Update useEffect to use fetchTasks
  useEffect(() => {
    fetchTasks();
    // eslint-disable-next-line
  }, [viewMode, currentWeekStart, currentMonthRange]);

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
    return allDates
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
    fetchTasks();
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
          `${API_BASE_URL}/api/timesheet-tasks/edit/${editingTask.taskId}`,
          {
            taskType: taskData.taskType,
            hoursSpent: taskData.hoursSpent,
            description: taskData.description,
            projectId: taskData.projectId || null, // Ensure projectId is passed correctly
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
            entry.id === editingTask.taskId
              ? {
                ...entry,
                ...res.data,
                id: res.data.taskId,
                hours: res.data.hoursSpent,
                description: res.data.description,
                task: res.data.taskType,
                project: res.data.project?.projectName || "",
                submitted: res.data.submitted,
                attachment: res.data.attachment,
                attachmentUrl: res.data.attachment ? `${API_BASE_URL}/api/timesheet-tasks/${res.data.taskId}/attachment` : null,
                fullTask: res.data,
              }
              : entry
          ),
        }));
        showToast("Task updated successfully!", "success");
      } catch (err) {
        showToast("Failed to update task", "error");
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
            attachmentUrl: taskData.attachment ? `${API_BASE_URL}/api/timesheet-tasks/${taskData.taskId}/attachment` : null,
            fullTask: taskData,
          },
        ],
      }));
      showToast("Task added successfully!", "success");
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
      showToast("Task deleted successfully!", "success");
    } catch (error) {
      showToast("Failed to delete task", "error");
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
      showToast("Timesheet submitted successfully! 🎉", "success");
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
      showToast("Failed to submit timesheet", "error");
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
      showToast("Copy Last Week is only available in Weekly view", "error");
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
      showToast("Last week's tasks copied successfully!", "success");
    } catch (error) {
      showToast("Failed to copy last week's tasks", "error");
    }
  };
  

  // Download as CSV with attachment information
  const downloadExcel = () => {
    try {
      const dates = getVisibleDates();
      const periodType = viewMode === "Weekly" ? "week" : "month";
      const BOM = "\uFEFF";
      const headers = ["Date", "Task", "Hours", "Description", "Project"];
      let csvContent = BOM + headers.map((h) => `"${h}"`).join(",") + "\r\n";
      dates.forEach((date) => {
        const entries = getTimeEntries(date);
        entries.forEach((entry) => {
          const row = [
            `"${formatDateDisplay(date)}"`,
            `"${entry.task}"`,
            `"${entry.hours}h"`,
            `"${entry.description}"`,
            `"${entry.project}"`,

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
      showToast("Timesheet downloaded successfully!", "success");
    } catch (error) {
      showToast("Download failed", "error");
    }
  };

  const renderMonthlyView = () => {
    let dates = getMonthDates();

    // Create an array for grid cells (including empty cells for alignment)
    const gridCells = [null].concat(dates);
 return (
      <div className={`grid grid-cols-11 gap-0 p-3 bg-white rounded-lg shadow-sm border border-gray-200 h-full`}>
        {gridCells.map((date, index) => {
          if (!date) {
            // Render the single empty cell
            return (
              <div
                key={index}
                className="border border-gray-200 bg-gray-50"
                style={{
                  aspectRatio: "5/6",
                }}
              ></div>
            );
          }

          const entries = getTimeEntries(date);
          const isToday = date.toDateString() === new Date().toDateString();
          const isWeekendDay = isWeekend(date);
          const maxVisibleTasks = 5;
          const visibleTasks = entries.slice(0, maxVisibleTasks);
          const overflowTasks = entries.slice(maxVisibleTasks);
          const remainingTasksCount = overflowTasks.length;
          const dateKey = date.toISOString();
          const isOverflowOpen = showOverflowTasks && overflowTasksDate === dateKey;

          return (
            <div
              key={dateKey}
              className={`relative cursor-pointer border p-2 transition-all duration-200 ${
                isOverflowOpen
                  ? "border-blue-400 bg-blue-50 shadow-md z-20"
                  : `border-gray-200 ${
                      isToday 
                        ? "bg-blue-50" 
                        : isWeekendDay 
                          ? "bg-gray-100" 
                          : "bg-white"
                    }`
              }`}
              style={{
                aspectRatio: "5/6"
              }}
              onClick={(e) => {
                // Prevent modal opening if clicking on a task
                if (e.target.closest(".task-entry")) return;
                handleCellClick(date);
              }}
            >
              <div className={`text-xs font-medium ${isWeekendDay ? 'text-gray-600' : 'text-gray-500'}`}>
                {date.getDate()} {date.toLocaleDateString("en-GB", { month: "short" })}
              </div>

              <div className="space-y-1 mt-2">
                {/* Visible tasks */}
                {visibleTasks.map((entry) => (
                  <div
                    key={entry.id}
                    className={`task-entry border pl-2 text-xs text-gray-700 truncate flex items-center gap-1 hover:opacity-80 transition-opacity ${
                      entry.submitted ? "bg-green-200 border-green-200" : "bg-red-200 border-red-200"
                    } ${isWeekendDay ? 'opacity-90' : ''}`}
                    title={`${entry.task} - ${entry.hours}h - ${entry.project}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setTaskDetail(entry.fullTask);
                    }}
                  >
                    <span className="font-semibold">{entry.task}</span>
                    <span className="text-gray-500">{entry.hours}h</span>
                  </div>
                ))}

                {/* Show more button */}
                {remainingTasksCount > 0 && (
                  <div
                    className={`task-entry border pl-2 text-xs text-gray-700 truncate flex items-center gap-1 bg-blue-100 border-blue-200 cursor-pointer hover:bg-blue-200 transition-colors ${
                      isWeekendDay ? 'opacity-90' : ''
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowOverflowTasks(!isOverflowOpen);
                      setOverflowTasksDate(isOverflowOpen ? null : dateKey);
                    }}
                  >
                    <span className="font-semibold">
                      {isOverflowOpen ? `- Hide ${remainingTasksCount} tasks` : `+ ${remainingTasksCount} more tasks`}
                    </span>
                  </div>
                )}
              </div>

              {/* Overflow tasks dropdown */}
              {isOverflowOpen && (
                <div
                  className="absolute left-0 right-0 z-30 bg-white border-2 border-blue-400 rounded-lg shadow-2xl max-h-52 overflow-y-auto ring-4 ring-blue-100"
                  style={{
                    // Position dropdown above if it's in the last few rows, below otherwise
                    ...(index >= gridCells.length - 22
                      ? { bottom: '100%', marginBottom: '8px' }
                      : { top: '100%', marginTop: '8px' })
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="pb-3">
                    <div className="text-xs font-semibold text-blue-700 mb-2 border-b border-blue-200 pb-2 bg-blue-50 p-3 rounded-t-lg flex items-center justify-between">
                      <span>Additional tasks for {date.getDate()} {date.toLocaleDateString("en-GB", { month: "short" })}</span>
                    </div>
                    <div className="space-y-2 px-2">
                      {overflowTasks.map((entry) => (
                        <div
                          key={entry.id}
                          className={`task-entry border pl-2 text-xs text-gray-700 truncate flex items-center gap-1 hover:opacity-80 transition-opacity ${entry.submitted ? "bg-green-200 border-green-200" : "bg-red-200 border-red-200"}`}
                          title={`${entry.task} - ${entry.hours}h - ${entry.project}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setTaskDetail(entry.fullTask);
                          }}
                        >
                          <span className="font-semibold">{entry.task}</span>
                          <span className="text-gray-500">{entry.hours}h</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };
  const [showOverflowTasks, setShowOverflowTasks] = useState(false);
  const [overflowTasksDate, setOverflowTasksDate] = useState(null);

  return (
    <div className="h-[92vh] bg-gray-50 flex flex-col overflow-hidden">
      {/* Toast Notification */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />


      {/* Navigation and Controls */}
      <div className="bg-white border-b border-gray-200 flex-shrink-0">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* View Mode Toggle */}
              <div className="relative bg-gray-200 p-1 rounded-full flex w-fit">
                <div
                  className={`absolute top-1 bottom-1 bg-white rounded-full shadow-md transition-all duration-300 ease-in-out ${viewMode === "Weekly" ? "left-1 right-1/2" : "left-1/2 right-1"
                    }`}
                />
                <button
                  onClick={() => setViewMode("Weekly")}
                  className={`relative z-10 px-6 py-2 text-sm font-medium rounded-full transition-colors duration-300 ${viewMode === "Weekly" ? "text-green-600" : "text-gray-600"
                    }`}
                >
                  Weekly
                </button>
                <button
                  onClick={() => setViewMode("Monthly")}
                  className={`relative z-10 px-6 py-2 text-sm font-medium rounded-full transition-colors duration-300 ${viewMode === "Monthly" ? "text-green-600" : "text-gray-600"
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
                <div className="relative cursor-pointer">
                  <input
                    type="date"
                    onChange={(e) => {
                      // Add timezone offset to handle UTC conversion
                      const selectedDate = e.target.value;
                      const [year, month, day] = selectedDate.split('-');
                      const newDate = new Date(year, month - 1, day); // month is 0-indexed

                      if (viewMode === "Weekly") {
                        const dayOfWeek = newDate.getDay();
                        const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
                        const monday = new Date(newDate);
                        monday.setDate(newDate.getDate() + daysToMonday);
                        setCurrentWeekStart(monday);
                      } else {
                        const firstDay = new Date(newDate.getFullYear(), newDate.getMonth(), 1);
                        const lastDay = new Date(newDate.getFullYear(), newDate.getMonth() + 1, 0);
                        setCurrentMonthRange({ start: firstDay, end: lastDay });
                      }
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Calendar className="h-4 w-4 text-gray-600 hover:text-gray-800 transition-colors ml-2" />
                </div>
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

              {/* Action Buttons */}
              {hasAccess("timesheet", "edit") && (
                <button
                  className="flex items-center space-x-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  onClick={handleCopyLastWeek}
                >
                  <span>📋</span>
                  <span>Copy Last Week</span>
                </button>
              )}
              {hasAccess("timesheet", "edit") && (
                <button
                  className="flex items-center space-x-2 px-3 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleSubmitTimesheet}
                  disabled={!hasUnsubmittedTasks()}
                >
                  <span>📤</span>
                  <span>Submit Timesheet</span>
                </button>)}
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
                  width: `${Math.min((getTotalHoursForPeriod() / getTargetHours()) * 100, 100)}%`
                }}
              ></div>
            </div>
            <span className="text-sm font-medium text-gray-700">{getTargetHours()} Hrs</span>
            <span className="text-sm font-medium text-green-600">
              {getTotalHoursForPeriod() >= getTargetHours() ? "✅" : ""}
            </span>
          </div>
        </div>
      </div>

      {/* Timesheet Table */}
      <div className="flex-1 py-6 overflow-hidden">
        {viewMode === "Monthly" ? renderMonthlyView() : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full flex flex-col">
            <div className="flex-1 overflow-hidden">
              <div className="overflow-auto h-full">
                <table className="w-full table-fixed">
                 <thead className="sticky top-0 z-10">
  <tr className="bg-gray-50 border-b border-gray-200">
    {getVisibleDates().map((date) => {
      const isWeekendDay = isWeekend(date);
      const isToday = date.toDateString() === new Date().toDateString();
      
      return (
        <th
          key={date.toISOString()}
          className={`text-center text-xs font-medium text-gray-500 uppercase tracking-wider ${
            isWeekendDay ? 'bg-gray-200' : ''
          }`}
          style={{ width: "150px" }}
        >
          <div className={`px-4 py-4 flex flex-col items-center ${
            isToday ? "bg-blue-100" : isWeekendDay ? "bg-gray-200" : ""
          }`}>
            <span className={isWeekendDay ? 'text-gray-600' : ''}>
              {getDayName(date)}, {date.getDate()} {date.toLocaleDateString("en-GB", { month: "short" })}
            </span>
            <span className={`text-xs mt-1 ${isWeekendDay ? 'text-gray-500' : 'text-gray-400'}`}>
              {getDayTotalHours(date)}H/8H
            </span>
          </div>
        </th>
      );
    })}
  </tr>
</thead>
                  <tbody className="bg-white">
  <tr>
    {getVisibleDates().map((date) => {
      const entries = getTimeEntries(date);
      const isToday = date.toDateString() === new Date().toDateString();
      const isHovered = hoveredCell?.date.toDateString() === date.toDateString();
      const isWeekendDay = isWeekend(date);

      return (
        <td
          key={date.toISOString()}
          className={`px-4 py-6 text-center relative align-top border-r border-gray-100 ${
            isWeekendDay ? 'bg-gray-50' : ''
          }`}
          style={{ width: "150px", height: "200px" }}
          onMouseEnter={() => handleCellHover(date, true)}
          onMouseLeave={() => handleCellHover(date, false)}
        >
          <div className="space-y-3 h-full">
            {/* Existing Time Entries */}
            {entries.map((entry) => (
              <div
                key={entry.id}
                className={`border rounded-lg p-4 hover:shadow-md transition group relative cursor-pointer flex flex-col justify-center items-center gap-2 h-full ${
                  entry.submitted ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
                } ${isWeekendDay ? 'opacity-90' : ''}`}
                style={{
                  boxSizing: "border-box",
                  height: "150px",
                }}
                onClick={() => setTaskDetail(entry.fullTask)}
              >
                {/* Rest of the entry content remains the same */}
                {!entry.submitted && (
                  <div className="absolute top-2 right-2 flex gap-2 transition-opacity z-20">
                    {hasAccess("timesheet", "delete") && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteTimeEntry(date, entry.id);
                        }}
                        className="text-red-500 hover:text-red-700"
                        title="Delete"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                    {hasAccess("timesheet", "edit") && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingTask({ ...entry.fullTask, date });
                          setShowLogTimeModal(true);
                        }}
                        className="text-blue-500 hover:text-blue-700"
                        title="Edit"
                      >
                        <SquarePen className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                )}
                                  {/* Main content with blur effect on hover */}
                <div className="w-full h-full flex flex-col justify-center items-center gap-2 group-hover:blur-sm transition-all duration-300">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-500" />
                    <span className="text-base font-semibold text-gray-900">{entry.hours}h</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {entry.project && (
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded bg-green-100 text-green-800 text-sm font-semibold cursor-help"
                        title={entry.project}
                      >
                        <Folder className="h-3 w-3 mr-1" />
                        {truncateText(entry.project, 12)}
                      </span>
                    )}
                  </div>

                  <div className="w-full">
                    <div
                      className={`w-full m-auto text-sm text-gray-600 rounded px-2 py-1 mt-1 ${
                        !entry.description ? "italic text-gray-400" : ""
                      }`}
                      style={{
                        maxHeight: "50px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "normal",
                      }}
                    >
                      {entry.description ? entry.description : "No description"}
                    </div>
                  </div>
                </div>

                {/* Eye icon overlay - appears on hover */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                  <div className="bg-opacity-90 rounded-full p-3">
                    <Eye className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 translate-y-8 text-gray-800 text-xs px-2 py-1 rounded whitespace-nowrap">
                    Click to view details
                  </div>
                </div>
              </div>
            ))}
                               {/* Add New Entry Button */}
            <div className="flex items-center justify-center">
              {(isHovered && hasAccess("timesheet", "edit")) && (
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
            </div>
          </div>
        )}
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
        editingTask={editingTask}
      />

      {/* Task Details Modal */}
      {taskDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-200/60 backdrop-blur-sm backdrop-brightness-95">
          <div className="bg-white rounded-xl shadow-2xl p-8 min-w-[350px] max-w-[70vw] border border-gray-100">
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
                <span
                  className="cursor-help"
                  title={taskDetail.project?.projectName || "-"} // Full project name on hover
                >
                  {taskDetail.project?.projectName ? truncateText(taskDetail.project.projectName, 25) : "-"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">Hours:</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded bg-orange-100 text-orange-800 text-xs font-semibold">
                  {taskDetail.hoursSpent}
                </span>
              </div>
              <div className="w-full">
                <span className="font-semibold">Description:</span>
                <div className="text-gray-700 mt-1 break-words whitespace-pre-wrap">{taskDetail.description}</div>
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
{taskDetail && taskDetail.attachments && taskDetail.attachments.length > 0 && (
  <div>
    <span className="font-semibold">Attachments ({taskDetail.attachments.length}):</span>
    <div className="mt-2 space-y-2">
      {taskDetail.attachments.map((attachment, index) => (
        <div key={attachment.attachmentId || index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
          <FileText className="h-4 w-4 text-blue-500" />
          <span className="text-sm text-gray-700 flex-1">
            {attachment.fileName || `Attachment ${index + 1}`}
            {attachment.fileSize && (
              <span className="text-xs text-gray-500 ml-2">
                ({(attachment.fileSize / 1024).toFixed(1)} KB)
              </span>
            )}
          </span>
          <button
            onClick={() => handleViewAttachment(taskDetail.taskId, attachment.attachmentId)}
            className="inline-flex items-center px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
          >
            <Eye className="h-3 w-3 mr-1" /> View
          </button>
          <button
            onClick={() => handleDownloadAttachment(taskDetail.taskId, attachment.attachmentId, attachment.fileName)}
            className="inline-flex items-center px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 transition-colors"
          >
            <DownloadIcon className="h-3 w-3 mr-1" /> Download
          </button>
        </div>
      ))}
    </div>
  </div>
)}

            </div>
            {/* Edit and Delete Buttons */}
            <div className="mt-6 flex justify-end gap-4">
              {hasAccess("timesheet", "edit") && (
                <button
                  onClick={() => {
                    console.log("Editing task:", taskDetail);
                    setEditingTask({ ...taskDetail, date: new Date(taskDetail.date) });
                    setShowLogTimeModal(true);
                    setTaskDetail(null);
                  }}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Edit
                </button>
              )}
              {hasAccess("timesheet", "delete") && (
                <button
                  onClick={() => {
                    deleteTimeEntry(new Date(taskDetail.date), taskDetail.taskId);
                    setTaskDetail(null);
                  }}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimesheetManager;