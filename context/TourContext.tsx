import React, { createContext, useContext, useEffect, useRef } from "react";
import { driver, Driver } from "driver.js";
import "driver.js/dist/driver.css";
import { useLocation, useNavigate } from "react-router-dom";
import { useData } from "./DataContext";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();
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
      nextBtnText: t("tour.nextBtnText"),
      prevBtnText: t("tour.prevBtnText"),
      doneBtnText: t("tour.doneBtnText"),
      progressText: `${t("tour.progressCurrent")} {{current}} ${t("tour.progressOf")} {{total}}`,
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
  }, [completeTour, t]);

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
      t("tour.welcome_title"),
      t("tour.welcome_desc"),
      "left",
      "start",
    );

    // Header
    add(
      ".tour-nav-workspace",
      t("tour.workspace_switcher_title"),
      t("tour.workspace_switcher_desc"),
      "bottom",
      "start",
    );
    add(
      ".tour-nav-theme",
      t("tour.theme_toggle_title"),
      t("tour.theme_toggle_desc"),
      "bottom",
      "end",
    );
    add(
      ".tour-nav-lock",
      t("tour.instant_app_lock_title"),
      t("tour.instant_app_lock_desc"),
      "bottom",
      "end",
    );
    add(
      ".tour-nav-profile",
      t("tour.profile_menu_title"),
      t("tour.profile_menu_desc"),
      "bottom",
      "end",
    );

    // Dashboard controls
    add(
      ".tour-dash-time-range",
      t("tour.time_range_title"),
      t("tour.time_range_desc"),
      "bottom",
      "end",
    );
    add(
      ".tour-dash-edit-layout",
      t("tour.edit_layout_title"),
      t("tour.edit_layout_desc"),
      "bottom",
      "end",
    );

    // Widgets
    add(
      ".tour-net-worth",
      t("tour.net_worth_title"),
      t("tour.net_worth_desc"),
      "bottom",
      "start",
    );
    add(
      ".tour-income-expense",
      t("tour.income_expense_title"),
      t("tour.income_expense_desc"),
      "bottom",
      "start",
    );
    add(
      ".tour-dash-snapshot",
      t("tour.snapshot_title"),
      t("tour.snapshot_desc"),
      "top",
      "start",
    );
    add(
      ".tour-balance-trend",
      t("tour.balance_trend_title"),
      t("tour.balance_trend_desc"),
      "top",
      "start",
    );
    add(
      ".tour-dash-wallet-flow",
      t("tour.wallet_flow_title"),
      t("tour.wallet_flow_desc"),
      "top",
      "start",
    );
    add(
      ".tour-dash-planned",
      t("tour.planned_spending_title"),
      t("tour.planned_spending_desc"),
      "top",
      "start",
    );

    // FAB — final step of Phase 1
    const resolvedFabSelector = window.innerWidth < 1024 ? ".bottom-nav-floating .tour-fab-add" : ".tour-fab-add";
    if (document.querySelector(resolvedFabSelector)) {
      steps.push({
        element: resolvedFabSelector,
        popover: {
          title: t("tour.add_transaction_title"),
          description: t("tour.add_transaction_desc"),
          side: window.innerWidth < 1024 ? "top" : "left",
          align: "end",
          onNextClick: () => {
            // Transition to Phase 2: open the modal
            isTransitioning.current = true;
            const fab = document.querySelector(resolvedFabSelector) as HTMLElement;
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
          title: t("tour.transaction_type_title"),
          description: t("tour.transaction_type_desc"),
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
          title: t("tour.smart_calculator_title"),
          description: t("tour.smart_calculator_desc"),
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
          title: t("tour.step_flow_title"),
          description: t("tour.step_flow_desc"),
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

    const isMobile = window.innerWidth < 1024;

    if (isMobile) {
      isTransitioning.current = true;
      // Open the bottom sheet More Menu programmatically
      const moreBtn = document.querySelector(".tour-nav-more") as HTMLElement;
      if (moreBtn) moreBtn.click();

      waitForElement(".tour-nav-more-sheet .tour-nav-dashboard", () => {
        isTransitioning.current = false;
        driveMobilePhase3();
      });
      return;
    }

    // ── Desktop Sidebar Flow ──
    const steps: any[] = [];

    const navStep = (selector: string, title: string, description: string) => {
      const el = document.querySelector(selector);
      if (el) {
        steps.push({
          element: selector,
          popover: {
            title,
            description,
            side: "right" as const,
            align: "start" as const,
            onNextClick: () => {
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
      t("tour.dashboard_title"),
      t("tour.dashboard_desc"),
    );
    navStep(
      ".tour-nav-transactions",
      t("tour.transactions_title"),
      t("tour.transactions_desc"),
    );
    navStep(
      ".tour-nav-wallets",
      t("tour.wallets_title"),
      t("tour.wallets_desc"),
    );

    // ── Insights ──
    navStep(
      ".tour-nav-analytics",
      t("tour.analytics_title"),
      t("tour.analytics_desc"),
    );
    navStep(
      ".tour-nav-analytics-v2",
      t("tour.analytics_v2_title"),
      t("tour.analytics_v2_desc"),
    );
    navStep(
      ".tour-nav-reports",
      t("tour.reports_title"),
      t("tour.reports_desc"),
    );

    // ── Planning ──
    navStep(
      ".tour-nav-budgets",
      t("tour.budgets_title"),
      t("tour.budgets_desc"),
    );
    navStep(
      ".tour-nav-goals",
      t("tour.goals_title"),
      t("tour.goals_desc"),
    );
    navStep(
      ".tour-nav-subscriptions",
      t("tour.subscriptions_title"),
      t("tour.subscriptions_desc"),
    );
    navStep(
      ".tour-nav-shopping",
      t("tour.shopping_title"),
      t("tour.shopping_desc"),
    );

    // ── Management ──
    navStep(
      ".tour-nav-categories",
      t("tour.categories_title"),
      t("tour.categories_desc"),
    );
    navStep(
      ".tour-nav-export",
      t("tour.export_title"),
      t("tour.export_desc"),
    );

    // ── General ──
    navStep(
      ".tour-nav-settings",
      t("tour.settings_title"),
      t("tour.settings_desc"),
    );
    navStep(
      ".tour-nav-account",
      t("tour.account_title"),
      t("tour.account_desc"),
    );

    // ── Desktop Finale ──
    steps.push({
      element: "body",
      popover: {
        title: t("tour.finale_title"),
        description: t("tour.finale_desc"),
        side: "left" as const,
        align: "start" as const,
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

  // ══════════════════════════════════════════════════════════════════════
  //  MOBILE PHASE 3 — Unified Highlight Flow inside open More Menu Sheet
  // ══════════════════════════════════════════════════════════════════════

  const driveMobilePhase3 = () => {
    createDriver();
    isTransitioning.current = false;
    const steps: any[] = [];

    const sheetSelector = (selector: string) =>
      `.tour-nav-more-sheet ${selector}`;

    const sheetStep = (selector: string, title: string, description: string, isLast = false) => {
      const scopedSelector = sheetSelector(selector);
      const el = document.querySelector(scopedSelector);
      if (el) {
        steps.push({
          element: scopedSelector,
          popover: {
            title,
            description,
            side: "top" as const,
            align: "start" as const,
            onNextClick: () => {
              if (isLast) {
                // Close sheet and go to Finale
                isTransitioning.current = true;
                const closeBtn = document.querySelector(".tour-nav-more-close") as HTMLElement;
                if (closeBtn) closeBtn.click();

                driverObj.current?.destroy();
                setTimeout(() => {
                  driveFinale();
                }, 400);
              } else {
                // Pre-scroll the next sheet item
                const currentIdx = steps.findIndex(
                  (s: any) => s.element === scopedSelector,
                );
                const nextStep = steps[currentIdx + 1];
                if (nextStep?.element) {
                  scrollNavIntoView(nextStep.element);
                }
                setTimeout(() => driverObj.current?.moveNext(), 200);
              }
            },
            onPrevClick: () => {
              // Pre-scroll the previous sheet item
              const currentIdx = steps.findIndex(
                (s: any) => s.element === scopedSelector,
              );
              const prevStep = steps[currentIdx - 1];
              if (prevStep?.element) {
                scrollNavIntoView(prevStep.element);
              }
              setTimeout(() => driverObj.current?.movePrevious(), 200);
            }
          }
        });
      }
    };

    sheetStep(".tour-nav-dashboard", t("tour.dashboard_title"), t("tour.dashboard_desc"), false);
    sheetStep(".tour-nav-transactions", t("tour.transactions_title"), t("tour.transactions_desc"), false);
    sheetStep(".tour-nav-wallets", t("tour.wallets_title"), t("tour.wallets_desc"), false);
    sheetStep(".tour-nav-analytics", t("tour.analytics_title"), t("tour.analytics_desc"), false);
    sheetStep(".tour-nav-analytics-v2", t("tour.analytics_v2_title"), t("tour.analytics_v2_desc"), false);
    sheetStep(".tour-nav-reports", t("tour.reports_title"), t("tour.reports_desc"), false);
    sheetStep(".tour-nav-budgets", t("tour.budgets_title"), t("tour.budgets_desc"), false);
    sheetStep(".tour-nav-goals", t("tour.goals_title"), t("tour.goals_desc"), false);
    sheetStep(".tour-nav-subscriptions", t("tour.subscriptions_title"), t("tour.subscriptions_desc"), false);
    sheetStep(".tour-nav-shopping", t("tour.shopping_title"), t("tour.shopping_desc"), false);
    sheetStep(".tour-nav-categories", t("tour.categories_title"), t("tour.categories_desc"), false);
    sheetStep(".tour-nav-export", t("tour.export_title"), t("tour.export_desc"), false);
    sheetStep(".tour-nav-settings", t("tour.settings_title"), t("tour.settings_desc"), false);
    sheetStep(".tour-nav-account", t("tour.account_title"), t("tour.account_desc"), true);

    // Pre-scroll first element
    if (steps.length > 0) {
      scrollNavIntoView(steps[0].element);
    }

    driverObj.current?.setSteps(steps);
    driverObj.current?.drive();
  };

  // ══════════════════════════════════════════════════════════════════════
  //  FINALE — Universal App Tour Completion Modal
  // ══════════════════════════════════════════════════════════════════════

  const driveFinale = () => {
    createDriver();
    isTransitioning.current = false;
    const steps = [
      {
        element: "body",
        popover: {
          title: t("tour.finale_title"),
          description: t("tour.finale_desc"),
          side: "left" as const,
          align: "start" as const,
          onNextClick: () => {
            driverObj.current?.destroy();
            completeTour();
            isTourActive.current = false;
          },
        },
      }
    ];
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
