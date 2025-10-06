import React from "react";
import { useGameStore } from "../store/useGameStore";
import { Button } from "../components/ui/button";
import { themes, DEFAULT_THEME_ID, THEME_STORAGE_KEY } from "../theme/registry";
import { ThemeSwitcher } from "../theme/ThemeSwitcher";

const resolveInitialTheme = (): string => {
  if (typeof window === "undefined") {
    return DEFAULT_THEME_ID;
  }
  const params = new URLSearchParams(window.location.search);
  const fromQuery = params.get("theme");
  if (fromQuery && themes.get(fromQuery)) {
    return fromQuery;
  }
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (stored && themes.get(stored)) {
    return stored;
  }
  return DEFAULT_THEME_ID;
};

export const App: React.FC = () => {
  const {
    game,
    error,
    clearError,
    sit,
    leave,
    setBet,
    addChip,
    removeChipValue,
    removeTopChip,
    deal,
    playerHit,
    playerStand,
    playerDouble,
    playerSplit,
    playerSurrender,
    takeInsurance,
    declineInsurance,
    finishInsurance,
    playDealer,
    nextRound
  } = useGameStore();

  const [themeId, setThemeId] = React.useState(resolveInitialTheme);

  React.useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const params = new URLSearchParams(window.location.search);
    const fromQuery = params.get("theme");
    if (fromQuery && themes.get(fromQuery)) {
      setThemeId(fromQuery);
    }
  }, []);

  React.useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-theme", themeId);
    }
    if (typeof window !== "undefined") {
      window.localStorage.setItem(THEME_STORAGE_KEY, themeId);
    }
  }, [themeId]);

  const theme = React.useMemo(() => themes.get(themeId) ?? themes.get(DEFAULT_THEME_ID)!, [themeId]);
  const Layout = theme.Layout;

  const mainClass =
    theme.id === "multiplayer"
      ? "min-h-screen bg-gradient-to-b from-emerald-950 via-emerald-900 to-emerald-950 text-emerald-50"
      : "min-h-screen bg-[var(--bg,#03120d)] text-[var(--text-hi,#e2fdf3)]";

  return (
    <main className={mainClass}>
      <div className="mx-auto flex min-h-screen w-full max-w-[1500px] flex-col gap-4 p-6">
        <div className="flex items-center justify-end">
          <ThemeSwitcher currentTheme={theme.id} onChange={setThemeId} />
        </div>
        {error && (
          <div className="flex items-center justify-between rounded-md border border-rose-600 bg-rose-900/60 px-4 py-2 text-sm">
            <span>{error}</span>
            <Button variant="ghost" size="sm" onClick={clearError}>
              Dismiss
            </Button>
          </div>
        )}
        <Layout
          game={game}
          actions={{
            sit,
            leave,
            setBet,
            addChip,
            removeChipValue,
            removeTopChip,
            deal,
            playerHit,
            playerStand,
            playerDouble,
            playerSplit,
            playerSurrender,
            takeInsurance,
            declineInsurance,
            finishInsurance,
            playDealer,
            nextRound
          }}
        />
      </div>
    </main>
  );
};
