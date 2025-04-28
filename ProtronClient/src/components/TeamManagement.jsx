import React, { useEffect, useState } from 'react'
import { FiUser, FiChevronDown, FiMenu, FiArrowUp, FiArrowDown, FiFilter } from 'react-icons/fi'
import axios from 'axios'

const TeamManagement = () => {
    const [employees, setEmployees] = useState([])
    const [filteredEmployees, setFilteredEmployees] = useState([])
    const [actionsOpen, setActionsOpen] = useState({});
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedProfile, setSelectedProfile] = useState(null);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isMobileView, setIsMobileView] = useState(false);
    
    // Sorting state
    const [sortField, setSortField] = useState('firstName');
    const [sortOrder, setSortOrder] = useState('asc'); // 'asc' or 'desc'
    
    // Status filter
    const [statusFilter, setStatusFilter] = useState('All');
    const [showStatusFilterDropdown, setShowStatusFilterDropdown] = useState(false);
    
    // For entries dropdown
    const [employeesPerPage, setEmployeesPerPage] = useState(10);
    const [showEntriesDropdown, setShowEntriesDropdown] = useState(false);
    
    // Calculate current page data
    const indexOfLastEmployee = currentPage * employeesPerPage;
    const indexOfFirstEmployee = indexOfLastEmployee - employeesPerPage;
    const currentEmployees = filteredEmployees.slice(indexOfFirstEmployee, indexOfLastEmployee);
    const totalPages = Math.ceil(filteredEmployees.length / employeesPerPage);

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
    
    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showEntriesDropdown && !event.target.closest('.entries-dropdown-container')) {
                setShowEntriesDropdown(false);
            }
            
            if (showStatusFilterDropdown && !event.target.closest('.status-filter-container')) {
                setShowStatusFilterDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showEntriesDropdown, showStatusFilterDropdown]);
    
    // Apply filtering and sorting whenever the relevant state changes
    useEffect(() => {
        let filtered = [...employees];
        
        // Apply status filter
        if (statusFilter !== 'All') {
            filtered = filtered.filter(employee => employee.status === statusFilter);
        }
        
        // Apply sorting
        filtered = sortEmployees(filtered, sortField, sortOrder);
        
        setFilteredEmployees(filtered);
        setCurrentPage(1); // Reset to first page when filter/sort changes
    }, [employees, statusFilter, sortField, sortOrder]);
    
    // Function to sort employees by any field
    const sortEmployees = (employeesToSort, field, order) => {
        return [...employeesToSort].sort((a, b) => {
            let valueA, valueB;
            
            // Handle different field types
            switch(field) {
                case 'firstName':
                    valueA = `${a.firstName || ''} ${a.lastName || ''}`.toLowerCase();
                    valueB = `${b.firstName || ''} ${b.lastName || ''}`.toLowerCase();
                    break;
                case 'empCode':
                    valueA = a.empCode?.toLowerCase() || '';
                    valueB = b.empCode?.toLowerCase() || '';
                    break;
                case 'email':
                    valueA = a.email?.toLowerCase() || '';
                    valueB = b.email?.toLowerCase() || '';
                    break;
                case 'cost':
                    valueA = parseFloat(a.cost || 0);
                    valueB = parseFloat(b.cost || 0);
                    break;
                case 'dateOfJoining':
                    valueA = new Date(a.dateOfJoining || 0);
                    valueB = new Date(b.dateOfJoining || 0);
                    break;
                case 'status':
                    valueA = a.status?.toLowerCase() || '';
                    valueB = b.status?.toLowerCase() || '';
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
    
    const goToPage = (pageNumber) => {
        if (pageNumber >= 1 && pageNumber <= totalPages) {
            setCurrentPage(pageNumber);
        }
    };

    const handleEntriesChange = (value) => {
        setEmployeesPerPage(value);
        setCurrentPage(1); // Reset to first page when changing entries per page
        setShowEntriesDropdown(false);
    };
    
    const handleStatusFilterChange = (status) => {
        setStatusFilter(status);
        setShowStatusFilterDropdown(false);
    };

    useEffect(() => {
        const fetchEmployees = async () => {
            try {
                const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/tenants/${sessionStorage.getItem("tenantId")}/users`, {
                    headers: { Authorization: `${sessionStorage.getItem('token')}` }
                })
                setEmployees(res.data)
                setFilteredEmployees(res.data)
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
            const updatedList = await axios.get(`${import.meta.env.VITE_API_URL}/api/tenants/${sessionStorage.getItem("tenantId")}/users`, {
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
                    <span className="text-gray-800">{member.dateOfJoining ? member.dateOfJoining.split('T')[0] : "N/A"}</span>
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
            
                {/* Status filter and entries dropdown row */}
                <div className="flex flex-wrap items-center justify-between mt-4 mb-4">
                    {/* Entries per page dropdown */}
                    <div className="flex items-center text-gray-700 mb-2 md:mb-0">
                        <span className="mr-2 font-medium">Show</span>
                        <div className="relative entries-dropdown-container">
                            <button
                                className="flex items-center justify-between w-24 px-3 py-2 border border-green-700 rounded bg-white text-green-900 hover:border-green-900 focus:outline-none focus:ring-1 focus:ring-green-700"
                                onClick={() => setShowEntriesDropdown(!showEntriesDropdown)}
                                aria-expanded={showEntriesDropdown}
                                aria-haspopup="true"
                            >
                                <span className="font-medium">{employeesPerPage}</span>
                                <FiChevronDown className={`transition-transform duration-200 ${showEntriesDropdown ? 'transform rotate-180' : ''}`} />
                            </button>
                            
                            {showEntriesDropdown && (
                                <div className="absolute top-full left-0 w-24 mt-1 bg-white border border-green-700 rounded shadow-lg z-10 overflow-hidden">
                                    {[10, 20, 50, 100].map((value) => (
                                        <button
                                            key={value}
                                            className={`block w-full text-left px-3 py-2 transition-colors duration-150 ${
                                            employeesPerPage === value 
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
                    </div>
                    
                    {/* Status filter dropdown */}
                    <div className="flex items-center text-gray-700 mb-2 md:mb-0">
                        <span className="mr-2 font-medium">Status:</span>
                        <div className="relative status-filter-container">
                            <button
                                className="flex items-center justify-between w-32 px-3 py-2 border border-green-700 rounded bg-white text-green-900 hover:border-green-900 focus:outline-none focus:ring-1 focus:ring-green-700"
                                onClick={() => setShowStatusFilterDropdown(!showStatusFilterDropdown)}
                                aria-expanded={showStatusFilterDropdown}
                                aria-haspopup="true"
                            >
                                <span className="font-medium flex items-center">
                                    <FiFilter className="mr-2" />
                                    {statusFilter}
                                </span>
                                <FiChevronDown className={`transition-transform duration-200 ${showStatusFilterDropdown ? 'transform rotate-180' : ''}`} />
                            </button>
                            
                            {showStatusFilterDropdown && (
                                <div className="absolute top-full left-0 w-32 mt-1 bg-white border border-green-700 rounded shadow-lg z-10 overflow-hidden">
                                    {['All', 'Active', 'On Hold', 'Removed'].map((status) => (
                                        <button
                                            key={status}
                                            className={`block w-full text-left px-3 py-2 transition-colors duration-150 ${
                                            statusFilter === status 
                                                ? 'bg-green-900 text-white font-medium' 
                                                : 'text-green-900 hover:bg-green-100'
                                            }`}
                                            onClick={() => handleStatusFilterChange(status)}
                                        >
                                            {status}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    
                    <div className="text-sm text-green-800 bg-green-50 px-3 py-1 rounded border border-green-200">
                        Showing <span className="font-semibold">{filteredEmployees.length > 0 ? indexOfFirstEmployee + 1 : 0}</span> to <span className="font-semibold">{Math.min(indexOfLastEmployee, filteredEmployees.length)}</span> of <span className="font-semibold">{filteredEmployees.length}</span> entries
                    </div>
                </div>
                
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
                        <table className="w-full min-w-[640px] border-collapse">
    <thead>
        <tr className="bg-green-700 text-white">
            <th className="py-3 px-4 text-sm font-medium border-r">#</th>
            <th 
                className="py-3 px-4 text-sm font-medium border-r cursor-pointer select-none"
                onClick={() => handleSort('firstName')}
            >
                <div className="flex items-center">
                    Name
                    {renderSortIcon('firstName')}
                </div>
            </th>
            <th 
                className="py-3 px-4 text-sm font-medium border-r cursor-pointer select-none"
                onClick={() => handleSort('empCode')}
            >
                <div className="flex items-center">
                    Emp-Code
                    {renderSortIcon('empCode')}
                </div>
            </th>
            <th 
                className="py-3 px-4 text-sm font-medium border-r cursor-pointer select-none"
                onClick={() => handleSort('email')}
            >
                <div className="flex items-center">
                    Email
                    {renderSortIcon('email')}
                </div>
            </th>
            <th 
                className="py-3 px-4 text-sm font-medium border-r cursor-pointer select-none"
                onClick={() => handleSort('cost')}
            >
                <div className="flex items-center">
                    Cost
                    {renderSortIcon('cost')}
                </div>
            </th>
            <th 
                className="py-3 px-4 text-sm font-medium border-r cursor-pointer select-none"
                onClick={() => handleSort('dateOfJoining')}
            >
                <div className="flex items-center">
                    DOJ
                    {renderSortIcon('dateOfJoining')}
                </div>
            </th>
            <th 
                className="py-3 px-4 text-sm font-medium cursor-pointer select-none"
                onClick={() => handleSort('status')}
            >
                <div className="flex items-center">
                    Status
                    {renderSortIcon('status')}
                </div>
            </th>
        </tr>
    </thead>
    <tbody>
        {currentEmployees.length > 0 ? (
            currentEmployees.map((member, index) => (
                <tr key={member.userId} className={`border-t ${index % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-green-50`}>
                    <td className="py-3 px-4 border-r">{indexOfFirstEmployee + index + 1}</td>
                    <td className="py-3 px-4 border-r flex items-center cursor-pointer" onClick={() => handleProfileClick(member.email)}>
                        <img src={`${import.meta.env.VITE_API_URL}/api/users/${member.userId}/photo`} 
                             alt={member.name} 
                             className="w-10 h-10 rounded-full object-cover border border-gray-200 mr-2" 
                             onError={(e) => {e.target.src = "/profilepic.jpg"}} />
                        <span>{member.firstName + ' ' + member.lastName}</span>
                    </td>
                    <td className="py-3 px-4 border-r">{member.empCode}</td>
                    <td className="py-3 px-4 border-r">{member.email}</td>
                    <td className="py-3 px-4 border-r">{member.cost || 'N/A'}</td>
                    <td className="py-3 px-4 border-r">
                        {member.dateOfJoining ? member.dateOfJoining.split('T')[0] : "N/A"}
                    </td>
                    <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(member.status)}`}>
                            {member.status}
                        </span>
                    </td>
                </tr>
            ))
        ) : (
            <tr>
                <td colSpan="7" className="py-6 text-center text-gray-500 border-t">
                    No team members found
                </td>
            </tr>
        )}
    </tbody>
</table>
                    </div>
                )}
                
                {/* Pagination - Enhanced */}
                {filteredEmployees.length > 0 && (
                    <div className="flex justify-center mt-4 mb-6">
                        <nav className="flex items-center">
                            <button
                                onClick={() => goToPage(currentPage - 1)}
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
                                        onClick={() => goToPage(number + 1)}
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
                                        onClick={() => goToPage(1)}
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
                                            onClick={() => goToPage(number + 1)}
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
                                        onClick={() => goToPage(totalPages)}
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
                                onClick={() => goToPage(currentPage + 1)}
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
            </div>
            
            {isProfileOpen && selectedProfile && (
  <>
    {/* Modal Backdrop */}
    <div 
      className="fixed inset-0  bg-[rgba(0,0,0,0.3)] z-40 transition-opacity"
      onClick={() => setIsProfileOpen(false)}
    />
    
    {/* Modal Content */}
    <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-[50vw] max-h-[80vh] overflow-y-auto bg-white rounded-lg shadow-xl z-50 p-6">
      <button
        className="absolute top-4 right-4 text-gray-600 hover:text-gray-900"
        onClick={() => setIsProfileOpen(false)}
      >
        ✖
      </button>
      
      <div className="flex flex-col items-center mb-6">
        <img
          src={selectedProfile.avatar ? selectedProfile.avatar : "./profilepic.jpg"}
          className="w-24 h-24 rounded-full mb-4 object-cover"
          alt="Profile"
        />
        <div className="text-center">
          <h2 className="text-xl font-bold">
            {selectedProfile.firstName} {selectedProfile.lastName}
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
          <a 
            href={selectedProfile.cvLink} 
            className="text-blue-600 hover:text-blue-800 underline block text-center" 
            target="_blank" 
            rel="noopener noreferrer"
          >
            View CV
          </a>
        </div>
      </div>
    </div>
  </>
)}
        </div>
    )
}
             

export default TeamManagement