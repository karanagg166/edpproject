'use client';

import dynamic from 'next/dynamic';
import { MapPin, HeartHandshake, Info } from 'lucide-react';

// Dynamically import the map to avoid SSR issues with Leaflet
const DonationMap = dynamic(
  () => import('@/components/dashboard/DonationMap'),
  { 
    ssr: false,
    loading: () => (
      <div className="h-[500px] w-full rounded-2xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center text-slate-400 animate-pulse">
        <MapPin className="w-8 h-8 mb-4 text-emerald-500/50" />
        <p>Loading interactive map...</p>
      </div>
    )
  }
);

export default function DonationsPage() {
  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 animate-in fade-in duration-500">
      
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <HeartHandshake className="text-emerald-400 w-8 h-8" />
            Food Donation Hub
          </h1>
          <p className="text-slate-400 max-w-2xl">
            Have excess food before it expires? Find nearby NGOs, food banks, and shelters where you can donate. 
            Reduce food waste and help your local community.
          </p>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-sky-500/10 border border-sky-500/20 p-4 rounded-xl flex items-start gap-3 text-sky-200">
        <Info className="w-5 h-5 shrink-0 text-sky-400 mt-0.5" />
        <div className="text-sm">
          <p className="font-semibold text-sky-300 mb-1">What can I donate?</p>
          <p className="opacity-90">Most food banks accept non-perishable items, canned goods, and sealed dry foods. Some accept fresh produce or refrigerated items—check their specific website or call ahead for details!</p>
        </div>
      </div>

      {/* Map Section */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl shadow-black/20">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white">Nearby Donation Centers</h2>
          <span className="bg-slate-800 text-xs text-slate-400 px-3 py-1 rounded-full border border-slate-700">
            10km Radius
          </span>
        </div>
        
        <DonationMap />
      </div>
    </div>
  );
}
