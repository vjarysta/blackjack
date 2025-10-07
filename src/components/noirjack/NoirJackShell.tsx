import React from "react";

interface NoirJackShellProps {
  topBar: React.ReactNode;
  dealer: React.ReactNode;
  player: React.ReactNode;
  controls: React.ReactNode;
  insuranceSheet?: React.ReactNode;
  resultBanner?: React.ReactNode;
  errorBanner?: React.ReactNode;
  coachMessage?: React.ReactNode;
}

export const NoirJackShell: React.FC<NoirJackShellProps> = ({
  topBar,
  dealer,
  player,
  controls,
  insuranceSheet,
  resultBanner,
  errorBanner,
  coachMessage
}) => {
  return (
    <div className="noirjack-theme">
      <div className="relative flex min-h-screen flex-col">
        <header className="sticky top-0 z-40">
          <div className="px-4 pb-3 pt-4 sm:px-6 lg:px-8">
            <div className="nj-glass">
              {topBar}
              {errorBanner && <div className="border-t border-[rgba(255,255,255,0.08)] px-4 py-2 text-sm">{errorBanner}</div>}
            </div>
          </div>
        </header>
        {resultBanner && <div className="pointer-events-none absolute left-1/2 top-[120px] z-30 -translate-x-1/2">{resultBanner}</div>}
        <main className="flex flex-1 flex-col gap-6 px-4 pb-36 pt-6 sm:px-6 lg:px-8">
          {coachMessage}
          <section>{dealer}</section>
          <section className="flex-1">{player}</section>
        </main>
        <footer className="nj-controls sticky bottom-0 z-40">{controls}</footer>
        {insuranceSheet}
      </div>
    </div>
  );
};
