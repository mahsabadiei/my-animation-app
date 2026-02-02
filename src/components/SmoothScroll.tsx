"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// Lenis provides buttery-smooth scrolling by intercepting native scroll
// and applying momentum-based easing. We sync it with GSAP's ticker so
// ScrollTrigger stays in perfect sync.
export default function SmoothScroll({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    const lenis = new Lenis({
      lerp: 0.1, // smoothness (lower = smoother, higher = snappier)
      wheelMultiplier: 1, // scroll speed multiplier
    });

    // Connect Lenis scroll updates to ScrollTrigger
    lenis.on("scroll", ScrollTrigger.update);

    // Use GSAP's ticker (requestAnimationFrame) to drive Lenis
    gsap.ticker.add((time) => {
      lenis.raf(time * 1000); // Lenis expects ms, GSAP gives seconds
    });

    // Disable GSAP's built-in lag smoothing so it doesn't conflict with Lenis
    gsap.ticker.lagSmoothing(0);

    return () => {
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}
