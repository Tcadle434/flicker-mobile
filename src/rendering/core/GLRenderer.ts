import { ExpoWebGLRenderingContext } from 'expo-gl';
import * as THREE from 'three';

export class GLRenderer {
  renderer: THREE.WebGLRenderer;
  private gl: ExpoWebGLRenderingContext;
  private animationFrameId: number | null = null;
  private disposed = false;

  constructor(gl: ExpoWebGLRenderingContext) {
    this.gl = gl;
    this.renderer = new THREE.WebGLRenderer({
      context: gl as any,
      canvas: {
        width: gl.drawingBufferWidth,
        height: gl.drawingBufferHeight,
        style: {},
        addEventListener: () => {},
        removeEventListener: () => {},
        clientHeight: gl.drawingBufferHeight,
      } as any,
      alpha: true,
    });
    this.renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);
    this.renderer.setPixelRatio(1);
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
  }

  startRenderLoop(callback: (time: number) => void): void {
    const startTime = Date.now();

    const loop = () => {
      if (this.disposed) return;
      const elapsed = (Date.now() - startTime) / 1000;
      callback(elapsed);
      this.gl.endFrameEXP();
      this.animationFrameId = requestAnimationFrame(loop);
    };

    this.animationFrameId = requestAnimationFrame(loop);
  }

  dispose(): void {
    this.disposed = true;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.renderer.dispose();
  }

  get width(): number {
    return this.gl.drawingBufferWidth;
  }

  get height(): number {
    return this.gl.drawingBufferHeight;
  }
}
