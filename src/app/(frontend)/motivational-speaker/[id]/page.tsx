"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Loader2, Clock, Play } from "lucide-react";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { VideoPlayerModal } from "@/components/ui/video-player-modal";

interface MotivationSpeaker {
  id: string;
  name: string;
  date: string;
  phone: string;
  email: string;
  timings: string;
  category: string;
  status: string;
  coverImage?: string;
  bannerImage?: string;
  profileImage?: string;
  images: string[];
  videos: string[];
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export default function MotivationalSpeakerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const [speaker, setSpeaker] = useState<MotivationSpeaker | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [videoModal, setVideoModal] = useState<{
    open: boolean;
    url: string;
    title: string;
  }>({ open: false, url: "", title: "" });
  const [selectedVideoIndex, setSelectedVideoIndex] = useState(0);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    if (!id) return;

    const fetchSpeaker = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`/api/motivation-speaker/${id}`);
        if (!response.ok) {
          if (response.status === 404) throw new Error("Speaker not found");
          throw new Error("Failed to fetch speaker");
        }
        const data = await response.json();
        setSpeaker(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load speaker"
        );
      } finally {
        setLoading(false);
      }
    };
    fetchSpeaker();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="flex flex-col justify-center items-center h-[calc(100vh-200px)]">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-lg text-muted-foreground">
            Loading speaker details...
          </p>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !speaker) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="flex flex-col justify-center items-center h-[calc(100vh-200px)]">
          <p className="text-lg text-red-500">{error || "Speaker not found"}</p>
          <button
            type="button"
            onClick={() => router.push("/motivational-speaker")}
            className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
          >
            Back to Motivational Speakers
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  const bannerSrc =
    speaker.bannerImage || "/banners/9983f4c9bb5fd3f6d8213d08ad1e99d3.jpg";
  const initials = speaker.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const videos = speaker.videos ?? [];
  const images = speaker.images ?? [];

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Banner */}
      <section className="relative w-full h-[400px] md:h-[500px] overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src={bannerSrc}
            alt={`${speaker.name} banner`}
            fill
            className="object-cover"
            priority
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = "/banners/9983f4c9bb5fd3f6d8213d08ad1e99d3.jpg";
            }}
          />
          <div className="absolute inset-0 bg-black/40" />
        </div>
      </section>

      {/* Profile block overlapping banner */}
      <section className="relative -mt-20 md:-mt-24 mb-12">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex justify-center mb-4">
            <Avatar className="h-32 w-32 md:h-40 md:w-40 border-4 border-white shadow-2xl">
              {speaker.profileImage ? (
                <AvatarImage src={speaker.profileImage} alt={speaker.name} />
              ) : null}
              <AvatarFallback className="bg-gradient-to-br from-amber-500 to-orange-600 text-white text-3xl md:text-4xl font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
          </div>
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-2">
              {speaker.name}
            </h1>
            {speaker.category && (
              <p className="text-lg text-gray-600 mb-1">{speaker.category}</p>
            )}
            {speaker.timings && (
              <div className="flex items-center justify-center gap-2 text-gray-600 mt-2">
                <Clock className="h-5 w-5 text-primary" />
                <span>{speaker.timings}</span>
              </div>
            )}
          </div>

          {/* About */}
          {speaker.description && (
            <div className="max-w-3xl mx-auto mb-12">
              <h2 className="text-2xl font-serif font-bold text-gray-900 mb-4 text-center">
                About
              </h2>
              <div className="bg-[#f5f5f0] rounded-2xl p-6 text-gray-700 leading-relaxed">
                {speaker.description}
              </div>
            </div>
          )}

          {/* Videos – same layout as Gallery: main player + thumbnails row */}
          {videos.length > 0 && (
            <div className="mb-12">
              <h2 className="text-2xl font-serif font-bold text-gray-900 mb-6 text-center">
                Videos
              </h2>
              <div className="space-y-4">
                <div className="relative w-full aspect-video md:aspect-[2/1] bg-gray-900 rounded-xl overflow-hidden max-w-4xl mx-auto">
                  <video
                    src={videos[selectedVideoIndex]}
                    className="absolute inset-0 w-full h-full object-cover"
                    muted
                    preload="metadata"
                    playsInline
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setVideoModal({
                        open: true,
                        url: videos[selectedVideoIndex],
                        title: `${speaker.name} – Video ${selectedVideoIndex + 1}`,
                      })
                    }
                    className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/20 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
                  >
                    <span className="rounded-full bg-black/60 p-4 md:p-5 text-white hover:bg-primary/80 transition-colors">
                      <Play className="h-12 w-12 md:h-14 md:w-14 fill-white" />
                    </span>
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2 max-w-4xl mx-auto">
                  {videos.map((url, index) => (
                    <button
                      key={url}
                      type="button"
                      onClick={() => setSelectedVideoIndex(index)}
                      className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                        selectedVideoIndex === index
                          ? "border-primary ring-2 ring-primary/20"
                          : "border-transparent hover:border-primary/50"
                      }`}
                    >
                      <video
                        src={url}
                        className="absolute inset-0 w-full h-full object-cover"
                        muted
                        preload="metadata"
                        playsInline
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                        <Play className="h-8 w-8 fill-white drop-shadow-md" />
                      </div>
                      <div className="absolute bottom-1 left-1 right-1 text-center">
                        <span className="text-xs font-medium text-white drop-shadow-md bg-black/50 px-2 py-0.5 rounded">
                          Video {index + 1}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Images gallery */}
          {images.length > 0 && (
            <div>
              <h2 className="text-2xl font-serif font-bold text-gray-900 mb-6 text-center">
                Gallery
              </h2>
              <div className="space-y-4">
                <div className="relative w-full aspect-video md:aspect-[2/1] bg-gray-200 rounded-xl overflow-hidden max-w-4xl mx-auto">
                  <Image
                    src={images[selectedImageIndex] ?? images[0]}
                    alt={`Gallery ${selectedImageIndex + 1}`}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2 max-w-4xl mx-auto">
                  {images.map((img, index) => (
                    <button
                      key={img}
                      type="button"
                      onClick={() => setSelectedImageIndex(index)}
                      className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                        selectedImageIndex === index
                          ? "border-primary ring-2 ring-primary/20"
                          : "border-transparent hover:border-primary/50"
                      }`}
                    >
                      <Image
                        src={img}
                        alt={`Gallery ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <VideoPlayerModal
        open={videoModal.open}
        onOpenChange={(open) => setVideoModal((p) => ({ ...p, open }))}
        videoUrl={videoModal.url}
        title={videoModal.title}
      />

      <Footer />
    </div>
  );
}
