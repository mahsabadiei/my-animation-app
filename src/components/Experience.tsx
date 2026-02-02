"use client";

import { useFrame } from "@react-three/fiber";
import { Environment, ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import type { AnimValues } from "@/lib/animationConfig";
import Model from "./Model";

export default function Experience({
  animValues,
}: {
  animValues: React.RefObject<AnimValues>;
}) {
  useFrame((state) => {
    const v = animValues.current;

    // Smoothly move the camera toward the target position
    state.camera.position.lerp(
      new THREE.Vector3(v.camX, v.camY, v.camZ),
      0.05
    );
    // Camera always looks at the object
    state.camera.lookAt(v.objX, v.objY, v.objZ);
  });

  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 5, 5]} intensity={1} />
      <directionalLight position={[-5, 3, -5]} intensity={0.4} color="#4f46e5" />

      {/* The real 3D model replaces our torus knot */}
      <Model animValues={animValues} />

      <ContactShadows
        position={[0, -2, 0]}
        opacity={0.4}
        scale={10}
        blur={2}
      />
      <Environment preset="city" />
    </>
  );
}
