import { HouseholdRole, HouseholdMember } from "../types";

// ── Permission Matrix ────────────────────────────────────────────────
const PERMISSION_MATRIX: Record<
  HouseholdRole,
  {
    manageHousehold: boolean;
    deleteHousehold: boolean;
    manageMembers: boolean;
    manageWallets: boolean;
    manageBudgets: boolean;
    manageGoals: boolean;
    editTransactions: boolean;
    manageRecurring: boolean;
    manageShopping: boolean;
    viewData: boolean;
  }
> = {
  owner: {
    manageHousehold: true,
    deleteHousehold: true,
    manageMembers: true,
    manageWallets: true,
    manageBudgets: true,
    manageGoals: true,
    editTransactions: true,
    manageRecurring: true,
    manageShopping: true,
    viewData: true,
  },
  admin: {
    manageHousehold: true,
    deleteHousehold: false,
    manageMembers: false,
    manageWallets: true,
    manageBudgets: true,
    manageGoals: true,
    editTransactions: true,
    manageRecurring: true,
    manageShopping: true,
    viewData: true,
  },
  member: {
    manageHousehold: false,
    deleteHousehold: false,
    manageMembers: false,
    manageWallets: false,
    manageBudgets: false,
    manageGoals: false,
    editTransactions: true,
    manageRecurring: false,
    manageShopping: true,
    viewData: true,
  },
  viewer: {
    manageHousehold: false,
    deleteHousehold: false,
    manageMembers: false,
    manageWallets: false,
    manageBudgets: false,
    manageGoals: false,
    editTransactions: false,
    manageRecurring: false,
    manageShopping: false,
    viewData: true,
  },
};

// ── Helpers ──────────────────────────────────────────────────────────
export const getUserRole = (
  members: HouseholdMember[],
  uid: string,
): HouseholdRole | null => {
  const member = members.find((m) => m.uid === uid && m.status === "active");
  return member?.role ?? null;
};

export const getPermissions = (role: HouseholdRole | null) => {
  if (!role) {
    return {
      manageHousehold: false,
      deleteHousehold: false,
      manageMembers: false,
      manageWallets: false,
      manageBudgets: false,
      manageGoals: false,
      editTransactions: false,
      manageRecurring: false,
      manageShopping: false,
      viewData: false,
    };
  }
  return PERMISSION_MATRIX[role];
};

// ── Specific Checks ──────────────────────────────────────────────────
export const canManageWallets = (role: HouseholdRole | null) =>
  getPermissions(role).manageWallets;

export const canEditTransactions = (role: HouseholdRole | null) =>
  getPermissions(role).editTransactions;

export const canManageMembers = (role: HouseholdRole | null) =>
  getPermissions(role).manageMembers;

export const canDeleteHousehold = (role: HouseholdRole | null) =>
  getPermissions(role).deleteHousehold;

export const canManageBudgets = (role: HouseholdRole | null) =>
  getPermissions(role).manageBudgets;

export const canManageGoals = (role: HouseholdRole | null) =>
  getPermissions(role).manageGoals;

export const canManageRecurring = (role: HouseholdRole | null) =>
  getPermissions(role).manageRecurring;

export const canManageShopping = (role: HouseholdRole | null) =>
  getPermissions(role).manageShopping;

export const canManageHousehold = (role: HouseholdRole | null) =>
  getPermissions(role).manageHousehold;

// ── Role Hierarchy (for promotion/demotion checks) ───────────────────
const ROLE_HIERARCHY: Record<HouseholdRole, number> = {
  viewer: 0,
  member: 1,
  admin: 2,
  owner: 3,
};

export const isRoleHigherOrEqual = (
  a: HouseholdRole,
  b: HouseholdRole,
): boolean => ROLE_HIERARCHY[a] >= ROLE_HIERARCHY[b];

export const canChangeRole = (
  actorRole: HouseholdRole,
  targetCurrentRole: HouseholdRole,
  newRole: HouseholdRole,
): boolean => {
  // Only owners can promote/demote
  if (actorRole !== "owner") return false;
  // Cannot change another owner's role
  if (targetCurrentRole === "owner") return false;
  // Cannot promote to owner
  if (newRole === "owner") return false;
  return true;
};

export const canRemoveMember = (
  actorRole: HouseholdRole,
  targetRole: HouseholdRole,
): boolean => {
  if (actorRole === "owner" && targetRole !== "owner") return true;
  return false;
};
