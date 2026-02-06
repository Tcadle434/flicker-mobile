export const renderFragmentShader = `
precision highp float;

uniform vec3 uColor;
uniform float uTime;

varying float vDist;

void main() {
  // Soft circle
  vec2 center = gl_PointCoord - vec2(0.5);
  float d = length(center);
  if (d > 0.5) discard;

  // Smooth edge
  float alpha = smoothstep(0.5, 0.15, d);

  // Dim particles further from orb center for depth
  float depthFade = 1.0 - smoothstep(0.3, 2.0, vDist);
  depthFade = depthFade * 0.7 + 0.3;

  // Core brightness at center of each point
  float core = smoothstep(0.4, 0.0, d) * 0.25;

  vec3 color = uColor * depthFade + vec3(1.0) * core;

  // Keep alpha low so additive blending creates a glow, not a white blob
  gl_FragColor = vec4(color, alpha * 0.15);
}
`;
