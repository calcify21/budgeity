import React, { useState } from "react";
import { Household, HouseholdRole } from "../types";
import { useHousehold } from "../context/HouseholdContext";
import { usePermissions } from "../hooks/usePermissions";
import {
  getUserRole,
  canChangeRole,
  canRemoveMember,
} from "../utils/permissions";
import {
  UserPlus,
  MoreVertical,
  Crown,
  Shield,
  Eye,
  UserMinus,
  Send,
  X,
  ChevronDown,
} from "lucide-react";
import CustomSelect from "./CustomSelect";
import { useData } from "../context/DataContext";
import { cn } from "../utils";

interface MemberManagementPanelProps {
  household: Household;
  currentUserUid: string;
}

const ROLE_LABELS: Record<
  HouseholdRole,
  { label: string; color: string; icon: React.ReactNode }
> = {
  owner: {
    label: "Owner",
    color: "text-amber-600 bg-amber-50 dark:bg-amber-500/10",
    icon: <Crown size={12} />,
  },
  admin: {
    label: "Admin",
    color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10",
    icon: <Shield size={12} />,
  },
  member: {
    label: "Member",
    color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10",
    icon: <UserPlus size={12} />,
  },
  viewer: {
    label: "Viewer",
    color: "text-slate-600 bg-slate-50 dark:bg-slate-500/10",
    icon: <Eye size={12} />,
  },
};

const MemberManagementPanel: React.FC<MemberManagementPanelProps> = ({
  household,
  currentUserUid,
}) => {
  const {
    activeWorkspace,
    inviteMember,
    updateMemberRole,
    removeMember,
    householdInvites,
    cancelInvite,
  } = useHousehold();

  const activeMembers = household.members.filter((m) => m.status === "active");
  const perms = usePermissions(activeWorkspace.type, activeMembers);
  const currentUserRole = getUserRole(household.members, currentUserUid);

  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<HouseholdRole>("member");
  const [isSending, setIsSending] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const activeHouseholdInvites = householdInvites.filter(
    (inv) => inv.householdId === household.id,
  );

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setIsSending(true);
    try {
      await inviteMember(household.id, inviteEmail, inviteRole);
      setInviteEmail("");
      setShowInviteForm(false);
    } catch (e: any) {
      alert(e.message || "Failed to send invite");
    } finally {
      setIsSending(false);
    }
  };

  const handleRoleChange = async (uid: string, newRole: HouseholdRole) => {
    try {
      await updateMemberRole(household.id, uid, newRole);
    } catch (e: any) {
      alert(e.message || "Failed to update role");
    }
    setOpenMenuId(null);
  };

  const handleRemove = async (uid: string) => {
    if (!confirm("Remove this member from the household?")) return;
    try {
      await removeMember(household.id, uid);
    } catch (e: any) {
      alert(e.message || "Failed to remove member");
    }
    setOpenMenuId(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold">Members ({activeMembers.length})</h3>
        {perms.canManageMembers && (
          <button
            onClick={() => setShowInviteForm(!showInviteForm)}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-2xl text-sm font-semibold hover:bg-brand-700 transition-colors"
          >
            <UserPlus size={16} />
            Invite
          </button>
        )}
      </div>

      {/* Invite Form */}
      {showInviteForm && (
        <div className="p-4 bg-brand-50 dark:bg-brand-500/5 rounded-2xl border border-brand-200 dark:border-brand-500/20 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-brand-700 dark:text-brand-300">
              Invite Member
            </h4>
            <button
              onClick={() => setShowInviteForm(false)}
              className="p-1 rounded-lg hover:bg-brand-100"
            >
              <X size={16} />
            </button>
          </div>
          <div className="flex gap-2">
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="Enter email address..."
              className="flex-1 px-4 py-2.5 bg-white dark:bg-black/30 border border-slate-200 dark:border-white/10 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500"
              onKeyDown={(e) => e.key === "Enter" && handleInvite()}
            />
            <CustomSelect
              value={inviteRole}
              onChange={(val) => setInviteRole(val as any)}
              options={[
                { value: "member", label: "Member" },
                { value: "viewer", label: "Viewer" },
                ...(currentUserRole === "owner"
                  ? [{ value: "admin", label: "Admin" }]
                  : []),
              ]}
              className="min-w-[120px]"
            />
            <button
              onClick={handleInvite}
              disabled={isSending || !inviteEmail.trim()}
              className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-semibold hover:bg-brand-700 disabled:opacity-50"
            >
              <Send size={14} />
              Send
            </button>
          </div>
          <p className="text-xs text-slate-500">
            Invite expires in 7 days. The recipient must have a Budgeity account
            with this email.
          </p>
        </div>
      )}

      {/* Pending Invites */}
      {activeHouseholdInvites.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
            Pending Invites
          </h4>
          {activeHouseholdInvites.map((inv) => (
            <div
              key={inv.id}
              className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-500/5 rounded-2xl border border-amber-200 dark:border-amber-500/20"
            >
              <div>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  {inv.invitedEmail}
                </p>
                <p className="text-xs text-slate-500">
                  Invited as {inv.role} · Expires{" "}
                  {new Date(inv.expiresAt).toLocaleDateString()}
                </p>
              </div>
              {perms.canManageMembers && (
                <button
                  onClick={() => cancelInvite(inv.id)}
                  className="px-3 py-1.5 text-xs font-semibold text-rose-600 bg-rose-50 dark:bg-rose-500/10 rounded-lg hover:bg-rose-100"
                >
                  Cancel
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Members List */}
      <div className="space-y-2">
        {activeMembers.map((member) => {
          const roleInfo = ROLE_LABELS[member.role];
          const isCurrentUser = member.uid === currentUserUid;
          const canChange =
            currentUserRole &&
            canChangeRole(currentUserRole, member.role, "member");
          const canRemove =
            currentUserRole && canRemoveMember(currentUserRole, member.role);

          return (
            <div
              key={member.uid}
              className="flex items-center gap-3 p-3 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-white/5"
            >
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-600 to-brand-700 flex items-center justify-center text-white font-bold text-sm shrink-0 overflow-hidden relative">
                {(member.displayName || "?")[0].toUpperCase()}
                {member.avatarBase64 ? (
                  <img
                    src={member.avatarBase64}
                    alt={member.displayName}
                    className="absolute inset-0 w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                ) : (
                  member.photoURL &&
                  member.photoURL !== "undefined" &&
                  member.photoURL !== "null" && (
                    <img
                      src={member.photoURL}
                      alt={member.displayName}
                      referrerPolicy="no-referrer"
                      className="absolute inset-0 w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  )
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-slate-800 dark:text-white truncate">
                    {member.displayName}
                    {isCurrentUser && (
                      <span className="text-xs text-slate-400 ml-1">(you)</span>
                    )}
                  </p>
                </div>
                <p className="text-xs text-slate-500 truncate">
                  {member.email}
                </p>
              </div>

              {/* Role Badge */}
              <div
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold ${roleInfo.color}`}
              >
                {roleInfo.icon}
                {roleInfo.label}
              </div>

              {/* Actions */}
              {!isCurrentUser && (canChange || canRemove) && (
                <div className="relative">
                  <button
                    onClick={() =>
                      setOpenMenuId(
                        openMenuId === member.uid ? null : member.uid,
                      )
                    }
                    className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5"
                  >
                    <MoreVertical size={16} />
                  </button>
                  {openMenuId === member.uid && (
                    <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-zinc-800 rounded-xl shadow-lg border border-slate-200 dark:border-white/10 py-1 z-50">
                      {canChange && member.role !== "admin" && (
                        <button
                          onClick={() => handleRoleChange(member.uid, "admin")}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-white/5"
                        >
                          Make Admin
                        </button>
                      )}
                      {canChange && member.role !== "member" && (
                        <button
                          onClick={() => handleRoleChange(member.uid, "member")}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-white/5"
                        >
                          Make Member
                        </button>
                      )}
                      {canChange && member.role !== "viewer" && (
                        <button
                          onClick={() => handleRoleChange(member.uid, "viewer")}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-white/5"
                        >
                          Make Viewer
                        </button>
                      )}
                      {canRemove && (
                        <button
                          onClick={() => handleRemove(member.uid)}
                          className="w-full text-left px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/5"
                        >
                          <UserMinus size={14} className="inline mr-2" />
                          Remove
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MemberManagementPanel;
