import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { X, Target, AlertCircle } from "lucide-react";
import { useData } from "../context/DataContext";
import { useHousehold } from "../context/HouseholdContext";
import { useToast } from "../context/ToastContext";
import { Goal } from "../types";
import { COLORS } from "../constants";
import IconPicker from "./IconPicker";
import CustomDatePicker from "./CustomDatePicker";
import { motion } from "framer-motion";
import { cn } from "../utils";

const MotionDiv = motion.div as any;

interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  goalToEdit?: Goal | null;
}

const GoalModal: React.FC<GoalModalProps> = ({ isOpen, onClose, goalToEdit }) => {
  const { t } = useTranslation();
  const { addGoal, updateGoal } = useData();
  const { activeWorkspace } = useHousehold();
  const { success, error: toastError } = useToast();

  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [deadline, setDeadline] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [icon, setIcon] = useState("Target");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [error, setError] = useState("");

  useEffect(() => {
    if (goalToEdit) {
      setName(goalToEdit.name);
      setTargetAmount(goalToEdit.targetAmount.toString());
      setDeadline(goalToEdit.deadline || "");
      setColor(goalToEdit.color);
      setIcon(goalToEdit.icon);
      setPriority(goalToEdit.priority);
    } else {
      setName("");
      setTargetAmount("");
      setDeadline("");
      setColor(COLORS[0]);
      setIcon("Target");
      setPriority("medium");
    }
    setError("");
  }, [goalToEdit, isOpen]);

  const handleSaveGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setError("Goal name is required.");
    const amount = parseFloat(targetAmount);
    if (!targetAmount || amount <= 0)
      return setError("Valid target amount is required.");

    const payload = {
      name,
      targetAmount: amount,
      deadline: deadline || undefined,
      color,
      icon,
      priority,
      ownerType: activeWorkspace.type as "user" | "household",
      ownerId: activeWorkspace.id,
    };

    try {
      if (goalToEdit) {
        updateGoal({
          ...goalToEdit,
          ...payload,
        });
        success("Goal updated.");
      } else {
        addGoal(payload);
        success("Goal created!");
      }
      onClose();
    } catch (err: any) {
      toastError(err.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <MotionDiv
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
        onClick={onClose}
      />
      <MotionDiv
        initial={{ opacity: 0, scale: 0.95, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 30 }}
        className="bg-white dark:bg-zinc-900 rounded-[2.5rem] w-full max-w-md relative z-10 shadow-2xl border border-slate-100 dark:border-white/10 overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              {goalToEdit ? t("goals.editGoalDetails") : t("goals.newSavingsGoal")}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 text-sm font-bold rounded-2xl flex items-center gap-2">
              <AlertCircle size={18} /> {error}
            </div>
          )}

          <form onSubmit={handleSaveGoal} className="space-y-6">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                {t("goals.goalName")}
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Dream Home"
                className="w-full p-4 bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-500 font-bold"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                  {t("goals.targetAmount")}
                </label>
                <input
                  type="number"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full p-4 bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-500 font-bold"
                />
              </div>
              <div>
                <CustomDatePicker
                  label={t("goals.targetDeadline")}
                  value={deadline}
                  onChange={setDeadline}
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                {t("goals.priority")}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(["low", "medium", "high"] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={cn(
                      "py-2.5 rounded-xl font-bold text-xs transition-all uppercase tracking-widest",
                      priority === p
                        ? "bg-brand-500 text-white shadow-lg shadow-brand-500/20"
                        : "bg-slate-50 dark:bg-zinc-800 text-slate-500 dark:text-zinc-500 hover:bg-slate-100",
                    )}
                  >
                    {t(`goals.${p}`)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">
                {t("goals.identityAesthetic")}
              </label>
              <div className="flex gap-4 items-center p-4 bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-2xl">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shrink-0"
                  style={{ backgroundColor: color }}
                >
                  <Target size={24} />
                </div>
                <div className="flex-1 space-y-4">
                  <div className="flex gap-2 flex-wrap">
                    {COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setColor(c)}
                        className={cn(
                          "w-6 h-6 rounded-full border-2 transition-transform hover:scale-125",
                          color === c
                            ? "border-slate-400 dark:border-white scale-110"
                            : "border-transparent",
                        )}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                  <IconPicker
                    selectedIcon={icon}
                    onSelect={setIcon}
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-black rounded-2xl font-bold shadow-xl hover:scale-[1.01] active:scale-[0.98] transition-all"
            >
              {goalToEdit ? t("goals.updateGoal") : t("goals.createNewGoal")}
            </button>
          </form>
        </div>
      </MotionDiv>
    </div>
  );
};

export default GoalModal;
