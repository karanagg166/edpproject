"use client";
import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { MessageSquare, X, Send, Bot, User, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useUser } from "@/lib/UserContext";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";

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
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`fixed bottom-6 right-6 z-50 w-12 h-12 sm:w-14 sm:h-14 bg-zinc-900 rounded-full flex items-center justify-center text-white shadow-xl transition-opacity ${isOpen ? "opacity-0 pointer-events-none" : "opacity-100"}`}
      >
        <MessageSquare size={24} />
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed bottom-0 right-0 sm:bottom-6 sm:right-6 z-50 w-full sm:w-[380px] h-[100dvh] sm:h-[550px] sm:max-h-[85vh] bg-white border-t sm:border border-zinc-200 sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden sm:origin-bottom-right"
          >
            {/* Header */}
            <div className="flex items-center justify-between bg-white p-4 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center border border-zinc-200">
                  <Bot size={16} className="text-zinc-900" />
                </div>
                <div>
                  <h3 className="font-bold text-zinc-900 text-sm">SmartPantry AI</h3>
                  <p className="text-xs text-zinc-500">Online</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-zinc-400 hover:text-zinc-600 transition">
                <X size={20} />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-50/50">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                  <div className={`w-6 h-6 shrink-0 rounded-full flex items-center justify-center mt-1 ${
                    msg.role === "user" ? "bg-zinc-200" : "bg-zinc-900"
                  }`}>
                    {msg.role === "user" ? <User size={12} className="text-zinc-700" /> : <Bot size={12} className="text-white" />}
                  </div>
                  <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
                    msg.role === "user" ? "bg-zinc-900 text-white rounded-tr-none" : "bg-white text-zinc-800 rounded-tl-none border border-zinc-100"
                  }`}>
                    {msg.role === "bot" ? (
                      <div className="prose prose-sm max-w-none prose-p:my-1 prose-li:my-0.5">
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
                  <div className="w-6 h-6 shrink-0 rounded-full bg-zinc-900 flex items-center justify-center mt-1">
                    <Bot size={12} className="text-white" />
                  </div>
                  <div className="bg-white border border-zinc-100 rounded-2xl rounded-tl-none px-3 py-2 flex items-center gap-2 shadow-sm">
                    <Loader2 size={12} className="animate-spin text-zinc-400" />
                    <span className="text-zinc-500 text-xs">Typing...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={sendMessage} className="p-3 bg-white border-t border-zinc-100">
              <div className="relative">
                <Input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask anything..."
                  disabled={loading}
                  className="pr-10 bg-zinc-50"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || loading}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 disabled:text-zinc-300 p-1 hover:text-zinc-600 transition"
                >
                  <Send size={16} />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
