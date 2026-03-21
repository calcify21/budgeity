import React, { useEffect } from "react";
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
  GripVertical,
  Edit2,
  Check,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "../../utils";
import { useData } from "../../context/DataContext";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import { useToast } from "../../context/ToastContext";
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
    <div className="flex items-center gap-3 group/item relative select-none">
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
          {isPinned ? <PinOff size={20} strokeWidth={2} /> : <Plus size={22} strokeWidth={2.5} />}
        </button>
      )}

      {isCustomizing ? (
        <div
          className={cn(
            "flex-1 flex items-center justify-between p-3 rounded-2xl transition-all group border border-transparent shadow-sm",
            "text-slate-600 dark:text-zinc-400 bg-white/50 dark:bg-zinc-800/50 backdrop-blur-sm",
            isPinned && "border-brand-500/20 bg-brand-50/30 dark:bg-brand-500/5"
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
            "flex-1 flex items-center justify-between p-3.5 rounded-2xl transition-all group",
            isActive
              ? "bg-brand-500 text-white shadow-lg shadow-brand-500/30"
              : "text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-white/5 active:scale-[0.98]",
          )}
        >
          <div className="flex items-center gap-4">
            <div
              className={cn(
                "w-11 h-11 rounded-xl flex items-center justify-center transition-colors",
                isActive
                  ? "bg-white/20"
                  : "bg-slate-100 dark:bg-zinc-800 group-hover:bg-brand-500/10 dark:group-hover:bg-brand-500/20",
              )}
            >
              <Icon
                size={22}
                strokeWidth={isActive ? 2.5 : 1.5}
                fill={isActive ? "white" : "none"}
                className={cn(isActive && "text-white")}
              />
            </div>
            <span className="text-base font-bold tracking-tight">
              {item.label}
            </span>
          </div>
          {isActive && (
            <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
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
        className="list-none"
      >
        {content}
      </ReorderItem>
    );
  }

  return <motion.div variants={itemVariants}>{content}</motion.div>;
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

  // Close on route change
  useEffect(() => {
    onClose();
  }, [location.pathname]);

  const isTablet = useMediaQuery("(min-width: 768px) and (max-width: 1023px)");

  const navLinks = [
    { to: "/dashboard", icon: LayoutDashboard, label: t("common.dashboard") },
    { to: "/analytics", icon: BarChart3, label: t("common.analytics") },
    { to: "/analytics-v2", icon: BarChart3, label: t("common.analytics_v2") },
    {
      to: "/transactions",
      icon: ArrowRightLeft,
      label: t("common.transactions"),
    },
    { to: "/recurring", icon: Repeat, label: t("common.recurring") },
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
    { to: "/settings", icon: Settings, label: t("common.settings") },
    { to: "/account-info", icon: UserCircle, label: t("common.account_info") },
    { to: "/whats-new", icon: Sparkles, label: t("common.whats_new") },
  ];

  if (userEmail === "jainshr21@gmail.com") {
    navLinks.push({ to: "/admin/feedback", icon: Shield, label: t("common.user_feedback") });
  }

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
    (link) => !excludedPaths.includes(link.to),
  );

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
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", damping: 20, stiffness: 200 },
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
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60]"
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-2xl rounded-t-[2.5rem] z-[70] shadow-2xl border-t border-slate-200 dark:border-white/5 pb-[env(safe-area-inset-bottom,24px)] overflow-hidden"
          >
            {/* Handle */}
            <div className="flex justify-center pt-4 pb-2">
              <div className="w-12 h-1.5 bg-slate-200 dark:bg-zinc-800 rounded-full" />
            </div>

            <div className="px-8 py-4 flex items-center justify-between mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    {isCustomizing ? "Customize Nav" : "Expand Menu"}
                  </h2>
                  {isCustomizing && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="px-2 py-0.5 bg-brand-500 text-white text-[10px] font-black uppercase rounded-full"
                    >
                      Editing
                    </motion.div>
                  )}
                </div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                  {isCustomizing
                    ? "Select items to pin to bar"
                    : "Explore Budgeity"}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleToggleCustomize}
                  className={cn(
                    "h-10 px-4 flex items-center gap-2 rounded-2xl font-black text-xs uppercase tracking-wider transition-all active:scale-95",
                    isCustomizing
                      ? "bg-brand-500 text-white shadow-lg shadow-brand-500/30"
                      : "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-white/10",
                  )}
                >
                  {isCustomizing ? <Check size={16} /> : <Edit2 size={16} />}
                  <span>{isCustomizing ? "Done" : "Edit Nav"}</span>
                </button>
                <button
                  onClick={onClose}
                  className="w-10 h-10 flex items-center justify-center bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-full transition-colors active:scale-90"
                >
                  <X size={20} className="text-slate-600 dark:text-zinc-400" />
                </button>
              </div>
            </div>

            <div className="px-4 pb-8 max-h-[75vh] overflow-y-auto custom-scrollbar">
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 gap-2"
              >
                <div className="space-y-4">
                  {isCustomizing ? (
                    <>
                      {/* Pinned Section */}
                      <div className="space-y-2">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-4">
                          Pinned (Drag to Reorder){" "}
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
                      <div className="space-y-2">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-4">
                          More Items {isTablet ? "(Max 6)" : "(Max 3)"}
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
                    </>
                  ) : (
                    <div className="space-y-1">
                      {visibleLinks.map((item) => (
                        <ReorderItemPin
                          key={item.to}
                          item={item}
                          itemVariants={itemVariants}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Divider */}
                <div className="h-px bg-slate-100 dark:bg-white/5 my-2 mx-4" />

                {/* Actions */}
                <div className="grid grid-cols-1 gap-2">
                  {actions.map((action) => {
                    const Icon = action.icon;
                    return (
                      <motion.div key={action.id} variants={itemVariants}>
                        <button
                          onClick={() => {
                            action.onClick();
                            if (!action.isToggle) onClose();
                          }}
                          className="w-full flex items-center justify-between p-3.5 rounded-2xl text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-all active:scale-[0.98] group"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center group-hover:bg-indigo-500/10 dark:group-hover:bg-indigo-500/20 transition-colors">
                              <Icon
                                size={22}
                                strokeWidth={1.5}
                                className="group-hover:text-indigo-500 transition-colors"
                              />
                            </div>
                            <span className="text-base font-bold tracking-tight">
                              {action.label}
                            </span>
                          </div>
                          {action.isToggle && (
                            <div
                              className={cn(
                                "w-1.5 h-1.5 rounded-full",
                                action.active
                                  ? "bg-brand-500 animate-pulse"
                                  : "bg-slate-300 dark:bg-slate-700",
                              )}
                            />
                          )}
                        </button>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default NavMoreSheet;
