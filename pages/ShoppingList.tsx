import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { useData } from "../context/DataContext";
import { getCategoryIcon, cn } from "../utils";
import {
  Plus,
  Trash2,
  Check,
  ShoppingCart,
  Tag,
  Share2,
  Copy,
  Clock,
  RotateCcw,
  MoreVertical,
  History,
  AlertCircle,
} from "lucide-react";
import { ShoppingItem } from "../types";
import { useToast } from "../context/ToastContext";
import ShoppingItemModal from "../components/ShoppingItemModal";
import PurchaseConfirmationModal from "../components/PurchaseConfirmationModal";
import ConfirmationModal from "../components/ConfirmationModal";

const ShoppingList: React.FC = () => {
  const {
    shoppingList,
    addShoppingItem,
    updateShoppingItem,
    deleteShoppingItem,
    markShoppingItemAsBought,
    revertShoppingItemPurchase,
    categories,
    wallets,
    defaultWalletId,
    formatAmount,
    currency,
  } = useData();
  const { info, success, error } = useToast();
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ShoppingItem | null>(null);

  useEffect(() => {
    if (searchParams.get("add") === "item") {
      setIsAddModalOpen(true);
      // Clean up the URL after opening the modal
      const newParams = new URLSearchParams(searchParams);
      newParams.delete("add");
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const [buyingItem, setBuyingItem] = useState<ShoppingItem | null>(null);
  const [revertItem, setRevertItem] = useState<ShoppingItem | null>(null);
  const [showPurchased, setShowPurchased] = useState(false);

  // Filter lists based on status
  // Active includes 'active' and 'partial'
  const activeList = shoppingList.filter(
    (item) =>
      item.status === "active" ||
      item.status === "partial" ||
      (!item.status && !item.isBought),
  );

  // Sort by priority (high > medium > low) then date
  activeList.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    const pA = priorityOrder[a.priority || "medium"];
    const pB = priorityOrder[b.priority || "medium"];
    if (pA !== pB) return pB - pA;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const purchasedList = shoppingList.filter(
    (item) => item.status === "purchased" || (item.isBought && !item.status),
  );

  const handleSaveItem = (
    itemData: Omit<
      ShoppingItem,
      "id" | "status" | "createdAt" | "linkedTransactionIds"
    >,
  ) => {
    if (editingItem) {
      updateShoppingItem({
        ...editingItem,
        ...itemData,
      });
      success("Item updated successfully");
      setEditingItem(null);
    } else {
      addShoppingItem(itemData);
      success("Item added to list");
    }
    setIsAddModalOpen(false);
  };

  const handleBuyConfirm = (
    item: ShoppingItem,
    finalAmount: number,
    walletId: string,
    date: string,
    quantityBought: number,
  ) => {
    markShoppingItemAsBought(item, finalAmount, walletId, date, quantityBought);
    success("Purchase recorded!");
    setBuyingItem(null);
  };

  const handleRevertConfirm = () => {
    if (!revertItem) return;

    if (
      !revertItem.linkedTransactionIds ||
      revertItem.linkedTransactionIds.length === 0
    ) {
      error("No linked transaction found to revert.");
      setRevertItem(null);
      return;
    }

    // Revert the last transaction
    const lastTxId =
      revertItem.linkedTransactionIds[
        revertItem.linkedTransactionIds.length - 1
      ];
    revertShoppingItemPurchase(revertItem, lastTxId);
    success("Purchase reverted.");
    setRevertItem(null);
  };

  const getListText = () => {
    const title = "🛒 Budgeity Shopping List";
    let text = `${title}\n\n`;

    activeList.forEach((item) => {
      const cat = categories.find((c) => c.id === item.categoryId);
      const subCat = item.subCategoryId
        ? cat?.subCategories?.find((s) => s.id === item.subCategoryId)?.name
        : "";
      const catInfo = subCat
        ? ` (${cat?.name} > ${subCat})`
        : ` (${cat?.name})`;
      const qty = item.quantity > 1 ? ` x${item.quantity}` : "";
      text += `- ${item.name}${qty}: ~${formatAmount(item.estimatedAmount)}${catInfo}\n`;
    });

    const total = activeList.reduce(
      (acc, current) => acc + current.estimatedAmount,
      0,
    );
    text += `\nTotal Est: ${formatAmount(total)}\n\nShared via Budgeity`;
    return { title, text };
  };

  const handleShare = async () => {
    if (activeList.length === 0) {
      info("Your list is empty!");
      return;
    }
    const { title, text } = getListText();
    if (navigator.share) {
      try {
        await navigator.share({ title, text });
      } catch (err) {
        console.error("Error sharing:", err);
      }
    } else {
      handleCopy();
    }
  };

  const handleCopy = async () => {
    const { text } = getListText();
    try {
      await navigator.clipboard.writeText(text);
      info("List copied to clipboard!");
    } catch (err) {
      console.error("Clipboard error:", err);
      info("Failed to copy list.");
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <ShoppingCart className="text-brand-600" />{" "}
            {t("common.shoppingList")}
          </h2>
          <p className="text-sm text-slate-500">
            {t("shoppingList.planPurchases")}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setEditingItem(null);
              setIsAddModalOpen(true);
            }}
            className="p-2 bg-brand-600 text-white border border-brand-600 rounded-xl hover:bg-brand-700 transition-colors shadow-sm shadow-brand-600/20 tour-shop-add-btn"
            title="Add Item"
          >
            <Plus size={20} />
          </button>
          <button
            onClick={handleCopy}
            className="p-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
            title="Copy to Clipboard"
          >
            <Copy size={20} className="text-slate-500" />
          </button>
          <button
            onClick={handleShare}
            className="p-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
            title="Share"
          >
            <Share2 size={20} className="text-slate-500" />
          </button>
        </div>
      </div>

      {/* Active Items */}
      <div className="space-y-3">
        {activeList.length === 0 ? (
          <div className="py-24 text-center bg-white/50 dark:bg-zinc-900/50 rounded-[2rem] border-2 border-dashed border-slate-200 dark:border-zinc-800 flex flex-col items-center gap-5">
            <div className="w-20 h-20 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center text-slate-300 dark:text-zinc-600">
              <ShoppingCart size={40} strokeWidth={1.5} />
            </div>
            <div className="space-y-2">
              <p className="text-lg font-bold text-slate-900 dark:text-white">
                {t("shoppingList.emptyList")}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Plan your next purchase — add items to your shopping list and
                track estimated costs.
              </p>
            </div>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-6 py-3 bg-brand-600 text-white font-bold rounded-2xl hover:bg-brand-700 transition-colors shadow-lg shadow-brand-500/20"
            >
              {t("shoppingList.addFirstItem")}
            </button>
          </div>
        ) : (
          activeList.map((item, index) => {
            const cat = categories.find((c) => c.id === item.categoryId);
            const Icon = cat ? getCategoryIcon(cat.icon) : Tag;
            const wallet = wallets.find((w) => w.id === item.walletId);
            const priorityColors = {
              low: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
              medium:
                "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
              high: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
            };

            return (
              <div
                key={item.id}
                className={cn(
                  "bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm flex items-center gap-4 group transition-all",
                  item.status === "partial"
                    ? "border-l-4 border-l-amber-500"
                    : "",
                  index === 0 && "tour-shop-item-first",
                )}
              >
                {/* Category Icon */}
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-sm relative"
                  style={{ backgroundColor: cat?.color || "#cbd5e1" }}
                >
                  <Icon size={20} />
                  {item.quantity > 1 && (
                    <div className="absolute -top-2 -right-2 bg-slate-900 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md min-w-[20px] text-center border-2 border-white dark:border-zinc-900">
                      x{item.quantity}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div
                  className="flex-1 cursor-pointer"
                  onClick={() => {
                    setEditingItem(item);
                    setIsAddModalOpen(true);
                  }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-lg leading-tight">
                      {item.name}
                    </h3>
                    {item.priority && item.priority !== "medium" && (
                      <span
                        className={cn(
                          "text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-md",
                          priorityColors[item.priority],
                        )}
                      >
                        {item.priority}
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-slate-500 flex flex-wrap gap-x-2 gap-y-1 font-medium items-center">
                    <span>{cat?.name}</span>
                    {item.subCategoryId && (
                      <span className="flex items-center gap-1">
                        <span className="opacity-50">/</span>
                        {
                          cat?.subCategories?.find(
                            (s) => s.id === item.subCategoryId,
                          )?.name
                        }
                      </span>
                    )}
                    {wallet && (
                      <span className="flex items-center gap-1 text-slate-400">
                        <span className="w-1 h-1 bg-slate-400 rounded-full" />
                        {wallet.name}
                      </span>
                    )}
                    {item.status === "partial" && (
                      <span className="text-amber-600 dark:text-amber-500 font-bold bg-amber-50 dark:bg-amber-900/20 px-1.5 rounded">
                        {t("shoppingList.partiallyBought")}
                      </span>
                    )}
                  </div>
                </div>

                {/* Cost */}
                <div className="font-bold text-slate-700 dark:text-slate-300 text-base sm:text-lg whitespace-nowrap">
                  ~{formatAmount(item.estimatedAmount)}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setBuyingItem(item)}
                    className="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 rounded-xl transition-colors tour-shop-check"
                    title="Mark as Bought"
                  >
                    <Check size={20} />
                  </button>
                  {item.status === "partial" && (
                    <button
                      onClick={() => setRevertItem(item)}
                      className="p-3 bg-slate-50 dark:bg-slate-800 text-slate-500 hover:text-brand-600 rounded-xl transition-colors"
                      title="Revert Last Purchase"
                    >
                      <RotateCcw size={20} />
                    </button>
                  )}
                  {item.status !== "partial" && (
                    <button
                      onClick={() => deleteShoppingItem(item.id)}
                      className="p-3 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-colors"
                    >
                      <Trash2 size={20} />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Purchased History */}
      {purchasedList.length > 0 && (
        <div className="mt-12">
          <button
            onClick={() => setShowPurchased(!showPurchased)}
            className="flex items-center gap-2 text-sm font-bold text-slate-500 uppercase mb-4 hover:text-slate-800 dark:hover:text-slate-300 transition-colors"
          >
            <History size={16} />
            {t("shoppingList.purchasedHistory")} ({purchasedList.length})
          </button>

          {showPurchased && (
            <div className="space-y-2 opacity-70">
              {purchasedList.map((item) => (
                <div
                  key={item.id}
                  className="bg-slate-50 dark:bg-zinc-800/50 px-4 py-3 rounded-xl flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <span className="line-through text-slate-500 font-medium">
                      {item.name}
                    </span>
                    <span className="text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full">
                      {t("shoppingList.bought")}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-500 text-sm">
                      {formatAmount(item.estimatedAmount)}
                    </span>
                    <button
                      onClick={() => setRevertItem(item)}
                      className="p-2 hover:bg-white dark:hover:bg-zinc-800 rounded-lg text-slate-400 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                      title="Revert Purchase"
                    >
                      <RotateCcw size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <ShoppingItemModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSaveItem}
        initialItem={editingItem || undefined}
        categories={categories}
        wallets={wallets}
        defaultWalletId={defaultWalletId}
      />

      {buyingItem && (
        <PurchaseConfirmationModal
          isOpen={!!buyingItem}
          onClose={() => setBuyingItem(null)}
          onConfirm={handleBuyConfirm}
          item={buyingItem}
          wallets={wallets}
          defaultWalletId={defaultWalletId}
          formatAmount={formatAmount}
          currency={currency}
        />
      )}

      <ConfirmationModal
        isOpen={!!revertItem}
        onClose={() => setRevertItem(null)}
        onConfirm={handleRevertConfirm}
        title={t("shoppingList.revertPurchase")}
        message={t("shoppingList.revertMessage")}
        confirmText={t("shoppingList.yesRevert")}
        variant="danger"
      />
    </div>
  );
};

export default ShoppingList;
