import React, { useState } from "react";
import {
  X,
  Calendar,
  Wallet as WalletIcon,
  Check,
  DollarSign,
} from "lucide-react";
import { ShoppingItem, Wallet } from "../types";
import CustomSelect from "./CustomSelect";
import CustomDatePicker from "./CustomDatePicker";
import { cn } from "../utils";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (
    item: ShoppingItem,
    finalAmount: number,
    walletId: string,
    date: string,
    quantityBought: number,
  ) => void;
  item: ShoppingItem;
  wallets: Wallet[];
  defaultWalletId?: string | null;
  formatAmount: (amount: number) => string;
  currency: string;
}

const PurchaseConfirmationModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onConfirm,
  item,
  wallets,
  defaultWalletId,
  formatAmount,
  currency,
}) => {
  const [finalAmount, setFinalAmount] = useState(
    item.estimatedAmount.toString(),
  );
  const [walletId, setWalletId] = useState(
    item.walletId || defaultWalletId || "",
  );
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [quantity, setQuantity] = useState(
    item.quantity > 1 ? "1" : item.quantity.toString(),
  );

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletId && !document.querySelector(".driver-active")) {
      alert("Please select a wallet");
      return;
    }

    onConfirm(
      item,
      parseFloat(finalAmount) || 0,
      walletId || (wallets[0]?.id as string), // Fallback for tour
      new Date(date).toISOString(),
      parseInt(quantity) || 1,
    );
    onClose();
  };

  const maxQty = item.quantity;
  const isPartial = parseInt(quantity) < maxQty;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden flex flex-col">
        <div className="p-6 border-b border-slate-100 dark:border-zinc-800 flex justify-between items-center">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Check className="text-emerald-500" />
            Mark as Bought
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-slate-50 dark:bg-zinc-800/50 p-4 rounded-2xl border border-slate-100 dark:border-zinc-800">
            <div className="text-sm text-slate-500 mb-1">Item</div>
            <div className="font-bold text-lg">{item.name}</div>
            <div className="text-sm text-slate-400">
              Est: {formatAmount(item.estimatedAmount)}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
              Final Amount Spent
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm">
                {currency}
              </span>
              <input
                type="number"
                step="0.01"
                value={finalAmount}
                onChange={(e) => setFinalAmount(e.target.value)}
                className="w-full pl-12 p-3 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-lg tour-shop-confirm-amount"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                Quantity Bought
              </label>
              <input
                type="number"
                min="1"
                max={maxQty}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full p-3 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <div className="text-xs text-slate-400 mt-1">
                Max: {maxQty} {isPartial && "(Partial Buy)"}
              </div>
            </div>
            <div>
              <CustomDatePicker
                label="Date"
                value={date}
                onChange={setDate}
                maxDate={new Date().toISOString().split("T")[0]}
              />
            </div>
          </div>

          <CustomSelect
            label="Paid From Wallet"
            value={walletId}
            onChange={setWalletId}
            options={wallets.map((w) => ({ value: w.id, label: w.name }))}
            placeholder="Select Wallet"
          />
        </div>

        <div className="p-6 border-t border-slate-100 dark:border-zinc-800 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-xl font-bold bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 py-3 px-4 rounded-xl font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-500/20 tour-shop-confirm-btn"
          >
            Confirm Purchase
          </button>
        </div>
      </div>
    </div>
  );
};

export default PurchaseConfirmationModal;
