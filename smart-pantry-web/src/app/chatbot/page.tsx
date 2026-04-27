"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { createSupabaseBrowser } from "@/lib/supabase-browser";
import { useUser } from "@/lib/UserContext";
import { Bot, User, Send, Sparkles, Loader2, RefreshCw } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { StaggerContainer, StaggerItem } from "@/components/ui/animations";

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
    <StaggerContainer className="max-w-3xl mx-auto h-[90vh] flex flex-col space-y-4">
      {/* Header */}
      <StaggerItem className="flex items-center gap-3 bg-white border border-zinc-200 p-5 rounded-2xl shrink-0 shadow-sm">
        <div className="w-12 h-12 rounded-xl bg-zinc-100 flex items-center justify-center border border-zinc-200">
          <Sparkles className="text-zinc-900" size={22} />
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-zinc-900 tracking-tight">SmartPantry AI</h1>
          <p className="text-zinc-500 text-xs font-medium">Live pantry context · Cohere Command</p>
        </div>
        <button onClick={() => setMessages([{ id: Date.now().toString(), role: "bot",
          content: "Chat cleared! What would you like to know?" }])}
          className="text-zinc-400 hover:text-zinc-600 transition p-2 bg-zinc-50 hover:bg-zinc-100 rounded-lg">
          <RefreshCw size={15} />
        </button>
      </StaggerItem>

      {/* Messages */}
      <StaggerItem className="flex-1 bg-white border border-zinc-200 rounded-2xl p-5 overflow-y-auto space-y-5 min-h-0 shadow-sm">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
            <div className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center ${
              msg.role === "user" ? "bg-zinc-900" : "bg-zinc-100 border border-zinc-200"
            }`}>
              {msg.role === "user"
                ? <User size={14} className="text-white" />
                : <Bot size={14} className="text-zinc-900" />}
            </div>
            <div className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm ${
              msg.role === "user"
                ? "bg-zinc-900 text-white rounded-tr-none"
                : "bg-zinc-100 border border-zinc-200 text-zinc-800 rounded-tl-none"
            }`}>
              {msg.role === "bot"
                ? <div className="prose prose-sm max-w-none prose-p:my-1 prose-li:my-0.5 prose-headings:text-zinc-900 text-zinc-800">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                : <span className="whitespace-pre-wrap">{msg.content}</span>}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-3 animate-pulse">
            <div className="w-8 h-8 shrink-0 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center">
              <Bot size={14} className="text-zinc-400" />
            </div>
            <div className="bg-zinc-50 border border-zinc-100 rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-2 w-32 h-10" />
          </div>
        )}
        <div ref={messagesEndRef} />
      </StaggerItem>

      {/* Quick actions */}
      <StaggerItem className="flex gap-2 flex-wrap shrink-0">
        {QUICK_ACTIONS.map((q) => (
          <button key={q} onClick={() => sendMessage(q)} disabled={loading}
            className="text-xs bg-white hover:bg-zinc-50 text-zinc-600 hover:text-zinc-900 px-3 py-1.5 rounded-full border border-zinc-200 transition disabled:opacity-40 shadow-sm font-medium">
            {q}
          </button>
        ))}
      </StaggerItem>

      {/* Input */}
      <StaggerItem>
        <form onSubmit={handleSubmit} className="relative shrink-0">
        <input type="text" value={input} onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about recipes, nutrition, what's expiring..."
          disabled={loading}
          className="w-full bg-white border border-zinc-200 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 rounded-2xl px-5 py-4 pr-16 outline-none text-zinc-900 placeholder:text-zinc-400 transition shadow-sm disabled:opacity-50" />
        <button type="submit" disabled={!input.trim() || loading}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-100 disabled:text-zinc-400 text-white rounded-xl flex items-center justify-center transition shadow-sm">
          <Send size={16} />
        </button>
        </form>
      </StaggerItem>
      {/* GAME: chatbot announces level-ups */}
    </StaggerContainer>
  );
}
