"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { Loader2, Music2, Play } from "lucide-react";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { useMusicPlayer } from "@/components/providers/MusicPlayerProvider";
import type { Track } from "@/components/providers/MusicPlayerProvider";
import { cn } from "@/lib/utils";

interface Song {
  id: string;
  name: string;
  date: string;
  description: string;
  audioFile: string;
  thumbnail: string;
  status: string;
}

interface Album {
  id: string;
  name: string;
  date: string;
  category: string;
  status: string;
}

function songToTrack(song: Song, albumName: string): Track {
  return {
    id: song.id,
    name: song.name,
    artist: albumName,
    albumArt: song.thumbnail || undefined,
    src: song.audioFile,
  };
}

export default function AlbumDetailPage() {
  const params = useParams();
  const router = useRouter();
  const albumId = Array.isArray(params.albumId) ? params.albumId[0] : params.albumId;
  const { playTrack } = useMusicPlayer();

  const [album, setAlbum] = useState<Album | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!albumId) return;

    const fetchAlbumAndSongs = async () => {
      try {
        setLoading(true);
        setError(null);
        const [albumRes, songsRes] = await Promise.all([
          fetch(`/api/audio-library/${albumId}`),
          fetch(`/api/audio-library/${albumId}/songs`),
        ]);

        if (!albumRes.ok) throw new Error("Album not found");
        const albumData = await albumRes.json();
        setAlbum({
          id: albumData.id,
          name: albumData.name,
          date: albumData.date,
          category: albumData.category,
          status: albumData.status,
        });

        if (!songsRes.ok) throw new Error("Failed to load songs");
        const songsData = await songsRes.json();
        const list = Array.isArray(songsData) ? songsData : [];
        setSongs(list.filter((s: Song) => s.status === "Active"));
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load album"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchAlbumAndSongs();
  }, [albumId]);

  const onPlaySong = useCallback(
    (song: Song) => {
      if (!song.audioFile || !album) return;
      const track = songToTrack(song, album.name);
      const tracks = songs.map((s) => songToTrack(s, album.name));
      playTrack(track, tracks);
    },
    [album, songs, playTrack]
  );

  if (!albumId) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Loading album...</p>
        </div>
      ) : error ? (
        <div className="container mx-auto px-4 py-16 text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            type="button"
            onClick={() => router.push("/audio-library")}
            className="text-primary hover:underline"
          >
            Back to Audio Library
          </button>
        </div>
      ) : album ? (
        <>
          <section className="border-b bg-[#f5f5f0] py-8 md:py-12">
            <div className="container mx-auto px-4 max-w-4xl">
              <button
                type="button"
                onClick={() => router.push("/audio-library")}
                className="text-sm text-muted-foreground hover:text-foreground mb-4"
              >
                ← Back to Audio Library
              </button>
              <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground">
                {album.name}
              </h1>
              {album.category && (
                <p className="mt-1 text-muted-foreground">{album.category}</p>
              )}
            </div>
          </section>

          <section className="py-8">
            <div className="container mx-auto px-4 max-w-4xl">
              {songs.length === 0 ? (
                <p className="text-center text-muted-foreground py-12">
                  No songs in this album yet.
                </p>
              ) : (
                <ul className="space-y-1">
                  {songs.map((song) => (
                    <li key={song.id}>
                      <button
                        type="button"
                        onClick={() => onPlaySong(song)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors",
                          "hover:bg-muted/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        )}
                      >
                        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-muted">
                          {song.thumbnail ? (
                            <Image
                              src={song.thumbnail}
                              alt=""
                              fill
                              className="object-cover"
                              sizes="48px"
                              unoptimized
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              <Music2 className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-foreground truncate">
                            {song.name}
                          </div>
                          {song.description && (
                            <div className="text-sm text-muted-foreground truncate">
                              {song.description}
                            </div>
                          )}
                        </div>
                        <div className="shrink-0 rounded-full bg-primary/10 p-2 text-primary">
                          <Play className="h-5 w-5" />
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </>
      ) : null}

      <Footer />
    </div>
  );
}
