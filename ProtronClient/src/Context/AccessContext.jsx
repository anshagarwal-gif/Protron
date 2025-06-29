import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AccessContext = createContext();

export const AccessProvider = ({ children }) => {
  const [accessRights, setAccessRights] = useState([]);
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = sessionStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    axios.get(`${import.meta.env.VITE_API_URL}/api/users/loggedInUser`, {
      headers: {
        Authorization: sessionStorage.getItem("token"),
      },
    })
      .then((response) => {
        const data = response.data;
        setAccessRights([
  ...(data.role?.roleAccessRights?.map(r => r.accessRight) || []),
  ...(data.userAccessRights?.map(u => u.accessRight) || []),
]);
        setRole(data.role.roleName);
      })
      .catch((error) => {
        console.error('Error fetching logged-in user:', error);
        sessionStorage.removeItem('token');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const hasAccess = (moduleName, action) => {
    const accessesForModule = accessRights.filter(a => a.moduleName === moduleName);
    if (accessesForModule.length === 0) return false;

    switch (action) {
      case 'view': return accessesForModule.some(a => a.canView);
      case 'edit': return accessesForModule.some(a => a.canEdit);
      case 'delete': return accessesForModule.some(a => a.canDelete);
      default: return false;
    }
  };

  return (
    <AccessContext.Provider value={{ accessRights, setAccessRights, role, setRole, hasAccess, loading }}>
      {!loading && children}
    </AccessContext.Provider>
  );
};

export const useAccess = () => useContext(AccessContext);
