// TimesheetManager.jsx
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { ChevronLeft, ChevronRight, Calendar, Download, Plus, X, Eye, Download as DownloadIcon, Trash2, SquarePen, Edit, TimerIcon } from "lucide-react";
import LogTimeModal from "./LogTimeModal";
import { CheckCircle, XCircle, FileText, Calendar as CalendarIcon, Folder } from "lucide-react";
import { Link } from "react-router-dom";
import { useAccess } from "../Context/AccessContext";
import TaskDetailsModal from "./TaskDetailsModal";
import AddInvoiceModal from "./AddInvoice"


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
  // return text.substring(0, maxLength) + "...";
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
  const { employee } = location.state || {};
  const hiddenDateInputRef = useRef(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

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
  const handleGenerateInvoice = () => {
    setShowInvoiceModal(true);
  };
  const handleInvoiceSubmit = (invoiceData) => {
    console.log('Invoice generated:', invoiceData);
    showToast("Invoice generated successfully!", "success");
    // You can add additional logic here if needed
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
    const formatLocalDate = (date) => {
      return date.getFullYear() + '-' +
        String(date.getMonth() + 1).padStart(2, '0') + '-' +
        String(date.getDate()).padStart(2, '0');
    };
    const start = formatLocalDate(dates[0]);
    const end = formatLocalDate(dates[dates.length - 1]);
    try {
      const res = await axios.get(
        `${API_BASE_URL}/api/timesheet-tasks/between?start=${start}&end=${end}`,
        {
          headers: {
            Authorization: sessionStorage.getItem("token"),
          },
        }
      );

      const mappedData = res.data.map(task => ({
        taskId: task.taskId,
        taskTopic: task.taskTopic || "",
        date: task.date,
        hoursSpent: task.hoursSpent,
        minutesSpent: task.minutesSpent,
        description: task.description,
        taskType: task.taskType,
        project: { projectName: task.projectName || "", projectId: task.projectId || "" },
        submitted: task.submitted,
        attachments: task.attachments,
        remainingHours: task.remainingHours || 0,
        remainingMinutes: task.remainingMinutes || 0,
      }));

      // Group tasks by date
      const grouped = {};
      mappedData.forEach((task) => {
        const dateKey = task.date.split("T")[0];
        if (!grouped[dateKey]) grouped[dateKey] = [];

        grouped[dateKey].push({
          id: task.taskId,
          hours: task.hoursSpent,
          minutes: task.minutesSpent,
          description: task.description,
          task: task.taskType,
          project: task.project,
          submitted: task.submitted,
          attachments: task.attachments,
          remainingHours: task.remainingHours || 0,
          remainingMinutes: task.remainingMinutes || 0,
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
      return `${formatDate(currentWeekStart)} to ${formatDate(endDate)}`;
    } else {
      return `${formatDate(currentMonthRange.start)} to ${formatDate(currentMonthRange.end)}`;
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

  const getTotalMinutesForPeriod = () => {
    const dates = getVisibleDates();
    let totalMinutes = 0;
    dates.forEach(date => {
      const entries = getTimeEntries(date);
      entries.forEach(entry => {
        totalMinutes += (entry.hours || 0) * 60 + (entry.minutes || 0);
      });
    });
    return totalMinutes;
  };

  const getTargetMinutes = () => {
    const targetHours = getTargetHours(); // Weekly: 40 hours, Monthly: 184 hours
    return targetHours * 60; // Convert hours to minutes
  };

  const getDayTotalTime = (date) => {
    const entries = getTimeEntries(date);
    let totalMinutes = entries.reduce((total, entry) => {
      return total + (entry.hours || 0) * 60 + (entry.minutes || 0);
    }, 0);

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    return { hours, minutes };
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
    if (!taskData.date) {
      taskData.date = selectedCell.date.toISOString().split("T")[0]; // Ensure the correct date is used
    }
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
            taskTopic: taskData.taskTopic,
            hoursSpent: taskData.hoursSpent,
            minutesSpent: taskData.minutesSpent,
            remainingHours: taskData.remainingHours,
            remainingMinutes: taskData.remainingMinutes,
            description: taskData.description,
            projectId: taskData.projectId || null,
            date: new Date(editingTask.date),
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
                minutes: res.data.minutesSpent,
                remainingHours: res.data.remainingHours,
                remainingMinutes: res.data.remainingMinutes,
                description: res.data.description,
                task: res.data.taskType,
                project: res.data.project,
                submitted: res.data.submitted,
                attachment: res.data.attachments,
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
            minutes: taskData.minutesSpent,
            remainingHours: taskData.remainingHours,
            remainingMinutes: taskData.remainingMinutes,
            description: taskData.description,
            task: taskData.taskType,
            project: taskData.project,
            submitted: taskData.submitted,
            attachment: taskData.attachment,
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

  const handleDownloadInvoice = async (invoiceId, invoiceName) => {
    try {
      showToast("Downloading invoice...", "info");

      const response = await axios.get(
        `${API_BASE_URL}/api/invoices/download/${invoiceId}`,
        {
          headers: {
            Authorization: sessionStorage.getItem("token")
          },
          responseType: 'blob'
        }
      );

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${invoiceName || invoiceId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      showToast("Invoice downloaded successfully!", "success");
    } catch (error) {
      console.error("Failed to download invoice:", error);
      showToast("Failed to download invoice", "error");
    }
  };
  // Download as CSV with attachment information
  const downloadExcel = () => {
    try {
      const dates = getVisibleDates();
      const periodType = viewMode === "Weekly" ? "week" : "month";
      const BOM = "\uFEFF";
      const headers = ["Date", "Task", "Hours", "Minutes", "Description", "Project"];
      let csvContent = BOM + headers.map((h) => `"${h}"`).join(",") + "\r\n";
      dates.forEach((date) => {
        const entries = getTimeEntries(date);
        entries.forEach((entry) => {
          const row = [
            `"${formatDateDisplay(date)}"`,
            `"${entry.task}"`,
            `"${entry.hours}"`,
            `"${entry.minutes}"`,
            `"${entry.description}"`,
            `"${entry.project.projectName || ""}"` // Ensure project name is used,

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
      <div className="flex flex-col h-full">
        {/* Header Row with Navigation Arrows */}
        <div className="flex items-center justify-between bg-gray-100 p-2 border-b border-gray-200 h-full">
          <button
            onClick={() => navigatePeriod("prev")}
            className="p-2 hover:bg-white rounded-md transition-colors h-full"
          >
            <ChevronLeft className="h-4 w-4 text-gray-600" />
          </button>


          {/* Grid for Monthly View */}
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

              // Calculate total hours and minutes for the day
              const { hours: totalHours, minutes: totalMinutes } = getDayTotalTime(date);

              return (
                <div
                  key={dateKey}
                  className={`relative cursor-pointer border p-2 transition-all duration-200 ${isOverflowOpen
                    ? "border-blue-400 bg-blue-50 shadow-md z-20"
                    : `border-gray-200 ${isToday
                      ? "bg-blue-50"
                      : isWeekendDay
                        ? "bg-gray-100"
                        : "bg-white"
                    }`
                    }`}
                  style={{
                    aspectRatio: "5/6"
                  }}
                  onMouseEnter={() => setHoveredCell(dateKey)}
                  onMouseLeave={() => setHoveredCell(null)}
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
                        className={`task-entry border pl-2 text-xs text-gray-700 truncate flex items-center gap-1 hover:opacity-80 transition-opacity bg-green-200 border-green-200
                       ${isWeekendDay ? 'opacity-90' : ''}`}
                        title={`${entry.task} - ${entry.hours}h ${entry.minutes}m - ${entry.project}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setTaskDetail({...entry.fullTask, remainingHours: entry.remainingHours , remainingMinutes: entry.remainingMinutes});
                        }}
                      >
                        <span className="font-semibold">{entry.task}</span>
                        <span className="text-gray-500">{entry.hours}h {entry.minutes}m</span>
                      </div>
                    ))}

                    {/* Show more button */}
                    {remainingTasksCount > 0 && (
                      <div
                        className={`task-entry border pl-2 text-xs text-gray-700 truncate flex items-center gap-1 bg-blue-100 border-blue-200 cursor-pointer hover:bg-blue-200 transition-colors ${isWeekendDay ? 'opacity-90' : ''
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
                  {hoveredCell === dateKey && (
                    <div
                      className={`absolute flex items-center justify-center transition-all ${entries.length === 0
                        ? "top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-12"
                        : overflowTasks.length > 0
                          ? "top-2.5 right-2 w-4 h-4"
                          : "bottom-2 left-1/2 transform -translate-x-1/2 w-6 h-6"
                        }`}
                    >
                      <button
                        className={`bg-blue-500 text-white rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors shadow-lg ${entries.length === 0 ? "text-xl" : "text-sm"
                          }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCellClick(date);
                        }}
                      >
                        <Plus className={`${entries.length === 0 ? "h-6 w-6" : "h-3 w-3"} ${entries.length === 0
                          ? "h-6 w-6"
                          : overflowTasks.length > 0
                            ? "h-3 w-3"
                            : "h-5 w-5"
                          }`} />
                      </button>
                    </div>
                  )}
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
                              className={`task-entry border pl-2 text-xs text-gray-700 truncate flex items-center gap-1 hover:opacity-80 transition-opacity bg-green-200 border-green-200`}
                              title={`${entry.task} - ${entry.hours}h - ${entry.project}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setTaskDetail({...entry.fullTask, remainingHours: entry.remainingHours , remainingMinutes: entry.remainingMinutes});
                              }}
                            >
                              <span className="font-semibold">{entry.task}</span>
                              <span className="text-gray-500">{entry.hours}h {entry.minutes}m</span>
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
          <button
            onClick={() => navigatePeriod("next")}
            className="p-2 hover:bg-white rounded-md transition-colors h-full"
          >
            <ChevronRight className="h-4 w-4 text-gray-600" />
          </button>
        </div>
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
                  className={`relative z-10 px-6 py-2 text-sm font-medium rounded-full transition-colors duration-300 cursor-pointer ${viewMode === "Weekly" ? "text-green-600" : "text-gray-600"
                    }`}
                >
                  Weekly
                </button>
                <button
                  onClick={() => setViewMode("Monthly")}
                  className={`relative z-10 px-6 py-2 text-sm font-medium rounded-full transition-colors duration-300 cursor-pointer ${viewMode === "Monthly" ? "text-green-600" : "text-gray-600"
                    }`}
                >
                  Monthly
                </button>
              </div>

              {/* Period Navigation */}
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => navigatePeriod("prev")}
                  className="p-2 hover:bg-white rounded-md transition-colors cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4 text-gray-600" />
                </button>
                <button
                  onClick={() => hiddenDateInputRef.current.showPicker()}
                  className="px-4 py-2 text-sm font-medium text-gray-900 hover:bg-white rounded-md transition-colors min-w-[200px]"
                >
                  {getCurrentDateString()}
                </button>
                <div className="relative cursor-pointer">
                  <input
                    type="date"
                    ref={hiddenDateInputRef}
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
                  className="p-2 hover:bg-white rounded-md transition-colors cursor-pointer"
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
                  className="flex items-center space-x-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={handleCopyLastWeek}
                >
                  <span>📋</span>
                  <span>Copy Last Week</span>
                </button>
              )}
              <button
                onClick={() => {
                  setSelectedCell({ date: new Date() }); // Ensure the current date is passed
                  setShowLogTimeModal(true);
                }}
                className="flex items-center space-x-2 px-3 py-2 bg-green-700 text-white text-sm rounded-lg hover:bg-green-600 transition-colors cursor-pointer"
              >

                <span>Add Timesheet Task</span>
              </button>
              <button
                onClick={downloadExcel}
                className="flex items-center space-x-2 px-3 py-2 bg-green-700 text-white text-sm rounded-lg hover:bg-green-600 transition-colors cursor-pointer"
              >
                <Download className="h-4 w-4" />
                <span>Download Excel</span>
              </button>
              {hasAccess(import.meta.env.VITE_GENERATE_INVOICE_MODULE, "view") &&(<button
                onClick={handleGenerateInvoice}
                className="flex items-center space-x-2 px-3 py-2 bg-green-700 text-white text-sm rounded-lg hover:bg-green-600 transition-colors cursor-pointer"
              >
                <FileText className="h-4 w-4" />
                <span>Generate Invoice</span>
              </button>)}
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white border-b border-gray-200 flex-shrink-0">
        <div className="px-6 py-3">
          <div className="flex items-center space-x-4">
            {/* Total Time Calculation */}
            <span className="text-sm font-medium text-gray-700">
              {Math.floor(getTotalMinutesForPeriod() / 60)}h {getTotalMinutesForPeriod() % 60}m
            </span>
            <div className="flex-1 bg-gray-200 rounded-full h-2 relative">
              <div
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min((getTotalMinutesForPeriod() / getTargetMinutes()) * 100, 100)}%`
                }}
              ></div>
            </div>
            {/* Target Time Calculation */}
            <span className="text-sm font-medium text-gray-700">
              {Math.floor(getTargetMinutes() / 60)}h {getTargetMinutes() % 60}m
            </span>
            <span className="text-sm font-medium text-green-600">
              {getTotalMinutesForPeriod() >= getTargetMinutes() ? "✅" : ""}
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
                      {/* Previous Period Button */}
                      <th
                        className="text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-100 cursor-pointer"
                        style={{ width: "50px" }}
                      >
                        <button
                          onClick={() => navigatePeriod("prev")}
                          className="p-2 hover:bg-white rounded-md transition-colors"
                        >
                          <ChevronLeft className="h-4 w-4 text-gray-600" />
                        </button>
                      </th>

                      {/* Date Headers */}
                      {getVisibleDates().map((date) => {
                        const isWeekendDay = isWeekend(date);
                        const isToday = date.toDateString() === new Date().toDateString();

                        return (
                          <th
                            key={date.toISOString()}
                            className={`text-center text-xs font-medium text-gray-500 uppercase tracking-wider ${isWeekendDay ? 'bg-gray-200' : ''}`}
                            style={{ width: "150px" }}
                          >
                            <div className={`px-4 py-4 flex flex-col items-center ${isToday ? "bg-blue-100" : isWeekendDay ? "bg-gray-200" : ""}`}>
                              <span className={isWeekendDay ? 'text-gray-600' : ''}>
                                {getDayName(date)}, {date.getDate()} {date.toLocaleDateString("en-GB", { month: "short" })}
                              </span>
                              <span className={`text-xs mt-1 ${isWeekendDay ? 'text-gray-500' : 'text-gray-400'}`}>
                                {(() => {
                                  const { hours, minutes } = getDayTotalTime(date);
                                  return `${hours}h ${minutes}m`;
                                })()}
                              </span>
                            </div>
                          </th>
                        );
                      })}

                      {/* Next Period Button */}
                      <th
                        className="text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-100 cursor-pointer"
                        style={{ width: "50px" }}
                      >
                        <button
                          onClick={() => navigatePeriod("next")}
                          className="p-2 hover:bg-white rounded-md transition-colors"
                        >
                          <ChevronRight className="h-4 w-4 text-gray-600" />
                        </button>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    <tr>
                      {/* Empty cell for Previous Period Button */}
                      <td
                        className=""
                        style={{ width: "50px" }}
                      ></td>

                      {/* Date Columns */}
                      {getVisibleDates().map((date) => {
                        const entries = getTimeEntries(date);
                        const isToday = date.toDateString() === new Date().toDateString();
                        const isHovered = hoveredCell?.date.toDateString() === date.toDateString();
                        const isWeekendDay = isWeekend(date);

                        return (
                          <td
                            key={date.toISOString()}
                            className={`px-4 py-6 text-center relative align-top border-r border-gray-100 ${isWeekendDay ? 'bg-gray-50' : ''
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
                                  className={`border rounded-xl p-2 hover:shadow-md transition group relative cursor-pointer flex flex-col justify-between h-[150px] bg-green-50 border-green-200 ${isWeekendDay ? 'opacity-90' : ''
                                    }`}
                                  onClick={() => setTaskDetail({...entry.fullTask, remainingHours: entry.remainingHours , remainingMinutes: entry.remainingMinutes})}
                                >
                                  {entry.project && (
                                    <div className="flex justify-center mt-1">
                                      <span
                                        className="inline-flex items-center px-2 py-0.5 rounded bg-green-100 text-green-800 text-xs font-medium cursor-help max-w-[130px] truncate"
                                        title={entry.project.projectName || "-"}
                                      >
                                        <Folder className="h-3 w-3 mr-1" />
                                        {entry.project.projectName}
                                      </span>
                                    </div>
                                  )}
                                  {/* Time and Task Topic */}


                                  <div className="flex justify-center items-center gap-2">
                                    <FileText className="h-4 w-4 text-blue-500" />
                                    <span className="text-sm font-semibold text-gray-900 truncate max-w-[120px]" title={entry.fullTask.taskTopic}>
                                      {entry.fullTask.taskTopic}
                                    </span>
                                  </div>

                                  <div className="flex justify-between items-center gap-2">
                                    <div className="flex items-center gap-1">
                                      <TimerIcon className="h-4 w-4 text-blue-500" />
                                      <span className="text-xs font-semibold text-gray-900">
                                        {entry.hours}h {entry.minutes}m
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-end gap-2">

                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setTaskDetail({...entry.fullTask, remainingHours: entry.remainingHours , remainingMinutes: entry.remainingMinutes});
                                        }}
                                        className="cursor-pointer"
                                      >
                                        <Eye className="h-4 w-4 text-green-500 hover:text-gray-600" />
                                      </button>
                                    </div>
                                  </div>


                                  {/* Project badge */}


                                  {/* Action buttons */}

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

                      {/* Empty cell for Next Period Button */}
                      <td
                        className=""
                        style={{ width: "50px" }}
                      ></td>
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
        timesheetData={timesheetData}
      />
      <AddInvoiceModal
        open={showInvoiceModal}
        onClose={() => setShowInvoiceModal(false)}
        onSubmit={handleInvoiceSubmit}
        timesheetData={timesheetData}
        viewMode={viewMode}
        currentWeekStart={currentWeekStart}
        currentMonthRange={currentMonthRange}
        employee={{
          name: sessionStorage.getItem('name') || 'Current User',
          email: sessionStorage.getItem('email') || ''
        }}
      />


      {/* Task Details Modal */}
      {taskDetail && (
        <TaskDetailsModal
          isOpen={!!taskDetail}
          onClose={() => setTaskDetail(null)}
          taskDetail={taskDetail}
          onEdit={(updatedTask) => {
            setEditingTask(updatedTask);
            setShowLogTimeModal(true);
            setTaskDetail(null);
          }}
          onDelete={() => {
            deleteTimeEntry(new Date(taskDetail.date), taskDetail.taskId);
            setTaskDetail(null);
          }}
          handleViewAttachment={handleViewAttachment}
          handleDownloadAttachment={handleDownloadAttachment}
          isEmployeeView={true}
        />
      )}
    </div>
  );
};

export default TimesheetManager;