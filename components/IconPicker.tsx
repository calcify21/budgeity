import React, { useState, useMemo, useRef, useEffect } from "react";
import { Search, X } from "lucide-react";
import { ICON_MAP, ICON_CATEGORIES, categorizeIcons, cn } from "../utils";
import { useVirtualizer } from "@tanstack/react-virtual";

interface IconPickerProps {
  selectedIcon: string;
  onSelect: (iconName: string) => void;
  className?: string;
}

const COLUMNS = 6;

const IconPicker: React.FC<IconPickerProps> = ({
  selectedIcon,
  onSelect,
  className,
}) => {
  const [search, setSearch] = useState("");
  const parentRef = useRef<HTMLDivElement>(null);

  const categorizedIcons = useMemo(() => {
    const allIcons = Object.keys(ICON_MAP);
    let categorized = categorizeIcons(allIcons);

    if (search.trim()) {
      const searchLower = search.toLowerCase();
      const filtered: Record<string, string[]> = {};

      Object.keys(categorized).forEach((category) => {
        const matchingIcons = categorized[category].filter((name) =>
          name.toLowerCase().includes(searchLower),
        );
        if (matchingIcons.length > 0) {
          filtered[category] = matchingIcons;
        }
      });
      return filtered;
    }

    return categorized;
  }, [search]);

  const rows = useMemo(() => {
    const flattenedRows: any[] = [];

    ICON_CATEGORIES.forEach((catConfig) => {
      const catName = catConfig.name;
      const icons = categorizedIcons[catName];

      if (!icons || icons.length === 0) return;

      flattenedRows.push({ type: "header", title: catName });

      for (let i = 0; i < icons.length; i += COLUMNS) {
        flattenedRows.push({
          type: "icons",
          items: icons.slice(i, i + COLUMNS),
        });
      }
    });

    return flattenedRows;
  }, [categorizedIcons]);

  const totalVisibleCount = useMemo(() => {
    return Object.values(categorizedIcons).reduce(
      (acc, curr) => acc + curr.length,
      0,
    );
  }, [categorizedIcons]);

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (index) => {
      const row = rows[index];
      return row.type === "header" ? 36 : 56;
    },
    overscan: 5,
  });

  useEffect(() => {
    if (rowVirtualizer.getTotalSize() > 0 && parentRef.current) {
      rowVirtualizer.scrollToOffset(0);
    }
  }, [search]);

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div className="relative group shrink-0">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <Search
            size={18}
            className="text-slate-400 group-focus-within:text-brand-500 transition-colors"
          />
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search all icons..."
          className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-800 rounded-2xl outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-sm"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute inset-y-0 right-4 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X size={16} />
          </button>
        )}
      </div>

      <div
        ref={parentRef}
        className="px-1 custom-scrollbar shrink-0"
        style={{ height: "360px", overflowY: "auto" }}
      >
        {totalVisibleCount > 0 ? (
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: "100%",
              position: "relative",
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const rowData = rows[virtualRow.index];

              return (
                <div
                  key={virtualRow.key}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                    zIndex:
                      rowData.type === "icons" &&
                      rowData.items.includes(selectedIcon)
                        ? 10
                        : 1,
                  }}
                  className="mb-2 pb-2"
                >
                  {rowData.type === "header" ? (
                    <div className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm z-20 py-2 border-b border-slate-100 dark:border-zinc-800">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">
                        {rowData.title}
                      </h4>
                    </div>
                  ) : (
                    <div className="grid grid-cols-6 gap-2 pt-1">
                      {rowData.items.map((key: string) => {
                        const Icon = ICON_MAP[key];
                        if (!Icon) return null;
                        const isSelected = selectedIcon === key;
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => onSelect(key)}
                            className={cn(
                              "aspect-square rounded-2xl flex items-center justify-center transition-all duration-200 group relative",
                              isSelected
                                ? "bg-brand-500 text-white shadow-lg shadow-brand-500/30 scale-105 z-10"
                                : "bg-slate-50 dark:bg-zinc-800/50 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-500 dark:text-slate-400 border border-transparent hover:border-slate-200 dark:hover:border-zinc-700",
                            )}
                            title={key}
                          >
                            <Icon
                              size={20}
                              className={cn(
                                "transition-transform group-hover:scale-110",
                                isSelected && "scale-110",
                              )}
                            />
                            {isSelected && (
                              <div className="absolute -top-1 -right-1 w-3 h-3 bg-white dark:bg-zinc-900 rounded-full border-2 border-brand-500 animate-in zoom-in" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2 h-full">
            <Search size={32} className="opacity-20" />
            <span className="text-sm font-medium">No icons found</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between px-2 pt-2 border-t border-slate-100 dark:border-zinc-800 mt-2 shrink-0">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          {totalVisibleCount} Icons available
        </span>
        {selectedIcon && (
          <div className="flex items-center gap-2 text-[10px] font-bold text-brand-500 uppercase tracking-widest">
            <span>Selected: {selectedIcon}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default IconPicker;
