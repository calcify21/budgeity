import React, { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import CustomDatePicker from "../components/CustomDatePicker";
import CustomSelect from "../components/CustomSelect";
import { useData } from "../context/DataContext";
import { useHousehold } from "../context/HouseholdContext";
import { useAuth } from "../context/AuthContext";
import { Goal, Transaction, Wallet } from "../types";
import { cn, getCategoryIcon, ICON_MAP, formatDate } from "../utils";
import {
  calculateSavingsVelocity,
  calculateGoalDetailedStatus,
  getContributorBreakdown,
  calculateGoalPrediction,
} from "../utils/analytics";
import {
  Plus,
  Target,
  Pencil,
  Trash2,
  Calendar,
  Trophy,
  ArrowRight,
  X,
  ArrowDownLeft,
  ArrowUpRight,
  AlertCircle,
  Users,
  ArrowLeft,
  Check,
  TrendingUp,
  Clock,
  ChevronRight,
  Shield,
  Info,
} from "lucide-react";
import { useToast } from "../context/ToastContext";
import { motion, AnimatePresence } from "framer-motion";
import { ConfirmModal } from "../components/ConfirmModal";
import { GoalDetailsModal } from "../components/GoalDetailsModal";
import { GoalModal } from "../components/GoalModal";
import { COLORS } from "../constants";
import IconPicker from "../components/IconPicker";

const MotionDiv = motion.div as any;

const Goals: React.FC = () => {
  const { t } = useTranslation();
  const {
    goals,
    addGoal,
    updateGoal,
    deleteGoal,
    addTransaction,
    wallets,
    transactions,
    formatAmount,
    currency,
  } = useData();

  const { activeWorkspace, currentMembers, currentHousehold } = useHousehold();
  const { user } = useAuth();
  const { success, error: toastError } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const selectedGoal = useMemo(
    () => (selectedGoalId ? goals.find((g) => g.id === selectedGoalId) : null),
    [goals, selectedGoalId],
  );

  // Edit/Delete State
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [goalToDelete, setGoalToDelete] = useState<string | null>(null);
  const [deleteMode, setDeleteMode] = useState<"convert" | "return">("return");
  const [returnWalletId, setReturnWalletId] = useState("");

  // Transfer State
  const [transferAmount, setTransferAmount] = useState("");
  const [sourceWalletId, setSourceWalletId] = useState("");

  // Form State
  const [error, setError] = useState("");

  React.useEffect(() => {
    if (searchParams.get("add") === "true") {
      openModal();
      const newParams = new URLSearchParams(searchParams);
      newParams.delete("add");
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Auto-check for achieved goals
  React.useEffect(() => {
    goals.forEach((goal) => {
      const isAchieved = goal.currentBalance >= goal.targetAmount;
      if (goal.status === "active" && isAchieved) {
        updateGoal({ ...goal, status: "achieved" });
        success(`Goal Achieved: ${goal.name}! 🏆`);
      } else if (goal.status === "achieved" && !isAchieved) {
        updateGoal({ ...goal, status: "active" });
      }
    });
  }, [goals, updateGoal, success]);

  // Filter hidden goal wallets from contribution source
  const availableWallets = useMemo(
    () => wallets.filter((w) => !w.isGoalWallet && !w.archived),
    [wallets],
  );

  const openModal = (goal?: Goal) => {
    setEditingGoal(goal || null);
    setError("");
    setIsModalOpen(true);
  };

  const openContribution = (goal: Goal) => {
    setSelectedGoalId(goal.id);
    setTransferAmount("");
    setSourceWalletId(availableWallets[0]?.id || "");
    setError("");
    setIsTransferModalOpen(true);
    setTransferMode("deposit");
  };

  const [transferMode, setTransferMode] = useState<"deposit" | "withdraw">(
    "deposit",
  );

  const openWithdrawal = (goal: Goal) => {
    setSelectedGoalId(goal.id);
    setTransferAmount("");
    setSourceWalletId(availableWallets[0]?.id || "");
    setError("");
    setIsTransferModalOpen(true);
    setTransferMode("withdraw");
  };

  const handleSaveGoal = (payload: any) => {
    const fullPayload = {
      ...payload,
      ownerType: activeWorkspace.type as "user" | "household",
      ownerId: activeWorkspace.id,
    };

    try {
      if (editingGoal) {
        updateGoal({
          ...editingGoal,
          ...fullPayload,
        });
        success("Goal updated.");
      } else {
        addGoal(fullPayload);
        success("Goal created!");
      }
      setIsModalOpen(false);
    } catch (err: any) {
      toastError(err.message);
    }
  };

  const handleContribute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoal) return;
    const amount = parseFloat(transferAmount);
    if (!amount || amount <= 0) return setError("Enter a valid amount.");
    if (!sourceWalletId) return setError("Select a wallet.");

    try {
      if (transferMode === "deposit") {
        addTransaction({
          type: "transfer",
          amount,
          fromWalletId: sourceWalletId,
          toWalletId: selectedGoal.id,
          categoryId: "cat_transfer",
          note: `Goal Contribution: ${selectedGoal.name}`,
          date: new Date().toISOString(),
        });
        success(`Contributed ${formatAmount(amount)} to ${selectedGoal.name}`);
      } else {
        if (amount > selectedGoal.currentBalance) {
          return setError("Insufficient goal balance.");
        }
        addTransaction({
          type: "transfer",
          amount,
          fromWalletId: selectedGoal.id,
          toWalletId: sourceWalletId,
          categoryId: "cat_transfer",
          note: `Goal Withdrawal: ${selectedGoal.name}`,
          date: new Date().toISOString(),
        });
        success(`Withdrew ${formatAmount(amount)} from ${selectedGoal.name}`);
      }
      setIsTransferModalOpen(false);
      setSelectedGoalId(null);
    } catch (err: any) {
      toastError(err.message);
    }
  };

  const handleWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoal) return;
    const amount = parseFloat(transferAmount);
    if (!amount || amount <= 0) return setError("Enter a valid amount.");
    if (!sourceWalletId) return setError("Select a wallet.");

    try {
      addTransaction({
        type: "transfer",
        amount,
        fromWalletId: selectedGoal.id,
        toWalletId: sourceWalletId,
        categoryId: "cat_transfer",
        note: `Goal Withdrawal: ${selectedGoal.name}`,
        date: new Date().toISOString(),
      });
      success(`Withdrew ${formatAmount(amount)} from ${selectedGoal.name}`);
      setIsTransferModalOpen(false);
      setSelectedGoalId(null);
    } catch (err: any) {
      toastError(err.message);
    }
  };

  // Delete Logic
  const handleDeleteGoal = async () => {
    if (!goalToDelete) return;

    try {
      deleteGoal(goalToDelete, {
        mode: deleteMode,
        targetWalletId: deleteMode === "return" ? returnWalletId : undefined,
      });
      success("Goal deleted successfully");
      setGoalToDelete(null);
      setSelectedGoalId(null);
    } catch (err: any) {
      toastError(err.message);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            {t("goals.title")}
          </h2>
          <p className="text-slate-500 font-medium">{t("goals.subtitle")}</p>
        </div>
        <button
          onClick={() => openModal()}
          className="tour-goals-add flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-brand-500/20 hover:scale-[1.02] active:scale-95 transition-all"
        >
          <Plus size={20} /> {t("goals.createNewGoal")}
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {goals.length === 0 ? (
          <div className="col-span-full py-24 text-center bg-white dark:bg-zinc-900/50 rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-zinc-800 flex flex-col items-center gap-5">
            <div className="w-20 h-20 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center text-slate-300 dark:text-zinc-600">
              <Target size={40} strokeWidth={1.5} />
            </div>
            <div className="space-y-2">
              <p className="text-lg font-bold text-slate-900 dark:text-white">
                {t("goals.noActiveGoals")}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Set your first savings target and watch your money grow 🌱.
                Track progress and stay motivated.
              </p>
            </div>
            <button
              onClick={() => openModal()}
              className="px-6 py-3 bg-brand-600 text-white font-bold rounded-2xl hover:bg-brand-700 transition-colors shadow-lg shadow-brand-500/20"
            >
              {t("goals.createNewGoal")}
            </button>
          </div>
        ) : (
          goals.map((goal) => {
            const Icon = ICON_MAP[goal.icon] || Target;
            const progress = Math.min(
              (goal.currentBalance / goal.targetAmount) * 100,
              100,
            );
            const stats = calculateGoalDetailedStatus(goal, transactions);
            const isHouseholdGoal = goal.ownerType === "household";

            return (
              <MotionDiv
                key={goal.id}
                layout
                whileHover={{ y: -5 }}
                className="bg-white dark:bg-zinc-900 rounded-[2rem] p-6 shadow-sm border border-slate-200 dark:border-zinc-800 flex flex-col group relative overflow-hidden"
              >
                {/* Priority & Type Badges */}
                <div className="flex justify-between items-start mb-6 relative z-10">
                  <div className="flex gap-2">
                    <span
                      className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                        goal.priority === "high"
                          ? "bg-rose-100 text-rose-600 dark:bg-rose-900/30"
                          : goal.priority === "medium"
                            ? "bg-amber-100 text-amber-600 dark:bg-amber-900/30"
                            : "bg-slate-100 text-slate-500 dark:bg-zinc-800",
                      )}
                    >
                      {goal.priority} {t("goals.priority")}
                    </span>
                    {isHouseholdGoal && (
                      <span className="px-3 py-1 bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                        <Users size={10} /> {t("goals.household")}
                      </span>
                    )}
                  </div>

                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openModal(goal);
                      }}
                      className="p-2 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-colors text-slate-400"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setGoalToDelete(goal.id);
                        setReturnWalletId(availableWallets[0]?.id || "");
                      }}
                      className="p-2 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors text-rose-400"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Main Content */}
                <div className="flex items-center gap-4 mb-6">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg"
                    style={{ backgroundColor: goal.color }}
                  >
                    <Icon size={28} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-xl text-slate-900 dark:text-white truncate">
                      {goal.name}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                      {goal.deadline ? (
                        <span className="flex items-center gap-1">
                          <Calendar size={12} /> {formatDate(goal.deadline)}
                        </span>
                      ) : (
                        <span>{t("goals.ongoingGoal")}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Progress */}
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between items-end">
                    <div className="flex flex-col">
                      <span className="text-2xl font-black text-slate-900 dark:text-white">
                        {formatAmount(goal.currentBalance)}
                      </span>
                      <span className="text-xs text-slate-400 font-bold uppercase">
                        of {formatAmount(goal.targetAmount)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-black text-slate-900 dark:text-white">
                        {Math.round(progress)}%
                      </span>
                    </div>
                  </div>
                  <div className="h-3 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className="h-full rounded-full shadow-inner"
                      style={{
                        backgroundColor:
                          goal.status === "achieved" ? "#10b981" : goal.color,
                      }}
                    />
                  </div>
                </div>

                {/* Analytics Snapshot */}
                <div className="grid grid-cols-2 gap-4 py-4 border-y border-slate-100 dark:border-zinc-800 mb-6 font-medium">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                      {t("goals.reqMonthly")}
                    </span>
                    <p className="text-slate-900 dark:text-slate-100">
                      {formatAmount(stats.requiredMonthly)}
                    </p>
                  </div>
                  <div className="space-y-1 text-right">
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                      {t("goals.prediction")}
                    </span>
                    <p className="text-emerald-500 font-bold">
                      {calculateGoalPrediction(
                        stats.remainingAmount,
                        stats.avgMonthly,
                      )}
                    </p>
                  </div>
                </div>

                {/* Footer / Status */}
                <div className="flex items-center gap-2 mt-auto relative z-10 w-full">
                  <div
                    className={cn(
                      "px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5",
                      stats.status === "completed"
                        ? "bg-emerald-500/10 text-emerald-500"
                        : stats.status === "on_track"
                          ? "bg-blue-500/10 text-blue-500"
                          : stats.status === "at_risk"
                            ? "bg-amber-500/10 text-amber-500"
                            : "bg-rose-500/10 text-rose-500",
                    )}
                  >
                    <Clock size={14} />
                    {stats.status.replace("_", " ").toUpperCase()}
                  </div>

                  <div className="flex gap-2 ml-auto">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openWithdrawal(goal);
                      }}
                      className="p-2 bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-400 rounded-xl hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors"
                      title="Withdraw"
                    >
                      <ArrowLeft size={14} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openContribution(goal);
                      }}
                      disabled={goal.status === "achieved"}
                      className="flex items-center gap-2 py-2 px-4 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition-all hover:gap-3 disabled:opacity-50 disabled:gap-2 shadow-brand-500/20"
                    >
                      {t("goals.contribute")} <ChevronRight size={14} />
                    </button>
                  </div>
                </div>

                {/* Details Trigger Overlay */}
                <div
                  className="absolute inset-0 cursor-pointer z-0"
                  onClick={() => setSelectedGoalId(goal.id)}
                />
              </MotionDiv>
            );
          })
        )}
      </div>

      <GoalDetailsModal
        isOpen={!!selectedGoal && !isTransferModalOpen}
        onClose={() => setSelectedGoalId(null)}
        selectedGoal={selectedGoal}
        transactions={transactions}
        formatAmount={formatAmount}
        openModal={openModal}
        setGoalToDelete={setGoalToDelete}
        setReturnWalletId={setReturnWalletId}
        availableWallets={availableWallets}
        openWithdrawal={openWithdrawal}
        openContribution={openContribution}
      />

      {/* Goal Form Modal */}
      <GoalModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingGoal={editingGoal}
        onSubmit={handleSaveGoal}
      />

      {/* Contribution Modal */}
      <AnimatePresence>
        {isTransferModalOpen && selectedGoal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <MotionDiv
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-lg"
            onClick={() => setIsTransferModalOpen(false)}
          />
          <MotionDiv
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{
              type: "spring",
              damping: 20,
              stiffness: 220,
              mass: 0.8,
            }}
            className="bg-white dark:bg-zinc-900 rounded-[2.5rem] w-full max-w-md relative z-10 shadow-2xl border border-slate-100 dark:border-white/10 overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
              <div className="flex items-center gap-4 mb-8">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-white"
                  style={{ backgroundColor: selectedGoal?.color }}
                >
                  {React.createElement(ICON_MAP[selectedGoal?.icon || "Target"] || Target, {
                    size: 24,
                  })}
                </div>
                <div>
                  <h2 className="text-xl font-bold">
                    {transferMode === "deposit"
                      ? t("goals.moveFunds")
                      : t("goals.withdrawFunds")}
                  </h2>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">
                    {transferMode === "deposit"
                      ? t("goals.target")
                      : t("goals.source")}
                    : {selectedGoal?.name}
                  </p>
                </div>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 text-sm font-bold rounded-2xl flex items-center gap-2">
                  <AlertCircle size={18} /> {error}
                </div>
              )}

              <form onSubmit={handleContribute} className="space-y-6">
                <CustomSelect
                  label={
                    transferMode === "deposit"
                      ? t("goals.sourceWallet")
                      : t("goals.returnFundsTo")
                  }
                  value={sourceWalletId}
                  onChange={setSourceWalletId}
                  options={availableWallets.map((w) => ({
                    value: w.id,
                    label: w.name,
                    subLabel: formatAmount(w.balance),
                    color: w.color,
                  }))}
                />

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                    {t("goals.amountToTransfer")}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      value={transferAmount}
                      onChange={(e) => {
                        setTransferAmount(e.target.value);
                        setError("");
                      }}
                      className="w-full p-6 bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-2xl outline-none font-black text-3xl text-center pr-16"
                      placeholder="0.00"
                      autoFocus
                    />
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 font-bold text-xl">
                      {currency}
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-black/40 p-4 rounded-2xl flex gap-3 items-start">
                  <Shield
                    size={18}
                    className="text-emerald-500 shrink-0 mt-1"
                  />
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {transferMode === "deposit" ? (
                      <>
                        This will move money from{" "}
                        <strong>
                          {
                            availableWallets.find(
                              (w) => w.id === sourceWalletId,
                            )?.name
                          }
                        </strong>{" "}
                        to the hidden <strong>{selectedGoal?.name}</strong>{" "}
                        wallet.
                      </>
                    ) : (
                      <>
                        This will move money from{" "}
                        <strong>{selectedGoal?.name}</strong> to{" "}
                        <strong>
                          {
                            availableWallets.find(
                              (w) => w.id === sourceWalletId,
                            )?.name
                          }
                        </strong>
                        .
                      </>
                    )}{" "}
                    Analytics will treat this as a transfer, not an expense.
                  </p>
                </div>

                <button
                  type="submit"
                  className="w-full py-5 bg-brand-600 hover:bg-brand-700 text-white font-black rounded-2xl shadow-xl shadow-brand-500/20 hover:scale-[1.02] active:scale-95 transition-all mt-4"
                >
                  {t("goals.confirmTransfer")}
                </button>
              </form>
            </div>
          </MotionDiv>
        </div>
      )}
      </AnimatePresence>

      {/* Enhanced Delete Modal */}
      <ConfirmModal
        isOpen={!!goalToDelete}
        onClose={() => setGoalToDelete(null)}
        onConfirm={handleDeleteGoal}
        title={t("goals.destroyGoalSystem")}
        message={
          <div className="space-y-6 py-4">
            {(() => {
              const targetGoal = goals.find((g) => g.id === goalToDelete);
              if (targetGoal && targetGoal.currentBalance > 0) {
                return (
                  <>
                    <p className="text-slate-500 font-medium">
                      This goal has a remaining balance of{" "}
                      <strong>{formatAmount(targetGoal?.currentBalance || 0)}</strong>
                      . Please select a wallet to return the funds to before
                      deleting.
                    </p>

                    <CustomSelect
                      label={t("goals.returnPortfolioTo")}
                      value={returnWalletId}
                      onChange={setReturnWalletId}
                      options={availableWallets.map((w) => ({
                        value: w.id,
                        label: w.name,
                        subLabel: formatAmount(w.balance),
                        color: w.color,
                        icon: w.icon,
                      }))}
                    />
                  </>
                );
              }
              return (
                <p className="text-slate-500 font-medium">
                  Are you sure you want to delete this goal? This action cannot
                  be undone.
                </p>
              );
            })()}
          </div>
        }
        confirmText={t("goals.confirmDeletion")}
        isDestructive
      />
    </div>
  );
};

export default Goals;
