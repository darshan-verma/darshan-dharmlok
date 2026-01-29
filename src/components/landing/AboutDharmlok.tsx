"use client";

import Image from "next/image";

export interface AboutSectionProps {
  title?: string;
  description?: string;
  mediaUrl?: string | null;
  mediaType?: string | null;
}

export default function AboutDharmlok({
  title = "About Dharmlok",
  description = "Dharmlok is your comprehensive spiritual platform connecting devotees with authentic spiritual services, sacred destinations, and experienced guides for a meaningful spiritual journey.",
  mediaUrl,
  mediaType,
}: AboutSectionProps = {}) {
  return (
    <section id="about" className="py-20 bg-gradient-to-br from-[#f5f5f0]/80 via-[#fafaf5]/80 to-[#f0f0eb]/80 backdrop-blur-sm relative overflow-hidden">
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 opacity-[0.03]">
        {/* Grid Pattern */}
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle, #f97316 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
        }} />
      </div>

      {/* Subtle Gradient Overlays */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-96 h-96 bg-orange-200 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-amber-200 rounded-full blur-3xl" />
      </div>

      {/* Background Decorative Elements */}
      <div className="absolute inset-0 opacity-[0.04]">
        <div className="absolute top-20 left-10 w-32 h-32 border-2 border-orange-500 rounded-full" />
        <div className="absolute bottom-20 right-10 w-24 h-24 border-2 border-orange-500 rounded-full" />
        <div className="absolute top-1/2 left-1/4 w-16 h-16 border border-orange-400 rounded-full" />
        <div className="absolute top-1/3 right-1/4 w-20 h-20 border border-orange-300 rounded-full" />
        <div className="absolute bottom-1/3 left-1/3 w-12 h-12 border border-orange-400 rounded-full" />
      </div>

      {/* Subtle Spiritual Symbols Pattern */}
      <div className="absolute inset-0 opacity-[0.02] flex items-center justify-center">
        <div className="text-9xl text-orange-500 font-serif">🕉️</div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Title */}
        <div className="text-center mb-16">
          <h2 className="text-5xl font-serif font-bold text-gray-900 mb-4">
            {title}
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
            {description}
          </p>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left - Video or Image */}
          <div className="relative group">
            <div className="relative rounded-lg overflow-hidden shadow-2xl transform group-hover:scale-105 transition-transform duration-500">
              {mediaUrl && mediaType === "video" ? (
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover aspect-video"
                >
                  <source src={mediaUrl} type="video/mp4" />
                </video>
              ) : mediaUrl ? (
                <div className="relative w-full aspect-video">
                  <Image
                    src={mediaUrl}
                    alt=""
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              ) : (
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover aspect-video"
                >
                  <source src="/landing-page/854070-hd_1920_1080_25fps.mp4" type="video/mp4" />
                </video>
              )}
            </div>
            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-orange-500/20 rounded-full blur-xl" />
          </div>

          {/* Right - Content */}
          <div className="space-y-6">
            <h3 className="text-4xl font-serif font-bold text-gray-900">
              Connecting Devotees with Divine Wisdom and Sacred Experiences
            </h3>
            <div className="flex gap-4">
              <div className="w-1 bg-orange-500 rounded-full" />
              <p className="text-gray-600 leading-relaxed flex-1">
                Dharmlok brings together authentic spiritual guides, verified temples, and comprehensive travel services to make your spiritual journey seamless. From booking pooja services to planning pilgrimages, we ensure every step of your spiritual path is meaningful and well-guided.
              </p>
            </div>

            {/* Experience Badge */}
            <div className="flex items-center gap-6 p-6 rounded-lg shadow-md">
              <div className="relative">
                <div className="w-24 h-24 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-3xl font-bold text-white">500+</span>
                </div>
                <div className="absolute inset-0 rounded-full border-4 border-orange-300 opacity-20" />
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Trusted by thousands of devotees</p>
                <h4 className="text-2xl font-bold text-gray-900">Spiritual Services & Travel</h4>
              </div>
            </div>

            <button className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-lg font-semibold transition-all transform hover:scale-105 shadow-lg">
              Read More
            </button>
          </div>
        </div>
      </div>

      {/* Wavy Divider */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-24">
          <path
            d="M0,60 Q300,100 600,60 T1200,60 L1200,120 L0,120 Z"
            fill="white"
          />
        </svg>
      </div>
    </section>
  );
}
