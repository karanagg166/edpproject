"use client";

import { useEffect, useState, useRef } from "react";
import { motion, HTMLMotionProps, useReducedMotion, useInView } from "framer-motion";

/**
 * useCountUp — animated number counter, only starts when scrolled into view.
 */
export function useCountUp(
  target: number,
  duration: number = 1200,
  ref?: React.RefObject<Element | null>
) {
  const [count, setCount] = useState(0);
  const inView = useInView(ref ?? { current: null } as React.RefObject<Element>, { once: true });
  const hasStarted = ref ? inView : true;

  useEffect(() => {
    if (!hasStarted) return;
    let startTimestamp: number | null = null;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // Ease-out cubic for smoother deceleration
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
  }, [target, duration, hasStarted]);

  return count;
}

/**
 * StaggerContainer — wraps children in a staggered entrance animation.
 */
export function StaggerContainer({
  children,
  staggerDelay = 0.07,
  className,
  ...props
}: HTMLMotionProps<"div"> & { staggerDelay?: number }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: shouldReduceMotion ? 0 : staggerDelay,
          },
        },
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/**
 * StaggerItem — child of StaggerContainer, slides up with fade.
 */
export function StaggerItem({ children, className, ...props }: HTMLMotionProps<"div">) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 16 },
        visible: { opacity: 1, y: 0 },
      }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/**
 * ScrollReveal — triggers a fade-in + subtle lift when the element enters
 * the viewport. Falls back to instant visibility on reduced-motion.
 */
export function ScrollReveal({
  children,
  className,
  delay = 0,
  y = 24,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  y?: number;
}) {
  const shouldReduceMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{
        duration: 0.5,
        delay: shouldReduceMotion ? 0 : delay,
        ease: [0.16, 1, 0.3, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * ScrollProgressBar — thin progress indicator pinned to the top of the page.
 */
export function ScrollProgressBar() {
  const [scroll, setScroll] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const totalScroll = document.documentElement.scrollTop;
      const windowHeight =
        document.documentElement.scrollHeight - document.documentElement.clientHeight;
      setScroll(windowHeight > 0 ? (totalScroll / windowHeight) * 100 : 0);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (scroll === 0) return null;

  return (
    <div className="fixed top-0 left-0 w-full h-[2px] z-[100] bg-transparent pointer-events-none">
      <div
        className="h-full bg-zinc-900 dark:bg-zinc-100"
        style={{
          width: `${scroll}%`,
          transition: "width 0.1s linear",
        }}
      />
    </div>
  );
}

/**
 * CursorGlow — subtle radial gradient that follows the cursor.
 * Desktop only, respects prefers-reduced-motion.
 */
export function CursorGlow() {
  const [pos, setPos] = useState({ x: -9999, y: -9999 });
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (shouldReduceMotion) return;
    const onMove = (e: MouseEvent) => setPos({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, [shouldReduceMotion]);

  if (shouldReduceMotion) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 hidden md:block"
      aria-hidden
      style={{
        background: `radial-gradient(400px circle at ${pos.x}px ${pos.y}px, rgba(161,161,170,0.06) 0%, transparent 70%)`,
        transition: "background 0.08s ease",
      }}
    />
  );
}
