import React, { useMemo } from "react";
import { Transaction } from "../../types";
import { excludeTransfers } from "../../utils/analyticsEngine";
import { Hash } from "lucide-react";
import Tooltip from "../Tooltip";

interface Props {
  transactions: Transaction[];
  onDrillDown?: (filters: { category?: string; type?: string; wallet?: string }) => void;
}

export const TransactionFrequency: React.FC<Props> = ({ transactions, onDrillDown }) => {
  const stats = useMemo(() => {
    const real = excludeTransfers(transactions);
    const expenses = real.filter((t) => t.type === "expense");
    if (expenses.length === 0) return { total: 0, avgPerDay: 0 };

    const dates = expenses.map((t) =>
      new Date(t.date).toISOString().slice(0, 10),
    );
    const uniqueDays = new Set(dates).size;
    const avgPerDay = uniqueDays > 0 ? expenses.length / uniqueDays : 0;

    return {
      total: expenses.length,
      avgPerDay: Math.round(avgPerDay * 10) / 10,
    };
  }, [transactions]);

  return (
    <Tooltip content="Number of expense transactions and daily average">
      <div 
        onClick={() => onDrillDown?.({ type: "expense" })}
        className="glass-card flex flex-col justify-center h-full rounded-[2rem] p-5 cursor-pointer hover:scale-[1.02] transition-transform"
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center">
            <Hash size={18} className="text-indigo-500" />
          </div>
          <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase">
            Transaction Frequency
          </span>
        </div>
        <p className="text-2xl font-extrabold tracking-tight">{stats.total}</p>
        <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-1 font-semibold">
          {stats.avgPerDay} avg per active day
        </p>
      </div>
    </Tooltip>
  );
};
