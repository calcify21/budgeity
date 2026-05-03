import React, { createContext, useContext, useEffect, useRef } from "react";
import { driver, Driver } from "driver.js";
import "driver.js/dist/driver.css";
import { useLocation, useNavigate } from "react-router-dom";
import { useData } from "./DataContext";

interface TourContextType {
  startTour: () => void;
  isTourActive: boolean;
}

const TourContext = createContext<TourContextType | undefined>(undefined);

// ── Helpers ────────────────────────────────────────────────────────────

/** Poll for a DOM element, then fire callback */
const waitForElement = (
  selector: string,
  callback: () => void,
  timeout = 3000,
) => {
  const start = Date.now();
  const poll = setInterval(() => {
    if (document.querySelector(selector) || Date.now() - start > timeout) {
      clearInterval(poll);
      setTimeout(callback, 250); // let animations settle
    }
  }, 100);
};

/** Scroll a sidebar nav item into its scrollable parent's viewport */
const scrollNavIntoView = (selector: string) => {
  const el = document.querySelector(selector);
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
};

// ── Provider ───────────────────────────────────────────────────────────

export const TourProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { tourCompleted, completeTour, isLoadingData, isOnboarding } =
    useData();
  const driverObj = useRef<Driver | null>(null);
  const isTourActive = useRef(false);
  const isTransitioning = useRef(false); // guards completeTour during phase transitions

  /** Create (or re-create) the driver instance */
  const createDriver = () => {
    driverObj.current = driver({
      showProgress: true,
      animate: true,
      allowClose: true,
      smoothScroll: true,
      stagePadding: 8,
      stageRadius: 16,
      popoverClass: "budgeity-tour-popover",
      steps: [],
      nextBtnText: "Next",
      prevBtnText: "Back",
      doneBtnText: "🎉 Let's Go!",
      progressText: "{{current}} of {{total}}",
      onHighlightStarted: (element) => {
        // Auto-scroll sidebar nav items into the visible area
        if (element && (element as HTMLElement).closest?.("nav")) {
          (element as HTMLElement).scrollIntoView({
            behavior: "smooth",
            block: "nearest",
          });
        }
      },
      onDestroyStarted: () => {
        if (isTransitioning.current) {
          return true; // don't complete tour during phase transitions
        }
        completeTour();
        isTourActive.current = false;
        return true;
      },
      onCloseClick: () => {
        completeTour();
        isTourActive.current = false;
        driverObj.current?.destroy();
      },
    });
  };

  // Initialize
  useEffect(() => {
    createDriver();
  }, [completeTour]);

  const startTour = () => {
    if (!driverObj.current) createDriver();

    driverObj.current?.destroy();
    isTourActive.current = true;
    isTransitioning.current = false;

    if (location.pathname !== "/dashboard") {
      navigate("/dashboard");
      setTimeout(() => drivePhase1(), 800);
    } else {
      drivePhase1();
    }
  };

  // Auto-start (once) after data loads
  useEffect(() => {
    if (isLoadingData) return;

    const localCompleted = localStorage.getItem("budgeity_tour_completed");
    const isCompleted = tourCompleted || localCompleted === "true";

    if (
      !isCompleted &&
      !isOnboarding &&
      location.pathname === "/dashboard" &&
      !isTourActive.current
    ) {
      setTimeout(() => startTour(), 1200);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tourCompleted, isLoadingData]);

  // ══════════════════════════════════════════════════════════════════════
  //  PHASE 1 — Header + Dashboard Widgets + FAB
  // ══════════════════════════════════════════════════════════════════════

  const drivePhase1 = () => {
    createDriver();
    const steps: any[] = [];

    const add = (
      element: string,
      title: string,
      description: string,
      side = "bottom",
      align = "start",
      extra?: Record<string, any>,
    ) => {
      if (element === "body" || document.querySelector(element)) {
        steps.push({
          element,
          popover: { title, description, side, align, ...extra },
        });
      }
    };

    // Welcome
    add(
      "body",
      "👋 Welcome to Budgeity!",
      "Your intelligent financial command center is ready. We'll walk you through <strong>every feature</strong> so you become a power user in minutes!",
      "left",
      "start",
    );

    // Header
    add(
      ".tour-nav-workspace",
      "🔄 Workspace Switcher",
      "Toggle between your <strong>Personal</strong> space and shared <strong>Households</strong>. Each workspace has its own wallets, budgets, and analytics.",
      "bottom",
      "start",
    );
    add(
      ".tour-nav-theme",
      "🌗 Theme Toggle",
      "Switch between <strong>Light</strong> and <strong>Dark Mode</strong> instantly. Your preference syncs across devices.",
      "bottom",
      "end",
    );
    add(
      ".tour-nav-lock",
      "🔒 Instant App Lock",
      "Need to step away? Head here to <strong>manually lock Budgeity</strong> instantly. High-security financial data stays protected.",
      "bottom",
      "end",
    );
    add(
      ".tour-nav-profile",
      "👤 Profile Menu",
      "Access your <strong>avatar</strong>, <strong>account settings</strong>, and <strong>logout</strong> from this dropdown.",
      "bottom",
      "end",
    );

    // Dashboard controls
    add(
      ".tour-dash-time-range",
      "📅 Time Range",
      "Controls <strong>every widget</strong> simultaneously. Pick This Month, Last 3 Months, This Year, or a Custom Range — all charts update instantly.",
      "bottom",
      "end",
    );
    add(
      ".tour-dash-edit-layout",
      "⚙️ Edit Layout",
      "<strong>Drag & drop</strong> to reorder widgets, toggle them on/off, and craft the perfect dashboard for your goals.",
      "bottom",
      "end",
    );

    // Widgets
    add(
      ".tour-net-worth",
      "💰 Net Worth",
      "Your <strong>total wealth</strong> across all wallets and goals. Updates with every transaction automatically.",
      "bottom",
      "start",
    );
    add(
      ".tour-income-expense",
      "📊 Income & Expense",
      "Two cards: <strong>green = Income</strong>, <strong>red = Expenses</strong>. Transfers between your own wallets are excluded for accuracy.",
      "bottom",
      "start",
    );
    add(
      ".tour-dash-snapshot",
      "📈 Financial Snapshot",
      "• <strong>Savings Rate</strong> — % of income you're keeping<br/>• <strong>Daily Burn</strong> — avg spend per day<br/>• <strong>Projected Spend</strong> — estimated total with ⚠️ overspend alerts",
      "top",
      "start",
    );
    add(
      ".tour-balance-trend",
      "📉 Balance Trend",
      "Interactive line chart showing <strong>how your balance changes over time</strong>. Spot patterns and track growth visually.",
      "top",
      "start",
    );
    add(
      ".tour-dash-wallet-flow",
      "🏦 Wallet Flow",
      "See money flowing <strong>in and out of each wallet</strong> individually. Understand your routing patterns at a glance.",
      "top",
      "start",
    );
    add(
      ".tour-dash-planned",
      "🛒 Planned Spending",
      "Total estimated cost of your <strong>active Shopping List</strong> items. Click to jump to your list.",
      "top",
      "start",
    );

    // FAB — final step of Phase 1
    if (document.querySelector(".tour-fab-add")) {
      steps.push({
        element: ".tour-fab-add",
        popover: {
          title: "＋ Add Transaction",
          description:
            "The <strong>most important button</strong> in Budgeity. Let's open it and walk through how to log expenses, income, and transfers!",
          side: "left",
          align: "end",
          onNextClick: () => {
            // Transition to Phase 2: open the modal
            isTransitioning.current = true;
            const fab = document.querySelector(".tour-fab-add") as HTMLElement;
            if (fab) fab.click();

            driverObj.current?.destroy();
            waitForElement(".tour-trans-type", () => {
              drivePhase2();
            });
          },
        },
      });
    }

    driverObj.current?.setSteps(steps);
    driverObj.current?.drive();
  };

  // ══════════════════════════════════════════════════════════════════════
  //  PHASE 2 — Inside the Add Transaction Modal
  // ══════════════════════════════════════════════════════════════════════

  const drivePhase2 = () => {
    createDriver();
    isTransitioning.current = false;

    const steps: any[] = [];

    // Type switcher
    if (document.querySelector(".tour-trans-type")) {
      steps.push({
        element: ".tour-trans-type",
        popover: {
          title: "💱 Transaction Type",
          description:
            "Toggle between <strong>Expense</strong>, <strong>Income</strong>, or <strong>Transfer</strong>. This determines how the amount affects your wallets.",
          side: "bottom",
          align: "start",
        },
      });
    }

    // Amount / Calculator
    if (document.querySelector(".tour-trans-amount")) {
      steps.push({
        element: ".tour-trans-amount",
        popover: {
          title: "🧮 Smart Calculator",
          description:
            "Type an amount using the number pad below. Supports <strong>math expressions</strong> like <code>50+30</code> or <code>1200÷4</code> — it auto-evaluates!",
          side: "top",
          align: "start",
        },
      });
    }

    // Next button — last step in modal, closes it
    if (document.querySelector(".tour-trans-next")) {
      steps.push({
        element: ".tour-trans-next",
        popover: {
          title: "➡️ Step Flow",
          description:
            "Tap <strong>Next</strong> to proceed through 3 steps:<br/>1. <strong>Amount</strong> + Wallet<br/>2. <strong>Category</strong> + Subcategory<br/>3. <strong>Details</strong> — Date, Notes, and Must/Need/Want spending tags<br/><br/>Let's close this and continue the tour!",
          side: "top",
          align: "start",
          onNextClick: () => {
            // Close the modal and move to Phase 3
            isTransitioning.current = true;
            const overlay = document.querySelector(
              ".tour-modal-overlay",
            ) as HTMLElement;
            if (overlay) overlay.click();

            driverObj.current?.destroy();
            setTimeout(() => drivePhase3(), 600);
          },
        },
      });
    }

    if (steps.length === 0) {
      // Modal didn't open — skip to Phase 3
      drivePhase3();
      return;
    }

    driverObj.current?.setSteps(steps);
    driverObj.current?.drive();
  };

  // ══════════════════════════════════════════════════════════════════════
  //  PHASE 3 — Sidebar Navigation (every page)
  // ══════════════════════════════════════════════════════════════════════

  const drivePhase3 = () => {
    createDriver();
    isTransitioning.current = false;

    const steps: any[] = [];

    const navStep = (selector: string, title: string, description: string) => {
      const el = document.querySelector(selector);
      if (el) {
        // Pre-scroll then add
        steps.push({
          element: selector,
          popover: {
            title,
            description,
            side: "right" as const,
            align: "start" as const,
            onNextClick: () => {
              // Pre-scroll the NEXT element before driver moves to it
              const currentIdx = steps.findIndex(
                (s: any) => s.element === selector,
              );
              const nextStep = steps[currentIdx + 1];
              if (nextStep?.element && nextStep.element !== "body") {
                scrollNavIntoView(nextStep.element);
              }
              setTimeout(() => driverObj.current?.moveNext(), 200);
            },
            onPrevClick: () => {
              const currentIdx = steps.findIndex(
                (s: any) => s.element === selector,
              );
              const prevStep = steps[currentIdx - 1];
              if (prevStep?.element && prevStep.element !== "body") {
                scrollNavIntoView(prevStep.element);
              }
              setTimeout(() => driverObj.current?.movePrevious(), 200);
            },
          },
        });
      }
    };

    // ── Main ──
    navStep(
      ".tour-nav-dashboard",
      "🏠 Dashboard",
      "Your <strong>command center</strong> — everything you just explored lives here. Fully customizable layout.",
    );
    navStep(
      ".tour-nav-transactions",
      "📝 Transactions",
      "The <strong>universal ledger</strong>. Every expense, income, and transfer with smart filters by date, category, wallet, and type. Full edit/delete support.",
    );
    navStep(
      ".tour-nav-wallets",
      "👛 Wallets",
      "Create unlimited <strong>Cash</strong>, <strong>Bank</strong>, and <strong>Savings</strong> accounts. Each tracks its own balance. Transfer money between wallets with full audit trail.",
    );

    // ── Insights ──
    navStep(
      ".tour-nav-analytics",
      "📊 Analytics",
      "Interactive charts: <strong>category breakdown</strong>, spending trends, <strong>budget vs actual</strong>, and household <strong>member filtering</strong>.",
    );
    navStep(
      ".tour-nav-analytics-v2",
      "📊 Analytics V2",
      "The <strong>next-generation</strong> analytics dashboard with even more visual insights, deeper drill-downs, and new chart types.",
    );
    navStep(
      ".tour-nav-reports",
      "📑 Reports",
      "Generate <strong>downloadable reports</strong> in PDF, CSV, or Excel. Filter by date range and wallet for tax season or personal records.",
    );

    // ── Planning ──
    navStep(
      ".tour-nav-budgets",
      "💵 Budgets",
      "Set <strong>monthly spending limits</strong> per category. Visual progress bars show how close you are. Overspending triggers red warnings.",
    );
    navStep(
      ".tour-nav-goals",
      "🎯 Savings Goals",
      "Create <strong>savings targets</strong> with name, amount, and deadline. Link a wallet and watch your <strong>progress bar</strong> fill up.",
    );
    navStep(
      ".tour-nav-subscriptions",
      "🔄 Subscriptions",
      "Automate <strong>rent, subscriptions, salary</strong> — any periodic transaction. Budgeity's engine auto-logs them on their due dates.",
    );
    navStep(
      ".tour-nav-shopping",
      "🛍️ Shopping List",
      "Plan purchases with <strong>estimated costs</strong>. Tap ✅ to mark bought — auto-creates an expense transaction and updates your accounts!",
    );

    // ── Management ──
    navStep(
      ".tour-nav-categories",
      "🏷️ Categories",
      "Fully customizable <strong>spending taxonomy</strong>. Add, reorder, or delete categories and subcategories to match your lifestyle.",
    );
    navStep(
      ".tour-nav-export",
      "📤 Export",
      "Download your financial data in <strong>PDF, Excel, or CSV</strong>. Choose date ranges and wallets. Your data is always yours.",
    );

    // ── General ──
    navStep(
      ".tour-nav-settings",
      "⚙️ Settings",
      "Configure <strong>currency</strong>, number system, <strong>App Lock</strong> (PIN/Pattern/Biometrics), language, and <strong>restart this tour</strong>.",
    );
    navStep(
      ".tour-nav-account",
      "🪪 Account Info",
      "View <strong>display name</strong>, login method, account creation date, and other profile details.",
    );
    navStep(
      ".tour-nav-whats-new",
      "✨ What's New",
      "Stay updated with <strong>every feature release</strong>, improvement, and fix. Never miss a new capability.",
    );

    // ── Finale ──
    steps.push({
      element: "body",
      popover: {
        title: "🚀 You're a Budgeity Pro!",
        description:
          "You've explored <strong>every corner</strong> of your financial command center:<br/><br/>✅ Log expenses from the <strong>＋ button</strong><br/>✅ Track progress on the <strong>Dashboard</strong><br/>✅ Set <strong>Budgets</strong> to control spending<br/>✅ Create <strong>Goals</strong> to save smarter<br/>✅ Automate with <strong>Recurring Rules</strong><br/>✅ <strong>Export</strong> data for your records<br/><br/>Restart this tour anytime from <strong>Settings</strong>. Happy budgeting! 🎉",
        side: "left",
        align: "start",
        onNextClick: () => {
          driverObj.current?.destroy();
          completeTour();
          isTourActive.current = false;
        },
      },
    });

    // Pre-scroll the first element before starting
    if (steps.length > 0 && steps[0].element !== "body") {
      scrollNavIntoView(steps[0].element);
    }

    driverObj.current?.setSteps(steps);
    driverObj.current?.drive();
  };

  return (
    <TourContext.Provider
      value={{ startTour, isTourActive: isTourActive.current }}
    >
      {children}
    </TourContext.Provider>
  );
};

export const useTour = () => {
  const context = useContext(TourContext);
  if (context === undefined) {
    throw new Error("useTour must be used within a TourProvider");
  }
  return context;
};
