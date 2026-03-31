"use client";

import Image from "next/image";
import { ShaderGradientCanvas, ShaderGradient } from "@shadergradient/react";
import WateryGradientCard from "@/components/WateryGradientCard";

const cards = [
  {
    color1: "#224B68",
    color2: "#327EA1",
    color3: "#CACCB1",
    colorDark: [0.133, 0.294, 0.408] as [number, number, number],
    colorMid: [0.196, 0.494, 0.631] as [number, number, number],
    colorLight: [0.792, 0.8, 0.694] as [number, number, number],
    logo: { src: "/microsoft.png", alt: "Microsoft", width: 200, height: 60 },
  },
  {
    color1: "#8F9A9C",
    color2: "#AEB0AB",
    color3: "#CACCB1",
    colorDark: [0.561, 0.604, 0.612] as [number, number, number],
    colorMid: [0.682, 0.69, 0.671] as [number, number, number],
    colorLight: [0.792, 0.8, 0.694] as [number, number, number],
    logo: { src: "/lyft.png", alt: "Lyft", width: 120, height: 50 },
  },
  {
    color1: "#2E677F",
    color2: "#5F8E9B",
    color3: "#BFC3B1",
    colorDark: [0.18, 0.404, 0.498] as [number, number, number],
    colorMid: [0.373, 0.557, 0.608] as [number, number, number],
    colorLight: [0.749, 0.765, 0.694] as [number, number, number],
    logo: { src: "/dar.png", alt: "Darnytsia", width: 200, height: 60 },
  },
];

export default function GradientBg6Page() {
  return (
    <main className="min-h-screen bg-white px-6 py-16">
      <h2 className="mb-10 text-4xl font-light text-gray-900">
        Success Stories
      </h2>

      {/* Row 1 — Our custom watery cards */}
      <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
        {cards.map((card, i) => (
          <WateryGradientCard
            key={i}
            colorDark={card.colorDark}
            colorMid={card.colorMid}
            colorLight={card.colorLight}
          >
            <Image
              src={card.logo.src}
              alt={card.logo.alt}
              width={card.logo.width}
              height={card.logo.height}
              className="object-contain"
            />
          </WateryGradientCard>
        ))}
      </div>

      {/* Row 2 — ShaderGradient cards */}
      <div className="mt-10 grid grid-cols-1 gap-10 md:grid-cols-3">
        {cards.map((card, i) => (
          <div
            key={i}
            className="relative w-full overflow-hidden rounded-2xl"
            style={{ aspectRatio: "4 / 3" }}
          >
            <ShaderGradientCanvas
              style={{ position: "absolute", inset: 0 }}
              pixelDensity={1}
              fov={45}
            >
              <ShaderGradient
                type="waterPlane"
                color1={card.color1}
                color2={card.color2}
                color3={card.color3}
                animate="on"
                uSpeed={0.3}
                uStrength={1.5}
                uFrequency={3.5}
                uDensity={1.2}
                uAmplitude={1.5}
                grain="on"
                grainBlending={0.3}
                cDistance={3.6}
                cPolarAngle={115}
                cAzimuthAngle={180}
                lightType="3d"
                brightness={1.2}
                reflection={0.1}
              />
            </ShaderGradientCanvas>

            <div className="relative z-10 flex h-full w-full items-center justify-center">
              <Image
                src={card.logo.src}
                alt={card.logo.alt}
                width={card.logo.width}
                height={card.logo.height}
                className="object-contain"
              />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
