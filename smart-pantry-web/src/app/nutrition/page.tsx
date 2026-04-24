"use client";
import { useEffect, useState, useCallback } from "react";
import { useUser } from "@/lib/UserContext";
import { Activity, TrendingUp, Search, Calendar, RefreshCw } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";

const RANGES = [
  { label: "Today", value: "1" },
  { label: "7 Days", value: "7" },
  { label: "30 Days", value: "30" },
];

const MACROS = [
  { key: "protein", label: "Protein", color: "#f87171", unit: "g", daily: 50 },
  { key: "carbs",   label: "Carbs",   color: "#fbbf24", unit: "g", daily: 250 },
  { key: "fat",     label: "Fat",     color: "#a78bfa", unit: "g", daily: 65 },
  { key: "fiber",   label: "Fiber",   color: "#34d399", unit: "g", daily: 28 },
  { key: "calories",label: "Calories",color: "#60a5fa", unit: "kcal", daily: 2000 },
];

export default function NutritionPage() {
  const { activeUserId } = useUser();
  const [range, setRange] = useState("7");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Single-item USDA search tab
  const [activeTab, setActiveTab] = useState<"aggregate" | "lookup">("aggregate");
  const [query, setQuery] = useState("");
  const [queryQty, setQueryQty] = useState("1");
  const [lookup, setLookup] = useState<any>(null);
  const [lookupLoading, setLookupLoading] = useState(false);

  const fetchAggregate = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/nutrition/aggregate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ range }),
    });
    const json = await res.json();
    setData(json);
    setLoading(false);
  }, [activeUserId, range]);

  useEffect(() => { fetchAggregate(); }, [fetchAggregate]);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLookupLoading(true);
    
    // Combine quantity and food string so backend can parse it, e.g. "5 bananas"
    const searchString = `${queryQty} ${query}`;
    
    const res = await fetch("/api/nutrition", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: [{ food: searchString, quantity: 100 }] }),
    });
    setLookup(await res.json());
    setLookupLoading(false);
  };

  const totals = data?.totals || {};
  const chartData = (data?.days || []).map((d: any) => ({
    date: d.date?.slice(5), // MM-DD
    Protein: Math.round(d.protein),
    Carbs: Math.round(d.carbs),
    Fat: Math.round(d.fat),
    Fiber: Math.round(d.fiber),
  }));

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Nutrition</h1>
          <p className="text-slate-400 text-sm mt-1">Macro breakdown based on your pantry usage</p>
        </div>
        <div className="flex gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl">
          {RANGES.map((r) => (
            <button key={r.value} onClick={() => setRange(r.value)}
              className={`px-4 py-1.5 rounded-lg text-sm transition ${
                range === r.value ? "bg-sky-600 text-white" : "text-slate-400 hover:text-slate-200"
              }`}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-4 border-b border-slate-800 pb-0">
        {(["aggregate", "lookup"] as const).map((t) => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`pb-3 text-sm font-medium border-b-2 transition -mb-px ${
              activeTab === t ? "border-sky-500 text-sky-400" : "border-transparent text-slate-500 hover:text-slate-300"
            }`}>
            {t === "aggregate" ? "📊 Overview" : "🔍 Lookup Item"}
          </button>
        ))}
      </div>

      {activeTab === "aggregate" ? (
        loading ? (
          <div className="flex justify-center py-20"><RefreshCw className="animate-spin text-sky-400" size={32} /></div>
        ) : (
          <div className="space-y-6">
            {/* Macro cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {MACROS.map(({ key, label, color, unit, daily }) => {
                const val = totals[key] || 0;
                const pct = Math.min(100, Math.round((val / (daily * parseInt(range))) * 100));
                return (
                  <div key={key} className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                    <p className="text-xs text-slate-500 mb-1">{label}</p>
                    <p className="text-2xl font-bold text-white">{val}
                      <span className="text-xs font-normal text-slate-500 ml-1">{unit}</span>
                    </p>
                    <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2">
                      <div className="h-1.5 rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, backgroundColor: color }} />
                    </div>
                    <p className="text-xs text-slate-600 mt-1">{pct}% of {range}-day target</p>
                  </div>
                );
              })}
            </div>

            {/* Bar chart */}
            {chartData.length > 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 min-h-[340px]">
                <h2 className="text-sm font-semibold text-slate-300 mb-5">Daily Macro Breakdown</h2>
                {mounted && (
                  <div style={{ width: "100%", height: 260 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 11 }} />
                        <YAxis tick={{ fill: "#64748b", fontSize: 11 }} />
                        <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12 }} />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        <Bar dataKey="Protein" fill="#f87171" radius={[4,4,0,0]} />
                        <Bar dataKey="Carbs"   fill="#fbbf24" radius={[4,4,0,0]} />
                        <Bar dataKey="Fat"     fill="#a78bfa" radius={[4,4,0,0]} />
                        <Bar dataKey="Fiber"   fill="#34d399" radius={[4,4,0,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500">
                <Activity size={40} className="mx-auto mb-3 opacity-20" />
                <p>No consumption data yet.</p>
                <p className="text-xs mt-1">Items are counted when removed from pantry via camera.</p>
              </div>
            )}
          </div>
        )
      ) : (
        /* Lookup tab */
        <div className="space-y-4">
          <form onSubmit={handleLookup} className="flex gap-3">
            <div className="w-24 shrink-0 relative">
              <input type="number" min="1" step="0.1" value={queryQty} onChange={e => setQueryQty(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-3 text-white focus:border-sky-500 outline-none" placeholder="Qty" />
            </div>
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input value={query} onChange={e => setQuery(e.target.value)}
                placeholder="e.g. Apple, Chicken Breast, Brown Rice..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-3 text-white focus:border-sky-500 outline-none" />
            </div>
            <button disabled={lookupLoading}
              className="bg-sky-600 hover:bg-sky-500 text-white px-6 rounded-xl text-sm font-medium transition disabled:opacity-50">
              {lookupLoading ? "..." : "Search"}
            </button>
          </form>
          {lookup && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
              {lookup.item_data && (
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
                  <h3 className="text-sm font-semibold text-sky-400 mb-4">
                    Per Item (approx. {lookup.item_data.serving_size_g}g)
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: "Calories", val: lookup.item_data.calories_per_item, unit: "kcal", color: "border-blue-500" },
                      { label: "Protein",  val: lookup.item_data.protein_per_item,  unit: "g",    color: "border-red-500" },
                      { label: "Fat",      val: lookup.item_data.fat_per_item,      unit: "g",    color: "border-purple-500" },
                      { label: "Carbs",    val: lookup.item_data.carbs_per_item,    unit: "g",    color: "border-yellow-500" },
                    ].map(({ label, val, unit, color }) => (
                      <div key={label} className={`bg-slate-800 border-t-2 ${color} p-4 rounded-xl`}>
                        <p className="text-slate-400 text-sm">{label}</p>
                        <p className="text-2xl font-bold text-white">{val || 0}
                          <span className="text-sm font-normal text-slate-500 ml-1">{unit}</span>
                        </p>
                        <p className="text-[10px] text-slate-500 mt-1">per 1 item (~{lookup.item_data.serving_size_g}g)</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
                <h3 className="text-sm font-semibold text-slate-400 mb-4">
                  {lookup.item_data && lookup.item_data.parsed_qty !== 1 ? `Total for ${lookup.item_data.parsed_qty} items` : "Per 100g"}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: "Calories", val: lookup.calories, unit: "kcal", color: "border-blue-500" },
                    { label: "Protein",  val: lookup.protein,  unit: "g",    color: "border-red-500" },
                    { label: "Fat",      val: lookup.fat,      unit: "g",    color: "border-purple-500" },
                    { label: "Carbs",    val: lookup.carbs,    unit: "g",    color: "border-yellow-500" },
                  ].map(({ label, val, unit, color }) => (
                    <div key={label} className={`bg-slate-800 border-t-2 ${color} p-4 rounded-xl`}>
                      <p className="text-slate-400 text-sm">{label}</p>
                      <p className="text-2xl font-bold text-white">{val || 0}
                        <span className="text-sm font-normal text-slate-500 ml-1">{unit}</span>
                      </p>
                      <p className="text-[10px] text-slate-500 mt-1">
                        {lookup.item_data && lookup.item_data.parsed_qty !== 1 ? `total for ${lookup.item_data.parsed_qty}` : "per 100g"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
