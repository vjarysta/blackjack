import React from "react";
import { AnimatePresence, motion } from "framer-motion";

interface ToastProps {
  message: string | null;
}

export const Toast: React.FC<ToastProps> = ({ message }) => {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          key={message}
          className="solo-toast fixed bottom-6 right-6 z-50 px-4 py-3 text-sm uppercase tracking-[0.3em]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.25 }}
          role="status"
          aria-live="assertive"
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
