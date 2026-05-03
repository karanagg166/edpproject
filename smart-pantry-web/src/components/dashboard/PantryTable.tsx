import { RefreshCw, Package, Trash2, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { daysUntilExpiry } from "@/app/dashboard/constants";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

import { TableSkeleton } from "@/components/ui/skeletons";

export default function PantryTable({ loading, pantry, filtered, handleDelete, handleConsume }: { loading: boolean, pantry: any[], filtered: any[], handleDelete: (item: any, quantity?: number) => void, handleConsume?: (item: any, quantity?: number) => void }) {
  return (
    <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm min-w-0">
      {loading ? (
        <div className="p-4">
          <TableSkeleton rows={5} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-zinc-500">
          <Package size={40} className="mx-auto mb-3 opacity-30" />
          <p>{pantry.length === 0 ? "Your pantry is empty. Add an item!" : "No items match your filter."}</p>
        </div>
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
              {filtered.map((item) => {
                const days = daysUntilExpiry(item.expiry_date);
                const isExpiring = days !== null && days <= 3 && days >= 0;
                const isExpired = days !== null && days < 0;
                
                return (
                  <motion.tr
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                    transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                    className="border-b border-zinc-100 hover:bg-zinc-50 transition-colors group"
                  >
                    <TableCell className="px-3 sm:px-5 py-3">
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
                    <TableCell className="px-3 sm:px-5 py-3">
                      <span className={`font-semibold text-sm sm:text-base ${item.quantity <= 1 ? "text-amber-600" : "text-zinc-700"}`}>
                        {item.quantity} {item.unit !== "count" && <span className="text-xs text-zinc-500 font-normal">{item.unit}</span>}
                      </span>
                    </TableCell>
                    <TableCell className="px-3 sm:px-5 py-3 text-zinc-500 text-xs capitalize hidden md:table-cell">
                      {item.category?.replace("_", " ") || "—"}
                    </TableCell>
                    <TableCell className="px-3 sm:px-5 py-3">
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
                    <TableCell className="px-3 sm:px-5 py-3 text-right">
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
