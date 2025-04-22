import React, { useEffect, useState } from 'react';
import { FiChevronLeft, FiChevronRight, FiChevronsLeft, FiChevronsRight, FiPlus, FiChevronDown, FiUser } from 'react-icons/fi';
import axios from 'axios';
import EditTeamMemberModal from './EditTeamMemberModal';

// Import the AssignTeamMemberModal component
import AssignTeamMemberModal from './AssignTeamMemberModal';
import EditProjectModal from './EditProjectModal';

const ProjectTeamManagement = ({ projectId, project, onClose }) => {
    const [teamMembers, setTeamMembers] = useState([

    ]);
    const [users, setUsers] = useState([]);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [actionsOpen, setActionsOpen] = useState({});
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedProjectId, setSelectedProjectId] = useState(null)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false)
    const [projectFormData, setProjectFormData] = useState({...project});
    const [editProjectModalOpen, setEditProjectModalOpen] = useState(false)
    const [editingMember, setEditingMember] = useState(null);

    const fetchTeammates = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/project-team/list/${projectId}`, {
                headers: { Authorization: `${sessionStorage.getItem('token')}` }
            })
            console.log(res.data)
            setTeamMembers(res.data)
        } catch (error) {
            console.log({ message: error })
        }
    }

    useEffect(() => {
        fetchTeammates()
    }, [])
    const fetchUsers = async()=>{
          try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/users`, {
                headers: { Authorization: `${sessionStorage.getItem('token')}` }
            })
            console.log(res.data)
            setUsers(res.data)
          } catch (error) {
            console.log(error)
          }
        }
    
    useEffect(()=>{
        fetchUsers()
    },[])
    const toggleActions = (id) => {
        setActionsOpen((prev) => ({
            ...prev,
            [id]: !prev[id], // Toggle only the specific row
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

            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/project-team/list/${projectId}`, {
                headers: { Authorization: `${sessionStorage.getItem('token')}` }
            });
            setTeamMembers(response.data);

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
        console.log("remove function is called")
        try {
            const response = await axios.delete(`${import.meta.env.VITE_API_URL}/api/project-team/delete/${id}`, {
                headers: { Authorization: `${sessionStorage.getItem('token')}` }
            });
            console.log("Deleted successfully:", response.data);

            setTeamMembers((prevMembers) => prevMembers.filter((member) => member.projectTeamId !== id));

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
            };
            console.log("Request Body:", requestBody);
            await axios.post(`${import.meta.env.VITE_API_URL}/api/project-team/add`, requestBody, {
                headers: { Authorization: `${sessionStorage.getItem('token')}` }
            });

            // 2. Refetch the updated team list
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/project-team/list/${projectId}`, {
                headers: { Authorization: `${sessionStorage.getItem('token')}` }
            });
            setTeamMembers(response.data);
        } catch (error) {
            alert("Failed to add member:", error);
            console.error("Failed to add member:", error);
        }
    };


    const getStatusColor = (status) => {
        switch (status) {
            case 'active':
                return 'text-green-500';
            case 'hold':
                return 'text-yellow-500';
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

            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/project-team/list/${projectId}`, {
                headers: { Authorization: `${sessionStorage.getItem('token')}` }
            });
            setTeamMembers(response.data);

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
        console.log(projectId)
        setSelectedProjectId(projectId);
        setEditProjectModalOpen(true);
    };
    const handleProjectUpdate = async (updatedData) => {
        console.log("updatedData:", updatedData);
      
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
          };
          console.log("Project Data: ",projectData)
      
          const response = await axios.put(
            `${import.meta.env.VITE_API_URL}/api/projects/edit/${projectId}`,
            projectData,
            {
              headers: {
                Authorization: `${sessionStorage.getItem('token')}`,
                'Content-Type': 'application/json',
              },
            }
          );
      
          console.log("Project updated successfully:", response.data);
      
          onClose();
      
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
                <button onClick={()=>handleEditProject(projectId)} className="bg-green-900 text-white px-4 py-1 rounded text-sm hover:bg-green-600">
                    Edit
                </button>
            </div>

            {/* Project Details */}
            <div className="grid grid-cols-3 gap-6 mb-8 bg-[#AECCE4] p-4 rounded-lg">
                <div>
                    <p className="text-gray-500 text-sm">Project Name: <span className="font-medium text-gray-700">{project.projectName}</span></p>
                    <p className="text-gray-500 text-sm mt-2">Start Date: <span className="font-medium text-gray-700">{project.startDate.split("T")[0]}</span></p>
                </div>
                <div>
                    <p className="text-gray-500 text-sm">PM Name: <span className="font-medium text-gray-700">{project.projectManager?.firstName}{" "}
                        {project.projectManager?.lastName}</span></p>
                    <p className="text-gray-500 text-sm mt-2">Sponsor: <span className="font-medium text-gray-700">{project.tenent || "N/A"}</span></p>
                </div>
                <div>
                    <p className="text-gray-500 text-sm">Project Cost: <span className="font-medium text-gray-700">{project.projectCost}</span></p>
                    <p className="text-gray-500 text-sm mt-2">System Impacted: <span className="font-medium text-gray-700">Sys1, Sys2, Sys3</span></p>
                </div>
            </div>

            {/* Team Members Section */}
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="font-bold text-gray-800">Manage Team Member</h2>
                    <div className="flex items-center">
                        <button
                            className="bg-green-900 text-white px-3 py-2 rounded flex items-center text-sm hover:bg-green-600"
                            onClick={() => setIsModalOpen(true)}
                        >
                            <FiPlus size={16} className="mr-1" />
                            Add Member
                        </button>
                    </div>
                </div>

                {/* Team Members Table */}
                <div className="border rounded overflow-visible relative">
                    <table className="w-full">
                        <thead className="bg-gray-100">
                            <tr className="text-left">
                                <th className="py-3 px-4 text-sm font-medium text-gray-600">#</th>
                                <th className="py-3 px-4 text-sm font-medium text-gray-600">Name</th>
                                <th className="py-3 px-4 text-sm font-medium text-gray-600">Emp-Code</th>
                                <th className="py-3 px-4 text-sm font-medium text-gray-600">Email</th>
                                <th className="py-3 px-4 text-sm font-medium text-gray-600">Cost</th>
                                <th className="py-3 px-4 text-sm font-medium text-gray-600">Est.Release</th>
                                <th className="py-3 px-4 text-sm font-medium text-gray-600">Status</th>
                                <th className="py-3 px-4 text-sm font-medium text-gray-600">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {teamMembers.map((member, index) => (
                                <tr key={index} className="border-t">
                                    <td className="py-3 px-4">{index + 1}</td>
                                    <td className="py-3 px-4 flex items-center">
                                        {member.user.profilePhoto ? (
                                            <img
                                                src={member.user.profilePhoto}
                                                alt={member.user.firstName + member.user.lastName}
                                                className="w-8 h-8 rounded-full mr-2"
                                            />
                                        ) : (
                                            <img
                                                src={"/profilepic.jpg"}
                                                alt="userprofile"
                                                className="w-8 h-8 rounded-full mr-2"
                                            />
                                        )}
                                        <span>{member.user.firstName + member.user.lastName}</span>
                                    </td>
                                    <td className="py-3 px-4">{member.empCode}</td>
                                    <td className="py-3 px-4">{member.user.email}</td>
                                    <td className="py-3 px-4">
                                        {member.unit === "Rupees" ? "₹" : member.unit === "Dollar" ? "$" : ""} {member.pricing}
                                    </td>
                                    <td className="py-3 px-4">{member.estimatedReleaseDate}</td>
                                    <td className="py-3 px-4">
                                        <span className={`${getStatusColor(member.status)}`}>
                                            {member.status}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 relative">
                                        <button
                                            onClick={() => toggleActions(member.projectTeamId)}
                                            className="bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm flex items-center"
                                        >
                                            Actions
                                            <FiChevronDown size={14} className="ml-1" />
                                        </button>

                                        {actionsOpen[member.projectTeamId] && (
                                            <div className="absolute right-4 mt-1 bg-white shadow-lg border rounded z-10 w-32">
                                                <button
                                                    onClick={() => handleEditMember(member)}
                                                    className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
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
                                                    className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
                                                >
                                                    {member.status === "hold" ? "Activate" : "Hold"}
                                                </button>
                                                <button
                                                    onClick={() => handleRemoveMember(member.projectTeamId)}
                                                    className="w-full text-left px-4 py-2 hover:bg-gray-100 text-red-500 text-sm"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

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
            </div>

            {/* Add Member Modal */}
            <AssignTeamMemberModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                projectName={project.projectName}
                onAddMember={handleAddMember}
                users={users} // Pass the users data to the modal
            />

            {/* Add this before closing div */}
            {editingMember && (
                <EditTeamMemberModal
                    isOpen={isEditModalOpen}
                    onClose={() => { setIsEditModalOpen(false); setEditingMember(null); }}
                    member={editingMember}
                    onUpdate={handleUpdateMember}
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