import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import { useToast } from "../context/ToastContext";
import { useAvatar } from "../hooks/useAvatar";
import {
  User,
  Mail,
  Lock,
  Pencil,
  Shield,
  KeyRound,
  AlertTriangle,
  UserX,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ChangePasswordModal from "../components/ChangePasswordModal";
import EditNameModal from "../components/EditNameModal";
import { ConfirmModal } from "../components/ConfirmModal";
import UserAvatar from "../components/ui/UserAvatar";
import ChangePhotoModal from "../components/ChangePhotoModal";
import AvatarCropModal from "../components/AvatarCropModal";
import FullPhotoViewModal from "../components/FullPhotoViewModal";

const providerLabel = (providerId: string): string => {
  switch (providerId) {
    case "google.com":
      return "Google";
    case "github.com":
      return "GitHub";
    case "password":
      return "Email & Password";
    case "facebook.com":
      return "Facebook";
    default:
      return providerId;
  }
};

const providerIcon = (providerId: string) => {
  switch (providerId) {
    case "google.com":
      return (
        <svg viewBox="0 0 24 24" width={20} height={20}>
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
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
      );
    case "github.com":
      return (
        <svg viewBox="0 0 24 24" width={20} height={20} fill="currentColor">
          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
        </svg>
      );
    case "facebook.com":
      return (
        <svg viewBox="0 0 24 24" width={20} height={20} fill="#1877F2">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      );
    default:
      return <KeyRound size={20} />;
  }
};

const AccountInfo: React.FC = () => {
  const { user, deleteAccount } = useAuth();
  const { deleteCurrentUserData } = useData();
  const { success, error } = useToast();
  const { t } = useTranslation();
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showEditName, setShowEditName] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [isChangePhotoOpen, setIsChangePhotoOpen] = useState(false);
  const [showFullPhoto, setShowFullPhoto] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const { avatarBase64, saveAvatar, removeAvatar, setProviderPhoto } =
    useAvatar();

  const provider = user?.providerData?.[0]?.providerId || "password";

  const handleDeleteAccount = async () => {
    try {
      // 1. Delete Firestore Data
      await deleteCurrentUserData();
      // 2. Delete Auth Account
      await deleteAccount();
      success("Account deleted successfully.");
    } catch (err: any) {
      if (err.message.includes("log out")) {
        error(err.message);
      } else {
        error("Failed to delete account: " + err.message);
      }
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <h2 className="text-2xl font-bold">{t("accountInfo.title")}</h2>

      {/* Profile Card */}
      <section className="bg-white dark:bg-zinc-900 rounded-[2rem] p-8 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-6">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <User className="text-brand-500" size={24} />{" "}
          {t("accountInfo.profile")}
        </h3>

        <div className="space-y-4">
          {/* Display Name */}
          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-black/40 rounded-2xl border border-slate-100 dark:border-zinc-800">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-slate-500 overflow-hidden shrink-0">
                <UserAvatar
                  name={user?.displayName}
                  avatarBase64={avatarBase64}
                  photoURL={user?.photoURL}
                  size={40}
                  editable
                  onEditClick={() => setIsChangePhotoOpen(true)}
                />
              </div>
              <div>
                <div className="font-bold text-slate-900 dark:text-white">
                  {user?.displayName || "User"}
                </div>
                <div className="text-xs text-slate-500">
                  {t("accountInfo.displayName")}
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowEditName(true)}
              className="p-2 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-700 transition-colors text-slate-500"
              title="Edit Name"
            >
              <Pencil size={18} />
            </button>
          </div>

          {/* Email */}
          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-black/40 rounded-2xl border border-slate-100 dark:border-zinc-800">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-zinc-700 flex items-center justify-center text-slate-500">
                <Mail size={20} />
              </div>
              <div>
                <div className="font-bold text-slate-900 dark:text-white">
                  {user?.email}
                </div>
                <div className="text-xs text-slate-500">
                  {t("accountInfo.emailAddress")}
                </div>
              </div>
            </div>
          </div>

          {/* Password */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 dark:bg-black/40 rounded-2xl border border-slate-100 dark:border-zinc-800 gap-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-zinc-700 flex items-center justify-center text-slate-500 shrink-0">
                <Lock size={20} />
              </div>
              <div>
                <div className="font-bold text-slate-900 dark:text-white">
                  {t("accountInfo.password")}
                </div>
                <div className="text-xs text-slate-500">
                  {t("accountInfo.security")}
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowChangePassword(true)}
              className="w-full sm:w-auto px-4 py-2.5 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-sm font-bold shadow-sm hover:bg-slate-50 dark:hover:bg-zinc-700 transition-colors whitespace-nowrap"
            >
              {t("accountInfo.changePassword")}
            </button>
          </div>
        </div>
      </section>

      {/* Sign-in Provider */}
      <section className="bg-white dark:bg-zinc-900 rounded-[2rem] p-8 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-6">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <Shield className="text-brand-500" size={24} />{" "}
          {t("accountInfo.signInProvider")}
        </h3>

        <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-black/40 rounded-2xl border border-slate-100 dark:border-zinc-800">
          <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-zinc-700 flex items-center justify-center text-slate-600 dark:text-slate-300">
            {providerIcon(provider)}
          </div>
          <div>
            <div className="font-bold text-slate-900 dark:text-white">
              {providerLabel(provider)}
            </div>
            <div className="text-xs text-slate-500">
              Signed in via {providerLabel(provider)}
            </div>
          </div>
        </div>
      </section>

      {/* Data & Privacy */}
      <section className="bg-white dark:bg-zinc-900 rounded-[2rem] p-8 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-4">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <Lock className="text-brand-500" size={24} />{" "}
          {t("accountInfo.dataSecurity")}
        </h3>
        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
          {t("accountInfo.dataSecurityDescription")}
        </p>
      </section>

      {/* Danger Zone */}
      <section className="bg-white dark:bg-zinc-900 rounded-[2rem] p-8 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-6">
        <h3 className="text-xl font-bold flex items-center gap-2 text-rose-600">
          <AlertTriangle size={24} /> {t("accountInfo.dangerZone")}
        </h3>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-rose-50 dark:bg-rose-900/10 rounded-2xl border border-rose-100 dark:border-rose-900/20 transition-all">
          <div className="flex items-center gap-4">
            <UserX size={24} className="text-rose-600 shrink-0" />
            <div>
              <div className="font-bold text-lg text-rose-700 dark:text-rose-400">
                {t("accountInfo.deleteAccount")}
              </div>
              <div className="text-sm text-rose-500/80">
                {t("accountInfo.deleteAccountDescription")}
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowDeleteAccount(true)}
            className="px-5 py-2.5 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 transition-colors shadow-lg shadow-rose-500/20 whitespace-nowrap self-end sm:self-auto"
          >
            {t("accountInfo.deleteAccount")}
          </button>
        </div>
      </section>

      {showChangePassword && (
        <ChangePasswordModal onClose={() => setShowChangePassword(false)} />
      )}
      {showEditName && <EditNameModal onClose={() => setShowEditName(false)} />}

      <ConfirmModal
        isOpen={showDeleteAccount}
        onClose={() => setShowDeleteAccount(false)}
        onConfirm={handleDeleteAccount}
        title={t("accountInfo.deleteAccountConfirm")}
        message={t("accountInfo.deleteAccountMessage")}
        confirmText={t("accountInfo.permanentlyDelete")}
        isDestructive
        showCheckbox={true}
        checkboxLabel="I understand that this action will permanently delete my account and data."
        verificationText="DELETE"
      />
      <ChangePhotoModal
        isOpen={isChangePhotoOpen}
        onClose={() => setIsChangePhotoOpen(false)}
        onFileSelected={(file) => {
          const reader = new FileReader();
          reader.onload = () => {
            setCropImageSrc(reader.result as string);
            setIsChangePhotoOpen(false);
          };
          reader.readAsDataURL(file);
        }}
        onUseGooglePhoto={async () => {
          try {
            await setProviderPhoto();
            success("Using Google profile photo.");
          } catch {
            error("Failed to update photo.");
          }
        }}
        onRemovePhoto={async () => {
          try {
            await removeAvatar();
            success("Profile photo removed.");
          } catch {
            error("Failed to remove photo.");
          }
        }}
        onViewPhoto={() => setShowFullPhoto(true)}
        hasGooglePhoto={
          !!(
            user?.photoURL &&
            user.photoURL !== "undefined" &&
            user.photoURL !== "null"
          )
        }
        hasCustomPhoto={!!avatarBase64}
      />

      <FullPhotoViewModal
        isOpen={showFullPhoto}
        onClose={() => setShowFullPhoto(false)}
        photoURL={(avatarBase64 && avatarBase64 !== "removed" ? avatarBase64 : user?.photoURL) || null}
        name={user?.displayName}
      />
      {cropImageSrc && (
        <AvatarCropModal
          isOpen={!!cropImageSrc}
          imageSrc={cropImageSrc}
          onClose={() => setCropImageSrc(null)}
          onSave={async (base64) => {
            try {
              await saveAvatar(base64);
              success("Profile photo updated!");
              setCropImageSrc(null);
            } catch {
              error("Failed to save photo.");
            }
          }}
        />
      )}
    </div>
  );
};

export default AccountInfo;
