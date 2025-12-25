// AddStoryModal.jsx
import { useState, useEffect, useCallback } from "react";
import { X, BookOpen, User, Target, CheckCircle, AlertCircle, Building, Calendar } from "lucide-react";
import CreatableSelect from 'react-select/creatable';
import axios from "axios";
import { useSession } from "../Context/SessionContext";
import GlobalSnackbar from "./GlobalSnackbar";

// API Base URL
const API_BASE_URL = import.meta.env.VITE_API_URL;

const AddStoryModal = ({ open, onClose, onSubmit, initialStatus, initialValues }) => {
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
  const [asACharCount, setAsACharCount] = useState(0);
  const [iWantToCharCount, setIWantToCharCount] = useState(0);
  const [soThatCharCount, setSoThatCharCount] = useState(0);
  const [acceptanceCharCount, setAcceptanceCharCount] = useState(0);
  const { sessionData } = useSession();

  const [users, setUsers] = useState([]);
  const [storyFiles, setStoryFiles] = useState([]);
  const [systems, setSystems] = useState([]);
  const [sprintList, setSprintList] = useState([]);
  const [releaseList, setReleaseList] = useState([]);
  const [statusFlags, setStatusFlags] = useState([]); // List of status flags
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info"
  });

  // Fetch project-team users for a given projectId
  const fetchUsers = useCallback(async (projectId) => {
    if (!projectId) {
      setUsers([]);
      return;
    }
    try {
      const token = sessionStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/project-team/list/${projectId}`, {
        headers: { Authorization: `${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(Array.isArray(data) ? data : []);
      } else {
        console.warn('Failed to fetch project team users, falling back to tenant users');
        setUsers([]);
      }
    } catch (error) {
      console.error('Error fetching project team users:', error);
      setUsers([]);
    }
  }, []);

  // Handle project selection to fetch sprints and releases
  const handleProjectChange = useCallback(async (projectId) => {
    if (!projectId) {
      setSprintList([]);
      setReleaseList([]);
      setFormData(prev => ({ ...prev, sprint: '', release: '' }));
      return;
    }

    try {
      const token = sessionStorage.getItem('token');
      
      // Fetch sprints for the project
      const sprintResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/sprints/project/${projectId}`, {
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
      const releaseResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/releases/project/${projectId}`, {
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

    // Fetch project team users for this project
    fetchUsers(projectId);
  }, [fetchUsers]);

  useEffect(() => {
    if (open) {
      // Check if initialValues contains story data (for duplication) or filter data
      const isDuplicateData = initialValues?.summary !== undefined || initialValues?.asA !== undefined;
      
      // Get sprint and release IDs - handle both numeric IDs and string IDs
      const sprintId = isDuplicateData ? 
        (initialValues?.sprintId ? String(initialValues.sprintId) : 
         initialValues?.sprint ? String(initialValues.sprint) : "") : 
        (initialValues?.sprint ? String(initialValues.sprint) : "");
      
      const releaseId = isDuplicateData ? 
        (initialValues?.releaseId ? String(initialValues.releaseId) : 
         initialValues?.release ? String(initialValues.release) : "") : 
        (initialValues?.release ? String(initialValues.release) : "");
      
      setFormData({
        projectId: isDuplicateData ? (initialValues?.projectId || "") : (initialValues?.projectName || ""),
        summary: isDuplicateData ? (initialValues?.summary || "") : "",
        asA: isDuplicateData ? (initialValues?.asA || "") : "",
        iWantTo: isDuplicateData ? (initialValues?.iWantTo || "") : "",
        soThat: isDuplicateData ? (initialValues?.soThat || "") : "",
        acceptanceCriteria: isDuplicateData ? (initialValues?.acceptanceCriteria || "") : "",
        status: initialStatus || (isDuplicateData ? (initialValues?.status || "todo") : (initialValues?.status !== 'all' ? initialValues?.status : 'todo')) || "todo",
        priority: isDuplicateData ? (initialValues?.priority || 2) : 2,
        storyPoints: isDuplicateData ? (initialValues?.storyPoints || 0) : 0,
        assignee: isDuplicateData ? (initialValues?.assignee || "") : (initialValues?.assignee || ""),
        sprint: sprintId,
        release: releaseId,
        system: isDuplicateData ? (initialValues?.system || initialValues?.systemName || "") : "",
        createdBy: isDuplicateData ? (initialValues?.createdBy || "") : (initialValues?.createdBy || "")
      });
      
      const projectIdToUse = isDuplicateData ? initialValues?.projectId : initialValues?.projectName;
      if (projectIdToUse) {
        handleProjectChange(projectIdToUse);
      }
    }
  }, [open, initialValues, initialStatus, handleProjectChange]);

  // Ensure sprint and release IDs are set correctly after lists are populated (for duplicate data)
  useEffect(() => {
    if (open && initialValues && (initialValues?.summary !== undefined || initialValues?.asA !== undefined)) {
      // This is duplicate data - ensure sprint and release IDs are strings matching the list format
      const sprintId = initialValues?.sprintId ? String(initialValues.sprintId) : 
                      (initialValues?.sprint ? String(initialValues.sprint) : "");
      const releaseId = initialValues?.releaseId ? String(initialValues.releaseId) : 
                        (initialValues?.release ? String(initialValues.release) : "");
      
      // Update formData only if IDs don't match current values (to avoid unnecessary updates)
      setFormData(prev => {
        const needsUpdate = (sprintId && prev.sprint !== sprintId) || (releaseId && prev.release !== releaseId);
        if (needsUpdate) {
          return {
            ...prev,
            sprint: sprintId || prev.sprint,
            release: releaseId || prev.release
          };
        }
        return prev;
      });
    }
  }, [open, sprintList.length, releaseList.length, initialValues]);

  const getParentIdDisplay = (projId) => {
    if (!projId) return '—';
    const asString = String(projId);
    if (asString.startsWith('PRJ-')) return asString;
    // if numeric id, prefix with PRJ-
    if (/^\d+$/.test(asString)) return `PRJ-${asString}`;
    // try to find matching project by projectName or projectId
    const found = projectList.find(p => String(p.projectId) === asString || p.projectName === asString || p.projectCode === asString);
    if (found) return found.projectCode ? found.projectCode : `PRJ-${found.projectId}`;
    // fallback: prefix anyway
    return `PRJ-${asString}`;
  };

  const getProjectNameDisplay = (projId) => {
    if (!projId) return '—';
    const asString = String(projId);
    // try to find matching project by projectId or projectName
    const found = projectList.find(p => String(p.projectId) === asString || p.projectName === asString || p.projectCode === asString);
    if (found) return found.projectName;
    // fallback
    return '—';
  };

  // Fetch projects and users on modal open
  useEffect(() => {
    const fetchProjectsAndUsers = async () => {
      if (open) {
        try {
          const token = sessionStorage.getItem('token');

          // Fetch projects list
          const projectResponse = await axios.get(
            `${import.meta.env.VITE_API_URL}/api/tenants/${sessionData.tenantId}/projects`,
            {
              headers: { Authorization: `${token}` }
            }
          );
          setProjectList(projectResponse.data);
          console.log('Projects fetched:', projectResponse.data);

        } catch (error) {
          console.error("Error fetching projects:", error);
        }
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
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/status-flags/type/story`, {
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

    fetchProjectsAndUsers();
    // If initialValues include a project, fetch its team
    if (initialValues?.projectName) {
      fetchUsers(initialValues.projectName);
    }
    fetchSystems();
    fetchStatusFlags();

  }, [open, sessionData.tenantId, initialValues.projectName, fetchUsers]);

  // Initialize character counts when form data is set
  useEffect(() => {
    setSummaryCharCount(formData.summary.length);
    setAsACharCount(formData.asA.length);
    setIWantToCharCount(formData.iWantTo.length);
    setSoThatCharCount(formData.soThat.length);
    setAcceptanceCharCount(formData.acceptanceCriteria.length);
  }, [formData.summary, formData.asA, formData.iWantTo, formData.soThat, formData.acceptanceCriteria]);

  useEffect(() => {
    if (open) {
      setErrors({});
    }
  }, [open]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // Check character limits for all fields
    if (name === 'summary') {
      if (value.length > 500) {
        setErrors(prev => ({
          ...prev,
          [name]: "Summary cannot exceed 500 characters"
        }));
        return;
      }
      setSummaryCharCount(value.length);
    } else if (name === 'asA') {
      if (value.length > 150) {
        setErrors(prev => ({
          ...prev,
          [name]: "As A cannot exceed 150 characters"
        }));
        return;
      }
      setAsACharCount(value.length);
    } else if (name === 'iWantTo') {
      if (value.length > 500) {
        setErrors(prev => ({
          ...prev,
          [name]: "I Want To cannot exceed 500 characters"
        }));
        return;
      }
      setIWantToCharCount(value.length);
    } else if (name === 'soThat') {
      if (value.length > 500) {
        setErrors(prev => ({
          ...prev,
          [name]: "So That cannot exceed 500 characters"
        }));
        return;
      }
      setSoThatCharCount(value.length);
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

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    // Limit to 4 files total
    if (storyFiles.length + files.length > 4) {
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

    setStoryFiles(prev => [...prev, ...validFiles]);
    setErrors(prev => ({ ...prev, attachment: "" }));
    e.target.value = null;
  };

  const removeStoryFile = (index) => {
    setStoryFiles(prev => prev.filter((_, i) => i !== index));
  };


  const validateForm = async () => {
    const newErrors = {};

    // Validate required fields
    const projectIdStr = formData.projectId ? String(formData.projectId).trim() : '';
    if (!projectIdStr) {
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

    if (!formData.status?.trim()) {
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
      console.log(projectList.find(project => project.projectId === parseInt(formData.projectId)), formData.projectId)
      // Create UserStoryDto object for the API
      const storyData = {
        projectId: parseInt(formData.projectId) || null,
        parentId: projectList.find(project => project.projectId === parseInt(formData.projectId))?.projectCode || null, // Can be set if needed
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

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/userstory`,
        storyData,
        {
          headers: {
            Authorization: `${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log("User Story added successfully:", response.data);
      const storyUsId = response.data.usId; // Use usId for attachments

      if (storyFiles.length > 0) {
        const uploadPromises = [];
        for (const file of storyFiles) {
          const fileFormData = new FormData();
          fileFormData.append("file", file);

          // The endpoint should be /api/userstory/{usId}/attachment to match the backend
          const uploadPromise = axios.post(
            `${import.meta.env.VITE_API_URL}/api/userstory/${storyUsId}/attachment`,
            fileFormData,
            {
              headers: {
                Authorization: `${token}`,
                'Content-Type': 'multipart/form-data',
              },
            }
          );
          uploadPromises.push(uploadPromise);
        }
        await Promise.all(uploadPromises);
        console.log("All attachments uploaded successfully.");
      }

      onSubmit(response.data);
      handleClose();
    } catch (error) {
      console.error("Error adding user story:", error);

      // Enhanced error message handling
      let errorMessage = "Failed to add user story";

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
      status: initialStatus || "todo",
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
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-2 sm:p-4 lg:p-6">
      {/* thin black overlay behind the modal (no blur) */}
      <div className="absolute inset-0 bg-black opacity-50" aria-hidden="true"></div>
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-xs sm:max-w-2xl md:max-w-4xl lg:max-w-6xl xl:max-w-7xl max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-6 border-b border-gray-200">
          <div className="mb-2 sm:mb-0">
            <h2 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 flex items-center">
              <BookOpen size={20} className="mr-2 text-green-600" />
              Add New User Story
            </h2>
            <p className="mt-1 text-sm text-gray-600">Parent ID: {getParentIdDisplay(formData.projectId)}</p>
            <p className="mt-1 text-sm text-gray-600">Initiative name: {getProjectNameDisplay(formData.projectId)}</p>
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
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
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
                  disabled={loading || !!initialValues?.projectName}
                  title={formData.projectId ? `Selected Initiative ID: ${formData.projectId}` : "Select an Initiative ID"}
                >
                  <option value="" title="No initiative selected">Select Initiative</option>
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
                  placeholder="Search or type new..."
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

              
            </div>

            
            {/* Row 3: Summary */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                <BookOpen size={14} className="inline mr-1" />
                Summary *
                <span className="float-right text-xs text-gray-500">
                  {summaryCharCount}/500 characters
                </span>
              </label>
              <textarea
                name="summary"
                value={formData.summary}
                onChange={handleInputChange}
                rows={3}
                maxLength={500}
                className={`w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 resize-none break-words overflow-wrap-anywhere whitespace-pre-wrap ${errors.summary ? 'border-red-500' : 'border-gray-300'
                  }`}
                placeholder="Enter story summary"
                disabled={loading}
                title={formData.summary ? `Summary (${summaryCharCount}/500 chars): ${formData.summary}` : "Enter story summary"}
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
                <span className="float-right text-xs text-gray-500">
                  {asACharCount}/150 characters
                </span>
              </label>
              <textarea
                name="asA"
                value={formData.asA}
                onChange={handleInputChange}
                rows={2}
                maxLength={150}
                className={`w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 resize-none ${errors.asA ? 'border-red-500' : 'border-gray-300'
                  }`}
                placeholder="As a [user type]"
                disabled={loading}
                title={formData.asA ? `As A (${asACharCount}/150 chars): ${formData.asA}` : "Enter user type"}
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
                <span className="float-right text-xs text-gray-500">
                  {iWantToCharCount}/500 characters
                </span>
              </label>
              <textarea
                name="iWantTo"
                value={formData.iWantTo}
                onChange={handleInputChange}
                rows={3}
                maxLength={500}
                className={`w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 resize-none ${errors.iWantTo ? 'border-red-500' : 'border-gray-300'
                  }`}
                placeholder="I want to [action/goal]"
                disabled={loading}
                title={formData.iWantTo ? `I Want To (${iWantToCharCount}/500 chars): ${formData.iWantTo}` : "Enter desired action or goal"}
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
                <span className="float-right text-xs text-gray-500">
                  {soThatCharCount}/500 characters
                </span>
              </label>
              <textarea
                name="soThat"
                value={formData.soThat}
                onChange={handleInputChange}
                rows={3}
                maxLength={500}
                className={`w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 resize-none ${errors.soThat ? 'border-red-500' : 'border-gray-300'
                  }`}
                placeholder="So that [benefit/value]"
                disabled={loading}
                title={formData.soThat ? `So That (${soThatCharCount}/500 chars): ${formData.soThat}` : "Enter benefit or value"}
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
            <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  <Building size={14} className="inline mr-1" />
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
          <ul className="mt-2 text-xs text-gray-700 flex flex-wrap gap-2">
              {storyFiles.map((file, index) => (
                <li
                  key={index}
                  className="flex items-center justify-between bg-gray-100 px-3 py-1 rounded"
                >
                  <span className="truncate max-w-[150px]" title={file.name}>{file.name}</span>
                  <button
                    type="button"
                    onClick={() => removeStoryFile(index)}
                    className="ml-2 text-red-600 hover:text-red-800 text-xs cursor-pointer"
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>


          {/* Form Actions */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-3 border-t border-gray-200 p-4 sm:p-6">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors cursor-pointer order-2 sm:order-1"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center cursor-pointer order-1 sm:order-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                  Adding...
                </>
              ) : (
                <>
                  <BookOpen size={14} className="mr-2" />
                  Add Story
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

export default AddStoryModal;