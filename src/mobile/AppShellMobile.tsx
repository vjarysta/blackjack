import React from "react";

interface AppShellMobileProps {
  topBar: React.ReactNode;
  children: React.ReactNode;
  bottomBar: React.ReactNode;
  overlays?: React.ReactNode;
}

export const AppShellMobile: React.FC<AppShellMobileProps> = ({ topBar, children, bottomBar, overlays }) => (
  <div className="relative flex min-h-screen flex-col bg-gradient-to-b from-[#04110d] via-[#062118] to-[#04110d] text-emerald-50">
    {topBar}
    <div className="flex flex-1 flex-col gap-6 px-4 pb-32 pt-6 sm:mx-auto sm:w-full sm:max-w-3xl sm:px-6">
      {children}
    </div>
    <div
      className="sticky bottom-0 z-30 w-full border-t border-emerald-900/70 bg-[#061a13]/90 px-4 py-4 backdrop-blur"
      style={{ paddingBottom: `calc(env(safe-area-inset-bottom) + 16px)` }}
    >
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        {bottomBar}
      </div>
    </div>
    {overlays}
  </div>
);
