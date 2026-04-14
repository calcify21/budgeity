import React, { useState, useEffect, useRef } from "react";
import CustomDatePicker from "./CustomDatePicker";
import { useData } from "../context/DataContext";
import { Budget } from "../types";
import { X, Calendar, AlertCircle } from "lucide-react";
import { useToast } from "../context/ToastContext";
import { motion } from "framer-motion";
import CustomSelect from "./CustomSelect";
import { cn } from "../utils";
import WalletModal from "./WalletModal";
import CategoryModal from "./CategoryModal";
import { useScrollToError } from "../hooks/useScrollToError";
import { useEscapeKey } from "../hooks/useEscapeKey";
import { useTranslation } from "react-i18next";

// Fix motion type
const MotionDiv = motion.div as any;

interface Props {
  onClose: () => void;
  budgetToEdit?: Budget;
}

import { COLORS } from "../constants";

const BudgetModal: React.FC<Props> = ({ onClose, budgetToEdit }) => {
  const { addBudget, updateBudget, categories, wallets, currency } = useData();
  const { t } = useTranslation();

  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [subCategoryId, setSubCategoryId] = useState("");
  const [walletId, setWalletId] = useState<string | null>(null); // null means all wallets
  const [period, setPeriod] = useState<"weekly" | "monthly" | "custom">(
    "monthly",
  );
  const [color, setColor] = useState(COLORS[0]);
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  const [showAddWallet, setShowAddWallet] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);

  useEffect(() => {
    if (budgetToEdit) {
      setName(budgetToEdit.name);
      setAmount(budgetToEdit.amount.toString());
      setCategoryId(budgetToEdit.categoryId);
      setSubCategoryId(budgetToEdit.subCategoryId || "");
      setWalletId(budgetToEdit.walletId);
      setPeriod(budgetToEdit.period);
      setColor(budgetToEdit.color);
      setCustomStartDate(budgetToEdit.customStartDate || "");
      setCustomEndDate(budgetToEdit.customEndDate || "");
    } else {
      // Default category
      const expenseCat = categories.find((c) => c.type === "expense");
      if (expenseCat) setCategoryId(expenseCat.id);
    }
  }, [budgetToEdit, categories]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const { success, error: toastError } = useToast();
  const [error, setError] = useState("");

  useScrollToError(error, scrollRef);
  useEscapeKey(true, onClose);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError(t("budgetModal.errNoName"));
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      setError(t("budgetModal.errInvalidAmount"));
      return;
    }
    if (!categoryId) {
      setError(t("budgetModal.errNoCategory"));
      return;
    }
    if (period === "custom" && (!customStartDate || !customEndDate)) {
      setError(t("budgetModal.errNoDates"));
      return;
    }

    const budgetData = {
      name,
      amount: parseFloat(amount),
      categoryId,
      subCategoryId: subCategoryId || undefined,
      walletId,
      period,
      color,
      customStartDate: period === "custom" ? customStartDate : undefined,
      customEndDate: period === "custom" ? customEndDate : undefined,
    };

    try {
      if (budgetToEdit) {
        updateBudget({
          ...budgetData,
          id: budgetToEdit.id,
          createdAt: budgetToEdit.createdAt,
        });
        success(t("budgetModal.budgetUpdated"));
      } else {
        addBudget(budgetData);
        success(t("budgetModal.budgetCreated"));
      }
      onClose();
    } catch (err: any) {
      toastError(err.message || t("budgetModal.errSave"));
    }
  };

  const periodOptions = [
    { value: "weekly", label: t("budgetModal.weekly") },
    { value: "monthly", label: t("budgetModal.monthly") },
    { value: "custom", label: t("budgetModal.customRange") },
  ];

  const categoryOptions = categories
    .filter((c) => c.type === "expense")
    .map((c) => ({ value: c.id, label: c.name, color: c.color }));

  const selectedCategory = categories.find((c) => c.id === categoryId);
  const subCategoryOptions = [
    { value: "", label: t("budgetModal.allSubCategories") },
    ...(selectedCategory?.subCategories?.map((s) => ({
      value: s.id,
      label: s.name,
    })) || []),
  ];

  // Add "All" option logic could be complex for categorization, keeping simple for MVP
  // But prompt says "Category (linked to expense categories)". Assuming single category per budget for now.

  const walletOptions = [
    { value: "all", label: t("budgetModal.allWallets") },
    ...wallets
      .filter((w) => !w.archived && w.type !== "savings")
      .map((w) => ({ value: w.id, label: w.name, color: w.color })),
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-end justify-center p-4 sm:items-center">
        <MotionDiv
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity tour-modal-overlay"
          onClick={onClose}
        />

        <MotionDiv
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-white/10 flex flex-col max-h-[90vh]"
        >
          <div className="flex justify-between items-center p-8 pb-4 shrink-0">
            <h2 className="text-xl font-bold">
              {budgetToEdit ? t("budgetModal.editBudget") : t("budgetModal.newBudget")}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div
            ref={scrollRef}
            className="px-8 pb-8 overflow-y-auto custom-scrollbar flex-1"
          >
            {error && (
              <div className="p-3 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 text-sm font-medium rounded-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2 mb-6">
                <AlertCircle size={18} /> {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Budget Name
                </label>
                <input
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setError("");
                  }}
                  placeholder={t("budgetModal.budgetNamePlaceholder")}
                  className={cn(
                    "w-full p-4 bg-slate-50 dark:bg-black border rounded-2xl outline-none focus:ring-2 focus:ring-brand-500 font-medium",
                    error && !name
                      ? "border-rose-300 dark:border-rose-900 focus:ring-rose-500"
                      : "border-slate-200 dark:border-zinc-800",
                    "tour-budget-name",
                  )}
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  {t("budgetModal.limitAmount")}
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                    {currency}
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => {
                      setAmount(e.target.value);
                      setError("");
                    }}
                    placeholder="0.00"
                    className={cn(
                      "w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-black border rounded-2xl outline-none focus:ring-2 focus:ring-brand-500 font-bold text-lg",
                      error && (!amount || parseFloat(amount) <= 0)
                        ? "border-rose-300 dark:border-rose-900 focus:ring-rose-500"
                        : "border-slate-200 dark:border-zinc-800",
                      "tour-budget-amount",
                    )}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <CustomSelect
                  label={t("budgetModal.period")}
                  value={period}
                  onChange={(v) => setPeriod(v as any)}
                  options={periodOptions}
                />
                <CustomSelect
                  label={t("budgetModal.wallet")}
                  value={walletId || "all"}
                  onChange={(v) => setWalletId(v === "all" ? null : v)}
                  options={walletOptions}
                  onAddNew={() => setShowAddWallet(true)}
                />
              </div>

              {period === "custom" && (
                <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-zinc-800/50 p-4 rounded-2xl border border-slate-100 dark:border-zinc-800">
                  <div>
                    <CustomDatePicker
                      label={t("budgetModal.startDate")}
                      value={customStartDate}
                      onChange={setCustomStartDate}
                      className="bg-white dark:bg-black border-slate-200 dark:border-zinc-700 h-[42px] py-2"
                    />
                  </div>
                  <div>
                    <CustomDatePicker
                      label={t("budgetModal.endDate")}
                      value={customEndDate}
                      onChange={setCustomEndDate}
                      className="bg-white dark:bg-black border-slate-200 dark:border-zinc-700 h-[42px] py-2"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <CustomSelect
                  label={t("budgetModal.category")}
                  value={categoryId}
                  onChange={(v) => {
                    setCategoryId(v);
                    setSubCategoryId("");
                  }}
                  options={categoryOptions}
                  searchable
                  onAddNew={() => setShowAddCategory(true)}
                />
                <CustomSelect
                  label={t("budgetModal.subCategory")}
                  value={subCategoryId}
                  onChange={setSubCategoryId}
                  options={subCategoryOptions}
                  placeholder={t("budgetModal.optional")}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                  {t("budgetModal.colorTag")}
                </label>
                <div className="flex gap-3 flex-wrap">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={cn(
                        "w-8 h-8 rounded-full border-4 transition-transform hover:scale-110",
                        color === c
                          ? "border-slate-300 dark:border-white scale-110"
                          : "border-transparent",
                      )}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-brand-600 text-white font-bold rounded-2xl shadow-xl hover:bg-brand-700 transition-all active:scale-[0.98] tour-budget-save"
              >
                {budgetToEdit ? t("budgetModal.saveChanges") : t("budgetModal.createBudget")}
              </button>
            </form>
          </div>
        </MotionDiv>

        {showAddWallet && (
          <WalletModal onClose={() => setShowAddWallet(false)} />
        )}
        {showAddCategory && (
          <CategoryModal
            onClose={() => setShowAddCategory(false)}
            initialType="expense"
          />
        )}
      </div>
    </div>
  );
};

export default BudgetModal;
