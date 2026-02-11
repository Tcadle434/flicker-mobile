export const sessionParticleFragShader = `
precision highp float;

uniform vec3 uColor;
uniform float uTime;

varying float vAlpha;

void main() {
  vec2 center = gl_PointCoord - vec2(0.5);
  float d = length(center);
  if (d > 0.5) discard;

  float alpha = smoothstep(0.5, 0.1, d) * vAlpha;

  // Breathing pulse — boosted range
  float breath = sin(uTime * 0.7) * 0.15 + 0.95;

  // Slight warm/cool color variation across particles for shimmer
  float tint = gl_PointCoord.x - 0.5;
  vec3 color = uColor * breath + vec3(tint * 0.08, -tint * 0.04, tint * 0.06);

  gl_FragColor = vec4(color, alpha);
}
`;
