import React, { useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import {
  X,
  Lock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  ExternalLink,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../utils";
import { useScrollToError } from "../hooks/useScrollToError";
import { useTranslation } from "react-i18next";
import { useEscapeKey } from "../hooks/useEscapeKey";

// Fix motion type
const MotionDiv = motion.div as any;

interface Props {
  onClose: () => void;
}

const ChangePasswordModal: React.FC<Props> = ({ onClose }) => {
  const { updateUserPassword, logout, user } = useAuth();
  const { t } = useTranslation();

  useEscapeKey(true, onClose);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Visibility States
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  useScrollToError(error, scrollRef);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const strongPasswordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    if (!strongPasswordRegex.test(newPassword)) {
      setError(
        t("changePasswordModal.errWeak")
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t("changePasswordModal.errMismatch"));
      return;
    }

    setIsLoading(true);
    try {
      await updateUserPassword(newPassword);
      setSuccess(true);
      setTimeout(async () => {
        await logout(); // Logout the user
        onClose();
      }, 2000);
    } catch (err: any) {
      setError(err.message || t("changePasswordModal.errUpdate"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <MotionDiv
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-zinc-900 rounded-[2.5rem] w-full max-w-md relative z-10 p-8 shadow-2xl border border-slate-100 dark:border-white/10 flex flex-col max-h-[90vh]"
      >
        <div
          ref={scrollRef}
          className="overflow-y-auto custom-scrollbar flex-1"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Lock className="text-brand-500" size={24} /> {t("changePasswordModal.changePassword")}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {success ? (
            <div className="py-12 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                <CheckCircle size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                {t("changePasswordModal.passwordUpdated")}
              </h3>
              <p className="text-slate-500 mt-2">
                {t("changePasswordModal.loggingOut")}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <AnimatePresence>
                {error && (
                  <MotionDiv
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 text-sm font-medium rounded-2xl flex items-start gap-2">
                      <AlertCircle size={18} className="shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </div>
                  </MotionDiv>
                )}
              </AnimatePresence>

              {/* Hidden username field for password managers */}
              <input
                type="text"
                autoComplete="username"
                value={user?.email || ""}
                readOnly
                className="hidden"
                aria-hidden="true"
              />

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  {t("changePasswordModal.newPassword")}
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    name="newPassword"
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={t("changePasswordModal.minChars")}
                    className="w-full pl-4 pr-12 py-4 bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-2xl outline-none focus:ring-2 focus:ring-brand-500 transition-all font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors focus:outline-none"
                  >
                    {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                <div className="mt-2 text-xs flex flex-col gap-1 text-slate-400">
                  <p>
                    {t("changePasswordModal.requirements")}
                  </p>
                  <a
                    href="https://calc.aurabyte.in/pwd"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-600 hover:underline flex items-center gap-1"
                  >
                    {t("changePasswordModal.pwdGenerator")}{" "}
                    <ExternalLink size={10} />
                  </a>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  {t("changePasswordModal.confirmPassword")}
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={t("changePasswordModal.reEnter")}
                    className="w-full pl-4 pr-12 py-4 bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-2xl outline-none focus:ring-2 focus:ring-brand-500 transition-all font-medium"
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
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isLoading || !newPassword || !confirmPassword}
                  className="w-full py-4 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-2xl shadow-lg shadow-brand-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    t("changePasswordModal.updatePassword")
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </MotionDiv>
    </div>
  );
};

export default ChangePasswordModal;
