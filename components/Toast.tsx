import React, { useEffect, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, X, Info } from 'lucide-react';
import { cn } from '../utils';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastProps {
  id: string;
  message: string;
  type: ToastType;
  onClose: (id: string) => void;
  duration?: number;
}

const Toast = forwardRef<HTMLDivElement, ToastProps>(({ id, message, type, onClose, duration = 3000 }, ref) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id);
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  const icons = {
    success: <CheckCircle className="text-emerald-500" size={20} />,
    error: <AlertCircle className="text-rose-500" size={20} />,
    info: <Info className="text-sky-500" size={20} />
  };

  const bgColors = {
    success: 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/20',
    error: 'bg-rose-50 dark:bg-rose-900/10 border-rose-100 dark:border-rose-900/20',
    info: 'bg-sky-50 dark:bg-sky-900/10 border-sky-100 dark:border-sky-900/20'
  };

  return (
    <motion.div
      ref={ref}
      layout
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      className={cn(
        "flex items-center gap-3 p-4 rounded-2xl shadow-xl border backdrop-blur-md min-w-[300px] max-w-md pointer-events-auto",
        "bg-white dark:bg-zinc-900", // Fallback/Base
        bgColors[type]
      )}
    >
      <div className="shrink-0">{icons[type]}</div>
      <p className="flex-1 text-sm font-semibold text-slate-700 dark:text-slate-200">{message}</p>
      <button onClick={() => onClose(id)} className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors">
        <X size={16} className="text-slate-400" />
      </button>
    </motion.div>
  );
});

Toast.displayName = 'Toast';

export default Toast;
