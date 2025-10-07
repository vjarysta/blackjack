import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "../../utils/cn";
import { ANIM } from "../../utils/animConstants";
import type { CoachFeedback } from "./RoundActionBar";

const FEEDBACK_STYLES: Record<CoachFeedback["tone"], string> = {
  correct: "border-emerald-400/60 bg-emerald-900/70 text-emerald-100",
  better: "border-[#c8a24a]/60 bg-[#36240c]/80 text-[#f4dba5]",
  info: "border-emerald-300/50 bg-emerald-800/60 text-emerald-100"
};

interface CoachFeedbackPanelProps {
  feedback: CoachFeedback | null;
}

export const CoachFeedbackPanel: React.FC<CoachFeedbackPanelProps> = ({ feedback }) => (
  <div className="pointer-events-none absolute right-3 top-1/2 z-40 flex -translate-y-1/2 justify-end px-2 sm:right-6 sm:px-6">
    <AnimatePresence>
      {feedback ? (
        <motion.div
          data-testid="coach-feedback-panel"
          key={`${feedback.tone}-${feedback.message}`}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ ...ANIM.fade, duration: ANIM.fade.duration * 1.1 }}
          className="pointer-events-auto flex max-w-[260px] flex-col items-end gap-3"
        >
          <div
            role="status"
            className={cn(
              "rounded-2xl border px-4 py-3 text-sm font-semibold leading-relaxed shadow-[0_18px_45px_rgba(0,0,0,0.45)] backdrop-blur",
              FEEDBACK_STYLES[feedback.tone]
            )}
          >
            {feedback.message}
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  </div>
);
