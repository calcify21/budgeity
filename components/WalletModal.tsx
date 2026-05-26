import React, { useState, useEffect, useRef } from "react";
import { useData } from "../context/DataContext";
import { Wallet, WalletType } from "../types";
import { motion } from "framer-motion";
import CustomSelect from "./CustomSelect";
import { cn } from "../utils";
import { COLORS } from "../constants";
import {
  Wallet as WalletIcon,
  Landmark,
  Lock,
  AlertCircle,
} from "lucide-react";
import { useToast } from "../context/ToastContext";
import IconPicker from "./IconPicker";
import { useScrollToError } from "../hooks/useScrollToError";
import { useEscapeKey } from "../hooks/useEscapeKey";
import { useTranslation } from "react-i18next";

// Cast motion component to avoid type issues
const MotionDiv = motion.div as any;

const WALLET_TYPES: {
  value: WalletType;
  labelKey: string;
  icon: any;
  descKey: string;
}[] = [
  {
    value: "cash",
    icon: WalletIcon,
    labelKey: "walletModal.cash",
    descKey: "walletModal.cashDesc",
  },
  {
    value: "bank",
    icon: Landmark,
    labelKey: "walletModal.bank",
    descKey: "walletModal.bankDesc",
  },
  {
    value: "savings",
    icon: Lock,
    labelKey: "walletModal.savings",
    descKey: "walletModal.savingsDesc",
  },
];

interface Props {
  onClose: () => void;
  walletToEdit?: Wallet | null;
  onImportRequested?: (walletId: string) => void;
}

const WalletModal: React.FC<Props> = ({
  onClose,
  walletToEdit,
  onImportRequested,
}) => {
  const { addWallet, updateWallet } = useData();
  const { t } = useTranslation();

  const [mode, setMode] = useState<"create" | "import">("create");
  const [name, setName] = useState("");
  const [type, setType] = useState<WalletType>("cash");
  const [initialBalance, setInitialBalance] = useState("");
  const [color, setColor] = useState("#10b981");
  const [selectedIcon, setSelectedIcon] = useState("Wallet");

  useEffect(() => {
    if (walletToEdit) {
      setName(walletToEdit.name);
      setType(walletToEdit.type);
      setInitialBalance(walletToEdit.balance.toString());
      setColor(walletToEdit.color);
      setSelectedIcon(walletToEdit.icon || "Wallet");
      setMode("create");
    } else {
      setName("");
      setType("cash");
      setInitialBalance("");
      setColor("#10b981");
      setSelectedIcon("Wallet");
      setMode("create");
    }
  }, [walletToEdit]);

  // Sync icon with type if not manually set (or just default)
  const handleTypeChange = (newType: WalletType) => {
    setType(newType);
    const typeConfig = WALLET_TYPES.find((t) => t.value === newType);
    if (typeConfig) {
      setSelectedIcon(
        typeConfig.value === "cash"
          ? "Wallet"
          : typeConfig.value === "bank"
            ? "Landmark"
            : "Lock",
      );
    }
  };

  const { success, error: toastError } = useToast();
  const [error, setError] = useState("");

  const scrollRef = useRef<HTMLDivElement>(null);
  useScrollToError(error, scrollRef);
  useEscapeKey(true, onClose);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError(t("walletModal.errNoName"));
      return;
    }

    if (type === "cash" && parseFloat(initialBalance) < 0) {
      setError(t("walletModal.errNegativeCash"));
      return;
    }

    try {
      if (walletToEdit) {
        updateWallet({
          ...walletToEdit,
          name,
          type,
          color,
          balance: parseFloat(initialBalance) || 0,
          icon: selectedIcon,
        });
        success(t("walletModal.walletUpdated"));
        onClose();
      } else {
        const newId = addWallet({
          name,
          type,
          balance: parseFloat(initialBalance) || 0,
          color,
          icon: selectedIcon,
        });

        if (mode === "import" && onImportRequested) {
          onImportRequested(newId);
          onClose();
        } else {
          success(t("walletModal.walletCreated"));
          onClose();
        }
      }
    } catch (err: any) {
      toastError(err.message || t("walletModal.errSave"));
    }
  };

  return (
    <div className="fixed inset-0 z-[55] overflow-y-auto">
      <div className="flex min-h-full items-end justify-center p-0 sm:items-center sm:p-4">
        <MotionDiv
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm tour-modal-overlay"
          onClick={onClose}
        />
        <MotionDiv
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="bg-white dark:bg-zinc-900 sm:rounded-[2.5rem] rounded-t-[2.5rem] w-full sm:max-w-md relative z-10 shadow-2xl border border-slate-100 dark:border-white/10 flex flex-col max-h-[90vh]"
        >
        <div
          ref={scrollRef}
          className="p-8 overflow-y-auto custom-scrollbar flex-1"
        >
          <h2 className="text-2xl font-bold mb-6">
            {walletToEdit
              ? t("walletModal.editWallet")
              : t("walletModal.addNewWallet")}
          </h2>

          {!walletToEdit && (
            <div className="flex bg-slate-100 dark:bg-black p-1.5 rounded-2xl mb-6">
              <button
                type="button"
                onClick={() => setMode("create")}
                className={cn(
                  "flex-1 py-2.5 text-sm font-bold rounded-xl transition-all",
                  mode === "create"
                    ? "bg-white dark:bg-zinc-800 shadow-md text-slate-900 dark:text-white"
                    : "text-slate-500",
                )}
              >
                {t("walletModal.manualSetup")}
              </button>
              <button
                type="button"
                onClick={() => setMode("import")}
                className={cn(
                  "flex-1 py-2.5 text-sm font-bold rounded-xl transition-all",
                  mode === "import"
                    ? "bg-white dark:bg-zinc-800 shadow-md text-slate-900 dark:text-white"
                    : "text-slate-500",
                )}
              >
                {t("walletModal.importData")}
              </button>
            </div>
          )}

          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 text-sm font-medium rounded-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
              <AlertCircle size={18} /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                {t("walletModal.nameLabel")}
              </label>
              <input
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError("");
                }}
                className={cn(
                  "w-full p-4 bg-slate-50 dark:bg-black border rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none font-medium text-slate-900 dark:text-white transition-all tour-wallet-name",
                  error && !name
                    ? "border-rose-300 dark:border-rose-900 focus:ring-rose-500"
                    : "border-slate-200 dark:border-zinc-800",
                )}
                placeholder={t("walletModal.namePlaceholder")}
                autoFocus
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="tour-wallet-type">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  {t("walletModal.typeLabel")}
                </label>
                <CustomSelect
                  value={type}
                  onChange={(v) => handleTypeChange(v as WalletType)}
                  options={WALLET_TYPES.map((wt) => ({
                    value: wt.value,
                    label: t(wt.labelKey as any),
                    icon: wt.icon,
                    subLabel: t(wt.descKey as any),
                  }))}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  {walletToEdit
                    ? t("walletModal.balanceLabel")
                    : t("walletModal.initialLabel")}
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={initialBalance}
                  onChange={(e) => setInitialBalance(e.target.value)}
                  className="w-full p-4 bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none font-medium text-slate-900 dark:text-white tour-wallet-balance"
                  placeholder="0.00"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                {t("walletModal.colorLabel")}
              </label>
              <div className="flex gap-3 flex-wrap">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={cn(
                      "w-10 h-10 rounded-full border-4 transition-transform hover:scale-110",
                      color === c
                        ? "border-slate-300 dark:border-white scale-110"
                        : "border-transparent",
                    )}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                {t("walletModal.iconLabel")}
              </label>
              <IconPicker
                selectedIcon={selectedIcon}
                onSelect={setSelectedIcon}
              />
            </div>
            <button
              type="submit"
              className="w-full py-4 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl font-bold text-lg hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-brand-500/20 tour-wallet-save"
            >
              {mode === "import"
                ? t("walletModal.createAndImport")
                : walletToEdit
                  ? t("walletModal.saveChanges")
                  : t("walletModal.createWallet")}
            </button>
          </form>
        </div>
        </MotionDiv>
      </div>
    </div>
  );
};

export default WalletModal;
