"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const colors = [
  "from-purple-900 to-black",
  "from-blue-900 to-black",
  "from-emerald-900 to-black",
  "from-rose-900 to-black",
];

export default function ScrollSection({
  title,
  description,
  index,
}: {
  title: string;
  description: string;
  index: number;
}) {
  const sectionRef = useRef<HTMLDivElement>(null!);

  useGSAP(
    () => {
      gsap.from(sectionRef.current.querySelectorAll(".animate-in"), {
        y: 100,
        opacity: 0,
        duration: 1,
        stagger: 0.2,
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 80%", // animation starts when top of section hits 80% of viewport
          end: "top 20%", // animation ends when top of section hits 20% of viewport
          toggleActions: "play none none reverse",
          // toggleActions: "onEnter onLeave onEnterBack onLeaveBack"
          // "play none none reverse" means:
          //   - play forward when scrolling down into view
          //   - do nothing when scrolling past
          //   - do nothing when scrolling back into view from below
          //   - reverse when scrolling back up past the start
        },
      });
    },
    { scope: sectionRef }
  );

  return (
    <section
      ref={sectionRef}
      className={`min-h-screen flex flex-col items-center justify-center px-8 bg-gradient-to-b ${colors[index % colors.length]}`}
    >
      <h2 className="animate-in text-5xl md:text-7xl font-bold text-white mb-6">
        {title}
      </h2>
      <p className="animate-in text-xl text-zinc-400 max-w-lg text-center">
        {description}
      </p>
    </section>
  );
}
