"use client";

import { useEffect, useState } from "react";
import { motion, HTMLMotionProps } from "framer-motion";

export function useCountUp(target: number, duration: number = 1000) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      setCount(Math.floor(progress * target));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }, [target, duration]);

  return count;
}

export function StaggerContainer({ children, staggerDelay = 0.1, className, ...props }: HTMLMotionProps<"div"> & { staggerDelay?: number }) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: staggerDelay,
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

export function StaggerItem({ children, className, ...props }: HTMLMotionProps<"div">) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 15 },
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

export function ScrollProgressBar() {
  const [scroll, setScroll] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const totalScroll = document.documentElement.scrollTop;
      const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrollValue = `${(totalScroll / windowHeight) * 100}%`;
      setScroll(totalScroll === 0 ? 0 : parseFloat(scrollValue));
    };

    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (scroll === 0) return null;

  return (
    <div className="fixed top-0 left-0 w-full h-1 z-[100] bg-transparent">
      <div 
        className="h-full bg-zinc-900 transition-all duration-150 ease-out" 
        style={{ width: `${scroll}%` }} 
      />
    </div>
  );
}
