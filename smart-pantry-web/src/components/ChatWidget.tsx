"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { MessageSquare, X, Send, Bot, User, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useUser } from "@/lib/UserContext";

type Message = { id: string; role: "user" | "bot"; content: string };

export function ChatWidget() {
  const pathname = usePathname();
  const { activeUserId } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: "init", role: "bot", content: "Hi! I'm SmartPantry AI. How can I help?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (isOpen) messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  // Hide widget on the dedicated chatbot page to avoid double-chats
  if (pathname === "/chatbot") return null;

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg: Message = { id: Date.now().toString(), role: "user", content: input };
    const historyForApi = messages.slice(-6); // pass last 6 for context
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg.content,
          history: historyForApi.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "bot",
        content: data.reply || data.error || "No response.",
      }]);
    } catch {
      setMessages((prev) => [...prev, {
        id: Date.now().toString(), role: "bot", content: "⚠️ Connection error."
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-tr from-emerald-500 to-cyan-500 rounded-full flex items-center justify-center text-white shadow-xl shadow-emerald-900/40 hover:scale-105 transition-transform ${isOpen ? "scale-0 opacity-0" : "scale-100 opacity-100"}`}
      >
        <MessageSquare size={24} />
      </button>

      {/* Chat Window */}
      <div
        className={`fixed bottom-6 right-6 z-50 w-[380px] h-[550px] max-h-[85vh] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 origin-bottom-right ${
          isOpen ? "scale-100 opacity-100 pointer-events-auto" : "scale-50 opacity-0 pointer-events-none"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between bg-slate-800 p-4 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <Bot size={16} className="text-emerald-400" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">SmartPantry AI</h3>
              <p className="text-xs text-slate-400">Online</p>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white transition">
            <X size={20} />
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
              <div className={`w-6 h-6 shrink-0 rounded-full flex items-center justify-center mt-1 ${
                msg.role === "user" ? "bg-slate-700" : "bg-emerald-900/60"
              }`}>
                {msg.role === "user" ? <User size={12} className="text-slate-300" /> : <Bot size={12} className="text-emerald-400" />}
              </div>
              <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                msg.role === "user" ? "bg-emerald-600 text-white rounded-tr-none" : "bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700/50"
              }`}>
                {msg.role === "bot" ? (
                  <div className="prose prose-invert prose-sm max-w-none prose-p:my-1 prose-li:my-0.5">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  <span className="whitespace-pre-wrap">{msg.content}</span>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-2 flex-row">
              <div className="w-6 h-6 shrink-0 rounded-full bg-emerald-900/60 flex items-center justify-center mt-1">
                <Bot size={12} className="text-emerald-400" />
              </div>
              <div className="bg-slate-800 border border-slate-700/50 rounded-2xl rounded-tl-none px-3 py-2 flex items-center gap-2">
                <Loader2 size={12} className="animate-spin text-emerald-400" />
                <span className="text-slate-400 text-xs">Typing...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <form onSubmit={sendMessage} className="p-3 bg-slate-800/50 border-t border-slate-700">
          <div className="relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything..."
              disabled={loading}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-4 pr-10 py-3 text-sm text-white focus:outline-none focus:border-emerald-500 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-emerald-400 disabled:text-slate-600 p-1 hover:text-emerald-300 transition"
            >
              <Send size={16} />
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
