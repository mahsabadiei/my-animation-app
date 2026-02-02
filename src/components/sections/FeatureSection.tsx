"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface FeatureSectionProps {
  title: string;
  description: string;
  align: "left" | "right" | "center";
  index: number;
}

export default function FeatureSection({
  title,
  description,
  align,
  index,
}: FeatureSectionProps) {
  const sectionRef = useRef<HTMLDivElement>(null!);

  useGSAP(
    () => {
      const xStart = align === "left" ? -100 : align === "right" ? 100 : 0;

      gsap.from(".feature-card", {
        x: xStart,
        opacity: 0,
        duration: 1,
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 60%",
          end: "top 20%",
          scrub: 1,
        },
      });

      // Add a subtle floating animation once the card is visible
      gsap.to(".feature-card", {
        y: -10,
        duration: 2,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 60%",
          toggleActions: "play none none none",
        },
      });
    },
    { scope: sectionRef }
  );

  const alignClasses = {
    left: "items-start pl-8 md:pl-24",
    right: "items-end pr-8 md:pr-24",
    center: "items-center",
  };

  return (
    <section
      ref={sectionRef}
      className={`h-screen flex ${alignClasses[align]} justify-center flex-col`}
    >
      <div className="feature-card bg-black/60 backdrop-blur-xl border border-white/10 rounded-3xl p-10 max-w-md shadow-2xl shadow-violet-500/10">
        <span className="text-violet-400 text-sm font-mono tracking-wider uppercase mb-4 block">
          0{index + 1}
        </span>
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          {title}
        </h2>
        <p className="text-zinc-300 leading-relaxed">{description}</p>
      </div>
    </section>
  );
}
