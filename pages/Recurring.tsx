import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import CustomDatePicker from "../components/CustomDatePicker";
import { useData } from "../context/DataContext";
import { RecurringTransaction, TransactionType } from "../types";
import { cn } from "../utils";
import {
  Plus,
  Repeat,
  Calendar,
  Trash2,
  Pencil,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { useToast } from "../context/ToastContext";
import { motion, AnimatePresence } from "framer-motion";
import CustomSelect from "../components/CustomSelect";
import { ConfirmModal } from "../components/ConfirmModal";
import WalletModal from "../components/WalletModal";
import CategoryModal from "../components/CategoryModal";

const MotionDiv = motion.div as any;

const Recurring: React.FC = () => {
  const {
    recurringTransactions,
    addRecurringTransaction,
    updateRecurringTransaction,
    deleteRecurringTransaction,
    wallets,
    categories,
    goals,
    formatAmount,
  } = useData();
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<RecurringTransaction | null>(
    null,
  );
  const [ruleToDelete, setRuleToDelete] = useState<string | null>(null);
  const { success, error: toastError } = useToast();
  const [batchWarning, setBatchWarning] = useState<{
    count: number;
    payload: any;
  } | null>(null);

  useEffect(() => {
    if (searchParams.get("add") === "true") {
      openModal();
      const newParams = new URLSearchParams(searchParams);
      newParams.delete("add");
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Form State
  const [type, setType] = useState<TransactionType>("expense");
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

  const [showAddWallet, setShowAddWallet] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);

  const openModal = (rule?: RecurringTransaction) => {
    if (rule) {
      setEditingRule(rule);
      setType(rule.type);
      setAmount(rule.amount.toString());
      setFrequency(rule.frequency as any);
      setStartDate(rule.startDate.split("T")[0]);
      setWalletId(rule.walletId || "");
      setCategoryId(rule.categoryId);
      setName(rule.name || "");
      setSubcategoryId(rule.subcategoryId || "");
      setAutoAdd(rule.autoAdd);
    } else {
      setEditingRule(null);
      setType("expense");
      setAmount("");
      setFrequency("monthly");
      setStartDate(new Date().toISOString().split("T")[0]);
      setWalletId(wallets[0]?.id || "");
      setCategoryId(
        categories.filter((c) => c.type === "expense")[0]?.id || "",
      );
      setName("");
      setSubcategoryId("");
      setAutoAdd(true);
    }
    setIsModalOpen(true);
  };

  const saveRule = (payload: any) => {
    if (editingRule) {
      const dateChanged = editingRule.startDate !== payload.startDate;
      updateRecurringTransaction({
        ...editingRule,
        ...payload,
        id: editingRule.id,
        nextDueDate: dateChanged
          ? payload.nextDueDate
          : editingRule.nextDueDate,
      });
      success("Rule updated successfully.");
    } else {
      addRecurringTransaction(payload);
      success("New rule created.");
    }
    setIsModalOpen(false);
    setBatchWarning(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !amount ||
      !startDate ||
      !walletId ||
      !categoryId ||
      type === "transfer"
    )
      return;

    const start = new Date(startDate);
    if (start.getFullYear() < 2000) {
      toastError("Start date cannot be before Year 2000 for safety.");
      return;
    }

    // Warning for large catch-ups
    const diffTime = Math.abs(new Date().getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    let estimatedCount = 0;
    if (frequency === "daily") estimatedCount = diffDays;
    else if (frequency === "weekly") estimatedCount = diffDays / 7;
    else if (frequency === "monthly") estimatedCount = diffDays / 30;
    else if (frequency === "yearly") estimatedCount = diffDays / 365;

    const payload = {
      type: type as "income" | "expense",
      amount: parseFloat(amount),
      name: name.trim() || undefined,
      walletId,
      categoryId,
      subcategoryId: subcategoryId || undefined,
      frequency,
      startDate: new Date(startDate + "T12:00:00").toISOString(),
      nextDueDate: new Date(startDate + "T12:00:00").toISOString(),
      isActive: true,
      autoAdd,
    };

    if (estimatedCount > 100 && !editingRule) {
      setBatchWarning({ count: Math.round(estimatedCount), payload });
      return;
    }

    saveRule(payload);
  };

  const toggleActive = (rule: RecurringTransaction) => {
    updateRecurringTransaction({ ...rule, isActive: !rule.isActive });
  };

  const isDatePast =
    new Date(startDate) < new Date(new Date().setHours(0, 0, 0, 0));

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">
          {t("common.recurring")}
        </h2>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-black px-5 py-2.5 rounded-2xl font-bold shadow-lg hover:scale-105 transition-transform tour-recurring-add"
        >
          <Plus size={20} /> {t("recurring.addRule")}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {recurringTransactions.length === 0 ? (
          <div className="py-24 text-center bg-white/50 dark:bg-zinc-900/50 rounded-[2rem] border-2 border-dashed border-slate-200 dark:border-zinc-800 flex flex-col items-center gap-5">
            <div className="w-20 h-20 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center text-slate-300 dark:text-zinc-600">
              <Repeat size={40} strokeWidth={1.5} />
            </div>
            <div className="space-y-2">
              <p className="text-lg font-bold text-slate-900 dark:text-white">
                {t("recurring.noRecurring")}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Set up recurring rules to automate your tracking —
                subscriptions, rent, salary, and more.
              </p>
            </div>
            <button
              onClick={() => openModal()}
              className="px-6 py-3 bg-brand-600 text-white font-bold rounded-2xl hover:bg-brand-700 transition-colors shadow-lg shadow-brand-500/20"
            >
              {t("recurring.addRule")}
            </button>
          </div>
        ) : (
          recurringTransactions.map((rule) => {
            const cat = categories.find((c) => c.id === rule.categoryId);
            return (
              <MotionDiv
                key={rule.id}
                layout
                className="bg-white dark:bg-zinc-900 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={cn(
                      "p-3 rounded-xl shrink-0",
                      rule.isActive
                        ? "bg-brand-100 dark:bg-brand-900/20 text-brand-600"
                        : "bg-slate-100 dark:bg-zinc-800 text-slate-400",
                    )}
                  >
                    <Repeat size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-lg">
                        {rule.name || cat?.name || "Recurring"}
                      </h3>
                      <span
                        className={cn(
                          "text-xs px-2 py-0.5 rounded-lg font-bold uppercase",
                          rule.type === "expense"
                            ? "bg-rose-100 text-rose-600"
                            : "bg-emerald-100 text-emerald-600",
                        )}
                      >
                        {rule.type}
                      </span>
                      {!rule.autoAdd && (
                        <span className="text-[10px] px-2 py-0.5 rounded-lg font-bold uppercase bg-amber-100 text-amber-600">
                          {t("recurring.reminderOnly")}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-slate-500 flex gap-2 sm:gap-4 mt-1 flex-wrap">
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        {formatAmount(rule.amount)}
                      </span>
                      <span className="hidden sm:inline">•</span>
                      <span className="capitalize">{rule.frequency}</span>
                      <span className="hidden sm:inline">•</span>
                      <span>
                        Next: {new Date(rule.nextDueDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 self-end sm:self-auto">
                  <button
                    onClick={() => toggleActive(rule)}
                    className={cn(
                      "p-2 rounded-xl transition-colors",
                      rule.isActive
                        ? "text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                        : "text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800",
                    )}
                    title={
                      rule.isActive
                        ? t("recurring.pause")
                        : t("recurring.resume")
                    }
                  >
                    {rule.isActive ? (
                      <CheckCircle size={20} />
                    ) : (
                      <XCircle size={20} />
                    )}
                  </button>
                  <button
                    onClick={() => openModal(rule)}
                    className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
                  >
                    <Pencil size={20} />
                  </button>
                  <button
                    onClick={() => setRuleToDelete(rule.id)}
                    className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-colors"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </MotionDiv>
            );
          })
        )}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <MotionDiv
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
              onClick={() => setIsModalOpen(false)}
            />
            <MotionDiv
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              transition={{
                type: "spring",
                damping: 20,
                stiffness: 220,
                mass: 0.8,
              }}
              className="bg-white dark:bg-zinc-900 rounded-[2.5rem] w-full max-w-md relative z-10 p-8 shadow-2xl border border-slate-100 dark:border-white/10 max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              <h2 className="text-xl font-bold mb-6">
                {editingRule
                  ? t("recurring.editRule")
                  : t("recurring.newRecurringRule")}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <CustomSelect
                    value={type}
                    onChange={(v) => {
                      setType(v as any);
                      setCategoryId(
                        categories.filter((c) => c.type === v)[0]?.id || "",
                      );
                      setSubcategoryId("");
                    }}
                    options={[
                      { value: "income", label: t("common.income") },
                      { value: "expense", label: t("common.expense") },
                    ]}
                  />
                  <CustomSelect
                    value={frequency}
                    onChange={(v) => setFrequency(v as any)}
                    options={[
                      { value: "daily", label: t("common.daily") },
                      { value: "weekly", label: t("common.weekly") },
                      { value: "monthly", label: t("common.monthly") },
                      { value: "yearly", label: t("common.yearly") },
                    ]}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                    {t("recurring.nameOptional")}
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-4 bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-2xl outline-none"
                    placeholder="e.g. Netflix Subscription"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                    {t("common.amount")}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    className="w-full p-4 bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-2xl outline-none"
                    placeholder="0.00"
                  />
                </div>
                <CustomSelect
                  label={t("common.category")}
                  value={categoryId}
                  onChange={(v) => {
                    setCategoryId(v);
                    setSubcategoryId("");
                  }}
                  options={categories
                    .filter((c) => c.type === type)
                    .map((c) => ({
                      value: c.id,
                      label: c.name,
                      color: c.color,
                    }))}
                  searchable
                  onAddNew={() => setShowAddCategory(true)}
                />

                {(() => {
                  const selectedCat = categories.find((c) => c.id === categoryId);
                  if (
                    selectedCat?.subCategories &&
                    selectedCat.subCategories.length > 0
                  ) {
                    return (
                      <CustomSelect
                        label={t("recurring.subcategoryOptional")}
                        value={subcategoryId}
                        onChange={setSubcategoryId}
                        options={[
                          { value: "", label: t("recurring.none") },
                          ...selectedCat.subCategories.map((sc) => ({
                            value: sc.id,
                            label: sc.name,
                          })),
                        ]}
                      />
                    );
                  }
                  return null;
                })()}

                <CustomSelect
                  label={t("common.wallet")}
                  value={walletId}
                  onChange={setWalletId}
                  options={wallets.map((w) => ({ value: w.id, label: w.name }))}
                  onAddNew={() => setShowAddWallet(true)}
                />

                <div>
                  <CustomDatePicker
                    value={startDate}
                    onChange={setStartDate}
                    label={t("recurring.startDate")}
                    className="bg-slate-50 dark:bg-black border-slate-200 dark:border-zinc-800"
                  />
                  {isDatePast && !editingRule && (
                    <p className="text-xs text-amber-500 mt-2 font-medium">
                      ⚠️ Start date is in the past. Transactions will be generated
                      immediately to catch up.
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-zinc-800/50 rounded-2xl border border-slate-100 dark:border-zinc-800">
                  <div>
                    <h4 className="font-bold text-sm">
                      {t("recurring.autoAddTransaction")}
                    </h4>
                    <p className="text-xs text-slate-500">
                      {t("recurring.autoAddDesc")}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAutoAdd(!autoAdd)}
                    className={cn(
                      "w-12 h-6 rounded-full transition-colors flex items-center shrink-0",
                      autoAdd ? "bg-brand-500" : "bg-slate-300 dark:bg-zinc-600",
                    )}
                  >
                    <div
                      className={cn(
                        "w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform ml-1",
                        autoAdd ? "translate-x-6" : "translate-x-0",
                      )}
                    />
                  </button>
                </div>

                <button
                  type="submit"
                  className="w-full py-4 bg-brand-600 text-white font-bold rounded-2xl shadow-lg hover:bg-brand-700 transition-colors"
                >
                  {t("recurring.saveRule")}
                </button>
              </form>
            </MotionDiv>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {ruleToDelete && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <MotionDiv
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setRuleToDelete(null)}
            />
            <MotionDiv
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              transition={{
                type: "spring",
                damping: 20,
                stiffness: 220,
                mass: 0.8,
              }}
              className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-sm relative z-10 p-6 shadow-2xl border border-slate-100 dark:border-zinc-800"
            >
              <h3 className="text-xl font-bold mb-2">
                {t("recurring.deleteRecurringRule")}
              </h3>
              <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm">
                {t("recurring.deleteQuestion")}
              </p>

              <div className="space-y-3">
                <button
                  onClick={() => {
                    deleteRecurringTransaction(ruleToDelete, true);
                    setRuleToDelete(null);
                  }}
                  className="w-full py-3 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition-colors shadow-lg shadow-rose-500/20"
                >
                  {t("recurring.deleteRuleAndHistory")}
                </button>

                <button
                  onClick={() => {
                    deleteRecurringTransaction(ruleToDelete, false);
                    setRuleToDelete(null);
                  }}
                  className="w-full py-3 px-4 bg-white dark:bg-zinc-800 border-2 border-slate-200 dark:border-zinc-700 hover:border-rose-200 dark:hover:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-900/20 text-slate-700 dark:text-slate-300 hover:text-rose-600 font-bold rounded-xl transition-all"
                >
                  {t("recurring.deleteRuleOnly")}
                </button>

                <button
                  onClick={() => setRuleToDelete(null)}
                  className="w-full py-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 font-medium transition-colors"
                >
                  {t("common.cancel")}
                </button>
              </div>
            </MotionDiv>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAddWallet && (
          <WalletModal onClose={() => setShowAddWallet(false)} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showAddCategory && (
          <CategoryModal
            onClose={() => setShowAddCategory(false)}
            initialType={type === "income" ? "income" : "expense"}
          />
        )}
      </AnimatePresence>

      {batchWarning && (
        <ConfirmModal
          isOpen={!!batchWarning}
          onClose={() => setBatchWarning(null)}
          onConfirm={() => saveRule(batchWarning.payload)}
          title="Large Batch Generation"
          message={
            <div className="space-y-4 py-2">
              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-200 dark:border-amber-800 flex items-start gap-4">
                <AlertTriangle
                  className="text-amber-500 shrink-0 mt-1"
                  size={24}
                />
                <div className="space-y-1">
                  <p className="text-sm font-bold text-amber-900 dark:text-amber-100">
                    High Sync Volume Detected
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                    This rule starts in the past and will immediately generate
                    approximately <strong>{batchWarning.count}</strong>{" "}
                    transactions to synchronize your history.
                  </p>
                </div>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                Do you wish to proceed with the synchronization?
              </p>
            </div>
          }
          confirmText="Start Synchronization"
        />
      )}
    </div>
  );
};

export default Recurring;
