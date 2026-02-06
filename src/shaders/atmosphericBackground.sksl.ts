/**
 * SKSL atmospheric background shader for the home screen.
 *
 * Produces flowing monochrome organic forms (smoke/silk) with:
 * - Domain-warped simplex noise (3 octaves)
 * - High contrast B&W with smooth step
 * - Vignette darkening at edges
 * - Subtle mood-colored tinting on lighter values
 * - Slow meditative animation
 *
 * Uniforms:
 *   uTime        – elapsed seconds
 *   uResolution  – canvas size in pixels
 *   uMoodTint    – RGB tint color (0–1 range)
 *   uMoodIntensity – tint strength (0–1)
 */
export const atmosphericBackgroundShader = `
uniform float uTime;
uniform float2 uResolution;
uniform half3 uMoodTint;
uniform half uMoodIntensity;

// --- Simplex 2D noise (adapted from GLSL) ---

float3 mod289_3(float3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
float2 mod289_2(float2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
float3 permute(float3 x) { return mod289_3(((x * 34.0) + 1.0) * x); }

float snoise(float2 v) {
  const float4 C = float4(0.211324865405187, 0.366025403784439,
                           -0.577350269189626, 0.024390243902439);
  float2 i  = floor(v + dot(v, C.yy));
  float2 x0 = v - i + dot(i, C.xx);

  float2 i1 = (x0.x > x0.y) ? float2(1.0, 0.0) : float2(0.0, 1.0);

  float4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;

  i = mod289_2(i);
  float3 p = permute(permute(i.y + float3(0.0, i1.y, 1.0))
                              + i.x + float3(0.0, i1.x, 1.0));

  float3 m = max(0.5 - float3(dot(x0, x0), dot(x12.xy, x12.xy),
                                dot(x12.zw, x12.zw)), 0.0);
  m = m * m;
  m = m * m;

  float3 x_ = 2.0 * fract(p * C.www) - 1.0;
  float3 h = abs(x_) - 0.5;
  float3 ox = floor(x_ + 0.5);
  float3 a0 = x_ - ox;

  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);

  float3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.y = a0.y * x12.x + h.y * x12.y;
  g.z = a0.z * x12.z + h.z * x12.w;

  return 130.0 * dot(m, g);
}

// --- Main shader ---

half4 main(float2 fragCoord) {
  float2 uv = fragCoord / uResolution;

  float t = uTime;

  // Domain warping: offset UV by noise for organic flowing distortion
  float warpX = snoise(uv * 1.2 + float2(t * 0.03, t * 0.02)) * 0.4;
  float warpY = snoise(uv * 1.2 + float2(t * 0.025 + 5.0, t * 0.035 + 3.0)) * 0.4;
  float2 warpedUV = uv + float2(warpX, warpY);

  // Octave 1: large slow forms
  float n1 = snoise(warpedUV * 1.5 + float2(t * 0.04, -t * 0.03));

  // Octave 2: medium detail
  float n2 = snoise(warpedUV * 3.0 + float2(-t * 0.06, t * 0.05) + 7.0);

  // Octave 3: fine texture
  float n3 = snoise(warpedUV * 6.0 + float2(t * 0.08, t * 0.07) + 13.0);

  // Weighted combination
  float val = n1 * 0.55 + n2 * 0.30 + n3 * 0.15;

  // Normalize from [-1,1] to [0,1]
  val = val * 0.5 + 0.5;

  // High contrast: smooth step + power curve
  val = smoothstep(0.25, 0.75, val);
  val = pow(val, 1.3);

  // Vignette: darken edges
  float2 center = uv - 0.5;
  float vignette = 1.0 - dot(center, center) * 1.8;
  vignette = clamp(vignette, 0.0, 1.0);
  vignette = smoothstep(0.0, 1.0, vignette);
  val *= vignette;

  // Center well: darken the middle where the orb sits so it pops
  float centerDist = length(center) * 2.0;
  float orbWell = smoothstep(0.0, 0.8, centerDist);
  val *= mix(0.15, 1.0, orbWell);

  // Overall darkness cap for text readability
  val *= 0.25;

  // Base monochrome
  half3 color = half3(val, val, val);

  // Mood tinting: apply tint to lighter values
  half tintMask = half(smoothstep(0.05, 0.25, val));
  color = mix(color, color * uMoodTint * 3.0, tintMask * uMoodIntensity);

  return half4(color, 1.0);
}
`;
