"use client";

import { useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

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
  uniform vec3 uColorDark;
  uniform vec3 uColorMid;
  uniform vec3 uColorLight;

  varying vec2 vUv;

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

  float waveHeight(vec2 p, float t) {
    float h = 0.0;
    float nx = snoise(p * 0.4 + t * 0.03) * 0.4;
    float ny = snoise(p * 0.35 + vec2(7.0, 3.0) + t * 0.025) * 0.4;
    vec2 wp = p + vec2(nx, ny);

    float wave1 = sin(wp.x * 1.8 + wp.y * 1.2 + t * 0.15 + snoise(wp * 0.5 + t * 0.04) * 1.5);
    h += wave1 * 0.35;
    float wave2 = sin(wp.x * 1.0 - wp.y * 2.2 + t * 0.12 + snoise(wp * 0.6 + vec2(3.0, 0.0) + t * 0.05) * 1.2);
    h += wave2 * 0.25;
    float wave3 = sin(wp.x * 2.5 + t * 0.18 + snoise(wp * 0.45 + vec2(0.0, 5.0) + t * 0.03) * 1.8);
    h += wave3 * 0.18;
    float wave4 = sin(wp.y * 1.5 + t * 0.08 + snoise(wp * 0.3 + vec2(10.0, 2.0) + t * 0.02) * 2.0);
    h += wave4 * 0.15;
    float wave5 = sin(wp.x * 4.0 + wp.y * 3.0 + t * 0.25 + snoise(wp * 0.8 + t * 0.06) * 1.0);
    h += wave5 * 0.07;
    return h;
  }

  vec3 calcNormal(vec2 p, float t, float eps) {
    float hL = waveHeight(p - vec2(eps, 0.0), t);
    float hR = waveHeight(p + vec2(eps, 0.0), t);
    float hD = waveHeight(p - vec2(0.0, eps), t);
    float hU = waveHeight(p + vec2(0.0, eps), t);
    float heightScale = 0.8;
    return normalize(vec3(
      (hL - hR) * heightScale / (2.0 * eps),
      (hD - hU) * heightScale / (2.0 * eps),
      1.0
    ));
  }

  void main() {
    vec2 uv = vUv;
    float aspect = uResolution.x / uResolution.y;
    vec2 st = uv;
    st.x *= aspect;

    vec2 mouseUV = uMouse * 0.5 + 0.5;
    vec2 mouseST = vec2(mouseUV.x * aspect, mouseUV.y);

    vec2 toMouse = st - mouseST;
    float mouseDist = length(toMouse);
    float influence = exp(-mouseDist * mouseDist * 2.5) * 0.2;
    float ang = atan(toMouse.y, toMouse.x);
    vec2 swirlDir = vec2(cos(ang + 1.3), sin(ang + 1.3));
    vec2 pushDir = normalize(toMouse + 0.0001);
    st += pushDir * influence + swirlDir * influence * 0.5;

    float t = uTime;

    float h = waveHeight(st, t);
    vec3 N = calcNormal(st, t, 0.004);

    vec3 lightDir = normalize(vec3(0.4, 0.5, 0.8));
    vec3 viewDir = vec3(0.0, 0.0, 1.0);
    vec3 halfVec = normalize(lightDir + viewDir);

    // Gentle diffuse — narrow range to avoid bright spots
    float diffuse = max(dot(N, lightDir), 0.0);
    diffuse = diffuse * 0.3 + 0.7;

    // Subtle spec — just enough to show wave shape
    float spec = pow(max(dot(N, halfVec), 0.0), 80.0);
    float spec2 = pow(max(dot(N, halfVec), 0.0), 20.0);

    // Derive palette from 3 input colors — stay close to the inputs, no white mixing
    vec3 cDark    = uColorDark;
    vec3 cMid     = uColorMid;
    vec3 cLight   = uColorLight;
    vec3 cDarkMid = mix(cDark, cMid, 0.5);
    vec3 cMauve   = mix(cMid, cLight, 0.5);
    vec3 cSilver  = mix(cLight, cMid, 0.2);
    vec3 cSnow    = mix(cLight, cMid, 0.1);

    float hNorm = clamp(h * 0.5 + 0.5, 0.0, 1.0);

    vec3 baseColor = mix(cDark, cMid, smoothstep(0.1, 0.5, hNorm));
    baseColor = mix(baseColor, cLight, smoothstep(0.45, 0.8, hNorm));
    baseColor = mix(baseColor, cMauve, smoothstep(0.7, 0.95, hNorm) * 0.3);

    float h2 = waveHeight(st + vec2(2.0, 1.5), t * 0.7);
    float h2Norm = clamp(h2 * 0.5 + 0.5, 0.0, 1.0);
    baseColor = mix(baseColor, cDarkMid, smoothstep(0.25, 0.55, h2Norm) * smoothstep(0.55, 0.25, hNorm) * 0.5);

    vec3 color = baseColor * diffuse;

    // Very subtle specular — tinted by the palette, not white
    vec3 specColor = mix(cSilver, cSnow, 0.5);
    color += specColor * spec * 0.15;
    color += cLight * spec2 * 0.06;

    // Soft rim — tinted by mid color
    float rim = 1.0 - max(dot(N, viewDir), 0.0);
    rim = pow(rim, 3.0);
    color += cMid * rim * 0.08;

    float ao = smoothstep(0.0, 0.35, hNorm);
    color *= mix(0.65, 1.0, ao);

    float noise = snoise(uv * 500.0 + t * 3.0) * 0.5 + 0.5;
    noise = mix(0.92, 1.08, noise);
    color *= noise;

    gl_FragColor = vec4(color, 1.0);
  }
`;

interface WateryCardMeshProps {
  colorDark: [number, number, number];
  colorMid: [number, number, number];
  colorLight: [number, number, number];
  containerRef: React.RefObject<HTMLDivElement | null>;
}

function WateryCardMesh({ colorDark, colorMid, colorLight, containerRef }: WateryCardMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const { size } = useThree();

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uResolution: { value: new THREE.Vector2(size.width, size.height) },
      uColorDark: { value: new THREE.Vector3(...colorDark) },
      uColorMid: { value: new THREE.Vector3(...colorMid) },
      uColorLight: { value: new THREE.Vector3(...colorLight) },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const targetMouse = useRef(new THREE.Vector2(0, 0));

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onMouseMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      targetMouse.current.set(x, y);
    };
    const onMouseLeave = () => {
      targetMouse.current.set(0, 0);
    };

    el.addEventListener("mousemove", onMouseMove);
    el.addEventListener("mouseleave", onMouseLeave);
    return () => {
      el.removeEventListener("mousemove", onMouseMove);
      el.removeEventListener("mouseleave", onMouseLeave);
    };
  }, [containerRef]);

  useFrame(({ clock }) => {
    uniforms.uTime.value = clock.getElapsedTime();
    uniforms.uResolution.value.set(size.width, size.height);
    uniforms.uMouse.value.lerp(targetMouse.current, 0.08);
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

interface WateryGradientCardProps {
  colorDark: [number, number, number];
  colorMid: [number, number, number];
  colorLight: [number, number, number];
  children?: React.ReactNode;
}

export default function WateryGradientCard({
  colorDark,
  colorMid,
  colorLight,
  children,
}: WateryGradientCardProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={containerRef} className="relative w-full overflow-hidden rounded-2xl" style={{ aspectRatio: "4 / 3" }}>
      <Canvas
        gl={{ antialias: true, alpha: false }}
        camera={{ position: [0, 0, 1] }}
        style={{ width: "100%", height: "100%", position: "absolute", inset: 0 }}
      >
        <WateryCardMesh
          colorDark={colorDark}
          colorMid={colorMid}
          colorLight={colorLight}
          containerRef={containerRef}
        />
      </Canvas>
      {children && (
        <div className="relative z-10 flex h-full w-full items-center justify-center">
          {children}
        </div>
      )}
    </div>
  );
}
