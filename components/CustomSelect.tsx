import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, Search, Plus, LucideIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn, ICON_MAP } from "../utils";

export interface SelectOption {
  value: string;
  label: string;
  count?: number;
  color?: string; // Optional color indicator
  icon?: any;
  subLabel?: string;
  isHeader?: boolean;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  searchable?: boolean;
  className?: string;
  label?: string;
  icon?: any;
  onAddNew?: () => void;
}

const CustomSelect: React.FC<CustomSelectProps> = ({
  value,
  onChange,
  options,
  placeholder = "Select...",
  searchable = false,
  className,
  label,
  icon: Icon,
  onAddNew,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Scroll dropdown into view when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        if (dropdownRef.current) {
          dropdownRef.current.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
            inline: "nearest",
          });
        }
      }, 100);
    }
  }, [isOpen]);

  const selectedOption = options.find((opt) => opt && opt.value === value);

  const filteredOptions = options.filter((opt) => {
    if (!opt || !opt.label) return false;
    const s = search.toLowerCase();
    return (
      opt.label.toLowerCase().includes(s) ||
      (opt.value && opt.value.toLowerCase().includes(s)) ||
      (opt.subLabel && opt.subLabel.toLowerCase().includes(s))
    );
  });

  return (
    <div className={cn("relative", className)} ref={containerRef}>
      {label && (
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
          {label}
        </label>
      )}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl hover:border-brand-500 dark:hover:border-brand-500 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500/20"
      >
        <div className="flex items-center gap-3 truncate">
          {Icon && <Icon size={18} className="text-slate-400" />}
          {selectedOption ? (
            <div className="flex items-center gap-3 truncate text-left">
              {selectedOption.color && (
                <div
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: selectedOption.color }}
                />
              )}
              {selectedOption.icon &&
                (() => {
                  const IconComp =
                    typeof selectedOption.icon === "string"
                      ? ICON_MAP[selectedOption.icon]
                      : selectedOption.icon;
                  return IconComp ? (
                    <IconComp size={16} className="text-slate-400" />
                  ) : null;
                })()}
              <div className="flex flex-col truncate">
                <span className="font-medium text-slate-900 dark:text-slate-100 leading-tight">
                  {selectedOption.label}
                </span>
                {selectedOption.subLabel && (
                  <span className="text-xs text-slate-400">
                    {selectedOption.subLabel}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <span className="text-slate-400">{placeholder}</span>
          )}
        </div>
        <ChevronDown
          size={18}
          className={cn(
            "text-slate-400 transition-transform duration-200",
            isOpen && "rotate-180",
          )}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute top-full left-0 right-0 mt-2 z-50 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-xl overflow-hidden"
          >
            {searchable && (
              <div className="p-2 border-b border-slate-100 dark:border-zinc-800">
                <div className="relative">
                  <Search
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search..."
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-zinc-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500/20 text-slate-900 dark:text-white placeholder:text-slate-400"
                    autoFocus
                  />
                </div>
              </div>
            )}

            <div className="max-h-[240px] overflow-y-auto p-1 custom-scrollbar">
              {filteredOptions.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-slate-400">
                  No results found
                </div>
              ) : (
                filteredOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      if (option.isHeader) return;
                      onChange(option.value);
                      setIsOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-colors text-left",
                      option.isHeader
                        ? "mt-2 first:mt-0 font-black text-[10px] text-slate-400 uppercase tracking-widest cursor-default bg-transparent"
                        : value === option.value
                          ? "bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300"
                          : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-zinc-800",
                    )}
                  >
                    <div className="flex items-center gap-3 truncate w-full">
                      {option.color && (
                        <div
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: option.color }}
                        />
                      )}
                      {option.icon &&
                        (() => {
                          const IconComp =
                            typeof option.icon === "string"
                              ? ICON_MAP[option.icon]
                              : option.icon;
                          return IconComp ? (
                            <IconComp size={16} className="text-slate-400" />
                          ) : null;
                        })()}
                      <div className="flex flex-col truncate">
                        <span
                          className={cn(
                            "truncate font-medium",
                            value === option.value && "font-bold",
                          )}
                        >
                          {option.label}
                        </span>
                        {option.subLabel && (
                          <span className="text-xs text-slate-400 dark:text-slate-500 truncate">
                            {option.subLabel}
                          </span>
                        )}
                      </div>
                      {option.count !== undefined && (
                        <span className="text-xs text-slate-400 font-normal ml-auto">
                          ({option.count})
                        </span>
                      )}
                    </div>
                    {value === option.value && (
                      <Check size={16} className="shrink-0 ml-2" />
                    )}
                  </button>
                ))
              )}
            </div>

            {onAddNew && (
              <div className="p-1 border-t border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-black/20">
                <button
                  type="button"
                  onClick={() => {
                    onAddNew();
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-bold text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors"
                >
                  <Plus size={16} />
                  <span>Add New...</span>
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CustomSelect;
