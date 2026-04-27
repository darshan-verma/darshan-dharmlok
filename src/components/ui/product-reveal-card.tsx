"use client"

import { motion, useReducedMotion } from "framer-motion"
import { ShoppingCart, Star, Heart } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"

import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ProductRevealCardProps {
  name?: string
  price?: string
  originalPrice?: string
  image?: string
  description?: string
  rating?: number
  reviewCount?: number
  onAdd?: () => void
  onFavorite?: () => void
  productHref?: string
  enableAnimations?: boolean
  className?: string
}

const toNumber = (value: string) => {
  const sanitized = value.replace(/[^0-9.]/g, "")
  const parsed = Number.parseFloat(sanitized)
  return Number.isFinite(parsed) ? parsed : 0
}

export function ProductRevealCard({
  name = "Premium Wireless Headphones",
  price = "$199",
  originalPrice = "$299",
  image = "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=800&h=600&fit=crop",
  description = "Experience studio-quality sound with advanced noise cancellation and 30-hour battery life. Perfect for music lovers and professionals.",
  rating = 4.8,
  reviewCount = 124,
  onAdd,
  onFavorite,
  productHref,
  enableAnimations = true,
  className,
}: ProductRevealCardProps) {
  const [isFavorite, setIsFavorite] = useState(false)
  const router = useRouter()
  const shouldReduceMotion = useReducedMotion()
  const shouldAnimate = enableAnimations && !shouldReduceMotion

  const handleFavorite = () => {
    setIsFavorite(!isFavorite)
    onFavorite?.()
  }

  const handleNavigateToDetails = () => {
    if (!productHref) return
    router.push(productHref)
  }

  const discountPercentage =
    originalPrice && toNumber(originalPrice) > 0
      ? Math.round(
          ((toNumber(originalPrice) - toNumber(price)) / toNumber(originalPrice)) *
            100
        )
      : null

  const containerVariants = {
    rest: {
      scale: 1,
      y: 0,
      filter: "blur(0px)",
    },
    hover: shouldAnimate
      ? {
          scale: 1.03,
          y: -8,
          filter: "blur(0px)",
          transition: {
            type: "spring",
            stiffness: 300,
            damping: 30,
            mass: 0.8,
          },
        }
      : {},
  }

  const imageVariants = {
    rest: { scale: 1 },
    hover: { scale: 1.1 },
  }

  const overlayVariants = {
    rest: {
      y: "100%",
      opacity: 0,
      filter: "blur(4px)",
    },
    hover: {
      y: "0%",
      opacity: 1,
      filter: "blur(0px)",
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 28,
        mass: 0.6,
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
  }

  const contentVariants = {
    rest: {
      opacity: 0,
      y: 20,
      scale: 0.95,
    },
    hover: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 25,
        mass: 0.5,
      },
    },
  }

  const buttonVariantsMotion = {
    rest: { scale: 1, y: 0 },
    hover: shouldAnimate
      ? {
          scale: 1.05,
          y: -2,
          transition: {
            type: "spring",
            stiffness: 400,
            damping: 25,
          },
        }
      : {},
    tap: shouldAnimate ? { scale: 0.95 } : {},
  }

  const favoriteVariants = {
    rest: { scale: 1, rotate: 0 },
    favorite: {
      scale: [1, 1.3, 1],
      rotate: [0, 10, -10, 0],
      transition: {
        duration: 0.5,
        ease: "easeInOut",
      },
    },
  }

  return (
    <motion.div
      data-slot="product-reveal-card"
      initial="rest"
      whileHover="hover"
      variants={containerVariants}
      className={cn(
        "relative w-80 overflow-hidden rounded-2xl border border-border/50 bg-card text-card-foreground",
        "group cursor-pointer shadow-lg shadow-black/5",
        className
      )}
    >
      <div className="relative overflow-hidden">
        <motion.img
          src={image}
          alt={name}
          className="h-56 w-full object-cover"
          variants={imageVariants}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

        <motion.button
          onClick={handleFavorite}
          variants={favoriteVariants}
          animate={isFavorite ? "favorite" : "rest"}
          className={cn(
            "absolute right-4 top-4 rounded-full border border-white/20 p-2 backdrop-blur-sm",
            "cursor-pointer",
            isFavorite
              ? "bg-red-500 text-white"
              : "bg-white/20 text-white hover:bg-white/30"
          )}
        >
          <Heart className={cn("h-4 w-4", isFavorite && "fill-current")} />
        </motion.button>

        {discountPercentage !== null && discountPercentage > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="absolute left-4 top-4 rounded-full bg-red-500 px-3 py-1 text-xs font-bold text-white"
          >
            {discountPercentage}% OFF
          </motion.div>
        )}
      </div>

      <div className="space-y-3 p-6">
        <div className="flex items-center gap-2">
          <div className="flex">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={cn(
                  "h-4 w-4",
                  i < Math.floor(rating)
                    ? "fill-current text-yellow-400"
                    : "text-muted-foreground"
                )}
              />
            ))}
          </div>
          <span className="text-sm text-muted-foreground">
            {rating} ({reviewCount} reviews)
          </span>
        </div>

        <div className="space-y-1">
          <motion.h3
            className="line-clamp-2 text-xl font-bold leading-tight tracking-tight"
            initial={{ opacity: 0.9 }}
            whileHover={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {name}
          </motion.h3>

          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-primary">{price}</span>
            {originalPrice && (
              <span className="text-lg text-muted-foreground line-through">
                {originalPrice}
              </span>
            )}
          </div>
        </div>
      </div>

      <motion.div
        variants={overlayVariants}
        className="absolute inset-0 flex flex-col justify-end bg-background/96 backdrop-blur-xl"
      >
        <div className="space-y-4 p-6">
          <motion.div variants={contentVariants}>
            <h4 className="mb-2 font-semibold">Product Details</h4>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {description}
            </p>
          </motion.div>

          <motion.div variants={contentVariants}>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-lg bg-muted/50 p-2 text-center">
                <div className="font-semibold">Premium Quality</div>
                <div className="text-muted-foreground">Curated item</div>
              </div>
              <div className="rounded-lg bg-muted/50 p-2 text-center">
                <div className="font-semibold">Fast Dispatch</div>
                <div className="text-muted-foreground">Reliable shipping</div>
              </div>
            </div>
          </motion.div>

          <motion.div variants={contentVariants} className="space-y-3">
            <motion.button
              onClick={() => {
                onAdd?.()
                handleNavigateToDetails()
              }}
              variants={buttonVariantsMotion}
              initial="rest"
              whileHover="hover"
              whileTap="tap"
              className={cn(
                buttonVariants({ variant: "default" }),
                "h-12 w-full cursor-pointer font-medium disabled:cursor-not-allowed",
                "bg-gradient-to-r from-primary to-primary/90 shadow-lg shadow-primary/25",
                "hover:from-primary/90 hover:to-primary"
              )}
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              Add to Cart
            </motion.button>

            <motion.button
              onClick={handleNavigateToDetails}
              variants={buttonVariantsMotion}
              initial="rest"
              whileHover="hover"
              whileTap="tap"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "h-10 w-full cursor-pointer font-medium disabled:cursor-not-allowed"
              )}
            >
              View Details
            </motion.button>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  )
}
