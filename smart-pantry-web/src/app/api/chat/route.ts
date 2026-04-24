import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { CohereClientV2 } from "cohere-ai";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function buildChatContext(userId: string): Promise<string> {
  const now = new Date();
  const threeDaysOut = new Date(); threeDaysOut.setDate(now.getDate() + 3);

  const [pantryRes, historyRes, healthRes] = await Promise.all([
    sb.from("pantry").select("name, quantity, category, expiry_date").eq("user_id", userId),
    sb.from("detection_history").select("item_name, action, detected_at").eq("user_id", userId)
      .order("detected_at", { ascending: false }).limit(20),
    sb.from("health_scores").select("score, feedback, scored_at").eq("user_id", userId)
      .order("scored_at", { ascending: false }).limit(1),
  ]);

  const pantry = pantryRes.data || [];
  const history = historyRes.data || [];
  const health = healthRes.data?.[0];

  const expiringSoon = pantry.filter(
    (p) => p.expiry_date && new Date(p.expiry_date) <= threeDaysOut
  );

  return `
CURRENT PANTRY (${pantry.length} items):
${pantry.map((p) => `- ${p.name} (qty: ${p.quantity}, cat: ${p.category}, expires: ${p.expiry_date || "unknown"})`).join("\n") || "Empty"}

RECENT ACTIVITY (last 20 events):
${history.map((h) => `- ${h.action?.toUpperCase()} ${h.item_name} at ${new Date(h.detected_at).toLocaleString()}`).join("\n") || "No recent activity"}

HEALTH SCORE: ${health ? `${health.score}/100 — ${health.feedback}` : "No score yet"}

EXPIRING SOON (within 3 days):
${expiringSoon.map((p) => `- ${p.name} (expires ${p.expiry_date})`).join("\n") || "None"}
`.trim();
}

import { getAuthUser } from "@/lib/auth-guard";

export async function POST(req: Request) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = user.id;

    const { message, history = [] } = await req.json();

    const context = await buildChatContext(userId);
    const cohere = new CohereClientV2({ token: process.env.COHERE_API_KEY! });

    const systemPrompt = `You are SmartPantry AI — a helpful, knowledgeable food and nutrition assistant.
You have LIVE access to the user's pantry inventory, usage history, and health data.

${context}

Answer questions using this context. Be specific about the user's actual items.
If asked about recipes, only suggest ones achievable with pantry items.
Format responses in clean markdown. Be concise but helpful.`;

    // Build chat history for multi-turn conversation
    const chatHistory = history.slice(-6).map((m: { role: string; content: string }) => ({
      role: m.role === "user" ? "user" : "assistant",
      content: m.content,
    }));

    const response = await cohere.chat({
      model: "command-a-03-2025",
      messages: [
        { role: "system", content: systemPrompt },
        ...chatHistory,
        { role: "user", content: message }
      ],
      temperature: 0.7,
    });

    return NextResponse.json({ reply: (response.message?.content?.[0] as any)?.text || "" });
  } catch (err) {
    console.error("Chat API error:", err);
    return NextResponse.json({ error: "Failed to get AI response" }, { status: 500 });
  }
}
