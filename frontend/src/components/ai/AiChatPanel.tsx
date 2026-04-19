import { useState, useRef, useEffect } from "react";
import { Sparkles, Send, Copy, ThumbsUp, ThumbsDown, RotateCw } from "lucide-react";


export default function AiChatPanel({ onClose }) {

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [messages, setMessages] = useState([
    {
      role: "ai",
      text:
        "Hello 👋 I am FormFlow AI.\n\nYou can ask me about:\n• Groups\n• Forms\n• Submissions\n• Student analytics"
    }
  ]);

  const bottomRef = useRef(null);

  /* ---------------- DRAG LOGIC ---------------- */

  const [position, setPosition] = useState({
    x: window.innerWidth - 420,
    y: 0
  });

  const dragging = useRef(false);
  const offset = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e) => {

    dragging.current = true;

    offset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };

  };

  const handleMouseMove = (e) => {

    if (!dragging.current) return;
  
    const panelWidth = 420;
    const panelHeight = window.innerHeight * 0.8;
  
    let newX = e.clientX - offset.current.x;
    let newY = e.clientY - offset.current.y;
  
    // Horizontal limits
    newX = Math.max(0, Math.min(window.innerWidth - panelWidth, newX));
  
    // Vertical limits
    newY = Math.max(0, Math.min(window.innerHeight - panelHeight, newY));
  
    setPosition({
      x: newX,
      y: newY
    });
  
  };

  const handleMouseUp = () => {
    dragging.current = false;
  };

  useEffect(() => {

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

  }, [position]);

  /* ---------------- CHAT SCROLL ---------------- */

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ---------------- SEND MESSAGE ---------------- */

  const sendMessage = async (customMessage) => {

    const text = customMessage || message;

    if (!text.trim()) return;

    const userMessage = { role: "user", text };

    setMessages(prev => [...prev, userMessage]);
    setMessage("");
    setLoading(true);

    try {

      const res = await fetch("http://localhost:5000/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text })
      });

      const data = await res.json();

      setMessages(prev => [
        ...prev,
        { role: "ai", text: data.reply }
      ]);

    } catch {

      setMessages(prev => [
        ...prev,
        { role: "ai", text: "AI service unavailable." }
      ]);

    }

    setLoading(false);

  };

  const handleKeyPress = (e) => {

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }

  };

  const suggestions = [
    "How many groups?",
    "List all groups",
    "Which group has most students?",
    "How many forms exist?",
    "List all forms",
    "System summary"
  ];

  return (

    <div
      style={{ left: position.x, top: position.y }}
    className="fixed right-0 top-0 h-screen w-[420px] bg-white border-l flex flex-col shadow-2xl z-50"
    >

      {/* HEADER (DRAG HANDLE) */}

      <div
        onMouseDown={handleMouseDown}
        className="flex justify-between items-center px-5 py-4 border-b bg-white cursor-move"
      >

        <div className="flex items-center gap-2 font-semibold text-gray-800">
          <Sparkles className="w-5 h-5 text-purple-600"/>
          FormFlow AI
        </div>

        <button
          onClick={onClose}
          className="text-gray-500 hover:text-black text-lg"
        >
          ✕
        </button>

      </div>

      {/* CHAT AREA */}

      <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6">

        {messages.map((msg, i) => (

          <div
            key={i}
            className={`flex ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >

            {msg.role === "ai" && (
              <div className="mr-1 mt-1">
                <Sparkles className="w-4 h-4 text-purple-500"/>
              </div>
            )}

            <div
              className={`max-w-[95%] px-4 py-3 rounded-2xl text-sm leading-relaxed break-words ${
                msg.role === "user"
               ? "bg-blue-100 text-black bold-900"
: "bg-gray-100 text-gray-800"
                
              }`}
            >

              <div className="whitespace-pre-line">
                {msg.text}
              </div>

            </div>

          </div>

        ))}

        {/* Suggestions */}

        {messages.length === 1 && (

          <div className="grid grid-cols-2 gap-3">

            {suggestions.map((q, i) => (

              <button
                key={i}
                onClick={() => sendMessage(q)}
                className="text-left border rounded-xl px-4 py-3 text-sm hover:bg-gray-50 transition"
              >
                {q}
              </button>

            ))}

          </div>

        )}

        {/* Typing */}

        {loading && (

          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Sparkles className="w-4 h-4 animate-pulse text-purple-500"/>
            FormFlow AI is thinking...
          </div>

        )}

        <div ref={bottomRef} />

      </div>

      {/* INPUT */}

      <div className="border-t p-4">
      <div className="flex items-center gap-3 border rounded-xl px-3 py-2">


      <textarea rows={1}
 value={message}
 onChange={(e) => setMessage(e.target.value)} 
onKeyDown={handleKeyPress} 
placeholder="Ask FormFlow AI..." 
className="flex-1 outline-none resize-none text-sm"
 />

          <button
            onClick={() => sendMessage()}
            className="bg-black text-white rounded-full w-9 h-9 flex items-center justify-center hover:bg-gray-800"

          >
            <Send size={16}/>
          </button>

        </div>

      </div>

    </div>

  );

}