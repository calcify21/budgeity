import React, { useMemo, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { Transaction } from '../types';
import { useData } from '../context/DataContext';
import { cn } from '../utils';

interface Props {
  walletId: string;
  transactions: Transaction[];
}

const WalletAnalytics: React.FC<Props> = ({ walletId, transactions }) => {
  const { formatAmount, categories } = useData();
  const [timeRange, setTimeRange] = useState<'30d' | '90d' | '1y'>('30d');

  // Filter transactions by wallet and time range
  const filteredTxs = useMemo(() => {
      const now = new Date();
      const cutoff = new Date();
      if (timeRange === '30d') cutoff.setDate(now.getDate() - 30);
      if (timeRange === '90d') cutoff.setDate(now.getDate() - 90);
      if (timeRange === '1y') cutoff.setFullYear(now.getFullYear() - 1);

      return transactions.filter(t => {
          try {
              const d = new Date(t.date);
              return d >= cutoff && (
                  (t.fromWalletId === walletId) || (t.toWalletId === walletId)
              );
          } catch { return false; }
      }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [walletId, transactions, timeRange]);

  // Balance History
  const balanceData = useMemo(() => {
      const data: any[] = [];
      const dayMap = new Map<string, number>();
      
      filteredTxs.forEach(t => {
          try {
              const date = new Date(t.date).toLocaleDateString('en-CA');
              let change = 0;
              if (t.type === 'income' && t.toWalletId === walletId) change += t.amount;
              if (t.type === 'expense' && t.fromWalletId === walletId) change -= t.amount;
              if (t.type === 'transfer') {
                  if (t.fromWalletId === walletId) change -= t.amount;
                  if (t.toWalletId === walletId) change += t.amount;
              }
              dayMap.set(date, (dayMap.get(date) || 0) + change);
          } catch {}
      });

      // Convert to array
      const sortedKeys = Array.from(dayMap.keys()).sort();
      let cumulative = 0;
      sortedKeys.forEach(date => {
          cumulative += dayMap.get(date)!;
          data.push({ date: new Date(date).toLocaleDateString('en-US', {month:'short', day:'numeric'}), balance: cumulative });
      });
      return data;
  }, [filteredTxs, walletId]);

  // Income vs Expense
  const barData = useMemo(() => {
      let inc = 0;
      let exp = 0;
      filteredTxs.forEach(t => {
          if (t.type === 'income' && t.toWalletId === walletId) inc += t.amount;
          if (t.type === 'expense' && t.fromWalletId === walletId) exp += t.amount;
      });
      return [
          { name: 'Income', value: inc, color: '#10b981' },
          { name: 'Expense', value: exp, color: '#f43f5e' }
      ];
  }, [filteredTxs, walletId]);

  return (
    <div className="space-y-6">
        <div className="flex justify-center bg-slate-100 dark:bg-black/40 p-1 rounded-xl w-fit mx-auto">
            {(['30d', '90d', '1y'] as const).map(r => (
                <button
                    key={r}
                    onClick={() => setTimeRange(r)}
                    className={cn("px-4 py-1 rounded-lg text-xs font-bold transition-all", timeRange === r ? "bg-white dark:bg-zinc-800 shadow-sm" : "text-slate-500")}
                >
                    {r.toUpperCase()}
                </button>
            ))}
        </div>

        <div className="h-[250px] w-full min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={balanceData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorFlow" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <XAxis 
                        dataKey="date" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 10, fill: '#71717a' }}
                        dy={10}
                        minTickGap={30}
                    />
                    <YAxis 
                        hide={false}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: '#71717a' }}
                        tickFormatter={(val) => val >= 1000 ? `${(val/1000).toFixed(0)}k` : val}
                        width={30}
                    />
                    <RechartsTooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', background: 'rgba(255,255,255,0.95)', color:'#000', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} 
                        itemStyle={{ fontWeight: 'bold' }}
                        formatter={(val: number) => [formatAmount(val), 'Balance']} 
                    />
                    <Area type="monotone" dataKey="balance" stroke="#3b82f6" strokeWidth={3} fill="url(#colorFlow)" animationDuration={1000} />
                </AreaChart>
            </ResponsiveContainer>
        </div>

        <div className="h-[120px] w-full min-h-[120px]">
             <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                    <XAxis type="number" hide />
                    <YAxis 
                        dataKey="name" 
                        type="category" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 12, fontWeight: 'bold', fill: '#71717a' }}
                        width={60}
                    />
                    <RechartsTooltip 
                        cursor={{fill: 'transparent'}} 
                        contentStyle={{ borderRadius: '12px', border: 'none', background: 'rgba(255,255,255,0.95)', color:'#000', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} 
                        formatter={(val: number) => formatAmount(val)} 
                    />
                    <Bar dataKey="value" barSize={12} radius={[0, 6, 6, 0]}>
                        {barData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    </div>
  );
};

export default WalletAnalytics;