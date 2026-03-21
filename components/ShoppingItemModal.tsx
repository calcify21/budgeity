import React, { useState, useEffect, useRef } from "react";
import { X, Calendar, Hash, Tag, AlertCircle } from "lucide-react";
import { ShoppingItem, Category, Wallet } from "../types";
import CustomSelect from "./CustomSelect";
import { cn } from "../utils";
import { useScrollToError } from "../hooks/useScrollToError";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    item: Omit<
      ShoppingItem,
      "id" | "status" | "createdAt" | "linkedTransactionIds"
    >,
  ) => void;
  initialItem?: ShoppingItem;
  categories: Category[];
  wallets: Wallet[];
  defaultWalletId?: string | null;
}

const ShoppingItemModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSave,
  initialItem,
  categories,
  wallets,
  defaultWalletId,
}) => {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [subCategoryId, setSubCategoryId] = useState("");
  const [walletId, setWalletId] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [quantity, setQuantity] = useState("1");
  const [error, setError] = useState("");

  const scrollRef = useRef<HTMLDivElement>(null);
  useScrollToError(error, scrollRef);

  useEffect(() => {
    if (isOpen) {
      if (initialItem) {
        setName(initialItem.name);
        setAmount(initialItem.estimatedAmount.toString());
        setCategoryId(initialItem.categoryId);
        setSubCategoryId(initialItem.subCategoryId || "");
        setWalletId(initialItem.walletId || "");
        setPriority(initialItem.priority || "medium");
        setQuantity(initialItem.quantity?.toString() || "1");
      } else {
        setName("");
        setAmount("");
        setCategoryId(categories[0]?.id || "");
        setSubCategoryId("");
        setWalletId(defaultWalletId || "");
        setPriority("medium");
        setQuantity("1");
      }
      setError("");
    }
  }, [isOpen, initialItem, categories, defaultWalletId]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let finalName = name.trim();
    if (!finalName) {
      if (document.querySelector(".driver-active")) {
        finalName = "Tour Demo Item";
        setName(finalName);
      } else {
        setError("Item name is required");
        return;
      }
    }

    onSave({
      name: finalName,
      estimatedAmount: parseFloat(amount) || 0,
      categoryId,
      subCategoryId: subCategoryId || undefined,
      walletId: walletId || null,
      priority,
      quantity: parseInt(quantity) || 1,
    });
    onClose();
  };

  const selectedCategory = categories.find((c) => c.id === categoryId);
  const subCategories = selectedCategory?.subCategories || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-zinc-800 flex justify-between items-center">
          <h2 className="text-xl font-bold">
            {initialItem ? "Edit Item" : "Add Shopping Item"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <div ref={scrollRef} className="p-6 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-900/20 text-rose-600 rounded-xl text-sm flex items-center gap-2">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
              Item Name
            </label>
            <input
              value={name}
              autoFocus
              onChange={(e) => setName(e.target.value)}
              placeholder="What do you need?"
              className="w-full p-4 text-lg font-medium bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-2xl outline-none focus:ring-2 focus:ring-brand-500 tour-shop-input-name"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                Est. Cost
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full p-3 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-brand-500 tour-shop-input-amount"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                Quantity
              </label>
              <input
                type="number"
                value={quantity}
                min="1"
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full p-3 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <CustomSelect
              label="Priority"
              value={priority}
              onChange={(v) => setPriority(v as any)}
              options={[
                { value: "low", label: "Low", color: "#22c55e" },
                { value: "medium", label: "Medium", color: "#f59e0b" },
                { value: "high", label: "High", color: "#ef4444" },
              ]}
              placeholder="Priority"
            />
            <CustomSelect
              label="Wallet (Preferred)"
              value={walletId}
              onChange={setWalletId}
              options={[
                { value: "", label: "Default" },
                ...wallets.map((w) => ({ value: w.id, label: w.name })),
              ]}
              placeholder="Select Wallet"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <CustomSelect
              label="Category"
              value={categoryId}
              onChange={(v) => {
                setCategoryId(v);
                setSubCategoryId("");
              }}
              options={categories
                .filter((c) => c.type === "expense")
                .map((c) => ({ value: c.id, label: c.name, color: c.color }))}
              placeholder="Select Category"
            />
            <CustomSelect
              label="Sub-Category"
              value={subCategoryId}
              onChange={setSubCategoryId}
              options={[
                { value: "", label: "None" },
                ...subCategories.map((s) => ({ value: s.id, label: s.name })),
              ]}
              placeholder="None"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 dark:border-zinc-800 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-xl font-bold bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 py-3 px-4 rounded-xl font-bold bg-brand-600 text-white hover:bg-brand-700 transition-colors shadow-lg shadow-brand-500/20 tour-shop-save-btn"
          >
            {initialItem ? "Save Changes" : "Add Item"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShoppingItemModal;
