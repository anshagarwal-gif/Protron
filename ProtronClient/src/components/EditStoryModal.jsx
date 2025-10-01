// EditStoryModal.jsx
import { useState, useEffect } from "react";
import { X, BookOpen, User, Target, CheckCircle, AlertCircle, Building, Calendar, Paperclip } from "lucide-react";
import CreatableSelect from 'react-select/creatable';
import axios from "axios";
import { useSession } from "../Context/SessionContext";
import GlobalSnackbar from "./GlobalSnackbar";

// API Base URL
const API_BASE_URL = import.meta.env.VITE_API_URL;

const EditStoryModal = ({ open, onClose, onSubmit, storyId }) => {
  const [formData, setFormData] = useState({
    projectId: "",
    summary: "",
    asA: "",
    iWantTo: "",
    soThat: "",
    acceptanceCriteria: "",
    status: "todo",
    priority: 2,
    storyPoints: 0,
    assignee: "",
    sprint: "",
    release: "",
    system: "",
    createdBy: ""
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [projectList, setProjectList] = useState([]);
  const [summaryCharCount, setSummaryCharCount] = useState(0);
  const [acceptanceCharCount, setAcceptanceCharCount] = useState(0);
  const [initialLoading, setInitialLoading] = useState(false);
  const { sessionData } = useSession();

  const [users, setUsers] = useState([]);
  const [storyFiles, setStoryFiles] = useState([]);
  const [systems, setSystems] = useState([]);
  const [newlyAddedFiles, setNewlyAddedFiles] = useState([]);
  const [sprintList, setSprintList] = useState([]);
  const [releaseList, setReleaseList] = useState([]);
  const [statusFlags, setStatusFlags] = useState([]); // List of status flags
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info"
  });

  // Truncate text utility function
  const truncateText = (text, maxLength = 50) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  // Truncate component with hover tooltip
  const TruncatedText = ({ text, maxLength = 50, className = "" }) => {
    const truncated = truncateText(text, maxLength);
    const isOverflow = text && text.length > maxLength;

    if (!isOverflow) {
      return <span className={className}>{text}</span>;
    }
    return (
      <span
        className={`${className} cursor-help relative group`}
        title={text}
      >
        {truncated}
        <div className="invisible group-hover:visible absolute z-10 w-64 p-2 mt-1 text-xs text-white bg-gray-900 rounded-md shadow-lg -top-2 left-0 break-words">
          {text}
          <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
        </div>
      </span>
    );
  };

  // Truncated option component for select dropdowns
  const TruncatedOption = ({ value, text, maxLength = 30 }) => {
    return (
      <option value={value} title={text}>
        {truncateText(text, maxLength)}
      </option>
    );
  };

  const fetchStoryAttachments = async (storyId) => {
    try {
      const storyResponse = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/userstory/active/id/${storyId}`,
        { headers: { Authorization: `${sessionStorage.getItem('token')}` } }
      );
      const usId = storyResponse.data.usId;

      const token = sessionStorage.getItem("token");
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/userstory/${usId}/attachments`,
        {
          headers: { Authorization: token },
        }
      );

      setStoryFiles(response.data); // These are existing attachments from the server
    } catch (error) {
      console.error("Error fetching story attachments:", error);
      setStoryFiles([]);
    }
  };

  // Fetch story data and related lists on modal open
  useEffect(() => {
    const fetchStoryData = async () => {
      if (open && storyId) {
        setInitialLoading(true);
        try {
          const token = sessionStorage.getItem('token');

          // Fetch story data
          const storyResponse = await axios.get(
            `${API_BASE_URL}/api/userstory/active/id/${storyId}`,
            {
              headers: { Authorization: `${token}` }
            }
          );
          
          const storyData = storyResponse.data;
          setFormData({
            projectId: storyData.projectId || "",
            summary: storyData.summary || "",
            asA: storyData.asA || "",
            iWantTo: storyData.iWantTo || "",
            soThat: storyData.soThat || "",
            acceptanceCriteria: storyData.acceptanceCriteria || "",
            status: storyData.status || "todo",
            priority: storyData.priority || 2,
            storyPoints: storyData.storyPoints || 0,
            assignee: storyData.assignee || "",
            sprint: storyData.sprint || "",
            release: storyData.release || "",
            system: storyData.system || "",
            createdBy: storyData.createdBy || ""
          });

          // Fetch attachments
          fetchStoryAttachments(storyId);

        } catch (error) {
          console.error("Error fetching story data:", error);
          setErrors({
            submit: "Failed to load story data"
          });
        } finally {
          setInitialLoading(false);
        }
      }
    };

    const fetchProjectsAndUsers = async () => {
      if (open) {
        try {
          const token = sessionStorage.getItem('token');

          // Fetch projects list
          const projectResponse = await axios.get(
            `${API_BASE_URL}/api/tenants/${sessionData.tenantId}/projects`,
            {
              headers: { Authorization: `${token}` }
            }
          );
          setProjectList(projectResponse.data);

        } catch (error) {
          console.error("Error fetching projects:", error);
        }
      }
    };
    
    const fetchUsers = async () => {
      try {
        const token = sessionStorage.getItem('token');
        const tenantId = sessionStorage.getItem('tenantId');
        const res = await fetch(`${API_BASE_URL}/api/tenants/${tenantId}/users`, {
          headers: { Authorization: `${token}` }
        });
        const data = await res.json();
        setUsers(data);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    const fetchSystems = async () => {
      try {
        const token = sessionStorage.getItem('token');
        const response = await axios.get(`${API_BASE_URL}/api/systems/tenant`, {
          headers: { Authorization: token }
        });
        setSystems(response.data);
      } catch (error) {
        console.error('Error fetching systems:', error);
        setSystems([]);
      }
    };

    const fetchStatusFlags = async () => {
      try {
        const token = sessionStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/api/status-flags/type/story`, {
          headers: { Authorization: token }
        });
        
        if (response.ok) {
          const data = await response.json();
          setStatusFlags(Array.isArray(data) ? data : []);
        } else {
          console.warn('Failed to fetch status flags:', response.status, response.statusText);
          setStatusFlags([]);
        }
      } catch (error) {
        console.error('Error fetching status flags:', error);
        setStatusFlags([]);
      }
    };

    fetchStoryData();
    fetchProjectsAndUsers();
    fetchUsers();
    fetchSystems();
    fetchStatusFlags();
    
  }, [open, storyId]);

  // Initialize character counts when form data is set
  useEffect(() => {
    setSummaryCharCount(formData.summary.length);
    setAcceptanceCharCount(formData.acceptanceCriteria.length);
  }, [formData.summary, formData.acceptanceCriteria]);

  useEffect(() => {
    if (open) {
      setErrors({});
    }
  }, [open]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // Check character limit for summary and acceptance criteria
    if (name === 'summary') {
      if (value.length > 100) {
        setErrors(prev => ({
          ...prev,
          [name]: "Summary cannot exceed 100 characters"
        }));
        return;
      }
      setSummaryCharCount(value.length);
    } else if (name === 'acceptanceCriteria') {
      if (value.length > 1000) {
        setErrors(prev => ({
          ...prev,
          [name]: "Acceptance criteria cannot exceed 1000 characters"
        }));
        return;
      }
      setAcceptanceCharCount(value.length);
    }

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  // Handle project selection to fetch sprints and releases
  const handleProjectChange = async (projectId) => {
    if (!projectId) {
      setSprintList([]);
      setReleaseList([]);
      setFormData(prev => ({ ...prev, sprint: '', release: '' }));
      return;
    }

    try {
      const token = sessionStorage.getItem('token');
      
      // Fetch sprints for the project
      const sprintResponse = await fetch(`${API_BASE_URL}/api/sprints/project/${projectId}`, {
        headers: { Authorization: token }
      });
      
      if (sprintResponse.ok) {
        const sprintData = await sprintResponse.json();
        setSprintList(Array.isArray(sprintData) ? sprintData : []);
      } else {
        console.warn('Failed to fetch sprints:', sprintResponse.status);
        setSprintList([]);
      }

      // Fetch releases for the project
      const releaseResponse = await fetch(`${API_BASE_URL}/api/releases/project/${projectId}`, {
        headers: { Authorization: token }
      });
      
      if (releaseResponse.ok) {
        const releaseData = await releaseResponse.json();
        setReleaseList(Array.isArray(releaseData) ? releaseData : []);
      } else {
        console.warn('Failed to fetch releases:', releaseResponse.status);
        setReleaseList([]);
      }
    } catch (error) {
      console.error('Error fetching sprints and releases:', error);
      setSprintList([]);
      setReleaseList([]);
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    // Limit to 4 files total
    if (storyFiles.length + newlyAddedFiles.length + files.length > 4) {
      setErrors(prev => ({ ...prev, attachment: "Max 4 attachments allowed." }));
      return;
    }

    const maxSize = 10 * 1024 * 1024;
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg',
      'image/png',
      'image/gif',
      'text/plain'
    ];

    let error = "";
    const validFiles = [];

    for (const file of files) {
      if (file.size > maxSize) {
        error = "File must be under 10MB.";
        break;
      }
      if (!allowedTypes.includes(file.type)) {
        error = "Unsupported file type. Upload PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, GIF, or TXT.";
        break;
      }
      validFiles.push(file);
    }

    if (error) {
      setErrors(prev => ({ ...prev, attachment: error }));
      return;
    }

    setNewlyAddedFiles(prev => [...prev, ...validFiles]);
    setErrors(prev => ({ ...prev, attachment: "" }));
    e.target.value = null;
  };

  const removeNewFile = (index) => {
    setNewlyAddedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingFile = async (attachmentId, index) => {
    try {
      const token = sessionStorage.getItem("token");
      await axios.delete(
        `${API_BASE_URL}/api/userstory/attachment/${attachmentId}`,
        {
          headers: { Authorization: token },
        }
      );
      setStoryFiles(prev => prev.filter((_, i) => i !== index));
      setSnackbar({ open: true, message: "Attachment deleted.", severity: "success" });
    } catch (error) {
      console.error("Error deleting attachment:", error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || "Failed to delete attachment.",
        severity: "error",
      });
    }
  };

  // Function to handle date input clicks
  const handleDateInputClick = (inputName) => {
    const dateInput = document.getElementsByName(inputName)[0];
    if (dateInput) {
      dateInput.showPicker();
    }
  };

  const validateForm = async () => {
    const newErrors = {};

    // Validate required fields
    if (!formData.projectId) {
      newErrors.projectId = "Project ID is required";
    }

    if (!formData.summary?.trim()) {
      newErrors.summary = "Summary is required";
    }

    if (!formData.asA?.trim()) {
      newErrors.asA = "As A is required";
    }

    if (!formData.iWantTo?.trim()) {
      newErrors.iWantTo = "I Want To is required";
    }

    if (!formData.soThat?.trim()) {
      newErrors.soThat = "So That is required";
    }

    if (!formData.status) {
      newErrors.status = "Status is required";
    }

    if (!formData.priority) {
      newErrors.priority = "Priority is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);

    try {
      const isValid = await validateForm();
      if (!isValid) {
        setLoading(false);
        return;
      }

      const token = sessionStorage.getItem('token');
      if (!token) {
        throw new Error("Missing authentication credentials");
      }

      // Create UserStoryDto object for the API
      const storyData = {
        projectId: parseInt(formData.projectId) || null,
        parentId: null, // Can be set if needed
        status: formData.status,
        priority: parseInt(formData.priority) || 2,
        summary: formData.summary || '',
        asA: formData.asA || '',
        iWantTo: formData.iWantTo || '',
        soThat: formData.soThat || '',
        acceptanceCriteria: formData.acceptanceCriteria || '',
        system: formData.system || '',
        storyPoints: parseInt(formData.storyPoints) || 0,
        assignee: formData.assignee || '',
        releaseId: parseInt(formData.release) || null,
        sprintId: parseInt(formData.sprint) || null
      };

      // Get the usId from the story data
      const storyResponse = await axios.get(
        `${API_BASE_URL}/api/userstory/active/id/${storyId}`,
        { headers: { Authorization: `${token}` } }
      );
      const usId = storyResponse.data.usId;

      const response = await axios.put(
        `${API_BASE_URL}/api/userstory/${usId}`,
        storyData,
        {
          headers: {
            Authorization: `${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      console.log("User Story updated successfully:", response.data);

      // Upload newly added files
      if (newlyAddedFiles.length > 0) {
        const uploadPromises = newlyAddedFiles.map(file => {
          const fileFormData = new FormData();
          fileFormData.append("file", file);
          return axios.post(
            `${API_BASE_URL}/api/userstory/${usId}/attachment`,
            fileFormData,
            {
              headers: {
                Authorization: `${token}`,
                'Content-Type': 'multipart/form-data',
              }
            }
          );
        });
        await Promise.all(uploadPromises);
        console.log("All new attachments uploaded successfully.");
      }

      onSubmit(response.data);
      handleClose();
    } catch (error) {
      console.error("Error updating user story:", error);

      // Enhanced error message handling
      let errorMessage = "Failed to update user story";

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data) {
        if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      setErrors({
        submit: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      projectId: "",
      summary: "",
      asA: "",
      iWantTo: "",
      soThat: "",
      acceptanceCriteria: "",
      status: "todo",
      priority: 2,
      storyPoints: 0,
      assignee: "",
      sprint: "",
      release: "",
      system: "",
      createdBy: ""
    });
    setErrors({});
    setSummaryCharCount(0);
    setAcceptanceCharCount(0);
    setProjectList([]);
    setStoryFiles([]);
    setNewlyAddedFiles([]);
    onClose();
  };

  if (!open) return null;

  if (initialLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-[90vw] w-full max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            <span className="ml-3 text-gray-600">Loading story data...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-[90vw] w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <BookOpen size={20} className="mr-2 text-green-600" />
              Edit User Story
            </h2>
            {errors.submit && (
              <p className="mt-1 text-red-600" style={{ fontSize: '10px' }}>
                {errors.submit}
              </p>
            )}
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
            disabled={loading}
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Error Display */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 flex items-center">
              <AlertCircle size={18} className="text-red-500 mr-2" />
              <span className="text-red-700 text-sm">{errors.submit}</span>
            </div>
          )}

          <div className="space-y-4">
            {/* Row 1: Project ID, Status, Priority, Story Points */}
            <div className="grid grid-cols-5 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  <Building size={14} className="inline mr-1" />
                  Project ID *
                </label>
                <select
                  name="projectId"
                  value={formData.projectId}
                  onChange={(e) => {
                    const projectId = e.target.value;
                    setFormData(prev => ({ ...prev, projectId, sprint: '', release: '' }));
                    handleProjectChange(projectId);
                  }}
                  className={`w-full px-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 ${errors.projectId ? 'border-red-500' : 'border-gray-300'
                    }`}
                  disabled={loading}
                  title={formData.projectId ? `Selected Project ID: ${formData.projectId}` : "Select a Project ID"}
                >
                  <option value="" title="No project selected">Select Project</option>
                  {projectList.map(project => (
                    <option
                      key={project.projectId}
                      value={project.projectId}
                      title={project.projectName}
                    >
                      {project.projectName.length > 30 ? `${project.projectName.substring(0, 30)}...` : project.projectName}
                    </option>
                  ))}
                </select>
                {errors.projectId && (
                  <p className="mt-1 text-xs text-red-600" title={`Error: ${errors.projectId}`}>
                    {errors.projectId.length > 30 ? `${errors.projectId.substring(0, 30)}...` : errors.projectId}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  <CheckCircle size={14} className="inline mr-1" />
                  Status *
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 ${errors.status ? 'border-red-500' : 'border-gray-300'
                    }`}
                  disabled={loading}
                  title={`Selected Status: ${formData.status}`}
                >
                  {Array.isArray(statusFlags) && statusFlags.map(statusFlag => (
                    <option key={statusFlag.statusId} value={statusFlag.statusValue} title={`${statusFlag.statusName} - ${statusFlag.remarks || 'No description available'}`}>
                      {statusFlag.statusName}
                    </option>
                  ))}
                </select>
                {errors.status && (
                  <p className="mt-1 text-xs text-red-600" title={`Error: ${errors.status}`}>
                    {errors.status.length > 30 ? `${errors.status.substring(0, 30)}...` : errors.status}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  <Target size={14} className="inline mr-1" />
                  Priority *
                </label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 ${errors.priority ? 'border-red-500' : 'border-gray-300'
                    }`}
                  disabled={loading}
                  title={`Selected Priority: ${formData.priority === 1 ? 'High' : formData.priority === 2 ? 'Medium' : 'Low'}`}
                >
                  <option value={1} title="High Priority - Critical and urgent">High</option>
                  <option value={2} title="Medium Priority - Important but not urgent">Medium</option>
                  <option value={3} title="Low Priority - Nice to have">Low</option>
                </select>
                {errors.priority && (
                  <p className="mt-1 text-xs text-red-600" title={`Error: ${errors.priority}`}>
                    {errors.priority.length > 30 ? `${errors.priority.substring(0, 30)}...` : errors.priority}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Story Points
                </label>
                <input
                  type="number"
                  name="storyPoints"
                  value={formData.storyPoints}
                  onChange={handleInputChange}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                  placeholder="0"
                  min="0"
                  disabled={loading}
                  title={formData.storyPoints ? `Story Points: ${formData.storyPoints}` : "Enter story points (optional)"}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  <User size={14} className="inline mr-1" />
                  Assignee
                </label>
                <CreatableSelect
                  value={formData.assignee ? { value: formData.assignee, label: formData.assignee } : null}
                  onChange={(selectedOption) => {
                    const value = selectedOption ? selectedOption.value : '';
                    setFormData(prev => ({ ...prev, assignee: value }));
                  }}
                  options={users.map(user => ({
                    value: user.name,
                    label: user.name
                  }))}
                  isClearable
                  placeholder="Select or type assignee..."
                  isDisabled={loading}
                  className="text-sm"
                  styles={{
                    control: (provided) => ({
                      ...provided,
                      minHeight: '32px',
                      borderColor: '#d1d5db',
                      fontSize: '14px',
                      '&:hover': {
                        borderColor: '#10b981'
                      }
                    }),
                    menu: (provided) => ({
                      ...provided,
                      zIndex: 9999
                    }),
                    option: (provided, state) => ({
                      ...provided,
                      backgroundColor: state.isFocused ? '#f0fdf4' : 'white',
                      color: state.isFocused ? '#065f46' : '#374151',
                      fontSize: '14px'
                    })
                  }}
                />
              </div>
            </div>

            {/* Row 2: Sprint, Release, System, Created By */}
            <div className="grid grid-cols-5 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  <Calendar size={14} className="inline mr-1" />
                  Sprint
                </label>
                <CreatableSelect
                  value={formData.sprint ? (() => {
                    const selectedSprint = sprintList.find(sprint => sprint.sprintId.toString() === formData.sprint);
                    return selectedSprint ? { value: formData.sprint, label: selectedSprint.sprintName } : { value: formData.sprint, label: formData.sprint };
                  })() : null}
                  onChange={(selectedOption) => {
                    const value = selectedOption ? selectedOption.value : '';
                    setFormData(prev => ({ ...prev, sprint: value }));
                  }}
                  options={Array.isArray(sprintList) ? sprintList.map(sprint => ({
                    value: sprint.sprintId.toString(),
                    label: sprint.sprintName
                  })) : []}
                  isClearable
                  placeholder="Select or type sprint..."
                  isDisabled={loading || !formData.projectId}
                  className="text-sm"
                  styles={{
                    control: (provided) => ({
                      ...provided,
                      minHeight: '32px',
                      borderColor: '#d1d5db',
                      fontSize: '14px',
                      '&:hover': {
                        borderColor: '#10b981'
                      }
                    }),
                    menu: (provided) => ({
                      ...provided,
                      zIndex: 9999
                    }),
                    option: (provided, state) => ({
                      ...provided,
                      backgroundColor: state.isFocused ? '#f0fdf4' : 'white',
                      color: state.isFocused ? '#065f46' : '#374151',
                      fontSize: '14px'
                    })
                  }}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  <Calendar size={14} className="inline mr-1" />
                  Release
                </label>
                <CreatableSelect
                  value={formData.release ? (() => {
                    const selectedRelease = releaseList.find(release => release.releaseId.toString() === formData.release);
                    return selectedRelease ? { value: formData.release, label: selectedRelease.releaseName } : { value: formData.release, label: formData.release };
                  })() : null}
                  onChange={(selectedOption) => {
                    const value = selectedOption ? selectedOption.value : '';
                    setFormData(prev => ({ ...prev, release: value }));
                  }}
                  options={Array.isArray(releaseList) ? releaseList.map(release => ({
                    value: release.releaseId.toString(),
                    label: release.releaseName
                  })) : []}
                  isClearable
                  placeholder="Select or type release..."
                  isDisabled={loading || !formData.projectId}
                  className="text-sm"
                  styles={{
                    control: (provided) => ({
                      ...provided,
                      minHeight: '32px',
                      borderColor: '#d1d5db',
                      fontSize: '14px',
                      '&:hover': {
                        borderColor: '#10b981'
                      }
                    }),
                    menu: (provided) => ({
                      ...provided,
                      zIndex: 9999
                    }),
                    option: (provided, state) => ({
                      ...provided,
                      backgroundColor: state.isFocused ? '#f0fdf4' : 'white',
                      color: state.isFocused ? '#065f46' : '#374151',
                      fontSize: '14px'
                    })
                  }}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  <Building size={14} className="inline mr-1" />
                  System
                </label>
                <CreatableSelect
                  options={systems.map(system => ({
                    value: system.systemName,
                    label: system.systemName
                  }))}
                  value={formData.system ? {
                    value: formData.system,
                    label: formData.system
                  } : null}
                  onChange={(selected) => {
                    setFormData(prev => ({
                      ...prev,
                      system: selected?.value || ''
                    }));
                  }}
                  placeholder="Search for systems or type new..."
                  isClearable
                  isSearchable
                  formatCreateLabel={(inputValue) => `Add "${inputValue}"`}
                  styles={{
                    control: (base) => ({
                      ...base,
                      minHeight: '32px',
                      fontSize: '14px'
                    }),
                    menuPortal: base => ({ ...base, zIndex: 9999 }),
                    menu: base => ({ ...base, zIndex: 9999 })
                  }}
                  className="text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  <User size={14} className="inline mr-1" />
                  Created By
                </label>
                <CreatableSelect
                  value={formData.createdBy ? { value: formData.createdBy, label: formData.createdBy } : null}
                  onChange={(selectedOption) => {
                    const value = selectedOption ? selectedOption.value : '';
                    setFormData(prev => ({ ...prev, createdBy: value }));
                  }}
                  options={users.map(user => ({
                    value: user.name,
                    label: user.name
                  }))}
                  isClearable
                  placeholder="Select or type creator..."
                  isDisabled={loading}
                  className="text-sm"
                  styles={{
                    control: (provided) => ({
                      ...provided,
                      minHeight: '32px',
                      borderColor: '#d1d5db',
                      fontSize: '14px',
                      '&:hover': {
                        borderColor: '#10b981'
                      }
                    }),
                    menu: (provided) => ({
                      ...provided,
                      zIndex: 9999
                    }),
                    option: (provided, state) => ({
                      ...provided,
                      backgroundColor: state.isFocused ? '#f0fdf4' : 'white',
                      color: state.isFocused ? '#065f46' : '#374151',
                      fontSize: '14px'
                    })
                  }}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  <Paperclip size={14} className="inline mr-1" />
                  Story Attachments (Max 4)
                </label>
                <input
                  type="file"
                  name="storyAttachment"
                  onChange={handleFileChange}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100"
                  disabled={loading}
                  multiple
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.txt"
                  title="Upload document or image file (max 10MB)"
                />
                {errors.attachment && (
                  <p className="mt-1 text-xs text-red-600">{errors.attachment}</p>
                )}
              </div>
            </div>
            
            {/* Selected Files List */}
            <div className="mt-2 space-y-2">
              <p className="text-xs font-medium text-gray-600">Attachments:</p>
              <ul className="text-xs text-gray-700 flex flex-wrap gap-2">
                {storyFiles.map((file, index) => (
                  <li key={file.attachmentId} className="flex items-center justify-between bg-blue-50 px-3 py-1 rounded">
                    <a href={`${API_BASE_URL}/api/userstory/attachment/${file.attachmentId}/download`} target="_blank" rel="noopener noreferrer" className="truncate max-w-[150px] text-blue-600 hover:underline" title={file.fileName}>
                      {file.fileName}
                    </a>
                    <button
                      type="button"
                      onClick={() => removeExistingFile(file.attachmentId, index)}
                      className="ml-2 text-red-600 hover:text-red-800 text-xs cursor-pointer"
                      disabled={loading}
                    >
                      Delete
                    </button>
                  </li>
                ))}
                {newlyAddedFiles.map((file, index) => (
                  <li key={index} className="flex items-center justify-between bg-green-50 px-3 py-1 rounded">
                    <span className="truncate max-w-[150px]" title={file.name}>{file.name}</span>
                    <button
                      type="button"
                      onClick={() => removeNewFile(index)}
                      className="ml-2 text-red-600 hover:text-red-800 text-xs cursor-pointer"
                      disabled={loading}
                    >
                      Delete
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Row 3: Summary */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                <BookOpen size={14} className="inline mr-1" />
                Summary *
                <span className="float-right text-xs text-gray-500">
                  {summaryCharCount}/100 characters
                </span>
              </label>
              <input
                type="text"
                name="summary"
                value={formData.summary}
                onChange={handleInputChange}
                className={`w-full px-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 ${errors.summary ? 'border-red-500' : 'border-gray-300'
                  }`}
                placeholder="Enter story summary"
                disabled={loading}
                title={formData.summary ? `Summary (${summaryCharCount}/100 chars): ${formData.summary}` : "Enter story summary"}
              />
              {errors.summary && (
                <p className="mt-1 text-xs text-red-600" title={`Error: ${errors.summary}`}>
                  {errors.summary.length > 50 ? `${errors.summary.substring(0, 50)}...` : errors.summary}
                </p>
              )}
            </div>

            {/* Row 4: As A */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                <User size={14} className="inline mr-1" />
                As A *
              </label>
              <input
                type="text"
                name="asA"
                value={formData.asA}
                onChange={handleInputChange}
                className={`w-full px-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 ${errors.asA ? 'border-red-500' : 'border-gray-300'
                  }`}
                placeholder="As a [user type]"
                disabled={loading}
                title={formData.asA ? `As A: ${formData.asA}` : "Enter user type"}
              />
              {errors.asA && (
                <p className="mt-1 text-xs text-red-600" title={`Error: ${errors.asA}`}>
                  {errors.asA.length > 50 ? `${errors.asA.substring(0, 50)}...` : errors.asA}
                </p>
              )}
            </div>

            {/* Row 5: I Want To */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                <Target size={14} className="inline mr-1" />
                I Want To *
              </label>
              <input
                type="text"
                name="iWantTo"
                value={formData.iWantTo}
                onChange={handleInputChange}
                className={`w-full px-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 ${errors.iWantTo ? 'border-red-500' : 'border-gray-300'
                  }`}
                placeholder="I want to [action/goal]"
                disabled={loading}
                title={formData.iWantTo ? `I Want To: ${formData.iWantTo}` : "Enter desired action or goal"}
              />
              {errors.iWantTo && (
                <p className="mt-1 text-xs text-red-600" title={`Error: ${errors.iWantTo}`}>
                  {errors.iWantTo.length > 50 ? `${errors.iWantTo.substring(0, 50)}...` : errors.iWantTo}
                </p>
              )}
            </div>

            {/* Row 6: So That */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                <CheckCircle size={14} className="inline mr-1" />
                So That *
              </label>
              <input
                type="text"
                name="soThat"
                value={formData.soThat}
                onChange={handleInputChange}
                className={`w-full px-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 ${errors.soThat ? 'border-red-500' : 'border-gray-300'
                  }`}
                placeholder="So that [benefit/value]"
                disabled={loading}
                title={formData.soThat ? `So That: ${formData.soThat}` : "Enter benefit or value"}
              />
              {errors.soThat && (
                <p className="mt-1 text-xs text-red-600" title={`Error: ${errors.soThat}`}>
                  {errors.soThat.length > 50 ? `${errors.soThat.substring(0, 50)}...` : errors.soThat}
                </p>
              )}
            </div>

            {/* Row 7: Acceptance Criteria */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                <CheckCircle size={14} className="inline mr-1" />
                Acceptance Criteria
                <span className="float-right text-xs text-gray-500">
                  {acceptanceCharCount}/1000 characters
                </span>
              </label>
              <textarea
                name="acceptanceCriteria"
                value={formData.acceptanceCriteria}
                onChange={handleInputChange}
                rows={4}
                className={`w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 resize-none ${errors.acceptanceCriteria ? 'border-red-500' : 'border-gray-300'
                  }`}
                placeholder="Enter detailed acceptance criteria including conditions, scenarios, and requirements... (Max 1000 characters)"
                disabled={loading}
                title={formData.acceptanceCriteria ? `Acceptance Criteria (${acceptanceCharCount}/1000 chars): ${formData.acceptanceCriteria}` : "Enter acceptance criteria (optional)"}
              />
              {errors.acceptanceCriteria && (
                <p className="mt-1 text-xs text-red-600" title={`Error: ${errors.acceptanceCriteria}`}>
                  {errors.acceptanceCriteria.length > 50 ? `${errors.acceptanceCriteria.substring(0, 50)}...` : errors.acceptanceCriteria}
                </p>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-3 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-1.5 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors cursor-pointer"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-1.5 text-sm bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                  Updating...
                </>
              ) : (
                <>
                  <BookOpen size={14} className="mr-2" />
                  Update Story
                </>
              )}
            </button>
          </div>
        </form>
      </div>
      <GlobalSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
      />
    </div>
  );
};

export default EditStoryModal;