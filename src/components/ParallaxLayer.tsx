"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// Wraps any children in a parallax layer that moves at a different
// speed than normal scroll. speed > 0 = moves down slower (background feel),
// speed < 0 = moves opposite direction.
export default function ParallaxLayer({
  children,
  speed = 0.5,
  className = "",
}: {
  children: React.ReactNode;
  speed?: number;
  className?: string;
}) {
  const layerRef = useRef<HTMLDivElement>(null!);

  useGSAP(() => {
    gsap.to(layerRef.current, {
      y: speed * 200,
      ease: "none",
      scrollTrigger: {
        trigger: layerRef.current,
        start: "top bottom",
        end: "bottom top",
        scrub: true,
      },
    });
  });

  return (
    <div ref={layerRef} className={className}>
      {children}
    </div>
  );
}
