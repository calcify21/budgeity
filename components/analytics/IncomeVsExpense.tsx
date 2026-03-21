import React, { useMemo } from "react";
import { Transaction } from "../../types";
import { useData } from "../../context/DataContext";
import { computeIncomeVsExpense } from "../../utils/analyticsEngine";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { ArrowLeftRight } from "lucide-react";
import Tooltip from "../Tooltip";

interface Props {
  transactions: Transaction[];
}

export const IncomeVsExpense: React.FC<Props> = ({ transactions }) => {
  const { formatAmount } = useData();

  const data = useMemo(
    () => computeIncomeVsExpense(transactions),
    [transactions],
  );

  if (data.length === 0) {
    return (
      <div className="glass-card flex flex-col items-center justify-center min-h-[200px] h-full rounded-[2rem] p-6 text-center">
        <ArrowLeftRight
          size={32}
          className="mx-auto text-slate-300 dark:text-white/20 mb-3"
        />
        <p className="text-sm text-slate-500 dark:text-zinc-400">
          No data available.
        </p>
      </div>
    );
  }

  return (
    <Tooltip content="Compare income and expense trends over time">
      <div className="glass-card flex flex-col h-full rounded-[2rem] p-6">
        <div className="flex items-center gap-2 mb-4">
          <ArrowLeftRight size={18} className="text-brand-500" />
          <h3 className="text-sm font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
            Income vs Expense
          </h3>
        </div>

        <div className="flex-1 min-h-[250px] flex flex-col justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
            >
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
                  if (!active || !payload?.length) return null;
                  const d = payload[0]?.payload;
                  return (
                    <div className="bg-slate-900 dark:bg-zinc-800 text-white px-3 py-2 rounded-xl text-xs font-bold shadow-xl">
                      <p className="mb-1">{d?.label}</p>
                      <p className="text-emerald-300">
                        Income: {formatAmount(d?.income || 0)}
                      </p>
                      <p className="text-rose-300">
                        Expense: {formatAmount(d?.expense || 0)}
                      </p>
                    </div>
                  );
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: 11, fontWeight: 700 }}
                iconType="circle"
                iconSize={8}
              />
              <Line
                type="monotone"
                dataKey="income"
                stroke="#10b981"
                strokeWidth={2}
                dot={false}
                name="Income"
              />
              <Line
                type="monotone"
                dataKey="expense"
                stroke="#f43f5e"
                strokeWidth={2}
                dot={false}
                name="Expense"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Tooltip>
  );
};
