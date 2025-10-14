import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, User, Hash, Activity, Briefcase } from 'lucide-react';
import axios from 'axios';

const ViewTaskModal = ({ open, onClose, taskData, parentStory }) => {
  const [attachments, setAttachments] = useState([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);
  const [attachmentError, setAttachmentError] = useState(null);
  const [projectName, setProjectName] = useState('');
  const [parentStoryName, setParentStoryName] = useState('');

  useEffect(() => {
    if (open && taskData?.taskId) {
      setLoadingAttachments(true);
      console.log('Loading attachments for taskId:', taskData.taskId);
      const token = sessionStorage.getItem('token');
      
      // Try both attachment endpoints
      const fetchAttachments = async () => {
        try {
          // First try regular TaskController (String taskId)
          console.log('Trying regular TaskController endpoint...');
          const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/tasks/${taskData.taskId}/attachments`, {
            headers: {
              'Authorization': token
            }
          });
          console.log('Task attachments loaded:', res.data);
          setAttachments(res.data);
          setAttachmentError(null);
          
        } catch (err) {
          console.error('Error loading Task attachments from TaskController:', err);
          
          // If taskId is a number, try TimesheetTaskController as fallback
          if (!isNaN(parseInt(taskData.taskId))) {
            try {
              console.log('Trying TimesheetTaskController endpoint as fallback...');
              const timesheetRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/timesheet-tasks/${parseInt(taskData.taskId)}/attachments`, {
                headers: {
                  'Authorization': token
                }
              });
              console.log('TimesheetTask attachments loaded:', timesheetRes.data);
              setAttachments(timesheetRes.data);
              setAttachmentError(null);
              
            } catch (timesheetErr) {
              console.error('Error loading TimesheetTask attachments:', timesheetErr);
              setAttachmentError("Failed to load attachments.");
            }
          } else {
            setAttachmentError("Failed to load attachments.");
          }
        }
      };
      
      fetchAttachments().finally(() => setLoadingAttachments(false));
    }
  }, [open, taskData?.taskId]);

  // Fetch names for project and parent story
  useEffect(() => {
    const fetchNames = async () => {
      if (open && taskData) {
        try {
          const token = sessionStorage.getItem('token');
          console.log('Fetching names for task:', taskData);
          
          // Fetch project name
          if (taskData.projectId) {
            console.log('Fetching project name for projectId:', taskData.projectId);
            const projectRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/projects/${taskData.projectId}/name`, {
              headers: { 'Authorization': token }
            });
            console.log('Project name response:', projectRes.data);
            setProjectName(projectRes.data || 'Unknown Project');
          }

          // Fetch parent story name
          if (taskData.parentId) {
            if (taskData.parentId.startsWith('US-')) {
              const userStoryRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/userstory/active/usid/${taskData.parentId}`, {
                headers: { 'Authorization': token }
              });
              setParentStoryName(userStoryRes.data.summary || taskData.parentId);
            } else if (taskData.parentId.startsWith('SS-')) {
              const solutionStoryRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/solutionstory/active/ssid/${taskData.parentId}`, {
                headers: { 'Authorization': token }
              });
              setParentStoryName(solutionStoryRes.data.summary || taskData.parentId);
            } else {
              setParentStoryName(taskData.parentId);
            }
          }
        } catch (error) {
          console.error('Error fetching names:', error);
          setProjectName('Unknown Project');
          setParentStoryName(taskData.parentId || 'N/A');
        }
      }
    };

    fetchNames();
  }, [open, taskData]);

  if (!open || !taskData) return null;

  // Debug log the taskData structure
  console.log('ViewTaskModal taskData:', taskData);

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const d = new Date(dateString);
    const day = String(d.getDate()).padStart(2, '0');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthStr = monthNames[d.getMonth()];
    const year = d.getFullYear();
    return `${day}-${monthStr}-${year}`;
  };

  // Format time
  const formatTime = (hours, minutes) => {
    if (hours === 0 && minutes === 0) return 'N/A';
    return `${hours}h ${minutes}m`;
  };

  // Field component for consistent styling
  const Field = ({ label, value, className = "" }) => (
    <div className={className}>
      <label className="text-xs font-medium text-gray-600 mb-1 block">{label}</label>
      <div className="text-sm text-gray-900 font-medium">
        {value || "N/A"}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 bg-green-600 text-white rounded-t-lg">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <Calendar size={24} className="text-white" />
              <div>
                <h2 className="text-xl font-bold">Task Details</h2>
                <p className="text-green-100 text-sm">Task ID: {taskData.taskId}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-green-700 rounded-full transition-colors cursor-pointer"
            >
              <X size={20} className="text-white" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Calendar size={18} className="mr-2 text-green-600" />
              Basic Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Project" value={projectName || taskData.projectId} />
              <Field label="Task Topic" value={taskData.taskTopic} />
              <Field label="Task Type" value={taskData.taskType} />
              <Field label="Date" value={formatDate(taskData.date)} />
              <Field label="Estimated Time" value={taskData.estTime} />
              <Field label="Created By" value={taskData.createdBy} />
            </div>
          </div>

          {/* Task Details */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <User size={18} className="mr-2 text-green-600" />
              Task Details
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Task Description</label>
                <div className="text-sm text-gray-900 font-medium bg-white p-3 rounded border min-h-[100px]">
                  {taskData.taskDescription || "N/A"}
                </div>
              </div>
            </div>
          </div>

          {/* Time Tracking */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Clock size={18} className="mr-2 text-green-600" />
              Time Tracking
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <Field 
                label="Time Spent" 
                value={formatTime(taskData.timeSpentHours, taskData.timeSpentMinutes)} 
              />
              <Field 
                label="Time Remaining" 
                value={formatTime(taskData.timeRemainingHours, taskData.timeRemainingMinutes)} 
              />
              <Field 
                label="Time Spent (Hours)" 
                value={taskData.timeSpentHours} 
              />
              <Field 
                label="Time Spent (Minutes)" 
                value={taskData.timeSpentMinutes} 
              />
              <Field 
                label="Time Remaining (Hours)" 
                value={taskData.timeRemainingHours} 
              />
              <Field 
                label="Time Remaining (Minutes)" 
                value={taskData.timeRemainingMinutes} 
              />
            </div>
          </div>


          {/* Attachments */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Activity size={18} className="mr-2 text-green-600" />
              Attachments
            </h3>
            {loadingAttachments ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
                <span className="ml-2 text-gray-600">Loading attachments...</span>
              </div>
            ) : attachmentError ? (
              <div className="text-red-600 text-sm">{attachmentError}</div>
            ) : attachments.length > 0 ? (
              <div className="space-y-2">
                {attachments.map((attachment, index) => (
                  <div key={index} className="flex items-center justify-between bg-white p-3 rounded border">
                    <div className="flex items-center space-x-3">
                      <Activity size={16} className="text-gray-500" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">{attachment.fileName}</div>
                        <div className="text-xs text-gray-500">
                          {attachment.fileSize ? `${(attachment.fileSize / 1024).toFixed(1)} KB` : 'Unknown size'} 
                          {attachment.attachmentId ? ` (ID: ${attachment.attachmentId})` : attachment.id ? ` (ID: ${attachment.id})` : ''}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        // Handle file download
                        const token = sessionStorage.getItem('token');
                        const link = document.createElement('a');
                        // Check if attachment has attachmentId (TimesheetTask) or id (Task)
                        const attachmentId = attachment.attachmentId || attachment.id;
                        if (attachment.attachmentId) {
                          // TimesheetTask attachment
                          link.href = `${import.meta.env.VITE_API_URL}/api/timesheet-tasks/attachments/${attachmentId}`;
                        } else {
                          // Regular Task attachment
                          link.href = `${import.meta.env.VITE_API_URL}/api/tasks/attachment/${attachmentId}/download`;
                        }
                        link.download = attachment.fileName;
                        link.click();
                      }}
                      className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors cursor-pointer"
                    >
                      Download
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-500 text-sm">No attachments available</div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 rounded-b-lg border-t border-gray-200">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200 cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewTaskModal;