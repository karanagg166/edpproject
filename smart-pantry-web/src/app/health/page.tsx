"use client";
import { useEffect, useState, useCallback } from "react";
import { useUser } from "@/lib/UserContext";
import { Leaf, TrendingUp, RefreshCw, AlertTriangle, ChevronDown } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";

function ScoreRing({ score }: { score: number }) {
  const r = 52;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 70 ? "#34d399" : score >= 50 ? "#fbbf24" : "#f87171";

  return (
    <div className="relative w-40 h-40 mx-auto">
      <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
        <circle cx="60" cy="60" r={r} fill="none" stroke="#1e293b" strokeWidth="10" />
        <circle cx="60" cy="60" r={r} fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1s ease" }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold text-white">{score}</span>
        <span className="text-xs text-slate-400">/100</span>
      </div>
    </div>
  );
}

function SubScore({ label, score, color }: { label: string; score: number; color: string }) {
  return (
    <div className="bg-slate-800/60 rounded-xl p-4">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs text-slate-400">{label}</span>
        <span className="text-sm font-bold text-white">{score}/25</span>
      </div>
      <div className="w-full bg-slate-700 rounded-full h-1.5">
        <div className="h-1.5 rounded-full transition-all duration-700"
          style={{ width: `${(score / 25) * 100}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

export default function HealthPage() {
  const { activeUserId } = useUser();
  const [data, setData]   = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [histRange, setHistRange] = useState("7");
  const [showItems, setShowItems] = useState(false);

  const fetchHealth = useCallback(async () => {
    setLoading(true);
    const [scoreRes, histRes] = await Promise.all([
      fetch(`/api/health`),
      fetch(`/api/health/history?range=${histRange}`),
    ]);
    const [score, hist] = await Promise.all([scoreRes.json(), histRes.json()]);
    setData(score);
    setHistory(hist.history || []);
    setLoading(false);
  }, [activeUserId, histRange]);

  useEffect(() => { fetchHealth(); }, [fetchHealth]);

  const chartData = history.map((h) => ({
    date: h.scored_at?.slice(5, 10),
    Score: h.score,
    Protein: h.protein_score,
    Carbs: h.carb_score,
    Fat: h.fat_score,
  }));

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Health Score</h1>
          <p className="text-slate-400 text-sm mt-1">AI-analyzed nutritional balance of your pantry</p>
        </div>
        <button onClick={fetchHealth}
          className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl text-sm transition">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Recalculate
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="animate-spin text-emerald-500 mx-auto mb-3" size={32} />
            <p className="text-slate-400 text-sm">AI analyzing your pantry...</p>
          </div>
        </div>
      ) : data?.error ? (
        <div className="bg-red-900/20 border border-red-800/30 rounded-2xl p-8 text-center text-red-400">
          {data.error} — Add some items to your pantry first.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Pantry Nutritional Snapshot */}
          {data?.pantryTotals && (
            <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h2 className="text-sm font-semibold text-slate-300 mb-4">Pantry Nutritional Snapshot (Total Available)</h2>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[
                  { label: "Calories", val: data.pantryTotals.calories, color: "text-blue-400" },
                  { label: "Protein", val: `${data.pantryTotals.protein}g`, color: "text-red-400" },
                  { label: "Carbs", val: `${data.pantryTotals.carbs}g`, color: "text-yellow-400" },
                  { label: "Fat", val: `${data.pantryTotals.fat}g`, color: "text-purple-400" },
                  { label: "Fiber", val: `${data.pantryTotals.fiber}g`, color: "text-emerald-400" },
                ].map((s) => (
                  <div key={s.label} className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 text-center">
                    <p className="text-xs text-slate-500 mb-1">{s.label}</p>
                    <p className={`text-xl font-bold ${s.color}`}>{s.val}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Score card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 flex flex-col items-center gap-4">
            <h2 className="text-sm font-semibold text-slate-400 self-start flex items-center gap-2">
              <TrendingUp size={14} className="text-emerald-400" /> Overall Score
            </h2>
            <ScoreRing score={data?.score || 0} />
            <p className="text-center text-slate-300 text-sm leading-relaxed">{data?.feedback}</p>
          </div>

          {/* Sub-scores */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h2 className="text-sm font-semibold text-slate-400 flex items-center gap-2 mb-2">
              <AlertTriangle size={14} className="text-yellow-400" /> Score Breakdown
            </h2>
            <SubScore label="Protein Balance" score={data?.protein_score || 0} color="#f87171" />
            <SubScore label="Carbohydrate Quality" score={data?.carb_score || 0} color="#fbbf24" />
            <SubScore label="Fat Profile" score={data?.fat_score || 0} color="#a78bfa" />
            <SubScore label="Vitamins & Minerals" score={data?.micro_score || 0} color="#34d399" />
          </div>

          {/* History chart */}
          <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-semibold text-slate-300">Score History</h2>
              <div className="flex gap-1 bg-slate-800 p-1 rounded-lg">
                {[["7", "7d"], ["30", "30d"]].map(([v, l]) => (
                  <button key={v} onClick={() => setHistRange(v)}
                    className={`px-3 py-1 rounded-md text-xs transition ${
                      histRange === v ? "bg-slate-600 text-white" : "text-slate-500 hover:text-slate-300"
                    }`}>{l}</button>
                ))}
              </div>
            </div>
            {chartData.length > 1 ? (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12 }} />
                  <Line type="monotone" dataKey="Score" stroke="#34d399" strokeWidth={2} dot={{ r: 4, fill: "#34d399" }} />
                  <Line type="monotone" dataKey="Protein" stroke="#f87171" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
                  <Line type="monotone" dataKey="Carbs"   stroke="#fbbf24" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-slate-600 text-sm">
                Run a few scores to see history here
              </div>
            )}
          </div>

          {/* Macro alerts */}
          {data?.analysis && (
            <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h2 className="text-sm font-semibold text-slate-400 mb-4">Macro Alerts</h2>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { key: "sugar", label: "Sugar Load" },
                  { key: "sodium", label: "Sodium" },
                  { key: "fiber", label: "Fiber" },
                ].map(({ key, label }) => {
                  const val = data.analysis[key];
                  const color = val === "High" ? "text-red-400 border-red-800/40 bg-red-900/10"
                    : val === "Low" && key === "fiber" ? "text-orange-400 border-orange-800/40 bg-orange-900/10"
                    : "text-emerald-400 border-emerald-800/40 bg-emerald-900/10";
                  return (
                    <div key={key} className={`border rounded-xl p-4 text-center ${color}`}>
                      <p className="text-xs text-slate-400 mb-1">{label}</p>
                      <p className="font-bold">{val}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Per-Item Breakdown */}
          {data?.items && (
            <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
              <button 
                onClick={() => setShowItems(!showItems)}
                className="w-full flex items-center justify-between p-5 text-sm font-semibold text-slate-300 hover:text-white transition"
              >
                <span>Per-Item Nutritional Breakdown</span>
                <ChevronDown size={16} className={`transition-transform ${showItems ? "rotate-180" : ""}`} />
              </button>
              
              {showItems && (
                <div className="border-t border-slate-800 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-800/50 text-xs text-slate-500 uppercase tracking-wide">
                        <th className="px-5 py-3 text-left">Item</th>
                        <th className="px-5 py-3 text-left">Qty</th>
                        <th className="px-5 py-3 text-left">Calories</th>
                        <th className="px-5 py-3 text-left">Protein</th>
                        <th className="px-5 py-3 text-left">Carbs</th>
                        <th className="px-5 py-3 text-left">Fat</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {data.items.map((item: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                          <td className="px-5 py-3 font-medium text-slate-300 capitalize">{item.name}</td>
                          <td className="px-5 py-3 text-slate-400">{item.quantity}</td>
                          <td className="px-5 py-3 text-blue-400">{item.calories_per_100g || 0} kcal</td>
                          <td className="px-5 py-3 text-red-400">{item.protein_per_100g || 0}g</td>
                          <td className="px-5 py-3 text-yellow-400">{item.carbs_per_100g || 0}g</td>
                          <td className="px-5 py-3 text-purple-400">{item.fat_per_100g || 0}g</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      {/* GAME: badge unlock when score > 80 for 7 days */}
    </div>
  );
}
