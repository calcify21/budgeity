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
  onAddClick: () => void;
  onInviteClick: () => void;
  onFeedbackClick: () => void;
  onToggleBalances: () => void;
  hideAmounts: boolean;
  userEmail?: string;
}

const BottomNav: React.FC<BottomNavProps> = ({
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
  const [isMoreOpen, setIsMoreOpen] = useState(false);

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
                "bottom-nav-floating backdrop-blur-3xl border border-white/20 dark:border-white/10 flex items-center justify-between pb-[env(safe-area-inset-bottom,4px)] transition-all duration-300 w-full rounded-[2.5rem] p-2 pointer-events-auto",
                isTablet
                  ? "max-w-[700px] gap-2 px-6"
                  : "max-w-[500px] gap-1 px-4",
              )}
            >
              {/* Left Side Items */}
              <div className="flex-1 flex items-center justify-around h-14">
                {leftItems.map((item) => (
                  <NavItem key={item.to} item={item} isActive={location.pathname === item.to} />
                ))}
              </div>

              {/* Center Add Button */}
              <div className="relative flex items-center justify-center h-14 px-2">
                <motion.button
                  onClick={onAddClick}
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  className="w-12 h-12 relative group outline-none isolate"
                  aria-label="Add Transaction"
                >
                  <div className="absolute inset-0 bg-brand-500 rounded-full blur-[15px] opacity-40 group-hover:opacity-60 transition-opacity animate-pulse z-[-1]" />
                  <div className="relative w-full h-full bg-brand-500 rounded-full flex items-center justify-center shadow-lg shadow-brand-500/40 border border-white/20 overflow-hidden">
                    <div className="absolute inset-0 bg-[linear-gradient(110deg,transparent,rgba(255,255,255,0.3),transparent)] -translate-x-full group-hover:animate-shimmer transition-transform" />
                    <Plus
                      size={28}
                      strokeWidth={3}
                      className="text-white drop-shadow-md relative z-10"
                    />
                  </div>
                </motion.button>
              </div>

              {/* Right Side Items + More */}
              <div className="flex-1 flex items-center justify-around h-14">
                {rightItems.map((item) => (
                  <NavItem key={item.to} item={item} isActive={location.pathname === item.to} />
                ))}
                
                {/* More Button - Standardized height */}
                <button
                  onClick={() => setIsMoreOpen(true)}
                  className="flex items-center justify-center w-[64px] h-14 rounded-2xl text-slate-400 dark:text-zinc-500 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                >
                  <Menu size={24} strokeWidth={1.5} />
                </button>
              </div>
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

const NavItem: React.FC<{ item: any; isActive: boolean }> = ({ item, isActive }) => {
  const Icon = item.icon;
  
  return (
    <Link
      to={item.to}
      className={cn(
        "flex flex-col items-center justify-center min-w-[64px] h-14 relative group outline-none select-none isolate",
        isActive ? "text-brand-600 dark:text-brand-400" : "text-slate-400 dark:text-zinc-500"
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
                isActive ? "drop-shadow-[0_0_8px_rgba(99,102,241,0.3)]" : ""
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
