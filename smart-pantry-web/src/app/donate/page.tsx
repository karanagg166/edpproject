"use client";

import { useState } from "react";
import { HeartHandshake, MapPin, ExternalLink, Search, Loader2 } from "lucide-react";

export default function DonatePage() {
  const [city, setCity] = useState("");
  const [foodBanks, setFoodBanks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchCharities = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!city.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/donate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ location: city }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      // Expected returns an array of { name: "...", address: "...", needed: ["...", "..."] }
      setFoodBanks(data.charities || []);
    } catch (err: any) {
      setError(err.message || "Failed to search for charities.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <header className="flex items-center gap-3 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-rose-400 to-red-500 flex items-center justify-center shadow-lg">
          <HeartHandshake className="text-white" size={28} />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">Food Donation</h1>
          <p className="text-slate-400 mt-1">Live AI Search: Find real local food banks requesting specific items.</p>
        </div>
      </header>

      <form onSubmit={searchCharities} className="flex gap-4">
        <input 
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="Enter your City or Zip Code..."
          className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-rose-500 outline-none"
        />
        <button disabled={loading} className="bg-rose-600 hover:bg-rose-500 text-white px-6 rounded-xl flex items-center gap-2 transition disabled:opacity-50">
          {loading ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />} 
          {loading ? "Searching..." : "Locate Charities"}
        </button>
      </form>

      {error && <div className="text-red-400 text-center">{error}</div>}

      {foodBanks.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg animate-in slide-in-from-bottom-4">
          <h2 className="text-xl font-bold text-white mb-6">Real Food Banks near {city}</h2>
          
          <div className="space-y-4">
            {foodBanks.map((bank, i) => (
              <div key={i} className="bg-slate-800/50 border border-slate-700 p-5 rounded-xl hover:border-rose-500/50 transition cursor-pointer flex justify-between items-center group">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <MapPin size={16} className="text-rose-400" /> {bank.name}
                  </h3>
                  <p className="text-sm text-slate-400 mt-1">{bank.address || "Address unavailable"}</p>
                  <div className="flex gap-2 mt-3 flex-wrap">
                    {(bank.needed || []).map((item: string, j: number) => (
                      <span key={j} className="text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded-md">
                        Needs: {item}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-slate-700 group-hover:bg-rose-500 flex items-center justify-center transition shrink-0 ml-4">
                  <ExternalLink size={18} className="text-slate-300 group-hover:text-white" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
