"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { KathavachakDharmguruCard } from "@/components/shared/kathavachak-dharmguru-card";
import { PageBanner } from "@/components/shared/PageBanner";
import { CardsPagination, CARDS_PER_PAGE } from "@/components/shared/CardsPagination";
import { SimpleSearchFilterBar } from "@/components/shared/SimpleSearchFilterBar";

interface Kathavachak {
  id: string;
  name: string;
  profileImageUrl?: string;
  bannerImageUrl?: string;
  bio?: string;
  description?: string;
  category?: string;
  religiousCategories?: string[];
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

export default function KathavachakPage() {
  const router = useRouter();
  const [kathavachaks, setKathavachaks] = useState<Kathavachak[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingCardId, setLoadingCardId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [selectedReligiousCategory, setSelectedReligiousCategory] = useState("all");
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearchQuery(searchQuery.trim());
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  const handleReligiousCategoryChange = (value: string) => {
    setSelectedReligiousCategory(value);
    setCurrentPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedReligiousCategory("all");
    setCurrentPage(1);
  };

  useEffect(() => {
    const fetchKathavachaks = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          limit: String(CARDS_PER_PAGE),
          page: String(currentPage),
        });
        if (selectedReligiousCategory !== "all") {
          params.set("religiousCategory", selectedReligiousCategory);
        }
        if (debouncedSearchQuery) {
          params.set("search", debouncedSearchQuery);
        }
        const response = await fetch(`/api/users/kathavachak?${params.toString()}`);
        if (!response.ok) {
          throw new Error("Failed to fetch kathavachaks");
        }
        const data = await response.json();
        const list = data.data && Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : [];
        setKathavachaks(list);
        if (data.pagination) {
          setPagination({
            currentPage: data.pagination.currentPage,
            totalPages: data.pagination.totalPages,
            totalCount: data.pagination.totalCount,
          });
        }
      } catch (error) {
        console.error("Error fetching kathavachaks:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchKathavachaks();
  }, [currentPage, selectedReligiousCategory, debouncedSearchQuery]);

  useEffect(() => {
    if (currentPage > 1) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [currentPage]);

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <PageBanner
        pageSlug="kathavachak"
        title="Kathavachak"
        description="Connect with our spiritual guides and experience the wisdom of ancient traditions"
        alt="Kathavachak Banner"
        titleClassName="text-4xl md:text-6xl lg:text-7xl font-serif font-bold text-white mb-6 drop-shadow-2xl animate-fade-in-up"
      />

      <section className="py-16 bg-[#f5f5f0]">
        <div className="container mx-auto px-4 max-w-7xl">
          <SimpleSearchFilterBar
            page="kathavachak"
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
            searchPlaceholder="Search kathavachaks by name"
            religiousValue={selectedReligiousCategory}
            onReligiousChange={handleReligiousCategoryChange}
            onClear={clearFilters}
            resultText={
              pagination
                ? `${pagination.totalCount} kathavachak${pagination.totalCount !== 1 ? "s" : ""} found`
                : undefined
            }
          />
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(CARDS_PER_PAGE)].map((_, index) => (
                <div
                  key={index}
                  className="bg-gray-300 rounded-2xl h-96 animate-pulse"
                />
              ))}
            </div>
          ) : kathavachaks.length > 0 ? (
            <>
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
              <p className="text-xl">No kathavachaks available at the moment.</p>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
