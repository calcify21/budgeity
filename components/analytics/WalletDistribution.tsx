import React, { useMemo } from "react";
import { useData } from "../../context/DataContext";
import { computeWalletDistribution } from "../../utils/analyticsEngine";
import {
  BarChart,
  Bar,
  XAxis,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  Cell,
} from "recharts";
import { WalletIcon } from "lucide-react";
import Tooltip from "../Tooltip";

export const WalletDistribution: React.FC = () => {
  const { wallets, formatAmount } = useData();

  const data = useMemo(() => computeWalletDistribution(wallets), [wallets]);

  if (data.length === 0) {
    return (
      <div className="glass-card flex flex-col items-center justify-center min-h-[200px] h-full rounded-[2rem] p-6 text-center">
        <WalletIcon
          size={32}
          className="mx-auto text-slate-300 dark:text-white/20 mb-3"
        />
        <p className="text-sm text-slate-500 dark:text-zinc-400">
          No wallet balances to display.
        </p>
      </div>
    );
  }

  return (
    <Tooltip content="Balance distribution across your wallets">
      <div className="glass-card flex flex-col h-full rounded-[2rem] p-6">
        <div className="flex items-center gap-2 mb-4">
          <WalletIcon size={18} className="text-brand-500" />
          <h3 className="text-sm font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
            Wallet Distribution
          </h3>
        </div>

        <div className="flex-1 min-h-[200px] flex flex-col justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
            >
              <XAxis
                dataKey="name"
                tick={{ fontSize: 10, fontWeight: 700, fill: "#94a3b8" }}
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
                      <p>{d.name}</p>
                      <p className="text-brand-300">
                        {formatAmount(d.balance)}
                      </p>
                    </div>
                  );
                }}
              />
              <Bar dataKey="balance" radius={[8, 8, 0, 0]} barSize={32}>
                {data.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Tooltip>
  );
};
