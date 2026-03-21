import React, { useMemo } from "react";
import { Transaction } from "../../types";
import { useData } from "../../context/DataContext";
import { computeCategoryDistribution } from "../../utils/analyticsEngine";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from "recharts";
import { PieChartIcon } from "lucide-react";
import Tooltip from "../Tooltip";
import { cn } from "../../utils";

interface Props {
  transactions: Transaction[];
  onCategorySelect?: (categoryId: string) => void;
  onDrillDown?: (filters: { category?: string; type?: string; wallet?: string }) => void;
}

export const CategoryDistribution: React.FC<Props> = ({
  transactions,
  onCategorySelect,
  onDrillDown,
}) => {
  const { categories, formatAmount } = useData();

  const data = useMemo(
    () => computeCategoryDistribution(transactions, categories),
    [transactions, categories],
  );

  if (data.length === 0) {
    return (
      <div className="glass-card flex flex-col items-center justify-center min-h-[200px] h-full rounded-[2rem] p-6 text-center">
        <PieChartIcon
          size={32}
          className="mx-auto text-slate-300 dark:text-white/20 mb-3"
        />
        <p className="text-sm text-slate-500 dark:text-zinc-400">
          No expense data to display.
        </p>
      </div>
    );
  }

  return (
    <Tooltip content="Expense distribution across categories">
      <div className="p-6 md:p-8 bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-slate-200 dark:border-white/5 shadow-sm h-full w-full flex flex-col">
        <h3 className="text-xl font-bold mb-6 flex items-center justify-between">
          <span>Spending by Category</span>
          <span className="text-xs font-medium text-slate-400 uppercase tracking-widest hidden sm:inline-block">
            {onCategorySelect ? "Tap to Drill Down" : "Category Breakdown"}
          </span>
        </h3>

        <div className="flex-1 flex flex-col gap-6 justify-center">
          {/* Chart */}
          <div className="h-[300px] w-full relative shrink-0">
            {/* Central Label for Donut */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                Total Spent
              </p>
              <h4 className="text-2xl font-bold text-slate-900 dark:text-white">
                {formatAmount(data.reduce((sum, item) => sum + item.value, 0))}
              </h4>
            </div>

            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={110}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                  cornerRadius={6}
                  onClick={(entry) => {
                    onCategorySelect?.(entry.id);
                    onDrillDown?.({ category: entry.id, type: "expense" });
                  }}
                >
                  {data.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      className="cursor-pointer transition-all duration-300 outline-none hover:opacity-100 opacity-80"
                    />
                  ))}
                </Pie>
                <RechartsTooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.[0]) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="bg-slate-900 dark:bg-zinc-800 text-white px-3 py-2 rounded-xl text-xs font-bold shadow-xl">
                        <p>{d.name}</p>
                        <p className="text-slate-300">
                          {formatAmount(d.value)} ({d.percentage}%)
                        </p>
                      </div>
                    );
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 mt-4">
            {data.slice(0, 8).map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  onCategorySelect?.(item.id);
                  onDrillDown?.({ category: item.id, type: "expense" });
                }}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                  {item.name}
                </span>
                <span className="text-xs font-bold text-slate-400">
                  {item.percentage}%
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </Tooltip>
  );
};
