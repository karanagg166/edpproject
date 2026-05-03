'use client';

import dynamic from 'next/dynamic';
import { HeartHandshake, Info, Package, AlertTriangle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { daysUntilExpiry } from '@/app/dashboard/constants';
import { motion, AnimatePresence } from 'framer-motion';

// Dynamically import the map to avoid SSR issues with Leaflet
const DonationMap = dynamic(
  () => import('@/components/dashboard/DonationMap'),
  {
    ssr: false,
    loading: () => (
      <div className="h-[500px] w-full rounded-2xl overflow-hidden">
        <div className="skeleton h-full w-full" />
      </div>
    ),
  }
);

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.5, type: 'spring' as const, stiffness: 220, damping: 24 },
});

export default function DonationsPage() {
  const [expiringItems, setExpiringItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPantry() {
      try {
        const res = await fetch('/api/pantry');
        if (res.ok) {
          const data = await res.json();
          const expiring = data.filter((item: any) => {
            const days = daysUntilExpiry(item.expiry_date);
            return days !== null && days >= 0 && days <= 3;
          });
          setExpiringItems(expiring);
        }
      } catch (err) {
        console.error('Failed to fetch pantry items for donation suggestions', err);
      } finally {
        setLoading(false);
      }
    }
    fetchPantry();
  }, []);

  return (
    <div className="space-y-4 sm:space-y-6 max-w-6xl mx-auto pb-12 min-w-0">

      {/* ── Header ── */}
      <motion.div {...fadeUp(0)} className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight mb-2 flex items-center gap-2 sm:gap-3">
            <HeartHandshake className="text-zinc-900 w-8 h-8" />
            Food Donation Hub
          </h1>
          <p className="text-zinc-500 max-w-2xl font-medium text-sm sm:text-base">
            Have excess food before it expires? Find nearby NGOs, food banks, and shelters where you can
            donate. Reduce food waste and help your local community.
          </p>
        </div>
      </motion.div>

      {/* ── Info Banner ── */}
      <motion.div
        {...fadeUp(0.08)}
        className="bg-zinc-50 border border-zinc-200 p-4 rounded-xl flex items-start gap-3 text-zinc-800 shadow-sm"
      >
        <Info className="w-5 h-5 shrink-0 text-zinc-500 mt-0.5" />
        <div className="text-sm">
          <p className="font-semibold text-zinc-900 mb-1">What can I donate?</p>
          <p className="text-zinc-600 font-medium">
            Most food banks accept non-perishable items, canned goods, and sealed dry foods. Some accept
            fresh produce or refrigerated items—check their specific website or call ahead for details!
          </p>
        </div>
      </motion.div>

      {/* ── Expiring alert ── */}
      <AnimatePresence>
        {!loading && expiringItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 240, damping: 22 }}
            className="bg-amber-50 border border-amber-100 p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center gap-4 text-amber-900 shadow-sm"
          >
            <div className="bg-amber-100 p-3 rounded-full shrink-0">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold tracking-tight text-amber-900 mb-1">You have items expiring soon!</p>
              <p className="text-sm font-medium text-amber-700 mb-3 sm:mb-0">
                Consider donating these items before they go bad:
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {expiringItems.map((item) => {
                  const days = daysUntilExpiry(item.expiry_date);
                  return (
                    <div
                      key={item.id}
                      className="bg-white border border-amber-200 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 shadow-sm text-amber-900"
                    >
                      <Package size={14} className="text-amber-500" />
                      <span className="capitalize">{item.name}</span>
                      <span className="text-amber-600">· {days === 0 ? 'Today' : `${days} days`}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Map Section ── */}
      <motion.div
        {...fadeUp(0.16)}
        className="bg-white border border-zinc-200 p-3 sm:p-6 rounded-2xl sm:rounded-3xl shadow-sm"
      >
        <DonationMap />
      </motion.div>
    </div>
  );
}
