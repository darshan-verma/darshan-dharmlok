"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Check, Loader2, Users, UserCheck, IndianRupee, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useMemo, useState, type CSSProperties } from "react";

interface ProfileCardProps {
  name?: string;
  description?: string;
  image?: string;
  isVerified?: boolean;
  followers?: number;
  following?: number;
  enableAnimations?: boolean;
  className?: string;
  onFollow?: () => void;
  isFollowing?: boolean;
  /** When "pooja-service", shows price and Book button instead of followers/following and Follow */
  /** When "event", shows category, type, price and Book button */
  /** When "dharamshala", uses the same card style and shows "View Details" */
  /** When "temple", uses the same card style and shows "View Details" */
  /** When "ebook", uses the same card style and shows "Read book" */
  /** When "blog", uses the same card style and shows "Read blog" */
  /** When "e-shop", shows price and "Buy Now" for product cards */
  variant?: "profile" | "pooja-service" | "event" | "dharamshala" | "temple" | "ebook" | "blog" | "e-shop";
  price?: number;
  onBook?: () => void;
  isBooking?: boolean;
  category?: string;
  type?: string;
}

const DEFAULT_POOJA_IMAGE =
  "https://images.unsplash.com/photo-1605649487212-47bdab064df7?w=800&h=800&fit=crop&auto=format&q=80";

export function ProfileCard({
  name = "Sophie Bennett",
  description = "Product Designer who focuses on simplicity & usability.",
  image = "https://images.unsplash.com/photo-1502685104226-ee32379fefbe?w=800&h=800&fit=crop&auto=format&q=80",
  isVerified = true,
  followers = 312,
  following = 48,
  enableAnimations = true,
  className,
  onFollow = () => {},
  isFollowing = false,
  variant = "profile",
  price,
  onBook = () => {},
  isBooking = false,
  category,
  type,
}: ProfileCardProps) {
  const shouldReduceMotion = useReducedMotion();
  const shouldAnimate = enableAnimations && !shouldReduceMotion;
  const isPooja = variant === "pooja-service";
  const isEvent = variant === "event";
  const isDharamshala = variant === "dharamshala";
  const isTemple = variant === "temple";
  const isEbook = variant === "ebook";
  const isBlog = variant === "blog";
  const isEshop = variant === "e-shop";
  const displayImage =
    (isPooja || isEvent || isDharamshala || isTemple || isEbook || isBlog || isEshop) && !image
      ? DEFAULT_POOJA_IMAGE
      : image;

  /**
   * Improve text readability on both dark and light images.
   * We sample a tiny version of the image and estimate average luminance.
   * Based on that, we switch between:
   * - Dark scrim + light text (for dark images)
   * - Light scrim + dark text (for bright images)
   *
   * If sampling fails (e.g. CORS), we fall back to a safe default.
   */
  const [textOnLight, setTextOnLight] = useState<boolean>(false); // true => dark text, light scrim
  const [scrimStrength, setScrimStrength] = useState<number>(0.45);

  useEffect(() => {
    if (!displayImage) return;

    let cancelled = false;
    const img = new window.Image();
    // Best-effort: enables canvas read when server provides CORS headers
    img.crossOrigin = "anonymous";

    img.onload = () => {
      if (cancelled) return;
      try {
        const size = 16;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) throw new Error("No canvas context");

        ctx.drawImage(img, 0, 0, size, size);
        const { data } = ctx.getImageData(0, 0, size, size);

        let total = 0;
        let count = 0;
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i] / 255;
          const g = data[i + 1] / 255;
          const b = data[i + 2] / 255;
          // relative luminance (sRGB)
          const y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
          total += y;
          count++;
        }

        const avg = count ? total / count : 0.5;
        const isBright = avg >= 0.58;

        // Map luminance to a sensible scrim range.
        // Bright images need stronger (light) scrim so dark text stays readable.
        // Dark images need moderate (dark) scrim so light text stays readable.
        const strength = isBright
          ? Math.min(0.72, Math.max(0.38, 0.38 + (avg - 0.58) * 0.9))
          : Math.min(0.62, Math.max(0.30, 0.30 + (0.58 - avg) * 0.65));

        setTextOnLight(isBright);
        setScrimStrength(strength);
      } catch {
        // CORS-tainted canvas or other failures: fall back to a safe default.
        setTextOnLight(false);
        setScrimStrength(0.5);
      }
    };

    img.onerror = () => {
      if (cancelled) return;
      setTextOnLight(false);
      setScrimStrength(0.5);
    };

    img.src = displayImage;

    return () => {
      cancelled = true;
    };
  }, [displayImage]);

  const scrimStyle = useMemo((): CSSProperties => {
    const rgb = textOnLight ? "255 255 255" : "0 0 0";
    return {
      background: `linear-gradient(to top, rgb(${rgb} / ${scrimStrength}), rgb(${rgb} / 0))`,
    };
  }, [scrimStrength, textOnLight]);

  const bottomScrimStyle = useMemo((): CSSProperties => {
    const rgb = textOnLight ? "255 255 255" : "0 0 0";
    // Slightly stronger at the very bottom where text sits.
    const bottom = Math.min(0.8, scrimStrength + 0.1);
    return {
      background: `linear-gradient(to top, rgb(${rgb} / ${bottom}), rgb(${rgb} / 0))`,
    };
  }, [scrimStrength, textOnLight]);

  const titleClass = textOnLight
    ? "text-gray-950"
    : "text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.55)]";
  const bodyClass = textOnLight
    ? "text-gray-700"
    : "text-white/85 drop-shadow-[0_2px_10px_rgba(0,0,0,0.55)]";
  const badgeBgClass = textOnLight ? "bg-green-600" : "bg-green-500";

  const containerVariants = {
    rest: {
      scale: 1,
      y: 0,
      filter: "blur(0px)",
    },
    hover: shouldAnimate
      ? {
          scale: 1.02,
          y: -4,
          filter: "blur(0px)",
          transition: {
            type: "spring",
            stiffness: 400,
            damping: 28,
            mass: 0.6,
          },
        }
      : {},
  };

  const imageVariants = {
    rest: { scale: 1 },
    hover: { scale: 1.05 },
  };

  const contentVariants = {
    hidden: {
      opacity: 0,
      y: 20,
      filter: "blur(4px)",
    },
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 28,
        mass: 0.6,
        staggerChildren: 0.08,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: {
      opacity: 0,
      y: 15,
      scale: 0.95,
      filter: "blur(2px)",
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      filter: "blur(0px)",
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 25,
        mass: 0.5,
      },
    },
  };

  const letterVariants = {
    hidden: {
      opacity: 0,
      scale: 0.8,
    },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        type: "spring",
        damping: 8,
        stiffness: 200,
        mass: 0.8,
      },
    },
  };

  return (
    <motion.div
      data-slot="profile-card"
      initial="rest"
      whileHover="hover"
      variants={containerVariants}
      className={cn(
        "relative w-80 h-96 rounded-3xl border border-border/20 text-card-foreground overflow-hidden shadow-xl shadow-black/5 cursor-pointer group backdrop-blur-sm",
        "dark:shadow-black/20",
        className
      )}
    >
      {/* Full Cover Image */}
      <motion.img
        src={displayImage}
        alt={name}
        className="absolute inset-0 w-full h-full object-cover"
        variants={imageVariants}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      />

      {/* Gradient overlay - lighter for pooja and event cards */}
      <div
        className={cn(
          "absolute inset-0 to-transparent"
        )}
        style={scrimStyle}
      />
      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 h-40 to-transparent"
        )}
        style={bottomScrimStyle}
      />

      {/* Content */}
      <motion.div
        variants={contentVariants}
        initial="hidden"
        animate="visible"
        className="absolute bottom-0 left-0 right-0 p-6 space-y-4"
      >
        {/* Name and Verification */}
        <motion.div variants={itemVariants} className="flex items-center gap-2">
          <motion.h2
            className={cn("text-2xl font-bold", titleClass)}
            variants={{
              visible: {
                transition: {
                  staggerChildren: 0.02,
                },
              },
            }}
          >
            {name.split("").map((letter, index) => (
              <motion.span
                key={index}
                variants={letterVariants}
                className="inline-block"
              >
                {letter === " " ? "\u00A0" : letter}
              </motion.span>
            ))}
          </motion.h2>
          {isVerified && (
            <motion.div
              variants={itemVariants}
              className={cn(
                "flex items-center justify-center w-4 h-4 rounded-full text-white",
                badgeBgClass
              )}
              whileHover={{
                scale: 1.1,
                rotate: 5,
                transition: { type: "spring", stiffness: 400, damping: 20 },
              }}
            >
              <Check className="w-2.5 h-2.5" />
            </motion.div>
          )}
        </motion.div>

        {/* Description */}
        <motion.p
          variants={itemVariants}
          className={cn("text-sm leading-relaxed line-clamp-3", bodyClass)}
        >
          {description}
        </motion.p>

        {/* Category for Events and E-shop */}
        {(isEvent || isEshop) && (category || type) && (
          <motion.div
            variants={itemVariants}
            className="flex items-center gap-2 flex-wrap"
          >
            {category && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                <Tag className="w-3 h-3" />
                {category}
              </span>
            )}
            {type && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-secondary/10 text-secondary-foreground text-xs font-medium">
                {type}
              </span>
            )}
          </motion.div>
        )}

        {/* Stats */}
        <motion.div
          variants={itemVariants}
          className="flex items-center gap-6 pt-2"
        >
          {(isPooja || isEvent || isDharamshala || isTemple || isEshop) &&
          !isEbook &&
          !isBlog &&
          typeof price === "number" ? (
            <div className={cn("flex items-center gap-2", bodyClass)}>
              <IndianRupee className="w-4 h-4" />
              <span className={cn("font-semibold", titleClass)}>
                {price.toLocaleString("en-IN")}
              </span>
              <span className="text-sm">{isEshop ? "per unit" : "starting price"}</span>
            </div>
          ) : !isEvent && !isEbook && !isBlog ? (
            <>
              <div className={cn("flex items-center gap-2", bodyClass)}>
                <Users className="w-4 h-4" />
                <span className={cn("font-semibold", titleClass)}>{followers}</span>
                <span className="text-sm">followers</span>
              </div>
              <div className={cn("flex items-center gap-2", bodyClass)}>
                <UserCheck className="w-4 h-4" />
                <span className={cn("font-semibold", titleClass)}>{following}</span>
                <span className="text-sm">following</span>
              </div>
            </>
          ) : null}
        </motion.div>

        {/* Action Button */}
        {(isPooja || isEvent || isDharamshala || isTemple || isEbook || isBlog || isEshop) ? (
          <motion.button
            variants={itemVariants}
            onClick={(e) => {
              e.stopPropagation();
              onBook();
            }}
            whileHover={{
              scale: 1.02,
              transition: { type: "spring", stiffness: 400, damping: 25 },
            }}
            whileTap={{ scale: 0.98 }}
            className={cn(
              "w-full cursor-pointer py-3 px-4 rounded-2xl font-semibold text-sm transition-all duration-200",
              "border border-border/20 shadow-sm",
              "bg-foreground text-background hover:bg-foreground/90",
              "transform-gpu"
            )}
            disabled={isBooking}
          >
            {isBooking ? (
              <span className="inline-flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading...
              </span>
            ) : (
              isEshop
                ? "Buy Now"
                : isEbook
                  ? "Read book"
                  : isBlog
                    ? "Read blog"
                    : isEvent || isDharamshala || isTemple
                      ? "View Details"
                      : "Book service"
            )}
          </motion.button>
        ) : (
          <motion.button
            variants={itemVariants}
            onClick={(e) => {
              e.stopPropagation();
              onFollow();
            }}
            whileHover={{
              scale: 1.02,
              transition: { type: "spring", stiffness: 400, damping: 25 },
            }}
            whileTap={{ scale: 0.98 }}
            className={cn(
              "w-full cursor-pointer py-3 px-4 rounded-2xl font-semibold text-sm transition-all duration-200",
              "border border-border/20 shadow-sm",
              isFollowing
                ? "bg-muted text-muted-foreground hover:bg-muted/80"
                : "bg-foreground text-background hover:bg-foreground/90",
              "transform-gpu"
            )}
          >
            {isFollowing ? "Following" : "Follow +"}
          </motion.button>
        )}
      </motion.div>
    </motion.div>
  );
}
