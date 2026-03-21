import React from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Target } from "lucide-react";
import { useData } from "../../context/DataContext";

export const ActiveGoalsWidget: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { goals, formatAmount } = useData();

  return (
    <div className="glass-card rounded-[2rem] p-6 h-full flex flex-col cursor-default">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold flex items-center gap-2">
          <Target className="text-brand-500" size={18} /> {t("common.goals")}
        </h3>
        <button
          onClick={() => navigate("/goals")}
          className="text-xs font-bold text-brand-600 hover:text-brand-700 transition-colors"
        >
          {t("common.see_all")}
        </button>
      </div>
      {goals.length === 0 ? (
        <div className="text-center text-slate-400 py-6 text-sm flex-1 flex items-center justify-center">
          {t("dashboard.no_goals")}
        </div>
      ) : (
        <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar flex-1">
          {goals.map((g) => {
            const pct = Math.min(
              ((g.currentBalance || 0) / (g.targetAmount || 1)) * 100,
              100,
            );
            return (
              <div key={g.id}>
                <div className="flex justify-between text-xs font-medium mb-1">
                  <span>{g.name}</span>
                  <span>{pct.toFixed(2)}%</span>
                </div>
                <div className="h-2 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${pct}%`, backgroundColor: g.color }}
                  />
                </div>
                <div className="text-[10px] text-slate-400 mt-1 text-right">
                  {formatAmount(g.currentBalance || 0)} stored
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
