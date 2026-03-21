import React, { useMemo } from "react";
import { Transaction } from "../../types";
import { useData } from "../../context/DataContext";
import { computeSpendingPersonality } from "../../utils/analyticsEngine";
import { Sparkles } from "lucide-react";
import Tooltip from "../Tooltip";

interface Props {
  transactions: Transaction[];
}

export const SpendingPersonality: React.FC<Props> = ({ transactions }) => {
  const { categories, budgets } = useData();

  const personality = useMemo(
    () => computeSpendingPersonality(transactions, categories, budgets),
    [transactions, categories, budgets],
  );

  if (transactions.filter((t) => t.type === "expense").length < 5) {
    return (
      <div className="glass-card flex flex-col items-center justify-center min-h-[200px] h-full rounded-[2rem] p-6 text-center">
        <Sparkles
          size={32}
          className="mx-auto text-slate-300 dark:text-white/20 mb-3"
        />
        <p className="text-sm text-slate-500 dark:text-zinc-400">
          Add more transactions to discover your spending personality.
        </p>
      </div>
    );
  }

  return (
    <Tooltip content="Your spending personality based on behavioral patterns">
      <div className="glass-card rounded-[2rem] p-6 bg-gradient-to-br from-violet-500/5 to-indigo-500/5 dark:from-violet-500/10 dark:to-indigo-500/10">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles size={18} className="text-violet-500" />
          <h3 className="text-sm font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
            Spending Personality
          </h3>
        </div>

        <div className="text-center py-4">
          <span className="text-5xl mb-3 block">{personality.emoji}</span>
          <h4 className="text-xl font-extrabold tracking-tight text-violet-600 dark:text-violet-400 mb-2">
            {personality.type}
          </h4>
          <p className="text-sm text-slate-600 dark:text-zinc-300 leading-relaxed max-w-xs mx-auto">
            {personality.description}
          </p>
        </div>
      </div>
    </Tooltip>
  );
};
