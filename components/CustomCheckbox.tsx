import React from "react";
import { Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../utils";

interface CustomCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: React.ReactNode;
  id?: string;
  className?: string;
  disabled?: boolean;
}

const CustomCheckbox: React.FC<CustomCheckboxProps> = ({
  checked,
  onChange,
  label,
  id = "custom-checkbox",
  className,
  disabled = false,
}) => {
  return (
    <div
      className={cn(
        "flex items-center gap-3 cursor-pointer group",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      onClick={() => !disabled && onChange(!checked)}
    >
      <div
        className={cn(
          "w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all duration-300 shrink-0",
          checked
            ? "bg-brand-500 border-brand-500 shadow-lg shadow-brand-500/30"
            : "border-slate-300 dark:border-zinc-700 bg-white dark:bg-black group-hover:border-brand-400"
        )}
      >
        <AnimatePresence>
          {checked && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", damping: 15, stiffness: 300 }}
            >
              <Check size={14} className="text-white stroke-[3]" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {label && (
        <label
          htmlFor={id}
          className="text-sm font-semibold text-slate-500 dark:text-slate-400 select-none cursor-pointer group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors"
        >
          {label}
        </label>
      )}
    </div>
  );
};

export default CustomCheckbox;
