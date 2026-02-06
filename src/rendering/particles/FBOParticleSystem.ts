import * as THREE from 'three';

/**
 * CPU-simulated particle orb system.
 * expo-gl does NOT support EXT_color_buffer_float, so we run curl noise
 * on the CPU and update buffer attributes.
 *
 * Perf: simulation runs every 3rd frame. Rotation + twinkle run every frame.
 */

const PARTICLE_COUNT = 3000;

export interface FBOParticleParams {
  color: THREE.Color;
  speed: number;
  turbulence: number;
  particleSize: number;
  pulseIntensity: number;
}

// ── Fast hash noise (cheaper than simplex) ────────────────────────────
function fract(x: number) { return x - Math.floor(x); }

function hash(x: number, y: number): number {
  let h = x * 127.1 + y * 311.7;
  h = Math.sin(h) * 43758.5453123;
  return h - Math.floor(h);
}

function noise2d(x: number, y: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  // smoothstep
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);

  const a = hash(ix, iy);
  const b = hash(ix + 1, iy);
  const c = hash(ix, iy + 1);
  const d = hash(ix + 1, iy + 1);

  return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
}

// ── Curl noise ────────────────────────────────────────────────────────
function curlNoise(px: number, py: number, pz: number, t: number): [number, number, number] {
  const eps = 0.5;
  const eps2 = 1.0;

  const x = px + t;
  const y = py + t;
  const z = pz + t;

  const n1y = noise2d(x, y + eps);
  const n2y = noise2d(x, y - eps);
  const n1z = noise2d(x, z + eps);
  const n2z = noise2d(x, z - eps);
  const cx = (n1y - n2y - n1z + n2z) / eps2;

  const n3z = noise2d(y, z + eps);
  const n4z = noise2d(y, z - eps);
  const n3x = noise2d(x + eps, z);
  const n4x = noise2d(x - eps, z);
  const cy = (n3z - n4z - n3x + n4x) / eps2;

  const n5x = noise2d(x + eps, y);
  const n6x = noise2d(x - eps, y);
  const n5y = noise2d(y + eps, z);
  const n6y = noise2d(y - eps, z);
  const cz = (n5x - n6x - n5y + n6y) / eps2;

  return [cx, cy, cz];
}

// ── Particle System ───────────────────────────────────────────────────

export class FBOParticleSystem {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderMaterial: THREE.ShaderMaterial;
  private particles: THREE.Points;
  private positionAttr: THREE.BufferAttribute;

  private positions: Float32Array;
  private origins: Float32Array;
  private frameCount = 0;

  // Lerp targets
  private targetColor: THREE.Color;
  private currentColor: THREE.Color;
  private targetSpeed = 0.3;
  private currentSpeed = 0.3;
  private targetTurbulence = 0.1;
  private currentTurbulence = 0.1;

  constructor(
    private renderer: THREE.WebGLRenderer,
    params: FBOParticleParams,
  ) {
    this.targetColor = params.color.clone();
    this.currentColor = params.color.clone();
    this.targetSpeed = params.speed;
    this.currentSpeed = params.speed;
    this.targetTurbulence = params.turbulence;
    this.currentTurbulence = params.turbulence;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    this.camera.position.z = 5.5;

    // Initialise particles in a spherical shell
    this.positions = new Float32Array(PARTICLE_COUNT * 3);
    this.origins = new Float32Array(PARTICLE_COUNT * 3);
    const sizes = new Float32Array(PARTICLE_COUNT);
    const randoms = new Float32Array(PARTICLE_COUNT);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      // Bias towards the shell surface for a hollow-sphere look
      const r = 1.0 + Math.pow(Math.random(), 0.6) * 0.7;
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);
      this.positions[i * 3] = x;
      this.positions[i * 3 + 1] = y;
      this.positions[i * 3 + 2] = z;
      this.origins[i * 3] = x;
      this.origins[i * 3 + 1] = y;
      this.origins[i * 3 + 2] = z;
      sizes[i] = 0.5 + Math.random() * 1.5; // varied sizes
      randoms[i] = Math.random(); // for twinkle offset
    }

    const geometry = new THREE.BufferGeometry();
    this.positionAttr = new THREE.BufferAttribute(this.positions, 3);
    this.positionAttr.setUsage(THREE.DynamicDrawUsage);
    geometry.setAttribute('position', this.positionAttr);
    geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('aRandom', new THREE.BufferAttribute(randoms, 1));

    this.renderMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: params.color },
        uTime: { value: 0 },
      },
      vertexShader: /* glsl */ `
        attribute float aSize;
        attribute float aRandom;
        uniform float uTime;
        varying float vDist;
        varying float vTwinkle;

        void main() {
          vDist = length(position);

          // Twinkle: each particle fades in/out at its own rate
          float phase = aRandom * 6.2831 + uTime * (1.0 + aRandom * 2.0);
          vTwinkle = 0.4 + 0.6 * (0.5 + 0.5 * sin(phase));

          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mvPosition;
          float size = aSize * (40.0 / -mvPosition.z);
          gl_PointSize = max(1.0, min(size, 6.0));
        }
      `,
      fragmentShader: /* glsl */ `
        precision highp float;
        uniform vec3 uColor;
        uniform float uTime;
        varying float vDist;
        varying float vTwinkle;

        void main() {
          vec2 c = gl_PointCoord - vec2(0.5);
          float d = length(c);
          if (d > 0.5) discard;

          float edge = smoothstep(0.5, 0.1, d);

          // Depth: dimmer further from center
          float depth = 1.0 - smoothstep(0.5, 2.0, vDist);
          depth = depth * 0.6 + 0.4;

          // Hot core
          float core = smoothstep(0.3, 0.0, d) * 0.3;

          vec3 color = uColor * depth + vec3(1.0) * core;

          float alpha = edge * vTwinkle * 0.55;
          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    this.particles = new THREE.Points(geometry, this.renderMaterial);
    this.particles.frustumCulled = false;
    this.scene.add(this.particles);
  }

  setParams(params: Partial<FBOParticleParams>): void {
    if (params.color) this.targetColor.copy(params.color);
    if (params.speed !== undefined) this.targetSpeed = params.speed;
    if (params.turbulence !== undefined) this.targetTurbulence = params.turbulence;
  }

  update(time: number): void {
    this.frameCount++;

    // Lerp params
    const lf = 0.04;
    this.currentColor.lerp(this.targetColor, lf);
    this.currentSpeed += (this.targetSpeed - this.currentSpeed) * lf;
    this.currentTurbulence += (this.targetTurbulence - this.currentTurbulence) * lf;

    // Only run curl noise every 3rd frame for perf
    if (this.frameCount % 3 === 0) {
      const freq = 0.6 + this.currentTurbulence * 1.5;
      const amp = 0.015 + this.currentTurbulence * 0.06;
      const t = time * this.currentSpeed * 0.15;
      const maxDist = 2.5;

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const i3 = i * 3;
        let px = this.positions[i3];
        let py = this.positions[i3 + 1];
        let pz = this.positions[i3 + 2];

        const [cx, cy, cz] = curlNoise(px * freq, py * freq, pz * freq, t);
        const tx = px + cx * amp;
        const ty = py + cy * amp;
        const tz = pz + cz * amp;

        // pow(d, 5) mixing from FBO-Core
        const dx = px - tx, dy = py - ty, dz = pz - tz;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        const d = Math.min(dist / maxDist, 1);
        const mix = d * d * d * d * d;

        px += (tx - px) * mix;
        py += (ty - py) * mix;
        pz += (tz - pz) * mix;

        // Keep within sphere
        const len = Math.sqrt(px * px + py * py + pz * pz);
        if (len > 2.2) {
          const s = 2.2 / len;
          px *= s; py *= s; pz *= s;
        }

        this.positions[i3] = px;
        this.positions[i3 + 1] = py;
        this.positions[i3 + 2] = pz;
      }
      this.positionAttr.needsUpdate = true;
    }

    // Rotation — multi-axis drift (runs every frame, cheap)
    const slow = time * 0.12;
    this.particles.rotation.y = slow * 1.7;
    this.particles.rotation.x = Math.sin(slow * 0.7) * 0.25;
    this.particles.rotation.z = Math.cos(slow * 0.5) * 0.15;

    // Uniforms
    this.renderMaterial.uniforms.uColor.value = this.currentColor;
    this.renderMaterial.uniforms.uTime.value = time;

    this.renderer.render(this.scene, this.camera);
  }

  setAspect(aspect: number): void {
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
  }

  dispose(): void {
    this.renderMaterial.dispose();
    this.particles.geometry.dispose();
  }
}
