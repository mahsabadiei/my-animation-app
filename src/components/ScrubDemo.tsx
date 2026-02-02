"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function ScrubDemo() {
  const sectionRef = useRef<HTMLDivElement>(null!);

  useGSAP(
    () => {
      // The circle scales up as you scroll through this section.
      // scrub: 1 means animation progress = scroll progress,
      // with 1 second of smooth catchup (so it doesn't feel jerky).
      // Try changing scrub to `true` (instant, no smoothing) or `3` (slower catchup).
      gsap.fromTo(
        ".scrub-circle",
        { scale: 0.1, opacity: 0, rotation: 0 },
        {
          scale: 1,
          opacity: 1,
          rotation: 360,
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top bottom", // when section top hits viewport bottom
            end: "bottom top", // when section bottom hits viewport top
            scrub: 1,
          },
        }
      );

      // The text slides in from the left, also scrubbed to scroll
      gsap.fromTo(
        ".scrub-text",
        { x: -200, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 70%",
            end: "center center",
            scrub: 1,
          },
        }
      );
    },
    { scope: sectionRef }
  );

  return (
    <section
      ref={sectionRef}
      className="min-h-[150vh] flex flex-col items-center justify-center bg-gradient-to-b from-indigo-950 to-black relative overflow-hidden"
    >
      <div className="scrub-circle w-64 h-64 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 absolute" />
      <h2 className="scrub-text text-5xl md:text-7xl font-bold text-white relative z-10">
        Scroll = Progress
      </h2>
      <p className="scrub-text text-xl text-zinc-400 mt-4 relative z-10">
        The animation is tied 1:1 to your scroll position
      </p>
    </section>
  );
}
