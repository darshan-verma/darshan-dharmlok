"use client";

import { Button } from "@/components/ui/button";
import { Globe } from "@/components/ui/cobe-globe";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

const markers = [
  { id: "varanasi", location: [25.3176, 82.9739] as [number, number], label: "Varanasi" },
  { id: "haridwar", location: [29.9457, 78.1642] as [number, number], label: "Haridwar" },
  { id: "rameswaram", location: [9.2876, 79.3129] as [number, number], label: "Rameswaram" },
  { id: "puri", location: [19.8135, 85.8312] as [number, number], label: "Puri" },
  { id: "ujjain", location: [23.1765, 75.7885] as [number, number], label: "Ujjain" },
];

const arcs = [
  {
    id: "north-south-yatra",
    from: [29.9457, 78.1642] as [number, number],
    to: [9.2876, 79.3129] as [number, number],
    label: "North -> South",
  },
  {
    id: "kashi-jagannath",
    from: [25.3176, 82.9739] as [number, number],
    to: [19.8135, 85.8312] as [number, number],
    label: "Kashi -> Jagannath",
  },
];

export default function Featured_05() {
  return (
    <section className="relative w-full mx-auto overflow-hidden rounded-3xl bg-[#f5f5f0]/80 backdrop-blur-sm border border-gray-200 shadow-md px-6 py-16 md:px-16 md:py-24">
      <div className="flex flex-col-reverse items-center justify-between gap-10 md:flex-row">
        <div className="z-10 max-w-xl text-left">
          <h1 className="text-3xl font-normal text-gray-900">
            Explore Sacred Destinations with <span className="text-orange-500">Dharmlok Travel Portal</span>{" "}
            <span className="text-gray-600 block mt-2 text-lg font-normal">Plan your spiritual journey to holy places across India. Book flights, hotels, and pilgrimage packages with ease.</span>
          </h1>
          <Link href="/travel-portal">
            <Button className="mt-6 inline-flex items-center gap-2 rounded-full bg-orange-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-orange-600">
              Explore Travel Portal <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
        <div className="relative h-[180px] w-full max-w-xl">
          <Globe
            className="absolute -bottom-20 -right-40 scale-150"
            markers={markers}
            arcs={arcs}
            markerColor={[0.3, 0.45, 0.85]}
            baseColor={[1, 1, 1]}
            arcColor={[0.3, 0.45, 0.85]}
            glowColor={[0.94, 0.93, 0.91]}
            dark={0}
            mapBrightness={10}
            markerSize={0.025}
            markerElevation={0.01}
          />
        </div>
      </div>
    </section>
  );
}
