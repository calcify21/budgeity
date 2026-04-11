import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import { auth } from "../firebase";
import { clearAllAppLockData } from "../utils/appLockStorage";
import {
  Lock,
  ArrowRight,
  AlertCircle,
  Loader2,
  CheckCircle,
  Eye,
  EyeOff,
  Sun,
  Moon,
  ExternalLink,
  Mail,
  ShieldCheck,
  Undo2,
} from "lucide-react";
import logo from "../assets/logo-927x1024.png";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../utils";

// Fix motion type
const MotionDiv = motion.div as any;

const AuthAction: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const {
    verifyResetCode,
    confirmReset,
    verifyEmailAddress,
    recoverEmail,
    completePasswordlessSignIn,
  } = useAuth();
  const { theme, toggleTheme } = useData();

  const mode = searchParams.get("mode");
  const oobCode = searchParams.get("oobCode");

  // Reset Password State
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    password?: string;
    confirm?: string;
  }>({});

  // General State
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [verifiedEmail, setVerifiedEmail] = useState(""); // For password reset
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [actionComplete, setActionComplete] = useState(false);
  const [passwordlessEmail, setPasswordlessEmail] = useState("");
  const processedRef = React.useRef(false);

  useEffect(() => {
    const init = async () => {
      const isSignInLink = mode === "signInWithEmailLink";
      if (!isSignInLink && (!oobCode || !mode)) {
        setError("Invalid link. Missing parameters.");
        setIsVerifying(false);
        return;
      }

      // Prevent double execution
      if (processedRef.current) return;
      processedRef.current = true;

      try {
        if (mode === "resetPassword") {
          // Verify code validity first
          const email = await verifyResetCode(oobCode);
          setVerifiedEmail(email);
          setIsVerifying(false);
        } else if (mode === "verifyEmail") {
          // Auto-verify
          await verifyEmailAddress(oobCode);
          setSuccessMsg("Your email has been verified successfully!");
          setError(null); // Clear any potential error
          setActionComplete(true);
          setIsVerifying(false);
        } else if (mode === "recoverEmail") {
          await recoverEmail(oobCode);
          setSuccessMsg(
            "Your email change has been reversed. You can now login with your original email.",
          );
          setError(null);
          setActionComplete(true);
          setIsVerifying(false);
        } else if (mode === "signInWithEmailLink") {
          const savedEmail = window.localStorage.getItem("emailForSignIn");
          if (savedEmail) {
            console.log("[AuthAction/Init] Processing Magic Link with saved email...");
            const uid = await completePasswordlessSignIn(savedEmail, window.location.href);
            console.log("[AuthAction/Init] SignIn Complete. Returned UID:", uid);

            // App Lock Wiping Protocol - Ensure it specifically triggered via Magic Link
            const pending = window.localStorage.getItem("budgeity_lock_reset_pending");
            console.log("[AuthAction/Init] Lock reset pending flag:", pending);
            let wasReset = false;
            if (pending === "true") {
              const targetUid = uid || auth.currentUser?.uid;
              console.log("[AuthAction/Init] Wiping lock data for UID:", targetUid);
              if (targetUid) {
                await clearAllAppLockData(targetUid);
                console.log("[AuthAction/Init] clearAllAppLockData finished.");
              } else {
                console.error("[AuthAction/Init] No UID available to wipe lock data!");
              }
              window.localStorage.removeItem("budgeity_lock_reset_pending");
              window.dispatchEvent(new Event("budgeity_applock_force_refresh"));
              setSuccessMsg("App Lock securely reset. Welcome back! Redirecting...");
              wasReset = true;
            } else {
              setSuccessMsg("Signed in successfully! Redirecting...");
            }

            setActionComplete(true);
            setTimeout(() => navigate("/dashboard", { state: { appLockReset: wasReset } }), 2000);
          } else {
            // Must ask for email
            setIsVerifying(false); // Stop loader to show email prompt
            return;
          }
        } else {
          setError("Unsupported action.");
          setIsVerifying(false);
        }
      } catch (err: any) {
        // Only set error if we didn't just succeed (race condition safety)
        setSuccessMsg("");
        setError(err.message || "Invalid or expired link.");
        setIsVerifying(false);
      }
    };

    if (isVerifying) {
      init();
    }
  }, [
    oobCode,
    mode,
    verifyResetCode,
    verifyEmailAddress,
    recoverEmail,
    completePasswordlessSignIn,
    navigate,
  ]);

  const validateReset = (): boolean => {
    const errors: typeof fieldErrors = {};
    let isValid = true;

    if (!password) {
      errors.password = "Password is required";
      isValid = false;
    } else {
      const strongPasswordRegex =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
      if (!strongPasswordRegex.test(password)) {
        errors.password =
          "Min 8 chars: 1 upper, 1 lower, 1 number, 1 special char.";
        isValid = false;
      }
    }

    if (password !== confirmPassword) {
      errors.confirm = "Passwords do not match";
      isValid = false;
    }

    setFieldErrors(errors);
    return isValid;
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateReset() || !oobCode) return;

    setIsLoading(true);
    setError(null);
    setSuccessMsg("");

    try {
      await confirmReset(oobCode, password);
      setSuccessMsg("Password reset successfully! Redirecting to login...");
      setActionComplete(true);
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordlessSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordlessEmail) return;

    setIsLoading(true);
    setError(null);
    try {
      console.log("[AuthAction/Submit] Processing Magic Link with entered email...");
      const uid = await completePasswordlessSignIn(passwordlessEmail, window.location.href);
      console.log("[AuthAction/Submit] SignIn Complete. Returned UID:", uid);

      // App Lock Wiping Protocol - Ensure it specifically triggered via Magic Link
      const pending = window.localStorage.getItem("budgeity_lock_reset_pending");
      console.log("[AuthAction/Submit] Lock reset pending flag:", pending);
      let wasReset = false;
      if (pending === "true") {
        const targetUid = uid || auth.currentUser?.uid;
        console.log("[AuthAction/Submit] Wiping lock data for UID:", targetUid);
        if (targetUid) {
          await clearAllAppLockData(targetUid);
          console.log("[AuthAction/Submit] clearAllAppLockData finished.");
        } else {
          console.error("[AuthAction/Submit] No UID available to wipe lock data!");
        }
        window.localStorage.removeItem("budgeity_lock_reset_pending");
        window.dispatchEvent(new Event("budgeity_applock_force_refresh"));
        setSuccessMsg("App Lock securely reset. Welcome back! Redirecting...");
        wasReset = true;
      } else {
        setSuccessMsg("Signed in successfully! Redirecting...");
      }

      setActionComplete(true);
      setTimeout(() => navigate("/dashboard", { state: { appLockReset: wasReset } }), 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-black flex items-center justify-center text-brand-600">
        <Loader2 size={40} className="animate-spin" />
      </div>
    );
  }

  // Render Logic based on Mode
  const renderContent = () => {
    if (mode === "resetPassword") {
      if (actionComplete) return null; // Success msg is shown in main block
      return (
        <form onSubmit={handleResetSubmit} className="space-y-4" noValidate>
          <div className="space-y-4">
            <div className="relative">
              <div className="relative">
                <Lock
                  className={cn(
                    "absolute left-4 top-1/2 -translate-y-1/2 transition-colors",
                    fieldErrors.password ? "text-rose-500" : "text-slate-400",
                  )}
                  size={20}
                />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password)
                      setFieldErrors({ ...fieldErrors, password: undefined });
                  }}
                  placeholder="New Password"
                  className={cn(
                    "w-full pl-12 pr-12 py-4 bg-slate-50 dark:bg-black border rounded-2xl outline-none font-medium transition-all",
                    fieldErrors.password
                      ? "border-rose-500 focus:ring-2 focus:ring-rose-500/20 text-rose-600 placeholder-rose-400/50"
                      : "border-slate-200 dark:border-zinc-800 focus:ring-2 focus:ring-brand-500 dark:text-white",
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors focus:outline-none"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {fieldErrors.password ? (
                <p className="text-xs text-rose-500 font-bold ml-4 mt-1">
                  {fieldErrors.password}
                </p>
              ) : (
                <div className="flex flex-col gap-1 mt-1 ml-4">
                  <p className="text-[10px] text-slate-400 font-medium">
                    Min 8 chars, 1 Upper, 1 Lower, 1 Number, 1 Special
                  </p>
                  <a
                    href="https://calc.aurabyte.in/pwd"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-brand-600 hover:underline flex items-center gap-1"
                  >
                    Can't decide? Check out this password generator{" "}
                    <ExternalLink size={10} />
                  </a>
                </div>
              )}
            </div>

            <div className="relative">
              <div className="relative">
                <Lock
                  className={cn(
                    "absolute left-4 top-1/2 -translate-y-1/2 transition-colors",
                    fieldErrors.confirm ? "text-rose-500" : "text-slate-400",
                  )}
                  size={20}
                />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (fieldErrors.confirm)
                      setFieldErrors({ ...fieldErrors, confirm: undefined });
                  }}
                  placeholder="Confirm New Password"
                  className={cn(
                    "w-full pl-12 pr-12 py-4 bg-slate-50 dark:bg-black border rounded-2xl outline-none font-medium transition-all",
                    fieldErrors.confirm
                      ? "border-rose-500 focus:ring-2 focus:ring-rose-500/20 text-rose-600 placeholder-rose-400/50"
                      : "border-slate-200 dark:border-zinc-800 focus:ring-2 focus:ring-brand-500 dark:text-white",
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors focus:outline-none"
                >
                  {showConfirmPassword ? (
                    <EyeOff size={20} />
                  ) : (
                    <Eye size={20} />
                  )}
                </button>
              </div>
              {fieldErrors.confirm && (
                <p className="text-xs text-rose-500 font-bold ml-4 mt-1">
                  {fieldErrors.confirm}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-2xl shadow-xl shadow-brand-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-4 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 size={24} className="animate-spin" />
              ) : (
                <>
                  Reset Password
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </div>
        </form>
      );
    } else if (mode === "signInWithEmailLink") {
      if (actionComplete) return null;
      return (
        <form onSubmit={handlePasswordlessSubmit} className="space-y-4">
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            Please confirm your email address to complete the sign-in.
          </p>
          <div className="relative">
            <Mail
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              size={20}
            />
            <input
              type="email"
              value={passwordlessEmail}
              onChange={(e) => setPasswordlessEmail(e.target.value)}
              placeholder="Confirm Email Address"
              className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-2xl outline-none font-medium focus:ring-2 focus:ring-brand-500 dark:text-white"
              required
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-2xl shadow-xl shadow-brand-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-4 disabled:opacity-70"
          >
            {isLoading ? (
              <Loader2 size={24} className="animate-spin" />
            ) : (
              "Complete Sign In"
            )}
          </button>
        </form>
      );
    } else if (mode === "verifyEmail" || mode === "recoverEmail") {
      // UI for these modes is mostly just the success/error message
      return (
        <div className="mt-8 text-center">
          <button
            onClick={() => navigate("/login")}
            className="px-8 py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-lg shadow-brand-500/20 transition-all active:scale-[0.98]"
          >
            Continue to Login
          </button>
        </div>
      );
    }
    return null;
  };

  const getTitle = () => {
    if (mode === "resetPassword") return "Reset Password";
    if (mode === "verifyEmail") return "Email Verification";
    if (mode === "recoverEmail") return "Recover Account";
    if (mode === "signInWithEmailLink") return "Complete Sign In";
    return "Authentication";
  };

  const getSubtitle = () => {
    if (mode === "resetPassword")
      return verifiedEmail
        ? `Set a new password for ${verifiedEmail}`
        : "Create a new secure password.";
    if (mode === "verifyEmail") return "Verifying your email address...";
    if (mode === "recoverEmail")
      return "Restoring your original email address...";
    if (mode === "signInWithEmailLink") return "One last step to sign you in.";
    return "Processing request...";
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black flex flex-col items-center justify-center p-4 relative overflow-hidden transition-colors duration-300">
      {/* Theme Toggle */}
      <div className="absolute top-6 right-6 z-20">
        <button
          onClick={toggleTheme}
          className="p-3 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md rounded-full text-slate-500 hover:text-brand-600 dark:text-slate-400 transition-colors shadow-sm"
        >
          {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>

      {/* Background Ambience */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-brand-500/10 rounded-full blur-[120px] animate-blob" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[120px] animate-blob animation-delay-2000" />

      <MotionDiv
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-slate-200 dark:border-white/10 p-8 rounded-[2.5rem] shadow-2xl relative z-10"
      >
        <div className="text-center mb-8">
          <div className="w-24 h-24 mx-auto mb-4 flex items-center justify-center relative">
            <img
              src={logo}
              alt="Budgeity"
              className="w-full h-full object-contain relative z-10"
            />
            {/* Icon Overlay based on mode */}
            <div className="absolute -bottom-2 -right-2 bg-white dark:bg-zinc-800 p-2 rounded-full shadow-md z-20">
              {mode === "resetPassword" && (
                <Lock size={20} className="text-brand-500" />
              )}
              {mode === "verifyEmail" && (
                <ShieldCheck size={20} className="text-emerald-500" />
              )}
              {mode === "recoverEmail" && (
                <Undo2 size={20} className="text-amber-500" />
              )}
            </div>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            {getTitle()}
          </h1>
          <p className="text-slate-500 dark:text-slate-400">{getSubtitle()}</p>
        </div>

        <AnimatePresence mode="wait">
          {error && (
            <MotionDiv
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-4"
            >
              <div className="p-4 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 text-sm font-medium rounded-2xl flex items-start gap-3">
                <AlertCircle size={20} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
              {/* Fallback button when error occurs */}
              <div className="mt-4 text-center">
                <button
                  onClick={() => navigate("/login")}
                  className="text-brand-600 font-bold hover:underline"
                >
                  Return to Login
                </button>
              </div>
            </MotionDiv>
          )}

          {successMsg && (
            <MotionDiv
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-4"
            >
              <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-sm font-medium rounded-2xl flex items-start gap-3">
                <CheckCircle size={20} className="shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            </MotionDiv>
          )}
        </AnimatePresence>

        {!error && renderContent()}
      </MotionDiv>

      <div className="absolute bottom-6 text-slate-400 text-xs text-center z-10 max-w-sm px-4">
        <p>&copy; {new Date().getFullYear()} Budgeity. Secure Cloud Finance.</p>
        <p className="mt-1 opacity-60 text-[10px]">
          Protected by Google Firebase. Your data is encrypted and secure.
        </p>
      </div>
    </div>
  );
};

export default AuthAction;
