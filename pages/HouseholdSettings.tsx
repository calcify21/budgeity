import React, { useState } from "react";
import { useHousehold } from "../context/HouseholdContext";
import { useAuth } from "../context/AuthContext";
import { usePermissions } from "../hooks/usePermissions";
import MemberManagementPanel from "../components/MemberManagementPanel";
import ActivityLogViewer from "../components/ActivityLogViewer";
import IconPicker from "../components/IconPicker";
import {
  Settings,
  Users,
  Activity,
  Trash2,
  LogOut,
  Edit3,
  Shield,
  ArrowLeft,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ICON_MAP } from "../utils";

const HouseholdSettings: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const {
    activeWorkspace,
    currentHousehold,
    currentMembers,
    updateHousehold,
    deleteHousehold,
    leaveHousehold,
  } = useHousehold();

  const perms = usePermissions(activeWorkspace.type, currentMembers);

  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(currentHousehold?.name || "");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [activeTab, setActiveTab] = useState<"members" | "activity">("members");

  if (activeWorkspace.type !== "household" || !currentHousehold) {
    return (
      <div className="p-6 text-center">
        <p className="text-slate-500 text-lg">
          Switch to a household workspace to manage settings.
        </p>
        <button
          onClick={() => navigate("/dashboard")}
          className="mt-4 px-6 py-2 bg-brand-600 text-white rounded-2xl font-semibold"
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  const handleSaveName = async () => {
    if (nameInput.trim() && nameInput !== currentHousehold.name) {
      await updateHousehold(currentHousehold.id, { name: nameInput.trim() });
    }
    setEditingName(false);
  };

  const handleIconChange = async (newIcon: string) => {
    await updateHousehold(currentHousehold.id, { icon: newIcon });
    setShowIconPicker(false);
  };

  const handleDelete = async () => {
    await deleteHousehold(currentHousehold.id);
    navigate("/dashboard");
  };

  const handleLeave = async () => {
    await leaveHousehold(currentHousehold.id);
    navigate("/dashboard");
  };

  const roleBadge = perms.role || "viewer";

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          {editingName && perms.canManageHousehold ? (
            <div className="flex items-center gap-2">
              <input
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className="text-2xl font-bold bg-transparent border-b-2 border-brand-500 outline-none"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
              />
              <button
                onClick={handleSaveName}
                className="px-3 py-1 bg-brand-600 text-white text-sm rounded-xl font-semibold"
              >
                Save
              </button>
              <button
                onClick={() => setEditingName(false)}
                className="px-3 py-1 bg-slate-200 dark:bg-white/10 text-sm rounded-xl font-semibold"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="relative">
                <span
                  className={`text-3xl flex items-center justify-center w-12 h-12 bg-slate-100 dark:bg-white/5 rounded-2xl ${perms.canManageHousehold ? "cursor-pointer hover:bg-slate-200 dark:hover:bg-white/10 transition-colors" : ""}`}
                  onClick={() => perms.canManageHousehold && setShowIconPicker(!showIconPicker)}
                  title={perms.canManageHousehold ? "Click to change icon" : undefined}
                >
                  {(() => {
                    const IconComp = currentHousehold.icon
                      ? ICON_MAP[currentHousehold.icon]
                      : null;
                    return IconComp ? (
                      <IconComp size={28} className="text-brand-500" />
                    ) : (
                      currentHousehold.icon || "🏠"
                    );
                  })()}
                </span>
                {showIconPicker && (
                  <div className="absolute top-full left-0 mt-2 z-50 bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 p-4 w-72">
                    <IconPicker
                      selectedIcon={currentHousehold.icon || "Home"}
                      onSelect={handleIconChange}
                    />
                  </div>
                )}
              </div>
              <h1 className="text-2xl font-bold">{currentHousehold.name}</h1>
              {perms.canManageHousehold && (
                <button
                  onClick={() => {
                    setNameInput(currentHousehold.name);
                    setEditingName(true);
                  }}
                  className="p-1.5 rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-slate-200"
                >
                  <Edit3 size={14} />
                </button>
              )}
            </div>
          )}
          <div className="flex items-center gap-2 mt-1">
            <Shield size={14} className="text-brand-500" />
            <span className="text-sm text-slate-500 capitalize font-medium">
              Your role: {roleBadge}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab("members")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold transition-all ${
            activeTab === "members"
              ? "bg-brand-600 text-white"
              : "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400"
          }`}
        >
          <Users size={16} />
          Members
        </button>
        <button
          onClick={() => setActiveTab("activity")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold transition-all ${
            activeTab === "activity"
              ? "bg-brand-600 text-white"
              : "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400"
          }`}
        >
          <Activity size={16} />
          Activity
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "members" && (
        <MemberManagementPanel
          household={currentHousehold}
          currentUserUid={user?.uid || ""}
        />
      )}
      {activeTab === "activity" && (
        <ActivityLogViewer householdId={currentHousehold.id} />
      )}

      {/* Danger Zone */}
      <div className="p-6 bg-rose-50 dark:bg-rose-500/5 rounded-[2rem] border border-rose-200 dark:border-rose-500/20 space-y-4">
        <h3 className="text-lg font-bold text-rose-600">Danger Zone</h3>

        {perms.canDeleteHousehold ? (
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-slate-800 dark:text-slate-200">
                Delete Household
              </p>
              <p className="text-sm text-slate-500">
                Permanently delete this household and all its data
              </p>
            </div>
            {showDeleteConfirm ? (
              <div className="flex gap-2">
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-rose-600 text-white rounded-xl text-sm font-semibold"
                >
                  Confirm Delete
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 bg-slate-200 dark:bg-white/10 rounded-xl text-sm font-semibold"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-rose-100 dark:bg-rose-500/10 text-rose-600 rounded-xl text-sm font-semibold hover:bg-rose-200"
              >
                <Trash2 size={14} />
                Delete
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-slate-800 dark:text-slate-200">
                Leave Household
              </p>
              <p className="text-sm text-slate-500">
                Remove yourself from this household
              </p>
            </div>
            {showLeaveConfirm ? (
              <div className="flex gap-2">
                <button
                  onClick={handleLeave}
                  className="px-4 py-2 bg-rose-600 text-white rounded-xl text-sm font-semibold"
                >
                  Confirm Leave
                </button>
                <button
                  onClick={() => setShowLeaveConfirm(false)}
                  className="px-4 py-2 bg-slate-200 dark:bg-white/10 rounded-xl text-sm font-semibold"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowLeaveConfirm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-rose-100 dark:bg-rose-500/10 text-rose-600 rounded-xl text-sm font-semibold hover:bg-rose-200"
              >
                <LogOut size={14} />
                Leave
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default HouseholdSettings;
