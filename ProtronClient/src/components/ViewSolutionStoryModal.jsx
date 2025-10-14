import React, { useState, useEffect } from 'react';
import { X, BookOpen, User, Target, CheckCircle, Calendar, Building, FileText, Hash, Activity, Briefcase } from 'lucide-react';
import axios from 'axios';
import { useSession } from '../Context/SessionContext';

const ViewSolutionStoryModal = ({ open, onClose, storyData }) => {
  const [attachments, setAttachments] = useState([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);
  const [attachmentError, setAttachmentError] = useState(null);
  const [projectName, setProjectName] = useState('');
  const [sprintName, setSprintName] = useState('');
  const [releaseName, setReleaseName] = useState('');
  const [parentStorySummary, setParentStorySummary] = useState('');
  const { sessionData } = useSession();

  useEffect(() => {
    if (open && storyData?.ssId) {
      setLoadingAttachments(true);
      axios
        .get(`${import.meta.env.VITE_API_URL}/api/solutionstory/${storyData.ssId}/attachments`, {
          headers: {
            'Authorization': sessionStorage.getItem('token')
          }
        })
        .then((res) => {
          console.log('Solution story attachments loaded:', res.data);
          setAttachments(res.data);
          setAttachmentError(null);
        })
        .catch((err) => {
          console.error('Error loading Solution story attachments:', err);
          setAttachmentError("Failed to load attachments.");
        })
        .finally(() => setLoadingAttachments(false));
    }
  }, [open, storyData?.ssId]);

  // Fetch names for project, sprint, release, and parent story
  useEffect(() => {
    const fetchNames = async () => {
      if (open && storyData) {
        try {
          // Fetch project name
          if (storyData.projectId) {
            const projectRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/projects/${storyData.projectId}/name`, {
              headers: { 'Authorization': sessionData?.token }
            });
            setProjectName(projectRes.data || 'Unknown Project');
          }

          // Fetch sprint name
          if (storyData.sprint) {
            const sprintRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/sprints/${storyData.sprint}`, {
              headers: { 'Authorization': sessionData?.token }
            });
            setSprintName(sprintRes.data.sprintName || 'Unknown Sprint');
          }

          // Fetch release name
          if (storyData.release) {
            const releaseRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/releases/${storyData.release}`, {
              headers: { 'Authorization': sessionData?.token }
            });
            setReleaseName(releaseRes.data.releaseName || 'Unknown Release');
          }

          // Fetch parent story summary
          if (storyData.parentId) {
            let summary = 'N/A';
            if (storyData.parentId.startsWith('US-')) {
              const usRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/userstory/active/usid/${storyData.parentId}`, {
                headers: { 'Authorization': sessionData?.token }
              });
              summary = usRes.data?.summary || 'N/A';
            } else if (storyData.parentId.startsWith('SS-')) {
              const ssRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/solutionstory/active/ssid/${storyData.parentId}`, {
                headers: { 'Authorization': sessionData?.token }
              });
              summary = ssRes.data?.summary || 'N/A';
            }
            setParentStorySummary(summary);
          }
        } catch (error) {
          console.error('Error fetching names:', error);
          setProjectName('Unknown Project');
          setSprintName('Unknown Sprint');
          setReleaseName('Unknown Release');
          setParentStorySummary('N/A');
        }
      }
    };

    fetchNames();
  }, [open, storyData, sessionData?.token]);

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
      case 'todo':
        return `${baseClasses} bg-gray-100 text-gray-700`;
      case 'in-progress':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case 'completed':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'blocked':
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
              <BookOpen size={24} className="text-white" />
              <div>
                <h2 className="text-xl font-bold">Solution Story Details</h2>
                <p className="text-green-100 text-sm">Story ID: {storyData.ssId}</p>
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
              <FileText size={18} className="mr-2 text-green-600" />
              Basic Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Project" value={projectName || storyData.projectId || 'N/A'} />
              <Field label="Summary" value={storyData.summary} />
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
              <Field label="System" value={storyData.system} />
              <Field label="Assignee" value={storyData.assignee} />
              <Field label="Sprint" value={sprintName || storyData.sprint || 'N/A'} />
              <Field label="Release" value={releaseName || storyData.release || 'N/A'} />
            </div>
          </div>

          {/* Solution Story Details */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <User size={18} className="mr-2 text-green-600" />
              Solution Story Details
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Description</label>
                <div className="text-sm text-gray-900 font-medium bg-white p-3 rounded border min-h-[100px]">
                  {storyData.description || "N/A"}
                </div>
              </div>
            </div>
          </div>

          {/* Related Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Building size={18} className="mr-2 text-green-600" />
              Related Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Parent Story" value={`${parentStorySummary} (${storyData.parentId})`} />
              <Field label="Created By" value={storyData.createdBy} />
              <Field label="Date Created" value={formatDate(storyData.dateCreated)} />
              <Field label="Tenant ID" value={storyData.tenantId} />
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
                      <FileText size={16} className="text-gray-500" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">{attachment.fileName}</div>
                        <div className="text-xs text-gray-500">
                          {attachment.fileSize ? `${(attachment.fileSize / 1024).toFixed(1)} KB` : 'Unknown size'}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = `${import.meta.env.VITE_API_URL}/api/solutionstory/attachment/${attachment.id}/download`;
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

export default ViewSolutionStoryModal;