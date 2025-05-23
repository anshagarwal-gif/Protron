import React, { createContext, useContext, useState } from 'react';

const AccessContext = createContext();

export const AccessProvider = ({ children }) => {
  const [accessRights, setAccessRights] = useState([]);
  const [role, setRole] = useState('');

  const hasAccess = (moduleName, action) => {
    const access = accessRights.find(a => a.moduleName === moduleName);
    if (!access) return false;
    switch (action) {
      case 'view': return access.canView;
      case 'edit': return access.canEdit;
      case 'delete': return access.canDelete;
      default: return false;
    }
  };

  return (
    <AccessContext.Provider value={{ accessRights, setAccessRights, role, setRole, hasAccess }}>
      {children}
    </AccessContext.Provider>
  );
};

export const useAccess = () => useContext(AccessContext);
