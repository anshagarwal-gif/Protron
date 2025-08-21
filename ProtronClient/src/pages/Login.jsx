import React, { useState } from 'react';
import { EyeIcon, EyeOffIcon, MailIcon } from 'lucide-react';
import GlobalSnackbar from '../components/GlobalSnackbar';
import axios from 'axios';
import ForgotPassword from './ForgotPassword'; // Import the new component
import { useAccess } from '../Context/AccessContext';
import { useSession } from '../Context/SessionContext';
import { useNavigate } from 'react-router-dom';
 // Import your logo if needed
const Login = ({ setIsAuthenticated }) => {
    const { setAccessRights, setRole, setRoleAccessRights, setUserAccessRights } = useAccess();
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'info', // 'success' | 'error' | 'warning' | 'info'
    });
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false); // New state for loader
    const { updateSession } = useSession();
    const navigate = useNavigate();

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!email || !password) {
            setError('All fields are required');
            return;
        }

        setIsLoading(true);
        try {
            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/api/users/login`,
                {
                    email,
                    password,
                    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                }
            );

            const data = response.data;

            setSnackbar({
                open: true,
                message: 'Login successful!',
                severity: 'success',
            });

            sessionStorage.setItem('token', data.token);
            sessionStorage.setItem('email', data.email);
            sessionStorage.setItem('tenantId', data.tenantId);
            sessionStorage.setItem('userId', data.userId);
            sessionStorage.setItem('tenantName', data.tenantName);
            sessionStorage.setItem('isAuthenticated', 'true');

            updateSession({
                token: data.token,
                email: data.email,
                tenantId: data.tenantId,
                userId: data.userId,
                tenantName: data.tenantName,
            });

            setRoleAccessRights(data.roleAccessRights);
            setUserAccessRights(data.userAccessRights);
            setRole(data.role);
            setIsAuthenticated(true);

            // setTimeout(() => {
            //     navigate('/dashboard');
            // }, 5000); 
        } catch (error) {
            setSnackbar({
                open: true,
                message: error.response?.data || 'Login failed!',
                severity: 'error',
            });
            console.error('Login failed:', error.response?.data);
        } finally {
            setIsLoading(false);
        }
    };

    if (showForgotPassword) {
        return (
            <div className="min-h-screen bg-blue-50 flex items-center justify-center p-4">
                <ForgotPassword onBack={() => setShowForgotPassword(false)} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-green-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-md w-full max-w-md p-8">
                {/* Logo Section */}
                <div className="flex justify-center mb-8">
                    <div className="flex items-center space-x-2">
                        {/* Replace this with your actual logo image */}
                        <img src='./logo.png' alt="Company Logo" className="h-12 w-auto" />
                        
                        {/* Placeholder logo - replace with your actual logo */}
                        <div className="flex items-center space-x-2">
                            <span className="text-2xl font-bold text-gray-800">Project Matrics</span>
                        </div>
                    </div>
                </div>

                <h1 className="text-2xl font-bold text-center text-gray-800">Welcome </h1>
                <p className="text-gray-600 text-center mb-8">Please sign in to your account</p>

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="mb-6">
                        <label htmlFor="email" className="block text-gray-700 mb-2">Email address</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                <MailIcon className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                id="email"
                                type="email"
                                placeholder="Enter your email"
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="mb-2">
                        <label htmlFor="password" className="block text-gray-700 mb-2">Password</label>
                        <div className="relative">
                            <input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter your password"
                                className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <button
                                type="button"
                                className="absolute inset-y-0 right-0 flex items-center pr-3"
                                onClick={togglePasswordVisibility}
                            >
                                {showPassword ? (
                                    <EyeOffIcon className="h-5 w-5 text-gray-400" />
                                ) : (
                                    <EyeIcon className="h-5 w-5 text-gray-400" />
                                )}
                            </button>
                        </div>
                    </div>

                    <div className="text-right mb-6">
                        <button
                            type="button"
                            onClick={() => setShowForgotPassword(true)}
                            className="text-green-600 text-sm hover:underline"
                        >
                            Forgot your password?
                        </button>
                    </div>

                    <button
                        type="submit"
                        className={`w-full bg-green-700 text-white py-3 rounded-md hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                        disabled={isLoading} // Disable button when loading
                    >
                        {isLoading ? 'Signing in...' : 'Sign in'}
                    </button>
                </form>
            </div>
            <GlobalSnackbar
                open={snackbar.open}
                message={snackbar.message}
                severity={snackbar.severity}
                onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
            />
        </div>
    );
}

export default Login;