import React from "react";

interface Props {
  className?: string;
}

export const AnalyticsWidgetSkeleton: React.FC<Props> = ({
  className = "",
}) => (
  <div
    className={`glass-card rounded-[2rem] p-6 space-y-4 animate-pulse ${className}`}
  >
    <div className="flex items-center justify-between">
      <div className="h-5 w-32 bg-slate-200 dark:bg-white/10 rounded-lg" />
      <div className="h-4 w-4 bg-slate-200 dark:bg-white/10 rounded-full" />
    </div>
    <div className="space-y-3">
      <div className="h-[200px] w-full bg-slate-200 dark:bg-white/10 rounded-2xl" />
    </div>
  </div>
);

export const MetricSkeleton: React.FC = () => (
  <div className="glass-card rounded-[2rem] p-5 space-y-3 animate-pulse">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 bg-slate-200 dark:bg-white/10 rounded-xl" />
      <div className="h-4 w-20 bg-slate-200 dark:bg-white/10 rounded-lg" />
    </div>
    <div className="h-8 w-28 bg-slate-200 dark:bg-white/10 rounded-xl" />
  </div>
);
