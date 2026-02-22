import { useEffect, useState } from "react";
import axios from "axios";

interface AnalyticsData {
  total: number;
  read: number;
  unread: number;
  successRate: number;
}

export default function NotificationAnalytics() {
  const [data, setData] = useState<AnalyticsData>({
    total: 0,
    read: 0,
    unread: 0,
    successRate: 0
  });

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem("token");
  
      const res = await axios.get(
        "http://localhost:5000/api/notificationAnalytics",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
  
      setData(res.data);
    } catch (err) {
      console.error("Analytics error:", err);
    }
  };
  return (
    <div className="grid grid-cols-4 gap-4 mb-6">
      <div className="bg-white shadow p-4 rounded">
        <p className="text-gray-500">Total</p>
        <h2 className="text-2xl font-bold">{data.total}</h2>
      </div>

      <div className="bg-green-100 shadow p-4 rounded">
        <p className="text-gray-500">Read</p>
        <h2 className="text-2xl font-bold">{data.read}</h2>
      </div>

      <div className="bg-yellow-100 shadow p-4 rounded">
        <p className="text-gray-500">Unread</p>
        <h2 className="text-2xl font-bold">{data.unread}</h2>
      </div>

      <div className="bg-blue-100 shadow p-4 rounded">
        <p className="text-gray-500">Success %</p>
        <h2 className="text-2xl font-bold">{data.successRate}%</h2>
      </div>
    </div>
  );
}