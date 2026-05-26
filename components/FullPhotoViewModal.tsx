import React from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface FullPhotoViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  photoURL: string | null;
  name?: string | null;
}

/**
 * Provider photo URLs often embed a small size parameter.
 * This returns the highest-resolution version the CDN supports.
 *
 * Google:  lh3.googleusercontent.com — =s96-c → =s0  (original size)
 * GitHub:  avatars.githubusercontent.com — ?v=4 → ?v=4&size=460
 * Others:  returned unchanged
 */
function getHighResPhotoURL(url: string): string {
  // Google profile photos
  if (url.includes("googleusercontent.com")) {
    // Replace any existing size param (=s##-c or =s##) with =s0 (full res)
    return url.replace(/=s\d+-?c?$/, "=s0");
  }
  // GitHub avatars
  if (url.includes("avatars.githubusercontent.com")) {
    const separator = url.includes("?") ? "&" : "?";
    return `${url}${separator}size=460`;
  }
  return url;
}

const FullPhotoViewModal: React.FC<FullPhotoViewModalProps> = ({
  isOpen,
  onClose,
  photoURL,
  name,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/95 backdrop-blur-md"
              onClick={onClose}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative flex items-center justify-center pointer-events-none"
            >
            {photoURL ? (
              <img
                src={getHighResPhotoURL(photoURL)}
                alt={name ? `${name}'s profile photo` : "Profile View"}
                style={{ width: "90vw", height: "90vh", objectFit: "contain" }}
                className="rounded-2xl shadow-2xl border border-white/10 pointer-events-auto"
              />
            ) : (
              <div className="w-72 h-72 sm:w-96 sm:h-96 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-slate-300 pointer-events-auto border border-white/10 shadow-2xl">
                <span className="text-7xl sm:text-9xl font-bold">{name?.charAt(0) || "?"}</span>
              </div>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="fixed top-4 right-4 sm:top-8 sm:right-8 p-3 sm:p-4 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-xl transition-all pointer-events-auto shadow-2xl z-[210] border border-white/10 group"
            >
              <X size={28} className="group-hover:scale-110 transition-transform" />
            </button>
          </motion.div>
        </div>
      </div>
    )}
  </AnimatePresence>
  );
};

export default FullPhotoViewModal;
