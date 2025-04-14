// src/context/NotificationContext.jsx
import { createContext, useState, useContext } from "react";

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notification, setNotification] = useState(null);

  const showNotification = (message, type = "info", duration = 5000) => {
    setNotification({ message, type, id: Date.now() });

    if (duration) {
      setTimeout(() => {
        setNotification(null);
      }, duration);
    }
  };

  const hideNotification = () => {
    setNotification(null);
  };

  return (
    <NotificationContext.Provider
      value={{ notification, showNotification, hideNotification }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => useContext(NotificationContext);
