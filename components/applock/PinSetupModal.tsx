import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, KeyRound, Check } from "lucide-react";
import PinInput from "./PinInput";
import { useTranslation } from "react-i18next";

interface PinSetupModalProps {
  onClose: () => void;
  onSetup: (pin: string) => Promise<void>;
  /** True if changing an existing PIN */
  isChange?: boolean;
}

const PinSetupModal: React.FC<PinSetupModalProps> = ({
  onClose,
  onSetup,
  isChange = false,
}) => {
  const { t } = useTranslation();
  const [step, setStep] = useState<"enter" | "confirm">("enter");
  const [firstPin, setFirstPin] = useState("");
  const [mismatchError, setMismatchError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  const handleFirstPin = useCallback((pin: string) => {
    setFirstPin(pin);
    setStep("confirm");
    setResetKey((k) => k + 1);
  }, []);

  const handleConfirmPin = useCallback(
    async (pin: string) => {
      if (pin !== firstPin) {
        setMismatchError(true);
        setTimeout(() => {
          setMismatchError(false);
          setResetKey((k) => k + 1);
        }, 600);
        return;
      }

      setIsLoading(true);
      try {
        await onSetup(pin);
        onClose();
      } catch {
        // Error handled by parent
      }
      setIsLoading(false);
    },
    [firstPin, onSetup, onClose],
  );

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
              <KeyRound size={20} className="text-brand-600 dark:text-brand-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {isChange
                  ? t("appLock.changePin", "Change PIN")
                  : t("appLock.setupPin", "Set Up PIN")}
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                {step === "enter"
                  ? t("appLock.enterNewPin", "Enter a 4-digit PIN")
                  : t("appLock.confirmPin", "Confirm your PIN")}
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
          <div
            className={`flex-1 h-1 rounded-full transition-colors ${
              step === "enter" ? "bg-brand-500" : "bg-brand-500"
            }`}
          />
          <div
            className={`flex-1 h-1 rounded-full transition-colors ${
              step === "confirm" ? "bg-brand-500" : "bg-slate-200 dark:bg-zinc-700"
            }`}
          />
        </div>

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
                {t("appLock.pinMismatch", "PINs don't match. Try again.")}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* PIN Input */}
        <div className="px-6 pb-8 pt-2">
          <AnimatePresence mode="wait">
            {step === "enter" ? (
              <motion.div
                key="enter"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <PinInput
                  onComplete={handleFirstPin}
                  label={t("appLock.choosePin", "Choose your PIN")}
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
                <PinInput
                  onComplete={handleConfirmPin}
                  error={mismatchError}
                  loading={isLoading}
                  label={t("appLock.reEnterPin", "Re-enter your PIN")}
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
                setStep("enter");
                setFirstPin("");
                setResetKey((k) => k + 1);
              }}
              className="w-full py-3 text-sm font-bold text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-300 transition-colors"
            >
              ← {t("appLock.goBack", "Go back")}
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default PinSetupModal;
