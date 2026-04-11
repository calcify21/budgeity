import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import {
  LayoutDashboard,
  ArrowRightLeft,
  Wallet,
  PiggyBank,
  Target,
  Plus,
  MoreHorizontal,
  Menu,
  BarChart3,
  Repeat,
  ShoppingCart,
  Tags,
  Download,
  Settings,
  UserCircle,
  Sparkles,
  Shield,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "../../utils";
import { useData } from "../../context/DataContext";
import NavMoreSheet from "./NavMoreSheet";

interface BottomNavProps {
  isMoreOpen: boolean;
  setIsMoreOpen: (open: boolean) => void;
  onAddClick: () => void;
  onInviteClick: () => void;
  onFeedbackClick: () => void;
  onToggleBalances: () => void;
  hideAmounts: boolean;
  userEmail?: string;
}

const BottomNav: React.FC<BottomNavProps> = ({
  isMoreOpen,
  setIsMoreOpen,
  onAddClick,
  onInviteClick,
  onFeedbackClick,
  onToggleBalances,
  hideAmounts,
  userEmail,
}) => {
  const { t } = useTranslation();
  const location = useLocation();
  const { navPreferences } = useData();

  const isTablet = useMediaQuery("(min-width: 768px) and (max-width: 1023px)");
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  if (isDesktop) return null;

  // Full catalog of possible items with outline and solid icons
  const allItems: Record<string, { icon: any; label: string }> = {
    "/dashboard": { icon: LayoutDashboard, label: t("common.dashboard") },
    "/analytics": { icon: BarChart3, label: t("common.analytics") },
    "/analytics-v2": { icon: BarChart3, label: t("common.analytics_v2") },
    "/transactions": { icon: ArrowRightLeft, label: t("common.transactions") },
    "/recurring": { icon: Repeat, label: t("common.recurring") },
    "/wallets": { icon: Wallet, label: t("common.wallets") },
    "/goals": { icon: Target, label: t("common.goals") },
    "/budgets": { icon: PiggyBank, label: t("common.budgets") },
    "/shopping-list": { icon: ShoppingCart, label: t("common.shopping_list") },
    "/categories": { icon: Tags, label: t("common.categories") },
    "/export": { icon: Download, label: t("common.export") },
    "/settings": { icon: Settings, label: t("common.settings") },
    "/account-info": { icon: UserCircle, label: t("common.account_info") },
    "/whats-new": { icon: Sparkles, label: t("common.whats_new") },
    "/admin/feedback": { icon: Shield, label: t("common.user_feedback") },
  };

  // Get current pinned items based on preferences or defaults
  const pinnedIds = isTablet
    ? navPreferences?.tabletPinned || [
        "/dashboard",
        "/transactions",
        "/wallets",
        "/budgets",
        "/goals",
        "/analytics",
      ]
    : navPreferences?.mobilePinned || [
        "/dashboard",
        "/transactions",
        "/wallets",
        "/analytics",
      ];

  // Limit items: Mobile max 4, Tablet max 6
  const maxPinned = isTablet ? 6 : 4;
  const activePinned = pinnedIds.slice(0, maxPinned);

  const leftItems: any[] = [];
  const rightItems: any[] = [];

  const half = Math.ceil(activePinned.length / 2);
  activePinned.forEach((id, index) => {
    if (allItems[id]) {
      const item = { to: id, ...allItems[id] };
      if (index < half) leftItems.push(item);
      else rightItems.push(item);
    }
  });

  const visiblePaths = activePinned;

  return (
    <>
      <AnimatePresence>
        {!isDesktop && (
          <motion.div
            key="bottom-nav-root"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed z-50 bottom-6 left-0 right-0 px-4 flex justify-center pointer-events-none"
          >
            <div
              className={cn(
                "bottom-nav-floating backdrop-blur-3xl border border-white/20 dark:border-white/10 flex items-center justify-evenly pb-[env(safe-area-inset-bottom,4px)] transition-all duration-300 w-full rounded-[2.5rem] p-2 pointer-events-auto",
                isTablet ? "max-w-[700px] px-6" : "max-w-[500px] px-2",
              )}
            >
              {leftItems.map((item) => (
                <NavItem
                  key={item.to}
                  item={item}
                  isActive={location.pathname === item.to}
                />
              ))}

              {/* Center Add Button */}
              <div className="relative flex items-center justify-center shrink-0">
                <motion.button
                  onClick={onAddClick}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="group relative flex items-center justify-center w-12 h-12 rounded-full shadow-lg shadow-brand-500/40 hover:shadow-brand-500/60 transition-all duration-500 focus:outline-none focus:ring-4 focus:ring-brand-500/30"
                  aria-label="Add Transaction"
                >
                  <div className="absolute inset-[-4px] bg-gradient-to-r from-brand-400 via-indigo-500 to-purple-500 rounded-full opacity-50 blur-md group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                  <div className="absolute inset-0 rounded-full border border-brand-400/50 animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite] pointer-events-none" />
                  <div className="absolute inset-0 rounded-full border border-indigo-400/30 animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite_1s] pointer-events-none" />
                  <div className="relative w-full h-full bg-gradient-to-br from-brand-500 to-indigo-600 rounded-full overflow-hidden flex items-center justify-center border border-white/20">
                    <div className="absolute inset-0 w-full h-full bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.4)_50%,transparent_75%,transparent_100%)] bg-[length:250%_250%,100%_100%] bg-no-repeat [background-position:-100%_0,0_0] group-hover:[transition:background-position_2s_ease_infinite] group-hover:animate-[shimmer_2s_infinite]" />
                    <motion.div
                      className="relative z-10 text-white drop-shadow-md"
                      initial={{ rotate: 0 }}
                      whileHover={{ rotate: 180 }}
                      transition={{
                        type: "spring",
                        stiffness: 200,
                        damping: 10,
                      }}
                    >
                      <Plus size={26} strokeWidth={3} />
                    </motion.div>
                  </div>
                </motion.button>
              </div>

              {rightItems.map((item) => (
                <NavItem
                  key={item.to}
                  item={item}
                  isActive={location.pathname === item.to}
                />
              ))}

              <button
                onClick={() => setIsMoreOpen(true)}
                className="flex flex-col items-center justify-center min-w-[64px] h-14 rounded-2xl text-slate-400 dark:text-zinc-500 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors shrink-0"
              >
                <div className="h-6 flex items-center justify-center">
                  <Menu size={24} strokeWidth={1.5} />
                </div>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <NavMoreSheet
        key="bottom-nav-more-sheet"
        isOpen={isMoreOpen}
        onClose={() => setIsMoreOpen(false)}
        excludedPaths={visiblePaths}
        onInviteClick={onInviteClick}
        onFeedbackClick={onFeedbackClick}
        onToggleBalances={onToggleBalances}
        hideAmounts={hideAmounts}
        userEmail={userEmail}
      />
    </>
  );
};

const NavItem: React.FC<{ item: any; isActive: boolean }> = ({
  item,
  isActive,
}) => {
  const Icon = item.icon;

  return (
    <Link
      to={item.to}
      className={cn(
        "flex flex-col items-center justify-center min-w-[64px] h-14 relative group outline-none select-none isolate",
        isActive
          ? "text-brand-600 dark:text-brand-400"
          : "text-slate-400 dark:text-zinc-500",
      )}
    >
      <AnimatePresence>
        {isActive && (
          <motion.div
            layoutId="nav-pill"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-[2px] bg-brand-500/10 dark:bg-brand-500/15 rounded-[1.5rem] z-0"
            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
          />
        )}
      </AnimatePresence>

      <div className="relative z-10 flex flex-col items-center justify-center h-full w-full">
        {/* Fixed height icon container to keep icons aligned across all NavItems and buttons */}
        <div className="h-6 flex items-center justify-center">
          <motion.div
            animate={isActive ? { scale: 1.15, y: -2 } : { scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            <Icon
              size={24}
              strokeWidth={1.5}
              className={cn(
                "transition-all duration-300",
                isActive ? "drop-shadow-[0_0_8px_rgba(99,102,241,0.3)]" : "",
              )}
            />
          </motion.div>
        </div>

        {/* Label container - absolute to not push the icon */}
        <div className="absolute bottom-1 flex items-center justify-center w-full">
          <AnimatePresence initial={false}>
            {isActive && (
              <motion.span
                initial={{ y: 5, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 5, opacity: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className="text-[9px] font-bold tracking-tight whitespace-nowrap leading-none"
              >
                {item.label}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>
    </Link>
  );
};

export default BottomNav;
