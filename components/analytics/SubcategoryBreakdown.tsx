import React, { useMemo } from "react";
import { Transaction } from "../../types";
import { useData } from "../../context/DataContext";
import { computeSubcategoryBreakdown } from "../../utils/analyticsEngine";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  Cell,
} from "recharts";
import { BarChart3 } from "lucide-react";
import Tooltip from "../Tooltip";

interface Props {
  transactions: Transaction[];
  selectedCategoryId: string | null;
  onDrillDown?: (filters: { category?: string; subCategory?: string; type?: string; wallet?: string }) => void;
}

export const SubcategoryBreakdown: React.FC<Props> = ({
  transactions,
  selectedCategoryId,
  onDrillDown,
}) => {
  const { categories, formatAmount } = useData();

  const cat = categories.find((c) => c.id === selectedCategoryId);

  const data = useMemo(() => {
    if (!selectedCategoryId) return [];
    return computeSubcategoryBreakdown(
      transactions,
      categories,
      selectedCategoryId,
    );
  }, [transactions, categories, selectedCategoryId]);

  if (!selectedCategoryId || data.length === 0) {
    return (
      <div className="glass-card flex flex-col items-center justify-center min-h-[200px] h-full rounded-[2rem] p-6 text-center">
        <BarChart3
          size={32}
          className="mx-auto text-slate-300 dark:text-white/20 mb-3"
        />
        <p className="text-sm text-slate-500 dark:text-zinc-400">
          {selectedCategoryId
            ? "No subcategory data available."
            : "Select a category to view breakdown."}
        </p>
      </div>
    );
  }

  return (
    <Tooltip
      content={`Subcategory breakdown for ${cat?.name || "selected category"}`}
    >
      <div className="glass-card flex flex-col h-full rounded-[2rem] p-6">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 size={18} className="text-brand-500" />
          <h3 className="text-sm font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
            {cat?.name || "Subcategory"} Breakdown
          </h3>
        </div>

        <div className="flex-1 min-h-[220px] flex flex-col justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ left: 80, right: 20 }}
            >
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 11, fontWeight: 600, fill: "#94a3b8" }}
                width={75}
              />
              <RechartsTooltip
                cursor={{ fill: "transparent", stroke: "transparent" }}
                content={({ active, payload }) => {
                  if (!active || !payload?.[0]) return null;
                  const d = payload[0].payload;
                  return (
                    <div className="bg-slate-900 dark:bg-zinc-800 text-white px-3 py-2 rounded-xl text-xs font-bold shadow-xl">
                      <p>{d.name}</p>
                      <p className="text-slate-300">{formatAmount(d.value)}</p>
                    </div>
                  );
                }}
              />
              <Bar 
                dataKey="value" 
                radius={[0, 8, 8, 0]} 
                barSize={16}
                onClick={(entry) => {
                  onDrillDown?.({ 
                    category: selectedCategoryId || undefined, 
                    subCategory: entry.id,
                    type: "expense" 
                  });
                }}
              >
                {data.map((entry, i) => (
                  <Cell key={i} fill={entry.color} opacity={0.8 + i * 0.02} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Tooltip>
  );
};
