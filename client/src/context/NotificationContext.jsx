// src/context/NotificationContext.jsx
import { createContext, useState, useContext, useRef, useEffect } from "react";

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notification, setNotification] = useState(null);
  const timeoutRef = useRef(null);

  const showNotification = (message, type = "info", duration = 5000) => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    // Set the new notification
    setNotification({ message, type, id: Date.now() });

    // Set timeout to hide notification if duration is provided
    if (duration && duration > 0) {
      timeoutRef.current = setTimeout(() => {
        setNotification(null);
        timeoutRef.current = null;
      }, duration);
    }
  };

  const hideNotification = () => {
    // Clear timeout if notification is manually closed
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setNotification(null);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <NotificationContext.Provider
      value={{ notification, showNotification, hideNotification }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotification must be used within a NotificationProvider");
  }
  return context;
};
