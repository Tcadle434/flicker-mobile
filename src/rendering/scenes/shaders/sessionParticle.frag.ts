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

  // Breathing pulse
  float breath = sin(uTime * 0.7) * 0.1 + 0.9;
  vec3 color = uColor * breath;

  gl_FragColor = vec4(color, alpha * 0.5);
}
`;
