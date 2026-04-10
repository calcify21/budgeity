import React, { useMemo } from "react";
import { Transaction } from "../../types";
import { useData } from "../../context/DataContext";
import { computeCategoryTrend } from "../../utils/analyticsEngine";
import { TrendingUp, TrendingDown, ArrowRight } from "lucide-react";
import Tooltip from "../Tooltip";

interface Props {
  transactions: Transaction[];
  onDrillDown?: (filters: { category?: string; type?: string; wallet?: string }) => void;
}

export const CategoryTrend: React.FC<Props> = ({ transactions, onDrillDown }) => {
  const { categories, formatAmount } = useData();

  // The original computeCategoryTrend and trends logic is likely not relevant for LargestExpense
  // and would need to be replaced with logic to find the largest expense.
  // For now, we'll keep the original `trends` variable to avoid breaking the `if` condition,
  // but it should be replaced with actual largest expense data.
  const trends = useMemo(
    () => computeCategoryTrend(transactions, categories),
    [transactions, categories],
  );

  if (trends.length === 0) { // This condition might need adjustment for LargestExpense
    return (
      <div className="glass-card flex flex-col items-center justify-center min-h-[200px] h-full rounded-[2rem] p-6 text-center">
        <TrendingUp
          size={32}
          className="mx-auto text-slate-300 dark:text-white/20 mb-3"
        />
        <p className="text-sm text-slate-500 dark:text-zinc-400">
          Need at least 2 months of data.
        </p>
      </div>
    );
  }

  return (
    <Tooltip content="Category spending compared to last month">
      <div 
        onClick={() => onDrillDown?.({ type: "expense" })}
        className="glass-card flex flex-col justify-center h-full rounded-[2rem] p-5 cursor-pointer hover:scale-[1.02] transition-transform"
      >
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={18} className="text-brand-500" />
          <h3 className="text-sm font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
            Category Trends
          </h3>
        </div>

        <div className="space-y-3">
          {trends.map((item) => (
            <div 
              key={item.categoryId} 
              onClick={() => onDrillDown?.({ category: item.categoryId, type: "expense" })}
              className="flex items-center gap-3 cursor-pointer hover:bg-slate-100 dark:hover:bg-white/5 p-1 rounded-lg transition-colors"
            >
              <div
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold truncate">{item.name}</p>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-zinc-400 font-semibold">
                  <span>{formatAmount(item.lastMonth)}</span>
                  <ArrowRight size={10} />
                  <span>{formatAmount(item.thisMonth)}</span>
                </div>
              </div>
              <div
                className={`flex items-center gap-1 text-xs font-bold ${
                  item.changePct > 0
                    ? "text-rose-500"
                    : item.changePct < 0
                      ? "text-emerald-500"
                      : "text-slate-400"
                }`}
              >
                {item.changePct > 0 ? (
                  <TrendingUp size={12} />
                ) : item.changePct < 0 ? (
                  <TrendingDown size={12} />
                ) : null}
                {item.changePct > 0 ? "+" : ""}
                {item.changePct}%
              </div>
            </div>
          ))}
        </div>
      </div>
    </Tooltip>
  );
};
