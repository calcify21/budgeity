import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRightLeft,
} from "lucide-react";
import { useData } from "../../context/DataContext";
import { formatDate } from "../../utils";

export const RecentTransactionsWidget: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { transactions, categories, formatAmount, wallets } = useData();

  const recentTransactions = useMemo(() => {
    return transactions
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [transactions]);

  return (
    <div className="glass-card rounded-[2rem] p-6 h-full flex flex-col cursor-default">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold flex items-center gap-2">
          <Activity className="text-brand-500" size={18} />{" "}
          {t("dashboard.recent_transactions", "Recent Transactions")}
        </h3>
        <button
          onClick={() => navigate("/transactions")}
          className="text-xs font-bold text-brand-600 hover:text-brand-700 transition-colors"
        >
          {t("common.see_all")}
        </button>
      </div>

      {recentTransactions.length === 0 ? (
        <div className="text-center text-slate-400 py-6 text-sm flex-1 flex items-center justify-center">
          {t("dashboard.no_transactions", "No recent transactions")}
        </div>
      ) : (
        <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar pr-2">
          {recentTransactions.map((tx) => {
            const cat = categories.find((c) => c.id === tx.categoryId);
            const isIncome = tx.type === "income";
            const isTransfer = tx.type === "transfer";
            const dateStr = formatDate(tx.date);

            return (
              <div
                key={tx.id}
                className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/50 dark:bg-black/20 border border-slate-100 dark:border-white/5 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm"
                    style={{
                      backgroundColor: isTransfer
                        ? "#94a3b830"
                        : `${cat?.color}20`,
                      color: isTransfer ? "#94a3b8" : cat?.color,
                    }}
                  >
                    {isIncome ? (
                      <ArrowDownRight size={18} />
                    ) : isTransfer ? (
                      <ArrowRightLeft size={18} />
                    ) : (
                      <ArrowUpRight size={18} />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-slate-900 dark:text-white truncate">
                      {isTransfer
                        ? t("common.transfer")
                        : cat?.name || t("common.unknown")}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      {tx.note || dateStr}
                    </p>
                  </div>
                </div>
                <div
                  className={`font-bold shrink-0 ${
                    isIncome
                      ? "text-emerald-500"
                      : isTransfer
                        ? "text-slate-500"
                        : "text-slate-900 dark:text-white"
                  }`}
                >
                  {isIncome ? "+" : isTransfer ? "" : "-"}
                  {formatAmount(tx.amount)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
