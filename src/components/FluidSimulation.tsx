"use client";

import { useEffect, useRef, useCallback } from "react";

// ─── WebGL helpers ───────────────────────────────────────────────

function compileShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createProgram(gl: WebGLRenderingContext, vs: string, fs: string) {
  const prog = gl.createProgram()!;
  const v = compileShader(gl, gl.VERTEX_SHADER, vs)!;
  const f = compileShader(gl, gl.FRAGMENT_SHADER, fs)!;
  gl.attachShader(prog, v);
  gl.attachShader(prog, f);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(prog));
    return null;
  }
  return prog;
}

interface FBO {
  texture: WebGLTexture;
  framebuffer: WebGLFramebuffer;
  texelSizeX: number;
  texelSizeY: number;
}

interface DoubleFBO {
  read: FBO;
  write: FBO;
  swap: () => void;
}

function createFBO(
  gl: WebGLRenderingContext,
  ext: { halfFloat: number; formatRGBA: { internalFormat: number; format: number } },
  w: number,
  h: number,
): FBO {
  const tex = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(
    gl.TEXTURE_2D, 0,
    ext.formatRGBA.internalFormat,
    w, h, 0,
    ext.formatRGBA.format,
    ext.halfFloat,
    null,
  );
  const fb = gl.createFramebuffer()!;
  gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
  gl.viewport(0, 0, w, h);
  gl.clear(gl.COLOR_BUFFER_BIT);
  return { texture: tex, framebuffer: fb, texelSizeX: 1 / w, texelSizeY: 1 / h };
}

function createDoubleFBO(
  gl: WebGLRenderingContext,
  ext: { halfFloat: number; formatRGBA: { internalFormat: number; format: number } },
  w: number,
  h: number,
): DoubleFBO {
  let fbo1 = createFBO(gl, ext, w, h);
  let fbo2 = createFBO(gl, ext, w, h);
  return {
    get read() { return fbo1; },
    get write() { return fbo2; },
    swap() { const t = fbo1; fbo1 = fbo2; fbo2 = t; },
  };
}

// ─── Shaders ─────────────────────────────────────────────────────

const baseVS = `
  attribute vec2 aPosition;
  varying vec2 vUv;
  varying vec2 vL;
  varying vec2 vR;
  varying vec2 vT;
  varying vec2 vB;
  uniform vec2 texelSize;
  void main () {
    vUv = aPosition * 0.5 + 0.5;
    vL = vUv - vec2(texelSize.x, 0.0);
    vR = vUv + vec2(texelSize.x, 0.0);
    vT = vUv + vec2(0.0, texelSize.y);
    vB = vUv - vec2(0.0, texelSize.y);
    gl_Position = vec4(aPosition, 0.0, 1.0);
  }
`;

const splatFS = `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uTarget;
  uniform float aspectRatio;
  uniform vec3 color;
  uniform vec2 point;
  uniform float radius;
  void main () {
    vec2 p = vUv - point;
    p.x *= aspectRatio;
    vec3 splat = exp(-dot(p, p) / radius) * color;
    vec3 base = texture2D(uTarget, vUv).xyz;
    gl_FragColor = vec4(base + splat, 1.0);
  }
`;

const advectionFS = `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uVelocity;
  uniform sampler2D uSource;
  uniform vec2 texelSize;
  uniform float dt;
  uniform float dissipation;
  void main () {
    vec2 coord = vUv - dt * texture2D(uVelocity, vUv).xy * texelSize;
    vec3 result = texture2D(uSource, coord).xyz;
    gl_FragColor = vec4(result * dissipation, 1.0);
  }
`;

const divergenceFS = `
  precision highp float;
  varying vec2 vUv;
  varying vec2 vL;
  varying vec2 vR;
  varying vec2 vT;
  varying vec2 vB;
  uniform sampler2D uVelocity;
  void main () {
    float L = texture2D(uVelocity, vL).x;
    float R = texture2D(uVelocity, vR).x;
    float T = texture2D(uVelocity, vT).y;
    float B = texture2D(uVelocity, vB).y;
    float div = 0.5 * (R - L + T - B);
    gl_FragColor = vec4(div, 0.0, 0.0, 1.0);
  }
`;

const curlFS = `
  precision highp float;
  varying vec2 vUv;
  varying vec2 vL;
  varying vec2 vR;
  varying vec2 vT;
  varying vec2 vB;
  uniform sampler2D uVelocity;
  void main () {
    float L = texture2D(uVelocity, vL).y;
    float R = texture2D(uVelocity, vR).y;
    float T = texture2D(uVelocity, vT).x;
    float B = texture2D(uVelocity, vB).x;
    float vorticity = R - L - T + B;
    gl_FragColor = vec4(0.5 * vorticity, 0.0, 0.0, 1.0);
  }
`;

const vorticityFS = `
  precision highp float;
  varying vec2 vUv;
  varying vec2 vL;
  varying vec2 vR;
  varying vec2 vT;
  varying vec2 vB;
  uniform sampler2D uVelocity;
  uniform sampler2D uCurl;
  uniform float curl;
  uniform float dt;
  void main () {
    float L = texture2D(uCurl, vL).x;
    float R = texture2D(uCurl, vR).x;
    float T = texture2D(uCurl, vT).x;
    float B = texture2D(uCurl, vB).x;
    float C = texture2D(uCurl, vUv).x;
    vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
    force /= length(force) + 0.0001;
    force *= curl * C;
    force.y *= -1.0;
    vec2 vel = texture2D(uVelocity, vUv).xy;
    gl_FragColor = vec4(vel + force * dt, 0.0, 1.0);
  }
`;

const pressureFS = `
  precision highp float;
  varying vec2 vUv;
  varying vec2 vL;
  varying vec2 vR;
  varying vec2 vT;
  varying vec2 vB;
  uniform sampler2D uPressure;
  uniform sampler2D uDivergence;
  void main () {
    float L = texture2D(uPressure, vL).x;
    float R = texture2D(uPressure, vR).x;
    float T = texture2D(uPressure, vT).x;
    float B = texture2D(uPressure, vB).x;
    float divergence = texture2D(uDivergence, vUv).x;
    float pressure = (L + R + B + T - divergence) * 0.25;
    gl_FragColor = vec4(pressure, 0.0, 0.0, 1.0);
  }
`;

const gradientSubtractFS = `
  precision highp float;
  varying vec2 vUv;
  varying vec2 vL;
  varying vec2 vR;
  varying vec2 vT;
  varying vec2 vB;
  uniform sampler2D uPressure;
  uniform sampler2D uVelocity;
  void main () {
    float L = texture2D(uPressure, vL).x;
    float R = texture2D(uPressure, vR).x;
    float T = texture2D(uPressure, vT).x;
    float B = texture2D(uPressure, vB).x;
    vec2 vel = texture2D(uVelocity, vUv).xy;
    vel.xy -= vec2(R - L, T - B);
    gl_FragColor = vec4(vel, 0.0, 1.0);
  }
`;

const displayFS = `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uTexture;
  uniform vec3 uBackColor;
  void main () {
    vec3 c = texture2D(uTexture, vUv).rgb;
    // Add back color where fluid is absent
    float a = max(c.r, max(c.g, c.b));
    c = mix(uBackColor, c, clamp(a * 3.0, 0.0, 1.0));
    gl_FragColor = vec4(c, 1.0);
  }
`;

const clearFS = `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uTexture;
  uniform float value;
  void main () {
    gl_FragColor = value * texture2D(uTexture, vUv);
  }
`;

// ─── Config ──────────────────────────────────────────────────────

interface FluidConfig {
  simResolution: number;
  dyeResolution: number;
  densityDissipation: number;
  velocityDissipation: number;
  pressure: number;
  pressureIterations: number;
  curl: number;
  splatRadius: number;
  splatForce: number;
  backColor: { r: number; g: number; b: number };
  colorPalette: Array<{ r: number; g: number; b: number }>;
}

interface FluidSimulationProps {
  config?: Partial<FluidConfig>;
}

const defaultConfig: FluidConfig = {
  simResolution: 128,
  dyeResolution: 1024,
  densityDissipation: 0.97,
  velocityDissipation: 0.98,
  pressure: 0.8,
  pressureIterations: 20,
  curl: 30,
  splatRadius: 0.25,
  splatForce: 6000,
  backColor: { r: 0.12, g: 0.05, b: 0.02 },
  colorPalette: [
    { r: 0.8, g: 0.3, b: 0.05 },   // warm orange
    { r: 0.9, g: 0.6, b: 0.1 },    // golden
    { r: 0.6, g: 0.15, b: 0.05 },  // deep red-brown
    { r: 1.0, g: 0.85, b: 0.3 },   // yellow
    { r: 0.7, g: 0.5, b: 0.7 },    // lavender
    { r: 1.0, g: 0.45, b: 0.1 },   // bright orange
  ],
};

// ─── Component ───────────────────────────────────────────────────

export default function FluidSimulation({ config: userConfig }: FluidSimulationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const configRef = useRef<FluidConfig>({ ...defaultConfig, ...userConfig });
  const colorIndexRef = useRef(0);

  const getNextColor = useCallback(() => {
    const palette = configRef.current.colorPalette;
    const c = palette[colorIndexRef.current % palette.length];
    colorIndexRef.current++;
    return c;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const cfg = configRef.current;

    // Get WebGL context
    const params: WebGLContextAttributes = {
      alpha: false,
      depth: false,
      stencil: false,
      antialias: false,
      preserveDrawingBuffer: false,
    };
    const gl = (canvas.getContext("webgl", params) || canvas.getContext("experimental-webgl", params)) as WebGLRenderingContext;
    if (!gl) return;

    // Extensions
    const halfFloatExt = gl.getExtension("OES_texture_half_float");
    gl.getExtension("OES_texture_half_float_linear");
    const halfFloat = halfFloatExt ? halfFloatExt.HALF_FLOAT_OES : gl.UNSIGNED_BYTE;

    const ext = {
      halfFloat,
      formatRGBA: { internalFormat: gl.RGBA, format: gl.RGBA },
    };

    // Resize canvas
    function resizeCanvas() {
      canvas!.width = canvas!.clientWidth;
      canvas!.height = canvas!.clientHeight;
    }
    resizeCanvas();

    // Full-screen quad
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), gl.STATIC_DRAW);

    // Compile programs
    const splatProg = createProgram(gl, baseVS, splatFS)!;
    const advectionProg = createProgram(gl, baseVS, advectionFS)!;
    const divergenceProg = createProgram(gl, baseVS, divergenceFS)!;
    const curlProg = createProgram(gl, baseVS, curlFS)!;
    const vorticityProg = createProgram(gl, baseVS, vorticityFS)!;
    const pressureProg = createProgram(gl, baseVS, pressureFS)!;
    const gradSubProg = createProgram(gl, baseVS, gradientSubtractFS)!;
    const displayProg = createProgram(gl, baseVS, displayFS)!;
    const clearProg = createProgram(gl, baseVS, clearFS)!;

    // Create FBOs
    const simW = cfg.simResolution;
    const simH = cfg.simResolution;
    const dyeW = cfg.dyeResolution;
    const dyeH = Math.round(cfg.dyeResolution * (canvas.height / canvas.width));

    let velocity = createDoubleFBO(gl, ext, simW, simH);
    let dye = createDoubleFBO(gl, ext, dyeW, dyeH);
    let divergenceFBO = createFBO(gl, ext, simW, simH);
    let curlFBO = createFBO(gl, ext, simW, simH);
    let pressure = createDoubleFBO(gl, ext, simW, simH);

    // Helper to bind program, set attribs, uniforms
    function blit(target: WebGLFramebuffer | null, w?: number, h?: number) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, target);
      if (w && h) gl.viewport(0, 0, w, h);
      else gl.viewport(0, 0, canvas!.width, canvas!.height);
      gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
    }

    function useProg(prog: WebGLProgram) {
      gl.useProgram(prog);
      const posLoc = gl.getAttribLocation(prog, "aPosition");
      gl.enableVertexAttribArray(posLoc);
      gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);
    }

    function setUni1f(prog: WebGLProgram, name: string, v: number) {
      gl.uniform1f(gl.getUniformLocation(prog, name), v);
    }
    function setUni2f(prog: WebGLProgram, name: string, x: number, y: number) {
      gl.uniform2f(gl.getUniformLocation(prog, name), x, y);
    }
    function setUni3f(prog: WebGLProgram, name: string, x: number, y: number, z: number) {
      gl.uniform3f(gl.getUniformLocation(prog, name), x, y, z);
    }
    function setUni1i(prog: WebGLProgram, name: string, v: number) {
      gl.uniform1i(gl.getUniformLocation(prog, name), v);
    }

    function bindTex(unit: number, tex: WebGLTexture) {
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, tex);
    }

    // Splat function
    function splat(x: number, y: number, dx: number, dy: number, color: { r: number; g: number; b: number }) {
      // Splat velocity
      useProg(splatProg);
      bindTex(0, velocity.read.texture);
      setUni1i(splatProg, "uTarget", 0);
      setUni1f(splatProg, "aspectRatio", canvas!.width / canvas!.height);
      setUni2f(splatProg, "point", x, y);
      setUni3f(splatProg, "color", dx, dy, 0);
      setUni1f(splatProg, "radius", correctRadius(cfg.splatRadius / 100));
      setUni2f(splatProg, "texelSize", velocity.read.texelSizeX, velocity.read.texelSizeY);
      blit(velocity.write.framebuffer, simW, simH);
      velocity.swap();

      // Splat dye
      bindTex(0, dye.read.texture);
      setUni1i(splatProg, "uTarget", 0);
      setUni3f(splatProg, "color", color.r * 0.3, color.g * 0.3, color.b * 0.3);
      setUni2f(splatProg, "texelSize", dye.read.texelSizeX, dye.read.texelSizeY);
      blit(dye.write.framebuffer, dyeW, dyeH);
      dye.swap();
    }

    function correctRadius(r: number) {
      const aspectRatio = canvas!.width / canvas!.height;
      if (aspectRatio > 1) r *= aspectRatio;
      return r;
    }

    // Simulation step
    function step(dt: number) {
      // Curl
      useProg(curlProg);
      bindTex(0, velocity.read.texture);
      setUni1i(curlProg, "uVelocity", 0);
      setUni2f(curlProg, "texelSize", velocity.read.texelSizeX, velocity.read.texelSizeY);
      blit(curlFBO.framebuffer, simW, simH);

      // Vorticity
      useProg(vorticityProg);
      bindTex(0, velocity.read.texture);
      bindTex(1, curlFBO.texture);
      setUni1i(vorticityProg, "uVelocity", 0);
      setUni1i(vorticityProg, "uCurl", 1);
      setUni1f(vorticityProg, "curl", cfg.curl);
      setUni1f(vorticityProg, "dt", dt);
      setUni2f(vorticityProg, "texelSize", velocity.read.texelSizeX, velocity.read.texelSizeY);
      blit(velocity.write.framebuffer, simW, simH);
      velocity.swap();

      // Divergence
      useProg(divergenceProg);
      bindTex(0, velocity.read.texture);
      setUni1i(divergenceProg, "uVelocity", 0);
      setUni2f(divergenceProg, "texelSize", velocity.read.texelSizeX, velocity.read.texelSizeY);
      blit(divergenceFBO.framebuffer, simW, simH);

      // Clear pressure
      useProg(clearProg);
      bindTex(0, pressure.read.texture);
      setUni1i(clearProg, "uTexture", 0);
      setUni1f(clearProg, "value", cfg.pressure);
      setUni2f(clearProg, "texelSize", pressure.read.texelSizeX, pressure.read.texelSizeY);
      blit(pressure.write.framebuffer, simW, simH);
      pressure.swap();

      // Pressure solve
      useProg(pressureProg);
      setUni1i(pressureProg, "uDivergence", 1);
      bindTex(1, divergenceFBO.texture);
      for (let i = 0; i < cfg.pressureIterations; i++) {
        bindTex(0, pressure.read.texture);
        setUni1i(pressureProg, "uPressure", 0);
        setUni2f(pressureProg, "texelSize", pressure.read.texelSizeX, pressure.read.texelSizeY);
        blit(pressure.write.framebuffer, simW, simH);
        pressure.swap();
      }

      // Gradient subtract
      useProg(gradSubProg);
      bindTex(0, pressure.read.texture);
      bindTex(1, velocity.read.texture);
      setUni1i(gradSubProg, "uPressure", 0);
      setUni1i(gradSubProg, "uVelocity", 1);
      setUni2f(gradSubProg, "texelSize", velocity.read.texelSizeX, velocity.read.texelSizeY);
      blit(velocity.write.framebuffer, simW, simH);
      velocity.swap();

      // Advect velocity
      useProg(advectionProg);
      bindTex(0, velocity.read.texture);
      bindTex(1, velocity.read.texture);
      setUni1i(advectionProg, "uVelocity", 0);
      setUni1i(advectionProg, "uSource", 1);
      setUni1f(advectionProg, "dt", dt);
      setUni1f(advectionProg, "dissipation", cfg.velocityDissipation);
      setUni2f(advectionProg, "texelSize", velocity.read.texelSizeX, velocity.read.texelSizeY);
      blit(velocity.write.framebuffer, simW, simH);
      velocity.swap();

      // Advect dye
      bindTex(0, velocity.read.texture);
      bindTex(1, dye.read.texture);
      setUni1i(advectionProg, "uVelocity", 0);
      setUni1i(advectionProg, "uSource", 1);
      setUni1f(advectionProg, "dissipation", cfg.densityDissipation);
      setUni2f(advectionProg, "texelSize", dye.read.texelSizeX, dye.read.texelSizeY);
      blit(dye.write.framebuffer, dyeW, dyeH);
      dye.swap();
    }

    // Display
    function render() {
      useProg(displayProg);
      bindTex(0, dye.read.texture);
      setUni1i(displayProg, "uTexture", 0);
      setUni3f(displayProg, "uBackColor", cfg.backColor.r, cfg.backColor.g, cfg.backColor.b);
      setUni2f(displayProg, "texelSize", 1 / canvas!.width, 1 / canvas!.height);
      blit(null);
    }

    // Mouse/touch tracking
    let pointer = {
      x: 0, y: 0, prevX: 0, prevY: 0,
      dx: 0, dy: 0, moved: false, down: false,
      color: getNextColor(),
    };
    let lastColorTime = Date.now();

    function updatePointerMove(x: number, y: number) {
      pointer.prevX = pointer.x;
      pointer.prevY = pointer.y;
      pointer.x = x / canvas!.width;
      pointer.y = 1.0 - y / canvas!.height;
      pointer.dx = (pointer.x - pointer.prevX) * 5000;
      pointer.dy = (pointer.y - pointer.prevY) * 5000;
      pointer.moved = Math.abs(pointer.dx) > 0 || Math.abs(pointer.dy) > 0;
    }

    function onMouseMove(e: MouseEvent) {
      const rect = canvas!.getBoundingClientRect();
      updatePointerMove(e.clientX - rect.left, e.clientY - rect.top);
    }
    function onTouchMove(e: TouchEvent) {
      e.preventDefault();
      const t = e.touches[0];
      const rect = canvas!.getBoundingClientRect();
      updatePointerMove(t.clientX - rect.left, t.clientY - rect.top);
    }
    function onMouseDown() { pointer.down = true; pointer.color = getNextColor(); }
    function onMouseUp() { pointer.down = false; }

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mouseup", onMouseUp);

    // Initial splats for ambient color
    function randomSplats() {
      for (let i = 0; i < 5; i++) {
        const color = getNextColor();
        const x = Math.random();
        const y = Math.random();
        const dx = (Math.random() - 0.5) * 1000;
        const dy = (Math.random() - 0.5) * 1000;
        splat(x, y, dx, dy, color);
      }
    }
    randomSplats();

    // Animation loop
    let lastTime = Date.now();

    function loop() {
      const now = Date.now();
      let dt = (now - lastTime) / 1000;
      dt = Math.min(dt, 0.016667);
      lastTime = now;

      // Resize check
      if (canvas!.width !== canvas!.clientWidth || canvas!.height !== canvas!.clientHeight) {
        resizeCanvas();
      }

      // Update color periodically
      if (now - lastColorTime > 2000) {
        pointer.color = getNextColor();
        lastColorTime = now;
      }

      // Splat from pointer
      if (pointer.moved) {
        pointer.moved = false;
        splat(pointer.x, pointer.y, pointer.dx, pointer.dy, pointer.color);
      }

      step(dt);
      render();
      rafRef.current = requestAnimationFrame(loop);
    }

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [getNextColor]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
      }}
    />
  );
}
