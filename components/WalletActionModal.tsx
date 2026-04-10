import React, { useState } from "react";
import { useData } from "../context/DataContext";
import { motion } from "framer-motion";
import { AlertTriangle, Trash2, X, AlertCircle } from "lucide-react";
import CustomSelect from "./CustomSelect";
import { cn } from "../utils";

// Cast motion component to avoid type issues in some environments
const MotionDiv = motion.div as any;

interface Props {
  walletId: string;
  onClose: () => void;
}

type ActionOption = "move" | "delete" | "archive";

const WalletActionModal: React.FC<Props> = ({ walletId, onClose }) => {
  const {
    wallets,
    transactions,
    deleteWalletWithTransactions,
    moveWalletTransactions,
    archiveWallet,
    formatAmount,
  } = useData();
  const [action, setAction] = useState<ActionOption>("move");
  const [targetWalletId, setTargetWalletId] = useState("");

  const wallet = wallets.find((w) => w.id === walletId);
  if (!wallet) return null;

  // Count linked transactions
  const linkedTxs = transactions.filter(
    (t) => t.fromWalletId === walletId || t.toWalletId === walletId,
  );
  const txCount = linkedTxs.length;

  // Filter wallets for move target (exclude current)
  const otherWallets = wallets.filter((w) => w.id !== walletId && !w.archived);

  const handleConfirm = () => {
    if (action === "move") {
      if (!targetWalletId) return;
      moveWalletTransactions(walletId, targetWalletId);
    } else if (action === "delete") {
      deleteWalletWithTransactions(walletId);
    } else if (action === "archive") {
      archiveWallet(walletId, true);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <MotionDiv
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl relative z-10 p-8 border border-slate-100 dark:border-white/10"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <AlertTriangle className="text-amber-500" /> Manage Wallet Deletion
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="mb-6">
          <p className="text-slate-600 dark:text-slate-300 font-medium text-lg">
            This wallet contains{" "}
            <strong className="text-brand-600 dark:text-brand-400">
              {txCount} transaction{txCount !== 1 ? "s" : ""}
            </strong>
            .
          </p>
          <p className="text-slate-500 text-sm mt-1">
            What would you like to do with them?
          </p>
        </div>

        <div className="space-y-4 mb-8">
          {/* Option A: Move */}
          <div
            onClick={() => otherWallets.length > 0 && setAction("move")}
            className={cn(
              "w-full text-left p-4 rounded-2xl border-2 transition-all relative cursor-pointer",
              action === "move"
                ? "border-brand-500 bg-brand-50 dark:bg-brand-900/10 ring-1 ring-brand-500"
                : "border-slate-100 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800",
              otherWallets.length === 0 && "opacity-50 cursor-not-allowed",
            )}
          >
            <div className="flex items-center gap-3 mb-1">
              <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center font-bold text-sm">
                A
              </div>
              <span className="font-bold">Move transactions</span>
              {action === "move" && (
                <span className="ml-auto text-xs bg-brand-200 text-brand-800 px-2 py-0.5 rounded-full">
                  Recommended
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 pl-11">
              Move history to another wallet, then delete this one.
            </p>

            {action === "move" && (
              <div className="mt-4 pl-11" onClick={(e) => e.stopPropagation()}>
                <CustomSelect
                  value={targetWalletId}
                  onChange={setTargetWalletId}
                  options={otherWallets.map((w) => ({
                    value: w.id,
                    label: w.name,
                    subLabel: formatAmount(w.balance),
                    color: w.color,
                  }))}
                  placeholder="Select destination wallet"
                />
              </div>
            )}
          </div>

          {/* Option B: Delete */}
          <div
            onClick={() => setAction("delete")}
            className={cn(
              "w-full text-left p-4 rounded-2xl border-2 transition-all relative cursor-pointer",
              action === "delete"
                ? "border-rose-500 bg-rose-50 dark:bg-rose-900/10 ring-1 ring-rose-500"
                : "border-slate-100 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800",
            )}
          >
            <div className="flex items-center gap-3 mb-1">
              <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center font-bold text-sm">
                B
              </div>
              <span className="font-bold text-rose-600">
                Permanently Delete
              </span>
            </div>
            <p className="text-xs text-slate-500 pl-11">
              Delete wallet and all its {txCount} transactions. Cannot be
              undone.
            </p>

            {action === "delete" && (
              <div className="mt-4 pl-11" onClick={(e) => e.stopPropagation()}>
                <div className="bg-rose-100 dark:bg-rose-900/30 p-3 rounded-xl flex items-start gap-2 text-rose-700 dark:text-rose-300 text-xs mb-3">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <span>
                    Warning: This will remove all income, expense, and transfer
                    records associated with <strong>{wallet.name}</strong>.
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Option C: Archive */}
          <div
            onClick={() => setAction("archive")}
            className={cn(
              "w-full text-left p-4 rounded-2xl border-2 transition-all relative cursor-pointer",
              action === "archive"
                ? "border-slate-500 bg-slate-50 dark:bg-slate-800 ring-1 ring-slate-500"
                : "border-slate-100 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800",
            )}
          >
            <div className="flex items-center gap-3 mb-1">
              <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm">
                C
              </div>
              <span className="font-bold">Archive Wallet</span>
            </div>
            <p className="text-xs text-slate-500 pl-11">
              Hide from new transactions but keep history and reports.
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={action === "move" && !targetWalletId}
            className={cn(
              "flex-1 py-3 font-bold text-white rounded-xl shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed",
              action === "delete"
                ? "bg-rose-600 hover:bg-rose-700"
                : "bg-brand-600 hover:bg-brand-700",
            )}
          >
            {action === "move" && "Move & Delete"}
            {action === "delete" && "Delete Everything"}
            {action === "archive" && "Archive Wallet"}
          </button>
        </div>
      </MotionDiv>
    </div>
  );
};

export default WalletActionModal;
