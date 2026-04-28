import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Activity, Flame, AlertTriangle } from "lucide-react";
import { useData } from "../../context/DataContext";
import { Transaction, TimeRange, Wallet } from "../../types";
import {
  calculateTotals,
  calculateSavingsRate,
  calculateBurnRate,
  calculateProjection,
  getDaysInMonth,
  filterTransactionsByRange,
} from "../../utils/analytics";
import { cn } from "../../utils";
import { motion } from "framer-motion";

const MotionDiv = motion.div as any;

interface SnapshotWidgetProps {
  timeRange: TimeRange;
  customStartDate?: string;
  customEndDate?: string;
}

export const SnapshotWidget: React.FC<SnapshotWidgetProps> = ({
  timeRange,
  customStartDate,
  customEndDate,
}) => {
  const { t } = useTranslation();
  const { transactions, formatAmount, wallets } = useData();

  const metrics = useMemo(() => {
    const filtered = filterTransactionsByRange(transactions, timeRange, customStartDate, customEndDate).filter((t) => {
      if (t.type === "transfer") return false;
      const w = wallets.find((w) => w.id === (t.type === "income" ? t.toWalletId : t.fromWalletId));
      if (w && w.type === "savings") return false;
      return true;
    });

    const { income, expense } = calculateTotals(filtered);
    const savingsRate = calculateSavingsRate(income, expense);

    // Dynamic days calculation based on range
    const now = new Date();
    let daysPassed = now.getDate();
    let totalDays = getDaysInMonth(now.getMonth(), now.getFullYear());

    if (timeRange === "last_month") {
      const lastMonth = new Date();
      lastMonth.setMonth(now.getMonth() - 1);
      daysPassed = totalDays = getDaysInMonth(lastMonth.getMonth(), lastMonth.getFullYear());
    } else if (timeRange === "this_year") {
      const yearStart = new Date(now.getFullYear(), 0, 1);
      daysPassed = Math.max(1, Math.ceil((now.getTime() - yearStart.getTime()) / (1000 * 60 * 60 * 24)));
      totalDays = 365; // Simplified
    } else if (timeRange === "last_year") {
      daysPassed = totalDays = 365;
    } else if (timeRange.includes("months")) {
      const months = parseInt(timeRange.split("_")[1]);
      const rangeStart = new Date();
      rangeStart.setMonth(now.getMonth() - months);
      daysPassed = Math.max(1, Math.ceil((now.getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24)));
      totalDays = months * 30; // Approx
    }

    const burnRate = calculateBurnRate(expense, daysPassed);
    const projectedSpend = calculateProjection(burnRate, totalDays);
    const overspendWarning = projectedSpend > income && income > 0;

    return { savingsRate, burnRate, projectedSpend, overspendWarning };
  }, [transactions, wallets, timeRange, customStartDate, customEndDate]);

  return (
    <MotionDiv
      whileHover={{ scale: 1.01 }}
      className="tour-dash-snapshot flex-1 rounded-[2rem] bg-indigo-50 dark:bg-zinc-900/50 border border-indigo-100 dark:border-indigo-500/20 p-6 shadow-sm backdrop-blur-xl relative overflow-hidden cursor-default h-full"
    >
      <div className="absolute right-0 top-0 w-32 h-32 bg-indigo-500/10 blur-[50px] rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="relative z-10 h-full flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500">
              <Activity size={20} />
            </div>
            <span className="text-sm font-semibold text-indigo-900 dark:text-indigo-200 uppercase tracking-wider">
              {t("dashboard.snapshot")}
            </span>
          </div>
        </div>

        <div className="space-y-4 w-full">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500 dark:text-zinc-400">
              {t("dashboard.savings_rate")}
            </span>
            <span
              className={cn(
                "font-bold text-lg",
                metrics.savingsRate >= 20
                  ? "text-emerald-500"
                  : metrics.savingsRate > 0
                    ? "text-amber-500"
                    : "text-rose-500",
              )}
            >
              {metrics.savingsRate}%
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500 dark:text-zinc-400 flex items-center gap-1">
              <Flame size={14} className="text-amber-500" />{" "}
              {t("dashboard.daily_burn")}
            </span>
            <span className="font-bold text-slate-900 dark:text-white">
              {formatAmount(metrics.burnRate)}
              <span className="text-xs text-slate-400">/day</span>
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500 dark:text-zinc-400">
              {t("dashboard.projected_spend")}
            </span>
            <span
              className={cn(
                "font-bold flex items-center gap-1",
                metrics.overspendWarning
                  ? "text-rose-500"
                  : "text-slate-900 dark:text-white",
              )}
            >
              {formatAmount(metrics.projectedSpend)}
              {metrics.overspendWarning && (
                <span title="Projected to exceed income">
                  <AlertTriangle size={14} />
                </span>
              )}
            </span>
          </div>
        </div>
      </div>
    </MotionDiv>
  );
};
