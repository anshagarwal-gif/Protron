import React, { useEffect, useState, useMemo } from "react"
import axios from "axios"
import { AiFillProject, AiOutlineSearch, AiOutlineDownload } from "react-icons/ai"
import { FiChevronDown, FiUsers, FiEdit, FiEye } from "react-icons/fi"
import { AgGridReact } from 'ag-grid-react'
import { Calendar, DollarSign, Users, Settings } from 'lucide-react';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community'
import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-alpine.css'
import AddProjectModal from "./AddProjectModal" // Adjust path if needed
import GlobalSnackbar from './GlobalSnackbar';
import ProjectTeamManagement from "./ProjectTeamManagement";
import EditProjectModal from "./EditProjectModal"
import * as XLSX from "xlsx";
import { useAccess } from "../Context/AccessContext"
import ProjectDetailsModal from "./ProjectDetailsModal";

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
    systemImpacted: [],
    productOwner: '',
    scrumMaster: '',
    architect: '',
    chiefScrumMaster: '',
    deliveryLeader: '',
    businessUnitFundedBy: '',
    businessUnitDeliveredTo: '',
    priority: 1
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
        className="font-medium hover:text-green-600 truncate"
        title={params.value}
        style={{
          color: hasAccess('project_team', 'view') ? undefined : 'inherit'
        }}
      >
        {params.value}
      </span>
    );
  };

  const ProjectCodeRenderer = (params) => {

    return (
      <span
        className="cursor-pointer font-medium hover:text-green-600 truncate"
        title={params.value}
        onClick={() => handleView(params.data.projectId)}
      >
        {params.value}
      </span>
    )

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
          onClick={() => handleView(params.data.projectId)}
          className="p-2 rounded-full hover:bg-green-100"
          title="View"
        >
          <FiEye size={20} className="text-green-700" />
        </button>

        {/* Manage Team Button */}
        {hasAccess('project_team', 'view') && (
          <button
            onClick={() => handleManageTeam(params.data.projectId, params.data)}
            className="p-2 rounded-full hover:bg-green-100"
            title="Manage Team"
          >
            <FiUsers size={20} className="text-green-700" />
          </button>)}
      </div>
    );
  };

  // AgGrid column definitions
  const columnDefs = useMemo(() => [
    {
      headerName: '#',
      valueGetter: (params) => params.node.rowIndex + 1,
      width: 50,
      pinned: 'left',
      suppressMenu: true,
      sortable: false,
      filter: false,
    },
    {
      headerName: 'Project Code',
      field: 'projectCode',
      cellRenderer: ProjectCodeRenderer,
      minWidth: 200,
      maxWidth: 300,
      filter: 'agTextColumnFilter',
      cellStyle: { fontWeight: '500' }
    },
    {
      headerName: 'Project Name',
      field: 'projectName',
      cellRenderer: ProjectNameRenderer,
      flex: 1,
      minWidth: 200,
      maxWidth: 300,
      filter: 'agTextColumnFilter',
      filterParams: {
        filterOptions: ['contains', 'startsWith', 'endsWith'],
        defaultOption: 'contains'
      },
      cellStyle: { fontWeight: '200' }
    },
    {
      headerName: 'Start Date',
      field: 'startDate',
      valueFormatter: (params) => formatDate(params.value),
      minWidth: 150,
      filter: 'agDateColumnFilter',
      cellStyle: { textAlign: 'center' },
      cellClass: 'ag-cell-truncate',
      tooltipValueGetter: (params) => {
        return params.value ? formatDate(params.value) : 'N/A';
      }
    },
    {
      headerName: 'PM Name',
      valueGetter: (params) => {
        const pm = params.data.projectManager;
        return pm ? `${pm.firstName} ${pm.lastName}` : '';
      },
      minWidth: 160,
      filter: 'agTextColumnFilter',
      cellClass: 'ag-cell-truncate',
      tooltipValueGetter: (params) => params.value || 'N/A'

    },
    {
      headerName: 'Cost Currency',
      field: 'unit',
      valueFormatter: (params) => params.value || '-',
      maxWidth: 110,
      filter: 'agTextColumnFilter',
      cellStyle: { textAlign: 'center' }
    },
    {
      headerName: 'Project Cost',
      field: 'projectCost',
      valueFormatter: (params) => params.value ? `${params.value}` : '-',
      minWidth: 150,
      filter: 'agNumberColumnFilter',
      cellStyle: { textAlign: 'right', fontWeight: '500' }
    },
    {
      headerName: 'Sponsor',
      valueGetter: (params) => {
        const sponsor = params.data.sponsor;
        return sponsor ? `${sponsor.firstName} ${sponsor.lastName}` : '';
      },
      minWidth: 160,
      filter: 'agTextColumnFilter',
      cellClass: 'ag-cell-truncate',
      tooltipValueGetter: (params) => params.value || 'N/A'
    },
    {
      headerName: 'Actions',
      cellRenderer: ActionsRenderer,
      minWidth: 150,
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

      // Map the response data to match the expected structure
      const mappedProjects = res.data.map((dto) => ({
        projectCode: dto.projectCode,
        projectId: dto.projectId,
        projectName: dto.projectName,
        startDate: dto.startDate,
        projectManager: dto.pmId ? { userId: dto.pmId, firstName: dto.pmName.split(' ')[0], lastName: dto.pmName.split(' ')[1] || '' } : null,
        sponsor: dto.sponsorId ? { userId: dto.sponsorId, firstName: dto.sponsorName.split(' ')[0], lastName: dto.sponsorName.split(' ')[1] || '' } : null,
        unit: dto.unit,
        projectCost: dto.projectCost,
        projectTeam: Array(dto.projectTeamCount).fill({}), // Placeholder for team members
      }));

      setProjects(mappedProjects);
      setFilteredProjects(mappedProjects);
    } catch (error) {
      console.error("Error fetching projects:", error);
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

  const handleProjectUpdate = async () => {
    fetchProjects();

    setSelectedEditProjectId(null)

    if (typeof onProjectUpdated === 'function') {
      onProjectUpdated();
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
        projectCode: data.projectCode,
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
        systemImpacted: data.systemImpacted,
        productOwner: data.productOwner,
    scrumMaster: data.scrumMaster,
    architect: data.architect,
    chiefScrumMaster: data.chiefScrumMaster,
    deliveryLeader: data.deliveryLeader,
    businessUnitFundedBy: data.businessUnitFundedBy,
    businessUnitDeliveredTo: data.businessUnitDeliveredTo,
    priority: data.priority
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
        'Cost Currency': project.unit || 'N/A',
        'Project Cost': project.projectCost ? `${project.projectCost}` : 'N/A',
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

  const handleView = (projectId) => {
    console.log("Viewing project:", projectId);
    setSelectedProjectId(projectId);
    setIsModalOpen(true);
  };

  const handleClose = () => {
    setSelectedProjectId(null);
    setIsModalOpen(false);
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
        <div className="px-7">





          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mt-5">
            <h1 className="text-2xl font-bold text-green-800">Project Management</h1>

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
                  <span className="sm:inline">Download Excel</span>
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
                  enableBrowserTooltips={true}
                  tooltipShowDelay={500}
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
                        {[5, 10, 20, 50, 100].map((value) => (
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

                          <div className="text-gray-500">Cost Currency:</div>
                          <div>{project.unit || '-'}</div>

                          <div className="text-gray-500">Project Cost:</div>
                          <div>{project.projectCost ? `₹${project.projectCost}` : '-'}</div>

                          <div className="text-gray-500">Sponsor:</div>
                          <div>{project.sponsor?.firstName && project.sponsor?.lastName ? `${project.sponsor.firstName} ${project.sponsor.lastName}` : '-'}</div>
                        </div>

                        <div className="mt-3 flex justify-end space-x-2">
                          <button
                            onClick={() => handleView(project.projectId)}
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
                          {hasAccess('project_team', 'view') && (<button
                            onClick={() => handleManageTeam(project.projectId, project)}
                            className="p-2 rounded-full hover:bg-green-100"
                            title="Manage Team"
                          >
                            <FiUsers size={20} className="text-green-700" />
                          </button>)}
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

      {selectedProjectId && isModalOpen && (
        <ProjectDetailsModal projectId={selectedProjectId} onClose={handleClose} fetchProjects={fetchProjects} />
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