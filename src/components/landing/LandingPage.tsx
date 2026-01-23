"use client";

import Header from "./Header";
import HeroSection from "./HeroSection";
import AboutDharmlok from "./AboutDharmlok";
import HoroscopeForecasts from "./HoroscopeForecasts";
import OurServices from "./OurServices";
import WhyChooseUs from "./WhyChooseUs";
import OurTeam from "./OurTeam";
import Testimonials from "./Testimonials";
import PopularProducts from "./PopularProducts";
import LatestArticles from "./LatestArticles";
import Newsletter from "./Newsletter";
import Footer from "./Footer";
import { BackgroundShader } from "@/components/ui/background-paper-shaders";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white/90 relative">
      {/* Single fixed background animation for entire page - optimized for performance */}
      <BackgroundShader className="opacity-70" color1="#ff8c42" color2="#ffb366" speed={0.3} />
      
      <div className="relative z-10">
        <Header />
        <HeroSection />
        <AboutDharmlok />
        <HoroscopeForecasts />
        <OurServices />
        <WhyChooseUs />
        <OurTeam />
        <Testimonials />
        <PopularProducts />
        <LatestArticles />
        <Newsletter />
        <Footer />
      </div>
    </div>
  );
}
