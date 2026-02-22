import { useState } from "react";
import { useSocket } from "@/hooks/useSocket";
import { Bell } from "lucide-react";

export default function NotificationBell() {
  const [count, setCount] = useState(0);

  useSocket("newNotification", () => {
    setCount(prev => prev + 1);
  });

  return (
    <div className="relative cursor-pointer">
      <Bell className="w-6 h-6" />
      {count > 0 && (
        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
          {count}
        </span>
      )}
    </div>
  );
}