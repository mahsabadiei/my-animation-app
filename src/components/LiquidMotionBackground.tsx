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

  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;

    for (int i = 0; i < 5; i++) {
      value += amplitude * snoise(p);
      p = p * 2.02 + vec2(17.13, 9.71);
      amplitude *= 0.52;
    }

    return value;
  }

  float blob(vec2 uv, vec2 center, float radius) {
    float d = length(uv - center) / radius;
    return exp(-d * d * 2.0);
  }

  void main() {
    vec2 uv = vUv;
    float aspect = uResolution.x / uResolution.y;
    vec2 st = uv;
    st.x *= aspect;

    float t = uTime * 0.22;
    vec2 mouseUv = uMouse * 0.5 + 0.5;
    vec2 mouseSt = vec2(mouseUv.x * aspect, mouseUv.y);
    vec2 toMouse = mouseSt - st;
    float mouseDist = length(toMouse);
    float mouseField = exp(-mouseDist * mouseDist * 5.5);

    vec2 drift = vec2(
      fbm(st * 1.2 + vec2(0.0, t * 0.55)),
      fbm(st * 1.2 + vec2(8.4, -t * 0.45))
    );
    vec2 curl = vec2(
      fbm(st * 2.6 + drift * 0.8 + vec2(t * 0.28, -t * 0.12)),
      fbm(st.yx * 2.3 - drift * 0.6 + vec2(-t * 0.18, t * 0.24))
    );

    vec2 mouseOffset = normalize(toMouse + vec2(0.0001)) * mouseField * 0.22;
    vec2 warped = st + drift * 0.18 + curl * 0.12 + mouseOffset;
    vec2 detail = warped + vec2(
      fbm(warped * 3.1 + vec2(t * 0.35, 0.0)),
      fbm(warped * 3.1 + vec2(4.6, -t * 0.3))
    ) * 0.05;

    vec3 light_blue  = vec3(0.749, 0.820, 1.0);    // #bfd1ff
    vec3 muted_indigo = vec3(0.541, 0.580, 0.831);  // #8a94d4
    vec3 light_grey  = vec3(0.890, 0.890, 0.890);   // #e3e3e3
    vec3 cool_grey   = vec3(0.420, 0.447, 0.498);   // #6b7280
    vec3 deep_purple = vec3(0.263, 0.243, 0.435);   // #433e6f
    vec3 soft_mauve  = vec3(0.835, 0.749, 0.875);   // #d5bfdf
    vec3 warm_white  = vec3(0.965, 0.957, 0.941);   // #f6f4f0
    vec3 dusty_plum  = vec3(0.663, 0.553, 0.714);   // #a98db6
    vec3 off_white   = vec3(0.976, 0.980, 0.984);   // #f9fafb
    vec3 soft_beige  = vec3(0.918, 0.914, 0.902);   // #eae9e6
    vec3 pure_white  = vec3(1.0, 1.0, 1.0);         // #ffffff

    vec2 c1 = vec2(0.18 * aspect, 0.18) + vec2(
      fbm(vec2(t * 0.6, 1.4)) * 0.16,
      fbm(vec2(2.8, t * 0.45)) * 0.14
    ) + mouseOffset * 0.8;
    vec2 c2 = vec2(0.54 * aspect, 0.42) + vec2(
      fbm(vec2(t * 0.42, 5.1)) * 0.14,
      fbm(vec2(7.3, t * 0.36)) * 0.12
    ) + mouseOffset * 0.55;
    vec2 c3 = vec2(0.78 * aspect, 0.78) + vec2(
      fbm(vec2(t * 0.28, 10.4)) * 0.12,
      fbm(vec2(12.2, t * 0.32)) * 0.12
    ) + mouseOffset * 0.35;
    vec2 c4 = vec2(0.82 * aspect, 0.26) + vec2(
      fbm(vec2(t * 0.38, 16.8)) * 0.13,
      fbm(vec2(18.9, t * 0.41)) * 0.15
    ) + mouseOffset * 0.4;
    vec2 c5 = vec2(0.33 * aspect, 0.72) + vec2(
      fbm(vec2(t * 0.31, 23.1)) * 0.15,
      fbm(vec2(24.9, t * 0.3)) * 0.14
    ) + mouseOffset * 0.45;
    vec2 c6 = vec2(0.58 * aspect, 0.88) + vec2(
      fbm(vec2(t * 0.22, 29.5)) * 0.10,
      fbm(vec2(31.4, t * 0.25)) * 0.09
    );
    vec2 c7 = vec2(0.08 * aspect, 0.62) + vec2(
      fbm(vec2(t * 0.27, 35.7)) * 0.16,
      fbm(vec2(37.0, t * 0.33)) * 0.16
    ) + mouseOffset * 0.7;

    float b1 = blob(detail, c1, 0.62);
    float b2 = blob(detail, c2, 0.56);
    float b3 = blob(detail, c3, 0.44);
    float b4 = blob(detail, c4, 0.40);
    float b5 = blob(detail, c5, 0.46);
    float b6 = blob(detail, c6, 0.34);
    float b7 = blob(detail, c7, 0.52);

    vec3 color = deep_purple;
    color = mix(color, muted_indigo, b1);
    color = mix(color, light_blue, b2 * 0.92);
    color = mix(color, soft_mauve, b3 * 0.78);
    color = mix(color, warm_white, b4 * 0.62);
    color = mix(color, dusty_plum, b5 * 0.64);
    color = mix(color, off_white, b6 * 0.38);
    color = mix(color, cool_grey, b7 * 0.3);
    color = mix(color, light_grey, b2 * b5 * 0.28);
    color = mix(color, soft_beige, b4 * b6 * 0.24);

    float foldField = fbm(detail * 3.2 + vec2(t * 0.24, -t * 0.18));
    float foldField2 = fbm(detail * 4.7 - vec2(t * 0.3, t * 0.12));
    float ribbons = sin((detail.x * 3.6 - detail.y * 1.8 + foldField * 2.2) * 3.4 - t * 2.1);
    ribbons = smoothstep(0.35, 0.92, ribbons * 0.5 + 0.5);

    float folds = 1.0 - abs(foldField2);
    folds = smoothstep(0.62, 0.94, folds);

    float shimmer = smoothstep(0.55, 0.95, fbm(detail * 6.6 + vec2(-t * 0.42, t * 0.28)) * 0.5 + 0.5);
    float highlight = max(ribbons * 0.8, folds * 0.7) * (0.55 + shimmer * 0.45);
    float cursorGlow = mouseField * (0.16 + shimmer * 0.12);

    color = mix(color, light_blue, highlight * 0.18);
    color = mix(color, pure_white, highlight * 0.12 + cursorGlow * 0.45);
    color += vec3(0.04, 0.06, 0.09) * shimmer;

    float grain = snoise(uv * 640.0 + uTime * 2.8) * 0.5 + 0.5;
    color *= mix(0.965, 1.045, grain);

    float vignette = smoothstep(1.4, 0.25, length((uv - 0.5) * vec2(aspect, 1.0)));
    color = mix(deep_purple * 0.88, color, vignette);

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

export default function LiquidMotionBackground() {
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
