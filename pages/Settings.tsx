import React, { useState } from "react";
import { useData } from "../context/DataContext";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  Moon,
  Sun,
  Trash,
  AlertTriangle,
  Coins,
  Lock,
  Palette,
  Wallet,
  Globe,
  Check,
} from "lucide-react";
import { CURRENCIES, ACCENT_THEMES, PREMIUM_THEMES, APP_VERSION } from "../constants";
import CustomSelect from "../components/CustomSelect";
import { ConfirmModal } from "../components/ConfirmModal";
import WalletModal from "../components/WalletModal";
import { useTour } from "../context/TourContext";
import { useTranslation } from "react-i18next";
import AppLockSettings from "../components/applock/AppLockSettings";
import { useLocation } from "react-router-dom";

const Settings: React.FC = () => {
  const {
    theme,
    toggleTheme,
    accentTheme,
    setAccentTheme,
    premiumTheme,
    setPremiumTheme,
    resetData,
    currency,
    setCurrency,
    wallets,
    defaultWalletId,
    setDefaultWallet,
    numberSystem,
    setNumberSystem,
    hideAmounts,
    toggleHideAmounts,
    setLanguage,
  } = useData();
  const { user } = useAuth();
  const { success, error } = useToast();
  const { startTour } = useTour();
  const { t, i18n } = useTranslation();

  const [confirmResetData, setConfirmResetData] = useState(false);
  const [showAddWallet, setShowAddWallet] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  const location = useLocation();

  // Handle anchor scrolling (e.g., #security)
  React.useEffect(() => {
    if (location.hash) {
      // Small delay to ensure the component is fully rendered
      const timer = setTimeout(() => {
        const id = location.hash.replace("#", "");
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 300); // Slightly longer delay for stability with lazy loading
      return () => clearTimeout(timer);
    }
  }, [location.hash]);

  const handleResetData = async () => {
    try {
      await resetData();
      success("Data has been reset successfully.");
    } catch (err: any) {
      console.error("Reset failed:", err);
      error("Failed to reset data. Please try again.");
    }
    setConfirmResetData(false);
  };

  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      error("Geolocation is not supported by your browser");
      return;
    }

    setIsLoadingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          let countryCode: string | undefined = undefined;

          // 1. Try Client-Side Friendly API (BigDataCloud)
          try {
            const response = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`,
            );
            if (response.ok) {
              const data = await response.json();
              countryCode = data.countryCode;
            }
          } catch (err) {
            console.warn("BigDataCloud API failed, trying fallback...", err);
          }

          // 2. Fallback: Browser Timezone
          if (!countryCode) {
            const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
            if (tz) {
              if (
                tz.includes("Calcutta") ||
                tz.includes("Kolkata") ||
                tz.includes("India")
              )
                countryCode = "IN";
              else if (tz.startsWith("America/")) countryCode = "US";
              else if (tz.startsWith("Europe/London")) countryCode = "GB";
              else if (tz.startsWith("Europe/")) countryCode = "EU";
              else if (tz.startsWith("Australia/")) countryCode = "AU";
              else if (tz.startsWith("Asia/Tokyo")) countryCode = "JP";
            }
          }

          if (countryCode) {
            const countryToCurrency: Record<string, string> = {
              US: "USD",
              GB: "GBP",
              IN: "INR",
              EU: "EUR",
              DE: "EUR",
              FR: "EUR",
              IT: "EUR",
              ES: "EUR",
              JP: "JPY",
              AU: "AUD",
              CA: "CAD",
              AE: "AED",
              CN: "CNY",
              BR: "BRL",
              RU: "RUB",
              ZA: "ZAR",
              CH: "CHF",
              KR: "KRW",
            };

            const detectedCurrency =
              countryToCurrency[countryCode] ||
              (countryCode === "EU" ? "EUR" : undefined);

            if (detectedCurrency) {
              setCurrency(detectedCurrency);
              success(`Currency set to ${detectedCurrency} based on location.`);
            } else {
              error(
                `Could not automatically map ${countryCode} to a currency.`,
              );
            }
          } else {
            error("Could not determine location or country.");
          }
        } catch (err) {
          error("Failed to process location data.");
          console.error(err);
        } finally {
          setIsLoadingLocation(false);
        }
      },
      (err) => {
        setIsLoadingLocation(false);
        error("Failed to get location: " + err.message);
      },
    );
  };

  const currencyOptions = CURRENCIES.map((c) => ({
    value: c.code,
    label: `${c.name} (${c.symbol})`,
    subLabel: c.code,
  }));

  const walletOptions = wallets.map((w) => ({
    value: w.id,
    label: w.name,
    color: w.color,
  }));

  const numberSystemOptions = [
    {
      value: "AUTO",
      label: t("settingsPage.autoSystem"),
      subLabel: t("settingsPage.recommended"),
    },
    { value: "IN", label: t("settingsPage.indianSystem"), subLabel: t("settingsPage.indianExample") },
    { value: "INTL", label: t("settingsPage.intlSystem"), subLabel: t("settingsPage.intlExample") },
  ];

  const languageOptions = [
    { value: "en", label: "English", subLabel: "English" },
    { value: "fr", label: "Français", subLabel: "French" },
    { value: "hi", label: "हिन्दी", subLabel: "Hindi" },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <h2 className="text-2xl font-bold">{t("settings.title")}</h2>

      {/* App Tour */}
      <section className="bg-white dark:bg-zinc-900 rounded-[2rem] p-8 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-4">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-brand-500"
          >
            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          {t("settingsPage.appTour")}
        </h3>
        <div className="flex items-center justify-between">
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            {t("settingsPage.appTourDesc")}
          </p>
          <button
            onClick={() => startTour()}
            className="px-4 py-2 bg-slate-100 dark:bg-zinc-800 hover:bg-brand-100 dark:hover:bg-brand-900/30 text-slate-700 dark:text-slate-300 hover:text-brand-600 font-bold rounded-xl transition-colors"
            id="restart-tour-btn"
          >
            {t("settingsPage.restartTour")}
          </button>
        </div>
      </section>

      {/* Appearance */}
      <section className="bg-white dark:bg-zinc-900 rounded-[2rem] p-8 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-6">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <Palette className="text-brand-500" size={24} />{" "}
          {t("settings.preferences")}
        </h3>

        {/* Dark Mode */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-slate-100 dark:bg-zinc-800 rounded-2xl text-slate-600 dark:text-slate-300">
              {theme === "dark" ? <Sun size={24} /> : <Moon size={24} />}
            </div>
            <div>
              <div className="font-bold text-lg">{t("settings.dark_mode")}</div>
              <div className="text-sm text-slate-500">
                {t("settings.dark_mode_desc")}
              </div>
            </div>
          </div>
          <button
            onClick={toggleTheme}
            className="relative inline-flex h-8 w-14 shrink-0 items-center rounded-full bg-slate-200 dark:bg-zinc-700 transition-colors focus:outline-none"
          >
            <span
              className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${theme === "dark" ? "translate-x-[1.625rem]" : "translate-x-1"}`}
            />
          </button>
        </div>

        {/* Premium Themes */}
        <div className="pt-4 border-t border-slate-100 dark:border-zinc-800">
          <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">
            Premium Themes
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {PREMIUM_THEMES.map((preset) => {
              const isActive = (premiumTheme || "classic") === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => setPremiumTheme(preset.id)}
                  className={`group relative overflow-hidden rounded-2xl border p-4 text-left transition-all ${
                    isActive
                      ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10 ring-1 ring-brand-500"
                      : "border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-black/20 hover:border-brand-300 dark:hover:border-brand-500/50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">
                        {preset.name}
                      </div>
                      <div className="mt-1 text-xs font-medium leading-relaxed text-slate-500 dark:text-zinc-400">
                        {preset.description}
                      </div>
                    </div>
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                        isActive
                          ? "border-brand-500 bg-brand-500 text-white"
                          : "border-slate-300 dark:border-zinc-700 text-transparent"
                      }`}
                    >
                      <Check size={14} strokeWidth={3} />
                    </span>
                  </div>
                  <div className="mt-4 flex gap-2">
                    {preset.swatches.map((color) => (
                      <span
                        key={color}
                        className="h-6 flex-1 rounded-full border border-white/50 shadow-sm"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Classic Accent Theme */}
        {(premiumTheme || "classic") === "classic" && (
        <div className="pt-4 border-t border-slate-100 dark:border-zinc-800">
          <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">
            Classic Accent
          </h4>
          <div className="flex flex-wrap gap-3">
            {ACCENT_THEMES.map((accent) => {
              const isActive = (accentTheme || "emerald") === accent.id;
              return (
                <button
                  key={accent.id}
                  onClick={() => setAccentTheme(accent.id)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isActive ? "ring-2 ring-offset-2 ring-slate-900 dark:ring-white dark:ring-offset-zinc-900 scale-110" : "hover:scale-110 opacity-70 hover:opacity-100"}`}
                  style={{ backgroundColor: accent.color }}
                  title={accent.name}
                >
                  {isActive && (
                    <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </div>
        )}

        {/* Hide Balances */}
        <div className="pt-6 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-slate-100 dark:bg-zinc-800 rounded-2xl text-slate-600 dark:text-slate-300">
              <Lock size={24} />
            </div>
            <div>
              <div className="font-bold text-lg">{t("settingsPage.hideBalances")}</div>
              <div className="text-sm text-slate-500">
                {t("settingsPage.hideBalancesDesc")}
              </div>
            </div>
          </div>
          <button
            onClick={toggleHideAmounts}
            className={`relative inline-flex h-8 w-14 shrink-0 items-center rounded-full transition-colors focus:outline-none ${hideAmounts ? "bg-brand-500" : "bg-slate-200 dark:bg-zinc-700"}`}
          >
            <span
              className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${hideAmounts ? "translate-x-[1.625rem]" : "translate-x-1"}`}
            />
          </button>
        </div>

        {/* Currency */}
        <div className="pt-6 border-t border-slate-100 dark:border-zinc-800">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-slate-100 dark:bg-zinc-800 rounded-2xl text-slate-600 dark:text-slate-300">
              <Coins size={24} />
            </div>
            <div>
              <div className="font-bold text-lg">{t("settings.currency")}</div>
              <div className="text-sm text-slate-500">
                {t("settings.currency_desc")}
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <div className="flex-1">
              <CustomSelect
                value={currency}
                onChange={setCurrency}
                options={currencyOptions}
                searchable
                placeholder={t("settingsPage.preferencePlaceholder")}
              />
            </div>
            <button
              onClick={handleUseLocation}
              disabled={isLoadingLocation}
              className="px-4 py-2 bg-slate-100 dark:bg-zinc-800 hover:bg-brand-100 dark:hover:bg-brand-900/30 text-brand-600 dark:text-brand-400 font-medium rounded-xl transition-colors flex items-center gap-2 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
              title={t("settingsPage.useLocation")}
            >
              {isLoadingLocation ? (
                <div className="w-4 h-4 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Globe size={18} />
              )}
              <span className="hidden sm:inline">
                {isLoadingLocation ? t("settingsPage.locating") : t("settingsPage.useLocation")}
              </span>
            </button>
          </div>
        </div>

        {/* Number Format System */}
        <div className="pt-6 border-t border-slate-100 dark:border-zinc-800">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-slate-100 dark:bg-zinc-800 rounded-2xl text-slate-600 dark:text-slate-300">
              <Globe size={24} />
            </div>
            <div>
              <div className="font-bold text-lg">
                {t("settings.number_format")}
              </div>
              <div className="text-sm text-slate-500">
                {t("settings.number_format_desc")}
              </div>
            </div>
          </div>

          <CustomSelect
            value={numberSystem}
            onChange={(val) => setNumberSystem(val as any)}
            options={numberSystemOptions}
            placeholder={t("settingsPage.selectNumberSystem")}
          />
        </div>

        {/* Default Wallet */}
        <div className="pt-6 border-t border-slate-100 dark:border-zinc-800">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-slate-100 dark:bg-zinc-800 rounded-2xl text-slate-600 dark:text-slate-300">
              <Wallet size={24} />
            </div>
            <div>
              <div className="font-bold text-lg">
                {t("settings.default_wallet")}
              </div>
              <div className="text-sm text-slate-500">
                {t("settings.default_wallet_desc")}
              </div>
            </div>
          </div>

          <CustomSelect
            value={defaultWalletId || ""}
            onChange={setDefaultWallet}
            options={walletOptions}
            placeholder={t("settingsPage.selectDefaultWallet")}
            onAddNew={() => setShowAddWallet(true)}
          />
        </div>

        {/* Language Selection */}
        <div className="pt-6 border-t border-slate-100 dark:border-zinc-800">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-slate-100 dark:bg-zinc-800 rounded-2xl text-slate-600 dark:text-slate-300">
              <Globe size={24} />
            </div>
            <div>
              <div className="font-bold text-lg">{t("settings.language")}</div>
              <div className="text-sm text-slate-500">
                {t("settings.language_desc")}
              </div>
            </div>
          </div>

          <CustomSelect
            value={i18n.language}
            onChange={(val) => setLanguage(val as string)}
            options={languageOptions}
            placeholder={t("settingsPage.selectLanguage")}
          />
        </div>
      </section>

      {/* Security — App Lock Settings */}
      <AppLockSettings />

      {/* Danger Zone */}
      <section className="bg-white dark:bg-zinc-900 rounded-[2rem] p-8 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-6">
        <h3 className="text-xl font-bold flex items-center gap-2 text-rose-600">
          <AlertTriangle size={24} /> {t("settings.danger_zone")}
        </h3>

        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-rose-50 dark:bg-rose-900/10 rounded-2xl border border-rose-100 dark:border-rose-900/20 transition-all">
            <div className="flex items-center gap-4">
              <Trash size={24} className="text-rose-600 shrink-0" />
              <div>
                <div className="font-bold text-lg text-rose-700 dark:text-rose-400">
                  {t("settings.reset_data")}
                </div>
                <div className="text-sm text-rose-500/80">
                  {t("settings.reset_data_desc")}
                </div>
              </div>
            </div>
            <button
              onClick={() => setConfirmResetData(true)}
              className="px-5 py-2.5 bg-white dark:bg-zinc-900 border border-rose-200 dark:border-rose-900 text-rose-600 font-bold rounded-xl hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors whitespace-nowrap self-end sm:self-auto"
            >
              {t("settings.reset_button")}
            </button>
          </div>
        </div>
      </section>

      <div className="text-center text-xs text-slate-400 pb-8">
        Budgeity v{APP_VERSION}
      </div>

      <AnimatePresence>
        {showAddWallet && (
          <WalletModal
            onClose={() => setShowAddWallet(false)}
            onImportRequested={() => {
              setShowAddWallet(false);
            }}
          />
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={confirmResetData}
        onClose={() => setConfirmResetData(false)}
        onConfirm={handleResetData}
        title={t("settingsPage.resetDataTitle")}
        message={t("settingsPage.resetDataMsg")}
        confirmText={t("settingsPage.resetEverything")}
        isDestructive
      />
    </div>
  );
};

export default Settings;
