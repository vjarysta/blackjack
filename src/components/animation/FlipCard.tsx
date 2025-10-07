import React from "react";
import { motion } from "framer-motion";
import { audioService } from "../../services/AudioService";
import { ANIM, REDUCED } from "../../utils/animConstants";

interface FlipCardProps {
  isRevealed: boolean;
  front: React.ReactNode;
  back: React.ReactNode;
}

export function FlipCard({ isRevealed, front, back }: FlipCardProps): React.ReactElement {
  const duration = REDUCED ? 0 : ANIM.flip.duration;
  const wasRevealedRef = React.useRef(isRevealed);
  React.useEffect(() => {
    if (!wasRevealedRef.current && isRevealed) {
      audioService.playCardFlip();
    }
    wasRevealedRef.current = isRevealed;
  }, [isRevealed]);
  return (
    <div style={{ perspective: 800, position: "relative" }}>
      <motion.div
        initial={false}
        animate={{ rotateY: isRevealed ? 180 : 0 }}
        transition={{ ...ANIM.flip, duration }}
        style={{ transformStyle: "preserve-3d" }}
      >
        <div style={{ backfaceVisibility: "hidden", position: "absolute", inset: 0 }}>{back}</div>
        <div
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)", position: "absolute", inset: 0 }}
        >
          {front}
        </div>
      </motion.div>
    </div>
  );
}
