import { RecurringTransaction, Transaction, Wallet, Goal } from "../types";
import { generateId } from "../utils";

/**
 * Calculates the next due date based on the current due date and frequency.
 * Handles end-of-month clamping (e.g., Jan 31 -> Feb 28).
 */
export const calculateNextDueDate = (
  currentDateStr: string,
  frequency: RecurringTransaction["frequency"],
  interval: number = 1,
): string => {
  const date = new Date(currentDateStr);

  if (isNaN(date.getTime())) {
    throw new Error(
      `Invalid date string provided to calculateNextDueDate: ${currentDateStr}`,
    );
  }

  const currentDay = date.getDate();

  switch (frequency) {
    case "daily":
      date.setDate(date.getDate() + interval);
      break;
    case "weekly":
      date.setDate(date.getDate() + 7 * interval);
      break;
    case "monthly":
      // Add months. Handle end-of-month clamping.
      const targetMonth = date.getMonth() + interval;
      date.setMonth(targetMonth);

      // If the day changed, it means we spilled over into the next month
      // (e.g., Jan 31 + 1 month -> Mar 3 (or 2) instead of Feb 28)
      // We need to clamp to the last day of the intended target month.
      if (date.getDate() !== currentDay) {
        date.setDate(0);
      }
      break;
    case "yearly":
      const targetYear = date.getFullYear() + interval;
      date.setFullYear(targetYear);
      // Handle leap year clamping (Feb 29 -> Feb 28)
      if (date.getDate() !== currentDay) {
        date.setDate(0);
      }
      break;
    case "custom":
      // Custom interval logic can be easily added here later,
      // currently acting as daily interval.
      date.setDate(date.getDate() + interval);
      break;
    default:
      break;
  }

  // Use local date string instead of toISOString to prevent timezone shifts
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd}T12:00:00.000Z`;
};

/**
 * Processes due recurring transactions and generates new transactions.
 * Designed to run securely on the client side, looping for missed cycles
 * and guaranteeing exact duplicate prevention.
 */
export const processRecurringTransactions = (
  activeRules: RecurringTransaction[],
  existingTransactions: Transaction[],
  wallets: Wallet[],
  goals: Goal[],
): {
  newTransactions: Transaction[];
  updatedRules: RecurringTransaction[];
  updatedWallets: Wallet[];
  updatedGoals: Goal[];
  isComplete: boolean;
} | null => {
  const today = new Date();
  today.setHours(23, 59, 59, 999); // Compare up to the end of today

  if (activeRules.length === 0) return null;

  const newTransactions: Transaction[] = [];
  const updatedRules: RecurringTransaction[] = [];
  let tempWallets = [...wallets];
  let tempGoals = [...goals];

  // Map for fast duplicate lookups based on ruleId and exact date
  const generatedMap = new Set<string>();
  existingTransactions.forEach((t) => {
    if (t.generatedFromRecurring && t.recurringId) {
      // Create a unique key for the specific rule instance on a specific date
      const dateKey = new Date(t.date).toISOString().split("T")[0];
      generatedMap.add(`${t.recurringId}_${dateKey}`);
    }
  });

  const MAX_CATCHUP_BATCH = 500; // Increased to handle larger catch-up periods efficiently
  let allCyclesProcessed = true;

  for (const rule of activeRules) {
    if (!rule.isActive) continue;

    let nextDue = new Date(rule.nextDueDate);
    if (isNaN(nextDue.getTime())) continue; // Corrupted date

    let ruleModified = false;
    let cyclesProcessed = 0;

    // We only process if autoAdd is true. Reminders must be handled by UI.
    if (!rule.autoAdd) continue;

    // Loop until we've caught up to today
    while (nextDue <= today && cyclesProcessed < MAX_CATCHUP_BATCH) {
      // Stop if rule has expired
      if (rule.endDate && nextDue > new Date(rule.endDate)) {
        updatedRules.push({ ...rule, isActive: false });
        ruleModified = true;
        break; // Exit while loop for this rule
      }

      const yyyy = nextDue.getFullYear();
      const mm = String(nextDue.getMonth() + 1).padStart(2, "0");
      const dd = String(nextDue.getDate()).padStart(2, "0");
      const dateKey = `${yyyy}-${mm}-${dd}`;

      const deduplicationKey = `${rule.id}_${dateKey}`;

      // Check for exact existing duplicate
      if (!generatedMap.has(deduplicationKey)) {
        // Generate the new transaction
        const newTx: Transaction = {
          id: generateId(),
          type: rule.type,
          amount: rule.amount,
          categoryId: rule.categoryId,
          subCategoryId: rule.subCategoryId,
          fromWalletId: rule.type === "expense" ? (rule.walletId || null) : null,
          toWalletId: rule.type === "income" ? (rule.walletId || null) : null,
          date: `${dateKey}T12:00:00.000Z`, // Record standard mid-day time
          note: `(Auto) ${
            rule.note?.trim() || rule.name?.trim() || `${rule.frequency} recurring`
          }`,
          isRecurring: true,
          recurringId: rule.id,
          generatedFromRecurring: true,
          createdBy: "System",
          lastModifiedBy: "System",
        };

        newTransactions.push(newTx);
        // Mark as generated to prevent duplicates in the exact same batch if multiple overlapping rules exist (rare)
        generatedMap.add(deduplicationKey);

        // Apply temporary balance changes inside memory for cascade
        if (rule.type === "income" && rule.walletId) {
          const wIdx = tempWallets.findIndex((w) => w.id === rule.walletId);
          if (wIdx >= 0)
            tempWallets[wIdx] = {
              ...tempWallets[wIdx],
              balance: tempWallets[wIdx].balance + rule.amount,
            };
        } else if (rule.type === "expense" && rule.walletId) {
          const wIdx = tempWallets.findIndex((w) => w.id === rule.walletId);
          if (wIdx >= 0)
            tempWallets[wIdx] = {
              ...tempWallets[wIdx],
              balance: tempWallets[wIdx].balance - rule.amount,
            };
        }
      }

      // Calculate next cycle regardless of if we generated it (maybe it already existed, we still need to advance the nextDueDate)
      const nextDueStr = calculateNextDueDate(
        nextDue.toISOString(),
        rule.frequency,
        rule.interval || 1,
      );

      nextDue = new Date(nextDueStr);
      cyclesProcessed++;
      ruleModified = true;

      if (cyclesProcessed >= MAX_CATCHUP_BATCH) {
        allCyclesProcessed = false;
        break;
      }
    }

    if (ruleModified) {
      const yyyy = nextDue.getFullYear();
      const mm = String(nextDue.getMonth() + 1).padStart(2, "0");
      const dd = String(nextDue.getDate()).padStart(2, "0");
      const finalDateKey = `${yyyy}-${mm}-${dd}`;

      updatedRules.push({
        ...rule,
        nextDueDate: `${finalDateKey}T12:00:00.000Z`, // Persist standard formulation
      });
    }
  }

  if (newTransactions.length > 0 || updatedRules.length > 0) {
    return {
      newTransactions,
      updatedRules,
      updatedWallets: tempWallets,
      updatedGoals: tempGoals,
      isComplete: allCyclesProcessed,
    };
  }

  return null;
};
