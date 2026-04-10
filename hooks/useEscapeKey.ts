import { useEffect } from "react";

/**
 * Adds Escape key dismissal to any modal/dialog.
 * @param isOpen - Whether the modal is currently open.
 * @param onClose - Function to call when Escape is pressed.
 */
export function useEscapeKey(isOpen: boolean, onClose: () => void) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);
}
