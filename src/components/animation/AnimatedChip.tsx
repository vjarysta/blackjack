import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { audioService } from "../../services/AudioService";
import { ANIM, REDUCED } from "../../utils/animConstants";

interface AnimatedChipProps {
  id: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export function AnimatedChip({ id, children, style }: AnimatedChipProps): React.ReactElement {
  const duration = REDUCED ? 0 : ANIM.chip.duration;
  React.useEffect(() => {
    audioService.playChip();
  }, []);
  return (
    <AnimatePresence mode="popLayout">
      <motion.div
        key={id}
        initial={{ y: -10, scale: 1.1, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
        exit={{ y: 10, opacity: 0 }}
        transition={{ ...ANIM.chip, duration }}
        style={{ position: "absolute", ...style }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
