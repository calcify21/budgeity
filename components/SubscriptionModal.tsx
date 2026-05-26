import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { X, Calendar, FileText } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import CustomSelect from "./CustomSelect";
import CustomDatePicker from "./CustomDatePicker";
import { useEscapeKey } from "../hooks/useEscapeKey";

const MotionDiv = motion.div as any;

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingSub: any;
  onSubmit: (payload: any) => void;
  wallets: any[];
  categories: any[];
  formatAmount: (v: number) => string;
  onAddWalletRequested: () => void;
  onAddCategoryRequested: () => void;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose,
  editingSub,
  onSubmit,
  wallets,
  categories,
  formatAmount,
  onAddWalletRequested,
  onAddCategoryRequested,
}) => {
  const { t } = useTranslation();

  // Form State
  const [type, setType] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState("");
  const [frequency, setFrequency] = useState("monthly");
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [walletId, setWalletId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [subcategoryId, setSubcategoryId] = useState("");
  const [autoAdd, setAutoAdd] = useState(true);

  // Sync state with editing sub or defaults
  useEffect(() => {
    if (isOpen) {
      if (editingSub) {
        setType(editingSub.type || "expense");
        setAmount(editingSub.amount?.toString() || "");
        setFrequency(editingSub.frequency || "monthly");
        setStartDate(
          editingSub.startDate
            ? new Date(editingSub.startDate).toISOString().split("T")[0]
            : new Date().toISOString().split("T")[0],
        );
        setWalletId(editingSub.walletId || wallets[0]?.id || "");
        setCategoryId(editingSub.categoryId || "");
        setName(editingSub.name || "");
        setNote(editingSub.note || "");
        setSubcategoryId(editingSub.subcategoryId || "");
        setAutoAdd(editingSub.autoAdd);
      } else {
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
    }
  }, [isOpen, editingSub, wallets, categories]);

  // Escape key dismissal
  useEscapeKey(isOpen, onClose);

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !startDate || !walletId || !categoryId) return;

    const payload = {
      type,
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

    onSubmit(payload);
  };

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
            className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col border border-slate-100 dark:border-zinc-800 relative z-10"
          >
            <div className="p-8 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50 dark:bg-black/50">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-brand-500/10 text-brand-500 flex items-center justify-center shadow-inner">
                  <Calendar size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-2xl text-slate-800 dark:text-zinc-100">
                    {editingSub
                      ? t("subscriptions.editSubscription")
                      : t("subscriptions.newSubscription")}
                  </h3>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-200 dark:hover:bg-zinc-800 rounded-full transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-white"
                title="Close"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              <form
                id="subForm"
                onSubmit={handleSubmitForm}
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
                        onAddCategoryRequested();
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

                {categories.find((c) => c.id === categoryId)?.subCategories && (
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
                      if (val === "NEW") onAddWalletRequested();
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

            <div className="p-8 border-t border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-black/50 flex justify-end gap-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-4 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white rounded-2xl font-bold hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
              >
                {t("common.cancel")}
              </button>
              <button
                type="submit"
                form="subForm"
                className="flex-[2] py-4 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl font-bold shadow-xl shadow-brand-500/20 hover:scale-[1.02] active:scale-95 transition-all"
              >
                {t("subscriptions.save")}
              </button>
            </div>
          </MotionDiv>
        </div>
      )}
    </AnimatePresence>
  );
};
