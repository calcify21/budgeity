import React, { useMemo } from "react";
import { Transaction } from "../../types";
import { useData } from "../../context/DataContext";
import { excludeTransfers } from "../../utils/analyticsEngine";
import { Receipt, AlertTriangle } from "lucide-react";
import Tooltip from "../Tooltip";

interface Props {
  transactions: Transaction[];
  onDrillDown?: (filters: { category?: string; type?: string; wallet?: string }) => void;
}

export const LargestExpense: React.FC<Props> = ({ transactions, onDrillDown }) => {
  const { categories, formatAmount } = useData();

  const largest = useMemo(() => {
    const expenses = excludeTransfers(transactions).filter(
      (t) => t.type === "expense",
    );
    if (expenses.length === 0) return null;
    const max = expenses.reduce((a, b) => (a.amount > b.amount ? a : b));
    const cat = categories.find((c) => c.id === max.categoryId);
    return {
      amount: max.amount,
      note: max.note || "No note",
      category: cat?.name || "Unknown",
      date: new Date(max.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      color: cat?.color || "#64748b",
    };
  }, [transactions, categories]);

  if (!largest) {
    return (
      <div className="glass-card rounded-[2rem] p-5 text-center">
        <Receipt
          size={24}
          className="mx-auto text-slate-300 dark:text-white/20 mb-2"
        />
        <p className="text-xs text-slate-500 dark:text-zinc-400">
          No expenses yet.
        </p>
      </div>
    );
  }

  return (
    <Tooltip content="The single largest expense transaction in the selected period">
      <div 
        onClick={() => onDrillDown?.({ type: "expense" })}
        className="glass-card flex flex-col justify-center h-full rounded-[2rem] p-5 cursor-pointer hover:scale-[1.02] transition-transform"
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="w-9 h-9 rounded-xl bg-rose-500/10 flex items-center justify-center">
            <AlertTriangle size={18} className="text-rose-500" />
          </div>
          <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase">
            Largest Expense
          </span>
        </div>
        <p className="text-2xl font-extrabold tracking-tight text-rose-600 dark:text-rose-400">
          {formatAmount(largest.amount)}
        </p>
        <p className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 mt-1 truncate">
          {largest.category} · {largest.date}
        </p>
        <p className="text-[10px] text-slate-400 dark:text-zinc-500 truncate">
          {largest.note}
        </p>
      </div>
    </Tooltip>
  );
};
