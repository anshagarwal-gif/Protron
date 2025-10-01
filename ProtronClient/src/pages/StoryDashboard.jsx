import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { FiBookOpen, FiPlus, FiEdit, FiTrash2, FiEye, FiFilter, FiDownload } from 'react-icons/fi';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import CreatableSelect from 'react-select/creatable';
import AddStoryModal from '../components/AddStoryModal';
import EditStoryModal from '../components/EditStoryModal';
import ViewStoryModal from '../components/ViewStoryModal';

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

const StoryDashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [stories, setStories] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [filters, setFilters] = useState({
    projectName: '',
    sprint: '',
    assignee: '',
    createdBy: '',
    status: 'all',
    type: '',
    createdDate: '',
    release: ''
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedStory, setSelectedStory] = useState(null);
  const [viewMode, setViewMode] = useState('dashboard'); // 'dashboard' or 'table'
  const [gridApi, setGridApi] = useState(null);
  const [showBacklog, setShowBacklog] = useState(false); // Show backlog columns
  const [searchTerm, setSearchTerm] = useState(''); // Search term for stories
  const [projectList, setProjectList] = useState([]); // List of projects
  const [sprintList, setSprintList] = useState([]); // List of sprints for selected project
  const [releaseList, setReleaseList] = useState([]); // List of releases for selected project
  const [users, setUsers] = useState([]); // List of users/employees
  const [statusFlags, setStatusFlags] = useState([]); // List of status flags

  // Cascading dropdown states
  const [typeDropdowns, setTypeDropdowns] = useState({
    level1: '', // Main type filter
    level2: '', // Second level dropdown
    level3: ''  // Third level dropdown
  });
  const [showTypeDropdowns, setShowTypeDropdowns] = useState({
    level2: false,
    level3: false
  });

  // Custom cell renderers for AgGrid
  const StatusRenderer = useCallback((params) => {
    const status = params.value;

    // Find the status flag that matches this status value
    const statusFlag = Array.isArray(statusFlags) ? statusFlags.find(flag => flag.statusValue === status) : null;
    const displayText = statusFlag ? statusFlag.statusName : (status ? status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) : '');

    // Default color mapping (can be enhanced to use status flag colors if available)
    const statusColors = {
      'todo': 'bg-gray-100 text-gray-800',
      'in-progress': 'bg-blue-100 text-blue-800',
      'completed': 'bg-green-100 text-green-800',
      'blocked': 'bg-red-100 text-red-800',
      'not-ready': 'bg-red-100 text-red-800',
      'ready': 'bg-purple-100 text-purple-800'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status] || statusColors['todo']}`}>
        {displayText}
      </span>
    );
  }, [statusFlags]);

  const PriorityRenderer = useCallback((params) => {
    const priority = params.value;
    const priorityColors = {
      1: 'bg-red-100 text-red-800',
      2: 'bg-yellow-100 text-yellow-800',
      3: 'bg-green-100 text-green-800'
    };

    const priorityLabels = {
      1: 'HIGH',
      2: 'MEDIUM',
      3: 'LOW'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityColors[priority] || priorityColors[2]}`}>
        {priorityLabels[priority] || priority}
      </span>
    );
  }, []);


  // Fetch projects and users on component mount
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const token = sessionStorage.getItem('token');
        const tenantId = sessionStorage.getItem('tenantId');
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/tenants/${tenantId}/projects`, {
          headers: { Authorization: token }
        });
        const data = await response.json();
        setProjectList(data);
      } catch (error) {
        console.error('Error fetching projects:', error);
      }
    };

    const fetchUsers = async () => {
      try {
        const token = sessionStorage.getItem('token');
        const tenantId = sessionStorage.getItem('tenantId');
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/tenants/${tenantId}/users`, {
          headers: { Authorization: token }
        });
        const data = await response.json();
        setUsers(data);
      } catch (error) {
        console.error('Error fetching users:', error);
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

    fetchProjects();
    fetchUsers();
    fetchStatusFlags();
  }, []);

  // Handle project selection to fetch sprints and releases
  const handleProjectChange = useCallback(async (projectId) => {
    if (!projectId) {
      setSprintList([]);
      setReleaseList([]);
      // Clear and reset type filters when project is deselected
      setTypeDropdowns({ level1: '', level2: '', level3: '' });
      setFilters(prev => ({ ...prev, type: '' }));
      setShowTypeDropdowns({ level2: false, level3: false });
      return;
    }

    try {
      const token = sessionStorage.getItem('token');

      // Fetch sprints for the project
      const sprintUrl = `${import.meta.env.VITE_API_URL}/api/sprints/project/${projectId}`;

      const sprintResponse = await fetch(sprintUrl, {
        headers: { Authorization: token }
      });

      if (sprintResponse.ok) {
        const sprintData = await sprintResponse.json();
        setSprintList(Array.isArray(sprintData) ? sprintData : []);
      } else {
        console.warn('Failed to fetch sprints:', sprintResponse.status, sprintResponse.statusText);
        setSprintList([]);
      }

      // Fetch releases for the project
      const releaseUrl = `${import.meta.env.VITE_API_URL}/api/releases/project/${projectId}`;

      const releaseResponse = await fetch(releaseUrl, {
        headers: { Authorization: token }
      });

      if (releaseResponse.ok) {
        const releaseData = await releaseResponse.json();
        setReleaseList(Array.isArray(releaseData) ? releaseData : []);
      } else {
        console.warn('Failed to fetch releases:', releaseResponse.status, releaseResponse.statusText);
        setReleaseList([]);
      }
    } catch (error) {
      console.error('Error fetching sprints and releases:', error);
      setSprintList([]);
      setReleaseList([]);
    }

    // Set default type to 'User Story' when a project is selected
    if (projectId) {
      setFilters(prev => ({ ...prev, type: 'User Story' }));
      setTypeDropdowns(prev => ({ ...prev, level1: 'User Story' }));
      setShowTypeDropdowns(prev => ({ ...prev, level2: true }));
    }
  }, [setFilters, setTypeDropdowns, setShowTypeDropdowns]);

  // Handle projectId from URL
  useEffect(() => {
    const projectIdFromUrl = searchParams.get('projectId');
    if (projectIdFromUrl) {
      setFilters(prevFilters => ({
        ...prevFilters,
        projectName: projectIdFromUrl,
      }));
      handleProjectChange(projectIdFromUrl);
      searchParams.delete('projectId');
      setSearchParams(searchParams, { replace: true });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, setSearchParams, handleProjectChange]);

  // Fetch stories from API
  useEffect(() => {
    const isInitial = initialLoading;
    const fetchStories = async () => {
      if (isInitial) {
        setInitialLoading(true);
      } else if (gridApi) gridApi.showLoadingOverlay();
      try {
        const token = sessionStorage.getItem('token');
        const tenantId = sessionStorage.getItem('tenantId');

        // Determine which API to call based on the selected type filter
        let apiUrl = '';
        const selectedType = filters.type || '';

        // Parse the cascading type string to find the most recent entity type selection
        const typeParts = selectedType.split(' > ');
        const lastEntityType = typeParts[typeParts.length - 1];

        // Format the date to include time component for LocalDateTime
        const formatDate = (dateStr) => {
          if (!dateStr) return null;
          // Append T00:00:00 to make it a valid LocalDateTime
          return `${dateStr}T00:00:00`;
        };

        // Determine parentId based on type filters level.
        const getParentId = () => {
          // If no project selected, return null
          if (!filters.projectName) return null;

          // If no type selected, we are fetching for a project, so parent is PRJ
          if (!selectedType) return null;

          // For first level type selection
          if (typeParts.length === 1) {
            return 'PRJ';
          }

          // For second level type selection
          if (typeParts.length === 2) {
            // Check the type selected in level 1
            const type1 = typeParts[0];
            return type1 === 'User Story' ? 'US' : 'SS';
          }

          // For third level type selection
          if (typeParts.length === 3) {
            return 'SS';
          }

          return null;
        };

        // Prepare common filter payload
        const basePayload = {
          tenantId: parseInt(tenantId),
          projectId: filters.projectName ? parseInt(filters.projectName) : null,
          assignee: filters.assignee || null, // Changed from createdBy to assignee as per API
          createdDate: formatDate(filters.createdDate),
          parentId: getParentId()
        };

        // Check the most recent entity type selection and prepare type-specific payload
        if (lastEntityType === 'User Story') {
          apiUrl = `${import.meta.env.VITE_API_URL}/api/userstory/filter`;
          const payload = {
            ...basePayload,
            status: filters.status !== 'all' ? filters.status : null,
            sprint: filters.projectName && filters.sprint ? parseInt(filters.sprint) : null,
            releaseId: filters.projectName && filters.release ? parseInt(filters.release) : null,
          };

          const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Authorization': token,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
          });

          if (response.ok) {
            const data = await response.json();
            setStories(data);
          } else {
            throw new Error('Failed to fetch user stories');
          }
        } else if (lastEntityType === 'Solution Story') {
          apiUrl = `${import.meta.env.VITE_API_URL}/api/solutionstory/filter`;
          const payload = {
            ...basePayload,
            status: filters.status !== 'all' ? filters.status : null,
            sprint: filters.projectName && filters.sprint ? parseInt(filters.sprint) : null,
            releaseId: filters.projectName && filters.release ? parseInt(filters.release) : null
          };

          const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Authorization': token,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
          });

          if (response.ok) {
            const data = await response.json();
            setStories(data);
          } else {
            throw new Error('Failed to fetch solution stories');
          }
        } else if (lastEntityType === 'Task') {
          apiUrl = `${import.meta.env.VITE_API_URL}/api/tasks/filter`;
          const payload = {
            ...basePayload
          };

          const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Authorization': token,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
          });

          if (response.ok) {
            const data = await response.json();
            setStories(data);
          } else {
            throw new Error('Failed to fetch tasks');
          }
        } else {
          // Default to UserStory if no specific type is selected
          apiUrl = `${import.meta.env.VITE_API_URL}/api/userstory/filter`;
          const payload = {
            ...basePayload,
            status: filters.status !== 'all' ? filters.status : null,
            sprint: filters.projectName && filters.sprint ? parseInt(filters.sprint) : null,
            releaseId: filters.projectName && filters.release ? parseInt(filters.release) : null
          };

          const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Authorization': token,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
          });

          if (response.ok) {
            const data = await response.json();
            setStories(data);
          } else {
            throw new Error('Failed to fetch default stories');
          }
        }
      } catch (error) {
        console.error('Error fetching stories:', error);
        // Fallback to empty array if API fails
        setStories([]);
      } finally {
        if (isInitial) {
          setInitialLoading(false);
        } else if (gridApi) gridApi.hideOverlay();
      }
    };

    fetchStories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, gridApi]); // Updated dependency array to include all filters

  // Clear type filters when project changes
  useEffect(() => {
    if (!filters.projectName) {
      clearTypeFilters();
    }
  }, [filters.projectName]);
  // Cascading dropdown logic
  const getTypeOptions = (level, parentValue) => {
    if (level === 1) {
      // Level 1: Only show User Story and Solution Story when project is selected
      return filters.projectName ? [
        { value: 'User Story', label: 'User Story' },
        { value: 'Solution Story', label: 'Solution Story' }
      ] : [];
    } else if (level === 2) {
      // Level 2: Show options based on level 1 selection
      if (parentValue === 'User Story') {
        return [
          { value: 'Solution Story', label: 'Solution Story' },
          { value: 'Task', label: 'Task' }
        ];
      } else if (parentValue === 'Solution Story') {
        return [
          { value: 'Task', label: 'Task' }
        ];
      }
      return [];
    } else if (level === 3) {
      // Level 3: Only show Task when Solution Story is selected in level 2
      if (parentValue === 'Solution Story') {
        return [
          { value: 'Task', label: 'Task' }
        ];
      }
      return [];
    }
    return [];
  };

  const handleTypeChange = (level, value) => {
    const newTypeDropdowns = { ...typeDropdowns };
    const newShowDropdowns = { ...showTypeDropdowns };

    if (level === 1) {
      newTypeDropdowns.level1 = value;
      newTypeDropdowns.level2 = '';
      newTypeDropdowns.level3 = '';

      // Show Level 2 for both User Story and Solution Story
      newShowDropdowns.level2 = value ? true : false;
      newShowDropdowns.level3 = false;

      // Update main type filter
      setFilters(prev => ({ ...prev, type: value }));
    } else if (level === 2) {
      newTypeDropdowns.level2 = value;
      newTypeDropdowns.level3 = '';

      // Show Level 3 only if User Story is selected in Level 1 AND Solution Story in Level 2
      newShowDropdowns.level3 = (newTypeDropdowns.level1 === 'User Story' && value === 'Solution Story') ? true : false;

      // Update main type filter to include both levels
      const combinedType = `${newTypeDropdowns.level1} > ${value}`;
      setFilters(prev => ({ ...prev, type: combinedType }));
    } else if (level === 3) {
      newTypeDropdowns.level3 = value;

      // Update main type filter to include all levels
      const combinedType = `${newTypeDropdowns.level1} > ${newTypeDropdowns.level2} > ${value}`;
      setFilters(prev => ({ ...prev, type: combinedType }));
    }

    setTypeDropdowns(newTypeDropdowns);
    setShowTypeDropdowns(newShowDropdowns);
  };

  const clearTypeFilters = () => {
    setTypeDropdowns({ level1: '', level2: '', level3: '' });
    setShowTypeDropdowns({ level2: false, level3: false });
    setFilters(prev => ({ ...prev, type: '' }));
  };

  const filteredStories = useMemo(() => stories.filter(story => {
    return !searchTerm ||
      story.summary?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      story.asA?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      story.iWantTo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      story.soThat?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      story.acceptanceCriteria?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      story.assignee?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      story.system?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      story.createdBy?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      story.projectId?.toString().includes(searchTerm) ||
      story.sprint?.toString().includes(searchTerm) ||
      story.release?.toString().includes(searchTerm);
  }), [stories, searchTerm]);

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 1: return 'bg-red-100 text-red-800';
      case 2: return 'bg-yellow-100 text-yellow-800';
      case 3: return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const refreshStories = useCallback(() => {
    // This function will now just trigger the useEffect by updating filters.
    // A new object is created to ensure the state update is detected.
    setFilters(currentFilters => ({ ...currentFilters }));
  }, []);

  const handleAddStory = async () => {
    refreshStories();
    setShowAddModal(false);
    toast.success('Story added successfully!');
  };

  const handleUpdateStory = async () => {
    refreshStories();
    setShowEditModal(false);
    toast.success('Story updated successfully!');
  };

  const handleDeleteStory = useCallback(async (id) => {
    if (window.confirm('Are you sure you want to delete this story?')) {
      try {
        const token = sessionStorage.getItem('token');

        // First get the usId for the story
        const storyResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/userstory/active/id/${id}`, {
          headers: { Authorization: token }
        });

        if (storyResponse.ok) {
          const storyData = await storyResponse.json();
          const usId = storyData.usId;

          // Delete the story using usId
          const deleteResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/userstory/${usId}`, {
            method: 'DELETE',
            headers: { Authorization: token }
          });

          if (deleteResponse.ok) {
            refreshStories();
            toast.success('Story deleted successfully');
          } else {
            toast.error('Failed to delete story');
          }
        } else {
          toast.error('Failed to find story');
        }
      } catch (error) {
        console.error('Error deleting story:', error);
        toast.error('Error deleting story');
      }
    }
  }, [refreshStories]);

  const openEditModal = useCallback((story) => {
    setSelectedStory(story);
    setShowEditModal(true);
  }, []);

  const openViewModal = useCallback((story) => {
    setSelectedStory(story);
    setShowViewModal(true);
  }, []);

  // Download Excel function
  const downloadExcel = useCallback(() => {
    try {
      let dataToExport = [];
      let filename = '';

      if (viewMode === 'dashboard') {
        // Export all stories for dashboard view
        dataToExport = filteredStories.map(story => ({
          'Project ID': story.projectId,
          'Summary': story.summary,
          'As A': story.asA,
          'I Want To': story.iWantTo,
          'So That': story.soThat,
          'Acceptance Criteria': story.acceptanceCriteria,
          'Status': story.status,
          'Priority': story.priority === 1 ? 'High' : story.priority === 2 ? 'Medium' : 'Low',
          'Story Points': story.storyPoints,
          'Assignee': story.assignee,
          'Sprint': story.sprint,
          'Release': story.release,
          'System': story.system,
          'Created By': story.createdBy,
          'Date Created': story.dateCreated ? new Date(story.dateCreated).toLocaleDateString() : ''
        }));
        filename = 'stories_dashboard_view.xlsx';
      } else if (viewMode === 'table') {
        if (showBacklog) {
          // Export stories with backlog columns
          dataToExport = filteredStories.map(story => ({
            'Project ID': story.projectId,
            'Summary': story.summary,
            'As A': story.asA,
            'I Want To': story.iWantTo,
            'So That': story.soThat,
            'Acceptance Criteria': story.acceptanceCriteria,
            'Status': story.status,
            'Priority': story.priority === 1 ? 'High' : story.priority === 2 ? 'Medium' : 'Low',
            'Story Points': story.storyPoints,
            'Assignee': story.assignee,
            'Sprint': story.sprint,
            'Release': story.release,
            'System': story.system,
            'Created By': story.createdBy,
            'Date Created': story.dateCreated ? new Date(story.dateCreated).toLocaleDateString() : '',
            'Backlog Status': story.status === 'not-ready' ? 'Not Ready' : story.status === 'ready' ? 'Ready' : 'N/A'
          }));
          filename = 'stories_table_view_with_backlog.xlsx';
        } else {
          // Export stories for regular table view
          dataToExport = filteredStories.map(story => ({
            'Project ID': story.projectId,
            'Summary': story.summary,
            'As A': story.asA,
            'I Want To': story.iWantTo,
            'So That': story.soThat,
            'Acceptance Criteria': story.acceptanceCriteria,
            'Status': story.status,
            'Priority': story.priority === 1 ? 'High' : story.priority === 2 ? 'Medium' : 'Low',
            'Story Points': story.storyPoints,
            'Assignee': story.assignee,
            'Sprint': story.sprint,
            'Release': story.release,
            'System': story.system,
            'Created By': story.createdBy,
            'Date Created': story.dateCreated ? new Date(story.dateCreated).toLocaleDateString() : ''
          }));
          filename = 'stories_table_view.xlsx';
        }
      }

      if (dataToExport.length === 0) {
        toast.error('No data to export');
        return;
      }

      // Convert to CSV format
      const headers = Object.keys(dataToExport[0]);
      const csvContent = [
        headers.join(','),
        ...dataToExport.map(row =>
          headers.map(header => {
            const value = row[header];
            // Escape commas and quotes in CSV
            if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          }).join(',')
        )
      ].join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename.replace('.xlsx', '.csv'));
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`Excel file downloaded: ${filename.replace('.xlsx', '.csv')}`);
    } catch (error) {
      console.error('Error downloading Excel file:', error);
      toast.error('Failed to download Excel file');
    }
  }, [viewMode, showBacklog, filteredStories]);

  const ActionsRenderer = useCallback((params) => {
    const story = params.data;
    const storyId = story.id || story.ssId || story.taskId;
    const storyType = story.id ? 'userstory' : story.ssId ? 'solutionstory' : story.taskId ? 'task' : null;

    return (
      <div className="flex items-center space-x-2">
        <button
          onClick={() => openViewModal(story)}
          className="text-gray-400 hover:text-blue-600 transition-colors duration-200 p-1 cursor-pointer"
          title={`View ${storyType || 'item'}`}
        >
          <FiEye size={16} />
        </button>
        <button
          onClick={() => openEditModal(story)}
          className="text-gray-400 hover:text-green-600 transition-colors duration-200 p-1 cursor-pointer"
          title={`Edit ${storyType || 'item'}`}
        >
          <FiEdit size={16} />
        </button>
        {storyType === 'userstory' && (
          <button
            onClick={() => {
              const parentStoryData = encodeURIComponent(JSON.stringify(story));
              window.open(`/solution-story-management?parentStory=${parentStoryData}`, '_blank');
            }}
            className="text-gray-400 hover:text-blue-600 transition-colors duration-200 p-1 cursor-pointer"
            title="Add Solution Story"
          >
            <FiPlus size={16} />
          </button>
        )}
        {(storyType === 'userstory' || storyType === 'solutionstory') && (
          <button
            onClick={() => {
              const parentStoryData = encodeURIComponent(JSON.stringify(story));
              window.open(`/task-management?parentStory=${parentStoryData}`, '_blank');
            }}
            className="text-gray-400 hover:text-purple-600 transition-colors duration-200 p-1 cursor-pointer"
            title="Add Task"
          >
            <FiPlus size={16} />
          </button>
        )}
        <button
          onClick={() => handleDeleteStory(story.id)}
          className="text-gray-400 hover:text-red-600 transition-colors duration-200 p-1 cursor-pointer"
          title="Delete Story"
        >
          <FiTrash2 size={16} />
        </button>
      </div>
    );
  }, [openViewModal, openEditModal, handleDeleteStory]);

  // AgGrid column definitions - Dynamic based on type filter
  const columnDefs = useMemo(() => {
    const baseColumns = [
      {
        headerName: '#',
        valueGetter: (params) => params.node.rowIndex + 1,
        width: 60,
        pinned: 'left',
        suppressMenu: true,
        sortable: false,
        filter: false,
      },
      {
        headerName: 'Project',
        field: 'projectName',
        width: 200,
        filter: 'agTextColumnFilter',
        cellStyle: { fontWeight: '500' },
        valueGetter: (params) => {
          const projectId = params.data.projectId;
          const project = projectList.find(p => p.projectId == projectId);
          console.log('AG Grid - Looking for projectId:', projectId, 'in projectList:', projectList);
          console.log('AG Grid - Found project:', project);
          return project ? project.projectName : projectId;
        }
      }
    ];

    // Determine which entity type is selected from any level of the cascading dropdowns
    const selectedType = filters.type || '';

    // Parse the cascading type string to find the most recent entity type selection
    // The string format is "Level1 > Level2 > Level3" or just "Level1"
    const typeParts = selectedType.split(' > ');
    const lastEntityType = typeParts[typeParts.length - 1]; // Get the last (most recent) selection

    // Check the most recent entity type selection
    const isUserStory = lastEntityType === 'User Story';
    const isSolutionStory = lastEntityType === 'Solution Story';
    const isTask = lastEntityType === 'Task';

    if (isUserStory) {
      return [
        ...baseColumns,
        {
          headerName: 'Summary',
          field: 'summary',
          flex: 1,
          minWidth: 200,
          filter: 'agTextColumnFilter',
          cellStyle: { fontWeight: '500' }
        },
        {
          headerName: 'As A',
          field: 'asA',
          flex: 1,
          minWidth: 150,
          filter: 'agTextColumnFilter',
          cellClass: 'ag-cell-truncate',
          tooltipValueGetter: (params) => params.value || 'N/A'
        },
        {
          headerName: 'I Want To',
          field: 'iWantTo',
          flex: 1,
          minWidth: 200,
          filter: 'agTextColumnFilter',
          cellClass: 'ag-cell-truncate',
          tooltipValueGetter: (params) => params.value || 'N/A'
        },
        {
          headerName: 'So That',
          field: 'soThat',
          flex: 1,
          minWidth: 200,
          filter: 'agTextColumnFilter',
          cellClass: 'ag-cell-truncate',
          tooltipValueGetter: (params) => params.value || 'N/A'
        },
        {
          headerName: 'Acceptance Criteria',
          field: 'acceptanceCriteria',
          flex: 1,
          minWidth: 200,
          filter: 'agTextColumnFilter',
          cellClass: 'ag-cell-truncate',
          tooltipValueGetter: (params) => params.value || 'N/A'
        },
        {
          headerName: 'Status',
          field: 'status',
          cellRenderer: StatusRenderer,
          width: 120,
          filter: 'agSetColumnFilter',
          filterParams: {
            values: ['todo', 'wip', 'done', 'blocked', 'not-ready', 'ready']
          }
        },
        {
          headerName: 'Priority',
          field: 'priority',
          cellRenderer: PriorityRenderer,
          width: 100,
          filter: 'agNumberColumnFilter',
          valueFormatter: (params) => {
            const priority = params.value;
            if (priority === 1) return 'High';
            if (priority === 2) return 'Medium';
            if (priority === 3) return 'Low';
            return priority;
          }
        },
        {
          headerName: 'Story Points',
          field: 'storyPoints',
          width: 100,
          filter: 'agNumberColumnFilter',
          cellStyle: { textAlign: 'center' }
        },
        {
          headerName: 'Assignee',
          field: 'assignee',
          width: 120,
          filter: 'agTextColumnFilter',
          cellClass: 'ag-cell-truncate'
        },
        {
          headerName: 'System',
          field: 'system',
          width: 120,
          filter: 'agTextColumnFilter',
          cellClass: 'ag-cell-truncate'
        },
        {
          headerName: 'Actions',
          cellRenderer: ActionsRenderer,
          width: 120,
          suppressMenu: true,
          sortable: false,
          filter: false,
          pinned: 'right'
        }
      ];
    } else if (isSolutionStory) {
      return [
        ...baseColumns,
        {
          headerName: 'Summary',
          field: 'summary',
          flex: 1,
          minWidth: 200,
          filter: 'agTextColumnFilter',
          cellStyle: { fontWeight: '500' }
        },
        {
          headerName: 'Description',
          field: 'description',
          flex: 1,
          minWidth: 300,
          filter: 'agTextColumnFilter',
          cellClass: 'ag-cell-truncate',
          tooltipValueGetter: (params) => params.value || 'N/A'
        },
        {
          headerName: 'Status',
          field: 'status',
          cellRenderer: StatusRenderer,
          width: 120,
          filter: 'agSetColumnFilter',
          filterParams: {
            values: ['todo', 'wip', 'done', 'blocked', 'not-ready', 'ready']
          }
        },
        {
          headerName: 'Priority',
          field: 'priority',
          cellRenderer: PriorityRenderer,
          width: 100,
          filter: 'agNumberColumnFilter',
          valueFormatter: (params) => {
            const priority = params.value;
            if (priority === 1) return 'High';
            if (priority === 2) return 'Medium';
            if (priority === 3) return 'Low';
            return priority;
          }
        },
        {
          headerName: 'Story Points',
          field: 'storyPoints',
          width: 100,
          filter: 'agNumberColumnFilter',
          cellStyle: { textAlign: 'center' }
        },
        {
          headerName: 'Assignee',
          field: 'assignee',
          width: 120,
          filter: 'agTextColumnFilter',
          cellClass: 'ag-cell-truncate'
        },
        {
          headerName: 'System',
          field: 'system',
          width: 120,
          filter: 'agTextColumnFilter',
          cellClass: 'ag-cell-truncate'
        },
        {
          headerName: 'Actions',
          cellRenderer: ActionsRenderer,
          width: 120,
          suppressMenu: true,
          sortable: false,
          filter: false,
          pinned: 'right'
        }
      ];
    } else if (isTask) {
      return [
        ...baseColumns,
        {
          headerName: 'Task Type',
          field: 'taskType',
          width: 120,
          filter: 'agTextColumnFilter',
          cellClass: 'ag-cell-truncate'
        },
        {
          headerName: 'Task Topic',
          field: 'taskTopic',
          flex: 1,
          minWidth: 150,
          filter: 'agTextColumnFilter',
          cellClass: 'ag-cell-truncate',
          tooltipValueGetter: (params) => params.value || 'N/A'
        },
        {
          headerName: 'Task Description',
          field: 'taskDescription',
          flex: 1,
          minWidth: 200,
          filter: 'agTextColumnFilter',
          cellClass: 'ag-cell-truncate',
          tooltipValueGetter: (params) => params.value || 'N/A'
        },
        {
          headerName: 'Est. Time',
          field: 'estTime',
          width: 100,
          filter: 'agTextColumnFilter',
          cellStyle: { textAlign: 'center' }
        },
        {
          headerName: 'Time Spent',
          field: 'timeSpent',
          width: 120,
          filter: 'agTextColumnFilter',
          cellStyle: { textAlign: 'center' },
          valueFormatter: (params) => {
            const hours = params.data?.timeSpentHours || 0;
            const minutes = params.data?.timeSpentMinutes || 0;
            return `${hours}h ${minutes}m`;
          }
        },
        {
          headerName: 'Time Remaining',
          field: 'timeRemaining',
          width: 120,
          filter: 'agTextColumnFilter',
          cellStyle: { textAlign: 'center' },
          valueFormatter: (params) => {
            const hours = params.data?.timeRemainingHours || 0;
            const minutes = params.data?.timeRemainingMinutes || 0;
            return `${hours}h ${minutes}m`;
          }
        },
        {
          headerName: 'Date',
          field: 'date',
          width: 100,
          filter: 'agDateColumnFilter',
          valueFormatter: (params) => {
            return params.value ? new Date(params.value).toLocaleDateString() : 'N/A';
          }
        },
        {
          headerName: 'Created By',
          field: 'createdBy',
          width: 120,
          filter: 'agTextColumnFilter',
          cellClass: 'ag-cell-truncate'
        },
        {
          headerName: 'Actions',
          cellRenderer: ActionsRenderer,
          width: 120,
          suppressMenu: true,
          sortable: false,
          filter: false,
          pinned: 'right'
        }
      ];
    } else {
      // Default columns when no specific type is selected
      return [
        ...baseColumns,
        {
          headerName: 'Summary',
          field: 'summary',
          flex: 1,
          minWidth: 200,
          filter: 'agTextColumnFilter',
          cellStyle: { fontWeight: '500' }
        },
        {
          headerName: 'Status',
          field: 'status',
          cellRenderer: StatusRenderer,
          width: 120,
          filter: 'agSetColumnFilter',
          filterParams: {
            values: ['todo', 'wip', 'done', 'blocked', 'not-ready', 'ready']
          }
        },
        {
          headerName: 'Priority',
          field: 'priority',
          cellRenderer: PriorityRenderer,
          width: 100,
          filter: 'agNumberColumnFilter',
          valueFormatter: (params) => {
            const priority = params.value;
            if (priority === 1) return 'High';
            if (priority === 2) return 'Medium';
            if (priority === 3) return 'Low';
            return priority;
          }
        },
        {
          headerName: 'Assignee',
          field: 'assignee',
          width: 120,
          filter: 'agTextColumnFilter',
          cellClass: 'ag-cell-truncate'
        },
        {
          headerName: 'System',
          field: 'system',
          width: 120,
          filter: 'agTextColumnFilter',
          cellClass: 'ag-cell-truncate'
        },
        {
          headerName: 'Actions',
          cellRenderer: ActionsRenderer,
          width: 120,
          suppressMenu: true,
          sortable: false,
          filter: false,
          pinned: 'right'
        }
      ];
    }
  }, [filters.type, StatusRenderer, PriorityRenderer, ActionsRenderer]);

  // Default column properties
  const defaultColDef = useMemo(() => ({
    sortable: true,
    resizable: true,
    filter: true,
    floatingFilter: false
  }), []);

  // Grid options
  const gridOptions = useMemo(() => ({
    pagination: true,
    paginationPageSize: 20,
    paginationPageSizeSelector: [10, 20, 50, 100],
    suppressRowClickSelection: true,
    rowSelection: 'single',
    animateRows: true,
    suppressMenuHide: true,
    enableCellTextSelection: true,
    ensureDomOrder: true,
    headerHeight: 50,
    rowHeight: 45,
    suppressPaginationPanel: false,
    paginationAutoPageSize: false
  }), []);

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        <span className="ml-4 text-gray-600">Loading stories...</span>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Story Dashboard</h1>
              <p className="text-gray-600">Manage and track user stories across projects</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors duration-200 cursor-pointer"
            >
              <FiPlus size={20} />
              <span>Add Story</span>
            </button>


          </div>
        </div>
      </div>

      {/* Story Board Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        {/* Filter Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Project ID */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Project ID</label>
            <select
              value={filters.projectName}
              onChange={(e) => {
                const projectId = e.target.value;
                setFilters({ ...filters, projectName: projectId, sprint: '', release: '' });
                handleProjectChange(projectId);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">All Projects</option>
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
          </div>

          {/* Sprint */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Sprint</label>
            <CreatableSelect
              value={filters.sprint ? { value: filters.sprint, label: filters.sprint } : null}
              onChange={(selectedOption) => {
                const value = selectedOption ? selectedOption.value : '';
                setFilters({ ...filters, sprint: value });
              }}
              options={Array.isArray(sprintList) ? sprintList.map(sprint => ({
                value: sprint.sprintId.toString(),
                label: sprint.sprintName
              })) : []}
              isClearable
              placeholder="Select or type sprint..."
              isDisabled={!filters.projectName}
              className="text-sm"
              styles={{
                control: (provided) => ({
                  ...provided,
                  minHeight: '40px',
                  borderColor: '#d1d5db',
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
                  color: state.isFocused ? '#065f46' : '#374151'
                })
              }}
            />
          </div>

          {/* Assignee */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Assignee</label>
            <CreatableSelect
              value={filters.assignee ? { value: filters.assignee, label: filters.assignee } : null}
              onChange={(selectedOption) => {
                const value = selectedOption ? selectedOption.value : '';
                setFilters({ ...filters, assignee: value });
              }}
              options={users.map(user => ({
                value: user.name,
                label: user.name
              }))}
              isClearable
              placeholder="Select or type assignee..."
              className="text-sm"
              styles={{
                control: (provided) => ({
                  ...provided,
                  minHeight: '40px',
                  borderColor: '#d1d5db',
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
                  color: state.isFocused ? '#065f46' : '#374151'
                })
              }}
            />
          </div>

          {/* Created By */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Created By</label>
            <CreatableSelect
              value={filters.createdBy ? { value: filters.createdBy, label: filters.createdBy } : null}
              onChange={(selectedOption) => {
                const value = selectedOption ? selectedOption.value : '';
                setFilters({ ...filters, createdBy: value });
              }}
              options={users.map(user => ({
                value: user.name,
                label: user.name
              }))}
              isClearable
              placeholder="Select or type creator..."
              className="text-sm"
              styles={{
                control: (provided) => ({
                  ...provided,
                  minHeight: '40px',
                  borderColor: '#d1d5db',
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
                  color: state.isFocused ? '#065f46' : '#374151'
                })
              }}
            />
          </div>

          {/* Status */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              {Array.isArray(statusFlags) && statusFlags.map(statusFlag => (
                <option key={statusFlag.statusId} value={statusFlag.statusValue}>
                  {statusFlag.statusName}
                </option>
              ))}
            </select>
          </div>


          {/* Created Date */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Created Date</label>
            <input
              type="date"
              value={filters.createdDate}
              onChange={(e) => setFilters({ ...filters, createdDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          {/* Release */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Release</label>
            <CreatableSelect
              value={filters.release ? { value: filters.release, label: filters.release } : null}
              onChange={(selectedOption) => {
                const value = selectedOption ? selectedOption.value : '';
                setFilters({ ...filters, release: value });
              }}
              options={Array.isArray(releaseList) ? releaseList.map(release => ({
                value: release.releaseId.toString(),
                label: release.releaseName
              })) : []}
              isClearable
              placeholder="Select or type release..."
              isDisabled={!filters.projectName}
              className="text-sm"
              styles={{
                control: (provided) => ({
                  ...provided,
                  minHeight: '40px',
                  borderColor: '#d1d5db',
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
                  color: state.isFocused ? '#065f46' : '#374151'
                })
              }}
            />
          </div>
        </div>

        {/* Type Filter */}
        <div className="space-y-3">
          <label className="block text-sm font-medium mt-3 text-gray-700">Type</label>

          {/* Horizontal layout for type filters */}
          <div className="flex flex-wrap gap-2 items-end">
            {/* Level 1: Main Type Filter */}
            <div className="w-[220px]">
              <CreatableSelect
                value={typeDropdowns.level1 ? { value: typeDropdowns.level1, label: typeDropdowns.level1 } : null}
                onChange={(selectedOption) => {
                  const value = selectedOption ? selectedOption.value : '';
                  handleTypeChange(1, value);
                }}
                options={getTypeOptions(1)}
                isClearable
                placeholder={filters.projectName ? "Select type..." : "Select project first"}
                isDisabled={!filters.projectName}
                className="text-sm"
                styles={{
                  control: (provided) => ({
                    ...provided,
                    minHeight: '40px',
                    borderColor: '#d1d5db',
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
                    color: state.isFocused ? '#065f46' : '#374151'
                  })
                }}
              />
            </div>

            {/* Level 2: Second Type Filter */}
            {showTypeDropdowns.level2 && (
              <div className="w-[220px]">
                <CreatableSelect
                  value={typeDropdowns.level2 ? { value: typeDropdowns.level2, label: typeDropdowns.level2 } : null}
                  onChange={(selectedOption) => {
                    const value = selectedOption ? selectedOption.value : '';
                    handleTypeChange(2, value);
                  }}
                  options={getTypeOptions(2, typeDropdowns.level1)}
                  isClearable
                  placeholder="Select sub-type..."
                  className="text-sm"
                  styles={{
                    control: (provided) => ({
                      ...provided,
                      minHeight: '40px',
                      borderColor: '#d1d5db',
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
                      color: state.isFocused ? '#065f46' : '#374151'
                    })
                  }}
                />
              </div>
            )}

            {/* Level 3: Third Type Filter */}
            {showTypeDropdowns.level3 && (
              <div className="w-[220px]">
                <CreatableSelect
                  value={typeDropdowns.level3 ? { value: typeDropdowns.level3, label: typeDropdowns.level3 } : null}
                  onChange={(selectedOption) => {
                    const value = selectedOption ? selectedOption.value : '';
                    handleTypeChange(3, value);
                  }}
                  options={getTypeOptions(3, typeDropdowns.level2)}
                  isClearable
                  placeholder="Select final type..."
                  className="text-sm"
                  styles={{
                    control: (provided) => ({
                      ...provided,
                      minHeight: '40px',
                      borderColor: '#d1d5db',
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
                      color: state.isFocused ? '#065f46' : '#374151'
                    })
                  }}
                />
              </div>
            )}

          </div>
        </div>

        {/* Clear Filters Button */}
        <div className="mt-4 flex justify-end">
          <button
            onClick={() => setFilters({
              projectName: '',
              sprint: '',
              assignee: '',
              createdBy: '',
              status: 'all',
              type: '',
              createdDate: '',
              release: ''
            })}
            className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200 flex items-center space-x-2 cursor-pointer"
          >
            <FiFilter size={16} />
            <span>Clear Filters</span>
          </button>
        </div>
      </div>

      {/* Search Bar and View Controls */}
      <div className="mb-6 flex justify-between items-center">
        {/* Search Bar */}
        <div className="flex items-center">
          <div className="relative">
            <input
              type="text"
              placeholder="Search stories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-80 px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
            />
            <FiFilter size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
        </div>

        {/* View Toggle Buttons and Download Excel */}
        <div className="flex items-center space-x-4">
          {/* View Toggle Buttons */}
          <div className="flex items-center space-x-2">

            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('dashboard')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors duration-200 cursor-pointer ${viewMode === 'dashboard'
                    ? 'bg-white text-green-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                  }`}
              >
                Dashboard View
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors duration-200 cursor-pointer ${viewMode === 'table'
                    ? 'bg-white text-green-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                  }`}
              >
                Table View
              </button>
            </div>
          </div>

          {/* Download Excel Button */}
          <button
            onClick={downloadExcel}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 text-sm font-medium cursor-pointer"
            title={`Download Excel for ${viewMode === 'dashboard' ? 'Dashboard View' : showBacklog ? 'Table View with Backlog' : 'Table View'}`}
          >
            <FiDownload size={16} className="mr-2" />
            Download Excel
          </button>
        </div>
      </div>

      {/* Conditional Rendering based on View Mode */}
      {viewMode === 'dashboard' ? (
        /* Dashboard View - AgGrid */
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="ag-theme-alpine border rounded-lg shadow-sm" style={{ height: '80vh', width: '100%' }}>
            <style jsx>{`
            .ag-cell-truncate {
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }

            .ag-theme-alpine .ag-header {
              background-color: #15803d!important;
              color: white;
              font-weight: 600;
              
              border-bottom: 2px solid #047857;
            }
            .ag-theme-alpine .ag-header-cell {
              
              color: white;
              border-right: 1px solid #047857;
              font-weight: 600;
              font-size: 14px;
            }
                    .ag-theme-alpine .ag-sort-ascending-icon,
                              .ag-theme-alpine .ag-sort-descending-icon,
                              .ag-theme-alpine .ag-sort-none-icon {
                                  color:rgb(246, 246, 246) !important;
                                  font-size: 20px !important;
                                  width: 20px !important;
                                  height: 20px !important;
                                  transform: scale(1.2) !important;
                              }
                                  .ag-theme-alpine .ag-icon {
                                  color:rgb(246, 246, 246) !important;
                                  font-size: 20px !important;
                                  width: 20px !important;
                                  height: 20px !important;
                                  transform: scale(1.2) !important;
                              }
                              .ag-theme-alpine .ag-header-cell .ag-icon {
                                  color:rgb(223, 223, 223) !important;
                                  font-size: 20px !important;
                                  width: 20px !important;
                                  height: 20px !important;
                                  transform: scale(1.2) !important;
                              }
                              .ag-theme-alpine .ag-header-cell-menu-button {
                                  color:rgb(244, 240, 236) !important;
                                  padding: 4px !important;
                              }
                              .ag-theme-alpine .ag-header-cell-menu-button .ag-icon {
                                  font-size: 20px !important;
                                  width: 20px !important;
                                  height: 20px !important;
                                  transform: scale(1.2) !important;
                              }
            .ag-theme-alpine .ag-header-cell:hover {
              background-color: #047857;
            }
            .ag-theme-alpine .ag-row {
              border-bottom: 1px solid #e5e7eb;
            }
            .ag-theme-alpine .ag-row:hover {
              background-color: #f0fdf4;
            }
                                    .ag-theme-alpine .ag-filter-panel .ag-filter-apply-panel .ag-button.ag-button-secondary:hover {
                                  background: #f9fafb;
                                  border-color: #9ca3af;
                              }
/* Left-align header labels */
.ag-theme-alpine .ag-header-cell .ag-header-cell-label {
    justify-content: flex-start;
}


            .ag-theme-alpine .ag-row-even {
              background-color: #ffffff;
            }
            .ag-theme-alpine .ag-row-odd {
              background-color: #f9fafb;
            }
.ag-theme-alpine .ag-cell {
  display: block !important;           /* Override AG Grid's flex */
  text-align: left !important;         /* Ensure text is left-aligned */
  white-space: nowrap;                 /* Prevent wrap */
  overflow: hidden;                    /* Hide overflow */
  text-overflow: ellipsis;            /* Show ... when content is too long */
  word-break: break-word;
  overflow-wrap: anywhere;

  border-right: 1px solid #e5e7eb;
  padding: 8px 12px;
  font-size: 14px;
}


            .ag-theme-alpine .ag-pinned-left-cols-container {
              border-right: 2px solid #d1d5db;
            }
            .ag-theme-alpine .ag-pinned-right-cols-container {
              border-left: 2px solid #d1d5db;
            }
            .ag-theme-alpine .ag-paging-panel {
              border-top: 2px solid #e5e7eb;
              background-color: #f9fafb;
              padding: 12px;
            }
              /* Paging Panel Container */
.ag-theme-alpine .ag-paging-panel {
  border-top: 2px solid #e5e7eb;
  background-color: #f0fdf4;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
  border-radius: 0 0 8px 8px;
  box-shadow: inset 0 1px 0 #d1d5db;
}


.ag-theme-alpine .ag-header-cell-menu-button {
    color: #ffffff !important;
    opacity: 1 !important;
    background: transparent !important;
}

.ag-theme-alpine .ag-header-cell-menu-button:hover {
    opacity: 0.8 !important;
}

.ag-theme-alpine .ag-header-cell-menu-button .ag-icon-menu {
    color: #ffffff !important;
    font-size: 16px !important;
}

.ag-theme-alpine .ag-header-cell-menu-button .ag-icon-filter {
    color: #ffffff !important;
    font-size: 16px !important;
}

/* Style for the filter icon */
.ag-theme-alpine .ag-icon-filter {
    color: #ffffff !important;
    background: transparent !important;
    padding: 2px;
    border-radius: 3px;
}

/* Active filter indicator */
.ag-theme-alpine .ag-header-cell-filtered .ag-header-cell-menu-button {
    opacity: 1 !important;
    background-color: rgba(255, 255, 255, 0.2) !important;
    border-radius: 3px;
}

/* Filter popup menu styling */
.ag-theme-alpine .ag-menu {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.ag-theme-alpine .ag-menu-header {
    background-color: #f9fafb;
    padding: 8px 12px;
    border-bottom: 1px solid #e5e7eb;
}

.ag-theme-alpine .ag-filter-condition {
    padding: 8px 12px;
}

/* Filter buttons in popup */
.ag-theme-alpine .ag-filter-apply-panel button {
    background: #15803d !important;
    color: white !important;
    border: none !important;
    padding: 6px 12px !important;
    border-radius: 4px !important;
    cursor: pointer !important;
    transition: background-color 0.2s !important;
}

.ag-theme-alpine .ag-filter-apply-panel button:hover {
    background: #166534 !important;
}

.ag-theme-alpine .ag-filter-wrapper .ag-filter-body .ag-input-wrapper::before {
    display: none !important;
}

/* Style the filter input */
.ag-theme-alpine .ag-filter-wrapper .ag-filter-body input {
    padding: 8px 12px !important;
    padding-left: 12px !important; /* Remove extra padding for icon */
    width: 100% !important;
    border: 1px solid #d1d5db !important;
    border-radius: 6px !important;
    font-size: 14px !important;
    background-image: none !important; /* Remove any background images */
}

/* Focus state for filter input */
.ag-theme-alpine .ag-filter-wrapper .ag-filter-body input:focus {
    border-color: #15803d !important;
    outline: none !important;
    box-shadow: 0 0 0 3px rgba(21, 128, 61, 0.1) !important;
}

/* Enhanced Pagination Buttons */
.ag-theme-alpine .ag-paging-button {
  background: linear-gradient(135deg, #15803d, #166534);
  color: white;
  border: none;
  border-radius: 4px;
  margin: 0 4px;
  min-width: 30px;
  height: 26px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease-in-out;
  box-shadow: 0 2px 4px rgba(21, 128, 61, 0.2);
  position: relative;
  overflow: hidden;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.ag-theme-alpine .ag-paging-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s ease;
}

.ag-theme-alpine .ag-paging-button:hover {
  background: linear-gradient(135deg, #166534, #14532d);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(21, 128, 61, 0.3);
}

.ag-theme-alpine .ag-paging-button:hover::before {
  left: 100%;
}

.ag-theme-alpine .ag-paging-button:active {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(21, 128, 61, 0.2);
}

.ag-theme-alpine .ag-paging-button[disabled] {
  background: #e5e7eb;
  color: #9ca3af;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.ag-theme-alpine .ag-paging-button[disabled]:hover {
  background: #e5e7eb;
  transform: none;
  box-shadow: none;
}

.ag-theme-alpine .ag-paging-button[disabled]::before {
  display: none;
}

/* First/Last page buttons */
.ag-theme-alpine .ag-paging-button:first-child,
.ag-theme-alpine .ag-paging-button:last-child {
  background: linear-gradient(135deg, #047857, #065f46);
  font-weight: 600;
}

.ag-theme-alpine .ag-paging-button:first-child:hover,
.ag-theme-alpine .ag-paging-button:last-child:hover {
  background: linear-gradient(135deg, #065f46, #064e3b);
}

/* Page Size Dropdown Label */
.ag-theme-alpine .ag-paging-panel::before {
  margin-right: 8px;
  font-weight: 500;
  color: #374151;
}

/* Page Size Selector */
.ag-theme-alpine select {
  padding: 8px 12px;
  border: 2px solid #d1d5db;
  border-radius: 8px;
  background-color: #ffffff;
  color: #111827;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease-in-out;
  appearance: none;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
  background-position: right 8px center;
  background-repeat: no-repeat;
  background-size: 16px;
  padding-right: 32px;
}

.ag-theme-alpine select:hover,
.ag-theme-alpine select:focus {
  border-color: #15803d;
  outline: none;
  background-color: #ecfdf5;
  box-shadow: 0 0 0 3px rgba(21, 128, 61, 0.1);
}

/* Page info text (e.g., 1 to 10 of 16) */
.ag-theme-alpine .ag-paging-row-summary-panel {
  font-weight: 500;
  font-size: 14px;
  color: #374151;
  padding: 8px 12px;

}

/* Pagination container improvements */
.ag-theme-alpine .ag-paging-panel .ag-paging-button-wrapper {
  display: flex;
  align-items: center;
  gap: 4px;
}

/* Current page indicator */
.ag-theme-alpine .ag-paging-button.ag-paging-button-current {
  background: linear-gradient(135deg, #dc2626, #b91c1c);
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(220, 38, 38, 0.3);
}

.ag-theme-alpine .ag-paging-button.ag-paging-button-current:hover {
  background: linear-gradient(135deg, #b91c1c, #991b1b);
}

            `}</style>
            <AgGridReact
              columnDefs={columnDefs}
              rowData={filteredStories}
              defaultColDef={defaultColDef}
              gridOptions={gridOptions}
              overlayLoadingTemplate='<span class="ag-overlay-loading-center">Please wait while your rows are loading</span>'
              onGridReady={(params) => {
                setGridApi(params.api);
                params.api.sizeColumnsToFit();
              }}
              onFirstDataRendered={(params) => {
                params.api.sizeColumnsToFit();
              }}
              enableBrowserTooltips={true}
              tooltipShowDelay={500}
            />
          </div>
        </div>
      ) : (
        /* Table View - Proper Table Format */
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {/* Project Backlog Checkbox */}
          <div className="px-6 py-3 bg-gray-50 border-b border-gray-200 flex justify-end">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showBacklog}
                onChange={(e) => setShowBacklog(e.target.checked)}
                className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2"
              />
              <span className="text-sm font-medium text-gray-700">Project Backlog</span>
            </label>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className={`px-6 py-4 text-left text-sm font-medium text-gray-900 border-r border-gray-200 ${showBacklog ? 'w-1/5' : 'w-1/3'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <button
                          onClick={() => {
                            setSelectedStory({ status: 'todo' });
                            setShowAddModal(true);
                          }}
                          className="mr-2 p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded transition-colors duration-200 cursor-pointer"
                          title="Add Story to TO-DO"
                        >
                          <FiPlus size={16} />
                        </button>
                        <span>TO-DO</span>
                        <span className="ml-2 bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-xs font-medium">
                          {filteredStories.filter(story => story.status === 'todo').length}
                        </span>
                      </div>
                    </div>
                  </th>
                  <th className={`px-6 py-4 text-left text-sm font-medium text-gray-900 border-r border-gray-200 ${showBacklog ? 'w-1/5' : 'w-1/3'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <button
                          onClick={() => {
                            setSelectedStory({ status: 'wip' });
                            setShowAddModal(true);
                          }}
                          className="mr-2 p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded transition-colors duration-200 cursor-pointer"
                          title="Add Story to WIP"
                        >
                          <FiPlus size={16} />
                        </button>
                        <span>WIP</span>
                        <span className="ml-2 bg-blue-200 text-blue-700 px-2 py-1 rounded-full text-xs font-medium">
                          {filteredStories.filter(story => story.status === 'wip').length}
                        </span>
                      </div>
                    </div>
                  </th>
                  <th className={`px-6 py-4 text-left text-sm font-medium text-gray-900 border-r border-gray-200 ${showBacklog ? 'w-1/5' : 'w-1/3'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <button
                          onClick={() => {
                            setSelectedStory({ status: 'done' });
                            setShowAddModal(true);
                          }}
                          className="mr-2 p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded transition-colors duration-200 cursor-pointer"
                          title="Add Story to Done"
                        >
                          <FiPlus size={16} />
                        </button>
                        <span>Done</span>
                        <span className="ml-2 bg-green-200 text-green-700 px-2 py-1 rounded-full text-xs font-medium">
                          {filteredStories.filter(story => story.status === 'done').length}
                        </span>
                      </div>
                    </div>
                  </th>
                  {showBacklog && (
                    <>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-900 border-r border-gray-200 w-1/5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <button
                              onClick={() => {
                                setSelectedStory({ status: 'not-ready' });
                                setShowAddModal(true);
                              }}
                              className="mr-2 p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded transition-colors duration-200 cursor-pointer"
                              title="Add Story to Not Ready"
                            >
                              <FiPlus size={16} />
                            </button>
                            <span>Not Ready</span>
                            <span className="ml-2 bg-red-200 text-red-700 px-2 py-1 rounded-full text-xs font-medium">
                              {filteredStories.filter(story => story.status === 'not-ready').length}
                            </span>
                          </div>
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-900 w-1/5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <button
                              onClick={() => {
                                setSelectedStory({ status: 'ready' });
                                setShowAddModal(true);
                              }}
                              className="mr-2 p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded transition-colors duration-200 cursor-pointer"
                              title="Add Story to Ready"
                            >
                              <FiPlus size={16} />
                            </button>
                            <span>Ready</span>
                            <span className="ml-2 bg-purple-200 text-purple-700 px-2 py-1 rounded-full text-xs font-medium">
                              {filteredStories.filter(story => story.status === 'ready').length}
                            </span>
                          </div>
                        </div>
                      </th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                <tr>
                  {/* TO-DO Column */}
                  <td className={`px-6 py-4 align-top border-r border-gray-200 bg-gray-50 min-h-[400px] ${showBacklog ? 'w-1/5' : 'w-1/3'}`}>
                    <div className="space-y-3">
                      {filteredStories
                        .filter(story => story.status === 'todo')
                        .map((story) => (
                          <div key={story.id} className="group relative bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200">
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="text-sm font-semibold text-gray-900 line-clamp-2 pr-8">{story.summary}</h4>
                              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex space-x-1">
                                <button
                                  onClick={() => openViewModal(story)}
                                  className="text-gray-400 hover:text-blue-600 transition-colors duration-200 p-1 cursor-pointer"
                                >
                                  <FiEye size={14} />
                                </button>
                                <button
                                  onClick={() => openEditModal(story)}
                                  className="text-gray-400 hover:text-green-600 transition-colors duration-200 p-1 cursor-pointer"
                                >
                                  <FiEdit size={14} />
                                </button>
                                <button
                                  onClick={() => handleDeleteStory(story.id)}
                                  className="text-gray-400 hover:text-red-600 transition-colors duration-200 p-1 cursor-pointer"
                                >
                                  <FiTrash2 size={14} />
                                </button>
                              </div>
                            </div>
                            <p className="text-xs text-gray-600 mb-2 line-clamp-2">{story.asA} {story.iWantTo} {story.soThat}</p>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-500">{story.assignee}</span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(story.priority)}`}>
                                {story.priority === 1 ? 'HIGH' : story.priority === 2 ? 'MEDIUM' : 'LOW'}
                              </span>
                            </div>
                          </div>
                        ))}
                      {/* Add Story Button for TO-DO */}
                      <div className="group">
                        <button
                          onClick={() => setShowAddModal(true)}
                          className="w-full bg-gray-100 hover:bg-gray-200 border-2 border-dashed border-gray-300 hover:border-gray-400 rounded-lg p-4 text-gray-500 hover:text-gray-700 transition-all duration-200 flex items-center justify-center space-x-2 opacity-0 group-hover:opacity-100 cursor-pointer"
                        >
                          <FiPlus size={16} />
                          <span className="text-sm font-medium">Add Story</span>
                        </button>
                      </div>
                    </div>
                  </td>

                  {/* WIP Column */}
                  <td className={`px-6 py-4 align-top border-r border-gray-200 bg-blue-50 min-h-[400px] ${showBacklog ? 'w-1/5' : 'w-1/3'}`}>
                    <div className="space-y-3">
                      {(() => {
                        const wipStories = filteredStories.filter(story => story.status === 'wip');
                        console.log('WIP Stories:', wipStories);
                        console.log('All filtered stories statuses:', filteredStories.map(s => ({ id: s.id, status: s.status, summary: s.summary })));
                        return wipStories;
                      })()
                        .map((story) => (
                          <div key={story.id} className="group relative bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200">
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="text-sm font-semibold text-gray-900 line-clamp-2 pr-8">{story.summary}</h4>
                              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex space-x-1">
                                <button
                                  onClick={() => openViewModal(story)}
                                  className="text-gray-400 hover:text-blue-600 transition-colors duration-200 p-1 cursor-pointer"
                                >
                                  <FiEye size={14} />
                                </button>
                                <button
                                  onClick={() => openEditModal(story)}
                                  className="text-gray-400 hover:text-green-600 transition-colors duration-200 p-1 cursor-pointer"
                                >
                                  <FiEdit size={14} />
                                </button>
                                <button
                                  onClick={() => handleDeleteStory(story.id)}
                                  className="text-gray-400 hover:text-red-600 transition-colors duration-200 p-1 cursor-pointer"
                                >
                                  <FiTrash2 size={14} />
                                </button>
                              </div>
                            </div>
                            <p className="text-xs text-gray-600 mb-2 line-clamp-2">{story.asA} {story.iWantTo} {story.soThat}</p>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-500">{story.assignee}</span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(story.priority)}`}>
                                {story.priority === 1 ? 'HIGH' : story.priority === 2 ? 'MEDIUM' : 'LOW'}
                              </span>
                            </div>
                          </div>
                        ))}
                      {/* Add Story Button for WIP */}
                      <div className="group">
                        <button
                          onClick={() => setShowAddModal(true)}
                          className="w-full bg-blue-100 hover:bg-blue-200 border-2 border-dashed border-blue-300 hover:border-blue-400 rounded-lg p-4 text-blue-500 hover:text-blue-700 transition-all duration-200 flex items-center justify-center space-x-2 opacity-0 group-hover:opacity-100 cursor-pointer"
                        >
                          <FiPlus size={16} />
                          <span className="text-sm font-medium">Add Story</span>
                        </button>
                      </div>
                    </div>
                  </td>

                  {/* Done Column */}
                  <td className={`px-6 py-4 align-top ${showBacklog ? 'border-r border-gray-200' : ''} bg-green-50 min-h-[400px] ${showBacklog ? 'w-1/5' : 'w-1/3'}`}>
                    <div className="space-y-3">
                      {(() => {
                        const completedStories = filteredStories.filter(story => story.status === 'done');
                        console.log('Completed Stories:', completedStories);
                        return completedStories;
                      })()
                        .map((story) => (
                          <div key={story.id} className="group relative bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200">
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="text-sm font-semibold text-gray-900 line-clamp-2 pr-8">{story.summary}</h4>
                              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex space-x-1">
                                <button
                                  onClick={() => openViewModal(story)}
                                  className="text-gray-400 hover:text-blue-600 transition-colors duration-200 p-1 cursor-pointer"
                                >
                                  <FiEye size={14} />
                                </button>
                                <button
                                  onClick={() => openEditModal(story)}
                                  className="text-gray-400 hover:text-green-600 transition-colors duration-200 p-1 cursor-pointer"
                                >
                                  <FiEdit size={14} />
                                </button>
                                <button
                                  onClick={() => handleDeleteStory(story.id)}
                                  className="text-gray-400 hover:text-red-600 transition-colors duration-200 p-1 cursor-pointer"
                                >
                                  <FiTrash2 size={14} />
                                </button>
                              </div>
                            </div>
                            <p className="text-xs text-gray-600 mb-2 line-clamp-2">{story.asA} {story.iWantTo} {story.soThat}</p>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-500">{story.assignee}</span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(story.priority)}`}>
                                {story.priority === 1 ? 'HIGH' : story.priority === 2 ? 'MEDIUM' : 'LOW'}
                              </span>
                            </div>
                          </div>
                        ))}
                      {/* Add Story Button for Done */}
                      <div className="group">
                        <button
                          onClick={() => setShowAddModal(true)}
                          className="w-full bg-green-100 hover:bg-green-200 border-2 border-dashed border-green-300 hover:border-green-400 rounded-lg p-4 text-green-500 hover:text-green-700 transition-all duration-200 flex items-center justify-center space-x-2 opacity-0 group-hover:opacity-100 cursor-pointer"
                        >
                          <FiPlus size={16} />
                          <span className="text-sm font-medium">Add Story</span>
                        </button>
                      </div>
                    </div>
                  </td>

                  {/* Not Ready Column - Only show when backlog is enabled */}
                  {showBacklog && (
                    <td className="px-6 py-4 align-top border-r border-gray-200 bg-red-50 min-h-[400px] w-1/5">
                      <div className="space-y-3">
                        {filteredStories
                          .filter(story => story.status === 'not-ready')
                          .map((story) => (
                            <div key={story.id} className="group relative bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200">
                              <div className="flex items-start justify-between mb-2">
                                <h4 className="text-sm font-semibold text-gray-900 line-clamp-2 pr-8">{story.summary}</h4>
                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex space-x-1">
                                  <button
                                    onClick={() => openViewModal(story)}
                                    className="text-gray-400 hover:text-blue-600 transition-colors duration-200 p-1"
                                  >
                                    <FiEye size={14} />
                                  </button>
                                  <button
                                    onClick={() => openEditModal(story)}
                                    className="text-gray-400 hover:text-green-600 transition-colors duration-200 p-1"
                                  >
                                    <FiEdit size={14} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteStory(story.id)}
                                    className="text-gray-400 hover:text-red-600 transition-colors duration-200 p-1"
                                  >
                                    <FiTrash2 size={14} />
                                  </button>
                                </div>
                              </div>
                              <p className="text-xs text-gray-600 mb-2 line-clamp-2">{story.asA} {story.iWantTo} {story.soThat}</p>
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-gray-500">{story.assignee}</span>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(story.priority)}`}>
                                  {story.priority === 1 ? 'HIGH' : story.priority === 2 ? 'MEDIUM' : 'LOW'}
                                </span>
                              </div>
                            </div>
                          ))}
                        {/* Add Story Button for Not Ready */}
                        <div className="group">
                          <button
                            onClick={() => setShowAddModal(true)}
                            className="w-full bg-red-100 hover:bg-red-200 border-2 border-dashed border-red-300 hover:border-red-400 rounded-lg p-4 text-red-500 hover:text-red-700 transition-all duration-200 flex items-center justify-center space-x-2 opacity-0 group-hover:opacity-100 cursor-pointer"
                          >
                            <FiPlus size={16} />
                            <span className="text-sm font-medium">Add Story</span>
                          </button>
                        </div>
                      </div>
                    </td>
                  )}

                  {/* Ready Column - Only show when backlog is enabled */}
                  {showBacklog && (
                    <td className="px-6 py-4 align-top bg-purple-50 min-h-[400px] w-1/5">
                      <div className="space-y-3">
                        {filteredStories
                          .filter(story => story.status === 'ready')
                          .map((story) => (
                            <div key={story.id} className="group relative bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200">
                              <div className="flex items-start justify-between mb-2">
                                <h4 className="text-sm font-semibold text-gray-900 line-clamp-2 pr-8">{story.summary}</h4>
                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex space-x-1">
                                  <button
                                    onClick={() => openViewModal(story)}
                                    className="text-gray-400 hover:text-blue-600 transition-colors duration-200 p-1"
                                  >
                                    <FiEye size={14} />
                                  </button>
                                  <button
                                    onClick={() => openEditModal(story)}
                                    className="text-gray-400 hover:text-green-600 transition-colors duration-200 p-1"
                                  >
                                    <FiEdit size={14} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteStory(story.id)}
                                    className="text-gray-400 hover:text-red-600 transition-colors duration-200 p-1"
                                  >
                                    <FiTrash2 size={14} />
                                  </button>
                                </div>
                              </div>
                              <p className="text-xs text-gray-600 mb-2 line-clamp-2">{story.asA} {story.iWantTo} {story.soThat}</p>
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-gray-500">{story.assignee}</span>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(story.priority)}`}>
                                  {story.priority === 1 ? 'HIGH' : story.priority === 2 ? 'MEDIUM' : 'LOW'}
                                </span>
                              </div>
                            </div>
                          ))}
                        {/* Add Story Button for Ready */}
                        <div className="group">
                          <button
                            onClick={() => setShowAddModal(true)}
                            className="w-full bg-purple-100 hover:bg-purple-200 border-2 border-dashed border-purple-300 hover:border-purple-400 rounded-lg p-4 text-purple-500 hover:text-purple-700 transition-all duration-200 flex items-center justify-center space-x-2 opacity-0 group-hover:opacity-100 cursor-pointer"
                          >
                            <FiPlus size={16} />
                            <span className="text-sm font-medium">Add Story</span>
                          </button>
                        </div>
                      </div>
                    </td>
                  )}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {filteredStories.length === 0 && (
        <div className="text-center py-12">
          <FiBookOpen className="mx-auto text-gray-400" size={48} />
          <h3 className="mt-4 text-lg font-medium text-gray-900">No stories found</h3>
          <p className="mt-2 text-gray-500">
            {Object.values(filters).some(filter => filter && filter !== 'all')
              ? 'Try adjusting your filter criteria'
              : 'Get started by adding your first story'
            }
          </p>
        </div>
      )}

      {/* Add Story Modal */}
      <AddStoryModal
        open={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setSelectedStory(null);
        }}
        onSubmit={handleAddStory}
        initialStatus={selectedStory?.status}
      />

      {/* Edit Story Modal */}
      <EditStoryModal
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSubmit={handleUpdateStory}
        storyId={selectedStory?.id}
      />

      {/* View Story Modal */}
      <ViewStoryModal
        open={showViewModal}
        onClose={() => setShowViewModal(false)}
        storyData={selectedStory}
      />

    </div>
  );
};

export default StoryDashboard;
