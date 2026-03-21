import React, { useState, useEffect, useRef } from "react";
import { X, Plus, Trash2, AlertCircle } from "lucide-react";
import { Category, SubCategory } from "../types";
import { cn, getCategoryIcon, ICON_MAP, generateId } from "../utils";
import { useData } from "../context/DataContext";
import { useToast } from "../context/ToastContext";
import { COLORS } from "../constants";
import IconPicker from "./IconPicker";
import { useScrollToError } from "../hooks/useScrollToError";
import { useEscapeKey } from "../hooks/useEscapeKey";

interface Props {
  onClose: () => void;
  categoryToEdit?: Category;
  initialType?: "income" | "expense";
}

const CategoryModal: React.FC<Props> = ({
  onClose,
  categoryToEdit,
  initialType = "expense",
}) => {
  const { addCategory, updateCategory } = useData();

  const [name, setName] = useState("");
  const [type, setType] = useState<"income" | "expense" | "transfer">(
    initialType,
  );
  const [color, setColor] = useState(COLORS[0]);
  const [selectedIcon, setSelectedIcon] = useState("Circle");
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [newSubCatName, setNewSubCatName] = useState("");

  useEffect(() => {
    if (categoryToEdit) {
      setName(categoryToEdit.name);
      setType(categoryToEdit.type);
      setColor(categoryToEdit.color);
      setSelectedIcon(categoryToEdit.icon);
      setSubCategories(categoryToEdit.subCategories || []);
    }
  }, [categoryToEdit]);

  const { success, error: toastError } = useToast();
  const [error, setError] = useState("");

  const scrollRef = useRef<HTMLDivElement>(null);
  useScrollToError(error, scrollRef);
  useEscapeKey(true, onClose);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Please enter a category name.");
      return;
    }

    try {
      if (categoryToEdit) {
        updateCategory({
          ...categoryToEdit,
          name,
          type,
          color,
          icon: selectedIcon,
          subCategories,
        });
        success("Category updated successfully.");
      } else {
        addCategory({
          id: generateId(),
          name,
          type,
          color,
          icon: selectedIcon,
          subCategories,
        });
        success("Category created successfully.");
      }
      onClose();
    } catch (err: any) {
      toastError(err.message || "Failed to save category.");
    }
  };

  const handleAddSubCat = () => {
    if (!newSubCatName.trim()) return;
    setSubCategories([
      ...subCategories,
      { id: generateId(), name: newSubCatName.trim() },
    ]);
    setNewSubCatName("");
  };

  const handleDeleteSubCat = (id: string) => {
    setSubCategories(subCategories.filter((sc) => sc.id !== id));
  };

  const IconComponent = getCategoryIcon(selectedIcon);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />

        {/* Modal Card */}
        <div className="relative transform rounded-3xl bg-white dark:bg-zinc-900 text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-md w-full border border-slate-100 dark:border-zinc-800 flex flex-col max-h-[90vh] overflow-hidden">
          <div className="p-5 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between bg-slate-50/80 dark:bg-zinc-800/50 backdrop-blur-sm z-10 shrink-0">
            <h2 className="text-lg font-bold">
              {categoryToEdit ? "Edit Category" : "New Category"}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-200 dark:hover:bg-zinc-700 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div
            ref={scrollRef}
            className="p-6 overflow-y-auto custom-scrollbar flex-1"
          >
            {/* Preview */}
            <div className="flex justify-center mb-2">
              <div className="flex flex-col items-center gap-3">
                <div
                  className="w-20 h-20 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-slate-200 dark:shadow-none transition-all duration-300"
                  style={{ backgroundColor: color }}
                >
                  <IconComponent size={40} />
                </div>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 text-sm font-medium rounded-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2 mb-6">
                <AlertCircle size={18} /> {error}
              </div>
            )}

            <form
              id="cat-form"
              onSubmit={handleSubmit}
              className="space-y-6 pb-6 pt-2"
            >
              {/* Name */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Category Name
                </label>
                <input
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setError("");
                  }}
                  placeholder="e.g. Groceries"
                  className={cn(
                    "w-full p-4 bg-slate-50 dark:bg-zinc-800 border rounded-2xl outline-none font-medium transition-all",
                    error && !name
                      ? "border-rose-300 dark:border-rose-900 focus:ring-rose-500"
                      : "border-slate-200 dark:border-zinc-700 focus:ring-2 focus:ring-brand-500",
                  )}
                  autoFocus
                />
              </div>

              {/* Type */}
              {!categoryToEdit && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Type
                  </label>
                  <div className="flex bg-slate-100 dark:bg-zinc-800 p-1.5 rounded-2xl">
                    {(["expense", "income"] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setType(t)}
                        className={cn(
                          "flex-1 py-2.5 rounded-xl text-sm font-bold transition-all capitalize",
                          type === t
                            ? "bg-white dark:bg-zinc-700 shadow-sm text-slate-900 dark:text-white"
                            : "text-slate-500 dark:text-slate-400",
                        )}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Sub Categories */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Sub-Categories
                </label>
                <div className="bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 space-y-3">
                  <div className="flex gap-2">
                    <input
                      value={newSubCatName}
                      onChange={(e) => setNewSubCatName(e.target.value)}
                      placeholder="Add sub-category..."
                      className="flex-1 px-3 py-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddSubCat();
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleAddSubCat}
                      className="p-2 bg-brand-500 text-white rounded-xl hover:bg-brand-600 transition-colors"
                    >
                      <Plus size={20} />
                    </button>
                  </div>

                  {subCategories.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {subCategories.map((sub) => (
                        <div
                          key={sub.id}
                          className="flex items-center gap-1 pl-3 pr-1 py-1 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg text-sm group"
                        >
                          <span>{sub.name}</span>
                          <button
                            type="button"
                            onClick={() => handleDeleteSubCat(sub.id)}
                            className="p-1 text-slate-400 hover:text-rose-500 rounded-md transition-colors"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Colors */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Color
                </label>
                <div className="grid grid-cols-6 gap-3">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={cn(
                        "w-full aspect-square rounded-full transition-transform hover:scale-110",
                        color === c
                          ? "ring-2 ring-offset-2 ring-slate-400 dark:ring-offset-zinc-900 scale-110"
                          : "",
                      )}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              {/* Icons */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Icon
                </label>
                <IconPicker
                  selectedIcon={selectedIcon}
                  onSelect={setSelectedIcon}
                />
              </div>
            </form>
          </div>

          <div className="p-5 border-t border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 shrink-0">
            <button
              form="cat-form"
              type="submit"
              className="w-full py-4 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-2xl shadow-lg shadow-brand-500/30 transition-all active:scale-[0.98]"
            >
              {categoryToEdit ? "Save Changes" : "Create Category"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryModal;
