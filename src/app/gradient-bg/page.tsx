import GradientBackground from "@/components/GradientBackground";

export default function GradientBgPage() {
  return (
    <main className="relative min-h-screen text-white">
      <GradientBackground />

      {/* Content overlay */}
      <div className="relative z-10 flex items-center justify-center min-h-screen">
        <h1 className="text-6xl md:text-8xl font-serif font-light tracking-wide text-white">
          Nixtla
        </h1>
      </div>
    </main>
  );
}
