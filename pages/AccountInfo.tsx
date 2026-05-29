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
import ChangeEmailModal from "../components/ChangeEmailModal";
import EditNameModal from "../components/EditNameModal";
import { ConfirmModal } from "../components/ConfirmModal";
import UserAvatar from "../components/ui/UserAvatar";
import ChangePhotoModal from "../components/ChangePhotoModal";
import AvatarCropModal from "../components/AvatarCropModal";
import FullPhotoViewModal from "../components/FullPhotoViewModal";
import { GoogleIcon, GithubIcon, FacebookIcon } from "../constants";

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
      return React.createElement(GoogleIcon, { size: 20 });
    case "github.com":
      return React.createElement(GithubIcon, { size: 20 });
    case "facebook.com":
      return React.createElement(FacebookIcon, { size: 20 });
    default:
      return <KeyRound size={20} />;
  }
};

const AccountInfo: React.FC = () => {
  const { user, deleteAccount, logout } = useAuth();
  const { deleteCurrentUserData } = useData();
  const { success, error } = useToast();
  const { t } = useTranslation();
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showChangeEmail, setShowChangeEmail] = useState(false);
  const [showEditName, setShowEditName] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [showFinalStepModal, setShowFinalStepModal] = useState(false);
  const [isChangePhotoOpen, setIsChangePhotoOpen] = useState(false);
  const [showFullPhoto, setShowFullPhoto] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const { avatarBase64, saveAvatar, removeAvatar, setProviderPhoto } =
    useAvatar();

  const provider = user?.providerData?.[0]?.providerId || "password";

  const handleDeleteAccount = async () => {
    try {
      // 1. Delete Firestore data first (requires valid auth token)
      await deleteCurrentUserData();
      // 2. Delete Auth Account
      await deleteAccount();
      success("Account deleted successfully.");
    } catch (err: any) {
      if (err.message.includes("log out") || err.message.includes("recent-login")) {
        // Auth deletion failed (requires-recent-login) but Firestore data
        // is already gone. Prompt user to complete the final step by logging out and back in.
        setShowDeleteAccount(false);
        setShowFinalStepModal(true);
      } else {
        error("Failed to delete account: " + err.message);
      }
    }
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2">
        <h2 className="text-3xl font-bold tracking-tight">{t("accountInfo.title")}</h2>
      </div>

      <div className="w-full space-y-8">

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
          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-black/40 rounded-2xl border border-slate-100 dark:border-zinc-800 overflow-hidden">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-zinc-700 flex items-center justify-center text-slate-500 shrink-0">
                <Mail size={20} />
              </div>
              <div className="min-w-0">
                <div className="font-bold text-slate-900 dark:text-white truncate">
                  {user?.email}
                </div>
                <div className="text-xs text-slate-500">
                  {t("accountInfo.emailAddress")}
                </div>
              </div>
            </div>
            {provider === "password" && (
              <button
                onClick={() => setShowChangeEmail(true)}
                className="p-2 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-700 transition-colors text-slate-500 shrink-0"
                title="Change Email"
              >
                <Pencil size={18} />
              </button>
            )}
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
      {showChangeEmail && (
        <ChangeEmailModal onClose={() => setShowChangeEmail(false)} />
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

      <ConfirmModal
        isOpen={showFinalStepModal}
        onClose={() => setShowFinalStepModal(false)}
        onConfirm={async () => {
          setShowFinalStepModal(false);
          try {
            await logout();
          } catch {}
        }}
        title="Final Step Required"
        message="Your data has been successfully deleted. However, for your security, Firebase requires a recent login to delete your account credentials. Please log out, log back in, and click 'Delete Account' one last time to fully remove your account."
        confirmText="Acknowledge & Logout"
        isDestructive
        showCheckbox={false}
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
    </div>
  );
};

export default AccountInfo;
