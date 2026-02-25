import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useAccess } from '../Context/AccessContext';
import { useSession } from '../Context/SessionContext';

const DEFAULT_API_URL = 'http://localhost:8282';

const OAuthCallback = ({ onAuthenticated }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setRole, setRoleAccessRights, setUserAccessRights } = useAccess();
  const { updateSession } = useSession();
  const [error, setError] = useState(null);

  const apiUrl = import.meta.env.VITE_API_URL || DEFAULT_API_URL;

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setError('Missing token');
      return;
    }
    sessionStorage.setItem('token', token);
    sessionStorage.setItem('isAuthenticated', 'true');

    axios
      .get(`${apiUrl}/api/auth/session`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const data = res.data;
        sessionStorage.setItem('email', data.email);
        sessionStorage.setItem('tenantId', data.tenantId);
        sessionStorage.setItem('userId', data.userId);
        sessionStorage.setItem('tenantName', data.tenantName);
        updateSession({
          token,
          email: data.email,
          tenantId: data.tenantId,
          userId: data.userId,
          tenantName: data.tenantName,
        });
        setRoleAccessRights(data.roleAccessRights || []);
        setUserAccessRights(data.userAccessRights || []);
        setRole(data.role);
        onAuthenticated(true);
        navigate('/dashboard', { replace: true });
      })
      .catch(() => {
        setError('Session could not be loaded. Please try logging in again.');
      });
  }, [searchParams, apiUrl, navigate, onAuthenticated, updateSession, setRole, setRoleAccessRights, setUserAccessRights]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-6 max-w-md text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            type="button"
            onClick={() => navigate('/login', { replace: true })}
            className="text-green-600 hover:underline"
          >
            Back to login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-gray-600">Signing you in...</div>
    </div>
  );
};

export default OAuthCallback;
