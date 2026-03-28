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
        </div>
      </div>
    </main>
  );
}
