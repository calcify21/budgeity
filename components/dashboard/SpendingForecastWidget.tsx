import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Sparkles,
  Minus,
  ChevronRight,
} from "lucide-react";
import { useData } from "../../context/DataContext";
import { TimeRange } from "../../types";
import { calculateSpendingForecast } from "../../utils/analytics";
import { cn } from "../../utils";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const MotionDiv = motion.div as any;

interface SpendingForecastWidgetProps {
  timeRange: TimeRange;
  customStartDate?: string;
  customEndDate?: string;
}

export const SpendingForecastWidget: React.FC<SpendingForecastWidgetProps> = ({ timeRange, customStartDate, customEndDate }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { transactions, categories, wallets, budgets, formatAmount } = useData();

  const forecast = useMemo(
    () =>
      calculateSpendingForecast(
        transactions,
        categories,
        wallets.map((w) => ({ id: w.id, type: w.type })),
        budgets.map((b) => ({ categoryId: b.categoryId, amount: b.amount })),
        timeRange,
        customStartDate,
        customEndDate
      ),
    [transactions, categories, wallets, budgets, timeRange, customStartDate, customEndDate],
  );

  const overBudgetCategories = forecast.categoryForecasts.filter(
    (c) => c.isOverBudget,
  );
  const topCategories = forecast.categoryForecasts.slice(0, 3);

  const trendIsUp = forecast.monthOverMonthChange > 0;
  const trendIsDown = forecast.monthOverMonthChange < 0;
  const changeAbs = Math.abs(forecast.monthOverMonthChange);

  // Progress through the month (0 to 1)
  const monthProgress = forecast.daysPassed / forecast.totalDaysInMonth;
  // How much of the projected spend is already spent
  const spendProgress =
    forecast.projectedMonthEnd > 0
      ? Math.min(forecast.currentMonthSpend / forecast.projectedMonthEnd, 1)
      : 0;

  const confidenceLabel =
    forecast.confidence === "high"
      ? t("forecast.confidence_high", "High confidence")
      : forecast.confidence === "medium"
        ? t("forecast.confidence_medium", "Medium confidence")
        : t("forecast.confidence_low", "Low confidence — limited data");

  const confidenceColor =
    forecast.confidence === "high"
      ? "text-emerald-500"
      : forecast.confidence === "medium"
        ? "text-amber-500"
        : "text-slate-400";

  return (
    <div className="glass-card rounded-[2rem] p-6 relative overflow-hidden cursor-default">
      {/* Decorative background */}
      <div className="absolute right-0 top-0 w-48 h-48 bg-gradient-to-bl from-brand-500/10 via-indigo-500/5 to-transparent blur-[60px] rounded-full -translate-y-1/4 translate-x-1/4 pointer-events-none" />
      <div className="absolute left-0 bottom-0 w-32 h-32 bg-purple-500/5 blur-[40px] rounded-full translate-y-1/4 -translate-x-1/4 pointer-events-none" />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-500/20 to-indigo-500/20 flex items-center justify-center">
              <Sparkles size={20} className="text-brand-500" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                {t("forecast.title", "Spending Forecast")}
              </h3>
              <div className={cn("text-[10px] font-bold uppercase tracking-widest", confidenceColor)}>
                {confidenceLabel}
              </div>
            </div>
          </div>
          <button
            onClick={() => navigate("/analytics")}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-colors text-slate-400"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Main Projection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
          {/* Projected Spend */}
          <MotionDiv
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl bg-slate-50 dark:bg-white/5 p-4 border border-slate-100 dark:border-white/5"
          >
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-1">
              {t("forecast.projected_month_end", "Projected Month-End")}
            </p>
            <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {formatAmount(forecast.projectedMonthEnd)}
            </p>
            <div className="flex items-center gap-1.5 mt-2">
              {trendIsUp ? (
                <TrendingUp size={14} className="text-rose-500" />
              ) : trendIsDown ? (
                <TrendingDown size={14} className="text-emerald-500" />
              ) : (
                <Minus size={14} className="text-slate-400" />
              )}
              <span
                className={cn(
                  "text-xs font-bold",
                  trendIsUp
                    ? "text-rose-500"
                    : trendIsDown
                      ? "text-emerald-500"
                      : "text-slate-400",
                )}
              >
                {changeAbs > 0
                  ? `${changeAbs}% ${trendIsUp ? t("forecast.higher", "higher") : t("forecast.lower", "lower")} ${t("forecast.than_last_month", "than last month")}`
                  : t("forecast.same_as_last", "Same as last month")}
              </span>
            </div>
          </MotionDiv>

          {/* Daily Burn */}
          <MotionDiv
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl bg-slate-50 dark:bg-white/5 p-4 border border-slate-100 dark:border-white/5"
          >
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-1">
              {t("forecast.daily_average", "Daily Average")}
            </p>
            <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {formatAmount(forecast.dailyBurnRate)}
              <span className="text-xs font-bold text-slate-400 ml-1">
                /{t("forecast.day", "day")}
              </span>
            </p>
            <p className="text-xs text-slate-400 dark:text-zinc-500 mt-2 font-medium">
              {t("forecast.days_remaining", "{{days}} days remaining", {
                days: forecast.daysRemaining,
              })}
            </p>
          </MotionDiv>
        </div>

        {/* Month Progress Bar */}
        <MotionDiv
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mb-5"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              {t("forecast.month_progress", "Month Progress")}
            </span>
            <span className="text-[10px] font-bold text-slate-500">
              {t("forecast.spent_of_projected", "{{spent}} of {{projected}}", {
                spent: formatAmount(forecast.currentMonthSpend),
                projected: formatAmount(forecast.projectedMonthEnd),
              })}
            </span>
          </div>
          <div className="relative h-3 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
            {/* Projected zone */}
            <div
              className="absolute h-full bg-slate-200 dark:bg-white/10 rounded-full transition-all duration-700"
              style={{ width: `${monthProgress * 100}%` }}
            />
            {/* Actual spend */}
            <motion.div
              className="absolute h-full bg-gradient-to-r from-brand-500 to-indigo-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${spendProgress * 100}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
        </MotionDiv>

        {/* Budget Warnings */}
        {overBudgetCategories.length > 0 && (
          <MotionDiv
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-5 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 p-4"
          >
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={14} className="text-rose-500" />
              <span className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                {t("forecast.budget_alert", "Budget Alert")}
              </span>
            </div>
            <div className="space-y-2">
              {overBudgetCategories.slice(0, 3).map((cat) => (
                <div
                  key={cat.categoryId}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: cat.categoryColor }}
                    />
                    <span className="text-xs font-semibold text-rose-700 dark:text-rose-300">
                      {cat.categoryName}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
                    {formatAmount(cat.projectedSpend)} / {formatAmount(cat.budgetAmount || 0)}
                  </span>
                </div>
              ))}
            </div>
          </MotionDiv>
        )}

        {/* Top Categories */}
        {topCategories.length > 0 && (
          <MotionDiv
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-3">
              {t("forecast.top_categories", "Top Projected Categories")}
            </p>
            <div className="space-y-2">
              {topCategories.map((cat) => {
                const pct =
                  forecast.projectedMonthEnd > 0
                    ? (cat.projectedSpend / forecast.projectedMonthEnd) * 100
                    : 0;

                return (
                  <div key={cat.categoryId} className="group">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2.5 h-2.5 rounded-full shadow-sm"
                          style={{ backgroundColor: cat.categoryColor }}
                        />
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          {cat.categoryName}
                        </span>
                      </div>
                      <span className="text-xs font-black text-slate-900 dark:text-white">
                        {formatAmount(cat.projectedSpend)}
                      </span>
                    </div>
                    <div className="h-1.5 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: cat.categoryColor }}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, ease: "easeOut", delay: 0.6 }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </MotionDiv>
        )}
      </div>
    </div>
  );
};
