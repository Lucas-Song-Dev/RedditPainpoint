// src/context/AuthContext.jsx
import { createContext, useState, useEffect, useContext } from "react";
import { fetchStatus } from "../api/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already authenticated by making a request
    // to an endpoint that requires authentication
    const checkAuth = async () => {
      try {
        const response = await fetchStatus();
        // If we get a successful response, user is authenticated
        setIsAuthenticated(true);
      } catch (error) {
        // If we get an error, user is not authenticated
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = () => {
    setIsAuthenticated(true);
  };

  const logout = () => {
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
