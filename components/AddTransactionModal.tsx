import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  X,
  ArrowRight,
  Calendar,
  FileText,
  AlertCircle,
  Trash2,
  ArrowLeft,
  Check,
  Calculator,
} from "lucide-react";
import { useData } from "../context/DataContext";
import { useToast } from "../context/ToastContext";
import { Transaction, TransactionType, SpendingNature } from "../types";
import { SPENDING_NATURE_MAP } from "../constants";
import { cn, getCategoryIcon, evaluateExpression } from "../utils";
import { motion, AnimatePresence } from "framer-motion";
import CustomSelect, { SelectOption } from "./CustomSelect";
import { ConfirmModal } from "./ConfirmModal";
import WalletModal from "./WalletModal";
import CategoryModal from "./CategoryModal";
import CustomDatePicker from "./CustomDatePicker";
import CustomNumberPad from "./CustomNumberPad";
import { useScrollToError } from "../hooks/useScrollToError";
import { useEscapeKey } from "../hooks/useEscapeKey";
import { useTranslation } from "react-i18next";

interface Props {
  onClose: () => void;
  transactionToEdit?: Transaction;
  defaultType?: TransactionType;
}

// Fix: Cast motion components to any to resolve type errors
const MotionDiv = motion.div as any;

// Step Definitions
const STEPS = ["Amount", "Category", "Details"];

const AddTransactionModal: React.FC<Props> = ({
  onClose,
  transactionToEdit,
  defaultType,
}) => {
  const {
    wallets,
    goals,
    categories,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    currency,
    defaultWalletId,
    formatAmount,
  } = useData();
  const { success } = useToast();
  const { t } = useTranslation();

  // Navigation State
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(0); // -1 for back, 1 for next

  // Data State (Draft)
  const [type, setType] = useState<TransactionType>(defaultType || "expense");
  const [amountExpr, setAmountExpr] = useState(""); // Stores the raw string, e.g. "50+50"
  const [amountValue, setAmountValue] = useState(0); // Stores the evaluated number
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [note, setNote] = useState("");

  const [fromWallet, setFromWallet] = useState("");
  const [toWallet, setToWallet] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [subCategoryId, setSubCategoryId] = useState("");
  const [spendingNature, setSpendingNature] = useState<SpendingNature | "">("");

  // UI State
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmSavingsSpend, setConfirmSavingsSpend] = useState(false);
  const [pendingTx, setPendingTx] = useState<any>(null);
  const [showAddWallet, setShowAddWallet] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Custom Hook for Scrolling to Error
  useScrollToError(error, scrollRef);

  // Escape key dismissal
  useEscapeKey(true, onClose);
  const activeWallets = wallets.filter((w) => !w.archived);

  // Initialize Data
  useEffect(() => {
    if (transactionToEdit) {
      setType(transactionToEdit.type);
      setAmountExpr(transactionToEdit.amount.toString());
      setAmountValue(transactionToEdit.amount);
      setDate(transactionToEdit.date.split("T")[0]);
      setNote(transactionToEdit.note || "");

      if (
        transactionToEdit.type === "expense" &&
        transactionToEdit.fromWalletId
      ) {
        setFromWallet(transactionToEdit.fromWalletId);
      } else if (
        transactionToEdit.type === "income" &&
        transactionToEdit.toWalletId
      ) {
        setFromWallet(transactionToEdit.toWalletId);
      } else if (transactionToEdit.type === "transfer") {
        if (transactionToEdit.fromWalletId)
          setFromWallet(transactionToEdit.fromWalletId);
        if (transactionToEdit.toWalletId)
          setToWallet(transactionToEdit.toWalletId);
      }

      setCategoryId(transactionToEdit.categoryId);
      setSubCategoryId(transactionToEdit.subCategoryId || "");
      setSpendingNature(transactionToEdit.spendingNature || "");
    } else {
      // Default Wallet Logic
      let defaultSelection = "";
      if (defaultWalletId) {
        const w = activeWallets.find((w) => w.id === defaultWalletId);
        if (w) defaultSelection = w.id;
      }
      if (!defaultSelection && activeWallets.length > 0) {
        defaultSelection = activeWallets[0].id; // Fallback to first
      }
      setFromWallet(defaultSelection);

      // Default To Wallet for Transfer
      if (activeWallets.length > 1) {
        const other = activeWallets.find((w) => w.id !== defaultSelection);
        setToWallet(other ? other.id : defaultSelection);
      } else {
        setToWallet(defaultSelection);
      }
    }
  }, [transactionToEdit, defaultWalletId]);

  // Auto-focus removed as we use custom keypad

  // Custom Keypad Handlers
  const handlePadInput = (value: string) => {
    setAmountExpr((prev) => {
      // Prevent multiple decimals
      if (value === "." && prev.includes(".")) {
        const parts = prev.split(/[\+\-\×\÷]/);
        const currentNum = parts[parts.length - 1];
        if (currentNum.includes(".")) return prev;
      }
      return prev + value;
    });
  };

  const handlePadDelete = () => {
    setAmountExpr((prev) => prev.slice(0, -1));
  };

  const handlePadClear = () => {
    setAmountExpr("");
  };

  const handlePadNext = () => {
    setError("");

    let expr = amountExpr;
    if (!expr && document.querySelector(".driver-active")) {
      expr = "100";
      setAmountExpr("100");
    }

    if (!expr) {
      setError(t("transactionModal.errNoAmount"));
      return;
    }
    const val = evaluateExpression(expr);
    setAmountValue(val);

    if (val <= 0) {
      setError(t("transactionModal.errInvalidAmount"));
      return;
    }

    if (type !== "income" && !fromWallet) {
      setError(t("transactionModal.errNoSourceWallet"));
      return;
    }
    if (type === "transfer") {
      if (!toWallet) {
        setError(t("transactionModal.errNoDestWallet"));
        return;
      }
      if (fromWallet === toWallet) {
        setError(t("transactionModal.errSameWallet"));
        return;
      }
    }

    // If transfer, skip category step?
    // User didn't explicitly ask, but transfers usually don't need category selection.
    // We'll auto-set 'cat_transfer' and skip to Step 3.
    if (type === "transfer") {
      setCategoryId("cat_transfer");
      setDirection(1);
      setStep(3);
      return;
    }

    setDirection(1);
    setStep(2); // Move to Category Step
  };

  // Navigation Logic
  const handleNext = () => {
    setError("");

    // Step 1 Validation is now handled by handlePadNext
    if (step === 1) {
      handlePadNext(); // Delegate to keypad's next logic
      return;
    }

    // Step 2 Validation (Category)
    if (step === 2) {
      if (!categoryId) {
        setError(t("transactionModal.errNoCategory"));
        return;
      }
    }

    setDirection(1);
    setStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setError("");
    setDirection(-1);
    if (step === 1) onClose();
    else if (step === 3 && type === "transfer")
      setStep(1); // Jump back to 1 if transfer
    else setStep((prev) => prev - 1);
  };

  const handleFinish = () => {
    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(23, 59, 59, 999); // Allow until end of today

    if (selectedDate > today) {
      setError(t("transactionModal.errFutureDate"));
      return;
    }

    // Prepare Data
    const txData = {
      type,
      amount: amountValue,
      date: selectedDate.toISOString(),
      note,
      fromWalletId: type === "income" ? null : fromWallet,
      toWalletId:
        type === "expense" ? null : type === "transfer" ? toWallet : fromWallet,
      categoryId: type === "transfer" ? "cat_transfer" : categoryId,
      subCategoryId: subCategoryId || undefined,
      spendingNature:
        type === "expense" && spendingNature ? spendingNature : undefined,
    };

    // Check for Savings Spending
    if (type === "expense" || type === "transfer") {
      const sourceWallet = wallets.find((w) => w.id === fromWallet);
      if (sourceWallet && sourceWallet.type === "savings") {
        setPendingTx(txData);
        setConfirmSavingsSpend(true);
        return;
      }
    }

    executeTransaction(txData);
  };

  const executeTransaction = (txData: any) => {
    try {
      if (transactionToEdit) {
        updateTransaction({ ...txData, id: transactionToEdit.id });
        success(t("transactionModal.txUpdated"));
      } else {
        addTransaction(txData);
        success(t("transactionModal.txAdded"));
      }
      onClose();
    } catch (err: any) {
      setError(err.message || "An error occurred");
      setConfirmSavingsSpend(false);
    }
  };

  const handleDelete = () => {
    if (transactionToEdit) {
      deleteTransaction(transactionToEdit.id);
      onClose();
    }
  };

  // Helper for Categories
  const filteredCategories = categories.filter(
    (c) => c.type === type && c.id !== "cat_transfer",
  );
  const selectedCategory = categories.find((c) => c.id === categoryId);
  const subCategories = selectedCategory?.subCategories || [];

  const walletOptions = useMemo(() => {
    const options: SelectOption[] = [];
    const activeWallets = wallets.filter(
      (w) => !w.archived || w.id === fromWallet || w.id === toWallet,
    );

    if (activeWallets.length > 0) {
      options.push({
        value: "header_wallets",
        label: t("common.wallets"),
        isHeader: true,
      });
      activeWallets.forEach((w) => {
        options.push({
          value: w.id,
          label: w.name,
          subLabel: formatAmount(w.balance),
          color: w.color,
          icon: w.icon,
        });
      });
    }

    const activeGoals = goals.filter(
      (g) =>
        g.status === "active" ||
        g.status === "achieved" ||
        g.id === fromWallet ||
        g.id === toWallet,
    );

    if (activeGoals.length > 0) {
      options.push({
        value: "header_goals",
        label: t("common.goals"),
        isHeader: true,
      });
      activeGoals.forEach((g) => {
        options.push({
          value: g.id,
          label: g.name,
          subLabel: formatAmount(g.currentBalance),
          color: g.color,
          icon: g.icon,
        });
      });
    }

    return options;
  }, [wallets, goals, fromWallet, toWallet, formatAmount]);

  // Step Content Renderer
  const renderStepContent = () => {
    switch (step) {
      case 1: // AMOUNT
        return (
          <div className="space-y-6">
            {/* Type Switcher */}
            <div className="tour-trans-type bg-slate-100 dark:bg-zinc-800 p-1.5 rounded-2xl flex">
              {(["expense", "income", "transfer"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    if (type !== t) {
                      setType(t);
                      setCategoryId("");
                      setSubCategoryId("");
                      setError("");
                    }
                  }}
                  className={cn(
                    "flex-1 py-3 rounded-xl text-sm font-bold transition-all capitalize",
                    type === t
                      ? "bg-white dark:bg-black shadow-md text-slate-900 dark:text-white"
                      : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300",
                  )}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Calculator Amount Input */}
            <div className="text-center py-6 tour-trans-amount">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center justify-center gap-2">
                <Calculator size={14} /> {t("transactionModal.amountLabel")}
              </label>
              <div className="flex-1 flex flex-col items-center justify-center min-h-[400px]">
                <div className="w-full max-w-xs space-y-6">
                  {/* Display Amount */}
                  <div className="text-center space-y-2">
                    <div
                      className="text-5xl font-bold text-slate-800 dark:text-white truncate w-full px-2 cursor-text"
                      title={amountExpr || "0"}
                      onClick={() => {}} // Keep focus or handle if needed
                    >
                      <span className="text-brand-500 mr-1">
                        {
                          new Intl.NumberFormat(undefined, {
                            style: "currency",
                            currency: currency || "USD",
                          })
                            .formatToParts(0)
                            .find((p) => p.type === "currency")?.value
                        }
                      </span>

                      {amountExpr || "0"}
                    </div>
                    {/* Calculation Preview */}
                    {amountExpr && /[+\-×÷]/.test(amountExpr) && (
                      <div className="text-sm font-medium text-slate-400 animate-in fade-in slide-in-from-top-1">
                        ={" "}
                        {formatAmount(evaluateExpression(amountExpr))
                          .replace(/[€$£₹]/g, "") // remove symbol if needed, or keep it
                          .trim()}
                      </div>
                    )}
                  </div>

                  {/* Custom Number Pad */}
                  <CustomNumberPad
                    onInput={handlePadInput}
                    onDelete={handlePadDelete}
                    onClear={handlePadClear}
                  />

                  {/* Next button removed - using Footer button only */}
                </div>
              </div>
            </div>

            {/* Wallet Selection */}
            <div className="space-y-4">
              {type !== "income" && (
                <CustomSelect
                  label={t("transactionModal.fromWallet")}
                  value={fromWallet}
                  onChange={setFromWallet}
                  options={walletOptions}
                  onAddNew={() => setShowAddWallet(true)}
                />
              )}

              {type === "transfer" && (
                <div className="relative my-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-100 dark:border-white/5"></div>
                  </div>
                  <div className="relative flex justify-center">
                    <div className="bg-slate-50 dark:bg-zinc-900 px-2 text-slate-400">
                      <ArrowRight size={16} className="rotate-90" />
                    </div>
                  </div>
                </div>
              )}

              {type !== "expense" && (
                <CustomSelect
                  label={type === "transfer" ? t("transactionModal.toWallet") : t("transactionModal.depositTo")}
                  value={type === "income" ? fromWallet : toWallet}
                  onChange={type === "income" ? setFromWallet : setToWallet}
                  options={walletOptions}
                  onAddNew={() => setShowAddWallet(true)}
                />
              )}
            </div>
          </div>
        );

      case 2: // CATEGORY
        return (
          <div className="space-y-6 h-full flex flex-col">
            <div className="flex-1 overflow-y-auto custom-scrollbar -mx-2 px-2 pb-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 sticky top-0 bg-white dark:bg-zinc-900 z-10 py-2">
                {t("transactionModal.selectCategory")}
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 tour-trans-category">
                {filteredCategories.map((cat) => {
                  const Icon = getCategoryIcon(cat.icon);
                  const isSelected = categoryId === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        if (categoryId !== cat.id) setSubCategoryId("");
                        setCategoryId(cat.id);
                        // Auto-set spending nature from category mapping
                        if (type === "expense" && !spendingNature) {
                          const defaultNature = SPENDING_NATURE_MAP[cat.id];
                          if (defaultNature) setSpendingNature(defaultNature);
                        }
                      }}
                      className={cn(
                        "flex flex-col items-center justify-center p-3 rounded-2xl border transition-all gap-2 aspect-square",
                        isSelected
                          ? "border-brand-500 bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 shadow-md ring-1 ring-brand-500"
                          : "border-slate-100 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-500 dark:text-slate-400",
                      )}
                    >
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white text-lg shadow-sm"
                        style={{ backgroundColor: cat.color }}
                      >
                        <Icon size={18} />
                      </div>
                      <span className="text-[11px] font-bold text-center leading-tight line-clamp-2 w-full">
                        {cat.name}
                      </span>
                    </button>
                  );
                })}

                <button
                  onClick={() => setShowAddCategory(true)}
                  className="flex flex-col items-center justify-center p-3 rounded-2xl border border-dashed border-slate-300 dark:border-zinc-700 hover:border-brand-400 hover:bg-brand-50 dark:hover:bg-zinc-800 transition-all gap-2 aspect-square text-slate-400 hover:text-brand-500"
                >
                  <div className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-100 dark:bg-zinc-800">
                    <FileText size={18} />
                  </div>
                  <span className="text-[11px] font-bold">{t("transactionModal.newCategory")}</span>
                </button>
              </div>
            </div>

            {/* Sub Category Selection */}
            <AnimatePresence>
              {subCategories.length > 0 && (
                <MotionDiv
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  className="border-t border-slate-100 dark:border-zinc-800 pt-4"
                >
                  <CustomSelect
                    label={t("transactionModal.subCategoryOptional")}
                    value={subCategoryId}
                    onChange={setSubCategoryId}
                    options={[
                      { value: "", label: t("transactionModal.none") },
                      ...subCategories.map((sc) => ({
                        value: sc.id,
                        label: sc.name,
                      })),
                    ]}
                    placeholder={t("transactionModal.selectDetail")}
                  />
                </MotionDiv>
              )}
            </AnimatePresence>
          </div>
        );

      case 3: // DETAILS
        return (
          <div className="space-y-6">
            {/* Summary Card */}
            <div className="bg-slate-50 dark:bg-zinc-800 p-6 rounded-[2rem] flex flex-col items-center gap-2">
              <div className="text-sm font-bold text-slate-500 uppercase tracking-widest">
                {type}
              </div>
              <div
                className="text-4xl font-black text-slate-900 dark:text-white truncate w-full text-center px-4"
                title={formatAmount(amountValue)}
              >
                {formatAmount(amountValue)}
              </div>
              <div className="flex items-center gap-2 text-sm font-medium text-slate-500 mt-2">
                <span>{wallets.find((w) => w.id === fromWallet)?.name}</span>
                <ArrowRight size={14} />
                {type === "transfer" ? (
                  <span>{wallets.find((w) => w.id === toWallet)?.name}</span>
                ) : (
                  <span className="flex items-center gap-1">
                    {categoryId === "cat_transfer"
                      ? "Transfer"
                      : categories.find((c) => c.id === categoryId)?.name}
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <CustomDatePicker
                  value={date}
                  onChange={setDate}
                  label={t("transactionModal.dateLabel")}
                  maxDate={new Date().toISOString().split("T")[0]}
                />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  <FileText size={12} /> {t("transactionModal.noteLabel")}
                </label>
                <textarea
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={t("transactionModal.notePlaceholder")}
                  className="w-full p-4 bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-2xl font-medium focus:ring-2 focus:ring-brand-500 outline-none resize-none"
                />
              </div>
            </div>

            {/* Spending Nature Selector — expense only */}
            {type === "expense" && (
              <div className="mt-4">
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  {t("transactionModal.spendingType")}
                </label>
                <div className="flex gap-2">
                  {[
                    {
                      key: "must" as SpendingNature,
                      label: t("transactionModal.must"),
                      color: "bg-rose-500",
                      desc: t("transactionModal.critical"),
                    },
                    {
                      key: "need" as SpendingNature,
                      label: t("transactionModal.need"),
                      color: "bg-amber-500",
                      desc: t("transactionModal.important"),
                    },
                    {
                      key: "want" as SpendingNature,
                      label: t("transactionModal.want"),
                      color: "bg-violet-500",
                      desc: t("transactionModal.discretionary"),
                    },
                  ].map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() =>
                        setSpendingNature(
                          spendingNature === opt.key ? "" : opt.key,
                        )
                      }
                      className={cn(
                        "flex-1 py-3 rounded-2xl border-2 font-bold text-sm transition-all",
                        spendingNature === opt.key
                          ? `border-current ${opt.color} text-white shadow-lg`
                          : "border-slate-200 dark:border-zinc-700 text-slate-500 dark:text-zinc-400 hover:border-slate-300",
                      )}
                    >
                      <span className="block">{opt.label}</span>
                      <span className="text-[10px] opacity-70 font-semibold">
                        {opt.desc}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-[55] overflow-y-auto">
      <div className="flex min-h-full items-end justify-center p-0 sm:items-center sm:p-4">
        <MotionDiv
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity tour-modal-overlay"
          onClick={onClose}
        />

        <MotionDiv
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-full sm:max-w-lg bg-white dark:bg-zinc-900 sm:rounded-[2.5rem] rounded-t-[2.5rem] shadow-2xl overflow-hidden border border-slate-200 dark:border-white/10 flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-6 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-black/20 shrink-0">
            <div className="flex items-center gap-3">
              {step > 1 && (
                <button
                  onClick={handleBack}
                  className="p-2 -ml-2 hover:bg-slate-200 dark:hover:bg-zinc-800 rounded-full transition-colors"
                >
                  <ArrowLeft size={20} />
                </button>
              )}
              <div>
                <h2 className="text-xl font-bold">
                  {transactionToEdit ? t("transactionModal.editTransaction") : t("transactionModal.newTransaction")}
                </h2>
                <div className="flex gap-1.5 mt-2">
                  {[t("transactionModal.stepAmount"), t("transactionModal.stepCategory"), t("transactionModal.stepDetails")].map((_, i) => {
                    const targetStep = i + 1;
                    const isTransferStep = type === "transfer" && targetStep === 2;
                    
                    if (isTransferStep) return null; // Hide category step for transfers visually
                    
                    const isNextAvailable = targetStep === step + 1 || (type === "transfer" && step === 1 && targetStep === 3);

                    return (
                      <button
                        key={i}
                        type="button"
                        disabled={targetStep === step || (!isNextAvailable && targetStep > step)}
                        onClick={() => {
                          if (targetStep < step) {
                            setError("");
                            setDirection(-1);
                            setStep(targetStep);
                          } else if (isNextAvailable) {
                            handleNext();
                          }
                        }}
                        className={cn(
                          "h-1.5 rounded-full transition-all duration-300",
                          step > targetStep
                            ? "w-5 bg-brand-500 hover:bg-brand-600 cursor-pointer"
                            : step === targetStep
                              ? "w-8 bg-brand-500"
                              : isNextAvailable
                                ? "w-5 bg-slate-200 dark:bg-zinc-800 hover:bg-slate-300 dark:hover:bg-zinc-700 cursor-pointer"
                                : "w-5 bg-slate-200 dark:bg-zinc-800 opacity-40 hover:opacity-40 cursor-not-allowed"
                        )}
                        aria-label={`Go to Step ${targetStep}`}
                      />
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {transactionToEdit && step === 1 && (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-full transition-colors"
                >
                  <Trash2 size={20} />
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-200 dark:hover:bg-zinc-800 rounded-full transition-colors"
                title="Close"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Validation Error Banner */}
          {error && (
            <div className="px-6 pt-4 animate-in fade-in slide-in-from-top-2">
              <div className="p-3 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 text-sm font-medium rounded-2xl flex items-center gap-2">
                <AlertCircle size={18} /> {error}
              </div>
            </div>
          )}

          {/* Step Content with Animation */}
          <div
            ref={scrollRef}
            className="p-6 overflow-y-auto flex-1 custom-scrollbar"
          >
            <AnimatePresence mode="wait" custom={direction}>
              <MotionDiv
                key={step}
                custom={direction}
                initial={{ x: direction * 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: direction * -20, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                {renderStepContent()}
              </MotionDiv>
            </AnimatePresence>
          </div>

          {/* Footer Actions */}
          <div className="p-6 border-t border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-black/50 shrink-0">
            {step < 3 ? (
              <button
                onClick={handleNext}
                className="w-full py-4 bg-brand-600 hover:bg-brand-700 text-white font-bold text-lg rounded-2xl shadow-xl shadow-brand-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 tour-trans-next"
              >
                {t("transactionModal.next")} <ArrowRight size={20} />
              </button>
            ) : (
              <button
                onClick={handleFinish}
                className="w-full py-4 bg-brand-600 hover:bg-brand-700 text-white font-bold text-lg rounded-2xl shadow-xl shadow-brand-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 tour-trans-save"
              >
                <Check size={20} />{" "}
                {transactionToEdit ? t("transactionModal.saveChanges") : t("transactionModal.confirmTransaction")}
              </button>
            )}
          </div>
        </MotionDiv>
      </div>

      {/* Modals */}
      <ConfirmModal
        isOpen={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
        title={t("transactionModal.deleteTitle")}
        message={t("transactionModal.deleteMessage")}
        confirmText={t("transactionModal.delete")}
        isDestructive
      />
      <ConfirmModal
        isOpen={confirmSavingsSpend}
        onClose={() => {
          setConfirmSavingsSpend(false);
          setPendingTx(null);
        }}
        onConfirm={() => {
          if (pendingTx) executeTransaction(pendingTx);
          setConfirmSavingsSpend(false);
        }}
        title="Spending from Savings?"
        message="You're spending from a Savings wallet. Proceed?"
        confirmText="Confirm Spend"
      />
      <AnimatePresence>
        {showAddWallet && <WalletModal onClose={() => setShowAddWallet(false)} />}
      </AnimatePresence>
      <AnimatePresence>
        {showAddCategory && (
          <CategoryModal onClose={() => setShowAddCategory(false)} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default AddTransactionModal;
