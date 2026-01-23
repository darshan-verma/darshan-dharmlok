"use client";

import { useState } from "react";
import { Send } from "lucide-react";

export default function Newsletter() {
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle newsletter subscription
    console.log("Newsletter subscription:", email);
    setEmail("");
  };

  return (
    <section className="py-16 bg-[#1a1a1a] relative overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            {/* Left Content */}
            <div className="flex-1 text-white">
              <h2 className="text-4xl font-serif font-bold mb-4">
                Our Newsletter
              </h2>
              <div className="w-24 h-1 bg-orange-500 mb-4" />
              <p className="text-gray-300 text-lg">
                Get spiritual insights, pilgrimage guides, pooja timings, and exclusive offers directly in your inbox
              </p>
            </div>

            {/* Right - Email Form */}
            <form onSubmit={handleSubmit} className="flex-1 w-full md:w-auto">
              <div className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter Your Email Here"
                  className="flex-1 px-6 py-4 bg-gray-800 text-white rounded-lg border border-gray-700 focus:outline-none focus:border-orange-500 transition-colors"
                  required
                />
                <button
                  type="submit"
                  className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-lg font-semibold transition-all transform hover:scale-105 shadow-lg flex items-center gap-2"
                >
                  <span>SUBMIT</span>
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
