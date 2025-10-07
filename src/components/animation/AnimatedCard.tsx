import React from "react";
import { motion } from "framer-motion";
import { audioService } from "../../services/AudioService";
import { ANIM, REDUCED } from "../../utils/animConstants";

type AnimatedCardProps = {
  id: string;
  to: { x: number; y: number };
  from?: { x: number; y: number };
  rotation?: number;
  z?: number;
  delay?: number;
  children: React.ReactNode;
};

export function AnimatedCard({
  id,
  to,
  from,
  rotation = 0,
  z = 0,
  delay = 0,
  children
}: AnimatedCardProps): React.ReactElement {
  const start = from ?? { x: 0, y: 0 };
  React.useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const delayMs = (REDUCED ? 0 : delay) * 1000;
    const timer = window.setTimeout(() => {
      audioService.playCardDeal();
    }, delayMs);
    return () => window.clearTimeout(timer);
  }, [delay]);
  return (
    <motion.div
      key={id}
      initial={{ x: start.x, y: start.y, rotate: rotation * 0.3, opacity: 0.9 }}
      animate={{ x: to.x, y: to.y, rotate: rotation, opacity: 1 }}
      transition={{
        ...ANIM.deal,
        duration: REDUCED ? 0 : ANIM.deal.duration,
        delay: REDUCED ? 0 : delay
      }}
      style={{ position: "absolute", zIndex: 30 + z }}
    >
      {children}
    </motion.div>
  );
}
