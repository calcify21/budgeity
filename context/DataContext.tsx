import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import {
  AppState,
  Budget,
  Category,
  DashboardWidgetConfig,
  AnalyticsWidgetConfig,
  Goal,
  OnboardingMeta,
  PrimaryGoal,
  RecurringTransaction,
  ShoppingItem,
  Transaction,
  TransactionType,
  Wallet,
  WalletType,
  ActivityActionType,
} from "../types";
import {
  DEFAULT_CATEGORIES,
  INITIAL_WALLETS,
  ANALYTICS_WIDGET_DEFAULTS,
} from "../constants";
import { useAuth } from "./AuthContext";
import { useHousehold } from "./HouseholdContext";
import { useToast } from "./ToastContext";
import { generateId, formatCurrency } from "../utils";
import { db } from "../firebase";
import {
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  Unsubscribe,
  enableNetwork,
  disableNetwork,
} from "firebase/firestore";
import { adjustEntityBalance } from "../utils/transactionUtils";
import { logActivity } from "../utils/activityLogger";
import i18n from "../i18n";

export interface OnboardingWizardPayload {
  currency: string;
  numberSystem: "IN" | "INTL" | "AUTO";
  theme: "light" | "dark";
  hideAmounts: boolean;
  primaryGoal: PrimaryGoal;
  wallets: Array<{ name: string; type: WalletType; balance: number; color: string }>;
  onboardingMeta: OnboardingMeta;
  language?: string;
}

interface DataContextType extends AppState {
  systemStatus: "online" | "syncing" | "offline" | "error";
  retryConnection: () => Promise<void>;
  isLoadingData: boolean;
  isOnboarding: boolean;
  tourCompleted?: boolean;
  completeTour: () => void;
  completeOnboarding: (data: OnboardingWizardPayload) => Promise<void>;
  addTransaction: (transaction: Omit<Transaction, "id">) => void;
  updateTransaction: (transaction: Transaction) => void;
  updateMultipleTransactions: (transactions: Transaction[]) => void;
  addMultipleTransactions: (transactions: Omit<Transaction, "id">[]) => void;
  deleteTransaction: (id: string) => void;
  deleteMultipleTransactions: (ids: string[]) => void;
  addWallet: (wallet: Omit<Wallet, "id" | "createdAt">) => string;
  updateWallet: (wallet: Wallet) => void;
  deleteWallet: (id: string) => void;
  archiveWallet: (id: string, archive: boolean) => void;

  deleteWalletWithTransactions: (id: string) => void;
  moveWalletTransactions: (fromWalletId: string, toWalletId: string) => void;
  importData: (
    newWallets: Wallet[],
    newTransactions: Transaction[],
    newCategories?: Category[],
  ) => void;
  addCategory: (category: Category) => void;
  updateCategory: (category: Category) => void;
  deleteCategory: (id: string) => void;
  reorderCategories: (categories: Category[]) => void;
  addShoppingItem: (
    item: Omit<
      ShoppingItem,
      "id" | "status" | "createdAt" | "linkedTransactionIds"
    >,
  ) => void;
  updateShoppingItem: (item: ShoppingItem) => void;
  deleteShoppingItem: (id: string) => void;
  markShoppingItemAsBought: (
    item: ShoppingItem,
    finalAmount: number,
    walletId: string,
    date: string,
    quantityBought: number,
  ) => void;
  revertShoppingItemPurchase: (
    item: ShoppingItem,
    transactionId: string,
  ) => void;
  addBudget: (budget: Omit<Budget, "id" | "createdAt">) => void;
  updateBudget: (budget: Budget) => void;
  deleteBudget: (id: string) => void;
  addGoal: (
    goal: Omit<
      Goal,
      "id" | "createdAt" | "goalWalletId" | "status" | "currentBalance"
    >,
  ) => void;
  updateGoal: (goal: Goal) => void;
  deleteGoal: (
    id: string,
    options: { mode: "convert" | "return"; targetWalletId?: string },
  ) => void;
  addRecurringTransaction: (
    rule: Omit<RecurringTransaction, "id" | "createdAt" | "userId">,
  ) => void;
  updateRecurringTransaction: (
    rule: Partial<RecurringTransaction> & { id: string },
  ) => void;
  updateRecurringTransactionWithHistory: (
    rule: Partial<RecurringTransaction> & { id: string },
  ) => void;
  deleteRecurringTransaction: (id: string, deleteGenerated?: boolean) => void;
  confirmManualSubscriptionPayment: (sub: RecurringTransaction, note: string, nextDate: string) => void;
  syncEngineResults: (
    newTransactions: Transaction[],
    updatedRules: RecurringTransaction[],
    updatedWallets: Wallet[],
    updatedGoals: Goal[],
  ) => void;

  setCurrency: (currency: string) => void;
  toggleTheme: () => void;
  setAccentTheme: (theme: string) => void;
  setPremiumTheme: (theme: NonNullable<AppState["premiumTheme"]>) => void;
  toggleHideAmounts: () => void;
  setDefaultWallet: (id: string) => void;
  setNumberSystem: (system: "IN" | "INTL" | "AUTO") => void;
  resetCategories: () => void;
  resetData: () => void;
  deleteCurrentUserData: () => Promise<void>;
  formatAmount: (amount: number) => string;
  updateNavPreferences: (prefs: {
    mobilePinned: string[];
    tabletPinned: string[];
  }) => void;
  updateDashboardWidgets: (widgets: DashboardWidgetConfig[]) => void;
  updateAnalyticsWidgets: (widgets: AnalyticsWidgetConfig[]) => void;
  updateAnalyticsSectionNames: (names: Record<string, string>) => void;
  setLanguage: (lang: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const INITIAL_STATE: AppState = {
  wallets: INITIAL_WALLETS,
  transactions: [],
  categories: DEFAULT_CATEGORIES,
  shoppingList: [],
  budgets: [],
  goals: [],
  recurringTransactions: [],
  currency: "INR",
  theme: "light",
  hideAmounts: false,
  defaultWalletId: INITIAL_WALLETS[0].id,
  numberSystem: "AUTO",
  tourCompleted: false,
  navPreferences: {
    mobilePinned: ["/dashboard", "/transactions", "/wallets"],
    tabletPinned: [
      "/dashboard",
      "/transactions",
      "/wallets",
      "/budgets",
      "/goals",
      "/analytics",
    ],
  },
  dashboardWidgets: [
    { id: "networth", enabled: true, order: 1 },
    { id: "income_expense", enabled: true, order: 2 },
    { id: "snapshot", enabled: true, order: 3 },
    { id: "wallets", enabled: true, order: 4 },
    { id: "trend", enabled: true, order: 5 },
    { id: "goals", enabled: true, order: 6 },
    { id: "transactions", enabled: true, order: 7 },
    { id: "spending", enabled: false, order: 8 },
    { id: "budgets", enabled: false, order: 9 },
    { id: "actions", enabled: false, order: 10 },
    { id: "planned", enabled: false, order: 11 },
    { id: "subscriptions", enabled: true, order: 12 },
  ],
  analyticsWidgets: ANALYTICS_WIDGET_DEFAULTS,
  analyticsSectionNames: {},
  accentTheme: "emerald",
  premiumTheme: "classic",
  language: "en",
};

const STORAGE_KEY = "budgeity_local_v1";
const THEME_STORAGE_KEY = "budgeity_theme_preference";

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user, loading: authLoading } = useAuth();
  const { activeWorkspace } = useHousehold();
  const [state, setState] = useState<AppState>(() => {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as
      | "light"
      | "dark"
      | null;
    return { ...INITIAL_STATE, theme: savedTheme || INITIAL_STATE.theme };
  });
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [systemStatus, setSystemStatus] = useState<
    "online" | "syncing" | "offline" | "error"
  >("online");
  const { success: toastSuccess, error: toastError } = useToast();
  const isRetryingRef = useRef(false);
  const isDeletingAccountRef = useRef(false);

  useEffect(() => {
    const handleOnline = () => {
      setSystemStatus((prev) => {
        if (prev === "offline") {
          toastSuccess("Back online. Data synced successfully.");
        }
        return "online";
      });
    };
    const handleOffline = () => setSystemStatus("offline");

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    if (!navigator.onLine) {
      setSystemStatus("offline");
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [toastSuccess]);

  // Load Data
  useEffect(() => {
    // Wait for auth & workspace to initialize before making decisions
    if (authLoading || !activeWorkspace.id) return;

    // Reset state and show loader when workspace changes
    setIsLoadingData(true);
    setState(INITIAL_STATE);

    let unsubscribe: Unsubscribe | undefined;

    const setupListener = async () => {
      if (user) {
        try {
          const docRef =
            activeWorkspace.type === "personal"
              ? doc(db, "users", user.uid)
              : doc(db, "households", activeWorkspace.id, "data", "finance");

          unsubscribe = onSnapshot(
            docRef,
            { includeMetadataChanges: true },
            (docSnap) => {
              if (docSnap.metadata.fromCache) {
                setSystemStatus("offline");
              } else if (docSnap.metadata.hasPendingWrites) {
                setSystemStatus("syncing");
              } else if (navigator.onLine && !isRetryingRef.current) {
                setSystemStatus((prev) => {
                  if (prev === "offline") {
                    toastSuccess("Back online. Data synced successfully.");
                  }
                  return "online";
                });
              }

              if (docSnap.exists()) {
                const cloudData = docSnap.data() as AppState;
                const mergedState = { ...INITIAL_STATE, ...cloudData };

                // Migration: Remove outdated fields
                // @ts-ignore
                delete mergedState.accentColor;

                // Migration: Strict Account Types
                mergedState.wallets = mergedState.wallets.map((w) => {
                  if (["cash", "bank", "savings"].includes(w.type)) return w;
                  return { ...w, type: "bank" };
                });

                setState(mergedState);
                localStorage.setItem(
                  `${STORAGE_KEY}_${activeWorkspace.id}`,
                  JSON.stringify(mergedState),
                );
                setIsOnboarding(false);
              } else {
                // Don't trigger onboarding if we're in the middle of deleting the account
                if (isDeletingAccountRef.current) {
                  setIsOnboarding(false);
                } else if (activeWorkspace.type === "personal") {
                  setIsOnboarding(true);
                } else {
                  setState(INITIAL_STATE);
                  setIsOnboarding(false);
                }
              }
              setIsLoadingData(false);
            },
            (error) => {
              console.warn("Using local data due to error:", error);
              setSystemStatus("error");
              const local = localStorage.getItem(
                `${STORAGE_KEY}_${activeWorkspace.id}`,
              );
              if (local) setState({ ...INITIAL_STATE, ...JSON.parse(local) });
              else
                setIsOnboarding(
                  activeWorkspace.type === "personal" ? true : false,
                );
              setIsLoadingData(false);
            },
          );
        } catch (e: any) {
          console.error("Error setting up listener:", e);
          setIsLoadingData(false);
        }
      } else {
        setState(INITIAL_STATE);
        setIsLoadingData(false);
      }
    };

    setupListener();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user, authLoading, activeWorkspace.id]);
  const retryConnection = async () => {
    if (!navigator.onLine) {
      toastError("Please check your internet connection.");
      return;
    }

    isRetryingRef.current = true;
    setSystemStatus("syncing");

    try {
      await disableNetwork(db);
      await enableNetwork(db);
      setSystemStatus("online");
      toastSuccess("Connection refreshed successfully.");
    } catch (e) {
      setSystemStatus("error");
      toastError("Failed to reconnect.");
      console.error("Manual retry failed:", e);
    } finally {
      isRetryingRef.current = false;
    }
  };

  // Handle Theme
  useEffect(() => {
    const premiumTheme = state.premiumTheme || "classic";
    const shouldUseDarkSurface = state.theme === "dark" || premiumTheme !== "classic";

    if (shouldUseDarkSurface) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem(THEME_STORAGE_KEY, state.theme);
    document.documentElement.setAttribute("data-premium-theme", premiumTheme);
  }, [state.theme, state.premiumTheme]);

  // Handle Accent Theme
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", state.accentTheme || "emerald");
  }, [state.accentTheme]);
  
  // Handle Language
  useEffect(() => {
    if (state.language && i18n.language !== state.language) {
      i18n.changeLanguage(state.language);
    }
  }, [state.language]);

  const syncState = async (newState: AppState) => {
    setState(newState);
    localStorage.setItem(
      `${STORAGE_KEY}_${activeWorkspace.id}`,
      JSON.stringify(newState),
    );
    if (user && user.uid && activeWorkspace.id) {
      try {
        const docRef =
          activeWorkspace.type === "personal"
            ? doc(db, "users", user.uid)
            : doc(db, "households", activeWorkspace.id, "data", "finance");

        const cleanState = JSON.parse(JSON.stringify(newState));
        
        // Construct _meta based on workspace type
        const metaBase = {
          lastUpdated: new Date().toISOString(),
          lastUpdatedBy: user.uid,
          workspaceId: activeWorkspace.id,
          workspaceType: activeWorkspace.type,
        };

        const finalMeta = activeWorkspace.type === "personal" 
          ? {
              ...metaBase,
              email: user.email,
              displayName: user.displayName,
              photoURL: user.photoURL,
              uid: user.uid,
              // Note: avatarBase64 is managed by useAvatar.ts, 
              // but we can preserve it here if it already exists in the doc
            }
          : metaBase; // Stricter meta for households (no personal info leaks)

        await setDoc(docRef, {
          ...cleanState,
          _meta: finalMeta,
        }, { merge: true });
      } catch (e: any) {
        console.error("Cloud sync failed", e);
      }
    }
  };
  const logInHousehold = async (
    actionType: ActivityActionType,
    metadata: Record<string, any>,
  ) => {
    if (activeWorkspace.type === "household" && user) {
      await logActivity(activeWorkspace.id, {
        actorUid: user.uid,
        actorName: user.displayName || "Unknown",
        actionType,
        metadata,
      });
    }
  };

  const completeOnboarding = async (data: OnboardingWizardPayload) => {
    const now = new Date().toISOString();
    const newWallets: Wallet[] = data.wallets.map((w, i) => ({
      id: generateId(),
      name: w.name,
      type: w.type,
      balance: w.balance,
      color: w.color,
      createdAt: now,
      ownerId: user?.uid,
    }));

    let customDashboardWidgets = INITIAL_STATE.dashboardWidgets;

    if (data.primaryGoal === "debt_free") {
      customDashboardWidgets = [
        { id: "goals", enabled: true, order: 1 },
        { id: "networth", enabled: true, order: 2 },
        { id: "income_expense", enabled: true, order: 3 },
        { id: "snapshot", enabled: true, order: 4 },
        { id: "wallets", enabled: true, order: 5 },
        { id: "transactions", enabled: true, order: 6 },
        { id: "trend", enabled: true, order: 7 },
        { id: "spending", enabled: false, order: 8 },
        { id: "budgets", enabled: false, order: 9 },
        { id: "actions", enabled: false, order: 10 },
        { id: "planned", enabled: false, order: 11 },
        { id: "subscriptions", enabled: true, order: 12 },
      ];
    } else if (data.primaryGoal === "build_wealth") {
      customDashboardWidgets = [
        { id: "networth", enabled: true, order: 1 },
        { id: "trend", enabled: true, order: 2 },
        { id: "wallets", enabled: true, order: 3 },
        { id: "income_expense", enabled: true, order: 4 },
        { id: "snapshot", enabled: true, order: 5 },
        { id: "goals", enabled: true, order: 6 },
        { id: "transactions", enabled: true, order: 7 },
        { id: "spending", enabled: false, order: 8 },
        { id: "budgets", enabled: false, order: 9 },
        { id: "actions", enabled: false, order: 10 },
        { id: "planned", enabled: false, order: 11 },
        { id: "subscriptions", enabled: true, order: 12 },
      ];
    } else if (data.primaryGoal === "track_spending") {
      customDashboardWidgets = [
        { id: "spending", enabled: true, order: 1 },
        { id: "budgets", enabled: true, order: 2 },
        { id: "income_expense", enabled: true, order: 3 },
        { id: "transactions", enabled: true, order: 4 },
        { id: "trend", enabled: true, order: 5 },
        { id: "snapshot", enabled: true, order: 6 },
        { id: "networth", enabled: true, order: 7 },
        { id: "wallets", enabled: true, order: 8 },
        { id: "goals", enabled: false, order: 9 },
        { id: "actions", enabled: false, order: 10 },
        { id: "planned", enabled: false, order: 11 },
        { id: "subscriptions", enabled: true, order: 12 },
      ];
    } else if (data.primaryGoal === "save_goal") {
      customDashboardWidgets = [
        { id: "goals", enabled: true, order: 1 },
        { id: "budgets", enabled: true, order: 2 },
        { id: "snapshot", enabled: true, order: 3 },
        { id: "income_expense", enabled: true, order: 4 },
        { id: "networth", enabled: true, order: 5 },
        { id: "wallets", enabled: true, order: 6 },
        { id: "transactions", enabled: true, order: 7 },
        { id: "trend", enabled: true, order: 8 },
        { id: "spending", enabled: false, order: 9 },
        { id: "actions", enabled: false, order: 10 },
        { id: "planned", enabled: false, order: 11 },
        { id: "subscriptions", enabled: true, order: 12 },
      ];
    }

    const newState: AppState = {
      ...INITIAL_STATE,
      currency: data.currency,
      numberSystem: data.numberSystem,
      theme: data.theme,
      hideAmounts: data.hideAmounts,
      primaryGoal: data.primaryGoal,
      language: data.language,
      onboardingMeta: {
        ...data.onboardingMeta,
        completedAt: now,
      },
      wallets: newWallets,
      defaultWalletId: newWallets[0]?.id || null,
      dashboardWidgets: customDashboardWidgets
    };
    await syncState(newState);
    setIsOnboarding(false);
  };

  const completeTour = () => {
    syncState({ ...state, tourCompleted: true });
  };

  // --- Transactions ---

  const checkCashWalletBalance = (
    walletId: string | null,
    changeAmount: number,
  ) => {
    if (!walletId) return;
    const wallet = state.wallets.find((w) => w.id === walletId);
    if (wallet && wallet.type === "cash") {
      if (wallet.balance + changeAmount < 0) {
        throw new Error(
          `Insufficient funds in Cash wallet '${wallet.name}'. Balance cannot be negative.`,
        );
      }
    }
  };

  const addTransaction = (t: Omit<Transaction, "id">) => {
    if (!t.date || isNaN(new Date(t.date).getTime())) {
      throw new Error("Invalid transaction date.");
    }
    const newTx = {
      ...t,
      id: Date.now().toString(),
      createdBy: user?.email || "User",
      lastModifiedBy: user?.email || "User",
    };

    let { wallets: w1, goals: g1 } = {
      wallets: state.wallets,
      goals: state.goals,
    };

    if (t.type === "income") {
      ({ wallets: w1, goals: g1 } = adjustEntityBalance(
        w1,
        g1,
        t.toWalletId,
        t.amount,
      ));
    } else if (t.type === "expense") {
      checkCashWalletBalance(t.fromWalletId, -t.amount);
      ({ wallets: w1, goals: g1 } = adjustEntityBalance(
        w1,
        g1,
        t.fromWalletId,
        -t.amount,
      ));
    } else if (t.type === "transfer") {
      checkCashWalletBalance(t.fromWalletId, -t.amount);
      ({ wallets: w1, goals: g1 } = adjustEntityBalance(
        w1,
        g1,
        t.fromWalletId,
        -t.amount,
      ));
      ({ wallets: w1, goals: g1 } = adjustEntityBalance(
        w1,
        g1,
        t.toWalletId,
        t.amount,
      ));
    }

    syncState({
      ...state,
      wallets: w1,
      goals: g1,
      transactions: [newTx, ...state.transactions],
    });
    logInHousehold("transaction_add", {
      amount: t.amount,
      note: t.note,
      type: t.type,
    });
  };

  const updateTransaction = (updatedTx: Transaction) => {
    const oldTx = state.transactions.find((t) => t.id === updatedTx.id);
    if (!oldTx) return;

    let { wallets: w1, goals: g1 } = {
      wallets: state.wallets,
      goals: state.goals,
    };

    // 1. Revert Old Transaction
    if (oldTx.type === "income") {
      ({ wallets: w1, goals: g1 } = adjustEntityBalance(
        w1,
        g1,
        oldTx.toWalletId,
        -oldTx.amount,
      ));
    } else if (oldTx.type === "expense") {
      ({ wallets: w1, goals: g1 } = adjustEntityBalance(
        w1,
        g1,
        oldTx.fromWalletId,
        oldTx.amount,
      ));
    } else if (oldTx.type === "transfer") {
      ({ wallets: w1, goals: g1 } = adjustEntityBalance(
        w1,
        g1,
        oldTx.fromWalletId,
        oldTx.amount,
      ));
      ({ wallets: w1, goals: g1 } = adjustEntityBalance(
        w1,
        g1,
        oldTx.toWalletId,
        -oldTx.amount,
      ));
    }

    // 2. Apply New Transaction
    if (updatedTx.type === "income") {
      ({ wallets: w1, goals: g1 } = adjustEntityBalance(
        w1,
        g1,
        updatedTx.toWalletId,
        updatedTx.amount,
      ));
    } else if (updatedTx.type === "expense") {
      // Check balance logic requires we verify against the INTERMEDIATE state (w1)
      // Helper above uses 'state.wallets' which is old.
      // We must inline check or update helper to accept wallets list.
      const w = w1.find((wa) => wa.id === updatedTx.fromWalletId);
      if (w && w.type === "cash" && w.balance - updatedTx.amount < 0) {
        throw new Error(`Insufficient funds in Cash wallet '${w.name}'.`);
      }
      ({ wallets: w1, goals: g1 } = adjustEntityBalance(
        w1,
        g1,
        updatedTx.fromWalletId,
        -updatedTx.amount,
      ));
    } else if (updatedTx.type === "transfer") {
      const w = w1.find((wa) => wa.id === updatedTx.fromWalletId);
      if (w && w.type === "cash" && w.balance - updatedTx.amount < 0) {
        throw new Error(`Insufficient funds in Cash wallet '${w.name}'.`);
      }
      ({ wallets: w1, goals: g1 } = adjustEntityBalance(
        w1,
        g1,
        updatedTx.fromWalletId,
        -updatedTx.amount,
      ));
      ({ wallets: w1, goals: g1 } = adjustEntityBalance(
        w1,
        g1,
        updatedTx.toWalletId,
        updatedTx.amount,
      ));
    }

    const txs = state.transactions.map((t) =>
      t.id === updatedTx.id
        ? {
            ...oldTx,
            ...updatedTx,
            createdBy:
              oldTx.createdBy || updatedTx.createdBy || user?.email || "User",
            lastModifiedBy: user?.email || "User",
          }
        : t,
    );
    syncState({ ...state, wallets: w1, goals: g1, transactions: txs });
    logInHousehold("transaction_edit", {
      amount: updatedTx.amount,
      note: updatedTx.note,
      type: updatedTx.type,
    });
  };

  const updateMultipleTransactions = (updatedTxs: Transaction[]) => {
    let { wallets: w1, goals: g1 } = {
      wallets: state.wallets,
      goals: state.goals,
    };

    // Process all reversions and applications sequentially
    updatedTxs.forEach((updatedTx) => {
      const oldTx = state.transactions.find((t) => t.id === updatedTx.id);
      if (!oldTx) return;

      // 1. Revert Old Transaction
      if (oldTx.type === "income") {
        ({ wallets: w1, goals: g1 } = adjustEntityBalance(w1, g1, oldTx.toWalletId, -oldTx.amount));
      } else if (oldTx.type === "expense") {
        ({ wallets: w1, goals: g1 } = adjustEntityBalance(w1, g1, oldTx.fromWalletId, oldTx.amount));
      } else if (oldTx.type === "transfer") {
        ({ wallets: w1, goals: g1 } = adjustEntityBalance(w1, g1, oldTx.fromWalletId, oldTx.amount));
        ({ wallets: w1, goals: g1 } = adjustEntityBalance(w1, g1, oldTx.toWalletId, -oldTx.amount));
      }

      // 2. Apply New Transaction
      if (updatedTx.type === "income") {
        ({ wallets: w1, goals: g1 } = adjustEntityBalance(w1, g1, updatedTx.toWalletId, updatedTx.amount));
      } else if (updatedTx.type === "expense") {
        const w = w1.find((wa) => wa.id === updatedTx.fromWalletId);
        if (w && w.type === "cash" && w.balance - updatedTx.amount < 0) {
          throw new Error(`Insufficient funds in Cash wallet '${w.name}'.`);
        }
        ({ wallets: w1, goals: g1 } = adjustEntityBalance(w1, g1, updatedTx.fromWalletId, -updatedTx.amount));
      } else if (updatedTx.type === "transfer") {
        const w = w1.find((wa) => wa.id === updatedTx.fromWalletId);
        if (w && w.type === "cash" && w.balance - updatedTx.amount < 0) {
          throw new Error(`Insufficient funds in Cash wallet '${w.name}'.`);
        }
        ({ wallets: w1, goals: g1 } = adjustEntityBalance(w1, g1, updatedTx.fromWalletId, -updatedTx.amount));
        ({ wallets: w1, goals: g1 } = adjustEntityBalance(w1, g1, updatedTx.toWalletId, updatedTx.amount));
      }
    });

    const updatedIds = new Set(updatedTxs.map((t) => t.id));
    const txs = state.transactions.map((t) => {
      if (updatedIds.has(t.id)) {
        const u = updatedTxs.find((ut) => ut.id === t.id)!;
        return {
          ...t,
          ...u,
          createdBy: t.createdBy || u.createdBy || user?.email || "User",
          lastModifiedBy: user?.email || "User",
        };
      }
      return t;
    });

    syncState({ ...state, wallets: w1, goals: g1, transactions: txs });
    logInHousehold("transaction_edit", {
      count: updatedTxs.length,
      note: "Bulk edit of transactions",
    });
  };

  const addMultipleTransactions = (txs: Omit<Transaction, "id">[]) => {
    const newTxs = txs
      .filter((t) => t.date && !isNaN(new Date(t.date).getTime()))
      .map((t, i) => ({
        ...t,
        id: `${Date.now()}-${i}`,
        createdBy: user?.email || "User",
        lastModifiedBy: user?.email || "User",
      }));

    let { wallets: w1, goals: g1 } = {
      wallets: state.wallets,
      goals: state.goals,
    };

    newTxs.forEach((t) => {
      if (t.type === "income") {
        ({ wallets: w1, goals: g1 } = adjustEntityBalance(
          w1,
          g1,
          t.toWalletId,
          t.amount,
        ));
      } else if (t.type === "expense") {
        const w = w1.find((wa) => wa.id === t.fromWalletId);
        if (
          w &&
          w.type === "cash" &&
          w.balance - t.amount < 0 &&
          !t.isRecurring &&
          !t.generatedFromRecurring
        ) {
          throw new Error(`Insufficient funds in Cash wallet '${w.name}'.`);
        }
        ({ wallets: w1, goals: g1 } = adjustEntityBalance(
          w1,
          g1,
          t.fromWalletId,
          -t.amount,
        ));
      } else if (t.type === "transfer") {
        const w = w1.find((wa) => wa.id === t.fromWalletId);
        if (
          w &&
          w.type === "cash" &&
          w.balance - t.amount < 0 &&
          !t.isRecurring &&
          !t.generatedFromRecurring
        ) {
          throw new Error(`Insufficient funds in Cash wallet '${w.name}'.`);
        }
        ({ wallets: w1, goals: g1 } = adjustEntityBalance(
          w1,
          g1,
          t.fromWalletId,
          -t.amount,
        ));
        ({ wallets: w1, goals: g1 } = adjustEntityBalance(
          w1,
          g1,
          t.toWalletId,
          t.amount,
        ));
      }
    });

    syncState({
      ...state,
      wallets: w1,
      goals: g1,
      transactions: [...newTxs, ...state.transactions],
    });
  };

  const importData = (
    newWallets: Wallet[],
    newTransactions: Transaction[],
    newCategories: Category[] = [],
  ) => {
    // Merge wallets first
    let updatedWallets = [...state.wallets, ...newWallets];
    let updatedGoals = [...state.goals];
    let updatedCategories = [...state.categories, ...newCategories];

    // Calculate balances based on new transactions
    newTransactions.forEach((t) => {
      if (!t.date || isNaN(new Date(t.date).getTime())) return;

      if (t.type === "income") {
        ({ wallets: updatedWallets, goals: updatedGoals } = adjustEntityBalance(
          updatedWallets,
          updatedGoals,
          t.toWalletId,
          t.amount,
        ));
      }
      if (t.type === "expense") {
        ({ wallets: updatedWallets, goals: updatedGoals } = adjustEntityBalance(
          updatedWallets,
          updatedGoals,
          t.fromWalletId,
          -t.amount,
        ));
      }
      if (t.type === "transfer") {
        ({ wallets: updatedWallets, goals: updatedGoals } = adjustEntityBalance(
          updatedWallets,
          updatedGoals,
          t.fromWalletId,
          -t.amount,
        ));
        ({ wallets: updatedWallets, goals: updatedGoals } = adjustEntityBalance(
          updatedWallets,
          updatedGoals,
          t.toWalletId,
          t.amount,
        ));
      }
    });

    syncState({
      ...state,
      wallets: updatedWallets,
      goals: updatedGoals,
      categories: updatedCategories,
      transactions: [...newTransactions, ...state.transactions],
    });
  };

  const deleteTransaction = (id: string) => {
    deleteMultipleTransactions([id]);
  };

  const deleteMultipleTransactions = (ids: string[]) => {
    let { wallets: w1, goals: g1 } = {
      wallets: state.wallets,
      goals: state.goals,
    };
    const txsToDelete = state.transactions.filter((t) => ids.includes(t.id));

    txsToDelete.forEach((tx) => {
      // Reverse the effect
      if (tx.type === "income") {
        ({ wallets: w1, goals: g1 } = adjustEntityBalance(
          w1,
          g1,
          tx.toWalletId,
          -tx.amount,
        ));
      } else if (tx.type === "expense") {
        ({ wallets: w1, goals: g1 } = adjustEntityBalance(
          w1,
          g1,
          tx.fromWalletId,
          tx.amount,
        ));
      } else if (tx.type === "transfer") {
        ({ wallets: w1, goals: g1 } = adjustEntityBalance(
          w1,
          g1,
          tx.fromWalletId,
          tx.amount,
        ));
        ({ wallets: w1, goals: g1 } = adjustEntityBalance(
          w1,
          g1,
          tx.toWalletId,
          -tx.amount,
        ));
      }
    });

    syncState({
      ...state,
      wallets: w1,
      goals: g1,
      transactions: state.transactions.filter((t) => !ids.includes(t.id)),
    });
    // Assuming the instruction meant to add this to deleteMultipleTransactions
    // and that `oldTx` refers to the first transaction in `txsToDelete` if only one is deleted.
    // For multiple transactions, this logging might need to be inside the forEach loop or aggregated.
    // Sticking to the instruction's provided snippet structure.
    if (txsToDelete.length === 1) {
      const oldTx = txsToDelete[0];
      logInHousehold("transaction_delete", {
        amount: oldTx.amount,
        note: oldTx.note,
      });
    }
  };

  // --- Wallets ---

  const addWallet = (w: Omit<Wallet, "id" | "createdAt">) => {
    const id = generateId();
    syncState({
      ...state,
      wallets: [
        ...state.wallets,
        {
          ...w,
          id,
          createdAt: new Date().toISOString(),
          ownerId: user?.uid,
          createdBy: user?.email || "User",
          lastModifiedBy: user?.email || "User",
        },
      ],
    });
    logInHousehold("wallet_create", { name: w.name, type: w.type });
    return id;
  };

  const updateWallet = (w: Wallet) => {
    syncState({
      ...state,
      wallets: state.wallets.map((wallet) =>
        wallet.id === w.id
          ? {
              ...wallet,
              ...w,
              createdBy:
                wallet.createdBy || w.createdBy || user?.email || "User",
              lastModifiedBy: user?.email || "User",
            }
          : wallet,
      ),
    });
    logInHousehold("wallet_edit", { name: w.name, type: w.type });
  };

  const deleteWallet = (id: string) => {
    const w = state.wallets.find((wallet) => wallet.id === id);
    syncState({ ...state, wallets: state.wallets.filter((w) => w.id !== id) });
    if (w) logInHousehold("wallet_delete", { name: w.name });
  };

  const archiveWallet = (id: string, archive: boolean) => {
    const updatedWallets = state.wallets.map((w) =>
      w.id === id ? { ...w, archived: archive } : w,
    );
    syncState({ ...state, wallets: updatedWallets });
    logInHousehold("wallet_archive", { 
      id, 
      archive, 
      name: state.wallets.find(w => w.id === id)?.name 
    });
  };

  const deleteWalletWithTransactions = (id: string) => {
    // 1. Reverse the effect of transactions tied to this wallet
    let { wallets: w1, goals: g1 } = {
      wallets: state.wallets,
      goals: state.goals,
    };
    const transactionsToDelete = state.transactions.filter(
      (t) => t.fromWalletId === id || t.toWalletId === id,
    );

    transactionsToDelete.forEach((tx) => {
      if (tx.type === "income") {
        ({ wallets: w1, goals: g1 } = adjustEntityBalance(
          w1,
          g1,
          tx.toWalletId,
          -tx.amount,
        ));
      } else if (tx.type === "expense") {
        ({ wallets: w1, goals: g1 } = adjustEntityBalance(
          w1,
          g1,
          tx.fromWalletId,
          tx.amount,
        ));
      } else if (tx.type === "transfer") {
        ({ wallets: w1, goals: g1 } = adjustEntityBalance(
          w1,
          g1,
          tx.fromWalletId,
          tx.amount,
        ));
        ({ wallets: w1, goals: g1 } = adjustEntityBalance(
          w1,
          g1,
          tx.toWalletId,
          -tx.amount,
        ));
      }
    });

    const newTransactions = state.transactions.filter(
      (t) => t.fromWalletId !== id && t.toWalletId !== id,
    );

    // 2. Remove Wallet
    const newWallets = w1.filter((w) => w.id !== id);

    // 3. Update Default Wallet
    let newDefault = state.defaultWalletId;
    if (state.defaultWalletId === id) {
      newDefault = newWallets.length > 0 ? newWallets[0].id : null;
    }

    // 4. Update Budgets (Remove budgets that were specifically for this wallet)
    const newBudgets = state.budgets.filter((b) => b.walletId !== id);

    // 5. Update Recurring Transactions (Disable or filter?)
    // It's safer to disable active recurring rules that used this wallet
    const newRecurring = state.recurringTransactions.map((r) => {
      if (r.walletId === id) {
        return { ...r, isActive: false };
      }
      return r;
    });

    syncState({
      ...state,
      transactions: newTransactions,
      wallets: newWallets,
      goals: g1,
      budgets: newBudgets,
      recurringTransactions: newRecurring,
      defaultWalletId: newDefault,
    });
  };

  const moveWalletTransactions = (fromWalletId: string, toWalletId: string) => {
    if (fromWalletId === toWalletId) return;
    const fromWallet = state.wallets.find((w) => w.id === fromWalletId);
    if (!fromWallet) return;

    const newTransactions = state.transactions.map((t) => {
      let updated = { ...t };
      if (t.fromWalletId === fromWalletId) updated.fromWalletId = toWalletId;
      if (t.toWalletId === fromWalletId) updated.toWalletId = toWalletId;
      return updated;
    });

    const newWallets = state.wallets
      .map((w) =>
        w.id === toWalletId
          ? { ...w, balance: w.balance + fromWallet.balance }
          : w,
      )
      .filter((w) => w.id !== fromWalletId);

    let newDefault = state.defaultWalletId;
    if (state.defaultWalletId === fromWalletId) {
      newDefault = toWalletId;
    }

    syncState({
      ...state,
      transactions: newTransactions,
      wallets: newWallets,
      defaultWalletId: newDefault,
    });
  };

  // --- Categories & Shopping ---
  const addCategory = (c: Category) =>
    syncState({ ...state, categories: [...state.categories, c] });
  const updateCategory = (c: Category) =>
    syncState({
      ...state,
      categories: state.categories.map((cat) => (cat.id === c.id ? c : cat)),
    });

  const deleteCategory = (id: string) => {
    // 1. Update Transactions
    const newTxs = state.transactions.map((t) =>
      t.categoryId === id ? { ...t, categoryId: "uncategorized" } : t,
    );

    // 2. Remove Category
    const newCats = state.categories.filter((c) => c.id !== id);

    // 3. Update Shopping List
    const newShopping = state.shoppingList.map((s) =>
      s.categoryId === id ? { ...s, categoryId: "uncategorized" } : s,
    );

    // 4. Update Recurring Transactions
    const newRecurring = state.recurringTransactions.map((r) =>
      r.categoryId === id ? { ...r, categoryId: "uncategorized" } : r,
    );

    // 5. Update Budgets (Set to uncategorized instead of delete)
    const newBudgets = state.budgets.map((b) =>
      b.categoryId === id ? { ...b, categoryId: "uncategorized" } : b,
    );

    syncState({
      ...state,
      categories: newCats,
      transactions: newTxs,
      shoppingList: newShopping,
      recurringTransactions: newRecurring,
      budgets: newBudgets,
    });
  };

  const reorderCategories = (newOrder: Category[]) =>
    syncState({ ...state, categories: newOrder });

  const resetCategories = () => {
    // 1. Revert to default categories
    const newCats = DEFAULT_CATEGORIES;
    const defaultCatIds = new Set(newCats.map((c) => c.id));

    // 2. Identify categories being removed (those not in defaults)
    const removedCatIds = state.categories
      .filter((c) => !defaultCatIds.has(c.id))
      .map((c) => c.id);

    if (removedCatIds.length === 0) {
      syncState({ ...state, categories: newCats });
      return;
    }

    // 3. Update all linked entities to "uncategorized" if their category was removed
    const newTxs = state.transactions.map((t) =>
      removedCatIds.includes(t.categoryId)
        ? { ...t, categoryId: "uncategorized" }
        : t,
    );

    const newShopping = state.shoppingList.map((s) =>
      removedCatIds.includes(s.categoryId)
        ? { ...s, categoryId: "uncategorized" }
        : s,
    );

    const newRecurring = state.recurringTransactions.map((r) =>
      removedCatIds.includes(r.categoryId)
        ? { ...r, categoryId: "uncategorized" }
        : r,
    );

    const newBudgets = state.budgets.map((b) =>
      removedCatIds.includes(b.categoryId)
        ? { ...b, categoryId: "uncategorized" }
        : b,
    );

    syncState({
      ...state,
      categories: newCats,
      transactions: newTxs,
      shoppingList: newShopping,
      recurringTransactions: newRecurring,
      budgets: newBudgets,
    });
  };

  const addShoppingItem = (
    item: Omit<
      ShoppingItem,
      "id" | "status" | "createdAt" | "linkedTransactionIds"
    >,
  ) => {
    const newItem: ShoppingItem = {
      ...item,
      id: generateId(),
      status: "active",
      isBought: false, // Backward compatibility
      priority: item.priority || "medium",
      quantity: item.quantity || 1,
      linkedTransactionIds: [],
      createdAt: new Date().toISOString(),
      createdBy: user?.email || "User",
      lastModifiedBy: user?.email || "User",
    };
    syncState({ ...state, shoppingList: [newItem, ...state.shoppingList] });
  };

  const updateShoppingItem = (item: ShoppingItem) => {
    const oldItem = state.shoppingList.find((i) => i.id === item.id);
    syncState({
      ...state,
      shoppingList: state.shoppingList.map((i) =>
        i.id === item.id
          ? {
              ...oldItem,
              ...item,
              createdBy:
                oldItem?.createdBy || item.createdBy || user?.email || "User",
              lastModifiedBy: user?.email || "User",
            }
          : i,
      ),
    });
  };
  const deleteShoppingItem = (id: string) =>
    syncState({
      ...state,
      shoppingList: state.shoppingList.filter((i) => i.id !== id),
    });

  const markShoppingItemAsBought = (
    item: ShoppingItem,
    finalAmount: number,
    walletId: string,
    date: string,
    quantityBought: number = 1,
  ) => {
    // 1. Create Expense Transaction
    const newTx: Transaction = {
      id: generateId(),
      type: "expense",
      amount: finalAmount,
      date,
      note: `Bought: ${item.name} (Qty: ${quantityBought})`,
      fromWalletId: walletId,
      toWalletId: null,
      categoryId: item.categoryId,
      subCategoryId: item.subCategoryId,
      createdBy: user?.email || "User",
      lastModifiedBy: user?.email || "User",
    };

    // 2. Adjust Wallet Balance
    let { wallets: w1, goals: g1 } = adjustEntityBalance(
      state.wallets,
      state.goals,
      walletId,
      -finalAmount,
    );

    // 3. Update Shopping Item Status
    const remainingQty = (item.quantity || 1) - quantityBought;
    const newStatus = remainingQty <= 0 ? "purchased" : "partial";
    const linkedIds = [...(item.linkedTransactionIds || []), newTx.id];

    const updatedItem: ShoppingItem = {
      ...item,
      status: newStatus,
      isBought: newStatus === "purchased", // Backward compatibility
      quantity: Math.max(0, remainingQty),
      linkedTransactionIds: linkedIds,
      convertedAt: newStatus === "purchased" ? date : item.convertedAt,
    };

    syncState({
      ...state,
      wallets: w1,
      goals: g1,
      transactions: [newTx, ...state.transactions],
      shoppingList: state.shoppingList.map((i) =>
        i.id === item.id ? updatedItem : i,
      ),
    });
  };

  const revertShoppingItemPurchase = (
    item: ShoppingItem,
    transactionId: string,
  ) => {
    const tx = state.transactions.find((t) => t.id === transactionId);
    if (!tx) return;

    // 1. Revert Balance
    let { wallets: w1, goals: g1 } = adjustEntityBalance(
      state.wallets,
      state.goals,
      tx.fromWalletId || "", // Assuming expense has fromWalletId
      tx.amount, // Add back the amount
    );

    // 2. Remove Transaction
    const newTransactions = state.transactions.filter(
      (t) => t.id !== transactionId,
    );

    // 3. Update Item Status
    // We don't know exact quantity reverted easily unless we parse Note or store it in Tx.
    // Use heuristic: if status was purchased, go back to active/partial.
    // Ideally, we should store metadata in Transaction. For now, simple revert: switch to 'active' if it was 'purchased'.
    // Or if we want to be precise, we need to know how much qty was bought in that tx.
    // For MVP, let's just set status to 'active' (or 'partial' if we knew).
    // Let's assume revert means "Undo last action". We can modify item to be active.
    // If we want to restore quantity, we'd need that info.
    // Let's parse quantity from note? "Bought: Name (Qty: X)"
    let qtyRestored = 1;
    const match = tx.note.match(/\(Qty: (\d+)\)/);
    if (match && match[1]) qtyRestored = parseInt(match[1]);

    const newLinkedIds = (item.linkedTransactionIds || []).filter(
      (id) => id !== transactionId,
    );
    const newStatus = "active"; // Revert always makes it active/partial. If no linked ids left -> active.

    const updatedItem: ShoppingItem = {
      ...item,
      status: newLinkedIds.length === 0 ? "active" : "partial",
      isBought: false,
      quantity: item.quantity + qtyRestored,
      linkedTransactionIds: newLinkedIds,
      convertedAt: newLinkedIds.length === 0 ? undefined : item.convertedAt,
    };

    syncState({
      ...state,
      wallets: w1,
      goals: g1,
      transactions: newTransactions,
      shoppingList: state.shoppingList.map((i) =>
        i.id === item.id ? updatedItem : i,
      ),
    });
  };

  // --- Budgets ---
  const addBudget = (budget: Omit<Budget, "id" | "createdAt">) => {
    const newBudget = {
      ...budget,
      id: generateId(),
      createdAt: new Date().toISOString(),
      createdBy: user?.email || "User",
      lastModifiedBy: user?.email || "User",
    };
    syncState({ ...state, budgets: [...state.budgets, newBudget] });
    logInHousehold("budget_create", { name: budget.name, amount: budget.amount });
  };
  const updateBudget = (budget: Budget) => {
    const oldBudget = state.budgets.find((b) => b.id === budget.id);
    syncState({
      ...state,
      budgets: state.budgets.map((b) =>
        b.id === budget.id
          ? {
              ...oldBudget,
              ...budget,
              createdBy:
                oldBudget?.createdBy ||
                budget.createdBy ||
                user?.email ||
                "User",
              lastModifiedBy: user?.email || "User",
            }
          : b,
      ),
    });
    logInHousehold("budget_edit", { name: budget.name, amount: budget.amount });
  };

  const deleteBudget = (id: string) => {
    const b = state.budgets.find((budget) => budget.id === id);
    syncState({ ...state, budgets: state.budgets.filter((b) => b.id !== id) });
    if (b) logInHousehold("budget_delete", { name: b.name });
  };

  // --- Goals ---
  const addGoal = (
    goalInput: Omit<
      Goal,
      "id" | "createdAt" | "goalWalletId" | "status" | "currentBalance"
    >,
  ) => {
    const goalId = generateId();

    // 2. Create Goal
    const newGoal: Goal = {
      ...goalInput,
      id: goalId,
      goalWalletId: "", // Removing hidden wallet dependency
      currentBalance: 0,
      status: "active",
      createdAt: new Date().toISOString(),
      createdBy: user?.email || "User",
      lastModifiedBy: user?.email || "User",
    };

    syncState({
      ...state,
      goals: [...state.goals, newGoal],
    });
    logInHousehold("goal_create", { name: goalInput.name, targetAmount: goalInput.targetAmount });
  };

  const updateGoal = (goal: Goal) => {
    const oldGoal = state.goals.find((g) => g.id === goal.id);
    if (!oldGoal) return;

    // Check if target reached to auto-complete
    const status =
      goal.targetAmount <= goal.currentBalance ? "achieved" : goal.status;

    const updatedGoals = state.goals.map((g) =>
      g.id === goal.id
        ? {
            ...oldGoal,
            ...goal,
            status,
            lastModifiedBy: user?.email || "User",
          }
        : g,
    );

    syncState({
      ...state,
      goals: updatedGoals,
    });
    logInHousehold("goal_edit", { name: goal.name, targetAmount: goal.targetAmount });
  };

  const deleteGoal = (
    id: string,
    options: { mode: "convert" | "return"; targetWalletId?: string },
  ) => {
    const goal = state.goals.find((g) => g.id === id);
    if (!goal) return;

    let nextWallets = [...state.wallets];
    let nextTransactions = [...state.transactions];

    if (
      options.mode === "return" &&
      goal.currentBalance !== 0 &&
      options.targetWalletId
    ) {
      // Create a final transfer transaction
      const returnTx: Transaction = {
        id: generateId(),
        type: "transfer",
        amount: goal.currentBalance,
        fromWalletId: goal.id,
        toWalletId: options.targetWalletId,
        categoryId: "cat_transfer",
        note: `Goal '${goal.name}' Deleted - Balance Returned`,
        date: new Date().toISOString(),
        createdBy: "System",
        lastModifiedBy: "System",
      };
      nextTransactions = [returnTx, ...nextTransactions];

      // Adjust target wallet balance
      nextWallets = nextWallets.map((w) =>
        w.id === options.targetWalletId
          ? { ...w, balance: w.balance + goal.currentBalance }
          : w,
      );
    }

    syncState({
      ...state,
      goals: state.goals.filter((g) => g.id !== id),
      wallets: nextWallets,
      transactions: nextTransactions,
    });
    logInHousehold("goal_delete", { name: goal.name });
  };

  // --- Recurring ---
  const addRecurringTransaction = (
    rule: Omit<RecurringTransaction, "id" | "createdAt" | "userId">,
  ) => {
    if (!user) return;
    const newRule: RecurringTransaction = {
      ...rule,
      id: generateId(),
      userId: user.uid,
      createdAt: new Date().toISOString(),
    };
    syncState({
      ...state,
      recurringTransactions: [...state.recurringTransactions, newRule],
    });
  };

  const updateRecurringTransaction = (
    rule: Partial<RecurringTransaction> & { id: string },
  ) =>
    syncState({
      ...state,
      recurringTransactions: state.recurringTransactions.map((r) =>
        r.id === rule.id ? { ...r, ...rule } : r,
      ),
    });

  const updateRecurringTransactionWithHistory = (
    rule: Partial<RecurringTransaction> & { id: string },
  ) => {
    const existingRule = state.recurringTransactions.find(
      (r) => r.id === rule.id,
    );
    if (!existingRule) return;

    const mergedRule = { ...existingRule, ...rule };
    const linkedTransactions = state.transactions.filter(
      (t) => t.recurringId === rule.id,
    );

    let nextWallets = [...state.wallets];
    let nextGoals = [...state.goals];
    const updatedTransactions = new Map<string, Transaction>();
    const resolvedNote =
      mergedRule.note?.trim() ||
      mergedRule.name?.trim() ||
      existingRule.note?.trim() ||
      existingRule.name?.trim() ||
      "";

    const applyEffect = (tx: Transaction, direction: 1 | -1) => {
      if (tx.type === "income") {
        ({ wallets: nextWallets, goals: nextGoals } = adjustEntityBalance(
          nextWallets,
          nextGoals,
          tx.toWalletId,
          tx.amount * direction,
        ));
        return;
      }

      if (tx.type === "expense") {
        if (direction > 0) {
          const fromWallet = nextWallets.find((w) => w.id === tx.fromWalletId);
          if (
            fromWallet &&
            fromWallet.type === "cash" &&
            fromWallet.balance - tx.amount < 0
          ) {
            throw new Error(
              `Insufficient funds in Cash wallet '${fromWallet.name}'.`,
            );
          }
        }
        ({ wallets: nextWallets, goals: nextGoals } = adjustEntityBalance(
          nextWallets,
          nextGoals,
          tx.fromWalletId,
          -tx.amount * direction,
        ));
        return;
      }

      if (tx.type === "transfer") {
        if (direction > 0) {
          const fromWallet = nextWallets.find((w) => w.id === tx.fromWalletId);
          if (
            fromWallet &&
            fromWallet.type === "cash" &&
            fromWallet.balance - tx.amount < 0
          ) {
            throw new Error(
              `Insufficient funds in Cash wallet '${fromWallet.name}'.`,
            );
          }
        }
        ({ wallets: nextWallets, goals: nextGoals } = adjustEntityBalance(
          nextWallets,
          nextGoals,
          tx.fromWalletId,
          -tx.amount * direction,
        ));
        ({ wallets: nextWallets, goals: nextGoals } = adjustEntityBalance(
          nextWallets,
          nextGoals,
          tx.toWalletId,
          tx.amount * direction,
        ));
      }
    };

    linkedTransactions.forEach((oldTx) => {
      const updatedTx: Transaction = {
        ...oldTx,
        categoryId: mergedRule.categoryId,
        subCategoryId: mergedRule.subcategoryId,
        note: resolvedNote || oldTx.note,
        fromWalletId:
          mergedRule.type === "expense"
            ? mergedRule.walletId
            : oldTx.fromWalletId,
        toWalletId:
          mergedRule.type === "income"
            ? mergedRule.walletId
            : oldTx.toWalletId,
        lastModifiedBy: user?.email || "User",
      };

      applyEffect(oldTx, -1);
      applyEffect(updatedTx, 1);
      updatedTransactions.set(oldTx.id, updatedTx);
    });

    syncState({
      ...state,
      wallets: nextWallets,
      goals: nextGoals,
      transactions: state.transactions.map((t) =>
        updatedTransactions.get(t.id) || t,
      ),
      recurringTransactions: state.recurringTransactions.map((r) =>
        r.id === rule.id ? mergedRule : r,
      ),
    });
  };

  const confirmManualSubscriptionPayment = (sub: RecurringTransaction, note: string, nextDate: string) => {
    const newTx: Transaction = {
      id: Date.now().toString(),
      type: sub.type as TransactionType,
      amount: sub.amount,
      categoryId: sub.categoryId,
      subCategoryId: sub.subcategoryId,
      fromWalletId: sub.type === "expense" ? sub.walletId : null,
      toWalletId: sub.type === "income" ? sub.walletId : null,
      date: new Date().toISOString(),
      note,
      isRecurring: true,
      recurringId: sub.id,
      generatedFromRecurring: false,
      createdBy: user?.email || "User",
      lastModifiedBy: user?.email || "User",
    };

    let { wallets: w1, goals: g1 } = {
      wallets: state.wallets,
      goals: state.goals,
    };

    if (newTx.type === "income") {
      ({ wallets: w1, goals: g1 } = adjustEntityBalance(
        w1,
        g1,
        newTx.toWalletId,
        newTx.amount,
      ));
    } else if (newTx.type === "expense") {
      checkCashWalletBalance(newTx.fromWalletId, -newTx.amount);
      ({ wallets: w1, goals: g1 } = adjustEntityBalance(
        w1,
        g1,
        newTx.fromWalletId,
        -newTx.amount,
      ));
    }

    const updatedRules = state.recurringTransactions.map((rule) =>
      rule.id === sub.id
        ? {
            ...rule,
            nextDueDate: nextDate,
          }
        : rule,
    );

    syncState({
      ...state,
      transactions: [newTx, ...state.transactions],
      wallets: w1,
      goals: g1,
      recurringTransactions: updatedRules,
    });
    logInHousehold("transaction_add", { 
      amount: newTx.amount, 
      type: newTx.type,
      note: "Manual Subscription Payment"
    });
  };

  const syncEngineResults = (
    newTransactions: Transaction[],
    updatedRules: RecurringTransaction[],
    updatedWallets: Wallet[],
    updatedGoals: Goal[],
  ) => {
    let nextState = { ...state };

    if (newTransactions.length > 0) {
      const enrichedTxs = newTransactions.map((t, i) => ({
        ...t,
        id: `${Date.now()}-${i}`,
        userId: user?.uid || "unknown",
        createdAt: new Date().toISOString(),
        createdBy: "System (Recurring)",
        lastModifiedBy: "System",
      }));
      nextState.transactions = [...nextState.transactions, ...enrichedTxs];
    }

    if (updatedWallets.length > 0) {
      nextState.wallets = nextState.wallets.map((w) => {
        const found = updatedWallets.find((uw) => uw.id === w.id);
        return found ? { ...w, ...found } : w;
      });
    }

    if (updatedGoals.length > 0) {
      nextState.goals = nextState.goals.map((g) => {
        const found = updatedGoals.find((ug) => ug.id === g.id);
        return found ? { ...g, ...found } : g;
      });
    }

    if (updatedRules.length > 0) {
      nextState.recurringTransactions = nextState.recurringTransactions.map(
        (r) => {
          const found = updatedRules.find((ur) => ur.id === r.id);
          return found ? { ...r, ...found } : r;
        },
      );
    }

    syncState(nextState);
  };

  const deleteRecurringTransaction = (
    id: string,
    deleteGenerated: boolean = false,
  ) => {
    let newState = { ...state };

    // 1. Delete associated transactions if requested
    if (deleteGenerated) {
      const linkedTxs = newState.transactions.filter(
        (t) => t.recurringId === id,
      );

      if (linkedTxs.length > 0) {
        let { wallets: w1, goals: g1 } = {
          wallets: newState.wallets,
          goals: newState.goals,
        };

        linkedTxs.forEach((tx) => {
          // Reverse balance effect
          if (tx.type === "income" && tx.toWalletId) {
            ({ wallets: w1, goals: g1 } = adjustEntityBalance(
              w1,
              g1,
              tx.toWalletId,
              -tx.amount,
            ));
          } else if (tx.type === "expense" && tx.fromWalletId) {
            ({ wallets: w1, goals: g1 } = adjustEntityBalance(
              w1,
              g1,
              tx.fromWalletId,
              tx.amount,
            ));
          } else if (
            tx.type === "transfer" &&
            tx.fromWalletId &&
            tx.toWalletId
          ) {
            ({ wallets: w1, goals: g1 } = adjustEntityBalance(
              w1,
              g1,
              tx.fromWalletId,
              tx.amount,
            ));
            ({ wallets: w1, goals: g1 } = adjustEntityBalance(
              w1,
              g1,
              tx.toWalletId,
              -tx.amount,
            ));
          }
        });

        newState.wallets = w1;
        newState.goals = g1;
        // Remove from list
        newState.transactions = newState.transactions.filter(
          (t) => t.recurringId !== id,
        );
      }
    }

    // 2. Remove rule
    newState.recurringTransactions = newState.recurringTransactions.filter(
      (r) => r.id !== id,
    );
    syncState(newState);
  };

  // --- Settings ---
  const setCurrency = (currency: string) => syncState({ ...state, currency });
  const toggleTheme = () => {
    const newTheme = state.theme === "light" ? "dark" : "light";
    // Note: We don't necessarily need to syncState (cloud) immediately if we want
    // it to be a local preference first, but syncing is fine too.
    // However, syncState calls setState again, so let's just use syncState
    // to keep it consistent with other settings.
    syncState({ ...state, theme: newTheme });
  };
  const setAccentTheme = (theme: string) => syncState({ ...state, accentTheme: theme });
  const setPremiumTheme = (premiumTheme: NonNullable<AppState["premiumTheme"]>) => {
    const nextTheme = premiumTheme === "classic" ? state.theme : "dark";
    syncState({ ...state, premiumTheme, theme: nextTheme });
  };
  const toggleHideAmounts = () =>
    syncState({ ...state, hideAmounts: !state.hideAmounts });
  const setDefaultWallet = (id: string) =>
    syncState({ ...state, defaultWalletId: id });
  const setNumberSystem = (system: "IN" | "INTL" | "AUTO") =>
    syncState({ ...state, numberSystem: system });
  const setLanguage = (lang: string) => syncState({ ...state, language: lang });
  const resetData = () => syncState(INITIAL_STATE);

  const formatAmount = (amount: number) => {
    let locale = "en-US";
    const indianCurrencies = ["INR", "PKR", "BDT", "NPR", "LKR"];
    const sys = state.numberSystem || "AUTO";
    if (
      sys === "IN" ||
      (sys === "AUTO" && indianCurrencies.includes(state.currency))
    )
      locale = "en-IN";
    return formatCurrency(amount, state.currency, state.hideAmounts, locale);
  };

  const deleteCurrentUserData = async () => {
    if (!user || !user.uid) return;
    try {
      // Signal that we're deleting the account so the onSnapshot listener
      // doesn't trigger the onboarding wizard when the doc disappears.
      isDeletingAccountRef.current = true;
      await deleteDoc(doc(db, "users", user.uid));
      // Don't reset local state here — the subsequent auth deletion + signout
      // will take care of clearing everything.
    } catch (e) {
      isDeletingAccountRef.current = false;
      console.error("Failed to delete user data:", e);
      throw new Error("Failed to delete your data from the server.");
    }
  };

  const updateNavPreferences = (prefs: {
    mobilePinned: string[];
    tabletPinned: string[];
  }) => {
    syncState({ ...state, navPreferences: prefs });
  };

  const updateDashboardWidgets = (widgets: DashboardWidgetConfig[]) => {
    syncState({ ...state, dashboardWidgets: widgets });
  };

  const updateAnalyticsWidgets = (widgets: AnalyticsWidgetConfig[]) => {
    syncState({ ...state, analyticsWidgets: widgets });
  };

  const updateAnalyticsSectionNames = (names: Record<string, string>) => {
    syncState({ ...state, analyticsSectionNames: names });
  };

  return (
    <DataContext.Provider
      value={{
        ...state,
        systemStatus,
        retryConnection,
        isLoadingData,
        isOnboarding,
        completeOnboarding,
        completeTour,
        addTransaction,
        updateTransaction,
        updateMultipleTransactions,
        addMultipleTransactions,
        deleteTransaction,
        deleteMultipleTransactions,
        addWallet,
        updateWallet,
        deleteWallet,
        archiveWallet,
        deleteWalletWithTransactions,
        moveWalletTransactions,
        importData,
        addCategory,
        updateCategory,
        deleteCategory,
        reorderCategories,
        addShoppingItem,
        updateShoppingItem,
        deleteShoppingItem,
        markShoppingItemAsBought,
        revertShoppingItemPurchase,
        addBudget,
        updateBudget,
        deleteBudget,
        addGoal,
        updateGoal,
        deleteGoal,
        addRecurringTransaction,
        updateRecurringTransaction,
        updateRecurringTransactionWithHistory,
        deleteRecurringTransaction,
        confirmManualSubscriptionPayment,
        syncEngineResults,
        setCurrency,
        toggleTheme,
        setAccentTheme,
        setPremiumTheme,
        toggleHideAmounts,
        setDefaultWallet,
        setNumberSystem,
        resetCategories,
        resetData,
        deleteCurrentUserData,
        formatAmount,
        updateNavPreferences,
        updateDashboardWidgets,
        updateAnalyticsWidgets,
        updateAnalyticsSectionNames,
        setLanguage,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error("useData must be used within DataProvider");
  return context;
};





