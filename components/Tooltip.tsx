import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../utils";

interface Props {
  content: string;
  children: React.ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  className?: string;
  delay?: number;
  disabled?: boolean;
}

// Fix motion type
const MotionDiv = motion.div as any;

const Tooltip: React.FC<Props> = ({
  content,
  children,
  side = "top",
  className,
  delay = 0.2,
  disabled = false,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  const positions = {
    top: "bottom-full left-1/2 mb-2",
    bottom: "top-full left-1/2 mt-2",
    left: "right-full top-1/2 mr-2",
    right: "left-full top-1/2 ml-2",
  };

  const getAnimation = (side: string) => {
    switch (side) {
      case "top":
        return {
          initial: { opacity: 0, y: 5, x: "-50%" },
          animate: { opacity: 1, y: 0, x: "-50%" },
          exit: { opacity: 0, y: 5, x: "-50%" },
        };
      case "bottom":
        return {
          initial: { opacity: 0, y: -5, x: "-50%" },
          animate: { opacity: 1, y: 0, x: "-50%" },
          exit: { opacity: 0, y: -5, x: "-50%" },
        };
      case "left":
        return {
          initial: { opacity: 0, x: 5, y: "-50%" },
          animate: { opacity: 1, x: 0, y: "-50%" },
          exit: { opacity: 0, x: 5, y: "-50%" },
        };
      case "right":
        return {
          initial: { opacity: 0, x: -5, y: "-50%" },
          animate: { opacity: 1, x: 0, y: "-50%" },
          exit: { opacity: 0, x: -5, y: "-50%" },
        };
      default:
        return {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          exit: { opacity: 0 },
        };
    }
  };

  const currentAnim = getAnimation(side);

  return (
    <div
      className={cn("relative flex items-center justify-center", className)}
      onMouseEnter={() => !disabled && setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      <AnimatePresence>
        {isVisible && (
          <MotionDiv
            initial={currentAnim.initial}
            animate={currentAnim.animate}
            exit={currentAnim.exit}
            transition={{ duration: 0.2, delay: delay }}
            className={cn(
              "absolute z-50 px-3 py-1.5 text-xs font-bold text-white bg-slate-900 dark:bg-white dark:text-black rounded-xl shadow-xl whitespace-nowrap pointer-events-none",
              positions[side as keyof typeof positions],
            )}
          >
            {content}
            {/* Arrow */}
            <div
              className={cn(
                "absolute w-2 h-2 bg-slate-900 dark:bg-white rotate-45",
                side === "top" && "top-full left-1/2 -translate-x-1/2 -mt-1",
                side === "bottom" &&
                  "bottom-full left-1/2 -translate-x-1/2 -mb-1",
                side === "left" && "left-full top-1/2 -translate-y-1/2 -ml-1",
                side === "right" && "right-full top-1/2 -translate-y-1/2 -mr-1",
              )}
            />
          </MotionDiv>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Tooltip;
