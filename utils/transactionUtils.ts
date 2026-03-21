import { Wallet, Goal } from "../types";
import { generateId } from "../utils";

// --- Balance Adjustment Logic ---

export const adjustEntityBalance = (
  wallets: Wallet[],
  goals: Goal[],
  id: string | null,
  amount: number,
): { wallets: Wallet[]; goals: Goal[] } => {
  if (!id) return { wallets, goals };

  const newWallets = [...wallets];
  const newGoals = [...goals];

  const goalIndex = newGoals.findIndex((g) => g.id === id);
  if (goalIndex !== -1) {
    // It's a goal
    newGoals[goalIndex] = {
      ...newGoals[goalIndex],
      currentBalance: (newGoals[goalIndex].currentBalance || 0) + amount,
    };
  } else {
    // It's a wallet
    const walletIndex = newWallets.findIndex((w) => w.id === id);
    if (walletIndex !== -1) {
      newWallets[walletIndex] = {
        ...newWallets[walletIndex],
        balance: newWallets[walletIndex].balance + amount,
      };
    }
  }
  return { wallets: newWallets, goals: newGoals };
};
