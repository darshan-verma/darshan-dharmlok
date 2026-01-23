"use client";

import { useState } from "react";
import Image from "next/image";
import { LiquidButton } from "@/components/ui/liquid-glass-button";

const testimonials = [
  {
    text: "Dharmlok made our pilgrimage to Varanasi seamless. The pooja service was authentic, and the dharamshala booking was perfect. Highly recommended for anyone planning a spiritual journey.",
    author: "Rajesh Kumar",
    role: "Devotee",
    avatar: "👨",
  },
  {
    text: "I booked a Ganesh Chaturthi pooja through Dharmlok, and the Panditji was very knowledgeable and punctual. The entire experience was divine and well-organized.",
    author: "Priya Sharma",
    role: "Devotee",
    avatar: "👩",
  },
  {
    text: "As a spiritual seeker, I found the Dharmguru sessions on Dharmlok very insightful. The platform connects you with authentic guides and makes spiritual learning accessible.",
    author: "Amit Patel",
    role: "Spiritual Seeker",
    avatar: "👨‍🦱",
  },
  {
    text: "The travel portal helped us plan our Char Dham Yatra perfectly. From flights to hotel bookings near temples, everything was taken care of. Truly a one-stop spiritual platform.",
    author: "Sunita Devi",
    role: "Pilgrim",
    avatar: "👩",
  },
  {
    text: "I've been using Dharmlok for regular pooja services. The verified Panditji and easy booking process make it my go-to platform for all spiritual needs.",
    author: "Vikram Singh",
    role: "Regular User",
    avatar: "👨‍🦳",
  },
];

export default function Testimonials() {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <section id="testimonials" className="py-20 bg-[#f5f5f0]/80 backdrop-blur-sm relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-1/2 left-1/4 w-48 h-48 border-2 border-orange-500 rounded-full" />
        <div className="absolute top-1/2 right-1/4 w-32 h-32 border-2 border-orange-500 rounded-full" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Title */}
        <div className="text-center mb-16">
          <h2 className="text-5xl font-serif font-bold text-gray-900 mb-4">
            What My Clients Says
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
            Hear from our community of devotees who have experienced the divine through our services and made their spiritual journey meaningful with Dharmlok.
          </p>
        </div>

        {/* Testimonials Content */}
        <div className="max-w-6xl mx-auto">
          {/* Avatar Selector */}
          <div className="flex justify-center gap-4 mb-8">
            {testimonials.map((testimonial, index) => (
              <LiquidButton
                key={index}
                onClick={() => setActiveIndex(index)}
                variant="default"
                size="icon"
                className={`w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-3xl shadow-lg transition-all transform ${
                  index === activeIndex
                    ? "scale-125 border-4 border-orange-500 ring-4 ring-orange-200"
                    : "hover:scale-110 opacity-70"
                }`}
              >
                {testimonial.avatar}
              </LiquidButton>
            ))}
          </div>

          {/* Testimonial Card */}
          <div className="relative">
            <div
              key={activeIndex}
              className="bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl p-8 md:p-12 shadow-2xl transform transition-all duration-500"
            >
              <div className="text-white space-y-6">
                <p className="text-lg md:text-xl leading-relaxed italic">
                  &quot;{testimonials[activeIndex].text}&quot;
                </p>
                <div className="flex items-center gap-4 pt-4 border-t border-white/30">
                  <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-3xl">
                    {testimonials[activeIndex].avatar}
                  </div>
                  <div>
                    <h4 className="font-bold text-xl">
                      {testimonials[activeIndex].author}
                    </h4>
                    <p className="text-white/80">
                      {testimonials[activeIndex].role}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Decorative Background Pattern */}
            <div className="absolute inset-0 rounded-2xl opacity-10 pointer-events-none">
              <div className="absolute top-4 right-4 w-32 h-32 border-2 border-white rounded-full" />
              <div className="absolute bottom-4 left-4 w-24 h-24 border-2 border-white rounded-full" />
            </div>
          </div>

          {/* Pagination Dots */}
          <div className="flex justify-center gap-2 mt-8">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveIndex(index)}
                className={`w-3 h-3 rounded-full transition-all ${
                  index === activeIndex
                    ? "bg-orange-500 w-8"
                    : "bg-gray-300 hover:bg-orange-300"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
