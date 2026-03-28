import WateryGradient from "@/components/WateryGradient";

export default function GradientBg4Page() {
  return (
    <main className="relative min-h-screen overflow-hidden text-white">
      <WateryGradient />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-6">
        <div className="max-w-4xl text-center">
          <p className="mb-5 text-sm uppercase tracking-[0.4em] text-white/60">
            Gradient Bg 4
          </p>
          <h1 className="text-5xl font-serif font-light tracking-tight text-white md:text-8xl">
            <em>Transforming</em> Brands,
            <br />
            Building <em>Futures</em>
          </h1>
          <p className="mt-8 text-sm text-white/50 max-w-lg mx-auto">
            A New York–based brand transformation studio working across
            strategy, design, and digital.
          </p>
        </div>
      </div>
    </main>
  );
}
