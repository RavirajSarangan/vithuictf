"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

const inViewViewport = { once: true, amount: 0.01 } as const;

interface MotionSectionProps extends Omit<HTMLMotionProps<"div">, "children"> {
  delay?: number;
  children?: ReactNode;
}

export function MotionSection({ delay = 0, className, children, ...props }: MotionSectionProps) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div className={cn(className)}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ y: 12, opacity: 1 }}
      whileInView={{ y: 0, opacity: 1 }}
      viewport={inViewViewport}
      transition={{ duration: 0.45, ease: "easeOut", delay }}
      className={cn(className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}

interface MotionStaggerProps {
  children: ReactNode;
  className?: string;
  stagger?: number;
}

export function MotionStagger({ children, className, stagger = 0.1 }: MotionStaggerProps) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={inViewViewport}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: stagger } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface MotionStaggerItemProps {
  children: ReactNode;
  className?: string;
}

export function MotionStaggerItem({ children, className }: MotionStaggerItemProps) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      variants={{
        hidden: { y: 12, opacity: 1 },
        visible: { y: 0, opacity: 1, transition: { duration: 0.45, ease: "easeOut" } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
