import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Wallet, TrendingUp } from "lucide-react";
import { useData } from "../../context/DataContext";
import { useHousehold } from "../../context/HouseholdContext";
import { formatAmountInWords } from "../../utils";
import { filterTransactionsByRange } from "../../utils/analytics";
import { TimeRange } from "../../types";

interface NetWorthWidgetProps {
  timeRange: TimeRange;
  customStartDate?: string;
  customEndDate?: string;
}

export const NetWorthWidget: React.FC<NetWorthWidgetProps> = ({
  timeRange,
  customStartDate,
  customEndDate,
}) => {
  const { t } = useTranslation();
  const { wallets, goals, transactions, formatAmount, numberSystem, currency } = useData();
  const { activeWorkspace, currentHousehold, currentMembers } = useHousehold();

  const filteredTransactions = useMemo(
    () => filterTransactionsByRange(transactions, timeRange, customStartDate, customEndDate),
    [transactions, timeRange, customStartDate, customEndDate],
  );

  const isHouseholdMode = activeWorkspace.type === "household";

  const totalBalance =
    wallets
      .filter((w) => !w.isGoalWallet)
      .reduce((acc, w) => acc + w.balance, 0) || 0;
  const totalGoals = goals.reduce((acc, g) => acc + g.currentBalance, 0) || 0;
  let netWorth = totalBalance + totalGoals;
  if (isNaN(netWorth)) netWorth = 0;

  return (
    <div className="tour-net-worth w-full relative overflow-hidden rounded-[2rem] glass-card p-8 group h-full">
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-brand-500/20 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-brand-500/30 transition-all duration-700 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-indigo-500/10 blur-[80px] rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none" />

      <div className="relative z-10 flex flex-col justify-between h-full min-h-[200px]">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 w-fit backdrop-blur-md">
            <Wallet size={14} className="text-brand-600 dark:text-brand-400" />
            <span className="text-xs font-semibold text-slate-600 dark:text-zinc-300 tracking-wider uppercase">
              {isHouseholdMode
                ? t("dashboard.household_net_worth", {
                    name: currentHousehold?.name || "Household",
                  })
                : t("dashboard.your_net_worth")}
            </span>
          </div>
          <div className="text-slate-500 dark:text-zinc-500 text-sm font-medium">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </div>
        </div>

        <div>
          <h1
            className="text-5xl sm:text-7xl font-bold text-slate-900 dark:text-white tracking-tighter mb-2 bg-clip-text truncate w-full"
            title={formatAmount(netWorth)}
          >
            {formatAmount(netWorth)}
          </h1>
          <div
            className="text-sm font-medium text-brand-600 dark:text-brand-400 mb-4 px-1 truncate w-full"
            title={formatAmountInWords(netWorth, numberSystem, currency)}
          >
            {formatAmountInWords(netWorth, numberSystem, currency)}
          </div>
          <div className="flex items-center gap-2 text-slate-500 dark:text-zinc-400 text-sm flex-wrap">
            <TrendingUp size={16} className="text-emerald-500" />
            <span>
              Total across {wallets.length} wallets and {goals.length} goals
            </span>
            {isHouseholdMode && currentMembers.length > 0 && (
              <div className="flex -space-x-2 ml-2">
                {currentMembers
                  .filter((m) => m.status === "active")
                  .slice(0, 5)
                  .map((m, i) => (
                    <div
                      key={m.uid}
                      className="w-6 h-6 rounded-full border-2 border-white dark:border-black flex items-center justify-center text-[9px] font-bold text-white overflow-hidden"
                      style={{
                        backgroundColor: [
                          "#10b981",
                          "#6366f1",
                          "#f59e0b",
                          "#ef4444",
                          "#8b5cf6",
                        ][i % 5],
                        zIndex: 5 - i,
                      }}
                      title={m.displayName}
                    >
                      {m.avatarBase64 && m.avatarBase64 !== "removed" ? (
                        <img
                          src={m.avatarBase64}
                          alt=""
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      ) : m.photoURL &&
                        m.photoURL !== "undefined" &&
                        m.photoURL !== "null" &&
                        m.avatarBase64 !== "removed" ? (
                        <img
                          src={m.photoURL}
                          alt=""
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        m.displayName[0]?.toUpperCase() || "?"
                      )}
                    </div>
                  ))}
                {currentMembers.filter((m) => m.status === "active").length >
                  5 && (
                  <div className="w-6 h-6 rounded-full border-2 border-white dark:border-black bg-slate-300 dark:bg-zinc-600 flex items-center justify-center text-[9px] font-bold">
                    +
                    {currentMembers.filter((m) => m.status === "active")
                      .length - 5}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
