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

    // Color palette — teal and sage tones
    vec3 light_blue  = vec3(0.749, 0.765, 0.694);   // #BFC3B1
    vec3 muted_indigo = vec3(0.373, 0.557, 0.608);  // #5F8E9B
    vec3 light_grey  = vec3(0.835, 0.847, 0.800);   // #D5D8CC
    vec3 cool_grey   = vec3(0.239, 0.455, 0.533);   // #3D7488
    vec3 deep_purple = vec3(0.180, 0.404, 0.498);   // #2E677F
    vec3 soft_mauve  = vec3(0.545, 0.690, 0.722);   // #8BB0B8
    vec3 warm_white  = vec3(0.910, 0.918, 0.886);   // #E8EAE2
    vec3 dusty_plum  = vec3(0.302, 0.478, 0.541);   // #4D7A8A
    vec3 off_white   = vec3(0.949, 0.953, 0.933);   // #F2F3EE
    vec3 soft_beige  = vec3(0.816, 0.831, 0.784);   // #D0D4C8
    vec3 pure_white  = vec3(0.969, 0.973, 0.957);   // #F7F8F4

    // Start from deep purple, layer blobs on top
    vec3 color = deep_purple;
    color = mix(color, muted_indigo, b1);
    color = mix(color, light_blue, b2);
    color = mix(color, soft_mauve, b3 * 0.9);
    color = mix(color, warm_white, b4 * 0.7);
    color = mix(color, dusty_plum, b5 * 0.5);

    // Subtle cool grey accent blob
    float b6 = blob(st, vec2(0.3 * aspect, 0.65) + mouse * 0.4 + vec2(-nx, ny * 0.6), 0.45);
    color = mix(color, cool_grey, b6 * 0.35);

    // Light grey / beige glow near bottom-center
    float b7 = blob(st, vec2(0.4 * aspect, 0.15) + mouse * 0.5, 0.5);
    color = mix(color, light_grey, b7 * 0.6);

    // Off-white highlight near top
    float b8 = blob(st, vec2(0.6 * aspect, 0.85) + mouse * 0.2 + vec2(nx * 0.3, -ny * 0.4), 0.4);
    color = mix(color, off_white, b8 * 0.4);

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
