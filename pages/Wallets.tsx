import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useData } from "../context/DataContext";
import { useHousehold } from "../context/HouseholdContext";
import { cn, formatDate, getCategoryIcon } from "../utils";
import { calculateWalletFlow } from "../utils/analytics";
import {
  Plus,
  Wallet as WalletIcon,
  Trash2,
  Upload,
  Pencil,
  X,
  ArrowRightLeft,
  CreditCard,
  Archive,
  RotateCcw,
  Share2,
  BarChart3,
} from "lucide-react";
import { ICON_MAP } from "../utils";
import { Wallet, WalletType } from "../types";
import ImportWizard from "../components/ImportWizard";
import { motion, AnimatePresence } from "framer-motion";
import CustomSelect from "../components/CustomSelect";
import WalletActionModal from "../components/WalletActionModal";
import WalletModal from "../components/WalletModal";
import WalletAnalytics from "../components/WalletAnalytics";

// Cast motion components to any to resolve type errors in some environments
const MotionDiv = motion.div as any;
const MotionButton = motion.button as any;

const WALLET_TYPES: WalletType[] = ["cash", "bank", "savings"];

const Wallets: React.FC = () => {
  const { t } = useTranslation();
  const {
    wallets,
    addWallet,
    updateWallet,
    transactions,
    categories,
    archiveWallet,
    formatAmount,
  } = useData();
  const { activeWorkspace, currentMembers } = useHousehold();
  const isHouseholdMode = activeWorkspace.type === "household";

  // States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [walletToDelete, setWalletToDelete] = useState<string | null>(null);
  const [walletToEdit, setWalletToEdit] = useState<Wallet | null>(null);
  const [selectedWalletId, setSelectedWalletId] = useState<string | null>(null);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [targetWalletForImport, setTargetWalletForImport] =
    useState<string>("");
  const [showAnalytics, setShowAnalytics] = useState(false);

  // Form State
  const [mode, setMode] = useState<"create" | "import">("create");
  const [name, setName] = useState("");
  const [type, setType] = useState<WalletType>("cash");
  const [initialBalance, setInitialBalance] = useState("");
  const [color, setColor] = useState("#10b981");

  const activeWallets = wallets.filter((w) => !w.archived && !w.isGoalWallet);
  const archivedWallets = wallets.filter((w) => w.archived && !w.isGoalWallet);

  const openEdit = (w: Wallet) => {
    setWalletToEdit(w);
    setName(w.name);
    setType(w.type);
    setInitialBalance(w.balance.toString());
    setColor(w.color);
    setIsModalOpen(true);
    setMode("create");
    setSelectedWalletId(null); // Close details if open
  };

  const openCreate = () => {
    setWalletToEdit(null);
    resetForm();
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    if (walletToEdit) {
      updateWallet({
        ...walletToEdit,
        name,
        type,
        color,
        balance: parseFloat(initialBalance) || 0,
      });
    } else {
      const newId = addWallet({
        name,
        type,
        balance: parseFloat(initialBalance) || 0,
        color,
      });
      if (mode === "import") {
        setTargetWalletForImport(newId);
        setIsModalOpen(false);
        setIsImportOpen(true);
      }
    }

    if (mode !== "import") setIsModalOpen(false);
    resetForm();
  };

  const handleImportExisting = (walletId: string) => {
    setTargetWalletForImport(walletId);
    setIsImportOpen(true);
  };

  const resetForm = () => {
    setName("");
    setType("cash");
    setInitialBalance("");
    setColor("#10b981");
    setMode("create");
  };

  const getWalletTransactions = (id: string) => {
    return transactions
      .filter(
        (t) =>
          (t.type === "expense" && t.fromWalletId === id) ||
          (t.type === "income" && t.toWalletId === id) ||
          (t.type === "transfer" &&
            (t.fromWalletId === id || t.toWalletId === id)),
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const selectedWallet = wallets.find((w) => w.id === selectedWalletId);
  const selectedWalletTxs = selectedWalletId
    ? getWalletTransactions(selectedWalletId)
    : [];

  // High-end 2050-style spring staggered animations
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.02 },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    show: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { type: "spring", damping: 20, stiffness: 220, mass: 0.8 },
    },
  };

  return (
    <MotionDiv
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold tracking-tight">
          {isHouseholdMode
            ? `${activeWorkspace.name} ${t("common.wallets")}`
            : t("wallets.myWallets")}
        </h2>
        <div className="flex gap-3">
          <button
            onClick={() => {
              setTargetWalletForImport("all");
              setIsImportOpen(true);
            }}
            className="px-4 py-2 bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-300 font-bold rounded-2xl hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors"
          >
            {t("wallets.importAll")}
          </button>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-black px-5 py-2.5 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all active:scale-95 tour-add-wallet"
          >
            <Plus size={20} /> {t("wallets.newWallet")}
          </button>
        </div>
      </div>

      <div className="tour-wallet-list grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activeWallets.map((wallet) => (
          <MotionDiv
            key={wallet.id}
            variants={item}
            whileHover={{ y: -8, scale: 1.02 }}
            onClick={() => setSelectedWalletId(wallet.id)}
            className="group relative h-64 rounded-[2rem] p-8 shadow-xl cursor-pointer overflow-hidden text-white border border-white/10"
            style={{
              background: `linear-gradient(135deg, ${wallet.color}, ${wallet.color}99)`,
            }}
          >
            {/* Glossy Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />
            <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-black/20 rounded-full blur-[60px]" />

            <div className="relative z-10 flex flex-col justify-between h-full">
              <div className="flex justify-between items-start">
                <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl border border-white/20">
                  {(() => {
                    const IconComp = wallet.icon ? ICON_MAP[wallet.icon] : null;
                    return IconComp ? (
                      <IconComp size={24} className="text-white" />
                    ) : (
                      <WalletIcon size={24} className="text-white" />
                    );
                  })()}
                </div>
                <div
                  className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-300 hidden md:flex pointer-events-none group-hover:pointer-events-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => openEdit(wallet)}
                    className="p-2 bg-black/20 hover:bg-black/40 rounded-xl backdrop-blur-sm transition-colors"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => setWalletToDelete(wallet.id)}
                    className="p-2 bg-black/20 hover:bg-rose-500/80 rounded-xl backdrop-blur-sm transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div>
                <div className="text-white/80 font-medium mb-1 tracking-wide truncate">
                  {wallet.name}
                </div>
                <div
                  className="text-4xl font-bold tracking-tight mb-4 truncate w-full"
                  title={formatAmount(wallet.balance)}
                >
                  {formatAmount(wallet.balance)}
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-white/60">
                  <span className="w-2 h-2 rounded-full bg-white/50 animate-pulse"></span>
                  {wallet.type}
                  {isHouseholdMode && currentMembers.length > 0 && (
                    <div className="flex -space-x-1.5 ml-2">
                      {currentMembers
                        .filter((m) => m.status === "active")
                        .slice(0, 3)
                        .map((m, i) => (
                          <div
                            key={m.uid}
                            className="w-5 h-5 rounded-full border border-white/30 flex items-center justify-center text-[8px] font-bold text-white overflow-hidden"
                            style={{
                              backgroundColor: [
                                "#6366f1",
                                "#f59e0b",
                                "#ef4444",
                              ][i % 3],
                              zIndex: 3 - i,
                            }}
                            title={m.displayName}
                          >
                            {m.avatarBase64 ? (
                              <img
                                src={m.avatarBase64}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            ) : m.photoURL ? (
                              <img
                                src={m.photoURL}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              m.displayName[0]?.toUpperCase() || "?"
                            )}
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Injected Flow Intelligence */}
              <div className="mt-4 pt-4 border-t border-white/20 flex justify-between items-center text-xs font-medium">
                <div className="flex flex-col">
                  <span className="text-white/60 uppercase tracking-widest text-[10px]">
                    {t("wallets.in")}
                  </span>
                  <span className="text-emerald-300">
                    +
                    {formatAmount(
                      calculateWalletFlow(transactions, wallet.id).inflow,
                    )}
                  </span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-white/60 uppercase tracking-widest text-[10px]">
                    {t("wallets.netFlow")}
                  </span>
                  <span
                    className={
                      calculateWalletFlow(transactions, wallet.id).netChange >=
                      0
                        ? "text-emerald-300"
                        : "text-rose-300"
                    }
                  >
                    {calculateWalletFlow(transactions, wallet.id).netChange > 0
                      ? "+"
                      : ""}
                    {formatAmount(
                      calculateWalletFlow(transactions, wallet.id).netChange,
                    )}
                  </span>
                </div>
                <div className="flex flex-col text-right">
                  <span className="text-white/60 uppercase tracking-widest text-[10px]">
                    {t("wallets.out")}
                  </span>
                  <span className="text-rose-300">
                    -
                    {formatAmount(
                      calculateWalletFlow(transactions, wallet.id).outflow,
                    )}
                  </span>
                </div>
              </div>
            </div>
          </MotionDiv>
        ))}

        {/* Add Button Card */}
        <MotionButton
          variants={item}
          onClick={openCreate}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="h-64 rounded-[2rem] border-2 border-dashed border-slate-300 dark:border-zinc-800 flex flex-col items-center justify-center gap-4 text-slate-400 hover:text-brand-500 hover:border-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/10 transition-all duration-300"
        >
          <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center transition-colors">
            <Plus size={32} />
          </div>
          <span className="font-semibold text-lg">
            {t("wallets.createNewWallet")}
          </span>
        </MotionButton>
      </div>

      {/* Archived Wallets Section */}
      {archivedWallets.length > 0 && (
        <div className="mt-12 pt-8 border-t border-slate-200 dark:border-zinc-800">
          <h3 className="text-lg font-bold text-slate-500 mb-6 flex items-center gap-2">
            <Archive size={20} /> {t("wallets.archivedWallets")}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 opacity-60 hover:opacity-100 transition-opacity">
            {archivedWallets.map((wallet) => (
              <div
                key={wallet.id}
                className="relative h-40 rounded-[2rem] p-6 bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex flex-col justify-between group"
              >
                <div className="flex justify-between items-start">
                  <span
                    className="font-bold text-slate-700 dark:text-slate-300 truncate max-w-[120px]"
                    title={wallet.name}
                  >
                    {wallet.name}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => archiveWallet(wallet.id, false)}
                      className="p-2 hover:bg-slate-200 dark:hover:bg-zinc-700 rounded-lg text-slate-400 hover:text-brand-500 transition-colors"
                    >
                      <RotateCcw size={16} />
                    </button>
                    <button
                      onClick={() => setWalletToDelete(wallet.id)}
                      className="p-2 hover:bg-slate-200 dark:hover:bg-zinc-700 rounded-lg text-slate-400 hover:text-rose-500 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <div
                  className="font-bold text-xl text-slate-500 truncate"
                  title={formatAmount(wallet.balance)}
                >
                  {formatAmount(wallet.balance)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Wallet Details Modal */}
      <AnimatePresence>
        {selectedWallet && (
          <div className="fixed inset-0 z-50 flex items-center justify-end">
            <MotionDiv
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setSelectedWalletId(null)}
            />

            <MotionDiv
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="bg-white dark:bg-zinc-950 w-full max-w-lg relative z-10 h-full shadow-2xl flex flex-col border-l border-slate-200 dark:border-white/5"
            >
              <div className="p-8 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50 dark:bg-black/50">
                <div className="flex items-center gap-4">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg"
                    style={{ backgroundColor: selectedWallet.color }}
                  >
                    {(() => {
                      const IconComp = selectedWallet.icon
                        ? ICON_MAP[selectedWallet.icon]
                        : null;
                      return IconComp ? (
                        <IconComp size={28} />
                      ) : (
                        <CreditCard size={28} />
                      );
                    })()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2
                      className="text-2xl font-bold truncate"
                      title={selectedWallet.name}
                    >
                      {selectedWallet.name}
                    </h2>
                    <p
                      className="text-slate-500 font-medium truncate"
                      title={formatAmount(selectedWallet.balance)}
                    >
                      {formatAmount(selectedWallet.balance)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedWalletId(null)}
                  className="p-2 hover:bg-slate-200 dark:hover:bg-zinc-800 rounded-full transition-colors"
                  title="Close"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Actions for Mobile */}
              <div className="p-4 grid grid-cols-4 gap-2 border-b border-slate-100 dark:border-white/5">
                <button
                  onClick={() => openEdit(selectedWallet)}
                  className="flex flex-col items-center justify-center gap-1 p-2 rounded-xl bg-slate-100 dark:bg-zinc-800 font-semibold hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors text-xs"
                >
                  <Pencil size={18} /> {t("common.edit")}
                </button>
                <button
                  onClick={() => setShowAnalytics(!showAnalytics)}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 p-2 rounded-xl font-semibold transition-colors text-xs",
                    showAnalytics
                      ? "bg-brand-100 dark:bg-brand-900/30 text-brand-600"
                      : "bg-slate-100 dark:bg-zinc-800",
                  )}
                >
                  <BarChart3 size={18} /> {t("wallets.analytics")}
                </button>
                <button
                  onClick={() => setWalletToDelete(walletToDelete)}
                  className="flex flex-col items-center justify-center gap-1 p-2 rounded-xl bg-rose-50 dark:bg-rose-900/10 font-semibold hover:bg-rose-100 dark:hover:bg-rose-900/20 transition-colors text-xs text-rose-600 dark:text-rose-400"
                >
                  <Trash2 size={18} /> {t("common.delete")}
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-0 custom-scrollbar">
                {showAnalytics ? (
                  <div className="p-6">
                    <WalletAnalytics
                      walletId={selectedWallet.id}
                      transactions={selectedWalletTxs}
                    />
                  </div>
                ) : (
                  <div className="p-6">
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">
                      {t("wallets.transactionHistory")}
                    </h3>
                    {selectedWalletTxs.length === 0 ? (
                      <div className="py-20 text-center text-slate-400">
                        {t("wallets.noTransactionsYet")}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {selectedWalletTxs.map((t, idx) => {
                          const cat = categories.find(
                            (c) => c.id === t.categoryId,
                          );
                          const isTransfer = t.type === "transfer";
                          const Icon = cat
                            ? getCategoryIcon(cat.icon)
                            : ArrowRightLeft;
                          let amount = t.amount;
                          let isPositive = false;
                          if (t.type === "income") isPositive = true;
                          if (t.type === "expense") isPositive = false;
                          if (t.type === "transfer") {
                            if (t.toWalletId === selectedWallet.id)
                              isPositive = true;
                            else isPositive = false;
                          }

                          return (
                            <MotionDiv
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: idx * 0.05 }}
                              key={t.id}
                              className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-white/5"
                            >
                              <div className="flex items-center gap-4">
                                <div
                                  className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center text-white shadow-sm",
                                    isTransfer ? "bg-slate-500" : "",
                                  )}
                                  style={{
                                    backgroundColor: !isTransfer
                                      ? cat?.color
                                      : undefined,
                                  }}
                                >
                                  {isTransfer ? (
                                    <ArrowRightLeft size={16} />
                                  ) : (
                                    <Icon size={16} />
                                  )}
                                </div>
                                <div>
                                  <div className="font-semibold text-slate-900 dark:text-slate-100">
                                    {t.note ||
                                      (isTransfer ? "Transfer" : cat?.name)}
                                  </div>
                                  <div className="text-xs text-slate-500 font-medium">
                                    {formatDate(t.date)}
                                  </div>
                                </div>
                              </div>
                              <div
                                className={cn(
                                  "font-bold text-lg",
                                  isPositive
                                    ? "text-emerald-500"
                                    : "text-slate-900 dark:text-white",
                                )}
                              >
                                {isPositive ? "+" : "-"}
                                {formatAmount(amount)}
                              </div>
                            </MotionDiv>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-black/50">
                <button
                  onClick={() => handleImportExisting(selectedWallet.id)}
                  className="w-full py-4 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white font-bold hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2"
                >
                  <Upload size={18} /> {t("wallets.importTransactions")}
                </button>
              </div>
            </MotionDiv>
          </div>
        )}
      </AnimatePresence>

      {/* Add/Edit Wallet Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <WalletModal
            onClose={() => {
              setIsModalOpen(false);
              resetForm();
            }}
            walletToEdit={walletToEdit}
            onImportRequested={(newWalletId) => {
              setTargetWalletForImport(newWalletId);
              setIsImportOpen(true);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isImportOpen && (
          <ImportWizard
            onClose={() => setIsImportOpen(false)}
            targetWalletId={targetWalletForImport}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {walletToDelete && (
          <WalletActionModal
            walletId={walletToDelete}
            onClose={() => setWalletToDelete(null)}
          />
        )}
      </AnimatePresence>
    </MotionDiv>
  );
};

export default Wallets;
