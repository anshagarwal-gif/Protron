import React, { useEffect, useState } from "react"
import axios from "axios"
import { AiFillProject, AiOutlineSearch, AiOutlineCalendar } from "react-icons/ai"
import AddProjectModal from "./AddProjectModal" // Adjust path if needed
import GlobalSnackbar from './GlobalSnackbar';
import ProjectTeamManagement from "./ProjectTeamManagement";

const API_BASE_URL = import.meta.env.VITE_API_URL;

const ProjectManagement = () => {
    const [projects, setProjects] = useState([]);
    const [filteredProjects, setFilteredProjects] = useState([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showTeamManagement, setShowTeamManagement] = useState(false);
    const [selectedProjectId, setSelectedProjectId] = useState(null);
    const [selectedProject, setSelectedProject] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [groupByDate, setGroupByDate] = useState(true);
    const [sortOrder, setSortOrder] = useState('asc'); // 'asc' or 'desc'
    
    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [projectsPerPage] = useState(5);

    const [formData, setFormData] = useState({
        projectName: '',
        projectIcon: null,
        startDate: null,
        endDate: null,
        projectManager: null,
        teamMembers: [],
        currency: 'USD',
        cost: '',
        tenent: '', 
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
            const sortedProjects = sortProjects(res.data, sortOrder);
            console.log(sortedProjects)
            setProjects(sortedProjects);
            setFilteredProjects(sortedProjects);
        } catch (error) {
            console.log({ message: error });
        }
    };
    
    // Function to sort projects by date
    const sortProjects = (projectsToSort, order = 'asc') => {
        return [...projectsToSort].sort((a, b) => {
            const dateA = new Date(a.startDate);
            const dateB = new Date(b.startDate);
            return order === 'asc' ? dateA - dateB : dateB - dateA;
        });
    };

    useEffect(() => {
        fetchProjects();
    }, []);

    // Effect for sorting and filtering projects
    useEffect(() => {
        let filtered = [...projects];
        
        // Apply search filter
        if (searchTerm.trim() !== '') {
            filtered = filtered.filter(project => 
                project.projectName.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        
        // Apply sorting
        filtered = sortProjects(filtered, sortOrder);
        
        setFilteredProjects(filtered);
        setCurrentPage(1); // Reset to first page when filtering
    }, [searchTerm, projects, sortOrder]);

    const handleToggleSortOrder = () => {
        const newOrder = sortOrder === 'asc' ? 'desc' : 'asc';
        setSortOrder(newOrder);
    };

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
            tenent: data.tenent,
          
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
                tenent: data.tenent,
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

    // Group projects by date
    const groupProjectsByDate = (projects) => {
        if (!groupByDate) {
            return { "All Projects": projects };
        }
        
        const grouped = {};
        projects.forEach(project => {
            const date = new Date(project.startDate).toLocaleDateString();
            if (!grouped[date]) {
                grouped[date] = [];
            }
            grouped[date].push(project);
        });
        return grouped;
    };

    // Get current projects for pagination
    const indexOfLastProject = currentPage * projectsPerPage;
    const indexOfFirstProject = indexOfLastProject - projectsPerPage;
    
    // Get the grouped projects
    const groupedProjects = groupProjectsByDate(filteredProjects);
    const dateGroups = Object.keys(groupedProjects);
    
    // Handle pagination for grouped projects
    const paginatedDateGroups = dateGroups.slice(indexOfFirstProject, indexOfLastProject);
    
    // Calculate total pages based on the number of date groups
    const totalPages = Math.ceil(dateGroups.length / projectsPerPage);
    
    // Change page
    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    // Toggle date grouping
    const toggleGroupByDate = () => {
        setGroupByDate(!groupByDate);
        setCurrentPage(1); // Reset to first page when changing view
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
      
              <div className="flex w-full bg-[#AECCE4] py-2 mt-5">
                <p>JIRA</p>
                <h2>| Manage Projects</h2>
              </div>
      
              <div className="flex justify-between items-center mt-5">
                <h1>Project List</h1>
                <div className="flex gap-4">
                  {/* Search Input */}
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search by project name..."
                      value={searchTerm}
                      onChange={handleSearchChange}
                      className="border rounded px-3 py-2 pl-9"
                    />
                    <AiOutlineSearch className="absolute left-3 top-3 text-gray-400" />
                  </div>
                  {/* Date grouping toggle */}
                  <button
                    className={`border px-4 py-2 rounded hover:bg-green-600 ${groupByDate ? 'bg-green-900 text-white' : 'bg-gray-200'}`}
                    onClick={toggleGroupByDate}
                  >
                    <AiOutlineCalendar className="inline mr-1 " /> 
                    {groupByDate ? 'Grouped by Date' : 'List View'}
                  </button>
                  {/* Sort order toggle */}
                  <button
                    className="border px-4 py-2 rounded bg-gray-200"
                    onClick={handleToggleSortOrder}
                  >
                    Sort: {sortOrder === 'asc' ? 'Oldest First' : 'Newest First'}
                  </button>
                  <button
                    className="border px-4 py-2 rounded bg-green-900 text-white hover:bg-green-600"
                    onClick={() => setShowAddModal(true)}
                  >
                    Add Project
                  </button>
                </div>
              </div>
      
              {/* Date-grouped Project View */}
              {paginatedDateGroups.map(date => (
                <div key={date} className="mb-8">
                  <h2 className="text-xl font-semibold bg-gray-100 p-3 rounded mb-3 mt-5">
                    <AiOutlineCalendar className="inline mr-2" />
                    {date === "All Projects" ? "All Projects" : `Projects for ${date}`}
                  </h2>
                  <div className="border rounded overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-100">
                        <tr className="text-left">
                          <th className="py-3 px-4">#</th>
                          <th className="py-3 px-4">Project Name</th>
                          <th className="py-3 px-4">Start Date</th>
                          <th className="py-3 px-4">PM Name</th>
                          <th className="py-3 px-4">Team</th>
                          <th className="py-3 px-4">Project Cost</th>
                          <th className="py-3 px-4">Sponsor</th>
                          <th className="py-3 px-4">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {groupedProjects[date].length > 0 ? (
                          groupedProjects[date].map((project, index) => (
                            <tr key={project.projectId}>
                              <td className="py-3 px-4">{index + 1}</td>
                              <td className="py-3 px-4">{project.projectName}</td>
                              <td className="py-3 px-4">
                                {project.startDate.split("T")[0]}
                              </td>
                              <td className="py-3 px-4">
                                {project.projectManager?.firstName}{" "}
                                {project.projectManager?.lastName}
                              </td>
                              <td className="py-3 px-4">{project.projectTeam.length} members</td>
                              <td className="py-3 px-4">₹{project.projectCost}</td>
                              <td className="py-3 px-4">{project.tenent || "N/A"}</td>
                              <td className="py-3 px-4">
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
                </div>
              ))}
              
              {/* Pagination */}
              {dateGroups.length > 0 && (
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
                      {[...Array(totalPages).keys()].map(number => (
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