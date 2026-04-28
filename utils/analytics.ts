import { Transaction, Category, TimeRange } from "../types";

export const filterTransactionsByRange = (
  transactions: Transaction[],
  range: TimeRange,
  customStart?: string,
  customEnd?: string,
) => {
  const now = new Date();
  let start = new Date();
  let end = new Date();
  
  // Reset times for consistent comparison
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  switch (range) {
    case "this_month":
      start.setDate(1);
      break;
    case "last_month":
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      break;
    case "last_30_days":
      start = new Date(now);
      start.setDate(now.getDate() - 30);
      break;
    case "last_3_months":
      start.setMonth(now.getMonth() - 3);
      start.setDate(1);
      break;
    case "last_6_months":
      start.setMonth(now.getMonth() - 6);
      start.setDate(1);
      break;
    case "this_year":
      start.setMonth(0, 1);
      break;
    case "last_year":
      start.setFullYear(now.getFullYear() - 1, 0, 1);
      end.setFullYear(now.getFullYear() - 1, 11, 31);
      break;
    case "all_time":
      return transactions;
    case "custom": {
      if (!customStart && !customEnd) return transactions;
      const s = customStart ? new Date(customStart) : new Date(2000, 0, 1);
      s.setHours(0, 0, 0, 0);
      const e = customEnd ? new Date(customEnd) : new Date();
      e.setHours(23, 59, 59, 999);
      return transactions.filter((t) => {
        if (!t.date) return false;
        const d = new Date(t.date);
        return d >= s && d <= e;
      });
    }
    default:
      start.setDate(1);
  }

  return transactions.filter((t) => {
    if (!t.date) return false;
    const d = new Date(t.date);
    return d >= start && d <= end;
  });
};

export const calculateTotals = (transactions: Transaction[]) => {
  return transactions.reduce(
    (acc, t) => {
      if (t.type === "income") acc.income += t.amount;
      if (t.type === "expense") acc.expense += t.amount;
      // Transfers are excluded from income/expense totals to preserve savings rate
      return acc;
    },
    { income: 0, expense: 0 },
  );
};

export const calculateSavingsRate = (income: number, expense: number) => {
  if (income === 0) return 0;
  const rate = ((income - expense) / income) * 100;
  return Number(rate.toFixed(1));
};

export const calculateBurnRate = (expenses: number, daysPassed: number) => {
  if (daysPassed <= 0) return 0;
  return Number((expenses / daysPassed).toFixed(2));
};

export const calculateProjection = (burnRate: number, totalDays: number) => {
  return Number((burnRate * totalDays).toFixed(2));
};

export const calculateSpendingAcceleration = (
  transactions: Transaction[],
  totalDays: number,
) => {
  let firstHalf = 0;
  let secondHalf = 0;
  const midPoint = Math.floor(totalDays / 2);

  // We need the earliest date in the filtered transactions to determine the "start" of the period,
  // or we can just rely on the day of the month if it's a monthly view.
  // For a generic approach, we sort transactions and find the bounds.
  if (transactions.length === 0) return 0;

  const expenses = transactions.filter((t) => t.type === "expense");
  if (expenses.length === 0) return 0;

  const dates = expenses.map((t) => new Date(t.date).getTime()).sort();
  const startDate = new Date(dates[0]);

  expenses.forEach((t) => {
    const d = new Date(t.date);
    // days since start date
    const diffTime = Math.abs(d.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= midPoint) {
      firstHalf += t.amount;
    } else {
      secondHalf += t.amount;
    }
  });

  if (firstHalf === 0) return 0;
  const increasePercentage = ((secondHalf - firstHalf) / firstHalf) * 100;
  return Number(increasePercentage.toFixed(1));
};

export const calculateHighestSpendingDay = (transactions: Transaction[]) => {
  const dayStats = [0, 0, 0, 0, 0, 0, 0];
  const dayNames = [
    "Sundays",
    "Mondays",
    "Tuesdays",
    "Wednesdays",
    "Thursdays",
    "Fridays",
    "Saturdays",
  ];

  transactions.forEach((t) => {
    if (t.type === "expense") {
      const d = new Date(t.date);
      dayStats[d.getDay()] += t.amount;
    }
  });

  const maxSpend = Math.max(...dayStats);
  if (maxSpend === 0) return null;

  const maxIndex = dayStats.indexOf(maxSpend);
  return {
    dayName: dayNames[maxIndex],
    amount: maxSpend,
  };
};

export const calculateBehavioralStats = (
  transactions: Transaction[],
  categories: Category[],
) => {
  let count = 0;
  let totalAmount = 0;
  let highestSingleExpense = 0;
  const categoryTotals: Record<string, number> = {};
  transactions.forEach((t) => {
    if (t.type === "expense") {
      count++;
      totalAmount += t.amount;
      if (t.amount > highestSingleExpense) {
        highestSingleExpense = t.amount;
      }
      categoryTotals[t.categoryId] =
        (categoryTotals[t.categoryId] || 0) + t.amount;
    }
  });

  const avgValue = count > 0 ? totalAmount / count : 0;

  let topCatId = "";
  let maxAmount = 0;
  Object.keys(categoryTotals).forEach((catId) => {
    if (categoryTotals[catId] > maxAmount) {
      maxAmount = categoryTotals[catId];
      topCatId = catId;
    }
  });

  const topCatName =
    categories.find((c) => c.id === topCatId)?.name || "Unknown";

  return {
    totalTransactions: count,
    averageValue: Number(avgValue.toFixed(2)),
    highestSingleExpense,
    topCategory: maxAmount > 0 ? topCatName : null,
  };
};

export const getDaysInMonth = (month: number, year: number) => {
  return new Date(year, month + 1, 0).getDate();
};

export const calculateBudgetRisk = (
  projectedSpend: number,
  budgetAmount: number,
) => {
  if (projectedSpend <= budgetAmount) return "Safe";
  if (projectedSpend <= budgetAmount * 1.1) return "At Risk";
  return "Critical";
};

export const calculateWalletFlow = (
  transactions: Transaction[],
  walletId: string,
) => {
  return transactions.reduce(
    (acc, t) => {
      if (t.type === "income" && t.toWalletId === walletId) {
        acc.inflow += t.amount;
      } else if (t.type === "expense" && t.fromWalletId === walletId) {
        acc.outflow += t.amount;
      } else if (t.type === "transfer") {
        if (t.toWalletId === walletId) acc.inflow += t.amount;
        if (t.fromWalletId === walletId) acc.outflow += t.amount;
      }
      acc.netChange = acc.inflow - acc.outflow;
      return acc;
    },
    { inflow: 0, outflow: 0, netChange: 0 },
  );
};

export const calculateSavingsVelocity = (
  transactions: Transaction[],
  goalId: string,
) => {
  return transactions.reduce(
    (acc, t) => {
      if (t.type === "transfer" && t.toWalletId === goalId) {
        acc.totalSaved += t.amount;
        acc.contributions += 1;
      } else if (t.type === "transfer" && t.fromWalletId === goalId) {
        acc.totalSaved -= t.amount;
      }
      return acc;
    },
    { totalSaved: 0, contributions: 0 },
  );
};

export const calculateGoalDetailedStatus = (
  goal: {
    targetAmount: number;
    currentBalance: number;
    deadline?: string;
    createdAt: string;
  },
  transactions: Transaction[],
) => {
  const remainingAmount = goal.targetAmount - goal.currentBalance;
  if (remainingAmount <= 0)
    return { status: "completed", requiredMonthly: 0, avgMonthly: 0 };

  const today = new Date();
  const createdDate = new Date(goal.createdAt);

  // Calculate months remaining if deadline exists
  let monthsRemaining = 0;
  if (goal.deadline) {
    const deadlineDate = new Date(goal.deadline);
    monthsRemaining =
      (deadlineDate.getFullYear() - today.getFullYear()) * 12 +
      (deadlineDate.getMonth() - today.getMonth());
    // If deadline is this month or in the past
    if (monthsRemaining <= 0) monthsRemaining = 0.5; // Avoid div by zero, treat as "due now"
  }

  const requiredMonthly =
    monthsRemaining > 0 ? remainingAmount / monthsRemaining : remainingAmount;

  // Calculate average monthly velocity since creation
  const monthsSinceCreation = Math.max(
    1,
    (today.getFullYear() - createdDate.getFullYear()) * 12 +
      (today.getMonth() - createdDate.getMonth()),
  );
  const velocity = calculateSavingsVelocity(
    transactions,
    (goal as any).goalWalletId || (goal as any).id,
  );
  const avgMonthly = velocity.totalSaved / monthsSinceCreation;

  let status: "on_track" | "at_risk" | "critical" | "completed" = "on_track";

  if (goal.deadline) {
    const performance = avgMonthly / requiredMonthly;
    if (performance >= 1) status = "on_track";
    else if (performance >= 0.75) status = "at_risk";
    else status = "critical";
  }

  return {
    status,
    requiredMonthly: Number(requiredMonthly.toFixed(2)),
    avgMonthly: Number(avgMonthly.toFixed(2)),
    remainingAmount,
    monthsRemaining: Math.ceil(monthsRemaining),
  };
};

export const getContributorBreakdown = (
  transactions: Transaction[],
  goalWalletId: string,
) => {
  const contributions = transactions.filter(
    (t) => t.type === "transfer" && t.toWalletId === goalWalletId,
  );
  const breakdown: Record<string, { total: number; name: string }> = {};

  contributions.forEach((t) => {
    const user = t.createdBy || "Unknown";
    if (!breakdown[user]) breakdown[user] = { total: 0, name: user };
    breakdown[user].total += t.amount;
  });

  const total = Object.values(breakdown).reduce(
    (sum, item) => sum + item.total,
    0,
  );

  return Object.values(breakdown)
    .map((item) => ({
      ...item,
      percentage: total > 0 ? (item.total / total) * 100 : 0,
    }))
    .sort((a, b) => b.total - a.total);
};

export const calculateGoalPrediction = (
  remainingAmount: number,
  monthlyVelocity: number,
): string => {
  if (remainingAmount <= 0) return "Achieved";
  if (monthlyVelocity <= 0) return "Indefinite";
  const months = Math.ceil(remainingAmount / monthlyVelocity);
  return `${months} month${months !== 1 ? "s" : ""}`;
};

export const calculateCategoryBreakdown = (
  transactions: Transaction[],
  categories: Category[],
) => {
  const breakdown: Record<
    string,
    { id: string; value: number; color: string; name: string }
  > = {};

  transactions.forEach((t) => {
    if (t.type === "expense") {
      if (!breakdown[t.categoryId]) {
        const cat = categories.find((c) => c.id === t.categoryId);
        breakdown[t.categoryId] = {
          id: t.categoryId,
          value: 0,
          color: cat?.color || "#64748b",
          name: cat?.name || "Unknown",
        };
      }
      breakdown[t.categoryId].value += t.amount;
    }
  });

  return Object.values(breakdown).sort((a, b) => b.value - a.value);
};

export const calculateSpendingDominance = (
  categorySpend: number,
  totalSpend: number,
) => {
  if (totalSpend === 0) return 0;
  return Number(((categorySpend / totalSpend) * 100).toFixed(1));
};
