import React, { useEffect, useState } from "react"
import axios from "axios"
import { AiFillProject, AiOutlineSearch, AiOutlineDownload } from "react-icons/ai"
import { FiChevronDown, FiUsers, FiArrowUp, FiArrowDown } from "react-icons/fi"
import AddProjectModal from "./AddProjectModal" // Adjust path if needed
import GlobalSnackbar from './GlobalSnackbar';
import ProjectTeamManagement from "./ProjectTeamManagement";
import * as XLSX from "xlsx";

const API_BASE_URL = import.meta.env.VITE_API_URL;

const ProjectManagement = () => {
    const [projects, setProjects] = useState([]);
    const [filteredProjects, setFilteredProjects] = useState([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showTeamManagement, setShowTeamManagement] = useState(false);
    const [selectedProjectId, setSelectedProjectId] = useState(null);
    const [selectedProject, setSelectedProject] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Sorting state
    const [sortField, setSortField] = useState('startDate');
    const [sortOrder, setSortOrder] = useState('asc'); // 'asc' or 'desc'
    
    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [projectsPerPage, setProjectsPerPage] = useState(10);
    const [showEntriesDropdown, setShowEntriesDropdown] = useState(false);

    const [formData, setFormData] = useState({
        projectName: '',
        projectIcon: null,
        startDate: null,
        endDate: null,
        projectManager: null,
        teamMembers: [],
        currency: 'USD',
        cost: '',
        sponsor: '', 
    });
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'info', // 'success' | 'error' | 'warning' | 'info'
    });

    const fetchProjects = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/api/projects`,{
              headers:{ Authorization: `${sessionStorage.getItem('token')}` }
          });
            const sortedProjects = sortProjects(res.data, sortField, sortOrder);
            setProjects(sortedProjects);
            setFilteredProjects(sortedProjects);
        } catch (error) {
            console.log({ message: error });
        }
    };
    
    // Enhanced function to sort projects by any field
    const sortProjects = (projectsToSort, field, order) => {
        return [...projectsToSort].sort((a, b) => {
            let valueA, valueB;
            
            // Handle different field types
            switch(field) {
                case 'projectName':
                    valueA = a.projectName?.toLowerCase() || '';
                    valueB = b.projectName?.toLowerCase() || '';
                    break;
                case 'startDate':
                    valueA = new Date(a.startDate || 0);
                    valueB = new Date(b.startDate || 0);
                    break;
                case 'endDate':
                    valueA = new Date(a.endDate || 0);
                    valueB = new Date(b.endDate || 0);
                    break;
                case 'pmName':
                    valueA = `${a.projectManager?.firstName || ''} ${a.projectManager?.lastName || ''}`.toLowerCase();
                    valueB = `${b.projectManager?.firstName || ''} ${b.projectManager?.lastName || ''}`.toLowerCase();
                    break;
                case 'teamSize':
                    valueA = a.projectTeam?.length || 0;
                    valueB = b.projectTeam?.length || 0;
                    break;
                case 'projectCost':
                    valueA = parseFloat(a.projectCost || 0);
                    valueB = parseFloat(b.projectCost || 0);
                    break;
                case 'sponsor':
                    valueA = a.sponsor?.toLowerCase() || '';
                    valueB = b.sponsor?.toLowerCase() || '';
                    break;
                default:
                    valueA = a[field] || '';
                    valueB = b[field] || '';
            }
            
            // Handle the sort direction
            if (order === 'asc') {
                return valueA > valueB ? 1 : valueA < valueB ? -1 : 0;
            } else {
                return valueA < valueB ? 1 : valueA > valueB ? -1 : 0;
            }
        });
    };

    // Function to handle column header click for sorting
    const handleSort = (field) => {
        const newOrder = field === sortField && sortOrder === 'asc' ? 'desc' : 'asc';
        setSortField(field);
        setSortOrder(newOrder);
        
        // Re-sort the projects with the new field and order
        const sorted = sortProjects(filteredProjects, field, newOrder);
        setFilteredProjects(sorted);
    };

    // Helper function to render sort icons
    const renderSortIcon = (field) => {
        if (sortField !== field) {
            return <FiChevronDown className="ml-1 text-gray-400 text-xs" />;
        }
        return sortOrder === 'asc' ? 
            <FiArrowUp className="ml-1 text-green-900" /> : 
            <FiArrowDown className="ml-1 text-green-900" />;
    };

    useEffect(() => {
        fetchProjects();
    }, []);

    // Effect for sorting and filtering projects
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
                
                // Search in sponsor/tenant
                const tenentMatch = (project.sponsor || '').toLowerCase().includes(searchTermLower);
                
                // Return true if any of the fields match
                return projectNameMatch || pmMatch || tenentMatch;
            });
        }
        
        // Apply sorting
        filtered = sortProjects(filtered, sortField, sortOrder);
        
        setFilteredProjects(filtered);
        setCurrentPage(1); // Reset to first page when filtering
    }, [searchTerm, projects, sortField, sortOrder]);

    // Close entries dropdown when clicking outside
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

    const handleCloseTeamManagement = () => {
        setSelectedProjectId(null);
        setSelectedProject(null);
        setShowTeamManagement(false);
        fetchProjects();
    };

    const handleAddProjectSubmit = async (data) => {
        // Field validation
        if (
            !data.projectName ||
            !data.startDate ||
            !data.endDate ||
            !data.manager ||
            !data.currency ||
            !data.cost ||
            data.teamMembers.length === 0
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
            sponsor: data.sponsor,
          
            projectTeam: data.teamMembers.map(userId => ({
              userId: userId,
              status: "active",
              unit: data.currency === 'INR' ? 'Rupees' : 'Dollar',
           
          }))
          };
          
            const response = await axios.post(`${API_BASE_URL}/api/projects/add`, payload,  {
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
                'Sponsor': project.sponsor || 'N/A',
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

    // Get current projects for pagination
    const indexOfLastProject = currentPage * projectsPerPage;
    const indexOfFirstProject = indexOfLastProject - projectsPerPage;
    const currentProjects = filteredProjects.slice(indexOfFirstProject, indexOfLastProject);
    
    // Calculate total pages
    const totalPages = Math.ceil(filteredProjects.length / projectsPerPage);
    
    // Change page
    const paginate = (pageNumber) => setCurrentPage(pageNumber);
    
    // Function to format date as DD-MMM-YYYY (e.g., 12-Sept-2025)
    const formatDate = (dateString) => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
        const date = new Date(dateString);
        const day = date.getDate().toString().padStart(2, '0');
        const month = months[date.getMonth()];
        const year = date.getFullYear();
        
        return `${day}-${month}-${year}`;
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
      
              <div className="flex justify-between items-center mt-5">
                <h1>Project List</h1>
                <div className="flex gap-4">
                  {/* Search Input */}
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search by project, PM or sponsor..."
                      value={searchTerm}
                      onChange={handleSearchChange}
                      className="border rounded px-3 py-2 pl-9 w-64"
                    />
                    <AiOutlineSearch className="absolute left-3 top-3 text-gray-400" />
                  </div>
                  {/* Excel Download Button */}
                  <button
                    className="border px-4 py-2 rounded bg-green-900 text-white hover:bg-green-600 flex items-center"
                    onClick={downloadExcel}
                  >
                    <AiOutlineDownload className="mr-2" /> Download Excel
                  </button>
            
                  <button
                    className="border px-4 py-2 rounded bg-green-900 text-white hover:bg-green-600"
                    onClick={() => setShowAddModal(true)}
                  >
                    Add Project
                  </button>
                </div>
              </div>
      
              {/* Entries per page dropdown */}
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
                      {[10, 20, 50, 100].map((value) => (
                        <button
                          key={value}
                          className={`block w-full text-left px-3 py-2 transition-colors duration-150 ${
                            projectsPerPage === value 
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
      
              {/* Projects Table */}
              <div className="border rounded overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr className="text-left">
                      <th className="py-2 px-4 font-medium text-gray-700">
                        #
                      </th>
                      <th 
                        className="py-2 px-4 font-medium  cursor-pointer select-none"
                        onClick={() => handleSort('projectName')}
                      >
                        <div className="flex items-center text-green-900 hover:text-green-500">
                          Project Name
                          {renderSortIcon('projectName')}
                        </div>
                      </th>
                      <th 
                        className="py-2 px-4 font-medium  cursor-pointer select-none"
                        onClick={() => handleSort('startDate')}
                      >
                        <div className="flex items-center text-green-900 hover:text-green-500">
                          Start Date
                          {renderSortIcon('startDate')}
                        </div>
                      </th>
                      <th 
                        className="py-2 px-4 font-medium  cursor-pointer select-none"
                        onClick={() => handleSort('pmName')}
                      >
                        <div className="flex items-center text-green-900 hover:text-green-500">
                          PM Name
                          {renderSortIcon('pmName')}
                        </div>
                      </th>
                      <th 
                        className="py-2 px-4 font-medium  cursor-pointer select-none"
                        onClick={() => handleSort('teamSize')}
                      >
                        <div className="flex items-center text-green-900 hover:text-green-500">
                          Team
                          {renderSortIcon('teamSize')}
                        </div>
                      </th>
                      <th 
                        className="py-2 px-4 font-medium  cursor-pointer select-none"
                        onClick={() => handleSort('projectCost')}
                      >
                        <div className="flex items-center text-green-900 hover:text-green-500">
                          Project Cost
                          {renderSortIcon('projectCost')}
                        </div>
                      </th>
                      <th 
                        className="py-2 px-4 font-medium cursor-pointer select-none"
                        onClick={() => handleSort('sponsor')}
                      >
                        <div className="flex items-center text-green-900 hover:text-green-500">
                          Sponsor
                          {renderSortIcon('sponsor')}
                        </div>
                      </th>
                      <th className="py-2 px-4 font-medium text-green-900 hover:text-green-500">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentProjects.length > 0 ? (
                      currentProjects.map((project, index) => (
                        <tr key={project.projectId} className="border-t hover:bg-gray-50">
                          <td className="py-2 px-4">{indexOfFirstProject + index + 1}</td>
                          <td className="py-2 px-4">{project.projectName}</td>
                          <td className="py-2 px-4">
                            {project.startDate ? formatDate(project.startDate) : 'N/A'}
                          </td>
                          <td className="py-2 px-4">
                            {project.projectManager?.firstName}{" "}
                            {project.projectManager?.lastName}
                          </td>
                          <td 
                            className="py-2 px-4 text-blue-600 hover:text-green-900 cursor-pointer flex items-center" 
                            onClick={() => handleManageTeam(project.projectId, project)}
                          >
                            <FiUsers className="mr-1" />
                            <span className="underline">{project.projectTeam?.length || 0}</span>
                          </td>
                          <td className="py-2 px-4">₹{project.projectCost || ''}</td>
                          <td className="py-2 px-4">{project.sponsor || ""}</td>
                          <td className="py-2 px-4">
                            <button
                              className="bg-green-900 text-white px-3 py-1 rounded hover:bg-green-600"
                              onClick={() => handleManageTeam(project.projectId, project)}
                            >
                              Manage Team
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="8" className="py-4 text-center">
                          No projects found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination */}
              {filteredProjects.length > 0 && (
                <div className="flex justify-center mt-4 mb-6">
                  <nav className="flex items-center">
                    <button
                      onClick={() => paginate(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className={`mx-1 px-3 py-1 rounded ${
                        currentPage === 1 
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
                            className={`mx-1 px-3 py-1 rounded ${
                              currentPage === number + 1
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
                            className={`mx-1 px-3 py-1 rounded ${
                              currentPage === 1
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
                                className={`mx-1 px-3 py-1 rounded ${
                                  currentPage === number + 1
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
                            className={`mx-1 px-3 py-1 rounded ${
                              currentPage === totalPages
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
                      className={`mx-1 px-3 py-1 rounded ${
                        currentPage === totalPages || totalPages === 0
                          ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                          : 'bg-green-900 text-white hover:bg-green-600'
                      }`}
                    >
                      Next
                    </button>
                  </nav>
                </div>
              )}
      
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
        </>
      );
}

export default ProjectManagement;