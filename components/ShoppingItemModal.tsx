import React, { useState, useEffect, useRef } from "react";
import { X, Calendar, Hash, Tag, AlertCircle } from "lucide-react";
import { ShoppingItem, Category, Wallet } from "../types";
import CustomSelect from "./CustomSelect";
import { cn } from "../utils";
import { useScrollToError } from "../hooks/useScrollToError";
import { useTranslation } from "react-i18next";
import { useEscapeKey } from "../hooks/useEscapeKey";

import { motion, AnimatePresence } from "framer-motion";

const MotionDiv = motion.div as any;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    item: Omit<
      ShoppingItem,
      "id" | "status" | "createdAt" | "linkedTransactionIds"
    >,
  ) => void;
  initialItem?: ShoppingItem;
  categories: Category[];
  wallets: Wallet[];
  defaultWalletId?: string | null;
}

const ShoppingItemModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSave,
  initialItem,
  categories,
  wallets,
  defaultWalletId,
}) => {
  const [name, setName] = useState("");
  const { t } = useTranslation();
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [subCategoryId, setSubCategoryId] = useState("");
  const [walletId, setWalletId] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [quantity, setQuantity] = useState("1");
  const [error, setError] = useState("");

  const scrollRef = useRef<HTMLDivElement>(null);
  useScrollToError(error, scrollRef);
  useEscapeKey(isOpen, onClose);

  useEffect(() => {
    if (isOpen) {
      if (initialItem) {
        setName(initialItem.name);
        setAmount(initialItem.estimatedAmount.toString());
        setCategoryId(initialItem.categoryId);
        setSubCategoryId(initialItem.subCategoryId || "");
        setWalletId(initialItem.walletId || "");
        setPriority(initialItem.priority || "medium");
        setQuantity(initialItem.quantity?.toString() || "1");
      } else {
        setName("");
        setAmount("");
        setCategoryId(categories[0]?.id || "");
        setSubCategoryId("");
        setWalletId(defaultWalletId || "");
        setPriority("medium");
        setQuantity("1");
      }
      setError("");
    }
  }, [isOpen, initialItem, categories, defaultWalletId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let finalName = name.trim();
    if (!finalName) {
      if (document.querySelector(".driver-active")) {
        finalName = "Tour Demo Item";
        setName(finalName);
      } else {
        setError(t("shoppingModal.errNameRequired"));
        return;
      }
    }

    onSave({
      name: finalName,
      estimatedAmount: parseFloat(amount) || 0,
      categoryId,
      subCategoryId: subCategoryId || undefined,
      walletId: walletId || null,
      priority,
      quantity: parseInt(quantity) || 1,
    });
    onClose();
  };

  const selectedCategory = categories.find((c) => c.id === categoryId);
  const subCategories = selectedCategory?.subCategories || [];

  return (
    <div className="fixed inset-0 z-[55] overflow-y-auto">
      <div className="flex min-h-full items-end justify-center p-0 sm:items-center sm:p-4">
        <MotionDiv
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-md"
          onClick={onClose}
        />
        <MotionDiv
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="relative bg-white dark:bg-zinc-900 w-full sm:max-w-lg sm:rounded-[2rem] rounded-t-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
              {/* Header */}
              <div className="p-6 border-b border-slate-100 dark:border-zinc-800 flex justify-between items-center">
                <h2 className="text-xl font-bold">
                  {initialItem
                    ? t("shoppingModal.editItem")
                    : t("shoppingModal.addShoppingItem")}
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Form */}
              <div
                ref={scrollRef}
                className="p-6 overflow-y-auto space-y-4 flex-1"
              >
                {error && (
                  <div className="p-3 bg-rose-50 dark:bg-rose-900/20 text-rose-600 rounded-xl text-sm flex items-center gap-2">
                    <AlertCircle size={16} /> {error}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                    {t("shoppingModal.itemName")}
                  </label>
                  <input
                    value={name}
                    autoFocus
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t("shoppingModal.itemNamePlaceholder")}
                    className="w-full p-4 text-lg font-medium bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-2xl outline-none focus:ring-2 focus:ring-brand-500 tour-shop-input-name"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                      {t("shoppingModal.estCost")}
                    </label>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full p-3 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-brand-500 tour-shop-input-amount"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                      {t("shoppingModal.quantity")}
                    </label>
                    <input
                      type="number"
                      value={quantity}
                      min="1"
                      onChange={(e) => setQuantity(e.target.value)}
                      className="w-full p-3 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <CustomSelect
                    label={t("shoppingModal.priority")}
                    value={priority}
                    onChange={(v) => setPriority(v as any)}
                    options={[
                      {
                        value: "low",
                        label: t("shoppingModal.low"),
                        color: "#22c55e",
                      },
                      {
                        value: "medium",
                        label: t("shoppingModal.medium"),
                        color: "#f59e0b",
                      },
                      {
                        value: "high",
                        label: t("shoppingModal.high"),
                        color: "#ef4444",
                      },
                    ]}
                    placeholder={t("shoppingModal.priority")}
                  />
                  <CustomSelect
                    label={t("shoppingModal.walletPreferred")}
                    value={walletId}
                    onChange={setWalletId}
                    options={[
                      { value: "", label: t("shoppingModal.default") },
                      ...wallets.map((w) => ({ value: w.id, label: w.name })),
                    ]}
                    placeholder={t("shoppingModal.selectWallet")}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <CustomSelect
                    label={t("shoppingModal.category")}
                    value={categoryId}
                    onChange={(v) => {
                      setCategoryId(v);
                      setSubCategoryId("");
                    }}
                    options={categories
                      .filter((c) => c.type === "expense")
                      .map((c) => ({
                        value: c.id,
                        label: c.name,
                        color: c.color,
                      }))}
                    placeholder={t("shoppingModal.selectCategory")}
                  />
                  <CustomSelect
                    label={t("shoppingModal.subCategory")}
                    value={subCategoryId}
                    onChange={setSubCategoryId}
                    options={[
                      { value: "", label: t("shoppingModal.none") },
                      ...subCategories.map((s) => ({
                        value: s.id,
                        label: s.name,
                      })),
                    ]}
                    placeholder={t("shoppingModal.none")}
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-slate-100 dark:border-zinc-800 flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 px-4 rounded-xl font-bold bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors"
                >
                  {t("shoppingModal.cancel")}
                </button>
                <button
                  onClick={handleSubmit}
                  className="flex-1 py-3 px-4 rounded-xl font-bold bg-brand-600 text-white hover:bg-brand-700 transition-colors shadow-lg shadow-brand-500/20 tour-shop-save-btn"
                >
                  {initialItem
                    ? t("shoppingModal.saveChanges")
                    : t("shoppingModal.addItem")}
                </button>
              </div>
            </MotionDiv>
          </div>
        </div>
  );
};

export default ShoppingItemModal;
