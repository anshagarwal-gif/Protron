import { useEffect, useRef, useCallback } from 'react';

export const useSessionTimer = (isAuthenticated, sessionExpired, onSessionExpire) => {
  const timerRef = useRef(null);
  const countdownRef = useRef(7200);
  const callbacksRef = useRef([]);

  // Function to register countdown update callbacks (for navbar)
  const registerCountdownCallback = useCallback((callback) => {
    callbacksRef.current.push(callback);
    
    // Return unregister function
    return () => {
      callbacksRef.current = callbacksRef.current.filter(cb => cb !== callback);
    };
  }, []);

  // Function to get current countdown value
  const getCurrentCountdown = useCallback(() => {
    return countdownRef.current;
  }, []);

  // Notify all registered callbacks with new countdown value
  const notifyCallbacks = useCallback((newCountdown) => {
    callbacksRef.current.forEach(callback => {
      try {
        callback(newCountdown);
      } catch (error) {
        console.error('Error in countdown callback:', error);
      }
    });
  }, []);

  const startTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    countdownRef.current = 7200; // Reset to 2 hours
    notifyCallbacks(countdownRef.current);

    timerRef.current = setInterval(() => {
      countdownRef.current -= 1;
      
      // Notify callbacks every 10 seconds or when close to expiry to reduce updates
        notifyCallbacks(countdownRef.current);

      if (countdownRef.current <= 0) {
        clearInterval(timerRef.current);
        timerRef.current = null;
        if (onSessionExpire) {
          onSessionExpire();
        }
      }
    }, 1000);
  }, [notifyCallbacks, onSessionExpire]);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && !sessionExpired) {
      startTimer();
    } else {
      stopTimer();
    }

    return () => stopTimer();
  }, [isAuthenticated, sessionExpired, startTimer, stopTimer]);

  return {
    registerCountdownCallback,
    getCurrentCountdown,
    startTimer,
    stopTimer
  };
};