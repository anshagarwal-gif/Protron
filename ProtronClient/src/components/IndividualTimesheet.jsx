import React, { use } from 'react'
import { useEffect, useState, useRef } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  X,
  Plus,
  FileText,
  CheckCircle,
  XCircle,
  Folder,
  Eye,
  DownloadIcon,
  CalendarIcon,
  Trash2,
  SquarePen,
  Calendar,
  TimerIcon,
  Edit
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom'
import axios from 'axios';
import { useAccess } from '../Context/AccessContext';
import { useSession } from '../Context/SessionContext';
import LogTimeModal from './LogTimeModal';
import TaskDetailsModal from './TaskDetailsModal';
import AddInvoiceModal from "../components/AddInvoice";

const API_BASE_URL = import.meta.env.VITE_API_URL;

const formatDate = (date) =>
  date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" });
// Use local date components to avoid timezone issues with toISOString()
const formatDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
const formatDateDisplay = (date) =>
  date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" });

// Helper function to check if a date is weekend
const isWeekend = (date) => {
  const day = date.getDay();
  return day === 0 || day === 6; // Sunday (0) or Saturday (6)
};

// Truncate function for project names
const truncateText = (text, maxLength = 15) => {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
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

const IndividualTimesheet = () => {
  const { hasAccess } = useAccess();
  const location = useLocation();
  const { employee } = location.state || {};
  const [viewMode, setViewMode] = useState("Weekly");
  const [currentWeekStart, setCurrentWeekStart] = useState(getCurrentMondayStart());
  const [currentMonthRange, setCurrentMonthRange] = useState(getCurrentMonthRange());
  const [hoveredCell, setHoveredCell] = useState(null);
  const [timesheetData, setTimesheetData] = useState({});
  const [taskDetail, setTaskDetail] = useState(null);
  const [toast, setToast] = useState({
    isVisible: false,
    message: '',
    type: 'info' // 'success', 'error', 'info'
  });
  const [loading, setLoading] = useState(false);
  const [showOverflowTasks, setShowOverflowTasks] = useState(false);
  const [overflowTasksDate, setOverflowTasksDate] = useState(null);
  const navigate = useNavigate();
  const { sessionData, clearSession } = useSession();
  const [showLogTimeModal, setShowLogTimeModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [selectedCell, setSelectedCell] = useState(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const hiddenDateInputRef = useRef(null);

  const getTargetHours = () => {
    return viewMode === "Weekly" ? 40 : 184;
  };

  const showToast = (message, type = 'info') => {
    setToast({
      isVisible: true,
      message,
      type
    });
  };
 const handleGenerateInvoice = () => {
    setShowInvoiceModal(true);
  };
  const handleInvoiceSubmit = (invoiceData) => {
    console.log('Invoice generated:', invoiceData);
    showToast("Invoice generated successfully!", "success");
    // You can add additional logic here if needed
  };
  const hideToast = () => {
    setToast(prev => ({ ...prev, isVisible: false }));
  };

  const handleViewAttachment = async (taskId) => {
    try {
      showToast("Loading attachment...", "info");

      const response = await axios.get(
        `${API_BASE_URL}/api/timesheet-tasks/${taskId}/attachment`,
        {
          headers: {
            Authorization: sessionStorage.getItem("token"),
          },
          responseType: 'blob',
          timeout: 30000 // 30 second timeout
        }
      );

      if (!response.data || response.data.size === 0) {
        showToast("Attachment file is empty or not found", "error");
        return;
      }
      const contentType = response.headers['content-type'] || 'application/octet-stream';
      const blob = new Blob([response.data], { type: contentType });
      const url = window.URL.createObjectURL(blob);
      const newWindow = window.open(url, '_blank');

      if (!newWindow || newWindow.closed || typeof newWindow.closed == 'undefined') {
        showToast("Popup blocked. Starting download instead...", "info");
        const link = document.createElement('a');
        link.href = url;
        link.download = `attachment_${taskId}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        showToast("Attachment opened successfully!", "success");
      }
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 5000);

    } catch (error) {
      console.error("Failed to view attachment:", error);

      if (error.response?.status === 404) {
        showToast("Attachment not found or has been deleted", "error");
      } else if (error.response?.status === 403) {
        showToast("Access denied to attachment", "error");
      } else if (error.response?.status === 500) {
        showToast("Server error while retrieving attachment. Please contact support.", "error");
      } else if (error.code === 'ECONNABORTED') {
        showToast("Request timeout. Attachment might be too large.", "error");
      } else {
        showToast("Failed to open attachment. Please try downloading instead.", "error");
      }
    }
  };

  const handleDownloadAttachment = async (taskId, fileName = null) => {
    try {
      showToast("Downloading attachment...", "info");

      const response = await axios.get(
        `${API_BASE_URL}/api/timesheet-tasks/${taskId}/attachment`,
        {
          headers: {
            Authorization: sessionStorage.getItem("token"),
          },
          responseType: 'blob',
          timeout: 60000 // 60 second timeout for downloads
        }
      );

      if (!response.data || response.data.size === 0) {
        showToast("Attachment file is empty or not found", "error");
        return;
      }

      // Get filename from content-disposition header if available
      const contentDisposition = response.headers['content-disposition'];
      let downloadFileName = fileName || `attachment_${taskId}`;

      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (fileNameMatch && fileNameMatch[1]) {
          downloadFileName = fileNameMatch[1].replace(/['"]/g, '');
        }
      }

      // Get content type from response headers
      const contentType = response.headers['content-type'] || 'application/octet-stream';

      // Create download link
      const blob = new Blob([response.data], { type: contentType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = downloadFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 1000);

      showToast("Attachment downloaded successfully!", "success");
    } catch (error) {
      console.error("Failed to download attachment:", error);

      if (error.response?.status === 404) {
        showToast("Attachment not found or has been deleted", "error");
      } else if (error.response?.status === 403) {
        showToast("Access denied to attachment", "error");
      } else if (error.response?.status === 500) {
        showToast("Server error while downloading attachment. Please contact support.", "error");
      } else if (error.code === 'ECONNABORTED') {
        showToast("Download timeout. Attachment might be too large.", "error");
      } else {
        showToast("Failed to download attachment", "error");
      }
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

  const fetchTasks = async () => {
    const dates = getVisibleDates();
    if (!dates.length || !employee?.rawData?.userId) return;
    const formatLocalDate = (date) => {
      return date.getFullYear() + '-' +
        String(date.getMonth() + 1).padStart(2, '0') + '-' +
        String(date.getDate()).padStart(2, '0');
    };
    const start = formatLocalDate(dates[0]);
    const end = formatLocalDate(dates[dates.length - 1]);
    const userId = employee.rawData.userId;

    try {
      const res = await axios.get(
        `${API_BASE_URL}/api/timesheet-tasks/admin-between?start=${start}&end=${end}&userId=${userId}`,
        {
          headers: {
            Authorization: sessionStorage.getItem("token"),
          },
        }
      );

      const mappedData = res.data.map(task => ({
        taskId: task.taskId,
        taskTopic: task.taskTopic || "", // New field
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

      // Group tasks by date - parse as Date and use local components to avoid timezone issues
      const grouped = {};
      mappedData.forEach((task) => {
        const taskDate = new Date(task.date);
        const dateKey = formatDateKey(taskDate);
        if (!grouped[dateKey]) grouped[dateKey] = [];

        grouped[dateKey].push({
          id: task.taskId,
          hours: task.hoursSpent,
          minutes: task.minutesSpent || 0,
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

  useEffect(() => {
    // Fetch tasks when component mounts or view mode changes
    setLoading(true);
    fetchTasks().finally(() => {
      setLoading(false);
    });
  }, [viewMode, currentWeekStart, currentMonthRange, employee?.rawData?.userId]);

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

  const handleLogTimeSave = async (taskData) => {
    if (!taskData.date) {
      taskData.date = formatDateKey(selectedCell.date); // Use local date format to avoid timezone issues
    }
    if (editingTask) {
      console.log({
        ...taskData,
        date: formatDateKey(new Date(editingTask.date)), // or use taskData.date if you allow editing date
      })
      // Edit mode
      try {
        const res = await axios.put(
          `${API_BASE_URL}/api/timesheet-tasks/edit/${editingTask.taskId}`,
          {
            taskType: taskData.taskType,
            taskTopic: taskData.taskTopic,
            hoursSpent: taskData.hoursSpent,
            minutesSpent: taskData.minutesSpent || 0, // Handle optional minutes
            remainingHours: taskData.remainingHours || 0, // Handle optional remaining hours
            remainingMinutes: taskData.remainingMinutes || 0, // Handle optional remaining minutes
            description: taskData.description,
            projectId: taskData.projectId || null, // Ensure projectId is passed correctly
            attachments: taskData.attachments || null, // Handle optional attachment
            date: formatDateKey(new Date(editingTask.date)), // or use taskData.date if you allow editing date
          },
          {
            headers: {
              Authorization: sessionStorage.getItem("token"),
            },
          }
        );
        // Update UI
        const dateKey = formatDateKey(new Date(editingTask.date));
        setTimesheetData((prev) => ({
          ...prev,
          [dateKey]: prev[dateKey].map((entry) =>
            entry.id === editingTask.taskId
              ? {
                ...entry,
                ...res.data,
                id: res.data.taskId,
                hours: res.data.hoursSpent,
                minutes: res.data.minutesSpent || 0, // Handle optional minutes
                remainingHours: res.data.remainingHours || 0, // Handle optional remaining hours
                remainingMinutes: res.data.remainingMinutes || 0, // Handle optional remaining minutes
                description: res.data.description,
                task: res.data.taskType,
                project: res.data.project,
                submitted: res.data.submitted,
                attachments: res.data.attachments,
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
            minutes: taskData.minutesSpent || 0, // Handle optional minutes
            remainingHours: taskData.remainingHours || 0, // Handle optional remaining hours
            remainingMinutes: taskData.remainingMinutes || 0, // Handle optional remaining minutes
            description: taskData.description,
            task: taskData.taskType,
            project: taskData.project,
            submitted: taskData.submitted,
            attachments: taskData.attachments,
            fullTask: taskData,
          },
        ],
      }));
      showToast("Task added successfully!", "success");
      setShowLogTimeModal(false);
      setSelectedCell(null);
    }
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

  const getTotalTimeForPeriod = () => {
    const dates = getVisibleDates();
    let totalMinutes = 0;

    dates.forEach((date) => {
      const { hours, minutes } = getDayTotalTime(date);
      totalMinutes += hours * 60 + minutes;
    });

    const totalHours = Math.floor(totalMinutes / 60);
    const remainingMinutes = totalMinutes % 60;

    return { hours: totalHours, minutes: remainingMinutes };
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

    const start = formatDateKey(lastWeekStart);
    const end = formatDateKey(lastWeekEnd);

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
                    if (sessionData.email === employee.email) handleCellClick(date);
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
                      } ${isWeekendDay ? 'opacity-90' : ''}`}
                        title={`${entry.task} - ${entry.hours}h ${entry.minutes}m - ${entry.project}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setTaskDetail({...entry.fullTask , remainingHours: entry.remainingHours, remainingMinutes: entry.remainingMinutes});
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

                  {hoveredCell === dateKey && sessionData.email === employee.email && (
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
                              className={`task-entry border pl-2 text-xs text-gray-700 truncate flex items-center gap-1 hover:opacity-80 transition-opacitybg-green-200 border-green-200`}
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
            <div className='flex justify-start items-center gap-5'>
              <div className="bg-white flex justify-center items-center p-1 gap-3">
                <div className="flex items-center space-x-4">
                  {/* Back Button */}
                  <button
                    onClick={() => navigate(-1)}
                    className="text-blue-600 hover:text-blue-800 text-lg font-medium"
                  >
                    <ChevronLeft />
                  </button>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{employee.name}</h3>
                  <p className="text-sm text-gray-600">{employee.email}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">Timesheet</div>
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
                  <div className="relative flex items-center">
                    <button

                      onClick={() => { console.log(hiddenDateInputRef.current); hiddenDateInputRef.current?.showPicker() }}
                      className="px-4 py-2 cursor-pointer text-sm font-medium text-gray-900 hover:bg-white rounded-md transition-colors min-w-[200px]"
                    >
                      {getCurrentDateString()}
                    </button>
                    <div className="relative">
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
                        ref={hiddenDateInputRef}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <Calendar className="h-4 w-4 text-gray-600 hover:text-gray-800 transition-colors ml-2" />
                    </div>
                  </div>
                  <button
                    onClick={() => navigatePeriod("next")}
                    className="p-2 hover:bg-white rounded-md transition-colors cursor-pointer"
                  >
                    <ChevronRight className="h-4 w-4 text-gray-600" />
                  </button>
                </div>
              </div>
              {/* Action Buttons */}
              {hasAccess("timesheet", "edit") && (sessionData.email === employee.email) && (
                <button
                  className="flex items-center space-x-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={handleCopyLastWeek}
                >
                  <span>📋</span>
                  <span>Copy Last Week</span>
                </button>
              )}

              {(sessionData.email === employee.email) &&(              <button
                onClick={() => {
                  setSelectedCell({ date: new Date() }); // Ensure the current date is passed
                  setShowLogTimeModal(true);
                }}
                className="flex items-center space-x-2 px-3 py-2 bg-green-700 text-white text-sm rounded-lg hover:bg-green-600 transition-colors cursor-pointer"
              >

                <span>Add Timesheet Task</span>
              </button>)}
             {((sessionData.email !== employee.email) || hasAccess(import.meta.env.VITE_GENERATE_INVOICE_MODULE, "view")) && (<button
                onClick={handleGenerateInvoice}
                className="flex items-center space-x-2 px-3 py-2 bg-green-700 text-white text-sm rounded-lg hover:bg-green-600 transition-colors cursor-pointer"
              >
                <FileText className="h-4 w-4" />
                <span>Generate Invoice</span>
              </button>)}
              <button
                onClick={downloadExcel}
                className="flex items-center space-x-2 px-3 py-2 bg-green-700 text-white text-sm rounded-lg hover:bg-green-600 transition-colors cursor-pointer"
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
            <span className="text-sm font-medium text-gray-700">
              {getTotalTimeForPeriod().hours}h {getTotalTimeForPeriod().minutes}m
            </span>
            <div className="flex-1 bg-gray-200 rounded-full h-2 relative">
              <div
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(
                    (getTotalTimeForPeriod().hours * 60 + getTotalTimeForPeriod().minutes) /
                    (getTargetHours() * 60) *
                    100,
                    100
                  )}%`,
                }}
              ></div>
            </div>
            <span className="text-sm font-medium text-gray-700">
              {getTargetHours()}h 0m
            </span>
            <span className="text-sm font-medium text-green-600">
              {getTotalTimeForPeriod().hours * 60 + getTotalTimeForPeriod().minutes >=
                getTargetHours() * 60
                ? "✅"
                : ""}
            </span>
          </div>
        </div>
      </div>

      {/* Timesheet Table */}
      <div className="flex-1 overflow-hidden py-6">
        {viewMode === "Monthly" ? renderMonthlyView() : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full flex flex-col">
            <div className="flex-1 overflow-auto">
              <div className='overflow-auto h-full'>
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
                                {getDayTotalTime(date).hours}h {getDayTotalTime(date).minutes}m
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
                                    {sessionStorage.getItem('email') === employee?.email && (
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
                                    )}
                                  </div>



                                  </div>

                              ))}


                                  {/* Add New Entry Button */}
                                  <div className="flex items-center justify-center">
                                    {(isHovered && hasAccess("timesheet", "edit")) && (sessionData.email === employee.email) && (
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
          </div>)}
      </div>

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
        employee={employee}
      />

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
          employee={employee}
          isEmployeeView={sessionData.email === employee.email}
        />
      )}
    </div>
  );
}

export default IndividualTimesheet