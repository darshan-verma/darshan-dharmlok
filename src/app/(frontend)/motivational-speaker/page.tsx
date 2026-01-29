"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Loader2, Play } from "lucide-react";
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

type RecordedSession = {
  videoUrl: string;
  speakerName: string;
  speakerId: string;
  title: string;
};

const DEFAULT_BANNER = "/banners/9983f4c9bb5fd3f6d8213d08ad1e99d3.jpg";

export default function MotivationalSpeakerPage() {
  const router = useRouter();
  const [speakers, setSpeakers] = useState<MotivationSpeaker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessions, setSessions] = useState<RecordedSession[]>([]);
  const [videoModal, setVideoModal] = useState<{
    open: boolean;
    url: string;
    title: string;
  }>({ open: false, url: "", title: "" });

  useEffect(() => {
    const fetchSpeakers = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(
          "/api/motivation-speaker?limit=50&page=1"
        );
        if (!response.ok) throw new Error("Failed to fetch speakers");
        const result = await response.json();
        const list: MotivationSpeaker[] = result.data ?? [];
        const active = list.filter((s) => s.status === "Active");
        setSpeakers(active);

        const allSessions: RecordedSession[] = [];
        active.forEach((speaker) => {
          (speaker.videos ?? []).forEach((url, idx) => {
            allSessions.push({
              videoUrl: url,
              speakerName: speaker.name,
              speakerId: speaker.id,
              title: `${speaker.name} – Session ${idx + 1}`,
            });
          });
        });
        setSessions(allSessions);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load speakers"
        );
      } finally {
        setLoading(false);
      }
    };
    fetchSpeakers();
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Banner */}
      <section className="relative w-full h-[400px] md:h-[500px] overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src={DEFAULT_BANNER}
            alt="Motivational Speakers"
            fill
            className="object-cover"
            priority
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src =
                "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=1200&h=600&fit=crop";
            }}
          />
          <div className="absolute inset-0 bg-black/45" />
        </div>
        <div className="relative z-10 h-full flex items-center justify-center">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif font-bold text-white mb-4 drop-shadow-2xl">
              Motivational Speakers
            </h1>
            <p
              className="text-xl md:text-2xl text-white/90 max-w-2xl mx-auto drop-shadow-lg font-light"
              style={{ fontFamily: "var(--font-jost), sans-serif" }}
            >
              Wisdom and inspiration from our speakers
            </p>
          </div>
        </div>
      </section>

      {/* Speakers – Avatars with names */}
      <section className="py-16 bg-[#f5f5f0]">
        <div className="container mx-auto px-4 max-w-7xl">
          <h2 className="text-2xl md:text-3xl font-serif font-bold text-gray-900 mb-8 text-center">
            Our Speakers
          </h2>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Loading speakers...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-500">{error}</p>
            </div>
          ) : speakers.length > 0 ? (
            <div className="flex flex-wrap justify-center gap-8 md:gap-10">
              {speakers.map((speaker) => {
                const initials = speaker.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase();
                return (
                  <button
                    key={speaker.id}
                    type="button"
                    onClick={() =>
                      router.push(`/motivational-speaker/${speaker.id}`)
                    }
                    className="flex flex-col items-center gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4 rounded-full"
                  >
                    <Avatar className="h-24 w-24 md:h-28 md:w-28 border-4 border-white shadow-xl group-hover:scale-105 transition-transform">
                      {speaker.profileImage ? (
                        <AvatarImage
                          src={speaker.profileImage}
                          alt={speaker.name}
                        />
                      ) : null}
                      <AvatarFallback className="bg-gradient-to-br from-amber-500 to-orange-600 text-white text-2xl font-bold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-base md:text-lg font-medium text-gray-800 group-hover:text-primary transition-colors max-w-[120px] text-center truncate">
                      {speaker.name}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p className="text-xl">No speakers available at the moment.</p>
            </div>
          )}
        </div>
      </section>

      {/* Recorded Sessions – Video cards */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 max-w-7xl">
          <h2 className="text-2xl md:text-3xl font-serif font-bold text-gray-900 mb-8 text-center">
            Recorded Sessions
          </h2>
          {loading ? null : sessions.length > 0 ? (
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {sessions.map((session, index) => (
                <button
                  key={`${session.speakerId}-${index}`}
                  type="button"
                  onClick={() =>
                    setVideoModal({
                      open: true,
                      url: session.videoUrl,
                      title: session.title,
                    })
                  }
                  className="group text-left rounded-2xl overflow-hidden border border-gray-200 bg-[#f5f5f0] hover:border-primary/40 hover:shadow-lg transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  <div className="relative aspect-video bg-gray-900 overflow-hidden">
                    <video
                      src={session.videoUrl}
                      className="absolute inset-0 w-full h-full object-cover"
                      muted
                      preload="metadata"
                      playsInline
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <span className="rounded-full bg-black/60 p-4 text-white group-hover:bg-primary/80 transition-colors">
                        <Play className="h-10 w-10 md:h-12 md:w-12 fill-white" />
                      </span>
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="font-semibold text-gray-900 truncate">
                      {session.title}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {session.speakerName}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p className="text-xl">No recorded sessions yet.</p>
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
