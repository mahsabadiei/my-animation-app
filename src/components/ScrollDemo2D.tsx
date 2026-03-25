"use client";

import { useRef } from "react";
import Link from "next/link";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function ScrollDemo2D() {
  const objectRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      // Create timeline for the object movement tied to scroll
      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: ".scroll-container",
          start: "top top",
          end: "bottom bottom",
          scrub: 1,
        },
      });

      // Animate the object through different positions as user scrolls
      timeline
        .to(objectRef.current, {
          x: 400,
          y: 200,
          rotation: 90,
          scale: 1.5,
          backgroundColor: "#3b82f6",
        })
        .to(objectRef.current, {
          x: -300,
          y: 600,
          rotation: 180,
          scale: 1,
          backgroundColor: "#8b5cf6",
        })
        .to(objectRef.current, {
          x: 200,
          y: 1000,
          rotation: 270,
          scale: 2,
          backgroundColor: "#ec4899",
        })
        .to(objectRef.current, {
          x: 0,
          y: 1400,
          rotation: 360,
          scale: 1,
          backgroundColor: "#10b981",
        });
    },
    { scope: containerRef }
  );

  return (
    <div
      ref={containerRef}
      className="scroll-container min-h-[300vh] bg-black text-white relative"
    >
      {/* Animated Object */}
      <div
        ref={objectRef}
        className="fixed top-20 left-1/2 -translate-x-1/2 w-20 h-20 bg-purple-600 rounded-lg shadow-lg z-50"
      />

      {/* Content sections to create scroll space */}
      <section className="h-screen flex items-center justify-center">
        <h1 className="text-6xl font-bold">Scroll Down</h1>
      </section>

      <section className="h-screen flex items-center justify-center">
        <h2 className="text-5xl font-bold text-blue-400">
          Watch the box move
        </h2>
      </section>

      <section className="h-screen flex items-center justify-center">
        <h2 className="text-5xl font-bold text-purple-400">
          Controlled by your scroll
        </h2>
      </section>

      <section className="h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-5xl font-bold text-pink-400 mb-8">
            GSAP + ScrollTrigger
          </h2>
          <Link
            href="/"
            className="inline-block px-8 py-4 bg-purple-600 rounded-full text-xl font-bold hover:scale-105 transition-transform"
          >
            Back to 3D Demo
          </Link>
        </div>
      </section>
    </div>
  );
}
