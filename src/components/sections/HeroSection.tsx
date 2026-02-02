"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import ParallaxLayer from "@/components/ParallaxLayer";

gsap.registerPlugin(ScrollTrigger);

export default function HeroSection() {
  const sectionRef = useRef<HTMLDivElement>(null!);

  useGSAP(
    () => {
      // Stagger each word in the title
      gsap.from(".hero-word", {
        y: 80,
        opacity: 0,
        duration: 1,
        stagger: 0.15,
        ease: "power3.out",
      });

      // Subtitle fades in after title
      gsap.from(".hero-subtitle", {
        y: 30,
        opacity: 0,
        duration: 1,
        delay: 0.8,
        ease: "power2.out",
      });

      // Scroll indicator pulses
      gsap.to(".scroll-indicator", {
        y: 10,
        opacity: 0.3,
        duration: 1.5,
        repeat: -1,
        yoyo: true,
        ease: "power1.inOut",
      });

      // Fade out the hero as user scrolls away
      gsap.to(sectionRef.current, {
        opacity: 0,
        y: -100,
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "bottom top",
          scrub: 1,
        },
      });
    },
    { scope: sectionRef }
  );

  return (
    <section
      ref={sectionRef}
      className="h-screen flex flex-col items-center justify-center relative overflow-hidden"
    >
      {/* Parallax decorative elements — each moves at a different speed */}
      <ParallaxLayer speed={-0.3} className="absolute top-20 left-[10%] pointer-events-none">
        <div className="w-32 h-32 rounded-full bg-violet-500/10 blur-2xl" />
      </ParallaxLayer>
      <ParallaxLayer speed={0.5} className="absolute top-40 right-[15%] pointer-events-none">
        <div className="w-48 h-48 rounded-full bg-fuchsia-500/10 blur-3xl" />
      </ParallaxLayer>
      <ParallaxLayer speed={-0.6} className="absolute bottom-32 left-[20%] pointer-events-none">
        <div className="w-24 h-24 rounded-full bg-indigo-500/15 blur-xl" />
      </ParallaxLayer>
      <ParallaxLayer speed={0.8} className="absolute bottom-20 right-[25%] pointer-events-none">
        <div className="w-16 h-16 rounded-full bg-pink-500/10 blur-lg" />
      </ParallaxLayer>

      {/* Grid lines for depth feel */}
      <ParallaxLayer speed={0.2} className="absolute inset-0 pointer-events-none opacity-[0.03]">
        <div
          className="w-full h-full"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)",
            backgroundSize: "80px 80px",
          }}
        />
      </ParallaxLayer>

      <h1 className="text-6xl md:text-8xl font-bold text-white text-center leading-tight overflow-hidden relative z-10">
        {"Scroll Through".split(" ").map((word, i) => (
          <span key={i} className="hero-word inline-block mr-4">
            {word}
          </span>
        ))}
        <br />
        {"The Experience".split(" ").map((word, i) => (
          <span
            key={i}
            className="hero-word inline-block mr-4 bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent"
          >
            {word}
          </span>
        ))}
      </h1>
      <p className="hero-subtitle text-zinc-400 text-xl mt-6 max-w-md text-center relative z-10">
        A cinematic journey through 3D space, driven entirely by your scroll
      </p>
      <div className="scroll-indicator absolute bottom-12 text-zinc-500 text-sm flex flex-col items-center gap-2">
        <span>Scroll</span>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 5v14M5 12l7 7 7-7" />
        </svg>
      </div>
    </section>
  );
}
