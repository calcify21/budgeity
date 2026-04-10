import React, { useMemo } from "react";
import { useData } from "../../context/DataContext";
import {
  computeFinancialHealthScore,
  HealthScoreBreakdown,
} from "../../utils/analyticsEngine";
import Tooltip from "../Tooltip";
import { ShieldCheck } from "lucide-react";

interface Props {
  transactions: any[];
}

const scoreColors: Record<string, string> = {
  Poor: "#ef4444",
  Fair: "#f59e0b",
  Good: "#3b82f6",
  Excellent: "#10b981",
};

const ScoreRing: React.FC<{ score: number; color: string; size?: number }> = ({
  score,
  color,
  size = 140,
}) => {
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="currentColor"
        className="text-slate-200 dark:text-white/10"
        strokeWidth={strokeWidth}
        fill="none"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        style={{ transition: "stroke-dashoffset 1s ease-out" }}
      />
    </svg>
  );
};

export const FinancialHealthScore: React.FC<Props> = ({ transactions }) => {
  const { budgets, goals, categories } = useData();

  const score: HealthScoreBreakdown = useMemo(
    () => computeFinancialHealthScore(transactions, budgets, goals, categories),
    [transactions, budgets, goals, categories],
  );

  const color = scoreColors[score.label] || "#64748b";

  if (transactions.length === 0) {
    return (
      <div className="glass-card flex flex-col items-center justify-center min-h-[200px] h-full rounded-[2rem] p-6 text-center">
        <ShieldCheck
          size={32}
          className="mx-auto text-slate-300 dark:text-white/20 mb-3"
        />
        <p className="text-sm text-slate-500 dark:text-zinc-400">
          Add transactions to see your Financial Health Score.
        </p>
      </div>
    );
  }

  return (
    <Tooltip content="A composite score based on savings rate, budget compliance, spending stability, goal progress, and expense ratio.">
      <div className="glass-card flex flex-col h-full rounded-[2rem] p-6">
        <div className="flex items-center gap-2 mb-5">
          <ShieldCheck size={18} className="text-brand-500" />
          <h3 className="text-sm font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
            Financial Health
          </h3>
        </div>

        <div className="flex-1 flex items-center justify-center gap-8 w-full">
          {/* Score Ring */}
          <div className="relative shrink-0">
            <ScoreRing score={score.total} color={color} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-extrabold" style={{ color }}>
                {score.total}
              </span>
              <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase">
                / 100
              </span>
            </div>
          </div>

          {/* Breakdown */}
          <div className="flex-1 space-y-2">
            <p className="text-lg font-bold" style={{ color }}>
              {score.label}
            </p>
            {[
              { label: "Savings Rate", value: score.savingsRate, max: 30 },
              {
                label: "Budget Compliance",
                value: score.budgetCompliance,
                max: 25,
              },
              {
                label: "Spending Stability",
                value: score.spendingStability,
                max: 15,
              },
              { label: "Goal Progress", value: score.goalProgress, max: 15 },
              { label: "Expense Ratio", value: score.expenseRatio, max: 15 },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 w-32 shrink-0">
                  {item.label}
                </span>
                <div className="flex-1 h-1.5 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${(item.value / item.max) * 100}%`,
                      backgroundColor: color,
                    }}
                  />
                </div>
                <span className="text-[10px] font-bold text-slate-400 w-8 text-right">
                  {item.value}/{item.max}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Tooltip>
  );
};
