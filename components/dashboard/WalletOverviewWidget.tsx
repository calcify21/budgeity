import React from "react";
import { useData } from "../../context/DataContext";
import { cn } from "../../utils";

export const WalletOverviewWidget: React.FC = () => {
  const { wallets, formatAmount } = useData();

  if (wallets.length === 0) return null;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full h-full tour-dash-wallet-flow">
      {wallets.map((wallet, index) => (
        <div
          key={wallet.id}
          className={cn(
            "glass-card rounded-2xl p-5 cursor-default transition-transform duration-200 hover:-translate-y-1 hover:scale-[1.02]",
            index === 0,
          )}
        >
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {wallet.type}
            </span>
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: wallet.color }}
            />
          </div>
          <h3 className="font-bold text-lg truncate mb-1">{wallet.name}</h3>
          <div
            className="text-xl font-bold text-slate-900 dark:text-white truncate"
            title={formatAmount(wallet.balance)}
          >
            {formatAmount(wallet.balance)}
          </div>
        </div>
      ))}
    </div>
  );
};
