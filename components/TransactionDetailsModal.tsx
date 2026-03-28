import React, { useState } from "react";
import { useData } from "../context/DataContext";
import { Transaction } from "../types";
import { formatDate, getCategoryIcon } from "../utils";
import { motion } from "framer-motion";
import {
  X,
  Pencil,
  ArrowRightLeft,
  Calendar,
  FileText,
  Wallet,
  Trash2,
  User,
  History,
} from "lucide-react";
import { ConfirmModal } from "./ConfirmModal";
import { useHousehold } from "../context/HouseholdContext";
import { useEscapeKey } from "../hooks/useEscapeKey";
import { useTranslation } from "react-i18next";

const MotionDiv = motion.div as any;

interface Props {
  transaction: Transaction;
  onClose: () => void;
  onEdit: () => void;
}

const TransactionDetailsModal: React.FC<Props> = ({
  transaction,
  onClose,
  onEdit,
}) => {
  const { categories, wallets, deleteTransaction, formatAmount } = useData();
  const { activeWorkspace, currentMembers } = useHousehold();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { t } = useTranslation();
  useEscapeKey(true, onClose);

  const category = categories.find((c) => c.id === transaction.categoryId);
  const subCategory = category?.subCategories?.find(
    (s) => s.id === transaction.subCategoryId,
  );
  const Icon = category ? getCategoryIcon(category.icon) : ArrowRightLeft;

  const getWalletName = (id: string | null) =>
    wallets.find((w) => w.id === id)?.name || t("txDetails.unknown");

  const isTransfer = transaction.type === "transfer";
  const isIncome = transaction.type === "income";

  const handleDelete = () => {
    deleteTransaction(transaction.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
        onClick={onClose}
      />

      <MotionDiv
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white dark:bg-zinc-900 rounded-[2.5rem] w-full max-w-md relative z-10 p-8 shadow-2xl border border-slate-100 dark:border-white/10"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">{t("txDetails.title")}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-col items-center mb-8">
          <div
            className="w-20 h-20 rounded-3xl flex items-center justify-center text-white shadow-xl mb-4 text-3xl"
            style={{
              backgroundColor: isTransfer ? "#64748b" : category?.color,
            }}
          >
            {isTransfer ? <ArrowRightLeft size={32} /> : <Icon size={32} />}
          </div>
          <div
            className="text-3xl font-bold tracking-tight mb-1 truncate w-full px-4 text-center max-w-full"
            title={`${isTransfer ? "" : isIncome ? "+" : "-"}${formatAmount(transaction.amount)}`}
          >
            {isTransfer ? "" : isIncome ? "+" : "-"}
            {formatAmount(transaction.amount)}
          </div>
          <div className="text-slate-500 font-medium">
            {isTransfer ? t("common.transfer") : category?.name}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-black/50 rounded-2xl border border-slate-100 dark:border-zinc-800">
            <div className="flex items-center gap-3 text-slate-500">
              <Calendar size={18} />
              <span className="text-sm font-semibold uppercase tracking-wide">
                {t("txDetails.date")}
              </span>
            </div>
            <div className="font-bold">{formatDate(transaction.date)}</div>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-black/50 rounded-2xl border border-slate-100 dark:border-zinc-800">
            <div className="flex items-center gap-3 text-slate-500">
              <Wallet size={18} />
              <span className="text-sm font-semibold uppercase tracking-wide">
                {t("txDetails.wallet")}
              </span>
            </div>
            <div className="font-bold text-right">
              {isTransfer ? (
                <div className="flex items-center gap-2">
                  <span>{getWalletName(transaction.fromWalletId)}</span>
                  <ArrowRightLeft size={14} />
                  <span>{getWalletName(transaction.toWalletId)}</span>
                </div>
              ) : (
                <span>
                  {getWalletName(
                    isIncome
                      ? transaction.toWalletId
                      : transaction.fromWalletId,
                  )}
                </span>
              )}
            </div>
          </div>

          {subCategory && (
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-black/50 rounded-2xl border border-slate-100 dark:border-zinc-800">
              <div className="flex items-center gap-3 text-slate-500">
                <Icon size={18} />
                <span className="text-sm font-semibold uppercase tracking-wide">
                  {t("txDetails.subCategory")}
                </span>
              </div>
              <div className="font-bold">{subCategory.name}</div>
            </div>
          )}

          {transaction.note && (
            <div className="flex flex-col gap-2 p-4 bg-slate-50 dark:bg-black/50 rounded-2xl border border-slate-100 dark:border-zinc-800">
              <div className="flex items-center gap-3 text-slate-500">
                <FileText size={18} />
                <span className="text-sm font-semibold uppercase tracking-wide">
                  {t("txDetails.note")}
                </span>
              </div>
              <div className="font-medium pl-8 italic text-slate-700 dark:text-slate-300">
                "{transaction.note}"
              </div>
            </div>
          )}

          {activeWorkspace.type === "household" && (
            <div className="flex flex-col gap-3 p-4 bg-slate-50 dark:bg-black/50 rounded-2xl border border-slate-100 dark:border-zinc-800">
              <div className="flex items-center gap-3 text-slate-500 mb-1">
                <History size={18} />
                <span className="text-sm font-semibold uppercase tracking-wide">
                  {t("txDetails.history")}
                </span>
              </div>

              {/* Created By */}
              {transaction.createdBy && (
                <div className="flex items-center justify-between pl-8">
                  <span className="text-xs text-slate-500">{t("txDetails.createdBy")}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-brand-600 flex items-center justify-center text-[10px] text-white font-bold overflow-hidden relative">
                      {(currentMembers.find(
                        (m) => m.email === transaction.createdBy,
                      )?.displayName || transaction.createdBy)[0].toUpperCase()}
                      {(() => {
                        const m = currentMembers.find(
                          (member) => member.email === transaction.createdBy,
                        );
                        if (m?.avatarBase64 && m.avatarBase64 !== "removed") {
                          return (
                            <img
                              src={m.avatarBase64}
                              alt=""
                              className="absolute inset-0 w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                              }}
                            />
                          );
                        }
                        if (
                          m?.photoURL &&
                          m.photoURL !== "undefined" &&
                          m.photoURL !== "null" &&
                          m?.avatarBase64 !== "removed"
                        ) {
                          return (
                            <img
                              src={m.photoURL}
                              alt=""
                              className="absolute inset-0 w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                              }}
                            />
                          );
                        }
                        return null;
                      })()}
                    </div>
                    <span className="text-sm font-bold">
                      {currentMembers.find(
                        (m) => m.email === transaction.createdBy,
                      )?.displayName || transaction.createdBy.split("@")[0]}
                    </span>
                  </div>
                </div>
              )}

              {/* Modified By */}
              {transaction.lastModifiedBy &&
                transaction.lastModifiedBy !== transaction.createdBy && (
                  <div className="flex items-center justify-between pl-8">
                    <span className="text-xs text-slate-500">
                      {t("txDetails.lastEditedBy")}
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center text-[10px] text-white font-bold overflow-hidden relative">
                        {(currentMembers.find(
                          (m) => m.email === transaction.lastModifiedBy,
                        )?.displayName ||
                          transaction.lastModifiedBy)[0].toUpperCase()}
                        {(() => {
                          const m = currentMembers.find(
                            (member) =>
                              member.email === transaction.lastModifiedBy,
                          );
                          if (m?.avatarBase64 && m.avatarBase64 !== "removed") {
                            return (
                              <img
                                src={m.avatarBase64}
                                alt=""
                                className="absolute inset-0 w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = "none";
                                }}
                              />
                            );
                          }
                          if (
                            m?.photoURL &&
                            m.photoURL !== "undefined" &&
                            m.photoURL !== "null" &&
                            m?.avatarBase64 !== "removed"
                          ) {
                            return (
                              <img
                                src={m.photoURL}
                                alt=""
                                className="absolute inset-0 w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = "none";
                                }}
                              />
                            );
                          }
                          return null;
                        })()}
                      </div>
                      <span className="text-sm font-bold">
                        {currentMembers.find(
                          (m) => m.email === transaction.lastModifiedBy,
                        )?.displayName ||
                          transaction.lastModifiedBy.split("@")[0]}
                      </span>
                    </div>
                  </div>
                )}
            </div>
          )}
        </div>

        <div className="mt-8 flex gap-3">
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="p-4 bg-rose-50 dark:bg-rose-900/10 text-rose-600 dark:text-rose-400 font-bold rounded-2xl hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-colors"
          >
            <Trash2 size={20} />
          </button>
          <button
            onClick={() => {
              onClose();
              onEdit();
            }}
            className="flex-1 py-4 bg-brand-600 text-white font-bold rounded-2xl shadow-lg hover:bg-brand-700 transition-colors flex items-center justify-center gap-2"
          >
            <Pencil size={18} /> {t("txDetails.edit")}
          </button>
        </div>
      </MotionDiv>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title={t("txDetails.deleteTitle")}
        message={t("txDetails.deleteMessage")}
        confirmText={t("txDetails.delete")}
        isDestructive
      />
    </div>
  );
};

export default TransactionDetailsModal;
