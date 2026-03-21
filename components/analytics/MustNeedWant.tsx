import React, { useMemo } from "react";
import { Transaction } from "../../types";
import { useData } from "../../context/DataContext";
import { computeSpendingNatureBreakdown } from "../../utils/analyticsEngine";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from "recharts";
import { Layers } from "lucide-react";
import Tooltip from "../Tooltip";

interface Props {
  transactions: Transaction[];
  onDrillDown?: (filters: { category?: string; type?: string; wallet?: string }) => void;
}

const NATURE_COLORS = {
  must: "#ef4444",
  need: "#f59e0b",
  want: "#8b5cf6",
};

export const MustNeedWant: React.FC<Props> = ({ transactions, onDrillDown }) => {
  const { categories, formatAmount } = useData();

  const breakdown = useMemo(
    () => computeSpendingNatureBreakdown(transactions, categories),
    [transactions, categories],
  );

  const chartData = [
    {
      name: "Must",
      value: breakdown.must,
      color: NATURE_COLORS.must,
      pct: breakdown.mustPct,
    },
    {
      name: "Need",
      value: breakdown.need,
      color: NATURE_COLORS.need,
      pct: breakdown.needPct,
    },
    {
      name: "Want",
      value: breakdown.want,
      color: NATURE_COLORS.want,
      pct: breakdown.wantPct,
    },
  ].filter((d) => d.value > 0);

  const essentialPct = breakdown.mustPct + breakdown.needPct;

  if (breakdown.total === 0) {
    return (
      <div className="glass-card flex flex-col items-center justify-center min-h-[200px] h-full rounded-[2rem] p-6 text-center">
        <Layers
          size={32}
          className="mx-auto text-slate-300 dark:text-white/20 mb-3"
        />
        <p className="text-sm text-slate-500 dark:text-zinc-400">
          No expense data available.
        </p>
      </div>
    );
  }

  return (
    <Tooltip content="Spending breakdown by nature: Must (critical), Need (adjustable), Want (discretionary)">
      <div className="glass-card flex flex-col h-full rounded-[2rem] p-6">
        <div className="flex items-center gap-2 mb-4">
          <Layers size={18} className="text-brand-500" />
          <h3 className="text-sm font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
            Must vs Need vs Want
          </h3>
        </div>

        <div className="flex-1 flex flex-col sm:flex-row items-center justify-center gap-6">
          <div className="w-[180px] h-[180px] shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                  strokeWidth={0}
                  onClick={(entry) => onDrillDown?.({ type: "expense" })}
                >
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
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
                          {formatAmount(d.value)} ({d.pct}%)
                        </p>
                      </div>
                    );
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex-1 space-y-3">
            {chartData.map((item) => (
              <div key={item.name} className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold">{item.name}</span>
                    <span
                      className="text-xs font-bold"
                      style={{ color: item.color }}
                    >
                      {item.pct}%
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${item.pct}%`,
                        backgroundColor: item.color,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}

            <div className="mt-4 pt-3 border-t border-slate-200 dark:border-white/10 space-y-1">
              <div className="flex justify-between text-[11px] font-bold">
                <span className="text-slate-500 dark:text-zinc-400">
                  Essential (Must+Need)
                </span>
                <span className="text-slate-800 dark:text-white">
                  {essentialPct}%
                </span>
              </div>
              <div className="flex justify-between text-[11px] font-bold">
                <span className="text-slate-500 dark:text-zinc-400">
                  Discretionary (Want)
                </span>
                <span className="text-violet-500">{breakdown.wantPct}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Tooltip>
  );
};
