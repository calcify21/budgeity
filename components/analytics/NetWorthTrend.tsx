import React, { useMemo, useState } from "react";
import { useData } from "../../context/DataContext";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  CartesianGrid,
} from "recharts";
import { TrendingUp } from "lucide-react";
import { Transaction } from "../../types";
import Tooltip from "../Tooltip";

type Period = "1w" | "30d" | "3m" | "6m" | "1y" | "all";

interface NetWorthTrendProps {
  transactions?: Transaction[];
}

export const NetWorthTrend: React.FC<NetWorthTrendProps> = ({ transactions: propTransactions }) => {
  const { wallets, goals, transactions: allTransactions, formatAmount } = useData();
  const [period, setPeriod] = useState<Period>("3m");

  const transactions = propTransactions || allTransactions;

  const data = useMemo(() => {
    const now = new Date();
    const daysMap: Record<Period, number> = {
      "1w": 7,
      "30d": 30,
      "3m": 90,
      "6m": 180,
      "1y": 365,
      all: 30, // calculated below
    };
    let days = daysMap[period];
    if (period === "all" && transactions.length > 0) {
      const oldest = transactions.reduce((old, t) => {
        const d = new Date(t.date);
        return d < old ? d : old;
      }, new Date());
      days =
        Math.ceil((now.getTime() - oldest.getTime()) / (1000 * 3600 * 24)) + 1;
      days = Math.max(30, days); // minimum 30 days for styling
    } else if (period === "all") {
      days = 30;
    }
    const start = new Date(now);
    start.setDate(start.getDate() - days);

    // Current net worth
    const currentWalletBalance = wallets
      .filter((w) => !w.archived)
      .reduce((s, w) => s + w.balance, 0);
    const currentGoalBalance = goals
      .filter((g) => g.status === "active")
      .reduce((s, g) => s + g.currentBalance, 0);
    const currentNetWorth = currentWalletBalance + currentGoalBalance;

    // Calculate delta per day, working backwards
    const sortedTxs = [...transactions]
      .filter((t) => new Date(t.date) >= start)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Build daily net worth by subtracting transactions backwards
    const dayPoints: { date: string; value: number }[] = [];
    let runningNW = currentNetWorth;

    // Generate day-by-day points
    const dayMap: Record<string, number> = {};

    // Group tx effects by day
    sortedTxs.forEach((t) => {
      const key = new Date(t.date).toISOString().slice(0, 10);
      if (!dayMap[key]) dayMap[key] = 0;
      if (t.type === "income")
        dayMap[key] -= t.amount; // reverse: subtract income when going back
      else if (t.type === "expense") dayMap[key] += t.amount; // reverse: add expense when going back
      // transfers cancel out for net worth
    });

    // Build forward timeline
    const allDates: string[] = [];
    for (let d = new Date(start); d <= now; d.setDate(d.getDate() + 1)) {
      allDates.push(d.toISOString().slice(0, 10));
    }

    // Walk forward from historical net worth
    const reverseDates = [...allDates].reverse();
    let nw = currentNetWorth;
    const reversePoints: { date: string; value: number }[] = [];
    for (const date of reverseDates) {
      reversePoints.unshift({ date, value: nw });
      if (dayMap[date]) {
        nw += dayMap[date]; // going backwards
      }
    }

    // Sample points to keep chart smooth
    const step = Math.max(1, Math.floor(reversePoints.length / 60));
    return reversePoints
      .filter((_, i) => i % step === 0 || i === reversePoints.length - 1)
      .map((p) => ({
        ...p,
        label: new Date(p.date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
      }));
  }, [wallets, goals, transactions, period]);

  const periods: { key: Period; label: string }[] = [
    { key: "1w", label: "1W" },
    { key: "30d", label: "1M" },
    { key: "3m", label: "3M" },
    { key: "6m", label: "6M" },
    { key: "1y", label: "1Y" },
    { key: "all", label: "All" },
  ];

  return (
    <Tooltip content="Net worth trend: wallet balances + goal balances over time">
      <div className="glass-card flex flex-col h-full rounded-[2rem] p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp size={18} className="text-emerald-500" />
            <h3 className="text-sm font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
              Net Worth Trend
            </h3>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 dark:bg-white/5 rounded-xl p-1">
            {periods.map((p) => (
              <button
                key={p.key}
                onClick={() => setPeriod(p.key)}
                className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-colors ${
                  period === p.key
                    ? "bg-white dark:bg-white/10 text-brand-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-700 dark:text-zinc-400"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 min-h-[250px] flex flex-col justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="nwGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
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
                      <p className="text-emerald-300">
                        {formatAmount(d.value)}
                      </p>
                    </div>
                  );
                }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#10b981"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Tooltip>
  );
};

export default NetWorthTrend;
