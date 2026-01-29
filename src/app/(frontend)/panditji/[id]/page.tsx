"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Image from "next/image";
import { IndianRupee, Loader2, Mail, MapPin, Phone } from "lucide-react";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Biography from "@/app/dashboard/components/biography";
import PoojaServicesViewer from "@/components/shared/PoojaServicesViewer";
import PanditjiVideoGallery from "@/components/shared/PanditjiVideoGallery";
import PanditjiPhotoGallery from "@/components/shared/PanditjiPhotoGallery";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface PanditjiData {
  id: string;
  name: string;
  profileImageUrl?: string;
  bannerImageUrl?: string;
  bio?: string;
  description?: string;
  category?: string;
  rank?: string;
  phone?: string;
  email?: string;
  addresses?: Array<{
    id?: string;
    type?: string;
    label?: string;
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    country?: string;
    pincode?: string;
  }>;
  serviceOfferings?: Array<{
    id: string;
    serviceType: string;
    targetType?: string;
    targetId?: string;
    price: number;
    details?: string;
    status?: string;
  }>;
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

export default function PanditjiDetailsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const selectedServiceId = searchParams.get("serviceId");
  const [panditji, setPanditji] = useState<PanditjiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contactOpen, setContactOpen] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchPanditji = async () => {
      try {
        setLoading(true);
        setError(null);

        // Use panditji endpoint to include serviceOfferings (needed for selected service pricing)
        const response = await fetch(`/api/users/panditji/${id}`);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: "Failed to fetch panditji details" }));
          throw new Error(errorData.error || "Failed to fetch panditji details");
        }
        
        const apiData = await response.json();
        const userData = apiData?.data ?? apiData;

        if (!userData) {
          throw new Error("Panditji not found");
        }
        
        setPanditji(userData);
      } catch (err) {
        console.error("Error fetching panditji:", err);
        setError(err instanceof Error ? err.message : "Failed to load panditji details");
      } finally {
        setLoading(false);
      }
    };

    fetchPanditji();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="flex flex-col justify-center items-center h-[calc(100vh-200px)]">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-lg text-muted-foreground">Loading panditji details...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !panditji) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="flex flex-col justify-center items-center h-[calc(100vh-200px)]">
          <p className="text-lg text-red-500">{error || "Panditji not found"}</p>
        </div>
        <Footer />
      </div>
    );
  }

  const avatarName = panditji.name
    .split(" ")
    .map((n) => n[0])
    .join("");

  // Fallback banner image
  const bannerSrc = panditji.bannerImageUrl || "/banners/9983f4c9bb5fd3f6d8213d08ad1e99d3.jpg";
  const avatarSrc = panditji.profileImageUrl || "";

  const selectedOffering =
    selectedServiceId && Array.isArray(panditji.serviceOfferings)
      ? panditji.serviceOfferings.find(
          (o) =>
            o.status === "Active" &&
            o.targetType === "PoojaCategory" &&
            o.targetId === selectedServiceId
        )
      : undefined;

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
              alt={`${panditji.name}'s banner`}
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
                <AvatarImage src={avatarSrc} alt={panditji.name} />
              ) : null}
              <AvatarFallback className="bg-gradient-to-br from-orange-400 to-yellow-500 text-white text-3xl md:text-4xl font-bold">
                {avatarName}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Name and Category */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-2">
              {panditji.name}
            </h1>
            {panditji.category && (
              <p className="text-lg text-gray-600 mb-1">{panditji.category}</p>
            )}
            {panditji.rank && (
              <p className="text-sm text-gray-500">{panditji.rank}</p>
            )}
          </div>

          {/* Tabs */}
          <div className="max-w-5xl mx-auto">
            <Tabs defaultValue="biography" className="w-full">
              <TabsList className="grid grid-cols-4 w-full mb-8">
                <TabsTrigger value="biography">Biography</TabsTrigger>
                <TabsTrigger value="pooja-services">Pooja Services</TabsTrigger>
                <TabsTrigger value="videos">Videos</TabsTrigger>
                <TabsTrigger value="photos">Photos</TabsTrigger>
              </TabsList>

              <TabsContent value="biography" className="mt-6">
                <Biography
                  userId={panditji.id}
                  userType="panditji"
                  editable={false}
                />
              </TabsContent>

              <TabsContent value="pooja-services" className="mt-6">
                <PoojaServicesViewer userId={panditji.id} />
              </TabsContent>

              <TabsContent value="videos" className="mt-6">
                <PanditjiVideoGallery userId={panditji.id} />
              </TabsContent>

              <TabsContent value="photos" className="mt-6">
                <PanditjiPhotoGallery
                  userId={panditji.id}
                  profileImageUrl={panditji.profileImageUrl}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </section>

      {/* Bottom Navbar for Pricing and Actions */}
      {selectedOffering && (
        <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center px-4 pb-4">
          <div className="w-full max-w-2xl bg-white border border-gray-200 shadow-xl rounded-3xl">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 py-4 px-6">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <IndianRupee className="h-6 w-6 text-orange-600" />
                  <p className="text-2xl md:text-3xl font-bold text-gray-900">
                    {selectedOffering.price.toLocaleString("en-IN")}
                  </p>
                </div>
              </div>
              <div className="flex gap-3 w-full md:w-auto">
                <Button
                  className="flex-1 md:flex-none"
                  onClick={() => {
                    setContactOpen(true);
                  }}
                >
                  Book Now
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 md:flex-none"
                  onClick={() => setContactOpen(true)}
                >
                  Contact Panditji
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contact Dialog */}
      <Dialog open={contactOpen} onOpenChange={setContactOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Contact Information</DialogTitle>
            <DialogDescription>Get in touch with {panditji.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {panditji.phone && (
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Phone className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500">Phone</p>
                  <a
                    href={`tel:${panditji.phone}`}
                    className="text-sm font-medium text-gray-900 hover:text-blue-600"
                  >
                    {panditji.phone}
                  </a>
                </div>
              </div>
            )}
            {panditji.email && (
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Mail className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500">Email</p>
                  <a
                    href={`mailto:${panditji.email}`}
                    className="text-sm font-medium text-blue-600 hover:underline"
                  >
                    {panditji.email}
                  </a>
                </div>
              </div>
            )}
            {panditji.addresses && panditji.addresses.length > 0 && (
              <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <MapPin className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 mb-1">Address</p>
                  {panditji.addresses.map((addr, idx) => (
                    <p key={addr.id ?? idx} className="text-sm font-medium text-gray-900">
                      {[
                        addr.line1,
                        addr.line2,
                        addr.city,
                        addr.state,
                        addr.country,
                        addr.pincode,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Add padding bottom when navbar is visible */}
      {selectedOffering && <div className="h-24" />}

      <Footer />
    </div>
  );
}
