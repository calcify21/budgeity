import React, { useMemo } from "react";
import { Transaction, Category } from "../../types";
import { useData } from "../../context/DataContext";
import { excludeTransfers } from "../../utils/analyticsEngine";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  Percent,
  BarChart3,
  CalendarDays,
  Crown,
} from "lucide-react";
import Tooltip from "../Tooltip";

interface Props {
  transactions: Transaction[];
  onDrillDown?: (filters: { category?: string; type?: string; wallet?: string }) => void;
}

export const SummaryCards: React.FC<Props> = ({ transactions, onDrillDown }) => {
  const { categories, formatAmount } = useData();

  const stats = useMemo(() => {
    const real = excludeTransfers(transactions);
    const expenses = real.filter((t) => t.type === "expense");
    const incomes = real.filter((t) => t.type === "income");

    const totalIncome = incomes.reduce((s, t) => s + t.amount, 0);
    const totalExpense = expenses.reduce((s, t) => s + t.amount, 0);
    const netSavings = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;
    const expenseRatio =
      totalIncome > 0 ? (totalExpense / totalIncome) * 100 : 0;

    // Top category
    const catTotals: Record<string, number> = {};
    expenses.forEach((t) => {
      catTotals[t.categoryId] = (catTotals[t.categoryId] || 0) + t.amount;
    });
    let topCatId = "";
    let maxCatAmount = 0;
    Object.entries(catTotals).forEach(([id, amount]) => {
      if (amount > maxCatAmount) {
        maxCatAmount = amount;
        topCatId = id;
      }
    });
    const topCategory = categories.find((c) => c.id === topCatId)?.name || "—";

    // Peak spending day
    const dayTotals: Record<string, number> = {};
    expenses.forEach((t) => {
      const key = new Date(t.date).toISOString().slice(0, 10);
      dayTotals[key] = (dayTotals[key] || 0) + t.amount;
    });
    let peakDay = "—";
    let peakAmount = 0;
    Object.entries(dayTotals).forEach(([dateStr, amount]) => {
      if (amount > peakAmount) {
        peakAmount = amount;
        peakDay = new Date(dateStr).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
      }
    });

    return {
      totalIncome,
      totalExpense,
      netSavings,
      savingsRate: Math.round(savingsRate * 10) / 10,
      expenseRatio: Math.round(expenseRatio * 10) / 10,
      topCategory,
      topCategoryId: topCatId,
      peakDay,
      peakAmount,
    };
  }, [transactions, categories]);

  const cards = [
    {
      label: "Total Income",
      value: formatAmount(stats.totalIncome),
      icon: TrendingUp,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      tooltip: "Sum of all income transactions in the selected period",
      action: () => onDrillDown?.({ type: "income" }),
    },
    {
      label: "Total Expense",
      value: formatAmount(stats.totalExpense),
      icon: TrendingDown,
      color: "text-rose-500",
      bg: "bg-rose-500/10",
      tooltip: "Sum of all expense transactions (excludes transfers)",
      action: () => onDrillDown?.({ type: "expense" }),
    },
    {
      label: "Net Savings",
      value: formatAmount(stats.netSavings),
      icon: PiggyBank,
      color: stats.netSavings >= 0 ? "text-emerald-500" : "text-rose-500",
      bg: stats.netSavings >= 0 ? "bg-emerald-500/10" : "bg-rose-500/10",
      tooltip: "Income minus Expenses",
      action: () => onDrillDown?.({}),
    },
    {
      label: "Savings Rate",
      value: `${stats.savingsRate}%`,
      icon: Percent,
      color:
        stats.savingsRate >= 20
          ? "text-emerald-500"
          : stats.savingsRate >= 10
            ? "text-amber-500"
            : "text-rose-500",
      bg:
        stats.savingsRate >= 20
          ? "bg-emerald-500/10"
          : stats.savingsRate >= 10
            ? "bg-amber-500/10"
            : "bg-rose-500/10",
      tooltip: "Percentage of income saved",
      action: () => onDrillDown?.({ type: "income" }),
    },
    {
      label: "Expense Ratio",
      value: `${stats.expenseRatio}%`,
      icon: BarChart3,
      color:
        stats.expenseRatio <= 70
          ? "text-emerald-500"
          : stats.expenseRatio <= 90
            ? "text-amber-500"
            : "text-rose-500",
      bg:
        stats.expenseRatio <= 70
          ? "bg-emerald-500/10"
          : stats.expenseRatio <= 90
            ? "bg-amber-500/10"
            : "bg-rose-500/10",
      tooltip: "Expenses as percentage of income",
      action: () => onDrillDown?.({ type: "expense" }),
    },
    {
      label: "Top Category",
      value: stats.topCategory,
      icon: Crown,
      color: "text-violet-500",
      bg: "bg-violet-500/10",
      tooltip: "Category with the highest total spending",
      action: () => stats.topCategoryId && onDrillDown?.({ category: stats.topCategoryId, type: "expense" }),
    },
    {
      label: "Peak Spending Day",
      value: stats.peakDay,
      icon: CalendarDays,
      color: "text-sky-500",
      bg: "bg-sky-500/10",
      tooltip: `Highest single-day spending: ${formatAmount(stats.peakAmount)}`,
      action: () => onDrillDown?.({ type: "expense" }),
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
      {cards.map((card) => (
        <Tooltip key={card.label} content={card.tooltip} side="bottom">
          <div 
            onClick={card.action}
            className={`glass-card rounded-2xl p-4 flex flex-col gap-2 hover:scale-[1.02] transition-transform ${card.action ? 'cursor-pointer' : 'cursor-default'}`}
          >
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-xl ${card.bg} flex items-center justify-center`}
              >
                <card.icon size={16} className={card.color} />
              </div>
            </div>
            <p className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wide">
              {card.label}
            </p>
            <p
              className={`text-lg font-extrabold tracking-tight ${card.color}`}
            >
              {card.value}
            </p>
          </div>
        </Tooltip>
      ))}
    </div>
  );
};
