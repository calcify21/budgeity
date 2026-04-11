import React, { useState, useEffect, useRef } from "react";
import { Delete, Check } from "lucide-react";
import { motion } from "framer-motion";

interface PinInputProps {
  /** Number of digits (4-6) */
  length?: number;
  /** Called when PIN is fully entered */
  onComplete: (pin: string) => void;
  /** Whether the last attempt was wrong (triggers shake) */
  error?: boolean;
  /** Whether submit is in progress */
  loading?: boolean;
  /** Text label above the PIN dots */
  label?: string;
  /** Reset the input */
  resetKey?: number;
  /** True if used inside the dark glassmorphic overlay */
  isOverlay?: boolean;
}

const PinInput: React.FC<PinInputProps> = ({
  length = 4,
  onComplete,
  error = false,
  loading = false,
  label = "Enter PIN",
  resetKey = 0,
  isOverlay = false,
}) => {
  const [digits, setDigits] = useState<string[]>([]);
  const [shaking, setShaking] = useState(false);
  const submitted = useRef(false);

  // Reset on error or resetKey change
  useEffect(() => {
    if (error) {
      setShaking(true);
      const timer = setTimeout(() => {
        setShaking(false);
        setDigits([]);
        submitted.current = false;
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    setDigits([]);
    submitted.current = false;
  }, [resetKey]);

  // Auto-submit when PIN length is reached
  useEffect(() => {
    if (digits.length === length && !submitted.current) {
      submitted.current = true;
      onComplete(digits.join(""));
    }
  }, [digits, length, onComplete]);

  const handleDigit = (d: string) => {
    if (loading || digits.length >= length) return;
    submitted.current = false;
    setDigits((prev) => [...prev, d]);
  };

  const handleDelete = () => {
    if (loading) return;
    submitted.current = false;
    setDigits((prev) => prev.slice(0, -1));
  };

  const buttons = [
    "1", "2", "3",
    "4", "5", "6",
    "7", "8", "9",
    "", "0", "DEL",
  ];

  return (
    <div className="flex flex-col items-center w-full max-w-xs mx-auto select-none">
      {/* Label */}
      <p className={`text-sm font-semibold mb-5 ${isOverlay ? "text-white/60" : "text-slate-500 dark:text-zinc-400"}`}>
        {label}
      </p>

      {/* PIN Dots */}
      <motion.div
        className="flex items-center gap-3 mb-8"
        animate={shaking ? { x: [0, -12, 12, -12, 12, -6, 6, 0] } : {}}
        transition={{ duration: 0.4 }}
      >
        {Array.from({ length }).map((_, i) => (
          <div
            key={i}
            className={`
              w-4 h-4 rounded-full transition-all duration-200
              ${
                i < digits.length
                  ? error
                    ? "bg-rose-500 scale-110"
                    : "bg-brand-500 scale-110"
                  : isOverlay
                  ? "bg-white/20"
                  : "bg-slate-200 dark:bg-zinc-700"
              }
            `}
          />
        ))}
      </motion.div>

      {/* Numeric Keypad */}
      <div className="grid grid-cols-3 gap-3 w-full">
        {buttons.map((btn, idx) => {
          if (btn === "") {
            return <div key={idx} />;
          }

          if (btn === "DEL") {
            return (
              <button
                key={idx}
                onClick={handleDelete}
                disabled={loading || digits.length === 0}
                className={`h-16 rounded-2xl flex items-center justify-center active:scale-95 transition-all disabled:opacity-30 ${
                  isOverlay
                    ? "text-white/60 hover:bg-white/10"
                    : "text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800"
                }`}
              >
                <Delete size={24} />
              </button>
            );
          }

          return (
            <button
              key={idx}
              onClick={() => handleDigit(btn)}
              disabled={loading || digits.length >= length}
              className={`h-16 rounded-2xl text-2xl font-bold active:scale-95 transition-all disabled:opacity-30 shadow-sm border ${
                isOverlay
                  ? "text-white bg-white/5 hover:bg-white/10 border-white/10"
                  : "text-slate-800 dark:text-white bg-slate-50 dark:bg-zinc-800/60 hover:bg-slate-100 dark:hover:bg-zinc-700 border-slate-100 dark:border-zinc-700/50"
              }`}
            >
              {btn}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default PinInput;
