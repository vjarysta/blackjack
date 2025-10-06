import "./tokens.css";
import { themes } from "../registry";
import { SoloLayout } from "./SoloLayout";

themes.register({
  id: "solo",
  name: "Solo Table",
  Layout: SoloLayout
});

export { SoloLayout };
