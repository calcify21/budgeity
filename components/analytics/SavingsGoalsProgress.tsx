import React from "react";
import { useData } from "../../context/DataContext";
import { Target } from "lucide-react";
import Tooltip from "../Tooltip";

export const SavingsGoalsProgress: React.FC = () => {
  const { goals, formatAmount } = useData();

  const activeGoals = goals.filter((g) => g.status === "active");

  if (activeGoals.length === 0) {
    return (
      <div className="glass-card flex flex-col items-center justify-center min-h-[200px] h-full rounded-[2rem] p-6 text-center">
        <Target
          size={32}
          className="mx-auto text-slate-300 dark:text-white/20 mb-3"
        />
        <p className="text-sm text-slate-500 dark:text-zinc-400">
          No active savings goals.
        </p>
      </div>
    );
  }

  return (
    <Tooltip content="Progress towards your active savings goals">
      <div className="glass-card flex flex-col h-full rounded-[2rem] p-6">
        <div className="flex items-center gap-2 mb-4">
          <Target size={18} className="text-brand-500" />
          <h3 className="text-sm font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
            Savings Goals
          </h3>
        </div>

        <div className="flex-1 flex flex-col justify-center space-y-3">
          {activeGoals.map((goal) => {
            const pct =
              goal.targetAmount > 0
                ? Math.min(
                    100,
                    Math.round((goal.currentBalance / goal.targetAmount) * 100),
                  )
                : 0;
            const color = goal.color || "#6366f1";

            return (
              <div key={goal.id} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold truncate">
                    {goal.name}
                  </span>
                  <span className="text-xs font-bold" style={{ color }}>
                    {pct}%
                  </span>
                </div>
                <div className="h-2 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, backgroundColor: color }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 dark:text-zinc-500 font-semibold">
                  <span>{formatAmount(goal.currentBalance)}</span>
                  <span>{formatAmount(goal.targetAmount)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Tooltip>
  );
};
