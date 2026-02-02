"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function ScrollProgress() {
  const barRef = useRef<HTMLDivElement>(null!);

  useGSAP(() => {
    gsap.to(barRef.current, {
      scaleX: 1, // scale from 0 to 1 on the X axis
      ease: "none", // linear — no easing, pure 1:1 scroll mapping
      scrollTrigger: {
        trigger: document.body,
        start: "top top",
        end: "bottom bottom",
        scrub: 0.3, // very fast catchup for the progress bar
      },
    });
  });

  return (
    <div className="fixed top-0 left-0 right-0 h-1 z-50">
      <div
        ref={barRef}
        className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 origin-left"
        style={{ transform: "scaleX(0)" }}
      />
    </div>
  );
}
