import React, { useState, useEffect } from "react";
import { useData } from "../context/DataContext";
import { Reorder, motion, AnimatePresence } from "framer-motion";
import {
  Settings,
  X,
  Plus,
  GripVertical,
  RotateCcw,
  Calendar,
  ChevronDown,
  Home,
  Users,
  ShieldCheck,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import CustomDatePicker from "../components/CustomDatePicker";
import { useTranslation } from "react-i18next";
import { useHousehold } from "../context/HouseholdContext";
import { DashboardWidgetConfig, TimeRange } from "../types";
import { PeriodPicker } from "../components/PeriodPicker";
import { cn } from "../utils";

// Import Widgets
import { NetWorthWidget } from "../components/dashboard/NetWorthWidget";
import { WalletOverviewWidget } from "../components/dashboard/WalletOverviewWidget";
import { ActiveGoalsWidget } from "../components/dashboard/ActiveGoalsWidget";
import { RecentTransactionsWidget } from "../components/dashboard/RecentTransactionsWidget";
import { MonthlySpendingWidget } from "../components/dashboard/MonthlySpendingWidget";
import { BudgetProgressWidget } from "../components/dashboard/BudgetProgressWidget";
import { QuickActionsWidget } from "../components/dashboard/QuickActionsWidget";
import { IncomeExpenseWidget } from "../components/dashboard/IncomeExpenseWidget";
import { SnapshotWidget } from "../components/dashboard/SnapshotWidget";
import { PlannedSpendingWidget } from "../components/dashboard/PlannedSpendingWidget";
import { BalanceTrendWidget } from "../components/dashboard/BalanceTrendWidget";
import { SpendingForecastWidget } from "../components/dashboard/SpendingForecastWidget";
import { UpcomingSubscriptionsWidget } from "../components/dashboard/UpcomingSubscriptionsWidget";
import { WidgetSkeleton } from "../components/dashboard/WidgetSkeleton";

const widgetComponents: Record<string, React.FC<{ 
  timeRange: TimeRange;
  customStartDate?: string;
  customEndDate?: string;
}>> = {
  networth: NetWorthWidget as any,
  wallets: WalletOverviewWidget as any,
  goals: ActiveGoalsWidget as any,
  transactions: RecentTransactionsWidget as any,
  spending: MonthlySpendingWidget as any,
  budgets: BudgetProgressWidget as any,
  actions: QuickActionsWidget as any,
  income_expense: IncomeExpenseWidget as any,
  snapshot: SnapshotWidget as any,
  planned: PlannedSpendingWidget as any,
  trend: BalanceTrendWidget as any,
  forecast: SpendingForecastWidget as any,
  subscriptions: UpcomingSubscriptionsWidget as any,
};

const widgetLabels: Record<string, string> = {
  networth: "Net Worth",
  wallets: "Wallet Overview",
  goals: "Active Goals",
  transactions: "Recent Transactions",
  spending: "Monthly Spending",
  budgets: "Budget Progress",
  actions: "Quick Actions",
  income_expense: "Income & Expense",
  snapshot: "Savings & Burn Rate",
  planned: "Planned Spending",
  trend: "Balance Trend",
  forecast: "Spending Forecast",
  subscriptions: "Upcoming Subscriptions",
};


const MotionDiv = motion.div as any;

const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const {
    isLoadingData,
    dashboardWidgets = [],
    updateDashboardWidgets,
  } = useData();
  const { activeWorkspace, currentHousehold, currentMembers } = useHousehold();
  const navigate = useNavigate();
  const location = useLocation();

  const [showLockResetAlert, setShowLockResetAlert] = useState(
    location.state?.appLockReset || false
  );

  // Clear state so it doesn't persist on reload
  useEffect(() => {
    if (location.state?.appLockReset) {
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const [isEditing, setIsEditing] = useState(false);
  const [localWidgets, setLocalWidgets] = useState<DashboardWidgetConfig[]>([]);
  const [timeRange, setTimeRange] = useState<TimeRange>("this_month");
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");

  // Master list of all possible widget IDs
  const allWidgetIds = [
    "networth",
    "wallets",
    "goals",
    "transactions",
    "spending",
    "budgets",
    "actions",
    "income_expense",
    "snapshot",
    "planned",
    "trend",
    "forecast",
    "subscriptions",
  ];

  const DASHBOARD_WIDGET_DEFAULTS: DashboardWidgetConfig[] = [
    { id: "networth", enabled: true, order: 1 },
    { id: "income_expense", enabled: true, order: 2 },
    { id: "snapshot", enabled: true, order: 3 },
    { id: "forecast", enabled: true, order: 4 },
    { id: "wallets", enabled: true, order: 5 },
    { id: "trend", enabled: true, order: 6 },
    { id: "goals", enabled: true, order: 7 },
    { id: "transactions", enabled: true, order: 8 },
    { id: "spending", enabled: false, order: 9 },
    { id: "budgets", enabled: false, order: 10 },
    { id: "actions", enabled: false, order: 11 },
    { id: "planned", enabled: false, order: 12 },
    { id: "subscriptions", enabled: true, order: 13 },
  ];

  // Sync local state when not editing
  useEffect(() => {
    if (!isEditing && dashboardWidgets.length > 0) {
      const existingIds = new Set(dashboardWidgets.map((w) => w.id));
      const missing = allWidgetIds
        .filter((id) => !existingIds.has(id))
        .map((id) => ({ id, enabled: false, order: 99 }));

      const merged = [...dashboardWidgets, ...missing].sort(
        (a, b) => a.order - b.order,
      );
      setLocalWidgets(merged);
    }
  }, [dashboardWidgets, isEditing]);

  const handleSave = () => {
    // Update order property based on array index
    const updated = localWidgets.map((w, i) => ({ ...w, order: i + 1 }));
    updateDashboardWidgets(updated);
    setIsEditing(false);
  };

  const handleToggleWidget = (id: string) => {
    setLocalWidgets(
      localWidgets.map((w) =>
        w.id === id ? { ...w, enabled: !w.enabled } : w,
      ),
    );
  };

  const handleReset = () => {
    setLocalWidgets([...DASHBOARD_WIDGET_DEFAULTS]);
  };

  if (isLoadingData || localWidgets.length === 0) {
    return (
      <div className="space-y-8 pb-32">
        <div className="flex items-center justify-between">
          <div className="w-48 h-10 bg-slate-200 dark:bg-white/10 rounded-xl animate-pulse" />
        </div>
        <WidgetSkeleton className="h-[250px]" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <WidgetSkeleton className="h-[300px]" />
          <WidgetSkeleton className="h-[300px]" />
        </div>
      </div>
    );
  }

  const enabledWidgets = localWidgets.filter((w) => w.enabled);
  const disabledWidgets = localWidgets.filter((w) => !w.enabled);

  return (
    <div className="space-y-6 pb-32 max-w-7xl mx-auto pl-4 pr-4 lg:pl-0 lg:pr-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center sm:items-center justify-between gap-4 py-2">
        <h2 className="text-3xl font-bold tracking-tight">
          {t("dashboard.title")}
        </h2>

        <div className="flex items-center gap-3">
          {!isEditing && (
            <PeriodPicker 
              timeRange={timeRange}
              onChangeTimeRange={setTimeRange}
              customStartDate={customStartDate}
              onChangeCustomStartDate={setCustomStartDate}
              customEndDate={customEndDate}
              onChangeCustomEndDate={setCustomEndDate}
              className="tour-dash-time-range"
            />
          )}

          {isEditing ? (
            <div className="flex items-center gap-2">
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 px-4 py-2 font-bold text-sm text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-500/10 rounded-xl transition-colors"
              >
                <RotateCcw size={14} /> {t("common.reset")}
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 font-bold text-sm text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10 rounded-xl transition-colors"
              >
                {t("common.cancel")}
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 font-bold text-sm bg-brand-500 text-white hover:bg-brand-600 rounded-xl transition-colors shadow-sm"
              >
                {t("common.save_layout")}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="tour-dash-edit-layout flex items-center gap-2 px-4 py-2 font-bold text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 dark:text-slate-300 dark:bg-white/5 dark:hover:bg-white/10 rounded-xl transition-colors shrink-0"
            >
              <Settings size={16} /> {t("common.edit")}
            </button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showLockResetAlert && (
          <motion.div
            initial={{ opacity: 0, y: -20, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -20, height: 0 }}
            className="overflow-hidden mb-4"
          >
            <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-[2rem] p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 shadow-sm relative">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center shrink-0">
                <ShieldCheck size={24} className="text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-emerald-800 dark:text-emerald-300">
                  {t("dashboard.app_lock_reset_title")}
                </h3>
                <p className="text-sm text-emerald-600 dark:text-emerald-400/80 mt-1">
                  {t("dashboard.app_lock_reset_desc")}
                </p>
              </div>
              <div className="flex items-center justify-end gap-3 mt-4 sm:mt-0 shrink-0 w-full sm:w-auto">
                <button
                  onClick={() => navigate("/settings#security")}
                  className="px-5 py-2.5 flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl transition-colors shadow-sm text-center"
                >
                  {t("dashboard.setup_app_lock")}
                </button>
                <button
                  onClick={() => setShowLockResetAlert(false)}
                  className="p-2.5 text-emerald-600/60 hover:text-emerald-800 dark:hover:text-emerald-300 bg-emerald-100/50 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/40 rounded-xl transition-colors shrink-0"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Household Header/Banner */}
      {activeWorkspace.type === "household" && currentHousehold && !isEditing && (
        <motion.div
           initial={{ opacity: 0, y: -20 }}
           animate={{ opacity: 1, y: 0 }}
           className="relative group cursor-pointer overflow-hidden rounded-[2rem] bg-brand-500/5 dark:bg-brand-500/10 border border-brand-500/20 p-5 sm:p-6 mb-2 flex flex-col md:flex-row items-center justify-between gap-4 hover:bg-brand-500/10 dark:hover:bg-brand-500/15 transition-all duration-300"
           onClick={() => navigate("/household-settings")}
        >
          {/* Decorative glass elements */}
          <div className="absolute top-0 right-0 w-[400px] h-full bg-brand-500/10 blur-[90px] -translate-y-1/4 translate-x-1/4 pointer-events-none group-hover:bg-brand-500/20 transition-all duration-700" />
          
          <div className="flex items-center gap-5 relative z-10 w-full md:w-auto">
            <div className="w-14 h-14 rounded-3xl bg-brand-500 text-white flex items-center justify-center shadow-2xl shadow-brand-500/40 group-hover:scale-105 group-hover:rotate-3 transition-transform duration-500">
               <Home size={28} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-base-900 dark:text-white flex items-center gap-3">
                 {currentHousehold.name}
                 <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full bg-brand-500 text-white text-[10px] font-black uppercase tracking-widest shadow-md shadow-brand-500/20">
                    ACTIVE
                 </span>
              </h3>
              <div className="flex items-center gap-2 mt-1">
                 <div className="flex -space-x-2">
                   {currentMembers.filter(m => m.status === 'active').slice(0, 3).map((m, i) => (
                     <div key={m.uid} className="w-6 h-6 rounded-full border-2 border-white dark:border-zinc-900 bg-brand-100 overflow-hidden" style={{ zIndex: 3-i }}>
                       {m.avatarBase64 ? <img src={m.avatarBase64} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center bg-brand-500 text-[10px] text-white">{m.displayName[0]}</div>}
                     </div>
                   ))}
                 </div>
                 <p className="text-sm text-slate-500 dark:text-zinc-400 font-semibold ml-1">
                   {currentMembers.filter(m => m.status === 'active').length} members collaborating
                 </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 px-5 py-3 bg-white/60 dark:bg-black/40 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-2xl text-sm font-bold text-slate-700 dark:text-zinc-200 shadow-sm group-hover:border-brand-500 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-all group-hover:shadow-lg w-full md:w-auto justify-center">
             <Settings size={18} className="text-brand-500 group-hover:rotate-90 transition-transform duration-700" />
             Manage Household
          </div>
        </motion.div>
      )}


      {isEditing && disabledWidgets.length > 0 && (
        <MotionDiv
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-brand-50 dark:bg-brand-500/10 border border-brand-200 dark:border-brand-500/20 rounded-2xl p-4 mb-4"
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

      {isEditing ? (
        <Reorder.Group
          axis="y"
          values={enabledWidgets}
          onReorder={(newEnabled) => {
            setLocalWidgets([...newEnabled, ...disabledWidgets]);
          }}
          className="flex flex-col gap-8"
        >
          {enabledWidgets.map((widget) => {
            const WidgetComponent = widgetComponents[widget.id];
            if (!WidgetComponent) return null;

            return (
              <Reorder.Item
                key={widget.id}
                value={widget}
                className="relative group cursor-grab active:cursor-grabbing touch-none list-none w-full"
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

                {/* Widget Preview wrapper */}
                <div className="relative rounded-[2rem] transition-all group-hover:ring-4 group-hover:ring-brand-500/30 pointer-events-none shadow-sm group-hover:shadow-xl">
                  {/* Subtle overlay to indicate edit mode */}
                  <div className="absolute inset-0 bg-slate-50/5 dark:bg-black/5 rounded-[2rem] z-10" />
                  <WidgetComponent 
                    timeRange={timeRange} 
                    customStartDate={customStartDate}
                    customEndDate={customEndDate}
                  />
                </div>
              </Reorder.Item>
            );
          })}
        </Reorder.Group>
      ) : (
        <div className="flex flex-col gap-8">
          <AnimatePresence mode="popLayout">
            {enabledWidgets.map((widget) => {
              const WidgetComponent = widgetComponents[widget.id];
              if (!WidgetComponent) return null;

              return (
                <motion.div
                  key={widget.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ type: "spring", damping: 25, stiffness: 200 }}
                  className="w-full relative"
                >
                   <WidgetComponent 
                    timeRange={timeRange} 
                    customStartDate={customStartDate}
                    customEndDate={customEndDate}
                  />
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
