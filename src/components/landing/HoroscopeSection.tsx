"use client";

import Image from "next/image";
import {
  CalendarDays,
  SunMoon,
  HeartHandshake,
  Clock3,
  Sparkles,
  PhoneCall,
} from "lucide-react";
import { ExpandingCards, type CardItem } from "@/components/ui/expanding-cards";

export interface HoroscopeSectionProps {
  title?: string;
  description?: string;
}

const DEFAULT_HOROSCOPE_ITEMS: CardItem[] = [
  {
    id: "daily-horoscope",
    title: "Daily Horoscope",
    description:
      "Get personalized daily guidance for each zodiac sign with practical insights for career, relationships, and health.",
    imgSrc:
      "https://images.unsplash.com/photo-1532968961962-8a0cb3a2d4f5?auto=format&fit=crop&w=1400&q=80",
    icon: <SunMoon size={24} />,
    linkHref: "/horoscope/daily-horoscope",
  },
  {
    id: "panchang",
    title: "Today Panchang",
    description:
      "View tithi, nakshatra, yoga, karana, and sunrise-sunset timings to plan your day according to Vedic tradition.",
    imgSrc:
      "https://images.unsplash.com/photo-1518562180175-34a163b1a9a6?auto=format&fit=crop&w=1400&q=80",
    icon: <CalendarDays size={24} />,
    linkHref: "/horoscope/panchang",
  },
  {
    id: "kundli-matching",
    title: "Kundli Matching",
    description:
      "Compare horoscopes for compatibility insights and dosha checks to support confident matrimonial decisions.",
    imgSrc:
      "https://images.unsplash.com/photo-1464802686167-b939a6910659?auto=format&fit=crop&w=1400&q=80",
    icon: <HeartHandshake size={24} />,
    linkHref: "/horoscope/kundli-matching",
  },
  {
    id: "muhurat",
    title: "Shubh Muhurat",
    description:
      "Find auspicious timings for marriage, griha pravesh, business launch, and other major life ceremonies.",
    imgSrc:
      "https://images.unsplash.com/photo-1501139083538-0139583c060f?auto=format&fit=crop&w=1400&q=80",
    icon: <Clock3 size={24} />,
    linkHref: "/horoscope/auspicious-period",
  },
  {
    id: "festival-guide",
    title: "Festival Guide",
    description:
      "Stay updated with upcoming vrat, festivals, and rituals, including date-wise significance and observance details.",
    imgSrc:
      "https://images.unsplash.com/photo-1532372576444-dda954194ad0?auto=format&fit=crop&w=1400&q=80",
    icon: <Sparkles size={24} />,
    linkHref: "/horoscope/calendar",
  },
  {
    id: "astro-consultation",
    title: "Astro Consultation",
    description:
      "Connect with expert astrologers for one-on-one guidance on career path, relationship clarity, and life decisions.",
    imgSrc:
    "https://images.unsplash.com/photo-1581016758146-35c365b9a161?q=80&w=1287&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    icon: <PhoneCall size={24} />,
    linkHref: "/horoscope/birth-details",
  },
];

export default function HoroscopeSection({
  title = "Horoscope Services",
  description = "Explore daily horoscope updates, Panchang, and essential astrology services to guide your spiritual and personal journey.",
}: HoroscopeSectionProps = {}) {
  return (
    <section
      id="horoscope-services"
      className="relative overflow-hidden bg-[#f5f5f0]/80 py-20 backdrop-blur-sm"
    >
      <div className="absolute inset-0 opacity-5">
        <div className="absolute left-20 top-20 h-56 w-56 rounded-full border border-orange-500" />
        <div className="absolute bottom-20 right-20 h-40 w-40 rounded-full border border-orange-500" />
      </div>

      <div className="container relative z-10 mx-auto px-4">
        <div className="mb-16 text-center">
          <h2 className="mb-4 font-serif text-5xl font-bold text-gray-900">
            {title}
          </h2>
          <div className="mb-6 flex justify-center">
            <Image
              src="/landing-page/1.png"
              alt="Decorative Divider"
              width={200}
              height={20}
              className="object-contain"
            />
          </div>
          <p className="mx-auto max-w-2xl text-gray-600">{description}</p>
        </div>

        <div className="mx-auto max-w-7xl">
          <ExpandingCards items={DEFAULT_HOROSCOPE_ITEMS} defaultActiveIndex={0} />
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="h-24 w-full">
          <path
            d="M0,60 Q300,100 600,60 T1200,60 L1200,120 L0,120 Z"
            fill="#f5f5f0"
          />
        </svg>
      </div>
    </section>
  );
}
