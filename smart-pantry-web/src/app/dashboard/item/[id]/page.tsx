"use client";
import { useEffect, useState } from "react";
import { useUser } from "@/lib/UserContext";
import { ArrowLeft, RefreshCw, Package, Flame, Target } from "lucide-react";
import Link from "next/link";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

export default function ItemDetailPage({ params }: { params: { id: string } }) {
  const { activeUserId } = useUser();
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeUserId) return;
    fetch(`/api/pantry/${params.id}`)
      .then((res) => res.json())
      .then((data) => {
        setItem(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load item:", err);
        setLoading(false);
      });
  }, [params.id, activeUserId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="animate-spin text-emerald-500" size={32} />
      </div>
    );
  }

  if (!item || item.error) {
    return (
      <div className="text-center py-20 text-slate-500">
        <Package size={40} className="mx-auto mb-3 opacity-30" />
        <p>Item not found or you don't have access.</p>
        <Link href="/dashboard" className="text-emerald-400 mt-4 inline-block hover:underline">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const hasNutrition = item.calories_per_100g > 0 || item.protein_per_100g > 0;
  
  const macroData = [
    { name: "Protein", value: item.protein_per_100g || 0, color: "#f87171" },
    { name: "Carbs", value: item.carbs_per_100g || 0, color: "#fbbf24" },
    { name: "Fat", value: item.fat_per_100g || 0, color: "#a78bfa" },
  ].filter(d => d.value > 0);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link href="/dashboard" className="flex items-center gap-2 text-slate-400 hover:text-emerald-400 transition mb-6 w-fit">
        <ArrowLeft size={16} /> Back to Pantry
      </Link>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Basic Info */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex-1 space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
              <Package size={32} className="text-emerald-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white capitalize">{item.name}</h1>
              <span className="inline-block px-2 py-1 bg-slate-800 text-slate-400 text-xs rounded-md mt-2 capitalize">
                {item.category?.replace("_", " ") || "Other"}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-800">
              <p className="text-xs text-slate-500 mb-1">Quantity</p>
              <p className="text-xl font-semibold text-white">{item.quantity}</p>
            </div>
            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-800">
              <p className="text-xs text-slate-500 mb-1">Storage</p>
              <p className="text-xl font-semibold text-white capitalize">{item.storage_type}</p>
            </div>
            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-800 col-span-2">
              <p className="text-xs text-slate-500 mb-1">Expiry Date</p>
              <p className="text-xl font-semibold text-white">{item.expiry_date || "Not set"}</p>
            </div>
          </div>
        </div>

        {/* Nutritional Data */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex-1">
          <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <Flame size={18} className="text-orange-400" /> Nutritional Info <span className="text-xs font-normal text-slate-500">(per 100g)</span>
          </h2>
          
          {hasNutrition ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-orange-900/20 border border-orange-500/30 p-4 rounded-xl text-center">
                  <p className="text-xs text-orange-400/80 mb-1">Calories</p>
                  <p className="text-2xl font-bold text-orange-400">{item.calories_per_100g}</p>
                </div>
                <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-xl text-center">
                  <p className="text-xs text-emerald-400/80 mb-1">Fiber</p>
                  <p className="text-2xl font-bold text-emerald-400">{item.fiber_per_100g}g</p>
                </div>
              </div>

              {macroData.length > 0 && (
                <div className="flex items-center gap-6">
                  <div className="w-32 h-32 shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={macroData}
                          innerRadius={30}
                          outerRadius={50}
                          paddingAngle={5}
                          dataKey="value"
                          stroke="none"
                        >
                          {macroData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: "8px" }}
                          itemStyle={{ color: "#e2e8f0", fontSize: "12px" }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-3 flex-1">
                    {macroData.map(m => (
                      <div key={m.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: m.color }} />
                          <span className="text-sm text-slate-300">{m.name}</span>
                        </div>
                        <span className="text-sm font-semibold text-white">{m.value}g</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="h-40 flex flex-col items-center justify-center text-slate-500 text-center">
              <Target size={32} className="mb-3 opacity-30" />
              <p className="text-sm">No nutritional data available for this item.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
