import React, { useState, useRef, useCallback, useEffect } from "react";
import { motion } from "framer-motion";

interface PatternLockProps {
  /** Called when pattern is completed (minimum 4 dots) */
  onComplete: (points: number[]) => void;
  /** Whether the last attempt was wrong (triggers red animation) */
  error?: boolean;
  /** Whether submit is in progress */
  loading?: boolean;
  /** Text label above the grid */
  label?: string;
  /** Reset the pattern */
  resetKey?: number;
  /** Size of the grid area in px */
  size?: number;
  /** True if used inside the dark glassmorphic overlay */
  isOverlay?: boolean;
}

const GRID = 3;
const DOT_COUNT = GRID * GRID;
const MIN_POINTS = 4;

const PatternLock: React.FC<PatternLockProps> = ({
  onComplete,
  error = false,
  loading = false,
  label = "Draw Pattern",
  resetKey = 0,
  size = 260,
  isOverlay = false,
}) => {
  const [selected, setSelected] = useState<number[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [showError, setShowError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dotPositionsRef = useRef<
    Array<{ x: number; y: number; idx: number }>
  >([]);

  // Calculate dot positions
  const padding = 30;
  const innerSize = size - padding * 2;
  const cellSize = innerSize / (GRID - 1);

  const getDotPosition = useCallback(
    (idx: number) => {
      const row = Math.floor(idx / GRID);
      const col = idx % GRID;
      return {
        x: padding + col * cellSize,
        y: padding + row * cellSize,
      };
    },
    [cellSize],
  );

  // Build dot positions cache
  useEffect(() => {
    dotPositionsRef.current = Array.from({ length: DOT_COUNT }, (_, i) => ({
      ...getDotPosition(i),
      idx: i,
    }));
  }, [getDotPosition]);

  // Error animation
  useEffect(() => {
    if (error) {
      setShowError(true);
      const timer = setTimeout(() => {
        setShowError(false);
        setSelected([]);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Reset
  useEffect(() => {
    setSelected([]);
    setShowError(false);
  }, [resetKey]);

  const getClosestDot = useCallback(
    (clientX: number, clientY: number): number | null => {
      if (!containerRef.current) return null;
      const rect = containerRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;

      const threshold = cellSize * 0.45;

      for (const dot of dotPositionsRef.current) {
        const dist = Math.sqrt((x - dot.x) ** 2 + (y - dot.y) ** 2);
        if (dist < threshold) {
          return dot.idx;
        }
      }
      return null;
    },
    [cellSize],
  );

  const handleStart = useCallback(
    (clientX: number, clientY: number) => {
      if (loading) return;
      const dot = getClosestDot(clientX, clientY);
      if (dot !== null) {
        setIsDrawing(true);
        setSelected([dot]);
        setShowError(false);
      }
    },
    [loading, getClosestDot],
  );

  const handleMove = useCallback(
    (clientX: number, clientY: number) => {
      if (!isDrawing || loading) return;
      const dot = getClosestDot(clientX, clientY);
      if (dot !== null && !selected.includes(dot)) {
        setSelected((prev) => [...prev, dot]);
      }
    },
    [isDrawing, loading, selected, getClosestDot],
  );

  const handleEnd = useCallback(() => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (selected.length >= MIN_POINTS) {
      onComplete(selected);
    } else if (selected.length > 0) {
      // Not enough dots — show brief error
      setShowError(true);
      setTimeout(() => {
        setShowError(false);
        setSelected([]);
      }, 400);
    }
  }, [isDrawing, selected, onComplete]);

  // Mouse events
  const onMouseDown = (e: React.MouseEvent) =>
    handleStart(e.clientX, e.clientY);
  const onMouseMove = (e: React.MouseEvent) =>
    handleMove(e.clientX, e.clientY);
  const onMouseUp = () => handleEnd();

  // Touch events
  const onTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    handleStart(touch.clientX, touch.clientY);
  };
  const onTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    handleMove(touch.clientX, touch.clientY);
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    handleEnd();
  };

  const lineColor = showError ? "#ef4444" : "#10b981";

  return (
    <div className="flex flex-col items-center w-full select-none">
      {/* Label */}
      <p className={`text-sm font-semibold mb-4 ${isOverlay ? "text-white/60" : "text-slate-500 dark:text-zinc-400"}`}>
        {label}
      </p>

      <p className={`text-xs mb-4 ${isOverlay ? "text-white/40" : "text-slate-400 dark:text-zinc-500"}`}>
        Connect at least {MIN_POINTS} dots
      </p>

      {/* Grid Container */}
      <div
        ref={containerRef}
        className="relative touch-none cursor-pointer"
        style={{ width: size, height: size }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* SVG Lines */}
        <svg
          className="absolute inset-0 pointer-events-none"
          width={size}
          height={size}
        >
          {selected.map((dotIdx, i) => {
            if (i === 0) return null;
            const from = getDotPosition(selected[i - 1]);
            const to = getDotPosition(dotIdx);
            return (
              <motion.line
                key={`${selected[i - 1]}-${dotIdx}`}
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke={lineColor}
                strokeWidth={3}
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.15 }}
              />
            );
          })}
        </svg>

        {/* Dots */}
        {Array.from({ length: DOT_COUNT }, (_, i) => {
          const pos = getDotPosition(i);
          const isSelected = selected.includes(i);
          const isError = showError && isSelected;

          return (
            <div
              key={i}
              className="absolute transform -translate-x-1/2 -translate-y-1/2"
              style={{ left: pos.x, top: pos.y }}
            >
              {/* Outer ring (appears on selection) */}
              <motion.div
                className={`
                  absolute inset-0 rounded-full transition-all duration-200
                  ${
                    isSelected
                      ? isError
                        ? "bg-rose-500/20"
                        : "bg-brand-500/20"
                      : "bg-transparent"
                  }
                `}
                style={{
                  width: 36,
                  height: 36,
                  marginLeft: -18,
                  marginTop: -18,
                }}
                animate={isSelected ? { scale: [0.5, 1] } : {}}
              />
              {/* Inner dot */}
              <div
                className={`
                  w-4 h-4 rounded-full transition-all duration-200
                  ${
                    isSelected
                      ? isError
                        ? "bg-rose-500 scale-125"
                        : "bg-brand-500 scale-125"
                      : isOverlay
                      ? "bg-white/30"
                      : "bg-slate-300 dark:bg-zinc-600"
                  }
                `}
                style={{ marginLeft: -8, marginTop: -8 }}
              />
            </div>
          );
        })}
      </div>

      {/* Clear button */}
      {selected.length > 0 && !isDrawing && (
        <button
          onClick={() => setSelected([])}
          className={`mt-4 text-sm font-bold transition-colors ${
            isOverlay
              ? "text-white/40 hover:text-white/60"
              : "text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300"
          }`}
        >
          Clear Pattern
        </button>
      )}
    </div>
  );
};

export default PatternLock;
