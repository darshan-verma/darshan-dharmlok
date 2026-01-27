"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { KathavachakDharmguruCard } from "@/components/shared/kathavachak-dharmguru-card";

interface Kathavachak {
  id: string;
  name: string;
  profileImageUrl?: string;
  bannerImageUrl?: string;
  bio?: string;
  description?: string;
  category?: string;
  rank?: string;
  serviceOfferings?: Array<{
    serviceType?: string;
    details?: string;
  }>;
}

export default function KathavachakPage() {
  const router = useRouter();
  const [kathavachaks, setKathavachaks] = useState<Kathavachak[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingCardId, setLoadingCardId] = useState<string | null>(null);

  useEffect(() => {
    const fetchKathavachaks = async () => {
      try {
        const response = await fetch("/api/users/kathavachak?limit=20&page=1");
        if (!response.ok) {
          throw new Error("Failed to fetch kathavachaks");
        }
        const data = await response.json();
        if (data.data && Array.isArray(data.data)) {
          setKathavachaks(data.data);
        } else if (Array.isArray(data)) {
          setKathavachaks(data);
        }
      } catch (error) {
        console.error("Error fetching kathavachaks:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchKathavachaks();
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Banner Section with Text Overlay */}
      <section className="relative w-full h-[500px] md:h-[600px] overflow-hidden">
        {/* Banner Image */}
        <div className="absolute inset-0">
          <Image
            src="/banners/9983f4c9bb5fd3f6d8213d08ad1e99d3.jpg"
            alt="Kathavachak Banner"
            fill
            className="object-cover"
            priority
            onError={(e) => {
              // Fallback to a placeholder if image doesn't exist
              const target = e.target as HTMLImageElement;
              target.src = "/landing-page/amritsar-6185143.jpg";
            }}
          />
          {/* Dark overlay for better text readability */}
          <div className="absolute inset-0 bg-black/40" />
        </div>

        {/* Text Overlay */}
        <div className="relative z-10 h-full flex items-center justify-center">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif font-bold text-white mb-6 drop-shadow-2xl animate-fade-in-up">
              Kathavachak
            </h1>
            <p className="text-xl md:text-2xl lg:text-3xl text-white/90 max-w-3xl mx-auto drop-shadow-lg font-light" style={{ fontFamily: 'var(--font-jost), sans-serif' }}>
              Connect with our spiritual guides and experience the wisdom of ancient traditions
            </p>
          </div>
        </div>
      </section>

      {/* Kathavachak Cards Section */}
      <section className="py-16 bg-[#f5f5f0]">
        <div className="container mx-auto px-4 max-w-7xl">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, index) => (
                <div
                  key={index}
                  className="bg-gray-300 rounded-2xl h-96 animate-pulse"
                />
              ))}
            </div>
          ) : kathavachaks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {kathavachaks.map((kathavachak) => (
                <KathavachakDharmguruCard
                  key={kathavachak.id}
                  dharmguru={kathavachak}
                  isLoading={loadingCardId === kathavachak.id}
                  onGetInTouch={() => {
                    setLoadingCardId(kathavachak.id);
                    router.push(`/kathavachak/${kathavachak.id}`);
                  }}
                  onBookmark={() => console.log(`Bookmark ${kathavachak.name}`)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-gray-500">
              <p className="text-xl">No kathavachaks available at the moment.</p>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
