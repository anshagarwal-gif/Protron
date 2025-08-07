import React, { useEffect, useState } from 'react';
import { FiChevronLeft, FiChevronRight, FiChevronsLeft, FiChevronsRight, FiPlus, FiChevronDown, FiUser } from 'react-icons/fi';
import { AiOutlineDownload } from 'react-icons/ai';
import axios from 'axios';
import EditTeamMemberModal from './EditTeamMemberModal';
import * as XLSX from "xlsx";
import CircularProgress from '@mui/material/CircularProgress'; // Import CircularProgress

// Import the AssignTeamMemberModal component
import AssignTeamMemberModal from './AssignTeamMemberModal';
import EditProjectModal from './EditProjectModal';
import { useAccess } from '../Context/AccessContext';

const ProjectTeamManagement = ({ projectId, onClose }) => {
  const { hasAccess } = useAccess();
  const [teamMembers, setTeamMembers] = useState([

  ]);
  const [projectDetails, setProjectDetails] = useState(null); // State for project details
  const [users, setUsers] = useState([]);
  const [rowsPerPage, setRowsPerPage] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);
  const [actionsOpen, setActionsOpen] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState(null)
  const [projectFormData, setProjectFormData] = useState();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false)
  const [editProjectModalOpen, setEditProjectModalOpen] = useState(false)
  const [editingMember, setEditingMember] = useState(null);

  const fetchTeammates = async () => {
    setIsLoading(true);
  try {
    const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/project-team/list/${projectId}`, {
      headers: { Authorization: `${sessionStorage.getItem('token')}` },
    });
    // Map the response to match the expected structure
    const mappedTeamMembers = res.data.map((member) => ({
      projectTeamId: member.projectTeamId,
      user: {userId : member.userId, email : member.email, name: member.name},
      empCode: member.empCode,
      unit: member.unit,
      pricing: member.pricing,
      systemImpacted: { systemName: member.systemName, systemId: member.systemId },
      estimatedReleaseDate: member.estimatedReleaseDate,
      status: member.status,
    }));
    setTeamMembers(mappedTeamMembers);
  } catch (error) {
    console.error("Failed to fetch team members:", error);
  } finally{
    setIsLoading(false); 
  }
};

  const fetchProjectDetails = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/projects/${projectId}`, {
        headers: { Authorization: `${sessionStorage.getItem('token')}` }
      });
      setProjectDetails(res.data);
      setProjectFormData(res.data.project); // Initialize form data with fetched project details
    } catch (error) {
      console.error("Failed to fetch project details:", error);
    }
  };

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
      // Corrected axios.patch with proper argument order
      await axios.patch(
        `${import.meta.env.VITE_API_URL}/api/project-team/${id}/status`,
        null, // No data body, just updating via query params
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

      // // Update frontend state
      // setTeamMembers((prevMembers) =>
      //     prevMembers.map((member) =>
      //         member.projectTeamId === id
      //             ? { ...member, status: newStatus }
      //             : member
      //     )
      // );
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
        systemImpacted: memberData.systemImpacted,
      };
      console.log("Request Body:", requestBody);
      await axios.post(`${import.meta.env.VITE_API_URL}/api/project-team/add`, requestBody, {
        headers: { Authorization: `${sessionStorage.getItem('token')}` }
      });

      // 2. Refetch the updated team list
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

  // At the top with other state declarations


  // Add this handler function
  const handleEditMember = (member) => {
    setEditingMember(member);
    setIsEditModalOpen(true);
    setActionsOpen({});
  };

  // Add the update function
  const handleUpdateMember = async (updatedData, id) => {

    try {
      await axios.put(
        `${import.meta.env.VITE_API_URL}/api/project-team/edit/${id}`,
        updatedData, {
        headers: { Authorization: `${sessionStorage.getItem('token')}` }
      }
      );

      fetchTeammates();

      // Update local state
      // setTeamMembers(prevMembers =>
      //     prevMembers.map(member =>
      //         member.projectTeamId === editingMember.projectTeamId
      //             ? { ...member, ...updatedData }
      //             : member
      //     )
      // );

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
      // Prepare data for Excel export with all project details
      const excelData = teamMembers.map((employee, index) => ({
        'No.': index + 1,
        'Employee Name': employee.user.name,
        'Employee Code': employee.empCode,
        'Email': employee.user.email,
        'Cost Currency': employee.unit,
        'Cost': employee.pricing,
        // 'Status': employee.status,
        'System Impacted': employee.systemImpacted.systemName,
        'Estimated Release Date': employee.estimatedReleaseDate,
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
  return (
    <div className="w-full bg-white rounded-lg shadow-md p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className='flex items-center'>
          <div onClick={onClose} className="bg-[#328E6E] text-white p-2 rounded-full mr-2 hover:bg-green-600">
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
            <p className="text-gray-500 text-sm">Project Name: <span className="font-medium text-gray-700">{projectDetails.project.projectName}</span></p>
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
        
        <div className="border rounded overflow-visible relative">
          {/* Responsive Team Members Table */}
          <div className="border rounded overflow-hidden">
            {/* Desktop Table - Hidden on small screens */}
            <div className="hidden md:block">
              <table className="w-full border-collapse text-lg">
                <thead>
                  <tr className="bg-green-700 text-white text-lg">
                    <th className="py-2 px-4  font-medium border-r">#</th>
                    <th className="py-2 px-4  font-medium border-r">Name</th>
                    <th className="py-2 px-4  font-medium border-r">Emp-Code</th>
                    <th className="py-2 px-4  font-medium border-r">Email</th>
                    <th className="py-2 px-4  font-medium border-r">Cost Currency</th>
                    <th className="py-2 px-4  font-medium border-r">Cost</th>
                    <th className="py-2 px-4  font-medium border-r">System Impacted</th>
                    <th className="py-2 px-4  font-medium border-r">Est.Release</th>
                    {/* <th className="py-2 px-4  font-medium border-r">Status</th> */}
                    {hasAccess('project_team', 'edit') && (
                      <th className="py-2 px-4  font-medium">Actions</th>)}
                  </tr>
                </thead>
                <tbody>
                  {teamMembers.map((member, index) => (
                    <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      <td className="py-2 px-4 border-r border-t">{index + 1}</td>
                      <td className="py-2 px-4 border-r border-t">
                        <div className="flex items-center">
                          <img
                            src={
                              member.user?.photo
                                ? `data:image/png;base64,${member.user?.photo}` // Use Base64 string directly
                                : `${import.meta.env.VITE_API_URL}/api/users/${member.user?.userId}/photo` // Fallback to API URL
                            }
                            alt={member.user.name}
                            className="w-10 h-10 rounded-full object-cover border border-gray-200 mr-2 max-w-[200px] truncate"
                            onError={(e) => {
                              e.target.src = "/profilepic.jpg"; // Fallback image
                            }}
                          />
                          <span>{member.user.name}</span>
                        </div>
                      </td>
                      <td className="py-2 px-4 border-r border-t">{member.empCode}</td>
                      <td className="py-2 px-4 border-r border-t cursor-pointer max-w-[200px] truncate" title={member.user.email}>{member.user.email}</td>
                      <td className="py-2 px-4 border-r border-t">{member.unit}</td>
                      <td className="py-2 px-4 border-r border-t">{member.pricing}</td>
                      <td className="py-2 px-4 border-r border-t">{member.systemImpacted.systemName}</td>
                      <td className="py-2 px-4 border-r border-t">{member.estimatedReleaseDate}</td>
                      {/* <td className="py-2 px-4 border-r border-t">
                        <span className={`capitalize px-2 py-1 rounded-full font-medium ${getStatusColor(member.status)}`}>
                          {member.status}
                        </span>
                      </td> */}
                      {hasAccess('project_team', 'edit') && (
                        <td className="py-2 px-4 border-t">
                          <select
                            className="w-32 bg-green-700 text-white px-3 py-1 rounded hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-green-500"
                            onChange={(e) => {
                              const action = e.target.value;
                              if (action === "edit") {
                                handleEditMember(member);}
                              // } else if (action === "toggleStatus") {
                              //   handleStatusChange(
                              //     member.projectTeamId,
                              //     member.status === "hold" ? "Active" : "hold"
                              //   );
                              // } else if (action === "remove") {
                              //   handleRemoveMember(member.projectTeamId);
                              // }
                              e.target.selectedIndex = 0; // Reset
                            }}
                          >
                            <option value="">Actions</option>
                            <option value="edit">Edit</option>
                            {/* <option value="toggleStatus">
                              {member.status === "hold" ? "Activate" : "Put on Hold"}
                            </option>
                            <option value="remove">Remove</option> */}
                          </select>
                        </td>
                      )}


                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View - Visible only on small screens */}
            <div className="md:hidden">
              {teamMembers.map((member, index) => (
                <div
                  key={index}
                  className={`border-b p-4 ${index % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
                >
                  {/* Header with photo, name and status */}
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center">
                      {member.user.profilePhoto ? (
                        <img
                          src={member.user.profilePhoto}
                          alt={member.user.firstName + member.user.lastName}
                          className="w-10 h-10 rounded-full mr-3"
                        />
                      ) : (
                        <img
                          src={"/profilepic.jpg"}
                          alt="userprofile"
                          className="w-10 h-10 rounded-full mr-3"
                        />
                      )}
                      <div>
                        <div className="font-medium">{member.user.firstName + ' ' + member.user.lastName}</div>
                        <div className="text-xs text-gray-500">{member.empCode}</div>
                      </div>
                    </div>
                    {/* <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(member.status)}`}>
                      {member.status}
                    </span> */}
                  </div>

                  {/* Member details */}
                  <div className="grid grid-cols-2 gap-y-2 text-sm mb-4">
                    <div className="text-gray-500">Email:</div>
                    <div className="truncate">{member.user.email}</div>

                    <div className="text-gray-500">Cost Currency:</div>
                    <div>{member.unit}</div>

                    <div className="text-gray-500">Cost:</div>
                    <div>{member.pricing}</div>

                    <div className="text-gray-500">Est. Release:</div>
                    <div>{member.estimatedReleaseDate}</div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex space-x-2 pt-2">
                    <button
                      onClick={() => handleEditMember(member)}
                      className="bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm flex-1 hover:bg-gray-300"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() =>
                        handleStatusChange(
                          member.projectTeamId,
                          member.status === "hold" ? "active" : "hold"
                        )
                      }
                      className="bg-blue-100 text-blue-700 px-3 py-1 rounded text-sm flex-1 hover:bg-blue-200"
                    >
                      {member.status === "hold" ? "Activate" : "Hold"}
                    </button>
                    <button
                      onClick={() => handleRemoveMember(member.projectTeamId)}
                      className="bg-red-100 text-red-700 px-3 py-1 rounded text-sm flex-1 hover:bg-red-200"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pagination */}
          <div className="bg-gray-50 py-3 px-4 flex justify-between items-center border-t">
            <div className="flex items-center text-sm text-gray-600">
              <span className="mr-2">Rows per page</span>
              <div className="border rounded flex items-center">
                <span className="px-2">{rowsPerPage}</span>
                <button className="px-2 py-1 border-l">
                  <FiChevronDown size={14} />
                </button>
              </div>
            </div>

            <div className="flex items-center text-sm text-gray-600">
              <span className="mr-4">1-10 of 80</span>
              <div className="flex">
                <button className="p-1 border rounded-l">
                  <FiChevronsLeft size={16} />
                </button>
                <button className="p-1 border-t border-b">
                  <FiChevronLeft size={16} />
                </button>
                <button className="p-1 border-t border-b">
                  <FiChevronRight size={16} />
                </button>
                <button className="p-1 border rounded-r">
                  <FiChevronsRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
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

      {/* Add this before closing div */}
      {editingMember && (
        <EditTeamMemberModal
          isOpen={isEditModalOpen}
          onClose={() => { setIsEditModalOpen(false); setEditingMember(null); }}
          member={editingMember}
          onUpdate={handleUpdateMember}
          project={projectDetails}
        />
      )}
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