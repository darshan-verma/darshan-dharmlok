"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Clock, PenTool } from "lucide-react";

interface Kathavachak {
  id: string;
  name: string;
  profileImageUrl?: string;
  bio?: string;
  description?: string;
  category?: string;
  serviceOfferings?: Array<{
    serviceType?: string;
    details?: string;
  }>;
}

export default function HoroscopeForecasts() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [kathavachaks, setKathavachaks] = useState<Kathavachak[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(true);
  const autoScrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchKathavachaks = async () => {
      try {
        const response = await fetch("/api/users/kathavachak?limit=6&page=1");
        if (!response.ok) {
          throw new Error("Failed to fetch kathavachaks");
        }
        const data = await response.json();
        if (data.success && data.data) {
          setKathavachaks(data.data);
        }
      } catch (error) {
        console.error("Error fetching kathavachaks:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchKathavachaks();
  }, []);

  // Calculate how many pairs of cards we have (2 cards per view)
  const totalPairs = Math.ceil(kathavachaks.length / 2);
  const maxIndex = Math.max(0, totalPairs - 1);

  // Auto-scroll functionality - wait 3 seconds, then scroll to next pair
  useEffect(() => {
    if (kathavachaks.length === 0 || totalPairs <= 1) return;

    // Clear any existing timeout
    if (autoScrollTimeoutRef.current) {
      clearTimeout(autoScrollTimeoutRef.current);
    }

    // Set new timeout to auto-scroll after 3 seconds
    autoScrollTimeoutRef.current = setTimeout(() => {
      setCurrentIndex((prev) => {
        const nextIndex = prev + 1;
        // If we've reached the end (showing duplicate set), reset to start seamlessly
        if (nextIndex >= totalPairs) {
          // Reset without transition for seamless infinite loop
          setIsTransitioning(false);
          // Use setTimeout to ensure the transition is disabled before reset
          setTimeout(() => {
            setCurrentIndex(0);
            // Re-enable transition after a brief moment
            setTimeout(() => {
              setIsTransitioning(true);
            }, 50);
          }, 50);
          return prev;
        }
        setIsTransitioning(true);
        return nextIndex;
      });
    }, 3000);

    return () => {
      if (autoScrollTimeoutRef.current) {
        clearTimeout(autoScrollTimeoutRef.current);
      }
    };
  }, [currentIndex, kathavachaks.length, totalPairs]);

  const handlePrevious = () => {
    setCurrentIndex((prev) => {
      if (prev === 0) {
        // Jump to end without transition for seamless loop
        setIsTransitioning(false);
        setTimeout(() => {
          setCurrentIndex(maxIndex);
          setTimeout(() => {
            setIsTransitioning(true);
          }, 50);
        }, 50);
        return prev;
      }
      setIsTransitioning(true);
      return prev - 1;
    });
  };

  const handleNext = () => {
    setCurrentIndex((prev) => {
      const nextIndex = prev + 1;
      // If we've reached the end, reset to start seamlessly
      if (nextIndex > maxIndex) {
        setIsTransitioning(false);
        setTimeout(() => {
          setCurrentIndex(0);
          setTimeout(() => {
            setIsTransitioning(true);
          }, 50);
        }, 50);
        return prev;
      }
      setIsTransitioning(true);
      return nextIndex;
    });
  };

  // Helper function to extract plain text from BlockNote JSON
  const extractPlainTextFromBlockNote = (content: string): string => {
    // Define proper types for BlockNote content
    interface BlockNoteTextItem {
      text: string;
      [key: string]: unknown;
    }

    interface BlockNoteBlock {
      type: string;
      content?: BlockNoteTextItem[];
      [key: string]: unknown;
    }

    try {
      const blocks: BlockNoteBlock[] = JSON.parse(content);
      if (!Array.isArray(blocks)) return "";

      return (
        blocks
          .map((block: BlockNoteBlock) => {
            if (block.type === "paragraph" && block.content) {
              return block.content
                .map((item: BlockNoteTextItem) => item.text || "")
                .join("");
            }
            return "";
          })
          .filter((text: string) => text.trim())
          .join(" ")
      );
    } catch {
      // If parsing fails, it might be plain text, return as is
      return content;
    }
  };

  // Generate bullet points from service offerings or use defaults
  const getBulletPoints = (kathavachak: Kathavachak): string[] => {
    if (kathavachak.serviceOfferings && kathavachak.serviceOfferings.length > 0) {
      return kathavachak.serviceOfferings
        .slice(0, 4)
        .map((service) => service.serviceType || service.details || "")
        .filter(Boolean);
    }
    // Default bullet points if no service offerings
    return ["Spiritual Guidance", "Religious Discourses", "Temple Visits", "Custom Services"];
  };

  // Generate description text - prioritize bio (biography) from API
  const getDescription = (kathavachak: Kathavachak): string => {
    // Prioritize bio (biography) field from API
    if (kathavachak.bio) {
      // Check if bio is BlockNote JSON (starts with '[' or '{')
      const trimmedBio = kathavachak.bio.trim();
      if (trimmedBio.startsWith('[') || trimmedBio.startsWith('{')) {
        // Extract plain text from BlockNote JSON
        const extractedText = extractPlainTextFromBlockNote(kathavachak.bio);
        return extractedText || `Connect with ${kathavachak.name}, an experienced and knowledgeable Kathavachak who shares spiritual wisdom and guides you on your spiritual journey.`;
      }
      // If it's plain text, return as is
      return kathavachak.bio;
    }
    if (kathavachak.description) {
      return kathavachak.description;
    }
    // Default description
    return `Connect with ${kathavachak.name}, an experienced and knowledgeable Kathavachak who shares spiritual wisdom and guides you on your spiritual journey.`;
  };

  // Extract bold terms from description (simple heuristic: capitalize key words)
  const getBoldTerms = (text: string): string[] => {
    const words = text.split(/\s+/);
    const capitalized = words.filter((w) => /^[A-Z]/.test(w) && w.length > 3);
    return capitalized.slice(0, 3);
  };

  return (
    <section id="kathavachak" className="py-20 bg-[#f5f5f0]/80 backdrop-blur-sm relative overflow-hidden">
      <div className="container mx-auto px-4">
        {/* Section Title */}
        <div className="text-center mb-16">
          <h2 className="text-5xl font-serif font-bold text-gray-900 mb-4">
            Kathavachak
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
            Connect with our experienced and knowledgeable Kathavachaks who share spiritual wisdom and guide you on your spiritual journey.
          </p>
        </div>

        {/* Cards Container */}
        {loading ? (
          <div className="flex gap-6 justify-center">
            {[...Array(2)].map((_, index) => (
              <div
                key={index}
                className="flex-shrink-0 w-full max-w-[600px] bg-white/20 backdrop-blur-md rounded-2xl shadow-lg animate-pulse border border-white/30"
              >
                <div className="w-full h-[280px] bg-gray-200/50 rounded-2xl"></div>
              </div>
            ))}
          </div>
        ) : kathavachaks.length > 0 ? (
          <div className="relative w-full max-w-[1400px] mx-auto">
            {/* Navigation Arrows */}
            {totalPairs > 1 && (
              <>
                <button
                  onClick={handlePrevious}
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-12 z-10 bg-white rounded-full p-3 shadow-lg hover:bg-gray-100 transition-colors"
                  aria-label="Previous cards"
                >
                  <ChevronLeft className="w-6 h-6 text-gray-800" />
                </button>
                <button
                  onClick={handleNext}
                  className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-12 z-10 bg-white rounded-full p-3 shadow-lg hover:bg-gray-100 transition-colors"
                  aria-label="Next cards"
                >
                  <ChevronRight className="w-6 h-6 text-gray-800" />
                </button>
              </>
            )}

            {/* Cards Grid - 2 cards per row */}
            <div className="relative overflow-hidden">
              <div
                ref={scrollContainerRef}
                className="flex"
                style={{
                  transform: `translateX(-${currentIndex * 100}%)`,
                  transition: isTransitioning ? 'transform 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94)' : 'none',
                  willChange: 'transform',
                }}
              >
                {/* Render original pairs + duplicate for seamless loop */}
                {Array.from({ length: totalPairs * 2 }).map((_, pairIndex) => {
                  const actualPairIndex = pairIndex % totalPairs;
                  const cards = kathavachaks.slice(actualPairIndex * 2, actualPairIndex * 2 + 2);
                  return (
                    <div
                      key={`pair-${pairIndex}`}
                      className="flex-shrink-0 w-full grid grid-cols-1 md:grid-cols-2 gap-6 px-2"
                    >
                      {cards.map((kathavachak, cardIndex) => {
                        // Use unique key to avoid React warnings
                        const uniqueKey = `${kathavachak.id}-${pairIndex}-${cardIndex}`;
                        const bulletPoints = getBulletPoints(kathavachak);
                        const description = getDescription(kathavachak);
                        const boldTerms = getBoldTerms(description);

                        return (
                          <div
                            key={uniqueKey}
                            className="bg-white/30 backdrop-blur-lg rounded-2xl overflow-hidden shadow-xl flex flex-col md:flex-row border border-white/40 h-[280px]"
                            style={{
                              background: 'rgba(255, 255, 255, 0.25)',
                              backdropFilter: 'blur(16px) saturate(180%)',
                              WebkitBackdropFilter: 'blur(16px) saturate(180%)',
                            }}
                          >
                            {/* Left Section - Text Content */}
                            <div className="flex-1 p-5 md:p-6 flex flex-col justify-between min-w-0">
                              {/* Top Icon */}
                              <div className="mb-3">
                                <div className="w-9 h-9 bg-white/95 backdrop-blur-sm rounded-lg flex items-center justify-center shadow-sm">
                                  <PenTool className="w-4 h-4 text-gray-800" />
                                </div>
                              </div>

                              {/* Description */}
                              <div className="mb-4 flex-1 overflow-hidden">
                                <p className="text-gray-900 text-xs leading-relaxed font-medium" style={{
                                  display: '-webkit-box',
                                  WebkitLineClamp: 4,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden',
                                }}>
                                  {description.split(/\s+/).map((word, idx) => {
                                    // Clean word (remove punctuation for matching)
                                    const cleanWord = word.replace(/[.,!?;:]/g, "");
                                    const isBold = boldTerms.some(
                                      (term) => cleanWord.toLowerCase().includes(term.toLowerCase())
                                    ) || (cleanWord.length > 5 && /^[A-Z]/.test(cleanWord));
                                    return (
                                      <span
                                        key={idx}
                                        className={isBold ? "font-bold" : ""}
                                      >
                                        {word}{" "}
                                      </span>
                                    );
                                  })}
                                </p>
                              </div>

                              {/* Bullet Points - 2 columns */}
                              <div className="mb-3 grid grid-cols-2 gap-x-3 gap-y-0.5">
                                {bulletPoints.map((point, idx) => (
                                  <div key={idx} className="text-gray-900 text-xs truncate font-medium">
                                    • {point}
                                  </div>
                                ))}
                              </div>

                              {/* Time/Duration Indicator */}
                              <div className="flex items-center text-gray-900 text-xs font-medium">
                                <Clock className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />
                                <span>2 - 4 weeks</span>
                              </div>
                            </div>

                            {/* Right Section - Landscape Image */}
                            <div className="w-full md:w-64 h-full relative flex-shrink-0">
                              {kathavachak.profileImageUrl ? (
                                <Image
                                  src={kathavachak.profileImageUrl}
                                  alt={kathavachak.name}
                                  fill
                                  className="object-cover"
                                  sizes="256px"
                                />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-orange-400 to-yellow-500 flex items-center justify-center">
                                  <span className="text-5xl text-white font-bold">
                                    {kathavachak.name.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      {/* Fill empty slot if odd number of cards */}
                      {cards.length === 1 && <div className="hidden md:block"></div>}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No kathavachaks available at the moment.
          </div>
        )}
      </div>
    </section>
  );
}
