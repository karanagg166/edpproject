import { Package, MoreHorizontal, Plus } from "lucide-react";
import Link from "next/link";
import { daysUntilExpiry } from "@/app/dashboard/constants";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

import { TableSkeleton } from "@/components/ui/skeletons";

/* ── Illustrated empty state ── */
function PantryEmptyState({ isFiltered }: { isFiltered: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="flex flex-col items-center justify-center py-16 px-6 text-center"
    >
      {/* Floating SVG illustration */}
      <div className="relative mb-6">
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <svg width="96" height="96" viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            {/* Shelves */}
            <rect x="8" y="72" width="80" height="8" rx="4" fill="#e4e4e7" />
            <rect x="8" y="44" width="80" height="8" rx="4" fill="#e4e4e7" />
            {/* Side walls */}
            <rect x="8" y="12" width="6" height="68" rx="3" fill="#e4e4e7" />
            <rect x="82" y="12" width="6" height="68" rx="3" fill="#e4e4e7" />
            {/* Jar 1 */}
            <rect x="18" y="54" width="18" height="16" rx="4" fill="#f4f4f5" stroke="#d4d4d8" strokeWidth="1.5" />
            <rect x="22" y="50" width="10" height="6" rx="2" fill="#d4d4d8" />
            {/* Jar 2 */}
            <rect x="44" y="56" width="14" height="14" rx="4" fill="#f4f4f5" stroke="#d4d4d8" strokeWidth="1.5" />
            <rect x="47" y="52" width="8" height="6" rx="2" fill="#d4d4d8" />
            {/* Can */}
            <rect x="66" y="54" width="14" height="16" rx="3" fill="#f4f4f5" stroke="#d4d4d8" strokeWidth="1.5" />
            <line x1="66" y1="60" x2="80" y2="60" stroke="#d4d4d8" strokeWidth="1" />
            {/* Dashed empty top shelf */}
            <line x1="18" y1="34" x2="78" y2="34" stroke="#e4e4e7" strokeWidth="1.5" strokeDasharray="6 4" />
          </svg>
        </motion.div>
        {/* Subtle glow background */}
        <div className="absolute inset-0 bg-zinc-100/70 blur-2xl rounded-full scale-75 -z-10" />
      </div>

      {isFiltered ? (
        <>
          <h3 className="text-base font-semibold text-zinc-700 mb-1">No items match</h3>
          <p className="text-sm text-zinc-400 max-w-xs leading-relaxed">
            Try adjusting your search or category filter.
          </p>
        </>
      ) : (
        <>
          <h3 className="text-base font-semibold text-zinc-700 mb-1.5">Your pantry is empty</h3>
          <p className="text-sm text-zinc-400 max-w-xs leading-relaxed mb-5">
            Start tracking your food to reduce waste and eat smarter.
          </p>
          <button
            onClick={() => document.getElementById("open-add-modal-btn")?.click()}
            className="inline-flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors"
          >
            <Plus size={15} />
            Add your first item
          </button>
        </>
      )}
    </motion.div>
  );
}

export default function PantryTable({ loading, pantry, filtered, handleDelete, handleConsume }: { loading: boolean, pantry: any[], filtered: any[], handleDelete: (item: any, quantity?: number) => void, handleConsume?: (item: any, quantity?: number) => void }) {
  return (
    <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm min-w-0">
      {loading ? (
        <div className="p-4">
          <TableSkeleton rows={5} />
        </div>
      ) : filtered.length === 0 ? (
        <PantryEmptyState isFiltered={pantry.length > 0} />
      ) : (
        <div className="overflow-x-auto scrollbar-hide">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-zinc-200 text-xs text-zinc-500 uppercase tracking-wide hover:bg-transparent">
                <TableHead className="px-3 sm:px-5 py-3 text-left">Item</TableHead>
                <TableHead className="px-3 sm:px-5 py-3 text-left">Qty</TableHead>
                <TableHead className="px-3 sm:px-5 py-3 text-left hidden md:table-cell">Category</TableHead>
                <TableHead className="px-3 sm:px-5 py-3 text-left">Expiry</TableHead>
                <TableHead className="px-3 sm:px-5 py-3 text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence initial={false}>
                {filtered.map((item, index) => {
                  const days = daysUntilExpiry(item.expiry_date);
                  const isExpiring = days !== null && days <= 3 && days >= 0;
                  const isExpired = days !== null && days < 0;
                  const isEven = index % 2 === 0;

                  return (
                    <motion.tr
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: 8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                      className={cn(
                        "border-b border-zinc-100 transition-colors group",
                        isEven
                          ? "bg-white hover:bg-zinc-50/80"
                          : "bg-zinc-50/40 hover:bg-zinc-100/60",
                      )}
                    >
                      <TableCell className="px-3 sm:px-5 py-3.5">
                        <Link href={`/dashboard/item/${item.id}`} className="font-medium text-zinc-900 capitalize hover:text-zinc-600 transition text-sm sm:text-base">
                          {item.name}
                        </Link>
                        {item.calories_per_100g > 0 && (
                          <div className="text-[10px] text-zinc-500 mt-0.5 hidden sm:block">
                            {(() => {
                              const serving = item.serving_size_g || 100;
                              const calPerItem = Math.round((item.calories_per_100g / 100) * serving);
                              const proPerItem = Math.round((item.protein_per_100g / 100) * serving * 10) / 10;
                              const isPer100g = !item.serving_size_g || item.serving_size_g === 100;
                              const label = isPer100g ? "per 100g" : `per 1 ${item.unit !== "count" && item.unit ? item.unit : "item"} (~${serving}g)`;
                              return `🔥 ${calPerItem} kcal · 🥩 ${proPerItem}g protein (${label})`;
                            })()}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="px-3 sm:px-5 py-3.5">
                        <span className={`font-semibold text-sm sm:text-base ${item.quantity <= 1 ? "text-amber-600" : "text-zinc-700"}`}>
                          {item.quantity} {item.unit !== "count" && <span className="text-xs text-zinc-500 font-normal">{item.unit}</span>}
                        </span>
                      </TableCell>
                      <TableCell className="px-3 sm:px-5 py-3.5 text-zinc-500 text-xs capitalize hidden md:table-cell">
                        {item.category?.replace("_", " ") || "—"}
                      </TableCell>
                      <TableCell className="px-3 sm:px-5 py-3.5">
                        {item.expiry_date ? (
                          isExpired ? (
                            <Badge variant="destructive" className="text-[10px] sm:text-xs">Expired</Badge>
                          ) : isExpiring ? (
                            <Badge variant="outline" className="text-amber-600 border-amber-300 animate-pulse bg-amber-50 text-[10px] sm:text-xs">{days}d left</Badge>
                          ) : (
                            <span className="text-zinc-600 text-xs sm:text-sm">{item.expiry_date}</span>
                          )
                        ) : (
                          <span className="text-zinc-400">—</span>
                        )}
                      </TableCell>
                      <TableCell className="px-3 sm:px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1 sm:gap-2">
                          {isExpiring && (
                            <Link
                              href="/donate"
                              className="opacity-100 sm:opacity-0 group-hover:opacity-100 bg-zinc-100 text-zinc-900 hover:bg-zinc-900 hover:text-white px-2 py-1 rounded text-xs transition"
                              title="Donate before it expires"
                            >
                              Donate
                            </Link>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "h-8 w-8 opacity-100 sm:opacity-0 group-hover:opacity-100 transition")}>
                              <MoreHorizontal className="h-4 w-4 text-zinc-500" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {item.quantity > 1 ? (
                                <>
                                  <DropdownMenuItem className="text-green-600 font-medium" onClick={() => handleConsume && handleConsume(item, 1)}>
                                    Consume 1
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="text-green-600 font-medium" onClick={() => handleConsume && handleConsume(item, item.quantity)}>
                                    Consume All
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleDelete(item, 1)}>
                                    Remove 1 (Trash)
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(item, item.quantity)}>
                                    Remove All (Trash)
                                  </DropdownMenuItem>
                                </>
                              ) : (
                                <>
                                  <DropdownMenuItem className="text-green-600 font-medium" onClick={() => handleConsume && handleConsume(item, 1)}>
                                    Consume Item
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(item, 1)}>
                                    Remove Item (Trash)
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
