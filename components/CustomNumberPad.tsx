import React from "react";
import { Delete } from "lucide-react";

interface CustomNumberPadProps {
  onInput: (value: string) => void;
  onDelete: () => void;
  onClear?: () => void;
}

const CustomNumberPad: React.FC<CustomNumberPadProps> = ({
  onInput,
  onDelete,
  onClear,
}) => {
  const buttons = [
    "7",
    "8",
    "9",
    "\u00f7",
    "4",
    "5",
    "6",
    "\u0078",
    "1",
    "2",
    "3",
    "\u002d",
    ".",
    "0",
    "DEL",
    "\u002b",
  ];

  const handleButtonClick = (btn: string) => {
    if (btn === "DEL") {
      onDelete();
    } else {
      onInput(btn);
    }
  };

  return (
    <div className="w-full bg-slate-50 dark:bg-zinc-900/50 rounded-2xl p-4 select-none">
      <div className="grid grid-cols-4 gap-3 mb-3">
        {buttons.map((btn) => (
          <button
            key={btn}
            onClick={() => handleButtonClick(btn)}
            className={`
              h-14 rounded-xl text-xl font-bold transition-all active:scale-95 flex items-center justify-center shadow-sm tour-numpad-${btn}
              ${
                btn === "DEL"
                  ? "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400 hover:bg-rose-200 dark:hover:bg-rose-900/50"
                  : ["\u00f7", "\u0078", "\u002d", "\u002b"].includes(btn)
                    ? "bg-brand-100 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400 hover:bg-brand-200 dark:hover:bg-brand-900/50"
                    : "bg-white dark:bg-zinc-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-zinc-700"
              }
            `}
          >
            {btn === "DEL" ? <Delete size={20} /> : btn}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3">
        {/* Clear Button */}
        <button
          onClick={onClear}
          className="h-14 rounded-xl text-lg font-bold bg-slate-200 dark:bg-zinc-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-zinc-600 active:scale-95 transition-all shadow-sm"
        >
          Clear
        </button>
      </div>
    </div>
  );
};

export default CustomNumberPad;
