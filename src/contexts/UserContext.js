"use client";
import { createContext, useContext, useState, useEffect } from 'react';

const UserContext = createContext();

const APILink = process.env.NEXT_PUBLIC_API_URL;

export function UserProvider({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [sonolusUser, setSonolusUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [isClient, setIsClient] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  const checkAuthStatus = async () => {
    if (!isClient) return;

    setLoading(true);
    const sessionValue = localStorage.getItem("session");
    const expiry = localStorage.getItem("expiry");

    let expiryTime = parseInt(expiry, 10);

    // Heuristic to detect if expiry is in seconds (Unix timestamp) or milliseconds
    // 100000000000 is ~ year 1973 in ms, or year 5138 in seconds.
    // So if it's less than this, it's almost certainly seconds.
    if (expiryTime < 100000000000) {
      expiryTime *= 1000;
    }

    if (isNaN(expiryTime) || expiryTime < Date.now()) {
      localStorage.removeItem("session");
      localStorage.removeItem("expiry");
      setIsLoggedIn(false);
      setSonolusUser(null);
      setSession(null);
      setLoading(false);
      return;
    }

    if (sessionValue) {
      setIsLoggedIn(true);
      setSession(sessionValue);

      try {
        const me = await fetch(`${APILink}/api/accounts/session/account/`, {
          headers: {
            "Authorization": `${sessionValue}`
          }
        });

        if (!me.ok) {
          if (me.status === 401 || me.status === 403) {
            localStorage.removeItem("session");
            localStorage.removeItem("expiry");
            setIsLoggedIn(false);
            setSonolusUser(null);
            setSession(null);
            setLoading(false);
            return;
          }
        } else {
          const meData = await me.json();
          setSonolusUser(meData);
        }

      } catch (error) {
      }
    } else {
      setIsLoggedIn(false);
      setSonolusUser(null);
      setSession(null);
    }

    setLoading(false);
    setSessionReady(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("session");
    localStorage.removeItem("expiry");
    setIsLoggedIn(false);
    setSonolusUser(null);
    setSession(null);
    setSessionReady(true);
    window.dispatchEvent(new CustomEvent('authChange'));
  };

  const refreshUser = () => {
    checkAuthStatus();
  };

  const isSessionValid = () => {
    if (!isClient) return false;

    const sessionValue = localStorage.getItem("session");
    const expiry = localStorage.getItem("expiry");

    if (!sessionValue || !expiry) {
      return false;
    }

    return !!sessionValue;
  };

  const clearExpiredSession = () => {
    localStorage.removeItem("session");
    localStorage.removeItem("expiry");
    setIsLoggedIn(false);
    setSonolusUser(null);
    setSession(null);
    setSessionReady(true);
    window.dispatchEvent(new CustomEvent('authChange'));
  };

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    checkAuthStatus();

    window.addEventListener('storage', checkAuthStatus);

    const handleAuthChange = () => checkAuthStatus();
    window.addEventListener('authChange', handleAuthChange);

    return () => {
      window.removeEventListener('storage', checkAuthStatus);
      window.removeEventListener('authChange', handleAuthChange);
    };
  }, [isClient, isLoggedIn]);

  const value = {
    isLoggedIn,
    sonolusUser,
    loading,
    session,
    isClient,
    sessionReady,
    handleLogout,
    refreshUser,
    isSessionValid,
    clearExpiredSession
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
