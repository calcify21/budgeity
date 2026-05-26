import React, { useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";
import {
  X,
  Mail,
  CheckCircle,
  AlertCircle,
  Loader2,
  Info,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useScrollToError } from "../hooks/useScrollToError";
import { useEscapeKey } from "../hooks/useEscapeKey";

const MotionDiv = motion.div as any;

interface Props {
  onClose: () => void;
}

const ChangeEmailModal: React.FC<Props> = ({ onClose }) => {
  const { user, changeEmail } = useAuth();
  const { t } = useTranslation();
  useEscapeKey(true, onClose);

  const [newEmail, setNewEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  useScrollToError(error, scrollRef);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail.trim())) {
      setError(t("changeEmailModal.errInvalidEmail"));
      return;
    }

    if (newEmail.trim().toLowerCase() === user?.email?.toLowerCase()) {
      setError(t("changeEmailModal.errSameEmail"));
      return;
    }

    setIsLoading(true);
    try {
      await changeEmail(newEmail.trim());
      setSent(true);
    } catch (err: any) {
      setError(err.message || t("changeEmailModal.errDefault"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto">
      <div className="flex min-h-full items-end justify-center p-0 sm:items-center sm:p-4">
        <AnimatePresence>
          <MotionDiv
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md"
            onClick={onClose}
          />

          <MotionDiv
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="bg-white dark:bg-zinc-900 sm:rounded-[2.5rem] rounded-t-[2.5rem] w-full max-w-md relative z-10 p-8 shadow-2xl border border-slate-100 dark:border-white/10 flex flex-col max-h-[90vh]"
          >
        <div ref={scrollRef} className="overflow-y-auto custom-scrollbar flex-1">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Mail className="text-brand-500" size={24} />
              {t("changeEmailModal.title")}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {sent ? (
            /* ── Success State ── */
            <div className="py-12 flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 rounded-full flex items-center justify-center">
                <CheckCircle size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                {t("changeEmailModal.successTitle")}
              </h3>
              <p
                className="text-slate-500 text-sm leading-relaxed"
                dangerouslySetInnerHTML={{
                  __html: t("changeEmailModal.successBody", { email: newEmail }),
                }}
              />
              <p className="text-xs text-slate-400">
                {t("changeEmailModal.successNote")}
              </p>
              <button
                onClick={onClose}
                className="mt-2 px-6 py-3 bg-brand-600 text-white font-bold rounded-2xl hover:bg-brand-700 transition-colors"
              >
                {t("changeEmailModal.done")}
              </button>
            </div>
          ) : (
            /* ── Form State ── */
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Current email display */}
              <div className="p-4 bg-slate-50 dark:bg-black/40 rounded-2xl border border-slate-100 dark:border-zinc-800">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  {t("changeEmailModal.currentEmail")}
                </p>
                <p className="font-bold text-slate-700 dark:text-slate-200 truncate">
                  {user?.email}
                </p>
              </div>

              {/* Info banner */}
              <div className="flex gap-3 p-4 bg-blue-50 dark:bg-blue-900/10 text-blue-700 dark:text-blue-300 rounded-2xl border border-blue-100 dark:border-blue-900/20 text-sm">
                <Info size={18} className="shrink-0 mt-0.5" />
                <p>{t("changeEmailModal.infoBanner")}</p>
              </div>

              {/* Error */}
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

              {/* New email input */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  {t("changeEmailModal.newEmailLabel")}
                </label>
                <input
                  type="email"
                  autoComplete="email"
                  value={newEmail}
                  onChange={(e) => {
                    setNewEmail(e.target.value);
                    setError(null);
                  }}
                  placeholder={t("changeEmailModal.newEmailPlaceholder")}
                  autoFocus
                  className="w-full px-4 py-4 bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-2xl outline-none focus:ring-2 focus:ring-brand-500 transition-all font-medium text-slate-900 dark:text-white placeholder:text-slate-400"
                />
              </div>

              {/* Submit */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading || !newEmail.trim()}
                  className="w-full py-4 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-2xl shadow-lg shadow-brand-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    t("changeEmailModal.sendLink")
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </MotionDiv>
    </AnimatePresence>
  </div>
</div>
  );
};

export default ChangeEmailModal;
