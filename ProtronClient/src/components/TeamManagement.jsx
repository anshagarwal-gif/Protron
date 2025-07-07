import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { FiUser, FiChevronDown, FiMenu, FiArrowUp, FiArrowDown, FiFilter } from 'react-icons/fi'
import { AiOutlineDownload } from 'react-icons/ai'
import { AgGridReact } from 'ag-grid-react'
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community'
import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-alpine.css'
import * as XLSX from "xlsx";
import axios from 'axios'

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

const TeamManagement = () => {
    const [employees, setEmployees] = useState([])
    const [filteredEmployees, setFilteredEmployees] = useState([])
    const [loading, setLoading] = useState(true)
    const [snackbar, setSnackbar] = useState("")
    const [selectedProfile, setSelectedProfile] = useState(null);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isMobileView, setIsMobileView] = useState(false);
    const [gridApi, setGridApi] = useState(null);
    const [gridColumnApi, setGridColumnApi] = useState(null);

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

    // Name cell renderer with profile photo
    const NameCellRenderer = (params) => {
        const { data } = params;
        return (
            <div className="flex items-center cursor-pointer hover:text-green-700" onClick={() => handleProfileClick(data.email)}>
                <img
                    src={
                        data.photo
                            ? `data:image/png;base64,${data.photo}`
                            : `${import.meta.env.VITE_API_URL}/api/users/${data.userId}/photo`
                    }
                    alt={data.firstName + ' ' + data.lastName}
                    className="w-10 h-10 rounded-full object-cover border border-gray-200 mr-2"
                    onError={(e) => {
                        e.target.src = "/profilepic.jpg";
                    }}
                />
                <span>{data.firstName + ' ' + data.lastName}</span>
            </div>
        );
    };

    // Status cell renderer with colors
    const StatusCellRenderer = (params) => {
        const getStatusColor = (status) => {
            switch (status) {
                case 'Active':
                    return 'bg-green-100 text-green-800';
                case 'On Hold':
                    return 'bg-yellow-100 text-yellow-800';
                case 'Hold':
                    return 'bg-yellow-100 text-yellow-800';
                case 'Removed':
                    return 'bg-red-100 text-red-800';
                default:
                    return 'bg-gray-100 text-gray-800';
            }
        };

        return (
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(params.value)}`}>
                {params.value}
            </span>
        );
    };

    // Date cell renderer
    const DateCellRenderer = (params) => {
        return params.value ? params.value.split('T')[0] : "N/A";
    };

    // AG Grid column definitions
    const columnDefs = useMemo(() => [
        {
            headerName: "Name",
            field: "firstName",
            cellRenderer: NameCellRenderer,
            sortable: true,
            filter: true,
            resizable: true,
            width: 200,
            valueGetter: (params) => `${params.data.firstName} ${params.data.lastName}`,
        },
        {
            headerName: "Emp-Code",
            field: "empCode",
            sortable: true,
            filter: true,
            resizable: true,
            width: 150,
        },
        {
            headerName: "Email",
            field: "email",
            sortable: true,
            filter: true,
            resizable: true,
            width: 250,
        },
        {
            headerName: "Cost",
            field: "cost",
            sortable: true,
            filter: 'agNumberColumnFilter',
            resizable: true,
            width: 120,
            valueFormatter: (params) => params.value || 'N/A',
        },
        {
            headerName: "DOJ",
            field: "dateOfJoining",
            cellRenderer: DateCellRenderer,
            sortable: true,
            filter: 'agDateColumnFilter',
            resizable: true,
            width: 150,
        },
        {
            headerName: "Status",
            field: "status",
            cellRenderer: StatusCellRenderer,
            sortable: true,
            filter: true,
            resizable: true,
            width: 120,
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
                'Employee Name': employee.firstName + " " + employee.lastName,
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

    useEffect(() => {
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

        fetchEmployees();
    }, []);

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
                        {member.firstName + member.lastName}
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
        <div className="max-w-full px-4 sm:px-6 pb-6">
            <div>

                   <div className="flex items-center bg-green-700 justify-between p-4 border-b border-gray-200">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                             <h1 className="text-lg text-white"><FiUser /></h1> <h1 className="text-lg font-semibold text-white">Team Management</h1>
                            </div>
                          </div>
                        </div>

                {/* Status filter and export row */}
                 <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mt-5 mb-3">
            <h1 className="text-2xl font-bold text-green-800">Team List</h1>

                    <button
                        className="border px-3 py-2 rounded bg-green-700 text-white hover:bg-green-600 flex items-center justify-center text-base"
                        onClick={downloadExcel}
                    >
                        <AiOutlineDownload className="mr-1" />
                        <span>Download Excel</span>
                    </button>
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
                            <div className="ag-theme-alpine" style={{ height: '600px', width: '100%' }}>
                                <style>{`
                                    .ag-theme-alpine {
                                        --ag-header-background-color: #15803d !important;
                                        --ag-header-foreground-color: #ffffff !important;
                                    }
                                    
                                    .ag-theme-alpine .ag-header {
                                        background-color: #15803d !important;
                                        border-bottom: 2px solid #166534 !important;
                                    }
                                    
                                    .ag-theme-alpine .ag-header-cell {
                                        background-color: #15803d !important;
                                        color: #ffffff !important;
                                        border-right: 1px solid rgba(255, 255, 255, 0.2) !important;
                                        font-weight: 600 !important;
                                    }
                                    
                                    .ag-theme-alpine .ag-header-cell:hover {
                                        background-color: #166534 !important;
                                    }
                                    
                                    .ag-theme-alpine .ag-header-cell-text {
                                        color: #ffffff !important;
                                        font-weight: 500;
                                    }
                                    
                                    .ag-theme-alpine .ag-header-cell-label {
                                        color: #ffffff !important;
                                    }
                                    
                                    .ag-theme-alpine .ag-header-cell-sortable .ag-header-cell-label {
                                        cursor: pointer;
                                    }
                                    
                                    .ag-theme-alpine .ag-header-cell-sortable .ag-header-cell-label:hover {
                                        color: #f3f4f6 !important;
                                    }
                                    
                                    .ag-theme-alpine .ag-menu {
                                        box-shadow: 0 10px 25px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
                                        border-radius: 8px;
                                        border: 1px solid #e5e7eb;
                                        overflow: hidden;
                                    }
                                    
                                    .ag-theme-alpine .ag-menu .ag-menu-list {
                                        padding: 8px 0;
                                    }
                                    
                                    .ag-theme-alpine .ag-menu .ag-menu-separator {
                                        margin: 4px 0;
                                        border-color: #e5e7eb;
                                    }
                                    
                                    .ag-theme-alpine .ag-filter-panel {
                                        padding: 16px;
                                        background: #ffffff;
                                    }
                                    
                                    .ag-theme-alpine .ag-filter-panel .ag-filter-body {
                                        padding: 0;
                                    }
                                    
                                    .ag-theme-alpine .ag-filter-panel .ag-filter-body .ag-filter-condition {
                                        margin: 8px 0;
                                    }
                                    
                                    .ag-theme-alpine .ag-filter-panel .ag-filter-body input {
                                        padding: 8px 12px;
                                        border: 1px solid #d1d5db;
                                        border-radius: 6px;
                                        font-size: 14px;
                                        transition: all 0.2s ease;
                                    }
                                    
                                    .ag-theme-alpine .ag-filter-panel .ag-filter-body input:focus {
                                        outline: none;
                                        border-color: #15803d;
                                        box-shadow: 0 0 0 3px rgba(21, 128, 61, 0.1);
                                    }
                                    
                                    .ag-theme-alpine .ag-filter-panel .ag-filter-body select {
                                        padding: 8px 12px;
                                        border: 1px solid #d1d5db;
                                        border-radius: 6px;
                                        font-size: 14px;
                                        background: #ffffff;
                                        transition: all 0.2s ease;
                                    }
                                    
                                    .ag-theme-alpine .ag-filter-panel .ag-filter-body select:focus {
                                        outline: none;
                                        border-color: #15803d;
                                        box-shadow: 0 0 0 3px rgba(21, 128, 61, 0.1);
                                    }
                                    
                                    .ag-theme-alpine .ag-filter-panel .ag-filter-apply-panel {
                                        padding: 16px 0 0 0;
                                        border-top: 1px solid #e5e7eb;
                                        margin-top: 16px;
                                        display: flex;
                                        justify-content: flex-end;
                                        gap: 8px;
                                    }
                                    
                                    .ag-theme-alpine .ag-filter-panel .ag-filter-apply-panel .ag-button {
                                        padding: 8px 16px;
                                        border-radius: 6px;
                                        font-size: 14px;
                                        font-weight: 500;
                                        transition: all 0.2s ease;
                                        border: 1px solid transparent;
                                        cursor: pointer;
                                    }
                                    
                                    .ag-theme-alpine .ag-filter-panel .ag-filter-apply-panel .ag-button:not(.ag-button-secondary) {
                                        background: #15803d;
                                        color: #ffffff;
                                        border-color: #15803d;
                                    }
                                    
                                    .ag-theme-alpine .ag-filter-panel .ag-filter-apply-panel .ag-button:not(.ag-button-secondary):hover {
                                        background: #166534;
                                        border-color: #166534;
                                    }
                                    
                                    .ag-theme-alpine .ag-filter-panel .ag-filter-apply-panel .ag-button.ag-button-secondary {
                                        background: #ffffff;
                                        color: #374151;
                                        border-color: #d1d5db;
                                    }
                                    
                                    .ag-theme-alpine .ag-filter-panel .ag-filter-apply-panel .ag-button.ag-button-secondary:hover {
                                        background: #f9fafb;
                                        border-color: #9ca3af;
                                    }
 /* Left-align header labels */
.ag-theme-alpine .ag-header-cell .ag-header-cell-label {
    justify-content: flex-start;
}

/* Left-align all cell content */
.ag-theme-alpine .ag-cell {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    text-align: left;
}

                                    
                                    .ag-theme-alpine .ag-header-cell-menu-button {
                                        color: #ffffff !important;
                                        opacity: 0.8;
                                    }
                                    
                                    .ag-theme-alpine .ag-header-cell-menu-button:hover {
                                        opacity: 1;
                                    }
                                    
                                    .ag-theme-alpine .ag-header-cell-menu-button .ag-icon {
                                        color: #ffffff !important;
                                    }
                                    
                                    .ag-theme-alpine .ag-icon-menu {
                                        color: #ffffff !important;
                                    }
                                    
                                    .ag-theme-alpine .ag-icon-filter {
                                        color: #ffffff !important;
                                    }
                                    
                                    .ag-theme-alpine .ag-icon-asc,
                                    .ag-theme-alpine .ag-icon-desc,
                                    .ag-theme-alpine .ag-icon-none {
                                        color: #ffffff !important;
                                    }
                                    
                                    .ag-theme-alpine .ag-sort-ascending-icon,
                                    .ag-theme-alpine .ag-sort-descending-icon,
                                    .ag-theme-alpine .ag-sort-none-icon {
                                        color: #ffffff !important;
                                        font-size: 16px !important;
                                        width: 16px !important;
                                        height: 16px !important;
                                    }
                                    
                                    .ag-theme-alpine .ag-header-cell .ag-icon {
                                        color: #ffffff !important;
                                        font-size: 16px !important;
                                        width: 16px !important;
                                        height: 16px !important;
                                    }
                                    
                                    .ag-theme-alpine .ag-menu-option-text {
                                        color: #374151;
                                        font-size: 14px;
                                    }
                                    
                                    .ag-theme-alpine .ag-menu-option:hover {
                                        background: #f0fdf4;
                                    }
                                    
                                    .ag-theme-alpine .ag-menu-option-active {
                                        background: #dcfce7;
                                    }
                                    
                                    .ag-theme-alpine .ag-row {
                                        border-bottom: 1px solid #e5e7eb;
                                    }
                                    
                                    .ag-theme-alpine .ag-row:hover {
                                        background-color: #f0fdf4 !important;
                                    }
                                    
                                    .ag-theme-alpine .ag-paging-panel {
                                        border-top: 1px solid #d1d5db;
                                        background-color: #f9fafb;
                                    }
                                    
                                    .ag-theme-alpine .ag-paging-button {
                                        color: #15803d;
                                    }
                                    
                                    .ag-theme-alpine .ag-paging-button:hover {
                                        background-color: #dcfce7;
                                    }
                                    
                                    .ag-theme-alpine .ag-paging-button.ag-disabled {
                                        color: #9ca3af;
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

/* Paging Buttons */
.ag-theme-alpine .ag-paging-button {
  background: linear-gradient(to bottom right, #10b981, #059669);
  color: white;
  margin: 0 4px;
  border: none;
  border-radius: 6px;
  padding: 4px 10px;
  height:24px;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  font-weight: 500;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.ag-theme-alpine .ag-paging-button:hover {
  background: linear-gradient(to bottom right, #059669, #047857);
  transform: scale(1.05);
}

.ag-theme-alpine .ag-paging-button[disabled] {
  background-color: #e5e7eb;
  color: #9ca3af;
  cursor: not-allowed;
  box-shadow: none;
}

/* Page Size Dropdown Label */
.ag-theme-alpine .ag-paging-panel::before {
  margin-right: 8px;
  font-weight: 500;
  color: #374151;
}

/* Page Size Selector */
.ag-theme-alpine select {
  padding: 6px 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background-color: #ffffff;
  color: #111827;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease-in-out;
}

.ag-theme-alpine select:hover,
.ag-theme-alpine select:focus {
  border-color: #10b981;
  outline: none;
  background-color: #ecfdf5;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.3);
}

/* Page info text (e.g., 1 to 10 of 16) */
.ag-theme-alpine .ag-paging-row-summary-panel {
  font-weight: 500;
  font-size: 14px;
  color: #374151;
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
                <>
                    <div
                        className="fixed inset-0 bg-[rgba(0,0,0,0.3)] z-40 transition-opacity"
                        onClick={() => setIsProfileOpen(false)}
                    />

                    <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-[900px] bg-white rounded-lg shadow-xl z-50 p-6">
                        <button
                            className="absolute top-4 right-4 text-gray-600 hover:text-gray-900 text-xl font-bold"
                            onClick={() => setIsProfileOpen(false)}
                        >
                            ✖
                        </button>

                        <div className="flex items-start space-x-6 mb-6 pb-4 border-b">
                            <img
                                src={selectedProfile.profilePhoto ? selectedProfile.profilePhoto : "./profilepic.jpg"}
                                className="w-24 h-24 rounded-full object-cover"
                                alt="Profile"
                            />
                            <div>
                                <h2 className="text-2xl font-bold">
                                    {selectedProfile.firstName} {selectedProfile.middleName ? selectedProfile.middleName + " " : ""}{selectedProfile.lastName}
                                </h2>
                                <p className="text-lg text-gray-500">{selectedProfile.empCode}</p>
                                <p className="text-lg mt-2">
                                    <span className="font-medium">Email:</span> {selectedProfile.email}
                                </p>
                                <p className="text-lg">
                                    <span className="font-medium">Joined:</span> {selectedProfile.dateOfJoining ? new Date(selectedProfile.dateOfJoining).toLocaleDateString() : "N/A"}
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-4">
                                <div className="bg-gray-50 p-4 rounded">
                                    <h3 className="text-lg font-semibold mb-3">Contact Information</h3>
                                    <div className="space-y-2 text-base">
                                        <p><span className="font-medium">Mobile:</span> {selectedProfile.mobilePhone || "N/A"}</p>
                                        <p><span className="font-medium">Office:</span> {selectedProfile.lanPhone || "N/A"}</p>
                                    </div>
                                </div>

                                <div className="bg-gray-50 p-4 rounded">
                                    <h3 className="text-lg font-semibold mb-3">Organization</h3>
                                    <div className="space-y-2 text-base">
                                        <p><span className="font-medium">Company:</span> {selectedProfile.tenant?.tenantName || "N/A"}</p>
                                        <p><span className="font-medium">Role:</span> {selectedProfile.role?.roleName || "N/A"}</p>
                                        <p><span className="font-medium">Unit:</span> {selectedProfile.unit || "N/A"}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="bg-gray-50 p-4 rounded h-full">
                                    <h3 className="text-lg font-semibold mb-3">Location</h3>
                                    <div className="text-base">
                                        <p>{selectedProfile.addressLine1 || "N/A"}</p>
                                        {selectedProfile.addressLine2 && <p>{selectedProfile.addressLine2}</p>}
                                        {selectedProfile.addressLine3 && <p>{selectedProfile.addressLine3}</p>}
                                        <p>
                                            {selectedProfile.city && `${selectedProfile.city}, `}
                                            {selectedProfile.state && `${selectedProfile.state}, `}
                                            {selectedProfile.zipCode && `${selectedProfile.zipCode}`}
                                        </p>
                                        <p>{selectedProfile.country || "N/A"}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="bg-gray-50 p-4 rounded">
                                    <h3 className="text-lg font-semibold mb-3">Project Teams ({selectedProfile.projectTeams?.length || 0})</h3>
                                    {selectedProfile.projectTeams && selectedProfile.projectTeams.length > 0 ? (
                                        <div className="text-base max-h-[120px] overflow-y-auto pr-2">
                                            <ul className="list-disc list-inside space-y-1">
                                                {selectedProfile.projectTeams.map((team, i) => (
                                                    <li key={i} className="truncate" title={team.project.projectName}>
                                                        {team.project.projectName || `Team ${i + 1}`}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    ) : (
                                        <p className="text-gray-500 text-base">Not part of any teams</p>
                                    )}
                                </div>

                                <div className="bg-gray-50 p-4 rounded">
                                    <h3 className="text-lg font-semibold mb-3">Certifications</h3>
                                    {selectedProfile.certificates && selectedProfile.certificates.length > 0 ? (
                                        <ul className="list-disc list-inside text-base space-y-1">
                                            {selectedProfile.certificates.map((cert, i) => (
                                                <li key={i}>{cert.name || cert}</li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-gray-500 text-base">No certifications found</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}

export default TeamManagement