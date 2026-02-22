import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

interface Reminder {
  id: number;
  form_title: string;
  title: string;
  total_students: number;
  read_count: number;
  unread_count: number;
  success_rate: number;
  created_at: string;
}

export default function SentRemindersHistory() {
  const [reminders, setReminders] = useState<Reminder[]>([]);

  useEffect(() => {
    fetchReminders();
  }, []);

  const fetchReminders = async () => {
    const [selectedReminder, setSelectedReminder] = useState<any>(null);
    const token = localStorage.getItem("token");

    const res = await fetch(
      "http://localhost:5000/api/notifications/reminder-history",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (res.ok) {
      const data = await res.json();
      setReminders(data);
    }
  };

  return (
    <div className="space-y-4">
      {reminders.map((reminder) => (
        <div
          key={reminder.id}
          className="bg-white shadow rounded-xl p-6 border hover:shadow-lg transition"
        >
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-semibold">
                {reminder.form_title}
              </h3>

              <p className="text-sm text-gray-500 mt-1">
                {reminder.title}
              </p>

              <div className="grid grid-cols-4 gap-4 mt-4 text-sm">
                <div>
                  <p className="text-gray-500">Total Students</p>
                  <p className="font-bold">{reminder.total_students}</p>
                </div>

                <div>
                  <p className="text-gray-500">Read</p>
                  <p className="font-bold text-green-600">
                    {reminder.read_count}
                  </p>
                </div>

                <div>
                  <p className="text-gray-500">Unread</p>
                  <p className="font-bold text-yellow-600">
                    {reminder.unread_count}
                  </p>
                </div>

                <div>
                  <p className="text-gray-500">Success</p>
                  <p className="font-bold text-blue-600">
                    {reminder.success_rate}%
                  </p>
                </div>
              </div>

              <p className="text-xs text-gray-400 mt-4">
                Sent on:{" "}
                {new Date(reminder.created_at).toLocaleString()}
              </p>
            </div>

            <Button
              variant="outline"
              onClick={() => setSelectedReminder(reminder)}
            >
              View Details
            </Button>
          </div>
          <Dialog
  open={!!selectedReminder}
  onOpenChange={() => setSelectedReminder(null)}
>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Reminder Details</DialogTitle>
    </DialogHeader>

    {selectedReminder && (
      <div className="space-y-4">

        <div className="flex items-center justify-between">
          <span>Email</span>
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="w-4 h-4" />
            Sent
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span>WhatsApp</span>
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="w-4 h-4" />
            Sent
          </div>
        </div>

      </div>
    )}
  </DialogContent>
</Dialog>
        </div>
      ))}
      
    </div>
    
  );
}