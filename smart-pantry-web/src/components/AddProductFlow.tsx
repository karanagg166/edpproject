"use client";

/**
 * AddProductFlow — 6-step orchestration component.
 *
 * idle → scanning → produce_pick → loading → manual → done
 *
 * On barcode detect:
 *   1. Normalize barcode (strip IVM- etc.)
 *   2. Waterfall lookup: Supabase cache → Open Food Facts → null
 *   3. If found: pre-fill manual form with green "✓ Found" badge
 *   4. If not found: empty form with amber "Fill in manually" badge
 *   5. On save → upsert to barcode_cache + call onProductReady(product)
 *
 * Fresh produce (no barcode):
 *   idle → produce_pick → manual (pre-filled from ProducePicker)
 *
 * onProductReady gives the parent everything it needs to pre-fill
 * the AddItemModal (name, brand, barcode) — keeps this component
 * decoupled from the pantry schema.
 */

import { useState, useCallback } from "react";
import { Scan, PenLine, CheckCircle, Loader2, Leaf } from "lucide-react";
import { BarcodeScanner } from "@/components/BarcodeScanner";
import { ProducePicker } from "@/components/ProducePicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Step = "idle" | "scanning" | "produce_pick" | "manual" | "done";

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

const EMPTY_FORM: FormState = {
  barcode: "",
  name: "",
  brand: "",
  category: "",
  quantity: "",
};

export function AddProductFlow({ onProductReady }: AddProductFlowProps) {
  const [step, setStep] = useState<Step>("idle");
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  // -------------------------------------------------------------------------
  // Called by ProducePicker when user selects a produce item
  // -------------------------------------------------------------------------
  const handleProduceSelect = useCallback((product: any) => {
    setForm({
      barcode: product.barcode || "",
      name: product.product_name,
      brand: product.brand ?? "",
      category: product.category ?? "",
      quantity: product.serving_size ?? "",
    });
    // Kick off the form step
    setStep("manual");
  }, []);

  // -------------------------------------------------------------------------
  // Hand off to parent
  // -------------------------------------------------------------------------
  async function handleSave() {
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
    setForm(EMPTY_FORM);
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <div>
      {/* ── IDLE ── */}
      {step === "idle" && (
        <div className="flex flex-wrap gap-2">
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
            id="add-produce-btn"
            variant="outline"
            size="sm"
            onClick={() => setStep("produce_pick")}
            className="gap-2 text-emerald-700 border-emerald-300 hover:bg-emerald-50"
          >
            <Leaf size={15} />
            Fresh Produce
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
            Manual
          </Button>
        </div>
      )}

      {/* ── SCANNING ── */}
      {step === "scanning" && (
        <BarcodeScanner
          onClose={() => setStep("idle")}
        />
      )}

      {/* ── PRODUCE PICKER ── */}
      {step === "produce_pick" && (
        <ProducePicker
          onSelect={handleProduceSelect}
          onClose={() => setStep("idle")}
        />
      )}

      {/* ── MANUAL ENTRY FORM ── */}
      {step === "manual" && (
        <div className="flex flex-col gap-3 max-w-sm mt-1">
          {/* Status badge */}
          {form.barcode ? (
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
