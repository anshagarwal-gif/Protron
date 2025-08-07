import React, { useEffect, useState } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from 'react-router-dom';
import "./App.css";
import toast, { Toaster } from 'react-hot-toast';

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
import { useAccess } from './Context/AccessContext';
import TimesheetApp from './components/EmployeeTimesheet';
import AdminTimesheet from './components/TimesheetAdmin';
import IndividualTimesheet from './components/IndividualTimesheet';
import POManagement from './pages/PO';
import PODetailsPage from './components/PODetail';
import Dashboard from './pages/Dashboard';
import PageNotFound from './utils/PageNotFound';
import SessionExpired from './utils/SessionExpired';
import Unauthorized from './utils/Unauthorized';

const AppContent = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(null); // null until checked
  const [sessionExpired, setSessionExpired] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info',
  });

  const { role, loading: roleLoading } = useAccess();
  const [countdown, setCountdown] = useState(7200); // in seconds
  const location = useLocation();

  useEffect(() => {
    const authStatus = sessionStorage.getItem('isAuthenticated');
    setIsAuthenticated(authStatus === 'true');
  }, []);

  // Reset sessionExpired when navigating to login or signup
  useEffect(() => {
    if (location.pathname === '/login' || location.pathname === '/signup') {
      setSessionExpired(false);
    }
  }, [location.pathname]);

  useEffect(() => {
    let timer;
    if (isAuthenticated && !sessionExpired) {
      setCountdown(7200); // reset to 7200 seconds on login

      timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            sessionStorage.clear();
            setSessionExpired(true);
            setIsAuthenticated(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(timer);
  }, [isAuthenticated, sessionExpired]);

  const handleSignup = () => {
    setSessionExpired(false);
    setIsAuthenticated(true);
    sessionStorage.setItem('isAuthenticated', 'true');
  };

  const handleLogin = (authStatus) => {
    setSessionExpired(false);
    setIsAuthenticated(authStatus);
  };

  // Show loading screen while checking auth or role
  if (isAuthenticated === null || roleLoading) {
    return (
      <div className="h-screen flex items-center justify-center text-lg font-medium">
        Loading...
      </div>
    );
  }

  return (
    <>
      {isAuthenticated && !sessionExpired && <Navbar setIsAuthenticated={setIsAuthenticated} countdown={countdown} />}
      <div className="flex-1 overflow-y-auto">
        <Routes>
          {!isAuthenticated || sessionExpired ? (
            <>
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route
                path="/login"
                element={<Login setIsAuthenticated={handleLogin} />}
              />
              <Route
                path="/signup"
                element={<Signup onSignup={handleSignup} />}
              />
              <Route path="/session-expired" element={<SessionExpired />} />
              <Route path="/unauthorized" element={<Unauthorized />} />
              <Route path="*" element={sessionExpired ? <Navigate to="/session-expired" replace /> : <Navigate to="/login" replace />} />
            </>
          ) : (
            <>
              <Route path="/" element={<Navigate to="/dashboard" />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/projects" element={<ProjectManagement />} />
              <Route path="/team" element={<TeamManagement />} />
              <Route
                path="/timesheet"
                element={
                  role === 'tenant_admin' ? (
                    <AdminTimesheet />
                  ) : (
                    <TimesheetApp />
                  )
                }
              />
              <Route path="/employee-timesheet" element={<TimesheetManager />} />
              <Route path="/users" element={<UserManagement />} />
              <Route path="/po" element={<POManagement />} />
              <Route path="/po-details/:poId" element={<PODetailsPage />} />
              <Route path="/individual-timesheet" element={<IndividualTimesheet />} />
              <Route path="/session-expired" element={<Navigate to="/dashboard" />} />
              <Route path="/unauthorized" element={<Unauthorized />} />
              <Route path="/login" element={<Navigate to="/dashboard" />} />
              <Route path="/signup" element={<Navigate to="/dashboard" />} />
              <Route path="*" element={<PageNotFound />} />
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
      <Toaster position="top-right" />
    </>
  );
};

const App = () => {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Router>
        <AppContent />
      </Router>
    </LocalizationProvider>
  );
};

export default App;