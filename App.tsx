import React from "react";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { DataProvider, useData } from "./context/DataContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { HouseholdProvider, useHousehold } from "./context/HouseholdContext";
import { ToastProvider } from "./context/ToastContext";
import { TourProvider } from "./context/TourContext";
import { AppLockProvider, useAppLock } from "./context/AppLockContext";
import Layout from "./components/Layout";
import OnboardingWizard from "./components/OnboardingWizard";
import { Loader2, Wallet, Activity, Database, Repeat } from "lucide-react";
import { processRecurringTransactions } from "./services/recurringEngine";
import { motion, AnimatePresence } from "framer-motion";

const SecurityOverlay = React.lazy(() => import("./components/applock/SecurityOverlay"));

const Dashboard = React.lazy(() => import("./pages/Dashboard"));
const Wallets = React.lazy(() => import("./pages/Wallets"));
const Transactions = React.lazy(() => import("./pages/Transactions"));
const Categories = React.lazy(() => import("./pages/Categories"));
const Analytics = React.lazy(() => import("./pages/Analytics"));
const AnalyticsV2 = React.lazy(() => import("./pages/AnalyticsV2"));
const Budgets = React.lazy(() => import("./pages/Budgets"));
const Goals = React.lazy(() => import("./pages/Goals"));
const Subscriptions = React.lazy(() => import("./pages/Subscriptions"));
const Export = React.lazy(() => import("./pages/Export"));
const Reports = React.lazy(() => import("./pages/Reports"));
const ShoppingList = React.lazy(() => import("./pages/ShoppingList"));
const Settings = React.lazy(() => import("./pages/Settings"));
const AccountInfo = React.lazy(() => import("./pages/AccountInfo"));
const HouseholdSettings = React.lazy(() => import("./pages/HouseholdSettings"));
const WhatsNew = React.lazy(() => import("./pages/WhatsNew"));
const AdminFeedback = React.lazy(() => import("./pages/AdminFeedback"));
const AdminReferrals = React.lazy(() => import("./pages/AdminReferrals"));

const LandingPage = React.lazy(() => import("./pages/LandingPage"));
const Auth = React.lazy(() => import("./pages/Auth"));
const AuthAction = React.lazy(() => import("./pages/AuthAction"));
const Logout = React.lazy(() => import("./pages/Logout"));
const PrivacyPolicy = React.lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = React.lazy(() => import("./pages/TermsOfService"));

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-black text-brand-600">
        <Loader2 size={40} className="animate-spin" />
      </div>
    );
  }

  // If no user, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

/** Gate component: shows SecurityOverlay when locked, otherwise renders children */
const AppLockGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isLockEnabled, isUnlocked } = useAppLock();

  if (isLockEnabled && !isUnlocked) {
    return (
      <React.Suspense fallback={<div className="min-h-screen bg-black" />}>
        <SecurityOverlay />
      </React.Suspense>
    );
  }

  return <>{children}</>;
};

const AppContent: React.FC = () => {
  const {
    isOnboarding,
    isLoadingData,
    recurringTransactions,
    transactions,
    wallets,
    goals,
    syncEngineResults,
  } = useData();

  const { activeWorkspace, currentHousehold } = useHousehold();
  const [loadingProgress, setLoadingProgress] = React.useState(0);
  const [showLoader, setShowLoader] = React.useState(true);
  const [isProcessingRecurring, setIsProcessingRecurring] =
    React.useState(false);

  React.useEffect(() => {
    if (isLoadingData) {
      setShowLoader(true);
      const interval = setInterval(() => {
        setLoadingProgress((prev) => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 10;
        });
      }, 200);
      return () => clearInterval(interval);
    } else {
      setLoadingProgress(100);
      // Small buffer to allow the 100% animation to be seen
      const timeout = setTimeout(() => {
        setShowLoader(false);
      }, 300);
      return () => clearTimeout(timeout);
    }
  }, [isLoadingData]);

  // Run the background recurring engine whenever data loads or rules change
  React.useEffect(() => {
    if (isLoadingData) return;

    const result = processRecurringTransactions(
      recurringTransactions,
      transactions,
      wallets,
      goals,
    );

    if (result) {
      if (!result.isComplete) {
        setIsProcessingRecurring(true);
      } else {
        setIsProcessingRecurring(false);
      }

      console.log(
        "Recurring engine generated transactions:",
        result.newTransactions.length,
      );

      // Sync everything at once atomically to prevent render loops
      syncEngineResults(
        result.newTransactions,
        result.updatedRules,
        result.updatedWallets,
        result.updatedGoals,
      );
    } else {
      setIsProcessingRecurring(false);
    }
  }, [
    isLoadingData,
    recurringTransactions.map((r) => r.nextDueDate).join(","),
  ]);

  if (showLoader || isLoadingData) {
    const isHousehold = activeWorkspace?.type === "household";
    const title = isHousehold
      ? `Loading ${currentHousehold?.name || "Household"}...`
      : "Loading your Personal Space...";

    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-black p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full flex flex-col items-center text-center space-y-6"
        >
          {/* Animated Icons */}
          <div className="relative w-24 h-24 flex items-center justify-center">
            <div className="absolute inset-0 bg-brand-500/20 rounded-full animate-ping" />
            <div className="relative w-16 h-16 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-lg flex items-center justify-center text-brand-500 shrink-0">
              {isHousehold ? <Database size={32} /> : <Wallet size={32} />}
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">
              {title}
            </h2>
            <p className="text-sm text-slate-500 dark:text-zinc-400">
              Securely loading your wallets, analytics, and upcoming
              reminders...
            </p>
          </div>

          {/* Simulated Progress Bar */}
          <div className="w-full space-y-2">
            <div className="h-2 w-full bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-brand-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(loadingProgress, 100)}%` }}
                transition={{ ease: "linear" }}
              />
            </div>
            <div className="flex justify-between text-xs font-bold text-slate-400">
              <span>Synchronizing</span>
              <span>{Math.floor(loadingProgress)}%</span>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // Full-screen wizard takes over when onboarding
  if (isOnboarding) {
    return <OnboardingWizard />;
  }

  return (
    <>
      <AnimatePresence>
        {isProcessingRecurring && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-8 right-8 z-[100] bg-slate-900 border border-slate-700 text-white px-6 py-4 rounded-3xl shadow-2xl flex items-center gap-4"
          >
            <div className="relative">
              <div className="w-8 h-8 rounded-full border-2 border-brand-500/20 border-t-brand-500 animate-spin" />
              <Repeat
                size={14}
                className="absolute inset-0 m-auto text-brand-500"
              />
            </div>
            <div>
              <p className="text-sm font-bold">Synchronizing History</p>
              <p className="text-[10px] text-slate-400 font-medium">
                Processing recurring transactions...
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <TourProvider>
        <Layout>
          <React.Suspense
            fallback={
              <div className="min-h-[60vh] flex items-center justify-center text-brand-600">
                <Loader2 size={28} className="animate-spin" />
              </div>
            }
          >
            <Routes>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/wallets" element={<Wallets />} />
              <Route path="/transactions" element={<Transactions />} />
              <Route path="/budgets" element={<Budgets />} />
              <Route path="/goals" element={<Goals />} />
              <Route path="/subscriptions" element={<Subscriptions />} />
              <Route path="/recurring" element={<Navigate to="/subscriptions" replace />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/analytics-v2" element={<AnalyticsV2 />} />
              <Route path="/categories" element={<Categories />} />
              <Route path="/export" element={<Export />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/shopping-list" element={<ShoppingList />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/account-info" element={<AccountInfo />} />
              <Route
                path="/household-settings"
                element={<HouseholdSettings />}
              />

              <Route path="/whats-new" element={<WhatsNew />} />
              <Route path="/admin/feedback" element={<AdminFeedback />} />
              <Route path="/admin/referrals" element={<AdminReferrals />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </React.Suspense>
        </Layout>
      </TourProvider>
    </>
  );
};

const App: React.FC = () => {
  return (
    <ToastProvider>
      <AuthProvider>
        <HouseholdProvider>
          <DataProvider>
            <HashRouter
              future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
            >
              <Routes>
                <Route
                  path="/"
                  element={
                    <React.Suspense fallback={<div />}>
                      <LandingPage />
                    </React.Suspense>
                  }
                />
                <Route
                  path="/login"
                  element={
                    <React.Suspense fallback={<div />}>
                      <Auth />
                    </React.Suspense>
                  }
                />
                <Route
                  path="/logout"
                  element={
                    <React.Suspense fallback={<div />}>
                      <Logout />
                    </React.Suspense>
                  }
                />
                <Route
                  path="/auth/action"
                  element={
                    <React.Suspense fallback={<div />}>
                      <AuthAction />
                    </React.Suspense>
                  }
                />
                <Route
                  path="/privacy-policy"
                  element={
                    <React.Suspense fallback={<div />}>
                      <PrivacyPolicy />
                    </React.Suspense>
                  }
                />
                <Route
                  path="/terms-of-service"
                  element={
                    <React.Suspense fallback={<div />}>
                      <TermsOfService />
                    </React.Suspense>
                  }
                />

                {/* Protected Routes */}
                <Route
                  path="/*"
                  element={
                    <ProtectedRoute>
                      <AppLockProvider>
                        <AppLockGate>
                          <AppContent />
                        </AppLockGate>
                      </AppLockProvider>
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </HashRouter>
          </DataProvider>
        </HouseholdProvider>
      </AuthProvider>
    </ToastProvider>
  );
};

export default App;
