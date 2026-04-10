import React, { useState } from "react";
import { useData } from "../context/DataContext";
import { CURRENCIES } from "../constants";
import CustomSelect from "./CustomSelect";
import { motion } from "framer-motion";
import { Wallet, Check } from "lucide-react";
import logo from "../assets/logo-927x1024.png";

const MotionDiv = motion.div as any;

const OnboardingModal: React.FC = () => {
  const { completeOnboarding } = useData();
  const [currency, setCurrency] = useState("INR");
  const [balance, setBalance] = useState("");

  const currencyOptions = CURRENCIES.map((c) => ({
    value: c.code,
    label: `${c.name} (${c.symbol})`,
    subLabel: c.code,
  }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    completeOnboarding(currency, parseFloat(balance) || 0);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-50 dark:bg-black">
      <MotionDiv
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 p-8 rounded-[2.5rem] shadow-2xl relative z-10"
      >
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto flex items-center justify-center mb-4">
            <img
              src={logo}
              alt="Budgeity"
              className="w-full h-full object-contain"
            />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Welcome to Budgeity!
          </h2>
          <p className="text-slate-500 mt-2">
            Let's set up your primary wallet to get started.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Select Currency
            </label>
            <CustomSelect
              value={currency}
              onChange={setCurrency}
              options={currencyOptions}
              searchable
              placeholder="Select Currency"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Initial Cash Balance
            </label>
            <input
              type="number"
              step="0.01"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              className="w-full p-4 bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-2xl text-2xl font-bold text-center outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="0.00"
              autoFocus
            />
          </div>

          <button
            type="submit"
            className="w-full py-4 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-2xl shadow-xl shadow-brand-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            Get Started <Check size={20} />
          </button>
        </form>
      </MotionDiv>
    </div>
  );
};

export default OnboardingModal;
