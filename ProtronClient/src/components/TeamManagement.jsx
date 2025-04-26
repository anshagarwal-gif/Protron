import React, { useEffect, useState } from 'react'
import { FiUser, FiChevronDown, FiMenu  } from 'react-icons/fi'
import axios from 'axios'

const TeamManagement = () => {
    const [employees, setEmployees] = useState([])
    const [actionsOpen, setActionsOpen] = useState({});
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedProfile, setSelectedProfile] = useState(null);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isMobileView, setIsMobileView] = useState(false);

    const employeesPerPage = 10;
    const indexOfLastEmployee = currentPage * employeesPerPage;
    const indexOfFirstEmployee = indexOfLastEmployee - employeesPerPage;
    const currentEmployees = employees.slice(indexOfFirstEmployee, indexOfLastEmployee);
    const totalPages = Math.ceil(employees.length / employeesPerPage);


    useEffect(() => {
        const handleResize = () => {
            setIsMobileView(window.innerWidth < 768);
        };
        
        // Initial check
        handleResize();
        
        // Add event listener
        window.addEventListener('resize', handleResize);
        
        // Clean up
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    const goToPage = (pageNumber) => {
        if (pageNumber >= 1 && pageNumber <= totalPages) {
            setCurrentPage(pageNumber);
        }
    };


    useEffect(() => {

        const fetchEmployees = async () => {
            try {
                const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/users`, {
                    headers: { Authorization: `${sessionStorage.getItem('token')}` }
                })
                setEmployees(res.data)
                console.log(res)
            } catch (error) {
                console.log(error)
            }
        }

        fetchEmployees()
        
    }, [])

    const handleProfileClick = async (email) => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/users/email/${email}`, {
                headers: { Authorization: `${sessionStorage.getItem('token')}` }
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
                    headers: { Authorization: `${sessionStorage.getItem('token')}` }
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
            const updatedList = await axios.get(`${import.meta.env.VITE_API_URL}/api/users`, {
                headers: { Authorization: `${sessionStorage.getItem('token')}` }
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


    const MobileEmployeeCard = ({ member, index }) => (
        <div className="bg-white rounded-lg shadow p-4 mb-4" onClick={() => handleProfileClick(member.email)}>
            <div className="flex flex-col items-center mb-3">
                <img 
                    src={`${import.meta.env.VITE_API_URL}/api/users/${member.userId}/photo`} 
                    alt={member.name} 
                    className="w-16 h-16 rounded-full object-cover border border-gray-200 mb-2" 
                />
                <div className="text-center">
                    <h3 className="font-medium">
                        {member.firstName + member.lastName}
                    </h3>
                    <p className="text-sm text-gray-500">{member.empCode}</p>
                </div>
            </div>
            
            <div className="mt-4">
                <div className="flex justify-between border-b py-2">
                    <span className="font-medium text-gray-600">Email:</span>
                    <span className="text-gray-800 text-sm truncate max-w-[60%] text-right">{member.email}</span>
                </div>
                <div className="flex justify-between border-b py-2">
                    <span className="font-medium text-gray-600">Cost:</span>
                    <span className="text-gray-800">{member.cost || 'N/A'}</span>
                </div>
                <div className="flex justify-between border-b py-2">
                    <span className="font-medium text-gray-600">Join Date:</span>
                    <span className="text-gray-800">{member.dateOfJoining.split('T')[0]}</span>
                </div>
                <div className="flex justify-between py-2">
                    <span className="font-medium text-gray-600">Status:</span>
                    <span className={`${getStatusColor(member.status)}`}>
                        {member.status}
                    </span>
                </div>
            </div>
        </div>
    );
    return (
        <div className="max-w-full px-4 sm:px-6 pb-6">
            <div>
            <h1 className='flex items-center gap-2 text-xl font-bold mb-4'><FiUser /> Team Management</h1>
            <h1 className='mt-5 mb-4 font-semibold text-center md:text-left'>Team Member List</h1>
                
                {/* Mobile View */}
                {isMobileView ? (
                    <div className="space-y-4">
                        {currentEmployees.map((member, index) => (
                            <MobileEmployeeCard key={member.userId} member={member} index={index} />
                        ))}
                    </div>
                ) : (
                    /* Desktop View */
                    <div className="border rounded overflow-x-auto">
                        <table className="w-full min-w-[640px]">
                            <thead className="bg-gray-100">
                                <tr className="text-left">
                                    <th className="py-3 px-4 text-sm font-medium text-gray-600">#</th>
                                    <th className="py-3 px-4 text-sm font-medium text-gray-600">Name</th>
                                    <th className="py-3 px-4 text-sm font-medium text-gray-600">Emp-Code</th>
                                    <th className="py-3 px-4 text-sm font-medium text-gray-600">Email</th>
                                    <th className="py-3 px-4 text-sm font-medium text-gray-600">Cost</th>
                                    <th className="py-3 px-4 text-sm font-medium text-gray-600">DOJ</th>
                                    <th className="py-3 px-4 text-sm font-medium text-gray-600">Status</th>
                                    </tr>
                            </thead>
                            <tbody>
                                {currentEmployees.map((member, index) => (
                                    <tr key={member.userId} className="border-t">
                                        <td className="py-3 px-4">{member.userId}</td>
                                        <td className="py-3 px-4 flex items-center cursor-pointer" onClick={() => handleProfileClick(member.email)}>
                                            <img src={`${import.meta.env.VITE_API_URL}/api/users/${member.userId}/photo`} alt={member.name} className="w-12 h-12 rounded-full object-cover border border-gray-200 mr-2" />
                                            <span>{member.firstName + member.lastName}</span>
                                        </td>
                                        <td className="py-3 px-4">{member.empCode}</td>
                                        <td className="py-3 px-4">{member.email}</td>
                                        <td className="py-3 px-4">{member.cost}</td>
                                        <td className="py-3 px-4">
                                        {member.dateOfJoining ? member.dateOfJoining.split('T')[0] : "N/A"}
                                    </td>
                                        <td className="py-3 px-4">
                                            <span className={`${getStatusColor(member.status)}`}>
                                                {member.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                
                {/* Pagination - Works for both views */}
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
            
            {isProfileOpen && selectedProfile && (
                <div className={`fixed top-0 right-0 w-full md:w-[400px] h-full bg-white shadow-lg border-l z-50 p-6 overflow-y-auto`}>
                    <button
                        className="absolute top-4 right-4 text-gray-600 text-xl"
                        onClick={() => setIsProfileOpen(false)}
                    >
                        ✖
                    </button>
                    <div className="flex flex-col items-center mb-6">
                        <img
                            src={selectedProfile.avatar ? selectedProfile.avatar : "./profilepic.jpg"}
                            className="w-24 h-24 rounded-full mb-4"
                            alt="Profile"
                        />
                        <div className="text-center">
                            <h2 className="text-xl font-bold">
                                {selectedProfile.firstName + selectedProfile.lastName}
                            </h2>
                            <p className="text-sm text-gray-500">{selectedProfile.empCode}</p>
                            <p className="text-sm">
                                {selectedProfile.dateOfJoining ? selectedProfile.dateOfJoining.split("T")[0] : "N/A"}
                            </p>
                        </div>
                    </div>


                    <div className="mt-6">
                        <div className="mb-4 bg-gray-50 p-3 rounded">
                            <h3 className="text-sm font-semibold mb-2">Projects</h3>
                            <div className="flex justify-between border-b pb-2 mb-2">
                                <span>Completed:</span>
                                <span>{selectedProfile.projectsCompleted}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Ongoing:</span>
                                <span>{selectedProfile.ongoingProjects}</span>
                            </div>
                        </div>

                        <div className="mb-4 bg-gray-50 p-3 rounded">
                            <h3 className="text-sm font-semibold mb-2">Certifications</h3>
                            {selectedProfile.certificates && selectedProfile.certificates.length > 0 ? (
                                <ul className="list-disc list-inside">
                                    {selectedProfile.certificates.map((cert, i) => (
                                        <li key={i}>{cert}</li>
                                    ))}
                                    </ul>
                                ) : (
                                    <p className="text-gray-500 text-sm">No certifications found</p>
                            )}
                        </div>

                        <div className="mb-4 bg-gray-50 p-3 rounded">
                            <h3 className="text-sm font-semibold mb-2">CV</h3>
                            <a href={selectedProfile.cvLink} className="text-blue-600 underline block text-center" target="_blank" rel="noopener noreferrer">

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