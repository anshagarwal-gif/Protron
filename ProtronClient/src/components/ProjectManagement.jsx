import React, { useEffect, useState, useMemo } from "react"
import axios from "axios"
import { AiFillProject, AiOutlineSearch, AiOutlineDownload } from "react-icons/ai"
import { FiChevronDown, FiUsers, FiEdit, FiEye } from "react-icons/fi"
import { AgGridReact } from 'ag-grid-react'
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community'
import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-alpine.css'
import AddProjectModal from "./AddProjectModal" // Adjust path if needed
import GlobalSnackbar from './GlobalSnackbar';
import ProjectTeamManagement from "./ProjectTeamManagement";
import EditProjectModal from "./EditProjectModal"
import * as XLSX from "xlsx";
import { useAccess } from "../Context/AccessContext"

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

const API_BASE_URL = import.meta.env.VITE_API_URL;

const ProjectManagement = () => {
  const { hasAccess } = useAccess();
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showTeamManagement, setShowTeamManagement] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [selectedEditProjectId, setSelectedEditProjectId] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false)
  
  // Pagination state for mobile view
  const [currentPage, setCurrentPage] = useState(1);
  const [projectsPerPage, setProjectsPerPage] = useState(5);
  const [showEntriesDropdown, setShowEntriesDropdown] = useState(false);
  
  const [projectFormData, setProjectFormData] = useState({ ...selectedProject });
  const [formData, setFormData] = useState({
    projectName: '',
    projectIcon: null,
    startDate: null,
    endDate: null,
    projectManager: null,
    teamMembers: [],
    currency: 'USD',
    cost: '',
    sponsor: null,
    systemImpacted: []
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info', // 'success' | 'error' | 'warning' | 'info'
  });

  // Function to format date as DD-MMM-YYYY (e.g., 12-Sept-2025)
  const formatDate = (dateString) => {
    if (!dateString) return "";
  
    const date = new Date(dateString);
    if (isNaN(date)) return ""; // invalid date
  
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
    const day = date.getDate().toString().padStart(2, '0');
    const month = months[date.getMonth()];
    const year = date.getFullYear();
  
    return `${day}-${month}-${year}`;
  };

  // Custom cell renderers for AgGrid
  const ProjectNameRenderer = (params) => {
    return (
      <span 
        className="font-medium cursor-pointer hover:text-green-600 truncate"
        onClick={() => handleManageTeam(params.data.projectId, params.data)}
        title={params.value}
      >
        {params.value}
      </span>
    );
  };

  const TeamSizeRenderer = (params) => {
    const teamSize = params.data.projectTeam?.length || 0;
    return (
      <span 
        className="text-blue-600 hover:text-green-600 cursor-pointer flex items-center"
        onClick={() => handleManageTeam(params.data.projectId, params.data)}
      >
        <FiUsers className="mr-1" />
        <span className="underline">{teamSize}</span>
      </span>
    );
  };

  const ActionsRenderer = (params) => {
    return (
      <div className="flex justify-center gap-2">
        {/* View Project Button */}
        <button
          onClick={() => handleView(params.data)}
          className="p-2 rounded-full hover:bg-green-100"
          title="View"
        >
          <FiEye size={20} className="text-green-700" />
        </button>

        {/* Edit Project Button */}
        {hasAccess('projects', 'edit') && (
        <button
          onClick={() => setSelectedEditProjectId(params.data.projectId)}
          className="p-2 rounded-full hover:bg-green-100"
          title="Edit"
        >
          <FiEdit size={20} className="text-green-700" />
        </button>)}

        {/* Manage Team Button */}
        <button
          onClick={() => handleManageTeam(params.data.projectId, params.data)}
          className="p-2 rounded-full hover:bg-green-100"
          title="Manage Team"
        >
          <FiUsers size={20} className="text-green-700" />
        </button>
      </div>
    );
  };

  // AgGrid column definitions
  const columnDefs = useMemo(() => [
    {
      headerName: '#',
      valueGetter: (params) => params.node.rowIndex + 1,
      width: 80,
      pinned: 'left',
      suppressMenu: true,
      sortable: false,
      filter: false,
     
    },
    {
      headerName: 'Project Name',
      field: 'projectName',
      cellRenderer: ProjectNameRenderer,
      flex: 1,
      minWidth: 250,
      filter: 'agTextColumnFilter',
      filterParams: {
        filterOptions: ['contains', 'startsWith', 'endsWith'],
        defaultOption: 'contains'
      },
      cellStyle: { fontWeight: '500' }
    },
    {
      headerName: 'Start Date',
      field: 'startDate',
      valueFormatter: (params) => formatDate(params.value),
      width: 130,
      filter: 'agDateColumnFilter',
      cellStyle: { textAlign: 'center' }
    },
    {
      headerName: 'PM Name',
      valueGetter: (params) => {
        const pm = params.data.projectManager;
        return pm ? `${pm.firstName} ${pm.lastName}` : '';
      },
      width: 160,
      filter: 'agTextColumnFilter'
    },
    {
      headerName: 'Team',
      field: 'projectTeam',
      cellRenderer: TeamSizeRenderer,
      valueGetter: (params) => params.data.projectTeam?.length || 0,
      width: 100,
      filter: 'agNumberColumnFilter',
      cellStyle: { textAlign: 'center' }
    },
    {
      headerName: 'Cost Unit',
      field: 'unit',
      valueFormatter: (params) => params.value || '-',
      width: 120,
      filter: 'agTextColumnFilter',
      cellStyle: { textAlign: 'center' }
    },
    {
      headerName: 'Project Cost',
      field: 'projectCost',
      valueFormatter: (params) => params.value ? `₹${params.value}` : '-',
      width: 140,
      filter: 'agNumberColumnFilter',
      cellStyle: { textAlign: 'right', fontWeight: '500' }
    },
    {
      headerName: 'Sponsor',
      valueGetter: (params) => {
        const sponsor = params.data.sponsor;
        return sponsor ? `${sponsor.firstName} ${sponsor.lastName}` : '';
      },
      width: 160,
      filter: 'agTextColumnFilter'
    },
    {
      headerName: 'Actions',
      cellRenderer: ActionsRenderer,
      width: 150,
      suppressMenu: true,
      sortable: false,
      filter: false,
      pinned: 'right',
      cellStyle: { textAlign: 'center' }
    }
  ], [hasAccess]);

  // Default column properties
  const defaultColDef = useMemo(() => ({
    sortable: true,
    resizable: true,
    filter: true,
    floatingFilter: false,
    headerClass: 'ag-header-cell-custom',
    cellClass: 'ag-cell-custom'
  }), []);

  // Grid options
  const gridOptions = useMemo(() => ({
    pagination: true,
    paginationPageSize: 10,
    paginationPageSizeSelector: [5, 10, 20, 50, 100],
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

  // Custom loading component
  const LoadingSpinner = () => (
    <div className="flex flex-col items-center justify-center h-64 bg-white">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mb-4"></div>
      <p className="text-gray-600 text-lg">Loading projects...</p>
    </div>
  );

  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/tenants/${sessionStorage.getItem("tenantId")}/projects`, {
        headers: { Authorization: `${sessionStorage.getItem('token')}` }
      });
      setProjects(res.data);
      console.log(res.data)
      setFilteredProjects(res.data);
    } catch (error) {
      console.log({ message: error });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  // Effect for filtering projects (for mobile view and search)
  useEffect(() => {
    let filtered = [...projects];

    // Apply search filter for project name, PM name, and sponsor
    if (searchTerm.trim() !== '') {
      const searchTermLower = searchTerm.toLowerCase();
      filtered = filtered.filter(project => {
        // Search in project name
        const projectNameMatch = project.projectName.toLowerCase().includes(searchTermLower);

        // Search in PM name (first name or last name)
        const pmFirstName = project.projectManager?.firstName?.toLowerCase() || '';
        const pmLastName = project.projectManager?.lastName?.toLowerCase() || '';
        const pmFullName = `${pmFirstName} ${pmLastName}`.trim();
        const pmMatch = pmFirstName.includes(searchTermLower) ||
          pmLastName.includes(searchTermLower) ||
          pmFullName.includes(searchTermLower);

        // Return true if any of the fields match
        return projectNameMatch || pmMatch;
      });
    }

    setFilteredProjects(filtered);
    setCurrentPage(1); // Reset to first page when filtering
  }, [searchTerm, projects]);

  // Close entries dropdown when clicking outside (for mobile)
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showEntriesDropdown && !event.target.closest('.entries-dropdown-container')) {
        setShowEntriesDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showEntriesDropdown]);

  const handleManageTeam = (projectId, project) => {
    setSelectedProjectId(projectId);
    setSelectedProject(project)
    setShowTeamManagement(true);
  };

  const handleProjectUpdate = async (updatedData) => {
    if (!updatedData.projectName) {
      console.error("Project name is required");
      return;
    }

    setIsLoading(true);

    try {
      // Prepare the correct payload for backend
      const projectData = {
        projectName: updatedData.projectName,
        projectIcon: updatedData.projectIcon,
        startDate: updatedData.startDate
          ? typeof updatedData.startDate === 'object'
            ? updatedData.startDate.toISOString()
            : updatedData.startDate
          : null,
        endDate: updatedData.endDate
          ? typeof updatedData.endDate === 'object'
            ? updatedData.endDate.toISOString()
            : updatedData.endDate
          : null,
        projectCost: updatedData.projectCost,
        projectManagerId: updatedData.projectManager?.userId ?? null, // Send only the userId
        sponsorId: updatedData.sponsor?.userId ??null,
        unit: updatedData.unit,
        systemImpacted: updatedData.systemImpacted,
        removedSystems: updatedData.removedSystems,
      };
      console.log(projectData);
      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/api/projects/edit/${updatedData.projectId}`,
        projectData,
        {
          headers: {
            Authorization: `${sessionStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log("Project updated successfully:", response.data);

      fetchProjects();

      setSelectedEditProjectId(null)

      if (typeof onProjectUpdated === 'function') {
        onProjectUpdated();
      }

    } catch (error) {
      console.error("Failed to update project:", error);
      const errorMessage = error.response?.data?.message || "Failed to update project";
      // Optionally show toast here
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseTeamManagement = () => {
    setSelectedProjectId(null);
    setSelectedProject(null);
    setShowTeamManagement(false);
    fetchProjects();
  };

  const handleAddProjectSubmit = async (data) => {
    // Field validation
    if (
      !data.projectName
    ) {
      setSnackbar({
        open: true,
        message: 'Please fill in all the required fields.',
        severity: 'warning',
      });
      return;
    }

    try {
      const payload = {
        projectName: data.projectName,
        projectIcon: data.projectIcon,
        startDate: data.startDate,
        endDate: data.endDate,
        projectCost: data.cost,
        projectManagerId: data.manager, // match backend DTO field
        tenent: sessionStorage.getItem('tenantId'),
        sponsor: data.sponsor,
        unit: data.currency,
        projectTeam: data.teamMembers.map(userId => ({
          userId: userId,
          status: "active",

        })),
        systemImpacted: data.systemImpacted
      };
      console.log(payload);
      const response = await axios.post(`${API_BASE_URL}/api/projects/add`, payload, {
        headers: {
          Authorization: `${sessionStorage.getItem('token')}`, // or "Bearer " + token if needed
          'Content-Type': 'application/json',
        },

      });
      console.log('Project added successfully:', response.data);

      await fetchProjects();
      // Reset form
      setFormData({
        projectName: '',
        projectIcon: null,
        startDate: null,
        endDate: null,
        manager: null,
        teamMembers: [],
        currency: 'USD',
        cost: '',
        sponsor: data.sponsor,
      });

      setShowAddModal(false);

      setSnackbar({
        open: true,
        message: 'Project added successfully!',
        severity: 'success',
      });
    } catch (error) {
      console.error('Error adding project:', error);
      setSnackbar({
        open: true,
        message: 'Failed to add project. Please try again.',
        severity: 'error',
      });
    }
  };

  const handleCloseModal = () => {
    // Reset form data when closing the modal
    setFormData({
      projectName: '',
      projectIcon: null,
      startDate: null,
      endDate: null,
      manager: null,
      teamMembers: [],
      currency: 'USD',
      cost: '',
    });
    setShowAddModal(false);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleEntriesChange = (value) => {
    setProjectsPerPage(value);
    setCurrentPage(1); // Reset to first page when changing entries per page
    setShowEntriesDropdown(false);
  };

  // Function to download project data as Excel file
  const downloadExcel = () => {
    try {
      // Prepare data for Excel export with all project details
      const excelData = projects.map((project, index) => ({
        'No.': index + 1,
        'Project Name': project.projectName,
        'Start Date': project.startDate ? formatDate(project.startDate) : 'N/A',
        'End Date': project.endDate ? formatDate(project.endDate) : 'N/A',
        'Project Manager': project.projectManager ?
          `${project.projectManager.firstName} ${project.projectManager.lastName}` : 'N/A',
        'Team Size': project.projectTeam ? project.projectTeam.length : 0,
        'Project Cost': project.projectCost ? `₹${project.projectCost}` : 'N/A',
        'Sponsor': project.sponsor ? `${project.sponsor.firstName} ${project.sponsor.lastName}` : 'N/A',
      }));

      // Create worksheet from data
      const worksheet = XLSX.utils.json_to_sheet(excelData);

      // Create workbook and add the worksheet
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Projects');

      // Generate Excel file and trigger download
      XLSX.writeFile(workbook, 'Project_Details.xlsx');

      setSnackbar({
        open: true,
        message: 'Excel file downloaded successfully!',
        severity: 'success',
      });
    } catch (error) {
      console.error('Error downloading Excel:', error);
      setSnackbar({
        open: true,
        message: 'Failed to download Excel file. Please try again.',
        severity: 'error',
      });
    }
  };

  // Get current projects for pagination (mobile view)
  const indexOfLastProject = currentPage * projectsPerPage;
  const indexOfFirstProject = indexOfLastProject - projectsPerPage;
  const currentProjects = filteredProjects.slice(indexOfFirstProject, indexOfLastProject);

  // Calculate total pages (mobile view)
  const totalPages = Math.ceil(filteredProjects.length / projectsPerPage);

  // Change page (mobile view)
  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  
  const handleView = (project) => {
    console.log(project)
    setSelectedProject(project);
    setIsModalOpen(true);
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setSelectedProject(null);
  };

  return (
    <>
      {/* Conditional Rendering: Show either TeamManagement or ProjectManagement */}
      {showTeamManagement && selectedProjectId ? (
        <ProjectTeamManagement
          projectId={selectedProjectId}
          project={selectedProject}
          onClose={handleCloseTeamManagement}
        />
      ) : (
        <div>
          <h1 className="flex items-center gap-2">
            <AiFillProject /> Project Management
          </h1>

          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mt-5">
            <h1 className="text-2xl font-bold text-green-800">Project List</h1>

            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search Input */}
              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="border rounded px-3 py-2 pl-9 w-full"
                />
                <AiOutlineSearch className="absolute left-3 top-3 text-gray-400" />
              </div>

              <div className="flex gap-2 w-full sm:w-auto">
                {/* Excel Download Button */}
                <button
                  className="border px-3 py-2 rounded bg-green-700 text-white hover:bg-green-600 flex items-center justify-center flex-1 sm:flex-none"
                  onClick={downloadExcel}
                >
                  <AiOutlineDownload className="mr-1" />
                  <span className="sm:inline">Export</span>
                </button>

                {/* Add Project Button */}
                {hasAccess('projects', 'edit') && (
                <button
                  className="border px-3 py-2 rounded bg-green-800 text-white hover:bg-green-700 flex items-center justify-center flex-1 sm:flex-none"
                  onClick={() => setShowAddModal(true)}
                >
                  <span className="hidden sm:inline mr-1">+</span> Add Project
                </button>)}
              </div>
            </div>
          </div>

          {/* AgGrid Table - Desktop View */}
          <div className="hidden md:block mt-4">
            {isLoading ? (
              <LoadingSpinner />
            ) : (
              <div className="ag-theme-alpine border rounded-lg shadow-sm" style={{ height: '600px', width: '100%' }}>
                <style jsx>{`
                  .ag-theme-alpine .ag-header {
                    background-color: #065f46;
                    color: white;
                    font-weight: 600;
                    
                    border-bottom: 2px solid #047857;
                  }
                  .ag-theme-alpine .ag-header-cell {
                    background-color: #065f46;
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
                 .ag-theme-alpine .ag-paging-button {
                    background-color:rgb(0, 0, 0);
                    margin-left:5px;
                  }
                  .ag-theme-alpine .ag-paging-button:hover {
                    background-color: #047857;
                  }
                  .ag-theme-alpine .ag-paging-button[disabled] {
                    background-color: #d1d5db;
                    color: #6b7280;
                  }
                `}</style>
                <AgGridReact
                  columnDefs={columnDefs}
                  rowData={filteredProjects}
                  defaultColDef={defaultColDef}
                  gridOptions={gridOptions}
                  suppressRowClickSelection={true}
                  onGridReady={(params) => {
                    params.api.sizeColumnsToFit();
                  }}
                  onFirstDataRendered={(params) => {
                    params.api.sizeColumnsToFit();
                  }}
                  loading={isLoading}
                />
              </div>
            )}
          </div>

          {/* Mobile View - Keep existing mobile card implementation */}
          <div className="md:hidden">
            {isLoading ? (
              <LoadingSpinner />
            ) : (
              <>
                {/* Entries per page dropdown for mobile */}
                <div className="flex items-center mt-4 mb-2 text-gray-700">
                  <span className="mr-2 font-medium">Show</span>
                  <div className="relative entries-dropdown-container">
                    <button
                      className="flex items-center justify-between w-24 px-3 py-2 border border-green-700 rounded bg-white text-green-900 hover:border-green-900 focus:outline-none focus:ring-1 focus:ring-green-700"
                      onClick={() => setShowEntriesDropdown(!showEntriesDropdown)}
                      aria-expanded={showEntriesDropdown}
                      aria-haspopup="true"
                    >
                      <span className="font-medium">{projectsPerPage}</span>
                      <FiChevronDown className={`transition-transform duration-200 ${showEntriesDropdown ? 'transform rotate-180' : ''}`} />
                    </button>

                    {showEntriesDropdown && (
                      <div className="absolute top-full left-0 w-24 mt-1 bg-white border border-green-700 rounded shadow-lg z-10 overflow-hidden">
                        {[5,10, 20, 50, 100].map((value) => (
                          <button
                            key={value}
                            className={`block w-full text-left px-3 py-2 transition-colors duration-150 ${projectsPerPage === value
                              ? 'bg-green-900 text-white font-medium'
                              : 'text-green-900 hover:bg-green-100'
                              }`}
                            onClick={() => handleEntriesChange(value)}
                          >
                            {value}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className="ml-2 font-medium">entries</span>

                  <div className="ml-auto text-sm text-green-800 bg-green-50 px-3 py-1 rounded border border-green-200">
                    Showing <span className="font-semibold">{filteredProjects.length > 0 ? indexOfFirstProject + 1 : 0}</span> to <span className="font-semibold">{Math.min(indexOfLastProject, filteredProjects.length)}</span> of <span className="font-semibold">{filteredProjects.length}</span> entries
                  </div>
                </div>

                {/* Mobile Card View */}
                <div className="border rounded overflow-hidden">
                  {currentProjects.length > 0 ? (
                    currentProjects.map((project, index) => (
                      <div
                        key={project.projectId}
                        className={`border-b p-4 ${index % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
                      >
                        <div className="flex justify-between items-center mb-3">
                          <h3 className="font-medium text-green-700">{project.projectName}</h3>
                          <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">
                            #{indexOfFirstProject + index + 1}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-y-2 text-sm mb-3">
                          <div className="text-gray-500">Start Date:</div>
                          <div>{project.startDate ? formatDate(project.startDate) : 'N/A'}</div>

                          <div className="text-gray-500">PM:</div>
                          <div>{project.projectManager?.firstName} {project.projectManager?.lastName}</div>

                          <div className="text-gray-500">Team Size:</div>
                          <div
                            className="text-blue-600 flex items-center cursor-pointer"
                            onClick={() => handleManageTeam(project.projectId, project)}
                          >
                            <FiUsers className="mr-1" />
                            <span className="underline">{project.projectTeam?.length || 0}</span>
                          </div>

                          <div className="text-gray-500">Cost Unit:</div>
                          <div>{project.unit || '-'}</div>

                          <div className="text-gray-500">Project Cost:</div>
                          <div>{project.projectCost ? `₹${project.projectCost}` : '-'}</div>

                          <div className="text-gray-500">Sponsor:</div>
                          <div>{project.sponsor?.firstName && project.sponsor?.lastName ? `${project.sponsor.firstName} ${project.sponsor.lastName}` : '-'}</div>
                        </div>

                        <div className="mt-3 flex justify-end space-x-2">
                          <button
                            onClick={() => handleView(project)}
                            className="p-2 rounded-full hover:bg-green-100"
                            title="View"
                          >
                            <FiEye size={20} className="text-green-700" />
                          </button>

                          {/* Edit Project Button */}
                          {hasAccess('projects', 'edit') && (
                          <button
                            onClick={() => setSelectedEditProjectId(project.projectId)}
                            className="p-2 rounded-full hover:bg-green-100"
                            title="Edit"
                          >
                            <FiEdit size={20} className="text-green-700" />
                          </button>)}

                          {/* Manage Team Button */}
                          <button
                            onClick={() => handleManageTeam(project.projectId, project)}
                            className="p-2 rounded-full hover:bg-green-100"
                            title="Manage Team"
                          >
                            <FiUsers size={20} className="text-green-700" />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-6 text-center text-gray-500">
                      No projects found
                    </div>
                  )}
                </div>

                {/* Mobile Pagination */}
                {filteredProjects.length > 0 && (
                  <div className="flex justify-center mt-4 mb-6">
                    <nav className="flex items-center">
                      <button
                        onClick={() => paginate(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className={`mx-1 px-3 py-1 rounded ${currentPage === 1
                          ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                          : 'bg-green-900 text-white hover:bg-green-600'
                          }`}
                      >
                        Prev
                      </button>

                      <div className="flex mx-2">
                        {totalPages <= 7 ? (
                          // Show all pages if 7 or fewer pages
                          [...Array(totalPages).keys()].map(number => (
                            <button
                              key={number + 1}
                              onClick={() => paginate(number + 1)}
                              className={`mx-1 px-3 py-1 rounded ${currentPage === number + 1
                                ? 'bg-green-900 text-white'
                                : 'bg-gray-200 hover:bg-gray-300'
                                }`}
                            >
                              {number + 1}
                            </button>
                          ))
                        ) : (
                          // Show pagination with ellipsis for more than 7 pages
                          <>
                            {/* First page always shown */}
                            <button
                              onClick={() => paginate(1)}
                              className={`mx-1 px-3 py-1 rounded ${currentPage === 1
                                ? 'bg-green-900 text-white'
                                : 'bg-gray-200 hover:bg-gray-300'
                                }`}
                            >
                              1
                            </button>

                            {/* Show ellipsis if not on first few pages */}
                            {currentPage > 3 && <span className="mx-1">...</span>}

                            {/* Show current page and surrounding pages */}
                            {[...Array(totalPages).keys()]
                              .filter(number => {
                                const pageNum = number + 1;
                                return pageNum !== 1 &&
                                  pageNum !== totalPages &&
                                  Math.abs(pageNum - currentPage) < 2;
                              })
                              .map(number => (
                                <button
                                  key={number + 1}
                                  onClick={() => paginate(number + 1)}
                                  className={`mx-1 px-3 py-1 rounded ${currentPage === number + 1
                                    ? 'bg-green-900 text-white'
                                    : 'bg-gray-200 hover:bg-gray-300'
                                    }`}
                                >
                                  {number + 1}
                                </button>
                              ))}

                            {/* Show ellipsis if not on last few pages */}
                            {currentPage < totalPages - 2 && <span className="mx-1">...</span>}

                            {/* Last page always shown */}
                            <button
                              onClick={() => paginate(totalPages)}
                              className={`mx-1 px-3 py-1 rounded ${currentPage === totalPages
                                ? 'bg-green-900 text-white'
                                : 'bg-gray-200 hover:bg-gray-300'
                                }`}
                            >
                              {totalPages}
                            </button>
                          </>
                        )}
                      </div>

                      <button
                        onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages || totalPages === 0}
                        className={`mx-1 px-3 py-1 rounded ${currentPage === totalPages || totalPages === 0
                          ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                          : 'bg-green-900 text-white hover:bg-green-600'
                          }`}
                      >
                        Next
                      </button>
                    </nav>
                  </div>
                )}
              </>
            )}
          </div>

          <AddProjectModal
            open={showAddModal}
            onClose={handleCloseModal}
            onSubmit={handleAddProjectSubmit}
            formData={formData}
            setFormData={setFormData}
          />
          <GlobalSnackbar
            open={snackbar.open}
            message={snackbar.message}
            severity={snackbar.severity}
            onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          />
        </div>
      )}
      {isModalOpen && selectedProject && (
        <div className="fixed inset-0 flex items-center justify-center bg-[rgba(0,0,0,0.3)] z-50">
          <div className="bg-white rounded-xl shadow-lg w-[90%] md:w-[800px] max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="bg-gray-50 border-b border-gray-200 py-2 px-6">
              <h2 className="text-xl font-semibold text-green-700">Project Details</h2>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[70vh]">
              <div className="flex flex-col space-y-6">

                {/* Project Basic Info */}
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-1">
                    <div className="flex items-center mb-1">
                      <span className="text-green-700 mr-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
                          <path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z" />
                        </svg>
                      </span>
                      <span className="text-gray-500 text-sm font-medium">Project Name</span>
                    </div>
                    <h3 className="text-lg font-semibold">{selectedProject.projectName}</h3>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center mb-1">
                      <span className="text-green-700 mr-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm3 1h6v4H7V5zm8 8v2h1v1H4v-1h1v-2a1 1 0 011-1h8a1 1 0 011 1z" clipRule="evenodd" />
                        </svg>
                      </span>
                      <span className="text-gray-500 text-sm font-medium">Project ID</span>
                    </div>
                    <p className="text-lg">{selectedProject.projectId}</p>
                  </div>
                </div>

                {/* Project Dates */}
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-1">
                    <div className="flex items-center mb-1">
                      <span className="text-green-700 mr-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                        </svg>
                      </span>
                      <span className="text-gray-500 text-sm font-medium">Start Date</span>
                    </div>
                    <p className="text-base">{formatDate(selectedProject.startDate)}</p>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center mb-1">
                      <span className="text-green-700 mr-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                        </svg>
                      </span>
                      <span className="text-gray-500 text-sm font-medium">End Date</span>
                    </div>
                    <p className="text-base">{formatDate(selectedProject.endDate)}</p>
                  </div>
                </div>

                {/* Project Manager */}
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-1">
                    <div className="flex items-center mb-1">
                      <span className="text-green-700 mr-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                      </span>
                      <span className="text-gray-500 text-sm font-medium">Project Manager</span>
                    </div>
                    <p className="text-base">
                      {selectedProject.projectManager ?
                        `${selectedProject.projectManager.firstName} ${selectedProject.projectManager.lastName} (${selectedProject.projectManager.empCode})` :
                        "Not assigned"}
                    </p>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center mb-1">
                      <span className="text-green-700 mr-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
                        </svg>
                      </span>
                      <span className="text-gray-500 text-sm font-medium">Sponsor</span>
                    </div>
                    <p className="text-base">{selectedProject.sponsor ?
                      `${selectedProject.sponsor.firstName} ${selectedProject.sponsor.lastName} (${selectedProject.sponsor.empCode})` :
                      "Not assigned"}</p>
                  </div>
                </div>

                {/* Cost & Timestamp */}
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-1">
                    <div className="flex items-center mb-1">
                      <span className="text-green-700 mr-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                        </svg>
                      </span>
                      <span className="text-gray-500 text-sm font-medium">Project Cost</span>
                    </div>
                    <p className="text-base">₹{selectedProject.projectCost}</p>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center mb-1">
                      <span className="text-green-700 mr-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                        </svg>
                      </span>
                      <span className="text-gray-500 text-sm font-medium">Start Timestamp</span>
                    </div>
                    <p className="text-base">{selectedProject.startTimestamp ? new Date(selectedProject.startTimestamp).toLocaleString() : "Not available"}</p>
                  </div>
                </div>

                {/* Project Team */}
                {selectedProject.projectTeam && selectedProject.projectTeam.length > 0 && (
                  <div>
                    <div className="flex items-center mb-3">
                      <span className="text-green-700 mr-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v1h8v-1zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-1a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v1h-3zM4.75 12.094A5.973 5.973 0 004 15v1H1v-1a3 3 0 013.75-2.906z" />
                        </svg>
                      </span>
                      <span className="text-gray-600 text-base font-medium">Project Team</span>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {selectedProject.projectTeam.map((member, index) => (
                          <div key={index} className="flex items-center">
                            <div className="bg-green-100 text-green-700 rounded-full h-8 w-8 flex items-center justify-center mr-3">
                              {member.user.firstName ? member.user.firstName.charAt(0) : "U"}
                            </div>
                            <div>
                              <p className="font-medium">{member.user.firstName} {member.user.lastName}</p>
                              <p className="text-sm text-gray-500">{member.empCode || "No ID"}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Timesheet Tasks */}
                {selectedProject.timesheetTasks && selectedProject.timesheetTasks.length > 0 && (
                  <div>
                    <div className="flex items-center mb-3">
                      <span className="text-green-700 mr-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                          <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                        </svg>
                      </span>
                      <span className="text-gray-600 text-base font-medium">Tasks</span>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="space-y-2">
                        {selectedProject.timesheetTasks.map((task, index) => (
                          <div key={index} className="flex items-center">
                            <div className="bg-green-100 text-green-700 rounded-full h-6 w-6 flex items-center justify-center mr-3">
                              {index + 1}
                            </div>
                            <span>{task.taskName || `Task ${task.taskId}`}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Additional Details */}
                <div>
                  <div className="flex items-center mb-3">
                    <span className="text-green-700 mr-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </span>
                    <span className="text-gray-600 text-base font-medium">Additional Details</span>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Tenant</p>
                        <p>{selectedProject.tenant?.tenantName || selectedProject.tenent || "Not specified"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Unit</p>
                        <p>{selectedProject.unit || "Not specified"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">System Impacted</p>
                        <p>{selectedProject.systemImpacted?.map((system, index)=>{
                          return <span key={index} className="block">{system.systemName}</span>
                        })}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer with buttons */}
            <div className="bg-gray-50 border-t border-gray-200 py-2 px-6 flex justify-end gap-3">
              <button
                className="px-4 py-2 border border-green-600 text-green-600 rounded hover:border-green-700 hover:text-green-700 transition-colors"
                onClick={handleClose}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {selectedEditProjectId && (
        <EditProjectModal
          open={true}
          projectId={selectedEditProjectId}
          onClose={() => setSelectedEditProjectId(null)}
          onSubmit={(updatedData) => handleProjectUpdate(updatedData)}
          formData={projectFormData}
          setFormData={setProjectFormData}
        />
      )}
    </>
  );
}

export default ProjectManagement;