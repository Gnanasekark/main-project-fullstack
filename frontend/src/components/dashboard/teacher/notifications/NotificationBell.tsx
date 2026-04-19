import { useEffect } from "react";
import socket from "../../../../socket";

const NotificationBell = () => {
  useEffect(() => {
    // 🔔 Listen for new notification
    socket.on("new-notification", (data: any) => {
      console.log("🔔 New Notification:", data);

      // Simple popup (for demo)
      alert(`${data.title}\n${data.message}`);
    });

    // Cleanup
    return () => {
      socket.off("new-notification");
    };
  }, []);

  return (
    <div style={{ cursor: "pointer", fontSize: "20px" }}>
      🔔 Notifications
    </div>
  );
};

export default NotificationBell;