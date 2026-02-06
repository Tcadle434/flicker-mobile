export const sessionParticleVertShader = `
precision highp float;

attribute float aSize;
attribute float aAlpha;

uniform float uTime;
uniform float uPadY;

varying float vAlpha;

void main() {
  vec3 pos = position;

  // Gentle drift
  pos.x += sin(uTime * 0.3 + pos.y * 2.0) * 0.05;
  pos.y += cos(uTime * 0.2 + pos.x * 2.0) * 0.03;
  pos.z += sin(uTime * 0.25 + pos.z * 1.5) * 0.04;

  vAlpha = aAlpha;

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mvPosition;

  // Size with pad influence (density)
  float densityMul = 1.0 - uPadY * 0.3;
  float size = aSize * densityMul * (200.0 / -mvPosition.z);
  gl_PointSize = max(1.0, size);
}
`;
