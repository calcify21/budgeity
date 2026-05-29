import React, { useState } from "react";
import {
  X,
  Copy,
  Check,
  Share2,
  Mail,
  MessageCircle,
  Twitter,
  Send,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "../context/ToastContext";
import { useEscapeKey } from "../hooks/useEscapeKey";
import { useTranslation } from "react-i18next";

interface InviteFriendsModalProps {
  onClose: () => void;
}

const MotionDiv = motion.div as any;

import { WhatsAppIcon, TelegramIcon, XIcon } from "../constants";

const InviteFriendsModal: React.FC<InviteFriendsModalProps> = ({ onClose }) => {
  const { success: toastSuccess, error: toastError } = useToast();
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  useEscapeKey(true, onClose);

  // Construct the full URL including possible sub-paths (ignoring the hash for HashRouter)
  const fullUrl = window.location.origin + window.location.pathname;
  // Remove trailing slash for a cleaner look if it's there
  const shareUrl = fullUrl.endsWith("/") ? fullUrl.slice(0, -1) : fullUrl;

  const shareText =
    "Check out Budgeity - the smart way to track your expenses! 🚀";

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toastSuccess(t("inviteModal.linkCopied"));
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toastError(t("inviteModal.errCopy"));
    }
  };

  const shareOptions = [
    {
      name: "WhatsApp",
      icon: WhatsAppIcon,
      color: "bg-[#25D366]",
      hoverColor: "hover:bg-[#128C7E]",
      href: `https://wa.me/?text=${encodeURIComponent(shareText + " " + shareUrl)}`,
    },
    {
      name: "Telegram",
      icon: TelegramIcon,
      color: "bg-[#0088cc]",
      hoverColor: "hover:bg-[#0077b5]",
      href: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`,
    },
    {
      name: "X",
      icon: XIcon,
      color: "bg-black dark:bg-zinc-800",
      hoverColor: "hover:bg-zinc-800 dark:hover:bg-zinc-700",
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
    },
    {
      name: "Email",
      icon: Mail,
      color: "bg-slate-600",
      hoverColor: "hover:bg-slate-700",
      href: `mailto:?subject=${encodeURIComponent("Check out Budgeity")}&body=${encodeURIComponent(shareText + " " + shareUrl)}`,
    },
  ];

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Budgeity",
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        // Native share was cancelled or failed
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto">
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
            className="relative w-full max-w-md bg-white dark:bg-zinc-900 sm:rounded-3xl rounded-t-[2.5rem] shadow-2xl overflow-hidden border border-slate-200 dark:border-white/10 flex flex-col max-h-[90vh]"
          >
            {/* Header decoration */}
            <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-brand-500/20 to-indigo-500/20 pointer-events-none" />

            <div className="relative p-8 overflow-y-auto">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-colors"
              >
                <X size={20} />
              </button>

              <div className="flex flex-col items-center text-center mb-8">
                <div className="w-16 h-16 bg-brand-600 rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg shadow-brand-600/20">
                  <Share2 size={32} />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                  {t("inviteModal.title")}
                </h2>
                <p className="text-sm text-slate-500 dark:text-zinc-400 text-center">
                  {t("inviteModal.subtitle")}
                </p>
              </div>

              {/* Copy Link Section */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 ml-1">
                  {t("inviteModal.shareLink")}
                </label>
                <div className="flex gap-2">
                  <div className="flex-1 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-600 dark:text-slate-300 truncate font-mono">
                    {shareUrl}
                  </div>
                  <button
                    onClick={handleCopyLink}
                    className="flex items-center justify-center w-12 h-12 bg-brand-600 hover:bg-brand-500 text-white rounded-xl shadow-lg shadow-brand-500/20 transition-all active:scale-95 group"
                  >
                    {copied ? (
                      <Check size={20} />
                    ) : (
                      <Copy
                        size={20}
                        className="group-hover:scale-110 transition-transform"
                      />
                    )}
                  </button>
                </div>
              </div>

              {/* Social Icons */}
              <div className="grid grid-cols-4 gap-4 mb-8">
                {shareOptions.map((option) => (
                  <a
                    key={option.name}
                    href={option.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center gap-2 group"
                  >
                    <div
                      className={`${option.color} ${option.hoverColor} w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-xl`}
                    >
                      <option.icon size={24} />
                    </div>
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      {option.name}
                    </span>
                  </a>
                ))}
              </div>

              {/* Native Share Button (Hidden if not supported) */}
              {!!navigator.share && (
                <button
                  onClick={handleNativeShare}
                  className="w-full flex items-center justify-center gap-2 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-bold shadow-xl transition-all hover:opacity-90 active:scale-[0.98]"
                >
                  <Share2 size={20} />
                  {t("inviteModal.otherWays")}
                </button>
              )}
            </div>
          </MotionDiv>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default InviteFriendsModal;
