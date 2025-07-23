import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AccessContext = createContext();

export const AccessProvider = ({ children }) => {
  const [roleAccessRights, setRoleAccessRights] = useState([]);
  const [userAccessRights, setUserAccessRights] = useState([]);
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

        // Combine role access rights and user access rights
        const roleAccessRights = data.role?.roleAccessRights?.map(r => r.accessRight) || [];
        const userAccessRights = data.userAccessRights?.map(u => u.accessRight) || [];

        setRoleAccessRights(roleAccessRights);
        setUserAccessRights(userAccessRights);
        setRole(data.role.roleName);
      })
      .catch((error) => {
        console.error('Error fetching logged-in user:', error);
        // sessionStorage.removeItem('token');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const getFinalAccessRights = (roleAccessRights, userAccessRights) => {
  // Create a map for user access rights for quick lookup
  const userAccessMap = userAccessRights.reduce((map, access) => {
    map[access.moduleName] = access;
    return map;
  }, {});

  // Merge role access rights with user access rights (user access overrides role access)
  const finalAccessRights = roleAccessRights.map(roleAccess => {
    const userAccess = userAccessMap[roleAccess.moduleName];
    if (userAccess) {
      return {
        moduleName: roleAccess.moduleName,
        canView: userAccess.canView,
        canEdit: userAccess.canEdit,
        canDelete: userAccess.canDelete,
      };
    }
    return roleAccess;
  });

  // Add any user-specific access rights that are not in role access rights
  userAccessRights.forEach(userAccess => {
    if (!finalAccessRights.some(access => access.moduleName === userAccess.moduleName)) {
      finalAccessRights.push(userAccess);
    }
  });

  return finalAccessRights;
};

  const hasAccess = (moduleName, action) => {

    const finalAccessRights = getFinalAccessRights(roleAccessRights, userAccessRights);
    const accessesForModule = finalAccessRights.filter(a => a.moduleName === moduleName);
    if (accessesForModule.length === 0) return false;

    switch (action) {
      case 'view': return accessesForModule.some(a => a.canView);
      case 'edit': return accessesForModule.some(a => a.canEdit);
      case 'delete': return accessesForModule.some(a => a.canDelete);
      default: return false;
    }
  };

  return (
    <AccessContext.Provider value={{ accessRights, setAccessRights, role, setRole, hasAccess, loading, setUserAccessRights, setRoleAccessRights, roleAccessRights, userAccessRights }}>
      {!loading && children}
    </AccessContext.Provider>
  );
};

export const useAccess = () => useContext(AccessContext);
