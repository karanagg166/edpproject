"use client";
import { useEffect, useState, useCallback } from "react";
import { useUser } from "@/lib/UserContext";
import { Leaf, TrendingUp, RefreshCw, AlertTriangle, ChevronDown } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import { StaggerContainer, StaggerItem } from "@/components/ui/animations";

function ScoreRing({ score }: { score: number }) {
  const r = 52;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 70 ? "#34d399" : score >= 50 ? "#fbbf24" : "#f87171";

  return (
    <div className="relative w-40 h-40 mx-auto">
      <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
        <circle cx="60" cy="60" r={r} fill="none" stroke="#f4f4f5" strokeWidth="10" />
        <circle cx="60" cy="60" r={r} fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1s ease" }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold text-zinc-900">{score}</span>
        <span className="text-xs text-zinc-500">/100</span>
      </div>
    </div>
  );
}

function SubScore({ label, score, color }: { label: string; score: number; color: string }) {
  return (
    <div className="bg-zinc-50 border border-zinc-100 rounded-xl p-4">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs text-zinc-500">{label}</span>
        <span className="text-sm font-bold text-zinc-900">{score}/25</span>
      </div>
      <div className="w-full bg-zinc-200 rounded-full h-1.5">
        <div className="h-1.5 rounded-full transition-all duration-700"
          style={{ width: `${(score / 25) * 100}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

export default function HealthPage() {
  const { activeUserId, loading: userLoading } = useUser();
  const [data, setData]   = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [histRange, setHistRange] = useState("7");
  const [showItems, setShowItems] = useState(false);

  const fetchHealth = useCallback(async () => {
    if (userLoading || !activeUserId) return;
    setLoading(true);
    const [scoreRes, histRes] = await Promise.all([
      fetch(`/api/health`),
      fetch(`/api/health/history?range=${histRange}`),
    ]);
    const [score, hist] = await Promise.all([scoreRes.json(), histRes.json()]);
    setData(score);
    setHistory(hist.history || []);
    setLoading(false);
  }, [activeUserId, histRange, userLoading]);

  useEffect(() => { fetchHealth(); }, [fetchHealth]);

  const chartData = history.map((h) => ({
    date: h.scored_at?.slice(5, 10),
    Score: h.score,
    Protein: h.protein_score,
    Carbs: h.carb_score,
    Fat: h.fat_score,
  }));

  // Trend: compare most recent history entry (before current) to current score
  const prevScore = history.length >= 2 ? history[history.length - 2]?.score : null;
  const currentScore = data?.score || 0;
  const scoreDelta = prevScore !== null ? currentScore - prevScore : null;
  const trendIcon = scoreDelta === null ? null : scoreDelta > 0 ? "↑" : scoreDelta < 0 ? "↓" : "→";
  const trendColor = scoreDelta === null ? "" : scoreDelta > 0 ? "text-green-600" : scoreDelta < 0 ? "text-red-500" : "text-zinc-500";

  return (
    <StaggerContainer className="max-w-5xl mx-auto space-y-4 sm:space-y-6 min-w-0">
      <StaggerItem className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight">Health Score</h1>
          <p className="text-zinc-500 text-xs sm:text-sm mt-1">AI-analyzed nutritional balance of your pantry</p>
        </div>
        <button onClick={fetchHealth}
          className="flex items-center gap-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 px-4 py-2 rounded-xl text-sm font-medium transition shadow-sm border border-zinc-200">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Recalculate
        </button>
      </StaggerItem>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse mt-6">
          <div className="md:col-span-2 bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm h-32 flex flex-col gap-4">
            <div className="h-4 w-48 bg-zinc-200 rounded" />
            <div className="flex gap-4">
              {[...Array(5)].map((_, i) => <div key={i} className="h-16 w-full bg-zinc-100 rounded-xl" />)}
            </div>
          </div>
          <div className="bg-white border border-zinc-200 rounded-2xl p-8 shadow-sm h-72" />
          <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm h-72" />
          <div className="md:col-span-2 bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm h-72" />
        </div>
      ) : data?.error ? (
        <StaggerItem className="bg-red-50 border border-red-100 rounded-2xl p-8 text-center text-red-600 shadow-sm">
          {data.error} — Add some items to your pantry first.
        </StaggerItem>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mt-6">
          {/* Pantry Nutritional Snapshot */}
          {data?.pantryTotals && (
            <StaggerItem className="md:col-span-2 bg-white shadow-sm border border-zinc-200 rounded-2xl p-4 sm:p-6">
              <h2 className="text-sm font-semibold text-zinc-700 mb-4 tracking-tight">Pantry Nutritional Snapshot (Total Available)</h2>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[
                  { label: "Calories", val: data.pantryTotals.calories, color: "text-zinc-900" },
                  { label: "Protein", val: `${data.pantryTotals.protein}g`, color: "text-zinc-900" },
                  { label: "Carbs", val: `${data.pantryTotals.carbs}g`, color: "text-zinc-900" },
                  { label: "Fat", val: `${data.pantryTotals.fat}g`, color: "text-zinc-900" },
                  { label: "Fiber", val: `${data.pantryTotals.fiber}g`, color: "text-zinc-900" },
                ].map((s) => (
                  <div key={s.label} className="bg-zinc-50/80 p-3 sm:p-4 rounded-xl border border-zinc-100 text-center">
                    <p className="text-[10px] sm:text-xs text-zinc-500 mb-1 uppercase tracking-wider font-medium">{s.label}</p>
                    <p className={`text-base sm:text-xl font-bold ${s.color}`}>{s.val}</p>
                  </div>
                ))}
              </div>
            </StaggerItem>
          )}

          {/* Score card */}
          <StaggerItem className="bg-white shadow-sm border border-zinc-200 rounded-2xl p-5 sm:p-8 flex flex-col items-center gap-4">
            <h2 className="text-sm font-semibold text-zinc-700 self-start flex items-center gap-2">
              <TrendingUp size={16} className="text-green-500" /> Overall Score
              {trendIcon && (
                <span className={`ml-2 text-base font-bold ${trendColor}`}>
                  {trendIcon} {Math.abs(scoreDelta!)} pts
                </span>
              )}
            </h2>
            <ScoreRing score={currentScore} />
            <p className="text-center text-zinc-600 text-sm leading-relaxed">{data?.feedback}</p>
            {prevScore !== null && (
              <p className="text-xs text-zinc-400">
                Previous score: <span className="font-medium text-zinc-600">{prevScore}</span>
              </p>
            )}
          </StaggerItem>

          {/* Sub-scores */}
          <StaggerItem className="bg-white shadow-sm border border-zinc-200 rounded-2xl p-4 sm:p-6 space-y-4">
            <h2 className="text-sm font-semibold text-zinc-700 flex items-center gap-2 mb-2">
              <AlertTriangle size={16} className="text-amber-500" /> Score Breakdown
            </h2>
            <SubScore label="Protein Balance" score={data?.protein_score || 0} color="#f87171" />
            <SubScore label="Carbohydrate Quality" score={data?.carb_score || 0} color="#fbbf24" />
            <SubScore label="Fat Profile" score={data?.fat_score || 0} color="#a78bfa" />
            <SubScore label="Vitamins & Minerals" score={data?.micro_score || 0} color="#34d399" />
          </StaggerItem>

          {/* History chart */}
          <StaggerItem className="md:col-span-2 bg-white shadow-sm border border-zinc-200 rounded-2xl p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-3">
              <h2 className="text-sm font-semibold text-zinc-700">Score History</h2>
              <div className="flex gap-1 bg-zinc-100 p-1 rounded-lg">
                {[["7", "7d"], ["30", "30d"]].map(([v, l]) => (
                  <button key={v} onClick={() => setHistRange(v)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                      histRange === v ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700 hover:bg-zinc-200/50"
                    }`}>{l}</button>
                ))}
              </div>
            </div>
            {chartData.length > 1 ? (
              <ResponsiveContainer width="100%" height={200} minWidth={0} minHeight={0}>
                <LineChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: -25 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} dy={10} />
                  <YAxis domain={[0, 100]} tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "#ffffff", border: "1px solid #e4e4e7", borderRadius: 12, boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }} cursor={{ stroke: '#e4e4e7' }} />
                  <Line type="monotone" dataKey="Score" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4, fill: "#10b981", strokeWidth: 0 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="Protein" stroke="#f87171" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
                  <Line type="monotone" dataKey="Carbs"   stroke="#fbbf24" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[240px] flex items-center justify-center text-zinc-500 text-sm bg-zinc-50/50 rounded-xl border border-zinc-100 border-dashed">
                Run a few scores to see history here
              </div>
            )}
          </StaggerItem>

          {/* Macro alerts */}
          {data?.analysis && (
            <StaggerItem className="md:col-span-2 bg-white shadow-sm border border-zinc-200 rounded-2xl p-6">
              <h2 className="text-sm font-semibold text-zinc-700 mb-4">Macro Alerts</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { key: "sugar", label: "Sugar Load" },
                  { key: "sodium", label: "Sodium" },
                  { key: "fiber", label: "Fiber" },
                ].map(({ key, label }) => {
                  const val = data.analysis[key];
                  const color = val === "High" ? "text-red-700 border-red-200 bg-red-50"
                    : val === "Low" && key === "fiber" ? "text-amber-700 border-amber-200 bg-amber-50"
                    : "text-green-700 border-green-200 bg-green-50";
                  return (
                    <div key={key} className={`border rounded-xl p-4 text-center shadow-sm ${color}`}>
                      <p className="text-xs font-medium uppercase tracking-wider mb-1 opacity-80">{label}</p>
                      <p className="font-bold text-lg">{val}</p>
                    </div>
                  );
                })}
              </div>
            </StaggerItem>
          )}

          {/* Per-Item Breakdown */}
          {data?.items && (
            <StaggerItem className="md:col-span-2 bg-white shadow-sm border border-zinc-200 rounded-2xl overflow-hidden">
              <button 
                onClick={() => setShowItems(!showItems)}
                className="w-full flex items-center justify-between p-5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 transition"
              >
                <span>Per-Item Nutritional Breakdown</span>
                <ChevronDown size={16} className={`text-zinc-500 transition-transform ${showItems ? "rotate-180" : ""}`} />
              </button>
              
              {showItems && (
                <div className="border-t border-zinc-200 overflow-x-auto -mx-0">
                  <table className="w-full text-xs sm:text-sm min-w-[480px]">
                    <thead>
                      <tr className="bg-zinc-50 text-xs text-zinc-500 uppercase tracking-wide border-b border-zinc-100">
                        <th className="px-5 py-3 text-left font-medium">Item</th>
                        <th className="px-5 py-3 text-left font-medium">Qty</th>
                        <th className="px-5 py-3 text-left font-medium">Calories</th>
                        <th className="px-5 py-3 text-left font-medium">Protein</th>
                        <th className="px-5 py-3 text-left font-medium">Carbs</th>
                        <th className="px-5 py-3 text-left font-medium">Fat</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {data.items.map((item: any, idx: number) => (
                        <tr key={idx} className="hover:bg-zinc-50/50 transition-colors">
                          <td className="px-5 py-3 font-medium text-zinc-900 capitalize">{item.name}</td>
                          <td className="px-5 py-3 text-zinc-500">{item.quantity}</td>
                          <td className="px-5 py-3 text-zinc-700">{item.calories_per_100g || 0} kcal</td>
                          <td className="px-5 py-3 text-zinc-700">{item.protein_per_100g || 0}g</td>
                          <td className="px-5 py-3 text-zinc-700">{item.carbs_per_100g || 0}g</td>
                          <td className="px-5 py-3 text-zinc-700">{item.fat_per_100g || 0}g</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </StaggerItem>
          )}
        </div>
      )}
    </StaggerContainer>
  );
}
