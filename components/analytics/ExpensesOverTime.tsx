import React, { useMemo } from "react";
import { Transaction } from "../../types";
import { useData } from "../../context/DataContext";
import { computeExpensesOverTime } from "../../utils/analyticsEngine";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  CartesianGrid,
} from "recharts";
import { TrendingDown } from "lucide-react";
import Tooltip from "../Tooltip";

interface Props {
  transactions: Transaction[];
}

export const ExpensesOverTime: React.FC<Props> = ({ transactions }) => {
  const { formatAmount } = useData();

  const data = useMemo(
    () => computeExpensesOverTime(transactions),
    [transactions],
  );

  if (data.length === 0) {
    return (
      <div className="glass-card flex flex-col items-center justify-center min-h-[200px] h-full rounded-[2rem] p-6 text-center">
        <TrendingDown
          size={32}
          className="mx-auto text-slate-300 dark:text-white/20 mb-3"
        />
        <p className="text-sm text-slate-500 dark:text-zinc-400">
          No expense data to chart.
        </p>
      </div>
    );
  }

  return (
    <Tooltip content="Daily spending trend over time">
      <div className="glass-card flex flex-col h-full rounded-[2rem] p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingDown size={18} className="text-rose-500" />
          <h3 className="text-sm font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
            Expenses Over Time
          </h3>
        </div>

        <div className="flex-1 min-h-[250px] flex flex-col justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#e2e8f0"
                className="dark:opacity-10"
              />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: "#94a3b8" }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis hide />
              <RechartsTooltip
                cursor={{ fill: "transparent", stroke: "transparent" }}
                content={({ active, payload }) => {
                  if (!active || !payload?.[0]) return null;
                  const d = payload[0].payload;
                  return (
                    <div className="bg-slate-900 dark:bg-zinc-800 text-white px-3 py-2 rounded-xl text-xs font-bold shadow-xl">
                      <p>{d.label}</p>
                      <p className="text-rose-300">{formatAmount(d.amount)}</p>
                    </div>
                  );
                }}
              />
              <Area
                type="monotone"
                dataKey="amount"
                stroke="#f43f5e"
                strokeWidth={2}
                fill="url(#expGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Tooltip>
  );
};
