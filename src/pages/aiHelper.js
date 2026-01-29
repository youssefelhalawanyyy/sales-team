import React, { useState } from "react";
import axios from "axios";

export default function AIHelper() {

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendMessage() {

    if (!input.trim()) return;

    const userMessage = {
      from: "user",
      text: input
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {

      const res = await axios.post(
        "http://localhost:5000/api/ask",
        { question: input }
      );

      const botMessage = {
        from: "bot",
        text: res.data.answer
      };

      setMessages(prev => [...prev, botMessage]);

    } catch (err) {

      setMessages(prev => [
        ...prev,
        { from: "bot", text: "Server error. Try again." }
      ]);

    } finally {
      setLoading(false);
    }

  }

  return (

    <div className="max-w-4xl mx-auto p-4">

      <h1 className="text-2xl font-bold mb-4">
        🤖 Jonix AI Sales Assistant
      </h1>

      <div className="border rounded-lg h-96 p-4 overflow-y-auto bg-white">

        {messages.map((m, i) => (

          <div
            key={i}
            className={`mb-2 ${
              m.from === "user" ? "text-right" : "text-left"
            }`}
          >

            <span
              className={`inline-block px-3 py-2 rounded-lg text-sm ${
                m.from === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200"
              }`}
            >
              {m.text}
            </span>

          </div>

        ))}

        {loading && (
          <p className="text-gray-400">Typing...</p>
        )}

      </div>

      <div className="flex mt-3 gap-2">

        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          className="flex-1 border rounded px-3 py-2"
          placeholder="Ask about Jonix devices..."
        />

        <button
          onClick={sendMessage}
          className="bg-blue-600 text-white px-4 rounded"
        >
          Send
        </button>

      </div>

    </div>
  );
}
