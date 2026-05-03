import React, { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { useData } from "../context/DataContext";
import { useSearchParams } from "react-router-dom";
import { RecurringTransaction, TransactionType } from "../types";
import { cn, getCategoryIcon } from "../utils";
import { calculateNextDueDate } from "../services/recurringEngine";
import {
  Plus,
  Repeat,
  Calendar,
  Trash2,
  Pencil,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Play,
  Pause,
  FileText,
  PieChart,
  Activity,
} from "lucide-react";
import { useToast } from "../context/ToastContext";
import CustomDatePicker from "../components/CustomDatePicker";
import CustomSelect from "../components/CustomSelect";
import { ConfirmModal } from "../components/ConfirmModal";
import WalletModal from "../components/WalletModal";
import CategoryModal from "../components/CategoryModal";

const MotionDiv = motion.div as any;

const Subscriptions: React.FC = () => {
  const {
    recurringTransactions,
    transactions,
    addRecurringTransaction,
    updateRecurringTransaction,
    updateRecurringTransactionWithHistory,
    deleteRecurringTransaction,
    wallets,
    categories,
    formatAmount,
    confirmManualSubscriptionPayment,
  } = useData();
  const { t } = useTranslation();
  const { success } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<RecurringTransaction | null>(
    null,
  );
  const [subToDelete, setSubToDelete] = useState<string | null>(null);

  // Form State
  const [type, setType] = useState<"expense" | "income">("expense");
  const [amount, setAmount] = useState("");
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [frequency, setFrequency] = useState<
    "daily" | "weekly" | "monthly" | "yearly"
  >("monthly");
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [walletId, setWalletId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [subcategoryId, setSubcategoryId] = useState("");
  const [autoAdd, setAutoAdd] = useState(true);
  const [pendingHistoryUpdate, setPendingHistoryUpdate] = useState<{
    payload: any;
    linkedCount: number;
  } | null>(null);

  const [showAddWallet, setShowAddWallet] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);

  const openModal = (sub?: RecurringTransaction) => {
    if (sub) {
      setEditingSub(sub);
      setType(sub.type as "income" | "expense");
      setAmount(sub.amount.toString());
      setFrequency(sub.frequency as any);
      setStartDate(sub.startDate.split("T")[0]);
      setWalletId(sub.walletId || "");
      setCategoryId(sub.categoryId);
      setName(sub.name || "");
      setNote(sub.note || "");
      setSubcategoryId(sub.subcategoryId || "");
      setAutoAdd(sub.autoAdd);
    } else {
      setEditingSub(null);
      setType("expense");
      setAmount("");
      setFrequency("monthly");
      setStartDate(new Date().toISOString().split("T")[0]);
      setWalletId(wallets[0]?.id || "");
      setCategoryId(
        categories.filter((c) => c.type === "expense")[0]?.id || "",
      );
      setName("");
      setNote("");
      setSubcategoryId("");
      setAutoAdd(true);
    }
    setIsModalOpen(true);
  };

  React.useEffect(() => {
    if (searchParams.get("add") === "true") {
      openModal();
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete("add");
      setSearchParams(nextParams, { replace: true });
    }
  }, [searchParams, setSearchParams, wallets, categories]);

  const persistSub = (payload: any, updateHistory: boolean) => {
    if (editingSub) {
      const dateChanged = editingSub.startDate !== payload.startDate;
      const nextRule = {
        ...editingSub,
        ...payload,
        id: editingSub.id,
        nextDueDate: dateChanged ? payload.nextDueDate : editingSub.nextDueDate,
      };

      if (updateHistory) {
        updateRecurringTransactionWithHistory(nextRule);
        success(
          t(
            "subscriptions.updatedWithHistory",
            "Subscription and payment history updated.",
          ),
        );
      } else {
        updateRecurringTransaction(nextRule);
        success(
          t("subscriptions.updatedFutureOnly", "Subscription updated."),
        );
      }
    } else {
      addRecurringTransaction(payload);
      success(t("subscriptions.newSubscription", "New Subscription"));
    }
    setIsModalOpen(false);
    setPendingHistoryUpdate(null);
  };

  const getDefaultNote = (sub: {
    name?: string;
    note?: string;
    frequency: string;
  }) => sub.note?.trim() || sub.name?.trim() || "";

  const hasCascadableChanges = (payload: any) => {
    if (!editingSub) return false;

    return (
      (editingSub.name || "") !== (payload.name || "") ||
      editingSub.categoryId !== payload.categoryId ||
      (editingSub.subcategoryId || "") !== (payload.subcategoryId || "") ||
      editingSub.walletId !== payload.walletId ||
      getDefaultNote(editingSub) !== getDefaultNote(payload)
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !startDate || !walletId || !categoryId) return;

    const payload = {
      type: type as "income" | "expense",
      amount: parseFloat(amount),
      name: name.trim() || undefined,
      note: note.trim() || undefined,
      walletId,
      categoryId,
      subcategoryId: subcategoryId || undefined,
      frequency,
      startDate: new Date(startDate + "T12:00:00").toISOString(),
      nextDueDate: new Date(startDate + "T12:00:00").toISOString(),
      isActive: true,
      autoAdd,
    };

    if (editingSub) {
      const linkedCount = transactions.filter(
        (tx) => tx.recurringId === editingSub.id,
      ).length;

      if (linkedCount > 0 && hasCascadableChanges(payload)) {
        setPendingHistoryUpdate({ payload, linkedCount });
        setIsModalOpen(false);
        return;
      }
    }

    persistSub(payload, false);
  };

  const confirmManualPayment = (sub: RecurringTransaction) => {
    if (!sub.walletId) return;

    const nextDate = calculateNextDueDate(sub.nextDueDate, sub.frequency, 1);
    const note =
      sub.note?.trim() ||
      sub.name?.trim() ||
      `(Manual) ${sub.frequency} payment`;

    confirmManualSubscriptionPayment(sub, note, nextDate);
    success(t("subscriptions.paymentConfirmed", "Payment confirmed"));
  };

  const toggleActive = (sub: RecurringTransaction) => {
    updateRecurringTransaction({ ...sub, isActive: !sub.isActive });
  };

  // Analytics & Derived Data
  const expenses = useMemo(
    () =>
      recurringTransactions.filter((t) => t.type === "expense" && t.isActive),
    [recurringTransactions],
  );

  const monthlyBurn = useMemo(() => {
    return expenses.reduce((acc, sub) => {
      let monthlyMultiplier = 1;
      if (sub.frequency === "daily") monthlyMultiplier = 30;
      else if (sub.frequency === "weekly") monthlyMultiplier = 4.33;
      else if (sub.frequency === "yearly") monthlyMultiplier = 1 / 12;
      return acc + sub.amount * monthlyMultiplier;
    }, 0);
  }, [expenses]);

  const yearlyBurn = monthlyBurn * 12;

  const next7DaysSpend = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    return expenses.reduce((acc, sub) => {
      const due = new Date(sub.nextDueDate);
      if (due >= today && due <= nextWeek) {
        return acc + sub.amount;
      }
      return acc;
    }, 0);
  }, [expenses]);

  const sortedSubs = useMemo(() => {
    return [...recurringTransactions].sort((a, b) => {
      const aDate = new Date(a.nextDueDate).getTime();
      const bDate = new Date(b.nextDueDate).getTime();
      return aDate - bDate;
    });
  }, [recurringTransactions]);

  const getSubStatus = (dateStr: string, autoAdd: boolean) => {
    const due = new Date(dateStr);
    due.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    if (due < today) return "overdue";
    if (due.getTime() === today.getTime()) return "today";
    if (due <= nextWeek) return "upcoming";
    return "normal";
  };

  return (
    <div className="space-y-8 pb-20 md:pb-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          {t("subscriptions.title")}
        </h2>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 bg-brand-600 dark:bg-brand-500 text-white px-5 py-2.5 rounded-2xl font-bold shadow-lg shadow-brand-500/20 hover:scale-105 transition-all"
        >
          <Plus size={20} />{" "}
          <span className="hidden sm:inline">
            {t("subscriptions.addSubscription")}
          </span>
        </button>
      </div>

      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-900 to-slate-800 dark:from-zinc-900 dark:to-zinc-800 p-8 shadow-xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-brand-500/20 blur-3xl rounded-full"></div>
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-blue-500/20 blur-3xl rounded-full"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <p className="text-slate-400 font-medium uppercase tracking-wider text-sm flex items-center gap-2">
              <Activity size={16} /> {t("subscriptions.monthlyBurn")}
            </p>
            <h3 className="text-5xl md:text-6xl font-black text-white tracking-tight">
              {formatAmount(monthlyBurn)}
            </h3>
            <p className="text-slate-300 font-medium text-lg">
              ≈ {formatAmount(yearlyBurn)} {t("subscriptions.yearlyBurn")}
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex items-center gap-4">
            <div className="bg-brand-500/20 text-brand-400 p-3 rounded-xl">
              <Calendar size={24} />
            </div>
            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase">
                {t("subscriptions.next7DaysSpend")}
              </p>
              <p className="text-white font-bold text-xl">
                {formatAmount(next7DaysSpend)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-xl font-bold flex items-center gap-2 text-slate-800 dark:text-zinc-100">
            <Calendar size={20} className="text-brand-500" />
            {t("subscriptions.timeline")}
          </h3>

          {sortedSubs.length === 0 ? (
            <div className="py-24 text-center glass-card rounded-[2rem] flex flex-col items-center gap-5">
              <div className="w-20 h-20 bg-slate-100 dark:bg-zinc-800 rounded-full flex items-center justify-center text-slate-400">
                <Repeat size={40} strokeWidth={1.5} />
              </div>
              <div className="max-w-xs space-y-2">
                <h3 className="text-xl font-bold text-slate-700 dark:text-zinc-200">
                  {t("subscriptions.noSubscriptions")}
                </h3>
                <p className="text-slate-500 dark:text-zinc-400">
                  {t("subscriptions.noSubscriptionsDesc")}
                </p>
              </div>
              <button
                onClick={() => openModal()}
                className="mt-2 bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400 px-6 py-2 rounded-xl font-bold hover:bg-brand-100 dark:hover:bg-brand-500/20 transition-colors"
              >
                {t("subscriptions.addSubscription")}
              </button>
            </div>
          ) : (
            <div className="space-y-4 relative">
              <div className="absolute left-6 top-8 bottom-8 w-px bg-slate-200 dark:bg-zinc-800 hidden sm:block"></div>

              <AnimatePresence>
                {sortedSubs.map((sub) => {
                  const status = getSubStatus(sub.nextDueDate, sub.autoAdd);
                  const isExpense = sub.type === "expense";
                  const category = categories.find(
                    (c) => c.id === sub.categoryId,
                  );
                  const Icon = category
                    ? getCategoryIcon(category.icon)
                    : Repeat;

                  let monthlyEq = sub.amount;
                  if (sub.frequency === "yearly") monthlyEq = sub.amount / 12;
                  if (sub.frequency === "weekly") monthlyEq = sub.amount * 4.33;

                  return (
                    <MotionDiv
                      key={sub.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="relative z-10"
                    >
                      <div
                        className={cn(
                          "glass-card p-5 rounded-2xl transition-all sm:ml-12 relative group",
                          !sub.isActive && "opacity-60 grayscale",
                          status === "overdue" &&
                            "border-rose-500/30 dark:border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.1)]",
                          status === "today" &&
                            "border-amber-500/30 dark:border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.1)]",
                        )}
                      >
                        <div
                          className={cn(
                            "absolute -left-14 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-4 border-white dark:border-zinc-950 hidden sm:block",
                            status === "overdue"
                              ? "bg-rose-500"
                              : status === "today" || status === "upcoming"
                                ? "bg-amber-500"
                                : "bg-brand-500",
                          )}
                        ></div>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div
                              className={cn(
                                "w-12 h-12 rounded-xl flex items-center justify-center shadow-sm",
                                category
                                  ? `bg-${category.color}-100 text-${category.color}-600 dark:bg-${category.color}-500/20 dark:text-${category.color}-400`
                                  : "bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400",
                              )}
                              style={category ? { color: category.color } : {}}
                            >
                              <Icon size={24} />
                            </div>
                            <div>
                              <h4 className="font-bold text-lg text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                                {sub.name || category?.name || "Subscription"}
                                {!sub.autoAdd && (
                                  <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 tracking-wider">
                                    {t("subscriptions.manualTag")}
                                  </span>
                                )}
                              </h4>
                              <p className="text-sm font-medium text-slate-500 dark:text-zinc-400 capitalize">
                                {t(`common.${sub.frequency}`)} •{" "}
                                {t("subscriptions.nextDue")}:{" "}
                                {new Date(sub.nextDueDate).toLocaleDateString()}
                              </p>
                              {sub.note && (
                                <p className="mt-1 text-xs text-slate-400 dark:text-zinc-500 line-clamp-1">
                                  {sub.note}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:flex-col sm:items-end gap-1">
                            <div
                              className={cn(
                                "text-xl font-black",
                                isExpense
                                  ? "text-slate-900 dark:text-white"
                                  : "text-emerald-600 dark:text-emerald-400",
                              )}
                            >
                              {isExpense ? "-" : "+"}
                              {formatAmount(sub.amount)}
                            </div>
                            <div className="text-xs font-semibold text-slate-400 dark:text-zinc-500">
                              ≈ {formatAmount(monthlyEq)} /mo
                            </div>
                          </div>
                        </div>

                        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-zinc-800/50 flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            {status === "overdue" && (
                              <span className="flex items-center gap-1.5 text-xs font-bold text-rose-600 bg-rose-50 dark:bg-rose-500/10 px-2.5 py-1 rounded-lg">
                                <AlertTriangle size={14} />{" "}
                                {t("subscriptions.statusOverdue")}
                              </span>
                            )}
                            {(status === "today" || status === "upcoming") && (
                              <span className="flex items-center gap-1.5 text-xs font-bold text-amber-600 bg-amber-50 dark:bg-amber-500/10 px-2.5 py-1 rounded-lg">
                                <Activity size={14} />{" "}
                                {t("subscriptions.statusUpcoming")}
                              </span>
                            )}

                            {!sub.autoAdd &&
                              sub.isActive &&
                              (status === "overdue" ||
                                status === "today" ||
                                status === "upcoming") && (
                                <button
                                  onClick={() => confirmManualPayment(sub)}
                                  className="flex items-center gap-1.5 text-xs font-bold text-brand-700 bg-brand-50 hover:bg-brand-100 dark:text-brand-300 dark:bg-brand-500/20 dark:hover:bg-brand-500/30 px-3 py-1 rounded-lg transition-colors"
                                >
                                  <CheckCircle size={14} />{" "}
                                  {t("subscriptions.confirmPayment")}
                                </button>
                              )}
                          </div>

                          <div className="flex items-center gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => toggleActive(sub)}
                              className="p-2 text-slate-400 hover:text-amber-500 bg-slate-50 hover:bg-amber-50 dark:bg-zinc-800/50 dark:hover:bg-amber-500/10 rounded-xl transition-colors"
                              title={
                                sub.isActive
                                  ? t("subscriptions.pause")
                                  : t("subscriptions.resume")
                              }
                            >
                              {sub.isActive ? (
                                <Pause size={16} />
                              ) : (
                                <Play size={16} />
                              )}
                            </button>
                            <button
                              onClick={() => openModal(sub)}
                              className="p-2 text-slate-400 hover:text-brand-500 bg-slate-50 hover:bg-brand-50 dark:bg-zinc-800/50 dark:hover:bg-brand-500/10 rounded-xl transition-colors"
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              onClick={() => setSubToDelete(sub.id)}
                              className="p-2 text-slate-400 hover:text-rose-500 bg-slate-50 hover:bg-rose-50 dark:bg-zinc-800/50 dark:hover:bg-rose-500/10 rounded-xl transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </MotionDiv>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <h3 className="text-xl font-bold flex items-center gap-2 text-slate-800 dark:text-zinc-100">
            <PieChart size={20} className="text-brand-500" />
            {t("subscriptions.insights")}
          </h3>

          <div className="glass-card rounded-3xl p-6 space-y-6">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-500 dark:text-zinc-400">
                {t("subscriptions.totalSubscriptions")}
              </p>
              <p className="text-3xl font-black text-slate-900 dark:text-white">
                {expenses.length}
              </p>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-semibold text-slate-500 dark:text-zinc-400">
                {t("subscriptions.categoryBreakdown")}
              </p>
              <div className="space-y-3">
                {Object.entries(
                  expenses.reduce(
                    (acc, sub) => {
                      const cat =
                        categories.find((c) => c.id === sub.categoryId)?.name ||
                        "Other";
                      let val = sub.amount;
                      if (sub.frequency === "yearly") val /= 12;
                      if (sub.frequency === "weekly") val *= 4.33;
                      acc[cat] = (acc[cat] || 0) + val;
                      return acc;
                    },
                    {} as Record<string, number>,
                  ),
                )
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 4)
                  .map(([catName, val], i) => (
                    <div
                      key={catName}
                      className="flex items-center justify-between"
                    >
                      <span className="text-sm font-medium text-slate-700 dark:text-zinc-300 truncate max-w-[120px]">
                        {catName}
                      </span>
                      <span className="text-sm font-bold text-slate-900 dark:text-white">
                        {formatAmount(val)}/mo
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <MotionDiv
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm"
          >
            <MotionDiv
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col border border-slate-100 dark:border-zinc-800"
            >
              <div className="px-6 py-4 border-b border-slate-100 dark:border-zinc-800 flex justify-between items-center bg-slate-50/50 dark:bg-zinc-900/50">
                <h3 className="text-xl font-extrabold text-slate-800 dark:text-white">
                  {editingSub
                    ? t("subscriptions.editSubscription")
                    : t("subscriptions.newSubscription")}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-300 transition-colors"
                >
                  <XCircle size={24} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto custom-scrollbar">
                <form
                  id="subForm"
                  onSubmit={handleSubmit}
                  className="space-y-5"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 dark:text-zinc-300">
                        {t("common.amount")}
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-white px-4 py-3 rounded-xl focus:ring-2 focus:ring-brand-500 font-medium"
                        placeholder="0.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 dark:text-zinc-300">
                        {t("subscriptions.billingCycle")}
                      </label>
                      <CustomSelect
                        value={frequency}
                        onChange={(v: any) => setFrequency(v)}
                        options={[
                          { value: "daily", label: t("common.daily") },
                          { value: "weekly", label: t("common.weekly") },
                          { value: "monthly", label: t("common.monthly") },
                          { value: "yearly", label: t("common.yearly") },
                        ]}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-zinc-300">
                      {t("subscriptions.serviceName")}
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={t("subscriptions.serviceNamePlaceholder")}
                      className="w-full bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-white px-4 py-3 rounded-xl focus:ring-2 focus:ring-brand-500 font-medium"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-1.5 text-sm font-bold text-slate-700 dark:text-zinc-300">
                      <FileText size={14} /> {t("transactionModal.noteLabel")}
                    </label>
                    <textarea
                      rows={3}
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder={t("transactionModal.notePlaceholder")}
                      className="w-full bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-white px-4 py-3 rounded-xl focus:ring-2 focus:ring-brand-500 font-medium resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-zinc-300">
                      {t("common.category")}
                    </label>
                    <CustomSelect
                      value={categoryId}
                      onChange={(val: any) => {
                        if (val === "NEW") {
                          setShowAddCategory(true);
                        } else {
                          setCategoryId(val);
                          setSubcategoryId("");
                        }
                      }}
                      options={[
                        ...categories
                          .filter((c) => c.type === type)
                          .map((c) => ({
                            value: c.id,
                            label: c.name,
                            icon: c.icon,
                            color: c.color,
                          })),
                        {
                          value: "NEW",
                          label: `+ ${t("transactionModal.newCategory")}`,
                        },
                      ]}
                    />
                  </div>

                  {categories.find((c) => c.id === categoryId)
                    ?.subCategories && (
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 dark:text-zinc-300">
                        {t("subscriptions.subcategoryOptional")}
                      </label>
                      <CustomSelect
                        value={subcategoryId}
                        onChange={(val: any) => setSubcategoryId(val)}
                        options={[
                          { value: "", label: t("subscriptions.none") },
                          ...(categories
                            .find((c) => c.id === categoryId)
                            ?.subCategories?.map((s) => ({
                              value: s.id,
                              label: s.name,
                            })) || []),
                        ]}
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-zinc-300">
                      {t("subscriptions.startDate")}
                    </label>
                    <CustomDatePicker
                      value={startDate}
                      onChange={setStartDate}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-zinc-300">
                      {t("common.wallet")}
                    </label>
                    <CustomSelect
                      value={walletId}
                      onChange={(val: any) => {
                        if (val === "NEW") setShowAddWallet(true);
                        else setWalletId(val);
                      }}
                      options={[
                        ...wallets.map((w) => ({
                          value: w.id,
                          label: w.name,
                          icon: w.icon,
                          color: w.color,
                          subtitle: formatAmount(w.balance),
                        })),
                        {
                          value: "NEW",
                          label: `+ ${t("walletModal.addNewWallet")}`,
                        },
                      ]}
                    />
                  </div>

                  <div className="bg-slate-100 dark:bg-zinc-800 p-4 rounded-xl flex items-start gap-4">
                    <div className="pt-0.5">
                      <input
                        type="checkbox"
                        checked={autoAdd}
                        onChange={(e) => setAutoAdd(e.target.checked)}
                        className="w-5 h-5 rounded text-brand-500 focus:ring-brand-500 dark:bg-zinc-900 border-slate-300 dark:border-zinc-700"
                        id="autoPay"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="autoPay"
                        className="text-sm font-bold text-slate-800 dark:text-white cursor-pointer block"
                      >
                        {t("subscriptions.autoPay")}
                      </label>
                      <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                        {t("subscriptions.autoPayDesc")}
                      </p>
                    </div>
                  </div>
                </form>
              </div>

              <div className="px-6 py-4 border-t border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/50">
                <button
                  type="submit"
                  form="subForm"
                  className="w-full bg-brand-600 hover:bg-brand-700 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-brand-500/20 transition-all text-lg"
                >
                  {t("subscriptions.save")}
                </button>
              </div>
            </MotionDiv>
          </MotionDiv>
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={!!subToDelete}
        onClose={() => setSubToDelete(null)}
        onConfirm={() => {
          if (subToDelete) {
            deleteRecurringTransaction(subToDelete, true);
            success(
              t(
                "subscriptions.deleteAndHistorySuccess",
                "Subscription and payment history deleted.",
              ),
            );
            setSubToDelete(null);
          }
        }}
        onConfirmSecondary={() => {
          if (subToDelete) {
            deleteRecurringTransaction(subToDelete, false);
            success(
              t(
                "subscriptions.deleteOnlySuccess",
                "Subscription deleted successfully.",
              ),
            );
            setSubToDelete(null);
          }
        }}
        title={t("subscriptions.deleteTitle")}
        message={t("subscriptions.deleteQuestion")}
        confirmText={t("subscriptions.deleteAndHistory")}
        confirmSecondaryText={t("subscriptions.deleteOnly")}
        isDestructive={true}
      />

      <ConfirmModal
        isOpen={!!pendingHistoryUpdate}
        onClose={() => {
          setPendingHistoryUpdate(null);
          setIsModalOpen(true);
        }}
        onConfirm={() => {
          if (pendingHistoryUpdate) {
            persistSub(pendingHistoryUpdate.payload, false);
          }
        }}
        onConfirmSecondary={() => {
          if (pendingHistoryUpdate) {
            persistSub(pendingHistoryUpdate.payload, true);
          }
        }}
        title={t(
          "subscriptions.applyExistingTitle",
          "Update Existing Payments?",
        )}
        message={
          <div className="space-y-3">
            <p>
              {t(
                "subscriptions.applyExistingMessage",
                "Do you want to update the linked payment history too, or only future payments?",
              )}
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              {t("subscriptions.applyExistingCount", {
                count: pendingHistoryUpdate?.linkedCount || 0,
                defaultValue: "{{count}} existing payments will be updated.",
              })}
            </p>
          </div>
        }
        confirmText={t("subscriptions.futureOnly", "Future Only")}
        confirmSecondaryText={t("subscriptions.updateExisting", "Update Existing")}
      />

      {showAddWallet && <WalletModal onClose={() => setShowAddWallet(false)} />}

      {showAddCategory && (
        <CategoryModal onClose={() => setShowAddCategory(false)} />
      )}
    </div>
  );
};

export default Subscriptions;
