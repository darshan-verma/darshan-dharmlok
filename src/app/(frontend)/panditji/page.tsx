"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { KathavachakDharmguruCard } from "@/components/shared/kathavachak-dharmguru-card";
import { PageBanner } from "@/components/shared/PageBanner";
import { CardsPagination, CARDS_PER_PAGE } from "@/components/shared/CardsPagination";
import { SimpleSearchFilterBar } from "@/components/shared/SimpleSearchFilterBar";

interface Panditji {
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

export default function PanditjiPage() {
  const router = useRouter();
  const [panditjis, setPanditjis] = useState<Panditji[]>([]);
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
    const fetchPanditjis = async () => {
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
        const response = await fetch(`/api/users/panditji?${params.toString()}`);
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
        pageSlug="panditji"
        title="Panditji"
        description="Connect with our spiritual guides and experience the wisdom of ancient traditions"
        alt="Panditji Banner"
        titleClassName="text-4xl md:text-6xl lg:text-7xl font-serif font-bold text-white mb-6 drop-shadow-2xl animate-fade-in-up"
      />

      <section className="py-16 bg-[#f5f5f0]">
        <div className="container mx-auto px-4 max-w-7xl">
          <SimpleSearchFilterBar
            page="panditji"
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
            searchPlaceholder="Search panditjis by name"
            religiousValue={selectedReligiousCategory}
            onReligiousChange={handleReligiousCategoryChange}
            onClear={clearFilters}
            resultText={
              pagination
                ? `${pagination.totalCount} panditji${pagination.totalCount !== 1 ? "s" : ""} found`
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
