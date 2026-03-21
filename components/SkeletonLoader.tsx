import React from "react";
import { motion } from "framer-motion";

const MotionDiv = motion.div as any;

/* -------------------------------------------------------------------------- */
/*                          Base Skeleton Shapes                               */
/* -------------------------------------------------------------------------- */

interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

/** A single pulsing skeleton block. Shape is controlled via className. */
export const Skeleton: React.FC<SkeletonProps> = ({
  className = "",
  style,
}) => <div className={`skeleton ${className}`} style={style} />;

/* -------------------------------------------------------------------------- */
/*                          Page Skeleton Presets                               */
/* -------------------------------------------------------------------------- */

/** Dashboard page skeleton — mirrors the Bento Grid layout. */
export const DashboardSkeleton: React.FC = () => (
  <MotionDiv
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="space-y-8 pb-24"
  >
    {/* Header */}
    <div className="flex items-center justify-between">
      <Skeleton className="h-8 w-40 rounded-xl" />
      <Skeleton className="h-10 w-48 rounded-xl" />
    </div>

    {/* Main Bento Grid */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {/* Net Worth Hero */}
      <div className="lg:col-span-2 rounded-[2rem] glass-card p-8 space-y-6">
        <Skeleton className="h-5 w-36 rounded-full" />
        <Skeleton className="h-16 w-72 rounded-2xl" />
        <Skeleton className="h-4 w-48 rounded-lg" />
      </div>

      {/* Quick Stats */}
      <div className="flex flex-col gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex-1 rounded-[2rem] glass-card p-6 space-y-4"
          >
            <div className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-full" />
              <Skeleton className="h-4 w-20 rounded-lg" />
            </div>
            <Skeleton className="h-8 w-32 rounded-xl" />
          </div>
        ))}
      </div>
    </div>

    {/* Wallet Cards */}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="glass-card rounded-2xl p-5 space-y-3">
          <Skeleton className="h-3 w-16 rounded-md" />
          <Skeleton className="h-5 w-24 rounded-lg" />
          <Skeleton className="h-6 w-20 rounded-xl" />
        </div>
      ))}
    </div>

    {/* Chart Row */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 rounded-[2rem] glass-card p-8 space-y-6">
        <Skeleton className="h-6 w-40 rounded-xl" />
        <Skeleton className="h-[300px] w-full rounded-2xl" />
      </div>
      <div className="rounded-[2rem] glass-card p-8 space-y-6">
        <Skeleton className="h-6 w-40 rounded-xl" />
        <Skeleton className="h-[240px] w-full rounded-full" />
      </div>
    </div>
  </MotionDiv>
);

/** Transactions page skeleton. */
export const TransactionsSkeleton: React.FC = () => (
  <MotionDiv
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="space-y-6"
  >
    {/* Header */}
    <div className="flex items-center justify-between">
      <Skeleton className="h-8 w-44 rounded-xl" />
      <div className="flex gap-3">
        <Skeleton className="h-10 w-48 rounded-xl" />
        <Skeleton className="h-10 w-10 rounded-xl" />
      </div>
    </div>

    {/* Stats Cards */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="glass-card rounded-[2rem] p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Skeleton className="w-8 h-8 rounded-full" />
            <Skeleton className="h-4 w-24 rounded-lg" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3 w-full rounded-md" />
            <Skeleton className="h-3 w-3/4 rounded-md" />
          </div>
        </div>
      ))}
    </div>

    {/* Transaction List */}
    <div className="space-y-4">
      {[1, 2, 3].map((group) => (
        <div key={group} className="space-y-3">
          <Skeleton className="h-4 w-28 rounded-lg ml-4" />
          <div className="glass-card rounded-[2rem] overflow-hidden divide-y divide-slate-100 dark:divide-white/5">
            {[1, 2, 3].map((j) => (
              <div key={j} className="p-5 flex items-center justify-between">
                <div className="flex items-center gap-5">
                  <Skeleton className="w-12 h-12 rounded-2xl" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32 rounded-lg" />
                    <Skeleton className="h-3 w-24 rounded-md" />
                  </div>
                </div>
                <Skeleton className="h-5 w-20 rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  </MotionDiv>
);

/** Goals page skeleton. */
export const GoalsSkeleton: React.FC = () => (
  <MotionDiv
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="space-y-8"
  >
    {/* Header */}
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <Skeleton className="h-8 w-32 rounded-xl" />
        <Skeleton className="h-4 w-48 rounded-lg" />
      </div>
      <Skeleton className="h-12 w-44 rounded-2xl" />
    </div>

    {/* Goal Cards Grid */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className="glass-card rounded-[2rem] p-6 space-y-6">
          <div className="flex justify-between">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-6 rounded-lg" />
          </div>
          <div className="flex items-center gap-4">
            <Skeleton className="w-14 h-14 rounded-2xl" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-5 w-32 rounded-lg" />
              <Skeleton className="h-3 w-20 rounded-md" />
            </div>
          </div>
          <div className="space-y-2">
            <Skeleton className="h-6 w-24 rounded-lg" />
            <Skeleton className="h-3 w-full rounded-full" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  </MotionDiv>
);

/** Generic page skeleton for Wallets, Budgets, Recurring, etc. */
export const GenericPageSkeleton: React.FC = () => (
  <MotionDiv
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="space-y-8"
  >
    <div className="flex items-center justify-between">
      <Skeleton className="h-8 w-36 rounded-xl" />
      <Skeleton className="h-12 w-40 rounded-2xl" />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="glass-card rounded-[2rem] p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Skeleton className="w-12 h-12 rounded-2xl" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-5 w-28 rounded-lg" />
              <Skeleton className="h-3 w-20 rounded-md" />
            </div>
          </div>
          <Skeleton className="h-3 w-full rounded-full" />
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
      ))}
    </div>
  </MotionDiv>
);
