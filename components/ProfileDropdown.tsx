import React, { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronDown, X, User, Settings, Users } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { useAvatar } from "../hooks/useAvatar";
import { useHousehold } from "../context/HouseholdContext";
import { useEscapeKey } from "../hooks/useEscapeKey";
import { useClickOutside } from "../hooks/useClickOutside";
import UserAvatar from "./ui/UserAvatar";
import LogOutIconAnimated from "./ui/LogOutIconAnimated";
import { useTranslation } from "react-i18next";


interface ProfileDropdownProps {
  onEditPhotoClick: () => void;
  onViewPhotoClick: () => void;
}

const ProfileDropdown: React.FC<ProfileDropdownProps> = ({
  onEditPhotoClick,
  onViewPhotoClick,
}) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const { avatarBase64 } = useAvatar();
  const { households } = useHousehold();
  const containerRef = useRef<HTMLDivElement>(null);

  useEscapeKey(isOpen, () => setIsOpen(false));
  useClickOutside(containerRef, () => setIsOpen(false));

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="tour-nav-profile flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
      >
        <UserAvatar
          name={user?.displayName}
          avatarBase64={avatarBase64}
          photoURL={user?.photoURL}
          size={32}
        />
        <span className="hidden sm:block font-medium text-sm text-slate-700 dark:text-slate-200 max-w-[100px] truncate">
          {user?.displayName || "User"}
        </span>
        <ChevronDown
          size={14}
          className="text-slate-400 hidden sm:block"
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="absolute right-0 top-full mt-2 w-[360px] max-w-[calc(100vw-2rem)] bg-white dark:bg-[#2d2e30] rounded-[28px] shadow-2xl border border-slate-200 dark:border-white/5 z-50 overflow-hidden text-center p-4"
            style={{ originX: 1, originY: 0 }}
          >
            {/* Header with Exit */}
            <div className="flex items-center justify-between mb-2 px-2">
              <div className="flex-1 text-center">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                  {user?.email}
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full transition-colors text-slate-500"
              >
                <X size={20} />
              </button>
            </div>

            {/* Main Profile Info */}
            <div className="flex flex-col items-center py-4">
              <div className="relative group mb-4">
                <UserAvatar
                  name={user?.displayName}
                  avatarBase64={avatarBase64}
                  photoURL={user?.photoURL}
                  size={80}
                  editable
                  onEditClick={() => {
                    setIsOpen(false);
                    onEditPhotoClick();
                  }}
                  className="border-4 border-slate-50 dark:border-zinc-800 shadow-md"
                />
              </div>

              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                {t("profile_dropdown.hi_user", { name: user?.displayName?.split(" ")[0] || "User" })}
              </h2>
            </div>

            {/* Action Links Panel Group */}
            <div className="flex flex-col gap-1 w-full bg-slate-50/50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-3xl p-1.5 mb-4">
              <button
                onClick={() => {
                  setIsOpen(false);
                  navigate("/account-info");
                }}
                className="flex items-center gap-3.5 p-3 rounded-2xl hover:bg-white dark:hover:bg-zinc-800/80 hover:shadow-sm dark:hover:shadow-none transition-all group w-full text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-brand-100 dark:bg-brand-500/10 flex items-center justify-center text-brand-600 dark:text-brand-400 group-hover:scale-105 transition-transform shrink-0">
                  <User size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    {t("profile_dropdown.my_profile_title")}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {t("profile_dropdown.my_profile_desc")}
                  </p>
                </div>
              </button>

              <button
                onClick={() => {
                  setIsOpen(false);
                  navigate("/settings");
                }}
                className="flex items-center gap-3.5 p-3 rounded-2xl hover:bg-white dark:hover:bg-zinc-800/80 hover:shadow-sm dark:hover:shadow-none transition-all group w-full text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-105 transition-transform shrink-0">
                  <Settings size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    {t("profile_dropdown.preferences_title")}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {t("profile_dropdown.preferences_desc")}
                  </p>
                </div>
              </button>

              {households.length > 0 && (
                <button
                  onClick={() => {
                    setIsOpen(false);
                    navigate("/household-settings");
                  }}
                  className="flex items-center gap-3.5 p-3 rounded-2xl hover:bg-white dark:hover:bg-zinc-800/80 hover:shadow-sm dark:hover:shadow-none transition-all group w-full text-left"
                >
                  <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400 group-hover:scale-105 transition-transform shrink-0">
                    <Users size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      {t("profile_dropdown.shared_spaces_title")}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {t("profile_dropdown.shared_spaces_desc")}
                    </p>
                  </div>
                </button>
              )}
            </div>

            {/* Action Row */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => {
                  setIsOpen(false);
                  logout();
                }}
                className="flex-1 flex items-center justify-center gap-3 p-4 rounded-3xl bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors group"
              >
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-400 group-hover:bg-white dark:group-hover:bg-zinc-800 transition-colors">
                  <LogOutIconAnimated size={20} />
                </div>
                <span className="font-medium text-sm text-slate-700 dark:text-slate-200">
                  {t("profile_dropdown.sign_out")}
                </span>
              </button>
            </div>

            {/* Footer */}
            <div className="pt-2 flex items-center justify-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
              <Link
                to="/privacy-policy"
                onClick={() => setIsOpen(false)}
                className="hover:underline"
              >
                {t("profile_dropdown.privacy_policy")}
              </Link>
              <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
              <Link
                to="/terms-of-service"
                onClick={() => setIsOpen(false)}
                className="hover:underline"
              >
                {t("profile_dropdown.terms_of_service")}
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProfileDropdown;
