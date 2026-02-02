"use client";

import { Suspense, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { Preload } from "@react-three/drei";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Experience from "./Experience";
import LoadingScreen from "./LoadingScreen";
import { initialValues, stages } from "@/lib/animationConfig";
import type { AnimValues } from "@/lib/animationConfig";

gsap.registerPlugin(ScrollTrigger);

export default function SceneWithScroll() {
  const animValues = useRef<AnimValues>({ ...initialValues });

  useGSAP(() => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: document.body,
        start: "top top",
        end: "bottom bottom",
        scrub: 1,
      },
    });

    for (const stage of stages) {
      tl.to(animValues.current, {
        ...stage,
        duration: 1,
        ease: "power2.inOut",
      });
    }
  });

  return (
    <>
      <LoadingScreen />
      <div className="fixed inset-0 z-0">
        <Canvas camera={{ position: [0, 0, 8], fov: 45 }} dpr={[1, 2]}>
          <Suspense fallback={null}>
            <Experience animValues={animValues} />
          </Suspense>
          <Preload all />
        </Canvas>
      </div>
    </>
  );
}
