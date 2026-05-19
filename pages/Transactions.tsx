import React, { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import CustomDatePicker from "../components/CustomDatePicker";
import { useData } from "../context/DataContext";
import { formatDate, cn, getCategoryIcon } from "../utils";
import { useHousehold } from "../context/HouseholdContext";
import {
  ArrowRightLeft,
  Search,
  Filter,
  Calendar,
  Eye,
  Trash2,
  Plus,
  TrendingUp,
  TrendingDown,
  CalendarDays,
  Activity,
  X,
  CheckCircle2,
  Edit2,
  Check,
} from "lucide-react";
import { Transaction } from "../types";
import {
  calculateBehavioralStats,
  calculateSpendingAcceleration,
  calculateHighestSpendingDay,
} from "../utils/analytics";
import AddTransactionModal from "../components/AddTransactionModal";
import TransactionDetailsModal from "../components/TransactionDetailsModal";
import CustomSelect from "../components/CustomSelect";
import BulkEditModal from "../components/BulkEditModal";
import { ConfirmModal } from "../components/ConfirmModal";
import { motion, AnimatePresence } from "framer-motion";
import Tooltip from "../components/Tooltip";
import { useSearchParams } from "react-router-dom";
import MultiRangeSlider from "../components/MultiRangeSlider";

// Fix: Cast motion components to any to resolve type errors
const MotionDiv = motion.div as any;

const Transactions: React.FC = () => {
  const { t } = useTranslation();
  const {
    transactions,
    wallets,
    goals,
    categories,
    formatAmount,
    deleteMultipleTransactions,
  } = useData();

  const { activeWorkspace, currentHousehold, currentMembers } = useHousehold();

  const [searchParams] = useSearchParams();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);
  const isSelectionMode = selectedIds.size > 0;

  const [showFilters, setShowFilters] = useState(
    searchParams.toString().length > 0,
  );
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [viewingTx, setViewingTx] = useState<Transaction | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [showBulkEditModal, setShowBulkEditModal] = useState(false);

  // Selection Helpers
  const toggleSelect = (id: string, event?: React.MouseEvent) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (event?.shiftKey && lastSelectedId) {
        const currentIndex = filtered.findIndex((t) => t.id === id);
        const lastIndex = filtered.findIndex((t) => t.id === lastSelectedId);

        if (currentIndex !== -1 && lastIndex !== -1) {
          const start = Math.min(currentIndex, lastIndex);
          const end = Math.max(currentIndex, lastIndex);
          const isSelecting = !prev.has(id);

          for (let i = start; i <= end; i++) {
            if (isSelecting) next.add(filtered[i].id);
            else next.delete(filtered[i].id);
          }
        }
      } else {
        if (next.has(id)) next.delete(id);
        else next.add(id);
      }
      return next;
    });
    setLastSelectedId(id);
  };

  const selectAllFiltered = () => {
    setSelectedIds(new Set(filtered.map((t) => t.id)));
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
    setLastSelectedId(null);
  };

  // Escape key to clear selection
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isSelectionMode) {
        clearSelection();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSelectionMode]);

  const selectedTransactions = useMemo(
    () => transactions.filter((t) => selectedIds.has(t.id)),
    [transactions, selectedIds],
  );

  const selectedTotal = useMemo(
    () =>
      selectedTransactions.reduce((sum, t) => {
        if (t.type === "expense") return sum - t.amount;
        if (t.type === "income") return sum + t.amount;
        return sum; // Transfers don't change net in this view
      }, 0),
    [selectedTransactions],
  );

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [typeFilter, setTypeFilter] = useState<
    "all" | "income" | "expense" | "transfer"
  >((searchParams.get("type") as any) || "all");
  const [walletFilter, setWalletFilter] = useState<string>(
    searchParams.get("wallet") || "all",
  );
  const [categoryFilter, setCategoryFilter] = useState<string>(
    searchParams.get("category") || "all",
  );
  const [dateFrom, setDateFrom] = useState(searchParams.get("from") || "");
  const [dateTo, setDateTo] = useState(searchParams.get("to") || "");
  const [minAmount, setMinAmount] = useState<string | null>(null);
  const [maxAmount, setMaxAmount] = useState<string | null>(null);
  const [isRangeManual, setIsRangeManual] = useState(false);

  // Calculate Global Min/Max values
  const { minTxAmount, maxTxAmount } = useMemo(() => {
    if (transactions.length === 0) return { minTxAmount: 0, maxTxAmount: 1000 };
    let min = Infinity;
    let max = -Infinity;
    transactions.forEach((t) => {
      if (t.amount < min) min = t.amount;
      if (t.amount > max) max = t.amount;
    });
    // Add buffer or defaults if single transaction
    if (min === max) {
      min = 0;
      max = max > 0 ? max * 2 : 100;
    }
    return { minTxAmount: Math.floor(min), maxTxAmount: Math.ceil(max) };
  }, [transactions]);

  // Update range when transactions change, unless user manually touched it
  useEffect(() => {
    if (!isRangeManual && transactions.length > 0) {
      setMinAmount(minTxAmount.toString());
      setMaxAmount(maxTxAmount.toString());
    }
  }, [minTxAmount, maxTxAmount, transactions.length, isRangeManual]);

  const clearFilters = () => {
    setSearch("");
    setTypeFilter("all");
    setWalletFilter("all");
    setCategoryFilter("all");
    setDateFrom("");
    setDateTo("");
    setMinAmount(minTxAmount.toString());
    setMaxAmount(maxTxAmount.toString());
    setIsRangeManual(false);
  };

  const getWalletName = (id: string | null) => {
    const wallet = wallets.find((w) => w.id === id);
    if (wallet) return wallet.name;
    const goal = goals.find((g) => g.id === id);
    if (goal) return goal.name;
    return "Unknown";
  };
  const getCategory = (id: string) => categories.find((c) => c.id === id);

  const filtered = useMemo(() => {
    const result = transactions
      .filter((t) => {
        if (typeFilter !== "all" && t.type !== typeFilter) return false;
        if (walletFilter !== "all") {
          if (t.type === "transfer") {
            if (
              t.fromWalletId !== walletFilter &&
              t.toWalletId !== walletFilter
            )
              return false;
          } else {
            if (
              (t.type === "income" ? t.toWalletId : t.fromWalletId) !==
              walletFilter
            )
              return false;
          }
        }
        if (categoryFilter !== "all" && t.categoryId !== categoryFilter)
          return false;
        if (dateFrom && new Date(t.date) < new Date(dateFrom)) return false;
        if (dateTo) {
          const d = new Date(dateTo);
          d.setHours(23, 59, 59);
          if (new Date(t.date) > d) return false;
        }
        if (minAmount && t.amount < parseFloat(minAmount)) return false;
        if (maxAmount && t.amount > parseFloat(maxAmount)) return false;
        if (search) {
          const catName = getCategory(t.categoryId)?.name.toLowerCase() || "";
          const note = t.note.toLowerCase();
          return (
            catName.includes(search.toLowerCase()) ||
            note.includes(search.toLowerCase())
          );
        }
        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return result;
  }, [
    transactions,
    typeFilter,
    walletFilter,
    categoryFilter,
    dateFrom,
    dateTo,
    minAmount,
    maxAmount,
    search,
    categories,
  ]);

  // Group by date
  const groupedTransactions = filtered.reduce(
    (groups, transaction) => {
      const date = transaction.date.split("T")[0];
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(transaction);
      return groups;
    },
    {} as Record<string, Transaction[]>,
  );

  const sortedDates = Object.keys(groupedTransactions).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime(),
  );

  const filteredCategories = useMemo(() => {
    if (typeFilter === "all") return categories;
    if (typeFilter === "transfer") return [];
    return categories.filter((c) => c.type === typeFilter);
  }, [categories, typeFilter]);

  const behavioralStats = useMemo(
    () => calculateBehavioralStats(filtered, categories),
    [filtered, categories],
  );

  const spendingAcceleration = useMemo(() => {
    return calculateSpendingAcceleration(filtered, 30);
  }, [filtered]);

  const highestDay = useMemo(
    () => calculateHighestSpendingDay(filtered),
    [filtered],
  );

  const categoryOptions = [
    { value: "all", label: t("transactions.allCategories") || "All Categories" },
    ...filteredCategories.map((c) => ({
      value: c.id,
      label: c.name,
      icon: getCategoryIcon(c.icon),
      color: c.color,
    })),
  ];

  const getRelativeDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";

    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      month: "short",
      day: "numeric",
    };
    if (date.getFullYear() !== today.getFullYear()) {
      options.year = "numeric";
    }

    return date.toLocaleDateString("en-US", options);
  };

  const handleDeleteAll = () => {
    const ids = filtered.map((t) => t.id);
    deleteMultipleTransactions(ids);
    setShowDeleteConfirm(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <h2 className="text-3xl font-bold tracking-tight">
            {t("common.transactions")}
          </h2>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full">
          <div className="relative group flex-1 w-full">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-500 transition-colors"
            />
            <input
              type="text"
              placeholder={t("transactions.searchPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 outline-none w-full shadow-sm transition-all"
            />
          </div>

          <div className="flex items-center justify-end gap-3 shrink-0 w-full sm:w-auto">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "tour-transaction-filters flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-bold transition-all shadow-sm shrink-0",
                showFilters
                  ? "bg-brand-500 text-white border-brand-500 shadow-brand-500/30"
                  : "bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50",
              )}
            >
              <Filter size={18} />
            </button>

            {filtered.length > 0 && !isSelectionMode && (
              <>
                <button
                  onClick={selectAllFiltered}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-brand-100 dark:border-brand-900/30 bg-brand-50 dark:bg-brand-900/10 text-brand-600 dark:text-brand-400 font-bold text-sm hover:bg-brand-100 dark:hover:bg-brand-900/20 transition-all shadow-sm shrink-0"
                >
                  <CheckCircle2 size={18} />
                  <span>{t("transactions.selectAll")}</span>
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-rose-100 dark:border-rose-900/30 bg-rose-50 dark:bg-rose-900/10 text-rose-600 dark:text-rose-400 font-bold text-sm hover:bg-rose-100 dark:hover:bg-rose-900/20 transition-all shadow-sm shrink-0"
                >
                  <Trash2 size={18} />
                  <span className="hidden lg:inline">
                    {t("transactions.deleteAll")}
                  </span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showFilters && (
          <MotionDiv
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2rem] border border-slate-200 dark:border-zinc-800 shadow-xl mb-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-sm uppercase tracking-wider text-slate-500">
                  {t("transactions.filters")}
                </h3>
                <button
                  onClick={clearFilters}
                  className="text-xs font-bold text-brand-600 hover:text-brand-700"
                >
                  {t("transactions.clearAll")}
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
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

                <CustomSelect
                  value={walletFilter}
                  onChange={setWalletFilter}
                  options={[
                    { value: "all", label: t("transactions.allWallets") },
                    ...wallets.map((w) => ({ value: w.id, label: w.name })),
                  ]}
                />
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
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
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    {t("transactions.amountRange")}
                  </label>
                  <div className="px-1 pt-1">
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
                <div className="md:col-span-4 flex gap-2">
                  <div className="w-1/2">
                    <CustomDatePicker
                      value={dateFrom}
                      onChange={setDateFrom}
                      label={t("common.from")}
                      className="bg-slate-50 dark:bg-black border-none"
                    />
                  </div>
                  <div className="w-1/2">
                    <CustomDatePicker
                      value={dateTo}
                      onChange={setDateTo}
                      label={t("common.to")}
                      className="bg-slate-50 dark:bg-black border-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          </MotionDiv>
        )}
      </AnimatePresence>

      {filtered.length > 0 && (
        <MotionDiv
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            type: "spring",
            damping: 20,
            stiffness: 220,
            mass: 0.8,
          }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          {/* Behavioral Stats */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-5 rounded-[2rem] shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-brand-500/10 flex items-center justify-center text-brand-500">
                <Activity size={16} />
              </div>
              <h3 className="font-bold text-sm tracking-wide text-slate-700 dark:text-slate-200">
                {t("transactions.behavioralStats")}
              </h3>
            </div>
            <div className="space-y-2 text-sm text-slate-600 dark:text-zinc-400">
              <div className="flex justify-between items-center">
                <span>{t("transactions.totalTransactions")}</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {behavioralStats.totalTransactions}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>{t("transactions.averageValue")}</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {formatAmount(behavioralStats.averageValue)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>{t("transactions.highestExpense")}</span>
                <span className="font-bold text-rose-500">
                  {formatAmount(behavioralStats.highestSingleExpense)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>{t("transactions.topCategory")}</span>
                <span className="font-bold text-brand-600 dark:text-brand-400 truncate max-w-[100px] text-right">
                  {behavioralStats.topCategory || "N/A"}
                </span>
              </div>
            </div>
          </div>

          {/* Spending Acceleration */}
          <div className="bg-amber-50 dark:bg-zinc-900 border border-amber-100 dark:border-amber-500/20 p-5 rounded-[2rem] shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
                  {spendingAcceleration > 0 ? (
                    <TrendingUp size={16} />
                  ) : (
                    <TrendingDown size={16} />
                  )}
                </div>
                <h3 className="font-bold text-sm tracking-wide text-amber-900 dark:text-amber-200">
                  {t("transactions.spendingVelocity")}
                </h3>
              </div>
              <p className="text-sm text-slate-600 dark:text-zinc-400 leading-relaxed font-medium"
                 dangerouslySetInnerHTML={{
                   __html: spendingAcceleration > 0
                     ? t("transactions.spendingIncreased", { percent: spendingAcceleration })
                     : t("transactions.spendingDecreased", { percent: Math.abs(spendingAcceleration) })
                 }}
              />
            </div>
          </div>

          {/* Highest Spending Day */}
          <div className="bg-indigo-50 dark:bg-zinc-900 border border-indigo-100 dark:border-indigo-500/20 p-5 rounded-[2rem] shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                  <CalendarDays size={16} />
                </div>
                <h3 className="font-bold text-sm tracking-wide text-indigo-900 dark:text-indigo-200">
                  {t("transactions.highestSpendDay")}
                </h3>
              </div>
              {highestDay ? (
                <p className="text-sm text-slate-600 dark:text-zinc-400 leading-relaxed font-medium"
                   dangerouslySetInnerHTML={{
                     __html: t("transactions.highestSpendDayDesc", {
                       day: highestDay.dayName,
                       amount: formatAmount(highestDay.amount),
                     })
                   }}
                />
              ) : (
                <p className="text-sm text-slate-400 italic">
                  {t("transactions.notEnoughData")}
                </p>
              )}
            </div>
          </div>
        </MotionDiv>
      )}

      <div className="space-y-6 pb-20">
        {sortedDates.length === 0 ? (
          <div className="py-24 text-center bg-white/50 dark:bg-zinc-900/50 rounded-[2rem] border-2 border-dashed border-slate-200 dark:border-white/10 flex flex-col items-center gap-5">
            <div className="w-20 h-20 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center text-slate-300 dark:text-zinc-600">
              <Filter size={40} strokeWidth={1.5} />
            </div>
            <div className="space-y-2">
              <p className="text-lg font-bold text-slate-900 dark:text-white">
                {t("transactions.noTransactionsFound")}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                {t("transactions.emptyTransactions")}
              </p>
            </div>
          </div>
        ) : (
          sortedDates.map((date) => {
            const groupTxs = groupedTransactions[date];
            const isGroupSelected = groupTxs.every((t) =>
              selectedIds.has(t.id),
            );

            return (
              <div key={date} className="space-y-3">
                <div className="flex items-center justify-between pr-4 pl-4">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <Calendar size={14} />
                    {getRelativeDate(date)}
                  </h3>
                  <button
                    onClick={() => {
                      if (isGroupSelected) {
                        const next = new Set(selectedIds);
                        groupTxs.forEach((t) => next.delete(t.id));
                        setSelectedIds(next);
                      } else {
                        const next = new Set(selectedIds);
                        groupTxs.forEach((t) => next.add(t.id));
                        setSelectedIds(next);
                      }
                    }}
                    className={cn(
                      "text-xs font-bold px-3 py-1 rounded-full transition-all",
                      isGroupSelected
                        ? "bg-brand-500 text-white"
                        : "text-slate-400 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/10",
                    )}
                  >
                    {isGroupSelected
                      ? t("transactions.selectedAll")
                      : t("transactions.selectAll")}
                  </button>
                </div>
                <div className="bg-white dark:bg-zinc-900 rounded-[2rem] border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden divide-y divide-slate-100 dark:divide-white/5">
                  {groupTxs.map((tx, idx) => {
                    const cat = getCategory(tx.categoryId);
                    const isExpense = tx.type === "expense";
                    const isIncome = tx.type === "income";
                    const isTransfer = tx.type === "transfer";
                    const Icon = cat
                      ? getCategoryIcon(cat.icon)
                      : ArrowRightLeft;

                    return (
                      <MotionDiv
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        key={tx.id}
                        onClick={(e: React.MouseEvent) => {
                          if (isSelectionMode) {
                            toggleSelect(tx.id, e);
                          } else {
                            setViewingTx(tx);
                          }
                        }}
                        onMouseDown={(e: React.MouseEvent) => {
                          if (e.shiftKey) {
                            e.preventDefault();
                          }
                        }}
                        className={cn(
                          "p-5 hover:bg-slate-50 dark:hover:bg-white/5 transition-all flex flex-col sm:flex-row sm:items-center justify-between group gap-4 cursor-pointer relative",
                          idx === 0 && "tour-trans-details",
                          selectedIds.has(tx.id) &&
                            "bg-brand-50/50 dark:bg-brand-500/5 ring-1 ring-inset ring-brand-500/20",
                        )}
                      >
                        <div className="flex items-center gap-5">
                          {/* Checkbox */}
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSelect(tx.id, e);
                            }}
                            className={cn(
                              "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all shrink-0",
                              selectedIds.has(tx.id)
                                ? "bg-brand-500 border-brand-500 text-white scale-110 shadow-lg shadow-brand-500/20"
                                : "border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 lg:opacity-0 lg:group-hover:opacity-100",
                              isSelectionMode && "opacity-100",
                              "active:scale-95 touch-manipulation",
                            )}
                          >
                            <Check
                              size={14}
                              strokeWidth={4}
                              className={cn(
                                "transition-opacity",
                                selectedIds.has(tx.id)
                                  ? "opacity-100"
                                  : "opacity-0",
                              )}
                            />
                          </div>

                          <div
                            className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-md relative overflow-hidden"
                            style={{
                              backgroundColor: isTransfer
                                ? "#64748b"
                                : cat?.color || "#cbd5e1",
                            }}
                          >
                            <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent pointer-events-none" />
                            {isTransfer ? (
                              <ArrowRightLeft size={20} />
                            ) : (
                              <Icon size={20} />
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-slate-100 text-base flex items-center gap-2">
                              {isTransfer
                                ? t("common.transfer")
                                : cat?.name || t("transactions.uncategorized")}

                              {activeWorkspace.type === "household" &&
                                tx.createdBy && (
                                  <div className="flex items-center gap-1 px-1.5 py-0.5 bg-brand-50 dark:bg-brand-500/10 rounded-full border border-brand-100 dark:border-brand-500/20 shrink-0">
                                    <div className="w-3.5 h-3.5 rounded-full bg-brand-500 flex items-center justify-center text-[8px] text-white font-bold overflow-hidden">
                                      {(() => {
                                        const m = currentMembers.find(
                                          (m) => m.email === tx.createdBy,
                                        );
                                        if (m?.avatarBase64) {
                                          return (
                                            <img
                                              src={m.avatarBase64}
                                              alt=""
                                              className="w-full h-full object-cover"
                                            />
                                          );
                                        }
                                        if (m?.photoURL) {
                                          return (
                                            <img
                                              src={m.photoURL}
                                              alt=""
                                              className="w-full h-full object-cover"
                                            />
                                          );
                                        }
                                        return (m?.displayName ||
                                          tx.createdBy)[0].toUpperCase();
                                      })()}
                                    </div>
                                    <span className="text-[9px] font-bold text-brand-600 dark:text-brand-400">
                                      {currentMembers
                                        .find((m) => m.email === tx.createdBy)
                                        ?.displayName?.split(" ")[0] ||
                                        tx.createdBy.split("@")[0]}
                                    </span>
                                  </div>
                                )}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-2 mt-0.5 font-medium">
                              {isTransfer ? (
                                <span className="text-slate-600 dark:text-slate-300">
                                  {getWalletName(tx.fromWalletId)} &rarr;{" "}
                                  {getWalletName(tx.toWalletId)}
                                </span>
                              ) : (
                                <span>
                                  {getWalletName(
                                    tx.type === "income"
                                      ? tx.toWalletId
                                      : tx.fromWalletId,
                                  )}
                                </span>
                              )}
                              {!isTransfer &&
                                tx.subCategoryId &&
                                (() => {
                                  const subCat = cat?.subCategories?.find(
                                    (sc) => sc.id === tx.subCategoryId,
                                  );
                                  return subCat ? (
                                    <>
                                      <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-zinc-700" />
                                      <span className="text-brand-500 dark:text-brand-400">
                                        {subCat.name}
                                      </span>
                                    </>
                                  ) : null;
                                })()}
                              {tx.note && (
                                <>
                                  <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-zinc-700" />
                                  <span className="italic max-w-[250px] truncate pr-1">
                                    {tx.note}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-6 pl-[4.25rem] sm:pl-0">
                          <span
                            className={cn(
                              "font-bold text-lg whitespace-nowrap tracking-tight",
                              isIncome
                                ? "text-emerald-500"
                                : isExpense
                                  ? "text-slate-900 dark:text-white"
                                  : "text-slate-600 dark:text-slate-400",
                            )}
                          >
                            {isExpense && "-"}
                            {isIncome && "+"}
                            {formatAmount(tx.amount)}
                          </span>
                          <div className="hidden sm:flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0 duration-200 pointer-events-none group-hover:pointer-events-auto">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setViewingTx(tx);
                              }}
                              className="p-2 text-slate-400 hover:text-brand-500 bg-slate-100 dark:bg-zinc-800 rounded-xl transition-colors"
                            >
                              <Eye size={16} />
                            </button>
                          </div>
                        </div>
                      </MotionDiv>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>

      <AnimatePresence>
        {viewingTx && (
          <TransactionDetailsModal
            transaction={viewingTx}
            onClose={() => setViewingTx(null)}
            onEdit={() => {
              setViewingTx(null);
              setEditingTx(viewingTx);
            }}
          />
        )}
        {(editingTx || isAddModalOpen) && (
          <AddTransactionModal
            onClose={() => {
              setEditingTx(null);
              setIsAddModalOpen(false);
            }}
            transactionToEdit={editingTx || undefined}
          />
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteAll}
        title={t("transactions.deleteTransactionsTitle")}
        message={t("transactions.deleteTransactionsMessage", {
          count: filtered.length,
        })}
      />

      <ConfirmModal
        isOpen={showBulkDeleteConfirm}
        onClose={() => setShowBulkDeleteConfirm(false)}
        onConfirm={() => {
          deleteMultipleTransactions(Array.from(selectedIds));
          clearSelection();
          setShowBulkDeleteConfirm(false);
        }}
        title={t("transactions.deleteSelectedTitle")}
        message={t("transactions.deleteSelectedMessage", {
          count: selectedIds.size,
        })}
        confirmText={t("transactions.deleteSelected")}
        isDestructive
      />

      {/* Floating Action Bar */}
      <AnimatePresence>
        {isSelectionMode && (
          <MotionDiv
            initial={{ y: 100, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 100, opacity: 0, scale: 0.95 }}
            className="fixed bottom-6 right-6 lg:bottom-10 lg:right-10 z-[100] w-auto max-w-[calc(100vw-3rem)]"
          >
            <div className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-2xl border border-slate-200 dark:border-white/10 p-2 sm:p-3 rounded-[2rem] sm:rounded-full shadow-2xl flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4 min-w-[280px]">
              <div className="flex items-center gap-3 pl-2 sm:pl-4 py-1">
                <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center font-black text-sm shadow-lg shadow-emerald-500/20">
                  {selectedIds.size}
                </div>
                <div className="flex flex-col justify-center">
                  <span className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider leading-none">
                    {t("transactions.selected")}
                  </span>
                </div>
              </div>

              {selectedTotal !== 0 && (
                <div className="flex flex-col border-l border-slate-100 dark:border-white/5 pl-4 px-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider leading-none mb-1">
                    {t("transactions.netTotal")}
                  </span>
                  <span
                    className={cn(
                      "text-sm font-bold leading-none",
                      selectedTotal > 0 ? "text-emerald-500" : "text-rose-500",
                    )}
                  >
                    {selectedTotal > 0 ? "+" : "-"}
                    {formatAmount(Math.abs(selectedTotal))}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-1.5 sm:ml-auto bg-slate-50 dark:bg-white/5 p-1 rounded-full">
                <button
                  onClick={selectAllFiltered}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-brand-500 rounded-full transition-colors"
                >
                  {t("transactions.selectAll")}
                </button>
                <div className="h-4 w-px bg-slate-200 dark:bg-white/10" />
                <button
                  onClick={clearSelection}
                  className="p-2 text-slate-400 hover:bg-slate-200 dark:hover:bg-zinc-800 rounded-full transition-colors"
                >
                  <X size={18} />
                </button>
                <div className="h-4 w-px bg-slate-200 dark:bg-white/10" />
                <button
                  onClick={() => setShowBulkEditModal(true)}
                  className="p-2 text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-full transition-colors"
                >
                  <Edit2 size={18} />
                </button>
                <button
                  onClick={() => setShowBulkDeleteConfirm(true)}
                  className="bg-rose-500 hover:bg-rose-600 text-white p-2.5 rounded-full shadow-lg shadow-rose-500/20 transition-all"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </MotionDiv>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showBulkEditModal && (
          <BulkEditModal
            selectedTransactions={selectedTransactions}
            onClose={() => setShowBulkEditModal(false)}
            onSuccess={() => {
              setShowBulkEditModal(false);
              clearSelection();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Transactions;
