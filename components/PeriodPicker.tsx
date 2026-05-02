import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, ChevronDown, ArrowRight } from "lucide-react";
import { TimeRange } from "../types";
import { cn } from "../utils";
import CustomDatePicker from "./CustomDatePicker";
import { useTranslation } from "react-i18next";

interface PeriodPickerProps {
  timeRange: TimeRange;
  onChangeTimeRange: (range: TimeRange) => void;
  customStartDate?: string;
  onChangeCustomStartDate?: (date: string) => void;
  customEndDate?: string;
  onChangeCustomEndDate?: (date: string) => void;
  className?: string;
}

export const PeriodPicker: React.FC<PeriodPickerProps> = ({
  timeRange,
  onChangeTimeRange,
  customStartDate,
  onChangeCustomStartDate,
  customEndDate,
  onChangeCustomEndDate,
  className,
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const timeRangeOptions: { value: TimeRange; label: string }[] = [
    { value: "this_month", label: t("common.this_month") },
    { value: "last_month", label: t("common.last_month") },
    { value: "last_30_days", label: t("common.last_30_days") },
    { value: "last_3_months", label: t("common.last_3_months") },
    { value: "last_6_months", label: t("common.last_6_months") },
    { value: "this_year", label: t("common.this_year") },
    { value: "last_year", label: t("common.last_year") },
    { value: "all_time", label: t("common.all_time") },
    { value: "custom", label: t("common.custom") },
  ];

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row items-start sm:items-center gap-2 z-30",
        className,
      )}
    >
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm hover:shadow-md transition-all group"
        >
          <Calendar size={18} className="text-brand-500" />
          <span className="text-sm font-bold text-slate-700 dark:text-zinc-300">
            {timeRangeOptions.find((opt) => opt.value === timeRange)?.label ||
              "Select Period"}
          </span>
          <ChevronDown
            size={16}
            className={cn(
              "text-slate-400 transition-transform duration-300",
              isOpen && "rotate-180",
            )}
          />
        </button>

        <AnimatePresence>
          {isOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsOpen(false)}
              />
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 sm:left-0 mt-2 w-48 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 rounded-[1.5rem] shadow-xl z-50 overflow-hidden py-1 backdrop-blur-xl"
              >
                {timeRangeOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      onChangeTimeRange(option.value as TimeRange);
                      setIsOpen(false);
                    }}
                    className={cn(
                      "w-full px-4 py-2.5 text-left text-sm font-medium transition-colors",
                      timeRange === option.value
                        ? "bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400"
                        : "text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-white/5",
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence mode="popLayout">
        {timeRange === "custom" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, x: -10 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.95, x: -10 }}
            className="flex items-center gap-1 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm p-1"
          >
            <div className="w-[125px]">
              <CustomDatePicker
                value={customStartDate || ""}
                onChange={(v) =>
                  onChangeCustomStartDate && onChangeCustomStartDate(v)
                }
                className="bg-transparent border-transparent hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl !py-1.5 !px-2 shadow-none"
                label=""
              />
            </div>
            <ArrowRight
              size={14}
              className="text-slate-300 dark:text-zinc-600 shrink-0"
            />
            <div className="w-[125px]">
              <CustomDatePicker
                value={customEndDate || ""}
                onChange={(v) =>
                  onChangeCustomEndDate && onChangeCustomEndDate(v)
                }
                className="bg-transparent border-transparent hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl !py-1.5 !px-2 shadow-none"
                label=""
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PeriodPicker;
