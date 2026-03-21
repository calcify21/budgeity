import React, { useMemo } from "react";
import { Transaction } from "../../types";
import { useData } from "../../context/DataContext";
import { computeExpensesByDayOfWeek } from "../../utils/analyticsEngine";
import {
  BarChart,
  Bar,
  XAxis,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  Cell,
} from "recharts";
import { CalendarDays } from "lucide-react";
import Tooltip from "../Tooltip";

interface Props {
  transactions: Transaction[];
  onDrillDown?: (filters: { category?: string; type?: string; wallet?: string }) => void;
}

export const SpendingByDay: React.FC<Props> = ({ transactions, onDrillDown }) => {
  const { formatAmount } = useData();

  const data = useMemo(
    () => computeExpensesByDayOfWeek(transactions),
    [transactions],
  );

  const maxVal = Math.max(...data.map((d) => d.total));

  if (maxVal === 0) {
    return (
      <div className="glass-card flex flex-col items-center justify-center min-h-[200px] h-full rounded-[2rem] p-6 text-center">
        <CalendarDays
          size={32}
          className="mx-auto text-slate-300 dark:text-white/20 mb-3"
        />
        <p className="text-sm text-slate-500 dark:text-zinc-400">
          No spending data.
        </p>
      </div>
    );
  }

  return (
    <Tooltip content="Total spending breakdown by day of week">
      <div
        onClick={() => onDrillDown?.({ type: "expense" })}
        className="glass-card flex flex-col justify-center h-full rounded-[2rem] p-5 cursor-pointer hover:scale-[1.02] transition-transform"
      >
        <div className="flex items-center gap-2 mb-4">
          <CalendarDays size={18} className="text-brand-500" />
          <h3 className="text-sm font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
            Spending by Day
          </h3>
        </div>

        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
            >
              <XAxis
                dataKey="short"
                tick={{ fontSize: 11, fontWeight: 700, fill: "#94a3b8" }}
                tickLine={false}
                axisLine={false}
              />
              <RechartsTooltip
                cursor={{ fill: "transparent" }}
                content={({ active, payload }) => {
                  if (!active || !payload?.[0]) return null;
                  const d = payload[0].payload;
                  return (
                    <div className="bg-slate-900 dark:bg-zinc-800 text-white px-3 py-2 rounded-xl text-xs font-bold shadow-xl">
                      <p>{d.day}</p>
                      <p className="text-brand-300">{formatAmount(d.total)}</p>
                    </div>
                  );
                }}
              />
              <Bar dataKey="total" radius={[8, 8, 0, 0]} barSize={28}>
                {data.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={entry.total === maxVal ? "#6366f1" : "#a5b4fc"}
                    className="dark:opacity-80"
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Tooltip>
  );
};
