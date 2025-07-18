import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import "./App.css";
import toast,{ Toaster } from 'react-hot-toast';

import Sidebar from './components/sidebar';
import ProjectTeamManagement from './components/ProjectTeamManagement';
import TeamManagement from './components/TeamManagement';
import ProjectManagement from './components/ProjectManagement';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import Login from './pages/Login';
import Signup from './pages/Signup';
import GlobalSnackbar from './components/GlobalSnackbar';
import Navbar from './components/Navbar';
import UserManagement from './pages/UserManagement';
import TimesheetDashboard from './components/EmployeeTimesheet';
import TimesheetManager from './components/EmployeeTimesheet';
import { AccessProvider, useAccess } from './Context/AccessContext';
import TimesheetApp from './components/EmployeeTimesheet';
import AdminTimesheet from './components/TimesheetAdmin';
import IndividualTimesheet from './components/IndividualTimesheet';
import POManagement from './pages/PO';
import PODetailsPage from './components/PODetail';
const Dashboard = () => <div>Dashboard Content</div>;
const ManageProjects = () => <div>Manage Projects Content</div>;
const ManageTimesheet = () => <div>Manage Timesheet Content</div>;


const App = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'info',
    });

    const { role, loading } = useAccess();

    useEffect(() => {
        const authStatus = sessionStorage.getItem('isAuthenticated');
        if (authStatus === 'true') {
            setIsAuthenticated(true);
        }
    }, []);

    const handleLogin = () => {
        setIsAuthenticated(true);
        sessionStorage.setItem('isAuthenticated', 'true');
    };

    const handleSignup = () => {
        setIsAuthenticated(true);
        sessionStorage.setItem('isAuthenticated', 'true');
    };

    return (
        // <AccessProvider>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Router>
                {isAuthenticated && (
                    <Navbar
                        setIsAuthenticated={setIsAuthenticated}
                    />
                )}
                <div className="flex-1 overflow-y-auto">
                    <Routes>
                        {!isAuthenticated ? (
                            <>
                                <Route path="/login" element={<Login onLogin={handleLogin} />} />
                                <Route path="*" element={<Navigate to="/login" />} />
                            </>
                        ) : (
                            <>
                                <Route path="/signup" element={<Signup onSignup={handleSignup} />} />
                                <Route path="/dashboard" element={<Dashboard />} />
                                <Route path="/projects" element={<ProjectManagement />} />
                                <Route path="/team" element={<TeamManagement />} />
                               
                                <Route path="/timesheet" element={role === 'tenant_admin' ? <AdminTimesheet /> : <TimesheetApp />} />
                                <Route path="/employee-timesheet" element={<TimesheetManager />} />
                                <Route path="/users" element={<UserManagement />} />
                                  <Route path="/po" element={<POManagement/>}/>
                                  <Route path="/po-details/:poId" element={<PODetailsPage />} />
                                <Route path="individual-timesheet" element={<IndividualTimesheet />} />
                                <Route path="*" element={<Navigate to="/dashboard" />} />
                               
                            </>
                        )}
                    </Routes>
                </div>

                    <GlobalSnackbar
                        open={snackbar.open}
                        message={snackbar.message}
                        severity={snackbar.severity}
                        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
                    />
                </Router>
            </LocalizationProvider>

        // </AccessProvider>
    );
};

export default App;