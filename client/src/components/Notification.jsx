// src/components/Notification.jsx
import { useNotification } from "../context/NotificationContext";
import "./Notification.scss";

const Notification = () => {
  const { notification, hideNotification } = useNotification();

  if (!notification) return null;

  const { message, type, id } = notification;

  return (
    <div className={`notification notification-${type}`} key={id}>
      <div className="notification-content">
        <span className="notification-message">{message}</span>
        <button className="notification-close" onClick={hideNotification}>
          ×
        </button>
      </div>
    </div>
  );
};

export default Notification;
