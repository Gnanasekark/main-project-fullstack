import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";

interface StudentItem {
  id: number;
  name: string;
  register_no: string;
  is_read: number;
  read_at: string | null;
}

export default function NotificationDetails() {
  const { id } = useParams();
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const fetchDetails = async () => {
      const token = localStorage.getItem("token");

      const res = await fetch(
        `http://localhost:5000/api/notifications/details/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await res.json();
      setStudents(data.students);
      setStats(data.stats);
    };

    fetchDetails();
  }, [id]);

  const readList = students.filter(s => s.is_read === 1);
  const unreadList = students.filter(s => s.is_read === 0);

  return (
    <div className="p-8 space-y-8">

      <h1 className="text-2xl font-bold">
        Notification Details
      </h1>

      {/* SUMMARY */}
      {stats && (
        <div className="grid grid-cols-4 gap-6">
          <div className="bg-white p-6 shadow rounded-xl">
            <p>Total Students</p>
            <h2 className="text-2xl font-bold">{stats.total}</h2>
          </div>

          <div className="bg-green-50 p-6 shadow rounded-xl">
            <p>Read</p>
            <h2 className="text-2xl font-bold text-green-600">
              {stats.read}
            </h2>
          </div>

          <div className="bg-yellow-50 p-6 shadow rounded-xl">
            <p>Unread</p>
            <h2 className="text-2xl font-bold text-yellow-600">
              {stats.unread}
            </h2>
          </div>

          <div className="bg-blue-50 p-6 shadow rounded-xl">
            <p>Success Rate</p>
            <h2 className="text-2xl font-bold text-blue-600">
              {stats.successRate}%
            </h2>
          </div>
        </div>
      )}

      {/* REMINDER TYPE */}
      <div className="bg-white p-6 shadow rounded-xl">
        <h3 className="font-semibold mb-2">
          Reminder Type
        </h3>
        <div className="flex gap-6">
          <div className="text-blue-600">
            📧 Email Sent ✅
          </div>
          <div className="text-green-600">
            🟢 WhatsApp Sent ✅
          </div>
        </div>
      </div>

      {/* READ LIST */}
      <div className="bg-white p-6 shadow rounded-xl">
        <h3 className="font-semibold mb-4 text-green-600">
          Read Students
        </h3>

        {readList.map(student => (
          <div
            key={student.id}
            className="flex justify-between border-b py-2"
          >
            <div>
              {student.name} ({student.register_no})
            </div>
            <div className="text-sm text-gray-500">
              {new Date(student.read_at!).toLocaleString()}
            </div>
          </div>
        ))}
      </div>

      {/* UNREAD LIST */}
      <div className="bg-white p-6 shadow rounded-xl">
        <h3 className="font-semibold mb-4 text-yellow-600">
          Unread Students
        </h3>

        {unreadList.map(student => (
          <div
            key={student.id}
            className="border-b py-2"
          >
            {student.name} ({student.register_no})
          </div>
        ))}
      </div>

    </div>
  );
}