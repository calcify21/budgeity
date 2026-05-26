import React, { useRef } from "react";
import { Upload, Image, Trash2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const MotionDiv = motion.div as any;

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

interface ChangePhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFileSelected: (file: File) => void;
  onUseGooglePhoto: () => void;
  onRemovePhoto: () => void;
  onViewPhoto?: () => void;
  hasGooglePhoto: boolean;
  hasCustomPhoto: boolean;
}

const ChangePhotoModal: React.FC<ChangePhotoModalProps> = ({
  isOpen,
  onClose,
  onFileSelected,
  onUseGooglePhoto,
  onRemovePhoto,
  onViewPhoto,
  hasGooglePhoto,
  hasCustomPhoto,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      alert("Please select a JPG, PNG, or WebP image.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      alert("File is too large. Please select an image under 5 MB.");
      return;
    }

    onFileSelected(file);
    // Reset input so same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <MotionDiv
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60]"
            onClick={onClose}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-[61] overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-0 sm:items-center sm:p-4">
              <MotionDiv
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="relative w-full sm:max-w-sm bg-white dark:bg-zinc-900 sm:rounded-3xl rounded-t-[2.5rem] shadow-2xl overflow-hidden border border-slate-200 dark:border-zinc-800 flex flex-col max-h-[90vh]"
              >
              {/* Header */}
              <div className="flex items-center justify-between p-5 pb-2">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Change Profile Photo
                </h3>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full transition-colors text-slate-500"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Options */}
              <div className="p-4 space-y-2">
                {/* Upload Photo */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl bg-brand-50 dark:bg-brand-500/10 hover:bg-brand-100 dark:hover:bg-brand-500/20 transition-colors text-left group"
                >
                  <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-500/20 flex items-center justify-center text-brand-600 dark:text-brand-400 group-hover:scale-110 transition-transform">
                    <Upload size={20} />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white text-sm">
                      Upload Photo
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      JPG, PNG, or WebP (max 5 MB)
                    </p>
                  </div>
                </button>

                {/* Use Google Photo */}
                {hasGooglePhoto && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onUseGooglePhoto();
                      onClose();
                    }}
                    className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors text-left group"
                  >
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                      <Image size={20} />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white text-sm">
                        Use Google Photo
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Use your Google account photo
                      </p>
                    </div>
                  </button>
                )}

                {/* View Photo (if available) */}
                {(hasCustomPhoto || hasGooglePhoto) && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewPhoto?.();
                      onClose();
                    }}
                    className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors text-left group"
                  >
                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-600 dark:text-slate-400 group-hover:scale-110 transition-transform">
                      <Image size={20} />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white text-sm">
                        View Photo
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        See your profile photo in full
                      </p>
                    </div>
                  </button>
                )}

                {/* Remove Photo */}
                {(hasCustomPhoto || hasGooglePhoto) && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemovePhoto();
                      onClose();
                    }}
                    className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl hover:bg-rose-50 dark:hover:bg-rose-500/5 transition-colors text-left group"
                  >
                    <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-500/20 flex items-center justify-center text-rose-600 dark:text-rose-400 group-hover:scale-110 transition-transform">
                      <Trash2 size={20} />
                    </div>
                    <div>
                      <p className="font-semibold text-rose-600 dark:text-rose-400 text-sm">
                        Remove Photo
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Show initials instead
                      </p>
                    </div>
                  </button>
                )}
              </div>

              {/* Cancel */}
              <div className="p-4 pt-0">
                <button
                  onClick={onClose}
                  className="w-full py-3 rounded-2xl text-sm font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
              </div>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.webp"
                className="hidden"
                onChange={handleFileChange}
              />
            </MotionDiv>
          </div>
        </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ChangePhotoModal;
