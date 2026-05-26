import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { X, Target, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import CustomSelect from "./CustomSelect";
import CustomDatePicker from "./CustomDatePicker";
import IconPicker from "./IconPicker";
import { COLORS } from "../constants";
import { cn } from "../utils";
import { useEscapeKey } from "../hooks/useEscapeKey";
import { useScrollToError } from "../hooks/useScrollToError";

const MotionDiv = motion.div as any;

interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingGoal: any;
  onSubmit: (payload: any) => void;
}

export const GoalModal: React.FC<GoalModalProps> = ({
  isOpen,
  onClose,
  editingGoal,
  onSubmit,
}) => {
  const { t } = useTranslation();
  useEscapeKey(isOpen, onClose);

  // Form states
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [deadline, setDeadline] = useState("");
  const [color, setColor] = useState("#10b981");
  const [icon, setIcon] = useState("Target");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [error, setError] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  useScrollToError(error, scrollRef);

  // Sync state with editing goal
  useEffect(() => {
    if (isOpen) {
      if (editingGoal) {
        setName(editingGoal.name || "");
        setTargetAmount(editingGoal.targetAmount?.toString() || "");
        setDeadline(editingGoal.deadline || "");
        setColor(editingGoal.color || "#10b981");
        setIcon(editingGoal.icon || "Target");
        setPriority(editingGoal.priority || "medium");
      } else {
        setName("");
        setTargetAmount("");
        setDeadline("");
        setColor("#10b981");
        setIcon("Target");
        setPriority("medium");
      }
      setError("");
    }
  }, [isOpen, editingGoal]);

  const handleSaveGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setError("Goal name is required.");
    if (!targetAmount || parseFloat(targetAmount) <= 0)
      return setError("Valid target amount is required.");

    onSubmit({
      name: name.trim(),
      targetAmount: parseFloat(targetAmount),
      deadline: deadline || undefined,
      color,
      icon,
      priority,
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <MotionDiv
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm tour-modal-overlay"
            onClick={onClose}
          />
          <MotionDiv
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            transition={{ type: "spring", duration: 0.3 }}
            className="bg-white dark:bg-zinc-900 rounded-[2.5rem] w-full max-w-lg relative z-10 shadow-2xl border border-slate-100 dark:border-white/10 overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="p-8 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50 dark:bg-black/50">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-brand-500/10 text-brand-500 flex items-center justify-center shadow-inner">
                  <Target size={22} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-800 dark:text-zinc-100">
                    {editingGoal
                      ? t("goals.editGoalDetails")
                      : t("goals.newSavingsGoal")}
                  </h2>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-200 dark:hover:bg-zinc-800 rounded-full transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-white"
                title="Close"
              >
                <X size={24} />
              </button>
            </div>

            {/* Scrollable Content */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-6">
              {error && (
                <div className="p-4 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 text-sm font-bold rounded-2xl flex items-center gap-2">
                  <AlertCircle size={18} /> {error}
                </div>
              )}

              <form id="goalForm" onSubmit={handleSaveGoal} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                    {t("goals.goalName")}
                  </label>
                  <input
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setError("");
                    }}
                    className="tour-goal-name w-full p-4 bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-2xl outline-none focus:ring-2 focus:ring-brand-500/20 transition-all font-medium"
                    placeholder="e.g. New Apartment Fund"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                      {t("goals.targetAmount")}
                    </label>
                    <input
                      type="number"
                      value={targetAmount}
                      onChange={(e) => {
                        setTargetAmount(e.target.value);
                        setError("");
                      }}
                      className="tour-goal-amount w-full p-4 bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-2xl outline-none font-bold"
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <CustomSelect
                      label={t("goals.priority")}
                      value={priority}
                      onChange={(val) => setPriority(val as any)}
                      options={[
                        { value: "low", label: t("goals.low") },
                        { value: "medium", label: t("goals.medium") },
                        { value: "high", label: t("goals.high") },
                      ]}
                    />
                  </div>
                </div>

                <CustomDatePicker
                  value={deadline}
                  onChange={setDeadline}
                  label={t("goals.targetDeadline")}
                  className="bg-slate-50 dark:bg-black border-slate-200 dark:border-zinc-800 rounded-2xl"
                />

                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                    {t("goals.identityAesthetic")}
                  </label>
                  <div className="flex gap-2 flex-wrap mb-4">
                    {COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setColor(c)}
                        className={cn(
                          "w-8 h-8 rounded-full border-2 transition-all",
                          color === c
                            ? "border-slate-400 scale-110"
                            : "border-transparent",
                        )}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                  <IconPicker selectedIcon={icon} onSelect={setIcon} />
                </div>
              </form>
            </div>

            {/* Footer */}
            <div className="p-8 border-t border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-black/50 flex justify-end gap-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-4 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white border border-slate-200 dark:border-zinc-700 rounded-2xl font-bold hover:bg-slate-50 dark:hover:bg-zinc-700 transition-colors"
              >
                {t("common.cancel")}
              </button>
              <button
                type="submit"
                form="goalForm"
                className="flex-[2] py-4 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl font-bold shadow-xl shadow-brand-500/20 hover:scale-[1.02] active:scale-95 transition-all"
              >
                {editingGoal
                  ? t("goals.updateGoal")
                  : t("goals.createGoalWallet")}
              </button>
            </div>
          </MotionDiv>
        </div>
      )}
    </AnimatePresence>
  );
};
