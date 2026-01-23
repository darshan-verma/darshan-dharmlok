"use client";

import { MessageCircle, User } from "lucide-react";
import Image from "next/image";

const articles = [
  {
    id: 1,
    title: "Complete Guide to Char Dham Yatra: Planning Your Sacred Journey",
    date: "March 15, 2024",
    author: "Dharmlok Team",
    comments: 12,
    excerpt: "Discover the significance of Char Dham Yatra and learn how to plan your pilgrimage journey with our comprehensive guide covering travel, accommodation, and spiritual practices […]",
    image: "🏔️",
  },
  {
    id: 2,
    title: "Understanding Pooja Rituals: A Beginner's Guide to Hindu Worship",
    date: "March 10, 2024",
    author: "Dharmlok Team",
    comments: 8,
    excerpt: "Learn about the significance of various pooja rituals, their proper procedures, and how to perform them with devotion. Essential knowledge for every spiritual seeker […]",
    image: "🪔",
  },
  {
    id: 3,
    title: "Top 10 Sacred Temples in India Every Devotee Should Visit",
    date: "March 5, 2024",
    author: "Dharmlok Team",
    comments: 15,
    excerpt: "Explore the most revered temples across India, their historical significance, and how to plan your visit. From ancient shrines to modern spiritual centers […]",
    image: "🕉️",
  },
];

export default function LatestArticles() {
  return (
    <section id="articles" className="py-20 bg-[#f5f5f0]/80 backdrop-blur-sm relative overflow-hidden">
      <div className="container mx-auto px-4">
        {/* Section Title */}
        <div className="text-center mb-16">
          <h2 className="text-5xl font-serif font-bold text-gray-900 mb-4">
            Latest Articles
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
            Stay updated with spiritual insights, pilgrimage guides, and articles on Hindu traditions, rituals, and sacred destinations from our expert team.
          </p>
        </div>

        {/* Articles Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {articles.map((article) => (
            <article
              key={article.id}
              className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 group"
            >
              {/* Article Image */}
              <div className="relative h-64 bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center text-8xl overflow-hidden">
                <div className="group-hover:scale-110 transition-transform duration-500">
                  {article.image}
                </div>
                {/* Date Badge */}
                <div className="absolute bottom-4 right-4 bg-orange-500 text-white px-4 py-2 rounded-lg font-semibold text-sm shadow-lg">
                  {article.date.toUpperCase()}
                </div>
              </div>

              {/* Article Content */}
              <div className="p-6 space-y-4">
                {/* Meta Info */}
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span>By - {article.author}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4" />
                    <span>{article.comments}comments</span>
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold text-gray-900 group-hover:text-orange-500 transition-colors">
                  {article.title}
                </h3>

                {/* Excerpt */}
                <p className="text-gray-600 leading-relaxed">
                  {article.excerpt}
                </p>
              </div>
            </article>
          ))}
        </div>

        {/* Pagination */}
        <div className="flex justify-center gap-2">
          {[1, 2, 3].map((page) => (
            <button
              key={page}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                page === 1
                  ? "bg-orange-500 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
              }`}
            >
              {page}
            </button>
          ))}
          <button className="px-4 py-2 rounded-lg font-semibold bg-white text-gray-700 hover:bg-gray-100 border border-gray-300">
            »
          </button>
        </div>
      </div>
    </section>
  );
}
