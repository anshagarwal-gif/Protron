import React, { useEffect, useState, useCallback, memo } from 'react';
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
import { useSessionTimer } from './hooks/useSessionTimer'; // Adjust path as needed

// Memoized route components to prevent unnecessary re-renders
const MemoizedUserManagement = memo(UserManagement);
const MemoizedPOManagement = memo(POManagement);
const MemoizedProjectManagement = memo(ProjectManagement);
const MemoizedTeamManagement = memo(TeamManagement);
const MemoizedDashboard = memo(Dashboard);

const AppContent = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info',
  });

  const { role, loading: roleLoading } = useAccess();
  const location = useLocation();

  // Session expiry handler
  const handleSessionExpiry = useCallback(() => {
    sessionStorage.clear();
    setSessionExpired(true);
    setIsAuthenticated(false);
  }, []);

  // Initialize session timer
  const sessionTimer = useSessionTimer(isAuthenticated, sessionExpired, handleSessionExpiry);

  const handleSignup = useCallback(() => {
    setSessionExpired(false);
    setIsAuthenticated(true);
    sessionStorage.setItem('isAuthenticated', 'true');
  }, []);

  const handleLogin = useCallback((authStatus) => {
    setSessionExpired(false);
    setIsAuthenticated(authStatus);
  }, []);

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
      {isAuthenticated && !sessionExpired && (
        <Navbar 
          setIsAuthenticated={setIsAuthenticated} 
          sessionTimer={sessionTimer} // Pass sessionTimer instead of countdown
        />
      )}
      <div className="flex-1 overflow-y-auto">
        <Routes>
          {!isAuthenticated || sessionExpired ? (
            // Unauthenticated routes - removed fragment wrapper
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
            // Authenticated routes - removed fragment wrapper
            <>
              <Route path="/" element={<Navigate to="/dashboard" />} />
              <Route path="/dashboard" element={<MemoizedDashboard />} />
              <Route path="/projects" element={<MemoizedProjectManagement />} />
              <Route path="/signup" element={<Signup/>}/>
              {/* <Route path="/team" element={<MemoizedTeamManagement />} /> */}
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
              <Route path="/users" element={<MemoizedUserManagement />} />
              <Route path="/po" element={<MemoizedPOManagement />} />
              <Route path="/po-details/:poId" element={<PODetailsPage />} />
              <Route path="/individual-timesheet" element={<IndividualTimesheet />} />
              <Route path="/session-expired" element={<Navigate to="/dashboard" />} />
              <Route path="/unauthorized" element={<Unauthorized />} />
              <Route path="/login" element={<Navigate to="/dashboard" />} />
              <Route path="/signup" element={<Navigate to="/signup" />} />
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