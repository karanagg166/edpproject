import { RefreshCw, Package, Trash2 } from "lucide-react";
import Link from "next/link";
import { daysUntilExpiry } from "@/app/dashboard/constants";

export default function PantryTable({ loading, pantry, filtered, handleDelete }: { loading: boolean, pantry: any[], filtered: any[], handleDelete: (item: any, quantity?: number) => void }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
      {loading ? (
        <div className="text-center py-16 text-slate-500">
          <RefreshCw size={24} className="mx-auto mb-3 opacity-30 animate-spin" />
          <p>Loading pantry...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <Package size={40} className="mx-auto mb-3 opacity-30" />
          <p>{pantry.length === 0 ? "Your pantry is empty. Add an item!" : "No items match your filter."}</p>
        </div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800 text-xs text-slate-500 uppercase tracking-wide">
              <th className="px-5 py-3 text-left">Item</th>
              <th className="px-5 py-3 text-left">Qty</th>
              <th className="px-5 py-3 text-left">Category</th>
              <th className="px-5 py-3 text-left">Expiry</th>
              <th className="px-5 py-3 text-left"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {filtered.map((item) => {
              const days = daysUntilExpiry(item.expiry_date);
              const isExpiring = days !== null && days <= 3 && days >= 0;
              const isExpired = days !== null && days < 0;
              return (
                <tr key={item.id} className="hover:bg-slate-800/30 transition-colors group">
                  <td className="px-5 py-3">
                    <Link href={`/dashboard/item/${item.id}`} className="font-medium text-slate-200 capitalize hover:text-emerald-400 transition">
                      {item.name}
                    </Link>
                    {item.calories_per_100g > 0 && (
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        🔥 {item.calories_per_100g} kcal · 🥩 {item.protein_per_100g}g protein
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`font-semibold ${item.quantity <= 1 ? "text-orange-400" : "text-slate-300"}`}>
                      {item.quantity} {item.unit !== "count" && <span className="text-xs text-slate-500 font-normal">{item.unit}</span>}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-slate-400 text-xs capitalize">
                    {item.category?.replace("_", " ") || "—"}
                  </td>
                  <td className="px-5 py-3">
                    {item.expiry_date ? (
                      <span
                        className={`px-2 py-1 rounded-md text-xs font-medium ${isExpired
                            ? "bg-red-900/40 text-red-400 border border-red-800/40"
                            : isExpiring
                              ? "bg-orange-900/40 text-orange-400 border border-orange-800/40 animate-pulse"
                              : "bg-slate-800 text-slate-400"
                          }`}
                      >
                        {isExpired ? "Expired" : isExpiring ? `${days}d left` : item.expiry_date}
                      </span>
                    ) : (
                      <span className="text-slate-600">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => {
                        if (item.quantity > 1) {
                          const qtyStr = window.prompt(`How many ${item.unit && item.unit !== 'count' ? item.unit : 'units'} of ${item.name} to remove? (Max: ${item.quantity})`, "1");
                          if (qtyStr) {
                            const qty = parseInt(qtyStr, 10);
                            if (!isNaN(qty) && qty > 0) {
                              handleDelete(item, qty);
                            }
                          }
                        } else {
                          handleDelete(item, 1);
                        }
                      }}
                      className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
