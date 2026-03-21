import React from "react";
import { AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import CustomCheckbox from "./CustomCheckbox";

const MotionDiv = motion.div as any;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: React.ReactNode;
  confirmText?: string;
  isDestructive?: boolean;
  showCheckbox?: boolean;
  checkboxLabel?: string;
  verificationText?: string;
}

export const ConfirmModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  isDestructive = false,
  showCheckbox = false,
  checkboxLabel,
  verificationText,
}) => {
  const [isChecked, setIsChecked] = React.useState(false);
  const [verificationInput, setVerificationInput] = React.useState("");

  React.useEffect(() => {
    if (isOpen) {
      setIsChecked(false);
      setVerificationInput("");
    }
  }, [isOpen]);

  // Escape key dismissal
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const isCheckboxValid = !showCheckbox || isChecked;
  const isVerificationValid =
    !verificationText || verificationInput.trim() === verificationText;
  const isValid = isCheckboxValid && isVerificationValid;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <MotionDiv
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            onClick={onClose}
          />
          <MotionDiv
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-sm relative z-10 p-6 shadow-2xl border border-slate-100 dark:border-zinc-800"
          >
            <div className="flex flex-col items-center text-center gap-4">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center ${isDestructive ? "bg-rose-100 dark:bg-rose-900/20 text-rose-600" : "bg-amber-100 dark:bg-amber-900/20 text-amber-600"}`}
              >
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {title}
                </h3>
                <div className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                  {message}
                </div>
              </div>

              <div className="w-full space-y-4">
                {verificationText && (
                  <div className="text-left space-y-2">
                    <label className="text-xs font-semibold text-slate-500 uppercase">
                      Type "{verificationText}" to confirm
                    </label>
                    <input
                      type="text"
                      value={verificationInput}
                      onChange={(e) => setVerificationInput(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-zinc-700 rounded-xl bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
                      placeholder={`Type ${verificationText}`}
                    />
                  </div>
                )}

                {showCheckbox && (
                  <div className="flex items-start gap-4 text-left p-4 bg-slate-50 dark:bg-zinc-800/50 rounded-2xl border border-slate-100 dark:border-zinc-800/50">
                    <CustomCheckbox
                      id="confirm-checkbox"
                      checked={isChecked}
                      onChange={setIsChecked}
                      label={checkboxLabel || "I understand the consequences."}
                      className="mt-0.5"
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-3 w-full mt-2">
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 px-4 bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-slate-300 font-medium rounded-xl hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  disabled={!isValid}
                  onClick={() => {
                    onConfirm();
                    onClose();
                  }}
                  className={`flex-1 py-2.5 px-4 text-white font-medium rounded-xl transition-all shadow-lg 
                      ${
                        isValid
                          ? isDestructive
                            ? "bg-rose-600 hover:bg-rose-700 shadow-rose-500/20"
                            : "bg-brand-600 hover:bg-brand-700 shadow-brand-500/20"
                          : "bg-slate-300 dark:bg-zinc-700 cursor-not-allowed opacity-70 shadow-none"
                      }`}
                >
                  {confirmText}
                </button>
              </div>
            </div>
          </MotionDiv>
        </div>
      )}
    </AnimatePresence>
  );
};
