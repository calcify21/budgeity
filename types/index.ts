export type TransactionType = "income" | "expense" | "transfer";
export type WalletType = "cash" | "bank" | "savings";
export type RecurringFrequency = "daily" | "weekly" | "monthly" | "yearly";
export type SpendingNature = "must" | "need" | "want";
export type TimeRange =
  | "this_month"
  | "last_month"
  | "last_30_days"
  | "last_3_months"
  | "last_6_months"
  | "this_year"
  | "last_year"
  | "all_time"
  | "custom";

// ── Ownership Model ──────────────────────────────────────────────────
export type OwnerType = "user" | "household";

export interface OwnerRef {
  ownerType: OwnerType;
  ownerId: string;
}

// ── RBAC ─────────────────────────────────────────────────────────────
export type HouseholdRole = "owner" | "admin" | "member" | "viewer";
export type MemberStatus = "active" | "pending" | "removed";

export interface HouseholdMember {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  avatarBase64?: string | null;
  role: HouseholdRole;
  joinedAt: string;
  status: MemberStatus;
}

// ── Household ────────────────────────────────────────────────────────
export interface Household {
  id: string;
  name: string;
  createdBy: string; // uid
  createdAt: string;
  members: HouseholdMember[];
  memberUids: string[]; // for simpler security rules
  memberRoles: Record<string, HouseholdRole>; // for RBAC in rules
  currency: string;
  icon?: string;
}

export interface HouseholdInvite {
  id: string;
  householdId: string;
  householdName: string;
  invitedEmail: string;
  invitedBy: string; // uid
  invitedByName: string;
  role: HouseholdRole;
  createdAt: string;
  expiresAt: string;
  status: "pending" | "accepted" | "expired";
}

// ── Activity Log ─────────────────────────────────────────────────────
export type ActivityActionType =
  | "transaction_add"
  | "transaction_edit"
  | "transaction_delete"
  | "wallet_create"
  | "wallet_edit"
  | "wallet_archive"
  | "wallet_delete"
  | "budget_create"
  | "budget_edit"
  | "budget_delete"
  | "goal_create"
  | "goal_edit"
  | "goal_delete"
  | "member_join"
  | "member_leave"
  | "member_remove"
  | "member_invite"
  | "member_invite_decline"
  | "member_invite_cancel"
  | "role_change"
  | "household_create"
  | "household_edit"
  | "household_delete";

export interface ActivityLog {
  id: string;
  actorUid: string;
  actorName: string;
  actionType: ActivityActionType;
  metadata: Record<string, any>;
  timestamp: string;
}

// ── Workspace Context ────────────────────────────────────────────────
export interface Workspace {
  type: "personal" | "household";
  id: string; // uid for personal, householdId for household
  name: string;
}

// ── Core Entities ────────────────────────────────────────────────────
export interface Wallet {
  id: string;
  name: string;
  type: WalletType;
  balance: number;
  color: string;
  createdAt: string;
  archived?: boolean;
  ownerId?: string;
  createdBy?: string;
  lastModifiedBy?: string;
  isGoalWallet?: boolean;
  goalId?: string;
  icon?: string;
}

export interface SubCategory {
  id: string;
  name: string;
}

export interface Category {
  id: string;
  name: string;
  type: "income" | "expense" | "transfer";
  icon: string;
  color: string;
  subCategories?: SubCategory[];
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  fromWalletId: string | null;
  toWalletId: string | null;
  categoryId: string;
  subCategoryId?: string;
  note: string;
  date: string;
  isRecurring?: boolean;
  recurringRuleId?: string; // Legacy recurring ID support
  recurringId?: string; // New recurring engine ID
  generatedFromRecurring?: boolean; // Exact duplicate prevention flag
  createdBy?: string;
  lastModifiedBy?: string;
  spendingNature?: SpendingNature;
}

export interface RecurringTransaction {
  id: string;
  userId: string;
  type: "income" | "expense";
  amount: number;
  name?: string;
  note?: string;
  categoryId: string;
  subcategoryId?: string;
  walletId: string;
  frequency: "daily" | "weekly" | "monthly" | "yearly" | "custom";
  interval?: number;
  startDate: string;
  endDate?: string;
  nextDueDate: string;
  autoAdd: boolean;
  isActive: boolean;
  createdAt: string;
}

export type GoalPriority = "low" | "medium" | "high";

export interface Goal {
  id: string;
  name: string;
  ownerType: "user" | "household";
  ownerId: string; // userId or householdId
  targetAmount: number;
  currentBalance: number;
  deadline?: string;
  color: string;
  icon: string;
  goalWalletId: string;
  status: "active" | "achieved" | "archived";
  priority: GoalPriority;
  createdAt: string;
  createdBy?: string;
  lastModifiedBy?: string;
}

export interface ShoppingItem {
  id: string;
  name: string;
  estimatedAmount: number;
  categoryId: string;
  subCategoryId?: string;
  walletId: string | null;
  status: "active" | "purchased" | "partial";
  isBought?: boolean; // Deprecated, kept for migration
  priority: "low" | "medium" | "high";
  quantity: number;
  dueDate?: string;
  createdAt: string;
  convertedAt?: string;
  linkedTransactionIds?: string[];
  createdBy?: string;
  lastModifiedBy?: string;
}

export interface Budget {
  id: string;
  name: string;
  amount: number;
  categoryId: string;
  subCategoryId?: string;
  walletId: string | null;
  period: "weekly" | "monthly" | "custom";
  customStartDate?: string;
  customEndDate?: string;
  color: string;
  createdAt: string;
  createdBy?: string;
  lastModifiedBy?: string;
}

export interface DashboardWidgetConfig {
  id: string;
  enabled: boolean;
  order: number;
}

export interface AnalyticsWidgetConfig {
  id: string;
  enabled: boolean;
  order: number;
}

export type PrimaryGoal =
  | "track_spending"
  | "save_goal"
  | "debt_free"
  | "build_wealth";

export interface OnboardingMeta {
  trackingMode?: "solo" | "shared";
  inviteEmail?: string;
  completedAt?: string;
}

export interface AppState {
  wallets: Wallet[];
  transactions: Transaction[];
  categories: Category[];
  shoppingList: ShoppingItem[];
  budgets: Budget[];
  goals: Goal[];
  recurringTransactions: RecurringTransaction[];
  currency: string;
  theme: "light" | "dark";
  premiumTheme?: "classic" | "midnightGlass" | "deepForest" | "aura";
  hideAmounts: boolean;
  defaultWalletId: string | null;
  numberSystem: "IN" | "INTL" | "AUTO";
  primaryGoal?: PrimaryGoal;
  onboardingMeta?: OnboardingMeta;
  tourCompleted?: boolean;
  navPreferences?: {
    mobilePinned: string[];
    tabletPinned: string[];
  };
  dashboardWidgets?: DashboardWidgetConfig[];
  analyticsWidgets?: AnalyticsWidgetConfig[];
  analyticsSectionNames?: Record<string, string>;
  accentTheme?: string;
  language?: string;
}
