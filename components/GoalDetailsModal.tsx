import React from "react";
import { useTranslation } from "react-i18next";
import { Pencil, Trash2, X, Target, TrendingUp, Shield, Users, Clock, ArrowUpRight, ArrowDownLeft, ArrowLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn, formatDate, ICON_MAP } from "../utils";
import { calculateGoalDetailedStatus, calculateGoalPrediction, getContributorBreakdown } from "../utils/analytics";
import { useEscapeKey } from "../hooks/useEscapeKey";

const MotionDiv = motion.div as any;

interface GoalDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedGoal: any;
  transactions: any[];
  formatAmount: (v: number) => string;
  openModal: (goal: any) => void;
  setGoalToDelete: (id: string) => void;
  setReturnWalletId: (id: string) => void;
  availableWallets: any[];
  openWithdrawal: (goal: any) => void;
  openContribution: (goal: any) => void;
}

export const GoalDetailsModal: React.FC<GoalDetailsModalProps> = ({
  isOpen,
  onClose,
  selectedGoal,
  transactions,
  formatAmount,
  openModal,
  setGoalToDelete,
  setReturnWalletId,
  availableWallets,
  openWithdrawal,
  openContribution,
}) => {
  const { t } = useTranslation();

  // Escape key dismissal
  useEscapeKey(isOpen, onClose);

  if (!selectedGoal) return null;

  const stats = calculateGoalDetailedStatus(selectedGoal, transactions);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <MotionDiv
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          <MotionDiv
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            transition={{ type: "spring", duration: 0.3 }}
            className="bg-white dark:bg-zinc-900 rounded-[2.5rem] w-full max-w-lg relative z-10 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-100 dark:border-zinc-800"
          >
            <div className="p-8 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50 dark:bg-black/50">
              <div className="flex items-center gap-4">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-3xl shadow-lg"
                  style={{ backgroundColor: selectedGoal.color }}
                >
                  {React.createElement(
                    ICON_MAP[selectedGoal.icon] || Target,
                    { size: 32 },
                  )}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white truncate max-w-[200px]" title={selectedGoal.name}>
                    {selectedGoal.name}
                  </h2>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 font-medium">
                      {t("goals.goalAnalysis")}
                    </span>
                    {selectedGoal.status === "achieved" && (
                      <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 font-bold text-[10px] rounded-lg">
                        COMPLETED
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-200 dark:hover:bg-zinc-800 rounded-full transition-colors"
                title="Close"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-8">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-slate-50 dark:bg-white/5 p-6 rounded-[1.5rem] space-y-2 col-span-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase text-slate-400">
                      {t("goals.achievementPrediction")}
                    </span>
                    <TrendingUp size={16} className="text-emerald-500" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-black text-slate-900 dark:text-white">
                      {calculateGoalPrediction(
                        stats.remainingAmount,
                        stats.avgMonthly,
                      )}
                    </p>
                    <span className="text-sm text-slate-500 font-medium">
                      {t("goals.atCurrentVelocity")}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-white/5 p-6 rounded-[1.5rem] space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-400">
                    {t("goals.saved")}
                  </span>
                  <p className="text-xl font-bold">
                    {formatAmount(selectedGoal.currentBalance)}
                  </p>
                </div>
                <div className="bg-slate-50 dark:bg-white/5 p-6 rounded-[1.5rem] space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-400">
                    {t("goals.remaining")}
                  </span>
                  <p className="text-xl font-bold text-brand-600">
                    {formatAmount(
                      selectedGoal.targetAmount - selectedGoal.currentBalance,
                    )}
                  </p>
                </div>
              </div>

              {/* Projection Insight */}
              {selectedGoal.deadline &&
                selectedGoal.status !== "achieved" && (
                  <div className="bg-brand-50 dark:bg-brand-900/10 p-6 rounded-[1.5rem] border border-brand-100 dark:border-brand-900/20 space-y-3">
                    <h4 className="text-xs font-bold text-brand-600 dark:text-brand-400 uppercase tracking-widest flex items-center gap-2">
                      <Shield size={16} /> {t("goals.projectionInsight")}
                    </h4>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed">
                      {stats.avgMonthly >= stats.requiredMonthly
                        ? `You're currently over-saving by ${formatAmount(stats.avgMonthly - stats.requiredMonthly)}/month! You'll likely reach this goal ${calculateGoalPrediction(stats.remainingAmount, stats.avgMonthly)} ahead of schedule.`
                        : `You need to increase your monthly savings by ${formatAmount(stats.requiredMonthly - stats.avgMonthly)} to meet your deadline in ${stats.monthsRemaining} months.`}
                    </p>
                  </div>
                )}

              {/* Contributor Breakdown */}
              {selectedGoal.ownerType === "household" && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Users size={16} /> {t("goals.contributorShare")}
                  </h3>
                  <div className="space-y-3">
                    {getContributorBreakdown(
                      transactions,
                      selectedGoal.goalWalletId,
                    ).map((c, i) => (
                      <div key={i} className="space-y-2">
                        <div className="flex justify-between items-center text-sm">
                          <span className="font-bold text-slate-700 dark:text-slate-300">
                            {c.name}
                          </span>
                          <span className="font-bold">
                            {formatAmount(c.total)} (
                            {Math.round(c.percentage)}%)
                          </span>
                        </div>
                        <div className="h-2 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-brand-500 rounded-full"
                            style={{ width: `${c.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* History */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Clock size={16} /> {t("goals.recentTransfers")}
                </h3>
                <div className="space-y-3">
                  {transactions
                    .filter(
                      (t) =>
                        t.toWalletId === selectedGoal.id ||
                        t.fromWalletId === selectedGoal.id,
                    )
                    .slice(0, 10)
                    .map((tx) => {
                      const isContribution =
                        tx.toWalletId === selectedGoal.id;
                      return (
                        <div
                          key={tx.id}
                          className="p-4 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-white/5 rounded-2xl flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={cn(
                                "p-2 rounded-full",
                                isContribution
                                  ? "bg-emerald-500/10 text-emerald-500"
                                  : "bg-rose-500/10 text-rose-500",
                              )}
                            >
                              {isContribution ? (
                                <ArrowUpRight size={18} />
                              ) : (
                                <ArrowDownLeft size={18} />
                              )}
                            </div>
                            <div>
                              <p className="font-bold text-sm">
                                {isContribution
                                  ? t("goals.contribution")
                                  : t("goals.withdrawal")}
                              </p>
                              <p className="text-[10px] text-slate-500 font-medium">
                                {formatDate(tx.date)} • {tx.createdBy}
                              </p>
                            </div>
                          </div>
                          <span
                            className={cn(
                              "font-bold",
                              isContribution
                                ? "text-emerald-500"
                                : "text-rose-500",
                            )}
                          >
                            {isContribution ? "+" : "-"}
                            {formatAmount(tx.amount)}
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>

            <div className="p-8 border-t border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-black/50 space-y-4">
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setGoalToDelete(selectedGoal.id);
                    setReturnWalletId(availableWallets[0]?.id || "");
                    onClose();
                  }}
                  className="p-4 bg-rose-50 dark:bg-rose-900/10 text-rose-600 dark:text-rose-400 font-bold rounded-2xl hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-colors"
                  title={t("common.delete")}
                >
                  <Trash2 size={20} />
                </button>
                <button
                  onClick={() => {
                    openModal(selectedGoal);
                    onClose();
                  }}
                  className="p-4 bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-slate-300 font-bold rounded-2xl hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors"
                  title={t("common.edit")}
                >
                  <Pencil size={20} />
                </button>
                <button
                  onClick={() => {
                    openWithdrawal(selectedGoal);
                    onClose();
                  }}
                  className="flex-1 py-4 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white rounded-2xl font-bold hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  {t("goals.withdraw")}
                </button>
                <button
                  disabled={selectedGoal.status === "achieved"}
                  onClick={() => {
                    openContribution(selectedGoal);
                    onClose();
                  }}
                  className="flex-[1.5] py-4 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl font-bold shadow-xl shadow-brand-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                >
                  {t("goals.makeContribution")}
                </button>
              </div>

              <button
                onClick={onClose}
                className="w-full py-4 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white rounded-2xl font-bold hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2 text-sm"
              >
                {t("common.cancel")}
              </button>
            </div>
          </MotionDiv>
        </div>
      )}
    </AnimatePresence>
  );
};
