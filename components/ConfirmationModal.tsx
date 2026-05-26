import React from "react";
import { X, AlertTriangle } from "lucide-react";
import { cn } from "../utils";
import { useEscapeKey } from "../hooks/useEscapeKey";
import { motion } from "framer-motion";

const MotionDiv = motion.div as any;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "neutral" | "success";
}

const ConfirmationModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "neutral",
}) => {
  useEscapeKey(isOpen, onClose);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-end justify-center p-0 sm:items-center sm:p-4">
        <MotionDiv
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />
        <MotionDiv
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="bg-white dark:bg-zinc-900 w-full sm:max-w-sm sm:rounded-[2rem] rounded-t-[2.5rem] shadow-2xl overflow-hidden flex flex-col relative z-10 max-h-[90vh] overflow-y-auto"
        >
        <div className="p-6 text-center">
          <div
            className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4",
              variant === "danger"
                ? "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400"
                : "bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-slate-400",
            )}
          >
            <AlertTriangle size={24} />
          </div>
          <h2 className="text-xl font-bold mb-2 text-slate-900 dark:text-white">
            {title}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
            {message}
          </p>
        </div>

        <div className="p-6 border-t border-slate-100 dark:border-zinc-800 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-xl font-bold bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={cn(
              "flex-1 py-3 px-4 rounded-xl font-bold text-white transition-colors shadow-lg",
              variant === "danger"
                ? "bg-rose-600 hover:bg-rose-700 shadow-rose-500/20"
                : "bg-brand-600 hover:bg-brand-700 shadow-brand-500/20",
            )}
          >
            {confirmText}
          </button>
        </div>
        </MotionDiv>
      </div>
    </div>
  );
};

export default ConfirmationModal;
