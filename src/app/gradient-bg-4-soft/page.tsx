import WateryGradientSoft from "@/components/WateryGradientSoft";

export default function GradientBg4SoftPage() {
  return (
    <main className="relative min-h-screen overflow-hidden text-white">
      <WateryGradientSoft />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-6">
        <div className="max-w-4xl text-center">
          <p className="mb-5 text-sm uppercase tracking-[0.4em] text-white/60">
            Gradient Bg 4 — Soft Light
          </p>
        </div>
      </div>
    </main>
  );
}
