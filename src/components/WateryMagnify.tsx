"use client";

import { useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

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

  // Simplex 2D noise
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

  // Wavy height field — layered sine waves distorted by noise
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

  // Compute surface normal from height via central differences
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

    // Mouse in UV space
    vec2 mouseUV = uMouse * 0.5 + 0.5;
    vec2 mouseST = vec2(mouseUV.x * aspect, mouseUV.y);

    // --- Magnifier effect ---
    // Pull coordinates toward the cursor = zoom into that area
    vec2 toMouse = st - mouseST;
    float mouseDist = length(toMouse);

    // Magnifier radius and zoom strength
    float radius = 0.15;
    float zoom = 3.5; // how much to magnify (>1 = zoom in)

    // Smooth falloff from center to edge of magnifier
    float mag = smoothstep(radius, 0.0, mouseDist);

    // Inside the magnifier, remap coordinates closer to mouse center
    // This effectively zooms into the wave pattern around the cursor
    vec2 magnifiedST = mouseST + toMouse / mix(1.0, zoom, mag);

    // Slight barrel distortion at magnifier edge for a lens feel
    float barrel = 1.0 + mag * 0.08 * mouseDist * mouseDist / (radius * radius);
    magnifiedST = mouseST + (magnifiedST - mouseST) * barrel;

    float t = uTime;

    // Get wave height and surface normal using magnified coordinates
    float h = waveHeight(magnifiedST, t);
    vec3 N = calcNormal(magnifiedST, t, 0.004);

    // Lighting
    vec3 lightDir = normalize(vec3(0.4, 0.5, 0.8));
    vec3 viewDir = vec3(0.0, 0.0, 1.0);
    vec3 halfVec = normalize(lightDir + viewDir);

    float diffuse = max(dot(N, lightDir), 0.0);
    diffuse = diffuse * 0.55 + 0.45;

    float spec = pow(max(dot(N, halfVec), 0.0), 50.0);
    float spec2 = pow(max(dot(N, halfVec), 0.0), 10.0);

    // Color palette from gradient-bg-2
    vec3 cPeriwinkle = vec3(0.749, 0.820, 1.0);
    vec3 cSlate      = vec3(0.541, 0.580, 0.831);
    vec3 cDeepPurple = vec3(0.263, 0.243, 0.435);
    vec3 cMauve      = vec3(0.835, 0.749, 0.875);
    vec3 cOffWhite   = vec3(0.965, 0.957, 0.941);
    vec3 cDustyPurp  = vec3(0.663, 0.553, 0.714);
    vec3 cSilver     = vec3(0.890, 0.890, 0.890);
    vec3 cSnow       = vec3(0.976, 0.980, 0.984);

    float hNorm = clamp(h * 0.5 + 0.5, 0.0, 1.0);

    vec3 baseColor = mix(cDeepPurple, cSlate, smoothstep(0.1, 0.5, hNorm));
    baseColor = mix(baseColor, cPeriwinkle, smoothstep(0.4, 0.75, hNorm));
    baseColor = mix(baseColor, cMauve, smoothstep(0.7, 0.95, hNorm) * 0.45);

    float h2 = waveHeight(magnifiedST + vec2(2.0, 1.5), t * 0.7);
    float h2Norm = clamp(h2 * 0.5 + 0.5, 0.0, 1.0);
    baseColor = mix(baseColor, cDustyPurp, smoothstep(0.25, 0.55, h2Norm) * smoothstep(0.55, 0.25, hNorm) * 0.5);

    vec3 color = baseColor * diffuse;

    vec3 specColor = mix(cSilver, cSnow, 0.6);
    color += specColor * spec * 0.6;
    color += cOffWhite * spec2 * 0.18;

    float rim = 1.0 - max(dot(N, viewDir), 0.0);
    rim = pow(rim, 3.0);
    color += cPeriwinkle * rim * 0.15;

    float ao = smoothstep(0.0, 0.35, hNorm);
    color *= mix(0.65, 1.0, ao);

    // Brighten slightly inside the magnifier — like light focusing through a lens
    color *= mix(1.0, 1.15, mag * 0.5);


    // Subtle grain
    float grain = snoise(uv * 500.0 + t * 2.0) * 0.5 + 0.5;
    color *= mix(0.98, 1.02, grain);

    gl_FragColor = vec4(color, 1.0);
  }
`;

function MagnifyMesh() {
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

  const targetMouse = useRef(new THREE.Vector2(0, 0));

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
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
    targetMouse.current.copy(globalMouse);
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

export default function WateryMagnify() {
  return (
    <div className="fixed inset-0 w-full h-full">
      <Canvas
        gl={{ antialias: true, alpha: false }}
        camera={{ position: [0, 0, 1] }}
        style={{ width: "100%", height: "100%" }}
      >
        <MagnifyMesh />
      </Canvas>
    </div>
  );
}
