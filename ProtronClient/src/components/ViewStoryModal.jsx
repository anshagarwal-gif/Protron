import React, { useState, useEffect } from 'react';
import { X, BookOpen, User, Target, CheckCircle, Calendar, Building, FileText, Hash, Activity, Briefcase } from 'lucide-react';
import axios from 'axios';

const ViewStoryModal = ({ open, onClose, storyData }) => {
  const [attachments, setAttachments] = useState([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);
  const [attachmentError, setAttachmentError] = useState(null);
  const [projectName, setProjectName] = useState('');
  const [sprintName, setSprintName] = useState('');
  const [releaseName, setReleaseName] = useState('');

  useEffect(() => {
    if (open && storyData?.usId) {
      setLoadingAttachments(true);
      const token = sessionStorage.getItem('token');
      axios
        .get(`${import.meta.env.VITE_API_URL}/api/userstory/${storyData.usId}/attachments`, {
          headers: {
            'Authorization': token
          }
        })
        .then((res) => {
          console.log('UserStory attachments loaded:', res.data);
          setAttachments(res.data);
          setAttachmentError(null);
        })
        .catch((err) => {
          console.error('Error loading UserStory attachments:', err);
          setAttachmentError("Failed to load attachments.");
        })
        .finally(() => setLoadingAttachments(false));
    }
  }, [open, storyData?.usId]);

  // Fetch names for project, sprint, and release
  useEffect(() => {
    const fetchNames = async () => {
      if (open && storyData) {
        try {
          const token = sessionStorage.getItem('token');
          
          // Fetch project name
          if (storyData.projectId) {
            const projectRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/projects/${storyData.projectId}/name`, {
              headers: { 'Authorization': token }
            });
            setProjectName(projectRes.data || 'Unknown Project');
          }

          // Fetch sprint name
          if (storyData.sprint) {
            const sprintRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/sprints/${storyData.sprint}`, {
              headers: { 'Authorization': token }
            });
            setSprintName(sprintRes.data.sprintName || 'Unknown Sprint');
          }

          // Fetch release name
          if (storyData.release) {
            const releaseRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/releases/${storyData.release}`, {
              headers: { 'Authorization': token }
            });
            setReleaseName(releaseRes.data.releaseName || 'Unknown Release');
          }
        } catch (error) {
          console.error('Error fetching names:', error);
          setProjectName('Unknown Project');
          setSprintName('Unknown Sprint');
          setReleaseName('Unknown Release');
        }
      }
    };

    fetchNames();
  }, [open, storyData]);

  if (!open || !storyData) return null;

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

  // Get status display name and tag styling
  const getStatusDisplay = (status) => {
    switch (status) {
      case 'todo':
        return 'To Do';
      case 'in-progress':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      case 'blocked':
        return 'Blocked';
      case 'not-ready':
        return 'Not Ready';
      case 'ready':
        return 'Ready';
      default:
        return status || 'N/A';
    }
  };

  // Function to get tag styling for Status
  const getStatusTag = (status) => {
    const baseClasses = "px-2 py-1 rounded text-xs font-medium";
    switch (status) {
      case "todo":
        return `${baseClasses} bg-gray-100 text-gray-800`;
      case "in-progress":
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case "completed":
        return `${baseClasses} bg-green-100 text-green-800`;
      case "blocked":
        return `${baseClasses} bg-red-100 text-red-800`;
      case "not-ready":
        return `${baseClasses} bg-red-100 text-red-800`;
      case "ready":
        return `${baseClasses} bg-purple-100 text-purple-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-700`;
    }
  };

  // Get priority display name and tag styling
  const getPriorityDisplay = (priority) => {
    switch (priority) {
      case 1:
        return 'High';
      case 2:
        return 'Medium';
      case 3:
        return 'Low';
      default:
        return priority || 'N/A';
    }
  };

  // Function to get tag styling for Priority
  const getPriorityTag = (priority) => {
    const baseClasses = "px-2 py-1 rounded text-xs font-medium";
    switch (priority) {
      case 1:
        return `${baseClasses} bg-red-100 text-red-800`;
      case 2:
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 3:
        return `${baseClasses} bg-green-100 text-green-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-700`;
    }
  };

  // Field component for consistent styling
  const Field = ({ label, value, className = "" }) => (
    <div className={className}>
      <label className="text-xs font-medium text-gray-600 mb-1 block">{label}</label>
      <div className="text-sm text-gray-900 font-medium break-words overflow-wrap-anywhere">
        {value || "N/A"}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 lg:p-6 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-xs sm:max-w-2xl md:max-w-4xl lg:max-w-6xl xl:max-w-7xl max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 bg-green-600 text-white rounded-t-lg">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <BookOpen size={20} className="text-white sm:w-6 sm:h-6" />
              <div>
                <h2 className="text-base sm:text-lg lg:text-xl font-bold">User Story Details</h2>
                <p className="text-green-100 text-xs sm:text-sm">Story ID: {storyData.usId}</p>
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
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Basic Information */}
          <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
              <FileText size={18} className="mr-2 text-green-600" />
              Basic Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
              <Field label="Project" value={projectName || storyData.projectId || 'N/A'} />
              <Field label="Status" value={
                <span className={getStatusTag(storyData.status)}>
                  {getStatusDisplay(storyData.status)}
                </span>
              } />
              <Field label="Priority" value={
                <span className={getPriorityTag(storyData.priority)}>
                  {getPriorityDisplay(storyData.priority)}
                </span>
              } />
              <Field label="Story Points" value={storyData.storyPoints} />
              <Field label="Assignee" value={storyData.assignee} />
              <Field label="Sprint" value={sprintName || storyData.sprint || 'N/A'} />
              <Field label="Release" value={releaseName || storyData.release || 'N/A'} />
            </div>
          </div>

          {/* Summary */}
          <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
              <FileText size={18} className="mr-2 text-green-600" />
              Summary
            </h3>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Summary</label>
              <div className="text-sm text-gray-900 font-medium bg-white p-3 rounded border min-h-[100px] break-words overflow-wrap-anywhere whitespace-pre-wrap">
                {storyData.summary || "N/A"}
              </div>
            </div>
          </div>

          {/* User Story Details */}
          <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
              <User size={18} className="mr-2 text-green-600" />
              User Story Details
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">As A</label>
                <div className="text-sm text-gray-900 font-medium bg-white p-3 rounded border break-words overflow-wrap-anywhere whitespace-pre-wrap">
                  {storyData.asA || "N/A"}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">I Want To</label>
                <div className="text-sm text-gray-900 font-medium bg-white p-3 rounded border break-words overflow-wrap-anywhere whitespace-pre-wrap">
                  {storyData.iwantTo || "N/A"}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">So That</label>
                <div className="text-sm text-gray-900 font-medium bg-white p-3 rounded border break-words overflow-wrap-anywhere whitespace-pre-wrap">
                  {storyData.soThat || "N/A"}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Acceptance Criteria</label>
                <div className="text-sm text-gray-900 font-medium bg-white p-3 rounded border min-h-[100px] break-words overflow-wrap-anywhere whitespace-pre-wrap">
                  {storyData.acceptanceCriteria || "N/A"}
                </div>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
              <Building size={18} className="mr-2 text-green-600" />
              Additional Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
              <Field label="System" value={storyData.system} />
              <Field label="Created By" value={storyData.createdBy} />
              <Field label="Date Created" value={formatDate(storyData.dateCreated)} />
            </div>
          </div>

          {/* Attachments */}
          <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
              <FileText size={18} className="mr-2 text-green-600" />
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
                      <FileText size={16} className="text-gray-500" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">{attachment.fileName}</div>
                        <div className="text-xs text-gray-500">
                          {attachment.fileSize ? `${(attachment.fileSize / 1024).toFixed(1)} KB` : 'Unknown size'}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={async () => {
                        try {
                          const token = sessionStorage.getItem('token');
                          const response = await axios({
                            method: 'GET',
                            url: `${import.meta.env.VITE_API_URL}/api/userstory/attachment/${attachment.id}/download`,
                            responseType: 'blob',
                            headers: {
                              'Authorization': token
                            }
                          });

                          // Create blob link to download
                          const url = window.URL.createObjectURL(new Blob([response.data]));
                          const link = document.createElement('a');
                          link.href = url;
                          link.setAttribute('download', attachment.fileName);
                          document.body.appendChild(link);
                          link.click();
                          
                          // Cleanup
                          link.parentNode.removeChild(link);
                          window.URL.revokeObjectURL(url);
                        } catch (error) {
                          console.error('Error downloading file:', error);
                          // You might want to show an error message to the user here
                          alert('Failed to download file. Please try again.');
                        }
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
        <div className="px-4 sm:px-6 py-4 bg-gray-50 rounded-b-lg border-t border-gray-200">
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

export default ViewStoryModal;