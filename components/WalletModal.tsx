import React, { useState, useEffect, useRef } from "react";
import { useData } from "../context/DataContext";
import { Wallet, WalletType } from "../types";
import { motion } from "framer-motion";
import CustomSelect from "./CustomSelect";
import { cn } from "../utils";
import { COLORS } from "../constants";
import { Wallet as WalletIcon, Landmark, Lock, AlertCircle } from "lucide-react";
import { useToast } from "../context/ToastContext";
import IconPicker from "./IconPicker";
import { useScrollToError } from "../hooks/useScrollToError";
import { useEscapeKey } from "../hooks/useEscapeKey";

// Cast motion component to avoid type issues
const MotionDiv = motion.div as any;

const WALLET_TYPES: {
  value: WalletType;
  label: string;
  icon: any;
  desc: string;
}[] = [
  {
    value: "cash",
    label: "Cash",
    icon: WalletIcon,
    desc: "Physical cash. Cannot go negative.",
  },
  {
    value: "bank",
    label: "Bank",
    icon: Landmark,
    desc: "Regular bank account.",
  },
  {
    value: "savings",
    label: "Savings",
    icon: Lock,
    desc: "Set aside. Excluded from budgets.",
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
      setError("Please enter a wallet name.");
      return;
    }

    if (type === "cash" && parseFloat(initialBalance) < 0) {
      setError("Cash wallets cannot have a negative balance.");
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
        success("Wallet updated successfully.");
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
          success("Wallet created successfully.");
          onClose();
        }
      }
    } catch (err: any) {
      toastError(err.message || "Failed to save wallet.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-md tour-modal-overlay"
        onClick={onClose}
      />
      <MotionDiv
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white dark:bg-zinc-900 rounded-[2.5rem] w-full max-w-md relative z-10 shadow-2xl border border-slate-100 dark:border-white/10 flex flex-col max-h-[90vh]"
      >
        <div
          ref={scrollRef}
          className="p-8 overflow-y-auto custom-scrollbar flex-1"
        >
          <h2 className="text-2xl font-bold mb-6">
            {walletToEdit ? "Edit Wallet" : "Add New Wallet"}
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
                Manual Setup
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
                Import Data
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
                Name
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
                placeholder="e.g. Main Stash"
                autoFocus
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="tour-wallet-type">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Type
                </label>
                <CustomSelect
                  value={type}
                  onChange={(v) => handleTypeChange(v as WalletType)}
                  options={WALLET_TYPES.map((t) => ({
                    value: t.value,
                    label: t.label,
                    icon: t.icon,
                    subLabel: t.desc,
                  }))}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  {walletToEdit ? "Balance" : "Initial"}
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
                Color
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
                Icon
              </label>
              <IconPicker
                selectedIcon={selectedIcon}
                onSelect={setSelectedIcon}
              />
            </div>
            <button
              type="submit"
              className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-black rounded-2xl font-bold text-lg hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl tour-wallet-save"
            >
              {mode === "import"
                ? "Create & Import Data"
                : walletToEdit
                  ? "Save Changes"
                  : "Create Wallet"}
            </button>
          </form>
        </div>
      </MotionDiv>
    </div>
  );
};

export default WalletModal;
