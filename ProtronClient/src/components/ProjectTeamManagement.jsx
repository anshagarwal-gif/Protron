import React, { useEffect, useState, useMemo } from 'react';
import { FiChevronLeft, FiChevronRight, FiChevronsLeft, FiChevronsRight, FiPlus, FiChevronDown, FiUser } from 'react-icons/fi';
import { AiOutlineDownload } from 'react-icons/ai';
import axios from 'axios';
import EditTeamMemberModal from './EditTeamMemberModal';
import * as XLSX from "xlsx";
import CircularProgress from '@mui/material/CircularProgress';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

// Import the AssignTeamMemberModal component
import AssignTeamMemberModal from './AssignTeamMemberModal';
import EditProjectModal from './EditProjectModal';
import { useAccess } from '../Context/AccessContext';

const ProjectTeamManagement = ({ projectId, onClose }) => {
  const { hasAccess } = useAccess();
  const [teamMembers, setTeamMembers] = useState([]);
  const [projectDetails, setProjectDetails] = useState(null);
  const [users, setUsers] = useState([]);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);
  const [actionsOpen, setActionsOpen] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState(null)
  const [projectFormData, setProjectFormData] = useState();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false)
  const [editProjectModalOpen, setEditProjectModalOpen] = useState(false)
  const [editingMember, setEditingMember] = useState(null);

  // Custom cell renderers
  const NameCellRenderer = (params) => {
    const member = params.data;
    return (
      <div className="flex items-center h-full">
        <img
          src={
            member.user?.photo
              ? `data:image/png;base64,${member.user?.photo}`
              : `${import.meta.env.VITE_API_URL}/api/users/${member.user?.userId}/photo`
          }
          alt={member.user.name}
          className="w-8 h-8 rounded-full object-cover border border-gray-200 mr-2"
          onError={(e) => {
            e.target.src = "/profilepic.jpg";
          }}
        />
        <span>{member.user.name}</span>
      </div>
    );
  };

  const EmailCellRenderer = (params) => {
    return (
      <div className="cursor-pointer max-w-[200px] truncate h-full" title={params.value}>
        {params.value}
      </div>
    );
  };

  const ActionsCellRenderer = (params) => {
    if (!hasAccess('project_team', 'edit')) return null;

    return (
      <select
        className="w-32 bg-green-700 text-white px-3 py-1 rounded hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-green-500"
        onChange={(e) => {
          const action = e.target.value;
          if (action === "edit") {
            handleEditMember(params.data);
          }
          e.target.selectedIndex = 0;
        }}
      >
        <option value="">Actions</option>
        <option value="edit">Edit</option>
      </select>
    );
  };

  // Column definitions
  const columnDefs = useMemo(() => {
    const baseColumns = [
      {
        headerName: '#',
        valueGetter: 'node.rowIndex + 1',
        maxWidth: 60,
        pinned: 'left',
        sortable: false,
        cellStyle: { borderRight: '1px solid #e5e7eb' }
      },
      {
        headerName: 'Name',
        field: 'user.name',
        cellRenderer: NameCellRenderer,
        minWidth: 200,
        cellStyle: { borderRight: '1px solid #e5e7eb' }
      },
      {
        headerName: 'Emp-Code',
        field: 'empCode',
        minWidth: 150,
        cellStyle: { borderRight: '1px solid #e5e7eb' }
      },
      {
        headerName: 'Email',
        field: 'user.email',
        cellRenderer: EmailCellRenderer,
        minWidth: 200,
        cellStyle: { borderRight: '1px solid #e5e7eb' }
      },
      {
        headerName: 'Cost Currency',
        field: 'unit',
        maxWidth: 100,
        cellStyle: { borderRight: '1px solid #e5e7eb' }
      },
      {
        headerName: 'Cost',
        field: 'pricing',
        maxWidth: 95,
        cellStyle: { borderRight: '1px solid #e5e7eb' }
      },
      {
        headerName: 'System Impacted',
        field: 'systemImpacted.systemName',
        minWidth: 180,
        cellStyle: { borderRight: '1px solid #e5e7eb' }
      },
      {
        headerName: 'Est.Release',
        field: 'estimatedReleaseDate',
        minWidth: 150,
        cellStyle: { borderRight: '1px solid #e5e7eb' },
        valueFormatter: params => formatDate(params.value)
      },
      {
        headerName: 'Onboarding Date',
        field: 'onBoardingDate',
        minWidth: 150,
        cellStyle: { textAlign: 'center' },
        valueFormatter: params => formatDate(params.value)
      }

    ];
    if (hasAccess('project_team', 'edit')) {
      baseColumns.push({
        headerName: 'Actions',
        cellRenderer: ActionsCellRenderer,
        minWidth: 120,
        sortable: false,
        filter: false,
        pinned: 'right'
      });
    }
    return baseColumns;
  }, [hasAccess]);

  // Grid options
  const gridOptions = useMemo(() => ({
    pagination: true,
    paginationPageSize: rowsPerPage,
    rowHeight: 50,
    headerHeight: 50,
    paginationPageSizeSelector: [5, 7, 10, 20, 50, 100],
    suppressRowClickSelection: true,
    rowSelection: 'multiple',
    animateRows: true,
    getRowStyle: (params) => {
      if (params.node.rowIndex % 2 === 0) {
        return { backgroundColor: 'white' };
      } else {
        return { backgroundColor: '#f9fafb' };
      }
    }
  }), [rowsPerPage]);

  const fetchTeammates = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/project-team/list/${projectId}`, {
        headers: { Authorization: `${sessionStorage.getItem('token')}` },
      });
      const mappedTeamMembers = res.data.map((member) => ({
        projectTeamId: member.projectTeamId,
        user: { userId: member.userId, email: member.email, name: member.name },
        empCode: member.empCode,
        unit: member.unit,
        pricing: member.pricing,
        systemImpacted: { systemName: member.systemName, systemId: member.systemId },
        estimatedReleaseDate: member.estimatedReleaseDate,
        onBoardingDate: member.onBoardingDate,
        status: member.status,
      }));
      setTeamMembers(mappedTeamMembers);
    } catch (error) {
      console.error("Failed to fetch team members:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProjectDetails = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/projects/${projectId}`, {
        headers: { Authorization: `${sessionStorage.getItem('token')}` }
      });
      setProjectDetails(res.data);
      setProjectFormData(res.data.project);
    } catch (error) {
      console.error("Failed to fetch project details:", error);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date)) return "";
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
    const day = date.getDate().toString().padStart(2, '0');
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  useEffect(() => {
    fetchTeammates();
    fetchProjectDetails();
  }, [])

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/tenants/${sessionStorage.getItem("tenantId")}/users`, {
        headers: { Authorization: `${sessionStorage.getItem('token')}` }
      })
      setUsers(res.data)
    } catch (error) {
      console.log(error)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const toggleActions = (id) => {
    setActionsOpen((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleStatusChange = async (id, newStatus) => {
    setActionsOpen(!actionsOpen[id]);
    console.log("handle Status Change function is called");

    try {
      await axios.patch(
        `${import.meta.env.VITE_API_URL}/api/project-team/${id}/status`,
        null,
        {
          headers: {
            Authorization: `${sessionStorage.getItem('token')}`
          },
          params: {
            status: newStatus
          }
        }
      );
      fetchTeammates();
    } catch (error) {
      alert("Failed to update status");
      console.error("Failed to update status:", error);
    }
  };

  const handleRemoveMember = async (id) => {
    setActionsOpen(!actionsOpen[id]);
    try {
      const response = await axios.delete(`${import.meta.env.VITE_API_URL}/api/project-team/delete/${id}`, {
        headers: { Authorization: `${sessionStorage.getItem('token')}` }
      });
      console.log("Deleted successfully:", response.data);
      fetchTeammates();
    } catch (error) {
      alert("Failed to update status:", error);
      console.error("Failed to delete:", error);
    }
  };

  const handleAddMember = async (memberData) => {
    console.log("handleAddMember is called")
    try {
      const selectedUser = users.find(user => user.email === memberData.email);
      const requestBody = {
        empCode: memberData.employeeCode,
        userId: selectedUser.userId,
        pricing: memberData.cost,
        status: "active",
        projectId: projectId,
        taskType: memberData.tasktype,
        unit: memberData.unit,
        estimatedReleaseDate: memberData.releaseDate,
        onBoardingDate: memberData.onBoardingDate,
        systemImpacted: memberData.systemImpacted,
      };
      console.log("Request Body:", requestBody);
      await axios.post(`${import.meta.env.VITE_API_URL}/api/project-team/add`, requestBody, {
        headers: { Authorization: `${sessionStorage.getItem('token')}` }
      });
      fetchTeammates();
    } catch (error) {
      alert("Failed to add member:", error);
      console.error("Failed to add member:", error);
    }
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'text-green-500';
      case 'hold':
        return 'text-yellow-500';
      case 'removed':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const handleEditMember = (member) => {
    setEditingMember(member);
    setIsEditModalOpen(true);
    setActionsOpen({});
  };

  const handleUpdateMember = async (updatedData, id) => {
    try {
      await axios.put(
        `${import.meta.env.VITE_API_URL}/api/project-team/edit/${id}`,
        updatedData, {
        headers: { Authorization: `${sessionStorage.getItem('token')}` }
      }
      );
      fetchTeammates();
      setIsEditModalOpen(false);
    } catch (error) {
      alert("Failed to update member details");
      console.error("Failed to update member details:", error);
    }
  };

  const handleEditProject = (projectId) => {
    setSelectedProjectId(projectId);
    setEditProjectModalOpen(true);
  };

  const handleProjectUpdate = async () => {
    onClose();
    if (typeof onProjectUpdated === 'function') {
      onProjectUpdated();
    }
  };

  const downloadExcel = () => {
    try {
      const excelData = teamMembers.map((employee, index) => ({
        'No.': index + 1,
        'Employee Name': employee.user.name,
        'Employee Code': employee.empCode,
        'Email': employee.user.email,
        'Cost Currency': employee.unit,
        'Cost': employee.pricing,
        'System Impacted': employee.systemImpacted.systemName,
        'Estimated Release Date': employee.estimatedReleaseDate,
        'Onboarding Date': employee.onBoardingDate,
      }));

      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Projects');
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

  return (
    <div className="w-full bg-white rounded-lg shadow-md p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className='flex items-center'>
          <div onClick={onClose} className="bg-[#328E6E] text-white p-2 rounded-full mr-2 hover:bg-green-600 cursor-pointer">
            <FiChevronLeft />
          </div>
          <h1 className="text-green-900 text-lg font-bold ">Manage Projects</h1>
        </div>
        {hasAccess('projects', 'edit') && (
          <button onClick={() => handleEditProject(projectId)} className="bg-green-900 text-white px-4 py-1 rounded text-sm hover:bg-green-600">
            Edit
          </button>)}
      </div>

      {/* Project Details */}
      {projectDetails && (
        <div className="grid grid-cols-3 gap-6 mb-8 bg-[#aee4be] p-4 rounded-lg">
          <div>
            <p className="text-gray-500 text-sm" title={projectDetails.project.projectName}>
              Project Name:{" "}
              <span className="font-medium text-gray-700">
                {projectDetails.project.projectName.length > 45
                  ? projectDetails.project.projectName.slice(0, 45) + "..."
                  : projectDetails.project.projectName}
              </span>
            </p>

            <p className="text-gray-500 text-sm mt-2">Start Date: <span className="font-medium text-gray-700">{formatDate(projectDetails.project.startDate)}</span></p>
          </div>
          <div>
            <p className="text-gray-500  text-sm">PM Name: <span className="font-medium text-gray-700">{projectDetails.project.managerName}</span></p>
            <p className="text-gray-500 text-sm mt-2">Sponsor: <span className="font-medium text-gray-700">{projectDetails.project.sponsorName}</span></p>
          </div>
          <div>
            <p className="text-gray-500 text-sm">Project Cost: <span className="font-medium text-gray-700">{projectDetails.project.projectCost} {projectDetails.project.unit}</span></p>
            <p className="text-gray-500 text-sm mt-2">System Impacted: <span className="font-medium text-gray-700">{projectDetails.systemsImpacted?.map((sys, index) => {
              return sys.systemName + (index < projectDetails.systemsImpacted.length - 1 ? ', ' : '')
            })}</span></p>
          </div>
        </div>
      )}

      {/* Team Members Section */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold text-gray-800">Manage Team Member</h2>
          <div className="flex gap-10 items-center">
            {hasAccess('project_team', 'edit') && (
              <button
                className="bg-green-900 text-white px-3 py-2 rounded flex items-center hover:bg-green-600"
                onClick={() => setIsModalOpen(true)}
              >
                <FiPlus size={16} className="mr-1" />
                Add Member
              </button>)}
            <button
              className="border px-3 py-2 rounded bg-green-700 text-white hover:bg-green-600 flex items-center justify-center flex-1 sm:flex-none"
              onClick={downloadExcel}
            >
              <AiOutlineDownload className="mr-1" />
              <span className="sm:inline">Download Excel</span>
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <CircularProgress />
          </div>
        ) : (
          <>
            {/* Desktop AG Grid Table - Hidden on small screens */}
            <div className="hidden md:block">
              <div
                className="ag-theme-alpine border rounded overflow-hidden"
                style={{ height: '55vh', width: '100%' }}
              >
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
  display: flex;
  align-items: center;
           /* Override AG Grid's flex */
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
                  rowData={teamMembers}
                  gridOptions={gridOptions}
                  suppressMenuHide={true}
                  defaultColDef={{
                    sortable: true,
                    filter: true,
                    resizable: true,
                    minWidth: 80
                  }}
                />
              </div>
            </div>

            {/* Mobile Card View - Visible only on small screens */}
            <div className="md:hidden">
              {teamMembers.map((member, index) => (
                <div
                  key={index}
                  className={`border-b p-4 ${index % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
                >
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center">
                      <img
                        src={
                          member.user?.photo
                            ? `data:image/png;base64,${member.user?.photo}`
                            : `${import.meta.env.VITE_API_URL}/api/users/${member.user?.userId}/photo`
                        }
                        alt={member.user.name}
                        className="w-10 h-10 rounded-full mr-3 object-cover border border-gray-200"
                        onError={(e) => {
                          e.target.src = "/profilepic.jpg";
                        }}
                      />
                      <div>
                        <div className="font-medium">{member.user.name}</div>
                        <div className="text-xs text-gray-500">{member.empCode}</div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-y-2 text-sm mb-4">
                    <div className="text-gray-500">Email:</div>
                    <div className="truncate">{member.user.email}</div>

                    <div className="text-gray-500">Cost Currency:</div>
                    <div>{member.unit}</div>

                    <div className="text-gray-500">Cost:</div>
                    <div>{member.pricing}</div>

                    <div className="text-gray-500">Est. Release:</div>
                    <div>{member.estimatedReleaseDate}</div>

                    <div className="text-gray-500">System Impacted:</div>
                    <div>{member.systemImpacted.systemName}</div>
                  </div>

                  {hasAccess('project_team', 'edit') && (
                    <div className="flex space-x-2 pt-2">
                      <button
                        onClick={() => handleEditMember(member)}
                        className="bg-green-700 text-white px-3 py-1 rounded text-sm flex-1 hover:bg-green-800"
                      >
                        Edit
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Add Member Modal */}
      <AssignTeamMemberModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        projectName={projectDetails?.project?.projectName}
        onAddMember={handleAddMember}
        project={projectDetails}
      />

      {/* Edit Team Member Modal */}
      {editingMember && (
        <EditTeamMemberModal
          isOpen={isEditModalOpen}
          onClose={() => { setIsEditModalOpen(false); setEditingMember(null); }}
          member={editingMember}
          onUpdate={handleUpdateMember}
          project={projectDetails}
        />
      )}

      {/* Edit Project Modal */}
      {selectedProjectId && (
        <EditProjectModal
          open={true}
          projectId={selectedProjectId}
          onClose={() => setSelectedProjectId(null)}
          onSubmit={(updatedData) => handleProjectUpdate(updatedData)}
          formData={projectFormData}
          setFormData={setProjectFormData}
        />
      )}
    </div>
  );
};

export default ProjectTeamManagement;