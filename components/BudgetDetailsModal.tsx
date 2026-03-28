import React, { useMemo } from "react";
import { useData } from "../context/DataContext";
import { Budget } from "../types";
import { cn, isDateInPeriod, getCategoryIcon, formatDate } from "../utils";
import { X, Pencil, Trash2, ArrowRightLeft, HelpCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

// Fix motion type
const MotionDiv = motion.div as any;

interface Props {
  budget: Budget;
  onClose: () => void;
  onEdit: (budget: Budget) => void;
  onDelete: (id: string) => void;
}

const BudgetDetailsModal: React.FC<Props> = ({
  budget,
  onClose,
  onEdit,
  onDelete,
}) => {
  const { transactions, categories, formatAmount, wallets } = useData();
  const { t } = useTranslation();

  const category = categories.find((c) => c.id === budget.categoryId);
  const Icon = category ? getCategoryIcon(category.icon) : HelpCircle;
  const budgetColor = budget.color || "#10b981";

  // Filter transactions for this budget
  const budgetTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      if (tx.type !== "expense") return false;
      if (tx.categoryId !== budget.categoryId) return false;
      if (budget.subCategoryId && tx.subCategoryId !== budget.subCategoryId)
        return false;
      if (budget.walletId && tx.fromWalletId !== budget.walletId) return false;
      return isDateInPeriod(
        tx.date,
        budget.period,
        budget.customStartDate,
        budget.customEndDate,
      );
    });
  }, [transactions, budget]);

  const spent = budgetTransactions.reduce((acc, tx) => acc + tx.amount, 0);
  const percentage = Math.min((spent / budget.amount) * 100, 100);
  const remaining = budget.amount - spent;

  // Top 3 Transactions
  const topTransactions = [...budgetTransactions]
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 3);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
        onClick={onClose}
      />

      <MotionDiv
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white dark:bg-zinc-900 rounded-[2.5rem] w-full max-w-lg relative z-10 p-8 shadow-2xl border border-slate-100 dark:border-white/10"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs"
              style={{ backgroundColor: budgetColor }}
            >
              <Icon size={16} />
            </div>
            {budget.name}
          </h2>
          {budget.subCategoryId && (
            <div className="text-xs font-medium text-slate-500 bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded-lg ml-10">
              {category?.subCategories?.find(
                (s) => s.id === budget.subCategoryId,
              )?.name || t("budgetDetails.unknownSubCategory")}
            </div>
          )}
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Big Status Section */}
        <div className="mb-8 text-center">
          <div className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-1">
            {t("budgetDetails.spentSoFar")}
          </div>
          <div className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
            {formatAmount(spent)}
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 dark:bg-zinc-800 rounded-full text-xs font-medium text-slate-500">
            <span>{t("budgetDetails.of", { amount: formatAmount(budget.amount) })}</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-xs font-bold mb-2">
            <span
              className={cn(
                percentage >= 100 ? "text-rose-500" : "text-emerald-500",
              )}
            >
              {t("budgetDetails.used", { percent: Math.floor((spent / budget.amount) * 100) })}
            </span>
            <span className="text-slate-400">
              {remaining < 0
                ? t("budgetDetails.over", { amount: formatAmount(Math.abs(remaining)) })
                : t("budgetDetails.remaining", { amount: formatAmount(remaining) })}
            </span>
          </div>
          <div className="h-4 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className={cn(
                "h-full rounded-full",
                percentage >= 100
                  ? "bg-rose-500"
                  : percentage >= 80
                    ? "bg-amber-500"
                    : "bg-emerald-500",
              )}
            />
          </div>
        </div>

        {/* Top Spenders */}
        <div className="mb-8">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">
            {t("budgetDetails.topSpenders")}
          </h3>
          {topTransactions.length === 0 ? (
            <div className="text-center py-6 bg-slate-50 dark:bg-zinc-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-zinc-800 text-slate-400 text-sm">
              {t("budgetDetails.noTransactionsYet")}
            </div>
          ) : (
            <div className="space-y-3">
              {topTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-white/5"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-zinc-700 flex items-center justify-center shrink-0">
                      <ArrowRightLeft size={14} className="text-slate-500" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-sm text-slate-900 dark:text-white truncate">
                        {tx.note || t("budgetDetails.expense")}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {formatDate(tx.date)}
                      </div>
                    </div>
                  </div>
                  <div className="font-bold text-slate-900 dark:text-white">
                    -{formatAmount(tx.amount)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => {
              onDelete(budget.id);
              onClose();
            }}
            className="p-4 bg-rose-50 dark:bg-rose-900/10 text-rose-600 dark:text-rose-400 font-bold rounded-2xl hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-colors"
          >
            <Trash2 size={20} />
          </button>
          <button
            onClick={() => {
              onClose();
              onEdit(budget);
            }}
            className="flex-1 py-4 bg-brand-600 text-white font-bold rounded-2xl shadow-lg hover:bg-brand-700 transition-colors flex items-center justify-center gap-2"
          >
            <Pencil size={18} /> {t("budgetDetails.editBudget")}
          </button>
        </div>
      </MotionDiv>
    </div>
  );
};

export default BudgetDetailsModal;
