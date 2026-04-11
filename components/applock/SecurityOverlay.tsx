import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  Fingerprint,
  Lock,
  KeyRound,
  AlertTriangle,
  LogOut,
} from "lucide-react";
import { useAppLock } from "../../context/AppLockContext";
import PinInput from "./PinInput";
import PatternLock from "./PatternLock";
import { useTranslation } from "react-i18next";

type UnlockTab = "pin" | "pattern" | "biometrics";

const SecurityOverlay: React.FC = () => {
  const {
    preferences,
    failedAttempts,
    cooldownUntil,
    unlockWithPin,
    unlockWithPattern,
    unlockWithBiometrics,
    resetLockData,
    isBiometricsAvailable,
  } = useAppLock();
  const { t } = useTranslation();

  // Determine which tabs are available
  const availableTabs: UnlockTab[] = [];
  if (preferences.configured.biometrics && isBiometricsAvailable)
    availableTabs.push("biometrics");
  if (preferences.configured.pin) availableTabs.push("pin");
  if (preferences.configured.pattern) availableTabs.push("pattern");

  // Start with biometrics if available, else PIN, else pattern
  const defaultTab =
    preferences.primaryMethod &&
    availableTabs.includes(preferences.primaryMethod as UnlockTab)
      ? (preferences.primaryMethod as UnlockTab)
      : availableTabs[0] || "pin";

  const [activeTab, setActiveTab] = useState<UnlockTab>(defaultTab);
  const [pinError, setPinError] = useState(false);
  const [patternError, setPatternError] = useState(false);
  const [pinResetKey, setPinResetKey] = useState(0);
  const [patternResetKey, setPatternResetKey] = useState(0);
  const [showForgotConfirm, setShowForgotConfirm] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Cooldown display
  const isCoolingDown = cooldownUntil !== null && Date.now() < cooldownUntil;
  const [cooldownSeconds, setCooldownSeconds] = React.useState(0);

  React.useEffect(() => {
    if (!cooldownUntil) {
      setCooldownSeconds(0);
      return;
    }
    const update = () => {
      const remaining = Math.max(
        0,
        Math.ceil((cooldownUntil - Date.now()) / 1000),
      );
      setCooldownSeconds(remaining);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [cooldownUntil]);

  // Auto-trigger biometrics on mount
  React.useEffect(() => {
    if (
      activeTab === "biometrics" &&
      preferences.configured.biometrics &&
      isBiometricsAvailable &&
      !isCoolingDown
    ) {
      const timer = setTimeout(() => {
        unlockWithBiometrics();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handlePinComplete = useCallback(
    async (pin: string) => {
      if (isCoolingDown) return;
      const success = await unlockWithPin(pin);
      if (!success) {
        setPinError(true);
        setTimeout(() => {
          setPinError(false);
          setPinResetKey((k) => k + 1);
        }, 600);
      }
    },
    [unlockWithPin, isCoolingDown],
  );

  const handlePatternComplete = useCallback(
    async (points: number[]) => {
      if (isCoolingDown) return;
      const success = await unlockWithPattern(points);
      if (!success) {
        setPatternError(true);
        setTimeout(() => {
          setPatternError(false);
          setPatternResetKey((k) => k + 1);
        }, 800);
      }
    },
    [unlockWithPattern, isCoolingDown],
  );

  const handleBiometricTap = useCallback(async () => {
    if (isCoolingDown) return;
    await unlockWithBiometrics();
  }, [unlockWithBiometrics, isCoolingDown]);

  const handleForgotLock = useCallback(async () => {
    setIsResetting(true);
    try {
      await resetLockData();
    } catch {
      // resetLockData handles everything internally
    }
    setIsResetting(false);
  }, [resetLockData]);

  const tabIcons: Record<UnlockTab, React.ReactNode> = {
    pin: <KeyRound size={16} />,
    pattern: <Lock size={16} />,
    biometrics: <Fingerprint size={16} />,
  };

  const tabLabels: Record<UnlockTab, string> = {
    pin: t("appLock.pin", "PIN"),
    pattern: t("appLock.pattern", "Pattern"),
    biometrics: t("appLock.biometrics", "Biometrics"),
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-xl" />

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.1, type: "spring", damping: 25, stiffness: 200 }}
        className="relative z-10 w-full max-w-sm mx-4 flex flex-col items-center"
      >
        {/* App Icon & Branding */}
        <div className="mb-8 flex flex-col items-center">
          <div className="w-20 h-20 rounded-[1.5rem] bg-gradient-to-br from-brand-500 to-emerald-600 flex items-center justify-center shadow-2xl shadow-brand-500/40 mb-4">
            <Shield size={36} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">Budgeity</h1>
          <p className="text-sm text-white/50 font-medium">
            {t("appLock.unlockPrompt", "Unlock to continue")}
          </p>
        </div>

        {/* Glass Card */}
        <div className="w-full bg-white/10 dark:bg-white/5 backdrop-blur-2xl rounded-[2rem] border border-white/10 p-6 shadow-2xl">
          {/* Method Tabs (if multiple methods available) */}
          {availableTabs.length > 1 && (
            <div className="flex gap-2 mb-6 bg-white/5 rounded-2xl p-1">
              {availableTabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`
                    flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all
                    ${
                      activeTab === tab
                        ? "bg-white/20 text-white shadow-sm"
                        : "text-white/40 hover:text-white/60"
                    }
                  `}
                >
                  {tabIcons[tab]}
                  {tabLabels[tab]}
                </button>
              ))}
            </div>
          )}

          {/* Cooldown Warning */}
          <AnimatePresence>
            {isCoolingDown && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 p-3 bg-amber-500/20 border border-amber-500/30 rounded-xl flex items-center gap-3"
              >
                <AlertTriangle size={18} className="text-amber-400 shrink-0" />
                <p className="text-xs font-bold text-amber-300">
                  {t("appLock.cooldown", "Too many attempts. Wait {{seconds}}s", {
                    seconds: cooldownSeconds,
                  })}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Failed Attempts Counter */}
          {failedAttempts > 0 && !isCoolingDown && (
            <p className="text-center text-xs font-bold text-rose-400 mb-4">
              {t("appLock.failedAttempts", "{{count}} failed attempt(s)", {
                count: failedAttempts,
              })}
            </p>
          )}

          {/* Unlock Method Content */}
          <div className="min-h-[280px] flex items-center justify-center">
            <AnimatePresence mode="wait">
              {activeTab === "pin" && (
                <motion.div
                  key="pin"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="w-full"
                >
                  <PinInput
                    onComplete={handlePinComplete}
                    error={pinError}
                    loading={isCoolingDown}
                    label={t("appLock.enterPin", "Enter your PIN")}
                    resetKey={pinResetKey}
                    isOverlay
                  />
                </motion.div>
              )}

              {activeTab === "pattern" && (
                <motion.div
                  key="pattern"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="w-full flex justify-center"
                >
                  <PatternLock
                    onComplete={handlePatternComplete}
                    error={patternError}
                    loading={isCoolingDown}
                    label={t(
                      "appLock.drawPattern",
                      "Draw your unlock pattern",
                    )}
                    resetKey={patternResetKey}
                    isOverlay
                  />
                </motion.div>
              )}

              {activeTab === "biometrics" && (
                <motion.div
                  key="biometrics"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="w-full flex flex-col items-center gap-6 py-8"
                >
                  <button
                    onClick={handleBiometricTap}
                    disabled={isCoolingDown}
                    className="w-24 h-24 rounded-full bg-white/10 hover:bg-white/20 border-2 border-white/20 flex items-center justify-center transition-all active:scale-95 disabled:opacity-50"
                  >
                    <Fingerprint
                      size={48}
                      className="text-brand-400"
                    />
                  </button>
                  <p className="text-sm font-semibold text-white/60">
                    {t("appLock.touchToUnlock", "Touch to unlock")}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Forgot Lock */}
        <div className="mt-6">
          {!showForgotConfirm ? (
            <button
              onClick={() => setShowForgotConfirm(true)}
              className="text-sm font-bold text-white/30 hover:text-white/50 transition-colors"
            >
              {t("appLock.forgotLock", "Forgot Lock?")}
            </button>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-rose-500/20 border border-rose-500/30 rounded-2xl p-4 max-w-xs text-center"
            >
              <div className="flex items-center justify-center gap-2 mb-2">
                <LogOut size={16} className="text-rose-400" />
                <p className="text-sm font-bold text-rose-300">
                  {t("appLock.resetWarningTitle", "Reset App Lock?")}
                </p>
              </div>
              <p className="text-xs text-rose-300/70 mb-4">
                {t(
                  "appLock.resetWarning",
                  "A secure sign-in link will be sent to your email. You will be logged out and all lock data will be cleared.",
                )}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowForgotConfirm(false)}
                  className="flex-1 py-2 text-xs font-bold text-white/50 hover:text-white/70 bg-white/5 rounded-xl transition-colors"
                >
                  {t("common.cancel", "Cancel")}
                </button>
                <button
                  onClick={handleForgotLock}
                  disabled={isResetting}
                  className="flex-1 py-2 text-xs font-bold text-white bg-rose-500 hover:bg-rose-600 rounded-xl transition-colors disabled:opacity-50"
                >
                  {isResetting
                    ? t("common.loading", "Loading...")
                    : t("appLock.resetConfirm", "Reset & Logout")}
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default SecurityOverlay;
