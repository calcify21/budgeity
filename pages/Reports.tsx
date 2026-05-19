import React, { useState, useMemo, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useData } from "../context/DataContext";
import { useAuth } from "../context/AuthContext";
import { cn } from "../utils";
import {
  computeMonthRange,
  filterByDateRange,
  filterByWallet,
  computePerformanceData,
  computeCashFlowData,
  computeBudgetData,
  computeForecastData,
  computeSmartSummary,
  type PerformanceData,
  type CashFlowData,
  type BudgetData,
  type ForecastData,
  type SmartInsight,
  type CategoryComparison,
  type BudgetVsActual,
  type HeatmapDay,
} from "../utils/reportsEngine";
import { generateFullReport } from "../utils/reportsPdf";
import CustomSelect from "../components/CustomSelect";
import CustomDatePicker from "../components/CustomDatePicker";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  PiggyBank,
  AlertTriangle,
  CheckCircle,
  Target,
  Sparkles,
  Loader2,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Wallet as WalletIcon,
  Filter,
  Zap,
  Info,
  ArrowRight,
  Minus,
  Crown,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
  Legend,
  ReferenceLine,
  Area,
  AreaChart,
} from "recharts";

const MotionDiv = motion.div as any;

// ── Tab Config ──────────────────────────────────────────────────────

type TabId = "performance" | "cashflow" | "budget" | "forecast";

const TABS = [
  { id: "performance", labelKey: "reports.performance", icon: TrendingUp, color: "from-indigo-500 to-violet-500" },
  { id: "cashflow", labelKey: "reports.cash_flow", icon: Activity, color: "from-emerald-500 to-teal-500" },
  { id: "budget", labelKey: "reports.budget", icon: PiggyBank, color: "from-amber-500 to-orange-500" },
  { id: "forecast", labelKey: "reports.forecast", icon: Target, color: "from-sky-500 to-blue-500" },
] as const;

// ── Smart Summary Icons ─────────────────────────────────────────────

const insightIcons: Record<string, any> = {
  "trending-up": TrendingUp,
  "trending-down": TrendingDown,
  info: Info,
  alert: AlertTriangle,
  "piggy-bank": PiggyBank,
};

// ── Circular Progress ───────────────────────────────────────────────

const CircularProgress: React.FC<{
  value: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  label?: string;
}> = ({ value, size = 120, strokeWidth = 10, color = "#22c55e", label }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-slate-100 dark:text-zinc-800"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-slate-900 dark:text-white">
          {value.toFixed(0)}%
        </span>
        {label && (
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
            {label}
          </span>
        )}
      </div>
    </div>
  );
};

// ── Month Navigation ────────────────────────────────────────────────

const MonthNavigator: React.FC<{
  year: number;
  month: number;
  onPrev: () => void;
  onNext: () => void;
  onChange: (year: number, month: number) => void;
  label: string;
  canGoNext: boolean;
}> = ({ year, month, onPrev, onNext, onChange, label, canGoNext }) => {
  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-01`;

  return (
    <div className="flex items-center gap-1.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-1 shadow-sm">
      <button
        onClick={onPrev}
        className="p-2 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition-all text-slate-500 hover:text-slate-900 dark:hover:text-white"
      >
        <ChevronLeft size={18} />
      </button>

      <div className="w-[150px] flex items-center justify-center">
        <CustomDatePicker
          value={dateStr}
          onChange={(newDate) => {
            const d = new Date(newDate);
            onChange(d.getFullYear(), d.getMonth());
          }}
          mode="month"
          className="border-none bg-transparent hover:bg-slate-50 dark:hover:bg-zinc-800/50 shadow-none p-2 w-full text-center hover:ring-0 focus:ring-0 h-10 flex min-h-[40px] items-center justify-center"
        />
      </div>

      <button
        onClick={onNext}
        disabled={!canGoNext}
        className={cn(
          "p-2 rounded-xl transition-all",
          canGoNext
            ? "hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-500 hover:text-slate-900 dark:hover:text-white"
            : "text-slate-300 dark:text-zinc-700 cursor-not-allowed",
        )}
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
};

// ── Empty State ─────────────────────────────────────────────────────

const EmptyState: React.FC<{ message: string; icon?: any }> = ({
  message,
  icon: Icon = Info,
}) => (
  <div className="py-16 flex flex-col items-center justify-center gap-4 text-center">
    <div className="w-16 h-16 bg-slate-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center">
      <Icon size={28} className="text-slate-300 dark:text-zinc-600" />
    </div>
    <p className="text-sm text-slate-500 dark:text-zinc-400 max-w-xs">{message}</p>
  </div>
);

// ── Card Component ──────────────────────────────────────────────────

const ReportCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
}> = ({ children, className, title, subtitle }) => (
  <div
    className={cn(
      "bg-white dark:bg-zinc-900 rounded-[2rem] border border-slate-200 dark:border-white/5 shadow-sm p-6 md:p-8",
      className,
    )}
  >
    {title && (
      <div className="mb-6">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h3>
        {subtitle && (
          <p className="text-xs text-slate-400 font-medium mt-1">{subtitle}</p>
        )}
      </div>
    )}
    {children}
  </div>
);

// ── Custom Tooltip ──────────────────────────────────────────────────

const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-xl shadow-xl p-3 text-xs">
      <p className="font-bold text-slate-900 dark:text-white mb-1">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} style={{ color: entry.color }} className="font-medium">
          {entry.name}: {typeof entry.value === "number" ? entry.value.toLocaleString() : entry.value}
        </p>
      ))}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// ═── MAIN COMPONENT ─══════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════════════

const Reports: React.FC = () => {
  const {
    transactions,
    wallets,
    categories,
    budgets,
    goals,
    formatAmount,
    currency,
  } = useData();
  const { user } = useAuth();
  const { t } = useTranslation();

  // ── State ───────────────────────────────────────────────────────

  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [walletFilter, setWalletFilter] = useState("all");
  const [activeTab, setActiveTab] = useState<TabId>("performance");
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const tabContentRef = useRef<HTMLDivElement>(null);

  // ── Month Navigation ───────────────────────────────────────────

  const handlePrevMonth = useCallback(() => {
    if (selectedMonth === 0) {
      setSelectedYear((y) => y - 1);
      setSelectedMonth(11);
    } else {
      setSelectedMonth((m) => m - 1);
    }
  }, [selectedMonth]);

  const handleNextMonth = useCallback(() => {
    const now = new Date();
    const nextM = selectedMonth === 11 ? 0 : selectedMonth + 1;
    const nextY = selectedMonth === 11 ? selectedYear + 1 : selectedYear;
    if (nextY > now.getFullYear() || (nextY === now.getFullYear() && nextM > now.getMonth())) return;
    setSelectedYear(nextY);
    setSelectedMonth(nextM);
  }, [selectedMonth, selectedYear]);

  const canGoNext = useMemo(() => {
    const now = new Date();
    const nextM = selectedMonth === 11 ? 0 : selectedMonth + 1;
    const nextY = selectedMonth === 11 ? selectedYear + 1 : selectedYear;
    return nextY < now.getFullYear() || (nextY === now.getFullYear() && nextM <= now.getMonth());
  }, [selectedMonth, selectedYear]);

  // ── Computed Data ──────────────────────────────────────────────

  const range = useMemo(
    () => computeMonthRange(selectedYear, selectedMonth),
    [selectedYear, selectedMonth],
  );

  const filteredCurrentTxs = useMemo(() => {
    const byDate = filterByDateRange(transactions, range.start, range.end);
    return filterByWallet(byDate, walletFilter);
  }, [transactions, range, walletFilter]);

  const filteredPreviousTxs = useMemo(() => {
    const byDate = filterByDateRange(transactions, range.prevStart, range.prevEnd);
    return filterByWallet(byDate, walletFilter);
  }, [transactions, range, walletFilter]);

  const performance = useMemo(
    () => computePerformanceData(filteredCurrentTxs, filteredPreviousTxs, categories),
    [filteredCurrentTxs, filteredPreviousTxs, categories],
  );

  const cashFlow = useMemo(
    () => computeCashFlowData(filteredCurrentTxs, categories, wallets),
    [filteredCurrentTxs, categories, wallets],
  );

  const budgetData = useMemo(
    () => computeBudgetData(filteredCurrentTxs, transactions, budgets, categories, wallets, range),
    [filteredCurrentTxs, transactions, budgets, categories, wallets, range],
  );

  const forecastData = useMemo(
    () => computeForecastData(transactions, wallets, goals),
    [transactions, wallets, goals],
  );

  const smartInsights = useMemo(
    () => computeSmartSummary(performance, cashFlow),
    [performance, cashFlow],
  );

  // ── Wallet options ─────────────────────────────────────────────

  const walletOptions = useMemo(
    () => [
      { value: "all", label: t("reports.all_wallets"), icon: Filter },
      ...wallets
        .filter((w) => !w.archived && !w.isGoalWallet)
        .map((w) => ({
          value: w.id,
          label: w.name,
          icon: WalletIcon,
          color: w.color,
        })),
    ],
    [wallets, t],
  );

  // ── PDF Generation ─────────────────────────────────────────────

  const handleGeneratePdf = useCallback(async () => {
    setIsGeneratingPdf(true);
    // Small delay to show the loading state
    await new Promise((r) => setTimeout(r, 100));
    try {
      generateFullReport({
        performance,
        cashFlow,
        budget: budgetData,
        forecast: forecastData,
        insights: smartInsights,
        goals,
        monthLabel: range.label,
        currency,
        userName: user?.displayName || undefined,
        formatAmount,
      });
    } catch (e) {
      console.error("PDF generation error:", e);
    } finally {
      setIsGeneratingPdf(false);
    }
  }, [performance, cashFlow, budgetData, forecastData, smartInsights, goals, range, currency, user, formatAmount]);

  // ── Has any data ───────────────────────────────────────────────

  const hasData = filteredCurrentTxs.length > 0 || filteredPreviousTxs.length > 0;

  // ═══════════════════════════════════════════════════════════════
  // ═── RENDER ─══════════════════════════════════════════════════
  // ═══════════════════════════════════════════════════════════════

  return (
    <div className="space-y-6 pb-24 no-scrollbar">
      {/* ── Sticky Header ─────────────────────────────────────── */}
      <div className="sticky top-0 z-20 -mx-4 lg:-mx-8 px-4 lg:px-8 pt-3 pb-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-2xl rounded-[1.5rem] border border-slate-200/60 dark:border-white/5 shadow-lg shadow-black/[0.03] dark:shadow-black/20 px-5 lg:px-6 py-3.5">
          <div className="min-w-0">
            <h2 className="text-2xl font-bold tracking-tight">
              {t("reports.title")}
            </h2>
            <p className="text-slate-500 dark:text-zinc-400 font-medium text-xs mt-0.5">
              {t("reports.subtitle")}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <MonthNavigator
              year={selectedYear}
              month={selectedMonth}
              onPrev={handlePrevMonth}
              onNext={handleNextMonth}
              onChange={(y, m) => {
                setSelectedYear(y);
                setSelectedMonth(m);
              }}
              label={range.label}
              canGoNext={canGoNext}
            />

            <div className="w-44">
              <CustomSelect
                value={walletFilter}
                onChange={setWalletFilter}
                options={walletOptions}
              />
            </div>

            <button
              onClick={handleGeneratePdf}
              disabled={isGeneratingPdf || !hasData}
              className={cn(
                "flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm shadow-lg transition-all",
                hasData
                  ? "bg-slate-900 dark:bg-white text-white dark:text-black hover:scale-105 active:scale-95 shadow-slate-900/25 dark:shadow-white/25"
                  : "bg-slate-200 dark:bg-zinc-800 text-slate-400 dark:text-zinc-600 cursor-not-allowed",
              )}
            >
              {isGeneratingPdf ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <FileText size={18} />
              )}
              <span className="hidden sm:inline">
                {isGeneratingPdf ? t("reports.generating") : t("reports.generate_report")}
              </span>
              <span className="sm:hidden">
                {isGeneratingPdf ? "..." : "PDF"}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* ── AI Smart Summary ──────────────────────────────────── */}
      {smartInsights.length > 0 && hasData && (
        <MotionDiv
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-zinc-900 rounded-[2rem] p-6 md:p-8 border border-slate-200 dark:border-white/5 shadow-sm"
        >
          <div className="flex flex-col md:flex-row gap-6 md:gap-8 lg:items-center">
            <div className="shrink-0 md:w-[220px]">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center">
                  <Sparkles size={16} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t("reports.smart_summary")}</h3>
              </div>
              <p className="text-sm text-slate-500 dark:text-zinc-400 font-medium">
                {t("reports.smart_summary_desc", { month: range.label })}
              </p>
            </div>
            
            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
              {smartInsights.map((insight, i) => {
                const Icon = insightIcons[insight.icon] || Info;
                return (
                  <div 
                    key={i} 
                    className={cn("flex flex-col justify-center p-4 rounded-2xl border transition-all h-full", 
                      insight.type === "positive" ? "bg-emerald-50/50 border-emerald-100 dark:bg-emerald-500/5 dark:border-emerald-500/10" 
                      : insight.type === "negative" ? "bg-rose-50/50 border-rose-100 dark:bg-rose-500/5 dark:border-rose-500/10"
                      : "bg-brand-50/50 border-brand-100 dark:bg-brand-500/5 dark:border-brand-500/10"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn("p-1.5 rounded-xl shrink-0 mt-0.5", 
                        insight.type === "positive" ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                        : insight.type === "negative" ? "bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400"
                        : "bg-brand-100 dark:bg-brand-500/20 text-brand-600 dark:text-brand-400"
                      )}>
                        <Icon size={16} strokeWidth={2.5} />
                      </div>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-snug">
                        {insight.text}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </MotionDiv>
      )}

      {/* ── Tab Bar ───────────────────────────────────────────── */}
      <div className="flex overflow-x-auto no-scrollbar gap-2 pb-1">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                // Scroll the parent scrollable container to the top
                const scrollParent = document.querySelector('main > div.overflow-y-auto') || document.querySelector('main > div');
                scrollParent?.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={cn(
                "relative flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm whitespace-nowrap transition-all",
                isActive
                  ? "text-white shadow-lg"
                  : "bg-white dark:bg-zinc-900 text-slate-500 dark:text-zinc-400 border border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700",
              )}
            >
              {isActive && (
                <MotionDiv
                  layoutId="activeTabBg"
                  className={cn("absolute inset-0 rounded-2xl bg-gradient-to-r", tab.color)}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                <Icon size={16} />
                {t(tab.labelKey)}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Tab Content ───────────────────────────────────────── */}
      <div ref={tabContentRef}>
        <AnimatePresence mode="wait">
          <MotionDiv
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === "performance" && (
              <PerformanceTab
                data={performance}
                formatAmount={formatAmount}
                range={range}
              />
            )}
            {activeTab === "cashflow" && (
              <CashFlowTab data={cashFlow} formatAmount={formatAmount} />
            )}
            {activeTab === "budget" && (
              <BudgetTab data={budgetData} formatAmount={formatAmount} range={range} />
            )}
            {activeTab === "forecast" && (
              <ForecastTab data={forecastData} formatAmount={formatAmount} />
            )}
          </MotionDiv>
        </AnimatePresence>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// ═── TAB 1: PERFORMANCE ═════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════════════

const PerformanceTab: React.FC<{
  data: PerformanceData;
  formatAmount: (n: number) => string;
  range: any;
}> = ({ data, formatAmount, range }) => {
  const { t } = useTranslation();
  if (data.currentTotals.income === 0 && data.currentTotals.expense === 0 && data.previousTotals.income === 0 && data.previousTotals.expense === 0) {
    return <EmptyState message={t("reports.performance_empty")} icon={BarChart3} />;
  }

  return (
    <div className="space-y-6">
      {/* Key Highlights */}
      {data.highlights.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {data.highlights.map((h, i) => (
            <MotionDiv
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={cn(
                "p-5 rounded-[2rem] border shadow-sm",
                h.type === "increase"
                  ? "bg-rose-50 dark:bg-rose-500/5 border-rose-100 dark:border-rose-500/10"
                  : h.type === "decrease"
                    ? "bg-emerald-50 dark:bg-emerald-500/5 border-emerald-100 dark:border-emerald-500/10"
                    : "bg-indigo-50 dark:bg-indigo-500/5 border-indigo-100 dark:border-indigo-500/10",
              )}
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className={cn(
                    "p-2 rounded-xl",
                    h.type === "increase"
                      ? "bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400"
                      : h.type === "decrease"
                        ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                        : "bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400",
                  )}
                >
                  {h.type === "increase" ? <ArrowUpRight size={18} /> : h.type === "decrease" ? <ArrowDownRight size={18} /> : <Crown size={18} />}
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                  {h.label}
                </span>
              </div>
              <p className="text-lg font-bold text-slate-900 dark:text-white">{h.category}</p>
              <p className="text-sm font-medium text-slate-500 dark:text-zinc-400 mt-1">
                {formatAmount(h.amount)}
              </p>
            </MotionDiv>
          ))}
        </div>
      )}

      {/* Category Comparison Table */}
      <ReportCard title={t("reports.category_comparison")} subtitle={t("reports.comparison_subtitle", { current: range.label, previous: range.prevLabel })}>
        {data.categoryComparisons.length === 0 ? (
          <EmptyState message="No expense categories to compare." />
        ) : (
          <div className="overflow-x-auto -mx-6 md:-mx-8 px-6 md:px-8">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-zinc-800">
                  <th className="text-left py-3 px-2 text-xs font-bold text-slate-400 uppercase tracking-wider">{t("reports.category")}</th>
                  <th className="text-right py-3 px-2 text-xs font-bold text-slate-400 uppercase tracking-wider">{t("reports.current")}</th>
                  <th className="text-right py-3 px-2 text-xs font-bold text-slate-400 uppercase tracking-wider">{t("reports.previous")}</th>
                  <th className="text-right py-3 px-2 text-xs font-bold text-slate-400 uppercase tracking-wider">{t("reports.change")}</th>
                </tr>
              </thead>
              <tbody>
                {data.categoryComparisons.slice(0, 12).map((c) => (
                  <tr key={c.categoryId} className="border-b border-slate-50 dark:border-zinc-800/50 hover:bg-slate-50 dark:hover:bg-zinc-800/30 transition-colors">
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                        <span className="font-medium text-slate-900 dark:text-white">{c.name}</span>
                      </div>
                    </td>
                    <td className="text-right py-3 px-2 font-bold text-slate-900 dark:text-white">
                      {formatAmount(c.current)}
                    </td>
                    <td className="text-right py-3 px-2 text-slate-500 dark:text-zinc-400">
                      {formatAmount(c.previous)}
                    </td>
                    <td className="text-right py-3 px-2">
                      {c.previous > 0 || c.current > 0 ? (
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold",
                            c.change > 0
                              ? "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400"
                              : c.change < 0
                                ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                : "bg-slate-50 dark:bg-zinc-800 text-slate-500",
                          )}
                        >
                          {c.change > 0 ? <ArrowUpRight size={12} /> : c.change < 0 ? <ArrowDownRight size={12} /> : <Minus size={12} />}
                          {c.change > 0 ? "+" : ""}{c.change}%
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </ReportCard>

      {/* Savings Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Savings Change */}
        <ReportCard title={t("reports.savings_comparison")}>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-4 bg-slate-50 dark:bg-zinc-800/50 rounded-2xl">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{t("reports.current")}</p>
              <p className={cn("text-xl font-bold", data.currentTotals.savings >= 0 ? "text-emerald-600" : "text-rose-600")}>
                {formatAmount(data.currentTotals.savings)}
              </p>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-zinc-800/50 rounded-2xl">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{t("reports.previous")}</p>
              <p className="text-xl font-bold text-slate-500 dark:text-zinc-400">
                {formatAmount(data.previousTotals.savings)}
              </p>
            </div>
          </div>
          <div
            className={cn(
              "flex items-center gap-2 p-3 rounded-xl text-sm font-bold",
              data.savingsChange >= 0
                ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400",
            )}
          >
            {data.savingsChange >= 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
            {data.savingsChange > 0 ? "+" : ""}{data.savingsChange}% change from previous month
          </div>
        </ReportCard>

        {/* Efficiency Score */}
        <ReportCard title={t("reports.efficiency_score")} subtitle={t("reports.efficiency_subtitle")}>
          <div className="flex flex-col items-center py-4">
            <CircularProgress
              value={data.efficiencyScore}
              size={140}
              strokeWidth={12}
              color={
                data.efficiencyScore >= 30
                  ? "#10b981"
                  : data.efficiencyScore >= 15
                    ? "#f59e0b"
                    : "#f43f5e"
              }
              label={t("reports.efficiency_saved")}
            />
            <p className="mt-4 text-sm text-slate-500 dark:text-zinc-400 text-center max-w-xs">
              {data.efficiencyScore >= 30
                ? t("reports.efficiency_excellent")
                : data.efficiencyScore >= 15
                  ? t("reports.efficiency_good")
                  : data.efficiencyScore >= 0
                    ? t("reports.efficiency_fair")
                    : t("reports.efficiency_poor")}
            </p>
          </div>
        </ReportCard>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// ═── TAB 2: CASH FLOW ═══════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════════════

const CashFlowTab: React.FC<{
  data: CashFlowData;
  formatAmount: (n: number) => string;
}> = ({ data, formatAmount }) => {
  const { t } = useTranslation();
  if (data.totalInflow === 0 && data.totalOutflow === 0) {
    return <EmptyState message={t("reports.cash_flow_empty")} icon={Activity} />;
  }

  const waterfallDisplay = data.waterfall.map((step) => ({
    name: step.name,
    value: Math.abs(step.value),
    displayValue: step.value,
    fill: step.fill,
  }));

  return (
    <div className="space-y-6">
      {/* Net Flow Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: t("reports.total_inflow"), value: data.totalInflow, color: "emerald" },
          { label: t("reports.total_outflow"), value: data.totalOutflow, color: "rose" },
          { label: t("reports.net_flow"), value: data.netFlow, color: data.netFlow >= 0 ? "indigo" : "rose" },
        ].map((item) => (
          <MotionDiv
            key={item.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
              "p-5 rounded-[2rem] border shadow-sm",
              `bg-${item.color}-50 dark:bg-${item.color}-500/5 border-${item.color}-100 dark:border-${item.color}-500/10`,
            )}
            style={{
              backgroundColor: item.color === "emerald" ? "rgb(236 253 245 / 1)" : item.color === "rose" ? "rgb(255 241 242 / 1)" : "rgb(238 242 255 / 1)",
            }}
          >
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{item.label}</p>
            <p className={cn("text-2xl font-bold", `text-${item.color}-600`)}>
              {formatAmount(item.value)}
            </p>
          </MotionDiv>
        ))}
      </div>

      {/* Waterfall Chart */}
      <ReportCard title={t("reports.money_flow")} subtitle={t("reports.money_flow_desc")}>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={waterfallDisplay} margin={{ top: 20, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12, fontWeight: 600 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v} axisLine={false} tickLine={false} />
              <RechartsTooltip content={<CustomTooltip />} cursor={false} />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {waterfallDisplay.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ReportCard>

      {/* Income & Expense Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income Breakdown */}
        <ReportCard title={t("reports.income_sources")}>
          {data.incomeSources.length === 0 ? (
            <EmptyState message="No income recorded this period." />
          ) : (
            <div className="h-[300px] w-full flex flex-col pt-4">
              <div className="h-[220px] w-full relative shrink-0">
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 mt-1">
                    {t("reports.total_income")}
                  </p>
                  <h4 className="text-xl font-bold text-slate-900 dark:text-white leading-none">
                    {formatAmount(data.totalInflow)}
                  </h4>
                </div>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.incomeSources}
                      dataKey="amount"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={100}
                      paddingAngle={5}
                      stroke="none"
                      cornerRadius={6}
                    >
                      {data.incomeSources.map((entry, i) => (
                        <Cell key={i} fill={entry.color} className="cursor-pointer transition-all duration-300 outline-none hover:opacity-100 opacity-80" />
                      ))}
                    </Pie>
                    <RechartsTooltip content={<CustomTooltip />} cursor={false} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 mt-4 pb-2">
                {data.incomeSources.slice(0, 6).map((item) => (
                  <div key={item.name} className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 truncate max-w-[80px]">{item.name}</span>
                    <span className="text-[10px] font-bold text-slate-400">{item.percentage.toFixed(0)}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </ReportCard>

        {/* Expense Breakdown */}
        <ReportCard title={t("reports.expense_distribution")} className="flex flex-col">
          {data.expenseFlows.length === 0 ? (
            <EmptyState message="No expenses recorded this period." />
          ) : (
            <div className="space-y-3 flex-1 flex flex-col justify-center">
              {data.expenseFlows.slice(0, 8).map((flow) => (
                <div key={flow.name} className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: flow.color }} />
                  <span className="text-sm font-medium text-slate-700 dark:text-zinc-300 flex-1 truncate">
                    {flow.name}
                  </span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    {formatAmount(flow.amount)}
                  </span>
                  <span className="text-xs text-slate-400 w-12 text-right">
                    {flow.percentage.toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </ReportCard>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// ═── TAB 3: BUDGET ═══════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════════════

const BudgetTab: React.FC<{
  data: BudgetData;
  formatAmount: (n: number) => string;
  range: any;
}> = ({ data, formatAmount, range }) => {
  const { t } = useTranslation();
  if (data.budgetVsActual.length === 0 && data.heatmap.length === 0) {
    return <EmptyState message={t("reports.budget_empty")} icon={PiggyBank} />;
  }

  return (
    <div className="space-y-6">
      {/* Discipline Score */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ReportCard className="lg:col-span-1 flex flex-col items-center justify-center">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">{t("reports.budget_discipline")}</h3>
          {data.disciplineScore === -1 ? (
            <div className="w-[150px] h-[150px] rounded-full border-8 border-slate-100 dark:border-white/5 flex flex-col items-center justify-center text-center">
              <span className="text-2xl font-bold text-slate-300 dark:text-zinc-600">N/A</span>
              <span className="text-xs text-slate-400 mt-1">{data.disciplineLabel}</span>
            </div>
          ) : (
            <CircularProgress
              value={data.disciplineScore}
              size={150}
              strokeWidth={14}
              color={
                data.disciplineScore >= 80
                  ? "#10b981"
                  : data.disciplineScore >= 60
                    ? "#f59e0b"
                    : "#f43f5e"
              }
              label={data.disciplineLabel}
            />
          )}
          <div className="mt-5 grid grid-cols-2 gap-4 text-center w-full">
            <div className="p-3 bg-slate-50 dark:bg-zinc-800/50 rounded-xl">
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">{t("reports.budget")}</p>
              <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                {data.categoriesWithinBudget}/{data.totalCategories}
              </p>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-zinc-800/50 rounded-xl">
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">{t("reports.safe_days")}</p>
              <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                {data.daysUnderSafeSpend}/{data.totalDays}
              </p>
            </div>
          </div>
        </ReportCard>

        {/* Budget vs Actual Chart */}
        <ReportCard title={t("reports.budget_vs_actual")} className="lg:col-span-2">
          {data.budgetVsActual.length === 0 ? (
            <EmptyState message="No budgets to compare." />
          ) : (
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.budgetVsActual.slice(0, 8)}
                  margin={{ top: 10, right: 10, left: 10, bottom: 5 }}
                  barGap={2}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" vertical={false} />
                  <XAxis dataKey="categoryName" tick={{ fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v} axisLine={false} tickLine={false} />
                  <RechartsTooltip content={<CustomTooltip />} cursor={false} />
                  <Legend wrapperStyle={{ fontSize: 12, fontWeight: 600 }} />
                  <Bar dataKey="budgeted" name="Budget" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="actual" name="Actual" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </ReportCard>
      </div>

      {/* Category Status */}
      <ReportCard title={t("reports.category_budget_status")}>
        <div className="space-y-3">
          {data.budgetVsActual.map((b) => (
            <div key={b.budgetId} className="flex items-center gap-4">
              <div
                className={cn(
                  "w-2.5 h-2.5 rounded-full shrink-0",
                  b.status === "over"
                    ? "bg-rose-500"
                    : b.status === "near"
                      ? "bg-amber-500"
                      : "bg-emerald-500",
                )}
              />
              <span className="text-sm font-medium text-slate-700 dark:text-zinc-300 flex-1 min-w-0 truncate">
                {b.categoryName}
              </span>
              <div className="flex-1 max-w-[200px]">
                <div className="h-2 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      b.status === "over"
                        ? "bg-rose-500"
                        : b.status === "near"
                          ? "bg-amber-500"
                          : "bg-emerald-500",
                    )}
                    style={{ width: `${Math.min(100, b.percentage)}%` }}
                  />
                </div>
              </div>
              <span className={cn(
                "text-xs font-bold w-12 text-right",
                b.status === "over" ? "text-rose-500" : b.status === "near" ? "text-amber-500" : "text-emerald-500",
              )}>
                {b.percentage.toFixed(0)}%
              </span>
              <span className={cn(
                "text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full",
                b.status === "over"
                  ? "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400"
                  : b.status === "near"
                    ? "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400"
                    : "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
              )}>
                {b.status === "over" ? t("reports.status_over") : b.status === "near" ? t("reports.status_near") : t("reports.status_under")}
              </span>
            </div>
          ))}
        </div>
      </ReportCard>

      {/* Overspending Heatmap */}
      <ReportCard title={t("reports.spending_heatmap")} subtitle={t("reports.heatmap_subtitle")}>
        <div className="mt-2">
          {/* Day labels */}
          <div className="flex gap-1 mb-1 ml-8">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} className="w-8 h-5 text-[9px] font-bold text-slate-400 text-center">{d}</div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="space-y-1">
            {(() => {
              const weeks: HeatmapDay[][] = [];
              let currentWeek: HeatmapDay[] = [];

              // Pad the first week
              const firstDayOfWeek = data.heatmap[0]?.dayOfWeek || 0;
              for (let i = 0; i < firstDayOfWeek; i++) {
                currentWeek.push({
                  date: "",
                  dayOfMonth: 0,
                  dayOfWeek: i,
                  amount: 0,
                  safeSpend: 0,
                  isOver: false,
                  intensity: -1, // empty placeholder
                });
              }

              data.heatmap.forEach((day) => {
                if (currentWeek.length === 7) {
                  weeks.push(currentWeek);
                  currentWeek = [];
                }
                currentWeek.push(day);
              });
              if (currentWeek.length > 0) weeks.push(currentWeek);

              return weeks.map((week, wi) => (
                <div key={wi} className="flex gap-1 items-center">
                  <div className="w-7 text-[9px] font-bold text-slate-400 text-right pr-1">
                    {week.find((d) => d.dayOfMonth > 0)?.dayOfMonth === 1 || wi === 0
                      ? `W${wi + 1}`
                      : ""}
                  </div>
                  {week.map((day, di) => {
                    if (day.intensity === -1) {
                      return <div key={di} className="w-8 h-8 rounded-lg" />;
                    }
                    const intensityColors = [
                      "bg-slate-50 dark:bg-zinc-800/50",
                      "bg-emerald-100 dark:bg-emerald-900/30",
                      "bg-amber-100 dark:bg-amber-900/30",
                      "bg-orange-200 dark:bg-orange-900/40",
                      "bg-rose-300 dark:bg-rose-900/50",
                    ];
                    return (
                      <div
                        key={di}
                        className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center text-[9px] font-bold transition-colors cursor-default",
                          intensityColors[day.intensity] || intensityColors[0],
                          day.isOver && "ring-1 ring-rose-400/50",
                          day.amount > 0
                            ? "text-slate-600 dark:text-zinc-300"
                            : "text-slate-300 dark:text-zinc-600",
                        )}
                        title={`Day ${day.dayOfMonth}: ${day.amount > 0 ? day.amount.toLocaleString() : "No spending"}`}
                      >
                        {day.dayOfMonth}
                      </div>
                    );
                  })}
                </div>
              ));
            })()}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 justify-center">
            <span className="text-[10px] font-bold text-slate-400">{t("reports.less")}</span>
            {["bg-slate-50 dark:bg-zinc-800/50", "bg-emerald-100 dark:bg-emerald-900/30", "bg-amber-100 dark:bg-amber-900/30", "bg-orange-200 dark:bg-orange-900/40", "bg-rose-300 dark:bg-rose-900/50"].map((cls, i) => (
              <div key={i} className={cn("w-5 h-5 rounded", cls)} />
            ))}
            <span className="text-[10px] font-bold text-slate-400">{t("reports.more")}</span>
          </div>
        </div>
      </ReportCard>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// ═── TAB 4: FORECAST ═════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════════════

const ForecastTab: React.FC<{
  data: ForecastData;
  formatAmount: (n: number) => string;
}> = ({ data, formatAmount }) => {
  const { t } = useTranslation();
  if (!data.hasEnoughData) {
    return (
      <EmptyState
        message={t("reports.forecast_empty")}
        icon={Target}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Monthly Averages */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: t("reports.avg_monthly_income"), value: data.monthlyAvgIncome, color: "#10b981" },
          { label: t("reports.avg_monthly_expense"), value: data.monthlyAvgExpense, color: "#f43f5e" },
          { label: t("reports.avg_monthly_savings"), value: data.monthlyAvgSavings, color: data.monthlyAvgSavings >= 0 ? "#6366f1" : "#f43f5e" },
        ].map((item) => (
          <MotionDiv
            key={item.label}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-5 bg-white dark:bg-zinc-900 rounded-[2rem] border border-slate-200 dark:border-white/5 shadow-sm"
          >
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{item.label}</p>
            <p className="text-2xl font-bold" style={{ color: item.color }}>
              {formatAmount(item.value)}
            </p>
          </MotionDiv>
        ))}
      </div>

      {/* Net Worth Projection */}
      <ReportCard title={t("reports.net_worth_projection")} subtitle={t("reports.net_worth_subtitle")}>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.netWorthProjection} margin={{ top: 30, right: 10, left: 10, bottom: 5 }}>
              <defs>
                <linearGradient id="nwGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => v >= 100000 ? `${(v / 100000).toFixed(1)}L` : v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v} axisLine={false} tickLine={false} />
              <RechartsTooltip content={<CustomTooltip />} cursor={false} />
              <Area
                type="monotone"
                dataKey="value"
                name="Net Worth"
                stroke="#6366f1"
                strokeWidth={2}
                fill="url(#nwGradient)"
              />
              <ReferenceLine
                x={data.netWorthProjection.find((p) => p.isProjected)?.month}
                stroke="#94a3b8"
                strokeDasharray="3 3"
                label={{ value: "Forecast →", position: "insideTopRight", fontSize: 10, fontWeight: 700, fill: "#94a3b8", offset: 10 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </ReportCard>

      {/* Expense & Savings Projections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ReportCard title={t("reports.expense_projection")}>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.expenseProjection} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 10, fontWeight: 600 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v} axisLine={false} tickLine={false} />
                <RechartsTooltip content={<CustomTooltip />} cursor={false} />
                <Line
                  type="monotone"
                  dataKey="value"
                  name="Expenses"
                  stroke="#f43f5e"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ReportCard>

        <ReportCard title={t("reports.savings_projection")}>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.savingsProjection} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                <defs>
                  <linearGradient id="savGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 10, fontWeight: 600 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v} axisLine={false} tickLine={false} />
                <RechartsTooltip content={<CustomTooltip />} cursor={false} />
                <Area
                  type="monotone"
                  dataKey="value"
                  name="Savings"
                  stroke="#10b981"
                  strokeWidth={2}
                  fill="url(#savGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ReportCard>
      </div>

      {/* Forecast Summary */}
      <ReportCard>
        <div className="flex items-start gap-4 p-2">
          <div className="p-3 bg-sky-50 dark:bg-sky-500/10 rounded-xl shrink-0">
            <Zap size={22} className="text-sky-600 dark:text-sky-400" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 dark:text-white mb-2">{t("reports.forecast_summary")}</h4>
            <p className="text-sm text-slate-600 dark:text-zinc-300 leading-relaxed">
              {data.forecastSummary}
            </p>
          </div>
        </div>
      </ReportCard>
    </div>
  );
};

export default Reports;
