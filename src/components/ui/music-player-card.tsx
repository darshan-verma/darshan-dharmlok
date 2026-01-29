"use client";

import React, { useCallback } from "react";
import Image from "next/image";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  X,
  Music2,
} from "lucide-react";
import { useMusicPlayer } from "@/components/providers/MusicPlayerProvider";
import { cn } from "@/lib/utils";

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const DEFAULT_ALBUM_ART =
  "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=200&h=200&fit=crop";

export function MusicPlayerCard() {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    progress,
    togglePlayPause,
    next,
    prev,
    seek,
    close,
    openFullScreen,
  } = useMusicPlayer();

  const handleProgressClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      e.stopPropagation();
      if (!currentTrack || duration <= 0) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const pct = x / rect.width;
      const time = pct * duration;
      seek(time);
    },
    [currentTrack, duration, seek]
  );

  if (!currentTrack) return null;

  const albumArt = currentTrack.albumArt || DEFAULT_ALBUM_ART;

  return (
    <div className="music-player-container fixed bottom-0 left-0 right-0 z-[100] flex w-full justify-center px-2 pb-4 pt-2 md:px-4">
      <div
        role="button"
        tabIndex={0}
        onClick={() => openFullScreen()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openFullScreen();
          }
        }}
        className="relative w-[min(92vw,52rem)] min-w-[18rem] cursor-pointer rounded-full border bg-card py-2 pl-3 pr-10 shadow-lg sm:w-[55vw] md:w-[50vw] md:pl-4 md:pr-12 lg:w-[48vw]"
      >
        <button
          type="button"
          className="control-button close absolute top-2 right-2 z-10 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          onClick={(e) => {
            e.stopPropagation();
            close();
          }}
          aria-label="Close player"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="main-music-card">
          <div className="track-and-timeline flex items-center gap-2 sm:gap-3">
            <div className="album-art relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-muted">
            {albumArt.startsWith("http") ? (
              <Image
                src={albumArt}
                alt={currentTrack.name}
                fill
                className="object-cover"
                sizes="40px"
                unoptimized
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Music2 className="h-4 w-4 text-muted-foreground" />
              </div>
            )}
          </div>
          <div className="track-details min-w-0 shrink space-y-0.5">
            <div className="track-title truncate text-sm font-semibold leading-tight text-foreground">
              {currentTrack.name}
            </div>
            <div className="artist-name truncate text-xs leading-tight text-muted-foreground">
              {currentTrack.artist ?? "Unknown"}
            </div>
          </div>
          <div className="volume-bars hidden items-end gap-0.5 sm:flex">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className={cn(
                  "bar w-0.5 rounded-full bg-primary",
                  isPlaying && "animate-music-bar"
                )}
                style={{
                  animationDelay: `${i * 0.08}s`,
                  height: "6px",
                }}
              />
            ))}
          </div>
          <div className="timeline min-w-0 flex-1 space-y-0.5">
            <div className="time-info flex justify-between text-[10px] text-muted-foreground">
              <span className="current-time">{formatTime(currentTime)}</span>
              <span className="remaining-time">{formatTime(duration)}</span>
            </div>
            <div
              className="progress-bar group relative h-1.5 w-full cursor-pointer rounded-full bg-muted"
              onClick={handleProgressClick}
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="progress-fill absolute left-0 top-0 h-full rounded-full bg-primary transition-[width] duration-75"
                style={{ width: `${progress}%` }}
              />
              <div
                className="progress-handle absolute top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-primary opacity-0 shadow transition-opacity group-hover:opacity-100"
                style={{ left: `calc(${progress}% - 4px)` }}
              />
            </div>
          </div>
        </div>

        <div className="button-row mt-1 flex items-center justify-center gap-1">
          <button
            type="button"
            className="control-button back inline-flex h-8 w-8 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted"
            onClick={(e) => {
              e.stopPropagation();
              prev();
            }}
            aria-label="Previous"
          >
            <SkipBack className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="control-button play-pause-button inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform hover:scale-105"
            onClick={(e) => {
              e.stopPropagation();
              togglePlayPause();
            }}
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5 ml-0.5" />
            )}
          </button>
          <button
            type="button"
            className="control-button next inline-flex h-8 w-8 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted"
            onClick={(e) => {
              e.stopPropagation();
              next();
            }}
            aria-label="Next"
          >
            <SkipForward className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
    </div>
  );
}
