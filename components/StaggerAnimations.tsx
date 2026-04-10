import React from "react";
import { motion } from "framer-motion";

// Fix: Cast motion components to any to resolve type errors
const MotionDiv = motion.div as any;

/**
 * Stagger container — wraps children with staggered entrance animations.
 * Each direct child fades in and slides up with a subtle spring.
 */

// Container variant for staggering children
const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.04,
    },
  },
};

// Item variant — each child pops in
const itemVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      damping: 22,
      stiffness: 260,
    },
  },
};

interface StaggerContainerProps {
  children: React.ReactNode;
  className?: string;
  /** Additional delay before animation starts (seconds) */
  delay?: number;
}

/**
 * Wrap page content in this to get staggered entrance animations.
 * Each direct child wrapped in <StaggerItem> will pop in sequentially.
 */
export const StaggerContainer: React.FC<StaggerContainerProps> = ({
  children,
  className,
  delay = 0,
}) => (
  <MotionDiv
    variants={{
      ...containerVariants,
      visible: {
        transition: {
          staggerChildren: 0.06,
          delayChildren: 0.04 + delay,
        },
      },
    }}
    initial="hidden"
    animate="visible"
    className={className}
  >
    {children}
  </MotionDiv>
);

interface StaggerItemProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Individual item within a StaggerContainer.
 * Fades in and slides up with a spring.
 */
export const StaggerItem: React.FC<StaggerItemProps> = ({
  children,
  className,
}) => (
  <MotionDiv variants={itemVariants} className={className}>
    {children}
  </MotionDiv>
);

/**
 * Standalone fade-in-up animation for single elements.
 */
export const FadeInUp: React.FC<{
  children: React.ReactNode;
  className?: string;
  delay?: number;
}> = ({ children, className, delay = 0 }) => (
  <MotionDiv
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{
      type: "spring",
      damping: 22,
      stiffness: 260,
      delay,
    }}
    className={className}
  >
    {children}
  </MotionDiv>
);
