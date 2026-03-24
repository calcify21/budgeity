import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import logo from "../assets/logo-927x1024.png";
import {
  LayoutDashboard,
  Wallet,
  ArrowRightLeft,
  Tags,
  Settings,
  Menu,
  Search,
  Plus,
  Eye,
  EyeOff,
  ShoppingCart,
  Download,
  LogOut,
  User,
  UserCircle,
  PiggyBank,
  Target,
  Repeat,
  Sparkles,
  Share2,
  BarChart3,
  Sun,
  Moon,
  MessageSquare,
  Shield,
  ChevronDown,
  Users,
  Bell,
  Check,
  X,
  Home,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { useData } from "../context/DataContext";
import { useAuth } from "../context/AuthContext";
import { useHousehold } from "../context/HouseholdContext";
import { useToast } from "../context/ToastContext";
import { cn, ICON_MAP } from "../utils";
import AddTransactionModal from "./AddTransactionModal";
import InviteFriendsModal from "./InviteFriendsModal";
import FeedbackModal from "./FeedbackModal";
import HouseholdModal from "./HouseholdModal";
import { motion, AnimatePresence } from "framer-motion";
import Tooltip from "./Tooltip";
import { useTranslation } from "react-i18next";
import BottomNav from "./navigation/BottomNav";
import SystemStatus from "./SystemStatus";
import UserAvatar from "./ui/UserAvatar";
import { useAvatar } from "../hooks/useAvatar";
import ChangePhotoModal from "./ChangePhotoModal";
import AvatarCropModal from "./AvatarCropModal";
import FullPhotoViewModal from "./FullPhotoViewModal";

// Fix: Cast motion components to any to resolve type errors
const MotionDiv = motion.div as any;
const MotionButton = motion.button as any;

// Custom Logout Icon for Specific Animation
const CustomLogoutIcon = ({ size = 20 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {/* The bracket/door - stays static */}
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />

    {/* The arrow - moves on hover */}
    <g className="transition-transform duration-300 ease-in-out group-hover:translate-x-1">
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" x2="9" y1="12" y2="12" />
    </g>
  </svg>
);

interface SidebarItemProps {
  to: string;
  icon: any;
  label: string;
  onClick?: () => void;
  location: any;
  className?: string;
  isCollapsed?: boolean;
}

const SidebarItem: React.FC<SidebarItemProps> = ({
  to,
  icon: Icon,
  label,
  onClick,
  location,
  className,
  isCollapsed = false,
}) => {
  const isActive =
    location.pathname === to ||
    (to !== "/" && (location.pathname + "/").startsWith(to + "/"));

  const contentElement = (
    <Link
      to={to}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden",
        isCollapsed ? "px-0 justify-center w-12 mx-auto" : "px-4",
        isActive
          ? "text-white shadow-lg shadow-brand-500/25"
          : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-slate-200",
        className,
      )}
    >
      {isActive && (
        <MotionDiv
          layoutId="sidebarActive"
          className="absolute inset-0 bg-brand-600 dark:bg-brand-600 rounded-xl"
          initial={false}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
      )}
      <div
        className={cn(
          "relative z-10 flex items-center gap-3",
          isCollapsed ? "justify-center" : "",
        )}
      >
        <Icon
          size={20}
          className={cn(
            "transition-transform duration-300 shrink-0",
            isActive ? "scale-110" : "group-hover:scale-110",
          )}
        />
        {!isCollapsed && (
          <span className="font-medium whitespace-nowrap overflow-hidden transition-all duration-300 w-auto opacity-100">
            {label}
          </span>
        )}
      </div>
    </Link>
  );

  return isCollapsed ? (
    <Tooltip content={label} side="right">
      {contentElement}
    </Tooltip>
  ) : (
    contentElement
  );
};

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isMobileNavSheetOpen, setIsMobileNavSheetOpen] = useState(false);
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [txModalDefaultType, setTxModalDefaultType] = useState<"expense" | "income" | "transfer">("expense");

  useEffect(() => {
    const addParam = searchParams.get("add");
    if (addParam === "expense" || addParam === "income" || addParam === "true") {
      setTxModalDefaultType(addParam === "income" ? "income" : "expense");
      setIsTxModalOpen(true);
      // Clean up the URL after opening the modal
      const newParams = new URLSearchParams(searchParams);
      newParams.delete("add");
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);
  const [_isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem("budgeity_sidebar_collapsed");
    return saved === "true";
  });
  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isSidebarCollapsed = _isSidebarCollapsed && isDesktop;
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({
    main: true,
    planning: true,
    management: true,
    general: true,
    admin: true,
  });
  const [searchQuery, setSearchQuery] = useState("");

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const toggleSidebar = () => {
    const newVal = !_isSidebarCollapsed;
    setIsSidebarCollapsed(newVal);
    localStorage.setItem("budgeity_sidebar_collapsed", String(newVal));
  };
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [isHouseholdModalOpen, setIsHouseholdModalOpen] = useState(false);
  const [isWorkspaceSwitcherOpen, setIsWorkspaceSwitcherOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [showInviteBanner, setShowInviteBanner] = useState(true);
  const { hideAmounts, toggleHideAmounts, theme, toggleTheme } = useData();
  const { user, logout } = useAuth();
  const {
    activeWorkspace,
    switchWorkspace,
    households,
    pendingInvites,
    acceptInvite,
    declineInvite,
  } = useHousehold();
  const { success, error } = useToast();
  const { avatarBase64, saveAvatar, removeAvatar, setProviderPhoto } =
    useAvatar();
  const [isChangePhotoOpen, setIsChangePhotoOpen] = useState(false);
  const [showFullPhoto, setShowFullPhoto] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);

  // PWA Install Prompt State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
    }
  };

  const handleInvite = () => {
    setIsInviteModalOpen(true);
  };

  const handleNavClick = () => {
    // setIsMobileNavSheetOpen(false); // Handled explicitly by the sheet via location change
  };

  const mainContentRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (mainContentRef.current) {
      mainContentRef.current.scrollTo({
        top: 0,
        left: 0,
        behavior: "instant",
      });
    }
  }, [location.pathname]);

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-black text-slate-900 dark:text-slate-100 overflow-hidden relative selection:bg-brand-500/30">
      {/* Ambient Background Blobs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-500/10 rounded-full blur-[100px] animate-blob" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[100px] animate-blob animation-delay-2000" />
      </div>

      {/* Sidebar - Desktop Only */}
      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-50 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-r border-slate-200 dark:border-white/5 transform transition-all duration-300 ease-in-out flex flex-col shadow-2xl lg:shadow-none",
          "-translate-x-full lg:translate-x-0",
          isSidebarCollapsed ? "w-20" : "w-72",
        )}
      >
        <div
          className={cn(
            "p-6 flex items-center transition-all duration-300",
            isSidebarCollapsed
              ? "justify-center flex-col gap-4"
              : "justify-between",
          )}
        >
          <Link
            to="/dashboard"
            className={cn(
              "flex items-center gap-3 hover:opacity-80 transition-opacity",
              isSidebarCollapsed ? "justify-center" : "",
            )}
          >
            <div className="w-10 h-10 flex items-center justify-center shrink-0">
              <img
                src={logo}
                alt="Budgeity Logo"
                className="w-full h-full object-contain"
              />
            </div>
            {!isSidebarCollapsed && (
              <h1 className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 whitespace-nowrap">
                Budgeity
              </h1>
            )}
          </Link>

          <button
            onClick={toggleSidebar}
            className={cn(
              "p-1.5 rounded-full bg-slate-100 dark:bg-white/5 text-slate-500 hover:bg-slate-200 dark:hover:bg-brand-500 transition-colors hidden lg:flex items-center justify-center shadow-sm",
            )}
            title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isSidebarCollapsed ? (
              <ChevronRight size={14} strokeWidth={3} />
            ) : (
              <ChevronLeft size={14} strokeWidth={3} />
            )}
          </button>
        </div>

        {/* Search Bar */}
        <div
          className={cn(
            "px-4 mb-2 transition-all duration-300",
            isSidebarCollapsed ? "hidden lg:hidden" : "block",
          )}
        >
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder={t("common.search", "Search...")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-100 dark:bg-white/5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50 border border-transparent dark:border-white/5 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 transition-all"
            />
          </div>
        </div>

        {(() => {
          const NavHeader = ({
            title,
            section,
          }: {
            title: string;
            section: string;
          }) => {
            if (isSidebarCollapsed)
              return (
                <div className="h-px bg-slate-200 dark:bg-white/5 my-3 mx-4"></div>
              );
            return (
              <button
                onClick={() => toggleSection(section)}
                className="w-full flex items-center justify-between px-4 py-1.5 mt-4 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider hover:text-slate-600 dark:hover:text-slate-300 transition-colors group"
              >
                <span>{title}</span>
                <ChevronDown
                  size={14}
                  className={cn(
                    "transition-transform",
                    expandedSections[section] ? "rotate-180" : "",
                  )}
                />
              </button>
            );
          };

          const navItems = [
            {
              section: "main",
              title: "Main",
              items: [
                {
                  to: "/dashboard",
                  icon: LayoutDashboard,
                  label: t("common.dashboard"),
                  onClick: handleNavClick,
                  className: undefined,
                },
                {
                  to: "/analytics",
                  icon: BarChart3,
                  label: t("common.analytics"),
                  onClick: handleNavClick,
                  className: "tour-nav-analytics",
                },
                {
                  to: "/analytics-v2",
                  icon: BarChart3,
                  label: t("common.analytics_v2"),
                  onClick: handleNavClick,
                  className: undefined,
                },
                {
                  to: "/transactions",
                  icon: ArrowRightLeft,
                  label: t("common.transactions"),
                  onClick: handleNavClick,
                  className: "tour-nav-transactions",
                },
                {
                  to: "/wallets",
                  icon: Wallet,
                  label: t("common.wallets"),
                  onClick: handleNavClick,
                  className: "tour-nav-wallets",
                },
              ],
            },
            {
              section: "planning",
              title: "Planning",
              items: [
                {
                  to: "/budgets",
                  icon: PiggyBank,
                  label: t("common.budgets"),
                  onClick: handleNavClick,
                  className: "tour-nav-budgets",
                },
                {
                  to: "/goals",
                  icon: Target,
                  label: t("common.goals"),
                  onClick: handleNavClick,
                  className: "tour-nav-goals",
                },
                {
                  to: "/recurring",
                  icon: Repeat,
                  label: t("common.recurring"),
                  onClick: handleNavClick,
                  className: "tour-nav-recurring",
                },
                {
                  to: "/shopping-list",
                  icon: ShoppingCart,
                  label: t("common.shopping_list"),
                  onClick: handleNavClick,
                  className: "tour-nav-shopping",
                },
              ],
            },
            {
              section: "management",
              title: "Management",
              items: [
                {
                  to: "/categories",
                  icon: Tags,
                  label: t("common.categories"),
                  onClick: handleNavClick,
                  className: "tour-nav-categories",
                },
                {
                  to: "/export",
                  icon: Download,
                  label: t("common.export"),
                  onClick: handleNavClick,
                  className: "tour-nav-export",
                },
                ...(activeWorkspace.type === "household"
                  ? [
                      {
                        to: "/household-settings",
                        icon: Home,
                        label: "Household Settings",
                        onClick: handleNavClick,
                        className: undefined,
                      },
                    ]
                  : []),
              ],
            },
            {
              section: "general",
              title: "General",
              items: [
                {
                  to: "/settings",
                  icon: Settings,
                  label: t("common.settings"),
                  onClick: handleNavClick,
                  className: undefined,
                },
                {
                  to: "/account-info",
                  icon: UserCircle,
                  label: t("common.account_info"),
                  onClick: handleNavClick,
                  className: undefined,
                },
                {
                  to: "/whats-new",
                  icon: Sparkles,
                  label: t("common.whats_new"),
                  onClick: handleNavClick,
                  className: undefined,
                },
              ],
            },
          ];

          if (user?.email === "jainshr21@gmail.com") {
            navItems.push({
              section: "admin",
              title: "Admin",
              items: [
                {
                  to: "/admin/feedback",
                  icon: Shield,
                  label: t("common.user_feedback"),
                  onClick: handleNavClick,
                  className:
                    location.pathname === "/admin/feedback"
                      ? "shadow-none"
                      : "text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/20 hover:bg-sky-100 dark:hover:bg-sky-900/30 font-bold",
                },
              ],
            });
          }

          const filteredNavItems = navItems
            .map((section) => ({
              ...section,
              items: section.items.filter(
                (item) =>
                  !searchQuery ||
                  item.label.toLowerCase().includes(searchQuery.toLowerCase()),
              ),
            }))
            .filter((section) => section.items.length > 0);

          return (
            <nav
              className={cn(
                "flex-1 space-y-1 overflow-y-auto custom-scrollbar",
                isSidebarCollapsed && !searchQuery ? "px-2" : "px-4",
              )}
            >
              {filteredNavItems.length === 0 ? (
                <div className="text-center py-6 px-4">
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    No results found.
                  </p>
                </div>
              ) : (
                filteredNavItems.map(({ title, section, items }) => (
                  <React.Fragment key={section}>
                    <NavHeader title={title} section={section} />
                    <AnimatePresence>
                      {(isSidebarCollapsed ||
                        expandedSections[section] ||
                        searchQuery) && (
                        <MotionDiv
                          initial={
                            isSidebarCollapsed
                              ? false
                              : { height: 0, opacity: 0 }
                          }
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                          className="overflow-hidden space-y-1"
                        >
                          {items.map((item) => (
                            <SidebarItem
                              key={item.to}
                              to={item.to}
                              icon={item.icon}
                              label={item.label}
                              onClick={item.onClick}
                              location={location}
                              className={item.className}
                              isCollapsed={isSidebarCollapsed && !searchQuery}
                            />
                          ))}
                        </MotionDiv>
                      )}
                    </AnimatePresence>
                  </React.Fragment>
                ))
              )}
            </nav>
          );
        })()}

        {/* Bottom Actions Section */}
        <div
          className={cn(
            "p-4 mb-4 mt-2 bg-slate-100 dark:bg-white/5 rounded-2xl flex flex-col gap-2 transition-all duration-300",
            isSidebarCollapsed ? "mx-2 items-center px-2 py-3" : "mx-4",
          )}
        >
          {/* Invite Friends */}
          <div className="w-full">
            <Tooltip
              content={isSidebarCollapsed ? "Invite Friends" : ""}
              side="right"
              disabled={!isSidebarCollapsed}
            >
              <button
                onClick={handleInvite}
                className={cn(
                  "w-full flex items-center p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-zinc-800 hover:text-brand-500 transition-colors group",
                  isSidebarCollapsed ? "justify-center" : "gap-3 px-3",
                )}
              >
                <Share2
                  size={18}
                  className="group-hover:scale-110 transition-transform shrink-0"
                />
                {!isSidebarCollapsed && (
                  <span className="font-medium text-sm whitespace-nowrap">
                    Invite Friends
                  </span>
                )}
              </button>
            </Tooltip>
          </div>

          {/* Feedback */}
          <div className="w-full">
            <Tooltip
              content={isSidebarCollapsed ? "Send Feedback" : ""}
              side="right"
              disabled={!isSidebarCollapsed}
            >
              <button
                onClick={() => setIsFeedbackModalOpen(true)}
                className={cn(
                  "w-full flex items-center p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-zinc-800 hover:text-brand-500 transition-colors group",
                  isSidebarCollapsed ? "justify-center" : "gap-3 px-3",
                )}
              >
                <MessageSquare
                  size={18}
                  className="group-hover:scale-110 transition-transform shrink-0"
                />
                {!isSidebarCollapsed && (
                  <span className="font-medium text-sm whitespace-nowrap">
                    Send Feedback
                  </span>
                )}
              </button>
            </Tooltip>
          </div>

          {/* Show/Hide Balances */}
          <div className="w-full">
            <Tooltip
              content={
                isSidebarCollapsed
                  ? hideAmounts
                    ? "Show Balances"
                    : "Hide Balances"
                  : ""
              }
              side="right"
              disabled={!isSidebarCollapsed}
            >
              <button
                onClick={toggleHideAmounts}
                className={cn(
                  "w-full flex items-center p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-slate-200 transition-colors group",
                  isSidebarCollapsed
                    ? "justify-center"
                    : "justify-between px-3",
                )}
              >
                <div
                  className={cn(
                    "flex items-center",
                    isSidebarCollapsed ? "justify-center" : "gap-3",
                  )}
                >
                  {hideAmounts ? (
                    <EyeOff
                      size={18}
                      className="group-hover:scale-110 transition-transform shrink-0"
                    />
                  ) : (
                    <Eye
                      size={18}
                      className="group-hover:scale-110 transition-transform shrink-0"
                    />
                  )}
                  {!isSidebarCollapsed && (
                    <span className="font-medium text-sm whitespace-nowrap">
                      {hideAmounts ? "Hidden Balances" : "Show Balances"}
                    </span>
                  )}
                </div>
                {!isSidebarCollapsed && (
                  <div
                    className={cn(
                      "w-1.5 h-1.5 rounded-full shrink-0",
                      hideAmounts
                        ? "bg-brand-500"
                        : "bg-slate-300 dark:bg-slate-600",
                    )}
                  />
                )}
              </button>
            </Tooltip>
          </div>

          {/* Install App - Only show if valid prompt exists */}
          {deferredPrompt && (
            <div className="w-full">
              <Tooltip
                content={isSidebarCollapsed ? "Install App" : ""}
                side="right"
                disabled={!isSidebarCollapsed}
              >
                <button
                  onClick={handleInstallClick}
                  className={cn(
                    "w-full flex items-center p-2 rounded-xl text-white bg-brand-600 hover:bg-brand-500 shadow-lg shadow-brand-500/20 transition-all active:scale-95 group",
                    isSidebarCollapsed ? "justify-center" : "gap-3 px-3",
                  )}
                >
                  <Download
                    size={18}
                    className="shrink-0 group-hover:scale-110 transition-transform"
                  />
                  {!isSidebarCollapsed && (
                    <span className="font-bold text-sm whitespace-nowrap">
                      Install App
                    </span>
                  )}
                </button>
              </Tooltip>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full relative overflow-hidden z-10">
        {/* Header (Desktop & Mobile) */}
        <header className="h-16 border-b border-slate-200 dark:border-white/5 flex items-center justify-between px-4 lg:px-8 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-1 sm:gap-3 shrink-0">
            <Tooltip content="Menu" side="right">
              <button
                onClick={() => setIsMobileNavSheetOpen(true)}
                className="p-2 -ml-2 text-slate-600 dark:text-slate-300 hover:scale-110 active:scale-95 transition-transform lg:hidden"
              >
                <Menu className="w-6 h-6" />
              </button>
            </Tooltip>

            <Link to="/" className="flex items-center gap-2 lg:hidden">
              <div className="w-8 h-8 flex items-center justify-center">
                <img
                  src={logo}
                  alt="Budgeity Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="font-bold text-lg hidden sm:block">
                Budgeity
              </span>
            </Link>
          </div>

          {/* Workspace Switcher */}
          <div className="relative">
            <button
              onClick={() =>
                setIsWorkspaceSwitcherOpen(!isWorkspaceSwitcherOpen)
              }
              className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-xl transition-colors tour-nav-workspace"
            >
              <span className="text-base flex items-center justify-center">
                {activeWorkspace.type === "personal"
                  ? "👤"
                  : (() => {
                      const h = households.find(
                        (h) => h.id === activeWorkspace.id,
                      );
                      const IconComp = h?.icon ? ICON_MAP[h.icon] : null;
                      return IconComp ? (
                        <IconComp size={16} />
                      ) : (
                        h?.icon || "🏠"
                      );
                    })()}
              </span>
              <span className="text-sm font-semibold max-w-[100px] truncate hidden sm:block">
                {activeWorkspace.name}
              </span>
              <ChevronDown size={14} className="text-slate-400" />
              {pendingInvites.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {pendingInvites.length}
                </span>
              )}
            </button>

            {isWorkspaceSwitcherOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsWorkspaceSwitcherOpen(false)}
                />
                <div className="absolute left-1/2 -translate-x-1/2 sm:left-0 sm:translate-x-0 top-full mt-2 w-72 max-w-[calc(100vw-2rem)] bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 z-50 overflow-hidden">
                  {/* Personal */}
                  <button
                    onClick={() => {
                      switchWorkspace({
                        type: "personal",
                        id: user?.uid || "",
                        name: "Personal",
                      });
                      setIsWorkspaceSwitcherOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors",
                      activeWorkspace.type === "personal"
                        ? "bg-brand-50 dark:bg-brand-500/10"
                        : "hover:bg-slate-50 dark:hover:bg-white/5",
                    )}
                  >
                    <div className="w-8 h-8 rounded-lg bg-brand-100 dark:bg-brand-500/20 flex items-center justify-center text-brand-600">
                      <Home size={16} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold">Personal</p>
                      <p className="text-xs text-slate-500">
                        Your private finances
                      </p>
                    </div>
                    {activeWorkspace.type === "personal" && (
                      <div className="w-2 h-2 rounded-full bg-brand-500" />
                    )}
                  </button>

                  {/* Households */}
                  {households.length > 0 && (
                    <div className="border-t border-slate-100 dark:border-white/5">
                      <p className="px-4 pt-2 pb-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        Households
                      </p>
                      {households.map((h) => (
                        <button
                          key={h.id}
                          onClick={() => {
                            switchWorkspace({
                              type: "household",
                              id: h.id,
                              name: h.name,
                            });
                            setIsWorkspaceSwitcherOpen(false);
                          }}
                          className={cn(
                            "w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors",
                            activeWorkspace.type === "household" &&
                              activeWorkspace.id === h.id
                              ? "bg-brand-50 dark:bg-brand-500/10"
                              : "hover:bg-slate-50 dark:hover:bg-white/5",
                          )}
                        >
                          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/5 flex items-center justify-center text-lg">
                            {(() => {
                              const IconComp = h.icon ? ICON_MAP[h.icon] : null;
                              return IconComp ? (
                                <IconComp
                                  size={18}
                                  className="text-slate-600 dark:text-slate-300"
                                />
                              ) : (
                                h.icon || "🏠"
                              );
                            })()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold truncate">
                              {h.name}
                            </p>
                            <p className="text-xs text-slate-500">
                              {
                                h.members.filter((m) => m.status === "active")
                                  .length
                              }{" "}
                              members
                            </p>
                          </div>
                          {activeWorkspace.type === "household" &&
                            activeWorkspace.id === h.id && (
                              <div className="w-2 h-2 rounded-full bg-brand-500" />
                            )}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Pending Invites */}
                  {pendingInvites.length > 0 && (
                    <div className="border-t border-slate-100 dark:border-white/5">
                      <p className="px-4 pt-2 pb-1 text-[11px] font-semibold text-amber-500 uppercase tracking-wider">
                        🔔 Pending Invites
                      </p>
                      {pendingInvites.map((inv) => (
                        <div
                          key={inv.id}
                          className="px-4 py-2.5 flex items-center gap-3"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate">
                              {inv.householdName}
                            </p>
                            <p className="text-xs text-slate-500">
                              From {inv.invitedByName} as {inv.role}
                            </p>
                          </div>
                          <button
                            onClick={async () => {
                              await acceptInvite(inv.id);
                              success("Joined " + inv.householdName + "!");
                            }}
                            className="p-1.5 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 rounded-lg hover:bg-emerald-200"
                          >
                            <Check size={14} />
                          </button>
                          <button
                            onClick={async () => {
                              await declineInvite(inv.id);
                            }}
                            className="p-1.5 bg-slate-100 dark:bg-white/5 text-slate-400 rounded-lg hover:bg-slate-200"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Create */}
                  <div className="border-t border-slate-100 dark:border-white/5">
                    <button
                      onClick={() => {
                        setIsWorkspaceSwitcherOpen(false);
                        setIsHouseholdModalOpen(true);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-500/5 transition-colors"
                    >
                      <Plus size={16} />
                      <span className="text-sm font-semibold">
                        Create Household
                      </span>
                    </button>
                  </div>

                  {/* Household Settings */}
                  {activeWorkspace.type === "household" && (
                    <div className="border-t border-slate-100 dark:border-white/5">
                      <button
                        onClick={() => {
                          setIsWorkspaceSwitcherOpen(false);
                          navigate("/household-settings");
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                      >
                        <Settings size={16} />
                        <span className="text-sm font-semibold">
                          Household Settings
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-1 sm:gap-2 md:gap-4 shrink-0">
            <SystemStatus />

            {/* Theme Toggle */}
            <Tooltip
              content={theme === "dark" ? "Light Mode" : "Dark Mode"}
              side="bottom"
            >
              <button
                onClick={toggleTheme}
                className="p-2 text-slate-400 hover:text-brand-500 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-full transition-all"
              >
                {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
              </button>
            </Tooltip>

            {/* User Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
              >
                <UserAvatar
                  name={user?.displayName}
                  avatarBase64={avatarBase64}
                  photoURL={user?.photoURL}
                  size={32}
                />
                <span className="hidden sm:block font-medium text-sm text-slate-700 dark:text-slate-200 max-w-[100px] truncate">
                  {user?.displayName || "User"}
                </span>
                <ChevronDown
                  size={14}
                  className="text-slate-400 hidden sm:block"
                />
              </button>

              {isProfileDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsProfileDropdownOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-[360px] max-w-[calc(100vw-2rem)] bg-white dark:bg-[#2d2e30] rounded-[28px] shadow-2xl border border-slate-200 dark:border-white/5 z-50 overflow-hidden text-center p-4">
                    {/* Header with Exit */}
                    <div className="flex items-center justify-between mb-2 px-2">
                      <div className="flex-1 text-center">
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                          {user?.email}
                        </p>
                      </div>
                      <button
                        onClick={() => setIsProfileDropdownOpen(false)}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full transition-colors text-slate-500"
                      >
                        <X size={20} />
                      </button>
                    </div>

                    {/* Main Profile Info */}
                    <div className="flex flex-col items-center py-4">
                      <div className="relative group mb-4">
                        <UserAvatar
                          name={user?.displayName}
                          avatarBase64={avatarBase64}
                          photoURL={user?.photoURL}
                          size={80}
                          editable
                          onEditClick={() => {
                            setIsProfileDropdownOpen(false);
                            setIsChangePhotoOpen(true);
                          }}
                          className="border-4 border-slate-50 dark:border-zinc-800 shadow-md"
                        />
                      </div>

                      <h2 className="text-2xl font-normal text-slate-900 dark:text-white mb-4">
                        Hi, {user?.displayName?.split(" ")[0] || "User"}!
                      </h2>

                      <button
                        onClick={() => {
                          setIsProfileDropdownOpen(false);
                          navigate("/account-info");
                        }}
                        className="px-6 py-2.5 rounded-full border border-slate-300 dark:border-slate-600 text-sm font-medium text-brand-600 dark:text-brand-300 hover:bg-brand-50 dark:hover:bg-brand-500/10 transition-colors mb-2"
                      >
                        Manage your Budgeity Account
                      </button>
                      <button
                        onClick={() => {
                          setIsProfileDropdownOpen(false);
                          navigate("/settings");
                        }}
                        className="px-6 py-2.5 rounded-full bg-slate-50 border border-slate-200 dark:bg-zinc-800 dark:border-zinc-700 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-zinc-700 transition-colors mb-6 shadow-sm"
                      >
                        Tweak your Budgeity experience
                      </button>
                    </div>

                    {/* Action Row */}
                    <div className="flex gap-2 mb-4">
                      {/* Add account button removed as requested */}
                      <button
                        onClick={() => {
                          setIsProfileDropdownOpen(false);
                          logout();
                        }}
                        className="flex-1 flex items-center justify-center gap-3 p-4 rounded-3xl bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors group"
                      >
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-400 group-hover:bg-white dark:group-hover:bg-zinc-800 transition-colors">
                          <LogOut size={20} />
                        </div>
                        <span className="font-medium text-sm text-slate-700 dark:text-slate-200">
                          Sign out
                        </span>
                      </button>
                    </div>

                    {/* Footer */}
                    <div className="pt-2 flex items-center justify-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                      <Link
                        to="/privacy-policy"
                        onClick={() => setIsProfileDropdownOpen(false)}
                        className="hover:underline"
                      >
                        Privacy Policy
                      </Link>
                      <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                      <Link
                        to="/terms-of-service"
                        onClick={() => setIsProfileDropdownOpen(false)}
                        className="hover:underline"
                      >
                        Terms of Service
                      </Link>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <div
          ref={mainContentRef}
          className="flex-1 overflow-y-auto p-4 lg:p-8 pb-32 lg:pb-12 no-scrollbar scroll-smooth"
        >
          <div className="max-w-7xl mx-auto">{children}</div>
        </div>

        {/* Mobile Filter / Household Modals etc remain unchanged */}

        {/* Desktop Floating FAB - Bottom Right */}
        <div className="fixed bottom-8 right-8 z-[45] hidden lg:block">
          <MotionButton
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsTxModalOpen(true)}
            className="flex items-center gap-3 px-6 py-4 bg-brand-600 text-white rounded-full shadow-xl shadow-brand-500/20 border border-brand-500/30 relative group overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-brand-500/30"
          >
            {/* Shimmer Effect */}
            <div className="absolute inset-0 bg-[linear-gradient(110deg,transparent,rgba(255,255,255,0.2),transparent)] -translate-x-[100%] group-hover:animate-shimmer" />

            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors shadow-inner shrink-0 backdrop-blur-sm">
              <Plus
                size={20}
                strokeWidth={3}
                className="text-white drop-shadow-md"
              />
            </div>

            <span className="font-extrabold uppercase tracking-widest text-sm whitespace-nowrap drop-shadow-sm">
              Add Transaction
            </span>
          </MotionButton>
        </div>

        <BottomNav
          isMoreOpen={isMobileNavSheetOpen}
          setIsMoreOpen={setIsMobileNavSheetOpen}
          onAddClick={() => setIsTxModalOpen(true)}
          onInviteClick={() => setIsInviteModalOpen(true)}
          onFeedbackClick={() => setIsFeedbackModalOpen(true)}
          onToggleBalances={toggleHideAmounts}
          hideAmounts={hideAmounts}
          userEmail={user?.email}
        />
      </main>

      <AnimatePresence>
        {isTxModalOpen && (
          <AddTransactionModal 
            onClose={() => setIsTxModalOpen(false)} 
            defaultType={txModalDefaultType}
          />
        )}
        {isInviteModalOpen && (
          <InviteFriendsModal onClose={() => setIsInviteModalOpen(false)} />
        )}
        {isFeedbackModalOpen && (
          <FeedbackModal onClose={() => setIsFeedbackModalOpen(false)} />
        )}
      </AnimatePresence>
      <HouseholdModal
        isOpen={isHouseholdModalOpen}
        onClose={() => setIsHouseholdModalOpen(false)}
      />
      <ChangePhotoModal
        isOpen={isChangePhotoOpen}
        onClose={() => setIsChangePhotoOpen(false)}
        onFileSelected={(file) => {
          const reader = new FileReader();
          reader.onload = () => {
            setCropImageSrc(reader.result as string);
            setIsChangePhotoOpen(false);
          };
          reader.readAsDataURL(file);
        }}
        onUseGooglePhoto={async () => {
          try {
            await setProviderPhoto();
            success("Using Google profile photo.");
          } catch {
            error("Failed to update photo.");
          }
        }}
        onRemovePhoto={async () => {
          try {
            await removeAvatar();
            success("Profile photo removed.");
          } catch {
            error("Failed to remove photo.");
          }
        }}
        hasGooglePhoto={
          !!(
            user?.photoURL &&
            user.photoURL !== "undefined" &&
            user.photoURL !== "null"
          )
        }
        hasCustomPhoto={!!avatarBase64}
        onViewPhoto={() => setShowFullPhoto(true)}
      />
      <FullPhotoViewModal
        isOpen={showFullPhoto}
        onClose={() => setShowFullPhoto(false)}
        photoURL={(avatarBase64 && avatarBase64 !== "removed" ? avatarBase64 : user?.photoURL) || null}
        name={user?.displayName}
      />
      {cropImageSrc && (
        <AvatarCropModal
          isOpen={!!cropImageSrc}
          imageSrc={cropImageSrc}
          onClose={() => setCropImageSrc(null)}
          onSave={async (base64) => {
            try {
              await saveAvatar(base64);
              success("Profile photo updated!");
              setCropImageSrc(null);
            } catch {
              error("Failed to save photo.");
            }
          }}
        />
      )}
    </div>
  );
};

export default Layout;
