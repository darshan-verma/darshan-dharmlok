"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";

const teamMembers = [
  {
    name: "Swami Ramdev",
    role: "Dharmguru",
    image: "🧘",
  },
  {
    name: "Pandit Ramesh",
    role: "Panditji",
    image: "👨‍🦱",
  },
  {
    name: "Katha Vachak",
    role: "Kathavachak",
    image: "👨",
  },
  {
    name: "Guru Ma",
    role: "Spiritual Guide",
    image: "👩",
  },
];

export default function OurTeam() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % teamMembers.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + teamMembers.length) % teamMembers.length);
  };

  return (
    <section id="team" className="py-20 bg-[#f5f5f0]/80 backdrop-blur-sm relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 left-10 w-64 h-64 border-2 border-orange-500 rounded-full" />
        <div className="absolute bottom-10 right-10 w-48 h-48 border-2 border-orange-500 rounded-full" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Title */}
        <div className="text-center mb-16">
          <h2 className="text-5xl font-serif font-bold text-gray-900 mb-4">
            Our Team
          </h2>
          <div className="flex justify-center mb-6">
            <Image
              src="/landing-page/1.png"
              alt="Decorative Divider"
              width={200}
              height={20}
              className="object-contain"
            />
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Meet our team of experienced spiritual guides, verified Panditji, and knowledgeable Kathavachak dedicated to supporting your spiritual journey.
          </p>
        </div>

        {/* Team Carousel */}
        <div className="relative max-w-5xl mx-auto">
          {/* Navigation Arrows */}
          <button
            onClick={prevSlide}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-12 h-12 bg-orange-500 hover:bg-orange-600 text-white rounded-full flex items-center justify-center shadow-lg transition-all transform hover:scale-110"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-12 h-12 bg-orange-500 hover:bg-orange-600 text-white rounded-full flex items-center justify-center shadow-lg transition-all transform hover:scale-110"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Team Members Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {teamMembers.map((member, index) => (
              <div
                key={member.name}
                className={`bg-white rounded-lg p-6 shadow-md hover:shadow-xl transition-all duration-500 transform ${
                  index === currentIndex
                    ? "scale-105 -translate-y-2 border-2 border-orange-500"
                    : "hover:-translate-y-2"
                }`}
                style={{
                  opacity: Math.abs(index - currentIndex) > 1 ? 0.5 : 1,
                  transform: `translateX(${(index - currentIndex) * 20}px) scale(${
                    index === currentIndex ? 1.05 : 1
                  })`,
                }}
              >
                <div className="text-center space-y-4">
                  <div className="w-32 h-32 mx-auto bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-6xl shadow-lg">
                    {member.image}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">{member.name}</h3>
                    <p className="text-gray-600 text-sm mt-1">{member.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* See All Button */}
        <div className="text-center mt-12">
          <button className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-lg font-semibold transition-all transform hover:scale-105 shadow-lg">
            SEE ALL
          </button>
        </div>
      </div>
    </section>
  );
}
