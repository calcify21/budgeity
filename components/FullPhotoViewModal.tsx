import React from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface FullPhotoViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  photoURL: string | null;
  name?: string | null;
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
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/95 backdrop-blur-2xl"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative max-w-4xl w-full aspect-square flex items-center justify-center pointer-events-none"
          >
            {photoURL ? (
              <img
                src={photoURL}
                alt={name ? `${name}'s profile photo` : "Profile View"}
                className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl border border-white/10 pointer-events-auto"
              />
            ) : (
              <div className="w-64 h-64 rounded-full bg-slate-800 flex items-center justify-center text-slate-500 pointer-events-auto">
                 <span className="text-4xl font-bold">{name?.charAt(0) || "?"}</span>
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
      )}
    </AnimatePresence>
  );
};

export default FullPhotoViewModal;
