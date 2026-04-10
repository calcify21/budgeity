import React, { useMemo } from "react";
import { Transaction } from "../../types";
import { useData } from "../../context/DataContext";
import { computeBudgetCompliance } from "../../utils/analyticsEngine";
import { ShieldCheck } from "lucide-react";
import Tooltip from "../Tooltip";

interface Props {
  transactions: Transaction[];
  onDrillDown?: (filters: { category?: string; type?: string; wallet?: string }) => void;
}

export const BudgetCompliance: React.FC<Props> = ({ transactions, onDrillDown }) => {
  const { budgets, categories, formatAmount } = useData();

  const items = useMemo(
    () => computeBudgetCompliance(transactions, budgets, categories),
    [transactions, budgets, categories],
  );

  if (items.length === 0) {
    return (
      <div className="glass-card flex flex-col items-center justify-center min-h-[200px] h-full rounded-[2rem] p-6 text-center">
        <ShieldCheck
          size={32}
          className="mx-auto text-slate-300 dark:text-white/20 mb-3"
        />
        <p className="text-sm text-slate-500 dark:text-zinc-400">
          No budgets configured.
        </p>
      </div>
    );
  }

  return (
    <Tooltip content="Track how well you stay within your monthly budgets">
      <div className="glass-card flex flex-col h-full rounded-[2rem] p-6">
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck size={18} className="text-brand-500" />
          <h3 className="text-sm font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
            Budget Compliance
          </h3>
        </div>

        <div className="flex-1 flex flex-col justify-center space-y-3">
          {items.map((item) => {
            const statusColor =
              item.percentage <= 75
                ? "text-emerald-500"
                : item.percentage <= 100
                  ? "text-amber-500"
                  : "text-rose-500";
            const barColor =
              item.percentage <= 75
                ? "#10b981"
                : item.percentage <= 100
                  ? "#f59e0b"
                  : "#ef4444";

            return (
              <div 
                key={item.budgetId} 
                className="space-y-1.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-white/5 p-1 rounded-lg transition-colors"
                onClick={() => onDrillDown?.({ category: item.categoryId, type: "expense" })}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold truncate">
                    {item.name}
                  </span>
                  <span className={`text-xs font-bold ${statusColor}`}>
                    {item.percentage}%
                  </span>
                </div>
                <div className="h-2 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(item.percentage, 100)}%`,
                      backgroundColor: barColor,
                    }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 dark:text-zinc-500">
                  <span>{formatAmount(item.spent)} spent</span>
                  <span>{formatAmount(item.limit)} limit</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Tooltip>
  );
};
