import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import { useData } from "../../context/DataContext";
import { motion } from "framer-motion";

const MotionDiv = motion.div as any;

export const PlannedSpendingWidget: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { shoppingList, formatAmount } = useData();

  const totalPlanned = useMemo(() => {
    return shoppingList
      .filter(
        (i) =>
          i.status === "active" ||
          i.status === "partial" ||
          (!i.status && !i.isBought),
      )
      .reduce((acc, i) => acc + i.estimatedAmount, 0);
  }, [shoppingList]);

  const activeItemsCount = useMemo(() => {
    return shoppingList.filter(
      (i) =>
        i.status === "active" ||
        i.status === "partial" ||
        (!i.status && !i.isBought),
    ).length;
  }, [shoppingList]);

  return (
    <MotionDiv
      whileHover={{ scale: 1.02 }}
      className="tour-dash-planned flex-1 rounded-[2rem] bg-amber-50 dark:bg-zinc-900/50 border border-amber-100 dark:border-amber-500/20 p-6 shadow-sm backdrop-blur-xl relative overflow-hidden cursor-pointer h-full"
      onClick={() => navigate("/shopping-list")}
    >
      <div className="absolute right-0 top-0 w-32 h-32 bg-amber-500/10 blur-[50px] rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
            <ShoppingCart size={20} />
          </div>
          <span className="text-sm font-semibold text-amber-900 dark:text-amber-200 uppercase tracking-wider">
            {t("dashboard.planned_spending")}
          </span>
        </div>
        <div className="flex items-baseline gap-2 w-full overflow-hidden">
          <div
            className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight truncate shrink"
            title={formatAmount(totalPlanned)}
          >
            {formatAmount(totalPlanned)}
          </div>
          <div className="text-xs font-semibold text-slate-500 dark:text-zinc-500 shrink-0">
            {activeItemsCount} {t("common.active_items")}
          </div>
        </div>
      </div>
    </MotionDiv>
  );
};
