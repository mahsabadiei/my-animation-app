// Each stage defines where the camera and object should be at that scroll point.
// GSAP will interpolate between stages as you scroll.
// Tweak these values to change the cinematic feel!

export interface AnimValues {
  // Camera position
  camX: number;
  camY: number;
  camZ: number;
  // Object position
  objX: number;
  objY: number;
  objZ: number;
  // Object rotation (radians)
  rotX: number;
  rotY: number;
  // Object scale (uniform)
  scale: number;
}

// Starting values (what the scene looks like before any scrolling)
export const initialValues: AnimValues = {
  camX: 0,
  camY: 0,
  camZ: 8,
  objX: 0,
  objY: 0,
  objZ: 0,
  rotX: 0,
  rotY: 0,
  scale: 0.5,
};

// Each entry is a stage that GSAP will animate TO (in sequence)
export const stages: Partial<AnimValues>[] = [
  // Stage 1: Zoom in, object grows, slight rotation
  {
    camZ: 5,
    rotY: Math.PI,
    scale: 1,
  },
  // Stage 2: Camera moves right and up, object slides left (reveal text area on right)
  {
    camX: 2,
    camY: 1,
    objX: -1.5,
    rotY: Math.PI * 2,
  },
  // Stage 3: Camera orbits to the other side
  {
    camX: -2,
    camY: 0.5,
    camZ: 4,
    objX: 1.5,
    rotX: 0.5,
    rotY: Math.PI * 3,
  },
  // Stage 4: Pull back for finale, center everything
  {
    camX: 0,
    camY: 2,
    camZ: 6,
    objX: 0,
    objY: 0,
    rotX: 0,
    rotY: Math.PI * 4,
    scale: 1.5,
  },
];
