import { registerTheme } from "./registry";
import { MultiplayerLayout } from "./multiplayer/MultiplayerLayout";
import { SoloLayout } from "./solo/SoloLayout";

registerTheme({
  id: "multiplayer",
  label: "Multiplayer Table",
  Layout: MultiplayerLayout,
});

registerTheme({
  id: "solo",
  label: "Solo Table",
  Layout: SoloLayout,
});
