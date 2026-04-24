"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { createSupabaseBrowser } from "@/lib/supabase-browser";
import { useUser } from "@/lib/UserContext";
import { Bot, User, Send, Sparkles, Loader2, RefreshCw } from "lucide-react";
import ReactMarkdown from "react-markdown";

type Message = { id: string; role: "user" | "bot"; content: string };

const QUICK_ACTIONS = [
  "What can I cook with my pantry?",
  "What's expiring soon?",
  "How much protein did I have this week?",
  "Is my diet balanced?",
  "What should I buy for a pasta recipe?",
];

export default function ChatbotPage() {
  const { activeUserId } = useUser();
  const supabase = createSupabaseBrowser();
  const [messages, setMessages] = useState<Message[]>([
    { id: "1", role: "bot", content: "👋 Hi! I'm your **SmartPantry AI**. I have live access to your pantry inventory, usage history, health score, and expiry dates.\n\nAsk me anything — recipes, nutrition questions, what to buy, or what to do with expiring items!" },
  ]);
  const [input, setInput]     = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: Message = { id: Date.now().toString(), role: "user", content: text };
    const historyForApi = messages.slice(-8); // last 8 messages for context
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
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
      setMessages((prev) => [...prev, { id: Date.now().toString(), role: "bot",
        content: "⚠️ Connection error. Please try again." }]);
    } finally {
      setLoading(false);
    }
  }, [loading, messages, activeUserId]);

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); sendMessage(input); };

  return (
    <div className="max-w-3xl mx-auto h-[90vh] flex flex-col space-y-4">
      {/* Header */}
      <header className="flex items-center gap-3 bg-slate-900 border border-slate-800 p-5 rounded-2xl shrink-0">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-900/30">
          <Sparkles className="text-white" size={22} />
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-white">SmartPantry AI</h1>
          <p className="text-slate-400 text-xs">Live pantry context · Cohere Command</p>
        </div>
        <button onClick={() => setMessages([{ id: Date.now().toString(), role: "bot",
          content: "Chat cleared! What would you like to know?" }])}
          className="text-slate-600 hover:text-slate-400 transition p-2">
          <RefreshCw size={15} />
        </button>
      </header>

      {/* Messages */}
      <section className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl p-5 overflow-y-auto space-y-5 min-h-0">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
            <div className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center ${
              msg.role === "user" ? "bg-slate-700" : "bg-emerald-900/60 border border-emerald-700/50"
            }`}>
              {msg.role === "user"
                ? <User size={14} className="text-slate-300" />
                : <Bot size={14} className="text-emerald-400" />}
            </div>
            <div className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm ${
              msg.role === "user"
                ? "bg-blue-600 text-white rounded-tr-none"
                : "bg-slate-800 border border-slate-700/60 text-slate-200 rounded-tl-none"
            }`}>
              {msg.role === "bot"
                ? <div className="prose prose-invert prose-sm max-w-none prose-p:my-1 prose-li:my-0.5 prose-headings:text-emerald-400">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                : <span className="whitespace-pre-wrap">{msg.content}</span>}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 shrink-0 rounded-full bg-emerald-900/60 border border-emerald-700/50 flex items-center justify-center">
              <Bot size={14} className="text-emerald-400" />
            </div>
            <div className="bg-slate-800 border border-slate-700/60 rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-2">
              <Loader2 size={14} className="animate-spin text-emerald-400" />
              <span className="text-slate-400 text-sm">Thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </section>

      {/* Quick actions */}
      <div className="flex gap-2 flex-wrap shrink-0">
        {QUICK_ACTIONS.map((q) => (
          <button key={q} onClick={() => sendMessage(q)} disabled={loading}
            className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 px-3 py-1.5 rounded-full border border-slate-700 transition disabled:opacity-40">
            {q}
          </button>
        ))}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="relative shrink-0">
        <input type="text" value={input} onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about recipes, nutrition, what's expiring..."
          disabled={loading}
          className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500/50 rounded-2xl px-5 py-4 pr-16 outline-none text-slate-100 placeholder:text-slate-600 transition shadow-lg disabled:opacity-50" />
        <button type="submit" disabled={!input.trim() || loading}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-xl flex items-center justify-center transition">
          <Send size={16} />
        </button>
      </form>
      {/* GAME: chatbot announces level-ups */}
    </div>
  );
}
