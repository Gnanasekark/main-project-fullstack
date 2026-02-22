import { useState } from "react";
import axios from "axios";

interface Props {
  open: boolean;
  onClose: () => void;
  onSent: () => void;
}

export default function SendNotificationDialog({ open, onClose, onSent }: Props) {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [channel, setChannel] = useState("both");

  if (!open) return null;

  const handleSend = async () => {
    try {
      await axios.post("http://localhost:5000/api/notifications/send", {
        title,
        message,
        channel
      });

      onSent();
      onClose();
    } catch (err) {
      console.error("Send error:", err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center">
      <div className="bg-white p-6 rounded shadow w-96">
        <h2 className="text-xl font-bold mb-4">Send Notification</h2>

        <input
          className="border w-full p-2 mb-3"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <textarea
          className="border w-full p-2 mb-3"
          placeholder="Message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />

        <select
          className="border w-full p-2 mb-3"
          value={channel}
          onChange={(e) => setChannel(e.target.value)}
        >
          <option value="email">Email</option>
          <option value="whatsapp">WhatsApp</option>
          <option value="both">Both</option>
        </select>

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 border">
            Cancel
          </button>
          <button
            onClick={handleSend}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}