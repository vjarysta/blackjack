import { themes } from "../registry";
import { MultiplayerLayout } from "./MultiplayerLayout";

themes.register({
  id: "multiplayer",
  name: "Multiplayer Table",
  Layout: MultiplayerLayout
});

export { MultiplayerLayout };
