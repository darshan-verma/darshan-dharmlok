"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

export interface Track {
  id: string;
  name: string;
  artist?: string;
  albumArt?: string;
  src: string;
}

interface MusicPlayerContextValue {
  currentTrack: Track | null;
  queue: Track[];
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  progress: number;
  isFullScreenOpen: boolean;
  openFullScreen: () => void;
  closeFullScreen: () => void;
  play: () => void;
  pause: () => void;
  togglePlayPause: () => void;
  playTrack: (track: Track, queue?: Track[]) => void;
  playFromQueue: (tracks: Track[], startIndex: number) => void;
  next: () => void;
  prev: () => void;
  seek: (time: number) => void;
  close: () => void;
}

const MusicPlayerContext = createContext<MusicPlayerContextValue | null>(null);

export function useMusicPlayer() {
  const ctx = useContext(MusicPlayerContext);
  if (!ctx) {
    throw new Error("useMusicPlayer must be used within MusicPlayerProvider");
  }
  return ctx;
}

export function MusicPlayerProvider({ children }: { children: React.ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [queue, setQueue] = useState<Track[]>([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullScreenOpen, setIsFullScreenOpen] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const openFullScreen = useCallback(() => setIsFullScreenOpen(true), []);
  const closeFullScreen = useCallback(() => setIsFullScreenOpen(false), []);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const play = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  }, []);

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  const togglePlayPause = useCallback(() => {
    if (!currentTrack) return;
    if (isPlaying) pause();
    else play();
  }, [currentTrack, isPlaying, play, pause]);

  const loadTrack = useCallback((track: Track) => {
    if (!track.src) return;
    setCurrentTrack(track);
    setCurrentTime(0);
    setDuration(0);
    if (audioRef.current) {
      audioRef.current.src = track.src;
      audioRef.current.load();
      audioRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  }, []);

  const playTrack = useCallback(
    (track: Track, fullQueue?: Track[]) => {
      const list = fullQueue && fullQueue.length > 0 ? fullQueue : [track];
      const idx = list.findIndex((t) => t.id === track.id);
      setQueue(list);
      setQueueIndex(idx >= 0 ? idx : 0);
      loadTrack(track);
    },
    [loadTrack]
  );

  const playFromQueue = useCallback(
    (tracks: Track[], startIndex: number) => {
      if (startIndex < 0 || startIndex >= tracks.length) return;
      setQueue(tracks);
      setQueueIndex(startIndex);
      loadTrack(tracks[startIndex]);
    },
    [loadTrack]
  );

  const next = useCallback(() => {
    if (queue.length === 0) return;
    const nextIndex = (queueIndex + 1) % queue.length;
    setQueueIndex(nextIndex);
    loadTrack(queue[nextIndex]);
  }, [queue, queueIndex, loadTrack]);

  const prev = useCallback(() => {
    if (queue.length === 0) return;
    if (currentTime > 3) {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        setCurrentTime(0);
      }
      return;
    }
    const prevIndex = queueIndex === 0 ? queue.length - 1 : queueIndex - 1;
    setQueueIndex(prevIndex);
    loadTrack(queue[prevIndex]);
  }, [queue, queueIndex, currentTime, loadTrack]);

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  const close = useCallback(() => {
    pause();
    setCurrentTrack(null);
    setQueue([]);
    setQueueIndex(0);
    setCurrentTime(0);
    setDuration(0);
    if (audioRef.current) {
      audioRef.current.src = "";
    }
  }, [pause]);

  const queueRef = useRef<Track[]>([]);
  const queueIndexRef = useRef(0);
  queueRef.current = queue;
  queueIndexRef.current = queueIndex;

  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => setDuration(audio.duration);
    const onEnded = () => {
      const q = queueRef.current;
      const idx = queueIndexRef.current;
      if (q.length > 1) {
        const nextIndex = (idx + 1) % q.length;
        setQueueIndex(nextIndex);
        loadTrack(q[nextIndex]);
      } else {
        setIsPlaying(false);
      }
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("ended", onEnded);
      audio.pause();
      audio.src = "";
      audioRef.current = null;
    };
  }, [loadTrack]);

  const value: MusicPlayerContextValue = {
    currentTrack,
    queue,
    isPlaying,
    currentTime,
    duration,
    progress,
    isFullScreenOpen,
    openFullScreen,
    closeFullScreen,
    play,
    pause,
    togglePlayPause,
    playTrack,
    playFromQueue,
    next,
    prev,
    seek,
    close,
  };

  return (
    <MusicPlayerContext.Provider value={value}>
      {children}
    </MusicPlayerContext.Provider>
  );
}
