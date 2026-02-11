import * as THREE from 'three';
import { sessionBackgroundFragShader } from './shaders/sessionBackground.frag';
import { sessionParticleVertShader } from './shaders/sessionParticle.vert';
import { sessionParticleFragShader } from './shaders/sessionParticle.frag';
import type { MoodState } from '../../constants/moodThemes';

const PARTICLE_COUNT = 6000;

// Universal reset palette — calming deep indigo / teal / warm lavender
const RESET_COLORS = {
  orbColor: '#6366F1',   // indigo
  primary: '#5EEAD4',    // teal
  accent: '#A78BFA',     // lavender
  particle: '#7DD3FC',   // soft sky blue
};

export class SessionScene {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;

  private bgScene: THREE.Scene;
  private bgCamera: THREE.OrthographicCamera;
  private bgMaterial: THREE.ShaderMaterial;

  private particleMaterial: THREE.ShaderMaterial;
  private particles: THREE.Points;

  private currentMood: MoodState;
  private brightness = 0;
  private targetBrightness = 0;

  constructor(
    private renderer: THREE.WebGLRenderer,
    mood: MoodState,
    width: number,
    height: number,
  ) {
    this.currentMood = mood;

    // Background fullscreen quad — universal calming colors
    this.bgScene = new THREE.Scene();
    this.bgCamera = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, 0, 1);

    const color1 = new THREE.Color(RESET_COLORS.orbColor).multiplyScalar(0.6);
    const color2 = new THREE.Color(RESET_COLORS.primary).multiplyScalar(0.45);
    const color3 = new THREE.Color(RESET_COLORS.accent).multiplyScalar(0.5);

    this.bgMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: new THREE.Vector2(width, height) },
        uColor1: { value: color1 },
        uColor2: { value: color2 },
        uColor3: { value: color3 },
        uPadX: { value: 0 },
        uPadY: { value: 0 },
      },
      vertexShader: `
        void main() {
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: sessionBackgroundFragShader,
    });

    const bgMesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), this.bgMaterial);
    this.bgScene.add(bgMesh);

    // Floating particles
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100);
    this.camera.position.z = 5;

    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const sizes = new Float32Array(PARTICLE_COUNT);
    const alphas = new Float32Array(PARTICLE_COUNT);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 8;
      sizes[i] = Math.random() * 3 + 1;
      alphas[i] = Math.random() * 0.6 + 0.2;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('aAlpha', new THREE.BufferAttribute(alphas, 1));

    this.particleMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: new THREE.Color(RESET_COLORS.particle) },
        uTime: { value: 0 },
        uPadY: { value: 0 },
      },
      vertexShader: sessionParticleVertShader,
      fragmentShader: sessionParticleFragShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    this.particles = new THREE.Points(geometry, this.particleMaterial);
    this.scene.add(this.particles);
  }

  /** No-op — session uses universal reset colors regardless of mood */
  setMood(_mood: MoodState): void {
    // Intentionally empty: reset session is mood-independent
  }

  setPadPosition(x: number, y: number): void {
    this.bgMaterial.uniforms.uPadX.value = x;
    this.bgMaterial.uniforms.uPadY.value = y;
    this.particleMaterial.uniforms.uPadY.value = y;
  }

  setBrightness(value: number): void {
    this.targetBrightness = value;
  }

  update(time: number): void {
    // Lerp brightness
    this.brightness += (this.targetBrightness - this.brightness) * 0.05;

    // Update uniforms
    this.bgMaterial.uniforms.uTime.value = time;
    this.particleMaterial.uniforms.uTime.value = time;

    // Render background
    this.renderer.setRenderTarget(null);
    this.renderer.render(this.bgScene, this.bgCamera);

    // Render particles on top
    this.renderer.autoClear = false;
    this.renderer.render(this.scene, this.camera);
    this.renderer.autoClear = true;
  }

  dispose(): void {
    this.bgMaterial.dispose();
    this.particleMaterial.dispose();
    this.particles.geometry.dispose();
  }
}
