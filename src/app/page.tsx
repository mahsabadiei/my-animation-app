import SceneWithScroll from "@/components/SceneWithScroll";
import ScrollProgress from "@/components/ScrollProgress";
import HeroSection from "@/components/sections/HeroSection";
import FeatureSection from "@/components/sections/FeatureSection";
import FinaleSection from "@/components/sections/FinaleSection";

const features = [
  {
    title: "Scroll-Driven",
    description:
      "Every rotation, every camera move, every transform is tied directly to your scroll position. No auto-play — you control the timeline.",
    align: "center" as const,
  },
  {
    title: "Fixed Canvas",
    description:
      "The 3D scene lives on a fixed full-screen canvas at z-index 0. HTML sections scroll on top with glassmorphism panels so the 3D shows through.",
    align: "right" as const,
  },
  {
    title: "Camera Choreography",
    description:
      "Camera position, object transforms, and rotation are all defined in a config file. Change the numbers to redesign the entire experience.",
    align: "left" as const,
  },
  {
    title: "60fps Bridge",
    description:
      "GSAP writes to a plain JS ref. Three.js reads it in useFrame. No React re-renders in the animation loop. Buttery smooth at 60fps.",
    align: "right" as const,
  },
];

export default function Home() {
  return (
    <main>
      <ScrollProgress />
      <SceneWithScroll />

      <div className="relative z-10">
        <HeroSection />

        {features.map((feature, i) => (
          <FeatureSection
            key={i}
            title={feature.title}
            description={feature.description}
            align={feature.align}
            index={i}
          />
        ))}

        <FinaleSection />
      </div>
    </main>
  );
}
