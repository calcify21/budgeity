import React, { useMemo, useState } from "react";
import { Transaction } from "../../types";
import { useData } from "../../context/DataContext";
import {
  computeHeatmapData,
  computeNoSpendStreak,
  HeatmapDay,
} from "../../utils/analyticsEngine";
import { Flame } from "lucide-react";
import Tooltip from "../Tooltip";

interface Props {
  transactions: Transaction[];
  onDrillDown?: (filters: { category?: string; type?: string; wallet?: string }) => void;
}

const getIntensity = (amount: number, max: number): string => {
  if (amount === 0) return "bg-slate-100 dark:bg-white/5";
  const ratio = amount / max;
  if (ratio < 0.25) return "bg-emerald-200 dark:bg-emerald-900/50";
  if (ratio < 0.5) return "bg-emerald-400 dark:bg-emerald-700/60";
  if (ratio < 0.75) return "bg-emerald-500 dark:bg-emerald-600/70";
  return "bg-emerald-700 dark:bg-emerald-500";
};

export const SpendingHeatmap: React.FC<Props> = ({ transactions, onDrillDown }) => {
  const { formatAmount } = useData();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());

  const data = useMemo(
    () => computeHeatmapData(transactions, year, month),
    [transactions, year, month],
  );
  const streak = useMemo(
    () => computeNoSpendStreak(transactions, year, month),
    [transactions, year, month],
  );

  const maxAmount = Math.max(...data.map((d) => d.amount), 1);
  const [hoveredDay, setHoveredDay] = useState<HeatmapDay | null>(null);

  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const dayLabels = ["S", "M", "T", "W", "T", "F", "S"];

  const prevMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear(year - 1);
    } else setMonth(month - 1);
  };
  const nextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear(year + 1);
    } else setMonth(month + 1);
  };

  // Calculate offset for first day of month
  const firstDayOffset = new Date(year, month, 1).getDay();

  return (
    <Tooltip content="Calendar heatmap showing daily spending intensity">
      <div className="glass-card flex flex-col h-full rounded-[2rem] p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Flame size={18} className="text-orange-500" />
            <h3 className="text-sm font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
              Spending Heatmap
            </h3>
          </div>

          {/* Month navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={prevMonth}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500 text-sm font-bold"
            >
              ←
            </button>
            <span className="text-xs font-bold text-slate-600 dark:text-zinc-300 min-w-[70px] text-center">
              {monthNames[month]} {year}
            </span>
            <button
              onClick={nextMonth}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500 text-sm font-bold"
            >
              →
            </button>
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full overflow-x-auto custom-scrollbar pb-2">
          <div className="min-w-[300px]">
            {/* Day labels */}
            <div className="grid grid-cols-7 gap-1 mb-1">
              {dayLabels.map((label, i) => (
                <div
                  key={i}
                  className="text-center text-[10px] font-bold text-slate-400 dark:text-zinc-500"
                >
                  {label}
                </div>
              ))}
            </div>

            {/* Heatmap grid */}
            <div className="grid grid-cols-7 gap-1">
              {/* Empty cells for offset */}
              {Array.from({ length: firstDayOffset }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square" />
              ))}

              {/* Day cells */}
              {data.map((day) => (
                <div
                  key={day.date}
                  className={`aspect-square rounded-lg ${getIntensity(day.amount, maxAmount)} relative cursor-pointer transition-all hover:ring-2 hover:ring-brand-500/50 flex items-center justify-center`}
                  onMouseEnter={() => setHoveredDay(day)}
                  onMouseLeave={() => setHoveredDay(null)}
                  onClick={() => onDrillDown?.({ type: "expense" })}
                >
                  <span className="text-[10px] font-bold text-slate-500 dark:text-white/50">
                    {day.dayOfMonth}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tooltip */}
        {hoveredDay && (
          <div className="mt-3 flex items-center justify-between bg-slate-50 dark:bg-white/5 rounded-xl px-4 py-2">
            <span className="text-xs font-bold text-slate-600 dark:text-zinc-300">
              {new Date(hoveredDay.date).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
              })}
            </span>
            <div className="flex items-center gap-3 text-xs font-bold">
              <span className="text-slate-500 dark:text-zinc-400">
                Spent:{" "}
                <span className="text-slate-800 dark:text-white">
                  {formatAmount(hoveredDay.amount)}
                </span>
              </span>
              <span className="text-slate-500 dark:text-zinc-400">
                Txns:{" "}
                <span className="text-slate-800 dark:text-white">
                  {hoveredDay.count}
                </span>
              </span>
            </div>
          </div>
        )}

        {/* Streak info */}
        <div className="mt-3 flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-400">
              No-spend days:{" "}
              <span className="text-slate-800 dark:text-white">
                {streak.noSpendDays}
              </span>
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-violet-500" />
            <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-400">
              Longest streak:{" "}
              <span className="text-slate-800 dark:text-white">
                {streak.longest} day{streak.longest !== 1 ? "s" : ""}
              </span>
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-3 flex items-center gap-2 justify-end">
          <span className="text-[10px] text-slate-400">Less</span>
          {[
            "bg-slate-100 dark:bg-white/5",
            "bg-emerald-200 dark:bg-emerald-900/50",
            "bg-emerald-400 dark:bg-emerald-700/60",
            "bg-emerald-500 dark:bg-emerald-600/70",
            "bg-emerald-700 dark:bg-emerald-500",
          ].map((cls, i) => (
            <div key={i} className={`w-3 h-3 rounded-sm ${cls}`} />
          ))}
          <span className="text-[10px] text-slate-400">More</span>
        </div>
      </div>
    </Tooltip>
  );
};
