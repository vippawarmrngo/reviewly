import { m } from "framer-motion";
import type { ReactNode } from "react";
import { useMotionOk } from "./useMotionOk";

interface Props {
  children: ReactNode;
  /** Seconds to wait once visible; use index * 0.06 to stagger a list. */
  delay?: number;
  /** Pixels to travel; 0 for a plain fade. */
  y?: number;
  className?: string;
  as?: "div" | "li" | "section";
  /** Accessible name, for a section that should be a landmark. */
  label?: string;
}

/** Fades content in the first time it scrolls into view. With motion off it is just the content. */
export function Reveal({ children, delay = 0, y = 16, className, as = "div", label }: Props) {
  const ok = useMotionOk();
  if (!ok) {
    const Tag = as;
    return (
      <Tag className={className} aria-label={label}>
        {children}
      </Tag>
    );
  }
  const Component = m[as];
  return (
    <Component
      className={className}
      aria-label={label}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -8% 0px" }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </Component>
  );
}
