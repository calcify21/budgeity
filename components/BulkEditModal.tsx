import React, { useState, useMemo } from "react";
import { X, Check, FileText, ArrowRightLeft } from "lucide-react";
import { useData } from "../context/DataContext";
import { useToast } from "../context/ToastContext";
import { Transaction } from "../types";
import { cn, formatCurrency } from "../utils";
import { motion, AnimatePresence } from "framer-motion";
import CustomSelect, { SelectOption } from "./CustomSelect";
import { useEscapeKey } from "../hooks/useEscapeKey";

// Fix: Cast motion components to any to resolve type errors
const MotionDiv = motion.div as any;

interface Props {
  selectedTransactions: Transaction[];
  onClose: () => void;
  onSuccess: () => void;
}

const BulkEditModal: React.FC<Props> = ({
  selectedTransactions,
  onClose,
  onSuccess,
}) => {
  const {
    wallets,
    goals,
    categories,
    updateMultipleTransactions,
  } = useData();
  const { success, error } = useToast();

  useEscapeKey(true, onClose);

  const [categoryId, setCategoryId] = useState<string>("");
  const [walletId, setWalletId] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  // Helper for Categories
  const isAllExpense = selectedTransactions.every((t) => t.type === "expense");
  const isAllIncome = selectedTransactions.every((t) => t.type === "income");
  const hasMixedTypes = !isAllExpense && !isAllIncome;

  const filteredCategories = useMemo(() => {
    if (isAllExpense) return categories.filter((c) => c.type === "expense");
    if (isAllIncome) return categories.filter((c) => c.type === "income");
    return []; // No categories available for mixed types
  }, [categories, isAllExpense, isAllIncome]);

  const categoryOptions = useMemo(() => {
    const opts: SelectOption[] = [{ value: "", label: "No Change" }];
    filteredCategories.forEach((c) => {
      opts.push({
        value: c.id,
        label: c.name,
        color: c.color,
      });
    });
    return opts;
  }, [filteredCategories]);

  const walletOptions = useMemo(() => {
    const opts: SelectOption[] = [{ value: "", label: "No Change" }];
    const activeWallets = wallets.filter((w) => !w.archived);

    if (activeWallets.length > 0) {
      opts.push({
        value: "header_wallets",
        label: "Wallets",
        isHeader: true,
      });
      activeWallets.forEach((w) => {
        opts.push({
          value: w.id,
          label: w.name,
          color: w.color,
          icon: w.icon,
        });
      });
    }

    const activeGoals = goals.filter(
      (g) => g.status === "active" || g.status === "achieved"
    );

    if (activeGoals.length > 0) {
      opts.push({
        value: "header_goals",
        label: "Savings Goals",
        isHeader: true,
      });
      activeGoals.forEach((g) => {
        opts.push({
          value: g.id,
          label: g.name,
          color: g.color,
          icon: g.icon,
        });
      });
    }

    return opts;
  }, [wallets, goals]);

  const handleSave = () => {
    if (!categoryId && !walletId) {
      onClose(); // Nothing to change
      return;
    }

    setIsSaving(true);
    try {
      const updatedTxs = selectedTransactions.map((tx) => {
        const changes: Partial<Transaction> = {};

        if (categoryId && tx.type !== "transfer") {
          changes.categoryId = categoryId;
          // Optionally, remove subCategoryId since it's now invalid for the new category
          changes.subCategoryId = undefined;
        }

        if (walletId) {
          if (tx.type === "expense") {
            changes.fromWalletId = walletId;
          } else if (tx.type === "income") {
            changes.toWalletId = walletId;
          }
          // For transfers, we'd need to know if changing source or dest.
          // Due to ambiguity, we skip changing wallet for transfers in bulk.
        }

        return { ...tx, ...changes } as Transaction;
      });

      updateMultipleTransactions(updatedTxs);
      success(`Updated ${selectedTransactions.length} transaction(s)`);
      onSuccess();
    } catch (err: any) {
      error(err.message || "Failed to update transactions");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] overflow-y-auto">
      <div className="flex min-h-full items-end justify-center p-0 sm:items-center sm:p-4">
        <AnimatePresence>
          <MotionDiv
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md"
            onClick={onClose}
          />
          <MotionDiv
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="relative w-full sm:max-w-sm bg-white dark:bg-zinc-900 sm:rounded-[2.5rem] rounded-t-[2.5rem] shadow-2xl overflow-hidden border border-slate-200 dark:border-white/10 flex flex-col max-h-[90vh]"
          >
        <div className="p-6 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-black/20 shrink-0">
          <h2 className="text-xl font-bold dark:text-white">Bulk Edit</h2>
          <button
            onClick={onClose}
            className="p-2 -mr-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-zinc-800 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh] custom-scrollbar space-y-6">
          <div className="bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300 px-4 py-3 rounded-2xl text-sm font-medium">
            Editing {selectedTransactions.length} selected transaction(s).
          </div>

          <div className="space-y-4">
            {hasMixedTypes ? (
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Change Category
                </label>
                <div className="bg-slate-50 dark:bg-zinc-800/50 p-3 rounded-2xl border border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-slate-400 text-sm">
                  Cannot change category when a mix of income, expenses, or transfers are selected.
                </div>
              </div>
            ) : (
              <>
                <CustomSelect
                  label="Change Category"
                  value={categoryId}
                  onChange={setCategoryId}
                  options={categoryOptions}
                  searchable
                />
                <p className="text-xs text-slate-500 -mt-2">
                  Note: Transfers will be ignored for category changes.
                </p>
              </>
            )}

            <CustomSelect
              label="Change Wallet"
              value={walletId}
              onChange={setWalletId}
              options={walletOptions}
            />
            <p className="text-xs text-slate-500 -mt-2">
              Note: Transfers will be ignored for wallet changes.
            </p>
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-black/50 shrink-0 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-slate-300 font-bold rounded-2xl hover:bg-slate-50 dark:hover:bg-zinc-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || (!categoryId && !walletId)}
            className="flex-1 py-3 bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-brand-700 text-white font-bold rounded-2xl shadow-lg shadow-brand-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <Check size={18} /> Save
          </button>
        </div>
      </MotionDiv>
    </AnimatePresence>
  </div>
</div>
  );
};

export default BulkEditModal;
