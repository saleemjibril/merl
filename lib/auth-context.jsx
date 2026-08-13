"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { fetchMe, getStoredUser, getToken, logout as clearAuth } from "./api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    const cached = getStoredUser();
    if (cached) setUser(cached);
    fetchMe()
      .then(setUser)
      .catch(() => {
        clearAuth();
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const value = {
    user,
    loading,
    setUser,
    logout: () => {
      clearAuth();
      setUser(null);
    },
    isAuthed: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
