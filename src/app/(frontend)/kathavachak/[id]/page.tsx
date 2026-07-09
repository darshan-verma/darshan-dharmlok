"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { Loader2 } from "lucide-react";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Biography from "@/app/dashboard/components/biography";
import PostsViewer from "@/components/shared/PostsViewer";
import VideoGallery from "@/app/dashboard/components/video-gallery";
import PhotoGallery from "@/app/dashboard/components/photo-gallery";
import { useLanguage } from "@/components/providers/LanguageProvider";

interface KathavachakData {
  id: string;
  name: string;
  profileImageUrl?: string;
  bannerImageUrl?: string;
  bio?: string;
  description?: string;
  category?: string;
  rank?: string;
  posts?: Array<{
    id: string;
    caption: string;
    media: Array<{
      id: string;
      type: string;
      url: string;
    }>;
    createdAt: string;
  }>;
  images?: Array<{
    id: string;
    url: string;
    title?: string;
    description?: string;
  }>;
  videos?: Array<{
    id: string;
    title: string;
    videoFile: string;
    description?: string;
  }>;
}

export default function KathavachakDetailsPage() {
  const params = useParams();
  const { locale } = useLanguage();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const [kathavachak, setKathavachak] = useState<KathavachakData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchKathavachak = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Use the general users endpoint (more reliable)
        const response = await fetch(`/api/users/${id}?lang=${locale}`);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: "Failed to fetch kathavachak details" }));
          throw new Error(errorData.error || "Failed to fetch kathavachak details");
        }
        
        const userData = await response.json();
        
        // Verify it's a kathavachak user
        const userType = userData.userType?.toLowerCase() || "";
        if (userData.userType && userType !== "kathavachak") {
          throw new Error("User is not a kathavachak");
        }
        
        if (!userData) {
          throw new Error("Kathavachak not found");
        }
        
        setKathavachak(userData);
      } catch (err) {
        console.error("Error fetching kathavachak:", err);
        setError(err instanceof Error ? err.message : "Failed to load kathavachak details");
      } finally {
        setLoading(false);
      }
    };

    fetchKathavachak();
  }, [id, locale]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="flex flex-col justify-center items-center h-[calc(100vh-200px)]">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-lg text-muted-foreground">Loading kathavachak details...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !kathavachak) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="flex flex-col justify-center items-center h-[calc(100vh-200px)]">
          <p className="text-lg text-red-500">{error || "Kathavachak not found"}</p>
        </div>
        <Footer />
      </div>
    );
  }

  const avatarName = kathavachak.name
    .split(" ")
    .map((n) => n[0])
    .join("");

  // Fallback banner image
  const bannerSrc = kathavachak.bannerImageUrl || "/banners/9983f4c9bb5fd3f6d8213d08ad1e99d3.jpg";
  const avatarSrc = kathavachak.profileImageUrl || "";

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Banner Section */}
      <section className="relative w-full h-[400px] md:h-[500px] overflow-hidden">
        {/* Banner Image */}
        <div className="absolute inset-0">
          {bannerSrc ? (
            <Image
              src={bannerSrc}
              alt={`${kathavachak.name}'s banner`}
              fill
              className="object-cover"
              priority
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = "/landing-page/amritsar-6185143.jpg";
              }}
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-orange-400 to-yellow-500" />
          )}
          {/* Dark overlay for better readability */}
          <div className="absolute inset-0 bg-black/30" />
        </div>
      </section>

      {/* Profile Section */}
      <section className="relative -mt-20 md:-mt-24 mb-8">
        <div className="container mx-auto px-4 max-w-7xl">
          {/* Profile Image (cutting into banner) */}
          <div className="flex justify-center mb-4">
            <Avatar className="h-32 w-32 md:h-40 md:w-40 border-4 border-white shadow-2xl">
              {avatarSrc ? (
                <AvatarImage src={avatarSrc} alt={kathavachak.name} />
              ) : null}
              <AvatarFallback className="bg-gradient-to-br from-orange-400 to-yellow-500 text-white text-3xl md:text-4xl font-bold">
                {avatarName}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Name and Category */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-2">
              {kathavachak.name}
            </h1>
            {kathavachak.category && (
              <p className="text-lg text-gray-600 mb-1">{kathavachak.category}</p>
            )}
            {kathavachak.rank && (
              <p className="text-sm text-gray-500">{kathavachak.rank}</p>
            )}
          </div>

          {/* Tabs */}
          <div className="max-w-5xl mx-auto">
            <Tabs defaultValue="biography" className="w-full">
              <TabsList className="grid grid-cols-4 w-full mb-8">
                <TabsTrigger value="biography">Biography</TabsTrigger>
                <TabsTrigger value="posts">Posts</TabsTrigger>
                <TabsTrigger value="videos">Videos</TabsTrigger>
                <TabsTrigger value="photos">Photos</TabsTrigger>
              </TabsList>

              <TabsContent value="biography" className="mt-6">
                <Biography
                  userId={kathavachak.id}
                  userType="kathavachak"
                  editable={false}
                />
              </TabsContent>

              <TabsContent value="posts" className="mt-6">
                <PostsViewer
                  userId={kathavachak.id}
                  userType="kathavachak"
                />
              </TabsContent>

              <TabsContent value="videos" className="mt-6">
                <VideoGallery
                  userId={kathavachak.id}
                  editable={false}
                  source="kathavachak-dashboard,kathavachak-post"
                />
              </TabsContent>

              <TabsContent value="photos" className="mt-6">
                <PhotoGallery
                  userId={kathavachak.id}
                  editable={false}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
