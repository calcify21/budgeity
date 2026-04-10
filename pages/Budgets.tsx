import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { useData } from "../context/DataContext";
import { Budget } from "../types";
import { cn, isDateInPeriod, getCategoryIcon } from "../utils";
import { calculateBudgetRisk } from "../utils/analytics";
import {
  Plus,
  PiggyBank,
  Pencil,
  Trash2,
  AlertTriangle,
  CheckCircle,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import BudgetModal from "../components/BudgetModal";
import BudgetDetailsModal from "../components/BudgetDetailsModal";
import { ConfirmModal } from "../components/ConfirmModal";
import { motion, AnimatePresence } from "framer-motion";

// Fix motion type
const MotionDiv = motion.div as any;

const Budgets: React.FC = () => {
  const { t } = useTranslation();
  const {
    budgets,
    transactions,
    recurringTransactions,
    categories,
    wallets,
    deleteBudget,
    formatAmount,
  } = useData();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | undefined>(
    undefined,
  );
  const [budgetToDelete, setBudgetToDelete] = useState<string | null>(null);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);

  useEffect(() => {
    if (searchParams.get("add") === "true") {
      setEditingBudget(undefined);
      setIsModalOpen(true);
      const newParams = new URLSearchParams(searchParams);
      newParams.delete("add");
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const getBudgetStatus = (budget: Budget) => {
    const spent = transactions
      .filter((t) => {
        // Must be expense
        if (t.type !== "expense") return false;
        // Must match category
        if (t.categoryId !== budget.categoryId) return false;
        // Must match subcategory (if set)
        if (budget.subCategoryId && t.subCategoryId !== budget.subCategoryId)
          return false;
        // Must match wallet (if set)
        if (budget.walletId && t.fromWalletId !== budget.walletId) return false;
        // Must be in period
        return isDateInPeriod(
          t.date,
          budget.period,
          budget.customStartDate,
          budget.customEndDate,
        );
      })
      .reduce((acc, t) => acc + t.amount, 0);
    const pendingRecurringAmount = recurringTransactions
      .filter((r) => {
        if (!r.isActive || !r.autoAdd || r.type !== "expense") return false;
        if (r.categoryId !== budget.categoryId) return false;
        if (budget.walletId && r.walletId !== budget.walletId) return false;
        if (budget.period === "monthly") {
          const nextDueMonth = new Date(r.nextDueDate).getMonth();
          const currentMonth = new Date().getMonth();
          return nextDueMonth === currentMonth;
        } else if (budget.period === "weekly") {
          // Basic estimation: if due strictly within next 7 days
          const dueDate = new Date(r.nextDueDate);
          const nextWeek = new Date();
          nextWeek.setDate(nextWeek.getDate() + 7);
          return dueDate <= nextWeek;
        }
        return false;
      })
      .reduce((acc, r) => acc + r.amount, 0);

    const percentage = Math.min((spent / budget.amount) * 100, 100); // Cap at 100 for bar
    const rawPercentage = (spent / budget.amount) * 100;
    const remaining = budget.amount - spent;

    let daysLeft = 0;
    let projectedSpend = spent;
    let overshootAmount = 0;

    if (budget.period === "monthly") {
      const now = new Date();
      const totalDays = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0,
      ).getDate();
      const daysPassed = Math.max(1, now.getDate());
      daysLeft = totalDays - daysPassed;
      projectedSpend = (spent / daysPassed) * totalDays;
    } else if (budget.period === "weekly") {
      const now = new Date();
      const day = now.getDay();
      const diff = day === 0 ? 6 : day - 1;
      const daysPassed = Math.max(1, diff + 1);
      daysLeft = 7 - daysPassed;
      daysLeft = 7 - daysPassed;
      projectedSpend = (spent / daysPassed) * 7;
    }

    projectedSpend += pendingRecurringAmount;

    const riskStatus = calculateBudgetRisk(projectedSpend, budget.amount);
    if (riskStatus === "Critical") {
      overshootAmount = projectedSpend - budget.amount;
    }

    let status: "safe" | "warning" | "danger" = "safe";
    if (rawPercentage >= 100) status = "danger";
    else if (rawPercentage >= 80) status = "warning";

    return {
      spent,
      percentage,
      rawPercentage,
      remaining,
      status,
      daysLeft,
      projectedSpend,
      pendingRecurringAmount,
      riskStatus,
      overshootAmount,
    };
  };

  const sortedBudgets = budgets
    .map((b) => ({ ...b, ...getBudgetStatus(b) }))
    .sort((a, b) => b.rawPercentage - a.rawPercentage);
  const alerts = sortedBudgets.filter((b) => b.status !== "safe");

  const handleDeleteBudget = (id: string) => {
    setBudgetToDelete(id);
    setSelectedBudget(null); // Close details if open
  };

  const handleEditBudget = (budget: Budget) => {
    setEditingBudget(budget);
    setIsModalOpen(true);
    setSelectedBudget(null); // Close details if open
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">
          {t("common.budgets")}
        </h2>
        <button
          onClick={() => {
            setEditingBudget(undefined);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-black px-5 py-2.5 rounded-2xl font-bold shadow-lg hover:scale-105 transition-transform tour-budgets-create"
        >
          <Plus size={20} /> {t("budgets.createBudget")}
        </button>
      </div>

      {/* Alerts Section */}
      <AnimatePresence>
        {alerts.length > 0 && (
          <MotionDiv
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="grid grid-cols-1 gap-4"
          >
            {alerts.map((b) => (
              <div
                key={b.id}
                className={cn(
                  "p-4 rounded-2xl flex items-center gap-4 border",
                  b.status === "danger"
                    ? "bg-rose-50 dark:bg-rose-900/10 border-rose-100 dark:border-rose-900/30 text-rose-800 dark:text-rose-200"
                    : "bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/30 text-amber-800 dark:text-amber-200",
                )}
              >
                <div
                  className={cn(
                    "p-2 rounded-full shrink-0",
                    b.status === "danger"
                      ? "bg-rose-200 dark:bg-rose-800/30"
                      : "bg-amber-200 dark:bg-amber-800/30",
                  )}
                >
                  {b.status === "danger" ? (
                    <AlertCircle size={20} />
                  ) : (
                    <AlertTriangle size={20} />
                  )}
                </div>
                <div className="flex-1">
                  <span className="font-bold block text-sm sm:text-base">
                    {b.status === "danger"
                      ? t("budgets.exceededBudget", { name: b.name })
                      : t("budgets.closeToBudget", { name: b.name })}
                  </span>
                  <span className="text-xs opacity-80">
                    {t("budgets.spentOf", {
                      spent: formatAmount(b.spent),
                      total: formatAmount(b.amount),
                    })}
                  </span>
                </div>
              </div>
            ))}
          </MotionDiv>
        )}
      </AnimatePresence>

      {/* Budget Grid */}
      {sortedBudgets.length === 0 ? (
        <div className="py-24 text-center bg-white/50 dark:bg-zinc-900/50 rounded-[2rem] border-2 border-dashed border-slate-200 dark:border-zinc-800 flex flex-col items-center gap-5">
          <div className="w-20 h-20 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center text-slate-300 dark:text-zinc-600">
            <PiggyBank size={40} strokeWidth={1.5} />
          </div>
          <div className="space-y-2">
            <p className="text-lg font-bold text-slate-900 dark:text-white">
              {t("budgets.noBudgets")}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              Create your first budget to take control of your spending. Set
              limits and track progress effortlessly.
            </p>
          </div>
          <button
            onClick={() => {
              setEditingBudget(undefined);
              setIsModalOpen(true);
            }}
            className="px-6 py-3 bg-brand-600 text-white font-bold rounded-2xl hover:bg-brand-700 transition-colors shadow-lg shadow-brand-500/20"
          >
            {t("budgets.createBudget")}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedBudgets.map((budget) => {
            const category = categories.find((c) => c.id === budget.categoryId);
            const Icon = category ? getCategoryIcon(category.icon) : HelpCircle;
            const walletName = budget.walletId
              ? wallets.find((w) => w.id === budget.walletId)?.name
              : t("budgets.allWallets");

            // Fix percentage visual glitch: only show 100% if effectively 100%
            const displayPercentText = Math.floor(
              (budget.spent / budget.amount) * 100,
            );

            return (
              <MotionDiv
                key={budget.id}
                layout
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{
                  type: "spring",
                  damping: 20,
                  stiffness: 220,
                  mass: 0.8,
                }}
                onClick={() => setSelectedBudget(budget)}
                className="bg-white dark:bg-zinc-900 rounded-[2rem] p-6 shadow-sm border border-slate-200 dark:border-zinc-800 relative group overflow-hidden cursor-pointer hover:border-brand-500/30 transition-all hover:shadow-md"
              >
                {/* Header */}
                <div className="flex justify-between items-start mb-6 relative z-10">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md"
                      style={{ backgroundColor: budget.color }}
                    >
                      <Icon size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-slate-900 dark:text-white leading-tight">
                        {budget.name}
                      </h3>
                      <div className="text-xs text-slate-500 font-medium mt-0.5 capitalize flex items-center gap-1">
                        {!category && (
                          <span className="text-rose-500 flex items-center gap-1">
                            <AlertCircle size={10} /> Uncategorized
                          </span>
                        )}
                        {category && (
                          <span>
                            {budget.period} • {walletName}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div
                    className="hidden sm:flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => {
                        setEditingBudget(budget);
                        setIsModalOpen(true);
                      }}
                      className="p-2 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => setBudgetToDelete(budget.id)}
                      className="p-2 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-colors text-slate-400 hover:text-rose-500"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Stats */}
                <div className="space-y-4 relative z-10">
                  <div className="flex justify-between items-end">
                    <div>
                      <div className="text-3xl font-bold text-slate-900 dark:text-white">
                        {formatAmount(budget.spent)}
                      </div>
                      <div className="text-xs text-slate-400 font-medium uppercase tracking-wider mt-1">
                        {t("budgets.spent")}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-slate-500 dark:text-slate-400">
                        / {formatAmount(budget.amount)}
                      </div>
                      <div
                        className={cn(
                          "text-xs font-bold mt-1",
                          budget.status === "safe"
                            ? "text-emerald-500"
                            : budget.status === "warning"
                              ? "text-amber-500"
                              : "text-rose-500",
                        )}
                      >
                        {budget.remaining < 0
                          ? t("budgets.over", {
                              amount: formatAmount(Math.abs(budget.remaining)),
                            })
                          : t("budgets.left", {
                              amount: formatAmount(budget.remaining),
                            })}
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="relative">
                    <div className="flex justify-end mb-1">
                      <span
                        className={cn(
                          "text-[10px] font-bold",
                          budget.status === "danger"
                            ? "text-rose-500"
                            : budget.status === "warning"
                              ? "text-amber-500"
                              : "text-emerald-500",
                        )}
                      >
                        {displayPercentText}%
                      </span>
                    </div>
                    <div className="h-3 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${budget.percentage}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className={cn(
                          "h-full rounded-full transition-colors duration-500",
                          budget.status === "safe"
                            ? "bg-emerald-500"
                            : budget.status === "warning"
                              ? "bg-amber-500"
                              : "bg-rose-500",
                        )}
                      />
                    </div>
                  </div>

                  {/* Predictive Risk Engine */}
                  <div className="pt-4 mt-2 border-t border-slate-100 dark:border-zinc-800 flex flex-col gap-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 font-medium dark:text-zinc-400">
                        {t("budgets.daysLeft", { count: budget.daysLeft })}
                      </span>
                      <div
                        className={cn(
                          "px-2.5 py-1 rounded-full font-bold text-[10px] uppercase tracking-wider",
                          budget.riskStatus === "Safe"
                            ? "bg-emerald-100/50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                            : budget.riskStatus === "At Risk"
                              ? "bg-amber-100/50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"
                              : "bg-rose-100/50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400",
                        )}
                      >
                        {budget.riskStatus}
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 font-medium dark:text-zinc-400 flex gap-1">
                        {t("budgets.projected")}:{" "}
                        <span className="text-slate-900 dark:text-white font-bold">
                          {formatAmount(budget.projectedSpend)}
                        </span>
                        {budget.pendingRecurringAmount > 0 && (
                          <span className="text-slate-400 text-[10px] ml-1">
                            (+{formatAmount(budget.pendingRecurringAmount)}{" "}
                            auto)
                          </span>
                        )}
                      </span>
                      {budget.riskStatus === "Critical" && (
                        <span className="text-rose-500 font-bold">
                          {t("budgets.exceedsBy", {
                            amount: formatAmount(budget.overshootAmount),
                          })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </MotionDiv>
            );
          })}
        </div>
      )}

      {isModalOpen && (
        <BudgetModal
          onClose={() => setIsModalOpen(false)}
          budgetToEdit={editingBudget}
        />
      )}

      {selectedBudget && (
        <BudgetDetailsModal
          budget={selectedBudget}
          onClose={() => setSelectedBudget(null)}
          onEdit={handleEditBudget}
          onDelete={handleDeleteBudget}
        />
      )}

      <ConfirmModal
        isOpen={!!budgetToDelete}
        onClose={() => setBudgetToDelete(null)}
        onConfirm={() => budgetToDelete && deleteBudget(budgetToDelete)}
        title={t("budgets.deleteBudget")}
        message={t("budgets.deleteBudgetMessage")}
        confirmText={t("common.delete")}
        isDestructive
      />
    </div>
  );
};

export default Budgets;
