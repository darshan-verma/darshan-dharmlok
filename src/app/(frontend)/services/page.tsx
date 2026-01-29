"use client";

import Link from "next/link";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { ProfileCard } from "@/components/ui/profile-card";
import { PageBanner } from "@/components/shared/PageBanner";

const SERVICES = [
  {
    name: "Book Pooja",
    description: "Discover and book traditional pooja services from experienced panditjis.",
    image: "/services/book-pooja.jpg",
    href: "/book-pooja",
  },
  {
    name: "Dharmshala",
    description: "Find comfortable accommodations near temples for your pilgrimage.",
    image: "/services/dharmshala.jpg",
    href: "/dharmshala",
  },
  {
    name: "Temple",
    description: "Discover sacred temples and plan your spiritual journey to holy places.",
    image: "/services/temple.jpg",
    href: "/temple",
  },
  {
    name: "Audio Library",
    description: "Access a vast collection of spiritual chants, mantras, and devotional music.",
    image: "/services/audio-library.jpg",
    href: "/audio-library",
  },
  {
    name: "Events",
    description: "Stay updated with upcoming religious festivals, ceremonies, and spiritual gatherings.",
    image: "/services/events.jpg",
    href: "/events",
  },
  {
    name: "Yoga",
    description: "Book free and paid yoga sessions with certified instructors.",
    image: "/services/yoga.jpg",
    href: "/book-yoga",
  },
  {
    name: "Motivational Speaker",
    description: "Connect with inspiring spiritual leaders and motivational speakers for guidance.",
    image: "/services/motivational-speaker.jpg",
    href: "/motivational-speaker",
  },
  {
    name: "E-Books",
    description: "Explore spiritual e-books and digital reading resources.",
    image: "/services/e-book.webp",
    href: "/e-book",
  },
  {
    name: "Balvidhya",
    description: "Educational programs and spiritual learning for children.",
    image: "/services/bal-vidhya.jpg",
    href: "/bal-vidhya",
  },
  {
    name: "Blogs",
    description: "Read articles, guides, and insights on spirituality and tradition.",
    image: "/services/blogs.jpg",
    href: "/blogs",
  },
  {
    name: "E shop",
    description: "Discover authentic spiritual products, pooja items, and sacred artifacts.",
    image: "/services/e-shop.jpg",
    href: "/e-shop",
  },
] as const;

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      <PageBanner
        pageSlug="services"
        title="Our Services"
        description="Explore all that Dharmlok has to offer for your spiritual journey"
        alt="Our Services"
        className="h-[400px] md:h-[500px]"
        titleClassName="text-4xl md:text-6xl lg:text-7xl font-serif font-bold text-white mb-4 drop-shadow-2xl"
        descriptionClassName="text-xl md:text-2xl text-white/90 max-w-2xl mx-auto drop-shadow-lg font-light"
      />

      {/* Service cards - pooja-style with increased size */}
      <section className="py-16 bg-[#f5f5f0]">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="grid gap-8 justify-items-center grid-cols-[repeat(auto-fill,minmax(360px,1fr))]">
            {SERVICES.map((service) => (
              <Link
                key={service.name}
                href={service.href}
                className="block w-full max-w-[380px] focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-4 rounded-3xl"
              >
                <ProfileCard
                  variant="dharamshala"
                  name={service.name}
                  description={service.description}
                  image={service.image}
                  onBook={() => {}}
                  className="w-full max-w-[380px] h-[28rem] min-h-[28rem]"
                  enableAnimations={true}
                />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
