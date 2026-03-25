"use client";

import { useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

// Global mouse position normalized to -1..1, updated via window listener
const globalMouse = new THREE.Vector2(0, 0);

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform float uTime;
  uniform vec2 uMouse;
  uniform vec2 uResolution;

  varying vec2 vUv;

  // Soft blob: returns 0..1 falloff from center
  float blob(vec2 uv, vec2 center, float radius) {
    float d = length(uv - center) / radius;
    return exp(-d * d * 2.0);
  }

  // Simple noise for gentle organic wobble
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }

  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
    vec2 i = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
    m = m * m; m = m * m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
    vec3 g;
    g.x = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  void main() {
    vec2 uv = vUv;
    float aspect = uResolution.x / uResolution.y;
    vec2 st = uv;
    st.x *= aspect;

    float t = uTime * 0.1;

    // Mouse in UV space: uMouse is -1..1, remap to displacement
    vec2 mouse = uMouse * vec2(0.5 * aspect, 0.5);

    // Subtle noise for organic wobble on blob positions
    float nx = snoise(vec2(t * 0.5, 0.0)) * 0.08;
    float ny = snoise(vec2(0.0, t * 0.4)) * 0.08;

    // Define large blob centers — mouse drives them strongly
    vec2 c1 = vec2(0.25 * aspect, 0.3) + mouse * 0.6 + vec2(nx, ny);            // lower-left: deep orange/red
    vec2 c2 = vec2(0.5 * aspect, 0.55) + mouse * 0.45 + vec2(-nx * 0.7, ny);    // center: bright orange
    vec2 c3 = vec2(0.65 * aspect, 0.7) + mouse * 0.35 + vec2(nx, -ny * 0.5);    // upper-center: golden yellow
    vec2 c4 = vec2(0.8 * aspect, 0.75) + mouse * 0.25 + vec2(-nx, ny * 0.3);    // upper-right: soft yellow/white
    vec2 c5 = vec2(0.85 * aspect, 0.5) + mouse * 0.3 + vec2(nx * 0.5, -ny);     // right: lavender/pink

    // Compute blob influences (large radii for broad, smooth shapes)
    float b1 = blob(st, c1, 0.65);
    float b2 = blob(st, c2, 0.55);
    float b3 = blob(st, c3, 0.50);
    float b4 = blob(st, c4, 0.45);
    float b5 = blob(st, c5, 0.40);

    // Color palette matching the reference
    vec3 deep_brown  = vec3(0.40, 0.18, 0.07);
    vec3 warm_orange = vec3(0.88, 0.40, 0.05);
    vec3 golden      = vec3(0.92, 0.72, 0.10);
    vec3 soft_yellow = vec3(1.0, 0.90, 0.35);
    vec3 warm_white  = vec3(1.0, 0.96, 0.82);
    vec3 lavender    = vec3(0.85, 0.75, 0.88);

    // Start from base brown, layer blobs on top
    vec3 color = deep_brown;
    color = mix(color, warm_orange, b1);
    color = mix(color, golden, b2);
    color = mix(color, soft_yellow, b3 * 0.9);
    color = mix(color, warm_white, b4 * 0.7);
    color = mix(color, lavender, b5 * 0.5);

    // Add a subtle secondary orange glow near bottom-center
    float b6 = blob(st, vec2(0.4 * aspect, 0.15) + mouse * 0.5, 0.5);
    color = mix(color, warm_orange * 1.1, b6 * 0.6);

    // Fine grid overlay
    vec2 grid = fract(st * 50.0);
    float gridLine = smoothstep(0.0, 0.025, grid.x) * smoothstep(0.0, 0.025, grid.y);
    color = mix(color * 0.94, color, gridLine);

    gl_FragColor = vec4(color, 1.0);
  }
`;

function GradientMesh() {
  const meshRef = useRef<THREE.Mesh>(null);
  const { size } = useThree();

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uResolution: { value: new THREE.Vector2(size.width, size.height) },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // Track mouse globally so it works even when content overlay captures events
  const targetMouse = useRef(new THREE.Vector2(0, 0));

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      // Normalize to -1..1
      globalMouse.set(
        (e.clientX / window.innerWidth) * 2 - 1,
        -((e.clientY / window.innerHeight) * 2 - 1),
      );
    };
    window.addEventListener("mousemove", onMouseMove);
    return () => window.removeEventListener("mousemove", onMouseMove);
  }, []);

  useFrame(({ clock }) => {
    uniforms.uTime.value = clock.getElapsedTime();
    uniforms.uResolution.value.set(size.width, size.height);

    // Smooth lerp toward actual mouse position
    targetMouse.current.copy(globalMouse);
    uniforms.uMouse.value.lerp(targetMouse.current, 0.12);
  });

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
      />
    </mesh>
  );
}

export default function GradientBackground() {
  return (
    <div className="fixed inset-0 w-full h-full">
      <Canvas
        gl={{ antialias: true, alpha: false }}
        camera={{ position: [0, 0, 1] }}
        style={{ width: "100%", height: "100%" }}
      >
        <GradientMesh />
      </Canvas>
    </div>
  );
}
