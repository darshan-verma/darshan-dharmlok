"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { KathavachakDharmguruCard } from "@/components/shared/kathavachak-dharmguru-card";
import { CardsPagination, CARDS_PER_PAGE } from "@/components/shared/CardsPagination";

interface Panditji {
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

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalCount: number;
}

export default function PanditjiPage() {
  const router = useRouter();
  const [panditjis, setPanditjis] = useState<Panditji[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingCardId, setLoadingCardId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);

  useEffect(() => {
    const fetchPanditjis = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/users/panditji?limit=${CARDS_PER_PAGE}&page=${currentPage}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch panditjis");
        }
        const data = await response.json();
        const list = data.data && Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : [];
        setPanditjis(list);
        if (data.pagination) {
          setPagination({
            currentPage: data.pagination.currentPage,
            totalPages: data.pagination.totalPages,
            totalCount: data.pagination.totalCount,
          });
        }
      } catch (error) {
        console.error("Error fetching panditjis:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPanditjis();
  }, [currentPage]);

  useEffect(() => {
    if (currentPage > 1) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [currentPage]);

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Banner Section with Text Overlay */}
      <section className="relative w-full h-[500px] md:h-[600px] overflow-hidden">
        {/* Banner Image */}
        <div className="absolute inset-0">
          <Image
            src="/banners/9983f4c9bb5fd3f6d8213d08ad1e99d3.jpg"
            alt="Panditji Banner"
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
              Panditji
            </h1>
            <p className="text-xl md:text-2xl lg:text-3xl text-white/90 max-w-3xl mx-auto drop-shadow-lg font-light" style={{ fontFamily: 'var(--font-jost), sans-serif' }}>
              Connect with our spiritual guides and experience the wisdom of ancient traditions
            </p>
          </div>
        </div>
      </section>

      {/* Panditji Cards Section */}
      <section className="py-16 bg-[#f5f5f0]">
        <div className="container mx-auto px-4 max-w-7xl">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(CARDS_PER_PAGE)].map((_, index) => (
                <div
                  key={index}
                  className="bg-gray-300 rounded-2xl h-96 animate-pulse"
                />
              ))}
            </div>
          ) : panditjis.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {panditjis.map((panditji) => (
                  <KathavachakDharmguruCard
                    key={panditji.id}
                    dharmguru={panditji}
                    isLoading={loadingCardId === panditji.id}
                    onGetInTouch={() => {
                      setLoadingCardId(panditji.id);
                      router.push(`/panditji/${panditji.id}`);
                    }}
                    onBookmark={() => console.log(`Bookmark ${panditji.name}`)}
                  />
                ))}
              </div>
              {pagination && (
                <CardsPagination
                  currentPage={pagination.currentPage}
                  totalPages={pagination.totalPages}
                  totalCount={pagination.totalCount}
                  onPageChange={setCurrentPage}
                />
              )}
            </>
          ) : (
            <div className="text-center py-16 text-gray-500">
              <p className="text-xl">No panditjis available at the moment.</p>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
