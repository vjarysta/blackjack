import React from "react";
import type { CSSProperties } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ANIM, REDUCED } from "../../utils/animConstants";

interface AnimatedChipProps {
  id: string;
  children: React.ReactNode;
  style?: CSSProperties;
  className?: string;
  z?: number;
}

export function AnimatedChip({
  id,
  children,
  style,
  className,
  z = 0,
}: AnimatedChipProps) {
  const duration = REDUCED ? 0 : ANIM.chip.duration;

  return (
    <AnimatePresence>
      <motion.div
        key={id}
        initial={{ y: -10, scale: 1.1, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
        exit={{ y: 10, opacity: 0 }}
        transition={{ ...ANIM.chip, duration }}
        style={{ position: "absolute", zIndex: 25 + z, ...style }}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
