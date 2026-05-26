import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { useData } from "../context/DataContext";
import { getCategoryIcon, cn } from "../utils";
import {
  Plus,
  Pencil,
  Trash2,
  GripVertical,
  ChevronDown,
  ChevronRight,
  RotateCcw,
} from "lucide-react";
import { Category } from "../types";
import CategoryModal from "../components/CategoryModal";
import { ConfirmModal } from "../components/ConfirmModal";
import {
  Reorder,
  motion,
  AnimatePresence,
  useDragControls,
} from "framer-motion";

// Fix motion type
const MotionDiv = motion.div as any;
const ReorderGroup = Reorder.Group as any;
const ReorderItem = Reorder.Item as any;

const Categories: React.FC = () => {
  const { categories, deleteCategory, reorderCategories, resetCategories } =
    useData();
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | undefined>(
    undefined,
  );
  const [activeTab, setActiveTab] = useState<"expense" | "income">("expense");
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(),
  );

  useEffect(() => {
    if (searchParams.get("add") === "true") {
      setEditingCategory(undefined);
      setIsModalOpen(true);
      const newParams = new URLSearchParams(searchParams);
      newParams.delete("add");
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Filter out transfers and sort by current order
  const displayCategories = categories.filter(
    (c) => c.type === activeTab && c.id !== "cat_transfer",
  );

  const handleEdit = (cat: Category) => {
    setEditingCategory(cat);
    setIsModalOpen(true);
  };

  const handleReorder = (newOrder: Category[]) => {
    // We only reordered the subset. We need to merge this back into the main list without losing others.
    // Strategy: Create a new list where the items of the activeType are replaced by newOrder, preserving the relative positions of other types?
    // Simpler: Just place the newOrder items at the top/bottom or reconstruct.
    // Best UX: Keep "Income" and "Expense" separated in the master list for easier management?
    // Current impl: Just filter out the other type, append them.
    const otherTypeCategories = categories.filter(
      (c) => c.type !== activeTab || c.id === "cat_transfer",
    );
    reorderCategories([...otherTypeCategories, ...newOrder]);
  };

  const toggleExpand = (id: string) => {
    const newSet = new Set(expandedCategories);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setExpandedCategories(newSet);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-3xl font-bold tracking-tight">
          {t("common.categories")}
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowResetConfirm(true)}
            className="flex items-center gap-2 bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-300 px-5 py-2.5 rounded-2xl font-bold hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors"
            title="Reset to default categories"
          >
            <RotateCcw size={20} />
            <span className="hidden sm:inline">{t("categories.reset")}</span>
          </button>
          <button
            onClick={() => {
              setEditingCategory(undefined);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-5 py-2.5 rounded-2xl font-bold shadow-lg shadow-brand-500/20 hover:scale-[1.02] active:scale-95 transition-all tour-categories-add"
          >
            <Plus size={20} /> {t("categories.addCategory")}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex p-1.5 bg-slate-100 dark:bg-black/40 rounded-2xl w-fit border border-slate-200 dark:border-white/5">
        {(["expense", "income"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-6 py-2.5 rounded-xl text-sm font-bold capitalize transition-all",
              activeTab === tab
                ? "bg-white dark:bg-zinc-800 shadow-md text-slate-900 dark:text-white"
                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300",
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      <ReorderGroup
        axis="y"
        values={displayCategories}
        onReorder={handleReorder}
        className="space-y-3"
      >
        {displayCategories.length === 0 ? (
          <div className="py-24 text-center bg-white/50 dark:bg-zinc-900/50 rounded-[2rem] border-2 border-dashed border-slate-200 dark:border-zinc-800 flex flex-col items-center gap-5">
            <div className="w-20 h-20 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center text-slate-300 dark:text-zinc-600">
              <Plus size={40} strokeWidth={1.5} />
            </div>
            <div className="space-y-2">
              <p className="text-lg font-bold text-slate-900 dark:text-white">
                {t("categories.noCategories")}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Organize your transactions with custom categories. Add your
                first one to get started.
              </p>
            </div>
            <button
              onClick={() => {
                setEditingCategory(undefined);
                setIsModalOpen(true);
              }}
              className="px-6 py-3 bg-brand-600 text-white font-bold rounded-2xl hover:bg-brand-700 transition-colors shadow-lg shadow-brand-500/20"
            >
              {t("categories.addCategory")}
            </button>
          </div>
        ) : (
          displayCategories.map((cat) => (
            <CategoryRow
              key={cat.id}
              cat={cat}
              isExpanded={expandedCategories.has(cat.id)}
              onToggleExpand={toggleExpand}
              onEdit={handleEdit}
              onDelete={(id) => setCategoryToDelete(id)}
              t={t}
            />
          ))
        )}
      </ReorderGroup>

      <AnimatePresence>
        {isModalOpen && (
          <CategoryModal
            onClose={() => setIsModalOpen(false)}
            categoryToEdit={editingCategory}
            initialType={activeTab}
          />
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={!!categoryToDelete}
        onClose={() => setCategoryToDelete(null)}
        onConfirm={() => {
          if (categoryToDelete) deleteCategory(categoryToDelete);
        }}
        title={t("categories.deleteCategory")}
        message={t("categories.deleteCategoryMessage")}
        confirmText={t("common.delete")}
        isDestructive
      />

      <ConfirmModal
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        onConfirm={() => {
          resetCategories();
          setShowResetConfirm(false);
        }}
        title={t("categories.resetCategories")}
        message={t("categories.resetCategoriesMessage")}
        confirmText={t("categories.resetToDefaults")}
        isDestructive
      />
    </div>
  );
};

export default Categories;

function CategoryRow({
  cat,
  isExpanded,
  onToggleExpand,
  onEdit,
  onDelete,
  t,
}: {
  cat: Category;
  isExpanded: boolean;
  onToggleExpand: (id: string) => void;
  onEdit: (cat: Category) => void;
  onDelete: (id: string) => void;
  t: any;
}) {
  const Icon = getCategoryIcon(cat.icon);
  const subCount = cat.subCategories?.length || 0;
  const controls = useDragControls();

  return (
    <ReorderItem
      value={cat}
      dragListener={false}
      dragControls={controls}
      className="list-none"
    >
      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200 dark:border-white/5 overflow-hidden group hover:shadow-lg transition-all">
        <div className="p-4 flex items-center gap-4">
          <div
            className="cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500 p-2 touch-none"
            onPointerDown={(e) => controls.start(e)}
          >
            <GripVertical size={20} />
          </div>

          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-md"
            style={{ backgroundColor: cat.color }}
          >
            <Icon size={20} />
          </div>

          <div className="flex-1 cursor-pointer" onClick={() => onToggleExpand(cat.id)}>
            <div className="font-bold text-slate-800 dark:text-slate-100">
              {cat.name}
            </div>
            <div className="text-xs text-slate-500 font-medium">
              {subCount} Sub-categor{subCount === 1 ? "y" : "ies"}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(cat)}
              className="p-2 text-slate-400 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition-colors"
            >
              <Pencil size={18} />
            </button>
            <button
              onClick={() => onDelete(cat.id)}
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-colors"
            >
              <Trash2 size={18} />
            </button>
            <button
              onClick={() => onToggleExpand(cat.id)}
              className="p-2 text-slate-400 hover:text-brand-600 rounded-xl transition-colors"
            >
              {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {isExpanded && (
            <MotionDiv
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-slate-50 dark:bg-black/40 border-t border-slate-100 dark:border-white/5"
            >
              <div className="p-4 pl-20 pr-8">
                {cat.subCategories && cat.subCategories.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {cat.subCategories.map((sub) => (
                      <span
                        key={sub.id}
                        className="px-3 py-1 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300"
                      >
                        {sub.name}
                      </span>
                    ))}
                    <button
                      onClick={() => onEdit(cat)}
                      className="px-3 py-1 bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 rounded-lg text-sm font-bold hover:bg-brand-200 transition-colors"
                    >
                      + Manage
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-slate-400 italic">
                      No sub-categories defined.
                    </span>
                    <button
                      onClick={() => onEdit(cat)}
                      className="text-xs font-bold text-brand-600 hover:underline"
                    >
                      {t("categories.addSubCategory")}
                    </button>
                  </div>
                )}
              </div>
            </MotionDiv>
          )}
        </AnimatePresence>
      </div>
    </ReorderItem>
  );
}
