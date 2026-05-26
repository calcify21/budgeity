import React from "react";
import { useTranslation } from "react-i18next";
import { Filter, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import CustomSelect from "./CustomSelect";
import CustomDatePicker from "./CustomDatePicker";
import MultiRangeSlider from "./MultiRangeSlider";

const MotionDiv = motion.div as any;

interface TransactionFiltersModalProps {
  isOpen: boolean;
  onClose: () => void;
  typeFilter: "all" | "income" | "expense" | "transfer";
  setTypeFilter: (v: "all" | "income" | "expense" | "transfer") => void;
  walletFilter: string;
  setWalletFilter: (v: string) => void;
  categoryFilter: string;
  setCategoryFilter: (v: string) => void;
  dateFrom: string;
  setDateFrom: (v: string) => void;
  dateTo: string;
  setDateTo: (v: string) => void;
  minAmount: string | null;
  setMinAmount: (v: string | null) => void;
  maxAmount: string | null;
  setMaxAmount: (v: string | null) => void;
  setIsRangeManual: (v: boolean) => void;
  clearFilters: () => void;
  // Readonly data/helpers from parent
  wallets: any[];
  categories: any[];
  categoryOptions: any[];
  minTxAmount: number;
  maxTxAmount: number;
  formatAmount: (v: number) => string;
}

export const TransactionFiltersModal: React.FC<TransactionFiltersModalProps> = ({
  isOpen,
  onClose,
  typeFilter,
  setTypeFilter,
  walletFilter,
  setWalletFilter,
  categoryFilter,
  setCategoryFilter,
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
  minAmount,
  setMinAmount,
  maxAmount,
  setMaxAmount,
  setIsRangeManual,
  clearFilters,
  wallets,
  categoryOptions,
  minTxAmount,
  maxTxAmount,
  formatAmount,
}) => {
  const { t } = useTranslation();

  // Escape key dismissal
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-0 sm:items-center sm:p-4">
            <MotionDiv
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/60 backdrop-blur-md"
            />
            <MotionDiv
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="bg-white dark:bg-zinc-900 sm:rounded-[2.5rem] rounded-t-[2.5rem] border border-slate-100 dark:border-zinc-800 shadow-2xl w-full max-w-lg relative z-10 flex flex-col max-h-[90vh] overflow-hidden"
            >
            {/* Header */}
            <div className="p-8 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50 dark:bg-black/50">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-brand-500/10 text-brand-500 flex items-center justify-center shadow-inner">
                  <Filter size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-2xl text-slate-800 dark:text-zinc-100">
                    {t("transactions.filters")}
                  </h3>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={clearFilters}
                  className="text-sm font-bold text-slate-400 hover:text-brand-600 transition-colors"
                >
                  {t("transactions.clearAll")}
                </button>
                <div className="w-px h-6 bg-slate-200 dark:bg-zinc-700" />
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-slate-200 dark:hover:bg-zinc-800 rounded-full transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-white"
                  title="Close"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 dark:text-zinc-500 tracking-widest mb-2">
                    Transaction Type
                  </label>
                  <CustomSelect
                    value={typeFilter}
                    onChange={(v) => setTypeFilter(v as any)}
                    options={[
                      { value: "all", label: t("transactions.allTypes") },
                      { value: "income", label: t("common.income") },
                      { value: "expense", label: t("common.expense") },
                      { value: "transfer", label: t("common.transfer") },
                    ]}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 dark:text-zinc-500 tracking-widest mb-2">
                    Wallet
                  </label>
                  <CustomSelect
                    value={walletFilter}
                    onChange={setWalletFilter}
                    options={[
                      { value: "all", label: t("transactions.allWallets") },
                      ...wallets.map((w) => ({ value: w.id, label: w.name })),
                    ]}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-black uppercase text-slate-400 dark:text-zinc-500 tracking-widest mb-2">
                    {t("common.category")}
                  </label>
                  <CustomSelect
                    value={categoryFilter}
                    onChange={setCategoryFilter}
                    options={categoryOptions}
                    searchable
                    placeholder={t("transactions.filterByCategory")}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-black uppercase text-slate-400 dark:text-zinc-500 tracking-widest mb-2">
                    {t("transactions.amountRange")}
                  </label>
                  <div className="px-1 pt-1 pb-4">
                    <MultiRangeSlider
                      min={minTxAmount}
                      max={maxTxAmount}
                      minVal={minAmount ? parseFloat(minAmount) : minTxAmount}
                      maxVal={maxAmount ? parseFloat(maxAmount) : maxTxAmount}
                      onChange={(min, max) => {
                        setMinAmount(min.toString());
                        setMaxAmount(max.toString());
                        setIsRangeManual(true);
                      }}
                      formatValue={(val) => formatAmount(val)}
                    />
                  </div>
                </div>

                <div className="sm:col-span-2 flex gap-4">
                  <div className="w-1/2">
                    <CustomDatePicker
                      value={dateFrom}
                      onChange={setDateFrom}
                      label={t("common.from")}
                      className="bg-slate-50 dark:bg-zinc-950 border-slate-200 dark:border-zinc-800"
                    />
                  </div>
                  <div className="w-1/2">
                    <CustomDatePicker
                      value={dateTo}
                      onChange={setDateTo}
                      label={t("common.to")}
                      className="bg-slate-50 dark:bg-zinc-950 border-slate-200 dark:border-zinc-800"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-8 border-t border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-black/50 flex justify-end gap-4">
              <button
                onClick={clearFilters}
                className="px-6 py-4 rounded-2xl border border-slate-200 dark:border-zinc-700 text-sm font-bold text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
              >
                Reset
              </button>
              <button
                onClick={onClose}
                className="px-8 py-4 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold shadow-xl shadow-brand-500/20 hover:scale-[1.02] active:scale-95 transition-all"
              >
                Apply Filters
              </button>
            </div>
          </MotionDiv>
        </div>
      </div>
      )}
    </AnimatePresence>
  );
};
