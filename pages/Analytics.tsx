import React, { useState, useMemo } from "react";
import CustomDatePicker from "../components/CustomDatePicker";
import { useData } from "../context/DataContext";
import { useHousehold } from "../context/HouseholdContext";
import { useAuth } from "../context/AuthContext";
import { cn, formatDate } from "../utils";
import {
  calculateTotals,
  calculateSavingsRate,
  calculateCategoryBreakdown,
  calculateHighestSpendingDay,
  calculateSpendingDominance,
} from "../utils/analytics";
import {
  Calendar,
  ChevronDown,
  Filter,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Percent,
  ShoppingBag,
  CalendarDays,
  ArrowUpRight,
  ArrowDownRight,
  Wallet as WalletIcon,
} from "lucide-react";
import CustomSelect from "../components/CustomSelect";
import { useNavigate } from "react-router-dom";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  AreaChart,
  Area,
  Label,
  LabelList,
  LineChart,
  Line,
  Legend,
  CartesianGrid,
  ReferenceLine,
} from "recharts";

type TimeRange =
  | "this-month"
  | "last-month"
  | "last-30"
  | "this-year"
  | "all-time"
  | "custom";

interface SummaryCardProps {
  label: string;
  value: string;
  icon: any;
  color: "emerald" | "rose" | "indigo" | "amber" | "slate";
  isPositive?: boolean;
  onClick?: () => void;
}

const SummaryCard: React.FC<SummaryCardProps> = ({
  label,
  value,
  icon: Icon,
  color,
  isPositive,
  onClick,
}) => {
  const colorClasses = {
    emerald:
      "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    rose: "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400",
    indigo:
      "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
    amber:
      "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400",
    slate:
      "bg-slate-50 dark:bg-slate-500/10 text-slate-600 dark:text-slate-400",
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        "p-4 md:p-6 bg-white dark:bg-zinc-900 rounded-[2rem] border border-slate-100 dark:border-white/5 shadow-sm hover:shadow-md transition-all group overflow-hidden relative",
        onClick &&
          "cursor-pointer hover:border-brand-200 dark:hover:border-brand-900/50",
      )}
    >
      <div
        className={cn(
          "inline-flex p-2.5 rounded-2xl mb-4 group-hover:scale-110 transition-transform",
          colorClasses[color],
        )}
      >
        <Icon size={20} />
      </div>
      <div className="space-y-1">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
          {label}
        </p>
        <div className="flex items-baseline gap-2">
          <h3
            className={cn(
              "text-lg md:text-2xl font-bold truncate",
              isPositive !== undefined
                ? isPositive
                  ? "text-emerald-600"
                  : "text-rose-600"
                : "text-slate-900 dark:text-white",
            )}
          >
            {value}
          </h3>
        </div>
      </div>
    </div>
  );
};

const Analytics: React.FC = () => {
  const {
    transactions,
    wallets,
    formatAmount,
    categories,
    budgets,
    goals,
    recurringTransactions,
  } = useData();
  const { activeWorkspace, currentMembers } = useHousehold();
  const { user } = useAuth();
  const isHouseholdMode = activeWorkspace.type === "household";
  const navigate = useNavigate();

  const [timeRange, setTimeRange] = useState<TimeRange>("this-month");
  const [walletFilter, setWalletFilter] = useState("all");
  const [memberFilter, setMemberFilter] = useState("all");
  const [isCustomDateOpen, setIsCustomDateOpen] = useState(false);
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  // Drill-down helper
  const handleDrillDown = (filters: {
    category?: string;
    type?: string;
    wallet?: string;
  }) => {
    // Determine the date range strings based on current selection
    // We already have start/end in the useMemo, but let's derive them easily here or just use the state
    let from = "";
    let to = "";

    // Simplification: use the calculated dates from the filteredData
    // We can't access filteredData here easily without putting this inside or passing it.
    // Let's just navigate with the relevant filters.
    // The Transactions page will handle date filtered if we pass from/to.

    const params = new URLSearchParams();
    if (filters.category) params.append("category", filters.category);
    if (filters.type) params.append("type", filters.type);
    if (filters.wallet && filters.wallet !== "all")
      params.append("wallet", filters.wallet);
    else if (walletFilter !== "all") params.append("wallet", walletFilter);

    // Get dates from current timeRange
    const now = new Date();
    let s = new Date();
    let e = new Date();
    e.setHours(23, 59, 59);

    if (timeRange === "this-month") {
      s = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (timeRange === "last-month") {
      s = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      e = new Date(now.getFullYear(), now.getMonth(), 0);
    } else if (timeRange === "last-30") {
      s.setDate(now.getDate() - 30);
    } else if (timeRange === "this-year") {
      s = new Date(now.getFullYear(), 0, 1);
    } else if (timeRange === "all-time") {
      if (transactions.length > 0) {
        const sortedDates = [...transactions].sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
        );
        s = new Date(sortedDates[0].date);
      } else {
        s = new Date(2000, 0, 1);
      }
    } else if (timeRange === "custom" && customStart && customEnd) {
      s = new Date(customStart);
      e = new Date(customEnd);
    }

    params.append("from", s.toISOString().split("T")[0]);
    params.append("to", e.toISOString().split("T")[0]);

    navigate(`/transactions?${params.toString()}`);
  };

  // Drill-down state
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);

  const TIME_OPTIONS: { value: TimeRange; label: string }[] = [
    { value: "this-month", label: "This Month" },
    { value: "last-month", label: "Last Month" },
    { value: "last-30", label: "Last 30 Days" },
    { value: "this-year", label: "This Year" },
    { value: "all-time", label: "All Time" },
    { value: "custom", label: "Custom Range" },
  ];

  const walletOptions = [
    { value: "all", label: "All Wallets", icon: Filter },
    ...wallets.map((w) => ({
      value: w.id,
      label: w.name,
      icon: WalletIcon,
      color: w.color,
    })),
  ];

  // Logic to filter transactions
  const filteredData = useMemo(() => {
    const now = new Date();
    let start = new Date(now.getFullYear(), now.getMonth(), 1);
    let end = new Date();
    end.setHours(23, 59, 59, 999);

    if (timeRange === "last-month") {
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    } else if (timeRange === "last-30") {
      start = new Date();
      start.setDate(now.getDate() - 30);
      start.setHours(0, 0, 0, 0);
    } else if (timeRange === "this-year") {
      start = new Date(now.getFullYear(), 0, 1);
    } else if (timeRange === "all-time") {
      // Find the earliest transaction date
      if (transactions.length > 0) {
        const sortedDates = [...transactions].sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
        );
        start = new Date(sortedDates[0].date);
        start.setHours(0, 0, 0, 0);
      } else {
        start = new Date(2000, 0, 1);
      }
    } else if (timeRange === "custom" && customStart && customEnd) {
      start = new Date(customStart);
      start.setHours(0, 0, 0, 0);
      end = new Date(customEnd);
      end.setHours(23, 59, 59, 999);
    }

    const filtered = transactions.filter((t) => {
      const d = new Date(t.date);
      const isInRange = d >= start && d <= end;
      const isCorrectWallet =
        walletFilter === "all" ||
        t.fromWalletId === walletFilter ||
        t.toWalletId === walletFilter;
      // Member filter (household mode)
      const isCorrectMember =
        !isHouseholdMode ||
        memberFilter === "all" ||
        (memberFilter === "mine"
          ? t.createdBy === user?.email
          : t.createdBy === memberFilter);
      return isInRange && isCorrectWallet && isCorrectMember;
    });

    // Use centralized utilities
    const { income, expense } = calculateTotals(filtered);
    const pieData = calculateCategoryBreakdown(filtered, categories);

    // Sub-category logic (kept local for now as it's specific to this drill-down)
    const subCategoryMap: Record<string, Record<string, number>> = {};
    const dayTotals: Record<string, number> = {};

    filtered.forEach((t) => {
      if (t.type === "expense") {
        const cat = categories.find((c) => c.id === t.categoryId);
        if (cat) {
          if (!subCategoryMap[cat.id]) subCategoryMap[cat.id] = {};

          let subCatName = "Other";
          if (t.subCategoryId) {
            const subCat = cat.subCategories?.find(
              (sc) => sc.id === t.subCategoryId,
            );
            if (subCat) subCatName = subCat.name;
          }
          subCategoryMap[cat.id][subCatName] =
            (subCategoryMap[cat.id][subCatName] || 0) + t.amount;
        }

        const dayKey = new Date(t.date).toDateString();
        dayTotals[dayKey] = (dayTotals[dayKey] || 0) + t.amount;
      }
    });

    const subCatData: { name: string; amount: number; color: string }[] =
      activeCategoryId
        ? Object.entries(subCategoryMap[activeCategoryId] || {})
            .map(([name, amount]) => ({
              name,
              amount,
              color:
                categories.find((c) => c.id === activeCategoryId)?.color ||
                "#6366f1",
            }))
            .sort((a, b) => b.amount - a.amount)
        : [];

    const netSavings = income - expense;
    const savingsRate = calculateSavingsRate(income, expense);
    const biggestCat = pieData.length > 0 ? pieData[0].name : "None";
    const biggestCatId = pieData.length > 0 ? pieData[0].id : null;

    // Spending Dominance (New Metric)
    const dominanceScore =
      pieData.length > 0
        ? calculateSpendingDominance(pieData[0].value, expense)
        : 0;

    let highestDay = "-";
    const highestDayData = calculateHighestSpendingDay(filtered);
    if (highestDayData) {
      highestDay = highestDayData.dayName;
    }

    // Trend Data
    const dateMap: Record<
      string,
      { date: string; income: number; expense: number }
    > = {};
    let curr = new Date(start);
    while (curr <= end) {
      const key = curr.toDateString();
      dateMap[key] = {
        date: curr.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        income: 0,
        expense: 0,
      };
      curr.setDate(curr.getDate() + 1);
    }
    filtered.forEach((t) => {
      const key = new Date(t.date).toDateString();
      if (dateMap[key]) {
        if (t.type === "income") dateMap[key].income += t.amount;
        if (t.type === "expense") dateMap[key].expense += t.amount;
      }
    });

    // Previous Period Logic
    let prevStart = new Date(start);
    let prevEnd = new Date(start);
    prevEnd.setMilliseconds(-1);

    if (timeRange === "this-month") {
      prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    } else if (timeRange === "last-month") {
      prevStart = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    } else if (timeRange === "last-30") {
      prevStart = new Date(start);
      prevStart.setDate(start.getDate() - 30);
    } else if (timeRange === "this-year") {
      prevStart = new Date(now.getFullYear() - 1, 0, 1);
      prevEnd = new Date(now.getFullYear(), 0, 0, 23, 59, 59, 999);
    }

    const prevFiltered = transactions.filter((t) => {
      const d = new Date(t.date);
      const isInRange = d >= prevStart && d <= prevEnd;
      const isCorrectWallet =
        walletFilter === "all" ||
        t.fromWalletId === walletFilter ||
        t.toWalletId === walletFilter;
      return isInRange && isCorrectWallet;
    });

    let prevIncome = 0;
    let prevExpense = 0;
    const prevCatTotals: Record<string, number> = {};
    prevFiltered.forEach((t) => {
      if (t.type === "income") prevIncome += t.amount;
      else if (t.type === "expense") {
        prevExpense += t.amount;
        prevCatTotals[t.categoryId] =
          (prevCatTotals[t.categoryId] || 0) + t.amount;
      }
    });

    // Insights
    const insights: {
      title: string;
      desc: string;
      type: "up" | "down" | "neutral";
      icon: any;
    }[] = [];
    if (prevExpense > 0) {
      const diff = ((expense - prevExpense) / prevExpense) * 100;
      if (Math.abs(diff) > 5) {
        insights.push({
          title: diff > 0 ? "Spending Increase" : "Spending Decrease",
          desc: `You've spent ${Math.abs(diff).toFixed(2)}% ${diff > 0 ? "more" : "less"} than the previous period.`,
          type: diff > 0 ? "up" : "down",
          icon: diff > 0 ? ArrowUpRight : ArrowDownRight,
        });
      }
    }

    const prevNet = prevIncome - prevExpense;
    const prevRate = prevIncome > 0 ? (prevNet / prevIncome) * 100 : 0;
    if (savingsRate > prevRate + 2) {
      insights.push({
        title: "Great Progress!",
        desc: `Your savings rate improved from ${prevRate.toFixed(2)}% to ${savingsRate.toFixed(2)}%.`,
        type: "down",
        icon: PiggyBank,
      });
    }

    pieData.forEach((data) => {
      const prevAmt = prevCatTotals[data.id] || 0;
      if (prevAmt > 0) {
        const diff = ((data.value - prevAmt) / prevAmt) * 100;
        if (diff > 25 && data.value > 50) {
          insights.push({
            title: `${data.name} Spike`,
            desc: `Spending in ${data.name} is up by ${diff.toFixed(2)}% this period.`,
            type: "up",
            icon: ShoppingBag,
          });
        }
      }
    });

    // Budget Progress Logic
    const budgetProgress = budgets
      .map((budget) => {
        const cat = categories.find((c) => c.id === budget.categoryId);
        const spent = transactions
          .filter((t) => {
            const d = new Date(t.date);
            // This is simplified: usually budgets have specific periods.
            // For analytics, we'll show spent in the selected time range for that category.
            const isInRange = d >= start && d <= end;
            const isCorrectCategory = t.categoryId === budget.categoryId;
            const isCorrectWallet =
              !budget.walletId ||
              t.fromWalletId === budget.walletId ||
              t.toWalletId === walletFilter;
            return (
              t.type === "expense" &&
              isInRange &&
              isCorrectCategory &&
              isCorrectWallet
            );
          })
          .reduce((sum, t) => sum + t.amount, 0);

        const percent = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
        let status: "green" | "amber" | "red" = "green";
        if (percent >= 100) status = "red";
        else if (percent >= 80) status = "amber";

        return {
          ...budget,
          spent,
          percent,
          status,
          categoryName: cat?.name || "Unknown",
        };
      })
      .sort((a, b) => b.percent - a.percent);

    // Goal Progress
    const goalData = goals
      .map((goal) => ({
        ...goal,
        percent:
          goal.targetAmount > 0
            ? (goal.currentBalance / goal.targetAmount) * 100
            : 0,
      }))
      .sort((a, b) => b.percent - a.percent);

    // === NEW CHART DATA ===

    // 1. Spending by Day of Week (Bar Chart)
    const dayOfWeekNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const dayOfWeekTotals = [0, 0, 0, 0, 0, 0, 0];
    const dayOfWeekCounts = [0, 0, 0, 0, 0, 0, 0];
    filtered.forEach((t) => {
      if (t.type === "expense") {
        const d = new Date(t.date).getDay();
        dayOfWeekTotals[d] += t.amount;
        dayOfWeekCounts[d]++;
      }
    });
    const dayOfWeekData = dayOfWeekNames.map((name, i) => ({
      name,
      total: Number(dayOfWeekTotals[i].toFixed(2)),
      avg:
        dayOfWeekCounts[i] > 0
          ? Number((dayOfWeekTotals[i] / dayOfWeekCounts[i]).toFixed(2))
          : 0,
    }));

    // 2. Top Categories Comparison (Horizontal Bar)
    const trendArr = Object.values(dateMap);
    const topCategoriesData = pieData.slice(0, 6).map((cat) => ({
      name: cat.name,
      amount: Number(cat.value.toFixed(2)),
      color: cat.color,
    }));

    // 3. Wallet Balance Distribution
    const walletBalanceData = wallets
      .filter((w) => w.balance > 0)
      .map((w) => ({
        name: w.name,
        value: w.balance,
        color: w.color || "#6366f1",
      }))
      .sort((a, b) => b.value - a.value);

    // 4. Budget vs Actual Comparison (Bar Chart)
    const budgetVsActualData = budgets
      .map((budget) => {
        const cat = categories.find((c) => c.id === budget.categoryId);
        const actual = filtered
          .filter(
            (t) => t.type === "expense" && t.categoryId === budget.categoryId,
          )
          .reduce((sum, t) => sum + t.amount, 0);
        return {
          name: budget.name || cat?.name || "Unknown",
          budget: budget.amount,
          actual: Number(actual.toFixed(2)),
          color: budget.color || cat?.color || "#6366f1",
        };
      })
      .sort((a, b) => b.actual - a.actual);

    // 5. Variance Analysis (Budget - Actual)
    const varianceData = budgetVsActualData.map((item) => ({
      name: item.name,
      variance: Number((item.budget - item.actual).toFixed(2)),
      color: item.budget - item.actual >= 0 ? "#10b981" : "#f43f5e",
    }));

    // 6. Budget Compliance Rate
    const totalBudgeted = budgets.reduce((sum, b) => sum + b.amount, 0);
    const totalActualBudgeted = budgets.reduce((sum, budget) => {
      const actual = filtered
        .filter(
          (t) => t.type === "expense" && t.categoryId === budget.categoryId,
        )
        .reduce((s, t) => s + t.amount, 0);
      return sum + Math.min(actual, budget.amount);
    }, 0);
    const complianceRate =
      totalBudgeted > 0
        ? Number(((totalActualBudgeted / totalBudgeted) * 100).toFixed(1))
        : 0;
    const budgetsOnTrack = budgetVsActualData.filter(
      (b) => b.actual <= b.budget,
    ).length;
    const budgetsOverspent = budgetVsActualData.filter(
      (b) => b.actual > b.budget,
    ).length;

    // 7. Recurring Expenses
    const recurringData = recurringTransactions
      .filter((r) => r.isActive && r.type === "expense")
      .map((r) => {
        const cat = categories.find((c) => c.id === r.categoryId);
        let monthlyAmount = r.amount;
        if (r.frequency === "daily") monthlyAmount = r.amount * 30;
        else if (r.frequency === "weekly") monthlyAmount = r.amount * 4;
        else if (r.frequency === "yearly")
          monthlyAmount = Number((r.amount / 12).toFixed(2));
        return {
          name: cat?.name || "Recurring",
          amount: r.amount,
          monthlyAmount: Number(monthlyAmount.toFixed(2)),
          frequency: r.frequency,
          color: cat?.color || "#6366f1",
        };
      })
      .sort((a, b) => b.monthlyAmount - a.monthlyAmount);
    const totalMonthlyRecurring = recurringData.reduce(
      (sum, r) => sum + r.monthlyAmount,
      0,
    );

    return {
      transactions: filtered,
      income,
      expense,
      netSavings,
      savingsRate,
      biggestCategory: biggestCat,
      biggestCategoryId: biggestCatId,
      highestDay,
      pieData,
      subCatData,
      trendData: trendArr,
      insights,
      budgetProgress,
      goalData,
      dominanceScore,
      dayOfWeekData,
      topCategoriesData,
      walletBalanceData,
      budgetVsActualData,
      varianceData,
      complianceRate,
      budgetsOnTrack,
      budgetsOverspent,
      recurringData,
      totalMonthlyRecurring,
    };
  }, [
    transactions,
    timeRange,
    walletFilter,
    memberFilter,
    customStart,
    customEnd,
    categories,
    activeCategoryId,
    budgets,
    goals,
  ]);

  const activeCategoryName = categories.find(
    (c) => c.id === activeCategoryId,
  )?.name;

  return (
    <div className="space-y-8 pb-20 no-scrollbar">
      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 tour-analytics-overview">
        <div>
          <h2 className="text-3xl font-bold tracking-tight mb-1">
            Financial Analytics
          </h2>
          <p className="text-slate-500 font-medium">
            Deep insights into your money
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="w-full sm:w-48">
            <CustomSelect
              value={timeRange}
              onChange={(val) => setTimeRange(val as TimeRange)}
              options={TIME_OPTIONS}
            />
          </div>
          <div className="w-full sm:w-48">
            <CustomSelect
              value={walletFilter}
              onChange={setWalletFilter}
              options={walletOptions}
            />
          </div>
          {isHouseholdMode && (
            <div className="w-full sm:w-48 tour-analytics-member">
              <CustomSelect
                value={memberFilter}
                onChange={setMemberFilter}
                options={[
                  { value: "all", label: "All Members" },
                  { value: "mine", label: "My Spending" },
                  ...currentMembers
                    .filter((m) => m.status === "active")
                    .map((m) => ({
                      value: m.email,
                      label: m.displayName || m.email.split("@")[0],
                    })),
                ]}
              />
            </div>
          )}
        </div>
      </div>

      {timeRange === "custom" && (
        <div className="p-4 bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200 dark:border-white/5 flex flex-wrap gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex-1 min-w-[140px]">
            <CustomDatePicker
              value={customStart}
              onChange={setCustomStart}
              label="Start Date"
              className="bg-slate-50 dark:bg-black border-slate-200 dark:border-zinc-800"
            />
          </div>
          <div className="flex-1 min-w-[140px]">
            <CustomDatePicker
              value={customEnd}
              onChange={setCustomEnd}
              label="End Date"
              className="bg-slate-50 dark:bg-black border-slate-200 dark:border-zinc-800"
            />
          </div>
        </div>
      )}

      {/* Core Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
        <SummaryCard
          label="Total Income"
          value={formatAmount(filteredData.income)}
          icon={TrendingUp}
          color="emerald"
          onClick={() => handleDrillDown({ type: "income" })}
        />
        <SummaryCard
          label="Total Expense"
          value={formatAmount(filteredData.expense)}
          icon={TrendingDown}
          color="rose"
          onClick={() => handleDrillDown({ type: "expense" })}
        />
        <SummaryCard
          label="Net Savings"
          value={formatAmount(filteredData.netSavings)}
          icon={PiggyBank}
          color="indigo"
          isPositive={filteredData.netSavings >= 0}
          onClick={() => handleDrillDown({})}
        />
        <SummaryCard
          label="Savings Rate"
          value={`${filteredData.savingsRate.toFixed(2)}%`}
          icon={Percent}
          color="amber"
          onClick={() => handleDrillDown({})}
        />
        <SummaryCard
          label="Top Spending"
          value={filteredData.biggestCategory}
          icon={ShoppingBag}
          color="slate"
          onClick={() =>
            filteredData.biggestCategoryId &&
            handleDrillDown({ category: filteredData.biggestCategoryId })
          }
        />
        <SummaryCard
          label="Peak Day"
          value={filteredData.highestDay}
          icon={CalendarDays}
          color="slate"
          onClick={() => handleDrillDown({})}
        />
        <SummaryCard
          label="Dominance Score"
          value={`${filteredData.dominanceScore}%`}
          icon={Percent}
          color="slate"
          onClick={() => handleDrillDown({})}
        />
      </div>

      {/* Spending Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Pie Chart */}
        <div className="p-6 md:p-8 bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-slate-200 dark:border-white/5 shadow-sm tour-analytics-charts">
          <h3 className="text-xl font-bold mb-6 flex items-center justify-between">
            <span>Spending by Category</span>
            <span className="text-xs font-medium text-slate-400 uppercase tracking-widest">
              Tap to Drill Down
            </span>
          </h3>
          <div className="h-[300px] w-full relative">
            {/* Central Label for Donut */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                Total Spent
              </p>
              <h4 className="text-2xl font-bold text-slate-900 dark:text-white">
                {formatAmount(filteredData.expense)}
              </h4>
            </div>

            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={filteredData.pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={110}
                  paddingAngle={5}
                  dataKey="value"
                  onClick={(data) => {
                    if (data.id === activeCategoryId)
                      handleDrillDown({ category: data.id });
                    else setActiveCategoryId(data.id);
                  }}
                  stroke="none"
                  cornerRadius={6}
                >
                  {filteredData.pieData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      className={cn(
                        "cursor-pointer transition-all duration-300 outline-none",
                        activeCategoryId === entry.id
                          ? "opacity-100"
                          : "opacity-80 hover:opacity-100",
                      )}
                      style={{
                        filter:
                          activeCategoryId === entry.id
                            ? `drop-shadow(0 0 12px ${entry.color}66)`
                            : "none",
                        transform:
                          activeCategoryId === entry.id
                            ? "scale(1.02)"
                            : "scale(1)",
                        transformOrigin: "center",
                      }}
                    />
                  ))}
                </Pie>
                <RechartsTooltip
                  contentStyle={{
                    borderRadius: "16px",
                    border: "none",
                    background: "rgba(255,255,255,0.95)",
                    boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
                    backdropFilter: "blur(8px)",
                  }}
                  itemStyle={{ fontWeight: "bold" }}
                  formatter={(val: number) => [formatAmount(val), "Spent"]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-4">
            {filteredData.pieData.slice(0, 4).map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  if (item.id === activeCategoryId)
                    handleDrillDown({ category: item.id });
                  else setActiveCategoryId(item.id);
                }}
                className={cn(
                  "flex items-center gap-2 text-sm font-bold px-3 py-2.5 rounded-2xl transition-all cursor-pointer",
                  activeCategoryId === item.id
                    ? "bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white ring-1 ring-slate-200 dark:ring-white/10"
                    : "bg-slate-50 dark:bg-black/20 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10",
                )}
              >
                <div
                  className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                  style={{ backgroundColor: item.color }}
                />
                <span className="truncate flex-1">{item.name}</span>
                <span className="text-slate-400 text-[10px] font-bold">
                  {((item.value / filteredData.expense) * 100).toFixed(2)}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Sub-category Bar Chart */}
        <div className="p-6 md:p-8 bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-slate-200 dark:border-white/5 shadow-sm flex flex-col">
          <h3 className="text-xl font-bold mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span>Sub-category Breakdown</span>
              {activeCategoryName && (
                <span className="text-xs px-2 py-0.5 bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 rounded-full">
                  {activeCategoryName}
                </span>
              )}
            </div>
            {activeCategoryId && (
              <button
                onClick={() => handleDrillDown({ category: activeCategoryId })}
                className="text-xs font-bold text-brand-600 hover:text-brand-700 transition-colors"
              >
                View All
              </button>
            )}
          </h3>

          {!activeCategoryId ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-3">
              <div className="w-16 h-16 bg-slate-50 dark:bg-black/40 rounded-full flex items-center justify-center text-slate-300">
                <Filter size={32} />
              </div>
              <p className="text-slate-500 font-medium">
                Select a category on the left to see drill-down insights
              </p>
            </div>
          ) : filteredData.subCatData.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-3">
              <p className="text-slate-500 font-medium">
                No sub-categories found for this selection
              </p>
            </div>
          ) : (
            <div className="flex-1 min-h-[300px] w-full animate-in fade-in slide-in-from-right-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={filteredData.subCatData}
                  layout="vertical"
                  margin={{ left: 10, right: 30, top: 10, bottom: 10 }}
                  onClick={(data) => {
                    if (data && data.activeLabel && activeCategoryId) {
                      handleDrillDown({ category: activeCategoryId });
                    }
                  }}
                >
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={100}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fontWeight: 600, fill: "#94a3b8" }}
                  />
                  <RechartsTooltip
                    cursor={{ fill: "transparent" }}
                    contentStyle={{
                      borderRadius: "16px",
                      border: "none",
                      background: "rgba(255,255,255,0.95)",
                      boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
                      backdropFilter: "blur(8px)",
                    }}
                    formatter={(val: number) => [formatAmount(val), "Amount"]}
                  />
                  <Bar dataKey="amount" radius={[0, 10, 10, 0]} barSize={24}>
                    {filteredData.subCatData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                    <LabelList
                      dataKey="amount"
                      position="right"
                      content={(props: any) => {
                        const { x, y, width, value } = props;
                        return (
                          <text
                            x={x + width + 10}
                            y={y + 12}
                            fill="#94a3b8"
                            fontSize={11}
                            fontWeight="bold"
                            textAnchor="start"
                            alignmentBaseline="middle"
                          >
                            {formatAmount(value || 0)}
                          </text>
                        );
                      }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Time-based Trends */}
      <div className="grid grid-cols-1 space-y-6">
        <div className="p-6 md:p-8 bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-slate-200 dark:border-white/5 shadow-sm">
          <h3 className="text-xl font-bold mb-6">Expense Over Time</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={filteredData.trendData}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: "#71717a" }}
                  minTickGap={40}
                  dy={10}
                />
                <YAxis hide domain={[0, "auto"]} />
                <RechartsTooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "none",
                    background: "rgba(255,255,255,0.95)",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                  }}
                  formatter={(val: number) => [formatAmount(val), "Expense"]}
                />
                <Area
                  type="monotone"
                  dataKey="expense"
                  stroke="#f43f5e"
                  strokeWidth={3}
                  fill="url(#colorExp)"
                  animationDuration={1000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-6 md:p-8 bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-slate-200 dark:border-white/5 shadow-sm">
          <h3 className="text-xl font-bold mb-6">Income vs Expense</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={filteredData.trendData}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorInc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorExp2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: "#71717a" }}
                  minTickGap={40}
                  dy={10}
                />
                <YAxis hide domain={[0, "auto"]} />
                <RechartsTooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "none",
                    background: "rgba(255,255,255,0.95)",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                  }}
                  formatter={(val: number) => formatAmount(val)}
                />
                <Area
                  type="monotone"
                  dataKey="income"
                  stroke="#10b981"
                  strokeWidth={3}
                  fill="url(#colorInc)"
                  animationDuration={1000}
                />
                <Area
                  type="monotone"
                  dataKey="expense"
                  stroke="#f43f5e"
                  strokeWidth={3}
                  fill="url(#colorExp2)"
                  animationDuration={1000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Spending by Day of Week */}
      <div className="p-6 md:p-8 bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-slate-200 dark:border-white/5 shadow-sm">
        <h3 className="text-xl font-bold mb-2">Spending by Day of Week</h3>
        <p className="text-sm text-slate-500 mb-6">
          Which days do you spend the most?
        </p>
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={filteredData.dayOfWeekData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#e2e8f0"
                vertical={false}
              />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fontWeight: 600, fill: "#94a3b8" }}
              />
              <YAxis hide />
              <RechartsTooltip
                cursor={{ fill: "transparent" }}
                contentStyle={{
                  borderRadius: "16px",
                  border: "none",
                  background: "rgba(255,255,255,0.95)",
                  boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
                  backdropFilter: "blur(8px)",
                }}
                formatter={(val: number, name: string) => [
                  formatAmount(val),
                  name === "total" ? "Total Spent" : "Avg per Tx",
                ]}
              />
              <Bar
                dataKey="total"
                fill="#8b5cf6"
                radius={[8, 8, 0, 0]}
                barSize={32}
                name="total"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Budget vs Actual Comparison */}
      {filteredData.budgetVsActualData.length > 0 && (
        <div className="p-6 md:p-8 bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-slate-200 dark:border-white/5 shadow-sm tour-analytics-budget-actual">
          <h3 className="text-xl font-bold mb-2">Budget vs Actual</h3>
          <p className="text-sm text-slate-500 mb-6">
            Compare your planned budget with actual spending
          </p>
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={filteredData.budgetVsActualData}
                margin={{ top: 10, right: 30, left: 10, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#e2e8f0"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fontWeight: 600, fill: "#94a3b8" }}
                />
                <YAxis hide />
                <RechartsTooltip
                  cursor={{ fill: "transparent" }}
                  contentStyle={{
                    borderRadius: "16px",
                    border: "none",
                    background: "rgba(255,255,255,0.95)",
                    boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
                    backdropFilter: "blur(8px)",
                  }}
                  formatter={(val: number) => formatAmount(val)}
                />
                <Legend verticalAlign="top" height={36} iconType="circle" />
                <Bar
                  dataKey="budget"
                  name="Budget"
                  fill="#6366f1"
                  radius={[6, 6, 0, 0]}
                  barSize={20}
                  opacity={0.4}
                />
                <Bar
                  dataKey="actual"
                  name="Actual"
                  radius={[6, 6, 0, 0]}
                  barSize={20}
                >
                  {filteredData.budgetVsActualData.map((entry, index) => (
                    <Cell
                      key={`bva-${index}`}
                      fill={entry.actual > entry.budget ? "#f43f5e" : "#10b981"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Variance Analysis & Compliance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Variance Analysis */}
        {filteredData.varianceData.length > 0 && (
          <div className="p-6 md:p-8 bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-slate-200 dark:border-white/5 shadow-sm">
            <h3 className="text-xl font-bold mb-2">Variance Analysis</h3>
            <p className="text-sm text-slate-500 mb-6">
              Green = under budget, Red = over budget
            </p>
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={filteredData.varianceData}
                  layout="vertical"
                  margin={{ left: 10, right: 30, top: 10, bottom: 10 }}
                >
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={90}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fontWeight: 600, fill: "#94a3b8" }}
                  />
                  <RechartsTooltip
                    cursor={{ fill: "transparent" }}
                    contentStyle={{
                      borderRadius: "16px",
                      border: "none",
                      background: "rgba(255,255,255,0.95)",
                      boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
                    }}
                    formatter={(val: number) => [
                      formatAmount(Math.abs(val)),
                      val >= 0 ? "Under Budget" : "Over Budget",
                    ]}
                  />
                  <ReferenceLine x={0} stroke="#94a3b8" strokeDasharray="3 3" />
                  <Bar dataKey="variance" radius={[0, 6, 6, 0]} barSize={18}>
                    {filteredData.varianceData.map((entry, index) => (
                      <Cell key={`var-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Budget Compliance Rate */}
        <div className="p-6 md:p-8 bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-slate-200 dark:border-white/5 shadow-sm flex flex-col">
          <h3 className="text-xl font-bold mb-2">Budget Compliance</h3>
          <p className="text-sm text-slate-500 mb-6">
            How closely are you following your budget?
          </p>
          {filteredData.budgetVsActualData.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-slate-400">
              No budgets set yet
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center space-y-6">
              {/* Compliance Ring */}
              <div className="relative w-44 h-44">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                  <circle
                    cx="60"
                    cy="60"
                    r="52"
                    fill="none"
                    stroke="currentColor"
                    className="text-slate-100 dark:text-white/5"
                    strokeWidth="10"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r="52"
                    fill="none"
                    stroke={
                      filteredData.complianceRate >= 80
                        ? "#10b981"
                        : filteredData.complianceRate >= 50
                          ? "#f59e0b"
                          : "#f43f5e"
                    }
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={`${(filteredData.complianceRate / 100) * 326.7} 326.7`}
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold text-slate-900 dark:text-white">
                    {filteredData.complianceRate}%
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    Compliance
                  </span>
                </div>
              </div>
              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 w-full">
                <div className="text-center p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl">
                  <p className="text-2xl font-bold text-emerald-600">
                    {filteredData.budgetsOnTrack}
                  </p>
                  <p className="text-xs text-emerald-600/70 font-medium">
                    On Track
                  </p>
                </div>
                <div className="text-center p-3 bg-rose-50 dark:bg-rose-500/10 rounded-2xl">
                  <p className="text-2xl font-bold text-rose-600">
                    {filteredData.budgetsOverspent}
                  </p>
                  <p className="text-xs text-rose-600/70 font-medium">
                    Overspent
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Top Categories & Recurring Expenses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Categories Horizontal Bar */}
        <div className="p-6 md:p-8 bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-slate-200 dark:border-white/5 shadow-sm">
          <h3 className="text-xl font-bold mb-2">Top Expense Categories</h3>
          <p className="text-sm text-slate-500 mb-6">
            Where does your money go?
          </p>
          <div className="h-[280px] w-full">
            {filteredData.topCategoriesData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-slate-400">
                No expenses in this period
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={filteredData.topCategoriesData}
                  layout="vertical"
                  margin={{ left: 10, right: 30, top: 10, bottom: 10 }}
                >
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={90}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fontWeight: 600, fill: "#94a3b8" }}
                  />
                  <RechartsTooltip
                    cursor={{ fill: "transparent" }}
                    contentStyle={{
                      borderRadius: "16px",
                      border: "none",
                      background: "rgba(255,255,255,0.95)",
                      boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
                    }}
                    formatter={(val: number) => [formatAmount(val), "Amount"]}
                  />
                  <Bar dataKey="amount" radius={[0, 10, 10, 0]} barSize={20}>
                    {filteredData.topCategoriesData.map((entry, index) => (
                      <Cell key={`top-${index}`} fill={entry.color} />
                    ))}
                    <LabelList
                      dataKey="amount"
                      position="right"
                      content={(props: any) => {
                        const { x, y, width, value } = props;
                        return (
                          <text
                            x={x + width + 8}
                            y={y + 10}
                            fill="#94a3b8"
                            fontSize={10}
                            fontWeight="bold"
                            textAnchor="start"
                          >
                            {formatAmount(value || 0)}
                          </text>
                        );
                      }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Recurring Expenses */}
        <div className="p-6 md:p-8 bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-slate-200 dark:border-white/5 shadow-sm flex flex-col">
          <h3 className="text-xl font-bold mb-2">Recurring Expenses</h3>
          <p className="text-sm text-slate-500 mb-4">
            Monthly subscriptions & regular bills
          </p>
          {filteredData.recurringData.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-3">
              <div className="w-16 h-16 bg-slate-50 dark:bg-black/40 rounded-full flex items-center justify-center text-slate-300">
                <CalendarDays size={32} />
              </div>
              <p className="text-slate-500 font-medium">
                No active recurring expenses
              </p>
            </div>
          ) : (
            <div className="flex flex-col flex-1">
              {/* Total Monthly Impact */}
              <div className="p-4 bg-gradient-to-r from-rose-50 to-rose-100 dark:from-rose-500/10 dark:to-rose-500/5 rounded-2xl mb-4">
                <p className="text-xs text-rose-600/70 font-medium uppercase tracking-wider mb-1">
                  Monthly Recurring Total
                </p>
                <p className="text-2xl font-bold text-rose-600">
                  {formatAmount(filteredData.totalMonthlyRecurring)}
                </p>
                <p className="text-xs text-rose-500/60 mt-1">
                  {filteredData.income > 0
                    ? `${((filteredData.totalMonthlyRecurring / filteredData.income) * 100).toFixed(1)}% of income`
                    : ""}
                </p>
              </div>
              {/* Individual Items */}
              <div className="space-y-3 overflow-y-auto max-h-[200px] no-scrollbar">
                {filteredData.recurringData.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-black/20 rounded-2xl"
                  >
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-300 truncate">
                        {item.name}
                      </p>
                      <p className="text-[11px] text-slate-400 font-medium capitalize">
                        {item.frequency}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-white">
                        {formatAmount(item.monthlyAmount)}
                      </p>
                      <p className="text-[10px] text-slate-400">/month</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Wallet Balance Distribution */}
      {filteredData.walletBalanceData.length > 0 && (
        <div className="p-6 md:p-8 bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-slate-200 dark:border-white/5 shadow-sm">
          <h3 className="text-xl font-bold mb-2">
            Wallet Balance Distribution
          </h3>
          <p className="text-sm text-slate-500 mb-6">
            How are your funds spread across wallets?
          </p>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={filteredData.walletBalanceData}
                margin={{ top: 10, right: 30, left: 10, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#e2e8f0"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fontWeight: 600, fill: "#94a3b8" }}
                />
                <YAxis hide />
                <RechartsTooltip
                  cursor={{ fill: "transparent" }}
                  contentStyle={{
                    borderRadius: "16px",
                    border: "none",
                    background: "rgba(255,255,255,0.95)",
                    boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
                  }}
                  formatter={(val: number) => [formatAmount(val), "Balance"]}
                />
                <Bar dataKey="value" radius={[10, 10, 0, 0]} barSize={40}>
                  {filteredData.walletBalanceData.map((entry, index) => (
                    <Cell key={`wb-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Smart Insights */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold px-1">Smart Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredData.insights.length === 0 ? (
            <div className="col-span-full p-8 bg-slate-50 dark:bg-black/20 rounded-[2rem] text-center">
              <p className="text-slate-500 font-medium">
                No significant insights for this period yet.
              </p>
            </div>
          ) : (
            filteredData.insights.map((insight, idx) => (
              <div
                key={idx}
                className="p-5 bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200 dark:border-white/5 shadow-sm flex items-start gap-4 hover:border-brand-500 transition-colors group"
              >
                <div
                  className={cn(
                    "p-3 rounded-2xl shrink-0 transition-transform group-hover:scale-110",
                    insight.type === "up"
                      ? "bg-rose-50 dark:bg-rose-500/10 text-rose-600"
                      : insight.type === "down"
                        ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600"
                        : "bg-slate-50 dark:bg-slate-500/10 text-slate-600",
                  )}
                >
                  <insight.icon size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white mb-0.5">
                    {insight.title}
                  </h4>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed">
                    {insight.desc}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Budgets & Goals Overlay */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Budgets */}
        <div className="p-6 md:p-8 bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-slate-200 dark:border-white/5 shadow-sm">
          <h3 className="text-xl font-bold mb-6 flex items-center justify-between">
            <span>Budget Status</span>
            <span className="text-xs font-medium text-slate-400">
              Current Period
            </span>
          </h3>
          {filteredData.budgetProgress.length === 0 ? (
            <p className="text-center text-slate-500 py-8">
              No budgets set yet.
            </p>
          ) : (
            <div className="space-y-6">
              {filteredData.budgetProgress.slice(0, 4).map((budget) => (
                <div key={budget.id} className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      {budget.name}
                    </span>
                    <span className="font-medium text-slate-500">
                      {formatAmount(budget.spent)} /{" "}
                      {formatAmount(budget.amount)}
                    </span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        budget.status === "red"
                          ? "bg-rose-500"
                          : budget.status === "amber"
                            ? "bg-amber-500"
                            : "bg-emerald-500",
                      )}
                      style={{ width: `${Math.min(budget.percent, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Goals */}
        <div className="p-6 md:p-8 bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-slate-200 dark:border-white/5 shadow-sm">
          <h3 className="text-xl font-bold mb-6 flex items-center justify-between">
            <span>Savings Goals</span>
            <span className="text-xs font-medium text-slate-400">
              Overall Progress
            </span>
          </h3>
          {filteredData.goalData.length === 0 ? (
            <p className="text-center text-slate-500 py-8">No goals set yet.</p>
          ) : (
            <div className="space-y-6">
              {filteredData.goalData.slice(0, 4).map((goal) => (
                <div key={goal.id} className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      {goal.name}
                    </span>
                    <span className="font-medium text-slate-500">
                      {formatAmount(goal.currentBalance)} /{" "}
                      {formatAmount(goal.targetAmount)}
                    </span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(goal.percent, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Analytics Content will go here */}
    </div>
  );
};

export default Analytics;
