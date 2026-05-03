import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useData } from "../context/DataContext";
import { Reorder, motion, AnimatePresence } from "framer-motion";
import {
  Settings,
  X,
  Plus,
  GripVertical,
  Calendar,
  Wallet,
  RotateCcw,
  Users,
  ChevronDown,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AnalyticsWidgetConfig, Transaction, TimeRange, Category } from "../types";
import { ANALYTICS_WIDGET_DEFAULTS } from "../constants";
import { cn } from "../utils";
import { filterTransactionsByRange } from "../utils/analytics";
import CustomDatePicker from "../components/CustomDatePicker";
import { PeriodPicker } from "../components/PeriodPicker";
import CustomSelect, { SelectOption } from "../components/CustomSelect";
import { useHousehold } from "../context/HouseholdContext";
import { AnalyticsWidgetSkeleton } from "../components/analytics/AnalyticsWidgetSkeleton";
import { FinancialHealthScore } from "../components/analytics/FinancialHealthScore";
import { SummaryCards } from "../components/analytics/SummaryCards";
import { CategoryDistribution } from "../components/analytics/CategoryDistribution";
import { SubcategoryBreakdown } from "../components/analytics/SubcategoryBreakdown";
import { ExpensesOverTime } from "../components/analytics/ExpensesOverTime";
import { IncomeVsExpense } from "../components/analytics/IncomeVsExpense";
import { SpendingByDay } from "../components/analytics/SpendingByDay";
import { SpendingHeatmap } from "../components/analytics/SpendingHeatmap";
import { MustNeedWant } from "../components/analytics/MustNeedWant";
import { BudgetCompliance } from "../components/analytics/BudgetCompliance";
import { DailyAverageSpend } from "../components/analytics/DailyAverageSpend";
import { SmallPurchaseLeak } from "../components/analytics/SmallPurchaseLeak";
import { NetWorthTrend } from "../components/analytics/NetWorthTrend";
import { SavingsGoalsProgress } from "../components/analytics/SavingsGoalsProgress";
import { WalletDistribution } from "../components/analytics/WalletDistribution";
import { CategoryTrend } from "../components/analytics/CategoryTrend";
import { LargestExpense } from "../components/analytics/LargestExpense";
import { TransactionFrequency } from "../components/analytics/TransactionFrequency";
import { RecurringExpenses } from "../components/analytics/RecurringExpenses";
import { SpendingPersonality } from "../components/analytics/SpendingPersonality";
import { SmartInsights } from "../components/analytics/SmartInsights";

const MotionDiv = motion.div as any;

// ── Widget Registry ──────────────────────────────────────────────────

const widgetLabels: Record<string, string> = {
  financialHealthScore: "Financial Health Score",
  summaryCards: "Summary Cards",
  categoryDistribution: "Category Distribution",
  subcategoryBreakdown: "Subcategory Breakdown",
  expensesOverTime: "Expenses Over Time",
  incomeVsExpense: "Income vs Expense",
  spendingByDay: "Spending by Day",
  spendingHeatmap: "Spending Heatmap",
  mustNeedWant: "Must vs Need vs Want",
  budgetCompliance: "Budget Compliance",
  dailyAverageSpend: "Daily Average & Safe Spend",
  smallPurchaseLeak: "Small Purchase Leak",
  netWorthTrend: "Net Worth Trend",
  savingsGoalsProgress: "Savings Goals",
  walletDistribution: "Wallet Distribution",
  categoryTrend: "Category Trends",
  largestExpense: "Largest Expense",
  transactionFrequency: "Transaction Frequency",
  subscriptionOverview: "Subscription Overview",
  spendingPersonality: "Spending Personality",
  smartInsights: "Smart Insights",
};

const widgetSections: Record<string, string> = {
  financialHealthScore: "Financial Health",
  summaryCards: "Financial Health",
  categoryDistribution: "Spending Behavior",
  subcategoryBreakdown: "Spending Behavior",
  expensesOverTime: "Spending Behavior",
  incomeVsExpense: "Spending Behavior",
  spendingByDay: "Spending Behavior",
  spendingHeatmap: "Spending Behavior",
  mustNeedWant: "Spending Behavior",
  largestExpense: "Spending Behavior",
  transactionFrequency: "Spending Behavior",
  budgetCompliance: "Budget Control",
  dailyAverageSpend: "Budget Control",
  smallPurchaseLeak: "Budget Control",
  subscriptionOverview: "Budget Control",
  netWorthTrend: "Financial Growth",
  savingsGoalsProgress: "Financial Growth",
  walletDistribution: "Financial Growth",
  categoryTrend: "Financial Growth",
  spendingPersonality: "Smart Insights",
  smartInsights: "Smart Insights",
};

// ── Time Filter ──────────────────────────────────────────────────────

// ── Main Page Component ──────────────────────────────────────────────

const AnalyticsV2: React.FC = () => {
  const {
    isLoadingData,
    transactions,
    wallets,
    analyticsWidgets = [],
    updateAnalyticsWidgets,
    analyticsSectionNames = {},
    updateAnalyticsSectionNames,
    categories,
    currency,
  } = useData();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [localWidgets, setLocalWidgets] = useState<AnalyticsWidgetConfig[]>([]);
  const [timeRange, setTimeRange] = useState<TimeRange>("this_month");
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");
  const [walletFilter, setWalletFilter] = useState<string>("all");
  const [memberFilter, setMemberFilter] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [localSectionNames, setLocalSectionNames] = useState<
    Record<string, string>
  >({});

  const allWidgetIds = ANALYTICS_WIDGET_DEFAULTS.map((w) => w.id);

  // Sync local state when not editing
  useEffect(() => {
    if (!isEditing) {
      const source =
        analyticsWidgets.length > 0
          ? analyticsWidgets
          : ANALYTICS_WIDGET_DEFAULTS;
      const existingIds = new Set(source.map((w) => w.id));
      const missing = allWidgetIds
        .filter((id) => !existingIds.has(id))
        .map((id, i) => ({ id, enabled: false, order: 99 + i }));
      const merged = [...source, ...missing].sort((a, b) => a.order - b.order);
      setLocalWidgets(merged);
      setLocalSectionNames(analyticsSectionNames);
    }
  }, [analyticsWidgets, analyticsSectionNames, isEditing]);

  const { activeWorkspace, currentMembers } = useHousehold();

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    let txs = transactions;
    
    // Member Filter
    if (memberFilter !== "all") {
      txs = txs.filter((t) => t.createdBy === memberFilter);
    }

    // Wallet Filter
    if (walletFilter !== "all") {
      txs = txs.filter(
        (t) => t.fromWalletId === walletFilter || t.toWalletId === walletFilter,
      );
    }

    return filterTransactionsByRange(txs, timeRange, customStartDate, customEndDate);
  }, [transactions, timeRange, customStartDate, customEndDate, walletFilter, memberFilter]);

  const handleDrillDown = useCallback((filters: {
    category?: string;
    type?: string;
    wallet?: string;
  }) => {
    const params = new URLSearchParams();
    if (filters.category) params.append("category", filters.category);
    if (filters.type) params.append("type", filters.type);
    
    if (filters.wallet) {
      params.append("wallet", filters.wallet);
    } else if (walletFilter !== "all") {
      params.append("wallet", walletFilter);
    }

    // Determine the date range strings based on current selection
    // We already have start/end objects from filterTransactionsByRange, but let's derive them easily here.
    // However, the Transactions page expects "from" and "to" as YYYY-MM-DD.
    
    // We'll reuse the logic from filterTransactionsByRange but encapsulated for drill-down
    const now = new Date();
    let s = new Date();
    let e = new Date();
    e.setHours(23, 59, 59, 999);

    switch(timeRange) {
      case "this_month":
        s = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "last_month":
        s = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        e = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
        break;
      case "last_30_days":
        s.setDate(now.getDate() - 30);
        break;
      case "last_3_months":
        s.setMonth(now.getMonth() - 3);
        s.setDate(1);
        break;
      case "last_6_months":
        s.setMonth(now.getMonth() - 6);
        s.setDate(1);
        break;
      case "this_year":
        s = new Date(now.getFullYear(), 0, 1);
        break;
      case "all_time":
        if (transactions.length > 0) {
          const sorted = [...transactions].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
          s = new Date(sorted[0].date);
        } else {
          s = new Date(2000, 0, 1);
        }
        break;
      case "custom":
        if (customStartDate && customEndDate) {
          s = new Date(customStartDate);
          e = new Date(customEndDate);
        }
        break;
    }

    params.append("from", s.toISOString().split("T")[0]);
    params.append("to", e.toISOString().split("T")[0]);

    navigate(`/transactions?${params.toString()}`);
  }, [timeRange, customStartDate, customEndDate, walletFilter, navigate, transactions]);

  const handleSave = () => {
    const updated = localWidgets.map((w, i) => ({ ...w, order: i + 1 }));
    updateAnalyticsWidgets(updated);
    updateAnalyticsSectionNames(localSectionNames);
    setIsEditing(false);
  };

  const handleReset = () => {
    setLocalWidgets([...ANALYTICS_WIDGET_DEFAULTS]);
    setLocalSectionNames({});
  };

  const handleToggleWidget = (id: string) => {
    setLocalWidgets(
      localWidgets.map((w) =>
        w.id === id ? { ...w, enabled: !w.enabled } : w,
      ),
    );
  };

  // Render a single widget by its ID
  const renderWidget = (widgetId: string): React.ReactNode => {
    const txProps = { 
      transactions: filteredTransactions,
      onDrillDown: handleDrillDown
    };

    switch (widgetId) {
      case "financialHealthScore":
        return <FinancialHealthScore {...txProps} />;
      case "summaryCards":
        return <SummaryCards {...txProps} />;
      case "categoryDistribution":
        return (
          <CategoryDistribution
            {...txProps}
            onCategorySelect={(id) => setSelectedCategory(id)}
          />
        );
      case "subcategoryBreakdown":
        return (
          <SubcategoryBreakdown
            {...txProps}
            selectedCategoryId={selectedCategory}
          />
        );
      case "expensesOverTime":
        return <ExpensesOverTime {...txProps} />;
      case "incomeVsExpense":
        return <IncomeVsExpense {...txProps} />;
      case "spendingByDay":
        return <SpendingByDay {...txProps} />;
      case "spendingHeatmap":
        return <SpendingHeatmap {...txProps} />;
      case "mustNeedWant":
        return <MustNeedWant {...txProps} />;
      case "budgetCompliance":
        return <BudgetCompliance {...txProps} />;
      case "dailyAverageSpend":
        return <DailyAverageSpend {...txProps} />;
      case "smallPurchaseLeak":
        return <SmallPurchaseLeak {...txProps} />;
      case "netWorthTrend":
        return <NetWorthTrend {...txProps} />;
      case "savingsGoalsProgress":
        return <SavingsGoalsProgress />;
      case "walletDistribution":
        return <WalletDistribution />;
      case "categoryTrend":
        return <CategoryTrend {...txProps} />;
      case "largestExpense":
        return <LargestExpense {...txProps} />;
      case "transactionFrequency":
        return <TransactionFrequency {...txProps} />;
      case "subscriptionOverview":
        return <RecurringExpenses />;
      case "spendingPersonality":
        return <SpendingPersonality {...txProps} />;
      case "smartInsights":
        return <SmartInsights {...txProps} />;
      default:
        return null;
    }
  };

  // Loading state
  if (isLoadingData || localWidgets.length === 0) {
    return (
      <div className="space-y-6 pb-32 px-4 lg:pl-0 lg:pr-8">
        <div className="flex items-center justify-between py-2">
          <div className="w-48 h-10 bg-slate-200 dark:bg-white/10 rounded-xl animate-pulse" />
          <div className="w-32 h-10 bg-slate-200 dark:bg-white/10 rounded-xl animate-pulse" />
        </div>
        <AnalyticsWidgetSkeleton className="h-[200px]" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className="glass-card rounded-2xl p-4 space-y-3 animate-pulse"
            >
              <div className="w-8 h-8 bg-slate-200 dark:bg-white/10 rounded-xl" />
              <div className="h-3 w-16 bg-slate-200 dark:bg-white/10 rounded-lg" />
              <div className="h-6 w-20 bg-slate-200 dark:bg-white/10 rounded-lg" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AnalyticsWidgetSkeleton className="h-[300px]" />
          <AnalyticsWidgetSkeleton className="h-[300px]" />
        </div>
      </div>
    );
  }

  const enabledWidgets = localWidgets.filter((w) => w.enabled);
  const disabledWidgets = localWidgets.filter((w) => !w.enabled);
  const activeWallets = wallets.filter((w) => !w.archived && !w.isGoalWallet);

  const walletOptions: SelectOption[] = [
    { value: "all", label: "All wallets" },
    ...activeWallets.map((w) => ({
      value: w.id,
      label: w.name,
      icon: w.icon || "Wallet",
      color: w.color,
      subLabel: `${w.balance.toLocaleString()} ${currency}`,
    })),
  ];

  const memberOptions: SelectOption[] = [
    { value: "all", label: "All members" },
    ...currentMembers.map((m) => ({
      value: m.email,
      label: m.displayName || m.email,
      icon: "User",
    })),
  ];

  return (
    <div className="space-y-6 pb-32 px-4 lg:pl-0 lg:pr-8">
      {/* ── Header ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-2">
        <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>

        {isEditing ? (
          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-4 py-2 font-bold text-sm text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-500/10 rounded-xl transition-colors"
            >
              <RotateCcw size={14} /> Reset
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 font-bold text-sm text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 font-bold text-sm bg-brand-500 text-white hover:bg-brand-600 rounded-xl transition-colors shadow-sm"
            >
              Save Layout
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-4 py-2 font-bold text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 dark:text-slate-300 dark:bg-white/5 dark:hover:bg-white/10 rounded-xl transition-colors shrink-0"
          >
            <Settings size={16} /> Edit Analytics
          </button>
        )}
      </div>

      {/* ── Filters ───────────────────────────────────────────── */}
      {!isEditing && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <PeriodPicker
              timeRange={timeRange}
              onChangeTimeRange={setTimeRange}
              customStartDate={customStartDate}
              onChangeCustomStartDate={setCustomStartDate}
              customEndDate={customEndDate}
              onChangeCustomEndDate={setCustomEndDate}
            />

            {/* Wallet Filter */}
            <div className="flex items-center gap-1 bg-slate-100/80 dark:bg-white/5 rounded-xl p-1.5 border border-slate-200/50 dark:border-white/5">
              <CustomSelect
                value={walletFilter}
                onChange={setWalletFilter}
                options={walletOptions}
                icon={Wallet}
                className="min-w-[180px] scale-90 -m-1"
              />
            </div>

            {/* Member Filter (Household) */}
            {activeWorkspace.type === "household" && (
              <div className="flex items-center gap-1 bg-slate-100/80 dark:bg-white/5 rounded-xl p-1.5 border border-slate-200/50 dark:border-white/5">
                <CustomSelect
                  value={memberFilter}
                  onChange={setMemberFilter}
                  options={memberOptions}
                  icon={Users}
                  className="min-w-[180px] scale-90 -m-1"
                />
              </div>
            )}
          </div>


        </div>
      )}

      {/* ── Available Widgets Panel (Edit Mode) ───────────────── */}
      {isEditing && disabledWidgets.length > 0 && (
        <MotionDiv
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-brand-50 dark:bg-brand-500/10 border border-brand-200 dark:border-brand-500/20 rounded-2xl p-4"
        >
          <p className="text-sm font-bold text-brand-700 dark:text-brand-300 mb-3">
            Available Widgets
          </p>
          <div className="flex flex-wrap gap-2">
            {disabledWidgets.map((w) => (
              <button
                key={w.id}
                onClick={() => handleToggleWidget(w.id)}
                className="flex items-center gap-2 bg-white dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm font-semibold hover:border-brand-500 hover:text-brand-600 transition-colors shadow-sm"
              >
                <Plus size={16} className="text-brand-500" />
                {widgetLabels[w.id] || w.id}
              </button>
            ))}
          </div>
        </MotionDiv>
      )}

      {/* ── Widget Grid ───────────────────────────────────────── */}
      {isEditing ? (
        <Reorder.Group
          axis="y"
          values={enabledWidgets}
          onReorder={setLocalWidgets}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6 grid-flow-row-dense"
        >
          {enabledWidgets.map((widget, index) => {
            const currentSection = widgetSections[widget.id];
            const prevSection =
              index > 0 ? widgetSections[enabledWidgets[index - 1].id] : null;
            const showHeader = currentSection !== prevSection;

            const isFullRow = [
              "summaryCards",
              "expensesOverTime",
              "incomeVsExpense",
              "spendingHeatmap",
              "netWorthTrend",
              "smartInsights",
              "budgetCompliance",
              "subscriptionOverview",
              "categoryTrend",
              "transactionFrequency",
            ].includes(widget.id);

            return (
              <React.Fragment key={widget.id}>
                {showHeader && (
                  <div className="col-span-1 lg:col-span-2 flex items-center gap-3 pt-6 pb-2 pl-2">
                    <div className="w-1.5 h-6 bg-brand-500 rounded-full shrink-0" />
                    <input
                      type="text"
                      className="text-xl font-black text-slate-800 dark:text-zinc-200 tracking-wider uppercase bg-transparent border-b-2 border-transparent hover:border-slate-300 dark:hover:border-slate-600 focus:border-brand-500 focus:outline-none transition-colors w-full"
                      value={
                        localSectionNames[currentSection] !== undefined
                          ? localSectionNames[currentSection]
                          : currentSection
                      }
                      onChange={(e) =>
                        setLocalSectionNames({
                          ...localSectionNames,
                          [currentSection]: e.target.value,
                        })
                      }
                      placeholder={currentSection}
                    />
                  </div>
                )}
                <Reorder.Item
                  value={widget}
                  className={cn(
                    "relative group cursor-grab active:cursor-grabbing touch-none list-none",
                    isFullRow ? "col-span-1 lg:col-span-2" : "col-span-1",
                  )}
                >
                  <div className="absolute top-4 right-4 flex flex-col gap-2 z-50">
                    <button
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={() => handleToggleWidget(widget.id)}
                      className="w-8 h-8 flex items-center justify-center bg-rose-500 text-white rounded-full shadow-lg hover:bg-rose-600 transition-colors opacity-0 group-hover:opacity-100"
                      title="Remove Widget"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <div className="absolute top-4 left-4 z-50 p-2 bg-slate-900/40 text-white rounded-xl backdrop-blur-md opacity-0 group-hover:opacity-100 flex items-center gap-2">
                    <GripVertical size={16} />
                    <span className="text-xs font-bold">
                      {widgetLabels[widget.id]}
                    </span>
                  </div>
                  <div className="ring-2 ring-brand-500/50 rounded-[2rem] opacity-70 transition-all pointer-events-none h-full w-full [&>div]:w-full [&>div]:h-full [&>div>div.glass-card]:w-full [&>div>div.glass-card]:h-full">
                    {renderWidget(widget.id)}
                  </div>
                </Reorder.Item>
              </React.Fragment>
            );
          })}
        </Reorder.Group>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 grid-flow-row-dense">
          <AnimatePresence mode="popLayout">
            {enabledWidgets.map((widget, index) => {
              const currentSection = widgetSections[widget.id];
              const prevSection =
                index > 0 ? widgetSections[enabledWidgets[index - 1].id] : null;
              const showHeader = currentSection !== prevSection;

              const isFullRow = [
                "summaryCards",
                "expensesOverTime",
                "incomeVsExpense",
                "spendingHeatmap",
                "netWorthTrend",
                "smartInsights",
                "budgetCompliance",
                "subscriptionOverview",
                "categoryTrend",
                "transactionFrequency",
              ].includes(widget.id);

              return (
                <React.Fragment key={widget.id}>
                  {showHeader && (
                    <div className="col-span-1 lg:col-span-2 flex items-center gap-3 pt-6 pb-2 pl-2">
                      <div className="w-1.5 h-6 bg-brand-500 rounded-full shrink-0" />
                      <h3 className="text-xl font-black text-slate-800 dark:text-zinc-200 tracking-wider uppercase">
                        {localSectionNames[currentSection] || currentSection}
                      </h3>
                    </div>
                  )}
                  <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{
                      type: "spring",
                      damping: 25,
                      stiffness: 200,
                    }}
                    className={cn(
                      "relative w-full h-full [&>div]:w-full [&>div]:h-full [&>div>div.glass-card]:w-full [&>div>div.glass-card]:h-full",
                      isFullRow ? "col-span-1 lg:col-span-2" : "col-span-1",
                    )}
                  >
                    {renderWidget(widget.id)}
                  </motion.div>
                </React.Fragment>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default AnalyticsV2;
