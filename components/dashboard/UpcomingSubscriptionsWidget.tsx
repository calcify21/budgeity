import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useData } from "../../context/DataContext";
import { Repeat } from "lucide-react";
import { cn, getCategoryIcon } from "../../utils";
import { useNavigate } from "react-router-dom";

export const UpcomingSubscriptionsWidget: React.FC = () => {
  const { t } = useTranslation();
  const { recurringTransactions, categories, formatAmount } = useData();
  const navigate = useNavigate();

  const upcomingSubs = useMemo(() => {
    return recurringTransactions
      .filter((sub) => sub.type === "expense" && sub.isActive)
      .sort((a, b) => new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime())
      .slice(0, 3);
  }, [recurringTransactions]);

  if (upcomingSubs.length === 0) return null;

  return (
    <div className="glass-card rounded-[2rem] p-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-brand-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold flex items-center gap-2 text-slate-800 dark:text-zinc-100">
          <Repeat size={20} className="text-brand-500" />
          {t("subscriptions.upcomingPayment")}
        </h3>
        <button 
          onClick={() => navigate('/subscriptions')}
          className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline"
        >
          {t("subscriptions.title")}
        </button>
      </div>

      <div className="space-y-4 relative z-10">
        {upcomingSubs.map((sub) => {
          const category = categories.find((c) => c.id === sub.categoryId);
          const Icon = category ? getCategoryIcon(category.icon) : Repeat;
          const due = new Date(sub.nextDueDate);
          
          return (
            <div key={sub.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center",
                  category ? `bg-${category.color}-100 text-${category.color}-600 dark:bg-${category.color}-500/20 dark:text-${category.color}-400` : "bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400"
                )} style={category ? { color: category.color } : {}}>
                  <Icon size={20} />
                </div>
                <div>
                  <p className="font-bold text-sm text-slate-900 dark:text-white">
                    {sub.name || category?.name || "Subscription"}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">
                    {due.toLocaleDateString()}
                  </p>
                </div>
              </div>
              <p className="font-bold text-slate-900 dark:text-white">
                {formatAmount(sub.amount)}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
