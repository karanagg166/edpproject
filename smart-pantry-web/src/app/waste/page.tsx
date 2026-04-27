"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase-browser";
import { useUser } from "@/lib/UserContext";
import { Recycle, Medal, Flame, Loader2 } from "lucide-react";

export default function WastePage() {
  const { activeUserId } = useUser();
  const supabase = createSupabaseBrowser();
  const [wasteLogs, setWasteLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeUserId) return;
    async function fetchLogs() {
      const { data } = await supabase.from("waste_log").select("*").eq("user_id", activeUserId).order("logged_at", { ascending: false });
      if (data) setWasteLogs(data);
      setLoading(false);
    }
    fetchLogs();

    const channel = supabase
      .channel("waste-updates")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "waste_log", filter: `user_id=eq.${activeUserId}` }, (payload: any) => {
        setWasteLogs((prev) => [payload.new, ...prev]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading) {
     return (
       <div className="max-w-4xl mx-auto h-[50vh] flex flex-col items-center justify-center space-y-4">
         <div className="animate-pulse flex flex-col items-center space-y-4">
           <div className="w-12 h-12 rounded-2xl bg-zinc-100" />
           <div className="h-4 w-40 bg-zinc-100 rounded" />
         </div>
       </div>
     );
  }

  const eatenCount = wasteLogs.filter(w => w.status === "eaten").length;
  const donatedCount = wasteLogs.filter(w => w.status === "donated").length;
  const wastedCount = wasteLogs.filter(w => w.status === "wasted").length;

  const totalSaved = eatenCount + donatedCount;
  // Let's say saving is +50 XP and wasting is -25 XP
  const rawXP = (totalSaved * 50) - (wastedCount * 25);
  const xp = Math.max(0, rawXP); // Don't drop below 0

  let levelString = "Beginner";
  let maxXP = 500;
  if (xp >= 500) { levelString = "Pantry Novice"; maxXP = 1000; }
  if (xp >= 1000) { levelString = "Eco Warrior"; maxXP = 2500; }
  if (xp >= 2500) { levelString = "Waste Zero Master"; maxXP = 5000; }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <header className="flex items-center gap-3 bg-white border border-zinc-200 p-6 rounded-2xl shadow-sm">
        <div className="w-14 h-14 rounded-2xl bg-zinc-100 flex items-center justify-center border border-zinc-200">
          <Recycle className="text-zinc-900" size={28} />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Waste Reduction Game</h1>
          <p className="text-zinc-500 mt-1 font-medium">Live tracking of your consumption habits based on your dashboard actions.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-zinc-200 p-6 rounded-2xl shadow-sm flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 bg-zinc-50 rounded-full flex items-center justify-center mb-4 border border-zinc-100">
            <Medal size={32} className="text-zinc-900" />
          </div>
          <h3 className="text-zinc-500 font-medium text-sm">Current Level</h3>
          <p className="text-2xl font-bold text-zinc-900 mt-1 tracking-tight">{levelString}</p>
          <p className="text-sm text-zinc-500 mt-2 font-medium">{xp} / {maxXP} XP</p>
        </div>

        <div className="bg-white border border-zinc-200 p-6 rounded-2xl shadow-sm flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 bg-zinc-50 rounded-full flex items-center justify-center mb-4 border border-zinc-100">
            <span className="text-4xl">🍽️</span>
          </div>
          <h3 className="text-zinc-500 font-medium text-sm">Items Used/Donated</h3>
          <p className="text-4xl font-bold text-zinc-900 mt-1 tracking-tight">{totalSaved}</p>
          <p className="text-sm text-zinc-500 mt-2 font-medium">Successfully Saved</p>
        </div>

        <div className="bg-white border border-zinc-200 p-6 rounded-2xl shadow-sm flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 bg-zinc-50 rounded-full flex items-center justify-center mb-4 border border-zinc-100">
            <span className="text-4xl">🗑️</span>
          </div>
          <h3 className="text-zinc-500 font-medium text-sm">Items Wasted</h3>
          <p className="text-4xl font-bold text-zinc-900 mt-1 tracking-tight">{wastedCount}</p>
          <p className="text-sm text-zinc-500 mt-2 font-medium">Try to lower this!</p>
        </div>
      </div>
      
      <div className="bg-white border border-zinc-200 p-6 rounded-2xl shadow-sm">
        <h2 className="text-xl font-bold text-zinc-900 mb-4 tracking-tight">Recent Actions Log</h2>
        <div className="space-y-3">
          {wasteLogs.length === 0 && <p className="text-zinc-500 text-center py-4 font-medium">No recent history. Process an item on the Dashboard!</p>}
          
          {wasteLogs.slice(0, 10).map((log) => {
            let icon = "🍽️";
            let points = "+50 XP";
            let color = "text-zinc-600";
            if (log.status === "wasted") { icon = "🗑️"; points = "-25 XP"; color = "text-zinc-400"; }
            if (log.status === "donated") { icon = "🤝"; points = "+50 XP"; color = "text-zinc-900"; }

            return (
              <div key={log.id} className="bg-zinc-50 p-4 rounded-xl border border-zinc-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{icon}</span>
                  <div>
                    <p className="font-semibold text-zinc-900 tracking-tight capitalize">{log.item_name}</p>
                    <p className="text-sm text-zinc-500 font-medium">Marked as {log.status} on {new Date(log.logged_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <span className={`font-bold tracking-tight ${color}`}>{points}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
