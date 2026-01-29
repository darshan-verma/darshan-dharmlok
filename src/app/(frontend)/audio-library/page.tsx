"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { ProfileCard } from "@/components/ui/profile-card";

interface AlbumSong {
  id: string;
  name: string;
  thumbnail?: string;
  audioFile?: string;
}

interface Album {
  id: string;
  name: string;
  date: string;
  category: string;
  status: string;
  songs?: AlbumSong[];
}

const DEFAULT_ALBUM_IMAGE = "/services/audio-library.jpg";

export default function AudioLibraryPage() {
  const router = useRouter();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAlbums = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch("/api/audio-library");
        if (!response.ok) throw new Error("Failed to fetch albums");
        const data = await response.json();
        const list: Album[] = Array.isArray(data) ? data : [];
        setAlbums(list.filter((a: Album) => a.status === "Active"));
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load audio library"
        );
      } finally {
        setLoading(false);
      }
    };
    fetchAlbums();
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <section className="relative w-full h-[400px] md:h-[500px] overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src={DEFAULT_ALBUM_IMAGE}
            alt="Audio Library"
            fill
            className="object-cover"
            priority
            sizes="100vw"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=1200&h=600&fit=crop";
            }}
          />
          <div className="absolute inset-0 bg-black/45" />
        </div>
        <div className="relative z-10 h-full flex items-center justify-center">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif font-bold text-white mb-4 drop-shadow-2xl">
              Audio Library
            </h1>
            <p
              className="text-xl md:text-2xl text-white/90 max-w-2xl mx-auto drop-shadow-lg font-light"
              style={{ fontFamily: "var(--font-jost), sans-serif" }}
            >
              Chants, mantras, and devotional music
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 bg-[#f5f5f0]">
        <div className="container mx-auto px-4 max-w-7xl">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Loading albums...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-500">{error}</p>
            </div>
          ) : albums.length > 0 ? (
            <div className="grid gap-8 justify-items-center grid-cols-[repeat(auto-fill,minmax(360px,1fr))]">
              {albums.map((album) => {
                const image =
                  album.songs?.[0]?.thumbnail ||
                  DEFAULT_ALBUM_IMAGE;
                return (
                  <div
                    key={album.id}
                    className="w-full max-w-[380px] focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-4 rounded-3xl"
                  >
                    <ProfileCard
                      variant="dharamshala"
                      name={album.name}
                      description={album.category ? `Category: ${album.category}` : "Spiritual audio"}
                      image={image}
                      onBook={() => router.push(`/audio-library/${album.id}`)}
                      className="w-full max-w-[380px] h-[28rem] min-h-[28rem]"
                      enableAnimations={true}
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16 text-gray-500">
              <p className="text-xl">No albums available at the moment.</p>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
