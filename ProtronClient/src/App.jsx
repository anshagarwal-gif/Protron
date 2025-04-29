import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import "./App.css";

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

const Dashboard = () => <div>Dashboard Content</div>;
const ManageProjects = () => <div>Manage Projects Content</div>;
const ManageTimesheet = () => <div>Manage Timesheet Content</div>;

const UserManagement = () => {
    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <button
                style={{
                    backgroundColor: '#1b5e20',
                    color: 'white',
                    padding: '10px 20px',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                    transition: 'background-color 0.3s ease',
                }}
                onMouseOver={(e) => (e.target.style.backgroundColor = '#2e7d32')}
                onMouseOut={(e) => (e.target.style.backgroundColor = '#1b5e20')}
                onClick={() => window.location.href = '/signup'}
            >
                Create New User
            </button>
        </div>
    );
};

const App = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'info',
    });

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
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Router>
                {isAuthenticated && (
                    <Navbar
                        setIsAuthenticated={setIsAuthenticated}
                    />
                )}
                <div className="flex-1 p-6 overflow-y-auto">
                    <Routes>
                        {!isAuthenticated ? (
                            <>
                                <Route path="/login" element={<Login onLogin={handleLogin} />} />
                                <Route path="/signup" element={<Signup onSignup={handleSignup} />} />
                                <Route path="*" element={<Navigate to="/login" />} />
                            </>
                        ) : (
                            <>
                                <Route path="/dashboard" element={<Dashboard />} />
                                <Route path="/projects" element={<ProjectManagement />} />
                                <Route path="/team" element={<TeamManagement />} />
                                <Route path="/timesheet" element={<ManageTimesheet />} />
                                <Route path="/users" element={<UserManagement />} />
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
    );
};

export default App;
