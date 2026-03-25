import FluidSimulation from "@/components/FluidSimulation";

export default function FluidSimPage() {
  return (
    <main className="relative min-h-screen text-white">
      <FluidSimulation
        config={{
          simResolution: 128,
          dyeResolution: 1024,
          densityDissipation: 0.97,
          velocityDissipation: 0.98,
          pressure: 0.8,
          pressureIterations: 20,
          curl: 30,
          splatRadius: 0.25,
          splatForce: 6000,
          backColor: { r: 0.08, g: 0.06, b: 0.02 },
          colorPalette: [
            { r: 0.8, g: 0.4, b: 0.05 },   // warm orange
            { r: 0.9, g: 0.65, b: 0.1 },    // golden
            { r: 1.0, g: 0.85, b: 0.3 },    // yellow
            { r: 0.35, g: 0.55, b: 0.15 },  // olive green
            { r: 0.3, g: 0.65, b: 0.2 },    // natural green
            { r: 0.5, g: 0.75, b: 0.25 },   // warm green
            { r: 0.6, g: 0.5, b: 0.1 },     // yellow-green
            { r: 0.85, g: 0.5, b: 0.1 },    // amber
          ],
        }}
      />

      {/* Content overlay */}
      <div className="relative z-10 flex items-center justify-center min-h-screen pointer-events-none">
        <h1 className="text-6xl md:text-8xl font-serif font-light tracking-wide text-white/90">
          Fluid Simulation
        </h1>
      </div>
    </main>
  );
}
