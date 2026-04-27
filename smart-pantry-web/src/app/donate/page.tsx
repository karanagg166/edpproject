'use client';

import dynamic from 'next/dynamic';
import { MapPin, HeartHandshake, Info, Package, AlertTriangle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { daysUntilExpiry } from '@/app/dashboard/constants';
import { StaggerContainer, StaggerItem } from '@/components/ui/animations';

// Dynamically import the map to avoid SSR issues with Leaflet
const DonationMap = dynamic(
  () => import('@/components/dashboard/DonationMap'),
  { 
    ssr: false,
    loading: () => (
      <div className="h-[500px] w-full rounded-2xl bg-zinc-50 border border-zinc-200 flex flex-col items-center justify-center text-zinc-400 animate-pulse">
        <MapPin className="w-8 h-8 mb-4 text-zinc-300" />
        <p className="font-medium tracking-tight">Loading interactive map...</p>
      </div>
    )
  }
);

export default function DonationsPage() {
  const [expiringItems, setExpiringItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPantry() {
      try {
        const res = await fetch("/api/pantry");
        if (res.ok) {
          const data = await res.json();
          const expiring = data.filter((item: any) => {
            const days = daysUntilExpiry(item.expiry_date);
            return days !== null && days >= 0 && days <= 3;
          });
          setExpiringItems(expiring);
        }
      } catch (err) {
        console.error("Failed to fetch pantry items for donation suggestions", err);
      } finally {
        setLoading(false);
      }
    }
    fetchPantry();
  }, []);

  return (
    <StaggerContainer className="space-y-6 max-w-6xl mx-auto pb-12">
      
      {/* Header section */}
      <StaggerItem className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 tracking-tight mb-2 flex items-center gap-3">
            <HeartHandshake className="text-zinc-900 w-8 h-8" />
            Food Donation Hub
          </h1>
          <p className="text-zinc-500 max-w-2xl font-medium">
            Have excess food before it expires? Find nearby NGOs, food banks, and shelters where you can donate. 
            Reduce food waste and help your local community.
          </p>
        </div>
      </StaggerItem>

      {/* Info Banner */}
      <StaggerItem className="bg-zinc-50 border border-zinc-200 p-4 rounded-xl flex items-start gap-3 text-zinc-800 shadow-sm">
        <Info className="w-5 h-5 shrink-0 text-zinc-500 mt-0.5" />
        <div className="text-sm">
          <p className="font-semibold text-zinc-900 mb-1">What can I donate?</p>
          <p className="text-zinc-600 font-medium">Most food banks accept non-perishable items, canned goods, and sealed dry foods. Some accept fresh produce or refrigerated items—check their specific website or call ahead for details!</p>
        </div>
      </StaggerItem>

      {/* Suggest items to donate */}
      {!loading && expiringItems.length > 0 && (
        <StaggerItem className="bg-amber-50 border border-amber-100 p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center gap-4 text-amber-900 shadow-sm">
          <div className="bg-amber-100 p-3 rounded-full shrink-0">
            <AlertTriangle className="w-6 h-6 text-amber-600" />
          </div>
          <div className="flex-1">
            <p className="font-semibold tracking-tight text-amber-900 mb-1">You have items expiring soon!</p>
            <p className="text-sm font-medium text-amber-700 mb-3 sm:mb-0">
              Consider donating these items before they go bad:
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              {expiringItems.map(item => {
                const days = daysUntilExpiry(item.expiry_date);
                return (
                  <div key={item.id} className="bg-white border border-amber-200 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 shadow-sm text-amber-900">
                    <Package size={14} className="text-amber-500" />
                    <span className="capitalize">{item.name}</span>
                    <span className="text-amber-600">· {days === 0 ? "Today" : `${days} days`}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </StaggerItem>
      )}

      {/* Map Section */}
      <StaggerItem className="bg-white border border-zinc-200 p-6 rounded-3xl shadow-sm">
        <DonationMap />
      </StaggerItem>
    </StaggerContainer>
  );
}
