import React, { useState } from "react";
import { AnimatePresence } from "framer-motion";
import {
  Shield,
  ShieldCheck,
  Fingerprint,
  KeyRound,
  Lock,
  Timer,
  Eye,
  EyeOff,
  LockKeyhole,
  Trash2,
  AlertTriangle,
  Smartphone,
} from "lucide-react";
import { useAppLock } from "../../context/AppLockContext";
import { useToast } from "../../context/ToastContext";
import { AutoLockTiming } from "../../types/appLockTypes";
import PinSetupModal from "./PinSetupModal";
import PatternSetupModal from "./PatternSetupModal";
import { useTranslation } from "react-i18next";
import CustomSelect from "../CustomSelect";

interface AppLockSettingsProps {
  embeddedMode?: boolean;
}

const AppLockSettings: React.FC<AppLockSettingsProps> = ({ embeddedMode = false }) => {
  const {
    isLockEnabled,
    preferences,
    isBiometricsAvailable,
    setupPin,
    setupPattern,
    setupBiometrics,
    removeMethod,
    updatePreferences,
    setAutoLockTiming,
    toggleAutoLockOnOpen,
    toggleAutoLockOnBackground,
    lockApp,
    isUnlocked,
    verifyPin,
    verifyPattern,
  } = useAppLock();
  const { success, error: toastError } = useToast();
  const { t } = useTranslation();

  const [showPinSetup, setShowPinSetup] = useState(false);
  const [showPatternSetup, setShowPatternSetup] = useState(false);
  const [pinIsChange, setPinIsChange] = useState(false);
  const [patternIsChange, setPatternIsChange] = useState(false);

  const handleMasterToggle = async () => {
    if (isLockEnabled) {
      // Disabling — confirm
      await updatePreferences({ enabled: false });
      success(t("appLock.disabled"));
    } else {
      // Enabling — check if any method is configured
      if (
        preferences.configured.pin ||
        preferences.configured.pattern ||
        preferences.configured.biometrics
      ) {
        await updatePreferences({ enabled: true });
        success(t("appLock.enabled"));
      } else {
        // No method configured — show setup
        toastError(
          t("appLock.noMethodConfigured"),
        );
      }
    }
  };

  const handlePinSetup = async (pin: string) => {
    await setupPin(pin);
    success(
      pinIsChange
        ? t("appLock.pinChanged")
        : t("appLock.pinSet"),
    );
  };

  const handlePatternSetup = async (points: number[]) => {
    await setupPattern(points);
    success(
      patternIsChange
        ? t("appLock.patternChanged")
        : t("appLock.patternSet"),
    );
  };

  const handleBiometricSetup = async () => {
    const result = await setupBiometrics();
    if (result) {
      success(t("appLock.biometricsSet"));
    } else {
      toastError(t("appLock.biometricsFailed"));
    }
  };

  const handleRemoveMethod = async (method: "pin" | "pattern" | "biometrics") => {
    await removeMethod(method);
    success(
      t("appLock.methodRemoved", "{{method}} removed", {
        method: method.charAt(0).toUpperCase() + method.slice(1),
      }),
    );
  };

  const timingOptions: { value: AutoLockTiming; label: string }[] = [
    { value: "30s", label: t("appLock.timing30s") },
    { value: "1min", label: t("appLock.timing1min") },
    { value: "5min", label: t("appLock.timing5min") },
  ];

  return (
    <>
      <section id="security" className={embeddedMode ? "space-y-6 pt-4" : "bg-white dark:bg-zinc-900 rounded-[2rem] p-8 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-6"}>
        {!embeddedMode && (
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Shield className="text-brand-500" size={24} />
            {t("appLock.title")}
          </h3>
        )}

        {/* Master Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-slate-100 dark:bg-zinc-800 rounded-2xl text-slate-600 dark:text-slate-300">
              <ShieldCheck size={24} />
            </div>
            <div>
              <div className="font-bold text-lg">
                {t("appLock.enable")}
              </div>
              <div className="text-sm text-slate-500">
                {t("appLock.enableDesc")}
              </div>
            </div>
          </div>
          <button
            onClick={handleMasterToggle}
            className={`relative inline-flex h-8 w-14 shrink-0 items-center rounded-full transition-colors focus:outline-none ${
              isLockEnabled
                ? "bg-brand-500"
                : "bg-slate-200 dark:bg-zinc-700"
            }`}
          >
            <span
              className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                isLockEnabled ? "translate-x-[1.625rem]" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        {/* Lock Methods */}
        <div className="pt-6 border-t border-slate-100 dark:border-zinc-800 space-y-5">
          <h4 className="text-sm font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
            {t("appLock.methods")}
          </h4>

          {/* PIN */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl text-indigo-600 dark:text-indigo-400">
                <KeyRound size={20} />
              </div>
              <div>
                <div className="font-bold">
                  {t("appLock.pin")}
                </div>
                <div className="text-xs text-slate-500 dark:text-zinc-400">
                  {preferences.configured.pin
                    ? t("appLock.configured")
                    : t("appLock.notConfigured")}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {preferences.configured.pin && (
                <button
                  onClick={() => handleRemoveMethod("pin")}
                  className="p-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-500/10 text-rose-500 transition-colors"
                  title="Remove PIN"
                >
                  <Trash2 size={16} />
                </button>
              )}
              <button
                onClick={() => {
                  setPinIsChange(preferences.configured.pin);
                  setShowPinSetup(true);
                }}
                className="px-4 py-2 text-sm font-bold bg-slate-100 dark:bg-zinc-800 hover:bg-brand-50 dark:hover:bg-brand-500/10 text-slate-700 dark:text-zinc-300 hover:text-brand-600 dark:hover:text-brand-400 rounded-xl transition-colors"
              >
                {preferences.configured.pin
                  ? t("appLock.change")
                  : t("appLock.setup")}
              </button>
            </div>
          </div>

          {/* Pattern */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-50 dark:bg-purple-500/10 rounded-2xl text-purple-600 dark:text-purple-400">
                <Lock size={20} />
              </div>
              <div>
                <div className="font-bold">
                  {t("appLock.pattern")}
                </div>
                <div className="text-xs text-slate-500 dark:text-zinc-400">
                  {preferences.configured.pattern
                    ? t("appLock.configured")
                    : t("appLock.notConfigured")}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {preferences.configured.pattern && (
                <button
                  onClick={() => handleRemoveMethod("pattern")}
                  className="p-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-500/10 text-rose-500 transition-colors"
                  title="Remove Pattern"
                >
                  <Trash2 size={16} />
                </button>
              )}
              <button
                onClick={() => {
                  setPatternIsChange(preferences.configured.pattern);
                  setShowPatternSetup(true);
                }}
                className="px-4 py-2 text-sm font-bold bg-slate-100 dark:bg-zinc-800 hover:bg-brand-50 dark:hover:bg-brand-500/10 text-slate-700 dark:text-zinc-300 hover:text-brand-600 dark:hover:text-brand-400 rounded-xl transition-colors"
              >
                {preferences.configured.pattern
                  ? t("appLock.change")
                  : t("appLock.setup")}
              </button>
            </div>
          </div>

          {/* Biometrics */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div
                className={`p-3 rounded-2xl ${
                  isBiometricsAvailable
                    ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500"
                }`}
              >
                <Fingerprint size={20} />
              </div>
              <div>
                <div
                  className={`font-bold ${!isBiometricsAvailable ? "text-slate-400 dark:text-zinc-500" : ""}`}
                >
                  {t("appLock.biometrics")}
                </div>
                <div className="text-xs text-slate-500 dark:text-zinc-400">
                  {!isBiometricsAvailable
                    ? t(
                        "appLock.biometricsUnavailable",
                        "Not available on this device",
                      )
                    : preferences.configured.biometrics
                      ? t("appLock.configured")
                      : t("appLock.notConfigured")}
                </div>
              </div>
            </div>
            {isBiometricsAvailable && (
              <div className="flex items-center gap-2">
                {preferences.configured.biometrics && (
                  <button
                    onClick={() => handleRemoveMethod("biometrics")}
                    className="p-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-500/10 text-rose-500 transition-colors"
                    title="Remove Biometrics"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
                {!preferences.configured.biometrics && (
                  <button
                    onClick={handleBiometricSetup}
                    className="px-4 py-2 text-sm font-bold bg-slate-100 dark:bg-zinc-800 hover:bg-brand-50 dark:hover:bg-brand-500/10 text-slate-700 dark:text-zinc-300 hover:text-brand-600 dark:hover:text-brand-400 rounded-xl transition-colors"
                  >
                    {t("appLock.register")}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Biometrics Unavailable Message */}
          {!isBiometricsAvailable && (
            <div className="p-4 bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20 rounded-2xl flex items-start gap-3">
              <Smartphone
                size={20}
                className="text-amber-500 mt-0.5 shrink-0"
              />
              <div>
                <p className="text-sm font-bold text-amber-700 dark:text-amber-400 mb-1">
                  {t(
                    "appLock.biometricsNotSupported",
                    "Biometrics not available",
                  )}
                </p>
                <p className="text-xs text-amber-600/70 dark:text-amber-400/60">
                  {t(
                    "appLock.biometricsNotSupportedDesc",
                    "Your device or browser doesn't support biometric authentication, or you're not using a secure (HTTPS) connection. Use PIN or Pattern instead.",
                  )}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Auto-Lock Settings */}
        {isLockEnabled && (
          <div className="pt-6 border-t border-slate-100 dark:border-zinc-800 space-y-5">
            <h4 className="text-sm font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
              {t("appLock.autoLock")}
            </h4>

            {/* Lock on App Open */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-slate-100 dark:bg-zinc-800 rounded-2xl text-slate-600 dark:text-slate-300">
                  <Eye size={20} />
                </div>
                <div>
                  <div className="font-bold text-sm">
                    {t("appLock.lockOnOpen")}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-zinc-400">
                    {t(
                      "appLock.lockOnOpenDesc",
                      "Require unlock when opening the app",
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={toggleAutoLockOnOpen}
                className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors focus:outline-none ${
                  preferences.autoLock.onAppOpen
                    ? "bg-brand-500"
                    : "bg-slate-200 dark:bg-zinc-700"
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                    preferences.autoLock.onAppOpen
                      ? "translate-x-[1.375rem]"
                      : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {/* Lock on Background */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-slate-100 dark:bg-zinc-800 rounded-2xl text-slate-600 dark:text-slate-300">
                  <EyeOff size={20} />
                </div>
                <div>
                  <div className="font-bold text-sm">
                    {t("appLock.lockOnBg")}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-zinc-400">
                    {t(
                      "appLock.lockOnBgDesc",
                      "Lock when switching tabs or minimizing",
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={toggleAutoLockOnBackground}
                className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors focus:outline-none ${
                  preferences.autoLock.onBackground
                    ? "bg-brand-500"
                    : "bg-slate-200 dark:bg-zinc-700"
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                    preferences.autoLock.onBackground
                      ? "translate-x-[1.375rem]"
                      : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {/* Inactivity Timeout */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-slate-100 dark:bg-zinc-800 rounded-2xl text-slate-600 dark:text-slate-300">
                  <Timer size={20} />
                </div>
                <div>
                  <div className="font-bold text-sm">
                    {t(
                      "appLock.inactivityTimeout",
                      "Lock after inactivity",
                    )}
                  </div>
                </div>
              </div>
              <CustomSelect
                value={preferences.autoLock.inactivityTimeout}
                onChange={(val) =>
                  setAutoLockTiming(val as AutoLockTiming)
                }
                options={timingOptions}
                placeholder={t("appLock.selectTimeout")}
              />
            </div>
          </div>
        )}

        {/* Lock Now Button */}
        {isLockEnabled && isUnlocked && !embeddedMode && (
          <div className="pt-6 border-t border-slate-100 dark:border-zinc-800">
            <button
              onClick={lockApp}
              className="w-full flex items-center justify-center gap-3 py-3.5 bg-slate-900 dark:bg-white dark:text-black text-white font-bold rounded-2xl hover:bg-slate-800 dark:hover:bg-zinc-100 transition-colors shadow-md"
            >
              <LockKeyhole size={18} />
              {t("appLock.lockNow")}
            </button>
          </div>
        )}
      </section>

      {/* Setup Modals */}
      <AnimatePresence>
        {showPinSetup && (
          <PinSetupModal
            onClose={() => setShowPinSetup(false)}
            onSetup={handlePinSetup}
            isChange={pinIsChange}
            verifyPin={pinIsChange ? verifyPin : undefined}
          />
        )}
        {showPatternSetup && (
          <PatternSetupModal
            onClose={() => setShowPatternSetup(false)}
            onSetup={handlePatternSetup}
            isChange={patternIsChange}
            verifyPattern={patternIsChange ? verifyPattern : undefined}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default AppLockSettings;
