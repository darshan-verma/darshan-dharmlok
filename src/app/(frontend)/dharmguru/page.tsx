"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { KathavachakDharmguruCard } from "@/components/shared/kathavachak-dharmguru-card";
import { PageBanner } from "@/components/shared/PageBanner";
import { CardsPagination, CARDS_PER_PAGE } from "@/components/shared/CardsPagination";

interface Dharmguru {
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

export default function DharmguruPage() {
  const router = useRouter();
  const [dharmgurus, setDharmgurus] = useState<Dharmguru[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingCardId, setLoadingCardId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);

  useEffect(() => {
    const fetchDharmgurus = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/users/dharmguru?limit=${CARDS_PER_PAGE}&page=${currentPage}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch dharmgurus");
        }
        const data = await response.json();
        const list = data.data && Array.isArray(data.data)
          ? data.data
          : data.dharmgurus && Array.isArray(data.dharmgurus)
            ? data.dharmgurus
            : Array.isArray(data)
              ? data
              : [];
        setDharmgurus(list);
        if (data.pagination) {
          setPagination({
            currentPage: data.pagination.currentPage,
            totalPages: data.pagination.totalPages,
            totalCount: data.pagination.totalCount,
          });
        }
      } catch (error) {
        console.error("Error fetching dharmgurus:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDharmgurus();
  }, [currentPage]);

  useEffect(() => {
    if (currentPage > 1) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [currentPage]);

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <PageBanner
        pageSlug="dharmguru"
        title="Dharmguru"
        description="Connect with our spiritual guides and experience the wisdom of ancient traditions"
        alt="Dharmguru Banner"
        titleClassName="text-4xl md:text-6xl lg:text-7xl font-serif font-bold text-white mb-6 drop-shadow-2xl animate-fade-in-up"
      />

      {/* Dharmguru Cards Section */}
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
          ) : dharmgurus.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {dharmgurus.map((dharmguru) => (
                  <KathavachakDharmguruCard
                    key={dharmguru.id}
                    dharmguru={dharmguru}
                    isLoading={loadingCardId === dharmguru.id}
                    onGetInTouch={() => {
                      setLoadingCardId(dharmguru.id);
                      router.push(`/dharmguru/${dharmguru.id}`);
                    }}
                    onBookmark={() => console.log(`Bookmark ${dharmguru.name}`)}
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
              <p className="text-xl">No dharmgurus available at the moment.</p>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
