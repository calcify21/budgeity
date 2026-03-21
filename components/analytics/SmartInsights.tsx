import React, { useMemo } from "react";
import { Transaction } from "../../types";
import { useData } from "../../context/DataContext";
import { generateSmartInsights } from "../../utils/analyticsEngine";
import { Lightbulb } from "lucide-react";
import Tooltip from "../Tooltip";

interface Props {
  transactions: Transaction[];
}

const insightColors = [
  "border-l-brand-500",
  "border-l-emerald-500",
  "border-l-violet-500",
  "border-l-amber-500",
  "border-l-sky-500",
  "border-l-rose-500",
];

export const SmartInsights: React.FC<Props> = ({ transactions }) => {
  const { categories, budgets, wallets } = useData();

  const insights = useMemo(
    () => generateSmartInsights(transactions, categories, budgets, wallets),
    [transactions, categories, budgets, wallets],
  );

  return (
    <Tooltip content="Automated financial insights based on your data">
      <div className="glass-card flex flex-col h-full rounded-[2rem] p-6">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb size={18} className="text-amber-500" />
          <h3 className="text-sm font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
            Smart Insights
          </h3>
        </div>

        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 place-content-center">
          {insights.map((insight, i) => (
            <div
              key={i}
              className={`glass-card p-5 rounded-2xl border-t-4 ${insightColors[i % insightColors.length].replace("border-l-", "border-t-")} flex flex-col gap-3 justify-between hover:shadow-md transition-shadow`}
            >
              <p className="text-sm font-semibold text-slate-700 dark:text-zinc-200 leading-relaxed">
                {insight}
              </p>
              <Lightbulb
                size={16}
                className={`opacity-40 ${insightColors[i % insightColors.length].replace("border-l-", "text-")}`}
              />
            </div>
          ))}
        </div>
      </div>
    </Tooltip>
  );
};
