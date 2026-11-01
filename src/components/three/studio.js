// Shared Three.js studio for the Hero and Work scenes: one renderer setup, lighting rig, material set and theme
// palette, so both sculptures read as one family. No model or texture files; reflections come from a procedural room.
import {
  ACESFilmicToneMapping, DirectionalLight, HemisphereLight, MeshPhysicalMaterial, MeshStandardMaterial,
  PMREMGenerator, Scene, WebGLRenderer,
} from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

// Keeps a big 2x display from rendering 8+ megapixels a frame.
const PIXEL_BUDGET = 2.5e6;

export const THEMES = {
  dark: {
    metal: '#d8b878', deep: '#8c6833', stone: '#2b261e', glass: '#f1e4c8', exposure: 1.05, env: 0.85,
    sky: '#f4e2bf', ground: '#1a1611', hemi: 0.55, rim: '#9fb6d6', rimPower: 1.6,
    keys: ['#ffe4b5', '#f6d7a0', '#ffc98a', '#f4e8d2'],
  },
  light: {
    metal: '#b07a33', deep: '#6e4718', stone: '#d8ccb6', glass: '#fffaf0', exposure: 0.95, env: 1.0,
    sky: '#fff7e8', ground: '#cdbfa6', hemi: 0.8, rim: '#c9d4e4', rimPower: 0.9,
    keys: ['#fff1d6', '#ffe9c4', '#ffdcae', '#fff6e6'],
  },
};

// Throws when WebGL is unavailable; callers keep their static fallback.
export function createStudio(canvas, { compact = false, onLost } = {}) {
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'default' });
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = ACESFilmicToneMapping;

  const scene = new Scene();
  const pmrem = new PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  // Soft studio reflections; 64px keeps the GGX prefilter cheap on slow GPUs.
  scene.environment = pmrem.fromScene(room, 0.04, 0.1, 100, { size: 64 }).texture;
  room.dispose?.();

  const hemi = new HemisphereLight();
  const key = new DirectionalLight('#ffffff', 2.2);
  key.position.set(5, 6, 8);
  const rim = new DirectionalLight('#ffffff', 1.4);
  rim.position.set(-6, 3, -7);
  scene.add(hemi, key, rim, key.target, rim.target);

  const m = {
    metal: new MeshStandardMaterial({ metalness: 1, roughness: 0.28 }),
    satin: new MeshStandardMaterial({ metalness: 0.85, roughness: 0.45 }),
    deep: new MeshStandardMaterial({ metalness: 0.9, roughness: 0.35 }),
    stone: new MeshStandardMaterial({ metalness: 0.1, roughness: 0.85 }),
    glass: new MeshPhysicalMaterial({ metalness: 0, roughness: 0.08, transparent: true, opacity: 0.16, clearcoat: 1 }),
  };

  let palette = THEMES.dark;
  const setTheme = (name) => {
    palette = THEMES[name] || THEMES.dark;
    m.metal.color.set(palette.metal);
    m.satin.color.set(palette.metal);
    m.deep.color.set(palette.deep);
    m.stone.color.set(palette.stone);
    m.glass.color.set(palette.glass);
    hemi.color.set(palette.sky);
    hemi.groundColor.set(palette.ground);
    hemi.intensity = palette.hemi;
    rim.color.set(palette.rim);
    scene.environmentIntensity = palette.env;
    renderer.toneMappingExposure = palette.exposure;
    return palette;
  };

  // Sizes the drawing buffer to the canvas box within the pixel budget; returns the CSS size.
  const fit = () => {
    const w = canvas.clientWidth || 1;
    const h = canvas.clientHeight || 1;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, compact ? 1 : 1.5, Math.sqrt(PIXEL_BUDGET / (w * h))));
    renderer.setSize(w, h, false);
    return { w, h };
  };

  const lost = (event) => { event.preventDefault(); onLost?.(); };
  canvas.addEventListener('webglcontextlost', lost);

  return {
    renderer, scene, hemi, key, rim, m, setTheme, fit,
    palette: () => palette,
    dispose() {
      canvas.removeEventListener('webglcontextlost', lost);
      scene.traverse((o) => { o.geometry?.dispose(); });
      Object.values(m).forEach((material) => material.dispose());
      scene.environment?.dispose();
      pmrem.dispose();
      renderer.dispose();
    },
  };
}
