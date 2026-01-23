"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

const stats = [
  { value: 50, suffix: "K+", label: "Happy Devotees" },
  { value: 500, suffix: "+", label: "Verified Temples" },
  { value: 1000, suffix: "+", label: "Spiritual Guides" },
  { value: 200, suffix: "+", label: "Pooja Services" },
  { value: 98, suffix: "%", label: "Satisfaction Rate" },
];

export default function WhyChooseUs() {
  const [counters, setCounters] = useState(stats.map(() => 0));
  const sectionRef = useRef<HTMLDivElement>(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated) {
            setHasAnimated(true);
            stats.forEach((stat, index) => {
              let current = 0;
              const increment = stat.value / 50;
              const timer = setInterval(() => {
                current += increment;
                if (current >= stat.value) {
                  setCounters((prev) => {
                    const newCounters = [...prev];
                    newCounters[index] = stat.value;
                    return newCounters;
                  });
                  clearInterval(timer);
                } else {
                  setCounters((prev) => {
                    const newCounters = [...prev];
                    newCounters[index] = Math.floor(current);
                    return newCounters;
                  });
                }
              }, 30);
            });
          }
        });
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, [hasAnimated]);

  return (
    <section
      ref={sectionRef}
      className="py-20 bg-gradient-to-br from-[#1a0a2e] via-[#16213e] to-[#0f3460] relative overflow-hidden"
    >
      {/* Animated Stars */}
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 150 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full animate-twinkle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      {/* Abstract Lines Pattern */}
      <div className="absolute inset-0 opacity-10">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-px h-full bg-white"
            style={{
              left: `${(i + 1) * 5}%`,
              transform: `rotate(${Math.random() * 10 - 5}deg)`,
            }}
          />
        ))}
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Title */}
        <div className="text-center mb-16">
          <h2 className="text-5xl font-serif font-bold text-white mb-4">
            Why Choose Us
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
          <p className="text-gray-300 max-w-2xl mx-auto">
            Trusted by thousands of devotees, Dharmlok provides authentic spiritual services, verified accommodations, and expert guidance for your spiritual journey.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              className="text-center group"
            >
              {/* Circular Icon with Number */}
              <div className="relative w-32 h-32 mx-auto mb-4">
                {/* Outer Circle with Pattern */}
                <svg className="w-full h-full transform group-hover:scale-110 transition-transform duration-300">
                  <circle
                    cx="64"
                    cy="64"
                    r="60"
                    fill="none"
                    stroke="url(#gradient)"
                    strokeWidth="2"
                    className="animate-spin-slow"
                    style={{ animationDuration: "20s" }}
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#f97316" />
                      <stop offset="100%" stopColor="#ea580c" />
                    </linearGradient>
                  </defs>
                </svg>

                {/* Inner Circle with Number */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-white">
                      {counters[index]}
                      <span className="text-2xl">{stat.suffix}</span>
                    </div>
                  </div>
                </div>

                {/* Glow Effect */}
                <div className="absolute inset-0 rounded-full bg-orange-500 opacity-0 group-hover:opacity-20 blur-xl transition-opacity" />
              </div>

              <h3 className="text-white font-semibold text-lg">
                {stat.label}
              </h3>
            </div>
          ))}
        </div>
      </div>

      {/* Wavy Divider */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-24">
          <path
            d="M0,60 Q300,20 600,60 T1200,60 L1200,120 L0,120 Z"
            fill="#f5f5f0"
          />
        </svg>
      </div>

      <style jsx>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-twinkle {
          animation: twinkle 3s ease-in-out infinite;
        }
        .animate-spin-slow {
          animation: spin-slow 20s linear infinite;
        }
      `}</style>
    </section>
  );
}
