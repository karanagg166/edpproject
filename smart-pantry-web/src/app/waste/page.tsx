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
         <Loader2 className="animate-spin text-purple-500" size={40} />
         <p className="text-slate-400">Loading your Eco Score...</p>
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
      <header className="flex items-center gap-3 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
          <Recycle className="text-white" size={28} />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">Waste Reduction Game</h1>
          <p className="text-slate-400 mt-1">Live tracking of your consumption habits based on your dashboard actions.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 bg-purple-900/50 rounded-full flex items-center justify-center mb-4 border-2 border-purple-500/50">
            <Medal size={40} className="text-purple-400" />
          </div>
          <h3 className="text-slate-400 font-medium">Current Level</h3>
          <p className="text-2xl font-bold text-white mt-1">{levelString}</p>
          <p className="text-sm text-purple-400 mt-2">{xp} / {maxXP} XP</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 bg-emerald-900/50 rounded-full flex items-center justify-center mb-4 border-2 border-emerald-500/50">
            <span className="text-4xl">🍽️</span>
          </div>
          <h3 className="text-slate-400 font-medium">Items Used/Donated</h3>
          <p className="text-4xl font-bold text-white mt-1">{totalSaved}</p>
          <p className="text-sm text-emerald-400 mt-2">Successfully Saved</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 bg-red-900/50 rounded-full flex items-center justify-center mb-4 border-2 border-red-500/50">
            <span className="text-4xl">🗑️</span>
          </div>
          <h3 className="text-slate-400 font-medium">Items Wasted</h3>
          <p className="text-4xl font-bold text-white mt-1">{wastedCount}</p>
          <p className="text-sm text-red-500 mt-2">Try to lower this!</p>
        </div>
      </div>
      
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg">
        <h2 className="text-xl font-bold text-white mb-4">Recent Actions Log</h2>
        <div className="space-y-3">
          {wasteLogs.length === 0 && <p className="text-slate-500 text-center py-4">No recent history. Process an item on the Dashboard!</p>}
          
          {wasteLogs.slice(0, 10).map((log) => {
            let icon = "🍽️";
            let points = "+50 XP";
            let color = "text-emerald-400";
            if (log.status === "wasted") { icon = "🗑️"; points = "-25 XP"; color = "text-red-400"; }
            if (log.status === "donated") { icon = "🤝"; points = "+50 XP"; color = "text-purple-400"; }

            return (
              <div key={log.id} className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{icon}</span>
                  <div>
                    <p className="font-medium text-white capitalize">{log.item_name}</p>
                    <p className="text-sm text-slate-400">Marked as {log.status} on {new Date(log.logged_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <span className={`font-bold ${color}`}>{points}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
