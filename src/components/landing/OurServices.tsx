"use client";

import { BookOpen, User, Calendar, Activity } from "lucide-react";
import Image from "next/image";

const services = [
  {
    icon: BookOpen,
    title: "Book Pooja",
    description: "Book authentic pooja services with verified Panditji for all occasions",
  },
  {
    icon: User,
    title: "Book kathavachak",
    description: "Connect with experienced Kathavachaks for spiritual discourses and guidance",
  },
  {
    icon: Calendar,
    title: "Events",
    description: "Discover and participate in spiritual events and religious ceremonies",
  },
  {
    icon: Activity,
    title: "Yoga",
    description: "Join yoga sessions and meditation classes for spiritual wellness",
  },
];

export default function OurServices() {
  return (
    <section id="services" className="py-20 bg-[#f5f5f0]/80 backdrop-blur-sm relative overflow-hidden">
      <div className="container mx-auto px-4">
        {/* Section Title */}
        <div className="text-center mb-16">
          <h2 className="text-5xl font-serif font-bold text-gray-900 mb-4">
            Our Services
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
            Comprehensive spiritual services to support your journey - from pooja bookings to pilgrimage planning, all in one trusted platform.
          </p>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left - Image */}
          <div className="relative flex items-center justify-center">
            <div className="relative w-full max-w-lg h-96 rounded-3xl overflow-hidden shadow-2xl">
              <Image
                src="/landing-page/amritsar-6185143.jpg"
                alt="Golden Temple - Spiritual Services"
                fill
                className="object-cover rounded-3xl"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          </div>

          {/* Right - Service Cards */}
          <div className="grid grid-cols-2 gap-6">
            {services.map((service, _index) => {
              const Icon = service.icon;
              return (
                <div
                  key={service.title}
                  className="bg-white rounded-lg p-6 shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100 group"
                >
                  <div className="space-y-4">
                    <div className="w-16 h-16 bg-orange-50 rounded-lg flex items-center justify-center border-2 border-orange-500 group-hover:bg-orange-500 transition-colors">
                      <Icon className="w-8 h-8 text-orange-500 group-hover:text-white transition-colors" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {service.title}
                      </h3>
                      <p className="text-gray-600 text-sm mb-4">
                        {service.description}
                      </p>
                      <a
                        href="#"
                        className="text-orange-500 font-semibold hover:text-orange-600 transition-colors inline-flex items-center gap-2 group-hover:gap-3"
                      >
                        Read More
                        <span>→</span>
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
