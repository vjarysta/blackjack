import React from "react";
import { motion } from "framer-motion";
import type { CSSProperties } from "react";
import { ANIM, REDUCED } from "../../utils/animConstants";

type Point = { x: number; y: number };

type AnimatedCardProps = {
  id: string;
  to: Point;
  from?: Point;
  rotation?: number;
  z?: number;
  delay?: number;
  children: React.ReactNode;
  style?: CSSProperties;
};

export function AnimatedCard({
  id,
  to,
  from,
  rotation = 0,
  z = 0,
  delay = 0,
  children,
  style,
}: AnimatedCardProps) {
  const start = from ?? { x: 0, y: 0 };
  const duration = REDUCED ? 0 : ANIM.deal.duration;
  const staggerDelay = REDUCED ? 0 : delay;

  return (
    <motion.div
      key={id}
      initial={{ x: start.x, y: start.y, rotate: rotation * 0.3, opacity: 0.9 }}
      animate={{ x: to.x, y: to.y, rotate: rotation, opacity: 1 }}
      transition={{ ...ANIM.deal, duration, delay: staggerDelay }}
      style={{ position: "absolute", zIndex: 30 + z, ...style }}
    >
      {children}
    </motion.div>
  );
}
