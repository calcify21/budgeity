import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import { useData } from "../../context/DataContext";

import { Transaction, TimeRange } from "../../types";
import { filterTransactionsByRange } from "../../utils/analytics";

interface BalanceTrendWidgetProps {
  timeRange: TimeRange;
  customStartDate?: string;
  customEndDate?: string;
}

export const BalanceTrendWidget: React.FC<BalanceTrendWidgetProps> = ({
  timeRange,
  customStartDate,
  customEndDate,
}) => {
  const { t } = useTranslation();
  const { wallets, goals, transactions, formatAmount } = useData();

  const activeColor = "#10b981";

  const daysToInclude = useMemo(() => {
    switch (timeRange) {
      case "this_month":
        return new Date().getDate();
      case "last_month":
        return 30;
      case "last_3_months":
        return 90;
      case "last_6_months":
        return 180;
      case "this_year":
        return 365;
      case "last_year":
        return 365;
      case "all_time":
        return 365;
      case "custom":
        if (customStartDate && customEndDate) {
          const s = new Date(customStartDate);
          const e = new Date(customEndDate);
          return Math.ceil((e.getTime() - s.getTime()) / (1000 * 3600 * 24)) + 1;
        }
        return 30;
      default:
        return 30;
    }
  }, [timeRange, customStartDate, customEndDate]);

  const filteredTransactions = useMemo(
    () => filterTransactionsByRange(transactions, timeRange, customStartDate, customEndDate),
    [transactions, timeRange, customStartDate, customEndDate],
  );

  const { chartData } = useMemo(() => {
    const data: any[] = [];
    
    const now = new Date();
    
    // Determine the range bounds
    if (filteredTransactions.length === 0 && timeRange !== "this_month") {
       // Fallback for empty range
    }

    const totalBalance =
      wallets
        .filter((w) => !w.isGoalWallet)
        .reduce((acc, w) => acc + w.balance, 0) || 0;
    const totalGoals = goals.reduce((acc, g) => acc + g.currentBalance, 0) || 0;

    // use daysToInclude from useMemo

    let runningBalance = totalBalance;
    const sorted = [...transactions].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    const toDateKey = (date: Date) => {
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, "0");
      const dd = String(date.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    };

    const startDate = new Date(now);
    startDate.setHours(0, 0, 0, 0);

    for (let i = 0; i < daysToInclude; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() - i);
      const dateKey = toDateKey(d);

      data.push({
        date: d.toLocaleDateString("en-US", { day: "numeric", month: "short" }),
        balance: runningBalance + totalGoals,
      });

      const txsOnDay = sorted.filter((t) => {
        if (!t.date) return false;
        const dt = new Date(t.date);
        return toDateKey(dt) === dateKey;
      });

      txsOnDay.forEach((t) => {
        if (t.type === "income") runningBalance -= t.amount;
        if (t.type === "expense") runningBalance += t.amount;
      });
    }
    return { chartData: data.reverse() };
  }, [wallets, transactions, goals, timeRange]);

  return (
    <div className="tour-balance-trend w-full rounded-[2rem] glass-card p-8 h-full">
      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
        {t("dashboard.balance_trend")}
      </h3>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorBal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={activeColor} stopOpacity={0.2} />
                <stop offset="95%" stopColor={activeColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: "#71717a" }}
              minTickGap={40}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: "#71717a" }}
              tickFormatter={(val) =>
                val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val
              }
              width={35}
            />
            <RechartsTooltip
              contentStyle={{
                borderRadius: "12px",
                border: "none",
                background: "rgba(255, 255, 255, 0.95)",
                boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                padding: "12px 16px",
              }}
              itemStyle={{ color: "#000", fontWeight: "bold" }}
              formatter={(value: number) => [formatAmount(value), "Balance"]}
            />
            <Area
              type="monotone"
              dataKey="balance"
              stroke={activeColor}
              strokeWidth={4}
              fillOpacity={1}
              fill="url(#colorBal)"
              animationDuration={1000}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
