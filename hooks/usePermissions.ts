import { useAuth } from "../context/AuthContext";
import { HouseholdRole, HouseholdMember } from "../types";
import { getUserRole, getPermissions } from "../utils/permissions";

/**
 * React hook for role-based permission checks in the current workspace.
 * In personal mode, all permissions are granted (full access).
 */
export const usePermissions = (
  workspaceType: "personal" | "household",
  members: HouseholdMember[],
) => {
  const { user } = useAuth();

  if (workspaceType === "personal" || !user) {
    return {
      role: "owner" as HouseholdRole,
      canManageHousehold: true,
      canDeleteHousehold: true,
      canManageMembers: true,
      canManageWallets: true,
      canManageBudgets: true,
      canManageGoals: true,
      canEditTransactions: true,
      canManageRecurring: true,
      canManageShopping: true,
      canViewData: true,
      isPersonal: true,
    };
  }

  const role = getUserRole(members, user.uid);
  const perms = getPermissions(role);

  return {
    role,
    canManageHousehold: perms.manageHousehold,
    canDeleteHousehold: perms.deleteHousehold,
    canManageMembers: perms.manageMembers,
    canManageWallets: perms.manageWallets,
    canManageBudgets: perms.manageBudgets,
    canManageGoals: perms.manageGoals,
    canEditTransactions: perms.editTransactions,
    canManageRecurring: perms.manageRecurring,
    canManageShopping: perms.manageShopping,
    canViewData: perms.viewData,
    isPersonal: false,
  };
};
