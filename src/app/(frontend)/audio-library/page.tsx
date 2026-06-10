"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { ProfileCard } from "@/components/ui/profile-card";
import { PageBanner } from "@/components/shared/PageBanner";
import { SimpleSearchFilterBar } from "@/components/shared/SimpleSearchFilterBar";

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

export default function AudioLibraryPage() {
  const router = useRouter();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [selectedReligiousCategory, setSelectedReligiousCategory] = useState("all");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearchQuery(searchQuery.trim());
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedReligiousCategory("all");
  };

  useEffect(() => {
    const fetchAlbums = async () => {
      try {
        setLoading(true);
        setError(null);
        const params = new URLSearchParams({ status: "Active" });
        if (selectedReligiousCategory !== "all") {
          params.set("religiousCategory", selectedReligiousCategory);
        }
        if (debouncedSearchQuery) {
          params.set("search", debouncedSearchQuery);
        }
        const response = await fetch(`/api/audio-library?${params.toString()}`);
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
  }, [selectedReligiousCategory, debouncedSearchQuery]);

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <PageBanner
        pageSlug="audio-library"
        title="Audio Library"
        description="Chants, mantras, and devotional music"
        alt="Audio Library"
        className="h-[400px] md:h-[500px]"
        titleClassName="text-4xl md:text-6xl lg:text-7xl font-serif font-bold text-white mb-4 drop-shadow-2xl"
        descriptionClassName="text-xl md:text-2xl text-white/90 max-w-2xl mx-auto drop-shadow-lg font-light"
      />

      <section className="py-16 bg-[#f5f5f0]">
        <div className="container mx-auto px-4 max-w-7xl">
          <SimpleSearchFilterBar
            page="audio-library"
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Search albums by name"
            religiousValue={selectedReligiousCategory}
            onReligiousChange={setSelectedReligiousCategory}
            onClear={clearFilters}
            resultText={
              !loading && !error
                ? `${albums.length} album${albums.length !== 1 ? "s" : ""} found`
                : undefined
            }
          />
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
                const DEFAULT_ALBUM_IMAGE = "/images/audio_album_placeholder.jpg";
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
