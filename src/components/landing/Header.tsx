"use client";

import { useState, useEffect } from "react";
import { Search, ShoppingCart, User, Menu, X, Phone, Mail, Clock } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setIsScrolled(scrollPosition > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const menuItems = [
    { name: "Home", href: "/", active: true },
    { name: "About Us", href: "#about" },
    { name: "Services", href: "#services" },
    { name: "Travel Portal", href: "/travel-portal" },
    { name: "Temples", href: "#temples" },
    { name: "Events", href: "#events" },
    {
      name: "Spiritual Guides",
      href: "#guides",
      dropdown: [
        { name: "Dharmguru", href: "#dharmguru" },
        { name: "Panditji", href: "#panditji" },
        { name: "Kathavachak", href: "#kathavachak" },
      ],
    },
    { name: "E-Shop", href: "#shop" },
    { name: "Contact Us", href: "#contact" },
  ];

  return (
    <>
      {/* Top Bar */}
      <div className="bg-[#1a1a1a] text-white py-2 text-sm">
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-2 md:gap-0">
          <div className="flex flex-wrap items-center gap-4 md:gap-6 text-xs md:text-sm">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-orange-500" />
              <span>+(91)1800-DHARMLOK</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-orange-500" />
              <span>info@dharmlok.com</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-500" />
              <span>9:30 AM - 6:30 PM</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <a href="#" className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center hover:bg-orange-600 transition-colors" aria-label="Facebook">
                <span className="text-white text-xs font-bold">f</span>
              </a>
              <a href="#" className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center hover:bg-orange-600 transition-colors" aria-label="Twitter">
                <span className="text-white text-xs font-bold">t</span>
              </a>
              <a href="#" className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center hover:bg-orange-600 transition-colors" aria-label="Instagram">
                <span className="text-white text-xs font-bold">i</span>
              </a>
              <a href="#" className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center hover:bg-orange-600 transition-colors" aria-label="YouTube">
                <span className="text-white text-xs font-bold">y</span>
              </a>
            </div>
            <Link href="/auth/signin" className="hover:text-orange-500 transition-colors whitespace-nowrap">
              Log in / Register
            </Link>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className={`sticky top-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? "bg-white/50 backdrop-blur-md shadow-lg" 
          : "bg-white shadow-md"
      }`}>
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link href="" className="flex items-center gap-2 group">
              <div className="relative group-hover:scale-110 transition-transform">
                <Image
                  src="/dharmlok-logo.svg"
                  alt="Dharmlok Logo"
                  width={100}
                  height={100}
                  className="object-contain"
                  onError={() => {
                    // Fallback handled by Next.js Image component
                  }}
                />
              </div>
              
            </Link>

            {/* Desktop Menu */}
            <div className="hidden lg:flex items-center gap-8">
              {menuItems.map((item) => (
                <div
                  key={item.name}
                  className="relative"
                  onMouseEnter={() => item.dropdown && setActiveDropdown(item.name)}
                  onMouseLeave={() => setActiveDropdown(null)}
                >
                  <Link
                    href={item.href}
                    className={`text-gray-800 hover:text-orange-500 transition-colors font-medium ${
                      item.active ? "text-orange-500 border-b-2 border-orange-500" : ""
                    }`}
                  >
                    {item.name}
                  </Link>
                  {item.dropdown && activeDropdown === item.name && (
                    <div className="absolute top-full left-0 mt-2 w-48 bg-white shadow-xl rounded-lg py-2 z-50 animate-in fade-in slide-in-from-top-2">
                      {item.dropdown.map((subItem) => (
                        <Link
                          key={subItem.name}
                          href={subItem.href}
                          className="block px-4 py-2 text-gray-700 hover:bg-orange-50 hover:text-orange-500 transition-colors"
                        >
                          {subItem.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Right Icons */}
            <div className="flex items-center gap-4">
              <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <Search className="w-5 h-5 text-gray-700" />
              </button>
              <button className="relative p-2 hover:bg-gray-100 rounded-full transition-colors">
                <ShoppingCart className="w-5 h-5 text-gray-700" />
                <span className="absolute top-0 right-0 w-5 h-5 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center">
                  0
                </span>
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <User className="w-5 h-5 text-gray-700" />
              </button>
              <button
                className="lg:hidden p-2 hover:bg-gray-100 rounded-full transition-colors"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {isMenuOpen ? (
                  <X className="w-5 h-5 text-gray-700" />
                ) : (
                  <Menu className="w-5 h-5 text-gray-700" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="lg:hidden py-4 border-t animate-in slide-in-from-top">
              {menuItems.map((item) => (
                <div key={item.name} className="border-b last:border-b-0">
                  <Link
                    href={item.href}
                    className="block px-4 py-3 text-gray-800 hover:bg-orange-50 hover:text-orange-500 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                  {item.dropdown && (
                    <div className="pl-8">
                      {item.dropdown.map((subItem) => (
                        <Link
                          key={subItem.name}
                          href={subItem.href}
                          className="block px-4 py-2 text-gray-600 hover:bg-orange-50 hover:text-orange-500 transition-colors text-sm"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          {subItem.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </nav>
    </>
  );
}
