"use client";
import React, { useEffect, useState } from "react";
import { useUser } from "@/lib/UserContext";
import { ArrowLeft, RefreshCw, Package, Flame, Target } from "lucide-react";
import Link from "next/link";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

export default function ItemDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = React.use(params);
  const { activeUserId } = useUser();
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeUserId) return;
    fetch(`/api/pantry/${resolvedParams.id}`)
      .then((res) => res.json())
      .then((data) => {
        setItem(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load item:", err);
        setLoading(false);
      });
  }, [resolvedParams.id, activeUserId]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="h-4 w-24 bg-zinc-200 rounded animate-pulse mb-6" />
        <div className="flex flex-col md:flex-row gap-6">
          <div className="bg-white border border-zinc-200 rounded-2xl p-6 flex-1 space-y-6 animate-pulse">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-zinc-200" />
              <div className="space-y-2">
                <div className="h-6 w-32 bg-zinc-200 rounded" />
                <div className="h-4 w-16 bg-zinc-200 rounded" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="h-16 bg-zinc-200 rounded-xl" />
              <div className="h-16 bg-zinc-200 rounded-xl" />
              <div className="h-16 bg-zinc-200 rounded-xl col-span-2" />
            </div>
          </div>
          <div className="bg-white border border-zinc-200 rounded-2xl p-6 flex-1 animate-pulse">
            <div className="h-6 w-40 bg-zinc-200 rounded mb-6" />
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="h-16 bg-zinc-200 rounded-xl" />
                <div className="h-16 bg-zinc-200 rounded-xl" />
              </div>
              <div className="flex items-center gap-6 mt-6">
                <div className="w-32 h-32 rounded-full bg-zinc-200" />
                <div className="space-y-3 flex-1">
                  <div className="h-4 w-full bg-zinc-200 rounded" />
                  <div className="h-4 w-3/4 bg-zinc-200 rounded" />
                  <div className="h-4 w-5/6 bg-zinc-200 rounded" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!item || item.error) {
    return (
      <div className="text-center py-20 text-zinc-500">
        <Package size={40} className="mx-auto mb-3 opacity-30" />
        <p>Item not found or you don't have access.</p>
        <Link href="/dashboard" className="text-zinc-900 font-medium mt-4 inline-block hover:underline">
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
      <Link href="/dashboard" className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 transition mb-6 w-fit font-medium text-sm">
        <ArrowLeft size={16} /> Back to Pantry
      </Link>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Basic Info */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-6 flex-1 shadow-sm space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-zinc-100 flex items-center justify-center border border-zinc-200">
              <Package size={32} className="text-zinc-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-zinc-900 capitalize tracking-tight">{item.name}</h1>
              <span className="inline-block px-2.5 py-1 bg-zinc-100 text-zinc-600 font-medium text-xs rounded-md mt-2 capitalize">
                {item.category?.replace("_", " ") || "Other"}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-100">
              <p className="text-xs text-zinc-500 font-medium mb-1">Quantity</p>
              <p className="text-xl font-bold text-zinc-900">{item.quantity}</p>
            </div>
            <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-100">
              <p className="text-xs text-zinc-500 font-medium mb-1">Storage</p>
              <p className="text-xl font-bold text-zinc-900 capitalize">{item.storage_type}</p>
            </div>
            <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-100 col-span-2">
              <p className="text-xs text-zinc-500 font-medium mb-1">Expiry Date</p>
              <p className="text-xl font-bold text-zinc-900">{item.expiry_date || "Not set"}</p>
            </div>
          </div>
        </div>

        {/* Nutritional Data */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-6 flex-1 shadow-sm">
          <h2 className="text-lg font-bold text-zinc-900 mb-6 flex items-center gap-2">
            <Flame size={18} className="text-orange-500" /> Nutritional Info <span className="text-xs font-normal text-zinc-500">(per 100g)</span>
          </h2>
          
          {hasNutrition ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-orange-50 border border-orange-100 p-4 rounded-xl text-center">
                  <p className="text-xs text-orange-600 font-medium mb-1">Calories</p>
                  <p className="text-2xl font-bold text-orange-500">{item.calories_per_100g}</p>
                </div>
                <div className="bg-green-50 border border-green-100 p-4 rounded-xl text-center">
                  <p className="text-xs text-green-600 font-medium mb-1">Fiber</p>
                  <p className="text-2xl font-bold text-green-600">{item.fiber_per_100g}g</p>
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
                          contentStyle={{ background: "#ffffff", border: "1px solid #e4e4e7", borderRadius: "8px", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                          itemStyle={{ color: "#18181b", fontSize: "12px", fontWeight: "500" }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-3 flex-1">
                    {macroData.map(m => (
                      <div key={m.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: m.color }} />
                          <span className="text-sm text-zinc-600 font-medium">{m.name}</span>
                        </div>
                        <span className="text-sm font-bold text-zinc-900">{m.value}g</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="h-40 flex flex-col items-center justify-center text-zinc-500 text-center">
              <Target size={32} className="mb-3 opacity-30" />
              <p className="text-sm">No nutritional data available for this item.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
