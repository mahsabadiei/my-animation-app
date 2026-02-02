"use client";

import { useRef } from "react";
import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { Group } from "three";
import type { AnimValues } from "@/lib/animationConfig";

export default function Model({
  animValues,
}: {
  animValues: React.RefObject<AnimValues>;
}) {
  const { scene } = useGLTF("/models/DamagedHelmet.glb");
  const groupRef = useRef<Group>(null!);

  useFrame(() => {
    const v = animValues.current;

    // Smoothly move, rotate, and scale the model based on scroll values
    groupRef.current.position.lerp(
      new THREE.Vector3(v.objX, v.objY, v.objZ),
      0.1
    );
    groupRef.current.rotation.x = THREE.MathUtils.lerp(
      groupRef.current.rotation.x,
      v.rotX,
      0.1
    );
    groupRef.current.rotation.y = THREE.MathUtils.lerp(
      groupRef.current.rotation.y,
      v.rotY,
      0.1
    );
    groupRef.current.scale.lerp(
      new THREE.Vector3(v.scale, v.scale, v.scale),
      0.1
    );
  });

  return <primitive ref={groupRef} object={scene} />;
}

// Pre-load the model so it starts downloading immediately
useGLTF.preload("/models/DamagedHelmet.glb");
