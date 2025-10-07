import React from "react";

interface AppShellMobileProps {
  topBar: React.ReactNode;
  dealer: React.ReactNode;
  player: React.ReactNode;
  bottomBar: React.ReactNode;
  insuranceSheet?: React.ReactNode;
  resultBanner?: React.ReactNode;
  errorBanner?: React.ReactNode;
}

export const AppShellMobile: React.FC<AppShellMobileProps> = ({
  topBar,
  dealer,
  player,
  bottomBar,
  insuranceSheet,
  resultBanner,
  errorBanner
}) => {
  return (
    <div className="relative min-h-screen bg-gradient-to-b from-emerald-950 via-emerald-900 to-emerald-950 text-emerald-50">
      <div className="sticky top-0 z-40 border-b border-emerald-800/60 bg-emerald-950/80 backdrop-blur">
        {topBar}
        {errorBanner && <div className="border-t border-emerald-800/60">{errorBanner}</div>}
      </div>
      {resultBanner && <div className="z-30 px-4 pt-3">{resultBanner}</div>}
      <div className="flex flex-col gap-4 px-4 pb-28 pt-6 sm:mx-auto sm:max-w-4xl">
        {dealer}
        {player}
      </div>
      <div className="sticky bottom-0 z-40 border-t border-emerald-800/60 bg-emerald-950/85 backdrop-blur">
        {bottomBar}
      </div>
      {insuranceSheet}
    </div>
  );
};
