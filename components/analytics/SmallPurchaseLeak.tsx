import React, { useMemo } from "react";
import { Transaction } from "../../types";
import { useData } from "../../context/DataContext";
import { computeSmallPurchaseLeak } from "../../utils/analyticsEngine";
import { Droplets } from "lucide-react";
import Tooltip from "../Tooltip";

interface Props {
  transactions: Transaction[];
  onDrillDown?: (filters: { category?: string; type?: string; wallet?: string }) => void;
}

export const SmallPurchaseLeak: React.FC<Props> = ({ transactions, onDrillDown }) => {
  const { formatAmount, currency } = useData();

  const threshold = ["INR", "PKR", "BDT", "NPR", "LKR"].includes(currency)
    ? 200
    : 5;
  const data = useMemo(
    () => computeSmallPurchaseLeak(transactions, threshold),
    [transactions, threshold],
  );

  return (
    <Tooltip
      content={`Total spending from transactions under ${formatAmount(threshold)}`}
    >
      <div 
        onClick={() => onDrillDown?.({ type: "expense" })}
        className="glass-card flex flex-col justify-center h-full rounded-[2rem] p-5 cursor-pointer hover:scale-[1.02] transition-transform"
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center">
            <Droplets size={18} className="text-amber-500" />
          </div>
          <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase">
            Small Purchase Leak
          </span>
        </div>
        <p className="text-2xl font-extrabold tracking-tight text-amber-600 dark:text-amber-400">
          {formatAmount(data.total)}
        </p>
        <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-1 font-semibold">
          {data.count} transactions · {data.percentage}% of expenses
        </p>
      </div>
    </Tooltip>
  );
};
