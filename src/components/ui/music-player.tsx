"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Shuffle,
  Repeat,
  X,
} from "lucide-react";
import Image from "next/image";
import { useMusicPlayer } from "@/components/providers/MusicPlayerProvider";
import { Music2 } from "lucide-react";

const DEFAULT_ALBUM_ART =
  "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400&h=400&fit=crop";

function formatTime(timeInSeconds: number): string {
  if (!Number.isFinite(timeInSeconds) || timeInSeconds < 0) return "00:00";
  const minutes = Math.floor(timeInSeconds / 60);
  const seconds = Math.floor(timeInSeconds % 60);
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function MusicPlayerFullScreen() {
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
    closeFullScreen,
  } = useMusicPlayer();

  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const progressBarRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (progressBarRef.current) {
      progressBarRef.current.style.setProperty(
        "--progress",
        `${progress}%`
      );
    }
  }, [progress]);

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    seek(time);
  };

  if (!currentTrack) return null;

  const albumArt = currentTrack.albumArt || DEFAULT_ALBUM_ART;
  const songTitle = currentTrack.name;
  const artistName = currentTrack.artist ?? "Unknown";

  return (
    <div className="fixed inset-0 z-[200] flex flex-col bg-background">
      <button
        type="button"
        className="absolute top-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        onClick={closeFullScreen}
        aria-label="Close full screen player"
      >
        <X className="h-6 w-6" />
      </button>

      <div className="flex flex-1 flex-col items-center justify-center px-6 py-8">
        <div className="w-full max-w-sm mx-auto flex flex-col items-center font-sans">
          <style>{`
            .music-player-progress-bar {
              --progress: 0%;
              -webkit-appearance: none;
              appearance: none;
              width: 100%;
              height: 8px;
              background: var(--muted);
              border-radius: 4px;
              outline: none;
              cursor: pointer;
              background-image: linear-gradient(var(--primary), var(--primary));
              background-size: var(--progress) 100%;
              background-repeat: no-repeat;
            }
            .music-player-progress-bar::-webkit-slider-thumb {
              -webkit-appearance: none;
              appearance: none;
              width: 16px;
              height: 16px;
              background: white;
              border: 2px solid var(--primary);
              border-radius: 50%;
              cursor: pointer;
              margin-top: -4px;
            }
            .music-player-progress-bar::-moz-range-thumb {
              width: 16px;
              height: 16px;
              background: white;
              border: 2px solid var(--primary);
              border-radius: 50%;
              cursor: pointer;
            }
          `}</style>

          {/* Album Art */}
          <motion.div
            className="relative mb-6"
            animate={{ rotate: isPlaying ? 360 : 0 }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          >
            <div className="relative w-48 h-48 md:w-56 md:h-56 rounded-full overflow-hidden shadow-2xl bg-muted">
              {albumArt.startsWith("http") ? (
                <Image
                  src={albumArt}
                  alt={`${songTitle} album art`}
                  fill
                  className="object-cover"
                  sizes="224px"
                  unoptimized
                  onError={(e) => {
                    const t = e.target as HTMLImageElement;
                    t.style.display = "none";
                  }}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <Music2 className="h-16 w-16 text-muted-foreground" />
                </div>
              )}
            </div>
          </motion.div>

          {/* Song Info */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              {songTitle}
            </h2>
            <p className="text-sm text-muted-foreground">{artistName}</p>
          </div>

          {/* Progress Bar and Timestamps */}
          <div className="w-full flex items-center gap-x-3 mb-4">
            <span className="text-xs font-mono text-muted-foreground w-12 text-left">
              {formatTime(currentTime)}
            </span>
            <input
              ref={progressBarRef}
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              className="music-player-progress-bar flex-grow"
            />
            <span className="text-xs font-mono text-muted-foreground w-12 text-right">
              {formatTime(duration)}
            </span>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-6 w-full">
            <motion.button
              type="button"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsShuffle(!isShuffle)}
              className={`transition-colors ${
                isShuffle ? "text-primary" : "text-muted-foreground"
              }`}
              aria-label="Shuffle"
            >
              <Shuffle size={20} />
            </motion.button>
            <motion.button
              type="button"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={prev}
              className="text-foreground"
              aria-label="Previous"
            >
              <SkipBack size={28} />
            </motion.button>

            <motion.button
              type="button"
              onClick={togglePlayPause}
              className="bg-primary text-primary-foreground w-16 h-16 rounded-full flex items-center justify-center shadow-lg"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={isPlaying ? "pause" : "play"}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center justify-center"
                >
                  {isPlaying ? (
                    <Pause size={32} />
                  ) : (
                    <Play size={32} className="ml-1" />
                  )}
                </motion.div>
              </AnimatePresence>
            </motion.button>

            <motion.button
              type="button"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={next}
              className="text-foreground"
              aria-label="Next"
            >
              <SkipForward size={28} />
            </motion.button>
            <motion.button
              type="button"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsRepeat(!isRepeat)}
              className={`transition-colors ${
                isRepeat ? "text-primary" : "text-muted-foreground"
              }`}
              aria-label="Repeat"
            >
              <Repeat size={20} />
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}
