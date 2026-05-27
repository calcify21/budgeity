import React, { useState, useRef, useCallback, useEffect } from "react";
import { Link } from "react-router-dom";
import { db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useData } from "../context/DataContext";
import { useAuth } from "../context/AuthContext";
import { useHousehold } from "../context/HouseholdContext";
import { useAppLock } from "../context/AppLockContext";
import { useAvatar } from "../hooks/useAvatar";
import { useToast } from "../context/ToastContext";
import { OnboardingWizardPayload } from "../context/DataContext";
import { PrimaryGoal, WalletType } from "../types";
import { CURRENCIES, ONBOARDING_REFERRAL_OPTIONS } from "../constants";
import CustomSelect from "./CustomSelect";
import AppLockSettings from "./applock/AppLockSettings";
import AvatarCropModal from "./AvatarCropModal";
import UserAvatar from "./ui/UserAvatar";
import { motion, AnimatePresence } from "framer-motion";
import { cn, ICON_MAP } from "../utils";
import { useTranslation } from "react-i18next";
import logo from "../assets/logo-927x1024.png";
import {
  BarChart3,
  Target,
  CreditCard,
  Users,
  Globe,
  ArrowRight,
  ArrowLeft,
  Wallet,
  Landmark,
  Sun,
  Moon,
  EyeOff,
  Camera,
  ShieldCheck,
  KeyRound,
  UserPlus,
  UserCircle,
  Check,
  Sparkles,
  ChevronRight,
  Mail,
  Plus,
  X,
  TrendingUp,
  Smartphone,
  BookOpen,
  HelpCircle,
  Play,
  MessageSquare,
  GraduationCap,
  Briefcase,
  Bot,
  Home,
  Share2,
} from "lucide-react";

const MotionDiv = motion.div as any;

// ── Wizard Data Types ────────────────────────────────────────────────

interface WalletEntry {
  id: string;
  name: string;
  type: WalletType;
  balance: string;
  color: string;
  enabled: boolean;
}

interface WizardState {
  primaryGoal: PrimaryGoal | null;
  hearAboutUs: string | null;
  displayName: string;
  currency: string;
  numberSystem: "IN" | "INTL" | "AUTO";
  wallets: WalletEntry[];
  theme: "light" | "dark";
  hideAmounts: boolean;
  trackingMode: "solo" | "shared";
  householdName: string;
  inviteEmails: { id: string; email: string }[];
  wantsPin: boolean;
  language: string;
}

const TOTAL_STEPS = 8;

// ── Goal Options ─────────────────────────────────────────────────────

const GOAL_OPTIONS: Array<{
  value: PrimaryGoal;
  label: string;
  description: string;
  icon: React.ElementType;
  gradient: string;
}> = [
  {
    value: "track_spending",
    label: "Track Spending",
    description: "See where my money goes",
    icon: BarChart3,
    gradient: "from-blue-500 to-indigo-600",
  },
  {
    value: "save_goal",
    label: "Save for a Goal",
    description: "Saving for something big",
    icon: Target,
    gradient: "from-emerald-500 to-teal-600",
  },
  {
    value: "debt_free",
    label: "Get Out of Debt",
    description: "Pay off loans & cards",
    icon: CreditCard,
    gradient: "from-amber-500 to-orange-600",
  },
  {
    value: "build_wealth",
    label: "Build Wealth",
    description: "Grow my net worth",
    icon: TrendingUp,
    gradient: "from-purple-500 to-fuchsia-600",
  },
];

// ── Confetti / Fireworks Canvas ──────────────────────────────────────

const FireworksCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      life: number;
      maxLife: number;
      color: string;
      size: number;
    }> = [];

    const colors = [
      "#6366f1", "#8b5cf6", "#a855f7", "#ec4899", "#f43f5e",
      "#f59e0b", "#10b981", "#06b6d4", "#3b82f6", "#eab308",
    ];

    const createBurst = (x: number, y: number) => {
      const count = 40 + Math.random() * 30;
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
        const speed = 2 + Math.random() * 4;
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 0,
          maxLife: 60 + Math.random() * 40,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: 2 + Math.random() * 3,
        });
      }
    };

    // Initial bursts
    createBurst(canvas.width * 0.3, canvas.height * 0.35);
    createBurst(canvas.width * 0.7, canvas.height * 0.3);
    createBurst(canvas.width * 0.5, canvas.height * 0.4);

    const intervals = [
      setTimeout(() => createBurst(canvas.width * 0.2, canvas.height * 0.25), 400),
      setTimeout(() => createBurst(canvas.width * 0.8, canvas.height * 0.35), 700),
      setTimeout(() => createBurst(canvas.width * 0.5, canvas.height * 0.2), 1100),
      setTimeout(() => createBurst(canvas.width * 0.35, canvas.height * 0.45), 1500),
      setTimeout(() => createBurst(canvas.width * 0.65, canvas.height * 0.25), 1900),
    ];

    let animId: number;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.04; // gravity
        p.vx *= 0.99; // drag
        p.life++;

        const alpha = 1 - p.life / p.maxLife;
        if (alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalAlpha = 1;
      animId = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animId);
      intervals.forEach(clearTimeout);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none"
    />
  );
};

// ── Main Wizard Component ────────────────────────────────────────────

const OnboardingWizard: React.FC = () => {
  const { completeOnboarding, theme: currentTheme } = useData();
  const { user, updateName } = useAuth();
  const { createHousehold, inviteMember, switchWorkspace } = useHousehold();
  const { setupPin } = useAppLock();
  const { saveAvatar } = useAvatar();
  const { success: toastSuccess, error: toastError } = useToast();
  const { i18n, t } = useTranslation();

  // Local avatar base64 — stored here during wizard, saved to Firestore only on finish
  const [pendingAvatarBase64, setPendingAvatarBase64] = useState<string | null>(null);

  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = back
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [pinConfigured, setPinConfigured] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [showFireworks, setShowFireworks] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [otherReferralText, setOtherReferralText] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [wizard, setWizard] = useState<WizardState>({
    primaryGoal: "track_spending",
    hearAboutUs: null,
    displayName: user?.displayName || user?.email?.split("@")[0] || "",
    currency: "INR",
    numberSystem: "AUTO",
    wallets: [
      { id: "1", name: "Cash", type: "cash", balance: "", color: "#10b981", enabled: true },
      { id: "2", name: "Bank Account", type: "bank", balance: "", color: "#3b82f6", enabled: true },
    ],
    theme: currentTheme,
    hideAmounts: false,
    trackingMode: "solo",
    householdName: "",
    inviteEmails: [{ id: "1", email: "" }],
    wantsPin: false,
    language: i18n.language,
  });

  useEffect(() => {
    if (user && !wizard.displayName) {
      update("displayName", user.displayName || user.email?.split("@")[0] || "");
    }
  }, [user]);

  const update = <K extends keyof WizardState>(key: K, value: WizardState[K]) => {
    setWizard((prev) => ({ ...prev, [key]: value }));
  };

  const goNext = () => {
    setDirection(1);
    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  };

  const goBack = () => {
    setDirection(-1);
    setStep((s) => Math.max(s - 1, 1));
  };

  // ── Step validation ────────────────────────────────────────────────

  const canProceed = (): boolean => {
    switch (step) {
      case 1:
        return true;
      case 2:
        return wizard.displayName.trim().length > 0;
      case 3:
        return wizard.hearAboutUs !== null;
      case 4:
        return !!wizard.currency;
      case 5:
        return wizard.wallets.some((w) => w.enabled);
      case 6:
        return true;
      case 7:
        return true;
      case 8:
        return true;
      default:
        return true;
    }
  };

  // ── Location-based currency ────────────────────────────────────────

  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      toastError("Geolocation is not supported by your browser");
      return;
    }
    setIsLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          let countryCode: string | undefined;
          try {
            const response = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
            );
            if (response.ok) {
              const data = await response.json();
              countryCode = data.countryCode;
            }
          } catch {}
          if (!countryCode) {
            const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
            if (tz?.includes("Kolkata") || tz?.includes("Calcutta")) countryCode = "IN";
            else if (tz?.startsWith("America/")) countryCode = "US";
            else if (tz?.startsWith("Europe/London")) countryCode = "GB";
            else if (tz?.startsWith("Europe/")) countryCode = "EU";
            else if (tz?.startsWith("Australia/")) countryCode = "AU";
            else if (tz?.startsWith("Asia/Tokyo")) countryCode = "JP";
          }
          const map: Record<string, string> = {
            US: "USD", GB: "GBP", IN: "INR", EU: "EUR", DE: "EUR", FR: "EUR",
            IT: "EUR", ES: "EUR", JP: "JPY", AU: "AUD", CA: "CAD", AE: "AED",
            CN: "CNY", BR: "BRL", RU: "RUB", ZA: "ZAR", CH: "CHF", KR: "KRW",
          };
          const detected = countryCode ? map[countryCode] : undefined;
          if (detected) {
            update("currency", detected);
            toastSuccess(`Currency set to ${detected}`);
          } else {
            toastError("Could not detect currency from location.");
          }
        } catch {
          toastError("Failed to process location.");
        } finally {
          setIsLoadingLocation(false);
        }
      },
      () => {
        setIsLoadingLocation(false);
        toastError("Location access denied.");
      }
    );
  };

  // ── Theme toggle (live DOM preview only, no Firestore sync) ────────

  const handleThemeToggle = () => {
    const newTheme = wizard.theme === "light" ? "dark" : "light";
    update("theme", newTheme);
    // Live preview: toggle DOM class directly without calling syncState
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  // ── Avatar upload ──────────────────────────────────────────────────

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCropImageSrc(reader.result as string);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // ── PIN setup ──────────────────────────────────────────────────────

  const handlePinSetup = async (pin: string) => {
    await setupPin(pin);
    setPinConfigured(true);
    toastSuccess("PIN set up securely!");
  };

  // ── Final Submit ───────────────────────────────────────────────────

  const handleFinish = async () => {
    setIsSubmitting(true);
    try {
      // 0. Update display name if user customized it
      if (wizard.displayName && wizard.displayName.trim() !== user?.displayName) {
        try {
          await updateName(wizard.displayName.trim());
        } catch (err) {
          console.warn("Failed to update display name on auth profile:", err);
        }
      }

      // 0.1 Save referral response to Firestore
      try {
        let finalSource = wizard.hearAboutUs || "Not specified";
        if (finalSource === "other" && otherReferralText.trim()) {
          finalSource = `other: ${otherReferralText.trim()}`;
        }
        await addDoc(collection(db, "referrals"), {
          name: wizard.displayName.trim() || user?.displayName || "Anonymous User",
          email: user?.email || "No Email",
          uid: user?.uid || "",
          source: finalSource,
          createdAt: serverTimestamp(),
        });
      } catch (err) {
        console.error("Failed to save referral data to Firestore:", err);
      }

      // 1. Prepare wallet data
      const walletsPayload = wizard.wallets
        .filter((w) => w.enabled)
        .map((w) => ({
          name: w.name,
          type: w.type,
          balance: parseFloat(w.balance) || 0,
          color: w.color,
        }));

      if (walletsPayload.length === 0) {
        walletsPayload.push({ name: "Cash", type: "cash" as WalletType, balance: 0, color: "#10b981" });
      }

      // 2. Complete onboarding (creates wallets, sets state)
      const payload: OnboardingWizardPayload = {
        currency: wizard.currency,
        numberSystem: wizard.numberSystem,
        theme: wizard.theme,
        hideAmounts: wizard.hideAmounts,
        primaryGoal: wizard.primaryGoal || "track_spending",
        wallets: walletsPayload,
        onboardingMeta: {
          trackingMode: wizard.trackingMode,
          inviteEmail: wizard.trackingMode === "shared" ? wizard.inviteEmails.map(e => e.email).filter(e => e.trim()).join(",") : undefined,
          hearAboutUs: (() => {
            let finalSource = wizard.hearAboutUs || undefined;
            if (finalSource === "other" && otherReferralText.trim()) {
              return `other: ${otherReferralText.trim()}`;
            }
            return finalSource;
          })(),
        },
        language: wizard.language,
      };
      await completeOnboarding(payload);

      // 3. If "shared" mode → create household + invite
      if (wizard.trackingMode === "shared" && wizard.householdName.trim()) {
        try {
          const householdId = await createHousehold(wizard.householdName.trim());
          const validEmails = wizard.inviteEmails.map(e => e.email.trim()).filter(e => e);
          for (const email of validEmails) {
            await inviteMember(householdId, email, "member");
          }
          // Don't auto-switch to household — let user land in Personal first
        } catch (e: any) {
          console.warn("Household creation during onboarding failed:", e);
        }
      }

      // 4. Save avatar if one was cropped during the wizard
      if (pendingAvatarBase64) {
        try {
          await saveAvatar(pendingAvatarBase64);
        } catch (e) {
          console.warn("Avatar save during onboarding failed:", e);
        }
      }

      // 5. Show fireworks!
      setShowFireworks(true);
    } catch (e: any) {
      toastError("Something went wrong. Please try again.");
      console.error("Onboarding error:", e);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Currency options ───────────────────────────────────────────────

  const currencyOptions = CURRENCIES.map((c) => ({
    value: c.code,
    label: `${c.name} (${c.symbol})`,
    subLabel: c.code,
  }));

  const numberSystemOptions = [
    { value: "AUTO", label: "Auto (Based on Currency)", subLabel: "Recommended" },
    { value: "IN", label: "Indian System", subLabel: "12,34,567.89" },
    { value: "INTL", label: "International System", subLabel: "1,234,567.89" },
  ];

  const languageOptions = [
    { value: "en", label: "English", subLabel: "Primary" },
    { value: "hi", label: "Hindi", subLabel: "हिंदी" },
    { value: "fr", label: "French", subLabel: "Français" },
  ];

  // ── Animation Variants ─────────────────────────────────────────────

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 80 : -80,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -80 : 80,
      opacity: 0,
    }),
  };

  // ── Fireworks Screen ───────────────────────────────────────────────

  if (showFireworks) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-50 dark:bg-black overflow-hidden">
        <FireworksCanvas />
        <MotionDiv
          initial={{ opacity: 0, scale: 0.8, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.3, type: "spring", damping: 20 }}
          className="relative z-10 text-center space-y-6 max-w-md px-6"
        >
          <MotionDiv
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, type: "spring", damping: 12 }}
            className="w-24 h-24 mx-auto bg-gradient-to-br from-brand-500 to-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-brand-500/40"
          >
            <Sparkles size={40} className="text-white" />
          </MotionDiv>

          <MotionDiv
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
              You're All Set! 🎉
            </h1>
            <p className="text-slate-500 dark:text-zinc-400 mt-3 text-lg">
              Your financial command center is ready.
            </p>
          </MotionDiv>

          <MotionDiv
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
          >
            <p className="text-sm text-slate-400 dark:text-zinc-500">
              Entering dashboard in a moment...
            </p>
          </MotionDiv>
        </MotionDiv>
      </div>
    );
  }

  // ── Step Content Renderers ─────────────────────────────────────────

  const renderStep1 = () => (
    <div className="space-y-8 flex flex-col items-center justify-center text-center py-6">
      {/* Magical Scaling Logo */}
      <motion.div
        initial={{ scale: 0, rotate: -45, filter: "blur(10px)" }}
        animate={{ scale: 1, rotate: 0, filter: "blur(0px)" }}
        transition={{
          type: "spring",
          stiffness: 100,
          damping: 15,
          delay: 0.2,
        }}
        className="relative w-32 h-32 flex items-center justify-center"
      >
        {/* Glowing halo behind logo */}
        <div className="absolute inset-0 bg-brand-500/20 dark:bg-brand-500/30 rounded-full blur-2xl animate-pulse" />
        <div className="absolute inset-[-8px] bg-gradient-to-tr from-brand-400 to-indigo-500 rounded-[2rem] opacity-20 blur-md animate-[ping_4s_cubic-bezier(0,0,0.2,1)_infinite]" />
        
        <img
          src={logo}
          alt="Budgeity"
          className="relative w-28 h-28 object-contain drop-shadow-[0_10px_20px_rgba(99,102,241,0.3)] animate-float"
        />
      </motion.div>

      {/* Magical Brand Title */}
      <div className="space-y-3">
        <motion.h1
          initial={{ opacity: 0, y: 30, filter: "blur(5px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.5 }}
          className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white"
        >
          Welcome to <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-500 to-indigo-600 dark:from-brand-400 dark:to-indigo-400">Budgeity</span>
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="text-base sm:text-lg text-slate-500 dark:text-zinc-400 max-w-sm mx-auto font-medium"
        >
          Your premium, secure, and beautiful financial command center. Take control of your money with style.
        </motion.p>
      </div>

      {/* Interactive Micro-animations element */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.9, duration: 0.6 }}
        className="w-full flex items-center justify-center gap-1.5 py-2 px-4 bg-brand-500/5 border border-brand-500/10 rounded-full max-w-xs text-xs font-bold text-brand-600 dark:text-brand-400"
      >
        <Sparkles size={14} className="animate-spin-slow" />
        <span>Magical setup wizard starting...</span>
      </motion.div>

      {/* Legal Links */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.1, duration: 0.5 }}
        className="flex items-center gap-3 text-xs text-slate-400 dark:text-zinc-500 font-bold mt-4"
      >
        <Link
          to="/privacy-policy"
          target="_blank"
          className="hover:text-brand-500 dark:hover:text-brand-400 transition-colors underline underline-offset-4"
        >
          Privacy Policy
        </Link>
        <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-zinc-800" />
        <Link
          to="/terms-of-service"
          target="_blank"
          className="hover:text-brand-500 dark:hover:text-brand-400 transition-colors underline underline-offset-4"
        >
          Terms of Service
        </Link>
      </motion.div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-14 h-14 mx-auto mb-4 bg-gradient-to-br from-brand-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-brand-500/20">
          <UserCircle size={28} className="text-white" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          Your Profile
        </h2>
        <p className="text-slate-500 dark:text-zinc-400 mt-1 text-sm">
          Please confirm your display name and email address
        </p>
      </div>

      <div className="space-y-5">
        {/* Email Address - Read only */}
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            Registered Email Address
          </label>
          <div className="relative flex items-center">
            <Mail className="absolute left-4 text-slate-400" size={18} />
            <input
              type="text"
              readOnly
              disabled
              value={user?.email || "No Email Registered"}
              className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-2xl text-sm font-medium outline-none text-slate-400 cursor-not-allowed select-none"
            />
          </div>
        </div>

        {/* Display Name - Editable */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            What should we call you? (Display Name)
          </label>
          <div className="relative flex items-center">
            <UserCircle className="absolute left-4 text-brand-500" size={18} />
            <input
              type="text"
              value={wizard.displayName}
              onChange={(e) => update("displayName", e.target.value)}
              placeholder="e.g. Shruti Jain"
              className="w-full pl-12 pr-4 py-4 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 focus:border-brand-500 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-brand-500/20 text-slate-950 dark:text-white transition-all"
            />
          </div>
          {wizard.displayName.trim().length === 0 && (
            <p className="text-xs text-rose-500 font-bold ml-4 mt-1">
              Please enter your name to proceed.
            </p>
          )}
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-brand-500 via-brand-600 to-indigo-600 rounded-[1.5rem] flex items-center justify-center shadow-xl shadow-brand-500/20 ring-4 ring-brand-500/10">
            <Sparkles size={30} className="text-white animate-pulse" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            How did you hear about us?
          </h2>
          <p className="text-slate-500 dark:text-zinc-400 mt-2 text-sm font-medium">
            Help us understand how you found Budgeity
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-h-[300px] overflow-y-auto pr-3.5 custom-scrollbar py-1">
          {ONBOARDING_REFERRAL_OPTIONS.map((opt) => {
            const isSelected = wizard.hearAboutUs === opt.id;
            const Icon = ICON_MAP[opt.iconName] || HelpCircle;
            return (
              <button
                key={opt.id}
                onClick={() => update("hearAboutUs", opt.id)}
                className={cn(
                  "relative p-4 rounded-[1.25rem] border text-left transition-all duration-300 group flex items-center gap-4 hover:-translate-y-0.5 shadow-sm min-h-[72px]",
                  isSelected
                    ? "border-brand-500 dark:border-brand-400 bg-brand-50/40 dark:bg-brand-500/10 shadow-md shadow-brand-500/5"
                    : "border-slate-200/80 dark:border-zinc-800/80 bg-white/90 dark:bg-zinc-900/90 hover:border-brand-500/30 dark:hover:border-brand-500/20 hover:bg-slate-50/50 dark:hover:bg-zinc-800/50"
                )}
              >
                {/* Vibrant Colored Icon Container */}
                <div className={cn(
                  "w-11 h-11 rounded-2xl shrink-0 flex items-center justify-center transition-all duration-300 shadow-sm",
                  isSelected
                    ? "bg-gradient-to-tr from-brand-500 to-indigo-600 text-white shadow-md shadow-brand-500/25 scale-105"
                    : opt.colorClass
                )}>
                  <Icon size={20} className={cn("transition-transform duration-300 group-hover:scale-110", isSelected ? "text-white" : "")} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className={cn(
                    "text-sm tracking-normal transition-colors duration-200",
                    isSelected
                      ? "font-bold text-brand-600 dark:text-brand-400"
                      : "font-semibold text-slate-700 dark:text-zinc-300 group-hover:text-slate-900 dark:group-hover:text-white"
                  )}>
                    {opt.text}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {wizard.hearAboutUs === "other" && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2"
          >
            <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
              Where did you hear about us? (Optional)
            </label>
            <input
              type="text"
              value={otherReferralText}
              onChange={(e) => setOtherReferralText(e.target.value)}
              placeholder="e.g. A specific blog post, podcast, or website..."
              className="w-full px-4 py-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 focus:border-brand-500 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-brand-500/20 text-slate-950 dark:text-white transition-all shadow-sm"
            />
          </motion.div>
        )}
      </div>
    );
  };

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-14 h-14 mx-auto mb-4 bg-gradient-to-br from-brand-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-brand-500/20">
          <Globe size={28} className="text-white" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
          Localization
        </h2>
        <p className="text-slate-500 dark:text-zinc-400 mt-1 text-sm">
          Set your currency and number format
        </p>
      </div>

      <div className="space-y-5">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            Currency
          </label>
          <div className="flex gap-2">
            <div className="flex-1">
              <CustomSelect
                value={wizard.currency}
                onChange={(v) => update("currency", v)}
                options={currencyOptions}
                searchable
                placeholder="Select Currency"
              />
            </div>
            <button
              onClick={handleUseLocation}
              disabled={isLoadingLocation}
              className="px-4 py-2 bg-slate-100 dark:bg-zinc-800 hover:bg-brand-100 dark:hover:bg-brand-900/30 text-brand-600 dark:text-brand-400 font-medium rounded-xl transition-colors flex items-center gap-2 whitespace-nowrap disabled:opacity-50"
            >
              {isLoadingLocation ? (
                <div className="w-4 h-4 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Globe size={18} />
              )}
              <span className="hidden sm:inline">
                {isLoadingLocation ? "Locating..." : "Auto"}
              </span>
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            Number Format
          </label>
          <CustomSelect
            value={wizard.numberSystem}
            onChange={(v) => update("numberSystem", v as any)}
            options={numberSystemOptions}
            placeholder="Select Number System"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            Language
          </label>
          <CustomSelect
            value={wizard.language}
            onChange={(v) => {
              update("language", v as string);
              i18n.changeLanguage(v as string);
            }}
            options={languageOptions}
            placeholder="Select Language"
          />
        </div>
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-14 h-14 mx-auto mb-4 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
          <Wallet size={28} className="text-white" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
          Your Accounts
        </h2>
        <p className="text-slate-500 dark:text-zinc-400 mt-1 text-sm">
          Set up your starting balances
        </p>
      </div>

      <div>
        <AnimatePresence initial={false}>
          {wizard.wallets.map((w, idx) => {
            const Icon = w.type === "cash" ? Wallet : Landmark;
            return (
              <MotionDiv
                key={w.id}
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: "auto", marginBottom: 16 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div
                  className="rounded-2xl border-2 border-brand-500/30 bg-white dark:bg-zinc-900 shadow-sm transition-all duration-200"
                >
                  <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: w.color + "20" }}
                    >
                      <Icon size={20} style={{ color: w.color }} />
                    </div>
                    <div>
                      <div className="font-bold text-sm text-slate-900 dark:text-white">
                        {w.type === "cash" ? "Cash Wallet" : "Bank Account"}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {w.type === "cash" ? "Physical cash on hand" : "Your primary bank"}
                      </div>
                    </div>
                  </div>
                  {idx > 0 && (
                    <button
                      onClick={() => {
                        const newWallets = wizard.wallets.filter((_, i) => i !== idx);
                        update("wallets", newWallets);
                      }}
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                      Name
                    </label>
                    <input
                      value={w.name}
                      onChange={(e) => {
                        const newWallets = [...wizard.wallets];
                        newWallets[idx] = { ...newWallets[idx], name: e.target.value };
                        update("wallets", newWallets);
                      }}
                      className="w-full px-3 py-2.5 bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-brand-500 dark:text-white"
                      placeholder="Account name"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                      Balance
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={w.balance}
                      onChange={(e) => {
                        const newWallets = [...wizard.wallets];
                        newWallets[idx] = { ...newWallets[idx], balance: e.target.value };
                        update("wallets", newWallets);
                      }}
                      className="w-full px-3 py-2.5 bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-brand-500 dark:text-white"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>
            </div>
          </MotionDiv>
            );
          })}
        </AnimatePresence>

        <button
          onClick={() => {
            const colors = ["#10b981", "#3b82f6", "#f59e0b", "#8b5cf6", "#ec4899", "#ef4444"];
            const newWallets = [...wizard.wallets, {
              id: Math.random().toString(), name: "", type: "bank" as WalletType, balance: "", color: colors[wizard.wallets.length % colors.length], enabled: true
            }];
            update("wallets", newWallets);
          }}
          className="w-full flex items-center justify-center gap-2 py-4 border-2 border-dashed border-slate-200 dark:border-zinc-800 rounded-2xl text-slate-500 dark:text-zinc-400 font-bold hover:bg-slate-50 dark:hover:bg-zinc-900/50 hover:text-brand-500 transition-colors"
        >
          <Plus size={18} />
          Add another account
        </button>
      </div>
    </div>
  );

  const renderStep6 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-14 h-14 mx-auto mb-4 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/20">
          {wizard.theme === "dark" ? (
            <Moon size={28} className="text-white" />
          ) : (
            <Sun size={28} className="text-white" />
          )}
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
          Appearance
        </h2>
        <p className="text-slate-500 dark:text-zinc-400 mt-1 text-sm">
          Customize how Budgeity looks and feels
        </p>
      </div>

      <div className="space-y-4">
        {/* Theme Toggle */}
        <div className="flex items-center justify-between p-4 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-slate-100 dark:bg-zinc-800 rounded-xl text-slate-600 dark:text-slate-300">
              {wizard.theme === "dark" ? <Moon size={22} /> : <Sun size={22} />}
            </div>
            <div>
              <div className="font-bold text-slate-900 dark:text-white">
                Dark Mode
              </div>
              <div className="text-xs text-slate-500 dark:text-zinc-400">
                Easy on the eyes, especially at night
              </div>
            </div>
          </div>
          <button
            onClick={handleThemeToggle}
            className={cn(
              "relative inline-flex h-8 w-14 shrink-0 items-center rounded-full transition-colors",
              wizard.theme === "dark" ? "bg-brand-500" : "bg-slate-200 dark:bg-zinc-700"
            )}
          >
            <span
              className={cn(
                "inline-block h-6 w-6 transform rounded-full bg-white transition-transform",
                wizard.theme === "dark" ? "translate-x-[1.625rem]" : "translate-x-1"
              )}
            />
          </button>
        </div>

        {/* Privacy Mode */}
        <div className="flex items-center justify-between p-4 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-slate-100 dark:bg-zinc-800 rounded-xl text-slate-600 dark:text-slate-300">
              <EyeOff size={22} />
            </div>
            <div>
              <div className="font-bold text-slate-900 dark:text-white">
                Privacy Mode
              </div>
              <div className="text-xs text-slate-500 dark:text-zinc-400">
                Hide balances from prying eyes
              </div>
            </div>
          </div>
          <button
            onClick={() => update("hideAmounts", !wizard.hideAmounts)}
            className={cn(
              "relative inline-flex h-8 w-14 shrink-0 items-center rounded-full transition-colors",
              wizard.hideAmounts ? "bg-brand-500" : "bg-slate-200 dark:bg-zinc-700"
            )}
          >
            <span
              className={cn(
                "inline-block h-6 w-6 transform rounded-full bg-white transition-transform",
                wizard.hideAmounts ? "translate-x-[1.625rem]" : "translate-x-1"
              )}
            />
          </button>
        </div>
      </div>
    </div>
  );

  const renderStep7 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-14 h-14 mx-auto mb-4 bg-gradient-to-br from-rose-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg shadow-rose-500/20">
          <UserCircle size={28} className="text-white" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
          Profile & Security
        </h2>
        <p className="text-slate-500 dark:text-zinc-400 mt-1 text-sm">
          Personalize and secure your account
        </p>
      </div>

      <div className="space-y-4">
        {/* Avatar Upload */}
        <div className="flex items-center justify-between p-4 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl">
          <div className="flex items-center gap-4">
            <div className="relative">
              <UserAvatar
                name={user?.displayName}
                avatarBase64={pendingAvatarBase64}
                photoURL={user?.photoURL}
                size={48}
              />
            </div>
            <div>
              <div className="font-bold text-slate-900 dark:text-white">
                Profile Photo
              </div>
              <div className="text-xs text-slate-500 dark:text-zinc-400">
                {pendingAvatarBase64 ? "Photo set ✓" : "Add your photo"}
              </div>
            </div>
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 text-sm font-bold bg-slate-100 dark:bg-zinc-800 hover:bg-brand-50 dark:hover:bg-brand-500/10 text-slate-700 dark:text-zinc-300 hover:text-brand-600 rounded-xl transition-colors flex items-center gap-2"
          >
            <Camera size={16} />
            Upload
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        {/* Solo vs Shared — Shows unconditionally now */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
            Who are you tracking with?
          </label>
          <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => update("trackingMode", "solo")}
                className={cn(
                  "p-4 rounded-2xl border-2 text-left transition-all",
                  wizard.trackingMode === "solo"
                    ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10"
                    : "border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
                )}
              >
                <UserCircle size={24} className="text-brand-500 mb-2" />
                <div className="font-bold text-sm dark:text-white">Just Me</div>
                <div className="text-[11px] text-slate-500 dark:text-zinc-400">Personal tracking</div>
              </button>
              <button
                onClick={() => update("trackingMode", "shared")}
                className={cn(
                  "p-4 rounded-2xl border-2 text-left transition-all",
                  wizard.trackingMode === "shared"
                    ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10"
                    : "border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
                )}
              >
                <Users size={24} className="text-purple-500 mb-2" />
                <div className="font-bold text-sm dark:text-white">With Family</div>
                <div className="text-[11px] text-slate-500 dark:text-zinc-400">Shared household</div>
              </button>
            </div>
          </div>

        {/* Household Name + Invite (if shared) */}
        <AnimatePresence>
          {wizard.trackingMode === "shared" && (
            <MotionDiv
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="space-y-3 pt-1">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    Household Name
                  </label>
                  <input
                    value={wizard.householdName}
                    onChange={(e) => update("householdName", e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-brand-500 dark:text-white"
                    placeholder="e.g., My Family"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase">
                      Invite Members (optional)
                    </label>
                  </div>
                  <div>
                    <div className="space-y-0">
                      <AnimatePresence initial={false}>
                        {wizard.inviteEmails.map((emailObj, idx) => (
                          <MotionDiv
                            key={emailObj.id}
                            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                            animate={{ opacity: 1, height: "auto", marginBottom: 8 }}
                            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="relative flex items-center gap-2">
                              <div className="relative flex-1">
                                <Mail
                                  size={16}
                                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                />
                                <input
                                  type="email"
                                  value={emailObj.email}
                                  onChange={(e) => {
                                    const newEmails = [...wizard.inviteEmails];
                                    newEmails[idx] = { ...newEmails[idx], email: e.target.value };
                                    update("inviteEmails", newEmails);
                                  }}
                                  className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-brand-500 dark:text-white"
                                  placeholder="partner@email.com"
                                />
                              </div>
                              {wizard.inviteEmails.length > 1 && (
                                <button
                                  onClick={() => {
                                    const newEmails = wizard.inviteEmails.filter((_, i) => i !== idx);
                                    update("inviteEmails", newEmails);
                                  }}
                                  className="w-11 h-11 flex shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                                >
                                  <X size={16} />
                                </button>
                              )}
                            </div>
                          </MotionDiv>
                        ))}
                      </AnimatePresence>
                      <button
                        onClick={() => update("inviteEmails", [...wizard.inviteEmails, { id: Math.random().toString(), email: "" }])}
                        className="text-brand-500 pt-1 text-xs font-bold flex items-center gap-1 hover:text-brand-600 transition-colors"
                      >
                        <Plus size={14} /> Add another member
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </MotionDiv>
          )}
        </AnimatePresence>
      </div>
    </div>
  );

  const renderStep8 = () => (
    <div className="space-y-6 flex flex-col h-full -mx-4 -mb-4">
      <div className="text-center mb-2 px-4">
        <div className="w-14 h-14 mx-auto mb-4 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <ShieldCheck size={28} className="text-white" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
          App Security
        </h2>
        <p className="text-slate-500 dark:text-zinc-400 mt-1 text-sm">
          Lock the app with biometrics, pattern, or a PIN
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-12">
        <AppLockSettings embeddedMode={true} />
      </div>
    </div>
  );

  // ── Render ─────────────────────────────────────────────────────────

  const stepRenderers = [
    renderStep1,
    renderStep2,
    renderStep3,
    renderStep4,
    renderStep5,
    renderStep6,
    renderStep7,
    renderStep8,
  ];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-50 dark:bg-black overflow-hidden">
      {/* Subtle background ambience */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-brand-500/5 rounded-full blur-[120px]" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] bg-indigo-500/5 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-lg mx-auto px-4 relative z-10 flex flex-col max-h-[100dvh]">
        {/* Progress Bar */}
        <div className="flex items-center gap-2 mb-6 pt-6">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1.5 rounded-full flex-1 transition-all duration-500",
                i < step
                  ? "bg-brand-500"
                  : i === step
                    ? "bg-brand-500/40"
                    : "bg-slate-200 dark:bg-zinc-800"
              )}
            />
          ))}
        </div>

        {/* Step Label */}
        <div className="text-center mb-2">
          <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">
            Step {step} of {TOTAL_STEPS}
          </span>
        </div>

        {/* Card */}
        <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-slate-200 dark:border-zinc-800 rounded-[2.5rem] shadow-2xl flex-1 min-h-0 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
            <AnimatePresence mode="wait" custom={direction}>
              <MotionDiv
                key={step}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25, ease: "easeInOut" }}
              >
                {stepRenderers[step - 1]()}
              </MotionDiv>
            </AnimatePresence>
          </div>

          {/* Footer Navigation */}
          <div className="p-6 pt-4 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between shrink-0">
            {step > 1 ? (
              <button
                onClick={goBack}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800"
              >
                <ArrowLeft size={16} />
                Back
              </button>
            ) : (
              <div />
            )}

            {step < TOTAL_STEPS ? (
              <div className="flex items-center gap-2">
                {step > 4 && (
                  <button
                    onClick={goNext}
                    className="px-4 py-2.5 text-sm font-medium text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-300 transition-colors"
                  >
                    Skip
                  </button>
                )}
                <button
                  onClick={goNext}
                  disabled={!canProceed()}
                  className="flex items-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-2xl shadow-xl shadow-brand-500/20 transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Continue
                  <ArrowRight size={16} />
                </button>
              </div>
            ) : (
              <button
                onClick={handleFinish}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 text-white font-bold rounded-2xl shadow-xl shadow-brand-500/20 transition-all active:scale-[0.98] disabled:opacity-70"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    Get Started
                    <Sparkles size={18} />
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Footer text */}
        <div className="text-center mt-4 pb-4">
          <p className="text-[10px] text-slate-400 dark:text-zinc-600">
            You can change all of these settings later
          </p>
        </div>
      </div>



      {/* Avatar Crop Modal */}
      {cropImageSrc && (
        <AvatarCropModal
          isOpen={!!cropImageSrc}
          imageSrc={cropImageSrc}
          onClose={() => setCropImageSrc(null)}
          onSave={async (base64) => {
            setPendingAvatarBase64(base64);
            toastSuccess("Profile photo set!");
            setCropImageSrc(null);
          }}
        />
      )}
    </div>
  );
};

export default OnboardingWizard;
