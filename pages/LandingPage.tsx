import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  ArrowRight,
  CheckCircle,
  Shield,
  BarChart3,
  Globe,
  Smartphone,
  CreditCard,
  PieChart,
  Target,
  RefreshCw,
  Download,
  Cloud,
  Moon,
  Sun,
} from "lucide-react";
import { useData } from "../context/DataContext";
import { motion, useScroll, useTransform } from "framer-motion";
import logo from "../assets/logo-927x1024.png";
import dashboardImg from "../assets/insideScreenshots/dashboard.png";
import walletsImg from "../assets/insideScreenshots/wallets.png";
import analyticsImg from "../assets/insideScreenshots/analytics.png";
import transactionsImg from "../assets/insideScreenshots/transactions_list.png";
import goalsImg from "../assets/insideScreenshots/goals.png";
import shoppingListImg from "../assets/insideScreenshots/shopping-list.png";
import newModalImg from "../assets/insideScreenshots/new-add-transaction-modal.png";

// Components for the Landing Page
const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          <div className="flex-1 text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 text-sm font-medium mb-6">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500"></span>
                </span>
                v2.0 is now live
              </div>
              <h1 className="text-5xl lg:text-7xl font-bold tracking-tight text-slate-900 dark:text-white mb-6 leading-tight">
                Take control of <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-indigo-600">
                  your money
                </span>
                <br /> without spreadsheets.
              </h1>
              <p className="text-xl text-slate-600 dark:text-slate-300 mb-8 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                Track expenses, wallets, budgets, goals, and analytics in one
                smart dashboard. Designed for modern financial freedom.
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                <button
                  onClick={() => navigate("/login?mode=signup")}
                  className="px-8 py-4 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl font-bold transition-all hover:scale-105 active:scale-95 shadow-lg shadow-brand-500/25 flex items-center gap-2"
                >
                  Get Started Free
                  <ArrowRight className="w-5 h-5" />
                </button>
                <button
                  onClick={() => navigate("/login")}
                  className="px-8 py-4 bg-white dark:bg-zinc-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-zinc-800 rounded-2xl font-bold transition-all hover:bg-slate-50 dark:hover:bg-zinc-800"
                >
                  Login
                </button>
              </div>
            </motion.div>
          </div>

          <div className="flex-1 relative w-full max-w-[500px] lg:max-w-none">
            {/* Phone Mockups Stack */}
            <div className="relative h-[600px] w-full perspective-1000">
              {/* Back Phone - Wallets */}
              <motion.div
                initial={{ opacity: 0, x: 20, rotateY: -10 }}
                animate={{ opacity: 0.8, x: 40, rotateY: -15, y: 40 }}
                transition={{ delay: 0.2, duration: 0.8 }}
                className="absolute right-0 top-10 w-[280px] h-[580px] bg-slate-900 rounded-[3rem] border-8 border-slate-800 shadow-2xl overflow-hidden z-0 opacity-60 transform scale-90 hidden lg:block"
              >
                <img
                  src={walletsImg}
                  alt="Wallets"
                  className="w-full h-full object-cover object-top opacity-50"
                />
              </motion.div>

              {/* Middle Phone - Transactions */}
              <motion.div
                initial={{ opacity: 0, x: -20, rotateY: 10 }}
                animate={{ opacity: 0.9, x: -40, rotateY: 15, y: 20 }}
                transition={{ delay: 0.4, duration: 0.8 }}
                className="absolute left-0 top-5 w-[280px] h-[580px] bg-slate-900 rounded-[3rem] border-8 border-slate-800 shadow-2xl overflow-hidden z-10 opacity-80 transform scale-95 hidden lg:block"
              >
                <img
                  src={transactionsImg}
                  alt="Transactions"
                  className="w-full h-full object-cover object-top opacity-60"
                />
              </motion.div>

              {/* Front Phone - Dashboard */}
              <motion.div
                initial={{ opacity: 0, y: 40, x: "-50%" }}
                animate={{ opacity: 1, y: 0, x: "-50%" }}
                transition={{ delay: 0.6, duration: 0.8 }}
                className="absolute left-1/2 top-0 w-[300px] h-[600px] bg-black rounded-[3rem] border-8 border-slate-800 shadow-2xl overflow-hidden z-20"
              >
                <div className="w-full h-full bg-slate-900 flex flex-col relative">
                  {/* Notch */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-black rounded-b-xl z-30"></div>

                  {/* Mock UI Header */}
                  <div className="p-6 pt-12 bg-slate-900">
                    <div className="h-8 w-8 rounded-full bg-slate-700 mb-4"></div>
                    <div className="h-4 w-32 bg-slate-700 rounded mb-2"></div>
                    <div className="h-8 w-48 bg-brand-500 rounded-lg"></div>
                  </div>

                  {/* Mock UI Content */}
                  <div className="flex-1 bg-slate-950 p-4 space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="h-24 bg-slate-900 rounded-xl"></div>
                      <div className="h-24 bg-slate-900 rounded-xl"></div>
                    </div>
                    <div className="h-40 bg-slate-900 rounded-xl"></div>
                    <div className="h-16 bg-slate-900 rounded-xl"></div>
                    <div className="h-16 bg-slate-900 rounded-xl"></div>
                    <div className="h-16 bg-slate-900 rounded-xl"></div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Background gradients */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute -top-[20%] -right-[10%] w-[50%] h-[50%] bg-brand-500/10 rounded-full blur-[120px]" />
        <div className="absolute top-[20%] -left-[10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[120px]" />
      </div>
    </section>
  );
};

const FeaturesSection = () => {
  const features = [
    {
      icon: <RefreshCw className="w-6 h-6" />,
      title: "Track Everything",
      desc: "Log daily expenses and income in seconds.",
    },
    {
      icon: <CreditCard className="w-6 h-6" />,
      title: "Multiple Wallets",
      desc: "Manage Cash, Bank Accounts, and Cards.",
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: "Beautiful Analytics",
      desc: "Visualize your spending habits clearly.",
    },
    {
      icon: <Target className="w-6 h-6" />,
      title: "Budgets & Goals",
      desc: "Set limits and save for your dreams.",
    },
    {
      icon: <RefreshCw className="w-6 h-6" />,
      title: "Recurring Bills",
      desc: "Never miss a subscription payment again.",
    },
    {
      icon: <Download className="w-6 h-6" />,
      title: "Easy Export",
      desc: "Download data to Excel, PDF, or CSV.",
    },
    {
      icon: <Cloud className="w-6 h-6" />,
      title: "Cloud Sync",
      desc: "Real-time sync across all your devices.",
    },
  ];

  return (
    <section className="py-24 bg-white dark:bg-zinc-900/50">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white mb-4">
            Everything you need to master your money
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-lg">
            Powerful features wrapped in a simple, elegant interface.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {features.map((feature, idx) => (
            <div
              key={idx}
              className="p-6 rounded-3xl bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 hover:border-brand-500/30 transition-all hover:shadow-xl hover:shadow-brand-500/5 group"
            >
              <div className="w-12 h-12 rounded-2xl bg-white dark:bg-zinc-800 flex items-center justify-center text-brand-600 mb-4 group-hover:bg-brand-500 group-hover:text-white transition-colors shadow-sm">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-slate-500 dark:text-slate-400">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const DifferenceSection = () => {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-3xl lg:text-5xl font-bold text-slate-900 dark:text-white mb-8">
              Why Budgeity?
            </h2>
            <div className="space-y-8">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 shrink-0">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                    Privacy First
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    Your financial data is yours alone. We don't sell or share
                    your personal information with anyone.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 shrink-0">
                  <PieChart className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                    Smart Analytics
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    Deep insights into your spending patterns. Understand where
                    every rupee goes.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 shrink-0">
                  <Globe className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                    Global Support
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    Built with support for all currencies and both Indian and
                    International number systems.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 shrink-0">
                  <Smartphone className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                    Fast & Offline Friendly
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    Works seamlessly even with spotty internet. Your data syncs
                    when you're back online.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="aspect-[4/5] rounded-[3rem] bg-indigo-600/5 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 p-8 flex items-center justify-center relative backdrop-blur-sm">
              <div className="absolute inset-0 flex items-center justify-center p-8">
                {/* Phone Mockup */}
                <div className="relative w-full max-w-[280px] aspect-[9/19] bg-slate-900 rounded-[2.5rem] border-8 border-slate-800 shadow-2xl overflow-hidden">
                  {/* Notch */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-950 rounded-b-xl z-20"></div>

                  {/* Screen Content */}
                  <div className="w-full h-full bg-slate-800 relative group">
                    <img
                      src={analyticsImg}
                      alt="Analytics Preview"
                      className="w-full h-full object-cover"
                    />
                    {/* Overlay gradient for depth */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 to-transparent pointer-events-none"></div>
                  </div>
                </div>
              </div>

              {/* Floating elements */}
              <motion.div
                animate={{ y: [0, -20, 0] }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute top-20 right-10 bg-white dark:bg-zinc-800 p-4 rounded-2xl shadow-xl flex items-center gap-3 border border-slate-100 dark:border-zinc-700"
              >
                <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                  <ArrowRight className="w-5 h-5 -rotate-45" />
                </div>
                <div className="text-sm">
                  <p className="text-slate-500 dark:text-slate-400">Income</p>
                  <p className="font-bold text-slate-900 dark:text-white">
                    + ₹45,000
                  </p>
                </div>
              </motion.div>

              <motion.div
                animate={{ y: [0, 20, 0] }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 1,
                }}
                className="absolute bottom-32 left-10 bg-white dark:bg-zinc-800 p-4 rounded-2xl shadow-xl flex items-center gap-3 border border-slate-100 dark:border-zinc-700"
              >
                <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
                  <ArrowRight className="w-5 h-5 rotate-45" />
                </div>
                <div className="text-sm">
                  <p className="text-slate-500 dark:text-slate-400">Expense</p>
                  <p className="font-bold text-slate-900 dark:text-white">
                    - ₹1,250
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const ScreenshotCard = ({
  img,
  title,
  description,
}: {
  img: string;
  title: string;
  description: string;
}) => (
  <div className="group space-y-4">
    <div className="relative mx-auto border-gray-800 dark:border-gray-800 bg-gray-800 border-[10px] rounded-[2.5rem] h-[580px] w-[280px] shadow-xl overflow-hidden">
      <img
        src={img}
        alt={title}
        className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-110"
      />
      {/* Glassmorphism Overlay */}
      <div className="absolute inset-x-0 bottom-0 top-0 bg-brand-600/60 dark:bg-brand-900/80 opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center text-white">
        <div className="translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
          <p className="text-xl font-bold mb-2">{title}</p>
          <p className="text-sm text-brand-50 font-medium">{description}</p>
        </div>
      </div>
    </div>
    <h3 className="text-lg font-bold text-center text-slate-900 dark:text-white group-hover:text-brand-600 transition-colors">
      {title}
    </h3>
  </div>
);

const ScreenshotsSection = () => {
  return (
    <section className="py-24 bg-slate-50 dark:bg-zinc-900/50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white mb-4">
            A look inside
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            Simple, intuitive, and distraction-free.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {/* Row 1 */}
          <ScreenshotCard
            img={dashboardImg}
            title="Clean Dashboard"
            description="See your net worth and spending at a glance"
          />
          <ScreenshotCard
            img={walletsImg}
            title="Smart Wallets"
            description="Manage multiple accounts and currencies easily"
          />
          <ScreenshotCard
            img={analyticsImg}
            title="Visual Analytics"
            description="Deep insights into your financial health"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Row 2 */}
          <ScreenshotCard
            img={transactionsImg}
            title="History & Tracking"
            description="Detailed logs of every transaction"
          />
          <ScreenshotCard
            img={goalsImg}
            title="Savings Goals"
            description="Track progress towards your dreams"
          />
          <ScreenshotCard
            img={shoppingListImg}
            title="Smarter Shopping"
            description="Plan your lists and stay on budget"
          />
        </div>
      </div>
    </section>
  );
};

const SmartTransactionSection = () => {
  return (
    <section className="py-24 bg-white dark:bg-black overflow-hidden border-y border-slate-100 dark:border-zinc-800">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          <div className="flex-[1.2]">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 text-sm font-medium mb-6">
              New Feature
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white mb-6 leading-tight">
              Fastest way to <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-indigo-600">
                log transactions
              </span>
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 mb-8 max-w-xl leading-relaxed">
              Our new, intuitive transaction modal makes logging expenses faster
              than ever. Categorize, choose wallets, and add details with just a
              few taps.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                "Native number pad",
                "Smart category icons",
                "One-tap wallet switching",
                "Beautiful dark interface",
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 text-slate-700 dark:text-slate-300 font-medium bg-slate-50 dark:bg-zinc-900 p-4 rounded-xl border border-slate-100 dark:border-zinc-800 transition-all hover:bg-white dark:hover:bg-zinc-800 shadow-sm"
                >
                  <CheckCircle className="w-5 h-5 text-brand-500 shrink-0" />
                  {item}
                </div>
              ))}
            </div>
          </div>
          <div className="flex-1 relative w-full max-w-[450px]">
            <div className="relative z-10 p-2 bg-gradient-to-br from-brand-500/20 to-indigo-500/20 rounded-[2.5rem] backdrop-blur-sm border border-white/10 shadow-2xl">
              <img
                src={newModalImg}
                alt="New Transaction Modal"
                className="rounded-[2rem] border border-slate-200 dark:border-zinc-800"
              />
            </div>
            {/* Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-brand-500/20 blur-[100px] -z-10" />
          </div>
        </div>
      </div>
    </section>
  );
};

const CTASection = () => {
  const navigate = useNavigate();

  return (
    <section className="py-24">
      <div className="container mx-auto px-4">
        <div className="bg-brand-600 rounded-[3rem] p-8 lg:p-16 text-center text-white relative overflow-hidden">
          {/* Decorators */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

          <div className="relative z-10 max-w-3xl mx-auto">
            <h2 className="text-3xl lg:text-5xl font-bold mb-6">
              Start tracking your money today
            </h2>
            <p className="text-brand-100 text-xl mb-10">
              It takes less than 60 seconds to create an account and take the
              first step towards financial freedom.
            </p>

            <button
              onClick={() => navigate("/login?mode=signup")}
              className="px-10 py-5 bg-white text-brand-600 rounded-2xl font-bold text-lg hover:shadow-2xl hover:scale-105 transition-all active:scale-95"
            >
              Create Free Account
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

const Footer = () => {
  return (
    <footer className="bg-white dark:bg-black border-t border-slate-200 dark:border-zinc-800 py-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <img src={logo} alt="Budgeity" className="w-8 h-8" />
            <span className="font-bold text-xl text-slate-900 dark:text-white">
              Budgeity
            </span>
          </div>
          <div className="text-slate-500 dark:text-slate-400 text-sm">
            &copy; {new Date().getFullYear()} Budgeity. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};

const LandingPage: React.FC = () => {
  const { user, loading } = useAuth();
  const { theme, toggleTheme } = useData();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard");
    }
  }, [user, loading, navigate]);

  if (loading) return null; // Or a minimal spinner

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black overflow-x-hidden selection:bg-brand-500/30 transition-colors duration-300">
      <nav className="fixed top-0 left-0 w-full z-50 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-slate-200/50 dark:border-white/5">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={logo} alt="Budgeity" className="w-8 h-8" />
            <span className="font-bold text-xl text-slate-900 dark:text-white">
              Budgeity
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 mr-2">
              <button
                onClick={toggleTheme}
                className="p-2.5 bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-slate-400 rounded-xl hover:text-brand-600 dark:hover:text-brand-400 transition-colors border border-slate-200 dark:border-zinc-700"
                title={
                  theme === "dark"
                    ? "Switch to Light Mode"
                    : "Switch to Dark Mode"
                }
              >
                {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
              </button>
            </div>
            <button
              onClick={() => navigate("/login")}
              className="text-slate-600 dark:text-slate-300 font-medium hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
            >
              Login
            </button>
            <button
              onClick={() => navigate("/login?mode=signup")}
              className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-brand-500/20"
            >
              Sign Up
            </button>
          </div>
        </div>
      </nav>

      <HeroSection />
      <FeaturesSection />
      <DifferenceSection />
      <ScreenshotsSection />
      <SmartTransactionSection />
      <CTASection />
      <Footer />
    </div>
  );
};

export default LandingPage;
