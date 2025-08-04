import React, { useEffect, useState, useMemo, useCallback } from 'react'
import ProfileModal from './ProfileModal'
import { AiOutlineDownload, AiOutlineSearch } from 'react-icons/ai'
import { AgGridReact } from 'ag-grid-react'
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community'
import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-alpine.css'
import * as XLSX from "xlsx";
import axios from 'axios'
import UserEditForm from './UserEditForm'
import { UserCog } from 'lucide-react'

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

const TeamManagement = () => {
    const [employees, setEmployees] = useState([])
    const [filteredEmployees, setFilteredEmployees] = useState([])
    const [loading, setLoading] = useState(true)
    const [snackbar, setSnackbar] = useState("")
    const [selectedProfile, setSelectedProfile] = useState(null);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isEditFormOpen, setIsEditFormOpen] = useState(false); // State to manage edit form visibility
    const [selectedEmployee, setSelectedEmployee] = useState(null); // State to store the selected employee for editing
    const [isMobileView, setIsMobileView] = useState(false);
    const [gridApi, setGridApi] = useState(null);
    const [gridColumnApi, setGridColumnApi] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Status filter
    const [statusFilter, setStatusFilter] = useState('All');
    const [showStatusFilterDropdown, setShowStatusFilterDropdown] = useState(false);


    useEffect(() => {
        const handleResize = () => {
            setIsMobileView(window.innerWidth < 768);
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        let filtered = [...employees];

        if (searchTerm.trim() !== '') {
            const searchTermLower = searchTerm.toLowerCase();
            filtered = filtered.filter(employee => {
                // Search in employee name
                const fullName = `${employee.name}`.toLowerCase();
                const nameMatch = fullName.includes(searchTermLower);

                // Search in email
                const emailMatch = employee.email.toLowerCase().includes(searchTermLower);

                // Search in employee code
                const empCodeMatch = employee.empCode?.toLowerCase().includes(searchTermLower);

                // Return true if any field matches
                return nameMatch || emailMatch || empCodeMatch;
            });
        }

        setFilteredEmployees(filtered);
    }, [searchTerm, employees]);

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showStatusFilterDropdown && !event.target.closest('.status-filter-container')) {
                setShowStatusFilterDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showStatusFilterDropdown]);

    // Apply filtering whenever status filter changes

    useEffect(() => {
        let filtered = [...employees];
        console.log(employees)
        if (statusFilter !== 'All') {
            filtered = filtered.filter(employee => employee.status === statusFilter);
        }

        setFilteredEmployees(filtered);
    }, [employees, statusFilter]);

    // Update AG Grid when filteredEmployees changes
    useEffect(() => {
        if (gridApi) {
            gridApi.setGridOption('rowData', filteredEmployees);
        }
    }, [filteredEmployees, gridApi]);

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

    // Replace the existing NameCellRenderer with this updated version
    const NameCellRenderer = (params) => {
        const { data } = params;
        return (
            <div className="flex items-center cursor-pointer hover:text-green-700 w-full" onClick={() => handleProfileClick(data.email)}>
                <img
                    src={
                        data.photo
                            ? `data:image/png;base64,${data?.photo}`
                            : `${import.meta.env.VITE_API_URL}/api/users/${data.userId}/photo`
                    }
                    alt={data.name}
                    className="w-10 h-10 rounded-full object-cover border border-gray-200 mr-2 flex-shrink-0"
                    onError={(e) => {
                        e.target.src = "/profilepic.jpg";
                    }}
                />
                <span className="truncate">{data.name}</span>
            </div>
        );
    };

    // Status cell renderer with colors
    const StatusCellRenderer = (params) => {
        const getStatusColor = (status) => {
            const normalizedStatus = status?.toLowerCase();

            switch (normalizedStatus) {
                case 'active':
                    return 'bg-green-100 text-green-800';
                case 'on hold':
                case 'hold':
                    return 'bg-yellow-100 text-yellow-800';
                case 'removed':
                    return 'bg-red-100 text-red-800';
                default:
                    return 'bg-gray-100 text-gray-800';
            }
        };

        const formatStatusLabel = (status) => {
            const normalizedStatus = status?.toLowerCase();

            switch (normalizedStatus) {
                case 'active':
                    return 'Active';
                case 'hold':
                case 'on hold':
                    return 'On Hold';
                case 'removed':
                    return 'Removed';
                default:
                    return status || 'Unknown';
            }
        };

        return (
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(params.value)}`}>
                {formatStatusLabel(params.value)}
            </span>
        );
    };


    // Date cell renderer
    const DateCellRenderer = (params) => {
        return params.value ? params.value.split('T')[0] : "N/A";
    };
    const onClose = () => {
        setIsProfileOpen(false);
        setSelectedProfile(null);
    };

    const handleEditClick = (employee) => {
        setSelectedEmployee(employee);
        setIsEditFormOpen(true);
    };

    const handleEditSubmit = async (updatedData) => {
        try {
            const res = await axios.put(
                `${import.meta.env.VITE_API_URL}/api/users/${selectedEmployee.userId}/editable-details`,
                updatedData,
                {
                    headers: { Authorization: `${sessionStorage.getItem('token')}` },
                }
            );
            setSnackbar({
                open: true,
                message: 'User updated successfully!',
                severity: 'success',
            });
            // Update the employee list with the updated data
            fetchEmployees();
            setIsEditFormOpen(false);
        } catch (error) {
            console.error('Error updating user:', error);
            setSnackbar({
                open: true,
                message: 'Failed to update user. Please try again.',
                severity: 'error',
            });
        }
    };

    // AG Grid column definitions
    const columnDefs = useMemo(() => [
        {
            headerName: "Name",
            field: "name",
            cellRenderer: NameCellRenderer,
            sortable: true,
            filter: true,
            resizable: true,
            width: 200,
            valueGetter: (params) => `${params.data.name}`,
            cellClass: 'ag-cell-truncate',
            tooltipValueGetter: (params) => `${params.data.name}`,
        },
        {
            headerName: "Emp-Code",
            field: "empCode",
            sortable: true,
            filter: true,
            resizable: true,
            width: 150,
            cellClass: 'ag-cell-truncate',
        },
        {
            headerName: "Email",
            field: "email",
            sortable: true,
            filter: true,
            resizable: true,
            width: 250,
            cellClass: 'ag-cell-truncate',
            tooltipValueGetter: (params) => params.data.email,
        },
        {
            headerName: "Mobile Number",
            field: "mobilePhone",
            sortable: true,
            filter: true,
            resizable: true,
            width: 150,
            cellClass: 'ag-cell-truncate',
        },
        {
            headerName: "City",
            field: "city",
            sortable: true,
            filter: true,
            resizable: true,
            width: 100,
            cellClass: 'ag-cell-truncate',
            tooltipValueGetter: (params) => params.data.city || 'N/A',
        },
        {
            headerName: "State",
            field: "state",
            sortable: true,
            filter: true,
            resizable: true,
            width: 120,
            cellClass: 'ag-cell-truncate',
            tooltipValueGetter: (params) => params.data.state || 'N/A',
        },
        {
            headerName: "Country",
            field: "country",
            sortable: true,
            filter: true,
            resizable: true,
            width: 20,
            cellClass: 'ag-cell-truncate',
        },
        {
            headerName: "Cost",
            field: "cost",
            sortable: true,
            filter: 'agNumberColumnFilter',
            resizable: true,
            width: 120,
            valueFormatter: (params) => params.value || 'N/A',
            cellClass: 'ag-cell-truncate',
        },
        {
            headerName: "DOJ",
            field: "dateOfJoining",
            cellRenderer: DateCellRenderer,
            sortable: true,
            filter: 'agDateColumnFilter',
            resizable: true,
            width: 150,
            cellClass: 'ag-cell-truncate',
        },
        {
            headerName: "Status",
            field: "status",
            cellRenderer: StatusCellRenderer,
            sortable: true,
            filter: true,
            resizable: true,
            width: 120,
            cellClass: 'ag-cell-truncate',
        },
        {
            headerName: 'Actions',
            field: 'actions',
            width: 150,
            cellRenderer: (params) => (
                <button
                    className="cursor-pointer flex items-center justify-center p-2"
                    onClick={() => handleEditClick(params.data)}
                >
                    <UserCog size={16} className="text-blue-600" />
                </button>
            ),
        },
    ], []);

    // AG Grid default column definition
    const defaultColDef = useMemo(() => ({
        sortable: true,
        filter: true,
        resizable: true,
        minWidth: 100,
        floatingFilter: false,
        filterParams: {
            buttons: ['reset', 'apply'],
            closeOnApply: true,
            debounceMs: 200,
            suppressAndOrCondition: false,
            filterOptions: ['contains', 'notContains', 'startsWith', 'endsWith', 'equals', 'notEqual'],
            defaultOption: 'contains',
            caseSensitive: false,
        },
        suppressMenu: false,
        menuTabs: ['filterMenuTab'],
    }), []);

    // Grid options
    const gridOptions = useMemo(() => ({
        pagination: true,
        paginationPageSize: 10,
        paginationPageSizeSelector: [10, 20, 50, 100],
        suppressCellFocus: true,
        rowHeight: 60,
        headerHeight: 50,
        animateRows: true,
        suppressRowClickSelection: true,
        getRowStyle: (params) => {
            if (params.node.rowIndex % 2 === 0) {
                return { background: '#ffffff' };
            } else {
                return { background: '#f9fafb' };
            }
        },
    }), []);

    // Grid ready callback
    const onGridReady = useCallback((params) => {
        setGridApi(params.api);
        setGridColumnApi(params.columnApi);
        params.api.sizeColumnsToFit();
    }, []);

    // Export function
    const downloadExcel = () => {
        try {
            const excelData = employees.map((employee, index) => ({
                'No.': index + 1,
                'Employee Name': employee.name,
                'Employee Code': employee.empCode,
                'Email': employee.email,
                'DOJ': employee.dateOfJoining ? formatDate(employee.dateOfJoining) : 'N/A',
                'cost': employee.cost,
                'Status': employee.status,

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

    const handleStatusFilterChange = (status) => {
        console.log('Filter changed to:', status);
        setStatusFilter(status);
        setShowStatusFilterDropdown(false);
    };

    const fetchEmployees = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/tenants/${sessionStorage.getItem("tenantId")}/users`, {
                headers: { Authorization: `${sessionStorage.getItem('token')}` }
            });
            setEmployees(res.data);
            setFilteredEmployees(res.data);
            console.log(res);
        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {


        fetchEmployees();
    }, []);
    console.log(employees)
    const handleProfileClick = async (email) => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/users/email/${email}`, {
                headers: { Authorization: `${sessionStorage.getItem('token')}` }
            });
            console.log(res.data);
            setSelectedProfile(res.data);
            setIsProfileOpen(true);
        } catch (error) {
            console.error("Error fetching profile", error);
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
                    <h3 className="font-medium text-lg">
                        {member.name}
                    </h3>
                    <p className="text-base text-gray-500">{member.empCode}</p>
                </div>
            </div>

            <div className="mt-4">
                <div className="flex justify-between border-b py-2">
                    <span className="font-medium text-gray-600 text-base">Email:</span>
                    <span className="text-gray-800 text-base truncate max-w-[60%] text-right">{member.email}</span>
                </div>
                <div className="flex justify-between border-b py-2">
                    <span className="font-medium text-gray-600 text-base">Cost:</span>
                    <span className="text-gray-800 text-base">{member.cost || 'N/A'}</span>
                </div>
                <div className="flex justify-between border-b py-2">
                    <span className="font-medium text-gray-600 text-base">Join Date:</span>
                    <span className="text-gray-800 text-base">{member.dateOfJoining ? member.dateOfJoining.split('T')[0] : "N/A"}</span>
                </div>
                <div className="flex justify-between py-2">
                    <span className="font-medium text-gray-600 text-base">Status:</span>
                    <span className={`text-base ${getStatusColor(member.status)}`}>
                        {member.status}
                    </span>
                </div>
            </div>
        </div>
    );

    const getStatusColor = (status) => {
        switch (status) {
            case 'Active':
                return 'text-green-500';
            case 'On Hold':
                return 'text-yellow-500';
            case 'Hold':
                return 'text-yellow-500';
            case 'Removed':
                return 'text-red-500';
            default:
                return 'text-gray-500';
        }
    };

    // Loading component
    const LoadingSpinner = () => (
        <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div>
        </div>
    );

    return (
        <div className="px-7">
            <div>


                {/* Status filter and export row */}
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mt-5 mb-3">
                    <h1 className="text-2xl font-bold text-green-800">Team Management</h1>

                    <div className="flex flex-col sm:flex-row gap-3">
                        {/* Search Input */}
                        <div className="relative w-full sm:w-64">
                            <input
                                type="text"
                                placeholder="Search team members..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="border rounded px-3 py-2 pl-9 w-full"
                            />
                            <AiOutlineSearch className="absolute left-3 top-3 text-gray-400" />
                        </div>

                        {/* Excel Download Button */}
                        <button
                            className="border px-3 py-2 rounded bg-green-700 text-white hover:bg-green-600 flex items-center justify-center"
                            onClick={downloadExcel}
                        >
                            <AiOutlineDownload className="mr-1" />
                            <span>Download Excel</span>
                        </button>
                    </div>
                </div>

                {/* Loading State */}
                {loading ? (
                    <LoadingSpinner />
                ) : (
                    <>
                        {/* Mobile View */}
                        {isMobileView ? (
                            <div className="space-y-4">
                                {filteredEmployees.map((member, index) => (
                                    <MobileEmployeeCard key={member.userId} member={member} index={index} />
                                ))}
                            </div>
                        ) : (
                            /* Desktop View with AG Grid */
                            <div className="ag-theme-alpine ag-cell-truncate" style={{ height: '80vh', width: '100%' }}>
                                <style jsx>{`
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
                                    rowData={filteredEmployees}
                                    columnDefs={columnDefs}
                                    defaultColDef={defaultColDef}
                                    gridOptions={gridOptions}
                                    paginationPageSizeSelector={[5, 10, 15, 20, 25, 50]}
                                    onGridReady={onGridReady}
                                    suppressMenuHide={true}
                                    enableCellTextSelection={true}
                                    ensureDomOrder={true}
                                    suppressRowTransform={true}
                                />
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Profile Modal - Increased size and font */}
            {isProfileOpen && selectedProfile && (
                <ProfileModal
                    selectedProfile={selectedProfile}
                    onClose={() => setIsProfileOpen(false)} // ✔️ Passes a function
                    title="Employee Profile"
                />
            )}
            {/* Snackbar for notifications */}
            {snackbar && (
                <div className={`snackbar ${snackbar.severity}`}>
                    {snackbar.message}
                </div>
            )}
            {isEditFormOpen && (

                <UserEditForm
                    userId={selectedEmployee.userId}
                    onSubmit={handleEditSubmit}
                    onCancel={() => setIsEditFormOpen(false)}
                />

            )}
        </div>
    )
}

export default TeamManagement