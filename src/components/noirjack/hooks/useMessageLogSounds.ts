import * as React from "react";
import type { AudioService } from "../../../services/AudioService";

const contains = (message: string, needle: string): boolean =>
  message.includes(needle);

export function useMessageLogSounds(
  log: readonly string[],
  audio: AudioService
): void {
  const countRef = React.useRef<number>(log.length);

  React.useEffect(() => {
    if (log.length <= countRef.current) {
      countRef.current = log.length;
      return;
    }
    const newMessages = log.slice(countRef.current);
    countRef.current = log.length;
    newMessages.forEach((raw) => {
      const message = raw.toLowerCase();
      if (contains(message, "shoe reshuffled")) {
        audio.play("shuffle");
        return;
      }
      if (contains(message, "doubles and draws")) {
        audio.play("double");
        return;
      }
      if (/splits\s/.test(message)) {
        audio.play("split");
        return;
      }
      if (contains(message, "surrenders")) {
        audio.play("surrender");
        return;
      }
      if (
        contains(message, "blackjack wins") ||
        message.startsWith("dealer has blackjack")
      ) {
        audio.play("blackjack");
        return;
      }
      if (contains(message, "busts and loses")) {
        audio.play("lose");
        return;
      }
      if (message.endsWith("busts")) {
        audio.play("bust");
        return;
      }
      if (contains(message, "wins")) {
        audio.play("win");
        return;
      }
      if (contains(message, "pushes")) {
        audio.play("push");
        return;
      }
      if (contains(message, "loses")) {
        audio.play("lose");
      }
    });
  }, [audio, log]);
}
