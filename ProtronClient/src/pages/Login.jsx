import React, { useState } from 'react';
import { useEffect } from 'react';
import * as forge from 'node-forge';
import { EyeIcon, EyeOffIcon, MailIcon } from 'lucide-react';
import GlobalSnackbar from '../components/GlobalSnackbar';
import axios from 'axios';
import ForgotPassword from './ForgotPassword';
import { useAccess } from '../Context/AccessContext';
import { useSession } from '../Context/SessionContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import dstGlobalLogo from "../assets/DST Global logo.png";

const DEFAULT_API_URL = 'http://localhost:8282';
const getApiBase = () => import.meta.env.VITE_API_URL || DEFAULT_API_URL;

const Login = ({ setIsAuthenticated }) => {
    const { setRole, setRoleAccessRights, setUserAccessRights } = useAccess();
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { updateSession } = useSession();
    const [publicKey, setPublicKey] = useState(null);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const apiBase = getApiBase().replace(/\/$/, '');
    const [oauthProviders, setOauthProviders] = useState([
        { id: 'google', name: 'Google', authorizationUrl: `${apiBase}/oauth2/authorization/google` },
        { id: 'azure', name: 'Microsoft (Outlook)', authorizationUrl: `${apiBase}/oauth2/authorization/azure` },
    ]);

    useEffect(() => {
        const oauthError = searchParams.get('error');
        if (oauthError) {
            const msg = { user_not_registered: 'This account is not registered. Contact your administrator.', user_not_active: 'Your account is not active.', oauth_failed: 'Sign-in with provider failed. Try again.' }[oauthError] || 'Sign-in failed.';
            setSnackbar({ open: true, message: msg, severity: 'error' });
        }
    }, [searchParams]);

    useEffect(() => {
        const apiUrl = import.meta.env.VITE_API_URL || DEFAULT_API_URL;
        const fetchKey = async () => {
            try {
                const res = await axios.get(`${apiUrl}/api/security/public-key`);
                const pem = "-----BEGIN PUBLIC KEY-----\n" + res.data.match(/.{1,64}/g).join("\n") + "\n-----END PUBLIC KEY-----";
                setPublicKey(pem);
            } catch (_) { /* keep default */ }
        };
        fetchKey();
    }, []);

    useEffect(() => {
        const apiUrl = import.meta.env.VITE_API_URL || DEFAULT_API_URL;
        axios.get(`${apiUrl}/api/auth/oauth2/providers`).then((res) => {
            if (Array.isArray(res.data) && res.data.length) setOauthProviders(res.data);
        }).catch(() => { /* keep initial urls from apiBase */ });
    }, []);

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    // Function to encrypt password
    const encryptPassword = (password) => {
    if (!publicKey) return password;
    const rsa = forge.pki.publicKeyFromPem(publicKey);
    const encrypted = rsa.encrypt(password, 'RSAES-PKCS1-V1_5');
    return forge.util.encode64(encrypted);
};

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!email || !password) {
            setError('All fields are required');
            return;
        }

        setIsLoading(true);
        try {
            const encryptedPassword = encryptPassword(password);
const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/users/login`, {
    email,
    password: encryptedPassword,
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
});

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
            console.error('Login failed:', error);

            let errorMessage = 'Login failed. Please try again.';
            if (error.response) {
                // The request was made and the server responded with a status code
                // that falls out of the range of 2xx
                errorMessage = error.response.data?.message || `Error: ${error.response.status} ${error.response.statusText}`;
            } else if (error.request) {
                // The request was made but no response was received
                errorMessage = 'Network error. Please check your connection or if the server is running.';
            }

            setSnackbar({
                open: true,
                message: errorMessage,
                severity: 'error',
            });
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
                        <img src={dstGlobalLogo} alt="DST Global Logo" className="h-12 w-auto rounded" />
                        <div className="flex items-center space-x-2">
                            <span className="text-2xl font-bold text-gray-800">DST Global</span>
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
                        disabled={isLoading}
                    >
                        {isLoading ? 'Signing in...' : 'Sign in'}
                    </button>

                    <div className="mt-6">
                        <p className="text-center text-gray-500 text-sm mb-3">Or sign in with</p>
                        <div className="space-y-2">
                            {oauthProviders.map((p) => (
                                <a
                                    key={p.id}
                                    href={p.authorizationUrl}
                                    className="flex items-center justify-center gap-2 w-full py-2.5 border border-gray-300 rounded-md hover:bg-gray-50 text-gray-700 text-sm font-medium"
                                >
                                    {p.name}
                                </a>
                            ))}
                        </div>
                    </div>
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