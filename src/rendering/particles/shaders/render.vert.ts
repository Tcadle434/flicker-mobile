export const renderVertexShader = `
precision highp float;

uniform sampler2D uPositions;
uniform float uPointSize;
uniform float uTime;

attribute vec2 aReference;

varying float vDist;
varying float vLife;

void main() {
  vec4 pos = texture2D(uPositions, aReference);
  vec3 p = pos.xyz;

  vDist = length(p);
  vLife = pos.w;

  vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mvPosition;

  // Size attenuation
  float size = uPointSize * (300.0 / -mvPosition.z);
  gl_PointSize = max(1.0, size);
}
`;
