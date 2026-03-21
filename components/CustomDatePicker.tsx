import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../utils";

interface Props {
  value: string; // ISO date string YYYY-MM-DD
  onChange: (date: string) => void;
  label?: string;
  className?: string;
  maxDate?: string;
  minDate?: string;
}

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const CustomDatePicker: React.FC<Props> = ({
  value,
  onChange,
  label = "Date",
  className,
  maxDate,
  minDate,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"days" | "months" | "years">("days");
  const containerRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  // Parse initial value or default to today
  const initialDate = value ? new Date(value) : new Date();
  const [viewDate, setViewDate] = useState(initialDate);

  // Reset view when opening
  useEffect(() => {
    if (isOpen) {
      setViewDate(value ? new Date(value) : new Date());
      setViewMode("days");
      updatePosition();
    }
  }, [isOpen, value]);

  const updatePosition = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const calendarWidth = Math.min(320, window.innerWidth - 32);
      const calendarHeight = 400; // Estimated max height
      const padding = 16;
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;

      let left = rect.left;
      if (left + calendarWidth > windowWidth - padding) {
        left = windowWidth - padding - calendarWidth;
      }
      if (left < padding) left = padding;

      let top = rect.bottom + 8;
      if (top + calendarHeight > windowHeight - padding) {
        if (rect.top > calendarHeight + 8 + padding) {
          top = rect.top - calendarHeight - 8;
        } else {
          top = Math.max(padding, windowHeight - padding - calendarHeight);
        }
      }

      setCoords({ top, left });
    }
  };

  useEffect(() => {
    const handleResize = () => {
      if (isOpen) updatePosition();
    };
    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleResize, true);
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleResize, true);
    };
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        calendarRef.current &&
        !calendarRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const changeMonth = (delta: number) => {
    const newDate = new Date(viewDate);
    newDate.setMonth(newDate.getMonth() + delta);
    setViewDate(newDate);
  };

  const changeYear = (delta: number) => {
    const newDate = new Date(viewDate);
    newDate.setFullYear(newDate.getFullYear() + delta);
    setViewDate(newDate);
  };

  const handleDayClick = (day: number) => {
    const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);

    // Check constraints
    if (maxDate && newDate > new Date(maxDate)) return;
    if (minDate && newDate < new Date(minDate)) return;

    const offset = newDate.getTimezoneOffset();
    const adjustedDate = new Date(newDate.getTime() - offset * 60 * 1000);
    onChange(adjustedDate.toISOString().split("T")[0]);
    setIsOpen(false);
  };

  const handleMonthClick = (monthIdx: number) => {
    const newDate = new Date(viewDate);
    newDate.setMonth(monthIdx);
    setViewDate(newDate);
    setViewMode("days");
  };

  const handleYearClick = (year: number) => {
    const newDate = new Date(viewDate);
    newDate.setFullYear(year);
    setViewDate(newDate);
    setViewMode("months");
  };

  const handleTodayClick = () => {
    const today = new Date();
    if (maxDate && today > new Date(maxDate)) return;
    if (minDate && today < new Date(minDate)) return;

    const offset = today.getTimezoneOffset();
    const adjustedDate = new Date(today.getTime() - offset * 60 * 1000);
    onChange(adjustedDate.toISOString().split("T")[0]);
    setIsOpen(false);
  };

  const formatDateDisplay = (isoDate: string) => {
    if (!isoDate) return "Select Date";
    const date = new Date(isoDate);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const daysInMonth = getDaysInMonth(viewDate);
  const firstDay = getFirstDayOfMonth(viewDate);
  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  // Generate Year range (e.g., current view - 100 to +20)
  const currentYear = viewDate.getFullYear();
  const years = [];
  for (let i = currentYear - 50; i <= currentYear + 50; i++) {
    years.push(i);
  }

  const portalRoot = typeof document !== "undefined" ? document.body : null;

  const isDateDisabled = (day: number) => {
    const d = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    if (maxDate && d > new Date(maxDate)) return true;
    if (minDate && d < new Date(minDate)) return true;
    return false;
  };

  return (
    <div className="relative" ref={containerRef}>
      <label className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
        <CalendarIcon size={12} /> {label}
      </label>

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full p-4 bg-slate-50 dark:bg-black border rounded-2xl font-medium text-left transition-all flex items-center justify-between",
          isOpen
            ? "border-brand-500 ring-2 ring-brand-500/20"
            : "border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-900",
          className,
        )}
      >
        <span
          className={cn(
            "text-lg",
            value ? "text-slate-900 dark:text-white" : "text-slate-400",
          )}
        >
          {formatDateDisplay(value)}
        </span>
        <CalendarIcon size={20} className="text-slate-400" />
      </button>

      {portalRoot &&
        createPortal(
          <AnimatePresence>
            {isOpen && (
              <motion.div
                key="datepicker-dropdown"
                ref={calendarRef}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                style={{ top: coords.top, left: coords.left }}
                className="fixed z-[9999] p-4 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-3xl shadow-xl w-[320px] max-w-[calc(100vw-32px)]"
                onMouseDown={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <button
                    type="button"
                    onClick={() => {
                      if (viewMode === "days") changeMonth(-1);
                      else if (viewMode === "months") changeYear(-1);
                    }}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-full text-slate-500"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <div className="flex items-center gap-1 font-bold text-slate-900 dark:text-white text-lg">
                    <button
                      type="button"
                      onClick={() =>
                        setViewMode(viewMode === "months" ? "days" : "months")
                      }
                      className="px-2 py-1 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                    >
                      {MONTHS[viewDate.getMonth()]}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setViewMode(viewMode === "years" ? "days" : "years")
                      }
                      className="px-2 py-1 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                    >
                      {viewDate.getFullYear()}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (viewMode === "days") changeMonth(1);
                      else if (viewMode === "months") changeYear(1);
                    }}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-full text-slate-500"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>

                <div className="relative overflow-hidden min-h-[240px]">
                  <AnimatePresence mode="wait">
                    {viewMode === "days" && (
                      <motion.div
                        key="days-view"
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                      >
                        <div className="grid grid-cols-7 mb-2">
                          {DAYS.map((d) => (
                            <div
                              key={d}
                              className="text-center text-xs font-bold text-slate-400 uppercase"
                            >
                              {d}
                            </div>
                          ))}
                        </div>
                        <div className="grid grid-cols-7 gap-1">
                          {days.map((day, idx) => {
                            if (day === null)
                              return <div key={`empty-${idx}`} />;
                            const isSelected =
                              value &&
                              new Date(value).getDate() === day &&
                              new Date(value).getMonth() ===
                                viewDate.getMonth() &&
                              new Date(value).getFullYear() ===
                                viewDate.getFullYear();
                            const isToday =
                              new Date().getDate() === day &&
                              new Date().getMonth() === viewDate.getMonth() &&
                              new Date().getFullYear() ===
                                viewDate.getFullYear();
                            const disabled = isDateDisabled(day);

                            return (
                              <button
                                key={day}
                                type="button"
                                disabled={disabled}
                                onClick={() => handleDayClick(day)}
                                className={cn(
                                  "h-10 w-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                                  isSelected
                                    ? "bg-brand-500 text-white shadow-md shadow-brand-500/20"
                                    : isToday
                                      ? "bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400"
                                      : "hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-slate-300",
                                  disabled && "opacity-20 cursor-not-allowed",
                                )}
                              >
                                {day}
                              </button>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}

                    {viewMode === "months" && (
                      <motion.div
                        key="months-view"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="grid grid-cols-3 gap-2 py-2"
                      >
                        {MONTHS.map((m, idx) => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => handleMonthClick(idx)}
                            className={cn(
                              "py-3 px-2 rounded-xl text-sm font-bold transition-all",
                              viewDate.getMonth() === idx
                                ? "bg-brand-500 text-white shadow-lg"
                                : "hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-600 dark:text-slate-400",
                            )}
                          >
                            {m.slice(0, 3)}
                          </button>
                        ))}
                      </motion.div>
                    )}

                    {viewMode === "years" && (
                      <motion.div
                        key="years-view"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="grid grid-cols-4 gap-2 max-h-[240px] overflow-y-auto custom-scrollbar pr-1"
                      >
                        {years.map((y) => (
                          <button
                            key={y}
                            type="button"
                            onClick={() => handleYearClick(y)}
                            className={cn(
                              "py-3 rounded-xl text-sm font-bold transition-all",
                              viewDate.getFullYear() === y
                                ? "bg-brand-500 text-white shadow-lg"
                                : "hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-600 dark:text-slate-400",
                            )}
                          >
                            {y}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Footer */}
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-zinc-800 flex justify-center">
                  <button
                    type="button"
                    onClick={handleTodayClick}
                    className="text-sm font-bold text-brand-600 dark:text-brand-400 hover:underline"
                  >
                    Today
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>,
          portalRoot,
        )}
    </div>
  );
};

export default CustomDatePicker;
