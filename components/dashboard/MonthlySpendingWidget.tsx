import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from "recharts";
import { PieChart as PieChartIcon, ChevronRight } from "lucide-react";
import { useData } from "../../context/DataContext";
import { cn } from "../../utils";
import { useNavigate } from "react-router-dom";
import { Transaction, Category, TimeRange } from "../../types";
import { filterTransactionsByRange } from "../../utils/analytics";

interface MonthlySpendingWidgetProps {
  timeRange: TimeRange;
  customStartDate?: string;
  customEndDate?: string;
}

export const MonthlySpendingWidget: React.FC<MonthlySpendingWidgetProps> = ({
  timeRange,
  customStartDate,
  customEndDate,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { transactions, categories, formatAmount, wallets } = useData();
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);

  const filteredTransactions = useMemo(
    () => filterTransactionsByRange(transactions, timeRange, customStartDate, customEndDate),
    [transactions, timeRange, customStartDate, customEndDate],
  );

  const { expenseByCategory, totalExpense } = useMemo(() => {
    const expenseTransactions = filteredTransactions.filter((t) => {
      if (t.type !== "expense") return false;
      const w = wallets.find((w) => w.id === t.fromWalletId);
      if (w && w.type === "savings") return false;
      return true;
    });

    const categoryTotals: Record<string, number> = {};
    let total = 0;

    expenseTransactions.forEach((t) => {
      categoryTotals[t.categoryId] =
        (categoryTotals[t.categoryId] || 0) + t.amount;
      total += t.amount;
    });

    const data: any[] = [];
    Object.entries(categoryTotals).forEach(([categoryId, value]) => {
      const cat = categories.find((c) => c.id === categoryId);
      if (cat)
        data.push({
          id: cat.id,
          name: cat.name,
          value,
          color: cat.color || "#64748b",
        });
    });
    return { 
      expenseByCategory: data.sort((a, b) => b.value - a.value),
      totalExpense: total
    };
  }, [transactions, wallets, categories, timeRange]);

  return (
    <div className="glass-card rounded-[2rem] p-6 h-full flex flex-col cursor-default">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-bold flex items-center gap-2">
          <PieChartIcon className="text-brand-500" size={18} />{" "}
          {timeRange === "this_month"
            ? t("dashboard.monthly_spending")
            : t("dashboard.period_spending", "Period Spending")}
        </h3>
        <button
          onClick={() => navigate("/analytics")}
          className="p-1.5 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-colors text-slate-400"
        >
          <ChevronRight size={18} />
        </button>
      </div>
      <div className="mb-4">
        <div className="text-2xl font-black text-slate-900 dark:text-white">
          {formatAmount(totalExpense)}
        </div>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">
          {timeRange === "this_month"
            ? t("dashboard.total_this_month")
            : t("dashboard.total_in_period", "Total in period")}
        </p>
      </div>
      {expenseByCategory.length > 0 ? (
        <div className="flex flex-col gap-4 flex-1">
          <div className="h-[200px] relative w-full group/chart shrink-0">
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-0">
              <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-[0.2em] mb-1">
                {t("dashboard.total_effort", "Total")}
              </span>
              <span className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                {formatAmount(totalExpense)}
              </span>
            </div>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expenseByCategory}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                  stroke="none"
                  cornerRadius={4}
                  onClick={(data) => {
                    setActiveCategoryId(
                      data.id === activeCategoryId ? null : data.id,
                    );
                  }}
                  isAnimationActive={true}
                  animationDuration={1500}
                >
                  {expenseByCategory.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      strokeWidth={0}
                      className={cn(
                        "cursor-pointer transition-all duration-500 outline-none",
                        activeCategoryId === entry.id
                          ? "opacity-100"
                          : activeCategoryId
                            ? "opacity-30"
                            : "opacity-90 hover:opacity-100",
                      )}
                      style={{
                        filter:
                          activeCategoryId === entry.id
                            ? `drop-shadow(0 0 10px ${entry.color}88)`
                            : "none",
                        transform:
                          activeCategoryId === entry.id
                            ? "scale(1.05)"
                            : "scale(1)",
                        transformOrigin: "center",
                      }}
                    />
                  ))}
                </Pie>
                <RechartsTooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border border-slate-100 dark:border-white/10 p-3 rounded-2xl shadow-xl animate-in zoom-in-95 duration-200">
                          <div className="flex items-center gap-2 mb-1">
                            <div
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ backgroundColor: data.color }}
                            />
                            <span className="font-bold text-slate-900 dark:text-white text-sm">
                              {data.name}
                            </span>
                          </div>
                          <div className="text-lg font-black text-slate-900 dark:text-white">
                            {formatAmount(data.value)}
                          </div>
                          <div className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                            {((data.value / totalExpense) * 100).toFixed(1)}% of
                            Spend
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 grid grid-cols-2 gap-2 max-h-[150px]">
            {expenseByCategory.map((item) => (
              <div
                key={item.id}
                onClick={() =>
                  setActiveCategoryId(
                    activeCategoryId === item.id ? null : item.id,
                  )
                }
                className={cn(
                  "flex flex-col justify-center gap-1 p-2 rounded-xl transition-all cursor-pointer group/item",
                  activeCategoryId === item.id
                    ? "bg-slate-100 dark:bg-white/10 ring-1 ring-slate-200 dark:ring-white/10"
                    : "bg-slate-50/50 dark:bg-black/20 hover:bg-slate-100 dark:hover:bg-white/5",
                )}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="w-2 h-2 rounded-full shrink-0 shadow-sm"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 truncate">
                    {item.name}
                  </span>
                </div>
                <div className="text-xs font-black text-slate-900 dark:text-white">
                  {formatAmount(item.value)}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 opacity-50 min-h-[200px]">
          <PieChartIcon size={48} className="mb-4 stroke-[1.5]" />
          <p className="text-sm font-medium tracking-wide">
            {t("dashboard.no_data_interval", "No spending data available")}
          </p>
        </div>
      )}
    </div>
  );
};
