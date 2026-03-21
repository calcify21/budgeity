import React from "react";
import { cn } from "../../utils";

export const WidgetSkeleton: React.FC<{ className?: string }> = ({
  className,
}) => {
  return (
    <div
      className={cn(
        "glass-card rounded-[2rem] p-6 h-full w-full animate-pulse",
        className,
      )}
    >
      <div className="flex items-center gap-4 mb-6">
        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-white/10" />
        <div className="w-32 h-4 rounded bg-slate-200 dark:bg-white/10" />
      </div>
      <div className="space-y-4">
        <div className="w-full h-12 rounded-xl bg-slate-200 dark:bg-white/10" />
        <div className="w-3/4 h-12 rounded-xl bg-slate-200 dark:bg-white/10" />
        <div className="w-5/6 h-12 rounded-xl bg-slate-200 dark:bg-white/10" />
      </div>
    </div>
  );
};
