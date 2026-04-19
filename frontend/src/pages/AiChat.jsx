import { useState } from "react";
import { useNavigate } from "react-router-dom";
export default function AiChat() {
    const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);

  const sendMessage = async () => {
    const res = await fetch("/api/ai", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message }),
    });

    const data = await res.json();

    setChat([...chat, { user: message, bot: data.reply }]);
    setMessage("");
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">AI Assistant</h1>

      <div className="mt-4">
        {chat.map((c, i) => (
          <div key={i}>
            <p><b>You:</b> {c.user}</p>
            <p><b>AI:</b> {c.bot}</p>
          </div>
        ))}
      </div>

      <div className="flex mt-4 gap-2">
        <input
          className="border p-2 w-full"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Ask about forms..."
        />

        <button
          onClick={sendMessage}
          className="bg-blue-500 text-white px-4 py-2"
        >
          Send
        </button>
      </div>
    </div>
  );
}