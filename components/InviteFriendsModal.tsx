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

const WhatsAppIcon = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.937 3.659 1.432 5.631 1.432h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
  </svg>
);

const TelegramIcon = ({ size = 24 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 192 192"
    fill="none"
  >
    <path
      stroke="currentColor"
      strokeWidth="12"
      d="M23.073 88.132s65.458-26.782 88.16-36.212c8.702-3.772 38.215-15.843 38.215-15.843s13.621-5.28 12.486 7.544c-.379 5.281-3.406 23.764-6.433 43.756-4.54 28.291-9.459 59.221-9.459 59.221s-.756 8.676-7.188 10.185c-6.433 1.509-17.027-5.281-18.919-6.79-1.513-1.132-28.377-18.106-38.214-26.404-2.649-2.263-5.676-6.79.378-12.071 13.621-12.447 29.891-27.913 39.728-37.72 4.54-4.527 9.081-15.089-9.837-2.264-26.864 18.483-53.35 35.835-53.35 35.835s-6.053 3.772-17.404.377c-11.351-3.395-24.594-7.921-24.594-7.921s-9.08-5.659 6.433-11.693Z"
    />
  </svg>
);

const XIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932 6.064-6.932zm-1.292 19.49h2.039L6.486 3.24H4.298l13.311 17.403z" />
  </svg>
);

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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <MotionDiv
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <MotionDiv
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-white/10"
      >
        {/* Header decoration */}
        <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-brand-500/20 to-indigo-500/20 pointer-events-none" />

        <div className="relative p-8">
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
    </div>
  );
};

export default InviteFriendsModal;
