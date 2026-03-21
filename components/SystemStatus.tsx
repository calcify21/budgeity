import React from "react";
import { useData } from "../context/DataContext";
import { CheckCircle2, RefreshCw, CloudOff, AlertCircle } from "lucide-react";
import Tooltip from "./Tooltip";

const SystemStatus: React.FC = () => {
  const { systemStatus, retryConnection } = useData();

  const getStatusConfig = () => {
    switch (systemStatus) {
      case "online":
        return {
          icon: CheckCircle2,
          color: "text-emerald-500",
          bg: "bg-emerald-50 dark:bg-emerald-500/10",
          border: "border-emerald-200 dark:border-emerald-500/20",
          pulse: "bg-emerald-500",
          tooltip: "Your data is securely backed up",
          animation: "",
          clickable: false,
        };
      case "syncing":
        return {
          icon: RefreshCw,
          color: "text-amber-500",
          bg: "bg-amber-50 dark:bg-amber-500/10",
          border: "border-amber-200 dark:border-amber-500/20",
          pulse: "bg-amber-500",
          tooltip: "Syncing changes with cloud...",
          animation: "animate-spin",
          clickable: false,
        };
      case "offline":
        return {
          icon: CloudOff,
          color: "text-slate-500 dark:text-slate-400",
          bg: "bg-slate-100 dark:bg-white/5",
          border: "border-slate-200 dark:border-white/10",
          pulse: "hidden",
          tooltip: "Changes will sync when you're back online",
          animation: "",
          clickable: true,
        };
      case "error":
        return {
          icon: AlertCircle,
          color: "text-rose-500",
          bg: "bg-rose-50 dark:bg-rose-500/10",
          border: "border-rose-200 dark:border-rose-500/20",
          pulse: "bg-rose-500",
          tooltip: "Connection error. Click to retry.",
          animation: "",
          clickable: true,
        };
      default:
        return {
          icon: CheckCircle2,
          color: "text-emerald-500",
          bg: "bg-emerald-50 dark:bg-emerald-500/10",
          border: "border-emerald-200 dark:border-emerald-500/20",
          pulse: "bg-emerald-500",
          tooltip: "Online",
          animation: "",
          clickable: false,
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <Tooltip content={config.tooltip} side="bottom">
      <button
        data-system-status="true"
        onClick={config.clickable ? retryConnection : undefined}
        disabled={!config.clickable}
        className={`flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-full border transition-all duration-300 ${config.bg} ${config.border} ${config.clickable ? "cursor-pointer hover:opacity-80 active:scale-95" : "cursor-default"}`}
      >
        <div className="relative flex h-2 w-2 items-center justify-center mr-0.5 ml-0.5">
          {config.pulse !== "hidden" && (
            <span
              className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${config.pulse}`}
            ></span>
          )}
          <span
            className={`relative inline-flex h-2 w-2 rounded-full ${config.pulse !== "hidden" ? config.pulse : "bg-slate-400 dark:bg-slate-500"}`}
          ></span>
        </div>
        <Icon size={14} className={`${config.color} ${config.animation}`} />
      </button>
    </Tooltip>
  );
};

export default SystemStatus;
