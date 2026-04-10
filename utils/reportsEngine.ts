/**
 * reportsEngine.ts
 * Centralized computation engine for the Reports page.
 * All functions are pure (no side effects) and designed to be wrapped in useMemo.
 */

import {
  Transaction,
  Category,
  Budget,
  Goal,
  Wallet,
} from "../types";

// ── Date Helpers ────────────────────────────────────────────────────

export interface MonthRange {
  year: number;
  month: number; // 0-indexed
  start: Date;
  end: Date;
  label: string; // e.g. "March 2026"
  prevStart: Date;
  prevEnd: Date;
  prevLabel: string;
}

export const computeMonthRange = (year: number, month: number): MonthRange => {
  const start = new Date(year, month, 1, 0, 0, 0, 0);
  const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
  const label = start.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const prevStart = new Date(year, month - 1, 1, 0, 0, 0, 0);
  const prevEnd = new Date(year, month, 0, 23, 59, 59, 999);
  const prevLabel = prevStart.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return { year, month, start, end, label, prevStart, prevEnd, prevLabel };
};

export const filterByDateRange = (
  txs: Transaction[],
  start: Date,
  end: Date,
): Transaction[] => {
  return txs.filter((t) => {
    if (!t.date) return false;
    const d = new Date(t.date);
    return d >= start && d <= end;
  });
};

export const filterByWallet = (
  txs: Transaction[],
  walletId: string,
): Transaction[] => {
  if (walletId === "all") return txs;
  return txs.filter(
    (t) => t.fromWalletId === walletId || t.toWalletId === walletId,
  );
};

// ── Exclude Transfers ───────────────────────────────────────────────

const excludeTransfers = (txs: Transaction[]): Transaction[] =>
  txs.filter((t) => t.type !== "transfer");

// ── Totals ──────────────────────────────────────────────────────────

interface Totals {
  income: number;
  expense: number;
  savings: number;
  savingsRate: number;
  expenseRatio: number;
}

const computeTotals = (txs: Transaction[]): Totals => {
  const real = excludeTransfers(txs);
  const income = real
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);
  const expense = real
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);
  const savings = income - expense;
  const savingsRate = income > 0 ? (savings / income) * 100 : 0;
  const expenseRatio = income > 0 ? (expense / income) * 100 : 100;
  return { income, expense, savings, savingsRate, expenseRatio };
};

// ── TAB 1: Performance ──────────────────────────────────────────────

export interface CategoryComparison {
  categoryId: string;
  name: string;
  icon: string;
  color: string;
  current: number;
  previous: number;
  change: number; // percentage
  changeAbs: number;
}

export interface PerformanceHighlight {
  label: string;
  category: string;
  amount: number;
  color: string;
  icon: string;
  type: "increase" | "decrease" | "highest";
}

export interface PerformanceData {
  categoryComparisons: CategoryComparison[];
  highlights: PerformanceHighlight[];
  currentTotals: Totals;
  previousTotals: Totals;
  savingsChange: number; // percentage
  efficiencyScore: number; // 0-100
}

export const computePerformanceData = (
  currentTxs: Transaction[],
  previousTxs: Transaction[],
  categories: Category[],
): PerformanceData => {
  const currentTotals = computeTotals(currentTxs);
  const previousTotals = computeTotals(previousTxs);

  // Category-level comparison
  const catMap: Record<string, { current: number; previous: number }> = {};

  excludeTransfers(currentTxs)
    .filter((t) => t.type === "expense")
    .forEach((t) => {
      if (!catMap[t.categoryId]) catMap[t.categoryId] = { current: 0, previous: 0 };
      catMap[t.categoryId].current += t.amount;
    });

  excludeTransfers(previousTxs)
    .filter((t) => t.type === "expense")
    .forEach((t) => {
      if (!catMap[t.categoryId]) catMap[t.categoryId] = { current: 0, previous: 0 };
      catMap[t.categoryId].previous += t.amount;
    });

  const categoryComparisons: CategoryComparison[] = Object.entries(catMap)
    .map(([catId, data]) => {
      const cat = categories.find((c) => c.id === catId);
      const change =
        data.previous > 0
          ? ((data.current - data.previous) / data.previous) * 100
          : data.current > 0
            ? 100
            : 0;
      return {
        categoryId: catId,
        name: cat?.name || "Unknown",
        icon: cat?.icon || "Circle",
        color: cat?.color || "#64748b",
        current: data.current,
        previous: data.previous,
        change: Number(change.toFixed(1)),
        changeAbs: data.current - data.previous,
      };
    })
    .filter((c) => c.current > 0 || c.previous > 0)
    .sort((a, b) => b.current - a.current);

  // Key highlights
  const highlights: PerformanceHighlight[] = [];

  const withChange = categoryComparisons.filter(
    (c) => c.previous > 0 && c.current > 0,
  );

  if (withChange.length > 0) {
    const biggestIncrease = withChange.reduce((max, c) =>
      c.change > max.change ? c : max,
    );
    if (biggestIncrease.change > 0) {
      highlights.push({
        label: "Biggest Increase",
        category: biggestIncrease.name,
        amount: biggestIncrease.changeAbs,
        color: biggestIncrease.color,
        icon: biggestIncrease.icon,
        type: "increase",
      });
    }

    const biggestDecrease = withChange.reduce((min, c) =>
      c.change < min.change ? c : min,
    );
    if (biggestDecrease.change < 0) {
      highlights.push({
        label: "Biggest Decrease",
        category: biggestDecrease.name,
        amount: Math.abs(biggestDecrease.changeAbs),
        color: biggestDecrease.color,
        icon: biggestDecrease.icon,
        type: "decrease",
      });
    }
  }

  if (categoryComparisons.length > 0) {
    const highest = categoryComparisons[0]; // Already sorted by current desc
    highlights.push({
      label: "Highest Spending",
      category: highest.name,
      amount: highest.current,
      color: highest.color,
      icon: highest.icon,
      type: "highest",
    });
  }

  // Savings change
  const savingsChange =
    previousTotals.savings !== 0
      ? ((currentTotals.savings - previousTotals.savings) /
          Math.abs(previousTotals.savings)) *
        100
      : currentTotals.savings > 0
        ? 100
        : 0;

  // Efficiency = (savings / income) x 100, capped at 100
  const efficiencyScore = Math.max(
    0,
    Math.min(100, currentTotals.savingsRate),
  );

  return {
    categoryComparisons,
    highlights,
    currentTotals,
    previousTotals,
    savingsChange: Number(savingsChange.toFixed(1)),
    efficiencyScore: Number(efficiencyScore.toFixed(1)),
  };
};

// ── TAB 2: Cash Flow ────────────────────────────────────────────────

export interface WaterfallStep {
  name: string;
  value: number;
  fill: string;
  isTotal?: boolean;
}

export interface IncomeSource {
  name: string;
  amount: number;
  color: string;
  percentage: number;
}

export interface ExpenseFlow {
  name: string;
  amount: number;
  color: string;
  percentage: number;
}

export interface CashFlowData {
  waterfall: WaterfallStep[];
  incomeSources: IncomeSource[];
  expenseFlows: ExpenseFlow[];
  totalInflow: number;
  totalOutflow: number;
  netFlow: number;
}

export const computeCashFlowData = (
  txs: Transaction[],
  categories: Category[],
  wallets: Wallet[],
): CashFlowData => {
  const real = excludeTransfers(txs);

  const totalInflow = real
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);
  const totalOutflow = real
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);
  const netFlow = totalInflow - totalOutflow;

  // Waterfall
  const totalBalance = wallets
    .filter((w) => !w.archived && !w.isGoalWallet)
    .reduce((s, w) => s + w.balance, 0);

  const waterfall: WaterfallStep[] = [
    { name: "Income", value: totalInflow, fill: "#10b981" },
    { name: "Expenses", value: -totalOutflow, fill: "#f43f5e" },
    { name: "Net Savings", value: netFlow, fill: netFlow >= 0 ? "#6366f1" : "#f97316" },
    {
      name: "Balance",
      value: totalBalance,
      fill: "#3b82f6",
      isTotal: true,
    },
  ];

  // Income sources by category
  const incomeMap: Record<string, number> = {};
  real
    .filter((t) => t.type === "income")
    .forEach((t) => {
      incomeMap[t.categoryId] = (incomeMap[t.categoryId] || 0) + t.amount;
    });

  const incomeSources: IncomeSource[] = Object.entries(incomeMap)
    .map(([catId, amount]) => {
      const cat = categories.find((c) => c.id === catId);
      return {
        name: cat?.name || "Other Income",
        amount,
        color: cat?.color || "#10b981",
        percentage: totalInflow > 0 ? (amount / totalInflow) * 100 : 0,
      };
    })
    .sort((a, b) => b.amount - a.amount);

  // Expense flows — by category
  const expenseMap: Record<string, number> = {};
  real
    .filter((t) => t.type === "expense")
    .forEach((t) => {
      expenseMap[t.categoryId] = (expenseMap[t.categoryId] || 0) + t.amount;
    });

  // Add goal transfers
  const goalTransfers = txs.filter((t) => {
    if (t.type !== "transfer") return false;
    const toWallet = wallets.find((w) => w.id === t.toWalletId);
    return toWallet?.isGoalWallet;
  });
  const goalTransferTotal = goalTransfers.reduce((s, t) => s + t.amount, 0);

  const expenseFlows: ExpenseFlow[] = Object.entries(expenseMap)
    .map(([catId, amount]) => {
      const cat = categories.find((c) => c.id === catId);
      return {
        name: cat?.name || "Unknown",
        amount,
        color: cat?.color || "#64748b",
        percentage: totalOutflow > 0 ? (amount / totalOutflow) * 100 : 0,
      };
    })
    .sort((a, b) => b.amount - a.amount);

  if (goalTransferTotal > 0) {
    expenseFlows.push({
      name: "Goal Savings",
      amount: goalTransferTotal,
      color: "#8b5cf6",
      percentage:
        totalOutflow > 0 ? (goalTransferTotal / totalOutflow) * 100 : 0,
    });
  }

  return {
    waterfall,
    incomeSources,
    expenseFlows,
    totalInflow,
    totalOutflow,
    netFlow,
  };
};

// ── TAB 3: Budget ───────────────────────────────────────────────────

export interface BudgetVsActual {
  budgetId: string;
  name: string;
  categoryName: string;
  budgeted: number;
  actual: number;
  remaining: number;
  percentage: number;
  status: "over" | "near" | "under";
  color: string;
}

export interface HeatmapDay {
  date: string;
  dayOfMonth: number;
  dayOfWeek: number;
  amount: number;
  safeSpend: number;
  isOver: boolean;
  intensity: number; // 0-4
}

export interface BudgetData {
  budgetVsActual: BudgetVsActual[];
  heatmap: HeatmapDay[];
  disciplineScore: number;
  disciplineLabel: string;
  categoriesWithinBudget: number;
  totalCategories: number;
  daysUnderSafeSpend: number;
  totalDays: number;
}

export const computeBudgetData = (
  txs: Transaction[],
  allTxs: Transaction[],
  budgets: Budget[],
  categories: Category[],
  wallets: Wallet[],
  range: MonthRange,
): BudgetData => {
  const expenses = excludeTransfers(txs).filter((t) => t.type === "expense");

  // Budget vs Actual
  const budgetVsActual: BudgetVsActual[] = budgets.map((b) => {
    const cat = categories.find((c) => c.id === b.categoryId);
    const actual = expenses
      .filter((t) => {
        if (t.categoryId !== b.categoryId) return false;
        if (b.subCategoryId && t.subCategoryId !== b.subCategoryId) return false;
        if (b.walletId && t.fromWalletId !== b.walletId) return false;
        return true;
      })
      .reduce((s, t) => s + t.amount, 0);

    const remaining = b.amount - actual;
    const percentage = b.amount > 0 ? (actual / b.amount) * 100 : 0;
    let status: "over" | "near" | "under" = "under";
    if (percentage >= 100) status = "over";
    else if (percentage >= 80) status = "near";

    return {
      budgetId: b.id,
      name: b.name,
      categoryName: cat?.name || "Unknown",
      budgeted: b.amount,
      actual,
      remaining,
      percentage: Number(percentage.toFixed(1)),
      status,
      color: b.color || cat?.color || "#64748b",
    };
  }).sort((a, b) => b.percentage - a.percentage);

  // Overspending Heatmap
  const daysInMonth = new Date(range.year, range.month + 1, 0).getDate();
  const totalBalance = wallets
    .filter((w) => !w.archived && !w.isGoalWallet)
    .reduce((s, w) => s + w.balance, 0);

  const now = new Date();
  const today =
    now.getMonth() === range.month && now.getFullYear() === range.year
      ? now.getDate()
      : daysInMonth;

  // Compute cumulative spending per day to get daily safe spend
  const remainingDays = Math.max(1, daysInMonth - today + 1);
  const safeSpend = Math.max(0, totalBalance / remainingDays);

  const dailySpending: Record<number, number> = {};
  expenses.forEach((t) => {
    const d = new Date(t.date);
    if (d.getMonth() === range.month && d.getFullYear() === range.year) {
      const day = d.getDate();
      dailySpending[day] = (dailySpending[day] || 0) + t.amount;
    }
  });

  // Find max daily spend for intensity scaling
  const maxDailySpend = Math.max(
    1,
    ...Object.values(dailySpending),
  );

  const heatmap: HeatmapDay[] = [];
  let daysUnderSafeSpend = 0;

  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(range.year, range.month, day);
    const amount = dailySpending[day] || 0;
    const isOver = amount > safeSpend;
    const intensity =
      amount === 0 ? 0 : Math.min(4, Math.ceil((amount / maxDailySpend) * 4));

    if (day <= today && !isOver) daysUnderSafeSpend++;

    heatmap.push({
      date: d.toISOString().slice(0, 10),
      dayOfMonth: day,
      dayOfWeek: d.getDay(),
      amount,
      safeSpend,
      isOver,
      intensity,
    });
  }

  // Discipline score
  const categoriesWithinBudget = budgetVsActual.filter(
    (b) => b.status !== "over",
  ).length;
  const totalCategories = budgetVsActual.length;

  let disciplineScore = -1;
  let disciplineLabel = "No Budgets Set";

  if (totalCategories > 0) {
    const budgetScore = (categoriesWithinBudget / totalCategories) * 50;
    const safeSpendScore = today > 0 ? (daysUnderSafeSpend / today) * 50 : 25;
    disciplineScore = Math.round(budgetScore + safeSpendScore);
    disciplineLabel =
      disciplineScore >= 80
        ? "Excellent"
        : disciplineScore >= 60
          ? "Good"
          : "Needs Attention";
  }

  return {
    budgetVsActual,
    heatmap,
    disciplineScore,
    disciplineLabel,
    categoriesWithinBudget,
    totalCategories,
    daysUnderSafeSpend,
    totalDays: today,
  };
};

// ── TAB 4: Forecast ─────────────────────────────────────────────────

export interface ProjectionPoint {
  month: string;
  value: number;
  isProjected: boolean;
}

export interface ForecastData {
  netWorthProjection: ProjectionPoint[];
  expenseProjection: ProjectionPoint[];
  savingsProjection: ProjectionPoint[];
  forecastSummary: string;
  hasEnoughData: boolean;
  monthlyAvgIncome: number;
  monthlyAvgExpense: number;
  monthlyAvgSavings: number;
}

export const computeForecastData = (
  allTxs: Transaction[],
  wallets: Wallet[],
  goals: Goal[],
): ForecastData => {
  const now = new Date();
  const real = excludeTransfers(allTxs);

  // Gather monthly data for the last 6 months
  const monthlyData: {
    label: string;
    income: number;
    expense: number;
    savings: number;
  }[] = [];

  for (let i = 5; i >= 0; i--) {
    const mDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const mEnd = new Date(mDate.getFullYear(), mDate.getMonth() + 1, 0, 23, 59, 59, 999);
    const label = mDate.toLocaleDateString("en-US", {
      month: "short",
      year: "2-digit",
    });

    const monthTxs = real.filter((t) => {
      const d = new Date(t.date);
      return d >= mDate && d <= mEnd;
    });

    const income = monthTxs
      .filter((t) => t.type === "income")
      .reduce((s, t) => s + t.amount, 0);
    const expense = monthTxs
      .filter((t) => t.type === "expense")
      .reduce((s, t) => s + t.amount, 0);

    monthlyData.push({ label, income, expense, savings: income - expense });
  }

  // Check if we have enough data (at least 2 months with transactions)
  const monthsWithData = monthlyData.filter(
    (m) => m.income > 0 || m.expense > 0,
  ).length;
  const hasEnoughData = monthsWithData >= 2;

  // Weighted moving average (recent months weight more)
  const weights = [1, 1.5, 2, 2.5, 3, 3.5];
  const totalWeight = monthlyData.reduce(
    (s, _, i) => s + (monthlyData[i].income > 0 || monthlyData[i].expense > 0 ? weights[i] : 0),
    0,
  ) || 1;

  const monthlyAvgIncome =
    monthlyData.reduce(
      (s, m, i) =>
        s + m.income * (m.income > 0 || m.expense > 0 ? weights[i] : 0),
      0,
    ) / totalWeight;
  const monthlyAvgExpense =
    monthlyData.reduce(
      (s, m, i) =>
        s + m.expense * (m.income > 0 || m.expense > 0 ? weights[i] : 0),
      0,
    ) / totalWeight;
  const monthlyAvgSavings = monthlyAvgIncome - monthlyAvgExpense;

  // Current net worth
  const totalBalance = wallets
    .filter((w) => !w.archived)
    .reduce((s, w) => s + w.balance, 0);

  // Build projection arrays (historical + 6 months forward)
  const netWorthProjection: ProjectionPoint[] = [];
  const expenseProjection: ProjectionPoint[] = [];
  const savingsProjection: ProjectionPoint[] = [];

  // Historical months
  let cumulativeSavings = 0;
  monthlyData.forEach((m) => {
    cumulativeSavings += m.savings;
    netWorthProjection.push({
      month: m.label,
      value: 0, // We'll fill this differently
      isProjected: false,
    });
    expenseProjection.push({
      month: m.label,
      value: Math.round(m.expense),
      isProjected: false,
    });
    savingsProjection.push({
      month: m.label,
      value: Math.round(m.savings),
      isProjected: false,
    });
  });

  // Estimate net worth history (approximate from current balance going backwards)
  let estimatedBalance = totalBalance;
  for (let i = monthlyData.length - 1; i >= 0; i--) {
    netWorthProjection[i].value = Math.round(estimatedBalance);
    estimatedBalance -= monthlyData[i].savings;
  }

  // Future projections (6 months)
  let projectedBalance = totalBalance;
  let projectedSavings = 0;

  for (let i = 1; i <= 6; i++) {
    const futureDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const label = futureDate.toLocaleDateString("en-US", {
      month: "short",
      year: "2-digit",
    });

    projectedBalance += monthlyAvgSavings;
    projectedSavings += monthlyAvgSavings;

    netWorthProjection.push({
      month: label,
      value: Math.round(projectedBalance),
      isProjected: true,
    });
    expenseProjection.push({
      month: label,
      value: Math.round(monthlyAvgExpense),
      isProjected: true,
    });
    savingsProjection.push({
      month: label,
      value: Math.round(monthlyAvgSavings),
      isProjected: true,
    });
  }

  // Goal-aware summary
  const activeGoals = goals.filter((g) => g.status === "active");
  const totalGoalTarget = activeGoals.reduce(
    (s, g) => s + g.targetAmount,
    0,
  );
  const totalGoalCurrent = activeGoals.reduce(
    (s, g) => s + g.currentBalance,
    0,
  );

  let forecastSummary = "";
  if (!hasEnoughData) {
    forecastSummary =
      "Not enough historical data for accurate projections. Keep tracking for at least 2 months to unlock forecasts.";
  } else if (monthlyAvgSavings > 0) {
    const projected6Mo =
      totalBalance + monthlyAvgSavings * 6;
    forecastSummary = `Based on your last ${monthsWithData} months, your net worth is projected to reach ${formatProjection(projected6Mo)} in 6 months, saving approximately ${formatProjection(monthlyAvgSavings)} per month.`;
  } else {
    forecastSummary = `Your expenses currently exceed income by ${formatProjection(Math.abs(monthlyAvgSavings))} per month. Consider reviewing your spending to build positive savings momentum.`;
  }

  return {
    netWorthProjection,
    expenseProjection,
    savingsProjection,
    forecastSummary,
    hasEnoughData,
    monthlyAvgIncome: Math.round(monthlyAvgIncome),
    monthlyAvgExpense: Math.round(monthlyAvgExpense),
    monthlyAvgSavings: Math.round(monthlyAvgSavings),
  };
};

const formatProjection = (amount: number): string => {
  if (Math.abs(amount) >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2)} Cr`;
  } else if (Math.abs(amount) >= 100000) {
    return `₹${(amount / 100000).toFixed(2)} L`;
  } else if (Math.abs(amount) >= 1000) {
    return `₹${(amount / 1000).toFixed(1)}K`;
  }
  return `₹${Math.round(amount)}`;
};

// ── AI Smart Summary ────────────────────────────────────────────────

export interface SmartInsight {
  text: string;
  type: "positive" | "negative" | "neutral";
  icon: "trending-up" | "trending-down" | "info" | "alert" | "piggy-bank";
}

export const computeSmartSummary = (
  performance: PerformanceData,
  cashFlow: CashFlowData,
): SmartInsight[] => {
  const insights: SmartInsight[] = [];

  // 1. Spending comparison
  if (performance.previousTotals.expense > 0) {
    const diff =
      ((performance.currentTotals.expense - performance.previousTotals.expense) /
        performance.previousTotals.expense) *
      100;
    if (Math.abs(diff) > 3) {
      insights.push({
        text: `You spent ${Math.abs(diff).toFixed(0)}% ${diff > 0 ? "more" : "less"} than last month.`,
        type: diff > 0 ? "negative" : "positive",
        icon: diff > 0 ? "trending-up" : "trending-down",
      });
    }
  }

  // 2. Highest change category
  if (performance.highlights.length > 0) {
    const increase = performance.highlights.find(
      (h) => h.type === "increase",
    );
    if (increase) {
      insights.push({
        text: `Your highest increase was in ${increase.category}.`,
        type: "negative",
        icon: "alert",
      });
    }
  }

  // 3. Savings rate
  if (performance.currentTotals.income > 0) {
    const rate = performance.currentTotals.savingsRate;
    if (rate > 0) {
      insights.push({
        text: `You saved ${rate.toFixed(0)}% of your income.`,
        type: rate >= 20 ? "positive" : "neutral",
        icon: "piggy-bank",
      });
    } else {
      insights.push({
        text: `Your expenses exceeded your income this month.`,
        type: "negative",
        icon: "alert",
      });
    }
  }

  // 4. Net flow
  if (cashFlow.netFlow > 0 && insights.length < 3) {
    insights.push({
      text: `Positive cash flow this month — great control!`,
      type: "positive",
      icon: "info",
    });
  }

  return insights.slice(0, 3);
};
