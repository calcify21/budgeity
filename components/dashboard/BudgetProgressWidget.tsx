import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { PiggyBank } from "lucide-react";
import { useData } from "../../context/DataContext";
import { isDateInPeriod, cn } from "../../utils";

export const BudgetProgressWidget: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { budgets, transactions, wallets, categories, formatAmount } =
    useData();

  const budgetStats = useMemo(() => {
    return budgets
      .map((b) => {
        const spent = transactions
          .filter((t) => {
            if (t.type !== "expense") return false;
            if (t.categoryId !== b.categoryId) return false;

            // Wallet Filter
            if (b.walletId) {
              if (t.fromWalletId !== b.walletId) return false;
            } else {
              // Global Budget: Exclude Savings Wallets
              const w = wallets.find((w) => w.id === t.fromWalletId);
              if (w && w.type === "savings") return false;
            }

            return isDateInPeriod(
              t.date,
              b.period,
              b.customStartDate,
              b.customEndDate,
            );
          })
          .reduce((acc, t) => acc + t.amount, 0);

        return { ...b, spent, percent: (spent / b.amount) * 100 };
      })
      .sort((a, b) => b.percent - a.percent);
  }, [budgets, transactions, wallets]);

  return (
    <div className="glass-card rounded-[2rem] p-6 h-full flex flex-col cursor-default">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold flex items-center gap-2">
          <PiggyBank className="text-brand-500" size={18} />{" "}
          {t("common.budgets")}
        </h3>
        <button
          onClick={() => navigate("/budgets")}
          className="text-xs font-bold text-brand-600 hover:text-brand-700 transition-colors"
        >
          {t("common.manage")}
        </button>
      </div>
      {budgetStats.length === 0 ? (
        <div className="text-center text-slate-400 py-6 text-sm flex-1 flex items-center justify-center">
          {t("dashboard.no_budgets")}
        </div>
      ) : (
        <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar flex-1">
          {budgetStats.map((b) => {
            const cat = categories.find((c) => c.id === b.categoryId);
            return (
              <div key={b.id}>
                <div className="flex justify-between text-xs font-medium mb-1">
                  <span className="flex items-center gap-1">
                    <div
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: cat?.color }}
                    />
                    <span className="truncate">{b.name}</span>
                  </span>
                  <span
                    className={cn(
                      b.percent > 100
                        ? "text-rose-500"
                        : "text-slate-500 shrink-0",
                    )}
                  >
                    {formatAmount(b.spent)} / {formatAmount(b.amount)}
                  </span>
                </div>
                <div className="h-2 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      b.percent > 100
                        ? "bg-rose-500"
                        : b.percent > 80
                          ? "bg-amber-500"
                          : "bg-emerald-500",
                    )}
                    style={{ width: `${Math.min(b.percent, 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
