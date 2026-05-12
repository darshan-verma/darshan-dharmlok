"use client";

import { Button } from "@/components/ui/button";
import Globe from "@/components/ui/globe";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export default function Featured_05() {
  return (
    <section className="relative w-full mx-auto overflow-hidden rounded-3xl bg-[#f5f5f0]/80 backdrop-blur-sm border border-gray-200 shadow-md px-6 py-16 md:px-16 md:py-20">
      <div className="flex flex-col-reverse items-center justify-between gap-10 md:flex-row md:items-center">
        <div className="z-10 max-w-xl text-left">
          <h1 className="text-3xl font-normal text-gray-900">
            Explore Sacred Destinations with <span className="text-orange-500">Dharmlok Travels</span>{" "}
            <span className="text-gray-600 block mt-2 text-lg font-normal">Plan your spiritual journey to holy places across India. Book flights, hotels, and pilgrimage packages with ease.</span>
          </h1>
          <Link href="/travel-portal">
            <Button className="mt-6 inline-flex items-center gap-2 rounded-full bg-orange-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-orange-600">
              Explore Dharmlok Travels <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
        <div className="relative flex w-full justify-center md:justify-end">
          <div className="flex items-center justify-center w-full max-w-[320px] sm:max-w-[380px] md:max-w-[500px]">
            <Globe />
          </div>
        </div>
      </div>
    </section>
  );
}
