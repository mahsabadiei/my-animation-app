import LiquidMotionBackground from "@/components/LiquidMotionBackground";

export default function GradientBg3Page() {
  return (
    <main className="relative min-h-screen overflow-hidden text-white">
      <LiquidMotionBackground />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-6">
        <div className="max-w-4xl text-center">
          <p className="mb-5 text-sm uppercase tracking-[0.4em] text-white/60">
            Gradient Bg 3
          </p>
          <h1 className="text-5xl font-serif font-light tracking-tight text-white md:text-8xl">
            Liquid Motion
          </h1>
        </div>
      </div>
    </main>
  );
}
