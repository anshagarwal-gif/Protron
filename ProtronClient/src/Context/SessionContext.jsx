// src/Context/SessionContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';

const SessionContext = createContext();

export const SessionProvider = ({ children }) => {
    const [sessionData, setSessionData] = useState({
        token: null,
        email: null,
        tenantId: null,
        userId: null,
    });

    useEffect(() => {
        // Load session data from sessionStorage on mount
        const storedData = {
            token: sessionStorage.getItem('token'),
            email: sessionStorage.getItem('email'),
            tenantId: sessionStorage.getItem('tenantId'),
            userId: sessionStorage.getItem('userId'),
        };
        setSessionData(storedData);
    }, []);

    const updateSession = (data) => {
        // Update context and sessionStorage
        Object.entries(data).forEach(([key, value]) => {
            sessionStorage.setItem(key, value);
        });
        setSessionData((prev) => ({ ...prev, ...data }));
    };

    const clearSession = () => {
        sessionStorage.clear();
        setSessionData({
            token: null,
            email: null,
            tenantId: null,
            userId: null,
        });
    };

    return (
        <SessionContext.Provider value={{ sessionData, updateSession, clearSession }}>
            {children}
        </SessionContext.Provider>
    );
};

export const useSession = () => useContext(SessionContext);
