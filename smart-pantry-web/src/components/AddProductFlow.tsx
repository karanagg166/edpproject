"use client";

/**
 * AddProductFlow — 5-step orchestration component.
 *
 * idle → scanning → loading → manual → done
 *
 * On barcode detect:
 *   1. Normalize barcode (strip IVM- etc.)
 *   2. Waterfall lookup: Supabase cache → Open Food Facts → null
 *   3. If found: pre-fill manual form with green "✓ Found" badge
 *   4. If not found: empty form with amber "Fill in manually" badge
 *   5. On save → upsert to barcode_cache + call onProductReady(product)
 *
 * onProductReady gives the parent everything it needs to pre-fill
 * the AddItemModal (name, brand, barcode) — keeps this component
 * decoupled from the pantry schema.
 */

import { useState } from "react";
import { Scan, PenLine, CheckCircle, Loader2 } from "lucide-react";
import { BarcodeScanner } from "@/components/BarcodeScanner";
import {
  lookupBarcodeWeb,
  saveToCache,
  normalizeBarcode,
  LOOKUP_SOURCE_LABELS,
  type CachedProduct,
  type LookupSource,
} from "@/lib/barcode-lookup";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Step = "idle" | "scanning" | "loading" | "manual" | "done";

type FormState = {
  barcode: string;
  name: string;
  brand: string;
  category: string;
  quantity: string;
};

interface AddProductFlowProps {
  /** Called after a product is confirmed — parent pre-fills AddItemModal */
  onProductReady: (product: { name: string; brand?: string; barcode?: string }) => void;
}

export function AddProductFlow({ onProductReady }: AddProductFlowProps) {
  const [step, setStep] = useState<Step>("idle");
  /** Where the product metadata came from (for UI + barcode_cache.source) */
  const [lookupSource, setLookupSource] = useState<LookupSource | null>(null);
  const [form, setForm] = useState<FormState>({
    barcode: "",
    name: "",
    brand: "",
    category: "",
    quantity: "",
  });

  // -----------------------------------------------------------------------
  // Called by BarcodeScanner after a confirmed, high-confidence read
  // -----------------------------------------------------------------------
  async function handleBarcodeDetected(raw: string) {
    setStep("loading");
    const barcode = normalizeBarcode(raw);

    try {
      const result = await lookupBarcodeWeb(raw);

      if (result.source !== "not_found" && result.product) {
        const p: CachedProduct = result.product;
        setLookupSource(result.source);
        setForm({
          barcode: p.barcode || barcode,
          name: p.product_name,
          brand: p.brand ?? "",
          category: p.category ?? "",
          quantity: p.serving_size ?? "",
        });
      } else {
        setLookupSource(null);
        setForm({ barcode, name: "", brand: "", category: "", quantity: "" });
      }
    } catch {
      setLookupSource(null);
      setForm({ barcode, name: "", brand: "", category: "", quantity: "" });
    } finally {
      setStep("manual");
    }
  }

  // -----------------------------------------------------------------------
  // Save to barcode_cache and hand off to parent
  // -----------------------------------------------------------------------
  async function handleSave() {
    const product: CachedProduct = {
      barcode: form.barcode,
      product_name: form.name,
      brand: form.brand || undefined,
      category: form.category || undefined,
      serving_size: form.quantity || undefined,
      source: lookupSource ?? "manual",
    };

    // Upsert to barcode_cache — grows the community DB
    if (form.barcode) {
      await saveToCache(product);
    }

    // Notify parent to open AddItemModal pre-filled
    onProductReady({
      name: form.name,
      brand: form.brand || undefined,
      barcode: form.barcode || undefined,
    });

    setStep("done");
  }

  function reset() {
    setStep("idle");
    setLookupSource(null);
    setForm({ barcode: "", name: "", brand: "", category: "", quantity: "" });
  }

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------
  return (
    <div>
      {/* ── IDLE ── */}
      {step === "idle" && (
        <div className="flex gap-2">
          <Button
            id="scan-barcode-btn"
            variant="outline"
            size="sm"
            onClick={() => setStep("scanning")}
            className="gap-2 text-zinc-700 border-zinc-300"
          >
            <Scan size={15} />
            Scan Barcode
          </Button>
          <Button
            id="add-manually-btn"
            variant="ghost"
            size="sm"
            onClick={() => {
              reset();
              setStep("manual");
            }}
            className="gap-2 text-zinc-500"
          >
            <PenLine size={15} />
            Manual Entry
          </Button>
        </div>
      )}

      {/* ── SCANNING ── */}
      {step === "scanning" && (
        <BarcodeScanner
          onDetected={handleBarcodeDetected}
          onClose={() => setStep("idle")}
        />
      )}

      {/* ── LOADING ── */}
      {step === "loading" && (
        <div className="flex flex-col gap-1 text-sm text-zinc-500 py-2">
          <div className="flex items-center gap-2">
            <Loader2 size={15} className="animate-spin" />
            Looking up barcode…
          </div>
          <p className="text-xs text-zinc-400 pl-[23px]">
            Querying Open Food Facts, India OFF, UPC database… (max ~20s)
          </p>
        </div>
      )}

      {/* ── MANUAL ENTRY FORM ── */}
      {step === "manual" && (
        <div className="flex flex-col gap-3 max-w-sm mt-1">
          {/* Status badge */}
          {lookupSource ? (
            <p className="text-xs text-green-600 font-medium flex items-center gap-1">
              <CheckCircle size={12} /> Found on {LOOKUP_SOURCE_LABELS[lookupSource]} — confirm details below
            </p>
          ) : form.barcode ? (
            <p className="text-xs text-amber-600 font-medium">
              ⚠ Barcode not found — please fill in manually
            </p>
          ) : null}

          {form.barcode && (
            <p className="text-xs text-zinc-400">
              Barcode: <span className="font-mono">{form.barcode}</span>
            </p>
          )}

          <Input
            id="product-name-input"
            placeholder="Product name *"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
          <Input
            id="product-brand-input"
            placeholder="Brand (optional)"
            value={form.brand}
            onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))}
          />
          <Input
            id="product-category-input"
            placeholder="Category (optional)"
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
          />
          <Input
            id="product-quantity-input"
            placeholder="Quantity / size e.g. 500g (optional)"
            value={form.quantity}
            onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
          />

          <div className="flex gap-2 pt-1">
            <Button
              id="save-product-btn"
              onClick={handleSave}
              disabled={!form.name.trim()}
              className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-white"
            >
              Continue to Add
            </Button>
            <Button
              id="cancel-product-btn"
              variant="outline"
              onClick={reset}
              className="border-zinc-200 text-zinc-600"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* ── DONE ── */}
      {step === "done" && (
        <div className="flex items-center gap-3 py-1">
          <p className="text-sm text-green-600 font-medium flex items-center gap-1.5">
            <CheckCircle size={14} /> Product ready — finish adding it above
          </p>
          <button
            id="scan-another-btn"
            onClick={reset}
            className="text-xs text-zinc-400 hover:text-zinc-600 underline"
          >
            Scan another
          </button>
        </div>
      )}
    </div>
  );
}
