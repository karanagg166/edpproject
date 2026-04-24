import { AlertTriangle } from "lucide-react";
import { daysUntilExpiry } from "@/app/dashboard/constants";

export default function ExpiringSoon({ pantry }: { pantry: any[] }) {
  const expiringItems = pantry.filter((p) => {
    const d = daysUntilExpiry(p.expiry_date);
    return d !== null && d <= 3 && d >= 0;
  });

  if (expiringItems.length === 0) return null;

  return (
    <div className="bg-orange-900/20 border border-orange-800/40 rounded-2xl p-5">
      <h3 className="text-sm font-semibold text-orange-400 mb-3 flex items-center gap-2">
        <AlertTriangle size={14} /> Expiring Soon
      </h3>
      <div className="space-y-1">
        {expiringItems.map((p) => (
          <div key={p.id} className="text-xs text-slate-300 flex justify-between">
            <span className="capitalize">{p.name}</span>
            <span className="text-orange-400">{daysUntilExpiry(p.expiry_date)}d</span>
          </div>
        ))}
      </div>
    </div>
  );
}
