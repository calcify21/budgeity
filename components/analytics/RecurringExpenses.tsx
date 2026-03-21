import React from "react";
import { useData } from "../../context/DataContext";
import { Repeat } from "lucide-react";
import Tooltip from "../Tooltip";

export const RecurringExpenses: React.FC = () => {
  const { recurringTransactions, categories, formatAmount } = useData();

  const activeRecurring = recurringTransactions.filter(
    (r) => r.isActive && r.type === "expense",
  );

  if (activeRecurring.length === 0) {
    return (
      <div className="glass-card flex flex-col items-center justify-center min-h-[200px] h-full rounded-[2rem] p-6 text-center">
        <Repeat
          size={32}
          className="mx-auto text-slate-300 dark:text-white/20 mb-3"
        />
        <p className="text-sm text-slate-500 dark:text-zinc-400">
          No recurring expenses.
        </p>
      </div>
    );
  }

  const totalMonthly = activeRecurring.reduce((sum, r) => {
    if (r.frequency === "daily") return sum + r.amount * 30;
    if (r.frequency === "weekly") return sum + r.amount * 4.33;
    if (r.frequency === "monthly") return sum + r.amount;
    if (r.frequency === "yearly") return sum + r.amount / 12;
    return sum + r.amount;
  }, 0);

  return (
    <Tooltip content="All active recurring expense subscriptions">
      <div className="glass-card flex flex-col h-full rounded-[2rem] p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Repeat size={18} className="text-brand-500" />
            <h3 className="text-sm font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
              Recurring Expenses
            </h3>
          </div>
          <span className="text-xs font-bold text-slate-600 dark:text-zinc-300">
            ~{formatAmount(Math.round(totalMonthly))}/mo
          </span>
        </div>

        <div className="flex-1 flex flex-col justify-center space-y-2">
          {activeRecurring.slice(0, 8).map((r) => {
            const cat = categories.find((c) => c.id === r.categoryId);
            return (
              <div
                key={r.id}
                className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-white/5"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: cat?.color || "#64748b" }}
                  />
                  <span className="text-xs font-bold truncate">
                    {r.name || cat?.name || "Recurring"}
                  </span>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-bold">
                    {formatAmount(r.amount)}
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-zinc-500 ml-1">
                    /{r.frequency}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Tooltip>
  );
};
