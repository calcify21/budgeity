import React, { useState, useRef } from "react";
import {
  X,
  Send,
  MessageSquare,
  AlertTriangle,
  Lightbulb,
  Star,
  AlertCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useScrollToError } from "../hooks/useScrollToError";
import { useEscapeKey } from "../hooks/useEscapeKey";
import { useTranslation } from "react-i18next";

interface Props {
  onClose: () => void;
}

// Fix: Cast motion components to any to resolve type errors
const MotionDiv = motion.div as any;

const FeedbackModal: React.FC<Props> = ({ onClose }) => {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();
  const { t } = useTranslation();

  const [type, setType] = useState<"general" | "bug" | "feature">("general");
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const scrollRef = useRef<HTMLFormElement>(null);
  useScrollToError(error, scrollRef);
  useEscapeKey(true, onClose);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!message.trim()) {
      setError(t("feedbackModal.errNoMessage"));
      return;
    }
    if (rating === 0) {
      setError(t("feedbackModal.errNoRating"));
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "feedback"), {
        type,
        message: message.trim(),
        rating,
        userId: user?.uid || "anonymous",
        userEmail: user?.email || "anonymous",
        createdAt: serverTimestamp(),
        status: "new",
        userAgent: navigator.userAgent,
      });

      success(t("feedbackModal.thankYou"));
      onClose();
    } catch (err: any) {
      console.error("Error submitting feedback:", err);
      const errMsg =
        err.message || t("feedbackModal.errSubmit");
      setError(errMsg);
      toastError(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getIcon = (t: string) => {
    switch (t) {
      case "bug":
        return <AlertTriangle size={18} />;
      case "feature":
        return <Lightbulb size={18} />;
      default:
        return <MessageSquare size={18} />;
    }
  };

  return (
    <div className="fixed inset-0 z-[55] overflow-y-auto">
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
            className="relative w-full sm:max-w-md bg-white dark:bg-zinc-900 sm:rounded-[2rem] rounded-t-[2rem] shadow-2xl overflow-hidden border border-slate-200 dark:border-white/10 flex flex-col max-h-[90vh]"
          >
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-black/20">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <MessageSquare className="text-brand-500" />
            {t("feedbackModal.sendFeedback")}
          </h2>
          <button
            onClick={onClose}
            className="p-2 -mr-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-6 overflow-y-auto flex-1 custom-scrollbar"
          ref={scrollRef}
        >
          {/* Type Selection */}
          <div className="flex bg-slate-100 dark:bg-zinc-800 p-1 rounded-xl">
            {(["general", "bug", "feature"] as const).map((ft) => (
              <button
                key={ft}
                type="button"
                onClick={() => setType(ft)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${
                  type === ft
                    ? "bg-white dark:bg-black text-brand-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                }`}
              >
                {getIcon(ft)}
                <span className="capitalize">
                  {(() => {
                    const feedbackTypeMap: Record<string, string> = {
                      general: "feedbackModal.general",
                      bug: "feedbackModal.bug",
                      feature: "feedbackModal.feature",
                    };
                    return t((feedbackTypeMap[ft] || "feedbackModal.general") as any);
                  })()}
                </span>
              </button>
            ))}
          </div>

          {/* Message Input */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-500 ml-1">
              {t("feedbackModal.yourFeedback")}
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={
                type === "bug"
                  ? t("feedbackModal.bugPlaceholder")
                  : type === "feature"
                    ? t("feedbackModal.featurePlaceholder")
                    : t("feedbackModal.generalPlaceholder")
              }
              rows={4}
              className="w-full p-4 bg-slate-50 dark:bg-black/50 border border-slate-200 dark:border-zinc-800 rounded-2xl focus:ring-2 focus:ring-brand-500/20 outline-none resize-none transition-all placeholder:text-slate-400"
              required
            />
          </div>

          {/* Star Rating */}
          <div className="flex flex-col items-center gap-2">
            <label className="text-sm font-bold text-slate-500">
              {t("feedbackModal.rateExperience")}
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="p-1 transition-transform hover:scale-110 focus:outline-none"
                >
                  <Star
                    size={28}
                    className={`${
                      star <= rating
                        ? "fill-amber-400 text-amber-400"
                        : "text-slate-300 dark:text-zinc-700"
                    } transition-colors`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 text-slate-500 font-medium hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-xl transition-colors"
            >
              {t("feedbackModal.cancel")}
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !message.trim() || rating === 0}
              className="flex-1 py-3 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Send size={18} />
                  {t("feedbackModal.send")}
                </>
              )}
            </button>
          </div>
        </form>
      </MotionDiv>
    </AnimatePresence>
  </div>
</div>
  );
};

export default FeedbackModal;
