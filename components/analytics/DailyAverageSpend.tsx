import React, { useMemo } from "react";
import { Transaction } from "../../types";
import { useData } from "../../context/DataContext";
import { computeSafeDailySpend } from "../../utils/analyticsEngine";
import { Banknote, Target } from "lucide-react";
import Tooltip from "../Tooltip";

interface Props {
  transactions: Transaction[];
  onDrillDown?: (filters: { category?: string; type?: string; wallet?: string }) => void;
}

export const DailyAverageSpend: React.FC<Props> = ({ transactions, onDrillDown }) => {
  const { wallets, formatAmount } = useData();

  const data = useMemo(
    () => computeSafeDailySpend(transactions, wallets),
    [transactions, wallets],
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <Tooltip content="Average daily expense for the current month">
        <div 
          onClick={() => onDrillDown?.({ type: "expense" })}
          className="glass-card flex flex-col justify-center h-full rounded-[2rem] p-5 cursor-pointer hover:scale-[1.02] transition-transform"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-9 h-9 rounded-xl bg-sky-500/10 flex items-center justify-center">
              <Banknote size={18} className="text-sky-500" />
            </div>
            <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase">
              Daily Average
            </span>
          </div>
          <p className="text-2xl font-extrabold tracking-tight">
            {formatAmount(data.dailyAverage)}
          </p>
          <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-1 font-semibold">
            per day this month
          </p>
        </div>
      </Tooltip>

      <Tooltip content="How much you can safely spend per remaining day this month">
        <div 
          onClick={() => onDrillDown?.({ type: "expense" })}
          className="glass-card flex flex-col justify-center h-full rounded-[2rem] p-5 cursor-pointer hover:scale-[1.02] transition-transform"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <Target size={18} className="text-emerald-500" />
            </div>
            <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase">
              Safe Daily Spend
            </span>
          </div>
          <p className="text-2xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400">
            {formatAmount(data.safeDailySpend)}
          </p>
          <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-1 font-semibold">
            {data.remainingDays} day{data.remainingDays !== 1 ? "s" : ""} left
            in month
          </p>
        </div>
      </Tooltip>
    </div>
  );
};
