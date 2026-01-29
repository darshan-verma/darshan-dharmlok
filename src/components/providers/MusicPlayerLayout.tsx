"use client";

import { MusicPlayerProvider, useMusicPlayer } from "./MusicPlayerProvider";
import { MusicPlayerCard } from "@/components/ui/music-player-card";
import { MusicPlayerFullScreen } from "@/components/ui/music-player";

function MusicPlayerShell() {
  const { isFullScreenOpen } = useMusicPlayer();
  return (
    <>
      {isFullScreenOpen && <MusicPlayerFullScreen />}
      <MusicPlayerCard />
    </>
  );
}

export function MusicPlayerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MusicPlayerProvider>
      {children}
      <MusicPlayerShell />
    </MusicPlayerProvider>
  );
}
