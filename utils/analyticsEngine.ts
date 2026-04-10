import {
  Transaction,
  Category,
  Budget,
  Goal,
  Wallet,
  RecurringTransaction,
  SpendingNature,
} from "../types";
import { SPENDING_NATURE_MAP } from "../constants";

// ── Helpers ──────────────────────────────────────────────────────────

/** Get the effective spending nature: explicit field > category mapping > "want" fallback */
export const getEffectiveNature = (
  tx: Transaction,
  _categories?: Category[],
): SpendingNature => {
  if (tx.spendingNature) return tx.spendingNature;
  return SPENDING_NATURE_MAP[tx.categoryId] || "want";
};

/** Filter out internal transfers (wallet↔wallet, goal transfers) */
export const excludeTransfers = (txs: Transaction[]): Transaction[] =>
  txs.filter((t) => t.type !== "transfer");

// ── Financial Health Score ───────────────────────────────────────────

export interface HealthScoreBreakdown {
  total: number;
  savingsRate: number;
  budgetCompliance: number;
  spendingStability: number;
  goalProgress: number;
  expenseRatio: number;
  label: "Poor" | "Fair" | "Good" | "Excellent";
}

export const computeFinancialHealthScore = (
  transactions: Transaction[],
  budgets: Budget[],
  goals: Goal[],
  categories: Category[],
): HealthScoreBreakdown => {
  const real = excludeTransfers(transactions);
  const income = real
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);
  const expense = real
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);

  // 1. Savings Rate (30 pts)
  const savingsRatePct = income > 0 ? ((income - expense) / income) * 100 : 0;
  const savingsRate = Math.min(30, Math.round((savingsRatePct / 50) * 30));

  // 2. Budget Compliance (25 pts)
  const compliance = computeBudgetComplianceScore(
    transactions,
    budgets,
    categories,
  );
  const budgetCompliance = Math.min(25, Math.round((compliance / 100) * 25));

  // 3. Spending Stability (15 pts) — lower variance is better
  const dailyTotals = computeDailyExpenseTotals(real);
  const values = Object.values(dailyTotals);
  const mean =
    values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  const variance =
    values.length > 0
      ? values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length
      : 0;
  const cv = mean > 0 ? Math.sqrt(variance) / mean : 0;
  const spendingStability = Math.min(
    15,
    Math.round(Math.max(0, (1 - cv) * 15)),
  );

  // 4. Savings Goal Progress (15 pts)
  const activeGoals = goals.filter((g) => g.status === "active");
  const goalPct =
    activeGoals.length > 0
      ? activeGoals.reduce(
          (sum, g) =>
            sum + Math.min(1, g.currentBalance / Math.max(1, g.targetAmount)),
          0,
        ) / activeGoals.length
      : 0.5;
  const goalProgress = Math.min(15, Math.round(goalPct * 15));

  // 5. Expense Ratio (15 pts) — lower is better
  const expenseRatioPct = income > 0 ? (expense / income) * 100 : 100;
  const expenseRatio = Math.min(
    15,
    Math.round(Math.max(0, 1 - expenseRatioPct / 100) * 15),
  );

  const total =
    savingsRate +
    budgetCompliance +
    spendingStability +
    goalProgress +
    expenseRatio;

  const label: HealthScoreBreakdown["label"] =
    total >= 80
      ? "Excellent"
      : total >= 60
        ? "Good"
        : total >= 40
          ? "Fair"
          : "Poor";

  return {
    total,
    savingsRate,
    budgetCompliance,
    spendingStability,
    goalProgress,
    expenseRatio,
    label,
  };
};

// ── Budget Compliance ────────────────────────────────────────────────

export interface BudgetComplianceItem {
  budgetId: string;
  name: string;
  limit: number;
  spent: number;
  percentage: number;
  color: string;
  categoryName: string;
  categoryId: string;
}

const computeBudgetComplianceScore = (
  transactions: Transaction[],
  budgets: Budget[],
  categories: Category[],
): number => {
  if (budgets.length === 0) return 75; // No budgets = neutral score
  const items = computeBudgetCompliance(transactions, budgets, categories);
  const compliant = items.filter((i) => i.percentage <= 100).length;
  return (compliant / items.length) * 100;
};

export const computeBudgetCompliance = (
  transactions: Transaction[],
  budgets: Budget[],
  categories: Category[],
): BudgetComplianceItem[] => {
  const now = new Date();

  return budgets.map((b) => {
    const cat = categories.find((c) => c.id === b.categoryId);
    const periodTxs = transactions.filter((t) => {
      if (t.type !== "expense" || t.categoryId !== b.categoryId) return false;
      if (b.walletId && t.fromWalletId !== b.walletId) return false;
      const d = new Date(t.date);
      if (b.period === "monthly") {
        return (
          d.getMonth() === now.getMonth() &&
          d.getFullYear() === now.getFullYear()
        );
      }
      if (b.period === "weekly") {
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(now.getFullYear(), now.getMonth(), diff);
        monday.setHours(0, 0, 0, 0);
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        sunday.setHours(23, 59, 59, 999);
        return d >= monday && d <= sunday;
      }
      if (b.period === "custom" && b.customStartDate && b.customEndDate) {
        return (
          d >= new Date(b.customStartDate) && d <= new Date(b.customEndDate)
        );
      }
      return false;
    });

    const spent = periodTxs.reduce((s, t) => s + t.amount, 0);
    return {
      budgetId: b.id,
      name: b.name,
      limit: b.amount,
      spent,
      percentage: b.amount > 0 ? Math.round((spent / b.amount) * 100) : 0,
      color: b.color || cat?.color || "#64748b",
      categoryName: cat?.name || "Unknown",
      categoryId: b.categoryId,
    };
  });
};

// ── Spending Nature Breakdown ────────────────────────────────────────

export interface NatureBreakdown {
  must: number;
  need: number;
  want: number;
  total: number;
  mustPct: number;
  needPct: number;
  wantPct: number;
}

export const computeSpendingNatureBreakdown = (
  transactions: Transaction[],
  categories: Category[],
): NatureBreakdown => {
  const expenses = transactions.filter((t) => t.type === "expense");
  let must = 0,
    need = 0,
    want = 0;

  expenses.forEach((t) => {
    const nature = getEffectiveNature(t, categories);
    if (nature === "must") must += t.amount;
    else if (nature === "need") need += t.amount;
    else want += t.amount;
  });

  const total = must + need + want;
  return {
    must,
    need,
    want,
    total,
    mustPct: total > 0 ? Math.round((must / total) * 100) : 0,
    needPct: total > 0 ? Math.round((need / total) * 100) : 0,
    wantPct: total > 0 ? Math.round((want / total) * 100) : 0,
  };
};

// ── Heatmap Data ─────────────────────────────────────────────────────

export interface HeatmapDay {
  date: string; // YYYY-MM-DD
  amount: number;
  count: number;
  dayOfMonth: number;
  dayOfWeek: number;
}

export const computeHeatmapData = (
  transactions: Transaction[],
  year: number,
  month: number,
): HeatmapDay[] => {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const map: Record<string, { amount: number; count: number }> = {};

  transactions
    .filter((t) => t.type === "expense")
    .forEach((t) => {
      const d = new Date(t.date);
      if (d.getMonth() === month && d.getFullYear() === year) {
        const key = d.toISOString().slice(0, 10);
        if (!map[key]) map[key] = { amount: 0, count: 0 };
        map[key].amount += t.amount;
        map[key].count += 1;
      }
    });

  const result: HeatmapDay[] = [];
  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, month, day);
    const key = d.toISOString().slice(0, 10);
    const entry = map[key] || { amount: 0, count: 0 };
    result.push({
      date: key,
      amount: entry.amount,
      count: entry.count,
      dayOfMonth: day,
      dayOfWeek: d.getDay(),
    });
  }
  return result;
};

// ── No-Spend Streak ──────────────────────────────────────────────────

export const computeNoSpendStreak = (
  transactions: Transaction[],
  year: number,
  month: number,
): { current: number; longest: number; noSpendDays: number } => {
  const heatmap = computeHeatmapData(transactions, year, month);
  const today = new Date();
  const currentDay =
    today.getMonth() === month && today.getFullYear() === year
      ? today.getDate()
      : heatmap.length;

  let longest = 0;
  let current = 0;
  let noSpendDays = 0;

  for (let i = 0; i < currentDay; i++) {
    if (heatmap[i].amount === 0) {
      current++;
      noSpendDays++;
      if (current > longest) longest = current;
    } else {
      current = 0;
    }
  }

  return { current, longest, noSpendDays };
};

// ── Daily Expense Totals ─────────────────────────────────────────────

const computeDailyExpenseTotals = (
  transactions: Transaction[],
): Record<string, number> => {
  const map: Record<string, number> = {};
  transactions
    .filter((t) => t.type === "expense")
    .forEach((t) => {
      const key = new Date(t.date).toISOString().slice(0, 10);
      map[key] = (map[key] || 0) + t.amount;
    });
  return map;
};

// ── Safe Daily Spend ─────────────────────────────────────────────────

export const computeSafeDailySpend = (
  transactions: Transaction[],
  wallets: Wallet[],
): { safeDailySpend: number; dailyAverage: number; remainingDays: number } => {
  const now = new Date();
  const daysInMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
  ).getDate();
  const daysPassed = now.getDate();
  const remainingDays = daysInMonth - daysPassed;

  const totalBalance = wallets
    .filter((w) => !w.archived && !w.isGoalWallet)
    .reduce((s, w) => s + w.balance, 0);

  const monthlyExpenses = transactions.filter((t) => {
    if (t.type !== "expense") return false;
    const d = new Date(t.date);
    return (
      d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    );
  });

  const totalSpent = monthlyExpenses.reduce((s, t) => s + t.amount, 0);
  const dailyAverage = daysPassed > 0 ? totalSpent / daysPassed : 0;
  const safeDailySpend = remainingDays > 0 ? totalBalance / remainingDays : 0;

  return {
    safeDailySpend: Math.max(0, Math.round(safeDailySpend * 100) / 100),
    dailyAverage: Math.round(dailyAverage * 100) / 100,
    remainingDays,
  };
};

// ── Small Purchase Leak ──────────────────────────────────────────────

export const computeSmallPurchaseLeak = (
  transactions: Transaction[],
  threshold: number = 200,
): { total: number; count: number; percentage: number } => {
  const expenses = transactions.filter((t) => t.type === "expense");
  const small = expenses.filter((t) => t.amount <= threshold);
  const totalExpense = expenses.reduce((s, t) => s + t.amount, 0);
  const smallTotal = small.reduce((s, t) => s + t.amount, 0);

  return {
    total: smallTotal,
    count: small.length,
    percentage:
      totalExpense > 0 ? Math.round((smallTotal / totalExpense) * 100) : 0,
  };
};

// ── Expenses by Day of Week ──────────────────────────────────────────

export const computeExpensesByDayOfWeek = (
  transactions: Transaction[],
): { day: string; total: number; short: string }[] => {
  const dayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const shortNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const totals = [0, 0, 0, 0, 0, 0, 0];

  transactions
    .filter((t) => t.type === "expense")
    .forEach((t) => {
      const d = new Date(t.date);
      totals[d.getDay()] += t.amount;
    });

  return dayNames.map((day, i) => ({
    day,
    short: shortNames[i],
    total: Math.round(totals[i] * 100) / 100,
  }));
};

// ── Spending Personality ─────────────────────────────────────────────

export interface SpendingPersonalityResult {
  type: string;
  emoji: string;
  description: string;
}

export const computeSpendingPersonality = (
  transactions: Transaction[],
  categories: Category[],
  budgets: Budget[],
): SpendingPersonalityResult => {
  const real = excludeTransfers(transactions);
  const income = real
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);
  const expense = real
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);
  const savingsRate = income > 0 ? ((income - expense) / income) * 100 : 0;

  // Weekend vs weekday
  const weekendSpend = real
    .filter((t) => {
      const d = new Date(t.date).getDay();
      return t.type === "expense" && (d === 0 || d === 6);
    })
    .reduce((s, t) => s + t.amount, 0);
  const weekdaySpend = expense - weekendSpend;
  const weekendRatio = expense > 0 ? weekendSpend / expense : 0;

  // Small purchase ratio
  const smallTxs = real.filter((t) => t.type === "expense" && t.amount <= 200);
  const smallRatio =
    real.filter((t) => t.type === "expense").length > 0
      ? smallTxs.length / real.filter((t) => t.type === "expense").length
      : 0;

  // Nature breakdown
  const nature = computeSpendingNatureBreakdown(real, categories);

  // Decision
  if (savingsRate >= 30) {
    return {
      type: "The Saver",
      emoji: "💰",
      description:
        "You save more than 30% of your income. Impressive financial discipline!",
    };
  }
  if (weekendRatio > 0.45) {
    return {
      type: "The Weekend Spender",
      emoji: "🎉",
      description:
        "Your spending spikes on weekends. Consider setting weekend budgets.",
    };
  }
  if (smallRatio > 0.6) {
    return {
      type: "The Impulse Buyer",
      emoji: "⚡",
      description:
        "A large percentage of your transactions are small purchases. These add up!",
    };
  }
  if (nature.mustPct + nature.needPct >= 75) {
    return {
      type: "The Planner",
      emoji: "📋",
      description:
        "Most of your spending is on essentials. You're thoughtful about money.",
    };
  }
  if (savingsRate >= 15) {
    return {
      type: "The Balanced Spender",
      emoji: "⚖️",
      description:
        "You balance enjoying life with saving. A healthy approach to money.",
    };
  }
  return {
    type: "The Explorer",
    emoji: "🧭",
    description:
      "You're discovering your spending patterns. Track consistently to unlock insights.",
  };
};

// ── Smart Insights ───────────────────────────────────────────────────

export const generateSmartInsights = (
  transactions: Transaction[],
  categories: Category[],
  budgets: Budget[],
  wallets: Wallet[],
): string[] => {
  const insights: string[] = [];
  const real = excludeTransfers(transactions);
  const expenses = real.filter((t) => t.type === "expense");
  const income = real
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);
  const totalExp = expenses.reduce((s, t) => s + t.amount, 0);

  if (expenses.length === 0)
    return ["No transactions yet. Start adding expenses to see insights."];

  // 1. Highest spending day
  const dayTotals = computeExpensesByDayOfWeek(real);
  const maxDay = dayTotals.reduce((a, b) => (a.total > b.total ? a : b));
  if (maxDay.total > 0) {
    insights.push(`You spend the most on ${maxDay.day}s.`);
  }

  // 2. Category trend
  const now = new Date();
  const thisMonth = expenses.filter((t) => {
    const d = new Date(t.date);
    return (
      d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    );
  });
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonth = expenses.filter((t) => {
    const d = new Date(t.date);
    return (
      d.getMonth() === lastMonthDate.getMonth() &&
      d.getFullYear() === lastMonthDate.getFullYear()
    );
  });

  // Category spending comparison
  const catTotals: Record<string, number> = {};
  thisMonth.forEach((t) => {
    catTotals[t.categoryId] = (catTotals[t.categoryId] || 0) + t.amount;
  });
  const lastCatTotals: Record<string, number> = {};
  lastMonth.forEach((t) => {
    lastCatTotals[t.categoryId] = (lastCatTotals[t.categoryId] || 0) + t.amount;
  });

  Object.keys(catTotals).forEach((catId) => {
    const last = lastCatTotals[catId] || 0;
    const curr = catTotals[catId];
    if (last > 0) {
      const change = Math.round(((curr - last) / last) * 100);
      if (Math.abs(change) >= 15) {
        const cat = categories.find((c) => c.id === catId);
        if (cat) {
          insights.push(
            `${cat.name} spending ${change > 0 ? "increased" : "decreased"} ${Math.abs(change)}% this month.`,
          );
        }
      }
    }
  });

  // 3. Budget usage vs month progress
  if (budgets.length > 0) {
    const dayOfMonth = now.getDate();
    const daysInMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
    ).getDate();
    const monthProgressPct = Math.round((dayOfMonth / daysInMonth) * 100);

    budgets.forEach((b) => {
      const bCat = categories.find((c) => c.id === b.categoryId);
      const spent = thisMonth
        .filter((t) => t.categoryId === b.categoryId)
        .reduce((s, t) => s + t.amount, 0);
      const usagePct = b.amount > 0 ? Math.round((spent / b.amount) * 100) : 0;
      if (usagePct > monthProgressPct + 15 && bCat) {
        insights.push(
          `You've used ${usagePct}% of your ${bCat.name} budget but only ${monthProgressPct}% of the month has passed.`,
        );
      }
    });
  }

  // 4. No-spend days
  const noSpend = computeNoSpendStreak(real, now.getFullYear(), now.getMonth());
  if (noSpend.noSpendDays > 0) {
    insights.push(
      `You had ${noSpend.noSpendDays} no-spend day${noSpend.noSpendDays > 1 ? "s" : ""} this month.`,
    );
  }

  // 5. Savings rate comparison
  if (income > 0) {
    const savingsRate = Math.round(((income - totalExp) / income) * 100);
    if (savingsRate >= 20) {
      insights.push(`Your savings rate is ${savingsRate}% — great job!`);
    } else if (savingsRate < 10 && savingsRate >= 0) {
      insights.push(
        `Your savings rate is only ${savingsRate}%. Try to cut discretionary spending.`,
      );
    }
  }

  return insights.slice(0, 6); // Cap at 6 insights
};

// ── Category Trend (MoM) ─────────────────────────────────────────────

export interface CategoryTrendItem {
  categoryId: string;
  name: string;
  color: string;
  lastMonth: number;
  thisMonth: number;
  changePct: number;
}

export const computeCategoryTrend = (
  transactions: Transaction[],
  categories: Category[],
): CategoryTrendItem[] => {
  const now = new Date();
  const expenses = transactions.filter((t) => t.type === "expense");

  const thisMonth = expenses.filter((t) => {
    const d = new Date(t.date);
    return (
      d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    );
  });
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonth = expenses.filter((t) => {
    const d = new Date(t.date);
    return (
      d.getMonth() === lastMonthDate.getMonth() &&
      d.getFullYear() === lastMonthDate.getFullYear()
    );
  });

  const thisMonthMap: Record<string, number> = {};
  thisMonth.forEach((t) => {
    thisMonthMap[t.categoryId] = (thisMonthMap[t.categoryId] || 0) + t.amount;
  });

  const lastMonthMap: Record<string, number> = {};
  lastMonth.forEach((t) => {
    lastMonthMap[t.categoryId] = (lastMonthMap[t.categoryId] || 0) + t.amount;
  });

  const allCatIds = new Set([
    ...Object.keys(thisMonthMap),
    ...Object.keys(lastMonthMap),
  ]);

  return Array.from(allCatIds)
    .map((catId) => {
      const cat = categories.find((c) => c.id === catId);
      const curr = thisMonthMap[catId] || 0;
      const prev = lastMonthMap[catId] || 0;
      const changePct =
        prev > 0
          ? Math.round(((curr - prev) / prev) * 100)
          : curr > 0
            ? 100
            : 0;
      return {
        categoryId: catId,
        name: cat?.name || "Unknown",
        color: cat?.color || "#64748b",
        lastMonth: prev,
        thisMonth: curr,
        changePct,
      };
    })
    .filter((c) => c.thisMonth > 0 || c.lastMonth > 0)
    .sort((a, b) => b.thisMonth - a.thisMonth)
    .slice(0, 8);
};

// ── Expenses Over Time (daily aggregated) ────────────────────────────

export interface DailyExpensePoint {
  date: string;
  amount: number;
  label: string;
}

export const computeExpensesOverTime = (
  transactions: Transaction[],
): DailyExpensePoint[] => {
  const map: Record<string, number> = {};
  transactions
    .filter((t) => t.type === "expense")
    .forEach((t) => {
      const key = new Date(t.date).toISOString().slice(0, 10);
      map[key] = (map[key] || 0) + t.amount;
    });

  const sorted = Object.keys(map).sort();
  return sorted.map((date) => ({
    date,
    amount: Math.round(map[date] * 100) / 100,
    label: new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
  }));
};

// ── Income vs Expense Over Time ──────────────────────────────────────

export interface IncomeExpensePoint {
  date: string;
  income: number;
  expense: number;
  label: string;
}

export const computeIncomeVsExpense = (
  transactions: Transaction[],
): IncomeExpensePoint[] => {
  const map: Record<string, { income: number; expense: number }> = {};
  excludeTransfers(transactions).forEach((t) => {
    const key = new Date(t.date).toISOString().slice(0, 10);
    if (!map[key]) map[key] = { income: 0, expense: 0 };
    if (t.type === "income") map[key].income += t.amount;
    if (t.type === "expense") map[key].expense += t.amount;
  });

  const sorted = Object.keys(map).sort();
  return sorted.map((date) => ({
    date,
    income: Math.round(map[date].income * 100) / 100,
    expense: Math.round(map[date].expense * 100) / 100,
    label: new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
  }));
};

// ── Category Distribution (for donut chart) ──────────────────────────

export interface CategorySlice {
  id: string;
  name: string;
  value: number;
  color: string;
  percentage: number;
}

export const computeCategoryDistribution = (
  transactions: Transaction[],
  categories: Category[],
): CategorySlice[] => {
  const map: Record<string, number> = {};
  const expenses = transactions.filter((t) => t.type === "expense");
  expenses.forEach((t) => {
    map[t.categoryId] = (map[t.categoryId] || 0) + t.amount;
  });

  const total = expenses.reduce((s, t) => s + t.amount, 0);

  return Object.entries(map)
    .map(([catId, value]) => {
      const cat = categories.find((c) => c.id === catId);
      return {
        id: catId,
        name: cat?.name || "Unknown",
        value,
        color: cat?.color || "#64748b",
        percentage: total > 0 ? Math.round((value / total) * 100) : 0,
      };
    })
    .sort((a, b) => b.value - a.value);
};

// ── Subcategory Breakdown ────────────────────────────────────────────

export interface SubcategorySlice {
  id: string;
  name: string;
  value: number;
  color: string;
}

export const computeSubcategoryBreakdown = (
  transactions: Transaction[],
  categories: Category[],
  selectedCategoryId: string,
): SubcategorySlice[] => {
  const cat = categories.find((c) => c.id === selectedCategoryId);
  if (!cat || !cat.subCategories) return [];

  const map: Record<string, number> = {};
  transactions
    .filter(
      (t) =>
        t.type === "expense" &&
        t.categoryId === selectedCategoryId &&
        t.subCategoryId,
    )
    .forEach((t) => {
      map[t.subCategoryId!] = (map[t.subCategoryId!] || 0) + t.amount;
    });

  return cat.subCategories
    .map((sub) => ({
      id: sub.id,
      name: sub.name,
      value: map[sub.id] || 0,
      color: cat.color,
    }))
    .filter((s) => s.value > 0)
    .sort((a, b) => b.value - a.value);
};

// ── Wallet Distribution ──────────────────────────────────────────────

export const computeWalletDistribution = (
  wallets: Wallet[],
): { id: string; name: string; balance: number; color: string }[] => {
  return wallets
    .filter((w) => !w.archived && !w.isGoalWallet && w.balance > 0)
    .map((w) => ({
      id: w.id,
      name: w.name,
      balance: w.balance,
      color: w.color,
    }))
    .sort((a, b) => b.balance - a.balance);
};
