import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import {
  Mail,
  Lock,
  ArrowRight,
  AlertCircle,
  Loader2,
  Check,
  CheckCircle,
  Eye,
  EyeOff,
  Moon,
  Sun,
  User as UserIcon,
  ExternalLink,
  Wallet,
} from "lucide-react";
import logo from "../assets/logo-927x1024.png";
import authGraphicLight from "../assets/auth_graphic_light.png";
import authGraphicDark from "../assets/auth_graphic_dark.png";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../utils";

// Fix motion type
const MotionDiv = motion.div as any;

type AuthMode = "login" | "signup" | "forgot";

const Auth: React.FC = () => {
  const {
    login,
    signup,
    resetPassword,
    signInWithGoogle,
    signInWithGithub,
    signInWithFacebook,
    sendPasswordlessLink,
    completePasswordlessSignIn,
    resendVerification,
    user,
    loading,
    error,
    clearError,
  } = useAuth();
  const { theme, toggleTheme } = useData();

  // Redirect if already logged in
  const navigate = useNavigate();
  useEffect(() => {
    // Allow redirect if email is verified OR if using a social provider (Google/GitHub)
    // Social providers often don't require explicit email verification flow in this app
    const isSocial = user?.providerData.some(
      (p) => p.providerId !== "password",
    );

    if (!loading && user && (user.emailVerified || isSocial)) {
      navigate("/dashboard");
    }
  }, [user, loading, navigate]);

  const [searchParams] = useSearchParams();
  const initialMode = (searchParams.get("mode") as AuthMode) || "login";
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [rememberMe, setRememberMe] = useState(false); // Persistence state
  const [isPasswordless, setIsPasswordless] = useState(false);

  // UX States
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirm?: string;
  }>({});

  const switchMode = (m: AuthMode) => {
    setMode(m);
    clearError();
    setSuccessMsg("");
    setPassword("");
    setConfirmPassword("");
    setFieldErrors({});
    setShowPassword(false);
    setShowConfirmPassword(false);
    setIsPasswordless(false);
  };

  const validate = (): boolean => {
    const errors: typeof fieldErrors = {};
    let isValid = true;

    // Name (Signup only)
    if (mode === "signup") {
      if (!name.trim()) {
        errors.name = "Name is required";
        isValid = false;
      }
    }

    // Email
    if (!email) {
      errors.email = "Email is required";
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = "Please enter a valid email";
      isValid = false;
    }

    // Password (Login & Signup)
    if (mode !== "forgot" && !isPasswordless) {
      if (!password) {
        errors.password = "Password is required";
        isValid = false;
      } else if (mode === "signup") {
        const strongPasswordRegex =
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
        if (!strongPasswordRegex.test(password)) {
          errors.password =
            "Min 8 chars: 1 upper, 1 lower, 1 number, 1 special char.";
          isValid = false;
        }
      }
    }

    // Confirm Password (Signup only)
    if (mode === "signup" && !isPasswordless) {
      if (password !== confirmPassword) {
        errors.confirm = "Passwords do not match";
        isValid = false;
      }
    }

    setFieldErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setSuccessMsg("");
    clearError();

    try {
      if (isPasswordless && (mode === "login" || mode === "signup")) {
        await sendPasswordlessLink(email);
        setSuccessMsg("Magic link sent! Check your email to sign in.");
      } else if (mode === "login") {
        await login(email, password, rememberMe);
      } else if (mode === "signup") {
        await signup(email, password, name);
        setSuccessMsg(
          "Account created! Please verify your email before logging in.",
        );
        setMode("login");
        setPassword("");
        setName("");
      } else if (mode === "forgot") {
        await resetPassword(email);
        setSuccessMsg("Password reset email sent! Check your inbox.");
        setMode("login");
      }
    } catch (err) {
      // Error is handled in context
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black flex flex-col lg:flex-row transition-colors duration-300">
      {/* Left panel - Branding (Hidden on Mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-brand-600 dark:bg-zinc-900 relative flex-col p-12 lg:p-16 lg:sticky lg:top-0 lg:h-screen overflow-y-auto">
        {/* Background Ambience */}
        <div className="absolute top-0 w-full h-full left-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-[10%] -left-[10%] w-[60%] h-[60%] bg-indigo-500/30 rounded-full blur-[120px]" />
          <div className="absolute top-[40%] -right-[10%] w-[50%] h-[50%] bg-brand-400/20 rounded-full blur-[100px]" />
        </div>

        <div
          className="relative z-10 flex items-center gap-3 cursor-pointer"
          onClick={() => navigate("/")}
        >
          <img src={logo} alt="Budgeity" className="w-10 h-10 drop-shadow-md" />
          <span className="font-bold text-2xl text-white tracking-tight">
            Budgeity
          </span>
        </div>

        <div className="relative z-10 max-w-lg mt-12 xl:mt-20">
          <h2 className="text-3xl xl:text-5xl font-bold text-white mb-4 xl:mb-6 leading-tight">
            Master your money. <br />
            <span className="text-brand-200">Live your life.</span>
          </h2>
          <p className="text-brand-100/90 text-base xl:text-lg leading-relaxed font-medium">
            Join thousands of users taking control of their finances with our
            smart dashboards, visual analytics, and intuitive tracking tools.
          </p>
        </div>

        {/* Vibey Hero Art Container */}
        <div className="relative z-10 w-full mt-6 xl:mt-10 flex items-center justify-center">
          <div className="w-full max-w-[320px] xl:max-w-[420px]">
             <img src={authGraphicLight} alt="Budgeity Finance Concept" className="w-full h-auto object-contain animate-float drop-shadow-[0_30px_50px_rgba(0,0,0,0.4)] hover:scale-105 transition-transform duration-[800ms] ease-out rounded-3xl dark:hidden" />
             <img src={authGraphicDark} alt="Budgeity Finance Concept" className="w-full h-auto object-contain animate-float drop-shadow-[0_30px_50px_rgba(0,0,0,0.4)] hover:scale-105 transition-transform duration-[800ms] ease-out rounded-3xl hidden dark:block" />
          </div>
        </div>
      </div>

      {/* Right panel - Auth Form */}
      <div className="w-full lg:w-1/2 flex flex-col h-[100dvh] lg:h-screen relative">
        
        {/* Mobile Header (Flow Layout) */}
        <div className="w-full flex justify-between items-center lg:hidden mt-2 mb-4 z-20 px-4 sm:px-8 flex-shrink-0">
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => navigate("/")}
          >
            <img src={logo} alt="Budgeity" className="w-8 h-8 drop-shadow-sm" />
            <span className="font-bold text-lg text-slate-900 dark:text-white tracking-tight">
              Budgeity
            </span>
          </div>

          <button
            onClick={toggleTheme}
            className="p-2 sm:p-3 w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md rounded-full text-slate-500 hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400 transition-colors shadow-sm focus:outline-none"
            title={
              theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"
            }
          >
            {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>

        {/* Desktop Theme Toggle (Absolute) */}
        <div className="hidden lg:block absolute top-6 right-6 z-20">
          <button
            onClick={toggleTheme}
            className="p-2 sm:p-3 w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md rounded-full text-slate-500 hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400 transition-colors shadow-sm focus:outline-none"
            title={
              theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"
            }
          >
            {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>

        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col items-center justify-center w-full min-h-full px-4 sm:px-8 py-8 lg:py-12">
        <div className="w-full max-w-md relative z-10">
          <MotionDiv
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full bg-white dark:bg-black lg:bg-transparent lg:dark:bg-transparent lg:border-none lg:shadow-none bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-slate-200 dark:border-zinc-800 p-8 rounded-[2.5rem] shadow-2xl relative"
          >
            <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">
              {mode === "login" && "Welcome Back"}
              {mode === "signup" && "Create Account"}
              {mode === "forgot" && "Reset Password"}
            </h1>
            <p className="text-slate-500 dark:text-slate-400">
              {mode === "login" &&
                "Enter your credentials to access your finance dashboard."}
              {mode === "signup" &&
                "Start tracking your money smartly with Budgeity."}
              {mode === "forgot" && "Enter your email to receive a reset link."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <AnimatePresence mode="wait">
              {error && (
                <MotionDiv
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 text-sm font-medium rounded-2xl flex flex-col gap-2">
                    <div className="flex items-start gap-3">
                      <AlertCircle size={20} className="shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </div>
                    {error.includes("verify your email") && (
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            // Note: This requires the user to have just tried login
                            // and still be in the auth state before the local signout,
                            // or for us to find another way.
                            // In our new login flow, social users aren't blocked,
                            // and for password users, we can suggest they try again
                            // and we'll catch it or just use Forgot Password.
                            // For now, let's keep it simple.
                            setSuccessMsg(
                              "Verification feature updated. Please try logging in again!",
                            );
                            clearError();
                          } catch (e: any) {
                            // error handled by context
                          }
                        }}
                        className="ml-8 text-xs bg-rose-100 dark:bg-rose-800/30 px-3 py-1.5 rounded-lg hover:bg-rose-200 transition-colors w-fit"
                      >
                        Try Login Again
                      </button>
                    )}
                  </div>
                </MotionDiv>
              )}

              {successMsg && (
                <MotionDiv
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-sm font-medium rounded-2xl flex items-start gap-3">
                    <CheckCircle size={20} className="shrink-0 mt-0.5" />
                    <span>{successMsg}</span>
                  </div>
                </MotionDiv>
              )}
            </AnimatePresence>

            <div className="space-y-4">
              {/* Name Field (Signup Only) */}
              {mode === "signup" && (
                <div className="relative">
                  <div className="relative">
                    <UserIcon
                      className={cn(
                        "absolute left-4 top-1/2 -translate-y-1/2 transition-colors",
                        fieldErrors.name ? "text-rose-500" : "text-slate-400",
                      )}
                      size={20}
                    />
                    <input
                      type="text"
                      name="name"
                      autoComplete="name"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        if (fieldErrors.name)
                          setFieldErrors({ ...fieldErrors, name: undefined });
                      }}
                      placeholder="Full Name"
                      className={cn(
                        "w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-black border rounded-2xl outline-none font-medium transition-all",
                        fieldErrors.name
                          ? "border-rose-500 focus:ring-2 focus:ring-rose-500/20 text-rose-600 placeholder-rose-400/50"
                          : "border-slate-200 dark:border-zinc-800 focus:ring-2 focus:ring-brand-500 dark:text-white",
                      )}
                    />
                  </div>
                  {fieldErrors.name && (
                    <p className="text-xs text-rose-500 font-bold ml-4 mt-1">
                      {fieldErrors.name}
                    </p>
                  )}
                </div>
              )}

              {/* Email Field */}
              <div className="relative">
                <div className="relative">
                  <Mail
                    className={cn(
                      "absolute left-4 top-1/2 -translate-y-1/2 transition-colors",
                      fieldErrors.email ? "text-rose-500" : "text-slate-400",
                    )}
                    size={20}
                  />
                  <input
                    type="email"
                    name="email"
                    autoComplete="username"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (fieldErrors.email)
                        setFieldErrors({ ...fieldErrors, email: undefined });
                    }}
                    placeholder="Email Address"
                    className={cn(
                      "w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-black border rounded-2xl outline-none font-medium transition-all",
                      fieldErrors.email
                        ? "border-rose-500 focus:ring-2 focus:ring-rose-500/20 text-rose-600 placeholder-rose-400/50"
                        : "border-slate-200 dark:border-zinc-800 focus:ring-2 focus:ring-brand-500 dark:text-white",
                    )}
                  />
                </div>
                {fieldErrors.email && (
                  <p className="text-xs text-rose-500 font-bold ml-4 mt-1">
                    {fieldErrors.email}
                  </p>
                )}
              </div>

              {mode !== "forgot" && !isPasswordless && (
                <div className="relative">
                  <div className="relative">
                    <Lock
                      className={cn(
                        "absolute left-4 top-1/2 -translate-y-1/2 transition-colors",
                        fieldErrors.password
                          ? "text-rose-500"
                          : "text-slate-400",
                      )}
                      size={20}
                    />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      autoComplete={
                        mode === "signup" ? "new-password" : "current-password"
                      }
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (fieldErrors.password)
                          setFieldErrors({
                            ...fieldErrors,
                            password: undefined,
                          });
                      }}
                      placeholder="Password"
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
                    mode === "signup" && (
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
                    )
                  )}
                </div>
              )}

              {mode === "login" && (
                <div className="flex items-center justify-between px-1">
                  <div
                    className="flex items-center gap-3 cursor-pointer group"
                    onClick={() => setRememberMe(!rememberMe)}
                  >
                    <div
                      className={cn(
                        "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-300",
                        rememberMe
                          ? "bg-brand-500 border-brand-500 shadow-lg shadow-brand-500/30"
                          : "border-slate-300 dark:border-zinc-700 bg-white dark:bg-black group-hover:border-brand-400",
                      )}
                    >
                      <AnimatePresence>
                        {rememberMe && (
                          <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                          >
                            <Check
                              size={16}
                              className="text-white stroke-[3]"
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    <label className="text-sm font-semibold text-slate-500 dark:text-slate-400 select-none cursor-pointer group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors">
                      Keep me signed in
                    </label>
                  </div>
                  {!isPasswordless && (
                    <button
                      type="button"
                      onClick={() => setIsPasswordless(true)}
                      className="text-xs text-brand-600 font-bold hover:underline"
                    >
                      Use Magic Link instead
                    </button>
                  )}
                  {isPasswordless && (
                    <button
                      type="button"
                      onClick={() => setIsPasswordless(false)}
                      className="text-xs text-brand-600 font-bold hover:underline"
                    >
                      Use Password instead
                    </button>
                  )}
                </div>
              )}

              {mode === "signup" && (
                <div className="relative">
                  <div className="relative">
                    <Lock
                      className={cn(
                        "absolute left-4 top-1/2 -translate-y-1/2 transition-colors",
                        fieldErrors.confirm
                          ? "text-rose-500"
                          : "text-slate-400",
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
                          setFieldErrors({
                            ...fieldErrors,
                            confirm: undefined,
                          });
                      }}
                      placeholder="Confirm Password"
                      className={cn(
                        "w-full pl-12 pr-12 py-4 bg-slate-50 dark:bg-black border rounded-2xl outline-none font-medium transition-all",
                        fieldErrors.confirm
                          ? "border-rose-500 focus:ring-2 focus:ring-rose-500/20 text-rose-600 placeholder-rose-400/50"
                          : "border-slate-200 dark:border-zinc-800 focus:ring-2 focus:ring-brand-500 dark:text-white",
                      )}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
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
                  {mode === "login" &&
                    (isPasswordless ? "Send Magic Link" : "Sign In")}
                  {mode === "signup" &&
                    (isPasswordless ? "Send Magic Link" : "Create Account")}
                  {mode === "forgot" && "Send Reset Link"}
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>

          {(mode === "login" || mode === "signup") && (
            <div className="mt-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="flex-1 min-w-0 border-t border-slate-200 dark:border-zinc-800"></div>
                <span className="flex-shrink-0 text-sm text-slate-500 px-2 bg-white lg:bg-slate-50 dark:bg-zinc-900 lg:dark:bg-transparent">Or continue with</span>
                <div className="flex-1 min-w-0 border-t border-slate-200 dark:border-zinc-800"></div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => signInWithGoogle()}
                  className="flex items-center justify-center py-3 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-700 transition-colors shadow-sm"
                  title="Sign in with Google"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                </button>
                <button
                  onClick={() => signInWithGithub()}
                  className="flex items-center justify-center py-3 bg-[#24292F] text-white rounded-xl hover:bg-[#1a1f24] transition-colors shadow-sm"
                  title="Sign in with GitHub"
                >
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                </button>
                <button
                  onClick={() => signInWithFacebook()}
                  className="flex items-center justify-center py-3 bg-[#1877F2] text-white rounded-xl hover:bg-[#166fe5] transition-colors shadow-sm"
                  title="Sign in with Facebook"
                >
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          <div className="mt-6 text-center space-y-2">
            {mode === "login" && (
              <>
                <p className="text-slate-500 text-sm">
                  Don't have an account?{" "}
                  <button
                    onClick={() => switchMode("signup")}
                    className="text-brand-600 font-bold hover:underline"
                  >
                    Sign Up
                  </button>
                </p>
                <button
                  onClick={() => switchMode("forgot")}
                  className="text-slate-400 text-sm hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  Forgot Password?
                </button>
              </>
            )}
            {mode === "signup" && (
              <p className="text-slate-500 text-sm">
                Already have an account?{" "}
                <button
                  onClick={() => switchMode("login")}
                  className="text-brand-600 font-bold hover:underline"
                >
                  Sign In
                </button>
              </p>
            )}
            {mode === "forgot" && (
              <button
                onClick={() => switchMode("login")}
                className="text-slate-500 text-sm hover:text-slate-800 dark:hover:text-slate-200 transition-colors font-medium"
              >
                Back to Login
              </button>
            )}
          </div>
        </MotionDiv>
        </div>
        </div>
        </div>

        {/* Sticky Footer */}
        <div className="flex-shrink-0 py-4 text-slate-400 text-[11px] lg:text-xs text-center z-10 px-4 border-t border-slate-100 dark:border-zinc-900 bg-slate-50 dark:bg-black">
          <p>
            &copy; {new Date().getFullYear()} Budgeity. Secure Cloud Finance.
          </p>
          <div className="flex items-center justify-center gap-3 mt-1 underline-offset-4">
            <Link to="/privacy-policy" className="hover:text-brand-500 hover:underline transition-colors">Privacy Policy</Link>
            <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-zinc-800" />
            <Link to="/terms-of-service" className="hover:text-brand-500 hover:underline transition-colors">Terms of Service</Link>
          </div>
          <p className="mt-1 opacity-60 text-[10px]">
            Protected by Google Firebase. Your data is encrypted and secure.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
