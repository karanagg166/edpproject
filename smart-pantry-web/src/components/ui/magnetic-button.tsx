"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";

interface MagneticButtonProps {
  children: React.ReactNode;
  className?: string;
  strength?: number;
  as?: "div" | "button" | "span";
}

/**
 * MagneticButton — cursor-tracking magnetic pull effect.
 * Wraps any element in a spring-animated div that pulls toward the cursor.
 *
 * Usage:
 *   <MagneticButton>
 *     <button className="...">Click me</button>
 *   </MagneticButton>
 */
export function MagneticButton({
  children,
  className,
  strength = 0.15,
}: MagneticButtonProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouse = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const { clientX, clientY } = e;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    const x = (clientX - (left + width / 2)) * strength;
    const y = (clientY - (top + height / 2)) * strength;
    setPosition({ x, y });
  };

  const reset = () => setPosition({ x: 0, y: 0 });

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouse}
      onMouseLeave={reset}
      animate={{ x: position.x, y: position.y }}
      transition={{
        type: "spring",
        stiffness: 200,
        damping: 18,
        mass: 0.08,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
