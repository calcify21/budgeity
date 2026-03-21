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

export const TourProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { tourCompleted, completeTour, isLoadingData, isOnboarding } =
    useData();
  const driverObj = useRef<Driver | null>(null);
  const isTourActive = useRef(false);
  const isNavigating = useRef(false);

  // Initialize driver
  useEffect(() => {
    driverObj.current = driver({
      showProgress: true,
      animate: true,
      allowClose: true,
      steps: [], // Steps are defined dynamically based on route
      nextBtnText: "Next",
      prevBtnText: "Previous",
      doneBtnText: "Finish",
      onPopoverRender: (popover, { config, state }) => {
        // Custom styling or behavior if needed
      },
      onDestroyStarted: () => {
        if (isNavigating.current) {
          return true;
        }
        // Force save state when destroyed manually or by clicking overlay
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
  }, [completeTour]);

  const startTour = () => {
    if (!driverObj.current) return;

    // Clean up any existing tour to be safe
    driverObj.current.destroy();

    isTourActive.current = true;
    // localStorage.removeItem("budgeity_tour_completed"); // Reset for manual start (Optional: currently we don't have a manual restart button that calls this with intention to reset)

    // Start on Dashboard
    if (location.pathname !== "/dashboard") {
      navigate("/dashboard");
      setTimeout(() => driveDashboard(), 500);
    } else {
      driveDashboard();
    }
  };

  // Check for auto-start on mount (only once)
  useEffect(() => {
    // Wait for data to load from Firebase before deciding
    if (isLoadingData) return;

    const checkTour = () => {
      // Check both local storage (legacy/fallback) and backend state
      const localCompleted = localStorage.getItem("budgeity_tour_completed");
      const isCompleted = tourCompleted || localCompleted === "true";

      // Only start if not completed, not onboarding and we are on the dashboard
      if (
        !isCompleted &&
        !isOnboarding &&
        location.pathname === "/dashboard" &&
        !isTourActive.current
      ) {
        // Small delay to let UI render
        setTimeout(() => startTour(), 1000);
      }
    };

    checkTour();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tourCompleted, isLoadingData]); // Re-run when data loads or backend state syncs

  const driveDashboard = () => {
    driverObj.current?.setSteps([
      {
        element: "body", // General welcome
        popover: {
          title: "Welcome to Budgeity!",
          description:
            "Let us show you around your new financial command center.",
          side: "left",
          align: "start",
        },
      },
      {
        element: ".tour-net-worth",
        popover: {
          title: "Net Worth",
          description:
            "See your total wealth across all wallets and goals at a glance.",
          side: "bottom",
          align: "start",
        },
      },
      {
        element: ".tour-income-expense",
        popover: {
          title: "Income & Expense",
          description: "Track your monthly cash flow here.",
          side: "bottom",
          align: "start",
        },
      },
      {
        element: ".tour-balance-trend",
        popover: {
          title: "Balance Trend",
          description: "Visualize how your finances are growing over time.",
          side: "top",
          align: "start",
        },
      },
      {
        element: ".tour-dash-snapshot",
        popover: {
          title: "Analytics Snapshot",
          description:
            "Keep a close eye on your Savings Rate and Daily Burn to stay on track.",
          side: "top",
          align: "start",
        },
      },
      {
        element: ".tour-dash-planned",
        popover: {
          title: "Planned Spending",
          description:
            "Automatically tracks the total estimated cost of your active shopping list items.",
          side: "top",
          align: "start",
        },
      },
      {
        element: ".tour-dash-wallet-flow",
        popover: {
          title: "Wallet Flow Intelligence",
          description:
            "Instantly see how money is moving in and out of each specific wallet.",
          side: "top",
          align: "start",
        },
      },
      {
        element: ".tour-nav-workspace",
        popover: {
          title: "Workspace Switcher",
          description:
            "Seamlessly toggle between your Personal account and shared Households from here.",
          side: "bottom",
          align: "start",
        },
      },
      {
        element: ".tour-nav-profile",
        popover: {
          title: "Profile & Settings",
          description:
            "Access your account settings, theme toggle, and more from this new Google-style dropdown.",
          side: "bottom",
          align: "end",
        },
      },
      {
        element: ".tour-nav-analytics",
        popover: {
          title: "Analytics",
          description:
            "Ready to dive deep into your spending habits? Let's go!",
          side: "right",
          align: "start",
          onNextClick: () => {
            isNavigating.current = true;
            navigate("/analytics");
            setTimeout(() => driveAnalytics(), 500);
          },
        },
      },
    ]);
    driverObj.current?.drive();
  };

  const driveWallets = () => {
    driverObj.current?.destroy();
    isNavigating.current = false;
    driverObj.current?.setSteps([
      {
        element: ".tour-add-wallet",
        popover: {
          title: "Add Wallet",
          description:
            "Connect a new bank account or create a cash wallet manually. Let's try it out!",
          side: "bottom",
          align: "start",
          onNextClick: () => {
            // Programmatically click to open modal
            const btn = document.querySelector(
              ".tour-add-wallet",
            ) as HTMLElement;
            if (btn) {
              btn.click();
            } else {
              console.error("Tour: Add Wallet button not found");
            }

            // Move to next step after small delay
            setTimeout(() => {
              driverObj.current?.moveNext();
            }, 500);
          },
        },
      },
      {
        element: ".tour-wallet-name",
        popover: {
          title: "Name Your Wallet",
          description:
            "Give it a recognizable name like 'Salary Account' or 'Petty Cash'.",
          side: "top",
          align: "start",
        },
      },
      {
        element: ".tour-wallet-type",
        popover: {
          title: "Wallet Type",
          description: "Choose between Cash, Bank, or Savings (for goals).",
          side: "top",
          align: "start",
        },
      },
      {
        element: ".tour-wallet-balance",
        popover: {
          title: "Balance",
          description: "Enter the current amount in this account.",
          side: "top",
          align: "start",
        },
      },
      {
        element: ".tour-wallet-save",
        popover: {
          title: "Save It",
          description:
            "Click here to create your wallet. We'll skip saving for now.",
          side: "top",
          align: "start",
          onNextClick: () => {
            // Close modal by clicking overlay
            const overlay = document.querySelector(
              ".tour-modal-overlay",
            ) as HTMLElement;
            if (overlay) overlay.click();

            // Move next
            setTimeout(() => {
              driverObj.current?.moveNext();
            }, 500);
          },
        },
      },
      {
        element: ".tour-wallet-list",
        popover: {
          title: "Your Wallets",
          description:
            "All your accounts will be listed here. Click on one to edit or delete it.",
          side: "top",
          align: "start",
        },
      },
      {
        element: ".tour-nav-transactions",
        popover: {
          title: "Transactions",
          description:
            "Now, let's see where the magic happens - logging your spending.",
          side: "right",
          align: "start",
          onNextClick: () => {
            isNavigating.current = true;
            navigate("/transactions");
            setTimeout(() => driveTransactions(), 500);
          },
        },
      },
    ]);
    driverObj.current?.drive();
  };

  const driveTransactions = () => {
    driverObj.current?.destroy();
    isNavigating.current = false;
    driverObj.current?.setSteps([
      {
        element: ".tour-add-transaction",
        popover: {
          title: "Log Expenses",
          description: "Tap here to add a new income or expense record.",
          side: "bottom",
          align: "start",
          onNextClick: () => {
            const btn = document.querySelector(
              ".tour-add-transaction",
            ) as HTMLElement;
            if (btn) btn.click();
            setTimeout(() => driverObj.current?.moveNext(), 500);
          },
        },
      },
      {
        element: ".tour-trans-amount",
        popover: {
          title: "Amount",
          description: "Enter how much you spent or earned using the keypad.",
          side: "bottom",
          align: "start",
          onNextClick: () => {
            // Use the custom number pad to enter 150
            const pressKey = (keyClass: string, delay: number) => {
              setTimeout(() => {
                const btn = document.querySelector(keyClass) as HTMLElement;
                if (btn) btn.click();
              }, delay);
            };

            pressKey(".tour-numpad-1", 100);
            pressKey(".tour-numpad-5", 300);
            pressKey(".tour-numpad-0", 500);

            setTimeout(() => driverObj.current?.moveNext(), 800);
          },
        },
      },
      {
        element: ".tour-trans-next",
        popover: {
          title: "Next Step",
          description: "Click next to choose a category.",
          side: "left",
          align: "start",
          onNextClick: () => {
            const nextBtn = document.querySelector(
              ".tour-trans-next",
            ) as HTMLElement;
            if (nextBtn) nextBtn.click();
            setTimeout(() => driverObj.current?.moveNext(), 500);
          },
        },
      },
      {
        element: ".tour-trans-category",
        popover: {
          title: "Category",
          description:
            "Select what this transaction was for (e.g. Food, Transport).",
          side: "top",
          align: "start",
          onNextClick: () => {
            // Select first category
            const firstCatBtn = document.querySelector(
              ".tour-trans-category button",
            ) as HTMLElement;
            if (firstCatBtn) firstCatBtn.click();

            // Then click Next to go to Details
            // Note: Clicking category usually auto-advances or we hit next manually
            // AddTransactionModal logic: selecting category doesn't auto-advance in tour flow unless we click next
            const nextBtn = document.querySelector(
              ".tour-trans-next",
            ) as HTMLElement;
            if (nextBtn) setTimeout(() => nextBtn.click(), 300);

            setTimeout(() => driverObj.current?.moveNext(), 800);
          },
        },
      },
      {
        element: ".tour-trans-save",
        popover: {
          title: "Save It",
          description: "Confirm details and save. We'll close this for now.",
          side: "top",
          align: "start",
          onNextClick: () => {
            const overlay = document.querySelector(
              ".tour-modal-overlay",
            ) as HTMLElement;
            if (overlay) overlay.click();
            setTimeout(() => driverObj.current?.moveNext(), 500);
          },
        },
      },
      {
        element: ".tour-transaction-filters",
        popover: {
          title: "Filters",
          description:
            "Easily find past transactions by date, category, or wallet.",
          side: "bottom",
          align: "start",
        },
      },
      {
        element: ".tour-trans-details",
        popover: {
          title: "Detailed Audit Trail",
          description:
            "Every transaction now shows specific subcategories and who created it in your household.",
          side: "bottom",
          align: "start",
        },
      },
      {
        element: ".tour-nav-recurring",
        popover: {
          title: "Recurring Rules",
          description: "Automate your regular bills and subscriptions.",
          side: "right",
          align: "start",
          onNextClick: () => {
            isNavigating.current = true;
            navigate("/recurring");
            setTimeout(() => driveRecurring(), 500);
          },
        },
      },
    ]);
    driverObj.current?.drive();
  };

  const driveAnalytics = () => {
    driverObj.current?.destroy();
    isNavigating.current = false;
    driverObj.current?.setSteps([
      {
        element: ".tour-analytics-overview",
        popover: {
          title: "Financial Overview",
          description:
            "Get a bird's eye view of your spending, savings rate, and top categories.",
          side: "bottom",
          align: "start",
        },
      },
      {
        element: ".tour-analytics-charts",
        popover: {
          title: "Visual Insights",
          description:
            "Interactive charts help you understand where your money goes.",
          side: "top",
          align: "start",
        },
      },
      {
        element: ".tour-analytics-member",
        popover: {
          title: "Member Filter",
          description:
            "Analyze spending for the entire household or drill down into specific members.",
          side: "bottom",
          align: "start",
        },
      },
      {
        element: ".tour-analytics-budget-actual",
        popover: {
          title: "Budget vs Actual",
          description:
            "Instantly compare your planned category budgets against your real spending.",
          side: "top",
          align: "start",
        },
      },
      {
        element: ".tour-nav-transactions",
        popover: {
          title: "Transactions",
          description: "Let's review your detailed transaction log.",
          side: "right",
          align: "start",
          onNextClick: () => {
            isNavigating.current = true;
            navigate("/transactions");
            setTimeout(() => driveTransactions(), 500);
          },
        },
      },
    ]);
    driverObj.current?.drive();
  };

  const driveRecurring = () => {
    driverObj.current?.destroy();
    isNavigating.current = false;
    driverObj.current?.setSteps([
      {
        element: ".tour-recurring-add",
        popover: {
          title: "Automate Bills",
          description:
            "Create rules for rent, subscriptions, or salary to be logged automatically.",
          side: "bottom",
          align: "start",
        },
      },
      {
        element: ".tour-nav-goals",
        popover: {
          title: "Savings Goals",
          description: "Saving for a vacation or a new car? Set it up here.",
          side: "right",
          align: "start",
          onNextClick: () => {
            isNavigating.current = true;
            navigate("/goals");
            setTimeout(() => driveGoals(), 500);
          },
        },
      },
    ]);
    driverObj.current?.drive();
  };

  const driveGoals = () => {
    driverObj.current?.destroy();
    isNavigating.current = false;
    driverObj.current?.setSteps([
      {
        element: ".tour-goals-add",
        popover: {
          title: "Set a Target",
          description:
            "Create a savings goal and track your progress visually.",
          side: "bottom",
          align: "start",
          onNextClick: () => {
            const btn = document.querySelector(
              ".tour-goals-add",
            ) as HTMLElement;
            if (btn) btn.click();
            setTimeout(() => driverObj.current?.moveNext(), 500);
          },
        },
      },
      {
        element: ".tour-goal-name",
        popover: {
          title: "Goal Name",
          description: "What are you saving for?",
          side: "top",
          align: "start",
        },
      },
      {
        element: ".tour-goal-amount",
        popover: {
          title: "Target Amount",
          description: "How much do you need to save?",
          side: "top",
          align: "start",
        },
      },
      {
        element: ".tour-goal-save",
        popover: {
          title: "Create Goal",
          description: "Save your goal to start tracking.",
          side: "top",
          align: "start",
          onNextClick: () => {
            const overlay = document.querySelector(
              ".tour-modal-overlay",
            ) as HTMLElement;
            if (overlay) overlay.click();
            setTimeout(() => driverObj.current?.moveNext(), 500);
          },
        },
      },
      {
        element: ".tour-nav-budgets",
        popover: {
          title: "Budgets",
          description: "Keep your spending in check with monthly budgets.",
          side: "right",
          align: "start",
          onNextClick: () => {
            isNavigating.current = true;
            navigate("/budgets");
            setTimeout(() => driveBudgets(), 500);
          },
        },
      },
    ]);
    driverObj.current?.drive();
  };

  const driveBudgets = () => {
    driverObj.current?.destroy();
    isNavigating.current = false;
    driverObj.current?.setSteps([
      {
        element: ".tour-budgets-create",
        popover: {
          title: "Create Limits",
          description:
            "Set spending limits for specific categories like 'Food' or 'Entertainment'.",
          side: "bottom",
          align: "start",
          onNextClick: () => {
            const btn = document.querySelector(
              ".tour-budgets-create",
            ) as HTMLElement;
            if (btn) btn.click();
            setTimeout(() => driverObj.current?.moveNext(), 500);
          },
        },
      },
      {
        element: ".tour-budget-name",
        popover: {
          title: "Budget Name",
          description: "Name your budget (e.g. Monthly Grocery Limit).",
          side: "top",
          align: "start",
        },
      },
      {
        element: ".tour-budget-amount",
        popover: {
          title: "Spending Limit",
          description: "Set the maximum amount you want to spend.",
          side: "top",
          align: "start",
        },
      },
      {
        element: ".tour-budget-save",
        popover: {
          title: "Set Budget",
          description: "Activate this budget.",
          side: "top",
          align: "start",
          onNextClick: () => {
            const overlay = document.querySelector(
              ".tour-modal-overlay",
            ) as HTMLElement;
            if (overlay) overlay.click();
            setTimeout(() => driverObj.current?.moveNext(), 500);
          },
        },
      },
      {
        element: ".tour-nav-shopping",
        popover: {
          title: "Shopping List",
          description: "Never forget what to buy again.",
          side: "right",
          align: "start",
          onNextClick: () => {
            isNavigating.current = true;
            navigate("/shopping-list");
            setTimeout(() => driveShoppingList(), 500);
          },
        },
      },
    ]);
    driverObj.current?.drive();
  };

  const driveShoppingListPart3 = () => {
    driverObj.current?.destroy();
    isNavigating.current = false;
    driverObj.current?.setSteps([
      {
        element: ".tour-nav-categories",
        popover: {
          title: "Categories",
          description: "Customize how you organize your money.",
          side: "right",
          align: "start",
          onNextClick: () => {
            isNavigating.current = true;
            navigate("/categories");
            setTimeout(() => driveCategories(), 500);
          },
        },
      },
    ]);
    driverObj.current?.drive();
  };

  const driveShoppingListPart2 = () => {
    driverObj.current?.destroy();
    isNavigating.current = false;
    driverObj.current?.setSteps([
      {
        element: ".tour-shop-item-first",
        popover: {
          title: "Manage Items",
          description:
            "Here is your new item. You can edit, delete, or mark it as bought.",
          side: "top",
          align: "start",
        },
      },
      {
        element: ".tour-shop-check",
        popover: {
          title: "Mark as Bought",
          description:
            "Clicking this will automatically create an expense transaction for you!",
          side: "left",
          align: "start",
          onNextClick: () => {
            // Simulate checking off the item
            const checkBtn = document.querySelector(
              ".tour-shop-check",
            ) as HTMLElement;
            if (checkBtn) checkBtn.click();

            driverObj.current?.destroy(); // Protect against unmount crash

            let attempts = 0;
            const checkNext = setInterval(() => {
              if (document.querySelector(".tour-shop-confirm-amount")) {
                clearInterval(checkNext);
                driverObj.current?.setSteps([
                  {
                    element: ".tour-shop-confirm-amount",
                    popover: {
                      title: "Confirm Amount",
                      description: "Verify the final amount you spent.",
                      side: "top",
                      align: "start",
                    },
                  },
                  {
                    element: ".tour-shop-confirm-btn",
                    popover: {
                      title: "Complete Purchase",
                      description:
                        "Click to finalize the purchase and add it to your transactions.",
                      side: "top",
                      align: "start",
                      onNextClick: () => {
                        const confirmBtn = document.querySelector(
                          ".tour-shop-confirm-btn",
                        ) as HTMLElement;
                        if (confirmBtn) confirmBtn.click();

                        driverObj.current?.destroy();

                        let attempts2 = 0;
                        const checkNext2 = setInterval(() => {
                          if (!document.querySelector(".tour-modal-overlay")) {
                            clearInterval(checkNext2);
                            driveShoppingListPart3();
                          } else if (attempts2 > 20) {
                            clearInterval(checkNext2);
                            driveShoppingListPart3();
                          }
                          attempts2++;
                        }, 100);
                      },
                    },
                  },
                ]);
                driverObj.current?.drive();
              } else if (attempts > 20) {
                // Give up after ~2 seconds
                clearInterval(checkNext);
              }
              attempts++;
            }, 100);
          },
        },
      },
    ]);
    driverObj.current?.drive();
  };

  const driveShoppingList = () => {
    driverObj.current?.destroy();
    isNavigating.current = false;
    driverObj.current?.setSteps([
      {
        element: ".tour-shop-add-btn",
        popover: {
          title: "Quick Add",
          description:
            "Jot down items you need. You can 'buy' them later to turn them into transactions!",
          side: "bottom",
          align: "start",
          onNextClick: () => {
            const btn = document.querySelector(
              ".tour-shop-add-btn",
            ) as HTMLElement;
            if (btn) btn.click();
            setTimeout(() => driverObj.current?.moveNext(), 500);
          },
        },
      },
      {
        element: ".tour-shop-input-name",
        popover: {
          title: "Item Details",
          description: "What do you need to buy?",
          side: "top",
          align: "start",
          onNextClick: () => {
            const input = document.querySelector(
              ".tour-shop-input-name",
            ) as HTMLInputElement;
            if (input) {
              const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
                window.HTMLInputElement.prototype,
                "value",
              )?.set;
              nativeInputValueSetter?.call(input, "Tour Demo Item");
              const event = new Event("input", { bubbles: true });
              input.dispatchEvent(event);
            }
            setTimeout(() => driverObj.current?.moveNext(), 300);
          },
        },
      },
      {
        element: ".tour-shop-input-amount",
        popover: {
          title: "Estimated Cost",
          description: "How much will it cost? (Optional)",
          side: "top",
          align: "start",
          onNextClick: () => {
            const input = document.querySelector(
              ".tour-shop-input-amount",
            ) as HTMLInputElement;
            if (input) {
              const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
                window.HTMLInputElement.prototype,
                "value",
              )?.set;
              nativeInputValueSetter?.call(input, "15");
              const event = new Event("input", { bubbles: true });
              input.dispatchEvent(event);
            }
            setTimeout(() => driverObj.current?.moveNext(), 300);
          },
        },
      },
      {
        element: ".tour-shop-save-btn",
        popover: {
          title: "Add Item",
          description: "Click here to add it to your list.",
          side: "top",
          align: "start",
          onNextClick: () => {
            const btn = document.querySelector(
              ".tour-shop-save-btn",
            ) as HTMLElement;
            if (btn) btn.click();

            driverObj.current?.destroy(); // Protect against unmount crash

            let attempts = 0;
            const checkNext = setInterval(() => {
              if (document.querySelector(".tour-shop-item-first")) {
                clearInterval(checkNext);
                driveShoppingListPart2();
              } else if (attempts > 20) {
                // Give up after ~2 seconds
                clearInterval(checkNext);
                driveShoppingListPart2();
              }
              attempts++;
            }, 100);
          },
        },
      },
    ]);
    driverObj.current?.drive();
  };

  const driveCategories = () => {
    driverObj.current?.destroy();
    isNavigating.current = false;
    driverObj.current?.setSteps([
      {
        element: ".tour-categories-add",
        popover: {
          title: "Custom Categories",
          description: "Add or reorder categories to match your lifestyle.",
          side: "bottom",
          align: "start",
        },
      },
      {
        element: ".tour-nav-export",
        popover: {
          title: "Export Data",
          description: "Need your data elsewhere? Let's see export options.",
          side: "right",
          align: "start",
          onNextClick: () => {
            isNavigating.current = true;
            navigate("/export");
            setTimeout(() => driveExport(), 500);
          },
        },
      },
    ]);
    driverObj.current?.drive();
  };

  const driveExport = () => {
    driverObj.current?.destroy();
    isNavigating.current = false;
    driverObj.current?.setSteps([
      {
        element: ".tour-export-config",
        popover: {
          title: "Filter Reports",
          description:
            "Select date ranges or specific wallets for your report.",
          side: "bottom",
          align: "start",
          onNextClick: () => {
            // Move next
            setTimeout(() => {
              driverObj.current?.moveNext();
            }, 300);
          },
        },
      },
      {
        element: ".tour-export-actions",
        popover: {
          title: "Download",
          description: "Get your data in PDF, Excel, or CSV formats.",
          side: "top",
          align: "start",
        },
      },
      {
        element: "body",
        popover: {
          title: "You're All Set!",
          description:
            "You've mastered Budgeity! Explore the Settings if you need to customize more.",
          side: "left",
          align: "start",
          onNextClick: () => {
            driverObj.current?.destroy();
            completeTour();
            isTourActive.current = false;
            navigate("/dashboard");
          },
        },
      },
    ]);
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
