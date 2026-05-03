import React, { useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  BarChart3,
  ArrowRightLeft,
  Repeat,
  Wallet,
  Target,
  PiggyBank,
  ShoppingCart,
  Tags,
  Download,
  FileBarChart2,
  Settings,
  UserCircle,
  Sparkles,
  Shield,
  Share2,
  MessageSquare,
  Eye,
  EyeOff,
  X,
  Plus,
  Pin,
  PinOff,
  Edit2,
  Check,
  Search,
  GripVertical,
  Home,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "../../utils";
import { useData } from "../../context/DataContext";
import { useHousehold } from "../../context/HouseholdContext";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import { useToast } from "../../context/ToastContext";
import { useEscapeKey } from "../../hooks/useEscapeKey";
import { useClickOutside } from "../../hooks/useClickOutside";
import { Reorder, useDragControls } from "framer-motion";

const ReorderGroup = Reorder.Group as any;
const ReorderItem = Reorder.Item as any;
const MotionDiv = motion.div as any;

interface ReorderItemPinProps {
  item: { to: string; icon: any; label: string };
  isPinned?: boolean;
  onToggle?: () => void;
  isCustomizing?: boolean;
  itemVariants?: any;
}

const ReorderItemPin: React.FC<ReorderItemPinProps> = ({
  item,
  isPinned,
  onToggle,
  isCustomizing,
  itemVariants,
}) => {
  const controls = useDragControls();
  const location = useLocation();
  const isActive = location.pathname === item.to;
  const Icon = item.icon;

  const content = (
    <div className="flex items-center gap-3 group/item relative select-none w-full">
      {isCustomizing && (
        <button
          onClick={onToggle}
          className={cn(
            "w-12 h-14 flex items-center justify-center rounded-2xl transition-all active:scale-90 shrink-0",
            isPinned
              ? "bg-brand-500/10 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400"
              : "bg-slate-100 dark:bg-white/5 text-slate-400",
          )}
        >
          {isPinned ? (
            <PinOff size={20} strokeWidth={2} />
          ) : (
            <Plus size={22} strokeWidth={2.5} />
          )}
        </button>
      )}

      {isCustomizing ? (
        <div
          className={cn(
            "flex-1 flex items-center justify-between p-3 rounded-2xl transition-all group border border-transparent shadow-sm",
            "text-slate-600 dark:text-zinc-400 bg-slate-50 dark:bg-zinc-800/80",
            isPinned && "border-brand-500/20 bg-brand-50 dark:bg-brand-950/50",
          )}
        >
          <div className="flex items-center gap-4">
            <div
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                "bg-slate-100 dark:bg-zinc-800",
              )}
            >
              <Icon size={20} strokeWidth={1.5} />
            </div>
            <span className="text-sm font-bold tracking-tight">
              {item.label}
            </span>
          </div>

          {isPinned && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-brand-500 bg-brand-500/10 dark:bg-brand-500/20 px-2 py-1 rounded-md">
                Pinned
              </span>
              <div
                className="cursor-grab active:cursor-grabbing text-slate-300 dark:text-zinc-700 p-2 touch-none select-none hover:text-slate-500 dark:hover:text-slate-400 transition-colors"
                style={{ touchAction: "none" }}
                onPointerDown={(e) => {
                  e.preventDefault();
                  controls.start(e);
                }}
              >
                <GripVertical size={20} />
              </div>
            </div>
          )}
        </div>
      ) : (
        <Link
          to={item.to}
          className={cn(
            "flex-1 flex items-center justify-between py-2.5 px-3 rounded-2xl transition-all group",
            isActive
              ? "bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 font-bold"
              : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 active:scale-[0.98]",
          )}
        >
          <div className="flex items-center gap-4">
            <div
              className={cn(
                "w-10 h-10 rounded-[14px] flex items-center justify-center transition-colors",
                isActive
                  ? "bg-brand-500/20 text-brand-600 dark:bg-brand-500/30 dark:text-brand-400"
                  : "bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-slate-400 group-hover:bg-brand-50 dark:group-hover:bg-brand-500/20 group-hover:text-brand-500",
              )}
            >
              <Icon size={22} strokeWidth={isActive ? 2.5 : 1.5} fill="none" />
            </div>
            <span
              className={cn(
                "text-[16px] tracking-tight",
                isActive
                  ? "font-bold text-brand-700 dark:text-brand-300"
                  : "font-medium group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors",
              )}
            >
              {item.label}
            </span>
          </div>
          {isActive && (
            <div className="w-1.5 h-1.5 bg-brand-500 rounded-full mr-2" />
          )}
        </Link>
      )}
    </div>
  );

  if (isCustomizing && isPinned) {
    return (
      <ReorderItem
        value={item.to}
        dragListener={false}
        dragControls={controls}
        className="list-none w-full"
      >
        {content}
      </ReorderItem>
    );
  }

  if (isCustomizing) {
    return <div className="w-full">{content}</div>;
  }

  return (
    <motion.div variants={itemVariants} className="w-full">
      {content}
    </motion.div>
  );
};

interface NavMoreSheetProps {
  isOpen: boolean;
  onClose: () => void;
  excludedPaths: string[];
  onInviteClick: () => void;
  onFeedbackClick: () => void;
  onToggleBalances: () => void;
  hideAmounts: boolean;
  userEmail?: string;
}

const NavMoreSheet: React.FC<NavMoreSheetProps> = ({
  isOpen,
  onClose,
  excludedPaths,
  onInviteClick,
  onFeedbackClick,
  onToggleBalances,
  hideAmounts,
  userEmail,
}) => {
  const { t } = useTranslation();
  const location = useLocation();
  const { navPreferences, updateNavPreferences } = useData();
  const { error } = useToast();
  const [isCustomizing, setIsCustomizing] = React.useState(false);
  const [localPinnedIds, setLocalPinnedIds] = React.useState<string[]>([]);
  const [searchQuery, setSearchQuery] = React.useState("");
  const sheetRef = useRef<HTMLDivElement>(null);

  useEscapeKey(isOpen, onClose);
  useClickOutside(sheetRef, onClose);

  // Close on route change
  useEffect(() => {
    onClose();
  }, [location.pathname]);

  const isTablet = useMediaQuery("(min-width: 768px) and (max-width: 1023px)");

  const { activeWorkspace } = useHousehold();
  const navLinks = React.useMemo(() => {
    const links = [
      { to: "/dashboard", icon: LayoutDashboard, label: t("common.dashboard") },
      { to: "/analytics", icon: BarChart3, label: t("common.analytics") },
      { to: "/analytics-v2", icon: BarChart3, label: t("common.analytics_v2") },
      {
        to: "/transactions",
        icon: ArrowRightLeft,
        label: t("common.transactions"),
      },
      { to: "/subscriptions", icon: Repeat, label: t("common.subscriptions") },
      { to: "/wallets", icon: Wallet, label: t("common.wallets") },
      { to: "/goals", icon: Target, label: t("common.goals") },
      { to: "/budgets", icon: PiggyBank, label: t("common.budgets") },
      {
        to: "/shopping-list",
        icon: ShoppingCart,
        label: t("common.shopping_list"),
      },
      { to: "/categories", icon: Tags, label: t("common.categories") },
      { to: "/export", icon: Download, label: t("common.export") },
      { to: "/reports", icon: FileBarChart2, label: "Reports" },
      { to: "/settings", icon: Settings, label: t("common.settings") },
      {
        to: "/account-info",
        icon: UserCircle,
        label: t("common.account_info"),
      },
      { to: "/whats-new", icon: Sparkles, label: t("common.whats_new") },
    ];

    if (activeWorkspace.type === "household") {
      links.push({
        to: "/household-settings",
        icon: Home,
        label: "Household Settings",
      });
    }

    if (userEmail === "jainshr21@gmail.com") {
      links.push({
        to: "/admin/feedback",
        icon: Shield,
        label: t("common.user_feedback"),
      });
    }

    return links;
  }, [t, userEmail, activeWorkspace.type]);

  const rawPinnedIds = isTablet
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
      ];

  // Sanitize to avoid empty keys or invalid items
  const serverPinnedIds = rawPinnedIds.filter(Boolean);
  const serverPinnedIdsStr = JSON.stringify(serverPinnedIds);

  // Optimistic UI State Sync - Use stringified array to prevent infinite loops
  useEffect(() => {
    if (!isCustomizing) {
      setLocalPinnedIds(JSON.parse(serverPinnedIdsStr));
    }
  }, [serverPinnedIdsStr, isCustomizing]);

  const togglePin = (to: string) => {
    if (!isCustomizing) return;

    const isCurrentlyPinned = localPinnedIds.includes(to);
    const limit = isTablet ? 6 : 3;

    if (!isCurrentlyPinned && localPinnedIds.length >= limit) {
      error(
        `${isTablet ? "Tablet" : "Mobile"} limit reached (max ${limit} items)`,
      );
      return;
    }

    setLocalPinnedIds((prev) =>
      isCurrentlyPinned ? prev.filter((id) => id !== to) : [...prev, to],
    );
  };

  const setPinnedOrder = (newOrder: string[]) => {
    if (isCustomizing) {
      setLocalPinnedIds(newOrder);
    }
  };

  const handleToggleCustomize = () => {
    if (isCustomizing) {
      // Save changes when exiting edit mode
      const currentMobile = navPreferences?.mobilePinned || [
        "/dashboard",
        "/transactions",
        "/wallets",
      ];
      const currentTablet = navPreferences?.tabletPinned || [
        "/dashboard",
        "/transactions",
        "/wallets",
        "/budgets",
        "/goals",
        "/analytics",
      ];

      if (isTablet) {
        updateNavPreferences({
          mobilePinned: currentMobile,
          tabletPinned: localPinnedIds,
        });
      } else {
        updateNavPreferences({
          mobilePinned: localPinnedIds,
          tabletPinned: currentTablet,
        });
      }
    }
    setIsCustomizing(!isCustomizing);
  };

  // Determine which list to render
  const displayPinnedIds = isCustomizing ? localPinnedIds : serverPinnedIds;

  // Split links for customization - CRITICAL: Sort pinnedLinks to match pinnedIds order
  const pinnedLinks = displayPinnedIds
    .map((id) => navLinks.find((l) => l.to === id))
    .filter(Boolean) as { to: string; icon: any; label: string }[];

  const unpinnedLinks = navLinks.filter(
    (l) => !displayPinnedIds.includes(l.to),
  );

  // Regular filtered links
  const visibleLinks = navLinks.filter(
    (link) =>
      !searchQuery ||
      link.label.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const searchResults = searchQuery
    ? navLinks.filter((link) =>
        link.label.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : [];

  const actions = [
    {
      id: "invite",
      icon: Share2,
      label: t("common.invite_friends"),
      onClick: onInviteClick,
    },
    {
      id: "feedback",
      icon: MessageSquare,
      label: t("common.send_feedback"),
      onClick: onFeedbackClick,
    },
    {
      id: "balances",
      icon: hideAmounts ? EyeOff : Eye,
      label: hideAmounts
        ? t("common.hidden_balances")
        : t("common.show_balances"),
      onClick: onToggleBalances,
      isToggle: true,
      active: hideAmounts,
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.02, // Reduced from 0.05 for faster feel
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 }, // Reduced y offset
    show: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", damping: 25, stiffness: 300 }, // Faster spring
    },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-[60]" // Removed backdrop-blur-md from backdrop
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            ref={sheetRef}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 350 }} // Snappier entry
            className="fixed bottom-0 left-0 right-0 bg-white dark:bg-[#121212] rounded-t-[2.5rem] z-[70] shadow-[0_-10px_40px_rgba(0,0,0,0.2)] border-t border-slate-200 dark:border-white/5 pb-[env(safe-area-inset-bottom,24px)] overflow-hidden will-change-transform"
          >
            {/* Handle */}
            <div className="flex justify-center pt-4 pb-2">
              <div className="w-12 h-1.5 bg-slate-200 dark:bg-zinc-800 rounded-full" />
            </div>

            <div className="px-6 py-4 flex items-center justify-between mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-[22px] font-extrabold text-slate-900 dark:text-white tracking-tight">
                    {t("common.menu")}
                  </h2>
                  {isCustomizing && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="px-2 py-0.5 bg-brand-500 text-white text-[10px] font-black uppercase rounded-full"
                    >
                      {t("common.editing")}
                    </motion.div>
                  )}
                </div>
                <p className="text-[12px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                  {isCustomizing
                    ? t("common.nav_customize_desc")
                    : t("common.nav_menu_desc")}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleToggleCustomize}
                  className={cn(
                    "flex items-center justify-center w-9 h-9 rounded-full transition-all active:scale-90",
                    isCustomizing
                      ? "bg-brand-500 text-white shadow-lg shadow-brand-500/30"
                      : "bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 hover:text-brand-500",
                  )}
                  aria-label={isCustomizing ? "Done" : "Edit Nav"}
                >
                  {isCustomizing ? (
                    <Check size={18} strokeWidth={2.5} />
                  ) : (
                    <Edit2 size={16} />
                  )}
                </button>
                <button
                  onClick={onClose}
                  className="w-9 h-9 flex items-center justify-center bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-full transition-colors active:scale-90 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="px-4 pb-8 max-h-[75vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 gap-2">
                <div className="space-y-4">
                  {/* Search Bar */}
                  {!isCustomizing && (
                    <div className="mb-2 px-2">
                      <div className="relative group flex items-center">
                        <Search
                          size={18}
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-500 transition-colors"
                        />
                        <input
                          type="text"
                          placeholder={t("common.search")}
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-11 pr-10 py-3 bg-slate-100 dark:bg-white/5 rounded-2xl text-[15px] focus:outline-none focus:ring-2 focus:ring-brand-500/30 text-slate-900 dark:text-white placeholder-slate-500 transition-all font-medium"
                        />
                        {searchQuery && (
                          <button
                            onClick={() => setSearchQuery("")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                            aria-label="Clear search"
                          >
                            <X size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {searchQuery ? (
                    <div className="space-y-1">
                      {searchResults.length === 0 ? (
                        <div className="text-center py-6 px-4">
                          <p className="text-sm text-slate-500 dark:text-zinc-500">
                            {t("common.no_results")}
                          </p>
                        </div>
                      ) : (
                        searchResults.map((item) => (
                          <ReorderItemPin
                            key={item.to}
                            item={item}
                            itemVariants={itemVariants}
                          />
                        ))
                      )}
                    </div>
                  ) : isCustomizing ? (
                    <div className="space-y-6">
                      {/* Pinned Section */}
                      <div className="space-y-3">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-4">
                          {t("common.pinned_reorder")}{" "}
                          {isTablet
                            ? `(${displayPinnedIds.length}/6)`
                            : `(${displayPinnedIds.length}/3)`}
                        </h3>
                        <ReorderGroup
                          axis="y"
                          values={displayPinnedIds}
                          onReorder={setPinnedOrder}
                          className="space-y-1"
                        >
                          {pinnedLinks.map((item) => (
                            <ReorderItemPin
                              key={item.to}
                              item={item}
                              isPinned={true}
                              onToggle={() => togglePin(item.to)}
                              isCustomizing={true}
                            />
                          ))}
                        </ReorderGroup>
                      </div>

                      {/* Unpinned Section */}
                      <div className="space-y-3">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-4">
                          {t("common.more_items")}{" "}
                          {isTablet
                            ? t("common.max_items", { count: 6 })
                            : t("common.max_items", { count: 3 })}
                        </h3>
                        <div className="space-y-1">
                          {unpinnedLinks.map((item) => (
                            <ReorderItemPin
                              key={item.to}
                              item={item}
                              isPinned={false}
                              onToggle={() => togglePin(item.to)}
                              isCustomizing={true}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <motion.div
                      variants={containerVariants}
                      initial="hidden"
                      animate="show"
                      className="space-y-1"
                    >
                      {visibleLinks.map((item) => (
                        <ReorderItemPin
                          key={item.to}
                          item={item}
                          itemVariants={itemVariants}
                        />
                      ))}
                    </motion.div>
                  )}
                </div>

                {/* Divider */}
                <div className="h-px bg-slate-100 dark:bg-white/5 my-2 mx-4" />

                {/* Actions */}
                <div className="grid grid-cols-1 gap-1">
                  {actions.map((action) => {
                    const Icon = action.icon;
                    return (
                      <div key={action.id}>
                        <button
                          onClick={() => {
                            action.onClick();
                            if (!action.isToggle) onClose();
                          }}
                          className="w-full flex items-center justify-between py-2.5 px-3 rounded-2xl transition-all group hover:bg-slate-100 dark:hover:bg-white/5 active:scale-[0.98] text-slate-700 dark:text-slate-300"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-[14px] bg-slate-100 dark:bg-zinc-800 flex items-center justify-center group-hover:bg-brand-50 dark:group-hover:bg-brand-500/20 transition-colors">
                              <Icon
                                size={20}
                                strokeWidth={2}
                                className="text-slate-500 dark:text-slate-400 group-hover:text-brand-500 transition-colors"
                              />
                            </div>
                            <span className="text-[16px] font-medium tracking-tight group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                              {action.label}
                            </span>
                          </div>
                          {action.isToggle && (
                            <div
                              className={cn(
                                "w-1.5 h-1.5 rounded-full mr-2",
                                action.active
                                  ? "bg-brand-500"
                                  : "bg-slate-300 dark:bg-slate-600",
                              )}
                            />
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default NavMoreSheet;
