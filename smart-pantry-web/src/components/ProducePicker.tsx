"use client";

/**
 * ProducePicker
 *
 * Full-screen offline produce picker for fresh fruits, vegetables, herbs, and
 * nuts/seeds. Used when there is no barcode to scan.
 *
 * Returns a CachedProduct-compatible object so AddProductFlow can treat it
 * like any other lookup result.
 */

import { useState, useMemo, useCallback } from "react";
import { Search, X, ChevronLeft } from "lucide-react";
import {
  PRODUCE_LIBRARY,
  PRODUCE_CATEGORY_LABELS,
  searchProduce,
  type ProduceItem,
} from "@/lib/produce-library";
import type { CachedProduct } from "@/lib/barcode-lookup";

type Props = {
  onSelect: (product: CachedProduct) => void;
  onClose: () => void;
};

type Category = ProduceItem["category"] | "all";

const CATEGORIES: { id: Category; label: string }[] = [
  { id: "all",        label: "All" },
  { id: "fruits",     label: "Fruits 🍎" },
  { id: "vegetables", label: "Vegetables 🥦" },
  { id: "herbs",      label: "Herbs 🌿" },
  { id: "nuts_seeds", label: "Nuts & Seeds 🥜" },
];

function ProduceCard({
  item,
  onTap,
}: {
  item: ProduceItem;
  onTap: () => void;
}) {
  return (
    <button
      id={`produce-${item.id}`}
      onClick={onTap}
      className="flex items-center gap-3 w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 text-left hover:bg-zinc-50 active:scale-[0.98] transition-all duration-150 shadow-sm"
    >
      <span className="text-2xl select-none">{item.emoji}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-zinc-800 truncate">{item.name}</p>
        {item.nameHi && (
          <p className="text-xs text-zinc-400">{item.nameHi}</p>
        )}
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-xs text-zinc-500 leading-tight">
          <span className="font-medium text-zinc-700">{item.calories_100g}</span>{" "}
          kcal
        </p>
        <p className="text-xs text-zinc-400">per 100g</p>
      </div>
    </button>
  );
}

export function ProducePicker({ onSelect, onClose }: Props) {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<Category>("all");

  const items = useMemo(() => {
    const searched = searchProduce(query);
    if (activeCategory === "all") return searched;
    return searched.filter((p) => p.category === activeCategory);
  }, [query, activeCategory]);

  const handleSelect = useCallback(
    (item: ProduceItem) => {
      const syntheticBarcode = `PRODUCE-${item.id.toUpperCase()}`;
      const product: CachedProduct = {
        barcode: syntheticBarcode,
        product_name: item.name,
        brand: item.nameHi ?? "",
        category: PRODUCE_CATEGORY_LABELS[item.category],
        calories: item.calories_100g,
        protein: item.protein_100g,
        fat: item.fat_100g,
        carbs: item.carbs_100g,
        image_url: undefined,
        serving_size: `100${item.defaultUnit}`,
        source: "produce_library",
      };
      onSelect(product);
    },
    [onSelect]
  );

  const grouped = useMemo(() => {
    if (activeCategory !== "all" || query) return null;
    const map = new Map<ProduceItem["category"], ProduceItem[]>();
    for (const item of PRODUCE_LIBRARY) {
      const list = map.get(item.category) ?? [];
      list.push(item);
      map.set(item.category, list);
    }
    return map;
  }, [activeCategory, query]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-zinc-50">
      {/* Header */}
      <div className="bg-white border-b border-zinc-200 px-4 pt-safe pt-4 pb-3">
        <div className="flex items-center gap-3 mb-3">
          <button
            id="produce-picker-back"
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-zinc-100 transition-colors"
          >
            <ChevronLeft size={20} className="text-zinc-600" />
          </button>
          <div className="flex-1">
            <h2 className="text-base font-semibold text-zinc-800">Fresh Produce</h2>
            <p className="text-xs text-zinc-400">Pick an item to add</p>
          </div>
          <button
            id="produce-picker-close"
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-zinc-100 transition-colors"
          >
            <X size={18} className="text-zinc-500" />
          </button>
        </div>

        {/* Search bar */}
        <div className="relative">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
          />
          <input
            id="produce-search"
            type="search"
            placeholder="Search by name or हिंदी…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full h-9 pl-9 pr-4 rounded-lg bg-zinc-100 text-sm text-zinc-800 placeholder-zinc-400 outline-none focus:ring-2 focus:ring-zinc-300"
          />
        </div>
      </div>

      {/* Category tabs */}
      <div className="bg-white border-b border-zinc-200 px-4 overflow-x-auto">
        <div className="flex gap-1 py-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              id={`produce-cat-${cat.id}`}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                activeCategory === cat.id
                  ? "bg-zinc-800 text-white"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Item list */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {/* Grouped view — only when no search and category=all */}
        {grouped
          ? Array.from(grouped.entries()).map(([cat, catItems]) => (
              <section key={cat}>
                <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                  {PRODUCE_CATEGORY_LABELS[cat]}
                </h3>
                <div className="space-y-2">
                  {catItems.map((item) => (
                    <ProduceCard key={item.id} item={item} onTap={() => handleSelect(item)} />
                  ))}
                </div>
              </section>
            ))
          : items.length > 0
          ? (
              <div className="space-y-2">
                {items.map((item) => (
                  <ProduceCard key={item.id} item={item} onTap={() => handleSelect(item)} />
                ))}
              </div>
            )
          : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <span className="text-4xl mb-3">🔍</span>
                <p className="text-zinc-500 text-sm">No results for &ldquo;{query}&rdquo;</p>
                <p className="text-zinc-400 text-xs mt-1">Try an English name or Hindi word</p>
              </div>
            )}
      </div>
    </div>
  );
}
