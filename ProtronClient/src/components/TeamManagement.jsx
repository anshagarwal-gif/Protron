import React, { useEffect, useState } from 'react'
import { FiUser, FiChevronDown } from 'react-icons/fi'
import axios from 'axios'

const TeamManagement = () => {
    const [employees, setEmployees] = useState([])
    const [actionsOpen, setActionsOpen] = useState({});
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedProfile, setSelectedProfile] = useState(null);
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    const employeesPerPage = 10;
    const indexOfLastEmployee = currentPage * employeesPerPage;
    const indexOfFirstEmployee = indexOfLastEmployee - employeesPerPage;
    const currentEmployees = employees.slice(indexOfFirstEmployee, indexOfLastEmployee);
    const totalPages = Math.ceil(employees.length / employeesPerPage);
    const goToPage = (pageNumber) => {
        if (pageNumber >= 1 && pageNumber <= totalPages) {
            setCurrentPage(pageNumber);
        }
    };

    const fetchEmployees = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/users`,{
                headers:{ Authorization: `${sessionStorage.getItem('token')}` }
            })
            setEmployees(res.data)
            console.log(res)
        } catch (error) {
            console.log(error)
        }
    }
    useEffect(() => {
        fetchEmployees()
    }, [])
    console.log(employees)
    const handleProfileClick = async (email) => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/users/email/${email}`,{
                headers:{ Authorization: `${sessionStorage.getItem('token')}` }
            }); // adjust your endpoint if needed
            console.log(res.data)
            setSelectedProfile(res.data);
            setIsProfileOpen(true);
        } catch (error) {
            console.error("Error fetching profile", error);
        }
    };


    const toggleActions = (id) => {
        setActionsOpen(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };
    const handleStatusChange = async (id, newStatus) => {
        console.log("handleStatusChange called with:", id, newStatus);

        try {
            // Call backend to update the status of the project team member
            const response = await axios.patch(
                `${import.meta.env.VITE_API_URL}/api/project-team/${id}/status`,
                {},
                {
                    headers:{ Authorization: `${sessionStorage.getItem('token')}` }
                },
                {
                    params: { status: newStatus },
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );

            console.log("Status updated successfully:", response.data);

            // Refetch updated list of employees
            const updatedList = await axios.get(`${import.meta.env.VITE_API_URL}/api/users`,{
                headers:{ Authorization: `${sessionStorage.getItem('token')}` }
            });
            setEmployees(updatedList.data);

            // Close the actions dropdown
            setActionsOpen(prev => ({
                ...prev,
                [id]: false
            }));
        } catch (error) {
            console.error("Network or backend error occurred:", error);

            // Specific error message
            if (error.response) {
                console.log("Backend responded with status:", error.response.status);
                console.log("Response data:", error.response.data);
            } else if (error.request) {
                console.log("Request made but no response received");
            } else {
                console.log("Error in setting up the request:", error.message);
            }
        }
    };

    // const handleRemoveMember = async (id) => {
    //     console.log("remove function is called")
    //     try {
    //         const response = await axios.delete(`http://localhost:8282/api/project-team/delete/${id}`);
    //         console.log("Deleted successfully:", response.data);
    //     } catch (error) {
    //         console.error("Failed to delete:", error);
    //     }
    // };



    const getStatusColor = (status) => {
        switch (status) {
            case 'Active':
                return 'text-green-500';
            case 'On Hold':
                return 'text-yellow-500';
            default:
                return 'text-gray-500';
        }
    };
    return (
        <div>
            <div>
                <h1 className='flex items-center gap-2'><FiUser /> Team Management</h1>
                <div className='flex w-full bg-[#AECCE4] py-2 mt-5'>
                    <p>JIRA</p>
                    <h2>| Manage Team</h2>
                </div>
                <h1 className='mt-5'>Team Member List</h1>
                <div className="border rounded overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-100">
                            <tr className="text-left">
                                <th className="py-3 px-4 text-sm font-medium text-gray-600">#</th>
                                <th className="py-3 px-4 text-sm font-medium text-gray-600">Name</th>
                                <th className="py-3 px-4 text-sm font-medium text-gray-600">Emp-Code</th>
                                <th className="py-3 px-4 text-sm font-medium text-gray-600">Email</th>
                                <th className="py-3 px-4 text-sm font-medium text-gray-600">Cost</th>
                                <th className="py-3 px-4 text-sm font-medium text-gray-600">DOJ</th>
                                <th className="py-3 px-4 text-sm font-medium text-gray-600">Status</th>
                                {/* <th className="py-3 px-4 text-sm font-medium text-gray-600">Actions</th> */}
                            </tr>
                        </thead>
                        <tbody>
                            {currentEmployees.map((member, index) => (
                                <tr key={member.id} className="border-t">
                                    <td className="py-3 px-4">{member.userId}</td>
                                    <td className="py-3 px-4 flex items-center cursor-pointer" onClick={() => handleProfileClick(member.email)}>
                                        <img src={`${import.meta.env.VITE_API_URL}/api/users/${member.userId}/photo`} alt={member.name} className="w-12 h-12 rounded-full object-cover border border-gray-200 mr-2" />
                                        <span>
                                            {member.firstName + member.lastName}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4">{member.empCode}</td>
                                    <td className="py-3 px-4">{member.email}</td>
                                    <td className="py-3 px-4">{member.cost}</td>
                                    <td className="py-3 px-4">{member.dateOfJoining.split('T')[0]}</td>
                                    <td className="py-3 px-4">
                                        <span className={`${getStatusColor(member.status)}`}>
                                            {member.status}
                                        </span>
                                    </td>
                                    {/* <td className="py-3 px-4 relative"> */}
                                        {/* <button
                                            onClick={() => toggleActions(member.userId)}
                                            className="bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm flex items-center"
                                        >
                                            Actions
                                            <FiChevronDown size={14} className="ml-1" />
                                        </button> */}

                                        {/* {actionsOpen[member.userId] && (
                                            <div className="absolute right-4 mt-1 bg-white shadow-lg border rounded z-10 w-32">
                                                <button
                                                    onClick={() => handleStatusChange(member.userId, member.status === 'On Hold' ? 'Active' : 'On Hold')}
                                                    className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
                                                >
                                                    {member.status === 'On Hold' ? 'Activate' : 'Hold'}
                                                </button> */}
                                                {/* <button
                                                    onClick={() => handleRemoveMember(member.userId)}
                                                    className="w-full text-left px-4 py-2 hover:bg-gray-100 text-red-500 text-sm"
                                                >
                                                    Remove
                                                </button> */}
                                            {/* </div>
                                        )} */}
                                    {/* </td> */}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="flex justify-between items-center mt-4 px-4">
                        <button
                            onClick={() => goToPage(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="px-3 py-1 bg-gray-200 text-gray-700 rounded disabled:opacity-50"
                        >
                            Prev
                        </button>
                        <span className="text-sm">Page {currentPage} of {totalPages}</span>
                        <button
                            onClick={() => goToPage(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="px-3 py-1 bg-gray-200 text-gray-700 rounded disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>

                </div>
            </div>
            {isProfileOpen && selectedProfile && (
                <div className="fixed top-0 right-0 w-[400px] h-full bg-white shadow-lg border-l z-50 p-6 overflow-y-auto">
                    <button
                        className="absolute top-4 right-4 text-gray-600"
                        onClick={() => setIsProfileOpen(false)}
                    >
                        ✖
                    </button>
                    <div className="flex items-center gap-10">
                        <img
                            src={selectedProfile.avatar ? selectedProfile.avatar : "./profilepic.jpg"}
                            className="w-24 h-24 rounded-full"
                            alt="Profile"
                        />
                        <div>
                            <h2 className="text-xl font-bold">
                                {selectedProfile.firstName + selectedProfile.lastName}
                            </h2>
                            <p className="text-sm text-gray-500">{selectedProfile.empCode}</p>
                            <p className="text-sm">
                                {selectedProfile.dateOfJoining?.split("T")[0]}
                            </p>
                        </div>
                    </div>


                    <div className="mt-6">
                        <div className="mb-4">
                            <h3 className="text-sm font-semibold">Projects</h3>
                            <p>Completed: {selectedProfile.projectsCompleted}</p>
                            <p>Ongoing: {selectedProfile.ongoingProjects}</p>
                        </div>

                        <div className="mb-4">
                            <h3 className="text-sm font-semibold">Certifications</h3>
                            {selectedProfile.certificates.length > 0 ? (
                                <ul className="list-disc list-inside">
                                    {selectedProfile.certificates.map((cert, i) => (
                                        <li key={i}>{cert}</li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-gray-500 text-sm">No certifications found</p>
                            )}
                        </div>


                        <div className="mb-4">
                            <h3 className="text-sm font-semibold">CV</h3>
                            <a href={selectedProfile.cvLink} className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">
                                View CV
                            </a>
                        </div>
                    </div>
                </div>
            )}

        </div>
    )
}

export default TeamManagement