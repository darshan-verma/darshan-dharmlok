"use client";

import { TimelineContent } from "@/components/ui/timeline-animation";
import { VerticalCutReveal } from "@/components/ui/vertical-cut-reveal";
import {
  ArrowRight,
  BookOpen,
  Landmark,
  Newspaper,
  Plane,
  ShoppingBag,
  Users,
} from "lucide-react";
import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";

export default function AboutSection() {
  const heroRef = useRef<HTMLDivElement>(null);

  const heroRevealVariants = {
    visible: (i: number) => ({
      y: 0,
      opacity: 1,
      filter: "blur(0px)",
      transition: {
        delay: i * 0.08,
        duration: 0.35,
      },
    }),
    hidden: {
      filter: "blur(10px)",
      y: -16,
      opacity: 0,
    },
  };

  const heroScaleVariants = {
    visible: (i: number) => ({
      opacity: 1,
      filter: "blur(0px)",
      transition: {
        delay: i * 0.08,
        duration: 0.35,
      },
    }),
    hidden: {
      filter: "blur(10px)",
      opacity: 0,
    },
  };

  const revealVariants = {
    visible: (i: number) => ({
      y: 0,
      opacity: 1,
      filter: "blur(0px)",
      transition: {
        delay: i * 0.4,
        duration: 0.5,
      },
    }),
    hidden: {
      filter: "blur(10px)",
      y: -20,
      opacity: 0,
    },
  };

  return (
    <section
      className="py-8 px-4 bg-gradient-to-b from-orange-50 to-amber-50"
      ref={heroRef}
    >
      <div className="max-w-6xl mx-auto">
        {/* Top intro — who Dharmlok is */}
        <div className="mb-10 md:mb-12 text-center md:text-left">
          <TimelineContent
            as="p"
            animationNum={0}
            timelineRef={heroRef}
            customVariants={heroRevealVariants}
            className="text-orange-600 font-medium text-sm tracking-wide uppercase mb-2"
          >
            India&apos;s spiritual platform
          </TimelineContent>
          <TimelineContent
            as="h2"
            animationNum={1}
            timelineRef={heroRef}
            customVariants={heroRevealVariants}
            className="text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-4"
          >
            Dharmlok — faith, community, and sacred travel in one place
          </TimelineContent>
          <TimelineContent
            as="p"
            animationNum={2}
            timelineRef={heroRef}
            customVariants={heroRevealVariants}
            className="text-gray-600 max-w-3xl mx-auto md:mx-0 leading-relaxed mb-4"
          >
            Dharmlok helps devotees discover authentic spiritual experiences: book
            poojas and yoga sessions, connect with kathavachaks, dharmgurus, and
            pandits, explore temples and dharmshalas, plan pilgrimage travel with
            Dharmlok Travels, shop for puja essentials, and join a like-minded
            community — all with care for tradition and clarity online.
          </TimelineContent>
          <TimelineContent
            as="p"
            animationNum={3}
            timelineRef={heroRef}
            customVariants={heroRevealVariants}
            className="text-gray-600 max-w-3xl mx-auto md:mx-0 leading-relaxed text-sm md:text-base"
          >
            We verify listings where it matters, surface clear information for
            bookings and events, and keep support channels open so your journey
            from inquiry to darshan stays simple and respectful.
          </TimelineContent>
        </div>

        <div className="relative">
          {/* Header with social icons */}
          <div className="flex justify-between items-center mb-8 w-[85%] absolute lg:top-4 md:top-0 sm:-top-2 -top-3 z-10">
            <div className="flex items-center gap-2 text-xl">
              <span className="text-orange-500 animate-spin">✱</span>
              <TimelineContent
                as="span"
                animationNum={4}
                timelineRef={heroRef}
                customVariants={heroRevealVariants}
                className="text-sm font-medium text-gray-600"
              >
                WHO WE ARE
              </TimelineContent>
            </div>
            <div className="flex gap-4">
              <TimelineContent
                as="a"
                animationNum={5}
                timelineRef={heroRef}
                customVariants={heroRevealVariants}
                href="https://www.facebook.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="md:w-8 md:h-8 sm:w-6 w-5 sm:h-6 h-5 border border-orange-200 bg-orange-50 rounded-lg flex items-center justify-center cursor-pointer"
              >
                <Image
                  src="https://pro-section.ui-layouts.com/facebook.svg"
                  alt="Facebook"
                  width={24}
                  height={24}
                />
              </TimelineContent>
              <TimelineContent
                as="a"
                animationNum={6}
                timelineRef={heroRef}
                customVariants={heroRevealVariants}
                href="https://www.instagram.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="md:w-8 md:h-8 sm:w-6 w-5 sm:h-6 h-5 border border-orange-200 bg-orange-50 rounded-lg flex items-center justify-center cursor-pointer"
              >
                <Image
                  src="https://pro-section.ui-layouts.com/instagram.svg"
                  alt="Instagram"
                  width={24}
                  height={24}
                />
              </TimelineContent>
              <TimelineContent
                as="a"
                animationNum={7}
                timelineRef={heroRef}
                customVariants={heroRevealVariants}
                href="https://www.youtube.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="md:w-8 md:h-8 sm:w-6 w-5 sm:h-6 h-5 border border-orange-200 bg-orange-50 rounded-lg flex items-center justify-center cursor-pointer"
              >
                <Image
                  src="https://pro-section.ui-layouts.com/youtube.svg"
                  alt="YouTube"
                  width={24}
                  height={24}
                />
              </TimelineContent>
            </div>
          </div>

          <TimelineContent
            as="figure"
            animationNum={8}
            timelineRef={heroRef}
            customVariants={heroScaleVariants}
            className="relative group"
          >
            <svg
              className="w-full"
              width={"100%"}
              height={"100%"}
              viewBox="0 0 100 40"
            >
              <defs>
                <clipPath
                  id="clip-inverted"
                  clipPathUnits={"objectBoundingBox"}
                >
                  <path
                    d="M0.0998072 1H0.422076H0.749756C0.767072 1 0.774207 0.961783 0.77561 0.942675V0.807325C0.777053 0.743631 0.791844 0.731953 0.799059 0.734076H0.969813C0.996268 0.730255 1.00088 0.693206 0.999875 0.675159V0.0700637C0.999875 0.0254777 0.985045 0.00477707 0.977629 0H0.902473C0.854975 0 0.890448 0.138535 0.850165 0.138535H0.0204424C0.00408849 0.142357 0 0.180467 0 0.199045V0.410828C0 0.449045 0.0136283 0.46603 0.0204424 0.469745H0.0523086C0.0696245 0.471019 0.0735527 0.497877 0.0733523 0.511146V0.915605C0.0723903 0.983121 0.090588 1 0.0998072 1Z"
                    fill="#D9D9D9"
                  />
                </clipPath>
              </defs>
              <image
                clipPath="url(#clip-inverted)"
                preserveAspectRatio="xMidYMid slice"
                width={"100%"}
                height={"100%"}
                href="/know-more/hero-temple-gopuram.png"
                xlinkHref="/know-more/hero-temple-gopuram.png"
              />
            </svg>
          </TimelineContent>

          {/* Stats */}
          <div className="flex flex-wrap lg:justify-start justify-between items-center py-3 text-sm">
            <TimelineContent
              as="div"
              animationNum={9}
              timelineRef={heroRef}
              customVariants={heroRevealVariants}
              className="flex gap-4"
            >
              <div className="flex items-center gap-2 mb-2 sm:text-base text-xs">
                <span className="text-orange-500 font-bold">500+</span>
                <span className="text-gray-600">spiritual services</span>
                <span className="text-gray-300">|</span>
              </div>
              <div className="flex items-center gap-2 mb-2 sm:text-base text-xs">
                <span className="text-orange-500 font-bold">50+</span>
                <span className="text-gray-600">cities served</span>
              </div>
            </TimelineContent>
            <div className="lg:absolute right-0 bottom-16 flex lg:flex-col flex-row-reverse lg:gap-0 gap-4">
              <TimelineContent
                as="div"
                animationNum={10}
                timelineRef={heroRef}
                customVariants={heroRevealVariants}
                className="flex lg:text-4xl sm:text-3xl text-2xl items-center gap-2 mb-2"
              >
                <span className="text-orange-500 font-semibold">5000+</span>
                <span className="text-gray-600 uppercase">devotees</span>
              </TimelineContent>
              <TimelineContent
                as="div"
                animationNum={11}
                timelineRef={heroRef}
                customVariants={heroRevealVariants}
                className="flex items-center gap-2 mb-2 sm:text-base text-xs"
              >
                <span className="text-orange-500 font-bold">24/7</span>
                <span className="text-gray-600">support available</span>
                <span className="text-gray-300 lg:hidden block">|</span>
              </TimelineContent>
            </div>
          </div>
        </div>

        {/* What you can do on Dharmlok */}
        <div className="mt-10 md:mt-12 mb-10 md:mb-14">
          <TimelineContent
            as="h3"
            animationNum={12}
            timelineRef={heroRef}
            customVariants={heroRevealVariants}
            className="text-xl md:text-2xl font-semibold text-gray-900 mb-2 text-center md:text-left"
          >
            What you can do on Dharmlok
          </TimelineContent>
          <TimelineContent
            as="p"
            animationNum={13}
            timelineRef={heroRef}
            customVariants={heroRevealVariants}
            className="text-gray-600 text-sm md:text-base mb-6 max-w-2xl text-center md:text-left mx-auto md:mx-0"
          >
            Browse services, read and listen to spiritual media, plan trips, and
            reach our team when you need help — built for devotees, families, and
            travellers across India.
          </TimelineContent>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                icon: BookOpen,
                title: "Services & learning",
                body: "Book pooja and yoga, explore e-books, events, Bal Vidhya, and audio content for daily inspiration.",
              },
              {
                icon: Landmark,
                title: "Temples & stays",
                body: "Find temples, dharmshalas, and guides including kathavachaks, dharmgurus, and pandits for ceremonies.",
              },
              {
                icon: Plane,
                title: "Dharmlok Travels",
                body: "Plan flights, hotels, and spiritual itineraries with tools tailored for pilgrimage and sacred cities.",
              },
              {
                icon: ShoppingBag,
                title: "E-Shop",
                body: "Shop puja items and spiritual products curated for quality and authenticity.",
              },
              {
                icon: Users,
                title: "Community",
                body: "Share experiences, join conversations, and stay close to others on a similar path.",
              },
              {
                icon: Newspaper,
                title: "Media & inspiration",
                body: "Read spiritual blogs, explore the audio library, and tune into live streams when you want to learn or unwind.",
              },
            ].map((item, idx) => (
              <TimelineContent
                key={item.title}
                as="div"
                animationNum={14 + idx}
                timelineRef={heroRef}
                customVariants={heroRevealVariants}
                className="rounded-xl border border-orange-100 bg-white/80 p-5 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-100 text-orange-600">
                    <item.icon className="h-5 w-5" aria-hidden />
                  </span>
                  <div>
                    <p className="font-semibold text-gray-900 mb-1">{item.title}</p>
                    <p className="text-sm text-gray-600 leading-relaxed">{item.body}</p>
                  </div>
                </div>
              </TimelineContent>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <h1 className="sm:text-4xl md:text-5xl text-2xl !leading-[110%] font-semibold text-gray-900 mb-8">
              <VerticalCutReveal
                splitBy="words"
                staggerDuration={0.1}
                staggerFrom="first"
                reverse={true}
                transition={{
                  type: "spring",
                  stiffness: 250,
                  damping: 30,
                  delay: 3,
                }}
              >
                Your Trusted Companion on the Spiritual Path.
              </VerticalCutReveal>
            </h1>

            <TimelineContent
              as="div"
              animationNum={9}
              timelineRef={heroRef}
              customVariants={revealVariants}
              className="grid md:grid-cols-2 gap-8 text-gray-600"
            >
              <TimelineContent
                as="div"
                animationNum={10}
                timelineRef={heroRef}
                customVariants={revealVariants}
                className="sm:text-base text-xs"
              >
                <p className="leading-relaxed text-justify">
                  Dharmlok was born from a deep reverence for India&apos;s spiritual
                  heritage. We connect devotees with authentic spiritual guides,
                  verified temples, and comprehensive travel services to make
                  every pilgrimage meaningful and seamless.
                </p>
              </TimelineContent>
              <TimelineContent
                as="div"
                animationNum={11}
                timelineRef={heroRef}
                customVariants={revealVariants}
                className="sm:text-base text-xs"
              >
                <p className="leading-relaxed text-justify">
                  From booking pooja services to planning sacred journeys across
                  India, Dharmlok brings together tradition and technology.
                  Our platform empowers you to deepen your faith and explore
                  the divine with confidence and ease.
                </p>
              </TimelineContent>
            </TimelineContent>
          </div>

          <div className="md:col-span-1">
            <div className="text-right">
              <TimelineContent
                as="div"
                animationNum={12}
                timelineRef={heroRef}
                customVariants={revealVariants}
                className="mb-2"
              >
                <Image
                  src="/dharmlok-logo.svg"
                  alt="Dharmlok"
                  width={120}
                  height={40}
                  className="ml-auto object-contain"
                />
              </TimelineContent>
              <TimelineContent
                as="div"
                animationNum={13}
                timelineRef={heroRef}
                customVariants={revealVariants}
                className="text-gray-600 text-sm mb-8"
              >
                Spiritual Services | Sacred Journeys
              </TimelineContent>

              <TimelineContent
                as="div"
                animationNum={14}
                timelineRef={heroRef}
                customVariants={revealVariants}
                className="mb-6"
              >
                <p className="text-gray-900 font-medium mb-4">
                  Ready to begin your spiritual journey with us?
                </p>
              </TimelineContent>

              <Link href="/services" className="ml-auto block w-fit">
                <TimelineContent
                  as="span"
                  animationNum={15}
                  timelineRef={heroRef}
                  customVariants={revealVariants}
                  className="bg-orange-500 hover:bg-orange-600 shadow-lg shadow-orange-500/30 border border-orange-400 inline-flex gap-2 hover:gap-4 transition-all duration-300 ease-in-out text-white px-5 py-3 rounded-lg cursor-pointer font-semibold items-center"
                >
                  EXPLORE SERVICES <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
                </TimelineContent>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
