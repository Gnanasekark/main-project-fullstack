import { useEffect, useState } from "react";
import axios from "axios";

interface Template {
  id: number;
  title: string;
  message: string;
}

export default function TemplatesManager() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    const res = await axios.get("http://localhost:5000/api/templates");
    setTemplates(res.data);
  };

  const saveTemplate = async () => {
    await axios.post("http://localhost:5000/api/templates", {
      title,
      message
    });

    setTitle("");
    setMessage("");
    fetchTemplates();
  };

  return (
    <div className="bg-white shadow p-4 rounded mt-6">
      <h2 className="text-xl font-bold mb-3">Templates</h2>

      <input
        className="border w-full p-2 mb-2"
        placeholder="Template Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <textarea
        className="border w-full p-2 mb-2"
        placeholder="Template Message"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />

      <button
        onClick={saveTemplate}
        className="bg-green-600 text-white px-4 py-2 rounded mb-4"
      >
        Save Template
      </button>

      {templates.map((t) => (
        <div key={t.id} className="border p-3 rounded mb-2">
          <h4 className="font-semibold">{t.title}</h4>
          <p>{t.message}</p>
        </div>
      ))}
    </div>
  );
}