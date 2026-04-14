import React, { useState, useRef } from "react";
import { useHousehold } from "../context/HouseholdContext";
import { X, Home, Plus, Loader2, AlertCircle } from "lucide-react";
import IconPicker from "./IconPicker";
import { useToast } from "../context/ToastContext";
import { useScrollToError } from "../hooks/useScrollToError";
import { useEscapeKey } from "../hooks/useEscapeKey";
import { motion } from "framer-motion";

const MotionDiv = motion.div as any;

interface HouseholdModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const HouseholdModal: React.FC<HouseholdModalProps> = ({ isOpen, onClose }) => {
  const { createHousehold, switchWorkspace } = useHousehold();
  const { error: toastError, success } = useToast();

  const [name, setName] = useState("");
  const [icon, setIcon] = useState("Home");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");

  const scrollRef = useRef<HTMLDivElement>(null);
  useScrollToError(error, scrollRef);
  useEscapeKey(isOpen, onClose);

  if (!isOpen) return null;

  const handleCreate = async () => {
    setError("");
    if (!name.trim()) {
      setError("Please enter a household name.");
      return;
    }
    setIsCreating(true);
    try {
      const id = await createHousehold(name.trim(), icon);
      switchWorkspace({
        type: "household",
        id,
        name: name.trim(),
      });
      success("Household created successfully!");
      onClose();
      setName("");
      setIcon("Home");
    } catch (e: any) {
      const errMsg = e.message || "Failed to create household";
      setError(errMsg);
      toastError(errMsg);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <MotionDiv
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <MotionDiv
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-[2rem] shadow-2xl flex flex-col max-h-[90vh] relative z-10"
      >
        <div className="p-6 border-b border-slate-100 dark:border-white/5 flex items-center justify-between shrink-0">
          <h2 className="text-xl font-bold">Create Household</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5"
          >
            <X size={20} />
          </button>
        </div>

        <div
          ref={scrollRef}
          className="p-6 space-y-5 overflow-y-auto flex-1 custom-scrollbar"
        >
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 text-sm font-medium rounded-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
              <AlertCircle size={18} /> {error}
            </div>
          )}

          <div>
            <label className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2 block">
              Household Name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., My Family, Roommates..."
              className="w-full px-4 py-3 bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/10 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-brand-500"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-3 block">
              Icon
            </label>
            <IconPicker selectedIcon={icon} onSelect={setIcon} />
          </div>

          <button
            onClick={handleCreate}
            disabled={!name.trim() || isCreating}
            className="w-full flex items-center justify-center gap-2 py-3 bg-brand-600 text-white rounded-2xl font-semibold text-sm hover:bg-brand-700 disabled:opacity-50 transition-colors"
          >
            {isCreating ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Plus size={18} />
            )}
            {isCreating ? "Creating..." : "Create Household"}
          </button>
        </div>
      </MotionDiv>
    </div>
  );
};

export default HouseholdModal;
