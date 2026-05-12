"use client";

import {
  motion,
  useInView,
  type Variants,
} from "framer-motion";
import {
  type ElementType,
  type ComponentPropsWithoutRef,
  type RefObject,
  type ReactNode,
  type JSX,
} from "react";

type TimelineContentOwnProps<T extends ElementType> = {
  as?: T;
  animationNum: number;
  timelineRef: RefObject<HTMLElement | null>;
  customVariants?: Variants;
  children?: ReactNode;
};

type TimelineContentProps<T extends ElementType> = TimelineContentOwnProps<T> &
  Omit<ComponentPropsWithoutRef<T>, keyof TimelineContentOwnProps<T>>;

const MOTION_TAGS: Record<string, ReturnType<typeof motion.create>> = {};

function getMotionComponent(tag: string) {
  if (!MOTION_TAGS[tag]) {
    MOTION_TAGS[tag] = motion.create(tag as keyof JSX.IntrinsicElements);
  }
  return MOTION_TAGS[tag];
}

export function TimelineContent<T extends ElementType = "div">({
  as,
  animationNum,
  timelineRef,
  customVariants,
  children,
  ...props
}: TimelineContentProps<T>) {
  const tag = (typeof as === "string" ? as : "div") as string;
  const MotionComponent = getMotionComponent(tag);
  const isInView = useInView(timelineRef, { once: false, amount: 0.1 });

  return (
    <MotionComponent
      custom={animationNum}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={customVariants}
      {...props}
    >
      {children}
    </MotionComponent>
  );
}
