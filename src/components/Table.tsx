import React from "react";
import type { GameState } from "../engine/types";
import "../theme";
import { DEFAULT_THEME_ID, getThemeDefinition, useThemePreference } from "../theme/registry";
import type { TableActionHandlers } from "../theme/types";

interface TableProps {
  game: GameState;
  actions: TableActionHandlers;
}

export const Table: React.FC<TableProps> = ({ game, actions }) => {
  const { themeId, setThemeId, themes } = useThemePreference();

  const definition = React.useMemo(() => {
    const current = getThemeDefinition(themeId);
    if (current) {
      return current;
    }
    return getThemeDefinition(DEFAULT_THEME_ID);
  }, [themeId]);

  const Layout = definition?.Layout;

  if (!Layout) {
    return null;
  }

  return (
    <Layout
      game={game}
      actions={actions}
      themeId={definition.id}
      availableThemes={themes}
      onThemeChange={setThemeId}
    />
  );
};
