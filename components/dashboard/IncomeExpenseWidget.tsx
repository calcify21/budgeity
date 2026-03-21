import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { useData } from "../../context/DataContext";
import { Transaction, TimeRange } from "../../types";
import { calculateTotals, filterTransactionsByRange } from "../../utils/analytics";
import { motion } from "framer-motion";

const MotionDiv = motion.div as any;

interface IncomeExpenseWidgetProps {
  timeRange: TimeRange;
  customStartDate?: string;
  customEndDate?: string;
}

export const IncomeExpenseWidget: React.FC<IncomeExpenseWidgetProps> = ({
  timeRange,
  customStartDate,
  customEndDate,
}) => {
  const { t } = useTranslation();
  const { transactions, formatAmount, wallets, currency } = useData();

  const filteredTransactions = useMemo(
    () => filterTransactionsByRange(transactions, timeRange, customStartDate, customEndDate),
    [transactions, timeRange, customStartDate, customEndDate],
  );

  const { income, expense } = useMemo(() => {
    // Basic income/expense filtering
    // In actual app, we exclude transfers and savings-wallet transactions
    const filtered = filteredTransactions.filter((t) => {
      if (t.type === "transfer") return false;
      const w = wallets.find((w) => w.id === (t.type === "income" ? t.toWalletId : t.fromWalletId));
      if (w && w.type === "savings") return false;
      return true;
    });

    return calculateTotals(filtered);
  }, [transactions, wallets, timeRange]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full h-full">
      {/* Income Card */}
      <MotionDiv
        whileHover={{ scale: 1.02 }}
        className="flex-1 rounded-[2rem] glass-card p-6 relative overflow-hidden cursor-default"
      >
        <div className="absolute right-0 top-0 w-32 h-32 bg-emerald-500/10 blur-[50px] rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <ArrowUpRight size={20} />
            </div>
            <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {t("common.income")}
            </span>
          </div>
          <div
            className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight truncate w-full"
            title={formatAmount(income)}
          >
            {formatAmount(income)}
          </div>
        </div>
      </MotionDiv>

      {/* Expense Card */}
      <MotionDiv
        whileHover={{ scale: 1.02 }}
        className="flex-1 rounded-[2rem] glass-card p-6 relative overflow-hidden cursor-default"
      >
        <div className="absolute right-0 top-0 w-32 h-32 bg-rose-500/10 blur-[50px] rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500">
              <ArrowDownRight size={20} />
            </div>
            <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {t("common.expense")}
            </span>
          </div>
          <div
            className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight truncate w-full"
            title={formatAmount(expense)}
          >
            {formatAmount(expense)}
          </div>
        </div>
      </MotionDiv>
    </div>
  );
};
