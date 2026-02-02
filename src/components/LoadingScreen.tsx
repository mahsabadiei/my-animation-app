"use client";

import { useProgress } from "@react-three/drei";
import { useEffect, useState } from "react";

export default function LoadingScreen() {
  const { progress, active } = useProgress();
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Once loading is complete, fade out after a short delay
    if (!active && progress === 100) {
      const timer = setTimeout(() => setVisible(false), 800);
      return () => clearTimeout(timer);
    }
  }, [active, progress]);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center transition-opacity duration-700 ${
        !active && progress === 100 ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="text-white text-lg font-mono mb-6">
        {Math.round(progress)}%
      </div>
      <div className="w-48 h-0.5 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-zinc-600 text-sm mt-4">Loading 3D assets</p>
    </div>
  );
}
