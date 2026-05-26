import React from "react";
import { useTranslation } from "react-i18next";
import { X, Pencil, BarChart3, Trash2, ArrowRightLeft, CreditCard, Upload } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn, formatDate, getCategoryIcon, ICON_MAP } from "../utils";
import WalletAnalytics from "./WalletAnalytics";
import { useEscapeKey } from "../hooks/useEscapeKey";

const MotionDiv = motion.div as any;

interface WalletDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedWallet: any;
  selectedWalletTxs: any[];
  categories: any[];
  formatAmount: (v: number) => string;
  openEdit: (w: any) => void;
  showAnalytics: boolean;
  setShowAnalytics: (v: boolean) => void;
  setWalletToDelete: (id: string) => void;
  handleImportExisting: (id: string) => void;
}

export const WalletDetailsModal: React.FC<WalletDetailsModalProps> = ({
  isOpen,
  onClose,
  selectedWallet,
  selectedWalletTxs,
  categories,
  formatAmount,
  openEdit,
  showAnalytics,
  setShowAnalytics,
  setWalletToDelete,
  handleImportExisting,
}) => {
  const { t } = useTranslation();

  // Escape key dismissal
  useEscapeKey(isOpen, onClose);

  if (!selectedWallet) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <MotionDiv
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          <MotionDiv
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            transition={{ type: "spring", duration: 0.3 }}
            className="bg-white dark:bg-zinc-900 rounded-[2.5rem] w-full max-w-lg relative z-10 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-100 dark:border-zinc-800"
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
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAnalytics(!showAnalytics)}
                  className={cn(
                    "p-2 rounded-full transition-colors",
                    showAnalytics
                      ? "bg-brand-500/10 text-brand-500"
                      : "text-slate-500 hover:bg-slate-200 dark:hover:bg-zinc-800"
                  )}
                  title={t("wallets.analytics")}
                >
                  <BarChart3 size={20} />
                </button>
                <div className="w-px h-6 bg-slate-200 dark:bg-zinc-700 mx-2" />
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-slate-200 dark:hover:bg-zinc-800 rounded-full transition-colors"
                  title="Close"
                >
                  <X size={24} />
                </button>
              </div>
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

            <div className="p-8 border-t border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-black/50 space-y-4">
              <button
                onClick={() => handleImportExisting(selectedWallet.id)}
                className="w-full py-4 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white rounded-2xl font-bold hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <Upload size={18} /> {t("wallets.importTransactions")}
              </button>

              <div className="flex gap-3">
                <button
                  onClick={() => setWalletToDelete(selectedWallet.id)}
                  className="p-4 bg-rose-50 dark:bg-rose-900/10 text-rose-600 dark:text-rose-400 font-bold rounded-2xl hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-colors"
                  title={t("common.delete")}
                >
                  <Trash2 size={20} />
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 py-4 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white border border-slate-200 dark:border-zinc-700 rounded-2xl font-bold hover:bg-slate-50 dark:hover:bg-zinc-700 transition-colors flex items-center justify-center gap-2"
                >
                  {t("common.cancel")}
                </button>
                <button
                  onClick={() => openEdit(selectedWallet)}
                  className="flex-1 py-4 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl font-bold shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 shadow-brand-500/20"
                >
                  <Pencil size={18} /> {t("common.edit")}
                </button>
              </div>
            </div>
          </MotionDiv>
        </div>
      )}
    </AnimatePresence>
  );
};
