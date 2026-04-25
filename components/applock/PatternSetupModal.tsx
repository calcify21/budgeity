import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Lock, ShieldAlert } from "lucide-react";
import PatternLock from "./PatternLock";
import { useTranslation } from "react-i18next";

interface PatternSetupModalProps {
  onClose: () => void;
  onSetup: (points: number[]) => Promise<void>;
  /** True if changing an existing pattern */
  isChange?: boolean;
  /** Verify the current pattern before allowing change. Required when isChange is true. */
  verifyPattern?: (points: number[]) => Promise<boolean>;
}

const PatternSetupModal: React.FC<PatternSetupModalProps> = ({
  onClose,
  onSetup,
  isChange = false,
  verifyPattern,
}) => {
  const { t } = useTranslation();
  const [step, setStep] = useState<"verify" | "draw" | "confirm">(
    isChange && verifyPattern ? "verify" : "draw",
  );
  const [firstPattern, setFirstPattern] = useState<number[]>([]);
  const [mismatchError, setMismatchError] = useState(false);
  const [verifyError, setVerifyError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  const handleVerifyPattern = useCallback(
    async (points: number[]) => {
      if (!verifyPattern) return;
      setIsLoading(true);
      const valid = await verifyPattern(points);
      setIsLoading(false);
      if (valid) {
        setStep("draw");
        setResetKey((k) => k + 1);
        setVerifyError(false);
      } else {
        setVerifyError(true);
        setTimeout(() => {
          setVerifyError(false);
          setResetKey((k) => k + 1);
        }, 800);
      }
    },
    [verifyPattern],
  );

  const handleFirstPattern = useCallback((points: number[]) => {
    setFirstPattern(points);
    setStep("confirm");
    setResetKey((k) => k + 1);
  }, []);

  const handleConfirmPattern = useCallback(
    async (points: number[]) => {
      // Compare patterns
      if (
        points.length !== firstPattern.length ||
        !points.every((p, i) => p === firstPattern[i])
      ) {
        setMismatchError(true);
        setTimeout(() => {
          setMismatchError(false);
          setResetKey((k) => k + 1);
        }, 800);
        return;
      }

      setIsLoading(true);
      try {
        await onSetup(points);
        onClose();
      } catch {
        // Error handled by parent
      }
      setIsLoading(false);
    },
    [firstPattern, onSetup, onClose],
  );

  const totalSteps = isChange && verifyPattern ? 3 : 2;
  const currentStep = step === "verify" ? 1 : step === "draw" ? (totalSteps === 3 ? 2 : 1) : totalSteps;

  const getSubtitle = () => {
    if (step === "verify")
      return t("appLock.drawCurrentPattern");
    if (step === "draw")
      return t("appLock.drawNewPattern");
    return t("appLock.confirmPattern");
  };

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.95 }}
        className="relative z-10 w-full max-w-sm mx-4 bg-white dark:bg-zinc-900 rounded-[2rem] border border-slate-200 dark:border-zinc-800 shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-100 dark:bg-brand-500/20 flex items-center justify-center">
              {step === "verify" ? (
                <ShieldAlert size={20} className="text-amber-600 dark:text-amber-400" />
              ) : (
                <Lock size={20} className="text-brand-600 dark:text-brand-400" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {isChange
                  ? t("appLock.changePattern")
                  : t("appLock.setupPattern")}
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                {getSubtitle()}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center gap-2 px-6 py-4">
          {Array.from({ length: totalSteps }, (_, i) => (
            <div
              key={i}
              className={`flex-1 h-1 rounded-full transition-colors ${
                i < currentStep ? "bg-brand-500" : "bg-slate-200 dark:bg-zinc-700"
              }`}
            />
          ))}
        </div>

        {/* Verify Error */}
        <AnimatePresence>
          {verifyError && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mx-6 mb-2 p-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl"
            >
              <p className="text-xs font-bold text-rose-600 dark:text-rose-400 text-center">
                {t("appLock.wrongPattern")}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mismatch Error */}
        <AnimatePresence>
          {mismatchError && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mx-6 mb-2 p-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl"
            >
              <p className="text-xs font-bold text-rose-600 dark:text-rose-400 text-center">
                {t(
                  "appLock.patternMismatch",
                  "Patterns don't match. Try again.",
                )}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pattern Lock */}
        <div className="px-6 pb-8 pt-2 flex justify-center">
          <AnimatePresence mode="wait">
            {step === "verify" ? (
              <motion.div
                key="verify"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <PatternLock
                  onComplete={handleVerifyPattern}
                  error={verifyError}
                  loading={isLoading}
                  label={t("appLock.currentPattern")}
                  resetKey={resetKey}
                />
              </motion.div>
            ) : step === "draw" ? (
              <motion.div
                key="draw"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <PatternLock
                  onComplete={handleFirstPattern}
                  label={t("appLock.choosePattern")}
                  resetKey={resetKey}
                />
              </motion.div>
            ) : (
              <motion.div
                key="confirm"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <PatternLock
                  onComplete={handleConfirmPattern}
                  error={mismatchError}
                  loading={isLoading}
                  label={t("appLock.redrawPattern")}
                  resetKey={resetKey}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Back button in confirm step */}
        {step === "confirm" && (
          <div className="px-6 pb-6">
            <button
              onClick={() => {
                setStep("draw");
                setFirstPattern([]);
                setResetKey((k) => k + 1);
              }}
              className="w-full py-3 text-sm font-bold text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-300 transition-colors"
            >
              ← {t("appLock.goBack")}
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default PatternSetupModal;

