import React, { createContext, useContext, useState } from 'react';

const AccessContext = createContext();

export const AccessProvider = ({ children }) => {
  const [accessRights, setAccessRights] = useState([]);
  const [role, setRole] = useState('');

  const hasAccess = (moduleName, action) => {
    console.log(accessRights, moduleName, action);

    const accessesForModule = accessRights.filter(a => a.moduleName === moduleName);
    if (accessesForModule.length === 0) return false;

    switch (action) {
      case 'view':
        return accessesForModule.some(a => a.canView);
      case 'edit':
        return accessesForModule.some(a => a.canEdit);
      case 'delete':
        return accessesForModule.some(a => a.canDelete);
      default:
        return false;
    }
  };
  return (
    <AccessContext.Provider value={{ accessRights, setAccessRights, role, setRole, hasAccess }}>
      {children}
    </AccessContext.Provider>
  );
};

export const useAccess = () => useContext(AccessContext);
