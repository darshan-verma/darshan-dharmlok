"use client";

import Header from "./Header";
import HeroSection from "./HeroSection";
import AboutDharmlok from "./AboutDharmlok";
import Kathavachak from "./Kathavachak";
import OurServices from "./OurServices";
import Dharmgurus from "./Dharmgurus";
import Panditji from "./Panditji";
import ExploreDharmlok from "./ExploreDharmlok";
import EShopProducts from "./EShopProducts";
import TravelPortal from "./TravelPortal";
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
        <Kathavachak />
        <OurServices />
        <Dharmgurus />
        <Panditji />
        <ExploreDharmlok />
        <EShopProducts />
        <TravelPortal />
        <Footer />
      </div>
    </div>
  );
}
