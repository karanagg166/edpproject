import { X } from "lucide-react";
import { CATEGORIES } from "@/app/dashboard/constants";

export default function AddItemModal({ showAddModal, setShowAddModal, addForm, setAddForm, handleAdd }: { showAddModal: boolean, setShowAddModal: (b: boolean) => void, addForm: any, setAddForm: any, handleAdd: () => void }) {
  if (!showAddModal) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-lg font-bold text-white">Add Pantry Item</h3>
          <button onClick={() => setShowAddModal(false)} className="text-slate-500 hover:text-slate-300">
            <X size={20} />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-xs text-slate-400 block mb-1">Item Name</label>
            <input
              value={addForm.name}
              onChange={(e) => setAddForm((f: any) => ({ ...f, name: e.target.value }))}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              placeholder="e.g. Chicken Breast"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:border-emerald-500 outline-none"
            />
          </div>
          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Quantity</label>
              <input
                type="number"
                min={1}
                value={addForm.quantity}
                onChange={(e) => setAddForm((f: any) => ({ ...f, quantity: parseInt(e.target.value) || 1 }))}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:border-emerald-500 outline-none"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Storage Type</label>
              <select
                value={addForm.storage_type}
                onChange={(e) => setAddForm((f: any) => ({ ...f, storage_type: e.target.value }))}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:border-emerald-500 outline-none"
              >
                <option value="fridge">Fridge</option>
                <option value="freezer">Freezer</option>
                <option value="pantry">Pantry</option>
                <option value="counter">Counter</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Expiry Date</label>
              <input
                type="date"
                value={addForm.expiry_date}
                onChange={(e) => setAddForm((f: any) => ({ ...f, expiry_date: e.target.value }))}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:border-emerald-500 outline-none"
              />
            </div>
          </div>
          <button
            onClick={handleAdd}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-3 rounded-xl transition mt-2"
          >
            Add to Pantry
          </button>
        </div>
      </div>
    </div>
  );
}
