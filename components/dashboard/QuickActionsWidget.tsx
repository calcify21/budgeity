import React from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Plus, Minus, ArrowRightLeft, Target, PiggyBank, Zap, ShoppingCart, Tags, Repeat, LockKeyhole } from "lucide-react";
import { useAppLock } from "../../context/AppLockContext";

export const QuickActionsWidget: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isLockEnabled, isUnlocked, lockApp } = useAppLock();

  const actions = [
    {
      label: t("common.add_expense"),
      icon: <Minus size={20} />,
      color: "bg-rose-500 text-white",
      onClick: () => navigate("?add=expense"),
    },
    {
      label: t("common.add_income"),
      icon: <Plus size={20} />,
      color: "bg-emerald-500 text-white",
      onClick: () => navigate("?add=income"),
    },
    {
      label: t("common.add_transfer"),
      icon: <ArrowRightLeft size={20} />,
      color: "bg-indigo-500 text-white",
      onClick: () => navigate("?add=transfer"),
    },
    {
      label: t("common.new_goal"),
      icon: <Target size={20} />,
      color: "bg-amber-500 text-white",
      onClick: () => navigate("/goals?add=true"),
    },
    {
      label: t("common.new_budget"),
      icon: <PiggyBank size={20} />,
      color: "bg-sky-500 text-white",
      onClick: () => navigate("/budgets?add=true"),
    },
    {
      label: t("common.shopping_list"),
      icon: <ShoppingCart size={20} />,
      color: "bg-teal-500 text-white",
      onClick: () => navigate("/shopping-list?add=item"),
    },
    {
      label: t("categories.addCategory"),
      icon: <Tags size={20} />,
      color: "bg-fuchsia-500 text-white",
      onClick: () => navigate("/categories?add=true"),
    },
    {
      label: t("recurring.addRule"),
      icon: <Repeat size={20} />,
      color: "bg-blue-500 text-white",
      onClick: () => navigate("/recurring?add=true"),
    },
    // Lock App action (only shown when lock is enabled)
    ...(isLockEnabled && isUnlocked
      ? [
          {
            label: t("appLock.lockNow"),
            icon: <LockKeyhole size={20} />,
            color: "bg-slate-800 dark:bg-zinc-200 text-white dark:text-black",
            onClick: () => lockApp(),
          },
        ]
      : []),
  ];

  return (
    <div className="glass-card rounded-[2rem] p-6 h-full flex flex-col cursor-default">
      <h3 className="font-bold flex items-center gap-2 mb-6">
        <Zap className="text-brand-500" size={18} />{" "}
        {t("dashboard.quick_actions")}
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1">
        {actions.map((action, idx) => (
          <button
            key={idx}
            onClick={action.onClick}
            className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-50 dark:bg-black/20 hover:bg-slate-100 dark:hover:bg-white/10 transition-all duration-200 border border-slate-100 dark:border-white/5 group"
          >
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 shadow-md group-hover:scale-110 transition-transform ${action.color}`}
            >
              {action.icon}
            </div>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 text-center">
              {action.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
