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

  // Noise functions (must be defined before blob)
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

  // Organic blob: shape warped by spatial noise for smooth morphing
  float blob(vec2 uv, vec2 center, float radius, float seed) {
    vec2 diff = uv - center;
    // Warp the position with smooth spatial noise — no angular spikes
    vec2 warp = vec2(
      snoise(uv * 1.8 + vec2(seed, uTime * 0.12)),
      snoise(uv * 1.8 + vec2(uTime * 0.10, seed + 5.0))
    ) * 0.12;
    float d = length(diff + warp) / radius;
    return exp(-d * d * 2.0);
  }

  void main() {
    vec2 uv = vUv;
    float aspect = uResolution.x / uResolution.y;
    vec2 st = uv;
    st.x *= aspect;

    // Mouse position in aspect-corrected UV space
    vec2 mouseUV = uMouse * 0.5 + 0.5; // remap -1..1 to 0..1
    vec2 mouseST = vec2(mouseUV.x * aspect, mouseUV.y);

    // Mouse push/pull: warp the sample point away from cursor
    vec2 toMouse = st - mouseST;
    float mouseDist = length(toMouse);
    float pushStrength = exp(-mouseDist * mouseDist * 3.0) * 0.15;
    vec2 warpedST = st + normalize(toMouse + 0.001) * pushStrength;

    // Each blob has independent drift driven by its own noise seed
    vec2 c1 = vec2(0.25 * aspect, 0.3) + vec2(
      snoise(vec2(uTime * 0.08, 1.0)) * 0.12,
      snoise(vec2(1.0, uTime * 0.06)) * 0.10);
    vec2 c2 = vec2(0.5 * aspect, 0.55) + vec2(
      snoise(vec2(uTime * 0.07, 3.5)) * 0.10,
      snoise(vec2(3.5, uTime * 0.09)) * 0.12);
    vec2 c3 = vec2(0.65 * aspect, 0.7) + vec2(
      snoise(vec2(uTime * 0.06, 6.0)) * 0.14,
      snoise(vec2(6.0, uTime * 0.07)) * 0.08);
    vec2 c4 = vec2(0.8 * aspect, 0.75) + vec2(
      snoise(vec2(uTime * 0.09, 9.0)) * 0.08,
      snoise(vec2(9.0, uTime * 0.05)) * 0.12);
    vec2 c5 = vec2(0.85 * aspect, 0.5) + vec2(
      snoise(vec2(uTime * 0.05, 12.0)) * 0.10,
      snoise(vec2(12.0, uTime * 0.08)) * 0.10);
    vec2 c6 = vec2(0.3 * aspect, 0.65) + vec2(
      snoise(vec2(uTime * 0.07, 15.0)) * 0.11,
      snoise(vec2(15.0, uTime * 0.06)) * 0.09);
    vec2 c7 = vec2(0.4 * aspect, 0.15) + vec2(
      snoise(vec2(uTime * 0.06, 18.0)) * 0.10,
      snoise(vec2(18.0, uTime * 0.07)) * 0.12);

    // Pulsing radii — each blob breathes independently
    float r1 = 0.65 + snoise(vec2(uTime * 0.12, 2.0)) * 0.08;
    float r2 = 0.55 + snoise(vec2(uTime * 0.10, 4.0)) * 0.07;
    float r3 = 0.50 + snoise(vec2(uTime * 0.09, 7.0)) * 0.08;
    float r4 = 0.45 + snoise(vec2(uTime * 0.11, 10.0)) * 0.06;
    float r5 = 0.40 + snoise(vec2(uTime * 0.08, 13.0)) * 0.07;
    float r6 = 0.45 + snoise(vec2(uTime * 0.10, 16.0)) * 0.06;
    float r7 = 0.50 + snoise(vec2(uTime * 0.09, 19.0)) * 0.08;

    // Compute organic blob influences using warped coordinates
    float b1 = blob(warpedST, c1, r1, 1.0);
    float b2 = blob(warpedST, c2, r2, 2.7);
    float b3 = blob(warpedST, c3, r3, 4.3);
    float b4 = blob(warpedST, c4, r4, 6.1);
    float b5 = blob(warpedST, c5, r5, 8.5);
    float b6 = blob(warpedST, c6, r6, 10.9);
    float b7 = blob(warpedST, c7, r7, 13.2);

    // Color palette — teal and sage tones
    vec3 cPeriwinkle = vec3(0.749, 0.765, 0.694);   // #BFC3B1
    vec3 cSlate      = vec3(0.373, 0.557, 0.608);  // #5F8E9B
    vec3 cSilver     = vec3(0.835, 0.847, 0.800);  // #D5D8CC
    vec3 cGray       = vec3(0.239, 0.455, 0.533);  // #3D7488
    vec3 cDeepPurple = vec3(0.180, 0.404, 0.498);  // #2E677F
    vec3 cMauve      = vec3(0.545, 0.690, 0.722);  // #8BB0B8
    vec3 cOffWhite   = vec3(0.910, 0.918, 0.886);  // #E8EAE2
    vec3 cDustyPurp  = vec3(0.302, 0.478, 0.541);  // #4D7A8A
    vec3 cSnow       = vec3(0.949, 0.953, 0.933);  // #F2F3EE
    vec3 cWarmGray   = vec3(0.816, 0.831, 0.784);  // #D0D4C8
    vec3 cWhite      = vec3(0.969, 0.973, 0.957);  // #F7F8F4

    // Layer colors — they melt into each other
    vec3 color = cDeepPurple;
    color = mix(color, cSlate, b1);
    color = mix(color, cPeriwinkle, b2);
    color = mix(color, cMauve, b3 * 0.9);
    color = mix(color, cDustyPurp, b4 * 0.7);
    color = mix(color, cSilver, b5 * 0.6);
    color = mix(color, cOffWhite, b6 * 0.5);
    color = mix(color, cSnow, b7 * 0.4);

    // Film grain / noise overlay
    float noise = snoise(uv * 500.0 + uTime * 3.0) * 0.5 + 0.5;
    noise = mix(0.92, 1.08, noise);
    color *= noise;

    // Uniform square grid — fixed pixel size cells
    float cellSize = 30.0; // pixels per cell
    vec2 gridCoord = gl_FragCoord.xy / cellSize;
    vec2 gridFrac = fract(gridCoord);
    float lineW = 1.0 / cellSize; // 1px line
    float gridLine = smoothstep(0.0, lineW, gridFrac.x) * smoothstep(0.0, lineW, gridFrac.y);
    color = mix(color * 0.88, color, gridLine);

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
