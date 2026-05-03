import { useState } from "react";
import { X, Camera } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


export default function AddItemModal({ showAddModal, setShowAddModal, addForm, setAddForm, handleAdd }: {
  showAddModal: boolean;
  setShowAddModal: (b: boolean) => void;
  addForm: {
    name: string;
    category: string;
    quantity: number;
    expiry_date: string;
    storage_type: string;
    barcode?: string;
    brand?: string;
  };
  setAddForm: any;
  handleAdd: () => void;
}) {


  return (
    <>
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Pantry Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Barcode / brand info — shown when pre-filled by scanner */}
            {(addForm.barcode || addForm.brand) && (
              <div className="flex items-center gap-2 flex-wrap">
                {addForm.barcode && (
                  <span className="text-xs font-mono bg-zinc-100 text-zinc-500 px-2 py-0.5 rounded">
                    🔍 {addForm.barcode}
                  </span>
                )}
                {addForm.brand && (
                  <span className="text-xs bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded">
                    {addForm.brand}
                  </span>
                )}
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Item Name</label>
              <Input
                value={addForm.name}
                onChange={(e) => setAddForm((f: any) => ({ ...f, name: e.target.value }))}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                placeholder="e.g. Chicken Breast"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Quantity</label>
              <Input
                type="number"
                min={1}
                value={addForm.quantity}
                onChange={(e) => setAddForm((f: any) => ({ ...f, quantity: parseInt(e.target.value) || 1 }))}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Storage Type</label>
                <Select value={addForm.storage_type} onValueChange={(val) => setAddForm((f: any) => ({ ...f, storage_type: val }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Storage type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fridge">Fridge</SelectItem>
                    <SelectItem value="freezer">Freezer</SelectItem>
                    <SelectItem value="pantry">Pantry</SelectItem>
                    <SelectItem value="counter">Counter</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Expiry Date</label>
                  {addForm.expiry_date && (
                    <span className="text-xs text-emerald-600 font-medium">
                      ✅ Detected from scan
                    </span>
                  )}
                </div>
                <Input
                  type="date"
                  value={addForm.expiry_date}
                  onChange={(e) => setAddForm((f: any) => ({ ...f, expiry_date: e.target.value }))}
                />
              </div>
            </div>
            
            <Button onClick={handleAdd} className="w-full mt-4 bg-zinc-900 hover:bg-zinc-800 text-white">
              Add to Pantry
            </Button>
          </div>
        </DialogContent>
      </Dialog>


    </>
  );
}
