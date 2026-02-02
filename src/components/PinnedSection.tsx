"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function PinnedSection() {
  const containerRef = useRef<HTMLDivElement>(null!);

  useGSAP(
    () => {
      // A GSAP timeline sequences multiple animations.
      // Combined with ScrollTrigger pin + scrub, the section stays fixed
      // in place while you scroll, and the timeline progresses with scroll.
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: "+=3000", // the pin lasts for 3000px of scroll distance
          pin: true, // locks the section in place
          scrub: 1,
        },
      });

      // Step 1: Title slides in from left
      tl.from(".step-1", {
        x: -300,
        opacity: 0,
        duration: 1,
      });

      // Step 2: Description fades in from below (after step 1)
      tl.from(".step-2", {
        y: 100,
        opacity: 0,
        duration: 1,
      });

      // Step 3: Cards scale up with stagger
      tl.from(".step-3 .card", {
        scale: 0,
        opacity: 0,
        duration: 1,
        stagger: 0.3,
      });

      // Step 4: Everything fades out together
      tl.to(".step-1, .step-2, .step-3", {
        opacity: 0,
        y: -50,
        duration: 0.5,
      });
    },
    { scope: containerRef }
  );

  return (
    <section
      ref={containerRef}
      className="h-screen flex flex-col items-center justify-center bg-gradient-to-b from-black to-cyan-950 overflow-hidden"
    >
      <div className="step-1 mb-8">
        <h2 className="text-5xl md:text-7xl font-bold text-white text-center">
          Pinned Timeline
        </h2>
      </div>

      <div className="step-2 mb-12">
        <p className="text-xl text-zinc-400 text-center max-w-lg">
          This section is pinned in place. As you scroll, a sequence of
          animations plays through — title, then text, then cards.
        </p>
      </div>

      <div className="step-3 flex gap-6">
        {["Create", "Animate", "Ship"].map((label) => (
          <div
            key={label}
            className="card w-40 h-48 rounded-2xl bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center"
          >
            <span className="text-white font-semibold text-lg">{label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
