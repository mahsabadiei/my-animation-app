"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function FinaleSection() {
  const sectionRef = useRef<HTMLDivElement>(null!);

  useGSAP(
    () => {
      gsap.from(".finale-title", {
        scale: 0.5,
        opacity: 0,
        duration: 1,
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 60%",
          end: "top 20%",
          scrub: 1,
        },
      });

      gsap.from(".finale-line", {
        scaleX: 0,
        duration: 1,
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 40%",
          end: "top 10%",
          scrub: 1,
        },
      });

      gsap.from(".finale-cta", {
        y: 40,
        opacity: 0,
        duration: 1,
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 30%",
          end: "center center",
          scrub: 1,
        },
      });
    },
    { scope: sectionRef }
  );

  return (
    <section
      ref={sectionRef}
      className="h-screen flex flex-col items-center justify-center"
    >
      <h2 className="finale-title text-5xl md:text-7xl font-bold text-white text-center">
        Built with
        <br />
        <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
          GSAP + Three.js
        </span>
      </h2>
      <div className="finale-line w-32 h-0.5 bg-gradient-to-r from-violet-500 to-fuchsia-500 my-8 origin-left" />
      <p className="finale-cta text-zinc-400 text-lg max-w-md text-center">
        Scroll-driven 3D animations. Fixed canvas architecture.
        Data-driven camera choreography. All running at 60fps.
      </p>
    </section>
  );
}
